import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as chatAIActionService from '../../../services/chatAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor chat paths (Phase 1F)', () => {
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
    id: 'action-1',
    type: 'module_action',
    module: 'chat',
    operation: 'send_message',
    parameters: {},
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import chatController', () => {
    expect(executorSource).not.toMatch(/controllers\/chatController/);
    expect(executorSource).toMatch(/chatAIActionService/);
  });

  it('executeAction send_message uses chatAIActionService', async () => {
    const aiSendSpy = vi.spyOn(chatAIActionService, 'aiSendMessage').mockResolvedValue({
      success: true,
      data: { id: 'msg-1', content: 'hello' },
    });

    const action = baseAction({
      operation: 'send_message',
      parameters: {
        conversationId: 'conv-1',
        content: 'hello',
      },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiSendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        conversationId: 'conv-1',
        content: 'hello',
      })
    );
    expect(result.success).toBe(true);
    expect(result.metadata?.module).toBe('chat');
    expect(result.metadata?.operation).toBe('send_message');
  });

  it('executeAction send_message returns validation error without calling service', async () => {
    const aiSendSpy = vi.spyOn(chatAIActionService, 'aiSendMessage');

    const action = baseAction({
      id: 'action-2',
      operation: 'send_message',
      parameters: { conversationId: 'conv-1' },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiSendSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toContain('content are required');
  });
});
