import { EmployeeType as PrismaEmployeeType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export type FieldValidationErrorDetails = {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
};

export class FieldValidationError extends Error {
  readonly field: string;
  readonly details?: FieldValidationErrorDetails;

  constructor(field: string, message: string, details?: FieldValidationErrorDetails) {
    super(message);
    this.name = 'FieldValidationError';
    this.field = field;
    this.details = details;
  }
}

export class HRWorkflowError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HRWorkflowError';
  }
}

const isJsonRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const parseJsonField = (
  value: unknown,
  fieldName: string
): Prisma.InputJsonValue | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!isJsonRecord(parsed)) {
        throw new FieldValidationError(fieldName, 'Must be a JSON object');
      }
      return parsed as Prisma.InputJsonValue;
    } catch (error) {
      if (error instanceof FieldValidationError) {
        throw error;
      }
      throw new FieldValidationError(fieldName, 'Must be valid JSON');
    }
  }

  if (isJsonRecord(value)) {
    return value as Prisma.InputJsonValue;
  }

  throw new FieldValidationError(fieldName, 'Must be a JSON object');
};

export type AuditChangeMap = Record<string, { before: unknown; after: unknown }>;

const toAuditValue = (input: unknown): unknown => {
  if (input === undefined) {
    return null;
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  return input;
};

export const recordAuditChange = (
  changes: AuditChangeMap,
  field: string,
  previous: unknown,
  next: unknown
) => {
  const beforeValue = toAuditValue(previous);
  const afterValue = toAuditValue(next);
  if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
    changes[field] = { before: beforeValue, after: afterValue };
  }
};

export const normalizeWorkingDays = (days?: string[]): string[] => {
  if (!days || days.length === 0) {
    return [];
  }

  const unique = new Set<string>();
  days.forEach((day) => {
    const normalized = day.trim().toUpperCase();
    if (normalized.length > 0) {
      unique.add(normalized);
    }
  });
  return Array.from(unique);
};

export const normalizeEmployeeTypeValue = (
  value?: string | null
): PrismaEmployeeType | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  const validTypes = Object.values(PrismaEmployeeType) as PrismaEmployeeType[];

  if (validTypes.includes(normalized as PrismaEmployeeType)) {
    return normalized as PrismaEmployeeType;
  }

  return undefined;
};

export const findActiveEmployeePositionId = async (
  businessId: string,
  userId: string
): Promise<string | null> => {
  const position = await prisma.employeePosition.findFirst({
    where: { businessId, userId, active: true },
    select: { id: true },
  });
  return position?.id ?? null;
};

/**
 * Employee → manager via Position.reportsTo → active manager EmployeePosition → User.
 * Business-scoped; does not guess when reportsTo or active occupant is missing.
 */
export type ManagerOccupancyResult =
  | {
      status: 'assigned';
      user: { userId: string; name: string | null; email: string };
    }
  | { status: 'no_reports_to' }
  | { status: 'no_active_occupant' }
  | { status: 'employee_position_not_found' };

export const resolveManagerOccupancyForEmployeePosition = async (
  employeePositionId: string,
  businessId: string
): Promise<ManagerOccupancyResult> => {
  const employeePosition = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId },
    select: {
      position: {
        select: {
          reportsToId: true,
          reportsTo: {
            select: {
              employeePositions: {
                where: { businessId, active: true },
                take: 1,
                select: {
                  userId: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!employeePosition?.position) {
    return { status: 'employee_position_not_found' };
  }

  if (!employeePosition.position.reportsToId) {
    return { status: 'no_reports_to' };
  }

  const occupant = employeePosition.position.reportsTo?.employeePositions?.[0];
  const user = occupant?.user;
  if (!occupant || !user?.email) {
    return { status: 'no_active_occupant' };
  }

  return {
    status: 'assigned',
    user: {
      userId: occupant.userId,
      name: user.name,
      email: user.email,
    },
  };
};

/** Manager userId for an employee's active position assignment (attendance / notifications). */
export const resolveManagerUserId = async (
  employeePositionId: string,
  businessId: string
): Promise<string | null> => {
  const occupancy = await resolveManagerOccupancyForEmployeePosition(
    employeePositionId,
    businessId
  );
  return occupancy.status === 'assigned' ? occupancy.user.userId : null;
};

export interface ManagerContext {
  managerPositionId: string | null;
  directReportPositionIds: string[];
  directReportEmployeePositionIds: string[];
}

export const resolveManagerContext = async (
  businessId: string,
  managerUserId: string
): Promise<ManagerContext> => {
  const managerPosition = await prisma.employeePosition.findFirst({
    where: {
      businessId,
      userId: managerUserId,
      active: true,
    },
    select: {
      id: true,
      positionId: true,
    },
  });

  if (!managerPosition?.positionId) {
    return {
      managerPositionId: null,
      directReportPositionIds: [],
      directReportEmployeePositionIds: [],
    };
  }

  const directReportPositions = await prisma.position.findMany({
    where: {
      businessId,
      reportsToId: managerPosition.positionId,
    },
    select: {
      id: true,
    },
  });

  const directReportPositionIds = directReportPositions.map((p) => p.id);

  if (directReportPositionIds.length === 0) {
    return {
      managerPositionId: managerPosition.id,
      directReportPositionIds,
      directReportEmployeePositionIds: [],
    };
  }

  const employeePositions = await prisma.employeePosition.findMany({
    where: {
      businessId,
      active: true,
      positionId: { in: directReportPositionIds },
    },
    select: { id: true },
  });

  return {
    managerPositionId: managerPosition.id,
    directReportPositionIds,
    directReportEmployeePositionIds: employeePositions.map((ep) => ep.id),
  };
};

type EmployeeAuditInput = {
  userId: string;
  action: 'HR_EMPLOYEE_CREATED' | 'HR_EMPLOYEE_UPDATED' | 'HR_EMPLOYEE_TERMINATED';
  resourceId: string;
  businessId: string;
  employeeUserId: string;
  employeeName: string | null;
  changes: AuditChangeMap;
  metadata?: Record<string, unknown>;
  force?: boolean;
};

export const logEmployeeAudit = async ({ force = false, changes, ...payload }: EmployeeAuditInput) => {
  if (!force && Object.keys(changes).length === 0) {
    return;
  }

  const details: Record<string, unknown> = {
    businessId: payload.businessId,
    employeeUserId: payload.employeeUserId,
    employeeName: payload.employeeName,
    changes,
  };

  if (payload.metadata) {
    details.metadata = payload.metadata;
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        resourceType: 'HR_EMPLOYEE',
        resourceId: payload.resourceId,
        details: JSON.stringify(details),
      },
    });
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error logging audit entry', {
      operation: 'hr_audit_log',
      error: { message: e.message, stack: e.stack },
    });
  }
};
