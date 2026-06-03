import type { NotebookLinkEntityType, NotebookLinkRelationshipType } from '@prisma/client';
import {
  emitNotebookLinkArchivedEvent,
  emitNotebookLinkCreatedEvent,
} from '../../events/domainEventEmitters';

export function recordLinkCreatedDomainEvent(params: {
  actorUserId: string;
  linkId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  dashboardId: string;
  businessId: string | null;
}): void {
  emitNotebookLinkCreatedEvent({
    actorUserId: params.actorUserId,
    linkId: params.linkId,
    pageId: params.pageId,
    targetType: params.targetType,
    targetId: params.targetId,
    relationshipType: params.relationshipType,
    dashboardId: params.dashboardId,
    businessId: params.businessId,
  });
}

export function recordLinkArchivedDomainEvent(params: {
  actorUserId: string;
  linkId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  dashboardId: string;
  businessId: string | null;
}): void {
  emitNotebookLinkArchivedEvent({
    actorUserId: params.actorUserId,
    linkId: params.linkId,
    pageId: params.pageId,
    targetType: params.targetType,
    targetId: params.targetId,
    dashboardId: params.dashboardId,
    businessId: params.businessId,
  });
}
