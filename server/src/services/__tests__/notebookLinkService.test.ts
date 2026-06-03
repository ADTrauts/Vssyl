import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as notebookPolicy from '../notebook/notebookPolicyDual';
import { prisma } from '../../lib/prisma';
import * as notesPermission from '../notes/notesPermissionService';
import * as todoVisibility from '../todoVisibilityService';
import * as driveVisibility from '../driveVisibilityService';
import * as linkActivity from '../notebook/notebookLinkActivityService';
import * as linkDomain from '../notebook/notebookLinkDomainEventService';
import * as linkPermission from '../notebook/notebookLinkPermissionService';
import {
  archiveNotebookLink,
  createPageLink,
  listEntityLinks,
  listPageLinks,
} from '../notebook/notebookLinkService';
import { NotebookLinkServiceError } from '../notebook/notebookLinkErrors';

describe('notebookLinkService', () => {
  const page = {
    id: 'page-1',
    dashboardId: 'dash-1',
    businessId: null,
    createdById: 'u1',
    trashedAt: null,
    title: 'Page',
  };

  const task = {
    id: 'task-1',
    title: 'Task',
    status: 'TODO',
    dashboardId: 'dash-1',
    businessId: null,
    householdId: null,
    trashedAt: null,
    dueDate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notebookPolicy, 'evaluateNotebookLinkPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(linkActivity, 'recordLinkCreated').mockResolvedValue(undefined);
    vi.spyOn(linkActivity, 'recordLinkArchived').mockResolvedValue(undefined);
    vi.spyOn(linkDomain, 'recordLinkCreatedDomainEvent').mockImplementation(() => {});
    vi.spyOn(linkDomain, 'recordLinkArchivedDomainEvent').mockImplementation(() => {});
  });

  it('createPageLink creates PAGE→TASK link and emits side effects', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(task as never);
    vi.spyOn(prisma.notebookLink, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.notebookLink, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.notebookLink, 'create').mockResolvedValue({
      id: 'link-1',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'ACTION_SOURCE',
      direction: 'OUTBOUND',
      createdById: 'u1',
      metadata: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      archivedAt: null,
    } as never);

    const { link, created } = await createPageLink({
      userId: 'u1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'ACTION_SOURCE',
    });

    expect(created).toBe(true);
    expect(link.target?.kind).toBe('task');
    expect(linkActivity.recordLinkCreated).toHaveBeenCalled();
    expect(linkDomain.recordLinkCreatedDomainEvent).toHaveBeenCalled();
  });

  it('createPageLink is idempotent for duplicate active link', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(task as never);
    const existing = {
      id: 'link-1',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'REFERENCE',
      direction: 'OUTBOUND',
      createdById: 'u1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    };
    vi.spyOn(prisma.notebookLink, 'findFirst').mockResolvedValue(existing as never);
    vi.spyOn(prisma.notebookLink, 'findUnique');
    vi.spyOn(prisma.notebookLink, 'create');

    const { created } = await createPageLink({
      userId: 'u1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'REFERENCE',
    });

    expect(created).toBe(false);
    expect(prisma.notebookLink.create).not.toHaveBeenCalled();
    expect(linkActivity.recordLinkCreated).not.toHaveBeenCalled();
  });

  it('denies inaccessible task', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(null);

    await expect(
      createPageLink({
        userId: 'u1',
        pageId: 'page-1',
        targetType: 'TASK',
        targetId: 'task-x',
      })
    ).rejects.toBeInstanceOf(NotebookLinkServiceError);
  });

  it('listPageLinks includes inaccessible targets as restricted', async () => {
    vi.spyOn(notesPermission, 'assertCanReadPage').mockResolvedValue(page as never);
    vi.spyOn(prisma.notebookLink, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        sourceType: 'PAGE',
        sourceId: 'page-1',
        targetType: 'TASK',
        targetId: 'task-hidden',
        relationshipType: 'REFERENCE',
        direction: 'OUTBOUND',
        createdById: 'u1',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(null);

    const result = await listPageLinks({ userId: 'u1', pageId: 'page-1' });
    expect(result.links).toHaveLength(1);
    expect(result.links[0].targetAccessible).toBe(false);
  });

  it('listEntityLinks returns readable pages for event backlinks', async () => {
    vi.spyOn(linkPermission, 'assertCanReadEntityBacklinks').mockResolvedValue(undefined);
    vi.spyOn(prisma.notebookLink, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        sourceType: 'PAGE',
        sourceId: 'page-1',
        targetType: 'CALENDAR_EVENT',
        targetId: 'evt-1',
        relationshipType: 'AGENDA',
        direction: 'OUTBOUND',
        createdAt: new Date(),
      },
    ] as never);
    vi.spyOn(notesPermission, 'findReadablePage').mockResolvedValue({ id: 'page-1', title: 'Meeting notes' } as never);

    const result = await listEntityLinks({
      userId: 'u1',
      entityType: 'CALENDAR_EVENT',
      entityId: 'evt-1',
    });

    expect(result.links).toHaveLength(1);
    expect(result.links[0].page?.title).toBe('Meeting notes');
  });

  it('archiveNotebookLink sets archivedAt and emits', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(prisma.notebookLink, 'findFirst').mockResolvedValue({
      id: 'link-1',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      createdById: 'u1',
      archivedAt: null,
    } as never);
    vi.spyOn(prisma.notebookLink, 'update').mockResolvedValue({} as never);

    await archiveNotebookLink({ userId: 'u1', linkId: 'link-1' });

    expect(prisma.notebookLink.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'link-1' },
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      })
    );
    expect(linkActivity.recordLinkArchived).toHaveBeenCalled();
  });

  it('restores archived link instead of violating unique constraint', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(todoVisibility, 'getTaskByIdIfAccessible').mockResolvedValue(task as never);
    vi.spyOn(prisma.notebookLink, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.notebookLink, 'findUnique').mockResolvedValue({
      id: 'link-archived',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'REFERENCE',
      direction: 'OUTBOUND',
      createdById: 'u1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: new Date('2026-01-02'),
    } as never);
    vi.spyOn(prisma.notebookLink, 'update').mockResolvedValue({
      id: 'link-archived',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'REFERENCE',
      direction: 'OUTBOUND',
      createdById: 'u1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    } as never);
    vi.spyOn(prisma.notebookLink, 'create');

    const { created } = await createPageLink({
      userId: 'u1',
      pageId: 'page-1',
      targetType: 'TASK',
      targetId: 'task-1',
      relationshipType: 'REFERENCE',
    });

    expect(created).toBe(true);
    expect(prisma.notebookLink.create).not.toHaveBeenCalled();
    expect(prisma.notebookLink.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'link-archived' },
        data: expect.objectContaining({ archivedAt: null }),
      })
    );
    expect(linkActivity.recordLinkCreated).toHaveBeenCalled();
  });

  it('createPageLink creates PAGE→FILE link', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: ['file-1'],
      deniedIds: [],
    });
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({ dashboardId: 'dash-1' } as never);
    vi.spyOn(prisma.notebookLink, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.notebookLink, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.notebookLink, 'create').mockResolvedValue({
      id: 'link-file',
      dashboardId: 'dash-1',
      businessId: null,
      sourceType: 'PAGE',
      sourceId: 'page-1',
      targetType: 'FILE',
      targetId: 'file-1',
      relationshipType: 'REFERENCE',
      direction: 'OUTBOUND',
      createdById: 'u1',
      metadata: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      archivedAt: null,
    } as never);
    vi.spyOn(driveVisibility, 'fetchAccessibleActiveFiles').mockResolvedValue([
      {
        id: 'file-1',
        name: 'Spec.docx',
        size: 1024,
        path: null,
        url: 'https://example.com/f',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        dashboardId: 'dash-1',
        folderId: null,
        userId: 'u1',
      },
    ] as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Owner', email: null } as never);

    const { link, created } = await createPageLink({
      userId: 'u1',
      pageId: 'page-1',
      targetType: 'FILE',
      targetId: 'file-1',
      relationshipType: 'REFERENCE',
    });

    expect(created).toBe(true);
    expect(link.target?.kind).toBe('file');
    expect(link.target?.name).toBe('Spec.docx');
    expect(linkActivity.recordLinkCreated).toHaveBeenCalled();
  });

  it('listPageLinks marks inaccessible FILE targets as restricted', async () => {
    vi.spyOn(notesPermission, 'assertCanReadPage').mockResolvedValue(page as never);
    vi.spyOn(prisma.notebookLink, 'findMany').mockResolvedValue([
      {
        id: 'link-f',
        sourceType: 'PAGE',
        sourceId: 'page-1',
        targetType: 'FILE',
        targetId: 'file-hidden',
        relationshipType: 'REFERENCE',
        direction: 'OUTBOUND',
        createdById: 'u1',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.spyOn(driveVisibility, 'fetchAccessibleActiveFiles').mockResolvedValue([]);

    const result = await listPageLinks({
      userId: 'u1',
      pageId: 'page-1',
      targetType: 'FILE',
    });
    expect(result.links).toHaveLength(1);
    expect(result.links[0].targetAccessible).toBe(false);
    expect(result.links[0].target).toBeUndefined();
  });

  it('denies file link when Drive visibility fails', async () => {
    vi.spyOn(notesPermission, 'assertCanWritePage').mockResolvedValue(page as never);
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: [],
      deniedIds: ['file-1'],
    });

    await expect(
      createPageLink({
        userId: 'u1',
        pageId: 'page-1',
        targetType: 'FILE',
        targetId: 'file-1',
      })
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
