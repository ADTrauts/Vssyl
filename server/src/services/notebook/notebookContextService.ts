import type { NotebookLinkEntityType, NotebookLinkRelationshipType } from '@prisma/client';
import { NotesServiceError } from '../notes/notesErrors';
import { getPageById } from '../notes/notesVisibilityService';
import { listPageShares } from '../notes/notesShareService';
import * as notebookLinkService from './notebookLinkService';
import type { NotebookLinkListItem } from './notebookLinkTypes';
import type {
  NotebookContextRelationshipCounts,
  NotebookContextSummary,
  NotebookEventContext,
  NotebookFileContext,
  NotebookPageContext,
  NotebookPageContextMeta,
  NotebookPageShareContext,
  NotebookTaskContext,
} from './notebookContextTypes';

function toIsoDate(value: Date): string {
  return value.toISOString();
}

function mapPageMeta(
  page: Awaited<ReturnType<typeof getPageById>> & NonNullable<Awaited<ReturnType<typeof getPageById>>>
): NotebookPageContextMeta {
  return {
    id: page.id,
    title: page.title,
    content: page.content,
    tags: page.tags,
    pinned: page.pinned,
    dashboardId: page.dashboardId,
    businessId: page.businessId,
    folderId: page.folderId,
    createdAt: toIsoDate(page.createdAt),
    updatedAt: toIsoDate(page.updatedAt),
    isOwner: page.isOwner,
    canEdit: page.canEdit,
  };
}

function mapShares(
  rows: Array<{
    id: string;
    sharedWithUserId: string;
    role: string;
    createdAt: Date;
    sharedWith?: { id: string; name: string | null; email: string | null } | null;
  }>
): NotebookPageShareContext[] {
  return rows.map((row) => ({
    id: row.id,
    sharedWithUserId: row.sharedWithUserId,
    role: row.role,
    createdAt: toIsoDate(row.createdAt),
    displayName: row.sharedWith?.name ?? null,
    email: row.sharedWith?.email ?? null,
  }));
}

function isAccessibleHydratedTarget(link: NotebookLinkListItem): boolean {
  return link.targetAccessible === true && link.target != null && link.target.trashed !== true;
}

function mapTaskLink(link: NotebookLinkListItem): NotebookTaskContext | null {
  const target = link.target;
  if (!target || target.kind !== 'task' || !target.title || !target.status) return null;
  return {
    linkId: link.id,
    targetId: link.targetId,
    relationshipType: link.relationshipType,
    metadata: link.metadata,
    title: target.title,
    status: target.status,
    dueDate: target.dueDate ?? null,
  };
}

function mapFileLink(link: NotebookLinkListItem): NotebookFileContext | null {
  const target = link.target;
  if (!target || target.kind !== 'file' || !target.name) return null;
  return {
    linkId: link.id,
    targetId: link.targetId,
    relationshipType: link.relationshipType,
    metadata: link.metadata,
    name: target.name,
    mimeType: target.mimeType ?? null,
    size: target.size ?? null,
    extension: target.extension ?? null,
    ownerName: target.ownerName ?? null,
    dashboardId: target.dashboardId ?? null,
    createdAt: target.createdAt ?? null,
    updatedAt: target.updatedAt ?? null,
  };
}

function mapEventLink(link: NotebookLinkListItem): NotebookEventContext | null {
  const target = link.target;
  if (!target || target.kind !== 'event' || !target.title || !target.startTime || !target.endTime) {
    return null;
  }
  return {
    linkId: link.id,
    targetId: link.targetId,
    relationshipType: link.relationshipType,
    metadata: link.metadata,
    title: target.title,
    startTime: target.startTime,
    endTime: target.endTime,
    location: target.location ?? null,
    onlineMeetingLink: target.onlineMeetingLink ?? null,
    allDay: target.allDay ?? false,
    attendeesSummary: target.attendeesSummary ?? null,
  };
}

function buildRelationshipCounts(
  links: NotebookLinkListItem[],
  restrictedLinks: number,
  trashedTargets: number,
  accessibleLinks: number
): NotebookContextRelationshipCounts {
  const byTargetType: Partial<Record<NotebookLinkEntityType, number>> = {};
  const byRelationshipType: Partial<Record<NotebookLinkRelationshipType, number>> = {};

  for (const link of links) {
    byTargetType[link.targetType] = (byTargetType[link.targetType] ?? 0) + 1;
    byRelationshipType[link.relationshipType] =
      (byRelationshipType[link.relationshipType] ?? 0) + 1;
  }

  return {
    totalLinks: links.length,
    accessibleLinks,
    restrictedLinks,
    trashedTargets,
    byTargetType,
    byRelationshipType,
  };
}

function buildSummary(params: {
  page: NotebookPageContextMeta;
  tasks: NotebookTaskContext[];
  files: NotebookFileContext[];
  events: NotebookEventContext[];
  shares: NotebookPageShareContext[];
  totalLinks: number;
  accessibleLinks: number;
  restrictedLinks: number;
  trashedTargets: number;
}): NotebookContextSummary {
  return {
    taskCount: params.tasks.length,
    fileCount: params.files.length,
    eventCount: params.events.length,
    totalLinks: params.totalLinks,
    accessibleLinks: params.accessibleLinks,
    restrictedLinks: params.restrictedLinks,
    trashedTargets: params.trashedTargets,
    shareCount: params.shares.length,
    contentLength: params.page.content.length,
    tagCount: params.page.tags.length,
  };
}

/**
 * Canonical read-only aggregation for a Notebook page.
 * Uses Notes + NotebookLink visibility paths only — never bypasses module permissions.
 */
export async function getPageContext(pageId: string, userId: string): Promise<NotebookPageContext> {
  const pageDetail = await getPageById(pageId, userId);
  if (!pageDetail) {
    throw new NotesServiceError('Page not found', 'not_found', 404);
  }

  const page = mapPageMeta(pageDetail);

  let shares: NotebookPageShareContext[] = [];
  if (pageDetail.isOwner) {
    try {
      const shareRows = await listPageShares({ ownerUserId: userId, pageId });
      shares = mapShares(shareRows);
    } catch (error: unknown) {
      if (!(error instanceof NotesServiceError)) {
        throw error;
      }
    }
  }

  const { links } = await notebookLinkService.listPageLinks({
    userId,
    pageId,
    includeArchived: false,
  });

  const tasks: NotebookTaskContext[] = [];
  const files: NotebookFileContext[] = [];
  const events: NotebookEventContext[] = [];
  let restrictedLinks = 0;
  let trashedTargets = 0;

  for (const link of links) {
    if (!link.targetAccessible || !link.target) {
      restrictedLinks += 1;
      continue;
    }
    if (link.target.trashed) {
      trashedTargets += 1;
      continue;
    }
    if (!isAccessibleHydratedTarget(link)) {
      restrictedLinks += 1;
      continue;
    }

    switch (link.targetType) {
      case 'TASK': {
        const mapped = mapTaskLink(link);
        if (mapped) tasks.push(mapped);
        break;
      }
      case 'FILE': {
        const mapped = mapFileLink(link);
        if (mapped) files.push(mapped);
        break;
      }
      case 'CALENDAR_EVENT': {
        const mapped = mapEventLink(link);
        if (mapped) events.push(mapped);
        break;
      }
      default:
        break;
    }
  }

  const accessibleLinks = tasks.length + files.length + events.length;

  const summary = buildSummary({
    page,
    tasks,
    files,
    events,
    shares,
    totalLinks: links.length,
    accessibleLinks,
    restrictedLinks,
    trashedTargets,
  });

  const relationshipCounts = buildRelationshipCounts(
    links,
    restrictedLinks,
    trashedTargets,
    accessibleLinks
  );

  return {
    pageId,
    page,
    shares,
    tasks,
    files,
    events,
    summary,
    relationshipCounts,
    generatedAt: new Date().toISOString(),
  };
}
