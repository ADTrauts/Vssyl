import {
  EmployeeType as PrismaEmployeeType,
  EmploymentStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import employeeManagementService from './employeeManagementService.js';
import {
  recordEmployeeCreated,
  recordEmployeeTerminated,
  recordEmployeeUpdated,
} from './hrActivityService';
import {
  AuditChangeMap,
  HRWorkflowError,
  logEmployeeAudit,
  recordAuditChange,
  resolveManagerContext,
} from './hrServiceShared';

export interface ListAdminEmployeesParams {
  businessId: string;
  status: string;
  q: string;
  departmentId?: string;
  positionId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export async function listAdminEmployees(params: ListAdminEmployeesParams) {
  const {
    businessId,
    status,
    q,
    departmentId,
    positionId,
    sortBy,
    sortOrder,
    page,
    pageSize,
  } = params;
  const skip = (page - 1) * pageSize;

  let activeOrderBy: Prisma.EmployeePositionOrderByWithRelationInput = { createdAt: sortOrder };
  let terminatedOrderBy: Prisma.EmployeeHRProfileOrderByWithRelationInput = { updatedAt: sortOrder };

  switch (sortBy) {
    case 'name':
      activeOrderBy = { user: { name: sortOrder } };
      terminatedOrderBy = { employeePosition: { user: { name: sortOrder } } };
      break;
    case 'email':
      activeOrderBy = { user: { email: sortOrder } };
      terminatedOrderBy = { employeePosition: { user: { email: sortOrder } } };
      break;
    case 'title':
      activeOrderBy = { position: { title: sortOrder } };
      terminatedOrderBy = { employeePosition: { position: { title: sortOrder } } };
      break;
    case 'department':
      activeOrderBy = { position: { department: { name: sortOrder } } };
      terminatedOrderBy = { employeePosition: { position: { department: { name: sortOrder } } } };
      break;
    case 'hireDate':
      activeOrderBy = { hrProfile: { hireDate: sortOrder } };
      terminatedOrderBy = { hireDate: sortOrder };
      break;
    default:
      activeOrderBy = { [sortBy]: sortOrder } as Prisma.EmployeePositionOrderByWithRelationInput;
      terminatedOrderBy = { [sortBy]: sortOrder } as Prisma.EmployeeHRProfileOrderByWithRelationInput;
  }

  if (status === 'TERMINATED') {
    const where: Record<string, unknown> = {
      businessId,
      employmentStatus: 'TERMINATED',
    };

    const employeePositionFilter: Record<string, unknown> = { businessId };

    if (departmentId) {
      employeePositionFilter.position = {
        ...((employeePositionFilter.position as Record<string, unknown>) || {}),
        departmentId,
      };
    }
    if (positionId) {
      employeePositionFilter.positionId = positionId;
    }
    if (q) {
      employeePositionFilter.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { position: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (
      Object.keys(employeePositionFilter).length > 1 ||
      Object.keys(employeePositionFilter).some((key) => key !== 'businessId')
    ) {
      where.employeePosition = employeePositionFilter;
    }

    const [employees, count] = await Promise.all([
      prisma.employeeHRProfile.findMany({
        where,
        include: {
          employeePosition: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
              position: { include: { department: true, tier: true } },
            },
          },
        },
        orderBy: terminatedOrderBy,
        skip,
        take: pageSize,
      }),
      prisma.employeeHRProfile.count({ where }),
    ]);

    return { employees, count, page, pageSize };
  }

  const where: Record<string, unknown> = {
    businessId,
    active: true,
    NOT: {
      hrProfile: {
        trashedAt: { not: null },
      },
    },
  };

  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { position: { title: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (departmentId) {
    where.position = {
      ...((where.position as Record<string, unknown>) || {}),
      departmentId,
    };
  }

  if (positionId) {
    where.positionId = positionId;
  }

  const [employees, count] = await Promise.all([
    prisma.employeePosition.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        position: { include: { department: true, tier: true } },
        hrProfile: true,
      },
      orderBy: activeOrderBy,
      skip,
      take: pageSize,
    }),
    prisma.employeePosition.count({ where }),
  ]);

  return { employees, count, page, pageSize };
}

export async function getEmployeeFilterOptions(businessId: string) {
  const [departments, positions] = await Promise.all([
    prisma.department.findMany({
      where: { businessId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.position.findMany({
      where: {
        businessId,
        employeePositions: {
          some: {
            active: true,
            businessId,
          },
        },
      },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
      distinct: ['title'],
    }),
  ]);

  return { departments, positions };
}

export async function getAdminEmployee(businessId: string, id: string) {
  const employee = await prisma.employeePosition.findFirst({
    where: {
      id,
      businessId,
      active: true,
    },
    include: {
      user: true,
      position: {
        include: {
          department: true,
          tier: true,
        },
      },
      hrProfile: true,
    },
  });

  if (!employee) {
    throw new HRWorkflowError(404, 'Employee not found');
  }

  return { employee };
}

export interface CreateEmployeeProfileParams {
  businessId: string;
  userId: string;
  employeePositionId: string;
  hireDate?: string;
  employeeType?: PrismaEmployeeType;
  workLocation?: string;
  emergencyContactJson?: Prisma.InputJsonValue | null;
  personalInfoJson?: Prisma.InputJsonValue | null;
}

export async function createEmployeeProfile(params: CreateEmployeeProfileParams) {
  const {
    businessId,
    userId,
    employeePositionId,
    hireDate,
    employeeType,
    workLocation,
    emergencyContactJson,
    personalInfoJson,
  } = params;

  const hireDateValue = hireDate ? new Date(hireDate) : undefined;
  const employeeTypeValue = employeeType;

  const position = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!position) {
    throw new HRWorkflowError(400, 'Invalid employeePositionId for this business');
  }

  const existingProfile = await prisma.employeeHRProfile.findUnique({
    where: { employeePositionId },
  });

  const hrProfile = await prisma.employeeHRProfile.upsert({
    where: { employeePositionId },
    create: {
      employeePositionId,
      businessId,
      employmentStatus: 'ACTIVE',
      ...(hireDateValue ? { hireDate: hireDateValue } : {}),
      ...(employeeTypeValue ? { employeeType: employeeTypeValue } : {}),
      ...(workLocation !== undefined ? { workLocation } : {}),
      ...(emergencyContactJson !== undefined
        ? { emergencyContact: emergencyContactJson === null ? Prisma.JsonNull : emergencyContactJson }
        : {}),
      ...(personalInfoJson !== undefined
        ? { personalInfo: personalInfoJson === null ? Prisma.JsonNull : personalInfoJson }
        : {}),
    },
    update: {
      employmentStatus: 'ACTIVE',
      ...(hireDate !== undefined ? { hireDate: hireDateValue } : {}),
      ...(employeeType !== undefined ? { employeeType: employeeTypeValue } : {}),
      ...(workLocation !== undefined ? { workLocation } : {}),
      ...(emergencyContactJson !== undefined
        ? { emergencyContact: emergencyContactJson ?? Prisma.JsonNull }
        : {}),
      ...(personalInfoJson !== undefined
        ? { personalInfo: personalInfoJson ?? Prisma.JsonNull }
        : {}),
    },
  });

  await prisma.employeePosition.update({
    where: { id: employeePositionId },
    data: {
      active: true,
      startDate: hireDate ? new Date(hireDate) : new Date(),
      endDate: null,
    },
  });

  const auditChanges: AuditChangeMap = {};
  recordAuditChange(auditChanges, 'hireDate', existingProfile?.hireDate, hrProfile.hireDate);
  recordAuditChange(auditChanges, 'employeeType', existingProfile?.employeeType, hrProfile.employeeType);
  recordAuditChange(auditChanges, 'workLocation', existingProfile?.workLocation, hrProfile.workLocation);
  recordAuditChange(auditChanges, 'emergencyContact', existingProfile?.emergencyContact, hrProfile.emergencyContact);
  recordAuditChange(auditChanges, 'personalInfo', existingProfile?.personalInfo, hrProfile.personalInfo);

  await logEmployeeAudit({
    userId,
    action: existingProfile ? 'HR_EMPLOYEE_UPDATED' : 'HR_EMPLOYEE_CREATED',
    resourceId: employeePositionId,
    businessId,
    employeeUserId: position.userId,
    employeeName: position.user?.name || position.user?.email || null,
    changes: auditChanges,
    force: true,
  });

  if (existingProfile) {
    await recordEmployeeUpdated({
      actorUserId: userId,
      businessId,
      employeeHrProfileId: hrProfile.id,
      employeePositionId,
    });
  } else {
    await recordEmployeeCreated({
      actorUserId: userId,
      businessId,
      employeeHrProfileId: hrProfile.id,
      employeePositionId,
    });
  }

  return { hrProfile, isUpdate: !!existingProfile };
}

export interface UpdateEmployeeProfileParams {
  businessId: string;
  userId: string;
  employeePositionId: string;
  hireDate?: string;
  employeeType?: PrismaEmployeeType;
  workLocation?: string;
  emergencyContactJson?: Prisma.InputJsonValue | null;
  personalInfoJson?: Prisma.InputJsonValue | null;
  fieldsProvided: {
    hireDate: boolean;
    employeeType: boolean;
    workLocation: boolean;
    emergencyContact: boolean;
    personalInfo: boolean;
  };
}

export async function updateEmployeeProfile(params: UpdateEmployeeProfileParams) {
  const {
    businessId,
    userId,
    employeePositionId,
    hireDate,
    employeeType,
    workLocation,
    emergencyContactJson,
    personalInfoJson,
    fieldsProvided,
  } = params;

  const position = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!position) {
    throw new HRWorkflowError(404, 'Employee position not found');
  }

  const existingProfile = await prisma.employeeHRProfile.findUnique({
    where: { employeePositionId },
  });

  if (!existingProfile) {
    throw new HRWorkflowError(404, 'HR profile not found for this employee');
  }

  const updateData: Record<string, unknown> = {};
  if (fieldsProvided.hireDate && hireDate !== undefined) updateData.hireDate = new Date(hireDate);
  if (fieldsProvided.employeeType && employeeType !== undefined) updateData.employeeType = employeeType;
  if (fieldsProvided.workLocation && workLocation !== undefined) updateData.workLocation = workLocation;
  if (fieldsProvided.emergencyContact) {
    updateData.emergencyContact = emergencyContactJson ?? Prisma.JsonNull;
  }
  if (fieldsProvided.personalInfo) {
    updateData.personalInfo = personalInfoJson ?? Prisma.JsonNull;
  }

  const updated = await prisma.employeeHRProfile.update({
    where: { employeePositionId },
    data: updateData,
  });

  const changes: AuditChangeMap = {};
  if (fieldsProvided.hireDate) {
    recordAuditChange(changes, 'hireDate', existingProfile.hireDate, updated.hireDate);
  }
  if (fieldsProvided.employeeType) {
    recordAuditChange(changes, 'employeeType', existingProfile.employeeType, updated.employeeType);
  }
  if (fieldsProvided.workLocation) {
    recordAuditChange(changes, 'workLocation', existingProfile.workLocation, updated.workLocation);
  }
  if (fieldsProvided.emergencyContact) {
    recordAuditChange(changes, 'emergencyContact', existingProfile.emergencyContact, updated.emergencyContact);
  }
  if (fieldsProvided.personalInfo) {
    recordAuditChange(changes, 'personalInfo', existingProfile.personalInfo, updated.personalInfo);
  }

  await logEmployeeAudit({
    userId,
    action: 'HR_EMPLOYEE_UPDATED',
    resourceId: employeePositionId,
    businessId,
    employeeUserId: position.userId,
    employeeName: position.user?.name || position.user?.email || null,
    changes,
  });

  await recordEmployeeUpdated({
    actorUserId: userId,
    businessId,
    employeeHrProfileId: updated.id,
    employeePositionId,
  });

  return { hrProfile: updated };
}

export interface TerminateEmployeeParams {
  businessId: string;
  userId: string;
  employeePositionId: string;
  terminationDate: Date;
  reason?: string;
  terminationNotes?: Prisma.InputJsonValue | null;
  notesProvided: boolean;
}

export async function terminateEmployee(params: TerminateEmployeeParams) {
  const {
    businessId,
    userId,
    employeePositionId,
    terminationDate,
    reason,
    terminationNotes,
    notesProvided,
  } = params;

  const employeePosition = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId, active: true },
    include: {
      hrProfile: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!employeePosition) {
    throw new HRWorkflowError(404, 'Active employee position not found');
  }

  const hrProfile = employeePosition.hrProfile
    ? employeePosition.hrProfile
    : await prisma.employeeHRProfile.create({
        data: {
          employeePositionId: employeePosition.id,
          businessId,
          hireDate: undefined,
        },
      });

  const terminationUpdateData: Prisma.EmployeeHRProfileUpdateInput = {
    employmentStatus: 'TERMINATED',
    terminationDate,
    terminationReason: reason || null,
    terminatedBy: userId,
  };

  if (notesProvided) {
    terminationUpdateData.terminationNotes = terminationNotes ?? Prisma.JsonNull;
  }

  const updatedProfile = await prisma.employeeHRProfile.update({
    where: { id: hrProfile.id },
    data: terminationUpdateData,
  });

  await employeeManagementService.deactivateEmployeePositionById(
    employeePosition.id,
    businessId,
    terminationDate
  );

  const terminationChanges: AuditChangeMap = {};
  recordAuditChange(terminationChanges, 'employmentStatus', hrProfile.employmentStatus, updatedProfile.employmentStatus);
  recordAuditChange(terminationChanges, 'terminationDate', hrProfile.terminationDate, updatedProfile.terminationDate);
  recordAuditChange(terminationChanges, 'terminationReason', hrProfile.terminationReason, updatedProfile.terminationReason);
  recordAuditChange(terminationChanges, 'terminationNotes', hrProfile.terminationNotes, updatedProfile.terminationNotes);
  recordAuditChange(terminationChanges, 'terminatedBy', hrProfile.terminatedBy, updatedProfile.terminatedBy);

  await logEmployeeAudit({
    userId,
    action: 'HR_EMPLOYEE_TERMINATED',
    resourceId: employeePositionId,
    businessId,
    employeeUserId: employeePosition.userId,
    employeeName: employeePosition.user?.name || employeePosition.user?.email || null,
    changes: terminationChanges,
    metadata: {
      terminationDate: terminationDate.toISOString(),
      terminationReason: reason || null,
      terminationNotes: notesProvided ? (terminationNotes ?? null) : undefined,
    },
  });

  await recordEmployeeTerminated({
    actorUserId: userId,
    businessId,
    employeeHrProfileId: updatedProfile.id,
    employeePositionId: employeePosition.id,
    terminationDate: terminationDate.toISOString(),
  });

  return {
    employeePositionId: employeePosition.id,
    terminationDate,
    positionVacant: true,
  };
}

export async function getTeamEmployees(businessId: string, managerUserId: string) {
  const { managerPositionId, directReportPositionIds } = await resolveManagerContext(
    businessId,
    managerUserId
  );

  if (!managerPositionId || directReportPositionIds.length === 0) {
    return { employees: [], count: 0 };
  }

  const teamEmployees = await prisma.employeePosition.findMany({
    where: {
      businessId,
      active: true,
      positionId: { in: directReportPositionIds },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      position: { include: { department: true, tier: true } },
      hrProfile: true,
    },
  });

  return { employees: teamEmployees, count: teamEmployees.length };
}

export async function getOwnHrData(businessId: string, userId: string) {
  const employeePosition = await prisma.employeePosition.findFirst({
    where: {
      userId,
      businessId,
      active: true,
    },
    include: {
      position: {
        include: {
          department: true,
          tier: true,
        },
      },
    },
  });

  if (!employeePosition) {
    const membership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        job: true,
      },
    });

    return {
      employee: membership
        ? {
            id: membership.id,
            user: membership.user,
            position: null,
            job: membership.job,
            active: true,
            metadata: {},
            stub: true,
          }
        : null,
      message: 'No active employee position found; returning fallback data.',
    };
  }

  return { employee: employeePosition, message: undefined };
}

export async function getEmployeeAuditLogs(businessId: string, employeePositionId: string) {
  const position = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!position) {
    throw new HRWorkflowError(404, 'Employee not found');
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      resourceType: 'HR_EMPLOYEE',
      resourceId: employeePositionId,
      OR: [
        { action: 'HR_EMPLOYEE_CREATED' },
        { action: 'HR_EMPLOYEE_UPDATED' },
        { action: 'HR_EMPLOYEE_TERMINATED' },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return { auditLogs };
}

export async function getDefaultOrganizationalTierId(businessId: string): Promise<string | null> {
  const defaultTier = await prisma.organizationalTier.findFirst({
    where: { businessId },
    orderBy: { level: 'asc' },
  });
  return defaultTier?.id ?? null;
}

export interface ImportEmployeeRow {
  row: number;
  name: string;
  email: string;
  title?: string;
  department?: string;
  hiredate?: string;
  employeetype?: string;
  worklocation?: string;
}

export interface ImportEmployeesFromCsvParams {
  businessId: string;
  assignedById: string;
  defaultTierId: string;
  rows: ImportEmployeeRow[];
}

export async function importEmployeesFromCsv(params: ImportEmployeesFromCsvParams) {
  return employeeManagementService.importEmployeesFromCSV(params);
}

export interface ExportEmployeesParams {
  businessId: string;
  status: string;
  q: string;
  departmentId?: string;
  positionId?: string;
}

export async function exportEmployeesToCsv(params: ExportEmployeesParams): Promise<string> {
  const { businessId, status, q, departmentId, positionId } = params;

  let employees: Array<{
    name: string;
    email: string;
    title: string;
    department: string;
    tier: string;
    hireDate: string | null;
    employeeType: string | null;
    workLocation: string | null;
  }> = [];

  if (status === 'TERMINATED') {
    const hrProfiles = await prisma.employeeHRProfile.findMany({
      where: {
        businessId,
        employmentStatus: EmploymentStatus.TERMINATED,
      },
      include: {
        employeePosition: {
          include: {
            user: true,
            position: {
              include: {
                department: true,
                tier: true,
              },
            },
          },
        },
      },
    });

    employees = hrProfiles.map((profile) => ({
      name: profile.employeePosition?.user?.name ?? '',
      email: profile.employeePosition?.user?.email ?? '',
      title: profile.employeePosition?.position?.title ?? '',
      department: profile.employeePosition?.position?.department?.name ?? '',
      tier: profile.employeePosition?.position?.tier?.name ?? '',
      hireDate: profile.hireDate ? profile.hireDate.toISOString().split('T')[0] : null,
      employeeType: profile.employeeType ?? null,
      workLocation: profile.workLocation ?? null,
    }));
  } else {
    const where: Record<string, unknown> = {
      businessId,
      active: true,
    };

    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { position: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (departmentId) {
      where.position = {
        ...((where.position as Record<string, unknown>) || {}),
        departmentId,
      };
    }

    if (positionId) {
      where.positionId = positionId;
    }

    const employeePositions = await prisma.employeePosition.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        position: { include: { department: true, tier: true } },
        hrProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    employees = employeePositions.map((ep) => ({
      name: ep.user?.name || '',
      email: ep.user?.email || '',
      title: ep.position?.title || '',
      department: ep.position?.department?.name || '',
      tier: ep.position?.tier?.name || '',
      hireDate: ep.hrProfile?.hireDate ? ep.hrProfile.hireDate.toISOString().split('T')[0] : null,
      employeeType: ep.hrProfile?.employeeType ?? null,
      workLocation: ep.hrProfile?.workLocation ?? null,
    }));
  }

  const headers = ['Name', 'Email', 'Title', 'Department', 'Tier', 'Hire Date', 'Employee Type', 'Work Location'];
  const csvRows = [
    headers.join(','),
    ...employees.map((emp) =>
      [
        `"${emp.name}"`,
        `"${emp.email}"`,
        `"${emp.title}"`,
        `"${emp.department}"`,
        `"${emp.tier}"`,
        emp.hireDate || '',
        emp.employeeType || '',
        emp.workLocation || '',
      ].join(',')
    ),
  ];

  return csvRows.join('\n');
}
