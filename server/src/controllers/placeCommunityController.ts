import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeCommunityService from '../services/place/placeCommunityService';

function logPlaceCommunityError(desc: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(desc, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function getUserId(req: Request): string | null {
  const user = getUserFromRequest(req);
  return user?.id ?? null;
}

/* <place-community-handlers> */

export async function createCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { name, description, tags, isPublic } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const community = await placeCommunityService.createCommunity({
      userId,
      name,
      description,
      tags,
      isPublic,
    });

    res.status(201).json({ success: true, data: community });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error creating community', 'place_community_create', error);
    res.status(500).json({ success: false, error: 'Failed to create community' });
  }
}

export async function getCommunities(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const filter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
    const communities = await placeCommunityService.listCommunities(userId, filter);

    res.json({ success: true, data: communities });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error fetching communities', 'place_community_list', error);
    res.status(500).json({ success: false, error: 'Failed to fetch communities' });
  }
}

export async function getCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { communityId } = req.params;
    const community = await placeCommunityService.getCommunity(userId, communityId);

    res.json({ success: true, data: community });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error fetching community', 'place_community_get', error);
    res.status(500).json({ success: false, error: 'Failed to fetch community' });
  }
}

export async function joinCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { communityId } = req.params;
    await placeCommunityService.joinCommunity(userId, communityId);

    res.json({ success: true, message: 'Joined community' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error joining community', 'place_community_join', error);
    res.status(500).json({ success: false, error: 'Failed to join community' });
  }
}

export async function leaveCommunity(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { communityId } = req.params;
    await placeCommunityService.leaveCommunity(userId, communityId);

    res.json({ success: true, message: 'Left community' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error leaving community', 'place_community_leave', error);
    res.status(500).json({ success: false, error: 'Failed to leave community' });
  }
}

export async function generateAutoClusters(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const result = await placeCommunityService.generateAutoClusters(userId);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceCommunityError('Error generating clusters', 'place_community_clusters', error);
    res.status(500).json({ success: false, error: 'Failed to generate clusters' });
  }
}

/* </place-community-handlers> */
