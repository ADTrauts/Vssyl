import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as todoPolicyDual from '../todoPolicyDual';
import {
  filterTasksByReadPolicy,
  getTaskByIdIfAccessible,
  listAccessibleTasks,
  searchAccessibleTasks,
  taskPassesReadPolicy,
} from '../todoVisibilityService';
import { TodoServiceError } from '../todo/todoErrors';

describe('todoVisibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('lists tasks for creator or assignee on owned dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      businessId: null,
      householdId: null,
    } as never);
    const tasks = [
      {
        id: 't1',
        title: 'Mine',
        dashboardId: 'dash-1',
        businessId: null,
        householdId: null,
      },
    ];
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue(tasks as never);

    const result = await listAccessibleTasks({
      userId: 'u1',
      dashboardId: 'dash-1',
    });

    expect(result).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trashedAt: null,
          OR: [{ createdById: 'u1' }, { assignedToId: 'u1' }],
          dashboardId: 'dash-1',
        }),
      })
    );
  });

  it('denies list when dashboard is not owned', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue(null);

    await expect(
      listAccessibleTasks({ userId: 'u1', dashboardId: 'dash-other' })
    ).rejects.toBeInstanceOf(TodoServiceError);
  });

  it('returns task by id when legacy access and policy allow', async () => {
    const task = {
      id: 't1',
      title: 'Readable',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      trashedAt: null,
    };
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(task as never);

    const result = await getTaskByIdIfAccessible('u1', 't1');
    expect(result?.id).toBe('t1');
  });

  it('returns null for get by id when policy denies (no leak)', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue({
      id: 't-secret',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      trashedAt: null,
    } as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const result = await getTaskByIdIfAccessible('u1', 't-secret');
    expect(result).toBeNull();
  });

  it('excludes trashed tasks from default list queries', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      businessId: null,
      householdId: null,
    } as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);

    await listAccessibleTasks({ userId: 'u1', dashboardId: 'dash-1' });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: null }),
      })
    );
  });

  it('filterTasksByReadPolicy removes policy-denied tasks', async () => {
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual')
      .mockResolvedValueOnce({ blocked: false })
      .mockResolvedValueOnce({ blocked: true, reason: 'NOT_MEMBER' });

    const filtered = await filterTasksByReadPolicy('u1', [
      { id: 't1', dashboardId: 'd1', businessId: null, householdId: null },
      { id: 't2', dashboardId: 'd1', businessId: null, householdId: null },
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('t1');
  });

  it('search does not return policy-denied tasks', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      businessId: null,
      householdId: null,
    } as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([
      { id: 't1', dashboardId: 'dash-1', businessId: null, householdId: null },
      { id: 't2', dashboardId: 'dash-1', businessId: null, householdId: null },
    ] as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual')
      .mockResolvedValueOnce({ blocked: false })
      .mockResolvedValueOnce({ blocked: true, reason: 'INSUFFICIENT_ROLE' });

    const results = await searchAccessibleTasks({
      userId: 'u1',
      dashboardId: 'dash-1',
      search: 'report',
    });

    expect(results).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: 'report', mode: 'insensitive' } },
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it('taskPassesReadPolicy returns false on security deny', async () => {
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const allowed = await taskPassesReadPolicy('u1', 't1');
    expect(allowed).toBe(false);
  });
});
