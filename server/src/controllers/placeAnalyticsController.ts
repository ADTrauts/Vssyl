import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeVisibilityService from '../services/place/placeVisibilityService';

function logPlaceAnalyticsError(desc: string, operation: string, err: unknown): void {
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

export async function getActivityFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { limit, offset, type } = req.query;
    const result = await placeVisibilityService.getActivityFeed(userId, {
      limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' ? parseInt(offset, 10) : undefined,
      type: typeof type === 'string' ? type : undefined,
    });

    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceAnalyticsError('Error fetching feed', 'place_analytics_feed', err);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
}

/* <place-visibility-read-handlers> */

export async function getPersonalAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { period } = req.query;
    const data = await placeVisibilityService.getPersonalAnalytics(
      userId,
      typeof period === 'string' ? period : undefined
    );

    res.json({ success: true, data });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceAnalyticsError('Error fetching analytics', 'place_analytics_get', err);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
}

export async function exportUserData(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const exportData = await placeVisibilityService.exportUserData(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="vssyl-place-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceAnalyticsError('Error exporting data', 'place_analytics_export', err);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
}

export async function getPlaceAnalyticsContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const payload = await placeVisibilityService.getPlaceAnalyticsContext(userId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceAnalyticsError('Error fetching analytics context', 'place_analytics_ctx', err);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics context' });
  }
}

/* </place-visibility-read-handlers> */
