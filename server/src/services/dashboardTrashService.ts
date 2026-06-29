import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { evaluateDashboardPolicyDual } from '../auth/dashboardPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  contextFromDashboard,
  recordDashboardDeleted,
  recordDashboardRestored,
  recordDashboardTrashed,
} from './dashboardActivityService';
import { finalizeDashboardTabHardDeletePrereqs } from './dashboardService';

async function enforceDashboardPolicy(
  res: Response,
  userId: string,
  dashboardId: string,
  action: typeof POLICY_ACTIONS.DASHBOARD_WRITE | typeof POLICY_ACTIONS.DASHBOARD_DELETE
): Promise<boolean> {
  const decision = await evaluateDashboardPolicyDual({
    userId,
    action,
    resourceId: dashboardId,
    scope: { dashboardId },
  });
  if (decision.blocked) {
    res.status(403).json({ message: 'Access denied', reason: decision.reason });
    return false;
  }
  return true;
}

export async function softTrashDashboardTab(
  res: Response,
  userId: string,
  dashboardId: string
): Promise<boolean> {
  if (!(await enforceDashboardPolicy(res, userId, dashboardId, POLICY_ACTIONS.DASHBOARD_WRITE))) {
    return true;
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId, trashedAt: null },
    select: { id: true, businessId: true, householdId: true, institutionId: true },
  });

  if (!dashboard) {
    res.status(404).json({ message: 'Item not found or already trashed' });
    return true;
  }

  const trashedAt = new Date();
  await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { trashedAt },
  });

  await recordDashboardTrashed({
    actorUserId: userId,
    dashboard: contextFromDashboard(dashboard),
    trashedAt,
  });

  res.json({ success: true, message: 'Item moved to trash' });
  return true;
}

export async function restoreDashboardTab(
  res: Response,
  userId: string,
  dashboardId: string
): Promise<boolean> {
  if (!(await enforceDashboardPolicy(res, userId, dashboardId, POLICY_ACTIONS.DASHBOARD_WRITE))) {
    return true;
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId, trashedAt: { not: null } },
    select: { id: true, businessId: true, householdId: true, institutionId: true },
  });

  if (!dashboard) {
    return false;
  }

  await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { trashedAt: null },
  });

  await recordDashboardRestored({
    actorUserId: userId,
    dashboard: contextFromDashboard(dashboard),
  });

  res.json({ success: true, message: 'Item restored' });
  return true;
}

export async function permanentlyDeleteDashboardTab(
  res: Response,
  userId: string,
  dashboardId: string
): Promise<boolean> {
  if (!(await enforceDashboardPolicy(res, userId, dashboardId, POLICY_ACTIONS.DASHBOARD_DELETE))) {
    return true;
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId, trashedAt: { not: null } },
    select: { id: true, businessId: true, householdId: true, institutionId: true },
  });

  if (!dashboard) {
    return false;
  }

  await finalizeDashboardTabHardDeletePrereqs(userId, dashboardId);

  await prisma.dashboard.delete({ where: { id: dashboardId } });

  await recordDashboardDeleted({
    actorUserId: userId,
    dashboard: contextFromDashboard(dashboard),
    hardDelete: true,
  });

  recordDashboardTabDeletedDomainEvent({
    actorUserId: userId,
    dashboard: contextFromDashboard(dashboard),
    hardDelete: true,
  });

  res.json({ success: true, message: 'Item permanently deleted' });
  return true;
}
