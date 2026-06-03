import { prisma } from '../../lib/prisma';
import { listEventsInRange } from '../calendarVisibilityService';
import type { ExpandedOccurrence } from '../calendarRecurrenceService';
import { listAccessibleDriveFilesForBrowse } from '../driveVisibilityService';
import { listPages } from '../notes/notesVisibilityService';
import { findReadablePage } from '../notes/notesPermissionService';
import { fetchAccessibleActiveFiles } from '../driveVisibilityService';
import {
  listAccessibleTasks,
  listDueSoonTasks,
  listOverdueTasks,
  resolveDashboardScopeForRead,
} from '../todoVisibilityService';
import type {
  NotebookWorkspaceActivitySummary,
  NotebookWorkspaceContext,
  NotebookWorkspaceFileSummary,
  NotebookWorkspaceInsight,
  NotebookWorkspaceMeetingSummary,
  NotebookWorkspacePageSummary,
  NotebookWorkspaceTaskSummary,
} from './notebookWorkspaceContextTypes';

const MAX_LIST = 12;
const MAX_MEETINGS = 10;

function mapExpandedOccurrence(ev: ExpandedOccurrence): {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  allDay: boolean;
} | null {
  if (typeof ev.id !== 'string' || typeof ev.title !== 'string') return null;
  const startAt =
    ev.occurrenceStartAt instanceof Date
      ? ev.occurrenceStartAt
      : ev.startAt instanceof Date
        ? ev.startAt
        : null;
  const endAt =
    ev.occurrenceEndAt instanceof Date
      ? ev.occurrenceEndAt
      : ev.endAt instanceof Date
        ? ev.endAt
        : null;
  if (!startAt || !endAt) return null;
  return {
    id: ev.id,
    title: ev.title,
    startAt,
    endAt,
    location: typeof ev.location === 'string' ? ev.location : null,
    allDay: Boolean(ev.allDay),
  };
}

function normalizeBusinessId(businessId?: string | null): string | null {
  return businessId && businessId !== '' ? businessId : null;
}

function toPageSummary(page: {
  id: string;
  title: string;
  updatedAt: Date | string;
  pinned?: boolean;
  tags?: string[];
}): NotebookWorkspacePageSummary {
  return {
    id: page.id,
    title: page.title || 'Untitled page',
    updatedAt: typeof page.updatedAt === 'string' ? page.updatedAt : page.updatedAt.toISOString(),
    pinned: page.pinned ?? false,
    tags: page.tags ?? [],
  };
}

function toTaskSummary(task: {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  priority: string;
}): NotebookWorkspaceTaskSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function isDueToday(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  const start = startOfToday();
  const end = endOfToday();
  return dueDate >= start && dueDate <= end;
}

export function buildWorkspaceInsights(params: {
  overdueCount: number;
  dueTodayCount: number;
  meetingsTodayCount: number;
  openTaskCount: number;
  pagesWithoutTaskLinks: number;
  meetingsWithoutTaskLinks: number;
  recentlyEditedCount: number;
}): { insights: NotebookWorkspaceInsight[]; suggestedFocus: string[] } {
  const insights: NotebookWorkspaceInsight[] = [];
  const suggestedFocus: string[] = [];

  if (params.overdueCount > 0) {
    insights.push({
      type: 'overdue_tasks',
      severity: 'warning',
      count: params.overdueCount,
      message: `${params.overdueCount} overdue task${params.overdueCount === 1 ? '' : 's'}`,
    });
    suggestedFocus.push(`Review ${params.overdueCount} overdue action item${params.overdueCount === 1 ? '' : 's'}`);
  }

  if (params.dueTodayCount > 0) {
    insights.push({
      type: 'tasks_due_today',
      severity: 'info',
      count: params.dueTodayCount,
      message: `${params.dueTodayCount} task${params.dueTodayCount === 1 ? '' : 's'} due today`,
    });
    suggestedFocus.push(`Complete ${params.dueTodayCount} task${params.dueTodayCount === 1 ? '' : 's'} due today`);
  }

  if (params.meetingsTodayCount > 0) {
    insights.push({
      type: 'meetings_today',
      severity: 'info',
      count: params.meetingsTodayCount,
      message: `${params.meetingsTodayCount} meeting${params.meetingsTodayCount === 1 ? '' : 's'} today`,
    });
    suggestedFocus.push(`Prepare for ${params.meetingsTodayCount} meeting${params.meetingsTodayCount === 1 ? '' : 's'} today`);
  }

  if (params.openTaskCount > 0) {
    insights.push({
      type: 'open_tasks',
      severity: 'info',
      count: params.openTaskCount,
      message: `${params.openTaskCount} open task${params.openTaskCount === 1 ? '' : 's'}`,
    });
  }

  if (params.pagesWithoutTaskLinks > 0) {
    insights.push({
      type: 'pages_without_tasks',
      severity: 'info',
      count: params.pagesWithoutTaskLinks,
      message: `${params.pagesWithoutTaskLinks} recent page${params.pagesWithoutTaskLinks === 1 ? '' : 's'} without linked tasks`,
    });
    suggestedFocus.push('Add follow-up tasks to recent pages');
  }

  if (params.meetingsWithoutTaskLinks > 0) {
    insights.push({
      type: 'meetings_unresolved_actions',
      severity: 'warning',
      count: params.meetingsWithoutTaskLinks,
      message: `${params.meetingsWithoutTaskLinks} meeting page${params.meetingsWithoutTaskLinks === 1 ? '' : 's'} without linked tasks`,
    });
    suggestedFocus.push('Capture action items from recent meeting pages');
  }

  if (params.recentlyEditedCount > 0) {
    insights.push({
      type: 'recently_edited_pages',
      severity: 'info',
      count: params.recentlyEditedCount,
      message: `${params.recentlyEditedCount} page${params.recentlyEditedCount === 1 ? '' : 's'} edited in the last 7 days`,
    });
  }

  if (suggestedFocus.length === 0) {
    suggestedFocus.push('Review recent pages and link related work');
  }

  if (insights.length === 0) {
    insights.push({
      type: 'workspace_clear',
      severity: 'info',
      message: 'No urgent items — create a page or link tasks to build momentum.',
    });
  }

  return { insights, suggestedFocus: suggestedFocus.slice(0, 5) };
}

async function loadActivitySummary(
  dashboardId: string,
  since: Date
): Promise<NotebookWorkspaceActivitySummary> {
  const links = await prisma.notebookLink.findMany({
    where: {
      dashboardId,
      archivedAt: null,
      createdAt: { gte: since },
    },
    select: { targetType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const linksByTargetType: NotebookWorkspaceActivitySummary['linksByTargetType'] = {};
  for (const link of links) {
    const key = link.targetType as 'TASK' | 'FILE' | 'CALENDAR_EVENT';
    if (key === 'TASK' || key === 'FILE' || key === 'CALENDAR_EVENT') {
      linksByTargetType[key] = (linksByTargetType[key] ?? 0) + 1;
    }
  }

  return {
    recentLinkActions: links.length,
    linksByTargetType,
    lastLinkAt: links[0]?.createdAt.toISOString() ?? null,
  };
}

async function loadMeetingPages(
  userId: string,
  dashboardId: string
): Promise<Map<string, NotebookWorkspacePageSummary>> {
  const agendaLinks = await prisma.notebookLink.findMany({
    where: {
      dashboardId,
      archivedAt: null,
      relationshipType: 'AGENDA',
      targetType: 'CALENDAR_EVENT',
      sourceType: 'PAGE',
    },
    select: { sourceId: true },
    take: 50,
  });

  const pages = new Map<string, NotebookWorkspacePageSummary>();
  for (const link of agendaLinks) {
    if (pages.has(link.sourceId)) continue;
    const page = await findReadablePage(link.sourceId, userId);
    if (page) {
      pages.set(link.sourceId, toPageSummary(page));
    }
  }
  return pages;
}

async function loadPageTaskLinkCounts(
  dashboardId: string,
  pageIds: string[]
): Promise<Map<string, number>> {
  if (pageIds.length === 0) return new Map();
  const rows = await prisma.notebookLink.groupBy({
    by: ['sourceId'],
    where: {
      dashboardId,
      archivedAt: null,
      sourceType: 'PAGE',
      sourceId: { in: pageIds },
      targetType: 'TASK',
    },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.sourceId, row._count._all);
  }
  return map;
}

async function loadRecentLinkedFiles(
  userId: string,
  dashboardId: string
): Promise<NotebookWorkspaceFileSummary[]> {
  const fileLinks = await prisma.notebookLink.findMany({
    where: {
      dashboardId,
      archivedAt: null,
      targetType: 'FILE',
      sourceType: 'PAGE',
    },
    orderBy: { updatedAt: 'desc' },
    take: MAX_LIST,
    select: { targetId: true, sourceId: true },
  });

  if (fileLinks.length === 0) return [];

  const fileIds = [...new Set(fileLinks.map((l) => l.targetId))];
  const accessible = await fetchAccessibleActiveFiles(userId, fileIds);
  const pageByFile = new Map(fileLinks.map((l) => [l.targetId, l.sourceId]));

  return accessible
    .map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.type,
      updatedAt: (f.updatedAt ?? f.createdAt).toISOString(),
      linkedPageId: pageByFile.get(f.id) ?? null,
    }))
    .slice(0, MAX_LIST);
}

export async function getWorkspaceContext(params: {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  greetingName?: string | null;
}): Promise<NotebookWorkspaceContext> {
  const businessId = normalizeBusinessId(params.businessId);

  await resolveDashboardScopeForRead(params.userId, params.dashboardId, businessId ?? undefined);

  const ownedPages = await listPages({
    userId: params.userId,
    dashboardId: params.dashboardId,
    businessId,
  });

  const sortedPages = [...ownedPages].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const recentPages = sortedPages.slice(0, MAX_LIST).map(toPageSummary);
  const pinnedPages = sortedPages.filter((p) => p.pinned).slice(0, MAX_LIST).map(toPageSummary);
  const favoritePages = pinnedPages;

  const [overdue, dueSoon, allTasks, driveFiles, meetingPageMap] = await Promise.all([
      listOverdueTasks({
        userId: params.userId,
        dashboardId: params.dashboardId,
        businessId: businessId ?? undefined,
      }),
      listDueSoonTasks({
        userId: params.userId,
        dashboardId: params.dashboardId,
        businessId: businessId ?? undefined,
        dueSoonDays: 7,
      }),
      listAccessibleTasks({
        userId: params.userId,
        dashboardId: params.dashboardId,
        businessId: businessId ?? undefined,
      }),
      listAccessibleDriveFilesForBrowse({
        userId: params.userId,
        dashboardId: params.dashboardId,
      }),
      loadMeetingPages(params.userId, params.dashboardId),
    ]);

  const openTasks = allTasks
    .filter((t) => t.status !== 'DONE')
    .slice(0, MAX_LIST)
    .map(toTaskSummary);

  const overdueTasks = overdue.slice(0, MAX_LIST).map(toTaskSummary);
  const dueSoonTasks = dueSoon.slice(0, MAX_LIST).map(toTaskSummary);
  const dueTodayCount = openTasks.filter((t) =>
    t.dueDate ? isDueToday(new Date(t.dueDate)) : false
  ).length;

  const now = new Date();
  const rangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const rawEvents = await listEventsInRange({
    userId: params.userId,
    start: now.toISOString(),
    end: rangeEnd.toISOString(),
  });
  const events = rawEvents
    .map((ev) => mapExpandedOccurrence(ev))
    .filter((ev): ev is NonNullable<typeof ev> => ev != null);

  const agendaPageByEvent = new Map<string, { pageId: string; pageTitle: string }>();
  const agendaLinks = await prisma.notebookLink.findMany({
    where: {
      dashboardId: params.dashboardId,
      archivedAt: null,
      relationshipType: 'AGENDA',
      targetType: 'CALENDAR_EVENT',
    },
    select: { sourceId: true, targetId: true },
  });
  for (const link of agendaLinks) {
    const page = meetingPageMap.get(link.sourceId);
    if (page) {
      agendaPageByEvent.set(link.targetId, { pageId: page.id, pageTitle: page.title });
    }
  }

  const upcomingMeetings: NotebookWorkspaceMeetingSummary[] = events
    .slice(0, MAX_MEETINGS)
    .map((ev) => {
      const pageRef = agendaPageByEvent.get(ev.id);
      return {
        id: ev.id,
        title: ev.title,
        startAt: ev.startAt.toISOString(),
        endAt: ev.endAt.toISOString(),
        location: ev.location,
        allDay: ev.allDay,
        pageId: pageRef?.pageId ?? null,
        pageTitle: pageRef?.pageTitle ?? null,
      };
    });

  const meetingsTodayCount = events.filter((ev) => {
    const start = ev.startAt;
    return start >= startOfToday() && start <= endOfToday();
  }).length;

  const recentPageIds = recentPages.map((p) => p.id);
  const taskLinkCounts = await loadPageTaskLinkCounts(params.dashboardId, recentPageIds);
  const pagesWithoutTaskLinks = recentPageIds.filter((id) => !taskLinkCounts.get(id)).length;

  const meetingPageIds = [...meetingPageMap.keys()];
  const meetingTaskCounts = await loadPageTaskLinkCounts(params.dashboardId, meetingPageIds);
  const meetingsWithoutTaskLinks = meetingPageIds.filter((id) => !meetingTaskCounts.get(id)).length;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentlyEditedCount = ownedPages.filter(
    (p) => new Date(p.updatedAt) >= sevenDaysAgo
  ).length;

  const linkedFiles = await loadRecentLinkedFiles(params.userId, params.dashboardId);
  const driveSummaries: NotebookWorkspaceFileSummary[] = driveFiles.slice(0, 8).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.type,
    updatedAt: f.updatedAt.toISOString(),
  }));

  const recentFiles = [...linkedFiles, ...driveSummaries]
    .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
    .slice(0, MAX_LIST);

  const activitySummary = await loadActivitySummary(params.dashboardId, sevenDaysAgo);

  const { insights, suggestedFocus } = buildWorkspaceInsights({
    overdueCount: overdueTasks.length,
    dueTodayCount,
    meetingsTodayCount,
    openTaskCount: openTasks.length,
    pagesWithoutTaskLinks,
    meetingsWithoutTaskLinks,
    recentlyEditedCount,
  });

  return {
    dashboardId: params.dashboardId,
    businessId,
    greetingName: params.greetingName ?? null,
    recentPages,
    pinnedPages,
    favoritePages,
    openTasks,
    overdueTasks,
    dueSoonTasks,
    upcomingMeetings,
    recentMeetingPages: [...meetingPageMap.values()].slice(0, MAX_LIST),
    recentFiles,
    activitySummary,
    workspaceInsights: insights,
    suggestedFocus,
    generatedAt: new Date().toISOString(),
  };
}

export async function getWorkspaceInsights(params: {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
}): Promise<{ workspaceInsights: NotebookWorkspaceInsight[]; suggestedFocus: string[] }> {
  const ctx = await getWorkspaceContext(params);
  return {
    workspaceInsights: ctx.workspaceInsights,
    suggestedFocus: ctx.suggestedFocus,
  };
}
