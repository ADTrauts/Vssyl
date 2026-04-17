import type { PrismaClient } from '@prisma/client';

/**
 * Ensures `dashboardId` is owned by the user and optional `businessId` / `householdId`
 * match the dashboard row (blocks cross-context task writes).
 */
export async function assertUserOwnedTaskDashboardContext(
  prisma: PrismaClient,
  userId: string,
  dashboardId: string,
  businessId: string | null | undefined,
  householdId: string | null | undefined
): Promise<void> {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { businessId: true, householdId: true },
  });
  if (!dashboard) {
    throw new Error('Task dashboard not found');
  }
  const expectedBusiness = dashboard.businessId ?? null;
  const expectedHousehold = dashboard.householdId ?? null;
  const bodyBusiness = businessId ?? null;
  const bodyHousehold = householdId ?? null;
  if (bodyBusiness !== expectedBusiness || bodyHousehold !== expectedHousehold) {
    throw new Error('Task dashboard context mismatch');
  }
}

/**
 * Notes (and similar) only carry `businessId` on records — validate dashboard ownership
 * and that `businessId` matches the dashboard's business scope (household/personal use
 * null on both sides).
 */
export async function assertUserOwnedDashboardBusinessAlignment(
  prisma: PrismaClient,
  userId: string,
  dashboardId: string,
  businessId: string | null | undefined
): Promise<void> {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { businessId: true },
  });
  if (!dashboard) {
    throw new Error('Task dashboard not found');
  }
  if ((businessId ?? null) !== (dashboard.businessId ?? null)) {
    throw new Error('Task dashboard context mismatch');
  }
}

/** Drive: ensure the dashboard row belongs to the user (when client sends `dashboardId`). */
export async function assertUserOwnsDashboard(
  prisma: PrismaClient,
  userId: string,
  dashboardId: string
): Promise<void> {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { id: true },
  });
  if (!dashboard) {
    throw new Error('Task dashboard not found');
  }
}
