import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as chatSocket from '../chatSocketService';
import { broadcastTaskCreated, resolveTaskRealtimeUserIds } from '../todoRealtimeService';

describe('todoRealtimeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolveTaskRealtimeUserIds includes creator and assignee', () => {
    expect(
      resolveTaskRealtimeUserIds({ createdById: 'u1', assignedToId: 'u2' })
    ).toEqual(['u1', 'u2']);
  });

  it('broadcastTaskCreated fans out on todo_task channel', () => {
    const broadcastToUser = vi.fn();
    vi.spyOn(chatSocket, 'getChatSocketService').mockReturnValue({
      broadcastToUser,
    } as never);

    broadcastTaskCreated({
      id: 't1',
      title: 'Task',
      dashboardId: 'd1',
      businessId: null,
      householdId: null,
      createdById: 'u1',
      assignedToId: 'u2',
      status: 'TODO',
    });

    expect(broadcastToUser).toHaveBeenCalledWith(
      'u1',
      'todo_task',
      expect.objectContaining({ action: 'created', type: 'task' })
    );
    expect(broadcastToUser).toHaveBeenCalledWith('u2', 'todo_task', expect.any(Object));
  });
});
