import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesServiceError } from '../notes/notesErrors';
import * as notesVisibility from '../notes/notesVisibilityService';
import * as notesShare from '../notes/notesShareService';
import * as notebookLinkService from '../notebook/notebookLinkService';
import { getPageContext } from '../notebook/notebookContextService';

const basePage = {
  id: 'page-1',
  title: 'Sprint notes',
  content: '## Goals\nShip context layer.',
  tags: ['sprint'],
  pinned: false,
  dashboardId: 'dash-1',
  businessId: null,
  folderId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-06-01'),
  isOwner: true,
  canEdit: true,
};

describe('notebookContextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns page with no links', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.page.title).toBe('Sprint notes');
    expect(ctx.tasks).toHaveLength(0);
    expect(ctx.files).toHaveLength(0);
    expect(ctx.events).toHaveLength(0);
    expect(ctx.summary.totalLinks).toBe(0);
    expect(ctx.summary.contentLength).toBe(basePage.content.length);
    expect(ctx.shares).toHaveLength(0);
  });

  it('hydrates linked tasks', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'link-task',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'TASK',
          targetId: 'task-1',
          relationshipType: 'ACTION_SOURCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: {
            kind: 'task',
            id: 'task-1',
            title: 'Follow up',
            status: 'TODO',
            dueDate: null,
            trashed: false,
          },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.tasks).toHaveLength(1);
    expect(ctx.tasks[0].title).toBe('Follow up');
    expect(ctx.summary.taskCount).toBe(1);
  });

  it('hydrates linked files', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'link-file',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'FILE',
          targetId: 'file-1',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: {
            kind: 'file',
            id: 'file-1',
            name: 'Spec.pdf',
            mimeType: 'application/pdf',
            size: 2048,
            extension: 'pdf',
            ownerName: 'Alex',
            dashboardId: 'dash-1',
            trashed: false,
          },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.files).toHaveLength(1);
    expect(ctx.files[0].name).toBe('Spec.pdf');
    expect(ctx.summary.fileCount).toBe(1);
  });

  it('hydrates linked events', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'link-ev',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'CALENDAR_EVENT',
          targetId: 'evt-1',
          relationshipType: 'AGENDA',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: { meetingContext: true },
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: {
            kind: 'event',
            id: 'evt-1',
            title: 'Standup',
            startTime: '2026-06-02T14:00:00.000Z',
            endTime: '2026-06-02T14:30:00.000Z',
            location: 'Room A',
            allDay: false,
            trashed: false,
          },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.events).toHaveLength(1);
    expect(ctx.events[0].title).toBe('Standup');
    expect(ctx.summary.eventCount).toBe(1);
  });

  it('returns mixed accessible context', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([
      {
        id: 'share-1',
        sharedWithUserId: 'u2',
        role: 'viewer',
        createdAt: new Date('2026-01-03'),
        sharedWith: { id: 'u2', name: 'Bob', email: 'bob@example.com' },
      },
    ] as never);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'l1',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'TASK',
          targetId: 't1',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: { kind: 'task', id: 't1', title: 'A', status: 'DONE', trashed: false },
        },
        {
          id: 'l2',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'FILE',
          targetId: 'f1',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: { kind: 'file', id: 'f1', name: 'doc.pdf', trashed: false },
        },
        {
          id: 'l3',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'CALENDAR_EVENT',
          targetId: 'e1',
          relationshipType: 'AGENDA',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: {
            kind: 'event',
            id: 'e1',
            title: 'Review',
            startTime: '2026-06-02T10:00:00.000Z',
            endTime: '2026-06-02T11:00:00.000Z',
            trashed: false,
          },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.tasks).toHaveLength(1);
    expect(ctx.files).toHaveLength(1);
    expect(ctx.events).toHaveLength(1);
    expect(ctx.shares).toHaveLength(1);
    expect(ctx.summary.accessibleLinks).toBe(3);
    expect(ctx.relationshipCounts.totalLinks).toBe(3);
  });

  it('excludes inaccessible entities from hydrated arrays', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'l-secret',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'TASK',
          targetId: 'task-secret',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: false,
        },
        {
          id: 'l-ok',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'TASK',
          targetId: 'task-ok',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: { kind: 'task', id: 'task-ok', title: 'Visible', status: 'TODO', trashed: false },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.tasks).toHaveLength(1);
    expect(ctx.summary.restrictedLinks).toBe(1);
    expect(ctx.relationshipCounts.restrictedLinks).toBe(1);
  });

  it('excludes trashed targets from hydrated arrays', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(basePage as never);
    vi.spyOn(notesShare, 'listPageShares').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({
      pageId: 'page-1',
      links: [
        {
          id: 'l-trashed',
          sourceType: 'PAGE',
          sourceId: 'page-1',
          targetType: 'TASK',
          targetId: 'task-old',
          relationshipType: 'REFERENCE',
          direction: 'OUTBOUND',
          createdById: 'u1',
          metadata: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          targetAccessible: true,
          target: {
            kind: 'task',
            id: 'task-old',
            title: 'Old',
            status: 'DONE',
            trashed: true,
          },
        },
      ],
    });

    const ctx = await getPageContext('page-1', 'u1');

    expect(ctx.tasks).toHaveLength(0);
    expect(ctx.summary.trashedTargets).toBe(1);
  });

  it('does not list shares for non-owners', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue({
      ...basePage,
      isOwner: false,
      canEdit: false,
    } as never);
    const listSharesSpy = vi.spyOn(notesShare, 'listPageShares');
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({ pageId: 'page-1', links: [] });

    const ctx = await getPageContext('page-1', 'u2');

    expect(ctx.shares).toHaveLength(0);
    expect(listSharesSpy).not.toHaveBeenCalled();
  });

  it('throws when page is not readable', async () => {
    vi.spyOn(notesVisibility, 'getPageById').mockResolvedValue(null);

    await expect(getPageContext('missing', 'u1')).rejects.toBeInstanceOf(NotesServiceError);
  });
});
