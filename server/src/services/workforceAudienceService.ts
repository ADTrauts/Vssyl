import { BusinessRole, Prisma, WorkforceAudienceType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  WorkforceCommsValidationError,
  WorkforceCommsWorkflowError,
  dedupeResolvedAudience,
  parseAudienceSpecRecord,
  parseAudienceType,
  parseStringArrayField,
  type ResolvedAudienceMember,
} from './workforceServiceShared';

export type WorkforceAudienceSpecInput = {
  audienceType: WorkforceAudienceType | string;
  spec?: Record<string, unknown>;
};

export type ValidatedAudienceSpec = {
  audienceType: WorkforceAudienceType;
  spec: Prisma.InputJsonValue;
};

const ACTIVE_EP_WHERE = { active: true, endDate: null } as const;

function mapBusinessRoleToken(token: string): BusinessRole | null {
  const normalized = token.toUpperCase();
  if (normalized === 'ADMIN') return BusinessRole.ADMIN;
  if (normalized === 'MANAGER') return BusinessRole.MANAGER;
  if (normalized === 'MEMBER' || normalized === 'EMPLOYEE') return BusinessRole.EMPLOYEE;
  return null;
}

async function collectDescendantPositionIds(
  rootPositionId: string,
  businessId: string,
  includeIndirect: boolean
): Promise<string[]> {
  if (!includeIndirect) {
    const direct = await prisma.position.findMany({
      where: { businessId, reportsToId: rootPositionId },
      select: { id: true },
    });
    return [rootPositionId, ...direct.map((position) => position.id)];
  }

  const allPositions = await prisma.position.findMany({
    where: { businessId },
    select: { id: true, reportsToId: true },
  });

  const childrenByParent = new Map<string, string[]>();
  for (const position of allPositions) {
    if (!position.reportsToId) continue;
    const siblings = childrenByParent.get(position.reportsToId) ?? [];
    siblings.push(position.id);
    childrenByParent.set(position.reportsToId, siblings);
  }

  const collected = new Set<string>([rootPositionId]);
  const queue = [rootPositionId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const childId of childrenByParent.get(current) ?? []) {
      if (collected.has(childId)) continue;
      collected.add(childId);
      queue.push(childId);
    }
  }

  return Array.from(collected);
}

export function validateAudienceSpec(input: WorkforceAudienceSpecInput): ValidatedAudienceSpec {
  const audienceType = parseAudienceType(input.audienceType);
  const spec = parseAudienceSpecRecord(input.spec ?? {});

  switch (audienceType) {
    case WorkforceAudienceType.BUSINESS:
      break;
    case WorkforceAudienceType.DEPARTMENT:
      parseStringArrayField(spec, 'departmentIds');
      break;
    case WorkforceAudienceType.EMPLOYEE_POSITION:
      parseStringArrayField(spec, 'employeePositionIds');
      break;
    case WorkforceAudienceType.POSITION:
      parseStringArrayField(spec, 'positionIds');
      break;
    case WorkforceAudienceType.TIER:
      parseStringArrayField(spec, 'tierIds');
      break;
    case WorkforceAudienceType.MANAGER_SUBTREE: {
      const managerId = spec.managerEmployeePositionId;
      if (typeof managerId !== 'string' || managerId.length === 0) {
        throw new WorkforceCommsValidationError(
          'managerEmployeePositionId is required',
          'managerEmployeePositionId'
        );
      }
      break;
    }
    case WorkforceAudienceType.BUSINESS_ROLE: {
      const roles = parseStringArrayField(spec, 'roles');
      if (roles.length === 0) {
        throw new WorkforceCommsValidationError('roles must not be empty', 'roles');
      }
      for (const role of roles) {
        if (!mapBusinessRoleToken(role)) {
          throw new WorkforceCommsValidationError(`Invalid business role: ${role}`, 'roles');
        }
      }
      break;
    }
    case WorkforceAudienceType.CUSTOM_GROUP:
      parseStringArrayField(spec, 'userIds');
      break;
    default:
      throw new WorkforceCommsValidationError('Unsupported audience type', 'audienceType');
  }

  return {
    audienceType,
    spec: spec as Prisma.InputJsonValue,
  };
}

async function resolveBusinessAudience(businessId: string): Promise<ResolvedAudienceMember[]> {
  const positions = await prisma.employeePosition.findMany({
    where: { businessId, ...ACTIVE_EP_WHERE },
    select: { id: true, userId: true },
  });
  return positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }));
}

async function resolveDepartmentAudience(
  businessId: string,
  departmentIds: string[]
): Promise<ResolvedAudienceMember[]> {
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      ...ACTIVE_EP_WHERE,
      position: { departmentId: { in: departmentIds } },
    },
    select: { id: true, userId: true },
  });
  return positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }));
}

async function resolveEmployeePositionAudience(
  businessId: string,
  employeePositionIds: string[]
): Promise<ResolvedAudienceMember[]> {
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      id: { in: employeePositionIds },
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true },
  });
  return positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }));
}

async function resolvePositionAudience(
  businessId: string,
  positionIds: string[]
): Promise<ResolvedAudienceMember[]> {
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      positionId: { in: positionIds },
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true },
  });
  return positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }));
}

async function resolveTierAudience(
  businessId: string,
  tierIds: string[]
): Promise<ResolvedAudienceMember[]> {
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      ...ACTIVE_EP_WHERE,
      position: { tierId: { in: tierIds } },
    },
    select: { id: true, userId: true },
  });
  return positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }));
}

async function resolveManagerSubtreeAudience(
  businessId: string,
  spec: Record<string, unknown>
): Promise<ResolvedAudienceMember[]> {
  const managerEmployeePositionId = spec.managerEmployeePositionId;
  if (typeof managerEmployeePositionId !== 'string') {
    throw new WorkforceCommsValidationError(
      'managerEmployeePositionId is required',
      'managerEmployeePositionId'
    );
  }

  const managerEp = await prisma.employeePosition.findFirst({
    where: {
      id: managerEmployeePositionId,
      businessId,
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true, positionId: true },
  });

  if (!managerEp) {
    throw new WorkforceCommsWorkflowError(404, 'Manager employee position not found');
  }

  const includeIndirect = spec.includeIndirect !== false;
  const positionIds = await collectDescendantPositionIds(
    managerEp.positionId,
    businessId,
    includeIndirect
  );

  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      positionId: { in: positionIds },
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true },
  });

  return dedupeResolvedAudience(
    positions.map((ep) => ({ userId: ep.userId, employeePositionId: ep.id }))
  );
}

async function resolveBusinessRoleAudience(
  businessId: string,
  roles: string[]
): Promise<ResolvedAudienceMember[]> {
  const mappedRoles = roles
    .map((role) => mapBusinessRoleToken(role))
    .filter((role): role is BusinessRole => role !== null);

  const members = await prisma.businessMember.findMany({
    where: {
      businessId,
      isActive: true,
      role: { in: mappedRoles },
    },
    select: { userId: true },
  });

  const userIds = members.map((member) => member.userId);
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      userId: { in: userIds },
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true },
  });

  const epByUser = new Map(positions.map((ep) => [ep.userId, ep.id]));
  return dedupeResolvedAudience(
    userIds.map((userId) => ({
      userId,
      employeePositionId: epByUser.get(userId) ?? null,
    }))
  );
}

async function resolveCustomGroupAudience(
  businessId: string,
  userIds: string[]
): Promise<ResolvedAudienceMember[]> {
  const members = await prisma.businessMember.findMany({
    where: {
      businessId,
      isActive: true,
      userId: { in: userIds },
    },
    select: { userId: true },
  });

  const activeUserIds = members.map((member) => member.userId);
  const positions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      userId: { in: activeUserIds },
      ...ACTIVE_EP_WHERE,
    },
    select: { id: true, userId: true },
  });
  const epByUser = new Map(positions.map((ep) => [ep.userId, ep.id]));

  return dedupeResolvedAudience(
    activeUserIds.map((userId) => ({
      userId,
      employeePositionId: epByUser.get(userId) ?? null,
    }))
  );
}

export async function resolveAudienceMembers(params: {
  businessId: string;
  audienceType: WorkforceAudienceType;
  spec: Record<string, unknown>;
}): Promise<ResolvedAudienceMember[]> {
  const { businessId, audienceType } = params;
  const spec = parseAudienceSpecRecord(params.spec);
  validateAudienceSpec({ audienceType, spec });

  let members: ResolvedAudienceMember[];

  switch (audienceType) {
    case WorkforceAudienceType.BUSINESS:
      members = await resolveBusinessAudience(businessId);
      break;
    case WorkforceAudienceType.DEPARTMENT:
      members = await resolveDepartmentAudience(
        businessId,
        parseStringArrayField(spec, 'departmentIds')
      );
      break;
    case WorkforceAudienceType.EMPLOYEE_POSITION:
      members = await resolveEmployeePositionAudience(
        businessId,
        parseStringArrayField(spec, 'employeePositionIds')
      );
      break;
    case WorkforceAudienceType.POSITION:
      members = await resolvePositionAudience(
        businessId,
        parseStringArrayField(spec, 'positionIds')
      );
      break;
    case WorkforceAudienceType.TIER:
      members = await resolveTierAudience(businessId, parseStringArrayField(spec, 'tierIds'));
      break;
    case WorkforceAudienceType.MANAGER_SUBTREE:
      members = await resolveManagerSubtreeAudience(businessId, spec);
      break;
    case WorkforceAudienceType.BUSINESS_ROLE:
      members = await resolveBusinessRoleAudience(
        businessId,
        parseStringArrayField(spec, 'roles')
      );
      break;
    case WorkforceAudienceType.CUSTOM_GROUP:
      members = await resolveCustomGroupAudience(
        businessId,
        parseStringArrayField(spec, 'userIds')
      );
      break;
    default:
      throw new WorkforceCommsValidationError('Unsupported audience type', 'audienceType');
  }

  return dedupeResolvedAudience(members);
}

export async function estimateAudienceCount(params: {
  businessId: string;
  audienceType: WorkforceAudienceType | string;
  spec?: Record<string, unknown>;
}): Promise<number> {
  const validated = validateAudienceSpec({
    audienceType: params.audienceType,
    spec: params.spec ?? {},
  });
  const members = await resolveAudienceMembers({
    businessId: params.businessId,
    audienceType: validated.audienceType,
    spec: parseAudienceSpecRecord(validated.spec),
  });
  return members.length;
}

export async function resolveAudienceForPublish(params: {
  businessId: string;
  communicationId: string;
  audienceType: WorkforceAudienceType;
  spec: Record<string, unknown>;
  resolutionVersion?: number;
}) {
  const members = await resolveAudienceMembers({
    businessId: params.businessId,
    audienceType: params.audienceType,
    spec: params.spec,
  });

  if (members.length === 0) {
    throw new WorkforceCommsWorkflowError(400, 'Audience resolves to zero recipients');
  }

  const version = params.resolutionVersion ?? 1;

  await prisma.workforceAudienceResolution.deleteMany({
    where: { communicationId: params.communicationId },
  });

  await prisma.workforceAudienceResolution.createMany({
    data: members.map((member) => ({
      communicationId: params.communicationId,
      userId: member.userId,
      employeePositionId: member.employeePositionId,
      resolutionVersion: version,
    })),
  });

  return members;
}

export async function getResolvedUserIds(params: {
  businessId: string;
  communicationId: string;
}): Promise<string[]> {
  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
    },
    select: { id: true },
  });

  if (!communication) {
    throw new WorkforceCommsWorkflowError(404, 'Communication not found');
  }

  const resolutions = await prisma.workforceAudienceResolution.findMany({
    where: { communicationId: params.communicationId },
    select: { userId: true },
  });

  return resolutions.map((row) => row.userId);
}

export async function assertUserInResolvedAudience(params: {
  businessId: string;
  communicationId: string;
  userId: string;
}): Promise<void> {
  const resolution = await prisma.workforceAudienceResolution.findFirst({
    where: {
      communicationId: params.communicationId,
      userId: params.userId,
      communication: { businessId: params.businessId },
    },
    select: { id: true },
  });

  if (!resolution) {
    throw new WorkforceCommsWorkflowError(403, 'User is not in the communication audience');
  }
}
