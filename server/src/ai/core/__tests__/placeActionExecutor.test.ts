import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as placeAIActionService from '../../../services/place/placeAIActionService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor place paths (Wave 1F)', () => {
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
    id: 'action-place-1',
    type: 'module_action',
    module: 'place',
    operation: 'search_places',
    parameters: { query: 'coffee' },
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import place controllers', () => {
    expect(executorSource).not.toMatch(/controllers\/place/);
    expect(executorSource).toMatch(/placeAIActionService/);
  });

  it('executePlaceAction does not use mock req/res', () => {
    const block = executorSource.match(
      /private async executePlaceAction[\s\S]*?private todoActionMetadata/
    )?.[0];
    expect(block).toBeDefined();
    expect(block).not.toMatch(/mockReq/);
    expect(block).not.toMatch(/mockRes/);
  });

  it('search_places uses placeAIActionService', async () => {
    const spy = vi.spyOn(placeAIActionService, 'searchPlaces').mockResolvedValue({
      success: true,
      data: { query: 'coffee', results: [] },
    });

    const result = await executor.executeAction(baseAction({ operation: 'search_places' }), userContext);

    expect(spy).toHaveBeenCalledWith('user-1', 'coffee');
    expect(result.success).toBe(true);
    expect(result.metadata?.module).toBe('place');
  });

  it('rejects write actions', async () => {
    const spy = vi.spyOn(placeAIActionService, 'recommendPlaces');

    const result = await executor.executeAction(
      baseAction({ operation: 'add_node', parameters: { entityId: 'biz-1' } }),
      userContext
    );

    expect(spy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/read-only/i);
  });

  it('get_place_context delegates to placeAIActionService', async () => {
    const spy = vi.spyOn(placeAIActionService, 'getPlaceContext').mockResolvedValue({
      success: true,
      data: { scope: 'overview', context: {} },
    });

    const result = await executor.executeAction(
      baseAction({ operation: 'get_place_context', parameters: { scope: 'overview' } }),
      userContext
    );

    expect(spy).toHaveBeenCalledWith('user-1', 'overview');
    expect(result.success).toBe(true);
  });
});
