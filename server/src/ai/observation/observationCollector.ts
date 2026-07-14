/**
 * Phase 5B — Observation collector: validate, redact, persist immutably.
 * Never changes Twin runtime. Failures are swallowed by the facade.
 */
import { createHash } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import type { AIObservationEvent, AIObservationEmitInput } from 'vssyl-shared';
import {
  AI_OBSERVATION_EVENT_SCHEMA_VERSION,
} from 'vssyl-shared';
import { logger } from '../../lib/logger';
import { DEFAULT_REDACTION_CONFIG, redactMetadata, type RedactionConfig } from './redaction';
import { persistObservationEvent } from './executionRecorder';
import {
  bumpQueueDepth,
  getObservationEnabledFlag,
  getObservationHealthSnapshot,
  incrDropped,
  incrEmitted,
  recordCollectorLatency,
  setObservationEnabledFlag,
} from './observationHealth';

const sequenceByRequest = new Map<string, number>();
const MAX_SEQUENCE_KEYS = 5000;

let redactionConfig: RedactionConfig = { ...DEFAULT_REDACTION_CONFIG };

export function setObservationEnabled(enabled: boolean): void {
  setObservationEnabledFlag(enabled);
}

export function isObservationEnabled(): boolean {
  return getObservationEnabledFlag();
}

export function setRedactionConfig(config: Partial<RedactionConfig>): void {
  redactionConfig = { ...redactionConfig, ...config };
}

export function getRedactionConfig(): RedactionConfig {
  return { ...redactionConfig };
}

function nextSequence(requestId: string, explicit?: number): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  const n = (sequenceByRequest.get(requestId) ?? 0) + 1;
  sequenceByRequest.set(requestId, n);
  if (sequenceByRequest.size > MAX_SEQUENCE_KEYS) {
    const keys = Array.from(sequenceByRequest.keys()).slice(0, MAX_SEQUENCE_KEYS / 2);
    for (const k of keys) sequenceByRequest.delete(k);
  }
  return n;
}

function buildEventId(input: AIObservationEmitInput, sequenceNumber: number): string {
  if (input.eventId?.trim()) return input.eventId.trim();
  const material = `${input.requestId}|${input.type}|${input.idempotencyKey ?? sequenceNumber}`;
  return `obs_${createHash('sha256').update(material).digest('hex').slice(0, 32)}`;
}

function validateEmit(input: AIObservationEmitInput): string | null {
  if (!input.requestId?.trim()) return 'requestId required';
  if (!input.userId?.trim()) return 'userId required';
  if (!input.type) return 'type required';
  return null;
}

function normalizeEvent(input: AIObservationEmitInput): AIObservationEvent {
  const sequenceNumber = nextSequence(input.requestId, input.sequenceNumber);
  const emittedAt = input.emittedAt ?? input.timestamp ?? new Date().toISOString();
  const observedAt = new Date().toISOString();
  return {
    eventId: buildEventId(input, sequenceNumber),
    eventVersion: input.eventVersion ?? AI_OBSERVATION_EVENT_SCHEMA_VERSION,
    requestId: input.requestId,
    sequenceNumber,
    emittedAt,
    observedAt,
    timestamp: emittedAt,
    type: input.type,
    eventType: input.type,
    surface: input.surface ?? 'TWIN',
    sourceComponent: input.sourceComponent,
    conversationId: input.conversationId,
    userId: input.userId,
    businessId: input.businessId ?? undefined,
    deliveryClass: input.deliveryClass ?? 'ASYNC_AT_LEAST_ONCE',
    retentionClass: input.retentionClass ?? 'HOT',
    correlationIds: input.correlationIds,
    metadata: redactMetadata(input.metadata, redactionConfig),
  };
}

/**
 * Collect one observation event. Never throws to callers.
 */
export async function collectObservationEvent(
  prisma: PrismaClient,
  input: AIObservationEmitInput
): Promise<{ ok: true; event: AIObservationEvent; duplicate?: boolean } | { ok: false; reason: string }> {
  const started = Date.now();
  bumpQueueDepth(1);
  try {
    if (!isObservationEnabled()) {
      incrDropped();
      return { ok: false, reason: 'observation_disabled' };
    }
    const invalid = validateEmit(input);
    if (invalid) {
      incrDropped();
      return { ok: false, reason: invalid };
    }

    incrEmitted();
    const event = normalizeEvent(input);
    const result = await persistObservationEvent(prisma, event);
    recordCollectorLatency(Date.now() - started);
    return { ok: true, event, duplicate: result.duplicate };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Observation collect failed (non-fatal)', {
      operation: 'ai_observation_collect_error',
      error: { message: err.message },
      requestId: input.requestId,
      type: input.type,
    });
    incrDropped();
    recordCollectorLatency(Date.now() - started);
    return { ok: false, reason: err.message };
  } finally {
    bumpQueueDepth(-1);
  }
}

/** One transient retry for async path */
export async function collectObservationEventWithRetry(
  prisma: PrismaClient,
  input: AIObservationEmitInput
): Promise<{ ok: true; event: AIObservationEvent; duplicate?: boolean } | { ok: false; reason: string }> {
  const first = await collectObservationEvent(prisma, input);
  if (first.ok) return first;
  if (first.reason === 'observation_disabled' || first.reason.includes('required')) return first;
  await new Promise((r) => setTimeout(r, 25));
  return collectObservationEvent(prisma, input);
}

export function getObservationHealth() {
  return getObservationHealthSnapshot(redactionConfig.enabled);
}

/** @deprecated Phase 5 buffer API — retained for tests; events are durable rows now */
export function getBufferedEvents(_requestId?: string): AIObservationEvent[] {
  void _requestId;
  return [];
}

export function clearObservationBuffer(_requestId?: string): void {
  void _requestId;
  // no-op: Phase 5B uses immutable rows
}
