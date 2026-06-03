import { getPageContext } from './notebookContextService';
import type { NotebookPageContext } from './notebookContextTypes';

export const NOTEBOOK_AI_MAX_PAGE_CONTENT_CHARS = 12_000;
export const NOTEBOOK_AI_MAX_LINKED_ITEMS = 25;

export interface NotebookGroundedTask {
  linkId: string;
  targetId: string;
  title: string;
  status: string;
  dueDate: string | null;
  relationshipType: string;
}

export interface NotebookGroundedFile {
  linkId: string;
  targetId: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  relationshipType: string;
}

export interface NotebookGroundedEvent {
  linkId: string;
  targetId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  relationshipType: string;
}

export interface NotebookGroundedAIContext {
  pageId: string;
  dashboardId: string;
  businessId: string | null;
  page: {
    title: string;
    content: string;
    tags: string[];
    pinned: boolean;
    canEdit: boolean;
    isOwner: boolean;
  };
  tasks: NotebookGroundedTask[];
  files: NotebookGroundedFile[];
  events: NotebookGroundedEvent[];
  shareCount: number;
  warnings: string[];
  grounding: {
    restrictedLinks: number;
    trashedTargets: number;
    contentTruncated: boolean;
    emptyContent: boolean;
    totalLinks: number;
  };
  sourceGeneratedAt: string;
}

function truncateContent(content: string, max: number): { text: string; truncated: boolean } {
  if (content.length <= max) return { text: content, truncated: false };
  return {
    text: `${content.slice(0, max)}\n\n[Content truncated for AI context]`,
    truncated: true,
  };
}

export function buildGroundedContextFromPageContext(
  pageContext: NotebookPageContext
): NotebookGroundedAIContext {
  const { text: content, truncated: contentTruncated } = truncateContent(
    pageContext.page.content,
    NOTEBOOK_AI_MAX_PAGE_CONTENT_CHARS
  );

  const warnings: string[] = [];
  if (pageContext.summary.restrictedLinks > 0) {
    warnings.push(
      `${pageContext.summary.restrictedLinks} linked item(s) are restricted and were excluded from AI context.`
    );
  }
  if (pageContext.summary.trashedTargets > 0) {
    warnings.push(
      `${pageContext.summary.trashedTargets} linked item(s) are in trash and were excluded.`
    );
  }
  if (contentTruncated) {
    warnings.push('Page content was truncated to fit AI context limits.');
  }
  if (!content.trim()) {
    warnings.push('Page content is empty.');
  }

  const tasks = pageContext.tasks.slice(0, NOTEBOOK_AI_MAX_LINKED_ITEMS).map((t) => ({
    linkId: t.linkId,
    targetId: t.targetId,
    title: t.title,
    status: t.status,
    dueDate: t.dueDate,
    relationshipType: t.relationshipType,
  }));

  const files = pageContext.files.slice(0, NOTEBOOK_AI_MAX_LINKED_ITEMS).map((f) => ({
    linkId: f.linkId,
    targetId: f.targetId,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    relationshipType: f.relationshipType,
  }));

  const events = pageContext.events.slice(0, NOTEBOOK_AI_MAX_LINKED_ITEMS).map((e) => ({
    linkId: e.linkId,
    targetId: e.targetId,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    relationshipType: e.relationshipType,
  }));

  return {
    pageId: pageContext.pageId,
    dashboardId: pageContext.page.dashboardId,
    businessId: pageContext.page.businessId,
    page: {
      title: pageContext.page.title,
      content,
      tags: pageContext.page.tags,
      pinned: pageContext.page.pinned,
      canEdit: pageContext.page.canEdit,
      isOwner: pageContext.page.isOwner,
    },
    tasks,
    files,
    events,
    shareCount: pageContext.summary.shareCount,
    warnings,
    grounding: {
      restrictedLinks: pageContext.summary.restrictedLinks,
      trashedTargets: pageContext.summary.trashedTargets,
      contentTruncated,
      emptyContent: !pageContext.page.content.trim(),
      totalLinks: pageContext.summary.totalLinks,
    },
    sourceGeneratedAt: pageContext.generatedAt,
  };
}

export async function loadGroundedAIContext(
  pageId: string,
  userId: string
): Promise<NotebookGroundedAIContext> {
  const pageContext = await getPageContext(pageId, userId);
  return buildGroundedContextFromPageContext(pageContext);
}
