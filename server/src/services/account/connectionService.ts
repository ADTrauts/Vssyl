import { authorize, PolicyDeniedError } from '../../auth/policyEngine';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { logger } from '../../lib/logger';
import { recordConnectionEvent } from './identityActivityService';

export class ConnectionServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ConnectionServiceError';
  }
}

async function assertConnectionPolicy(params: {
  userId: string;
  action: typeof POLICY_ACTIONS.CONNECTION_REQUEST | typeof POLICY_ACTIONS.CONNECTION_UPDATE | typeof POLICY_ACTIONS.CONNECTION_REMOVE;
  resourceType: 'user' | 'relationship';
  resourceId: string;
}): Promise<void> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    scope: { userId: params.userId },
  });
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
}

export async function sendConnectionRequest(params: {
  senderId: string;
  receiverId: string;
  message?: string;
}) {
  const { senderId, receiverId, message } = params;
  if (senderId === receiverId) {
    throw new ConnectionServiceError('Cannot send connection request to yourself', 400);
  }

  await assertConnectionPolicy({
    userId: senderId,
    action: POLICY_ACTIONS.CONNECTION_REQUEST,
    resourceType: 'user',
    resourceId: receiverId,
  });

  const existingRelationship = await prisma.relationship.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (existingRelationship) {
    throw new ConnectionServiceError('Connection request already exists', 400);
  }

  const currentUserOrgs = await prisma.businessMember.findMany({
    where: { userId: senderId },
    select: { businessId: true },
  });
  const receiverOrgs = await prisma.businessMember.findMany({
    where: { userId: receiverId },
    select: { businessId: true },
  });
  const sharedOrg = currentUserOrgs.find((org) =>
    receiverOrgs.some((receiverOrg) => receiverOrg.businessId === org.businessId)
  );

  const relationship = await prisma.relationship.create({
    data: {
      senderId,
      receiverId,
      message,
      type: sharedOrg ? 'COLLEAGUE' : 'REGULAR',
      organizationId: sharedOrg?.businessId ?? null,
    },
    include: {
      sender: { select: { name: true, email: true, userNumber: true } },
      receiver: { select: { name: true, email: true } },
    },
  });

  await recordConnectionEvent(senderId, relationship.id, 'requested');

  try {
    await NotificationService.handleNotification({
      type: 'member_request',
      title: 'New Connection Request',
      body: `${relationship.sender.name} wants to connect with you`,
      data: {
        relationshipId: relationship.id,
        senderId,
        senderName: relationship.sender.name,
        senderBlockId: relationship.sender.userNumber,
        message: message ?? null,
        type: relationship.type,
        organizationId: sharedOrg?.businessId ?? null,
      },
      recipients: [receiverId],
      senderId,
    });
  } catch (notificationError: unknown) {
    await logger.error('Failed to create connection request notification', {
      operation: 'connection_create_notification',
      error: {
        message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
        stack: notificationError instanceof Error ? notificationError.stack : undefined,
      },
    });
  }

  return relationship;
}

export async function updateConnectionRequest(params: {
  userId: string;
  relationshipId: string;
  action: 'accept' | 'decline' | 'block';
}) {
  await assertConnectionPolicy({
    userId: params.userId,
    action: POLICY_ACTIONS.CONNECTION_UPDATE,
    resourceType: 'relationship',
    resourceId: params.relationshipId,
  });

  let status: 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  switch (params.action) {
    case 'accept':
      status = 'ACCEPTED';
      break;
    case 'decline':
      status = 'DECLINED';
      break;
    case 'block':
      status = 'BLOCKED';
      break;
    default:
      throw new ConnectionServiceError('Invalid action', 400);
  }

  const updatedRelationship = await prisma.relationship.update({
    where: { id: params.relationshipId },
    data: { status },
    include: {
      sender: { select: { name: true, email: true } },
      receiver: { select: { name: true, email: true } },
    },
  });

  const activityAction =
    params.action === 'accept' ? 'accepted' : params.action === 'decline' ? 'declined' : 'blocked';
  await recordConnectionEvent(params.userId, params.relationshipId, activityAction);

  return updatedRelationship;
}

export async function removeConnection(userId: string, relationshipId: string) {
  await assertConnectionPolicy({
    userId,
    action: POLICY_ACTIONS.CONNECTION_REMOVE,
    resourceType: 'relationship',
    resourceId: relationshipId,
  });

  const relationship = await prisma.relationship.findUnique({
    where: { id: relationshipId },
  });
  if (!relationship) {
    throw new ConnectionServiceError('Relationship not found', 404);
  }

  await prisma.relationship.delete({ where: { id: relationshipId } });
  await recordConnectionEvent(userId, relationshipId, 'removed');
}

export async function bulkRemoveConnections(userId: string, relationshipIds: string[]) {
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const relationshipId of relationshipIds) {
    try {
      const relationship = await prisma.relationship.findFirst({
        where: {
          id: relationshipId,
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'ACCEPTED',
        },
      });
      if (!relationship) {
        results.push({ id: relationshipId, success: false, error: 'Connection not found' });
        continue;
      }
      await removeConnection(userId, relationshipId);
      results.push({ id: relationshipId, success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal error';
      results.push({ id: relationshipId, success: false, error: message });
    }
  }

  return results;
}

export async function bulkUpdateConnectionRequests(
  userId: string,
  requestIds: string[],
  action: 'accept' | 'decline' | 'block'
) {
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const requestId of requestIds) {
    try {
      await updateConnectionRequest({ userId, relationshipId: requestId, action });
      results.push({ id: requestId, success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal error';
      results.push({ id: requestId, success: false, error: message });
    }
  }

  return results;
}
