import { emitModuleActivityEvent } from '../moduleActivityService';
import { ensureBusinessDashboardForUser } from '../dashboardService';
import {
  ORG_CHART_ACTIVITY_ACTIONS,
  ORG_CHART_MODULE_ID,
} from './businessActivityTaxonomy';
import { broadcastBusinessConfigUpdated } from './businessConfigRealtimeService';
import {
  recordOrgChartDepartmentCreatedDomainEvent,
  recordOrgChartDepartmentDeletedDomainEvent,
  recordOrgChartDepartmentUpdatedDomainEvent,
  recordOrgChartEmployeeAssignedDomainEvent,
  recordOrgChartEmployeeRemovedDomainEvent,
  recordOrgChartEmployeeTransferredDomainEvent,
  recordOrgChartManagerAssignedDomainEvent,
  recordOrgChartManagerRemovedDomainEvent,
  recordOrgChartPermissionSetCopiedDomainEvent,
  recordOrgChartPermissionSetCreatedDomainEvent,
  recordOrgChartPermissionSetDeletedDomainEvent,
  recordOrgChartPermissionSetUpdatedDomainEvent,
  recordOrgChartPositionCreatedDomainEvent,
  recordOrgChartPositionDeletedDomainEvent,
  recordOrgChartPositionUpdatedDomainEvent,
  recordOrgChartStructureInitializedDomainEvent,
  recordOrgChartTierCreatedDomainEvent,
  recordOrgChartTierDeletedDomainEvent,
  recordOrgChartTierUpdatedDomainEvent,
} from './orgChartDomainEventService';

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

async function emitOrgChartActivity(params: {
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
    moduleId: ORG_CHART_MODULE_ID,
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

function notifyOrgStructureChange(businessId: string, actorUserId: string): void {
  broadcastBusinessConfigUpdated({
    businessId,
    changeType: 'org_structure_updated',
    actorUserId,
  });
}

export async function recordOrgChartTierCreated(params: {
  actorUserId: string;
  businessId: string;
  tierId: string;
  name?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.TIER_CREATED,
    targetType: 'organizational_tier',
    targetId: params.tierId,
    metadata: params.name ? { name: params.name } : undefined,
  });
  recordOrgChartTierCreatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartTierUpdated(params: {
  actorUserId: string;
  businessId: string;
  tierId: string;
  changedFields?: string[];
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.TIER_UPDATED,
    targetType: 'organizational_tier',
    targetId: params.tierId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
  recordOrgChartTierUpdatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartTierDeleted(params: {
  actorUserId: string;
  businessId: string;
  tierId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.TIER_DELETED,
    targetType: 'organizational_tier',
    targetId: params.tierId,
  });
  recordOrgChartTierDeletedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartDepartmentCreated(params: {
  actorUserId: string;
  businessId: string;
  departmentId: string;
  name?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.DEPARTMENT_CREATED,
    targetType: 'department',
    targetId: params.departmentId,
    metadata: params.name ? { name: params.name } : undefined,
  });
  recordOrgChartDepartmentCreatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartDepartmentUpdated(params: {
  actorUserId: string;
  businessId: string;
  departmentId: string;
  changedFields?: string[];
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.DEPARTMENT_UPDATED,
    targetType: 'department',
    targetId: params.departmentId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
  recordOrgChartDepartmentUpdatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartDepartmentDeleted(params: {
  actorUserId: string;
  businessId: string;
  departmentId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.DEPARTMENT_DELETED,
    targetType: 'department',
    targetId: params.departmentId,
  });
  recordOrgChartDepartmentDeletedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPositionCreated(params: {
  actorUserId: string;
  businessId: string;
  positionId: string;
  title?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.POSITION_CREATED,
    targetType: 'position',
    targetId: params.positionId,
    metadata: params.title ? { title: params.title } : undefined,
  });
  recordOrgChartPositionCreatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPositionUpdated(params: {
  actorUserId: string;
  businessId: string;
  positionId: string;
  changedFields?: string[];
  reportsToId?: string | null;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.POSITION_UPDATED,
    targetType: 'position',
    targetId: params.positionId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
  recordOrgChartPositionUpdatedDomainEvent({
    actorUserId: params.actorUserId,
    positionId: params.positionId,
    businessId: params.businessId,
    changedFields: params.changedFields,
  });

  if (params.changedFields?.includes('reportsToId')) {
    if (params.reportsToId) {
      await emitOrgChartActivity({
        actorUserId: params.actorUserId,
        businessId: params.businessId,
        action: ORG_CHART_ACTIVITY_ACTIONS.MANAGER_ASSIGNED,
        targetType: 'position',
        targetId: params.positionId,
        metadata: { reportsToId: params.reportsToId },
      });
      recordOrgChartManagerAssignedDomainEvent({
        actorUserId: params.actorUserId,
        positionId: params.positionId,
        businessId: params.businessId,
        reportsToId: params.reportsToId,
      });
    } else {
      await emitOrgChartActivity({
        actorUserId: params.actorUserId,
        businessId: params.businessId,
        action: ORG_CHART_ACTIVITY_ACTIONS.MANAGER_REMOVED,
        targetType: 'position',
        targetId: params.positionId,
      });
      recordOrgChartManagerRemovedDomainEvent({
        actorUserId: params.actorUserId,
        positionId: params.positionId,
        businessId: params.businessId,
      });
    }
  }

  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPositionDeleted(params: {
  actorUserId: string;
  businessId: string;
  positionId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.POSITION_DELETED,
    targetType: 'position',
    targetId: params.positionId,
  });
  recordOrgChartPositionDeletedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartEmployeeAssigned(params: {
  actorUserId: string;
  businessId: string;
  assignmentId: string;
  userId: string;
  positionId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.EMPLOYEE_ASSIGNED,
    targetType: 'employee_position',
    targetId: params.assignmentId,
    metadata: { userId: params.userId, positionId: params.positionId },
  });
  recordOrgChartEmployeeAssignedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartEmployeeRemoved(params: {
  actorUserId: string;
  businessId: string;
  userId: string;
  positionId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.EMPLOYEE_REMOVED,
    targetType: 'employee_position',
    targetId: `${params.userId}:${params.positionId}`,
    metadata: { userId: params.userId, positionId: params.positionId },
  });
  recordOrgChartEmployeeRemovedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartEmployeeTransferred(params: {
  actorUserId: string;
  businessId: string;
  transferId: string;
  userId: string;
  fromPositionId: string;
  toPositionId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.EMPLOYEE_TRANSFERRED,
    targetType: 'employee_position',
    targetId: params.transferId,
    metadata: {
      userId: params.userId,
      fromPositionId: params.fromPositionId,
      toPositionId: params.toPositionId,
    },
  });
  recordOrgChartEmployeeTransferredDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPermissionSetCreated(params: {
  actorUserId: string;
  businessId: string;
  permissionSetId: string;
  name?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.PERMISSION_SET_CREATED,
    targetType: 'permission_set',
    targetId: params.permissionSetId,
    metadata: params.name ? { name: params.name } : undefined,
  });
  recordOrgChartPermissionSetCreatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPermissionSetUpdated(params: {
  actorUserId: string;
  businessId: string;
  permissionSetId: string;
  changedFields?: string[];
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.PERMISSION_SET_UPDATED,
    targetType: 'permission_set',
    targetId: params.permissionSetId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
  recordOrgChartPermissionSetUpdatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPermissionSetDeleted(params: {
  actorUserId: string;
  businessId: string;
  permissionSetId: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.PERMISSION_SET_DELETED,
    targetType: 'permission_set',
    targetId: params.permissionSetId,
  });
  recordOrgChartPermissionSetDeletedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartPermissionSetCopied(params: {
  actorUserId: string;
  businessId: string;
  sourcePermissionSetId: string;
  newPermissionSetId: string;
  newName?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.PERMISSION_SET_COPIED,
    targetType: 'permission_set',
    targetId: params.newPermissionSetId,
    metadata: {
      sourcePermissionSetId: params.sourcePermissionSetId,
      ...(params.newName ? { newName: params.newName } : {}),
    },
  });
  recordOrgChartPermissionSetCopiedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordOrgChartStructureInitialized(params: {
  actorUserId: string;
  businessId: string;
  industry?: string;
}): Promise<void> {
  await emitOrgChartActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: ORG_CHART_ACTIVITY_ACTIONS.STRUCTURE_INITIALIZED,
    targetType: 'org_chart',
    targetId: params.businessId,
    metadata: params.industry ? { industry: params.industry } : undefined,
  });
  recordOrgChartStructureInitializedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}
