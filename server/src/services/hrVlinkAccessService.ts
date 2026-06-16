import { AttendanceExceptionType, BusinessRole, TimeOffType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateHRPolicyDual } from '../auth/hrPolicyDual';
import { resolveManagerContext } from './hrServiceShared';

export type HRVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface HRVlinkAccessResult {
  allowed: boolean;
  state: HRVlinkEntityState;
  title?: string;
  url?: string;
  ownerUserId?: string;
  businessId?: string;
}

interface BusinessMembership {
  isMember: boolean;
  canManage: boolean;
}

async function isActiveBusinessMember(
  userId: string,
  businessId: string
): Promise<BusinessMembership> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });
  if (!member?.isActive) {
    return { isMember: false, canManage: false };
  }
  return {
    isMember: true,
    canManage: member.role === BusinessRole.ADMIN || member.canManage === true,
  };
}

function formatEmployeeDisplayName(
  user: { name: string | null; email: string },
  positionTitle?: string | null
): string {
  const userName = user.name ?? user.email;
  return positionTitle ? `${userName} (${positionTitle})` : userName;
}

function timeOffTypeLabel(type: TimeOffType): string {
  switch (type) {
    case TimeOffType.PTO:
      return 'PTO';
    case TimeOffType.SICK:
      return 'Sick leave';
    case TimeOffType.PERSONAL:
      return 'Personal leave';
    case TimeOffType.UNPAID:
      return 'Unpaid leave';
    default:
      return 'Time off';
  }
}

function attendanceExceptionTypeLabel(type: AttendanceExceptionType): string {
  switch (type) {
    case AttendanceExceptionType.MISSED_PUNCH:
      return 'Missed punch';
    case AttendanceExceptionType.LATE_ARRIVAL:
      return 'Late arrival';
    case AttendanceExceptionType.EARLY_DEPARTURE:
      return 'Early departure';
    case AttendanceExceptionType.ABSENCE:
      return 'Absence';
    case AttendanceExceptionType.GEO_VIOLATION:
      return 'Geo violation';
    case AttendanceExceptionType.POLICY_OVERRIDE:
      return 'Policy override';
    default:
      return 'Attendance exception';
  }
}

function employeeProfileUrl(businessId: string, profileId: string): string {
  return `/business/${businessId}/workspace/hr/team?profileId=${profileId}`;
}

function timeOffRequestUrl(businessId: string, requestId: string): string {
  return `/business/${businessId}/workspace/hr/team?tab=time-off&requestId=${requestId}`;
}

function attendanceExceptionUrl(businessId: string, exceptionId: string): string {
  return `/business/${businessId}/workspace/hr/team?tab=approvals&exceptionId=${exceptionId}`;
}

function onboardingJourneyUrl(businessId: string, journeyId: string): string {
  return `/business/${businessId}/workspace/hr/team?tab=onboarding&journeyId=${journeyId}`;
}

async function userHasLegacyEmployeeScopedReadAccess(
  userId: string,
  businessId: string,
  employeePositionId: string,
  employeeUserId: string,
  membership: BusinessMembership
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (membership.canManage) return true;
  if (employeeUserId === userId) return true;

  const managerContext = await resolveManagerContext(businessId, userId);
  return managerContext.directReportEmployeePositionIds.includes(employeePositionId);
}

async function passesEmployeeReadPolicy(
  userId: string,
  businessId: string,
  employeePositionId: string
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: POLICY_ACTIONS.HR_EMPLOYEE_READ,
    businessId,
    resourceType: 'hr_employee',
    resourceId: employeePositionId,
  });
  return !policy.blocked;
}

async function passesTimeOffReadPolicy(
  userId: string,
  businessId: string,
  requestId: string
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: POLICY_ACTIONS.HR_TIME_OFF_READ,
    businessId,
    resourceType: 'time_off_request',
    resourceId: requestId,
  });
  return !policy.blocked;
}

async function passesAttendanceExceptionReadPolicy(
  userId: string,
  businessId: string,
  exceptionId: string,
  membership: BusinessMembership
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: membership.canManage
      ? POLICY_ACTIONS.HR_ATTENDANCE_MANAGE
      : POLICY_ACTIONS.HR_EMPLOYEE_READ,
    businessId,
    resourceType: 'attendance_exception',
    resourceId: exceptionId,
  });
  return !policy.blocked;
}

async function passesOnboardingReadPolicy(
  userId: string,
  businessId: string,
  journeyId: string,
  membership: BusinessMembership
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: membership.canManage
      ? POLICY_ACTIONS.HR_ONBOARDING_MANAGE
      : POLICY_ACTIONS.HR_EMPLOYEE_READ,
    businessId,
    resourceType: 'onboarding_journey',
    resourceId: journeyId,
  });
  return !policy.blocked;
}

export async function resolveEmployeeProfileForVLink(
  userId: string,
  profileId: string
): Promise<HRVlinkAccessResult> {
  const profile = await prisma.employeeHRProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      businessId: true,
      trashedAt: true,
      employeePositionId: true,
      employeePosition: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, email: true } },
          position: { select: { title: true } },
        },
      },
    },
  });

  if (!profile) {
    return { allowed: false, state: 'deleted' };
  }

  const title = formatEmployeeDisplayName(
    profile.employeePosition.user,
    profile.employeePosition.position?.title
  );

  if (profile.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title,
      ownerUserId: profile.employeePosition.userId,
      businessId: profile.businessId,
    };
  }

  const membership = await isActiveBusinessMember(userId, profile.businessId);
  if (
    !(await userHasLegacyEmployeeScopedReadAccess(
      userId,
      profile.businessId,
      profile.employeePositionId,
      profile.employeePosition.userId,
      membership
    ))
  ) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: profile.employeePosition.userId,
      businessId: profile.businessId,
    };
  }

  if (!(await passesEmployeeReadPolicy(userId, profile.businessId, profile.employeePositionId))) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: profile.employeePosition.userId,
      businessId: profile.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title,
    url: employeeProfileUrl(profile.businessId, profile.id),
    ownerUserId: profile.employeePosition.userId,
    businessId: profile.businessId,
  };
}

export async function resolveTimeOffRequestForVLink(
  userId: string,
  requestId: string
): Promise<HRVlinkAccessResult> {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      businessId: true,
      type: true,
      startDate: true,
      endDate: true,
      requestedById: true,
      employeePositionId: true,
      employeePosition: {
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!request) {
    return { allowed: false, state: 'deleted' };
  }

  const employeeName = request.employeePosition.user.name ?? request.employeePosition.user.email;
  const title = `${timeOffTypeLabel(request.type)} — ${employeeName}`;

  const membership = await isActiveBusinessMember(userId, request.businessId);
  const legacyAllowed =
    membership.canManage ||
    request.requestedById === userId ||
    request.employeePosition.userId === userId ||
    (await resolveManagerContext(request.businessId, userId)).directReportEmployeePositionIds.includes(
      request.employeePositionId
    );

  if (!legacyAllowed) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: request.employeePosition.userId,
      businessId: request.businessId,
    };
  }

  if (!(await passesTimeOffReadPolicy(userId, request.businessId, requestId))) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: request.employeePosition.userId,
      businessId: request.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title,
    url: timeOffRequestUrl(request.businessId, request.id),
    ownerUserId: request.employeePosition.userId,
    businessId: request.businessId,
  };
}

export async function resolveAttendanceExceptionForVLink(
  userId: string,
  exceptionId: string
): Promise<HRVlinkAccessResult> {
  const exception = await prisma.attendanceException.findUnique({
    where: { id: exceptionId },
    select: {
      id: true,
      businessId: true,
      type: true,
      employeePositionId: true,
      employeePosition: {
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!exception) {
    return { allowed: false, state: 'deleted' };
  }

  const employeeName = exception.employeePosition.user.name ?? exception.employeePosition.user.email;
  const title = `${attendanceExceptionTypeLabel(exception.type)} — ${employeeName}`;

  const membership = await isActiveBusinessMember(userId, exception.businessId);
  if (
    !(await userHasLegacyEmployeeScopedReadAccess(
      userId,
      exception.businessId,
      exception.employeePositionId,
      exception.employeePosition.userId,
      membership
    ))
  ) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: exception.employeePosition.userId,
      businessId: exception.businessId,
    };
  }

  if (
    !(await passesAttendanceExceptionReadPolicy(
      userId,
      exception.businessId,
      exceptionId,
      membership
    ))
  ) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: exception.employeePosition.userId,
      businessId: exception.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title,
    url: attendanceExceptionUrl(exception.businessId, exception.id),
    ownerUserId: exception.employeePosition.userId,
    businessId: exception.businessId,
  };
}

export async function resolveOnboardingJourneyForVLink(
  userId: string,
  journeyId: string
): Promise<HRVlinkAccessResult> {
  const journey = await prisma.employeeOnboardingJourney.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      businessId: true,
      status: true,
      employeeHrProfile: {
        select: {
          employeePositionId: true,
          employeePosition: {
            select: {
              userId: true,
              user: { select: { name: true, email: true } },
              position: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  if (!journey) {
    return { allowed: false, state: 'deleted' };
  }

  const employeePosition = journey.employeeHrProfile.employeePosition;
  const title = `Onboarding — ${formatEmployeeDisplayName(
    employeePosition.user,
    employeePosition.position?.title
  )}`;

  const membership = await isActiveBusinessMember(userId, journey.businessId);
  if (
    !(await userHasLegacyEmployeeScopedReadAccess(
      userId,
      journey.businessId,
      journey.employeeHrProfile.employeePositionId,
      employeePosition.userId,
      membership
    ))
  ) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: employeePosition.userId,
      businessId: journey.businessId,
    };
  }

  if (!(await passesOnboardingReadPolicy(userId, journey.businessId, journeyId, membership))) {
    return {
      allowed: false,
      state: 'active',
      title,
      ownerUserId: employeePosition.userId,
      businessId: journey.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title,
    url: onboardingJourneyUrl(journey.businessId, journey.id),
    ownerUserId: employeePosition.userId,
    businessId: journey.businessId,
  };
}

export async function userCanLinkEmployeeProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  const result = await resolveEmployeeProfileForVLink(userId, profileId);
  return result.allowed;
}

export async function userCanLinkTimeOffRequest(
  userId: string,
  requestId: string
): Promise<boolean> {
  const result = await resolveTimeOffRequestForVLink(userId, requestId);
  return result.allowed;
}

export async function userCanLinkAttendanceException(
  userId: string,
  exceptionId: string
): Promise<boolean> {
  const result = await resolveAttendanceExceptionForVLink(userId, exceptionId);
  return result.allowed;
}

export async function userCanLinkOnboardingJourney(
  userId: string,
  journeyId: string
): Promise<boolean> {
  const result = await resolveOnboardingJourneyForVLink(userId, journeyId);
  return result.allowed;
}

export const HR_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → hrVlinkAccessService → business member + org-chart scope + Policy Engine HR read';
