/**
 * HR attendance domain service.
 *
 * Attendance expectation templates (`AttendanceShiftTemplate`) are owned by HR — not
 * Scheduling `ShiftTemplate` or `ScheduleTemplate`. See
 * docs/business-operations/SHIFT_TEMPLATE_DOMAIN_DECISION.md (CO-08 / G08).
 */
import {
  AttendanceExceptionStatus,
  AttendanceExceptionType,
  AttendanceMethod,
  AttendanceRecordStatus,
  AttendanceShiftAssignmentStatus,
  Prisma
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';
import { recordAttendanceExceptionCreated } from './hrActivityService';
import { resolveManagerUserId } from './hrServiceShared';

type JsonInput = Prisma.InputJsonValue | null | undefined;

export interface AttendanceOverview {
  activeEmployees: number;
  todaysRecords: number;
  openExceptions: number;
  inProgressCount: number;
}

export interface RecordPunchParams {
  businessId: string;
  employeePositionId: string;
  method: AttendanceMethod;
  source?: string | null;
  location?: JsonInput;
  metadata?: JsonInput;
}

export interface ClockOutParams extends RecordPunchParams {
  recordId?: string;
}

export interface UpsertPolicyInput {
  id?: string;
  businessId: string;
  name: string;
  description?: string | null;
  timezone?: string | null;
  roundingIncrementMinutes?: number | null;
  gracePeriodMinutes?: number | null;
  autoClockOutAfterMinutes?: number | null;
  requireGeolocation?: boolean;
  geofenceRadiusMeters?: number | null;
  workingDays?: string[];
  metadata?: JsonInput;
  isDefault?: boolean;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  active?: boolean;
}

export interface ShiftTemplateInput {
  id?: string;
  businessId: string;
  name: string;
  description?: string | null;
  timezone?: string | null;
  startMinutes: number;
  endMinutes: number;
  breakMinutes?: number | null;
  daysOfWeek: string[];
  policyId?: string | null;
  metadata?: JsonInput;
  isActive?: boolean;
}

export interface ShiftTemplateFilters {
  businessId: string;
  includeInactive?: boolean;
}

export interface ShiftAssignmentInput {
  businessId: string;
  shiftTemplateId: string;
  employeePositionId: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status?: AttendanceShiftAssignmentStatus;
  isPrimary?: boolean;
  overrides?: JsonInput;
}

export interface ShiftAssignmentUpdateInput {
  businessId: string;
  assignmentId: string;
  status?: AttendanceShiftAssignmentStatus;
  effectiveTo?: Date | null;
  overrides?: JsonInput;
  isPrimary?: boolean;
}

export interface ShiftAssignmentListFilters {
  businessId: string;
  employeePositionIds?: string[];
  status?: AttendanceShiftAssignmentStatus[];
  includeInactiveTemplates?: boolean;
}

export async function getAttendanceOverview(businessId: string): Promise<AttendanceOverview> {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  const [activeEmployees, todaysRecords, openExceptions, inProgressCount] = await Promise.all([
    prisma.employeePosition.count({
      where: { businessId, active: true }
    }),
    prisma.attendanceRecord.count({
      where: { businessId, workDate: { gte: startOfDay, lt: endOfDay } }
    }),
    prisma.attendanceException.count({
      where: {
        businessId,
        status: { in: ['OPEN', 'UNDER_REVIEW'] }
      }
    }),
    prisma.attendanceRecord.count({
      where: { businessId, status: AttendanceRecordStatus.IN_PROGRESS }
    })
  ]);

  return { activeEmployees, todaysRecords, openExceptions, inProgressCount };
}

export async function listAttendancePolicies(businessId: string) {
  return prisma.attendancePolicy.findMany({
    where: { businessId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
}

export async function upsertAttendancePolicy(input: UpsertPolicyInput) {
  const {
    id,
    businessId,
    isDefault,
    workingDays,
    metadata,
    ...rest
  } = input;

  const data: Prisma.AttendancePolicyUncheckedCreateInput = {
    businessId,
    name: rest.name,
    description: rest.description ?? null,
    timezone: rest.timezone ?? null,
    roundingIncrementMinutes: rest.roundingIncrementMinutes ?? null,
    gracePeriodMinutes: rest.gracePeriodMinutes ?? null,
    autoClockOutAfterMinutes: rest.autoClockOutAfterMinutes ?? null,
    requireGeolocation: rest.requireGeolocation ?? false,
    geofenceRadiusMeters: rest.geofenceRadiusMeters ?? null,
    workingDays: workingDays ?? [],
    metadata: metadata ?? Prisma.JsonNull,
    isDefault: isDefault ?? false,
    effectiveFrom: rest.effectiveFrom ?? null,
    effectiveTo: rest.effectiveTo ?? null,
    active: rest.active ?? true
  };

  let policy;
  if (id) {
    policy = await prisma.attendancePolicy.update({
      where: { id, businessId },
      data
    });
  } else {
    policy = await prisma.attendancePolicy.create({ data });
  }

  if (policy.isDefault) {
    await prisma.attendancePolicy.updateMany({
      where: { businessId, id: { not: policy.id }, isDefault: true },
      data: { isDefault: false }
    });
  }

  return policy;
}

export async function ensureDefaultAttendancePolicy(businessId: string) {
  const existing = await prisma.attendancePolicy.findFirst({
    where: { businessId, active: true, isDefault: true }
  });

  if (existing) {
    return existing;
  }

  const fallback = await prisma.attendancePolicy.findFirst({
    where: { businessId, active: true },
    orderBy: { createdAt: 'asc' }
  });

  if (fallback) {
    return fallback;
  }

  logger.info('Creating default attendance policy', { businessId });
  return prisma.attendancePolicy.create({
    data: {
      businessId,
      name: 'Standard Attendance Policy',
      description: 'Automatically generated default attendance policy',
      timezone: 'UTC',
      gracePeriodMinutes: 5,
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      isDefault: true
    }
  });
}

export async function recordPunchIn(params: RecordPunchParams) {
  const { businessId, employeePositionId, method, source, location, metadata } = params;

  const position = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId, active: true },
    include: { user: { select: { id: true, name: true } } }
  });

  if (!position) {
    throw new Error('Active employee position not found for this business');
  }

  const openRecord = await prisma.attendanceRecord.findFirst({
    where: { businessId, employeePositionId, status: AttendanceRecordStatus.IN_PROGRESS },
    orderBy: { createdAt: 'desc' }
  });

  if (openRecord) {
    throw new Error('Employee already has an in-progress attendance record');
  }

  const policy = await ensureDefaultAttendancePolicy(businessId);
  const now = new Date();
  const workDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const record = await prisma.attendanceRecord.create({
    data: {
      businessId,
      employeePositionId,
      policyId: policy?.id,
      workDate,
      clockInTime: now,
      clockInMethod: method,
      clockInSource: source ?? null,
      clockInLocation: location ?? Prisma.JsonNull,
      metadata: metadata ?? Prisma.JsonNull,
      status: AttendanceRecordStatus.IN_PROGRESS
    }
  });

  logger.info('Attendance punch-in recorded', {
    businessId,
    employeePositionId,
    recordId: record.id,
    method,
    source
  });

  // NOTE: Attendance exceptions are typically created by background jobs or policy enforcement.
  // Use createAttendanceException for the canonical write + activity path.

  return record;
}

export interface CreateAttendanceExceptionInput {
  businessId: string;
  employeePositionId: string;
  type: AttendanceExceptionType;
  actorUserId: string;
  attendanceRecordId?: string | null;
  policyId?: string | null;
  detectedSource?: string | null;
  details?: JsonInput;
  metadata?: JsonInput;
}

export async function createAttendanceException(input: CreateAttendanceExceptionInput) {
  const exception = await prisma.attendanceException.create({
    data: {
      businessId: input.businessId,
      employeePositionId: input.employeePositionId,
      type: input.type,
      attendanceRecordId: input.attendanceRecordId ?? null,
      policyId: input.policyId ?? null,
      detectedById: input.actorUserId,
      detectedSource: input.detectedSource ?? null,
      details: input.details ?? Prisma.JsonNull,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });

  await recordAttendanceExceptionCreated({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    exceptionId: exception.id,
    employeePositionId: input.employeePositionId,
    type: input.type,
  });

  await notifyAttendanceExceptionStakeholders(input, exception.id);

  return exception;
}

const HR_WORKSPACE = (businessId: string) => `/business/${businessId}/workspace/hr/me`;

async function resolveEmployeeUserId(employeePositionId: string): Promise<string | null> {
  const position = await prisma.employeePosition.findUnique({
    where: { id: employeePositionId },
    select: { userId: true },
  });
  return position?.userId ?? null;
}

async function notifyAttendanceExceptionStakeholders(
  input: CreateAttendanceExceptionInput,
  exceptionId: string
): Promise<void> {
  try {
    const employeeUserId = await resolveEmployeeUserId(input.employeePositionId);
    const managerUserId = await resolveManagerUserId(input.employeePositionId, input.businessId);

    if (input.type === AttendanceExceptionType.MISSED_PUNCH && employeeUserId) {
      await NotificationService.createNotification({
        userId: employeeUserId,
        type: 'hr_attendance_missing_punch',
        title: 'Missing punch detected',
        body: 'A missing punch was recorded on your attendance.',
        data: {
          businessId: input.businessId,
          exceptionId,
          employeePositionId: input.employeePositionId,
          actionUrl: HR_WORKSPACE(input.businessId),
        },
      });
    } else if (
      (input.type === AttendanceExceptionType.GEO_VIOLATION ||
        input.type === AttendanceExceptionType.POLICY_OVERRIDE) &&
      employeeUserId
    ) {
      await NotificationService.createNotification({
        userId: employeeUserId,
        type: 'hr_attendance_policy_violation',
        title: 'Attendance policy violation',
        body: 'An attendance policy violation was detected on your record.',
        data: {
          businessId: input.businessId,
          exceptionId,
          employeePositionId: input.employeePositionId,
          type: input.type,
          actionUrl: HR_WORKSPACE(input.businessId),
        },
      });
    }

    if (managerUserId && managerUserId !== input.actorUserId) {
      await NotificationService.createNotification({
        userId: managerUserId,
        type: 'hr_attendance_exception_created',
        title: 'Attendance exception created',
        body: `A new attendance exception (${input.type}) requires review.`,
        data: {
          businessId: input.businessId,
          exceptionId,
          employeePositionId: input.employeePositionId,
          type: input.type,
          actionUrl: `/business/${input.businessId}/workspace/hr`,
        },
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Failed to send attendance exception notification', {
      operation: 'attendance_exception_notification_error',
      exceptionId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyAttendancePolicyViolation(params: {
  businessId: string;
  employeePositionId: string;
  exceptionId: string;
  actorUserId: string;
}): Promise<void> {
  await notifyAttendanceExceptionStakeholders(
    {
      businessId: params.businessId,
      employeePositionId: params.employeePositionId,
      type: AttendanceExceptionType.POLICY_OVERRIDE,
      actorUserId: params.actorUserId,
    },
    params.exceptionId
  );
}

export async function notifyAttendanceMissingPunch(params: {
  businessId: string;
  employeePositionId: string;
  exceptionId: string;
  actorUserId: string;
}): Promise<void> {
  await notifyAttendanceExceptionStakeholders(
    {
      businessId: params.businessId,
      employeePositionId: params.employeePositionId,
      type: AttendanceExceptionType.MISSED_PUNCH,
      actorUserId: params.actorUserId,
    },
    params.exceptionId
  );
}

export async function recordPunchOut(params: ClockOutParams) {
  const { businessId, employeePositionId, method, source, location, metadata, recordId } = params;

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      businessId,
      employeePositionId,
      status: AttendanceRecordStatus.IN_PROGRESS,
      ...(recordId ? { id: recordId } : {})
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    throw new Error('No in-progress attendance record found to complete');
  }

  const now = new Date();
  let durationMinutes: number | null = null;

  if (record.clockInTime) {
    durationMinutes = Math.max(
      0,
      Math.round((now.getTime() - record.clockInTime.getTime()) / 60000)
    );
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutTime: now,
      clockOutMethod: method,
      clockOutSource: source ?? null,
      clockOutLocation: location ?? Prisma.JsonNull,
      metadata: metadata ?? record.metadata ?? Prisma.JsonNull,
      status: AttendanceRecordStatus.COMPLETED,
      durationMinutes,
      varianceMinutes: record.varianceMinutes ?? null
    }
  });

  logger.info('Attendance punch-out recorded', {
    businessId,
    employeePositionId,
    recordId: record.id,
    method,
    source
  });

  return updated;
}

export async function listEmployeeAttendanceRecords(
  businessId: string,
  employeePositionId: string,
  limit = 30
) {
  return prisma.attendanceRecord.findMany({
    where: { businessId, employeePositionId },
    orderBy: { workDate: 'desc' },
    take: limit
  });
}

// -----------------------------------------------------------------------------
// Attendance Exceptions (Manager tools)
// -----------------------------------------------------------------------------

export interface AttendanceExceptionListParams {
  businessId: string;
  employeePositionIds: string[];
  statuses?: AttendanceExceptionStatus[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceExceptionListResult {
  exceptions: Awaited<ReturnType<typeof prisma.attendanceException.findMany>>;
  total: number;
  page: number;
  pageSize: number;
}

export async function listAttendanceExceptionsForManager(
  params: AttendanceExceptionListParams
): Promise<AttendanceExceptionListResult> {
  const {
    businessId,
    employeePositionIds,
    statuses,
    startDate,
    endDate,
    search,
    page = 1,
    pageSize = 20
  } = params;

  const sanitizedPage = Math.max(1, page);
  const sanitizedPageSize = Math.min(100, Math.max(1, pageSize));

  if (!employeePositionIds.length) {
    return {
      exceptions: [],
      total: 0,
      page: sanitizedPage,
      pageSize: sanitizedPageSize
    };
  }

  const where: Prisma.AttendanceExceptionWhereInput = {
    businessId,
    employeePositionId: { in: employeePositionIds }
  };

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (startDate || endDate) {
    where.detectedAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {})
    };
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    const existingAndConditions = Array.isArray(where.AND)
      ? where.AND
      : where.AND
      ? [where.AND]
      : [];
    where.AND = [
      ...existingAndConditions,
      {
        OR: [
          {
            employeePosition: {
              user: {
                name: {
                  contains: term,
                  mode: 'insensitive'
                }
              }
            }
          },
          {
            employeePosition: {
              user: {
                email: {
                  contains: term,
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
      }
    ];
  }

  const [total, exceptions] = await Promise.all([
    prisma.attendanceException.count({ where }),
    prisma.attendanceException.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      skip: (sanitizedPage - 1) * sanitizedPageSize,
      take: sanitizedPageSize,
      include: {
        employeePosition: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            position: {
              include: {
                department: { select: { id: true, name: true } },
                tier: { select: { id: true, name: true } }
              }
            }
          }
        },
        attendanceRecord: true,
        policy: { select: { id: true, name: true } }
      }
    })
  ]);

  return {
    exceptions,
    total,
    page: sanitizedPage,
    pageSize: sanitizedPageSize
  };
}

export interface ResolveAttendanceExceptionInput {
  businessId: string;
  exceptionId: string;
  managerUserId: string;
  status: AttendanceExceptionStatus;
  resolutionNote?: string | null;
  managerNote?: string | null;
  resolutionPayload?: Prisma.InputJsonValue | null;
  attendanceAdjustments?: {
    clockInTime?: Date | null;
    clockOutTime?: Date | null;
    status?: AttendanceRecordStatus;
    varianceMinutes?: number | null;
  };
}

export async function resolveAttendanceException({
  businessId,
  exceptionId,
  managerUserId,
  status,
  resolutionNote,
  managerNote,
  resolutionPayload,
  attendanceAdjustments
}: ResolveAttendanceExceptionInput) {
  const exception = await prisma.attendanceException.findFirst({
    where: { id: exceptionId, businessId },
    include: {
      attendanceRecord: true
    }
  });

  if (!exception) {
    throw new Error('Attendance exception not found');
  }

  const now = new Date();

  const updatedException = await prisma.attendanceException.update({
    where: { id: exceptionId },
    data: {
      status,
      resolvedById: managerUserId,
      resolvedAt: now,
      resolutionNote: resolutionNote ?? null,
      managerNote: managerNote ?? exception.managerNote ?? null,
      resolutionPayload: resolutionPayload ?? Prisma.JsonNull,
      updatedAt: now
    },
    include: {
      attendanceRecord: {
        include: {
          employeePosition: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              position: {
                include: {
                  reportsTo: {
                    include: {
                      employeePositions: {
                        where: { businessId, active: true },
                        include: {
                          user: { select: { id: true, name: true, email: true } }
                        },
                        take: 1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (attendanceAdjustments && exception.attendanceRecordId) {
    const recordUpdate: Prisma.AttendanceRecordUpdateInput = {};

    if ('clockInTime' in attendanceAdjustments) {
      recordUpdate.clockInTime = attendanceAdjustments.clockInTime ?? null;
    }
    if ('clockOutTime' in attendanceAdjustments) {
      recordUpdate.clockOutTime = attendanceAdjustments.clockOutTime ?? null;
    }
    if (attendanceAdjustments.status) {
      recordUpdate.status = attendanceAdjustments.status;
    }
    if ('varianceMinutes' in attendanceAdjustments) {
      recordUpdate.varianceMinutes = attendanceAdjustments.varianceMinutes ?? null;
    }

    if (Object.keys(recordUpdate).length > 0) {
      await prisma.attendanceRecord.update({
        where: { id: exception.attendanceRecordId },
        data: recordUpdate
      });
    }

    // If no other open exceptions remain for this record, clear the flag
    if (exception.attendanceRecordId) {
      const openCount = await prisma.attendanceException.count({
        where: {
          attendanceRecordId: exception.attendanceRecordId,
          status: { in: [AttendanceExceptionStatus.OPEN, AttendanceExceptionStatus.UNDER_REVIEW] }
        }
      });

      if (openCount === 0) {
        await prisma.attendanceRecord.update({
          where: { id: exception.attendanceRecordId },
          data: { exceptionFlagged: false }
        });
      }
    }
  }

  // Notify employee when exception is resolved
  try {
    const employeeUserId = updatedException.attendanceRecord?.employeePosition?.user?.id;
    if (employeeUserId && status === AttendanceExceptionStatus.RESOLVED) {
      const managerName = updatedException.attendanceRecord?.employeePosition?.position?.reportsTo?.employeePositions?.[0]?.user?.name || 'Your manager';
      
      await NotificationService.createNotification({
        userId: employeeUserId,
        type: 'hr_attendance_exception_resolved',
        title: 'Attendance Exception Resolved',
        body: `${managerName} has resolved your attendance exception: ${exception.type}.${resolutionNote ? ` Note: ${resolutionNote}` : ''}`,
        data: {
          exceptionId: updatedException.id,
          businessId,
          type: exception.type,
          actionUrl: `/business/${businessId}/workspace/hr/me`
        }
      });
    }
  } catch (notificationError) {
    // Don't fail resolution if notification fails
    await logger.warn('Failed to send exception resolution notification', {
      operation: 'attendance_exception_notification_error',
      exceptionId: updatedException.id,
      error: {
        message: notificationError instanceof Error ? notificationError.message : 'Unknown error',
        stack: notificationError instanceof Error ? notificationError.stack : undefined
      }
    });
  }

  return updatedException;
}


// -----------------------------------------------------------------------------
// Attendance expectation templates & assignments (AttendanceShiftTemplate — HR only)
// Product term: Attendance Expectation Template. Not Scheduling ShiftTemplate.
// -----------------------------------------------------------------------------

const validateShiftWindow = (startMinutes: number, endMinutes: number) => {
  if (startMinutes < 0 || startMinutes > 24 * 60) {
    throw new Error('startMinutes must be between 0 and 1440');
  }
  if (endMinutes < 0 || endMinutes > 24 * 60) {
    throw new Error('endMinutes must be between 0 and 1440');
  }
  if (endMinutes <= startMinutes) {
    throw new Error('endMinutes must be greater than startMinutes');
  }
};

/** Lists HR attendance expectation templates (`AttendanceShiftTemplate`). */
export async function listShiftTemplates(filters: ShiftTemplateFilters) {
  const { businessId, includeInactive } = filters;

  return prisma.attendanceShiftTemplate.findMany({
    where: {
      businessId,
      ...(includeInactive ? {} : { isActive: true })
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
  });
}

/** Creates or updates an HR attendance expectation template — not a Scheduling shift template. */
export async function upsertShiftTemplate(input: ShiftTemplateInput) {
  const {
    id,
    businessId,
    name,
    description,
    timezone,
    startMinutes,
    endMinutes,
    breakMinutes,
    daysOfWeek,
    policyId,
    metadata,
    isActive
  } = input;

  validateShiftWindow(startMinutes, endMinutes);

  const data: Prisma.AttendanceShiftTemplateUncheckedCreateInput = {
    businessId,
    name,
    description: description ?? null,
    timezone: timezone ?? null,
    startMinutes,
    endMinutes,
    breakMinutes: breakMinutes ?? null,
    daysOfWeek,
    policyId: policyId ?? null,
    metadata: metadata ?? Prisma.JsonNull,
    isActive: isActive ?? true
  };

  if (id) {
    return prisma.attendanceShiftTemplate.update({
      where: { id, businessId },
      data
    });
  }

  return prisma.attendanceShiftTemplate.create({ data });
}

export async function archiveShiftTemplate(businessId: string, templateId: string) {
  return prisma.attendanceShiftTemplate.update({
    where: { id: templateId, businessId },
    data: { isActive: false }
  });
}

const assignmentsOverlap = (
  existing: { effectiveFrom: Date; effectiveTo: Date | null },
  incoming: { effectiveFrom: Date; effectiveTo?: Date | null }
) => {
  const incomingEnd = incoming.effectiveTo ?? null;
  const existingEnd = existing.effectiveTo ?? null;

  if (existingEnd && incomingEnd && existingEnd < incoming.effectiveFrom) {
    return false;
  }
  if (incomingEnd && existing.effectiveFrom > incomingEnd) {
    return false;
  }

  if (existingEnd && incoming.effectiveFrom > existingEnd) {
    return false;
  }

  return true;
};

export async function listShiftAssignments(filters: ShiftAssignmentListFilters) {
  const { businessId, employeePositionIds, status, includeInactiveTemplates } = filters;

  return prisma.attendanceShiftAssignment.findMany({
    where: {
      businessId,
      ...(employeePositionIds && employeePositionIds.length
        ? { employeePositionId: { in: employeePositionIds } }
        : {}),
      ...(status && status.length ? { status: { in: status } } : {})
    },
    orderBy: [{ status: 'desc' }, { effectiveFrom: 'desc' }],
    include: {
      shiftTemplate: {
        include: {
          policy: true
        }
      },
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          position: {
            include: {
              department: { select: { id: true, name: true } },
              tier: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  }).then((assignments) =>
    includeInactiveTemplates
      ? assignments
      : assignments.filter((assignment) => assignment.shiftTemplate?.isActive !== false)
  );
}

export async function assignShiftToEmployee(input: ShiftAssignmentInput) {
  const {
    businessId,
    shiftTemplateId,
    employeePositionId,
    effectiveFrom,
    effectiveTo,
    status,
    isPrimary,
    overrides
  } = input;

  const template = await prisma.attendanceShiftTemplate.findFirst({
    where: { id: shiftTemplateId, businessId, isActive: true }
  });

  if (!template) {
    throw new Error('Shift template not found or inactive');
  }

  const existingAssignments = await prisma.attendanceShiftAssignment.findMany({
    where: {
      businessId,
      employeePositionId,
      status: { in: [AttendanceShiftAssignmentStatus.ACTIVE, AttendanceShiftAssignmentStatus.SUSPENDED] }
    },
    select: {
      id: true,
      effectiveFrom: true,
      effectiveTo: true
    }
  });

  const overlaps = existingAssignments.some((assignment) =>
    assignmentsOverlap(assignment, { effectiveFrom, effectiveTo: effectiveTo ?? null })
  );

  if (overlaps) {
    throw new Error('Employee already has an overlapping shift assignment');
  }

  return prisma.attendanceShiftAssignment.create({
    data: {
      businessId,
      shiftTemplateId,
      employeePositionId,
      effectiveFrom,
      effectiveTo: effectiveTo ?? null,
      status: status ?? AttendanceShiftAssignmentStatus.ACTIVE,
      isPrimary: isPrimary ?? true,
      overrides: overrides ?? Prisma.JsonNull
    },
    include: {
      shiftTemplate: true
    }
  });
}

export async function updateShiftAssignment(input: ShiftAssignmentUpdateInput) {
  const { businessId, assignmentId, status, effectiveTo, overrides, isPrimary } = input;

  const data: Prisma.AttendanceShiftAssignmentUpdateInput = {};

  if (status) {
    data.status = status;
  }

  if (effectiveTo !== undefined) {
    data.effectiveTo = effectiveTo ?? null;
  }

  if (overrides !== undefined) {
    data.overrides = overrides ?? Prisma.JsonNull;
  }

  if (isPrimary !== undefined) {
    data.isPrimary = isPrimary;
  }

  if (Object.keys(data).length === 0) {
    return prisma.attendanceShiftAssignment.findFirst({
      where: { id: assignmentId, businessId },
      include: {
        shiftTemplate: true
      }
    });
  }

  return prisma.attendanceShiftAssignment.update({
    where: { id: assignmentId, businessId },
    data,
    include: {
      shiftTemplate: true
    }
  });
}

export async function getUpcomingShiftsForEmployee(
  businessId: string,
  employeePositionId: string,
  { asOf = new Date(), windowDays = 30 }: { asOf?: Date; windowDays?: number } = {}
) {
  const windowEnd = new Date(asOf);
  windowEnd.setDate(windowEnd.getDate() + windowDays);

  return prisma.attendanceShiftAssignment.findMany({
    where: {
      businessId,
      employeePositionId,
      status: AttendanceShiftAssignmentStatus.ACTIVE,
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: asOf } }
      ],
      effectiveFrom: { lte: windowEnd }
    },
    orderBy: { effectiveFrom: 'asc' },
    include: {
      shiftTemplate: {
        include: { policy: true }
      }
    }
  });
}

const attendanceExceptionDetailsInclude = {
  employeePosition: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      position: {
        include: {
          department: { select: { id: true, name: true } },
          tier: { select: { id: true, name: true } },
        },
      },
    },
  },
  attendanceRecord: true,
  policy: { select: { id: true, name: true } },
} satisfies Prisma.AttendanceExceptionInclude;

export async function getAttendanceExceptionWithDetails(exceptionId: string, businessId: string) {
  return prisma.attendanceException.findUnique({
    where: { id: exceptionId },
    include: attendanceExceptionDetailsInclude,
  });
}

export interface ResolveTeamAttendanceExceptionParams {
  businessId: string;
  exceptionId: string;
  managerUserId: string;
  directReportEmployeePositionIds: string[];
  status: AttendanceExceptionStatus;
  resolutionNote?: string | null;
  managerNote?: string | null;
  resolutionPayload?: Prisma.InputJsonValue | null;
  attendanceAdjustments?: ResolveAttendanceExceptionInput['attendanceAdjustments'];
}

export async function resolveTeamAttendanceExceptionForManager(
  params: ResolveTeamAttendanceExceptionParams
) {
  const {
    businessId,
    exceptionId,
    managerUserId,
    directReportEmployeePositionIds,
    status,
    resolutionNote,
    managerNote,
    resolutionPayload,
    attendanceAdjustments,
  } = params;

  if (directReportEmployeePositionIds.length === 0) {
    throw new Error('Not authorized to resolve this exception');
  }

  const existingException = await prisma.attendanceException.findFirst({
    where: {
      id: exceptionId,
      businessId,
    },
    select: {
      id: true,
      employeePositionId: true,
      status: true,
    },
  });

  if (!existingException) {
    throw new Error('Attendance exception not found');
  }

  if (!directReportEmployeePositionIds.includes(existingException.employeePositionId)) {
    throw new Error('Not authorized to resolve this exception');
  }

  await resolveAttendanceException({
    businessId,
    exceptionId,
    managerUserId,
    status,
    resolutionNote: resolutionNote ?? null,
    managerNote: managerNote ?? null,
    resolutionPayload,
    attendanceAdjustments,
  });

  return getAttendanceExceptionWithDetails(exceptionId, businessId);
}


