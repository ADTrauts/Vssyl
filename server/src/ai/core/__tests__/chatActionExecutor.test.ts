import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as chatAIActionService from '../../../services/chatAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';
import * as bridge from '../../governance/actionExecutorBridge';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor chat paths (Phase 1F / Phase 2)', () => {
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

  it('executeAction send_message routes via governed platform (Phase 2)', async () => {
    const aiSendSpy = vi.spyOn(chatAIActionService, 'aiSendMessage').mockResolvedValue({
      success: true,
      data: { id: 'msg-1', content: 'hello' },
    });
    vi.spyOn(bridge, 'tryExecuteViaGovernedPlatform').mockResolvedValue({
      actionId: 'action-1',
      success: true,
      result: {
        governance: { status: 'AWAITING_APPROVAL', approvalId: 'appr-chat' },
      },
      metadata: {
        executionTime: 1,
        module: 'chat',
        operation: 'send_message',
        affectedUsers: [],
        rollbackAvailable: false,
      },
    });

    const action = baseAction({
      operation: 'send_message',
      parameters: {
        conversationId: 'conv-1',
        content: 'hello',
      },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiSendSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(JSON.stringify(result.result)).toMatch(/AWAITING_APPROVAL/);
    expect(result.metadata?.operation).toBe('send_message');
  });

  it('executeAction send_message governed propose blocks domain before validation', async () => {
    const aiSendSpy = vi.spyOn(chatAIActionService, 'aiSendMessage');
    vi.spyOn(bridge, 'tryExecuteViaGovernedPlatform').mockResolvedValue({
      actionId: 'action-2',
      success: true,
      result: { governance: { status: 'AWAITING_APPROVAL' } },
      metadata: {
        executionTime: 1,
        module: 'chat',
        operation: 'send_message',
        affectedUsers: [],
        rollbackAvailable: false,
      },
    });

    const action = baseAction({
      id: 'action-2',
      operation: 'send_message',
      parameters: { conversationId: 'conv-1' },
    });

    const result = await executor.executeAction(action, userContext);

    expect(aiSendSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(JSON.stringify(result.result)).toMatch(/AWAITING_APPROVAL/);
  });
});
