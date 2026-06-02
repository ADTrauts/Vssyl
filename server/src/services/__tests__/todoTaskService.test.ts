import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as todoPermission from '../todoPermissionService';
import * as todoPolicyDual from '../todoPolicyDual';
import * as todoActivity from '../todoActivityService';
import * as todoDomain from '../todoDomainEventService';
import * as todoNotification from '../todoNotificationService';
import * as todoRealtime from '../todoRealtimeService';
import {
  completeTask,
  createTask,
  reopenTask,
  softTrashTask,
  updateTask,
} from '../todoTaskService';
import { TodoServiceError } from '../todo/todoErrors';
import { logger } from '../../lib/logger';

describe('todoTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(logger, 'info').mockResolvedValue(undefined as never);
    vi.spyOn(logger, 'error').mockResolvedValue(undefined as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(todoActivity, 'recordTaskCreated').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskUpdated').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskCompleted').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskReopened').mockResolvedValue(undefined);
    vi.spyOn(todoActivity, 'recordTaskTrashed').mockResolvedValue(undefined);
    vi.spyOn(todoDomain, 'recordTaskCreatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskUpdatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskCompletedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskReopenedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoDomain, 'recordTaskTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(todoNotification, 'notifyTaskAssigned').mockResolvedValue(undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskCreated').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskUpdated').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskCompleted').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskReopened').mockImplementation(() => undefined);
    vi.spyOn(todoRealtime, 'broadcastTaskTrashed').mockImplementation(() => undefined);
  });

  it('creates a task and coordinates side-effect adapters', async () => {
    vi.spyOn(todoPermission, 'assertDashboardContextForTaskCreate').mockResolvedValue(undefined);
    const created = {
      id: 'task-1',
      title: 'Ship 1D',
      status: 'TODO',
      priority: 'MEDIUM',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      createdBy: { id: 'u1', name: null, email: null, image: null },
      assignedTo: null,
    };
    vi.spyOn(prisma.task, 'create').mockResolvedValue(created as never);

    const result = await createTask({
      userId: 'u1',
      title: 'Ship 1D',
      dashboardId: 'dash-1',
    });

    expect(result.id).toBe('task-1');
    expect(todoActivity.recordTaskCreated).toHaveBeenCalled();
    expect(todoDomain.recordTaskCreatedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskCreated).toHaveBeenCalled();
  });

  it('denies create when policy dual blocks', async () => {
    vi.spyOn(todoPermission, 'assertDashboardContextForTaskCreate').mockResolvedValue(undefined);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    await expect(
      createTask({
        userId: 'u1',
        title: 'Blocked',
        dashboardId: 'dash-1',
      })
    ).rejects.toMatchObject({ code: 'forbidden' });

    expect(todoActivity.recordTaskCreated).not.toHaveBeenCalled();
  });

  it('updates a task and emits update side effects', async () => {
    const existing = {
      id: 'task-1',
      title: 'Old',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      startDate: null,
      recurrenceRule: null,
      recurrenceEndAt: null,
      parentRecurringTaskId: null,
      category: null,
      tags: [],
      timeEstimate: null,
      assignedToId: null,
      snoozedUntil: null,
      completedAt: null,
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
    };
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(existing as never);
    vi.spyOn(prisma.task, 'update').mockResolvedValue({
      ...existing,
      title: 'New',
      createdBy: { id: 'u1', name: null, email: null, image: null },
      assignedTo: null,
    } as never);

    await updateTask({
      userId: 'u1',
      taskId: 'task-1',
      title: 'New',
    });

    expect(todoActivity.recordTaskUpdated).toHaveBeenCalled();
    expect(todoDomain.recordTaskUpdatedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskUpdated).toHaveBeenCalled();
  });

  it('completes a task and emits complete side effects', async () => {
    vi.spyOn(todoPermission, 'assertCanCompleteTask').mockResolvedValue({
      id: 'task-1',
      title: 'T',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      status: 'TODO',
      priority: 'MEDIUM',
    } as never);
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue({
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      title: 'T',
      createdById: 'u1',
      assignedToId: null,
    } as never);
    vi.spyOn(prisma.task, 'update').mockResolvedValue({
      id: 'task-1',
      title: 'T',
      status: 'DONE',
      priority: 'MEDIUM',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      createdBy: { id: 'u1', name: null, email: null, image: null },
      assignedTo: null,
    } as never);

    await completeTask('u1', 'task-1');

    expect(todoActivity.recordTaskCompleted).toHaveBeenCalled();
    expect(todoDomain.recordTaskCompletedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskCompleted).toHaveBeenCalled();
  });

  it('reopens a task and emits reopen side effects', async () => {
    vi.spyOn(todoPermission, 'assertCanReopenTask').mockResolvedValue({
      id: 'task-1',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
    } as never);
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue({
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
    } as never);
    vi.spyOn(prisma.task, 'update').mockResolvedValue({
      id: 'task-1',
      title: 'T',
      status: 'TODO',
      priority: 'MEDIUM',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      createdBy: { id: 'u1', name: null, email: null, image: null },
      assignedTo: null,
    } as never);

    await reopenTask('u1', 'task-1');

    expect(todoActivity.recordTaskReopened).toHaveBeenCalled();
    expect(todoDomain.recordTaskReopenedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskReopened).toHaveBeenCalled();
  });

  it('soft-trashes a task and emits trash side effects', async () => {
    vi.spyOn(todoPermission, 'assertCanTrashTask').mockResolvedValue({
      id: 'task-1',
      title: 'T',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: null,
      status: 'TODO',
      priority: 'MEDIUM',
    } as never);
    vi.spyOn(prisma.task, 'updateMany').mockResolvedValue({ count: 1 });

    await softTrashTask('u1', 'task-1');

    expect(todoActivity.recordTaskTrashed).toHaveBeenCalled();
    expect(todoDomain.recordTaskTrashedDomainEvent).toHaveBeenCalled();
    expect(todoRealtime.broadcastTaskTrashed).toHaveBeenCalled();
  });

  it('denies soft-trash when policy blocks', async () => {
    vi.spyOn(todoPermission, 'assertCanTrashTask').mockResolvedValue({
      id: 'task-1',
      dashboardId: 'dash-1',
      businessId: null,
      householdId: null,
    } as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'INSUFFICIENT_ROLE',
    });

    await expect(softTrashTask('u1', 'task-1')).rejects.toMatchObject({ code: 'forbidden' });
    expect(todoActivity.recordTaskTrashed).not.toHaveBeenCalled();
  });
});
