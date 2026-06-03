import type {
  NotebookLinkEntityType,
  NotebookLinkRelationshipType,
} from '@prisma/client';

/** Page metadata + content (Notes visibility path). */
export interface NotebookPageContextMeta {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  dashboardId: string;
  businessId: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  canEdit: boolean;
}

export interface NotebookPageShareContext {
  id: string;
  sharedWithUserId: string;
  role: string;
  createdAt: string;
  displayName: string | null;
  email: string | null;
}

export interface NotebookTaskContext {
  linkId: string;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  metadata: Record<string, unknown> | null;
  title: string;
  status: string;
  dueDate: string | null;
}

export interface NotebookFileContext {
  linkId: string;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  metadata: Record<string, unknown> | null;
  name: string;
  mimeType: string | null;
  size: number | null;
  extension: string | null;
  ownerName: string | null;
  dashboardId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotebookEventContext {
  linkId: string;
  targetId: string;
  relationshipType: NotebookLinkRelationshipType;
  metadata: Record<string, unknown> | null;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  onlineMeetingLink: string | null;
  allDay: boolean;
  attendeesSummary: string | null;
}

export interface NotebookContextRelationshipCounts {
  totalLinks: number;
  accessibleLinks: number;
  restrictedLinks: number;
  trashedTargets: number;
  byTargetType: Partial<Record<NotebookLinkEntityType, number>>;
  byRelationshipType: Partial<Record<NotebookLinkRelationshipType, number>>;
}

export interface NotebookContextSummary {
  taskCount: number;
  fileCount: number;
  eventCount: number;
  totalLinks: number;
  accessibleLinks: number;
  restrictedLinks: number;
  trashedTargets: number;
  shareCount: number;
  contentLength: number;
  tagCount: number;
}

export interface NotebookPageContext {
  pageId: string;
  page: NotebookPageContextMeta;
  shares: NotebookPageShareContext[];
  tasks: NotebookTaskContext[];
  files: NotebookFileContext[];
  events: NotebookEventContext[];
  summary: NotebookContextSummary;
  relationshipCounts: NotebookContextRelationshipCounts;
  generatedAt: string;
}
