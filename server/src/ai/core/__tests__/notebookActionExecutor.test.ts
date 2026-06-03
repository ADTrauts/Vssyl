import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ActionExecutor } from '../ActionExecutor';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import * as notebookAIActionService from '../../../services/notebook/notebookAIActionService';
import * as notebookAIContextService from '../../../services/notebook/notebookAIContextService';
import * as actionExecutorRegistryModule from '../ActionExecutorRegistry';

const executorSource = readFileSync(
  join(process.cwd(), 'src/ai/core/ActionExecutor.ts'),
  'utf8'
);

describe('ActionExecutor notebook paths (Phase 7+)', () => {
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
    id: 'action-nb-1',
    type: 'module_action',
    module: 'notebook',
    operation: 'summarize_page',
    parameters: { pageId: 'page-1' },
    requiresApproval: false,
    affectedUsers: [],
    reasoning: 'test',
    ...overrides,
  });

  it('does not import notebook controllers', () => {
    expect(executorSource).not.toMatch(/controllers\/notebook/);
    expect(executorSource).toMatch(/notebookAIActionService/);
    expect(executorSource).toMatch(/notebookAIContextService/);
  });

  it('executeNotebookAction does not use mock req/res', () => {
    const block = executorSource.match(
      /private async executeNotebookAction[\s\S]*?private async executeTasksAction/
    )?.[0];
    expect(block).toBeDefined();
    expect(block).not.toMatch(/mockReq/);
    expect(block).not.toMatch(/mockRes/);
  });

  it('executeAction summarize_page uses notebookAIActionService', async () => {
    const spy = vi.spyOn(notebookAIActionService, 'summarizePage').mockResolvedValue({
      summary: 'Brief',
      keyDecisions: [],
      openTasks: [],
      risksAndFollowUps: [],
      warnings: [],
    });

    const result = await executor.executeAction(
      baseAction({ operation: 'summarize_page' }),
      userContext
    );

    expect(spy).toHaveBeenCalledWith('page-1', 'user-1');
    expect(result.success).toBe(true);
    expect(result.metadata?.module).toBe('notebook');
  });

  it('confirm_action_items is rejected without auto-write', async () => {
    const spy = vi.spyOn(notebookAIActionService, 'confirmExtractedActionItems');

    const result = await executor.executeAction(
      baseAction({
        operation: 'confirm_action_items',
        parameters: { pageId: 'page-1', proposals: [{ title: 'Follow up' }] },
      }),
      userContext
    );

    expect(spy).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/confirm/i);
  });

  it('get_page_ai_context uses notebookAIContextService', async () => {
    const spy = vi.spyOn(notebookAIContextService, 'loadGroundedAIContext').mockResolvedValue({
      pageId: 'page-1',
      dashboardId: 'dash-1',
      businessId: null,
      page: {
        title: 'Standup',
        content: 'Notes',
        tags: [],
        pinned: false,
        canEdit: true,
        isOwner: true,
      },
      tasks: [],
      files: [],
      events: [],
      shareCount: 0,
      warnings: [],
      grounding: {
        restrictedLinks: 0,
        trashedTargets: 0,
        contentTruncated: false,
        emptyContent: false,
        totalLinks: 0,
      },
      sourceGeneratedAt: new Date().toISOString(),
    });

    const result = await executor.executeAction(
      baseAction({ operation: 'get_page_ai_context' }),
      userContext
    );

    expect(spy).toHaveBeenCalledWith('page-1', 'user-1');
    expect(result.success).toBe(true);
  });
});
