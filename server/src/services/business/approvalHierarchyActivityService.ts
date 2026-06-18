import { emitModuleActivityEvent } from '../moduleActivityService';
import { ensureBusinessDashboardForUser } from '../dashboardService';
import { ORG_CHART_MODULE_ID, APPROVAL_HIERARCHY_ACTIVITY_ACTIONS } from './businessActivityTaxonomy';
import { broadcastBusinessConfigUpdated } from './businessConfigRealtimeService';
import {
  recordApprovalHierarchyAssignedDomainEvent,
  recordApprovalHierarchyCreatedDomainEvent,
  recordApprovalHierarchyDeletedDomainEvent,
  recordApprovalHierarchyUpdatedDomainEvent,
  recordApprovalHierarchyValidatedDomainEvent,
} from './approvalHierarchyDomainEventService';

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

async function emitApprovalHierarchyActivity(params: {
  actorUserId: string;
  businessId: string;
  action: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const context = await resolveBusinessActivityContext(params.actorUserId, params.businessId);
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: ORG_CHART_MODULE_ID,
    action: params.action,
    targetType: 'approval_hierarchy',
    targetId: params.targetId,
    parentType: 'business',
    parentId: params.businessId,
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

export async function recordApprovalHierarchyCreated(params: {
  actorUserId: string;
  businessId: string;
  hierarchyId: string;
  employeePositionId: string;
  managerPositionId: string;
}): Promise<void> {
  await emitApprovalHierarchyActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.CREATED,
    targetId: params.hierarchyId,
    metadata: {
      employeePositionId: params.employeePositionId,
      managerPositionId: params.managerPositionId,
    },
  });
  recordApprovalHierarchyCreatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordApprovalHierarchyUpdated(params: {
  actorUserId: string;
  businessId: string;
  hierarchyId: string;
  changedFields?: string[];
}): Promise<void> {
  await emitApprovalHierarchyActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.UPDATED,
    targetId: params.hierarchyId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
  recordApprovalHierarchyUpdatedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordApprovalHierarchyDeleted(params: {
  actorUserId: string;
  businessId: string;
  hierarchyId: string;
}): Promise<void> {
  await emitApprovalHierarchyActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.DELETED,
    targetId: params.hierarchyId,
  });
  recordApprovalHierarchyDeletedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordApprovalHierarchyAssigned(params: {
  actorUserId: string;
  businessId: string;
  assignmentTarget: 'employee' | 'position' | 'department';
  targetId: string;
  entriesCreated: number;
  entriesUpdated: number;
}): Promise<void> {
  await emitApprovalHierarchyActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.ASSIGNED,
    targetId: params.targetId,
    metadata: {
      assignmentTarget: params.assignmentTarget,
      entriesCreated: params.entriesCreated,
      entriesUpdated: params.entriesUpdated,
    },
  });
  recordApprovalHierarchyAssignedDomainEvent(params);
  notifyOrgStructureChange(params.businessId, params.actorUserId);
}

export async function recordApprovalHierarchyValidated(params: {
  actorUserId: string;
  businessId: string;
  valid: boolean;
  issueCount: number;
}): Promise<void> {
  await emitApprovalHierarchyActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.VALIDATED,
    targetId: params.businessId,
    metadata: {
      valid: params.valid,
      issueCount: params.issueCount,
    },
  });
  recordApprovalHierarchyValidatedDomainEvent(params);
}
