/**
 * Phase 1B — Idempotency hardening (ledger concurrency / replay semantics).
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  beginOrReplayActionExecution,
  completeActionExecution,
} from '../aiActionExecutionService';
import { hashToolArguments, stableStringify, STALE_EXECUTING_MS } from '../aiActionIdempotency';

function mockPrisma(store = new Map<string, Record<string, unknown>>()) {
  return {
    store,
    aIActionExecution: {
      findUnique: vi.fn(async ({ where }: { where: { idempotencyKey: string } }) => {
        return store.get(where.idempotencyKey) ?? null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (store.has(String(data.idempotencyKey))) {
          const err = new Error('Unique constraint failed') as Error & { code?: string };
          err.code = 'P2002';
          throw err;
        }
        const row = {
          id: `exec-${store.size + 1}`,
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
        throw new Error('not found');
      }),
    },
  };
}

describe('Phase 1B — idempotency hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('stableStringify canonicalizes object key order', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(hashToolArguments({ b: 1, a: 2 })).toBe(hashToolArguments({ a: 2, b: 1 }));
  });

  it('same key + same args → replay COMPLETED', async () => {
    const prisma = mockPrisma();
    const args = { title: 'T' };
    const first = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args,
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-1',
    });
    expect(first.kind).toBe('new');
    if (first.kind !== 'new') return;
    await completeActionExecution({
      prisma: prisma as never,
      executionId: first.executionId,
      status: 'COMPLETED',
      executed: true,
      result: { success: true },
    });
    const second = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args,
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-1',
    });
    expect(second.kind).toBe('replay');
    if (second.kind === 'replay') expect(second.status).toBe('COMPLETED');
  });

  it('same key + different args → conflict', async () => {
    const prisma = mockPrisma();
    await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-2',
    });
    const conflict = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args: { title: 'B' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-2',
    });
    expect(conflict.kind).toBe('conflict');
  });

  it('same key different user → conflict', async () => {
    const prisma = mockPrisma();
    await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-3',
    });
    const conflict = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u2',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-3',
    });
    expect(conflict.kind).toBe('conflict');
  });

  it('same key different business → conflict', async () => {
    const prisma = mockPrisma();
    await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      businessId: 'b1',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-4',
    });
    const conflict = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      businessId: 'b2',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-4',
    });
    expect(conflict.kind).toBe('conflict');
  });

  it('FAILED may retry (new outcome on same row)', async () => {
    const prisma = mockPrisma();
    const first = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-5',
    });
    if (first.kind !== 'new') return;
    await completeActionExecution({
      prisma: prisma as never,
      executionId: first.executionId,
      status: 'FAILED',
      executed: false,
      errorMessage: 'boom',
    });
    const retry = await beginOrReplayActionExecution({
      prisma: prisma as never,
      userId: 'u1',
      actionName: 'create_todo',
      args: { title: 'A' },
      riskCategory: 'LOW_RISK_REVERSIBLE',
      idempotencyKey: 'key-5',
    });
    expect(retry.kind).toBe('new');
  });

  it('documents STALE_EXECUTING_MS policy constant', () => {
    expect(STALE_EXECUTING_MS).toBeGreaterThan(60_000);
  });
});
