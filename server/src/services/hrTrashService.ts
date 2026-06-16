import { BusinessRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateHRPolicyDual } from '../auth/hrPolicyDual';
import employeeManagementService from './employeeManagementService';
import {
  recordEmployeePurged,
  recordEmployeeRestored,
  recordEmployeeTrashed,
} from './hrActivityService';
import { unlinkEmployeeProfileFromAllVLinks } from './hrVlinkLifecycleService';

export class HRTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'HRTrashError';
  }
}

export type HRTrashItemType = 'employee_profile';

export interface HRTrashMutationInput {
  userId: string;
  type: HRTrashItemType;
  id: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: HRTrashItemType;
  moduleId: 'hr';
  moduleName: 'HR';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

/** Exclude globally trashed HR profiles from active employee queries */
export const HR_NOT_TRASHED = { trashedAt: null };

async function assertHRBusinessAccess(userId: string, businessId: string): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    throw new HRTrashError('Forbidden', 'forbidden');
  }

  const canManage =
    member.role === BusinessRole.ADMIN ||
    member.canManage;

  if (!canManage) {
    throw new HRTrashError('Forbidden', 'forbidden');
  }
}

async function assertHRPolicyNotBlocked(params: {
  userId: string;
  businessId: string;
  action:
    | typeof POLICY_ACTIONS.HR_EMPLOYEE_DELETE
    | typeof POLICY_ACTIONS.HR_EMPLOYEE_WRITE;
  resourceId?: string;
}): Promise<void> {
  const policy = await evaluateHRPolicyDual({
    userId: params.userId,
    action: params.action,
    businessId: params.businessId,
    resourceType: 'hr_employee',
    resourceId: params.resourceId,
  });
  if (policy.blocked) {
    throw new HRTrashError('Forbidden', 'forbidden');
  }
}

async function getManagedHRBusinessIds(userId: string): Promise<string[]> {
  const members = await prisma.businessMember.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { role: BusinessRole.ADMIN },
        { canManage: true },
      ],
    },
    select: { businessId: true },
  });
  return members.map((member) => member.businessId);
}

function resolveBusinessIdFromMetadata(metadata?: Record<string, unknown>): string | undefined {
  const businessId = metadata?.businessId;
  return typeof businessId === 'string' ? businessId : undefined;
}

async function resolveProfileContext(
  profileId: string,
  metadata?: Record<string, unknown>
): Promise<{ businessId: string; employeePositionId: string }> {
  const fromMetadataBusinessId = resolveBusinessIdFromMetadata(metadata);
  const profile = await prisma.employeeHRProfile.findFirst({
    where: {
      id: profileId,
      ...(fromMetadataBusinessId ? { businessId: fromMetadataBusinessId } : {}),
    },
    select: { businessId: true, employeePositionId: true },
  });

  if (!profile) {
    throw new HRTrashError('Employee profile not found', 'not_found');
  }

  return profile;
}

export async function softTrashEmployeeProfile(params: {
  userId: string;
  businessId: string;
  employeePositionId: string;
  deletedBy?: string | null;
  deletedReason?: string;
  deactivatePosition?: boolean;
}): Promise<{ id: string; employeePositionId: string }> {
  await assertHRBusinessAccess(params.userId, params.businessId);
  await assertHRPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.HR_EMPLOYEE_DELETE,
    resourceId: params.employeePositionId,
  });

  const position = await prisma.employeePosition.findFirst({
    where: { id: params.employeePositionId, businessId: params.businessId },
    select: { id: true, active: true },
  });

  if (!position) {
    throw new HRTrashError('Employee position not found', 'not_found');
  }

  const existingProfile = await prisma.employeeHRProfile.findUnique({
    where: { employeePositionId: params.employeePositionId },
    select: { id: true, trashedAt: true },
  });

  if (!existingProfile) {
    throw new HRTrashError('Employee profile not found', 'not_found');
  }

  if (existingProfile.trashedAt) {
    throw new HRTrashError('Employee profile already trashed', 'not_found');
  }

  const trashedAt = new Date();
  const deletedReason = params.deletedReason ?? 'admin_deleted';

  await prisma.employeeHRProfile.update({
    where: { employeePositionId: params.employeePositionId },
    data: {
      trashedAt,
      deletedAt: trashedAt,
      deletedBy: params.deletedBy ?? params.userId,
      deletedReason,
    },
  });

  if (params.deactivatePosition !== false && position.active) {
    await employeeManagementService.deactivateEmployeePositionById(
      params.employeePositionId,
      params.businessId
    );
  }

  await recordEmployeeTrashed({
    actorUserId: params.userId,
    businessId: params.businessId,
    employeeHrProfileId: existingProfile.id,
    employeePositionId: params.employeePositionId,
    reason: deletedReason,
  });

  return { id: existingProfile.id, employeePositionId: params.employeePositionId };
}

export async function restoreEmployeeProfile(params: {
  userId: string;
  businessId: string;
  profileId: string;
}): Promise<boolean> {
  await assertHRBusinessAccess(params.userId, params.businessId);
  await assertHRPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.HR_EMPLOYEE_WRITE,
    resourceId: params.profileId,
  });

  const profile = await prisma.employeeHRProfile.findFirst({
    where: {
      id: params.profileId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true, employeePositionId: true },
  });

  if (!profile) {
    return false;
  }

  const updated = await prisma.employeeHRProfile.updateMany({
    where: { id: params.profileId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordEmployeeRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    employeeHrProfileId: profile.id,
    employeePositionId: profile.employeePositionId,
  });

  return true;
}

export async function permanentlyDeleteEmployeeProfile(params: {
  userId: string;
  businessId: string;
  profileId: string;
}): Promise<boolean> {
  await assertHRBusinessAccess(params.userId, params.businessId);
  await assertHRPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.HR_EMPLOYEE_DELETE,
    resourceId: params.profileId,
  });

  const profile = await prisma.employeeHRProfile.findFirst({
    where: {
      id: params.profileId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true, employeePositionId: true },
  });

  if (!profile) {
    return false;
  }

  await unlinkEmployeeProfileFromAllVLinks({
    actorUserId: params.userId,
    profileId: params.profileId,
  });

  await prisma.employeeHRProfile.delete({ where: { id: params.profileId } });

  await recordEmployeePurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    employeeHrProfileId: profile.id,
    employeePositionId: profile.employeePositionId,
  });

  return true;
}

export async function softTrashHRItem(input: HRTrashMutationInput): Promise<void> {
  if (input.type !== 'employee_profile') {
    throw new HRTrashError(`Unsupported HR trash type: ${input.type}`, 'invalid');
  }

  const profile = await resolveProfileContext(input.id, input.metadata);
  await softTrashEmployeeProfile({
    userId: input.userId,
    businessId: profile.businessId,
    employeePositionId: profile.employeePositionId,
    deletedBy: input.userId,
    deletedReason: 'global_trash',
  });
}

export async function restoreHRItem(input: HRTrashMutationInput): Promise<boolean> {
  if (input.type !== 'employee_profile') {
    return false;
  }

  const profile = await resolveProfileContext(input.id, input.metadata);
  return restoreEmployeeProfile({
    userId: input.userId,
    businessId: profile.businessId,
    profileId: input.id,
  });
}

export async function permanentlyDeleteHRItem(input: HRTrashMutationInput): Promise<boolean> {
  if (input.type !== 'employee_profile') {
    return false;
  }

  const profile = await resolveProfileContext(input.id, input.metadata);
  return permanentlyDeleteEmployeeProfile({
    userId: input.userId,
    businessId: profile.businessId,
    profileId: input.id,
  });
}

export async function listTrashedEmployeeProfilesForGlobalTrash(
  userId: string
): Promise<GlobalTrashListItem[]> {
  const businessIds = await getManagedHRBusinessIds(userId);
  if (businessIds.length === 0) {
    return [];
  }

  const profiles = await prisma.employeeHRProfile.findMany({
    where: {
      businessId: { in: businessIds },
      trashedAt: { not: null },
    },
    select: {
      id: true,
      businessId: true,
      employeePositionId: true,
      trashedAt: true,
      employeePosition: {
        select: {
          user: { select: { name: true, email: true } },
          position: { select: { title: true } },
        },
      },
    },
    orderBy: { trashedAt: 'desc' },
  });

  return profiles.map((profile) => {
    const userName = profile.employeePosition.user.name ?? profile.employeePosition.user.email;
    const title = profile.employeePosition.position?.title;
    const displayName = title ? `${userName} (${title})` : userName;

    return {
      id: profile.id,
      name: displayName,
      type: 'employee_profile' as const,
      moduleId: 'hr' as const,
      moduleName: 'HR' as const,
      trashedAt: profile.trashedAt,
      metadata: {
        businessId: profile.businessId,
        employeePositionId: profile.employeePositionId,
        employeeProfileId: profile.id,
      },
    };
  });
}

export async function emptyHRTrash(input: { userId: string }): Promise<number> {
  const businessIds = await getManagedHRBusinessIds(input.userId);
  if (businessIds.length === 0) {
    return 0;
  }

  const trashedProfiles = await prisma.employeeHRProfile.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  let deletedCount = 0;
  for (const profile of trashedProfiles) {
    const deleted = await permanentlyDeleteEmployeeProfile({
      userId: input.userId,
      businessId: profile.businessId,
      profileId: profile.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}
