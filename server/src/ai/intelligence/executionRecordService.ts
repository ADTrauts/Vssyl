/**
 * Phase 3 — AIExecutionRecord builders & persistence (observational).
 * Does not call Twin, providers, or governed tools.
 */
import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AIExecutionLinkedArtifacts,
  AIExecutionRecordSnapshot,
  AIExecutionSurface,
  AIExecutionTimelineEvent,
  AIExecutionUsageSnapshot,
} from 'vssyl-shared';
import { buildSimpleTurnTimeline } from './executionTimeline';

export interface CreateExecutionRecordInput {
  userId: string;
  businessId?: string | null;
  surface: AIExecutionSurface;
  conversationHistoryId?: string | null;
  pipelineDiagnosticId?: string | null;
  conversationId?: string | null;
  requestId?: string | null;
  userQuery?: string | null;
  aiResponseSummary?: string | null;
  provider?: string | null;
  model?: string | null;
  routingSummary?: Record<string, unknown> | null;
  linked?: AIExecutionLinkedArtifacts;
  timeline?: AIExecutionTimelineEvent[];
  usage?: AIExecutionUsageSnapshot | null;
  errorSummary?: string | null;
  diagnosticsSummary?: Record<string, unknown> | null;
  learningSignals?: Record<string, unknown> | null;
  completedAt?: Date | null;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function buildExecutionRecordSnapshot(
  input: CreateExecutionRecordInput,
  id: string = randomUUID(),
  createdAt: Date = new Date()
): AIExecutionRecordSnapshot {
  const linked: AIExecutionLinkedArtifacts = {
    conversationHistoryId: input.conversationHistoryId ?? undefined,
    pipelineDiagnosticId: input.pipelineDiagnosticId ?? undefined,
    conversationId: input.conversationId ?? undefined,
    requestId: input.requestId ?? undefined,
    ...input.linked,
  };

  const timeline =
    input.timeline ??
    buildSimpleTurnTimeline({
      startedAt: createdAt.toISOString(),
      completedAt: (input.completedAt ?? createdAt)?.toISOString() ?? createdAt.toISOString(),
      provider: input.provider ?? undefined,
      model: input.model ?? undefined,
    });

  const completedAt =
    input.completedAt === undefined
      ? createdAt
      : input.completedAt;

  return {
    id,
    userId: input.userId,
    businessId: input.businessId ?? undefined,
    surface: input.surface,
    userQuery: input.userQuery ?? undefined,
    aiResponseSummary: input.aiResponseSummary ?? undefined,
    provider: input.provider ?? undefined,
    model: input.model ?? undefined,
    routingSummary: input.routingSummary ?? undefined,
    linked,
    timeline,
    usage: input.usage ?? undefined,
    errorSummary: input.errorSummary ?? undefined,
    diagnosticsSummary: input.diagnosticsSummary ?? undefined,
    learningSignalsSummary: input.learningSignals ?? undefined,
    createdAt: createdAt.toISOString(),
    completedAt: completedAt ? completedAt.toISOString() : undefined,
  };
}

/**
 * Persist an observational execution record.
 * Callers must not use this to replace AIActionExecution.
 */
export async function createAIExecutionRecord(
  prisma: PrismaClient,
  input: CreateExecutionRecordInput
): Promise<AIExecutionRecordSnapshot> {
  const snapshot = buildExecutionRecordSnapshot(input);
  const linked: AIExecutionLinkedArtifacts = {
    ...snapshot.linked,
    conversationHistoryId: input.conversationHistoryId ?? snapshot.linked.conversationHistoryId,
    pipelineDiagnosticId: input.pipelineDiagnosticId ?? snapshot.linked.pipelineDiagnosticId,
  };

  await prisma.aIExecutionRecord.create({
    data: {
      id: snapshot.id,
      userId: input.userId,
      businessId: input.businessId ?? null,
      surface: input.surface,
      conversationHistoryId: input.conversationHistoryId ?? null,
      pipelineDiagnosticId: input.pipelineDiagnosticId ?? null,
      conversationId: input.conversationId ?? null,
      requestId: input.requestId ?? null,
      userQuery: input.userQuery ?? null,
      aiResponseSummary: input.aiResponseSummary ?? null,
      provider: input.provider ?? null,
      model: input.model ?? null,
      routingSummaryJson: input.routingSummary ? asJson(input.routingSummary) : undefined,
      linkedArtifactsJson: asJson(linked),
      timelineJson: asJson(snapshot.timeline),
      usageJson: input.usage ? asJson(input.usage) : undefined,
      errorSummary: input.errorSummary ?? null,
      diagnosticsSummaryJson: input.diagnosticsSummary ? asJson(input.diagnosticsSummary) : undefined,
      learningSignalsJson: input.learningSignals ? asJson(input.learningSignals) : undefined,
      // null = in-flight (Phase 5 observation); undefined defaults to now for legacy callers
      completedAt: input.completedAt !== undefined ? input.completedAt : new Date(),
    },
  });

  return { ...snapshot, linked };
}

export async function getAIExecutionRecord(
  prisma: PrismaClient,
  id: string
): Promise<AIExecutionRecordSnapshot | null> {
  const row = await prisma.aIExecutionRecord.findUnique({ where: { id } });
  if (!row) return null;
  return rowToSnapshot(row);
}

export function rowToSnapshot(row: {
  id: string;
  userId: string;
  businessId: string | null;
  surface: string;
  conversationHistoryId: string | null;
  pipelineDiagnosticId: string | null;
  conversationId: string | null;
  requestId: string | null;
  userQuery: string | null;
  aiResponseSummary: string | null;
  provider: string | null;
  model: string | null;
  routingSummaryJson: unknown;
  linkedArtifactsJson: unknown;
  timelineJson: unknown;
  usageJson: unknown;
  errorSummary: string | null;
  diagnosticsSummaryJson: unknown;
  learningSignalsJson: unknown;
  createdAt: Date;
  completedAt: Date | null;
}): AIExecutionRecordSnapshot {
  const linkedFromJson =
    row.linkedArtifactsJson && typeof row.linkedArtifactsJson === 'object'
      ? (row.linkedArtifactsJson as AIExecutionLinkedArtifacts)
      : {};
  return {
    id: row.id,
    userId: row.userId,
    businessId: row.businessId ?? undefined,
    surface: row.surface as AIExecutionSurface,
    userQuery: row.userQuery ?? undefined,
    aiResponseSummary: row.aiResponseSummary ?? undefined,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    routingSummary:
      row.routingSummaryJson && typeof row.routingSummaryJson === 'object'
        ? (row.routingSummaryJson as Record<string, unknown>)
        : undefined,
    linked: {
      ...linkedFromJson,
      conversationHistoryId: row.conversationHistoryId ?? linkedFromJson.conversationHistoryId,
      pipelineDiagnosticId: row.pipelineDiagnosticId ?? linkedFromJson.pipelineDiagnosticId,
      conversationId: row.conversationId ?? linkedFromJson.conversationId,
      requestId: row.requestId ?? linkedFromJson.requestId,
    },
    timeline: Array.isArray(row.timelineJson)
      ? (row.timelineJson as AIExecutionTimelineEvent[])
      : [],
    usage:
      row.usageJson && typeof row.usageJson === 'object'
        ? (row.usageJson as AIExecutionUsageSnapshot)
        : undefined,
    errorSummary: row.errorSummary ?? undefined,
    diagnosticsSummary:
      row.diagnosticsSummaryJson && typeof row.diagnosticsSummaryJson === 'object'
        ? (row.diagnosticsSummaryJson as Record<string, unknown>)
        : undefined,
    learningSignalsSummary:
      row.learningSignalsJson && typeof row.learningSignalsJson === 'object'
        ? (row.learningSignalsJson as Record<string, unknown>)
        : undefined,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  };
}
