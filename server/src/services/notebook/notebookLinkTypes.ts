import type {
  NotebookLink,
  NotebookLinkDirection,
  NotebookLinkEntityType,
  NotebookLinkRelationshipType,
} from '@prisma/client';

export type NotebookLinkRow = NotebookLink;

export interface CreatePageLinkInput {
  userId: string;
  pageId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  relationshipType?: NotebookLinkRelationshipType;
  metadata?: Record<string, unknown>;
}

export interface ListPageLinksInput {
  userId: string;
  pageId: string;
  targetType?: NotebookLinkEntityType;
  relationshipType?: NotebookLinkRelationshipType;
  includeArchived?: boolean;
}

export interface NotebookLinkTargetDto {
  kind: 'task' | 'file' | 'event' | 'conversation' | 'place_listing';
  id: string;
  title?: string;
  status?: string;
  dueDate?: string | null;
  name?: string;
  mimeType?: string | null;
  size?: number | null;
  extension?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  ownerName?: string | null;
  dashboardId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  onlineMeetingLink?: string | null;
  allDay?: boolean;
  attendeesSummary?: string | null;
  trashed?: boolean;
}

export interface NotebookLinkPageSummaryDto {
  id: string;
  title: string;
}

export interface EntityNotebookLinkListItem {
  id: string;
  sourceType: NotebookLinkEntityType;
  sourceId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  direction: NotebookLinkDirection;
  createdAt: string;
  page?: NotebookLinkPageSummaryDto;
}

export interface ListEntityLinksResult {
  entityType: NotebookLinkEntityType;
  entityId: string;
  links: EntityNotebookLinkListItem[];
}

export interface NotebookLinkListItem {
  id: string;
  sourceType: NotebookLinkEntityType;
  sourceId: string;
  targetType: NotebookLinkEntityType;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  direction: NotebookLinkDirection;
  createdById: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  target?: NotebookLinkTargetDto;
  /** False when link exists but target is not visible to the user. */
  targetAccessible?: boolean;
}

export interface ListPageLinksResult {
  pageId: string;
  links: NotebookLinkListItem[];
}

export interface ListEntityLinksInput {
  userId: string;
  entityType: NotebookLinkEntityType;
  entityId: string;
}
