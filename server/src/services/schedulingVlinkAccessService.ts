import { BusinessRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateSchedulingPolicyDual } from '../auth/schedulingPolicyDual';

export type SchedulingVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface SchedulingVlinkAccessResult {
  allowed: boolean;
  state: SchedulingVlinkEntityState;
  title?: string;
  url?: string;
}

async function isActiveBusinessMember(
  userId: string,
  businessId: string
): Promise<{ isMember: boolean; canManage: boolean }> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });
  if (!member?.isActive) {
    return { isMember: false, canManage: false };
  }
  return {
    isMember: true,
    canManage:
      member.role === BusinessRole.ADMIN || member.canManage === true,
  };
}

async function passesScheduleReadPolicy(
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

async function passesShiftReadPolicy(
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

function scheduleWorkspaceUrl(businessId: string, scheduleId: string): string {
  return `/business/${businessId}/workspace/scheduling?view=builder&scheduleId=${scheduleId}`;
}

function shiftWorkspaceUrl(
  businessId: string,
  scheduleId: string,
  shiftId: string
): string {
  return `/business/${businessId}/workspace/scheduling?view=builder&scheduleId=${scheduleId}&shiftId=${shiftId}`;
}

function swapWorkspaceUrl(businessId: string, swapId: string): string {
  return `/business/${businessId}/workspace/scheduling?view=shift-swaps&swapId=${swapId}`;
}

async function userHasLegacyScheduleReadAccess(
  userId: string,
  schedule: {
    id: string;
    businessId: string;
    createdById: string;
  },
  membership: { isMember: boolean; canManage: boolean }
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (membership.canManage || schedule.createdById === userId) return true;

  const assignedShift = await prisma.scheduleShift.findFirst({
    where: {
      scheduleId: schedule.id,
      trashedAt: null,
      employeePosition: { userId, active: true },
    },
    select: { id: true },
  });
  return assignedShift !== null;
}

async function userHasLegacyShiftReadAccess(
  userId: string,
  shift: {
    businessId: string;
    employeePositionId: string | null;
    schedule: { createdById: string };
  },
  membership: { isMember: boolean; canManage: boolean }
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (membership.canManage || shift.schedule.createdById === userId) return true;

  if (shift.employeePositionId) {
    const position = await prisma.employeePosition.findFirst({
      where: {
        id: shift.employeePositionId,
        userId,
        businessId: shift.businessId,
        active: true,
      },
      select: { id: true },
    });
    return position !== null;
  }

  return membership.isMember;
}

async function userHasLegacySwapReadAccess(
  userId: string,
  swap: {
    businessId: string;
    requestedById: string;
    requestedToId: string | null;
  },
  membership: { isMember: boolean; canManage: boolean }
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (membership.canManage) return true;
  if (swap.requestedById === userId) return true;
  if (swap.requestedToId === userId) return true;
  return false;
}

export async function resolveScheduleForVLink(
  userId: string,
  scheduleId: string
): Promise<SchedulingVlinkAccessResult> {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      name: true,
      businessId: true,
      createdById: true,
      trashedAt: true,
    },
  });

  if (!schedule) {
    return { allowed: false, state: 'deleted' };
  }

  if (schedule.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: schedule.name,
    };
  }

  const membership = await isActiveBusinessMember(userId, schedule.businessId);
  if (!(await userHasLegacyScheduleReadAccess(userId, schedule, membership))) {
    return {
      allowed: false,
      state: 'active',
      title: schedule.name,
    };
  }

  if (!(await passesScheduleReadPolicy(userId, schedule.businessId, scheduleId))) {
    return {
      allowed: false,
      state: 'active',
      title: schedule.name,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: schedule.name,
    url: scheduleWorkspaceUrl(schedule.businessId, schedule.id),
  };
}

export async function resolveShiftForVLink(
  userId: string,
  shiftId: string
): Promise<SchedulingVlinkAccessResult> {
  const shift = await prisma.scheduleShift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      title: true,
      businessId: true,
      scheduleId: true,
      employeePositionId: true,
      trashedAt: true,
      schedule: {
        select: { trashedAt: true, createdById: true },
      },
    },
  });

  if (!shift) {
    return { allowed: false, state: 'deleted' };
  }

  if (shift.trashedAt || shift.schedule.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: shift.title,
    };
  }

  const membership = await isActiveBusinessMember(userId, shift.businessId);
  if (!(await userHasLegacyShiftReadAccess(userId, shift, membership))) {
    return {
      allowed: false,
      state: 'active',
      title: shift.title,
    };
  }

  if (!(await passesShiftReadPolicy(userId, shift.businessId, shiftId))) {
    return {
      allowed: false,
      state: 'active',
      title: shift.title,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: shift.title,
    url: shiftWorkspaceUrl(shift.businessId, shift.scheduleId, shift.id),
  };
}

export async function resolveShiftSwapRequestForVLink(
  userId: string,
  swapId: string
): Promise<SchedulingVlinkAccessResult> {
  const swap = await prisma.shiftSwapRequest.findUnique({
    where: { id: swapId },
    select: {
      id: true,
      businessId: true,
      requestedById: true,
      requestedToId: true,
      reason: true,
      originalShift: {
        select: { title: true },
      },
    },
  });

  if (!swap) {
    return { allowed: false, state: 'deleted' };
  }

  const membership = await isActiveBusinessMember(userId, swap.businessId);
  if (!(await userHasLegacySwapReadAccess(userId, swap, membership))) {
    return {
      allowed: false,
      state: 'active',
      title: swap.originalShift?.title ?? 'Shift swap',
    };
  }

  const policy = await evaluateSchedulingPolicyDual({
    userId,
    action: membership.canManage
      ? POLICY_ACTIONS.SCHEDULING_SWAP_MANAGE
      : POLICY_ACTIONS.SCHEDULING_SWAP_REQUEST,
    businessId: swap.businessId,
    resourceType: 'business',
    resourceId: swap.businessId,
  });
  if (policy.blocked) {
    return {
      allowed: false,
      state: 'active',
      title: swap.originalShift?.title ?? 'Shift swap',
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: swap.originalShift?.title ?? 'Shift swap request',
    url: swapWorkspaceUrl(swap.businessId, swap.id),
  };
}

export async function userCanLinkSchedule(
  userId: string,
  scheduleId: string
): Promise<boolean> {
  const result = await resolveScheduleForVLink(userId, scheduleId);
  return result.allowed;
}

export async function userCanLinkShift(
  userId: string,
  shiftId: string
): Promise<boolean> {
  const result = await resolveShiftForVLink(userId, shiftId);
  return result.allowed;
}

export async function userCanLinkShiftSwapRequest(
  userId: string,
  swapId: string
): Promise<boolean> {
  const result = await resolveShiftSwapRequestForVLink(userId, swapId);
  return result.allowed;
}

export const SCHEDULING_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → schedulingVlinkAccessService → business member + legacy read + Policy Engine scheduling read';
