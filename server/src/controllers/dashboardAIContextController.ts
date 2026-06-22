import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { evaluateDashboardPolicyDual } from '../auth/dashboardPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  getDashboardOverviewContext,
  getDashboardWidgetsContext,
} from '../services/dashboardAIContextService';
import { getDashboardAnalyticsSummaryForAI } from '../services/analytics/analyticsDashboardSummaryService';

function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as Record<string, unknown>).id === 'string';
}

/**
 * GET /api/dashboards/ai/context/overview
 * Returns dashboard overview for AI context
 */
export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (dashboardId && typeof dashboardId === 'string') {
      const policy = await evaluateDashboardPolicyDual({
        userId,
        action: POLICY_ACTIONS.DASHBOARD_READ,
        resourceId: dashboardId,
        scope: { dashboardId },
      });
      if (policy.blocked) {
        res.status(403).json({ success: false, message: 'Access denied', reason: policy.reason });
        return;
      }
    } else {
      const policy = await evaluateDashboardPolicyDual({
        userId,
        action: POLICY_ACTIONS.DASHBOARD_READ,
        resourceId: userId,
        metadata: { operation: 'list' },
      });
      if (policy.blocked) {
        res.status(403).json({ success: false, message: 'Access denied', reason: policy.reason });
        return;
      }
    }

    const context = await getDashboardOverviewContext(
      userId,
      typeof dashboardId === 'string' ? dashboardId : undefined
    );

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'dashboard',
        endpoint: 'overview',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardOverview', {
      operation: 'dashboard_ai_context_overview',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard overview' });
  }
}

/**
 * GET /api/dashboards/ai/context/quick-stats
 * Returns aggregated quick stats from modules for AI context
 */
export async function getDashboardQuickStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const policy = await evaluateDashboardPolicyDual({
      userId,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceId: dashboardId,
      scope: { dashboardId },
    });
    if (policy.blocked) {
      res.status(403).json({ success: false, message: 'Access denied', reason: policy.reason });
      return;
    }

    const aiContext = await getDashboardAnalyticsSummaryForAI({ userId, dashboardId });

    res.json({
      success: true,
      context: {
        summary: aiContext.summary,
        details: aiContext.details,
        dashboardContext: aiContext.dashboardContext,
      },
      metadata: {
        provider: 'analytics',
        endpoint: 'quick-stats',
        degraded: aiContext.degraded,
        asOf: aiContext.asOf,
        dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardQuickStats', {
      operation: 'dashboard_ai_context_quick_stats',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch quick stats' });
  }
}

/**
 * GET /api/dashboards/ai/context/widgets
 * Returns widget summary for AI context
 */
export async function getDashboardWidgets(req: Request, res: Response): Promise<void> {
  try {
    const userId = hasUserId(req.user) ? req.user.id : null;
    const { dashboardId } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const policy = await evaluateDashboardPolicyDual({
      userId,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceId: dashboardId,
      scope: { dashboardId },
    });
    if (policy.blocked) {
      res.status(403).json({ success: false, message: 'Access denied', reason: policy.reason });
      return;
    }

    const context = await getDashboardWidgetsContext(userId, dashboardId);

    if (!context) {
      res.status(404).json({ success: false, message: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'dashboard',
        endpoint: 'widgets',
        dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Error in getDashboardWidgets', {
      operation: 'dashboard_ai_context_widgets',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: 'Failed to fetch widget summary' });
  }
}
