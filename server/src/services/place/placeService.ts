import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { PlaceServiceError } from './placeErrors';
import { PLACE_GRAPH_INCLUDE } from './placeIncludes';
import {
  assertCanCompleteSetup,
  assertCanCreateNode,
  assertCanDeleteNode,
  assertCanReadFollowVisibility,
  assertCanUpdateFollowVisibility,
  assertCanUpdateInterests,
  assertCanUpdateNode,
  assertCanUpdatePlaceSettings,
  assertCanWritePlace,
} from './placePermissionService';
import { assertPlacePolicyAllowed } from './placePolicyDual';
import * as placeActivity from './placeActivityService';
import * as placeDomain from './placeDomainEventService';
import * as placeRealtime from './placeRealtimeService';
import type {
  AddPlaceNodeInput,
  FollowVisibilityRecord,
  PlaceGraphSnapshot,
  RemovePlaceNodeInput,
  SetPlaceInterestsInput,
  UpdateFollowVisibilityInput,
  UpdatePlaceNodeInput,
  UpdatePlaceSettingsInput,
} from './placeTypes';

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return true;
  }
  return error instanceof Error && error.message.includes('Unique constraint');
}

/**
 * Lazy get-or-create the user's Place graph.
 * Interim: BusinessFollow sync on BUSINESS nodes remains in this service (Phase 1B).
 */
export async function getOrCreatePlace(userId: string): Promise<PlaceGraphSnapshot> {
  const existing = await prisma.place.findUnique({
    where: { userId },
    include: PLACE_GRAPH_INCLUDE,
  });

  if (existing) {
    await assertPlacePolicyAllowed({
      userId,
      action: POLICY_ACTIONS.PLACE_READ,
      resourceType: 'place',
      resourceId: existing.id,
    });
    return existing;
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_WRITE,
    resourceType: 'place',
    resourceId: userId,
  });

  return prisma.place.create({
    data: {
      userId,
      settings: { create: {} },
    },
    include: PLACE_GRAPH_INCLUDE,
  });
}

export async function updatePlaceSettings(input: UpdatePlaceSettingsInput) {
  const place = await assertCanUpdatePlaceSettings(input.userId);

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_SETTINGS_UPDATE,
    resourceType: 'place',
    resourceId: place.id,
  });

  const {
    neighborhoodVisibility,
    defaultFollowVisibility,
    layoutMode,
    showLabels,
    highContrastMode,
    showLocalSuggestions,
    suggestionRadius,
  } = input;

  return prisma.placeSettings.upsert({
    where: { placeId: place.id },
    update: {
      ...(neighborhoodVisibility !== undefined && { neighborhoodVisibility }),
      ...(defaultFollowVisibility !== undefined && { defaultFollowVisibility }),
      ...(layoutMode !== undefined && { layoutMode }),
      ...(showLabels !== undefined && { showLabels }),
      ...(highContrastMode !== undefined && { highContrastMode }),
      ...(showLocalSuggestions !== undefined && { showLocalSuggestions }),
      ...(suggestionRadius !== undefined && { suggestionRadius }),
    },
    create: {
      placeId: place.id,
      neighborhoodVisibility: neighborhoodVisibility || 'PRIVATE',
      defaultFollowVisibility: defaultFollowVisibility ?? false,
      layoutMode: layoutMode || 'FORCE',
      showLabels: showLabels ?? true,
      highContrastMode: highContrastMode ?? false,
      showLocalSuggestions: showLocalSuggestions ?? true,
      suggestionRadius: suggestionRadius ?? 50,
    },
  });
}

export async function completeSetup(userId: string): Promise<PlaceGraphSnapshot> {
  const ownedPlace = await assertCanCompleteSetup(userId);

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_SETUP_COMPLETE,
    resourceType: 'place',
    resourceId: ownedPlace.id,
  });

  const place = await prisma.place.update({
    where: { userId },
    data: { isSetupComplete: true },
    include: PLACE_GRAPH_INCLUDE,
  });

  await placeActivity.recordSetupCompleted({
    actorUserId: userId,
    placeId: place.id,
  });
  placeDomain.recordSetupCompletedDomainEvent({
    actorUserId: userId,
    placeId: place.id,
  });

  return place;
}

export async function addNode(input: AddPlaceNodeInput) {
  const place = await assertCanCreateNode(input.userId);

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_NODE_CREATE,
    resourceType: 'place_node',
    resourceId: place.id,
    metadata: { entityId: input.entityId, nodeType: input.nodeType },
  });

  try {
    const node = await prisma.$transaction(async (tx) => {
      const created = await tx.placeNode.create({
        data: {
          placeId: place.id,
          nodeType: input.nodeType,
          entityId: input.entityId,
          positionX: input.positionX ?? null,
          positionY: input.positionY ?? null,
          label: input.label ?? null,
          color: input.color ?? null,
        },
      });

      if (input.nodeType === 'BUSINESS') {
        await tx.businessFollow.upsert({
          where: { userId_businessId: { userId: input.userId, businessId: input.entityId } },
          update: {},
          create: { userId: input.userId, businessId: input.entityId },
        });
      }

      return created;
    });

    placeRealtime.broadcastPlaceNodeAdded(input.userId, {
      nodeId: node.id,
      nodeType: input.nodeType,
      entityId: input.entityId,
    });

    await placeActivity.recordNodeAdded({
      actorUserId: input.userId,
      nodeId: node.id,
      nodeType: input.nodeType,
      entityId: input.entityId,
    });
    placeDomain.recordNodeAddedDomainEvent({
      actorUserId: input.userId,
      nodeId: node.id,
      nodeType: input.nodeType,
      entityId: input.entityId,
    });

    return node;
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new PlaceServiceError(
        'This node already exists in your place',
        'conflict',
        409
      );
    }
    throw error;
  }
}

export async function updateNode(input: UpdatePlaceNodeInput) {
  await assertCanUpdateNode(input.nodeId, input.userId);

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_NODE_UPDATE,
    resourceType: 'place_node',
    resourceId: input.nodeId,
  });

  return prisma.placeNode.update({
    where: { id: input.nodeId },
    data: {
      ...(input.positionX !== undefined && { positionX: input.positionX }),
      ...(input.positionY !== undefined && { positionY: input.positionY }),
      ...(input.label !== undefined && { label: input.label }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.pinned !== undefined && { pinned: input.pinned }),
    },
  });
}

export async function removeNode(input: RemovePlaceNodeInput) {
  const node = await assertCanDeleteNode(input.nodeId, input.userId);

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_NODE_DELETE,
    resourceType: 'place_node',
    resourceId: input.nodeId,
  });

  await prisma.$transaction(async (tx) => {
    if (node.nodeType === 'BUSINESS') {
      await tx.businessFollow.deleteMany({
        where: { userId: input.userId, businessId: node.entityId },
      });
    }

    await tx.placeNode.delete({ where: { id: input.nodeId } });
  });

  placeRealtime.broadcastPlaceNodeRemoved(input.userId, {
    nodeId: input.nodeId,
    nodeType: node.nodeType,
    entityId: node.entityId,
  });

  await placeActivity.recordNodeRemoved({
    actorUserId: input.userId,
    nodeId: input.nodeId,
    nodeType: node.nodeType,
    entityId: node.entityId,
  });
  placeDomain.recordNodeRemovedDomainEvent({
    actorUserId: input.userId,
    nodeId: input.nodeId,
    nodeType: node.nodeType,
    entityId: node.entityId,
  });
}

export async function setInterests(input: SetPlaceInterestsInput) {
  const place = await assertCanUpdateInterests(input.userId);

  if (!Array.isArray(input.categories)) {
    throw new PlaceServiceError('categories must be an array of strings', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_INTERESTS_UPDATE,
    resourceType: 'place',
    resourceId: place.id,
  });

  await prisma.placeInterest.deleteMany({ where: { placeId: place.id } });

  const interests = await Promise.all(
    input.categories.map((category: string) =>
      prisma.placeInterest.create({
        data: { placeId: place.id, category },
      })
    )
  );

  await placeActivity.recordInterestsUpdated({
    actorUserId: input.userId,
    placeId: place.id,
    categories: input.categories,
  });

  return interests;
}

export async function getFollowVisibility(
  userId: string,
  businessId: string
): Promise<FollowVisibilityRecord> {
  await assertCanReadFollowVisibility(userId);

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: userId,
  });

  const visibility = await prisma.placeFollowVisibility.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });

  return visibility || { userId, businessId, isVisible: false };
}

export async function updateFollowVisibility(input: UpdateFollowVisibilityInput) {
  await assertCanUpdateFollowVisibility(input.userId);

  if (typeof input.isVisible !== 'boolean') {
    throw new PlaceServiceError('isVisible must be a boolean', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId: input.userId,
    action: POLICY_ACTIONS.PLACE_FOLLOW_VISIBILITY_UPDATE,
    resourceType: 'place',
    resourceId: input.userId,
    metadata: { businessId: input.businessId },
  });

  return prisma.placeFollowVisibility.upsert({
    where: { userId_businessId: { userId: input.userId, businessId: input.businessId } },
    update: { isVisible: input.isVisible },
    create: { userId: input.userId, businessId: input.businessId, isVisible: input.isVisible },
  });
}

/**
 * Idempotent discovery dismiss — user-scoped preference (Wave 1G).
 * No activity, notifications, or realtime.
 */
export async function dismissSuggestion(params: {
  userId: string;
  businessId: string;
  reason?: string | null;
}) {
  const { userId, businessId } = params;
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  if (!businessId) {
    throw new PlaceServiceError('businessId is required', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_DISCOVERY_READ,
    resourceType: 'place',
    resourceId: userId,
  });

  await prisma.placeDismissedSuggestion.upsert({
    where: { userId_businessId: { userId, businessId } },
    update: { reason: params.reason || 'dismissed' },
    create: { userId, businessId, reason: params.reason || 'dismissed' },
  });

  return { dismissed: true as const };
}
