import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { PlaceServiceError } from './placeErrors';
import { assertPlacePolicyAllowed } from './placePolicyDual';
import * as placeActivity from './placeActivityService';
import * as placeDomain from './placeDomainEventService';
import * as placeNotification from './placeNotificationService';
import * as placeRealtime from './placeRealtimeService';

/**
 * Interim Place-owned connection writes (Wave 1E–1G).
 *
 * Boundary closeout:
 * - **Interim Place-owned:** sendConnectionRequest, acceptConnection (Relationship CRUD + PlaceNode mirror)
 * - **Future Member domain:** Relationship lifecycle should delegate to Member/Relationship service when
 *   cross-module connection APIs stabilize; Place retains PlaceNode mirror side effects only
 * - **Not implemented here:** reject, remove, block — no HTTP routes today
 * - **Notifications:** self-suppressed when actor === recipient (see placeNotificationService)
 * - **Realtime:** connection request/accept + mirrored node add events
 */

export async function sendConnectionRequest(params: {
  userId: string;
  targetUserId: string;
  message?: string | null;
}) {
  const { userId, targetUserId } = params;

  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  if (targetUserId === userId) {
    throw new PlaceServiceError('Cannot connect with yourself', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_CONNECTION_REQUEST,
    resourceType: 'place_connection',
    resourceId: targetUserId,
  });

  const existing = await prisma.relationship.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
  });

  if (existing) {
    return { relationship: existing, created: false as const };
  }

  const relationship = await prisma.relationship.create({
    data: {
      senderId: userId,
      receiverId: targetUserId,
      status: 'PENDING',
      type: 'REGULAR',
      message: params.message || null,
    },
  });

  await placeActivity.recordConnectionRequested({
    actorUserId: userId,
    relationshipId: relationship.id,
    targetUserId,
  });
  placeDomain.recordConnectionRequestedDomainEvent({
    actorUserId: userId,
    relationshipId: relationship.id,
    targetUserId,
  });

  placeRealtime.broadcastConnectionRequest(targetUserId, {
    relationshipId: relationship.id,
    fromUserId: userId,
  });
  await placeNotification.notifyConnectionRequest({
    actorUserId: userId,
    targetUserId,
    relationshipId: relationship.id,
  });

  return { relationship, created: true as const };
}

export async function acceptConnection(params: {
  userId: string;
  relationshipId: string;
}) {
  const { userId, relationshipId } = params;

  const relationship = await prisma.relationship.findUnique({ where: { id: relationshipId } });
  if (!relationship || relationship.receiverId !== userId) {
    throw new PlaceServiceError('Connection request not found', 'not_found', 404);
  }

  if (relationship.status !== 'PENDING') {
    throw new PlaceServiceError(
      `Connection is already ${relationship.status.toLowerCase()}`,
      'invalid',
      400
    );
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_CONNECTION_ACCEPT,
    resourceType: 'place_connection',
    resourceId: relationshipId,
  });

  const updated = await prisma.relationship.update({
    where: { id: relationshipId },
    data: { status: 'ACCEPTED' },
  });

  const [senderPlace, receiverPlace] = await Promise.all([
    prisma.place.findUnique({ where: { userId: relationship.senderId } }),
    prisma.place.findUnique({ where: { userId: relationship.receiverId } }),
  ]);

  const [senderUser, receiverUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: relationship.senderId },
      select: { name: true },
    }),
    prisma.user.findUnique({
      where: { id: relationship.receiverId },
      select: { name: true },
    }),
  ]);

  const mirroredNodes: Array<{ userId: string; nodeId: string; entityId: string }> = [];

  if (senderPlace) {
    const node = await prisma.placeNode.upsert({
      where: {
        placeId_nodeType_entityId: {
          placeId: senderPlace.id,
          nodeType: 'USER',
          entityId: relationship.receiverId,
        },
      },
      update: {},
      create: {
        placeId: senderPlace.id,
        nodeType: 'USER',
        entityId: relationship.receiverId,
        label: receiverUser?.name || null,
      },
    });
    mirroredNodes.push({
      userId: relationship.senderId,
      nodeId: node.id,
      entityId: relationship.receiverId,
    });
  }

  if (receiverPlace) {
    const node = await prisma.placeNode.upsert({
      where: {
        placeId_nodeType_entityId: {
          placeId: receiverPlace.id,
          nodeType: 'USER',
          entityId: relationship.senderId,
        },
      },
      update: {},
      create: {
        placeId: receiverPlace.id,
        nodeType: 'USER',
        entityId: relationship.senderId,
        label: senderUser?.name || null,
      },
    });
    mirroredNodes.push({
      userId: relationship.receiverId,
      nodeId: node.id,
      entityId: relationship.senderId,
    });
  }

  await placeActivity.recordConnectionAccepted({
    actorUserId: userId,
    relationshipId,
    withUserId: relationship.senderId,
  });
  placeDomain.recordConnectionAcceptedDomainEvent({
    actorUserId: userId,
    relationshipId,
    withUserId: relationship.senderId,
  });

  for (const mirrored of mirroredNodes) {
    await placeActivity.recordNodeAdded({
      actorUserId: mirrored.userId,
      nodeId: mirrored.nodeId,
      nodeType: 'USER',
      entityId: mirrored.entityId,
    });
    placeDomain.recordNodeAddedDomainEvent({
      actorUserId: mirrored.userId,
      nodeId: mirrored.nodeId,
      nodeType: 'USER',
      entityId: mirrored.entityId,
    });
    placeRealtime.broadcastPlaceNodeAdded(mirrored.userId, {
      nodeId: mirrored.nodeId,
      nodeType: 'USER',
      entityId: mirrored.entityId,
    });
  }

  placeRealtime.broadcastConnectionAccepted(relationship.senderId, {
    relationshipId,
    withUserId: relationship.receiverId,
  });
  placeRealtime.broadcastConnectionAccepted(relationship.receiverId, {
    relationshipId,
    withUserId: relationship.senderId,
  });

  await placeNotification.notifyConnectionAccepted({
    actorUserId: userId,
    requesterId: relationship.senderId,
    relationshipId,
  });

  return updated;
}
