import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateSchedulingPolicyDual } from '../auth/schedulingPolicyDual';
import { SCHEDULING_NOT_TRASHED } from './schedulingTrashService';

export interface SchedulingSearchHit {
  entityType: 'schedule' | 'shift';
  id: string;
  title: string;
  description: string;
  businessId: string;
  scheduleId?: string;
  updatedAt: Date;
}

async function resolveBusinessIds(
  userId: string,
  businessId?: string
): Promise<string[]> {
  if (businessId) {
    const member = await prisma.businessMember.findFirst({
      where: { userId, businessId, isActive: true },
      select: { businessId: true },
    });
    return member ? [businessId] : [];
  }

  const memberships = await prisma.businessMember.findMany({
    where: { userId, isActive: true },
    select: { businessId: true },
    take: 20,
  });
  return memberships.map((m) => m.businessId);
}

async function passesScheduleRead(
  userId: string,
  businessId: string,
  scheduleId: string
): Promise<boolean> {
  const policy = await evaluateSchedulingPolicyDual({
    userId,
    action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_READ,
    businessId,
    resourceType: 'schedule',
    resourceId: scheduleId,
  });
  return !policy.blocked;
}

async function passesShiftRead(
  userId: string,
  businessId: string,
  shiftId: string
): Promise<boolean> {
  const policy = await evaluateSchedulingPolicyDual({
    userId,
    action: POLICY_ACTIONS.SCHEDULING_SHIFT_READ,
    businessId,
    resourceType: 'shift',
    resourceId: shiftId,
  });
  return !policy.blocked;
}

/**
 * Federated global search: schedules and shifts (business-scoped, PE-gated).
 */
export async function searchAccessibleScheduling(params: {
  userId: string;
  query: string;
  businessId?: string;
  limit?: number;
}): Promise<SchedulingSearchHit[]> {
  const term = params.query.trim();
  if (term.length < 2) {
    return [];
  }

  const businessIds = await resolveBusinessIds(params.userId, params.businessId);
  if (businessIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const perTypeLimit = Math.ceil(limit / 2);
  const hits: SchedulingSearchHit[] = [];

  const schedules = await prisma.schedule.findMany({
    where: {
      businessId: { in: businessIds },
      ...SCHEDULING_NOT_TRASHED,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, description: true, businessId: true, updatedAt: true },
    take: perTypeLimit,
    orderBy: { updatedAt: 'desc' },
  });

  for (const schedule of schedules) {
    if (!(await passesScheduleRead(params.userId, schedule.businessId, schedule.id))) {
      continue;
    }
    hits.push({
      entityType: 'schedule',
      id: schedule.id,
      title: schedule.name,
      description: schedule.description ?? 'Schedule',
      businessId: schedule.businessId,
      updatedAt: schedule.updatedAt,
    });
  }

  const shifts = await prisma.scheduleShift.findMany({
    where: {
      businessId: { in: businessIds },
      ...SCHEDULING_NOT_TRASHED,
      schedule: SCHEDULING_NOT_TRASHED,
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { stationName: { contains: term, mode: 'insensitive' } },
        { jobFunction: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      notes: true,
      businessId: true,
      scheduleId: true,
      startTime: true,
      updatedAt: true,
      schedule: { select: { name: true } },
    },
    take: perTypeLimit,
    orderBy: { startTime: 'asc' },
  });

  for (const shift of shifts) {
    if (!(await passesShiftRead(params.userId, shift.businessId, shift.id))) {
      continue;
    }
    hits.push({
      entityType: 'shift',
      id: shift.id,
      title: shift.title,
      description: shift.schedule?.name ?? shift.notes ?? 'Shift',
      businessId: shift.businessId,
      scheduleId: shift.scheduleId,
      updatedAt: shift.updatedAt,
    });
  }

  return hits
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
