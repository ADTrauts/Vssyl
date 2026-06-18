import { emitDomainEvent } from '../../events/emitDomainEvent';
import {
  buildTypedDomainEventInput,
  DOMAIN_EVENT_TYPES,
} from '../../events/domainEventRegistry';

function emitOrgChartEvent(
  type: (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES],
  params: {
    actorUserId: string;
    entityId: string;
    businessId: string;
    metadata?: Record<string, unknown>;
  }
): void {
  emitDomainEvent(
    buildTypedDomainEventInput(type, {
      actorUserId: params.actorUserId,
      entityId: params.entityId,
      businessId: params.businessId,
      metadata: params.metadata,
    })
  );
}

export function recordOrgChartTierCreatedDomainEvent(params: {
  actorUserId: string;
  tierId: string;
  businessId: string;
  name?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_TIER_CREATED, {
    actorUserId: params.actorUserId,
    entityId: params.tierId,
    businessId: params.businessId,
    metadata: params.name ? { name: params.name } : undefined,
  });
}

export function recordOrgChartTierUpdatedDomainEvent(params: {
  actorUserId: string;
  tierId: string;
  businessId: string;
  changedFields?: string[];
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_TIER_UPDATED, {
    actorUserId: params.actorUserId,
    entityId: params.tierId,
    businessId: params.businessId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
}

export function recordOrgChartTierDeletedDomainEvent(params: {
  actorUserId: string;
  tierId: string;
  businessId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_TIER_DELETED, {
    actorUserId: params.actorUserId,
    entityId: params.tierId,
    businessId: params.businessId,
  });
}

export function recordOrgChartDepartmentCreatedDomainEvent(params: {
  actorUserId: string;
  departmentId: string;
  businessId: string;
  name?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_DEPARTMENT_CREATED, {
    actorUserId: params.actorUserId,
    entityId: params.departmentId,
    businessId: params.businessId,
    metadata: params.name ? { name: params.name } : undefined,
  });
}

export function recordOrgChartDepartmentUpdatedDomainEvent(params: {
  actorUserId: string;
  departmentId: string;
  businessId: string;
  changedFields?: string[];
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_DEPARTMENT_UPDATED, {
    actorUserId: params.actorUserId,
    entityId: params.departmentId,
    businessId: params.businessId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
}

export function recordOrgChartDepartmentDeletedDomainEvent(params: {
  actorUserId: string;
  departmentId: string;
  businessId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_DEPARTMENT_DELETED, {
    actorUserId: params.actorUserId,
    entityId: params.departmentId,
    businessId: params.businessId,
  });
}

export function recordOrgChartPositionCreatedDomainEvent(params: {
  actorUserId: string;
  positionId: string;
  businessId: string;
  title?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_POSITION_CREATED, {
    actorUserId: params.actorUserId,
    entityId: params.positionId,
    businessId: params.businessId,
    metadata: params.title ? { title: params.title } : undefined,
  });
}

export function recordOrgChartPositionUpdatedDomainEvent(params: {
  actorUserId: string;
  positionId: string;
  businessId: string;
  changedFields?: string[];
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_POSITION_UPDATED, {
    actorUserId: params.actorUserId,
    entityId: params.positionId,
    businessId: params.businessId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
}

export function recordOrgChartPositionDeletedDomainEvent(params: {
  actorUserId: string;
  positionId: string;
  businessId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_POSITION_DELETED, {
    actorUserId: params.actorUserId,
    entityId: params.positionId,
    businessId: params.businessId,
  });
}

export function recordOrgChartEmployeeAssignedDomainEvent(params: {
  actorUserId: string;
  assignmentId: string;
  businessId: string;
  userId: string;
  positionId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_EMPLOYEE_ASSIGNED, {
    actorUserId: params.actorUserId,
    entityId: params.assignmentId,
    businessId: params.businessId,
    metadata: { userId: params.userId, positionId: params.positionId },
  });
}

export function recordOrgChartEmployeeRemovedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  userId: string;
  positionId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_EMPLOYEE_REMOVED, {
    actorUserId: params.actorUserId,
    entityId: `${params.userId}:${params.positionId}`,
    businessId: params.businessId,
    metadata: { userId: params.userId, positionId: params.positionId },
  });
}

export function recordOrgChartEmployeeTransferredDomainEvent(params: {
  actorUserId: string;
  transferId: string;
  businessId: string;
  userId: string;
  fromPositionId: string;
  toPositionId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_EMPLOYEE_TRANSFERRED, {
    actorUserId: params.actorUserId,
    entityId: params.transferId,
    businessId: params.businessId,
    metadata: {
      userId: params.userId,
      fromPositionId: params.fromPositionId,
      toPositionId: params.toPositionId,
    },
  });
}

export function recordOrgChartPermissionSetCreatedDomainEvent(params: {
  actorUserId: string;
  permissionSetId: string;
  businessId: string;
  name?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_PERMISSION_SET_CREATED, {
    actorUserId: params.actorUserId,
    entityId: params.permissionSetId,
    businessId: params.businessId,
    metadata: params.name ? { name: params.name } : undefined,
  });
}

export function recordOrgChartPermissionSetUpdatedDomainEvent(params: {
  actorUserId: string;
  permissionSetId: string;
  businessId: string;
  changedFields?: string[];
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_PERMISSION_UPDATED, {
    actorUserId: params.actorUserId,
    entityId: params.permissionSetId,
    businessId: params.businessId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
}

export function recordOrgChartPermissionSetDeletedDomainEvent(params: {
  actorUserId: string;
  permissionSetId: string;
  businessId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_PERMISSION_SET_DELETED, {
    actorUserId: params.actorUserId,
    entityId: params.permissionSetId,
    businessId: params.businessId,
  });
}

export function recordOrgChartPermissionSetCopiedDomainEvent(params: {
  actorUserId: string;
  sourcePermissionSetId: string;
  newPermissionSetId: string;
  businessId: string;
  newName?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_PERMISSION_SET_COPIED, {
    actorUserId: params.actorUserId,
    entityId: params.newPermissionSetId,
    businessId: params.businessId,
    metadata: {
      sourcePermissionSetId: params.sourcePermissionSetId,
      ...(params.newName ? { newName: params.newName } : {}),
    },
  });
}

export function recordOrgChartStructureInitializedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  industry?: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_STRUCTURE_INITIALIZED, {
    actorUserId: params.actorUserId,
    entityId: params.businessId,
    businessId: params.businessId,
    metadata: params.industry ? { industry: params.industry } : undefined,
  });
}

export function recordOrgChartManagerAssignedDomainEvent(params: {
  actorUserId: string;
  positionId: string;
  businessId: string;
  reportsToId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_MANAGER_ASSIGNED, {
    actorUserId: params.actorUserId,
    entityId: params.positionId,
    businessId: params.businessId,
    metadata: { reportsToId: params.reportsToId },
  });
}

export function recordOrgChartManagerRemovedDomainEvent(params: {
  actorUserId: string;
  positionId: string;
  businessId: string;
}): void {
  emitOrgChartEvent(DOMAIN_EVENT_TYPES.ORGCHART_MANAGER_REMOVED, {
    actorUserId: params.actorUserId,
    entityId: params.positionId,
    businessId: params.businessId,
  });
}
