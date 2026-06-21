import { emitModuleActivityEvent } from './moduleActivityService';
import { ensureBusinessDashboardForUser } from './dashboardService';

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

async function emitSchedulingActivity(params: {
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
    moduleId: 'scheduling',
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

export async function recordScheduleCreated(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
  name?: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_created',
    targetType: 'schedule',
    targetId: params.scheduleId,
    metadata: params.name ? { name: params.name } : undefined,
  });
}

export async function recordScheduleUpdated(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_updated',
    targetType: 'schedule',
    targetId: params.scheduleId,
  });
}

export async function recordSchedulePublished(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
  shiftCount?: number;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_published',
    targetType: 'schedule',
    targetId: params.scheduleId,
    metadata: params.shiftCount !== undefined ? { shiftCount: params.shiftCount } : undefined,
  });
}

export async function recordScheduleDeleted(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_deleted',
    targetType: 'schedule',
    targetId: params.scheduleId,
  });
}

export async function recordScheduleTrashed(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_trashed',
    targetType: 'schedule',
    targetId: params.scheduleId,
  });
}

export async function recordScheduleRestored(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_restored',
    targetType: 'schedule',
    targetId: params.scheduleId,
  });
}

export async function recordSchedulePurged(params: {
  actorUserId: string;
  businessId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_purged',
    targetType: 'schedule',
    targetId: params.scheduleId,
  });
}

export async function recordShiftCreated(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  employeePositionId?: string | null;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_created',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
    metadata: params.employeePositionId
      ? { employeePositionId: params.employeePositionId }
      : undefined,
  });
}

export async function recordShiftUpdated(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_updated',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
  });
}

export async function recordShiftDeleted(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_deleted',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
  });
}

export async function recordShiftTrashed(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_trashed',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
  });
}

export async function recordShiftRestored(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_restored',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
  });
}

export async function recordShiftPurged(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_purged',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
  });
}

export async function recordScheduleTemplateTrashed(params: {
  actorUserId: string;
  businessId: string;
  templateId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_template_trashed',
    targetType: 'schedule_template',
    targetId: params.templateId,
  });
}

export async function recordScheduleTemplateRestored(params: {
  actorUserId: string;
  businessId: string;
  templateId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_template_restored',
    targetType: 'schedule_template',
    targetId: params.templateId,
  });
}

export async function recordScheduleTemplatePurged(params: {
  actorUserId: string;
  businessId: string;
  templateId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_schedule_template_purged',
    targetType: 'schedule_template',
    targetId: params.templateId,
  });
}

export async function recordShiftAssigned(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  employeePositionId: string;
  previousEmployeePositionId?: string | null;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_assigned',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
    metadata: {
      employeePositionId: params.employeePositionId,
      ...(params.previousEmployeePositionId
        ? { previousEmployeePositionId: params.previousEmployeePositionId }
        : {}),
    },
  });
}

/** Employee self-claim of an open shift (distinct activity envelope). */
export async function recordOpenShiftClaimed(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_open_shift_claimed',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
    metadata: {
      employeePositionId: params.employeePositionId,
      claimSource: 'employee_self_service',
    },
  });
}

export async function recordShiftUnassigned(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  employeePositionId: string;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_unassigned',
    targetType: 'shift',
    targetId: params.shiftId,
    parentType: 'schedule',
    parentId: params.scheduleId,
    metadata: { employeePositionId: params.employeePositionId },
  });
}

export async function recordShiftSwapRequested(params: {
  actorUserId: string;
  businessId: string;
  swapId: string;
  shiftId: string;
  requestedToId?: string | null;
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_swap_requested',
    targetType: 'swap',
    targetId: params.swapId,
    parentType: 'shift',
    parentId: params.shiftId,
    metadata: params.requestedToId ? { requestedToId: params.requestedToId } : undefined,
  });
}

export async function recordShiftSwapCompleted(params: {
  actorUserId: string;
  businessId: string;
  swapId: string;
  shiftId: string;
  outcome: 'approved' | 'denied';
}): Promise<void> {
  await emitSchedulingActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'scheduling_shift_swap_completed',
    targetType: 'swap',
    targetId: params.swapId,
    parentType: 'shift',
    parentId: params.shiftId,
    metadata: { outcome: params.outcome },
  });
}

/**
 * Emit shift lifecycle activities after an update, including assign/unassign symmetry.
 */
export async function recordShiftMutationActivities(params: {
  actorUserId: string;
  businessId: string;
  shiftId: string;
  scheduleId: string;
  previousEmployeePositionId: string | null;
  nextEmployeePositionId: string | null;
  includeUpdated?: boolean;
}): Promise<void> {
  const {
    actorUserId,
    businessId,
    shiftId,
    scheduleId,
    previousEmployeePositionId,
    nextEmployeePositionId,
    includeUpdated = true,
  } = params;

  if (includeUpdated) {
    await recordShiftUpdated({ actorUserId, businessId, shiftId, scheduleId });
  }

  const previous = previousEmployeePositionId ?? null;
  const next = nextEmployeePositionId ?? null;

  if (!previous && next) {
    await recordShiftAssigned({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: next,
    });
    return;
  }

  if (previous && !next) {
    await recordShiftUnassigned({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: previous,
    });
    return;
  }

  if (previous && next && previous !== next) {
    await recordShiftUnassigned({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: previous,
    });
    await recordShiftAssigned({
      actorUserId,
      businessId,
      shiftId,
      scheduleId,
      employeePositionId: next,
      previousEmployeePositionId: previous,
    });
  }
}
