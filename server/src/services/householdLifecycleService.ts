import { HouseholdRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { prepareDashboardTabDeletion } from './chat/chatDashboardLifecycleService';
import * as fileMigrationService from './fileMigrationService';

export async function userIsHouseholdOwner(userId: string, householdId: string): Promise<boolean> {
  const membership = await prisma.householdMember.findFirst({
    where: {
      householdId,
      userId,
      isActive: true,
      role: HouseholdRole.OWNER,
    },
    select: { id: true },
  });
  return membership !== null;
}

export async function findUserPrimaryHousehold(userId: string) {
  return prisma.household.findFirst({
    where: {
      isPrimary: true,
      members: {
        some: {
          userId,
          isActive: true,
          role: HouseholdRole.OWNER,
        },
      },
    },
  });
}

export async function hasActiveHouseholdDashboard(userId: string, householdId: string): Promise<boolean> {
  const count = await prisma.dashboard.count({
    where: {
      userId,
      householdId,
      trashedAt: null,
    },
  });
  return count > 0;
}

async function deleteHouseholdCalendars(householdId: string): Promise<void> {
  const calendars = await prisma.calendar.findMany({
    where: { contextType: 'HOUSEHOLD', contextId: householdId },
    select: { id: true },
  });

  for (const { id: calendarId } of calendars) {
    await prisma.event.deleteMany({ where: { calendarId } });
    await prisma.calendarMember.deleteMany({ where: { calendarId } });
    await prisma.calendar.deleteMany({ where: { id: calendarId } });
  }
}

async function removeHouseholdFromPlace(userId: string, householdId: string): Promise<void> {
  const place = await prisma.place.findUnique({ where: { userId }, select: { id: true } });
  if (!place) return;

  await prisma.placeNode.deleteMany({
    where: {
      placeId: place.id,
      nodeType: 'HOUSEHOLD',
      entityId: householdId,
    },
  });
}

async function hardDeleteHouseholdDashboardTab(userId: string, dashboardId: string): Promise<void> {
  await prisma.widget.deleteMany({ where: { dashboardId } });
  await prepareDashboardTabDeletion({ actorUserId: userId, dashboardId });
  await prisma.retentionPolicy.deleteMany({ where: { dashboardId } });
  await prisma.complianceSettings.deleteMany({ where: { dashboardId } });
  await fileMigrationService.releaseDashboardTabStorageRefs(userId, dashboardId);
  await prisma.dashboard.deleteMany({ where: { id: dashboardId, userId } });
}

/** Owner-only: remove all tab dashboards, calendars, place nodes, members, then the household. */
export async function deleteHouseholdCascadeForOwner(userId: string, householdId: string): Promise<void> {
  if (!(await userIsHouseholdOwner(userId, householdId))) {
    throw new Error('Not household owner');
  }

  const dashboards = await prisma.dashboard.findMany({
    where: { householdId, userId },
    select: { id: true },
  });

  for (const { id: dashboardId } of dashboards) {
    await hardDeleteHouseholdDashboardTab(userId, dashboardId);
  }

  await deleteHouseholdCalendars(householdId);
  await removeHouseholdFromPlace(userId, householdId);
  await prisma.householdMember.deleteMany({ where: { householdId } });
  await prisma.household.delete({ where: { id: householdId } });
}
