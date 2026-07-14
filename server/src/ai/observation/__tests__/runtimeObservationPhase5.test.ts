/**
 * Phase 5 observation smoke tests (updated for Phase 5B collector contracts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redactMetadata } from '../redaction';
import { timelineEventsFromObservation } from '../timelineFromEvents';
import {
  clearObservationBuffer,
  collectObservationEvent,
  getObservationHealth,
  setObservationEnabled,
} from '../observationCollector';
import { resetObservationHealthForTests } from '../observationHealth';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(async () => undefined),
    warn: vi.fn(async () => undefined),
    error: vi.fn(async () => undefined),
    debug: vi.fn(async () => undefined),
  },
}));

describe('Phase 5 redaction (compat)', () => {
  it('redacts secrets and private reasoning', () => {
    const out = redactMetadata({
      authorization: 'Bearer abc',
      providerReasoning: 'private',
      safe: 'hello',
    });
    expect(out?.authorization).toBe('[REDACTED]');
    expect(out?.providerReasoning).toBe('[REDACTED]');
    expect(out?.safe).toBe('hello');
  });
});

describe('Phase 5 timeline (compat)', () => {
  it('maps core lifecycle events', () => {
    const timeline = timelineEventsFromObservation([
      {
        eventId: '1',
        eventVersion: 2,
        requestId: 'r',
        sequenceNumber: 1,
        emittedAt: '2026-07-13T10:00:00.000Z',
        type: 'ExecutionStarted',
        surface: 'TWIN',
        userId: 'u',
      },
      {
        eventId: '2',
        eventVersion: 2,
        requestId: 'r',
        sequenceNumber: 2,
        emittedAt: '2026-07-13T10:00:01.000Z',
        type: 'ResponseReturned',
        surface: 'TWIN',
        userId: 'u',
      },
    ]);
    expect(timeline.map((t) => t.stage)).toEqual(['REQUEST_RECEIVED', 'RESPONSE']);
  });
});

describe('Phase 5 collector fail-safe (compat)', () => {
  beforeEach(() => {
    setObservationEnabled(true);
    resetObservationHealthForTests();
    clearObservationBuffer();
  });

  it('returns ok:false when persistence throws', async () => {
    const prisma = {
      $transaction: vi.fn(async () => {
        throw new Error('db down');
      }),
    } as never;
    const result = await collectObservationEvent(prisma, {
      requestId: 'req',
      userId: 'u',
      type: 'ExecutionStarted',
      idempotencyKey: 'ExecutionStarted',
    });
    expect(result.ok).toBe(false);
  });

  it('reports health', () => {
    expect(typeof getObservationHealth().enabled).toBe('boolean');
  });

  it('emit facade never throws when disabled', async () => {
    const { emitTwinObservation } = await import('../runtimeObservation');
    setObservationEnabled(false);
    expect(() =>
      emitTwinObservation({ requestId: 'x', userId: 'u', type: 'ExecutionStarted' })
    ).not.toThrow();
    setObservationEnabled(true);
  });
});
