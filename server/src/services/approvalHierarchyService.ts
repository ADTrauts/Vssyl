import type { ManagerApprovalHierarchy, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const hierarchyInclude = {
  employeePosition: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: { select: { id: true, title: true, departmentId: true } },
    },
  },
  managerPosition: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: { select: { id: true, title: true, departmentId: true } },
    },
  },
} satisfies Prisma.ManagerApprovalHierarchyInclude;

export type ApprovalHierarchyWithRelations = Prisma.ManagerApprovalHierarchyGetPayload<{
  include: typeof hierarchyInclude;
}>;

export class ApprovalHierarchyValidationError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message);
    this.name = 'ApprovalHierarchyValidationError';
  }
}

export interface CreateApprovalHierarchyInput {
  businessId: string;
  employeePositionId: string;
  managerPositionId: string;
  approvalTypes: string[];
  approvalLevel?: number;
  isPrimary?: boolean;
  active?: boolean;
}

export interface UpdateApprovalHierarchyInput {
  approvalTypes?: string[];
  approvalLevel?: number;
  isPrimary?: boolean;
  active?: boolean;
}

export interface AssignApprovalHierarchyInput {
  businessId: string;
  managerPositionId: string;
  approvalTypes: string[];
  approvalLevel?: number;
  isPrimary?: boolean;
  active?: boolean;
}

export interface AssignToEmployeeInput extends AssignApprovalHierarchyInput {
  employeePositionId: string;
}

export interface AssignToPositionInput extends AssignApprovalHierarchyInput {
  positionId: string;
}

export interface AssignToDepartmentInput extends AssignApprovalHierarchyInput {
  departmentId: string;
}

export interface ApprovalHierarchyValidationIssue {
  code: string;
  message: string;
  hierarchyId?: string;
  employeePositionId?: string;
  managerPositionId?: string;
}

export interface ApprovalHierarchyValidationResult {
  valid: boolean;
  issues: ApprovalHierarchyValidationIssue[];
}

export interface ApprovalChainResolution {
  businessId: string;
  employeePositionId: string;
  approvalType?: string;
  chain: ApprovalHierarchyWithRelations[];
}

export interface BulkAssignResult {
  entriesCreated: number;
  entriesUpdated: number;
  entries: ApprovalHierarchyWithRelations[];
}

async function assertActiveEmployeePosition(
  employeePositionId: string,
  businessId: string,
  label = 'Employee position'
): Promise<void> {
  const row = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId, active: true },
    select: { id: true },
  });
  if (!row) {
    throw new ApprovalHierarchyValidationError(`${label} not found or inactive in business`);
  }
}

function assertDistinctPositions(employeePositionId: string, managerPositionId: string): void {
  if (employeePositionId === managerPositionId) {
    throw new ApprovalHierarchyValidationError('Employee and manager positions must be different');
  }
}

function normalizeApprovalTypes(approvalTypes: string[]): string[] {
  const trimmed = approvalTypes.map((t) => t.trim()).filter((t) => t.length > 0);
  if (trimmed.length === 0) {
    throw new ApprovalHierarchyValidationError('At least one approval type is required');
  }
  return [...new Set(trimmed)];
}

async function upsertHierarchyEntry(
  input: CreateApprovalHierarchyInput
): Promise<{ entry: ApprovalHierarchyWithRelations; created: boolean }> {
  const approvalTypes = normalizeApprovalTypes(input.approvalTypes);
  await assertActiveEmployeePosition(input.employeePositionId, input.businessId, 'Employee position');
  await assertActiveEmployeePosition(input.managerPositionId, input.businessId, 'Manager position');
  assertDistinctPositions(input.employeePositionId, input.managerPositionId);

  const existing = await prisma.managerApprovalHierarchy.findUnique({
    where: {
      employeePositionId_managerPositionId_businessId: {
        employeePositionId: input.employeePositionId,
        managerPositionId: input.managerPositionId,
        businessId: input.businessId,
      },
    },
  });

  if (existing) {
    const entry = await prisma.managerApprovalHierarchy.update({
      where: { id: existing.id },
      data: {
        approvalTypes,
        approvalLevel: input.approvalLevel ?? existing.approvalLevel,
        isPrimary: input.isPrimary ?? existing.isPrimary,
        active: input.active ?? true,
      },
      include: hierarchyInclude,
    });
    return { entry, created: false };
  }

  const entry = await prisma.managerApprovalHierarchy.create({
    data: {
      businessId: input.businessId,
      employeePositionId: input.employeePositionId,
      managerPositionId: input.managerPositionId,
      approvalTypes,
      approvalLevel: input.approvalLevel ?? 1,
      isPrimary: input.isPrimary ?? true,
      active: input.active ?? true,
    },
    include: hierarchyInclude,
  });
  return { entry, created: true };
}

export async function listApprovalHierarchies(
  businessId: string,
  filters?: { employeePositionId?: string; activeOnly?: boolean }
): Promise<ApprovalHierarchyWithRelations[]> {
  return prisma.managerApprovalHierarchy.findMany({
    where: {
      businessId,
      ...(filters?.employeePositionId ? { employeePositionId: filters.employeePositionId } : {}),
      ...(filters?.activeOnly ? { active: true } : {}),
    },
    include: hierarchyInclude,
    orderBy: [{ employeePositionId: 'asc' }, { approvalLevel: 'asc' }],
  });
}

export async function getApprovalHierarchyById(id: string): Promise<ApprovalHierarchyWithRelations | null> {
  return prisma.managerApprovalHierarchy.findUnique({
    where: { id },
    include: hierarchyInclude,
  });
}

export async function createApprovalHierarchy(
  input: CreateApprovalHierarchyInput
): Promise<ApprovalHierarchyWithRelations> {
  const { entry } = await upsertHierarchyEntry(input);
  return entry;
}

export async function updateApprovalHierarchy(
  id: string,
  input: UpdateApprovalHierarchyInput
): Promise<ApprovalHierarchyWithRelations> {
  const existing = await prisma.managerApprovalHierarchy.findUnique({ where: { id } });
  if (!existing) {
    throw new ApprovalHierarchyValidationError('Approval hierarchy entry not found', 404);
  }

  const data: Prisma.ManagerApprovalHierarchyUpdateInput = {};
  if (input.approvalTypes !== undefined) {
    data.approvalTypes = normalizeApprovalTypes(input.approvalTypes);
  }
  if (input.approvalLevel !== undefined) {
    data.approvalLevel = input.approvalLevel;
  }
  if (input.isPrimary !== undefined) {
    data.isPrimary = input.isPrimary;
  }
  if (input.active !== undefined) {
    data.active = input.active;
  }

  return prisma.managerApprovalHierarchy.update({
    where: { id },
    data,
    include: hierarchyInclude,
  });
}

export async function deleteApprovalHierarchy(id: string): Promise<ManagerApprovalHierarchy> {
  const existing = await prisma.managerApprovalHierarchy.findUnique({ where: { id } });
  if (!existing) {
    throw new ApprovalHierarchyValidationError('Approval hierarchy entry not found', 404);
  }
  return prisma.managerApprovalHierarchy.delete({ where: { id } });
}

export async function assignApprovalHierarchyToEmployee(
  input: AssignToEmployeeInput
): Promise<BulkAssignResult> {
  const { entry, created } = await upsertHierarchyEntry(input);
  return {
    entriesCreated: created ? 1 : 0,
    entriesUpdated: created ? 0 : 1,
    entries: [entry],
  };
}

async function getActiveEmployeePositionsForPosition(
  businessId: string,
  positionId: string
): Promise<string[]> {
  const position = await prisma.position.findFirst({
    where: { id: positionId, businessId },
    select: { id: true },
  });
  if (!position) {
    throw new ApprovalHierarchyValidationError('Position not found in business');
  }

  const rows = await prisma.employeePosition.findMany({
    where: { businessId, positionId, active: true },
    select: { id: true },
  });
  if (rows.length === 0) {
    throw new ApprovalHierarchyValidationError('No active employees assigned to position');
  }
  return rows.map((r) => r.id);
}

async function getActiveEmployeePositionsForDepartment(
  businessId: string,
  departmentId: string
): Promise<string[]> {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, businessId },
    select: { id: true },
  });
  if (!department) {
    throw new ApprovalHierarchyValidationError('Department not found in business');
  }

  const rows = await prisma.employeePosition.findMany({
    where: {
      businessId,
      active: true,
      position: { departmentId },
    },
    select: { id: true },
  });
  if (rows.length === 0) {
    throw new ApprovalHierarchyValidationError('No active employees in department');
  }
  return rows.map((r) => r.id);
}

export async function assignApprovalHierarchyToPosition(
  input: AssignToPositionInput
): Promise<BulkAssignResult> {
  const employeePositionIds = await getActiveEmployeePositionsForPosition(input.businessId, input.positionId);
  return bulkAssignToEmployeePositions(input, employeePositionIds);
}

export async function assignApprovalHierarchyToDepartment(
  input: AssignToDepartmentInput
): Promise<BulkAssignResult> {
  const employeePositionIds = await getActiveEmployeePositionsForDepartment(
    input.businessId,
    input.departmentId
  );
  return bulkAssignToEmployeePositions(input, employeePositionIds);
}

async function bulkAssignToEmployeePositions(
  input: AssignApprovalHierarchyInput,
  employeePositionIds: string[]
): Promise<BulkAssignResult> {
  let entriesCreated = 0;
  let entriesUpdated = 0;
  const entries: ApprovalHierarchyWithRelations[] = [];

  for (const employeePositionId of employeePositionIds) {
    const { entry, created } = await upsertHierarchyEntry({
      ...input,
      employeePositionId,
    });
    entries.push(entry);
    if (created) {
      entriesCreated += 1;
    } else {
      entriesUpdated += 1;
    }
  }

  return { entriesCreated, entriesUpdated, entries };
}

export async function resolveApprovalChain(
  businessId: string,
  employeePositionId: string,
  approvalType?: string
): Promise<ApprovalChainResolution> {
  await assertActiveEmployeePosition(employeePositionId, businessId);

  const chain = await prisma.managerApprovalHierarchy.findMany({
    where: {
      businessId,
      employeePositionId,
      active: true,
      ...(approvalType ? { approvalTypes: { has: approvalType } } : {}),
    },
    include: hierarchyInclude,
    orderBy: [{ approvalLevel: 'asc' }, { isPrimary: 'desc' }],
  });

  return {
    businessId,
    employeePositionId,
    approvalType,
    chain,
  };
}

export async function validateApprovalHierarchyIntegrity(
  businessId: string
): Promise<ApprovalHierarchyValidationResult> {
  const issues: ApprovalHierarchyValidationIssue[] = [];
  const entries = await prisma.managerApprovalHierarchy.findMany({
    where: { businessId },
    select: {
      id: true,
      employeePositionId: true,
      managerPositionId: true,
      approvalTypes: true,
      approvalLevel: true,
      isPrimary: true,
      active: true,
    },
  });

  const employeePositionIds = [...new Set(entries.map((e) => e.employeePositionId))];
  const managerPositionIds = [...new Set(entries.map((e) => e.managerPositionId))];
  const allPositionIds = [...new Set([...employeePositionIds, ...managerPositionIds])];

  const validPositions = await prisma.employeePosition.findMany({
    where: { businessId, id: { in: allPositionIds } },
    select: { id: true, active: true },
  });
  const positionMap = new Map(validPositions.map((p) => [p.id, p]));

  for (const entry of entries) {
    if (entry.employeePositionId === entry.managerPositionId) {
      issues.push({
        code: 'SELF_APPROVAL',
        message: 'Employee and manager positions must differ',
        hierarchyId: entry.id,
        employeePositionId: entry.employeePositionId,
        managerPositionId: entry.managerPositionId,
      });
    }

    const employeePos = positionMap.get(entry.employeePositionId);
    if (!employeePos) {
      issues.push({
        code: 'INVALID_EMPLOYEE_POSITION',
        message: 'Employee position missing from business',
        hierarchyId: entry.id,
        employeePositionId: entry.employeePositionId,
      });
    } else if (!employeePos.active && entry.active) {
      issues.push({
        code: 'INACTIVE_EMPLOYEE_POSITION',
        message: 'Active hierarchy references inactive employee position',
        hierarchyId: entry.id,
        employeePositionId: entry.employeePositionId,
      });
    }

    const managerPos = positionMap.get(entry.managerPositionId);
    if (!managerPos) {
      issues.push({
        code: 'INVALID_MANAGER_POSITION',
        message: 'Manager position missing from business',
        hierarchyId: entry.id,
        managerPositionId: entry.managerPositionId,
      });
    } else if (!managerPos.active && entry.active) {
      issues.push({
        code: 'INACTIVE_MANAGER_POSITION',
        message: 'Active hierarchy references inactive manager position',
        hierarchyId: entry.id,
        managerPositionId: entry.managerPositionId,
      });
    }

    if (entry.approvalTypes.length === 0) {
      issues.push({
        code: 'EMPTY_APPROVAL_TYPES',
        message: 'Approval types must not be empty',
        hierarchyId: entry.id,
      });
    }
  }

  const primaryByEmployeeType = new Map<string, string>();
  for (const entry of entries.filter((e) => e.active && e.isPrimary)) {
    for (const approvalType of entry.approvalTypes) {
      const key = `${entry.employeePositionId}:${approvalType}:${entry.approvalLevel}`;
      if (primaryByEmployeeType.has(key)) {
        issues.push({
          code: 'DUPLICATE_PRIMARY',
          message: `Multiple primary approvers for approval type "${approvalType}" at level ${entry.approvalLevel}`,
          hierarchyId: entry.id,
          employeePositionId: entry.employeePositionId,
        });
      } else {
        primaryByEmployeeType.set(key, entry.id);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

const approvalHierarchyService = {
  listApprovalHierarchies,
  getApprovalHierarchyById,
  createApprovalHierarchy,
  updateApprovalHierarchy,
  deleteApprovalHierarchy,
  assignApprovalHierarchyToEmployee,
  assignApprovalHierarchyToPosition,
  assignApprovalHierarchyToDepartment,
  resolveApprovalChain,
  validateApprovalHierarchyIntegrity,
};

export default approvalHierarchyService;
