import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateHRPolicyDual } from '../auth/hrPolicyDual';

export interface HrSearchHit {
  entityType: 'employee_profile' | 'time_off_request' | 'onboarding_journey';
  id: string;
  title: string;
  description: string;
  businessId: string;
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

async function passesHrEmployeeRead(
  userId: string,
  businessId: string,
  profileId: string
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: POLICY_ACTIONS.HR_EMPLOYEE_READ,
    businessId,
    resourceType: 'hr_employee',
    resourceId: profileId,
  });
  return !policy.blocked;
}

async function passesHrTimeOffRead(
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

async function passesHrOnboardingRead(
  userId: string,
  businessId: string,
  journeyId: string
): Promise<boolean> {
  const policy = await evaluateHRPolicyDual({
    userId,
    action: POLICY_ACTIONS.HR_ONBOARDING_MANAGE,
    businessId,
    resourceType: 'onboarding_journey',
    resourceId: journeyId,
  });
  return !policy.blocked;
}

/**
 * Federated global search: employees, time-off requests, onboarding journeys.
 * Business-scoped; honors PE on every hit.
 */
export async function searchAccessibleHrEntities(params: {
  userId: string;
  query: string;
  businessId?: string;
  limit?: number;
}): Promise<HrSearchHit[]> {
  const term = params.query.trim();
  if (term.length < 2) {
    return [];
  }

  const businessIds = await resolveBusinessIds(params.userId, params.businessId);
  if (businessIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const perTypeLimit = Math.ceil(limit / 3);
  const hits: HrSearchHit[] = [];

  const employeeWhere: Prisma.EmployeePositionWhereInput = {
    businessId: { in: businessIds },
    active: true,
    NOT: { hrProfile: { trashedAt: { not: null } } },
    OR: [
      { user: { name: { contains: term, mode: 'insensitive' } } },
      { user: { email: { contains: term, mode: 'insensitive' } } },
      { position: { title: { contains: term, mode: 'insensitive' } } },
    ],
  };

  const employees = await prisma.employeePosition.findMany({
    where: employeeWhere,
    include: {
      user: { select: { name: true, email: true } },
      position: { select: { title: true } },
      hrProfile: { select: { id: true, updatedAt: true } },
    },
    take: perTypeLimit,
    orderBy: { updatedAt: 'desc' },
  });

  for (const ep of employees) {
    const profileId = ep.hrProfile?.id;
    if (!profileId) continue;
    if (!(await passesHrEmployeeRead(params.userId, ep.businessId, profileId))) {
      continue;
    }
    const name = ep.user.name ?? ep.user.email;
    hits.push({
      entityType: 'employee_profile',
      id: profileId,
      title: name,
      description: ep.position?.title ?? 'Employee',
      businessId: ep.businessId,
      updatedAt: ep.hrProfile?.updatedAt ?? ep.updatedAt,
    });
  }

  const timeOffWhere: Prisma.TimeOffRequestWhereInput = {
    businessId: { in: businessIds },
    OR: [
      { reason: { contains: term, mode: 'insensitive' } },
      { employeePosition: { user: { name: { contains: term, mode: 'insensitive' } } } },
    ],
  };

  const timeOffRows = await prisma.timeOffRequest.findMany({
    where: timeOffWhere,
    include: {
      employeePosition: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    take: perTypeLimit,
    orderBy: { requestedAt: 'desc' },
  });

  for (const tor of timeOffRows) {
    if (!(await passesHrTimeOffRead(params.userId, tor.businessId, tor.id))) {
      continue;
    }
    const employeeName =
      tor.employeePosition.user.name ?? tor.employeePosition.user.email;
    hits.push({
      entityType: 'time_off_request',
      id: tor.id,
      title: `${tor.type} — ${employeeName}`,
      description: tor.reason ?? 'Time-off request',
      businessId: tor.businessId,
      updatedAt: tor.approvedAt ?? tor.requestedAt,
    });
  }

  const onboardingRows = await prisma.employeeOnboardingJourney.findMany({
    where: {
      businessId: { in: businessIds },
      employeeHrProfile: {
        employeePosition: {
          user: { name: { contains: term, mode: 'insensitive' } },
        },
      },
    },
    include: {
      employeeHrProfile: {
        include: {
          employeePosition: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
      onboardingTemplate: { select: { name: true } },
    },
    take: perTypeLimit,
    orderBy: { startDate: 'desc' },
  });

  for (const journey of onboardingRows) {
    if (!(await passesHrOnboardingRead(params.userId, journey.businessId, journey.id))) {
      continue;
    }
    const employeeName =
      journey.employeeHrProfile.employeePosition?.user.name ??
      journey.employeeHrProfile.employeePosition?.user.email ??
      'Employee';
    hits.push({
      entityType: 'onboarding_journey',
      id: journey.id,
      title: `Onboarding — ${employeeName}`,
      description: journey.onboardingTemplate?.name ?? journey.status,
      businessId: journey.businessId,
      updatedAt: journey.completionDate ?? journey.startDate,
    });
  }

  return hits
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
