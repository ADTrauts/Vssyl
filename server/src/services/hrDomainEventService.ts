import {
  emitHrAttendanceExceptionCreatedEvent,
  emitHrEmployeeCreatedEvent,
  emitHrEmployeePermanentlyDeletedEvent,
  emitHrEmployeeRestoredEvent,
  emitHrEmployeeTerminatedEvent,
  emitHrEmployeeTrashedEvent,
  emitHrEmployeeUpdatedEvent,
  emitHrOnboardingCompletedEvent,
  emitHrOnboardingCreatedEvent,
  emitHrPtoApprovedEvent,
  emitHrPtoDeniedEvent,
  emitHrPtoRequestedEvent,
} from '../events/domainEventEmitters';

export function recordEmployeeCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): void {
  emitHrEmployeeCreatedEvent(params);
}

export function recordEmployeeUpdatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): void {
  emitHrEmployeeUpdatedEvent(params);
}

export function recordEmployeeTerminatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
  terminationDate?: string;
}): void {
  emitHrEmployeeTerminatedEvent(params);
}

export function recordEmployeeTrashedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
  reason?: string;
}): void {
  emitHrEmployeeTrashedEvent(params);
}

export function recordEmployeeRestoredDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): void {
  emitHrEmployeeRestoredEvent(params);
}

export function recordEmployeePurgedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  employeeHrProfileId: string;
  employeePositionId: string;
}): void {
  emitHrEmployeePermanentlyDeletedEvent(params);
}

export function recordOnboardingCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  journeyId: string;
  employeeHrProfileId: string;
  templateId?: string;
}): void {
  emitHrOnboardingCreatedEvent(params);
}

export function recordOnboardingCompletedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  journeyId: string;
  employeeHrProfileId: string;
}): void {
  emitHrOnboardingCompletedEvent(params);
}

export function recordPtoRequestedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
  type?: string;
}): void {
  emitHrPtoRequestedEvent(params);
}

export function recordPtoApprovedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
}): void {
  emitHrPtoApprovedEvent(params);
}

export function recordPtoDeniedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  timeOffRequestId: string;
  employeePositionId: string;
}): void {
  emitHrPtoDeniedEvent(params);
}

export function recordAttendanceExceptionCreatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  exceptionId: string;
  employeePositionId: string;
  type?: string;
}): void {
  emitHrAttendanceExceptionCreatedEvent(params);
}
