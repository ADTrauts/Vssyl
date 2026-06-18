import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AuditRequestContext, ImpersonationDenyReason } from './adminAuditService';
import {
  logImpersonationDeniedAudit,
  logImpersonationEndAudit,
  logImpersonationStartAudit,
} from './adminAuditService';

export type { ImpersonationDenyReason };

type ImpersonationTarget = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function validateImpersonationTarget(
  adminUser: { id: string },
  targetUserId: string,
): Promise<
  | { allowed: true; target: ImpersonationTarget }
  | { allowed: false; statusCode: 403 | 404; error: string; reason: ImpersonationDenyReason }
> {
  if (adminUser.id === targetUserId) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Cannot impersonate your own account',
      reason: 'self',
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, name: true, role: true, emailVerified: true },
  });

  if (!targetUser) {
    return {
      allowed: false,
      statusCode: 404,
      error: 'User not found',
      reason: 'missing_target',
    };
  }

  if (targetUser.role === 'ADMIN') {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Cannot impersonate administrator accounts',
      reason: 'admin_target',
    };
  }

  if (!targetUser.emailVerified) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Cannot impersonate users with unverified accounts',
      reason: 'unverified_account',
    };
  }

  return {
    allowed: true,
    target: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    },
  };
}

const IMPERSONATION_QUERY_TIMEOUT_MS = 10_000;
const IMPERSONATION_DEPARTMENT = 'Impersonation Lab Personas';

export class ImpersonationAlreadyActiveError extends Error {
  constructor() {
    super('Admin is already impersonating a user');
    this.name = 'ImpersonationAlreadyActiveError';
  }
}

export class NoActiveImpersonationError extends Error {
  constructor() {
    super('No active impersonation session found');
    this.name = 'NoActiveImpersonationError';
  }
}

export class ImpersonationBusinessMembershipError extends Error {
  constructor() {
    super('Target user is not a member of the specified business');
    this.name = 'ImpersonationBusinessMembershipError';
  }
}

export interface BeginImpersonationInput {
  adminUser: { id: string; email?: string | null };
  targetUserId: string;
  reason?: string;
  businessId?: string | null;
  context?: string | null;
  expiresInMinutes?: number;
  request?: AuditRequestContext;
}

export type BeginImpersonationDenied = {
  kind: 'denied';
  statusCode: 403 | 404;
  error: string;
  reason: ImpersonationDenyReason;
};

export type BeginImpersonationSuccess = {
  kind: 'success';
  message: string;
  impersonation: {
    id: string;
    targetUser: { id: string; email: string; name: string | null };
    startedAt: Date;
    reason: string | null;
    businessId: string | null;
    business: { id: string; name: string } | null;
    context: string | null;
    expiresAt: Date;
  };
  token: string;
};

export async function beginImpersonation(
  input: BeginImpersonationInput,
): Promise<BeginImpersonationDenied | BeginImpersonationSuccess> {
  const validation = await validateImpersonationTarget(
    { id: input.adminUser.id },
    input.targetUserId,
  );

  if (!validation.allowed) {
    await logImpersonationDeniedAudit(
      input.adminUser,
      input.targetUserId,
      validation.reason,
      input.request,
    );
    return {
      kind: 'denied',
      statusCode: validation.statusCode,
      error: validation.error,
      reason: validation.reason,
    };
  }

  const existing = await findActiveImpersonation(input.adminUser.id);
  if (existing) {
    throw new ImpersonationAlreadyActiveError();
  }

  const impersonationToken = crypto.randomBytes(32).toString('hex');
  const impersonationTokenHash = crypto
    .createHash('sha256')
    .update(impersonationToken)
    .digest('hex');
  const expiresAt =
    typeof input.expiresInMinutes === 'number' && input.expiresInMinutes > 0
      ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

  const { impersonation, targetUser } = await createImpersonationSession({
    adminId: input.adminUser.id,
    targetUserId: input.targetUserId,
    reason: input.reason,
    businessId: input.businessId ?? null,
    context: input.context ?? null,
    sessionTokenHash: impersonationTokenHash,
    expiresAt,
  });

  const businessSummary = impersonation.businessId
    ? await prisma.business.findUnique({
        where: { id: impersonation.businessId },
        select: { id: true, name: true },
      })
    : null;

  await logImpersonationStartAudit({
    adminUser: input.adminUser,
    targetUserId: input.targetUserId,
    targetUserEmail: targetUser.email,
    impersonationId: impersonation.id,
    reason: input.reason,
    businessId: input.businessId,
    context: input.context,
    expiresAt,
    request: input.request,
  });

  return {
    kind: 'success',
    message: 'Impersonation started successfully',
    impersonation: {
      id: impersonation.id,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
      startedAt: impersonation.startedAt,
      reason: impersonation.reason,
      businessId: impersonation.businessId,
      business: businessSummary,
      context: impersonation.context,
      expiresAt,
    },
    token: impersonationToken,
  };
}

export async function createImpersonationSession(params: {
  adminId: string;
  targetUserId: string;
  reason?: string;
  businessId?: string | null;
  context?: string | null;
  sessionTokenHash?: string | null;
  expiresAt?: Date | null;
}) {
  if (params.businessId) {
    const membership = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId: params.businessId,
          userId: params.targetUserId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ImpersonationBusinessMembershipError();
    }
  }

  const validation = await validateImpersonationTarget(
    { id: params.adminId },
    params.targetUserId,
  );
  if (!validation.allowed) {
    throw new Error(validation.error);
  }

  const impersonation = await prisma.adminImpersonation.create({
    data: {
      adminId: params.adminId,
      targetUserId: params.targetUserId,
      reason: params.reason || 'Admin impersonation for debugging/support',
      businessId: params.businessId ?? null,
      context: params.context ?? null,
      sessionTokenHash: params.sessionTokenHash ?? null,
      expiresAt: params.expiresAt ?? null,
    },
  });

  return {
    impersonation,
    targetUser: validation.target,
  };
}

export async function findActiveImpersonation(adminId: string) {
  return prisma.adminImpersonation.findFirst({
    where: {
      adminId,
      endedAt: null,
    },
  });
}

export async function endActiveImpersonation(params: {
  adminUser: { id: string; email?: string | null };
  request?: AuditRequestContext;
}) {
  const impersonation = await prisma.adminImpersonation.findFirst({
    where: {
      adminId: params.adminUser.id,
      endedAt: null,
    },
    include: {
      targetUser: {
        select: { id: true, email: true, name: true },
      },
      business: {
        select: { id: true, name: true },
      },
    },
  });

  if (!impersonation) {
    throw new NoActiveImpersonationError();
  }

  await prisma.adminImpersonation.update({
    where: { id: impersonation.id },
    data: { endedAt: new Date(), sessionTokenHash: null },
  });

  await logImpersonationEndAudit({
    adminUser: params.adminUser,
    targetUserId: impersonation.targetUserId,
    targetUserEmail: impersonation.targetUser.email,
    impersonationId: impersonation.id,
    startedAt: impersonation.startedAt,
    request: params.request,
  });

  const endedAt = new Date();
  return {
    message: 'Impersonation ended successfully' as const,
    impersonation: {
      id: impersonation.id,
      targetUser: impersonation.targetUser,
      startedAt: impersonation.startedAt,
      endedAt,
      duration: endedAt.getTime() - impersonation.startedAt.getTime(),
    },
  };
}

export async function getActiveImpersonationSession(adminId: string) {
  const impersonation = await Promise.race([
    prisma.adminImpersonation.findFirst({
      where: {
        adminId,
        endedAt: null,
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true },
        },
        business: {
          select: { id: true, name: true },
        },
      },
    }),
    new Promise<null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database query timeout after 10 seconds'));
      }, IMPERSONATION_QUERY_TIMEOUT_MS);
    }),
  ]);

  if (!impersonation) {
    return { active: false as const };
  }

  return {
    active: true as const,
    impersonation: {
      id: impersonation.id,
      targetUser: impersonation.targetUser,
      startedAt: impersonation.startedAt,
      reason: impersonation.reason,
      businessId: impersonation.businessId,
      business: impersonation.business,
      context: impersonation.context,
      expiresAt: impersonation.expiresAt,
      duration: Date.now() - impersonation.startedAt.getTime(),
    },
  };
}

export async function getImpersonationHistory(
  adminId: string,
  params: { page?: number; limit?: number },
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [impersonations, total] = await Promise.all([
    prisma.adminImpersonation.findMany({
      where: { adminId },
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true },
        },
        business: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.adminImpersonation.count({ where: { adminId } }),
  ]);

  return {
    impersonations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listImpersonationBusinesses(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = params.page ?? 1;
  const take = Math.min(params.limit ?? 12, 50);
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { industry: { contains: params.search, mode: 'insensitive' } },
      { size: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        tier: true,
        industry: true,
        size: true,
        createdAt: true,
        hrModuleSettings: {
          select: { enabledFeatures: true },
        },
        _count: {
          select: {
            members: true,
            employeePositions: true,
            businessModuleInstallations: true,
          },
        },
      },
    }),
    prisma.business.count({ where }),
  ]);

  const payload = businesses.map((business) => ({
    id: business.id,
    name: business.name,
    tier: business.tier,
    industry: business.industry,
    size: business.size,
    createdAt: business.createdAt,
    memberCount: business._count.members,
    employeePositionCount: business._count.employeePositions,
    moduleCount: business._count.businessModuleInstallations,
    hrEnabledFeatures: business.hrModuleSettings?.enabledFeatures ?? null,
  }));

  return {
    businesses: payload,
    total,
    page,
    totalPages: Math.ceil(total / take),
  };
}

export async function getImpersonationBusinessMembers(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      tier: true,
      industry: true,
      size: true,
      createdAt: true,
      hrModuleSettings: {
        select: { enabledFeatures: true },
      },
    },
  });

  if (!business) {
    return null;
  }

  const [members, moduleInstallations] = await Promise.all([
    prisma.businessMember.findMany({
      where: { businessId },
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.businessModuleInstallation.findMany({
      where: { businessId },
      orderBy: { installedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        moduleId: true,
        installedAt: true,
        enabled: true,
        module: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    }),
  ]);

  return {
    business,
    members: members.map((member) => ({
      id: member.id,
      role: member.role,
      title: member.title ?? member.job?.title ?? null,
      department: member.department,
      joinedAt: member.joinedAt,
      canManage: member.canManage,
      canInvite: member.canInvite,
      canBilling: member.canBilling,
      user: member.user,
    })),
    modules: moduleInstallations.map((installation) => ({
      id: installation.id,
      moduleId: installation.moduleId,
      moduleName: installation.module?.name ?? 'Unknown Module',
      category: installation.module?.category ?? null,
      installedAt: installation.installedAt,
      enabled: installation.enabled,
    })),
    totalMembers: members.length,
  };
}

export async function seedImpersonationBusinessPersonas(
  businessId: string,
  adminUserId: string,
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });

  if (!business) {
    return null;
  }

  const managerTier = await prisma.organizationalTier.upsert({
    where: {
      businessId_name: {
        businessId,
        name: 'Impersonation Lab - Management',
      },
    },
    update: {
      description: 'Management tier generated for Impersonation Lab personas',
      level: 2,
    },
    create: {
      businessId,
      name: 'Impersonation Lab - Management',
      level: 2,
      description: 'Management tier generated for Impersonation Lab personas',
    },
  });

  const staffTier = await prisma.organizationalTier.upsert({
    where: {
      businessId_name: {
        businessId,
        name: 'Impersonation Lab - Staff',
      },
    },
    update: {
      description: 'Staff tier generated for Impersonation Lab personas',
      level: 3,
    },
    create: {
      businessId,
      name: 'Impersonation Lab - Staff',
      level: 3,
      description: 'Staff tier generated for Impersonation Lab personas',
    },
  });

  const managerPosition = await prisma.position.upsert({
    where: {
      businessId_title: {
        businessId,
        title: 'Impersonation Lab - Manager',
      },
    },
    update: {
      tierId: managerTier.id,
      reportsToId: null,
      maxOccupants: 5,
    },
    create: {
      businessId,
      title: 'Impersonation Lab - Manager',
      tierId: managerTier.id,
      reportsToId: null,
      maxOccupants: 5,
      departmentId: null,
    },
  });

  const staffPosition = await prisma.position.upsert({
    where: {
      businessId_title: {
        businessId,
        title: 'Impersonation Lab - Specialist',
      },
    },
    update: {
      tierId: staffTier.id,
      reportsToId: managerPosition.id,
      maxOccupants: 10,
    },
    create: {
      businessId,
      title: 'Impersonation Lab - Specialist',
      tierId: staffTier.id,
      reportsToId: managerPosition.id,
      maxOccupants: 10,
      departmentId: null,
    },
  });

  const existingMembers = await prisma.businessMember.findMany({
    where: {
      businessId,
      department: IMPERSONATION_DEPARTMENT,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const ensureAssignment = async (userId: string, positionId: string) => {
    let assignment = await prisma.employeePosition.findFirst({
      where: {
        userId,
        positionId,
        businessId,
      },
    });

    if (!assignment) {
      assignment = await prisma.employeePosition.create({
        data: {
          userId,
          positionId,
          businessId,
          assignedById: adminUserId,
          startDate: new Date(),
          active: true,
        },
      });
    } else if (!assignment.active) {
      assignment = await prisma.employeePosition.update({
        where: { id: assignment.id },
        data: {
          active: true,
          endDate: null,
        },
      });
    }

    return assignment;
  };

  const ensureHrProfile = async (
    employeePositionId: string,
    employmentStatus: 'ACTIVE' | 'TERMINATED' = 'ACTIVE',
  ) => {
    return prisma.employeeHRProfile.upsert({
      where: { employeePositionId },
      create: {
        employeePositionId,
        businessId,
        hireDate: new Date(),
        employmentStatus,
        employeeType: 'FULL_TIME',
      },
      update: {
        employmentStatus,
        terminationDate: null,
        terminationReason: null,
        terminatedBy: null,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
    });
  };

  const createPersonaUser = async (label: string, displayName: string) => {
    const email = `${label}-${businessId.slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}@impersonation.vssyl`;
    const temporaryPassword = crypto
      .randomBytes(8)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: displayName,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return { user, temporaryPassword };
  };

  const personas: Array<{
    role: 'MANAGER' | 'EMPLOYEE';
    userId: string;
    email: string;
    name: string | null;
    businessMemberId: string;
    employeePositionId: string | null;
    hrProfileId: string | null;
    temporaryPassword?: string;
  }> = [];

  const managerMemberExisting = existingMembers.find((member) => member.role === 'MANAGER');

  let managerMember = managerMemberExisting ?? null;
  let managerUser = managerMemberExisting?.user ?? null;
  let managerTempPassword: string | undefined;

  if (!managerMember) {
    const managerDisplayName = `Impersonation Manager (${business.name})`;
    const { user, temporaryPassword } = await createPersonaUser('manager', managerDisplayName);
    managerTempPassword = temporaryPassword;
    managerUser = user;

    managerMember = await prisma.businessMember.create({
      data: {
        businessId,
        userId: user.id,
        role: 'MANAGER',
        title: 'Impersonation Lab Manager',
        department: IMPERSONATION_DEPARTMENT,
        canManage: true,
        canInvite: true,
        canBilling: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  const managerAssignment = await ensureAssignment(managerUser!.id, managerPosition.id);
  const managerHrProfile = await ensureHrProfile(managerAssignment.id);

  personas.push({
    role: 'MANAGER',
    userId: managerUser!.id,
    email: managerUser!.email,
    name: managerUser!.name,
    businessMemberId: managerMember!.id,
    employeePositionId: managerAssignment.id,
    hrProfileId: managerHrProfile.id,
    temporaryPassword: managerTempPassword,
  });

  const employeeMemberExisting = existingMembers.find((member) => member.role === 'EMPLOYEE');

  let employeeMember = employeeMemberExisting ?? null;
  let employeeUser = employeeMemberExisting?.user ?? null;
  let employeeTempPassword: string | undefined;

  if (!employeeMember) {
    const employeeDisplayName = `Impersonation Specialist (${business.name})`;
    const { user, temporaryPassword } = await createPersonaUser('specialist', employeeDisplayName);
    employeeTempPassword = temporaryPassword;
    employeeUser = user;

    employeeMember = await prisma.businessMember.create({
      data: {
        businessId,
        userId: user.id,
        role: 'EMPLOYEE',
        title: 'Impersonation Lab Specialist',
        department: IMPERSONATION_DEPARTMENT,
        canManage: false,
        canInvite: false,
        canBilling: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  const employeeAssignment = await ensureAssignment(employeeUser!.id, staffPosition.id);
  const employeeHrProfile = await ensureHrProfile(employeeAssignment.id);

  const existingApproval = await prisma.managerApprovalHierarchy.findFirst({
    where: {
      businessId,
      employeePositionId: employeeAssignment.id,
      managerPositionId: managerAssignment.id,
    },
  });

  if (!existingApproval) {
    await prisma.managerApprovalHierarchy.create({
      data: {
        businessId,
        employeePositionId: employeeAssignment.id,
        managerPositionId: managerAssignment.id,
        approvalTypes: ['time_off'],
        approvalLevel: 1,
        isPrimary: true,
      },
    });
  } else if (!existingApproval.approvalTypes.includes('time_off')) {
    await prisma.managerApprovalHierarchy.update({
      where: { id: existingApproval.id },
      data: {
        approvalTypes: [...new Set([...existingApproval.approvalTypes, 'time_off'])],
      },
    });
  }

  personas.push({
    role: 'EMPLOYEE',
    userId: employeeUser!.id,
    email: employeeUser!.email,
    name: employeeUser!.name,
    businessMemberId: employeeMember!.id,
    employeePositionId: employeeAssignment.id,
    hrProfileId: employeeHrProfile.id,
    temporaryPassword: employeeTempPassword,
  });

  return {
    message: 'Impersonation lab personas are ready.' as const,
    personas,
  };
}

/** Legacy AdminService.getCurrentImpersonation shape (minimal include). */
export async function getCurrentImpersonationLegacy(adminId: string) {
  return prisma.adminImpersonation.findFirst({
    where: {
      adminId,
      endedAt: null,
    },
    include: {
      targetUser: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

export async function endImpersonationLegacy(adminId: string) {
  const impersonation = await prisma.adminImpersonation.findFirst({
    where: {
      adminId,
      endedAt: null,
    },
    include: {
      targetUser: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (!impersonation) {
    throw new NoActiveImpersonationError();
  }

  await prisma.adminImpersonation.update({
    where: { id: impersonation.id },
    data: {
      endedAt: new Date(),
      sessionTokenHash: null,
    },
  });

  return impersonation;
}

export async function getImpersonationHistoryLegacy(
  adminId: string,
  params: { page?: number; limit?: number },
) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [impersonations, total] = await Promise.all([
    prisma.adminImpersonation.findMany({
      where: { adminId },
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.adminImpersonation.count({ where: { adminId } }),
  ]);

  return {
    impersonations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
