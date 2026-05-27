/**
 * Orchestration snapshot builder and emission (Phase B.5).
 * Metadata only — no provider payloads or prompt text.
 */

import { randomUUID } from 'crypto';
import type {
  AIOrchestrationSnapshot,
  AIOrchestrationSnapshotSelectedProvider,
  AIOrchestrationSnapshotSkippedProvider,
  OrchestrationSnapshotPassKind,
  OrchestrationSnapshotTraceTag,
} from '../../../../shared/src/types/ai-orchestration-snapshot';
import type { ProviderSelectionDiagnostic } from '../../../../shared/src/types/ai-context-provider-contract';
import type { PipelineEnforcementSettings } from '../types/pipelineDiagnostics';
import type { ProviderFetchAttempt } from './contextDensityReport';
import type { ContextSelectionBudget } from './contextProviderSelection';
import { logger } from '../../lib/logger';
import { PIPELINE_SOURCE_PROVIDER_MAP } from './pipelineSourceProviderMap';

export const MAX_ORCHESTRATION_SNAPSHOTS_PER_REQUEST = 2;

/** Keep in sync with `AI_ORCHESTRATION_SNAPSHOT_SCHEMA_VERSION` in shared types. */
export const AI_ORCHESTRATION_SNAPSHOT_SCHEMA_VERSION = 1 as const;

/**
 * Central orchestrator behavior label for snapshot replay compatibility.
 * Bump when provider selection, freshness, ranking, or invalidation semantics change materially.
 */
export const ORCHESTRATOR_VERSION = 'phase-b5-v1';

/** Pass-level latency threshold for high_latency trace tag (metadata only). */
export const HIGH_LATENCY_THRESHOLD_MS = 1800;

const FALLBACK_PROVIDER_NAMES = new Set(
  Object.values(PIPELINE_SOURCE_PROVIDER_MAP).flatMap((refs) =>
    refs.flatMap((ref) => (ref.fallbackProviderName ? [ref.fallbackProviderName] : []))
  )
);

const QUERY_PREVIEW_MAX_LEN = 120;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const API_KEY_PATTERN = /\bsk-[A-Za-z0-9]{16,}\b/g;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

export interface OrchestrationSnapshotBuildInput {
  contextGenerationId: string;
  requestId?: string;
  conversationId?: string;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  query: string;
  detectedIntents: string[];
  passKind: OrchestrationSnapshotPassKind;
  requiredSourceIds: string[];
  optionalSourceIds: string[];
  groundingSourceToProvider: Array<{
    sourceId: string;
    providerId: string;
    moduleId: string;
    providerName: string;
  }>;
  providerSelectionDiagnostics: ProviderSelectionDiagnostic[];
  providerFetchAudit: ProviderFetchAttempt[];
  requiredSourceFailures: string[];
  staleContextWarnings: string[];
  groundingFailure: boolean;
  enforcement: PipelineEnforcementSettings;
  budget?: ContextSelectionBudget;
  timing: {
    startedAt: string;
    completedAt: string;
  };
  /** Admin dry-run / Test Lab — adds admin_debug tag when true. */
  snapshotForce?: boolean;
}

export interface DeriveTraceTagsInput {
  groundingFailure: boolean;
  requiredSourceFailures: string[];
  staleContextWarnings: string[];
  passKind: OrchestrationSnapshotPassKind;
  snapshotForce?: boolean;
  totalLatencyMs: number;
  selectedProviders: AIOrchestrationSnapshotSelectedProvider[];
  skippedProviders: AIOrchestrationSnapshotSkippedProvider[];
}

function dedupeTraceTags(tags: OrchestrationSnapshotTraceTag[]): OrchestrationSnapshotTraceTag[] {
  return [...new Set(tags)];
}

/**
 * Deterministic trace tags from orchestration metadata only (no provider payloads).
 */
export function deriveOrchestrationTraceTags(
  input: DeriveTraceTagsInput
): OrchestrationSnapshotTraceTag[] {
  const tags: OrchestrationSnapshotTraceTag[] = [];

  if (input.groundingFailure) tags.push('grounding_failure');
  if (input.requiredSourceFailures.length > 0) tags.push('required_source_failure');
  if (input.staleContextWarnings.length > 0) tags.push('stale_context');
  if (input.snapshotForce) tags.push('admin_debug');
  if (input.passKind === 'grounding_module_sources') tags.push('grounding_boost');
  if (input.totalLatencyMs >= HIGH_LATENCY_THRESHOLD_MS) tags.push('high_latency');

  const usedFallback = input.selectedProviders.some(
    (p) => p.providerName != null && FALLBACK_PROVIDER_NAMES.has(p.providerName)
  );
  if (usedFallback) tags.push('fallback_provider');

  return dedupeTraceTags(tags);
}

function appendSampledSnapshotTag(
  snapshot: AIOrchestrationSnapshot,
  options?: { force?: boolean }
): AIOrchestrationSnapshot {
  if (options?.force) return snapshot;
  if (process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED !== 'true') return snapshot;
  if (process.env.NODE_ENV === 'development') return snapshot;

  const tags = dedupeTraceTags([...(snapshot.traceTags ?? []), 'sampled_snapshot']);
  return { ...snapshot, traceTags: tags };
}

function parseSampleRate(): number {
  const raw = process.env.AI_ORCHESTRATION_SNAPSHOT_SAMPLE_RATE;
  if (raw == null || raw.trim() === '') return 0.02;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return 0.02;
  return Math.min(1, Math.max(0, n));
}

export function shouldEmitOrchestrationSnapshot(options?: {
  force?: boolean;
}): boolean {
  if (options?.force) return true;
  if (process.env.AI_ORCHESTRATION_SNAPSHOT_ENABLED !== 'true') return false;
  if (process.env.NODE_ENV === 'development') return true;
  const rate = parseSampleRate();
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

export function redactQueryPreview(query: string): string {
  let text = (query || '').replace(/\s+/g, ' ').trim();
  text = text.replace(EMAIL_PATTERN, '[email]');
  text = text.replace(PHONE_PATTERN, '[phone]');
  text = text.replace(BEARER_PATTERN, '[token]');
  text = text.replace(API_KEY_PATTERN, '[api_key]');
  text = text.replace(JWT_PATTERN, '[jwt]');
  if (text.length > QUERY_PREVIEW_MAX_LEN) {
    return `${text.slice(0, QUERY_PREVIEW_MAX_LEN - 1)}…`;
  }
  return text;
}

function auditByProviderId(
  audit: ProviderFetchAttempt[]
): Map<string, ProviderFetchAttempt> {
  const map = new Map<string, ProviderFetchAttempt>();
  for (const row of audit) {
    const id =
      row.providerId ??
      (row.moduleId && row.providerName ? `${row.moduleId}.${row.providerName}` : undefined);
    if (id) map.set(id, row);
  }
  return map;
}

function buildSelectedProviders(
  diagnostics: ProviderSelectionDiagnostic[],
  auditMap: Map<string, ProviderFetchAttempt>
): AIOrchestrationSnapshotSelectedProvider[] {
  const selected: AIOrchestrationSnapshotSelectedProvider[] = [];
  for (const d of diagnostics) {
    if (d.phase !== 'selected') continue;
    const audit = auditMap.get(d.providerId);
    selected.push({
      providerId: d.providerId,
      moduleId: d.moduleId,
      providerName: d.providerName,
      requiredForGrounding: d.requiredForGrounding,
      retrievalCost: d.retrievalCost,
      latencyMs: d.latencyMs ?? audit?.latencyMs,
      resultStatus:
        d.resultStatus ??
        (audit?.status === 'failed'
          ? 'error'
          : audit?.resultStatus === 'miss'
            ? 'miss'
            : audit?.status === 'skipped'
              ? 'skipped'
              : audit?.status === 'succeeded'
                ? 'hit'
                : undefined),
      freshness: audit?.freshness,
    });
  }
  return selected;
}

function buildSkippedProviders(
  diagnostics: ProviderSelectionDiagnostic[]
): AIOrchestrationSnapshotSkippedProvider[] {
  const skipped: AIOrchestrationSnapshotSkippedProvider[] = [];
  for (const d of diagnostics) {
    if (d.phase !== 'skipped' && d.phase !== 'considered') continue;
    if (d.phase === 'considered') continue;
    skipped.push({
      providerId: d.providerId,
      moduleId: d.moduleId,
      providerName: d.providerName,
      reason: typeof d.reason === 'string' ? d.reason : 'unknown',
      requiredForGrounding: d.requiredForGrounding,
    });
  }
  return skipped;
}

export function buildOrchestrationSnapshot(
  input: OrchestrationSnapshotBuildInput
): AIOrchestrationSnapshot {
  const auditMap = auditByProviderId(input.providerFetchAudit);
  const selectedProviders = buildSelectedProviders(
    input.providerSelectionDiagnostics,
    auditMap
  );
  const skippedProviders = buildSkippedProviders(input.providerSelectionDiagnostics);

  const startedMs = Date.parse(input.timing.startedAt);
  const completedMs = Date.parse(input.timing.completedAt);
  const totalLatencyMs =
    Number.isFinite(startedMs) && Number.isFinite(completedMs)
      ? Math.max(0, completedMs - startedMs)
      : 0;

  const uniqueProviderIds = new Set(
    input.providerSelectionDiagnostics.map((d) => d.providerId)
  );

  const traceTags = deriveOrchestrationTraceTags({
    groundingFailure: input.groundingFailure,
    requiredSourceFailures: input.requiredSourceFailures,
    staleContextWarnings: input.staleContextWarnings,
    passKind: input.passKind,
    snapshotForce: input.snapshotForce,
    totalLatencyMs,
    selectedProviders,
    skippedProviders,
  });

  return {
    snapshotId: randomUUID(),
    schemaVersion: AI_ORCHESTRATION_SNAPSHOT_SCHEMA_VERSION,
    orchestratorVersion: ORCHESTRATOR_VERSION,
    contextGenerationId: input.contextGenerationId,
    requestId: input.requestId,
    conversationId: input.conversationId,
    userId: input.userId,
    businessId: input.businessId,
    dashboardId: input.dashboardId,
    householdId: input.householdId,
    queryPreview: redactQueryPreview(input.query),
    detectedIntents: [...input.detectedIntents],
    passKind: input.passKind,
    groundingSources: {
      required: [...input.requiredSourceIds],
      optional: [...input.optionalSourceIds],
      mappedProviders: input.groundingSourceToProvider.map((g) => ({
        sourceId: g.sourceId,
        providerId: g.providerId,
        moduleId: g.moduleId,
        providerName: g.providerName,
      })),
    },
    selectedProviders,
    skippedProviders,
    requiredSourceFailures: [...input.requiredSourceFailures],
    ...(input.staleContextWarnings.length > 0
      ? { staleContextWarnings: [...input.staleContextWarnings] }
      : {}),
    budgets: {
      ...(input.budget?.tokenBudget != null ? { tokenBudget: input.budget.tokenBudget } : {}),
      ...(input.budget?.maxLatencyMs != null ? { maxLatencyMs: input.budget.maxLatencyMs } : {}),
      ...(input.budget?.maxOptionalProviders != null
        ? { optionalProviderLimit: input.budget.maxOptionalProviders }
        : {}),
    },
    timing: {
      startedAt: input.timing.startedAt,
      completedAt: input.timing.completedAt,
      totalLatencyMs,
    },
    outcome: {
      groundingFailure: input.groundingFailure,
      enforcementMode: input.enforcement.enforcementMode,
      enforcementEnabled: input.enforcement.enforcementEnabled,
      providerCount: uniqueProviderIds.size,
      selectedCount: selectedProviders.length,
      skippedCount: skippedProviders.length,
      requiredFailureCount: input.requiredSourceFailures.length,
    },
    ...(traceTags.length > 0 ? { traceTags } : {}),
  };
}

export function appendOrchestrationSnapshot(
  queryContext: Record<string, unknown>,
  snapshot: AIOrchestrationSnapshot
): void {
  const existing = Array.isArray(queryContext.orchestrationSnapshots)
    ? (queryContext.orchestrationSnapshots as AIOrchestrationSnapshot[])
    : [];
  queryContext.orchestrationSnapshots = [...existing, snapshot].slice(
    -MAX_ORCHESTRATION_SNAPSHOTS_PER_REQUEST
  );
}

export function emitOrchestrationSnapshot(
  snapshot: AIOrchestrationSnapshot,
  options?: { force?: boolean }
): AIOrchestrationSnapshot | undefined {
  if (!shouldEmitOrchestrationSnapshot(options)) {
    return undefined;
  }

  const emittedSnapshot = appendSampledSnapshotTag(snapshot, options);

  const logLevel = process.env.AI_ORCHESTRATION_SNAPSHOT_LOG_LEVEL === 'debug' ? 'debug' : 'info';

  void logger[logLevel]('AI orchestration snapshot', {
    operation: 'ai_orchestration_snapshot',
    snapshotId: snapshot.snapshotId,
    schemaVersion: snapshot.schemaVersion,
    contextGenerationId: snapshot.contextGenerationId,
    requestId: snapshot.requestId,
    conversationId: snapshot.conversationId,
    userId: snapshot.userId,
    businessId: snapshot.businessId,
    dashboardId: snapshot.dashboardId,
    passKind: snapshot.passKind,
    queryPreview: snapshot.queryPreview,
    detectedIntents: snapshot.detectedIntents,
    outcome: snapshot.outcome,
    timing: snapshot.timing,
    requiredSourceFailures: snapshot.requiredSourceFailures,
    selectedCount: snapshot.outcome.selectedCount,
    skippedCount: snapshot.outcome.skippedCount,
    groundingFailure: emittedSnapshot.outcome.groundingFailure,
    orchestratorVersion: emittedSnapshot.orchestratorVersion,
    traceTags: emittedSnapshot.traceTags,
  });

  return emittedSnapshot;
}
