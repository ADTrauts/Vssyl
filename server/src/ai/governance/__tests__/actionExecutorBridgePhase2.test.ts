/**
 * Phase 2 — ActionExecutor bridge / legacy propose / Twin tool mapping
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIAction, UserContext } from '../../core/DigitalLifeTwinService';
import {
  mapActionExecutorToTwinTool,
  tryExecuteViaGovernedPlatform,
} from '../actionExecutorBridge';
import * as governed from '../governedToolExecutor';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

const userContext: UserContext = {
  userId: 'u1',
  personality: {},
  preferences: {},
  autonomySettings: {},
  recentActivity: [],
};

describe('Phase 2 actionExecutorBridge', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps share_file and create_task to Twin tools', () => {
    const share: AIAction = {
      id: 'a1',
      type: 'module_action',
      module: 'drive',
      operation: 'share_file',
      parameters: { fileId: 'f1', userId: 'u2' },
      requiresApproval: false,
      reasoning: 't',
    };
    expect(mapActionExecutorToTwinTool(share)?.tool).toBe('share_file');

    const todo: AIAction = {
      id: 'a2',
      type: 'module_action',
      module: 'todo',
      operation: 'create_task',
      parameters: { title: 'Buy milk' },
      requiresApproval: false,
      reasoning: 't',
    };
    expect(mapActionExecutorToTwinTool(todo)?.tool).toBe('create_todo');
  });

  it('create_todo via bridge calls executeGovernedTool', async () => {
    const spy = vi.spyOn(governed, 'executeGovernedTool').mockResolvedValue(
      JSON.stringify({
        success: true,
        message: 'ok',
        governance: { status: 'COMPLETED', executionId: 'e1', executed: true },
      })
    );
    const action: AIAction = {
      id: 'a3',
      type: 'module_action',
      module: 'todo',
      operation: 'create_task',
      parameters: { title: 'T' },
      requiresApproval: false,
      reasoning: 't',
    };
    const result = await tryExecuteViaGovernedPlatform(action, userContext, {} as never);
    expect(spy).toHaveBeenCalled();
    expect(result?.success).toBe(true);
    expect(JSON.stringify(result?.result)).toMatch(/COMPLETED/);
  });

  it('delete_file HIGH_RISK proposes on ledger without domain delete', async () => {
    const store = new Map<string, Record<string, unknown>>();
    const prisma = {
      aIActionExecution: {
        findUnique: vi.fn(async ({ where }: { where: { idempotencyKey: string } }) =>
          store.get(where.idempotencyKey) ?? null
        ),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: 'exec-legacy-1',
            ...data,
            createdAt: new Date(),
            completedAt: null,
            retryCount: 0,
            authorized: true,
            executed: false,
            idempotentReplay: false,
            resultJson: null,
            errorMessage: null,
            activityId: null,
          };
          store.set(String(data.idempotencyKey), row);
          return row;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          for (const [k, v] of store.entries()) {
            if ((v as { id: string }).id === where.id) {
              const next = { ...v, ...data };
              store.set(k, next);
              return next;
            }
          }
          return { id: where.id, ...data };
        }),
      },
      aIApprovalRequest: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'appr-legacy-1',
          ...data,
        })),
      },
    };

    const action: AIAction = {
      id: 'a4',
      type: 'module_action',
      module: 'drive',
      operation: 'delete_file',
      parameters: { fileId: 'f-del' },
      requiresApproval: false,
      reasoning: 'delete',
    };

    const result = await tryExecuteViaGovernedPlatform(action, userContext, prisma as never);
    expect(result?.success).toBe(true);
    expect(JSON.stringify(result?.result)).toMatch(/AWAITING_APPROVAL/);
    expect(prisma.aIApprovalRequest.create).toHaveBeenCalled();
    const actionData = (prisma.aIApprovalRequest.create.mock.calls[0]?.[0] as {
      data: { actionData: { source: string; operation: string } };
    }).data.actionData;
    expect(actionData.source).toBe('action_executor');
    expect(actionData.operation).toBe('delete_file');
  });
});
