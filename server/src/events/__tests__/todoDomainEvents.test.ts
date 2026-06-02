import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitTodoTaskCreatedEvent, emitTodoTaskTrashedEvent } from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';
import { DOMAIN_EVENT_TYPES } from '../domainEventRegistry';

describe('todo domain event emitters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emitTodoTaskCreatedEvent uses registered contract', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e1' } as never);

    emitTodoTaskCreatedEvent({
      actorUserId: 'u1',
      taskId: 't1',
      dashboardId: 'd1',
      status: 'TODO',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: DOMAIN_EVENT_TYPES.TODO_TASK_CREATED,
        entityId: 't1',
        dashboardId: 'd1',
      })
    );
  });

  it('emitTodoTaskTrashedEvent includes softDelete metadata', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({ id: 'e2' } as never);

    emitTodoTaskTrashedEvent({
      actorUserId: 'u1',
      taskId: 't1',
      dashboardId: 'd1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: DOMAIN_EVENT_TYPES.TODO_TASK_TRASHED,
        metadata: expect.objectContaining({ softDelete: true }),
      })
    );
  });
});
