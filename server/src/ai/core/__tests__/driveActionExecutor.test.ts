import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as driveAIActionService from '../../../services/driveAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';
import * as bridge from '../../governance/actionExecutorBridge';

const executorSource = readFileSync(join(process.cwd(), 'src/ai/core/ActionExecutor.ts'), 'utf8');

describe('ActionExecutor drive paths (Wave 1B / Phase 2)', () => {
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

  it('share_file routes via governed platform (Phase 2) and does not call domain share directly', async () => {
    const shareSpy = vi.spyOn(driveAIActionService, 'aiShareFile').mockResolvedValue({
      success: true,
      data: { permission: { id: 'p1' } },
    });
    const bridgeSpy = vi.spyOn(bridge, 'tryExecuteViaGovernedPlatform').mockResolvedValue({
      actionId: 'action-1',
      success: true,
      result: {
        governance: { status: 'AWAITING_APPROVAL', approvalId: 'appr-1', executionId: 'exec-1' },
      },
      metadata: {
        executionTime: 1,
        module: 'drive',
        operation: 'share_file',
        affectedUsers: [],
        rollbackAvailable: false,
      },
    });

    const action = baseAction({
      operation: 'share_file',
      parameters: { fileId: 'f1', userId: 'target-1', canWrite: false },
    });

    const results = await executor.executeActions([action], userContext);
    expect(bridgeSpy).toHaveBeenCalled();
    expect(results[0]?.success).toBe(true);
    expect(JSON.stringify(results[0]?.result)).toMatch(/AWAITING_APPROVAL/);
    expect(shareSpy).not.toHaveBeenCalled();
  });
});
