import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as todoActivity from '../todoActivityService';
import * as todoDomain from '../todoDomainEventService';
import * as todoPolicyDual from '../todoPolicyDual';
import * as todoPermission from '../todoPermissionService';
import * as todoRealtime from '../todoRealtimeService';
import * as todoVisibility from '../todoVisibilityService';
import * as todoVlinkLifecycle from '../todoVlinkLifecycleService';
import { TodoServiceError } from '../todo/todoErrors';
import {
  permanentlyDeleteTask,
  restoreTask,
  softTrashTask,
  TodoTrashError,
} from '../todoTrashService';

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const baseTask = {
  id: 'task-1',
  title: 'Ship feature',
  dashboardId: 'dash-1',
  businessId: null,
  householdId: null,
  createdById: 'u1',
  assignedToId: 'u2',
  status: 'TODO',
  priority: 'MEDIUM',
  trashedAt: new Date(),
};

describe('todoTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(todoActivity, 'recordTaskTrashed').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskRestored').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskPermanentlyDeleted').mockResolvedValue(undefined);
    vi.spyOn(todoDomain, 'recordTaskTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskRestoredDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskPermanentlyDeletedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskTrashed').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskUpdated').mockImplementation(() => undefined);
    vi.spyOn(todoVlinkLifecycle, 'unlinkTodoTaskFromAllVLinks').mockResolvedValue(0);
    vi.spyOn(todoVisibility, 'filterTasksByReadPolicy').mockImplementation(
      async (_userId, tasks) => tasks
    );
  });

  it('soft-trashes a task and emits trash side effects', async () => {
    vi.spyOn(todoPermission, 'assertCanTrashTask').mockResolvedValue({
      ...baseTask,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.task, 'updateMany').mockResolvedValue({ count: 1 });

    const result = await softTrashTask('u1', 'task-1');

    expect(result).toEqual({ success: true });
    expect(todoActivity.recordTaskTrashed).toHaveBeenCalled();
    expect(todoDomain.recordTaskTrashedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskTrashed).toHaveBeenCalled();
    expect(todoVlinkLifecycle.unlinkTodoTaskFromAllVLinks).not.toHaveBeenCalled();
  });

  it('throws not_found for invalid task id on soft trash', async () => {
    vi.spyOn(todoPermission, 'assertCanTrashTask').mockRejectedValue(
      new TodoServiceError('Task not found', 'not_found', 404)
    );

    await expect(softTrashTask('u1', 'missing')).rejects.toBeInstanceOf(TodoTrashError);
    await expect(softTrashTask('u1', 'missing')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('throws forbidden when policy blocks soft trash', async () => {
    vi.spyOn(todoPermission, 'assertCanTrashTask').mockResolvedValue({
      ...baseTask,
      trashedAt: null,
    } as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'INSUFFICIENT_ROLE',
    });

    await expect(softTrashTask('u1', 'task-1')).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('restores a trashed task and emits restore side effects', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(baseTask as never);
    vi.spyOn(prisma.task, 'updateMany').mockResolvedValue({ count: 1 });

    const restored = await restoreTask({ userId: 'u1', taskId: 'task-1' });

    expect(restored).toBe(true);
    expect(todoActivity.recordTaskRestored).toHaveBeenCalled();
    expect(todoDomain.recordTaskRestoredDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskUpdated).toHaveBeenCalled();
  });

  it('returns false when restoring unknown trashed task', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(null);

    await expect(restoreTask({ userId: 'u1', taskId: 'missing' })).resolves.toBe(false);
  });

  it('permanently deletes trashed task after unlinking V_Links', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(baseTask as never);
    vi.spyOn(prisma.task, 'deleteMany').mockResolvedValue({ count: 1 });

    const deleted = await permanentlyDeleteTask({ userId: 'u1', taskId: 'task-1' });

    expect(deleted).toBe(true);
    expect(todoVlinkLifecycle.unlinkTodoTaskFromAllVLinks).toHaveBeenCalledWith({
      actorUserId: 'u1',
      taskId: 'task-1',
    });
    expect(todoActivity.recordTaskPermanentlyDeleted).toHaveBeenCalled();
    expect(todoDomain.recordTaskPermanentlyDeletedDomainEvent).toHaveBeenCalled();
  });
});
