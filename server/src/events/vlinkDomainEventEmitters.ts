import { emitDomainEvent } from './emitDomainEvent';
import { buildTypedDomainEventInput, DOMAIN_EVENT_TYPES } from './domainEventRegistry';
import type { DomainEvent } from './types';
import type { VLink, VLinkEntitySource, VLinkEntityType, VLinkMemberRole, VLinkScope } from '@prisma/client';

type VLinkContext = Pick<VLink, 'dashboardId' | 'businessId' | 'householdId'>;

function vlinkContext(vlink: VLinkContext) {
  return {
    dashboardId: vlink.dashboardId,
    businessId: vlink.businessId,
    householdId: vlink.householdId,
  };
}

export function emitVLinkCreatedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  publicCode: string;
  scope: VLinkScope;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  parentVLinkId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      metadata: {
        publicCode: params.publicCode,
        scope: params.scope,
        ...(params.parentVLinkId ? { parentVLinkId: params.parentVLinkId } : {}),
      },
    })
  );
}

export function emitVLinkUpdatedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
    })
  );
}

export function emitVLinkArchivedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_ARCHIVED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
    })
  );
}

export function emitVLinkDeletedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_DELETED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
    })
  );
}

export function emitVLinkRestoredEvent(params: {
  actorUserId: string;
  vlinkId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_RESTORED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
    })
  );
}

export function emitVLinkMemberAddedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  memberUserId: string;
  role: VLinkMemberRole;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_MEMBER_ADDED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: { memberUserId: params.memberUserId, role: params.role },
    })
  );
}

export function emitVLinkMemberUpdatedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  memberUserId: string;
  role: VLinkMemberRole;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_MEMBER_UPDATED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: { memberUserId: params.memberUserId, role: params.role },
    })
  );
}

export function emitVLinkMemberRemovedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  memberUserId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_MEMBER_REMOVED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: { memberUserId: params.memberUserId },
    })
  );
}

export function emitVLinkOwnershipTransferredEvent(params: {
  actorUserId: string;
  vlinkId: string;
  fromUserId: string;
  toUserId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_OWNERSHIP_TRANSFERRED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: { fromUserId: params.fromUserId, toUserId: params.toUserId },
    })
  );
}

export function emitVLinkEntityLinkedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string | null;
  source: VLinkEntitySource;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_ENTITY_LINKED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: {
        entityType: params.entityType,
        linkedEntityId: params.entityId,
        moduleId: params.moduleId ?? undefined,
        source: params.source,
      },
    })
  );
}

export function emitVLinkEntityUnlinkedEvent(params: {
  actorUserId: string;
  vlinkId: string;
  entityType: VLinkEntityType;
  entityId: string;
  vlink: VLinkContext;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_ENTITY_UNLINKED, {
      actorUserId: params.actorUserId,
      entityId: params.vlinkId,
      ...vlinkContext(params.vlink),
      metadata: { entityType: params.entityType, linkedEntityId: params.entityId },
    })
  );
}

export function emitVLinkSuggestionCreatedEvent(params: {
  actorUserId: string;
  suggestionId: string;
  entityType: VLinkEntityType;
  entityId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_SUGGESTION_CREATED, {
      actorUserId: params.actorUserId,
      entityId: params.suggestionId,
      metadata: { entityType: params.entityType, linkedEntityId: params.entityId },
    })
  );
}

export function emitVLinkSuggestionAcceptedEvent(params: {
  actorUserId: string;
  suggestionId: string;
  vlinkId: string;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_SUGGESTION_ACCEPTED, {
      actorUserId: params.actorUserId,
      entityId: params.suggestionId,
      metadata: { vlinkId: params.vlinkId },
    })
  );
}

export function emitVLinkSuggestionRejectedEvent(params: {
  actorUserId: string;
  suggestionId: string;
  vlinkId?: string | null;
}): DomainEvent {
  return emitDomainEvent(
    buildTypedDomainEventInput(DOMAIN_EVENT_TYPES.VLINK_SUGGESTION_REJECTED, {
      actorUserId: params.actorUserId,
      entityId: params.suggestionId,
      metadata: params.vlinkId ? { vlinkId: params.vlinkId } : {},
    })
  );
}
