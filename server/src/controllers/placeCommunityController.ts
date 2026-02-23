import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

// ============================================================================
// COMMUNITY CRUD
// ============================================================================

/**
 * POST /api/place/communities
 * Create a user-created community
 */
export async function createCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { name, description, tags, isPublic } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const community = await prisma.placeCommunity.create({
      data: {
        name: name.trim(),
        description: description || null,
        type: 'USER_CREATED',
        creatorId: userId,
        tags: Array.isArray(tags) ? tags : [],
        isPublic: isPublic ?? true,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: community });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating community:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create community' });
  }
}

/**
 * GET /api/place/communities
 * List communities the user belongs to + public ones to discover
 */
export async function getCommunities(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { filter } = req.query; // 'mine' | 'discover' | undefined (all)

    let communities;
    if (filter === 'mine') {
      communities = await prisma.placeCommunity.findMany({
        where: { members: { some: { userId } } },
        include: {
          _count: { select: { members: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (filter === 'discover') {
      communities = await prisma.placeCommunity.findMany({
        where: {
          isPublic: true,
          members: { none: { userId } },
        },
        include: {
          _count: { select: { members: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } else {
      communities = await prisma.placeCommunity.findMany({
        where: {
          OR: [
            { members: { some: { userId } } },
            { isPublic: true },
          ],
        },
        include: {
          _count: { select: { members: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json({ success: true, data: communities });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching communities:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch communities' });
  }
}

/**
 * GET /api/place/communities/:communityId
 * Get community detail
 */
export async function getCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { communityId } = req.params;

    const community = await prisma.placeCommunity.findUnique({
      where: { id: communityId },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        creator: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    if (!community) {
      res.status(404).json({ success: false, error: 'Community not found' });
      return;
    }

    // Private communities only visible to members
    if (!community.isPublic) {
      const isMember = community.members.some(m => m.userId === userId);
      if (!isMember) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    res.json({ success: true, data: community });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching community:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch community' });
  }
}

/**
 * POST /api/place/communities/:communityId/join
 * Join a public community
 */
export async function joinCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { communityId } = req.params;

    const community = await prisma.placeCommunity.findUnique({ where: { id: communityId } });
    if (!community) {
      res.status(404).json({ success: false, error: 'Community not found' });
      return;
    }
    if (!community.isPublic) {
      res.status(403).json({ success: false, error: 'Cannot join private community without invite' });
      return;
    }

    const existing = await prisma.placeCommunityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      res.status(400).json({ success: false, error: 'Already a member' });
      return;
    }

    await prisma.placeCommunityMember.create({
      data: { communityId, userId },
    });

    res.json({ success: true, message: 'Joined community' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error joining community:', err.message);
    res.status(500).json({ success: false, error: 'Failed to join community' });
  }
}

/**
 * DELETE /api/place/communities/:communityId/leave
 * Leave a community
 */
export async function leaveCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { communityId } = req.params;

    const membership = await prisma.placeCommunityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!membership) {
      res.status(404).json({ success: false, error: 'Not a member' });
      return;
    }

    await prisma.placeCommunityMember.delete({
      where: { id: membership.id },
    });

    res.json({ success: true, message: 'Left community' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error leaving community:', err.message);
    res.status(500).json({ success: false, error: 'Failed to leave community' });
  }
}

// ============================================================================
// AUTO-CLUSTERING
// ============================================================================

/**
 * POST /api/place/communities/auto-cluster
 * Generate auto-clusters from shared follows and interests (system endpoint)
 */
export async function generateAutoClusters(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    // Find businesses that multiple users follow — cluster users who share 3+ follows
    const userNodes = await prisma.placeNode.findMany({
      where: { nodeType: 'BUSINESS' },
      select: { entityId: true, place: { select: { userId: true } } },
    });

    // Build a map: businessId -> list of userIds
    const businessFollowers: Record<string, string[]> = {};
    for (const node of userNodes) {
      if (!businessFollowers[node.entityId]) businessFollowers[node.entityId] = [];
      businessFollowers[node.entityId].push(node.place.userId);
    }

    // Find pairs of users with shared follows >= 3
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

    // Create clusters for pairs with 3+ shared businesses
    let clustersCreated = 0;
    for (const [pairKey, sharedBizIds] of Object.entries(userPairs)) {
      if (sharedBizIds.size >= 3) {
        const [userA, userB] = pairKey.split(':');

        // Check if an auto-cluster already exists for these users
        const existingCluster = await prisma.placeCommunity.findFirst({
          where: {
            type: 'AUTO_CLUSTER',
            members: { every: { userId: { in: [userA, userB] } } },
          },
        });

        if (!existingCluster) {
          // Get shared business names for cluster naming
          const businesses = await prisma.business.findMany({
            where: { id: { in: [...sharedBizIds].slice(0, 3) } },
            select: { name: true },
          });
          const clusterName = `Fans of ${businesses.map(b => b.name).join(', ')}`;

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

    res.json({ success: true, data: { clustersCreated } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error generating clusters:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate clusters' });
  }
}
