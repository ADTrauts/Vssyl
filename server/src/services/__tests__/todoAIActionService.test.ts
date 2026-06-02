import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoServiceError } from '../todo/todoErrors';
import * as todoTaskService from '../todoTaskService';
import {
  aiCompleteTask,
  aiCreateTask,
  aiExecutePriorityChanges,
  aiUpdateTask,
} from '../todoAIActionService';

describe('todoAIActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aiCreateTask delegates to todoTaskService', async () => {
    vi.spyOn(todoTaskService, 'createTask').mockResolvedValue({
      id: 'task-1',
      title: 'Buy milk',
      priority: 'MEDIUM',
    } as never);

    const outcome = await aiCreateTask({
      userId: 'u1',
      title: 'Buy milk',
      dashboardId: 'dash-1',
    });

    expect(outcome.success).toBe(true);
    expect(todoTaskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        title: 'Buy milk',
        dashboardId: 'dash-1',
      })
    );
  });

  it('aiCreateTask maps TodoServiceError to safe outcome', async () => {
    vi.spyOn(todoTaskService, 'createTask').mockRejectedValue(
      new TodoServiceError('Forbidden', 'forbidden', 403)
    );

    const outcome = await aiCreateTask({
      userId: 'u1',
      title: 'Buy milk',
      dashboardId: 'dash-1',
    });

    expect(outcome).toEqual({ success: false, error: 'Forbidden' });
  });

  it('aiUpdateTask delegates to todoTaskService', async () => {
    vi.spyOn(todoTaskService, 'updateTask').mockResolvedValue({
      task: { id: 'task-1', priority: 'HIGH' },
    } as never);

    const outcome = await aiUpdateTask({
      userId: 'u1',
      taskId: 'task-1',
      priority: 'HIGH',
    });

    expect(outcome.success).toBe(true);
    expect(todoTaskService.updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        taskId: 'task-1',
        priority: 'HIGH',
      })
    );
  });

  it('aiCompleteTask delegates to todoTaskService', async () => {
    vi.spyOn(todoTaskService, 'completeTask').mockResolvedValue({ id: 'task-1' } as never);

    const outcome = await aiCompleteTask({ userId: 'u1', taskId: 'task-1' });

    expect(outcome.success).toBe(true);
    expect(todoTaskService.completeTask).toHaveBeenCalledWith('u1', 'task-1');
  });

  it('aiExecutePriorityChanges uses updateTask per suggestion', async () => {
    const updateSpy = vi.spyOn(todoTaskService, 'updateTask').mockResolvedValue({
      task: { id: 't1' },
    } as never);

    const outcome = await aiExecutePriorityChanges({
      userId: 'u1',
      suggestions: [{ taskId: 't1', newPriority: 'HIGH' }],
    });

    expect(outcome.success).toBe(true);
    expect(updateSpy).toHaveBeenCalled();
  });
});
