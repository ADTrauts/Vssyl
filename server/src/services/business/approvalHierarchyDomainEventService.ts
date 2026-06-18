import { emitDomainEvent } from '../../events/emitDomainEvent';
import {
  buildTypedDomainEventInput,
  DOMAIN_EVENT_TYPES,
} from '../../events/domainEventRegistry';

function emitApprovalHierarchyEvent(
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

export function recordApprovalHierarchyCreatedDomainEvent(params: {
  actorUserId: string;
  hierarchyId: string;
  businessId: string;
  employeePositionId: string;
  managerPositionId: string;
}): void {
  emitApprovalHierarchyEvent(DOMAIN_EVENT_TYPES.APPROVAL_HIERARCHY_CREATED, {
    actorUserId: params.actorUserId,
    entityId: params.hierarchyId,
    businessId: params.businessId,
    metadata: {
      employeePositionId: params.employeePositionId,
      managerPositionId: params.managerPositionId,
    },
  });
}

export function recordApprovalHierarchyUpdatedDomainEvent(params: {
  actorUserId: string;
  hierarchyId: string;
  businessId: string;
  changedFields?: string[];
}): void {
  emitApprovalHierarchyEvent(DOMAIN_EVENT_TYPES.APPROVAL_HIERARCHY_UPDATED, {
    actorUserId: params.actorUserId,
    entityId: params.hierarchyId,
    businessId: params.businessId,
    metadata: params.changedFields ? { changedFields: params.changedFields } : undefined,
  });
}

export function recordApprovalHierarchyDeletedDomainEvent(params: {
  actorUserId: string;
  hierarchyId: string;
  businessId: string;
}): void {
  emitApprovalHierarchyEvent(DOMAIN_EVENT_TYPES.APPROVAL_HIERARCHY_DELETED, {
    actorUserId: params.actorUserId,
    entityId: params.hierarchyId,
    businessId: params.businessId,
  });
}

export function recordApprovalHierarchyAssignedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  assignmentTarget: 'employee' | 'position' | 'department';
  targetId: string;
  entriesCreated: number;
  entriesUpdated: number;
}): void {
  emitApprovalHierarchyEvent(DOMAIN_EVENT_TYPES.APPROVAL_HIERARCHY_ASSIGNED, {
    actorUserId: params.actorUserId,
    entityId: params.targetId,
    businessId: params.businessId,
    metadata: {
      assignmentTarget: params.assignmentTarget,
      entriesCreated: params.entriesCreated,
      entriesUpdated: params.entriesUpdated,
    },
  });
}

export function recordApprovalHierarchyValidatedDomainEvent(params: {
  actorUserId: string;
  businessId: string;
  valid: boolean;
  issueCount: number;
}): void {
  emitApprovalHierarchyEvent(DOMAIN_EVENT_TYPES.APPROVAL_HIERARCHY_VALIDATED, {
    actorUserId: params.actorUserId,
    entityId: params.businessId,
    businessId: params.businessId,
    metadata: {
      valid: params.valid,
      issueCount: params.issueCount,
    },
  });
}
