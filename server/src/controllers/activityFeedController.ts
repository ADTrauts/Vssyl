/**
 * Dashboard Activity Feed API
 * GET /api/activity-feed
 * Federated feed from normalized module_activity_event log rows (ACT-R1 P0).
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getUnifiedTimelineForUser, toActivityFeedItem, type ActivityFeedItem } from '../services/platform/platformTimelineReadService';

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
    const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;
    const householdId = typeof req.query.householdId === 'string' ? req.query.householdId : undefined;

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

    if (businessId) {
      const membership = await prisma.businessMember.findFirst({
        where: { businessId, userId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        res.status(403).json({ error: 'Business access denied' });
        return;
      }
    }

    if (householdId) {
      const membership = await prisma.householdMember.findFirst({
        where: { householdId, userId },
        select: { id: true },
      });
      if (!membership) {
        res.status(403).json({ error: 'Household access denied' });
        return;
      }
    }

    const records = await getUnifiedTimelineForUser({
      userId,
      dashboardId,
      businessId,
      householdId,
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
