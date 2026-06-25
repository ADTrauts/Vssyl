import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateDashboardPolicyDual } from '../auth/dashboardPolicyDual';

export interface DashboardWidgetSearchHit {
  entityType: 'quick_note' | 'bookmark';
  id: string;
  title: string;
  description: string;
  widgetId: string;
  widgetType: 'quicknotes' | 'bookmarks';
  dashboardId: string;
  businessId: string | null;
  householdId: string | null;
  updatedAt: Date;
}

interface QuickNoteConfigItem {
  id?: string;
  content?: string;
  pinned?: boolean;
  updatedAt?: string;
}

interface BookmarkConfigItem {
  id?: string;
  title?: string;
  url?: string;
}

function parseQuickNotes(config: unknown): QuickNoteConfigItem[] {
  if (!config || typeof config !== 'object') return [];
  const notes = (config as { notes?: unknown }).notes;
  return Array.isArray(notes) ? (notes as QuickNoteConfigItem[]) : [];
}

function parseBookmarks(config: unknown): BookmarkConfigItem[] {
  if (!config || typeof config !== 'object') return [];
  const bookmarks = (config as { bookmarks?: unknown }).bookmarks;
  return Array.isArray(bookmarks) ? (bookmarks as BookmarkConfigItem[]) : [];
}

function noteTitle(content: string): string {
  const line = content.trim().split('\n')[0]?.trim() ?? '';
  if (line.length === 0) return 'Quick note';
  return line.length > 80 ? `${line.slice(0, 77)}...` : line;
}

async function passesDashboardRead(
  userId: string,
  dashboardId: string,
  businessId: string | null,
  householdId: string | null
): Promise<boolean> {
  const policy = await evaluateDashboardPolicyDual({
    userId,
    action: POLICY_ACTIONS.DASHBOARD_READ,
    resourceId: dashboardId,
    scope: {
      dashboardId,
      businessId: businessId ?? undefined,
      householdId: householdId ?? undefined,
    },
  });
  return !policy.blocked;
}

/**
 * Federated search for composition widgets stored in Widget.config (Quick Notes, Bookmarks).
 * Scoped to dashboards owned by the user; PE-gated per dashboard.
 */
export async function searchAccessibleDashboardWidgets(params: {
  userId: string;
  query: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  limit?: number;
}): Promise<DashboardWidgetSearchHit[]> {
  const term = params.query.trim();
  if (term.length < 2) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const dashboardWhere: Prisma.DashboardWhereInput = {
    userId: params.userId,
    ...(params.dashboardId ? { id: params.dashboardId } : {}),
    ...(params.businessId !== undefined ? { businessId: params.businessId || null } : {}),
    ...(params.householdId ? { householdId: params.householdId } : {}),
  };

  const widgets = await prisma.widget.findMany({
    where: {
      type: { in: ['quicknotes', 'bookmarks'] },
      dashboard: dashboardWhere,
    },
    include: {
      dashboard: {
        select: {
          id: true,
          businessId: true,
          householdId: true,
          updatedAt: true,
        },
      },
    },
    take: 40,
    orderBy: { updatedAt: 'desc' },
  });

  const hits: DashboardWidgetSearchHit[] = [];
  const termLower = term.toLowerCase();

  for (const widget of widgets) {
    const dash = widget.dashboard;
    if (!(await passesDashboardRead(params.userId, dash.id, dash.businessId, dash.householdId))) {
      continue;
    }

    if (widget.type === 'quicknotes') {
      for (const note of parseQuickNotes(widget.config)) {
        const content = note.content ?? '';
        if (!content.toLowerCase().includes(termLower)) continue;
        const noteId = note.id ?? `note-${widget.id}`;
        hits.push({
          entityType: 'quick_note',
          id: noteId,
          title: noteTitle(content),
          description: 'Quick note on dashboard',
          widgetId: widget.id,
          widgetType: 'quicknotes',
          dashboardId: dash.id,
          businessId: dash.businessId,
          householdId: dash.householdId,
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : widget.updatedAt,
        });
      }
    }

    if (widget.type === 'bookmarks') {
      for (const bookmark of parseBookmarks(widget.config)) {
        const title = bookmark.title ?? '';
        const url = bookmark.url ?? '';
        if (
          !title.toLowerCase().includes(termLower) &&
          !url.toLowerCase().includes(termLower)
        ) {
          continue;
        }
        const bookmarkId = bookmark.id ?? `bm-${widget.id}`;
        hits.push({
          entityType: 'bookmark',
          id: bookmarkId,
          title: title || url,
          description: url || 'Dashboard bookmark',
          widgetId: widget.id,
          widgetType: 'bookmarks',
          dashboardId: dash.id,
          businessId: dash.businessId,
          householdId: dash.householdId,
          updatedAt: widget.updatedAt,
        });
      }
    }
  }

  return hits
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

export function listQuickNoteIds(config: unknown): string[] {
  return parseQuickNotes(config)
    .map((n) => n.id)
    .filter((id): id is string => typeof id === 'string');
}

export function listBookmarkIds(config: unknown): string[] {
  return parseBookmarks(config)
    .map((b) => b.id)
    .filter((id): id is string => typeof id === 'string');
}
