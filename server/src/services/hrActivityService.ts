import { emitModuleActivityEvent } from './moduleActivityService';
import { ensureBusinessDashboardForUser } from './dashboardService';
import * as hrDomain from './hrDomainEventService';

async function resolveBusinessActivityContext(
  actorUserId: string,
  businessId: string
): Promise<{ businessId: string; dashboardId?: string }> {
  try {
    const dashboard = await ensureBusinessDashboardForUser(actorUserId, businessId);
    return { businessId, dashboardId: dashboard?.id };
  } catch {
    return { businessId };
  }
}

async function emitHrActivity(params: {
  actorUserId: string;
  businessId: string;
  action: string;
  targetType: string;
  targetId: string;
  parentType?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const context = await resolveBusinessActivityContext(params.actorUserId, params.businessId);
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'hr',
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    parentType: params.parentType,
    parentId: params.parentId,
    businessId: context.businessId,
    dashboardId: context.dashboardId,
    metadata: params.metadata,
  });
}

export async function recordEmployeeCreated(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_created',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordEmployeeCreatedDomainEvent(params);
}

export async function recordEmployeeUpdated(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_updated',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordEmployeeUpdatedDomainEvent(params);
}

export async function recordEmployeeTerminated(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
  terminationDate?: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_terminated',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
    metadata: params.terminationDate ? { terminationDate: params.terminationDate } : undefined,
  });
  hrDomain.recordEmployeeTerminatedDomainEvent(params);
}

export async function recordEmployeeTrashed(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
  reason?: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_trashed',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
    metadata: params.reason ? { reason: params.reason } : undefined,
  });
  hrDomain.recordEmployeeTrashedDomainEvent(params);
}

export async function recordEmployeeRestored(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_restored',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordEmployeeRestoredDomainEvent(params);
}

export async function recordEmployeePurged(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_employee_purged',
    targetType: 'employee',
    targetId: params.employeeHrProfileId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordEmployeePurgedDomainEvent(params);
}

export async function recordOnboardingCreated(params: {
  actorUserId: string;
  businessId: string;
  journeyId: string;
  employeeHrProfileId: string;
  templateId?: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_onboarding_created',
    targetType: 'onboarding',
    targetId: params.journeyId,
    parentType: 'employee',
    parentId: params.employeeHrProfileId,
    metadata: params.templateId ? { templateId: params.templateId } : undefined,
  });
  hrDomain.recordOnboardingCreatedDomainEvent(params);
}

export async function recordOnboardingCompleted(params: {
  actorUserId: string;
  businessId: string;
  journeyId: string;
  employeeHrProfileId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_onboarding_completed',
    targetType: 'onboarding',
    targetId: params.journeyId,
    parentType: 'employee',
    parentId: params.employeeHrProfileId,
  });
  hrDomain.recordOnboardingCompletedDomainEvent(params);
}

export async function recordPtoRequested(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
  type?: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_pto_requested',
    targetType: 'time_off',
    targetId: params.timeOffRequestId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
    metadata: params.type ? { type: params.type } : undefined,
  });
  hrDomain.recordPtoRequestedDomainEvent(params);
}

export async function recordPtoApproved(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_pto_approved',
    targetType: 'time_off',
    targetId: params.timeOffRequestId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordPtoApprovedDomainEvent(params);
}

export async function recordPtoDenied(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_pto_denied',
    targetType: 'time_off',
    targetId: params.timeOffRequestId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
  });
  hrDomain.recordPtoDeniedDomainEvent(params);
}

export async function recordAttendanceExceptionCreated(params: {
  actorUserId: string;
  businessId: string;
  exceptionId: string;
  employeePositionId: string;
  type?: string;
}): Promise<void> {
  await emitHrActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'hr_attendance_exception_created',
    targetType: 'attendance_exception',
    targetId: params.exceptionId,
    parentType: 'employee_position',
    parentId: params.employeePositionId,
    metadata: params.type ? { type: params.type } : undefined,
  });
  hrDomain.recordAttendanceExceptionCreatedDomainEvent(params);
}
