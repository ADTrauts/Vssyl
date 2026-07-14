/**
 * Phase 5B — reliability tests: identity, concurrency, state machine, redaction, retention.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIObservationEvent } from 'vssyl-shared';
import { redactMetadata, DEFAULT_REDACTION_CONFIG } from '../redaction';
import {
  applyObservationStateTransition,
  canTransitionObservationState,
  stateHintFromEventType,
} from '../executionStateMachine';
import { timelineEventsFromObservation } from '../timelineFromEvents';
import {
  clearObservationBuffer,
  collectObservationEvent,
  setObservationEnabled,
} from '../observationCollector';
import { resetObservationHealthForTests, getObservationHealthSnapshot } from '../observationHealth';
import { persistObservationEvent, buildDeterministicEventId } from '../executionRecorder';
import { purgeObservationRetention } from '../observationRetentionService';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

function createPhase5bMockPrisma() {
  const hubs = new Map<string, Record<string, unknown>>();
  const events = new Map<string, Record<string, unknown>>();

  const api = {
    aIExecutionRecord: {
      findFirst: vi.fn(async ({ where }: { where: { requestId: string } }) => {
        for (const row of hubs.values()) {
          if (row.requestId === where.requestId) return row;
        }
        return null;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => hubs.get(where.id) ?? null),
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = hubs.get(where.id);
        if (!row) throw new Error('not found');
        return row;
      }),
      findMany: vi.fn(async () => Array.from(hubs.values())),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const id = (data.id as string) || `hub_${hubs.size + 1}`;
        const row = {
          ...data,
          id,
          observationState: data.observationState ?? 'STARTED',
          observationVersion: data.observationVersion ?? 0,
          observationEventsJson: data.observationEventsJson ?? [],
          linkedArtifactsJson: data.linkedArtifactsJson ?? {},
          timelineJson: data.timelineJson ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: data.completedAt ?? null,
        };
        hubs.set(id, row);
        return row;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown> & { observationVersion?: { increment: number } };
        }) => {
          const existing = hubs.get(where.id) ?? { id: where.id };
          const nextVersion =
            data.observationVersion &&
            typeof data.observationVersion === 'object' &&
            'increment' in data.observationVersion
              ? Number(existing.observationVersion ?? 0) +
                Number((data.observationVersion as { increment: number }).increment)
              : (data.observationVersion as number | undefined) ?? existing.observationVersion;
          const row = { ...existing, ...data, observationVersion: nextVersion, id: where.id };
          hubs.set(where.id, row);
          return row;
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        let count = 0;
        for (const id of where.id.in) {
          if (hubs.delete(id)) count += 1;
        }
        return { count };
      }),
      count: vi.fn(async () => hubs.size),
    },
    aIObservationEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (events.has(data.eventId as string)) {
          const err = new Error('Unique constraint') as Error & { code: string };
          err.code = 'P2002';
          throw err;
        }
        events.set(data.eventId as string, data);
        return data;
      }),
      findMany: vi.fn(
        async ({
          where,
          take,
          orderBy: _orderBy,
        }: {
          where?: { requestId?: string; executionRecordId?: string; createdAt?: { lt: Date }; id?: { in: string[] } };
          take?: number;
          orderBy?: unknown;
        }) => {
          void _orderBy;
          let rows = Array.from(events.values());
          if (where?.requestId) rows = rows.filter((r) => r.requestId === where.requestId);
          if (where?.executionRecordId) {
            rows = rows.filter((r) => r.executionRecordId === where.executionRecordId);
          }
          if (where?.createdAt?.lt) {
            rows = rows.filter((r) => {
              const created = (r.createdAt as Date) ?? new Date(0);
              return created < where.createdAt!.lt;
            });
          }
          if (where?.id?.in) rows = rows.filter((r) => where.id!.in.includes(r.id as string));
          rows = rows.map((r) => ({
            ...r,
            emittedAt: r.emittedAt instanceof Date ? r.emittedAt : new Date(String(r.emittedAt)),
            observedAt: r.observedAt instanceof Date ? r.observedAt : new Date(),
            createdAt: (r.createdAt as Date) ?? new Date(),
          }));
          if (take) rows = rows.slice(0, take);
          return rows;
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        let count = 0;
        for (const id of where.id.in) {
          for (const [k, v] of events.entries()) {
            if (v.id === id) {
              events.delete(k);
              count += 1;
            }
          }
        }
        return { count };
      }),
      count: vi.fn(async () => events.size),
    },
    $transaction: vi.fn(async (fn: (tx: typeof api) => Promise<unknown>) => fn(api)),
  };

  return { api, hubs, events };
}

describe('Phase 5B state machine', () => {
  it('allows legal transitions and blocks terminal regression', () => {
    expect(canTransitionObservationState('STARTED', 'CONTEXT_BUILDING')).toBe(true);
    expect(canTransitionObservationState('COMPLETED', 'STARTED')).toBe(false);
    expect(canTransitionObservationState('FAILED', 'PROVIDER_RUNNING')).toBe(false);
    const late = applyObservationStateTransition('COMPLETED', 'PROVIDER_RUNNING');
    expect(late.applied).toBe(false);
    expect(late.state).toBe('COMPLETED');
  });

  it('maps event types to state hints', () => {
    expect(stateHintFromEventType('ProviderCallStarted')).toBe('PROVIDER_RUNNING');
    expect(stateHintFromEventType('ApprovalRequested')).toBe('AWAITING_APPROVAL');
    expect(stateHintFromEventType('ResponseReturned')).toBe('COMPLETED');
  });
});

describe('Phase 5B redaction hardening', () => {
  it('redacts nested secrets, signed URLs, base64, and circular refs', () => {
    const circular: Record<string, unknown> = { ok: true };
    circular.self = circular;
    const out = redactMetadata(
      {
        Authorization: 'Bearer abc',
        nested: {
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
          url: 'https://storage.googleapis.com/x?X-Goog-Signature=abc',
          img: 'data:image/png;base64,aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        providerReasoning: 'secret thoughts',
        circular,
        password: 'x',
      },
      DEFAULT_REDACTION_CONFIG
    );
    expect(out?.Authorization).toBe('[REDACTED]');
    expect((out?.nested as Record<string, unknown>).jwt).toBe('[REDACTED]');
    expect(String((out?.nested as Record<string, unknown>).url)).toContain('REDACTED');
    expect(String((out?.nested as Record<string, unknown>).img)).toContain('REDACTED');
    expect(out?.providerReasoning).toBe('[REDACTED]');
    expect(out?.password).toBe('[REDACTED]');
    expect((out?.circular as Record<string, unknown>).self).toBe('[CIRCULAR]');
  });

  it('fail-closes oversized payloads', () => {
    const huge = { blob: 'x'.repeat(50_000) };
    const out = redactMetadata(huge, { ...DEFAULT_REDACTION_CONFIG, maxPayloadBytes: 100 });
    expect(out?._redaction).toBe('payload_too_large');
  });
});

describe('Phase 5B persistence reliability', () => {
  beforeEach(() => {
    setObservationEnabled(true);
    resetObservationHealthForTests();
    clearObservationBuffer();
  });

  it('persists immutable events with stable eventId and dedupes duplicates', async () => {
    const { api, events } = createPhase5bMockPrisma();
    const eventId = buildDeterministicEventId('req-1', 'ExecutionStarted', 'ExecutionStarted');
    const base: AIObservationEvent = {
      eventId,
      eventVersion: 2,
      requestId: 'req-1',
      sequenceNumber: 1,
      emittedAt: new Date().toISOString(),
      type: 'ExecutionStarted',
      surface: 'TWIN',
      userId: 'u1',
      metadata: { userQuery: 'hi' },
    };
    const first = await persistObservationEvent(api as never, base);
    const second = await persistObservationEvent(api as never, base);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(events.size).toBe(1);
  });

  it('retains late intermediate events after terminal without regressing state', async () => {
    const { api, hubs } = createPhase5bMockPrisma();
    await persistObservationEvent(api as never, {
      eventId: 'e1',
      eventVersion: 2,
      requestId: 'req-late',
      sequenceNumber: 1,
      emittedAt: '2026-07-13T10:00:00.000Z',
      type: 'ExecutionStarted',
      surface: 'TWIN',
      userId: 'u1',
    });
    await persistObservationEvent(api as never, {
      eventId: 'e2',
      eventVersion: 2,
      requestId: 'req-late',
      sequenceNumber: 2,
      emittedAt: '2026-07-13T10:00:05.000Z',
      type: 'ResponseReturned',
      surface: 'TWIN',
      userId: 'u1',
      metadata: { aiResponseSummary: 'done' },
    });
    await persistObservationEvent(api as never, {
      eventId: 'e3',
      eventVersion: 2,
      requestId: 'req-late',
      sequenceNumber: 3,
      emittedAt: '2026-07-13T10:05:00.000Z',
      type: 'ApprovalGranted',
      surface: 'GOVERNANCE',
      userId: 'u1',
      metadata: { approvalId: 'ap1' },
    });
    const hub = Array.from(hubs.values())[0]!;
    expect(hub.observationState).toBe('COMPLETED');
  });

  it('handles 100 concurrent events without losing unique eventIds', async () => {
    const { api, events } = createPhase5bMockPrisma();
    const jobs = Array.from({ length: 100 }, (_, i) =>
      persistObservationEvent(api as never, {
        eventId: `concurrent-${i}`,
        eventVersion: 2,
        requestId: 'req-conc',
        sequenceNumber: i + 1,
        emittedAt: new Date(Date.now() + i).toISOString(),
        type: i === 0 ? 'ExecutionStarted' : 'ContextBuilt',
        surface: 'TWIN',
        userId: 'u1',
        metadata: { i },
      })
    );
    await Promise.all(jobs);
    expect(events.size).toBe(100);
  });

  it('collector survives database unavailable', async () => {
    const prisma = {
      $transaction: vi.fn(async () => {
        throw new Error('db down');
      }),
    } as never;
    const result = await collectObservationEvent(prisma, {
      requestId: 'req-down',
      userId: 'u1',
      type: 'ExecutionStarted',
      idempotencyKey: 'ExecutionStarted',
    });
    expect(result.ok).toBe(false);
  });

  it('dry-run retention purge does not delete', async () => {
    const { api, events } = createPhase5bMockPrisma();
    events.set('old', {
      id: 'old1',
      eventId: 'old',
      requestId: 'r',
      createdAt: new Date('2020-01-01'),
      emittedAt: new Date('2020-01-01'),
      observedAt: new Date('2020-01-01'),
      eventType: 'ExecutionStarted',
      eventVersion: 2,
      sequenceNumber: 1,
      surface: 'TWIN',
      userId: 'u1',
      metadataJson: {},
      correlationJson: {},
      deliveryClass: 'ASYNC_AT_LEAST_ONCE',
      retentionClass: 'HOT',
    });
    const result = await purgeObservationRetention(api as never, {
      dryRun: true,
      purgeAfterDays: 30,
    });
    expect(result.dryRun).toBe(true);
    expect(result.eventsMatched).toBe(1);
    expect(result.eventsDeleted).toBe(0);
    expect(events.size).toBe(1);
  });

  it('rebuilds timeline from events in order', () => {
    const timeline = timelineEventsFromObservation([
      {
        eventId: 'b',
        eventVersion: 2,
        requestId: 'r',
        sequenceNumber: 2,
        emittedAt: '2026-07-13T10:00:02.000Z',
        type: 'ResponseReturned',
        surface: 'TWIN',
        userId: 'u',
      },
      {
        eventId: 'a',
        eventVersion: 2,
        requestId: 'r',
        sequenceNumber: 1,
        emittedAt: '2026-07-13T10:00:00.000Z',
        type: 'ExecutionStarted',
        surface: 'TWIN',
        userId: 'u',
      },
    ]);
    expect(timeline[0]?.stage).toBe('REQUEST_RECEIVED');
    expect(timeline[timeline.length - 1]?.stage).toBe('RESPONSE');
  });

  it('reports health snapshot statuses', () => {
    setObservationEnabled(false);
    const disabled = getObservationHealthSnapshot(true);
    expect(disabled.status).toBe('DISABLED');
    setObservationEnabled(true);
    const healthy = getObservationHealthSnapshot(true);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(healthy.status);
  });
});

describe('Phase 5B facade isolation', () => {
  it('emitTwinObservation never throws', async () => {
    const { emitTwinObservation } = await import('../runtimeObservation');
    setObservationEnabled(false);
    expect(() =>
      emitTwinObservation({
        requestId: 'x',
        userId: 'u',
        type: 'ExecutionStarted',
      })
    ).not.toThrow();
    setObservationEnabled(true);
  });
});
