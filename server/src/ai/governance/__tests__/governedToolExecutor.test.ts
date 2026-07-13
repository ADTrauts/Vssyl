import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeGovernedTool } from '../governedToolExecutor';
import * as toolExecutor from '../../tools/toolExecutor';
import * as driveShare from '../../../services/driveFileShareService';
import * as todoAI from '../../../services/todoAIActionService';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

function mockPrisma(overrides: Record<string, unknown> = {}) {
  const store = new Map<string, Record<string, unknown>>();
  return {
    aIActionExecution: {
      findUnique: vi.fn(async ({ where }: { where: { idempotencyKey: string } }) => {
        return store.get(where.idempotencyKey) ?? null;
      }),
      findFirst: vi.fn(async ({ where }: { where: { approvalId?: string } }) => {
        if (!where.approvalId) return null;
        for (const v of store.values()) {
          if ((v as { approvalId?: string }).approvalId === where.approvalId) return v;
        }
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: 'exec-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstAttemptedAt: new Date(),
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
            const next = { ...v, ...data, id: where.id };
            store.set(k, next);
            return next;
          }
        }
        return { id: where.id, actionName: 'share_file', ...data, createdAt: new Date(), completedAt: new Date() };
      }),
    },
    aIApprovalRequest: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'approval-1',
        ...data,
      })),
    },
    ...overrides,
  };
}

describe('executeGovernedTool (Phase 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes read-only tools without approval ledger', async () => {
    const spy = vi.spyOn(toolExecutor, 'executeTool').mockResolvedValue(
      JSON.stringify({ success: true, message: 'ok', data: { files: [] } })
    );
    const prisma = mockPrisma();
    const raw = await executeGovernedTool('list_drive_files', {}, {
      userId: 'u1',
      prisma: prisma as never,
      requestId: 'req-1',
    });
    expect(JSON.parse(raw).success).toBe(true);
    expect(spy).toHaveBeenCalled();
    expect(prisma.aIApprovalRequest.create).not.toHaveBeenCalled();
  });

  it('blocks share_file pending approval and does not call domain share', async () => {
    const shareSpy = vi.spyOn(driveShare, 'grantFileShareByEmail');
    const prisma = mockPrisma();
    const raw = await executeGovernedTool(
      'share_file',
      { fileId: 'f1', targetUserEmail: 'a@b.com' },
      { userId: 'u1', prisma: prisma as never, requestId: 'req-1' }
    );
    const parsed = JSON.parse(raw) as {
      success: boolean;
      governance: { status: string; approvalId: string };
    };
    expect(parsed.success).toBe(false);
    expect(parsed.governance.status).toBe('AWAITING_APPROVAL');
    expect(parsed.governance.approvalId).toBe('approval-1');
    expect(shareSpy).not.toHaveBeenCalled();
    expect(prisma.aIApprovalRequest.create).toHaveBeenCalled();
  });

  it('executes share_file when approvalGranted', async () => {
    vi.spyOn(driveShare, 'grantFileShareByEmail').mockResolvedValue({
      file: { id: 'f1', name: 'Doc' },
    } as never);
    const prisma = mockPrisma();
    const raw = await executeGovernedTool(
      'share_file',
      { fileId: 'f1', targetUserEmail: 'a@b.com' },
      {
        userId: 'u1',
        prisma: prisma as never,
        approvalGranted: true,
        approvalId: 'approval-1',
        requestId: 'req-1',
      }
    );
    const parsed = JSON.parse(raw) as { success: boolean; governance: { executed: boolean } };
    expect(parsed.success).toBe(true);
    expect(parsed.governance.executed).toBe(true);
  });

  it('create_todo is idempotent on replay', async () => {
    vi.spyOn(todoAI, 'aiCreateTask').mockResolvedValue({
      success: true,
      data: { id: 'task-1', title: 'T', priority: 'MEDIUM' },
    });
    const prisma = mockPrisma();
    const ctx = {
      userId: 'u1',
      prisma: prisma as never,
      requestId: 'req-1',
      idempotencyKey: 'fixed-key-todo',
    };
    const first = JSON.parse(await executeGovernedTool('create_todo', { title: 'T' }, ctx));
    expect(first.success).toBe(true);
    expect(todoAI.aiCreateTask).toHaveBeenCalledTimes(1);

    // Seed store as COMPLETED for same key
    const created = await prisma.aIActionExecution.findUnique({
      where: { idempotencyKey: 'fixed-key-todo' },
    });
    expect(created).toBeTruthy();
    await prisma.aIActionExecution.update({
      where: { id: (created as { id: string }).id },
      data: {
        status: 'COMPLETED',
        executed: true,
        resultJson: first,
        completedAt: new Date(),
      },
    });

    const second = JSON.parse(await executeGovernedTool('create_todo', { title: 'T' }, ctx));
    expect(second.governance?.idempotentReplay).toBe(true);
    expect(todoAI.aiCreateTask).toHaveBeenCalledTimes(1);
  });

  it('rejects idempotency key reused with different args', async () => {
    vi.spyOn(todoAI, 'aiCreateTask').mockResolvedValue({
      success: true,
      data: { id: 'task-1', title: 'T', priority: 'MEDIUM' },
    });
    const prisma = mockPrisma();
    const ctx = {
      userId: 'u1',
      prisma: prisma as never,
      idempotencyKey: 'same-key',
    };
    await executeGovernedTool('create_todo', { title: 'A' }, ctx);
    const conflict = JSON.parse(
      await executeGovernedTool('create_todo', { title: 'B' }, ctx)
    );
    expect(conflict.success).toBe(false);
    expect(conflict.message).toMatch(/different arguments/i);
  });
});
