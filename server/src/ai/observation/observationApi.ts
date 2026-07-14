/**
 * Phase 5B — Read-only observation queries for Operations Center.
 */
import type { PrismaClient } from '@prisma/client';
import type { AIObservationEvent } from 'vssyl-shared';
import { AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL, AI_OBSERVATION_RETENTION_POLICY } from 'vssyl-shared';
import { getObservationHealth } from './observationCollector';
import { timelineEventsFromObservation } from './timelineFromEvents';
import { describeRetentionPolicy } from './retentionPolicy';
import { loadEventsForRequest, rebuildTimelineForExecution } from './executionRecorder';
import {
  estimateObservationRetentionBacklog,
  purgeObservationRetention,
} from './observationRetentionService';
import { parseObservationState, isTerminalObservationState } from './executionStateMachine';

export async function getObservationEvents(
  prisma: PrismaClient,
  executionRecordId: string
): Promise<AIObservationEvent[]> {
  const rows = await prisma.aIObservationEvent.findMany({
    where: { executionRecordId },
    orderBy: [{ sequenceNumber: 'asc' }, { emittedAt: 'asc' }],
  });
  if (rows.length > 0) {
    return rows.map((row) => ({
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
      surface: row.surface as AIObservationEvent['surface'],
      sourceComponent: row.sourceComponent ?? undefined,
      conversationId: row.conversationId ?? undefined,
      userId: row.userId,
      businessId: row.businessId ?? undefined,
      metadata:
        row.metadataJson && typeof row.metadataJson === 'object'
          ? (row.metadataJson as Record<string, unknown>)
          : undefined,
    }));
  }
  // Fallback to Phase 5 JSON cache
  const hub = await prisma.aIExecutionRecord.findUnique({
    where: { id: executionRecordId },
    select: { observationEventsJson: true },
  });
  if (!hub || !Array.isArray(hub.observationEventsJson)) return [];
  return hub.observationEventsJson as unknown as AIObservationEvent[];
}

export async function getObservationTimeline(prisma: PrismaClient, executionRecordId: string) {
  const events = await getObservationEvents(prisma, executionRecordId);
  if (events.length > 0) return timelineEventsFromObservation(events);
  const row = await prisma.aIExecutionRecord.findUnique({
    where: { id: executionRecordId },
    select: { timelineJson: true },
  });
  return Array.isArray(row?.timelineJson) ? row!.timelineJson : [];
}

export async function getObservationLinkedArtifacts(
  prisma: PrismaClient,
  executionRecordId: string
): Promise<Record<string, unknown>> {
  const row = await prisma.aIExecutionRecord.findUnique({
    where: { id: executionRecordId },
    select: {
      linkedArtifactsJson: true,
      conversationHistoryId: true,
      pipelineDiagnosticId: true,
      conversationId: true,
      requestId: true,
      observationState: true,
      completedAt: true,
    },
  });
  if (!row) return {};
  const linked =
    row.linkedArtifactsJson && typeof row.linkedArtifactsJson === 'object'
      ? (row.linkedArtifactsJson as Record<string, unknown>)
      : {};
  return {
    ...linked,
    conversationHistoryId: row.conversationHistoryId ?? linked.conversationHistoryId,
    pipelineDiagnosticId: row.pipelineDiagnosticId ?? linked.pipelineDiagnosticId,
    conversationId: row.conversationId ?? linked.conversationId,
    requestId: row.requestId ?? linked.requestId,
    observationState: row.observationState,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function listObservationFailures(
  prisma: PrismaClient,
  options: { businessId?: string; limit?: number } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const rows = await prisma.aIExecutionRecord.findMany({
    where: {
      OR: [{ errorSummary: { not: null } }, { observationState: 'FAILED' }],
      ...(options.businessId ? { businessId: options.businessId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      requestId: true,
      userId: true,
      businessId: true,
      surface: true,
      errorSummary: true,
      provider: true,
      observationState: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return rows.map((row) => ({
    executionRecordId: row.id,
    requestId: row.requestId,
    userId: row.userId,
    businessId: row.businessId,
    surface: row.surface,
    errorSummary: row.errorSummary,
    provider: row.provider,
    observationState: row.observationState,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }));
}

export async function getObservationCompleteness(
  prisma: PrismaClient,
  executionRecordId: string
) {
  const row = await prisma.aIExecutionRecord.findUnique({
    where: { id: executionRecordId },
    select: { observationState: true, requestId: true, completedAt: true },
  });
  if (!row) return null;
  const events = await getObservationEvents(prisma, executionRecordId);
  const types = new Set(events.map((e) => e.type));
  const state = parseObservationState(row.observationState);
  const hasTerminal =
    types.has('ResponseReturned') ||
    types.has('ExecutionCompleted') ||
    types.has('ExecutionFailed') ||
    types.has('ExecutionCancelled') ||
    isTerminalObservationState(state);
  return {
    observationState: state,
    hasTerminalEvent: hasTerminal,
    missingTerminalWarning: !hasTerminal,
    eventCount: events.length,
    deliveryGuarantee: AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL,
    eventTypes: Array.from(types),
  };
}

export function getObservationHealthPayload() {
  const runtime = getObservationHealth();
  return {
    ...runtime,
    retention: AI_OBSERVATION_RETENTION_POLICY,
    retentionSummary: describeRetentionPolicy(),
    deliveryGuarantee: AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL,
    expectedOverheadMs:
      'durable terminals ≤250ms bounded; mid-events async fire-and-forget with 1 retry',
  };
}

export {
  estimateObservationRetentionBacklog,
  purgeObservationRetention,
  loadEventsForRequest,
  rebuildTimelineForExecution,
};
