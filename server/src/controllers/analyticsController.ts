import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import {
  AnalyticsAccessError,
  AnalyticsDashboardAccessError,
  exportAnalyticsCapability,
  getDashboardSummaryCapability,
  getModuleAnalyticsCapability,
  getPersonalAnalyticsCapability,
} from '../services/analytics/analyticsCapabilityService.js';

function logAnalyticsError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function resolveTimeRange(queryValue: unknown): string {
  if (typeof queryValue === 'string' && ['7d', '30d', '90d'].includes(queryValue)) {
    return queryValue;
  }
  return '30d';
}

export const getPersonalAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const timeRange = resolveTimeRange(req.query.timeRange);
    const data = await getPersonalAnalyticsCapability({ userId: user.id, timeRange });
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AnalyticsAccessError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    logAnalyticsError('Error getting personal analytics', 'analytics_personal', error);
    res.status(500).json({ success: false, error: 'Failed to get personal analytics' });
  }
};

export const getModuleAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { moduleId } = req.params;
    if (!moduleId || typeof moduleId !== 'string') {
      res.status(400).json({ success: false, error: 'moduleId is required' });
      return;
    }

    const timeRange = resolveTimeRange(req.query.timeRange);
    const data = await getModuleAnalyticsCapability({
      userId: user.id,
      moduleId,
      timeRange,
    });
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AnalyticsAccessError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    logAnalyticsError('Error getting module analytics', 'analytics_module', error);
    res.status(500).json({ success: false, error: 'Failed to get module analytics' });
  }
};

/**
 * GET /api/analytics/dashboard-summary?dashboardId=
 * Analytics Capability — tenant-scoped dashboard rollup.
 */
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const dashboardId = req.query.dashboardId;
    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, error: 'dashboardId is required' });
      return;
    }

    const data = await getDashboardSummaryCapability({
      userId: user.id,
      dashboardId,
    });

    res.json({
      success: true,
      data,
      metadata: {
        provider: 'analytics',
        endpoint: 'dashboard-summary',
        degraded: data.degraded,
        asOf: data.asOf,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AnalyticsDashboardAccessError || error instanceof AnalyticsAccessError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    logAnalyticsError('Error getting dashboard analytics summary', 'analytics_dashboard_summary', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard analytics summary' });
  }
};

export const exportAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const format = typeof req.query.format === 'string' ? req.query.format : 'json';
    const timeRange = resolveTimeRange(req.query.timeRange);

    const data = await exportAnalyticsCapability({
      userId: user.id,
      format,
      timeRange,
    });

    res.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AnalyticsAccessError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    logAnalyticsError('Error exporting analytics', 'analytics_export', error);
    res.status(500).json({ success: false, error: 'Failed to export analytics' });
  }
};
