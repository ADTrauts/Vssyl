import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

export const HR_VLINK_ENTITY_TYPES: VLinkEntityType[] = [
  VLinkEntityType.HR_EMPLOYEE_PROFILE,
  VLinkEntityType.HR_TIME_OFF_REQUEST,
  VLinkEntityType.HR_ATTENDANCE_EXCEPTION,
  VLinkEntityType.HR_ONBOARDING_JOURNEY,
];

async function unlinkEntityTypeFromAllVLinks(params: {
  actorUserId: string;
  entityType: VLinkEntityType;
  entityId: string;
  operation: string;
}): Promise<number> {
  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      unlinkedAt: null,
    },
    select: {
      id: true,
      vlinkId: true,
      entityType: true,
      entityId: true,
      vlink: {
        select: { dashboardId: true, businessId: true, householdId: true },
      },
    },
  });

  if (links.length === 0) {
    return 0;
  }

  await prisma.vLinkEntity.updateMany({
    where: { id: { in: links.map((link) => link.id) } },
    data: { unlinkedAt: new Date() },
  });

  for (const link of links) {
    try {
      emitVLinkEntityUnlinkedEvent({
        actorUserId: params.actorUserId,
        vlinkId: link.vlinkId,
        entityType: link.entityType,
        entityId: link.entityId,
        vlink: link.vlink,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Failed to emit V_Link entity unlinked event on HR delete', {
        operation: params.operation,
        entityType: params.entityType,
        entityId: params.entityId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}

export async function unlinkEmployeeProfileFromAllVLinks(params: {
  actorUserId: string;
  profileId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.HR_EMPLOYEE_PROFILE,
    entityId: params.profileId,
    operation: 'hr_vlink_unlink_employee_profile',
  });
}

export async function unlinkTimeOffRequestFromAllVLinks(params: {
  actorUserId: string;
  requestId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.HR_TIME_OFF_REQUEST,
    entityId: params.requestId,
    operation: 'hr_vlink_unlink_time_off_request',
  });
}

export async function unlinkAttendanceExceptionFromAllVLinks(params: {
  actorUserId: string;
  exceptionId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.HR_ATTENDANCE_EXCEPTION,
    entityId: params.exceptionId,
    operation: 'hr_vlink_unlink_attendance_exception',
  });
}

export async function unlinkOnboardingJourneyFromAllVLinks(params: {
  actorUserId: string;
  journeyId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.HR_ONBOARDING_JOURNEY,
    entityId: params.journeyId,
    operation: 'hr_vlink_unlink_onboarding_journey',
  });
}
