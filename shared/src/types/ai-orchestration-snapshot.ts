/**
 * Orchestration snapshot — metadata-only observability (Phase B.5).
 */

import type { ContextRetrievalCost } from './ai-context-provider-contract';

export const AI_ORCHESTRATION_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type OrchestrationSnapshotPassKind = 'module_context' | 'grounding_module_sources';

export type OrchestrationSnapshotFreshness = 'fresh' | 'stale' | 'unknown';

export type OrchestrationSnapshotResultStatus = 'hit' | 'miss' | 'error' | 'skipped';

/** Lightweight filter/classification tags for replay, dashboards, and Test Lab (Phase B.5+). */
export type OrchestrationSnapshotTraceTag =
  | 'grounding_failure'
  | 'required_source_failure'
  | 'stale_context'
  | 'admin_debug'
  | 'grounding_boost'
  | 'sampled_snapshot'
  | 'fallback_provider'
  | 'high_latency';

export interface AIOrchestrationSnapshotSelectedProvider {
  providerId: string;
  moduleId: string;
  providerName?: string;
  requiredForGrounding?: boolean;
  priority?: number;
  retrievalCost?: ContextRetrievalCost;
  freshness?: OrchestrationSnapshotFreshness;
  latencyMs?: number;
  resultStatus?: OrchestrationSnapshotResultStatus;
}

export interface AIOrchestrationSnapshotSkippedProvider {
  providerId: string;
  moduleId: string;
  providerName?: string;
  reason: string;
  requiredForGrounding?: boolean;
}

export interface AIOrchestrationSnapshot {
  snapshotId: string;
  schemaVersion: typeof AI_ORCHESTRATION_SNAPSHOT_SCHEMA_VERSION;
  contextGenerationId: string;
  requestId?: string;
  conversationId?: string;

  userId: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;

  queryPreview: string;
  detectedIntents?: string[];
  passKind: OrchestrationSnapshotPassKind;

  groundingSources: {
    required: string[];
    optional: string[];
    mappedProviders: Array<{
      sourceId: string;
      providerId: string;
      moduleId: string;
      providerName?: string;
    }>;
  };

  selectedProviders: AIOrchestrationSnapshotSelectedProvider[];
  skippedProviders: AIOrchestrationSnapshotSkippedProvider[];

  requiredSourceFailures: string[];
  staleContextWarnings?: string[];

  budgets?: {
    tokenBudget?: number;
    maxLatencyMs?: number;
    optionalProviderLimit?: number;
  };

  timing: {
    startedAt: string;
    completedAt: string;
    totalLatencyMs: number;
  };

  outcome: {
    groundingFailure?: boolean;
    enforcementMode?: string;
    enforcementEnabled?: boolean;
    providerCount: number;
    selectedCount: number;
    skippedCount: number;
    requiredFailureCount: number;
  };

  /**
   * Deterministic tags derived at snapshot build for search/filter/replay tooling.
   * Optional — additive for forward compatibility.
   */
  traceTags?: OrchestrationSnapshotTraceTag[];

  /**
   * Orchestrator behavior version for replay compatibility when selection/freshness/ranking changes.
   * Not a dynamic semver — bump centrally when orchestration semantics change materially.
   */
  orchestratorVersion?: string;
}
