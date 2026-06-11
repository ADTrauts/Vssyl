import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as driveAIActionService from '../../../services/driveAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(join(process.cwd(), 'src/ai/core/ActionExecutor.ts'), 'utf8');

describe('ActionExecutor drive paths (Wave 1B)', () => {
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
    module: 'drive',
    operation: 'share_file',
    parameters: {},
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import drive controllers or use mock req/res', () => {
    expect(executorSource).not.toMatch(/controllers\/(file|folder)Controller/);
    expect(executorSource).not.toMatch(/mockReq/);
    expect(executorSource).toMatch(/driveAIActionService/);
  });

  it('share_file uses driveAIActionService', async () => {
    const spy = vi.spyOn(driveAIActionService, 'aiShareFile').mockResolvedValue({
      success: true,
      data: { permission: { id: 'p1' } },
    });

    const action = baseAction({
      operation: 'share_file',
      parameters: { fileId: 'f1', userId: 'target-1', canWrite: false },
    });

    const results = await executor.executeActions([action], userContext);
    expect(results[0]?.success).toBe(true);
    expect(spy).toHaveBeenCalledWith({
      ownerUserId: 'user-1',
      fileId: 'f1',
      targetUserId: 'target-1',
      canRead: true,
      canWrite: false,
    });
  });
});
