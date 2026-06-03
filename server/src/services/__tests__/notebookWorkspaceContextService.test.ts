import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as notesVisibility from '../notes/notesVisibilityService';
import * as todoVisibility from '../todoVisibilityService';
import * as calendarVisibility from '../calendarVisibilityService';
import * as driveVisibility from '../driveVisibilityService';
import * as notesPermission from '../notes/notesPermissionService';
import { TodoServiceError } from '../todo/todoErrors';
import {
  buildWorkspaceInsights,
  getWorkspaceContext,
} from '../notebook/notebookWorkspaceContextService';

describe('notebookWorkspaceContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(todoVisibility, 'resolveDashboardScopeForRead').mockResolvedValue({
      dashboardId: 'dash-1',
      businessId: null,
    });
    vi.spyOn(prisma.notebookLink, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.notebookLink, 'groupBy').mockResolvedValue([]);
  });

  it('returns empty workspace snapshot', async () => {
    vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([]);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([]);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([]);

    const ctx = await getWorkspaceContext({
      userId: 'u1',
      dashboardId: 'dash-1',
      greetingName: 'Andrew',
    });

    expect(ctx.greetingName).toBe('Andrew');
    expect(ctx.recentPages).toHaveLength(0);
    expect(ctx.openTasks).toHaveLength(0);
    expect(ctx.upcomingMeetings).toHaveLength(0);
    expect(ctx.workspaceInsights.length).toBeGreaterThan(0);
    expect(ctx.suggestedFocus.length).toBeGreaterThan(0);
  });

  it('aggregates tasks with overdue and open filters', async () => {
    vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([
      {
        id: 't-over',
        title: 'Late',
        status: 'TODO',
        dueDate: new Date('2020-01-01'),
        priority: 'HIGH',
        dashboardId: 'dash-1',
        businessId: null,
        householdId: null,
      },
    ] as never);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([
      {
        id: 't-open',
        title: 'Open',
        status: 'IN_PROGRESS',
        dueDate: null,
        priority: 'MEDIUM',
        dashboardId: 'dash-1',
        businessId: null,
        householdId: null,
      },
      {
        id: 't-done',
        title: 'Done',
        status: 'DONE',
        dueDate: null,
        priority: 'LOW',
        dashboardId: 'dash-1',
        businessId: null,
        householdId: null,
      },
    ] as never);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([]);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([]);

    const ctx = await getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-1' });

    expect(ctx.overdueTasks).toHaveLength(1);
    expect(ctx.openTasks).toHaveLength(1);
    expect(ctx.openTasks[0].id).toBe('t-open');
    expect(ctx.workspaceInsights.some((i) => i.type === 'overdue_tasks')).toBe(true);
  });

  it('aggregates upcoming meetings', async () => {
    vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([]);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([]);
    const start = new Date();
    const end = new Date(Date.now() + 3600000);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([
      {
        id: 'evt-1',
        title: 'Standup',
        startAt: start,
        endAt: end,
        occurrenceStartAt: start,
        occurrenceEndAt: end,
        location: 'Room A',
        allDay: false,
      },
    ] as never);

    const ctx = await getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-1' });

    expect(ctx.upcomingMeetings).toHaveLength(1);
    expect(ctx.upcomingMeetings[0].title).toBe('Standup');
  });

  it('aggregates recent files from drive visibility', async () => {
    vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([]);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([]);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([
      {
        id: 'f-1',
        name: 'Plan.pdf',
        type: 'application/pdf',
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    ] as never);

    const ctx = await getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-1' });

    expect(ctx.recentFiles.some((f) => f.id === 'f-1')).toBe(true);
  });

  it('builds insight cards without AI', () => {
    const { insights, suggestedFocus } = buildWorkspaceInsights({
      overdueCount: 4,
      dueTodayCount: 2,
      meetingsTodayCount: 3,
      openTaskCount: 12,
      pagesWithoutTaskLinks: 1,
      meetingsWithoutTaskLinks: 1,
      recentlyEditedCount: 5,
    });

    expect(insights.find((i) => i.type === 'overdue_tasks')?.count).toBe(4);
    expect(insights.find((i) => i.type === 'meetings_today')?.count).toBe(3);
    expect(suggestedFocus.some((s) => s.includes('overdue'))).toBe(true);
  });

  it('fails closed on dashboard access denial', async () => {
    vi.spyOn(todoVisibility, 'resolveDashboardScopeForRead').mockRejectedValue(
      new TodoServiceError('Access denied', 'forbidden', 403)
    );

    await expect(
      getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-other' })
    ).rejects.toBeInstanceOf(TodoServiceError);
  });

  it('scopes pages to dashboard via listPages', async () => {
    const listSpy = vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([
      {
        id: 'p1',
        title: 'Leadership Meeting',
        content: '',
        tags: ['meeting'],
        pinned: true,
        dashboardId: 'dash-1',
        businessId: null,
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: true,
      },
    ] as never);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([]);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([]);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([]);

    const ctx = await getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-1' });

    expect(listSpy).toHaveBeenCalledWith(
      expect.objectContaining({ dashboardId: 'dash-1', userId: 'u1' })
    );
    expect(ctx.recentPages[0].title).toBe('Leadership Meeting');
    expect(ctx.favoritePages).toHaveLength(1);
  });

  it('filters inaccessible meeting pages', async () => {
    vi.spyOn(notesVisibility, 'listPages').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listOverdueTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listDueSoonTasks').mockResolvedValue([]);
    vi.spyOn(todoVisibility, 'listAccessibleTasks').mockResolvedValue([]);
    vi.spyOn(driveVisibility, 'listAccessibleDriveFilesForBrowse').mockResolvedValue([]);
    vi.spyOn(calendarVisibility, 'listEventsInRange').mockResolvedValue([]);

    vi.spyOn(prisma.notebookLink, 'findMany')
      .mockResolvedValueOnce([{ sourceId: 'page-secret', targetId: 'evt-1' }] as never)
      .mockResolvedValue([]);
    vi.spyOn(notesPermission, 'findReadablePage').mockResolvedValue(null);

    const ctx = await getWorkspaceContext({ userId: 'u1', dashboardId: 'dash-1' });

    expect(ctx.recentMeetingPages).toHaveLength(0);
  });
});
