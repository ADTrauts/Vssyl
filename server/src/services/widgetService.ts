import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  contextFromDashboard,
  recordBookmarkCreated,
  recordQuickNoteCreated,
  recordWidgetAdded,
  recordWidgetLayoutBatchUpdate,
  recordWidgetRemoved,
  recordWidgetUpdated,
} from './dashboardActivityService';
import {
  listBookmarkIds,
  listQuickNoteIds,
} from './dashboardWidgetVisibilityService';
import {
  recordDashboardWidgetAddedDomainEvent,
  recordDashboardWidgetRemovedDomainEvent,
} from './dashboardDomainEventService';

async function loadDashboardContext(dashboardId: string, userId: string) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { id: true, businessId: true, householdId: true, institutionId: true },
  });
  if (!dashboard) return null;
  return contextFromDashboard(dashboard);
}

function parseBookmarkItems(config: unknown): Array<{ id: string; title: string; url: string }> {
  if (!config || typeof config !== 'object') return [];
  const bookmarks = (config as { bookmarks?: unknown }).bookmarks;
  if (!Array.isArray(bookmarks)) return [];
  return bookmarks
    .filter((b): b is { id: string; title?: string; url?: string } => typeof b?.id === 'string')
    .map((b) => ({ id: b.id, title: b.title ?? '', url: b.url ?? '' }));
}

function parseQuickNoteItems(config: unknown): Array<{ id: string; content: string }> {
  if (!config || typeof config !== 'object') return [];
  const notes = (config as { notes?: unknown }).notes;
  if (!Array.isArray(notes)) return [];
  return notes
    .filter((n): n is { id: string; content?: string } => typeof n?.id === 'string')
    .map((n) => ({ id: n.id, content: n.content ?? '' }));
}

async function emitWidgetContentCreates(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: ReturnType<typeof contextFromDashboard>;
  previousConfig: unknown;
  nextConfig: unknown;
}): Promise<void> {
  if (params.widget.type === 'quicknotes' && params.nextConfig) {
    const prevIds = new Set(listQuickNoteIds(params.previousConfig));
    for (const note of parseQuickNoteItems(params.nextConfig)) {
      if (prevIds.has(note.id)) continue;
      const preview = note.content.trim().split('\n')[0]?.slice(0, 80);
      await recordQuickNoteCreated({
        actorUserId: params.actorUserId,
        widget: { id: params.widget.id, dashboardId: params.widget.dashboardId },
        dashboard: params.dashboard,
        noteId: note.id,
        titlePreview: preview || undefined,
      });
    }
  }

  if (params.widget.type === 'bookmarks' && params.nextConfig) {
    const prevIds = new Set(listBookmarkIds(params.previousConfig));
    for (const bookmark of parseBookmarkItems(params.nextConfig)) {
      if (prevIds.has(bookmark.id)) continue;
      await recordBookmarkCreated({
        actorUserId: params.actorUserId,
        widget: { id: params.widget.id, dashboardId: params.widget.dashboardId },
        dashboard: params.dashboard,
        bookmarkId: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
      });
    }
  }
}

// Widget service stubs
export async function createWidget(userId: string, dashboardId: string, data: { type: string; config?: Record<string, unknown>; position?: Record<string, unknown> }) {
  // Ensure dashboard belongs to user
  const dashboardCtx = await loadDashboardContext(dashboardId, userId);
  if (!dashboardCtx) return null;

  const widget = await prisma.widget.create({
    data: {
      dashboardId,
      type: data.type,
      config: data.config as Prisma.InputJsonValue,
      position: data.position as Prisma.InputJsonValue,
    },
  });

  await recordWidgetAdded({
    actorUserId: userId,
    widget: { id: widget.id, type: widget.type, dashboardId },
    dashboard: dashboardCtx,
  });

  recordDashboardWidgetAddedDomainEvent({
    actorUserId: userId,
    widget: { id: widget.id, type: widget.type, dashboardId },
    dashboard: dashboardCtx,
  });

  return widget;
}

export async function updateWidget(userId: string, widgetId: string, data: { type?: string; config?: Record<string, unknown>; position?: Record<string, unknown> }) {
  // Ensure widget belongs to a dashboard owned by user
  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, dashboard: { userId } },
    include: {
      dashboard: {
        select: { id: true, businessId: true, householdId: true, institutionId: true },
      },
    },
  });
  if (!widget) return null;

  const updated = await prisma.widget.update({
    where: { id: widgetId },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.config !== undefined ? { config: data.config as Prisma.InputJsonValue } : {}),
      ...(data.position !== undefined ? { position: data.position as Prisma.InputJsonValue } : {}),
    },
  });

  const configKeys = data.config ? Object.keys(data.config) : undefined;
  const dashboardCtx = contextFromDashboard(widget.dashboard);
  await recordWidgetUpdated({
    actorUserId: userId,
    widget: { id: updated.id, type: updated.type, dashboardId: widget.dashboardId },
    dashboard: dashboardCtx,
    configKeys,
    positionChanged: data.position !== undefined,
  });

  if (data.config !== undefined) {
    await emitWidgetContentCreates({
      actorUserId: userId,
      widget: { id: updated.id, type: updated.type, dashboardId: widget.dashboardId },
      dashboard: dashboardCtx,
      previousConfig: widget.config,
      nextConfig: data.config,
    });
  }

  return updated;
}

export async function deleteWidget(userId: string, widgetId: string) {
  // Ensure widget belongs to a dashboard owned by user
  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, dashboard: { userId } },
    include: {
      dashboard: {
        select: { id: true, businessId: true, householdId: true, institutionId: true },
      },
    },
  });
  if (!widget) return null;

  await prisma.widget.delete({ where: { id: widgetId } });

  await recordWidgetRemoved({
    actorUserId: userId,
    widget: { id: widget.id, type: widget.type, dashboardId: widget.dashboardId },
    dashboard: contextFromDashboard(widget.dashboard),
  });

  recordDashboardWidgetRemovedDomainEvent({
    actorUserId: userId,
    widget: { id: widget.id, type: widget.type, dashboardId: widget.dashboardId },
    dashboard: contextFromDashboard(widget.dashboard),
  });

  return widget;
}

export async function batchUpdatePositions(
  userId: string,
  dashboardId: string,
  positions: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>
) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { id: true, businessId: true, householdId: true, institutionId: true },
  });
  if (!dashboard) return null;

  const widgetIds = positions.map((p) => p.widgetId);
  const existingWidgets = await prisma.widget.findMany({
    where: { id: { in: widgetIds }, dashboardId },
    select: { id: true },
  });
  const validIds = new Set(existingWidgets.map((w) => w.id));

  const validPositions = positions.filter((p) => validIds.has(p.widgetId));

  const updates = validPositions.map((p) =>
    prisma.widget.update({
      where: { id: p.widgetId },
      data: {
        position: { x: p.x, y: p.y, w: p.w, h: p.h } as Prisma.InputJsonValue,
      },
    })
  );

  const result = await prisma.$transaction(updates);

  if (validPositions.length > 0) {
    await recordWidgetLayoutBatchUpdate({
      actorUserId: userId,
      dashboard: contextFromDashboard(dashboard),
      widgetCount: existingWidgets.length,
      positionCount: validPositions.length,
    });
  }

  return result;
}
