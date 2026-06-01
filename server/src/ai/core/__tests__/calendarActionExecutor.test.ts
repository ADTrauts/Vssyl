import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as calendarAIActionService from '../../../services/calendarAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor calendar paths (Phase 1F)', () => {
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
    id: 'action-cal-1',
    type: 'module_action',
    module: 'calendar',
    operation: 'create_event',
    parameters: {},
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import calendarController', () => {
    expect(executorSource).not.toMatch(/controllers\/calendarController/);
    expect(executorSource).toMatch(/calendarAIActionService/);
  });

  it('executeCalendarAction does not use mock req/res', () => {
    const calendarBlock = executorSource.match(
      /private async executeCalendarAction[\s\S]*?private async executeTasksAction/
    )?.[0];
    expect(calendarBlock).toBeDefined();
    expect(calendarBlock).not.toMatch(/mockReq/);
    expect(calendarBlock).not.toMatch(/mockRes/);
  });

  it('executeAction create_event uses calendarAIActionService', async () => {
    const aiCreateSpy = vi.spyOn(calendarAIActionService, 'aiCreateEvent').mockResolvedValue({
      success: true,
      data: { success: true, data: { id: 'evt-1' } },
    });

    const action = baseAction({
      operation: 'create_event',
      parameters: {
        calendarId: 'cal-1',
        title: 'Standup',
        startAt: '2026-06-01T10:00:00Z',
        endAt: '2026-06-01T10:30:00Z',
      },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        calendarId: 'cal-1',
        title: 'Standup',
      })
    );
    expect(result.success).toBe(true);
    expect(result.metadata?.module).toBe('calendar');
  });

  it('create_event validation error does not call service', async () => {
    const aiCreateSpy = vi.spyOn(calendarAIActionService, 'aiCreateEvent');

    const action = baseAction({
      operation: 'create_event',
      parameters: { calendarId: 'cal-1' },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiCreateSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});
