import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';
import * as fileMigrationService from '../services/fileMigrationService';
import { CreateDashboardRequest, UpdateDashboardRequest } from 'vssyl-shared/types';
import { evaluateDashboardPolicyDual } from '../auth/dashboardPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import type { FileHandlingAction } from '../services/fileMigrationService';

function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as { id: unknown }).id === 'string';
}

async function respondPolicyDenied(res: Response, userId: string, params: Parameters<typeof evaluateDashboardPolicyDual>[0]): Promise<boolean> {
  const decision = await evaluateDashboardPolicyDual(params);
  if (decision.blocked) {
    res.status(403).json({ message: 'Access denied', reason: decision.reason });
    return true;
  }
  return false;
}

function buildCreateScope(data: CreateDashboardRequest): { businessId?: string; householdId?: string; institutionId?: string } {
  return {
    ...(data.businessId ? { businessId: data.businessId } : {}),
    ...(data.householdId ? { householdId: data.householdId } : {}),
    ...(data.institutionId ? { institutionId: data.institutionId } : {}),
  };
}

function countCreateContextIds(data: CreateDashboardRequest): number {
  let n = 0;
  if (data.businessId) n += 1;
  if (data.institutionId) n += 1;
  if (data.householdId) n += 1;
  return n;
}

export async function getDashboards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceId: userId,
      metadata: { operation: 'list' },
    })) {
      return;
    }

    const allDashboards = await dashboardService.getAllUserDashboards(userId);
    res.json({ dashboards: allDashboards });
    return;
  } catch (err) {
    next(err);
  }
}

export async function ensureDefaultPersonalDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: userId,
      metadata: { operation: 'create' },
    })) {
      return;
    }

    const { dashboard, created } = await dashboardService.ensureDefaultPersonalDashboard(userId);
    res.status(created ? 201 : 200).json({ dashboard, created });
    return;
  } catch (err) {
    next(err);
  }
}

export async function createDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const data: CreateDashboardRequest = req.body;

    if (countCreateContextIds(data) > 1) {
      res.status(400).json({
        error: 'Specify at most one of businessId, institutionId, or householdId',
      });
      return;
    }

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: userId,
      scope: buildCreateScope(data),
      metadata: { operation: 'create' },
    })) {
      return;
    }

    const dashboard = await dashboardService.createDashboard(userId, data);
    res.status(201).json({ dashboard });
    return;
  } catch (err) {
    if (err instanceof dashboardService.DashboardCreationError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function getDashboardById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.id;
    if (typeof dashboardId !== 'string' || !dashboardId) {
      res.status(400).json({ message: 'Invalid dashboard id' });
      return;
    }

    const businessIdQ = req.query.businessId;
    const householdIdQ = req.query.householdId;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceId: dashboardId,
      scope: {
        dashboardId,
        ...(typeof businessIdQ === 'string' ? { businessId: businessIdQ } : {}),
        ...(typeof householdIdQ === 'string' ? { householdId: householdIdQ } : {}),
      },
    })) {
      return;
    }

    const dashboard = await dashboardService.getDashboardById(userId, dashboardId);
    if (!dashboard) {
      res.sendStatus(404);
      return;
    }
    res.json({ dashboard });
    return;
  } catch (err) {
    next(err);
  }
}

export async function updateDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.id;
    const data: UpdateDashboardRequest = req.body;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const dashboard = await dashboardService.updateDashboard(userId, dashboardId, data);
    if (!dashboard) {
      res.sendStatus(404);
      return;
    }
    res.json({ dashboard });
    return;
  } catch (err) {
    next(err);
  }
}

export async function getDashboardFileSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.id;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const dashboard = await dashboardService.getDashboardById(userId, dashboardId);
    if (!dashboard) {
      res.sendStatus(404);
      return;
    }

    const summary = await fileMigrationService.getDashboardFileSummary(userId, dashboardId);
    res.json({ summary });
    return;
  } catch (err) {
    next(err);
  }
}

export async function deleteDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const dashboardId = req.params.id;
    const { fileAction }: { fileAction?: FileHandlingAction } = req.body;

    if (await respondPolicyDenied(res, userId, {
      userId,
      action: POLICY_ACTIONS.DASHBOARD_DELETE,
      resourceId: dashboardId,
      scope: { dashboardId },
    })) {
      return;
    }

    const result = await dashboardService.deleteDashboardWithFiles(userId, dashboardId, fileAction);
    if (!result) {
      res.sendStatus(404);
      return;
    }

    res.json(result);
    return;
  } catch (err) {
    next(err);
  }
}
