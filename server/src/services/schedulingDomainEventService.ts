import {
  emitSchedulingScheduleCreatedEvent,
  emitSchedulingSchedulePermanentlyDeletedEvent,
  emitSchedulingSchedulePublishedEvent,
  emitSchedulingScheduleRestoredEvent,
  emitSchedulingScheduleTemplateCreatedEvent,
  emitSchedulingScheduleTemplateTrashedEvent,
  emitSchedulingScheduleTemplateUpdatedEvent,
  emitSchedulingScheduleTrashedEvent,
  emitSchedulingScheduleUpdatedEvent,
  emitSchedulingShiftAssignedEvent,
  emitSchedulingShiftCreatedEvent,
  emitSchedulingShiftPermanentlyDeletedEvent,
  emitSchedulingShiftRestoredEvent,
  emitSchedulingShiftTemplateArchivedEvent,
  emitSchedulingShiftTemplateCreatedEvent,
  emitSchedulingShiftTemplateUpdatedEvent,
  emitSchedulingShiftTrashedEvent,
  emitSchedulingShiftUnassignedEvent,
  emitSchedulingShiftUpdatedEvent,
  emitSchedulingSwapRequestedEvent,
  emitSchedulingSwapResolvedEvent,
} from '../events/domainEventEmitters';

export function recordSchedulingScheduleCreatedDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
  status?: string;
}): void {
  emitSchedulingScheduleCreatedEvent(params);
}

export function recordSchedulingScheduleUpdatedDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
  status?: string;
}): void {
  emitSchedulingScheduleUpdatedEvent(params);
}

export function recordSchedulingSchedulePublishedDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
  shiftCount: number;
}): void {
  emitSchedulingSchedulePublishedEvent(params);
}

export function recordSchedulingScheduleTrashedDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
}): void {
  emitSchedulingScheduleTrashedEvent(params);
}

export function recordSchedulingScheduleRestoredDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
}): void {
  emitSchedulingScheduleRestoredEvent(params);
}

export function recordSchedulingSchedulePermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  scheduleId: string;
  businessId: string;
}): void {
  emitSchedulingSchedulePermanentlyDeletedEvent(params);
}

export function recordSchedulingShiftCreatedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
  status?: string;
}): void {
  emitSchedulingShiftCreatedEvent(params);
}

export function recordSchedulingShiftUpdatedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
  status?: string;
}): void {
  emitSchedulingShiftUpdatedEvent(params);
}

export function recordSchedulingShiftAssignedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
  employeePositionId: string;
}): void {
  emitSchedulingShiftAssignedEvent(params);
}

/** Open-shift claim emits shift-assigned domain fact with employee-initiated semantics. */
export function recordSchedulingOpenShiftClaimedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
  employeePositionId: string;
}): void {
  emitSchedulingShiftAssignedEvent(params);
}

export function recordSchedulingShiftUnassignedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
  employeePositionId: string;
}): void {
  emitSchedulingShiftUnassignedEvent(params);
}

export function recordSchedulingShiftTrashedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
}): void {
  emitSchedulingShiftTrashedEvent(params);
}

export function recordSchedulingShiftRestoredDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
}): void {
  emitSchedulingShiftRestoredEvent(params);
}

export function recordSchedulingShiftPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  shiftId: string;
  businessId: string;
  scheduleId: string;
}): void {
  emitSchedulingShiftPermanentlyDeletedEvent(params);
}

export function recordSchedulingSwapRequestedDomainEvent(params: {
  actorUserId: string;
  swapId: string;
  businessId: string;
  shiftId: string;
  requestedToId?: string | null;
}): void {
  emitSchedulingSwapRequestedEvent(params);
}

export function recordSchedulingSwapResolvedDomainEvent(params: {
  actorUserId: string;
  swapId: string;
  businessId: string;
  shiftId: string;
  outcome: 'approved' | 'denied';
}): void {
  emitSchedulingSwapResolvedEvent(params);
}

export function recordSchedulingShiftTemplateCreatedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
}): void {
  emitSchedulingShiftTemplateCreatedEvent(params);
}

export function recordSchedulingShiftTemplateUpdatedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
}): void {
  emitSchedulingShiftTemplateUpdatedEvent(params);
}

export function recordSchedulingShiftTemplateArchivedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
}): void {
  emitSchedulingShiftTemplateArchivedEvent(params);
}

export function recordSchedulingScheduleTemplateCreatedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
  scheduleType?: string;
}): void {
  emitSchedulingScheduleTemplateCreatedEvent(params);
}

export function recordSchedulingScheduleTemplateUpdatedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
  scheduleType?: string;
}): void {
  emitSchedulingScheduleTemplateUpdatedEvent(params);
}

export function recordSchedulingScheduleTemplateTrashedDomainEvent(params: {
  actorUserId: string;
  templateId: string;
  businessId: string;
}): void {
  emitSchedulingScheduleTemplateTrashedEvent(params);
}

export function recordSchedulingShiftMutationDomainEvents(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  previousEmployeePositionId: string | null;
  nextEmployeePositionId: string | null;
  includeUpdated?: boolean;
  status?: string;
}): void {
  const {
    actorUserId,
    businessId,
    shiftId,
    scheduleId,
    previousEmployeePositionId,
    nextEmployeePositionId,
    includeUpdated = true,
    status,
  } = params;

  if (includeUpdated) {
    recordSchedulingShiftUpdatedDomainEvent({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      status,
    });
  }

  const previous = previousEmployeePositionId ?? null;
  const next = nextEmployeePositionId ?? null;

  if (!previous && next) {
    recordSchedulingShiftAssignedDomainEvent({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: next,
    });
    return;
  }

  if (previous && !next) {
    recordSchedulingShiftUnassignedDomainEvent({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: previous,
    });
    return;
  }

  if (previous && next && previous !== next) {
    recordSchedulingShiftUnassignedDomainEvent({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: previous,
    });
    recordSchedulingShiftAssignedDomainEvent({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: next,
    });
  }
}
