import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotesServiceError } from '../notes/notesErrors';
import * as notesPermission from '../notes/notesPermissionService';
import * as todoVisibility from '../todoVisibilityService';
import * as notebookPolicy from '../notebook/notebookPolicyDual';
import {
  assertCanCreatePageLink,
  assertCanReadEntityBacklinks,
  assertTargetReadable,
} from '../notebook/notebookLinkPermissionService';
import * as linkVisibility from '../notebook/notebookLinkVisibilityService';
import * as driveVisibility from '../driveVisibilityService';
import { NotebookLinkServiceError } from '../notebook/notebookLinkErrors';

describe('notebookLinkPermissionService', () => {
  const page = {
    id: 'page-1',
    dashboardId: 'dash-1',
    businessId: null,
    createdById: 'u1',
    trashedAt: null,
    title: 'Page',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notebookPolicy, 'evaluateNotebookLinkPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('denies create when user cannot write page', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockRejectedValue(
      new NotesServiceError('Page not found', 'not_found', 404)
    );

    await expect(
      assertCanCreatePageLink({
        userId: 'u-viewer',
        pageId: 'page-1',
        targetType: 'TASK',
        targetId: 'task-1',
      })
    ).rejects.toBeInstanceOf(NotesServiceError);
  });

  it('denies task target on different dashboard', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue({
      id: 'task-1',
      dashboardId: 'dash-other',
      businessId: null,
      trashedAt: null,
    } as never);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'TASK',
        targetId: 'task-1',
      })
    ).rejects.toMatchObject({ code: 'invalid' });
  });

  it('denies inaccessible task (V_Link does not bypass)', async () => {
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(null);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'TASK',
        targetId: 'task-secret',
      })
    ).rejects.toBeInstanceOf(NotebookLinkServiceError);
  });

  it('denies business context mismatch', async () => {
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue({
      id: 'task-1',
      dashboardId: 'dash-1',
      businessId: 'biz-1',
      trashedAt: null,
    } as never);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page: { ...page, businessId: null },
        targetType: 'TASK',
        targetId: 'task-1',
      })
    ).rejects.toMatchObject({ code: 'invalid' });
  });

  it('fails closed for CHAT_CONVERSATION', async () => {
    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'CHAT_CONVERSATION',
        targetId: 'conv-1',
      })
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  it('denies trashed task link', async () => {
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue({
      id: 'task-1',
      dashboardId: 'dash-1',
      businessId: null,
      trashedAt: new Date(),
    } as never);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'TASK',
        targetId: 'task-1',
      })
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('denies entity backlinks when calendar event inaccessible', async () => {
    vi.spyOn(linkVisibility, 'userCanAccessCalendarEvent').mockResolvedValue(false);

    await expect(
      assertCanReadEntityBacklinks({
        userId: 'u1',
        entityType: 'CALENDAR_EVENT',
        entityId: 'evt-x',
      })
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('denies file target on different dashboard', async () => {
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: ['file-1'],
      deniedIds: [],
    });
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({
      dashboardId: 'dash-other',
    } as never);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'FILE',
        targetId: 'file-1',
      })
    ).rejects.toMatchObject({ code: 'invalid' });
  });

  it('denies inaccessible calendar event', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

    await expect(
      assertTargetReadable({
        userId: 'u1',
        page,
        targetType: 'CALENDAR_EVENT',
        targetId: 'evt-1',
      })
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
