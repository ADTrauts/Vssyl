import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as emitters from '../../events/domainEventEmitters';
import {
  recordTaskCreatedDomainEvent,
  recordTaskTrashedDomainEvent,
} from '../todoDomainEventService';

describe('todoDomainEventService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('recordTaskCreatedDomainEvent emits todo.task.created', () => {
    const spy = vi.spyOn(emitters, 'emitTodoTaskCreatedEvent').mockReturnValue({ id: 'e1' } as never);

    recordTaskCreatedDomainEvent({
      actorUserId: 'u1',
      task: {
        id: 't1',
        title: 'Task',
        dashboardId: 'd1',
        businessId: null,
        householdId: null,
        createdById: 'u1',
        status: 'TODO',
      },
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        taskId: 't1',
        dashboardId: 'd1',
      })
    );
  });

  it('recordTaskTrashedDomainEvent emits todo.task.trashed', () => {
    const spy = vi.spyOn(emitters, 'emitTodoTaskTrashedEvent').mockReturnValue({ id: 'e2' } as never);

    recordTaskTrashedDomainEvent({
      actorUserId: 'u1',
      task: {
        id: 't1',
        title: 'Task',
        dashboardId: 'd1',
        businessId: null,
        householdId: null,
        createdById: 'u1',
      },
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 't1',
      })
    );
  });
});
