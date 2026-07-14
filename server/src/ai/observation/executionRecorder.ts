/**
 * Phase 5B — Concurrency-safe observation persistence.
 * Immutable AIObservationEvent rows + hub summary with state machine + optimistic version.
 */
import { createHash, randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AIObservationEvent,
  AIObservationExecutionState,
  AIObservationSurface,
  AIExecutionSurface,
} from 'vssyl-shared';
import { createAIExecutionRecord } from '../intelligence/executionRecordService';
import { timelineEventsFromObservation } from './timelineFromEvents';
import {
  applyObservationStateTransition,
  isTerminalObservationState,
  parseObservationState,
  stateHintFromEventType,
} from './executionStateMachine';
import {
  incrDuplicates,
  incrPersisted,
  incrPersistenceFailures,
  incrTimelineRebuildFailures,
} from './observationHealth';

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toExecutionSurface(surface: AIObservationSurface): AIExecutionSurface {
  if (surface === 'GOVERNANCE') return 'OTHER';
  return surface;
}

function extractLinked(events: AIObservationEvent[]) {
  const actionExecutionIds: string[] = [];
  const approvalIds: string[] = [];
  let conversationHistoryId: string | undefined;
  let pipelineDiagnosticId: string | undefined;
  let provider: string | undefined;
  let model: string | undefined;
  let latencyMs: number | undefined;
  let costUsd: number | undefined;
  let tokensUsed: number | undefined;
  let userQuery: string | undefined;
  let aiResponseSummary: string | undefined;
  let errorSummary: string | undefined;

  for (const e of events) {
    const m = e.metadata ?? {};
    if (typeof m.actionExecutionId === 'string') actionExecutionIds.push(m.actionExecutionId);
    if (typeof m.approvalId === 'string') approvalIds.push(m.approvalId);
    if (typeof m.conversationHistoryId === 'string') conversationHistoryId = m.conversationHistoryId;
    if (typeof m.pipelineDiagnosticId === 'string') pipelineDiagnosticId = m.pipelineDiagnosticId;
    if (typeof m.provider === 'string') provider = m.provider;
    if (typeof m.selectedProvider === 'string') provider = m.selectedProvider;
    if (typeof m.model === 'string') model = m.model;
    if (typeof m.selectedModel === 'string') model = m.selectedModel;
    if (typeof m.latencyMs === 'number') latencyMs = m.latencyMs;
    if (typeof m.costUsd === 'number') costUsd = m.costUsd;
    if (typeof m.tokensUsed === 'number') tokensUsed = m.tokensUsed;
    if (typeof m.userQuery === 'string') userQuery = m.userQuery;
    if (typeof m.aiResponseSummary === 'string') aiResponseSummary = m.aiResponseSummary;
    if (typeof m.errorSummary === 'string') errorSummary = m.errorSummary;
    if (e.type === 'ExecutionFailed' && typeof m.message === 'string') {
      errorSummary = m.message;
    }
  }

  return {
    actionExecutionIds: Array.from(new Set(actionExecutionIds)),
    approvalIds: Array.from(new Set(approvalIds)),
    conversationHistoryId,
    pipelineDiagnosticId,
    provider,
    model,
    latencyMs,
    costUsd,
    tokensUsed,
    userQuery,
    aiResponseSummary,
    errorSummary,
  };
}

function rowToObservationEvent(row: {
  eventId: string;
  eventVersion: number;
  requestId: string;
  executionRecordId: string | null;
  sequenceNumber: number;
  emittedAt: Date;
  observedAt: Date;
  eventType: string;
  surface: string;
  sourceComponent: string | null;
  conversationId: string | null;
  userId: string;
  businessId: string | null;
  deliveryClass: string;
  retentionClass: string;
  correlationJson: unknown;
  metadataJson: unknown;
}): AIObservationEvent {
  return {
    eventId: row.eventId,
    eventVersion: row.eventVersion,
    requestId: row.requestId,
    executionRecordId: row.executionRecordId ?? undefined,
    executionId: row.executionRecordId ?? undefined,
    sequenceNumber: row.sequenceNumber,
    emittedAt: row.emittedAt.toISOString(),
    observedAt: row.observedAt.toISOString(),
    timestamp: row.emittedAt.toISOString(),
    type: row.eventType as AIObservationEvent['type'],
    eventType: row.eventType as AIObservationEvent['type'],
    surface: row.surface as AIObservationSurface,
    sourceComponent: row.sourceComponent ?? undefined,
    conversationId: row.conversationId ?? undefined,
    userId: row.userId,
    businessId: row.businessId ?? undefined,
    deliveryClass: row.deliveryClass as AIObservationEvent['deliveryClass'],
    retentionClass: row.retentionClass as AIObservationEvent['retentionClass'],
    correlationIds:
      row.correlationJson && typeof row.correlationJson === 'object'
        ? (row.correlationJson as Record<string, string>)
        : undefined,
    metadata:
      row.metadataJson && typeof row.metadataJson === 'object'
        ? (row.metadataJson as Record<string, unknown>)
        : undefined,
  };
}

export async function loadEventsForRequest(
  prisma: PrismaClient,
  requestId: string
): Promise<AIObservationEvent[]> {
  const rows = await prisma.aIObservationEvent.findMany({
    where: { requestId },
    orderBy: [{ sequenceNumber: 'asc' }, { emittedAt: 'asc' }],
  });
  return rows.map(rowToObservationEvent);
}

export async function rebuildTimelineForExecution(
  prisma: PrismaClient,
  executionRecordId: string
): Promise<void> {
  try {
    const rows = await prisma.aIObservationEvent.findMany({
      where: { executionRecordId },
      orderBy: [{ sequenceNumber: 'asc' }, { emittedAt: 'asc' }],
    });
    const events = rows.map(rowToObservationEvent);
    await prisma.aIExecutionRecord.update({
      where: { id: executionRecordId },
      data: {
        timelineJson: asJson(timelineEventsFromObservation(events)),
        observationEventsJson: asJson(events),
      },
    });
  } catch {
    incrTimelineRebuildFailures();
  }
}

/**
 * Persist one event as an immutable row; update hub summary safely.
 * Duplicate eventId → idempotent no-op (counts as duplicate).
 */
export async function persistObservationEvent(
  prisma: PrismaClient,
  event: AIObservationEvent
): Promise<{ executionRecordId: string | null; duplicate: boolean }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Ensure hub exists
      let hub = await tx.aIExecutionRecord.findFirst({
        where: { requestId: event.requestId },
        orderBy: { createdAt: 'desc' },
      });

      if (!hub) {
        const shouldCreate =
          event.type === 'ExecutionStarted' ||
          event.type === 'ResponseReturned' ||
          event.type === 'ExecutionCompleted' ||
          event.type === 'ExecutionFailed' ||
          event.type === 'ExecutionCancelled' ||
          event.type === 'ContextBuilt' ||
          event.type === 'ProviderCompleted' ||
          event.type === 'ProviderCallCompleted';
        if (!shouldCreate) {
          return { executionRecordId: null, duplicate: false };
        }

        const hint = stateHintFromEventType(event.type) ?? 'STARTED';
        const isTerminal =
          event.type === 'ResponseReturned' ||
          event.type === 'ExecutionCompleted' ||
          event.type === 'ExecutionFailed' ||
          event.type === 'ExecutionCancelled';

        const snap = await createAIExecutionRecord(tx as unknown as PrismaClient, {
          userId: event.userId,
          businessId: event.businessId,
          surface: toExecutionSurface(event.surface),
          requestId: event.requestId,
          conversationId: event.conversationId,
          userQuery: typeof event.metadata?.userQuery === 'string' ? event.metadata.userQuery : undefined,
          completedAt: isTerminal ? new Date(event.emittedAt) : null,
          timeline: timelineEventsFromObservation([event]),
        });

        await tx.aIExecutionRecord.update({
          where: { id: snap.id },
          data: {
            observationState: hint,
            observationEventsJson: asJson([event]),
          },
        });
        hub = await tx.aIExecutionRecord.findUniqueOrThrow({ where: { id: snap.id } });
      }

      try {
        await tx.aIObservationEvent.create({
          data: {
            id: randomUUID(),
            eventId: event.eventId,
            executionRecordId: hub.id,
            requestId: event.requestId,
            eventType: event.type,
            eventVersion: event.eventVersion,
            sequenceNumber: event.sequenceNumber,
            emittedAt: new Date(event.emittedAt),
            observedAt: event.observedAt ? new Date(event.observedAt) : new Date(),
            surface: event.surface,
            sourceComponent: event.sourceComponent ?? null,
            conversationId: event.conversationId ?? null,
            userId: event.userId,
            businessId: event.businessId ?? null,
            deliveryClass: event.deliveryClass ?? 'ASYNC_AT_LEAST_ONCE',
            retentionClass: event.retentionClass ?? 'HOT',
            correlationJson: asJson(event.correlationIds ?? {}),
            metadataJson: asJson(event.metadata ?? {}),
          },
        });
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code: unknown }).code)
            : '';
        if (code === 'P2002') {
          incrDuplicates();
          return { executionRecordId: hub.id, duplicate: true };
        }
        throw err;
      }

      const allRows = await tx.aIObservationEvent.findMany({
        where: { requestId: event.requestId },
        orderBy: [{ sequenceNumber: 'asc' }, { emittedAt: 'asc' }],
      });
      const allEvents = allRows.map(rowToObservationEvent);
      const extracted = extractLinked(allEvents);

      const currentState = parseObservationState(hub.observationState);
      const hint = stateHintFromEventType(event.type);
      let nextState: AIObservationExecutionState = currentState;
      let applied = false;
      if (hint) {
        const result = applyObservationStateTransition(currentState, hint);
        nextState = result.state;
        applied = result.applied;
        // Terminal response types force COMPLETED when allowed
        if (
          (event.type === 'ResponseReturned' || event.type === 'ExecutionCompleted') &&
          !isTerminalObservationState(currentState)
        ) {
          const t = applyObservationStateTransition(
            nextState === currentState && !applied ? currentState : nextState,
            'COMPLETED'
          );
          // Prefer COMPLETED via RESPONDING path
          if (!t.applied && canReachCompleted(currentState)) {
            const viaResponding = applyObservationStateTransition(currentState, 'RESPONDING');
            const done = applyObservationStateTransition(viaResponding.state, 'COMPLETED');
            nextState = done.state;
            applied = done.applied || viaResponding.applied;
          } else {
            nextState = t.state;
            applied = t.applied || applied;
          }
        }
      }

      const terminalNow = isTerminalObservationState(nextState);
      const linked =
        hub.linkedArtifactsJson && typeof hub.linkedArtifactsJson === 'object'
          ? { ...(hub.linkedArtifactsJson as Record<string, unknown>) }
          : {};

      await tx.aIExecutionRecord.update({
        where: { id: hub.id },
        data: {
          observationState: nextState,
          observationVersion: { increment: 1 },
          conversationHistoryId: extracted.conversationHistoryId ?? hub.conversationHistoryId,
          pipelineDiagnosticId: extracted.pipelineDiagnosticId ?? hub.pipelineDiagnosticId,
          conversationId: event.conversationId ?? hub.conversationId,
          userQuery: extracted.userQuery ?? hub.userQuery,
          aiResponseSummary: extracted.aiResponseSummary ?? hub.aiResponseSummary,
          provider: extracted.provider ?? hub.provider,
          model: extracted.model ?? hub.model,
          errorSummary: extracted.errorSummary ?? hub.errorSummary,
          timelineJson: asJson(timelineEventsFromObservation(allEvents)),
          observationEventsJson: asJson(allEvents),
          linkedArtifactsJson: asJson({
            ...linked,
            requestId: event.requestId,
            conversationHistoryId:
              extracted.conversationHistoryId ?? linked.conversationHistoryId,
            pipelineDiagnosticId:
              extracted.pipelineDiagnosticId ?? linked.pipelineDiagnosticId,
            actionExecutionIds: extracted.actionExecutionIds.length
              ? extracted.actionExecutionIds
              : linked.actionExecutionIds,
            approvalIds: extracted.approvalIds.length
              ? extracted.approvalIds
              : linked.approvalIds,
          }),
          usageJson: asJson({
            latencyMs: extracted.latencyMs,
            costUsd: extracted.costUsd,
            tokensUsed: extracted.tokensUsed,
            provider: extracted.provider ?? hub.provider,
            model: extracted.model ?? hub.model,
          }),
          completedAt: terminalNow
            ? hub.completedAt ?? new Date(event.emittedAt)
            : hub.completedAt,
        },
      });

      incrPersisted();
      return { executionRecordId: hub.id, duplicate: false };
    });
  } catch (error: unknown) {
    incrPersistenceFailures();
    throw error;
  }
}

function canReachCompleted(state: AIObservationExecutionState): boolean {
  return !isTerminalObservationState(state);
}

/** Deterministic event id helper for callers */
export function buildDeterministicEventId(
  requestId: string,
  type: string,
  idempotencyKey?: string
): string {
  const material = `${requestId}|${type}|${idempotencyKey ?? 'default'}`;
  return `obs_${createHash('sha256').update(material).digest('hex').slice(0, 32)}`;
}

export { extractLinked };
