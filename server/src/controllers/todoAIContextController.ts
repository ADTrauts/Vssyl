/**
 * To-Do Module AI Context Controller
 * Thin HTTP adapter — context data via todoVisibilityService AI helpers.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { TodoServiceError } from '../services/todo/todoErrors';
import {
  getHighPriorityTasksForAI,
  getOverviewStatsForAI,
  getOverdueTasksForAI,
  getPriorityAnalysisTasksForAI,
  getUpcomingTasksForAI,
} from '../services/todoVisibilityService';

function parseScopeQuery(req: Request) {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { businessId, dashboardId } = req.query;
  return {
    userId,
    dashboardId: typeof dashboardId === 'string' ? dashboardId : undefined,
    businessId: typeof businessId === 'string' ? businessId : undefined,
  };
}

function handleContextError(
  res: Response,
  operation: string,
  error: unknown
): void {
  if (error instanceof TodoServiceError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
    });
    return;
  }
  const err = error instanceof Error ? error : new Error(String(error));
  void logger.error(`Error in ${operation}`, {
    operation,
    error: { message: err.message, stack: err.stack },
  });
  res.status(500).json({
    success: false,
    message: 'Failed to fetch context',
    error: err.message,
  });
}

/**
 * GET /api/todo/ai/context/overview
 */
export async function getOverviewContext(req: Request, res: Response): Promise<void> {
  try {
    const scope = parseScopeQuery(req);
    if (!scope.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const context = await getOverviewStatsForAI({
      userId: scope.userId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId,
    });

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'todo',
        endpoint: 'overview',
        businessId: scope.businessId ?? null,
        dashboardId: scope.dashboardId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    handleContextError(res, 'todo_ai_context_overview', error);
  }
}

/**
 * GET /api/todo/ai/context/upcoming
 */
export async function getUpcomingContext(req: Request, res: Response): Promise<void> {
  try {
    const scope = parseScopeQuery(req);
    if (!scope.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const context = await getUpcomingTasksForAI({
      userId: scope.userId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId,
    });

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'todo',
        endpoint: 'upcoming',
        businessId: scope.businessId ?? null,
        dashboardId: scope.dashboardId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    handleContextError(res, 'todo_ai_context_upcoming', error);
  }
}

/**
 * GET /api/todo/ai/context/overdue
 */
export async function getOverdueContext(req: Request, res: Response): Promise<void> {
  try {
    const scope = parseScopeQuery(req);
    if (!scope.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const context = await getOverdueTasksForAI({
      userId: scope.userId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId,
    });

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'todo',
        endpoint: 'overdue',
        businessId: scope.businessId ?? null,
        dashboardId: scope.dashboardId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    handleContextError(res, 'todo_ai_context_overdue', error);
  }
}

/**
 * GET /api/todo/ai/context/priority
 */
export async function getPriorityContext(req: Request, res: Response): Promise<void> {
  try {
    const scope = parseScopeQuery(req);
    if (!scope.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const context = await getHighPriorityTasksForAI({
      userId: scope.userId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId,
    });

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'todo',
        endpoint: 'priority',
        businessId: scope.businessId ?? null,
        dashboardId: scope.dashboardId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    handleContextError(res, 'todo_ai_context_priority', error);
  }
}

/**
 * GET /api/todo/ai/context/priority-analysis
 */
export async function getPriorityAnalysisContext(req: Request, res: Response): Promise<void> {
  try {
    const scope = parseScopeQuery(req);
    if (!scope.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!scope.dashboardId) {
      res.status(400).json({ success: false, message: 'dashboardId is required' });
      return;
    }

    const context = await getPriorityAnalysisTasksForAI({
      userId: scope.userId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId,
    });

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'todo',
        endpoint: 'priority-analysis',
        businessId: scope.businessId ?? null,
        dashboardId: scope.dashboardId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    handleContextError(res, 'todo_ai_context_priority_analysis', error);
  }
}
