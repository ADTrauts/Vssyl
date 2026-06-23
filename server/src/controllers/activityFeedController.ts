/**
 * Dashboard Activity Feed API
 * GET /api/activity-feed
 * Federated feed from normalized module_activity_event log rows (ACT-R1 P0).
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getFeedForUser } from '../services/platform/platformActivityQueryService';
import {
  toActivityFeedItem,
  type ActivityFeedItem,
} from '../services/platform/platformActivityFeedMapper';

export type { ActivityFeedItem };

function getUserId(req: Request): string | null {
  const user = req.user as { id?: string; sub?: string } | undefined;
  return user?.id ?? user?.sub ?? null;
}

export async function getActivityFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10) || 20, 50);
    const dashboardId = typeof req.query.dashboardId === 'string' ? req.query.dashboardId : undefined;

    if (dashboardId) {
      const owned = await prisma.dashboard.findFirst({
        where: { id: dashboardId, userId },
        select: { id: true },
      });
      if (!owned) {
        res.status(404).json({ error: 'Dashboard not found' });
        return;
      }
    }

    const records = await getFeedForUser({
      userId,
      dashboardId,
      limit,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const activities = records.map((record) =>
      toActivityFeedItem(record, user ?? undefined)
    );

    res.json({ activities });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error('Activity feed failed', {
      operation: 'activity_feed',
      error: { message: error.message, stack: error.stack },
    });
    res.status(500).json({ error: 'Failed to load activity feed' });
  }
}
