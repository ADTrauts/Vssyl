import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { PlaceServiceError } from './placeErrors';
import { assertPlacePolicyAllowed } from './placePolicyDual';

/**
 * Place-owned community CRUD (Wave 1G).
 *
 * Deferred gaps (documented — do not overbuild):
 * - Domain events / module activity not emitted (immature product lifecycle)
 * - Notifications for invites/membership not implemented
 * - Global Trash / V_Link / platform entities deferred to Phase 2A
 * - Full `place:community.*` Policy Engine actions pending taxonomy extension
 *
 * Future: richer invite flows may remain here or move to a social layer; not Member domain.
 */

function requireUserId(userId: string | null | undefined): string {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  return userId;
}

async function assertCommunityRead(userId: string): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_READ,
    resourceType: 'place',
    resourceId: userId,
  });
}

async function assertCommunityWrite(userId: string): Promise<void> {
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_WRITE,
    resourceType: 'place',
    resourceId: userId,
  });
}

const communityListInclude = {
  _count: { select: { members: true } },
  creator: { select: { id: true, name: true } },
} as const;

const communityDetailInclude = {
  members: { include: { user: { select: { id: true, name: true, image: true } } } },
  creator: { select: { id: true, name: true } },
  _count: { select: { members: true } },
} as const;

export async function createCommunity(params: {
  userId: string;
  name: string;
  description?: string | null;
  tags?: string[];
  isPublic?: boolean;
}) {
  const uid = requireUserId(params.userId);
  await assertCommunityWrite(uid);

  const name = params.name.trim();
  if (!name) {
    throw new PlaceServiceError('name is required', 'invalid', 400);
  }

  return prisma.placeCommunity.create({
    data: {
      name,
      description: params.description || null,
      type: 'USER_CREATED',
      creatorId: uid,
      tags: Array.isArray(params.tags) ? params.tags : [],
      isPublic: params.isPublic ?? true,
      members: {
        create: { userId: uid, role: 'ADMIN' },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function listCommunities(userId: string, filter?: string | null) {
  const uid = requireUserId(userId);
  await assertCommunityRead(uid);

  if (filter === 'mine') {
    return prisma.placeCommunity.findMany({
      where: { members: { some: { userId: uid } } },
      include: communityListInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  if (filter === 'discover') {
    return prisma.placeCommunity.findMany({
      where: {
        isPublic: true,
        members: { none: { userId: uid } },
      },
      include: communityListInclude,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  return prisma.placeCommunity.findMany({
    where: {
      OR: [{ members: { some: { userId: uid } } }, { isPublic: true }],
    },
    include: communityListInclude,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getCommunity(userId: string, communityId: string) {
  const uid = requireUserId(userId);
  await assertCommunityRead(uid);

  const community = await prisma.placeCommunity.findUnique({
    where: { id: communityId },
    include: communityDetailInclude,
  });

  if (!community) {
    throw new PlaceServiceError('Community not found', 'not_found', 404);
  }

  if (!community.isPublic) {
    const isMember = community.members.some((m) => m.userId === uid);
    if (!isMember) {
      throw new PlaceServiceError('Access denied', 'forbidden', 403);
    }
  }

  return community;
}

export async function joinCommunity(userId: string, communityId: string) {
  const uid = requireUserId(userId);
  await assertCommunityWrite(uid);

  const community = await prisma.placeCommunity.findUnique({ where: { id: communityId } });
  if (!community) {
    throw new PlaceServiceError('Community not found', 'not_found', 404);
  }
  if (!community.isPublic) {
    throw new PlaceServiceError(
      'Cannot join private community without invite',
      'forbidden',
      403
    );
  }

  const existing = await prisma.placeCommunityMember.findUnique({
    where: { communityId_userId: { communityId, userId: uid } },
  });
  if (existing) {
    throw new PlaceServiceError('Already a member', 'conflict', 409);
  }

  await prisma.placeCommunityMember.create({
    data: { communityId, userId: uid },
  });

  return { joined: true as const };
}

export async function leaveCommunity(userId: string, communityId: string) {
  const uid = requireUserId(userId);
  await assertCommunityWrite(uid);

  const membership = await prisma.placeCommunityMember.findUnique({
    where: { communityId_userId: { communityId, userId: uid } },
  });
  if (!membership) {
    throw new PlaceServiceError('Not a member', 'not_found', 404);
  }

  await prisma.placeCommunityMember.delete({
    where: { id: membership.id },
  });

  return { left: true as const };
}

export async function generateAutoClusters(userId: string) {
  const uid = requireUserId(userId);
  await assertCommunityWrite(uid);

  const userNodes = await prisma.placeNode.findMany({
    where: { nodeType: 'BUSINESS' },
    select: { entityId: true, place: { select: { userId: true } } },
  });

  const businessFollowers: Record<string, string[]> = {};
  for (const node of userNodes) {
    if (!businessFollowers[node.entityId]) businessFollowers[node.entityId] = [];
    businessFollowers[node.entityId].push(node.place.userId);
  }

  const userPairs: Record<string, Set<string>> = {};
  const businessIds = Object.keys(businessFollowers);

  for (const bizId of businessIds) {
    const followers = businessFollowers[bizId];
    for (let i = 0; i < followers.length; i++) {
      for (let j = i + 1; j < followers.length; j++) {
        const key = [followers[i], followers[j]].sort().join(':');
        if (!userPairs[key]) userPairs[key] = new Set();
        userPairs[key].add(bizId);
      }
    }
  }

  let clustersCreated = 0;
  for (const [pairKey, sharedBizIds] of Object.entries(userPairs)) {
    if (sharedBizIds.size >= 3) {
      const [userA, userB] = pairKey.split(':');

      const existingCluster = await prisma.placeCommunity.findFirst({
        where: {
          type: 'AUTO_CLUSTER',
          members: { every: { userId: { in: [userA, userB] } } },
        },
      });

      if (!existingCluster) {
        const businesses = await prisma.business.findMany({
          where: { id: { in: [...sharedBizIds].slice(0, 3) } },
          select: { name: true },
        });
        const clusterName = `Fans of ${businesses.map((b) => b.name).join(', ')}`;

        await prisma.placeCommunity.create({
          data: {
            name: clusterName,
            description: `Auto-discovered group sharing ${sharedBizIds.size} common places`,
            type: 'AUTO_CLUSTER',
            tags: [...sharedBizIds].slice(0, 5),
            members: {
              createMany: {
                data: [{ userId: userA }, { userId: userB }],
              },
            },
          },
        });
        clustersCreated++;
      }
    }
  }

  return { clustersCreated };
}
