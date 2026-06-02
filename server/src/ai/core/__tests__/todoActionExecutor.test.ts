import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as todoAIActionService from '../../../services/todoAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor todo paths (Phase 1F)', () => {
  const userContext: UserContext = {
    userId: 'user-1',
    personality: {},
    preferences: {},
    autonomySettings: {},
    recentActivity: [],
  };

  let executor: ActionExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(actionExecutorRegistryModule.actionExecutorRegistry, 'has').mockReturnValue(false);
    executor = new ActionExecutor({} as PrismaClient);
  });

  const baseAction = (overrides: Partial<AIAction>): AIAction => ({
    id: 'action-todo-1',
    type: 'module_action',
    module: 'todo',
    operation: 'create_task',
    parameters: {},
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import todoController', () => {
    expect(executorSource).not.toMatch(/controllers\/todoController/);
    expect(executorSource).toMatch(/todoAIActionService/);
  });

  it('executeTasksAction does not use mock req/res', () => {
    const todoBlock = executorSource.match(
      /private async executeTasksAction[\s\S]*?private async executeHRAction/
    )?.[0];
    expect(todoBlock).toBeDefined();
    expect(todoBlock).not.toMatch(/mockReq/);
    expect(todoBlock).not.toMatch(/mockRes/);
  });

  it('executeAction create_task uses todoAIActionService', async () => {
    const aiCreateSpy = vi.spyOn(todoAIActionService, 'aiCreateTask').mockResolvedValue({
      success: true,
      data: { id: 'task-1', title: 'Standup prep' },
    });

    const action = baseAction({
      operation: 'create_task',
      parameters: { title: 'Standup prep', dashboardId: 'dash-1' },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        title: 'Standup prep',
        dashboardId: 'dash-1',
      })
    );
    expect(result.success).toBe(true);
    expect(result.metadata?.module).toBe('todo');
  });

  it('create_task validation error does not call service', async () => {
    const aiCreateSpy = vi.spyOn(todoAIActionService, 'aiCreateTask');

    const action = baseAction({
      operation: 'create_task',
      parameters: {},
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiCreateSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toContain('title');
  });
});
