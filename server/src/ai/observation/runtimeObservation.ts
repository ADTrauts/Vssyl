/**
 * Phase 5B — Twin-facing observation facade.
 * Emit-only. Observation failure never throws to Twin.
 */
import { prisma } from '../../lib/prisma';
import type { AIObservationEmitInput, AIObservationEventType } from 'vssyl-shared';
import {
  collectObservationEvent,
  collectObservationEventWithRetry,
  clearObservationBuffer,
  getObservationHealth,
  isObservationEnabled,
} from './observationCollector';
import { incrPersistenceTimeouts, recordFlushLatency } from './observationHealth';

const DURABLE_TIMEOUT_MS = Number(process.env.AI_OBSERVATION_DURABLE_TIMEOUT_MS ?? 250);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fireAndForget(input: AIObservationEmitInput): void {
  if (!isObservationEnabled()) return;
  void collectObservationEventWithRetry(prisma, {
    ...input,
    deliveryClass: input.deliveryClass ?? 'ASYNC_AT_LEAST_ONCE',
  }).catch(() => {
    /* logged in collector */
  });
}

/** Bounded durable write — never throws; may time out and continue async. */
export async function emitDurableObservation(
  input: AIObservationEmitInput,
  timeoutMs: number = DURABLE_TIMEOUT_MS
): Promise<void> {
  if (!isObservationEnabled()) return;
  const started = Date.now();
  const payload: AIObservationEmitInput = {
    ...input,
    deliveryClass: 'DURABLE_BOUNDED',
  };
  try {
    const work = collectObservationEvent(prisma, payload);
    const result = await Promise.race([
      work.then((r) => ({ kind: 'done' as const, r })),
      sleep(timeoutMs).then(() => ({ kind: 'timeout' as const })),
    ]);
    if (result.kind === 'timeout') {
      incrPersistenceTimeouts();
      // let work continue in background
      void work.catch(() => undefined);
    }
  } catch {
    /* never fail Twin */
  } finally {
    recordFlushLatency(Date.now() - started);
  }
}

export function emitTwinObservation(input: AIObservationEmitInput): void {
  try {
    fireAndForget(input);
  } catch {
    /* never fail Twin */
  }
}

export function emitTwinTurnStarted(params: {
  requestId: string;
  userId: string;
  conversationId?: string;
  businessId?: string | null;
  userQuery?: string;
}): void {
  void emitDurableObservation({
    requestId: params.requestId,
    userId: params.userId,
    conversationId: params.conversationId,
    businessId: params.businessId,
    type: 'ExecutionStarted',
    surface: 'TWIN',
    sourceComponent: 'DigitalLifeTwinCore',
    eventId: undefined,
    idempotencyKey: 'ExecutionStarted',
    metadata: params.userQuery ? { userQuery: params.userQuery.slice(0, 500) } : undefined,
  });
}

export function emitTwinTurnCompleted(params: {
  requestId: string;
  userId: string;
  conversationId?: string;
  businessId?: string | null;
  userQuery?: string;
  aiResponseSummary?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  conversationHistoryId?: string;
  pipelineDiagnosticId?: string;
  pendingApprovals?: Array<{ approvalId?: string; tool?: string; executionId?: string }>;
  actionExecutionIds?: string[];
  partial?: boolean;
}): void {
  const base = {
    requestId: params.requestId,
    userId: params.userId,
    conversationId: params.conversationId,
    businessId: params.businessId,
    surface: 'TWIN' as const,
    sourceComponent: 'DigitalLifeTwinCore',
  };

  emitTwinObservation({
    ...base,
    type: 'ResponseStarted',
    idempotencyKey: 'ResponseStarted',
  });

  if (params.pendingApprovals?.length) {
    for (const a of params.pendingApprovals) {
      emitTwinObservation({
        ...base,
        type: 'ApprovalRequested',
        idempotencyKey: `ApprovalRequested:${a.approvalId ?? a.tool ?? 'unknown'}`,
        metadata: { approvalId: a.approvalId, tool: a.tool, actionExecutionId: a.executionId },
      });
      if (a.tool) {
        emitTwinObservation({
          ...base,
          type: 'ToolProposed',
          idempotencyKey: `ToolProposed:${a.approvalId ?? a.tool}`,
          metadata: { tools: [a.tool], approvalId: a.approvalId },
        });
      }
    }
  }

  const meta: Record<string, unknown> = {
    userQuery: params.userQuery?.slice(0, 500),
    aiResponseSummary: params.aiResponseSummary?.slice(0, 500),
    provider: params.provider,
    model: params.model,
    latencyMs: params.latencyMs,
    conversationHistoryId: params.conversationHistoryId,
    pipelineDiagnosticId: params.pipelineDiagnosticId,
    partial: params.partial,
  };
  if (params.actionExecutionIds?.length) {
    meta.actionExecutionIds = params.actionExecutionIds;
  }

  void emitDurableObservation({
    ...base,
    type: 'ResponseReturned',
    idempotencyKey: 'ResponseReturned',
    metadata: meta,
  });

  void emitDurableObservation({
    ...base,
    type: params.partial ? 'ExecutionCompleted' : 'ExecutionCompleted',
    idempotencyKey: 'ExecutionCompleted',
    metadata: meta,
  });
}

export function emitTwinTurnFailed(params: {
  requestId: string;
  userId: string;
  conversationId?: string;
  businessId?: string | null;
  message: string;
  latencyMs?: number;
}): void {
  void emitDurableObservation({
    requestId: params.requestId,
    userId: params.userId,
    conversationId: params.conversationId,
    businessId: params.businessId,
    type: 'ExecutionFailed',
    surface: 'TWIN',
    sourceComponent: 'DigitalLifeTwinCore',
    idempotencyKey: 'ExecutionFailed',
    metadata: {
      message: params.message.slice(0, 500),
      errorSummary: params.message.slice(0, 500),
      latencyMs: params.latencyMs,
      failureKind: 'runtime',
    },
  });
}

export function emitObservationFailureEvent(params: {
  requestId: string;
  userId: string;
  conversationId?: string;
  businessId?: string | null;
  failureKind:
    | 'provider'
    | 'timeout'
    | 'tool'
    | 'approval'
    | 'authorization'
    | 'grounding'
    | 'retrieval'
    | 'context';
  message: string;
  type?: AIObservationEventType;
  sourceComponent?: string;
}): void {
  emitTwinObservation({
    requestId: params.requestId,
    userId: params.userId,
    conversationId: params.conversationId,
    businessId: params.businessId,
    type: params.type ?? 'ExecutionFailed',
    surface: 'TWIN',
    sourceComponent: params.sourceComponent ?? 'observation',
    idempotencyKey: `${params.type ?? 'ExecutionFailed'}:${params.failureKind}:${params.message.slice(0, 40)}`,
    metadata: {
      failureKind: params.failureKind,
      message: params.message.slice(0, 500),
      errorSummary: params.message.slice(0, 500),
    },
  });
}

/** Governance / approval / provider helpers */
export function emitGovernedObservation(input: AIObservationEmitInput): void {
  emitTwinObservation({
    ...input,
    surface: input.surface ?? 'GOVERNANCE',
    sourceComponent: input.sourceComponent ?? 'governedToolExecutor',
  });
}

export { getObservationHealth, isObservationEnabled, clearObservationBuffer };
