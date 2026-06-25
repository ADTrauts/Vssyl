import { Request, Response, NextFunction } from 'express';
import * as widgetService from '../services/widgetService';
import { evaluateDashboardPolicyDual } from '../auth/dashboardPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { CreateWidgetRequest, UpdateWidgetRequest } from 'vssyl-shared/types';
import { prisma } from '../lib/prisma';

function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as { id: unknown }).id === 'string';
}

async function respondPolicyDenied(res: Response, params: Parameters<typeof evaluateDashboardPolicyDual>[0]): Promise<boolean> {
  const decision = await evaluateDashboardPolicyDual(params);
  if (decision.blocked) {
    res.status(403).json({ message: 'Access denied', reason: decision.reason });
    return true;
  }
  return false;
}

async function resolveWidgetDashboardId(widgetId: string, userId: string): Promise<string | null> {
  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, dashboard: { userId } },
    select: { dashboardId: true },
  });
  return widget?.dashboardId ?? null;
}

export async function createWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.dashboardId;
    const data: CreateWidgetRequest = req.body;

    if (await respondPolicyDenied(res, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const widget = await widgetService.createWidget(userId, dashboardId, data);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.status(201).json({ widget });
    return;
  } catch (err) {
    next(err);
  }
}

export async function updateWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const widgetId = req.params.id;
    const data: UpdateWidgetRequest = req.body;

    const dashboardId = await resolveWidgetDashboardId(widgetId, userId);
    if (!dashboardId) {
      res.sendStatus(404);
      return;
    }

    if (await respondPolicyDenied(res, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const widget = await widgetService.updateWidget(userId, widgetId, data);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.json({ widget });
    return;
  } catch (err) {
    next(err);
  }
}

export async function deleteWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const widgetId = req.params.id;

    const dashboardId = await resolveWidgetDashboardId(widgetId, userId);
    if (!dashboardId) {
      res.sendStatus(404);
      return;
    }

    if (await respondPolicyDenied(res, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const widget = await widgetService.deleteWidget(userId, widgetId);
    if (!widget) {
      res.sendStatus(404);
      return;
    }
    res.json({ deleted: true });
    return;
  } catch (err) {
    next(err);
  }
}

export async function batchUpdatePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.dashboardId;
    const { positions } = req.body;

    if (!Array.isArray(positions)) {
      res.status(400).json({ error: 'positions must be an array' });
      return;
    }

    if (await respondPolicyDenied(res, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const result = await widgetService.batchUpdatePositions(userId, dashboardId, positions);
    if (!result) {
      res.sendStatus(404);
      return;
    }
    res.json({ success: true, updated: result.length });
    return;
  } catch (err) {
    next(err);
  }
}
