/**
 * Per-request context density report (Phase 3A).
 * Counts and status only — no raw provider payloads.
 */

import type { AIAssembledContext, AIContextTier } from './AIContextAssembler';
import {
  CONVERSATION_CONTEXT_BUDGET_TOKENS,
  ENTERPRISE_CONTEXT_BUDGET_TOKENS,
} from './contextProfile';
import { allocateTierBudget } from './ContextBudgetManager';

export type ProviderFailureReason = 'timeout' | 'not_found' | 'auth' | 'network' | 'unknown';

export type ProviderFetchStatus = 'succeeded' | 'failed' | 'skipped';

export interface ProviderFetchAttempt {
  moduleId: string;
  providerName: string;
  status: ProviderFetchStatus;
  cacheHit?: boolean;
  latencyMs?: number;
  failureReason?: ProviderFailureReason;
  failureMessage?: string;
}

export interface ContextDensityTierUsage {
  tier: AIContextTier;
  blocksInjected: number;
  tokensUsedEstimate: number;
  tokenBudgetAllocated: number;
}

export interface ContextDensityReport {
  providers: {
    attempted: number;
    succeeded: number;
    failed: number;
    cacheHits: number;
    attempts: ProviderFetchAttempt[];
  };
  memory: {
    factsLoaded: number;
    factsInjected: number;
    recalledMessagesLoaded: number;
  };
  modules: {
    contextsLoaded: number;
    blocksLoaded: number;
    blocksInjected: number;
    matchedHighRelevance: number;
  };
  blocks: {
    loaded: number;
    afterProfile: number;
    ranked: number;
    injected: number;
    synthetic: number;
    live: number;
    profileExcluded: number;
  };
  tokenBudget: {
    totalAllocated: number;
    totalUsedEstimate: number;
    byTier: ContextDensityTierUsage[];
  };
  missingContextCount: number;
}

/** Compact counts for twin metadata (no attempt details). */
export interface ContextDensitySummary {
  providersAttempted: number;
  providersSucceeded: number;
  providersFailed: number;
  cacheHits: number;
  memoryFactsLoaded: number;
  memoryFactsInjected: number;
  moduleContextsLoaded: number;
  moduleBlocksInjected: number;
  blocksInjected: number;
  syntheticBlocks: number;
  liveBlocks: number;
  tokensUsedEstimate: number;
  tokenBudget: number;
  missingContextCount: number;
}

const SYNTHETIC_BLOCK_TITLES = new Set([
  'Cross-module insights',
  'Observed patterns',
  'Smart pattern analysis',
  'Semantic enhancement',
  'Collective learning patterns',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSyntheticBlockTitle(title: string): boolean {
  return SYNTHETIC_BLOCK_TITLES.has(title.trim());
}

export { allocateTierBudget } from './ContextBudgetManager';

export function classifyProviderFailure(error: unknown): {
  reason: ProviderFailureReason;
  message: string;
} {
  if (isRecord(error) && typeof error.code === 'string' && error.code === 'ECONNABORTED') {
    return { reason: 'timeout', message: 'Provider request timed out' };
  }

  const axiosLike = isRecord(error) ? error : null;
  const response = axiosLike && isRecord(axiosLike.response) ? axiosLike.response : null;
  const status =
    typeof response?.status === 'number'
      ? response.status
      : typeof axiosLike?.status === 'number'
        ? axiosLike.status
        : undefined;

  if (status === 404) {
    return { reason: 'not_found', message: 'Provider endpoint not found' };
  }
  if (status === 401 || status === 403) {
    return { reason: 'auth', message: 'Provider request unauthorized' };
  }

  const message =
    error instanceof Error
      ? error.message.slice(0, 160)
      : typeof error === 'string'
        ? error.slice(0, 160)
        : 'Unknown provider error';

  if (/not found in AI context registry|Context provider .* not found/i.test(message)) {
    return { reason: 'not_found', message };
  }
  if (/timeout|timed out/i.test(message)) {
    return { reason: 'timeout', message };
  }
  if (/ECONNREFUSED|ENOTFOUND|network/i.test(message)) {
    return { reason: 'network', message };
  }

  return { reason: 'unknown', message };
}

export interface BuildContextDensityReportInput {
  assembled: AIAssembledContext;
  providerFetchAudit?: ProviderFetchAttempt[];
  assemblyMetrics?: {
    blocksLoaded: number;
    blocksAfterProfile: number;
    blocksRanked: number;
    blocksInjected: number;
    profileExcludedCount: number;
    contextBudgetTokens: number;
    tokensUsedEstimate: number;
    moduleContextsLoaded: number;
    moduleBlocksLoaded: number;
    matchedHighRelevance: number;
    memoryFactsLoaded: number;
    memoryFactsInjected: number;
    recalledMessagesLoaded: number;
  };
}

export function buildContextDensityReport(
  input: BuildContextDensityReportInput
): ContextDensityReport {
  const audit = input.providerFetchAudit ?? [];
  const metrics = input.assemblyMetrics ?? input.assembled.assemblyMetrics;
  const injectedBlocks = input.assembled.contextBlocks;

  const synthetic = injectedBlocks.filter((b) => isSyntheticBlockTitle(b.title)).length;
  const live = injectedBlocks.length - synthetic;

  const moduleBlocksInjected = injectedBlocks.filter((b) =>
    b.title.startsWith('Module live context:')
  ).length;

  const tiers: AIContextTier[] = [
    'tier1_recent_conversation',
    'tier2_continuity',
    'tier3_profile',
    'tier4_cross_module',
  ];
  const totalBudget =
    metrics?.contextBudgetTokens ??
    (input.assembled.structuredResponseMode === 'conversation'
      ? CONVERSATION_CONTEXT_BUDGET_TOKENS
      : ENTERPRISE_CONTEXT_BUDGET_TOKENS);

  const byTier: ContextDensityTierUsage[] = tiers.map((tier) => {
    const tierBlocks = injectedBlocks.filter((b) => b.tier === tier);
    const tokensUsedEstimate = tierBlocks.reduce(
      (sum, b) => sum + (b.budgetTokensEstimate ?? 0),
      0
    );
    return {
      tier,
      blocksInjected: tierBlocks.length,
      tokensUsedEstimate,
      tokenBudgetAllocated: allocateTierBudget(totalBudget, tier),
    };
  });

  const tokensUsedEstimate =
    metrics?.tokensUsedEstimate ??
    injectedBlocks.reduce((sum, b) => sum + (b.budgetTokensEstimate ?? 0), 0);

  return {
    providers: {
      attempted: audit.filter((a) => a.status !== 'skipped').length,
      succeeded: audit.filter((a) => a.status === 'succeeded').length,
      failed: audit.filter((a) => a.status === 'failed').length,
      cacheHits: audit.filter((a) => a.cacheHit === true).length,
      attempts: audit,
    },
    memory: {
      factsLoaded: metrics?.memoryFactsLoaded ?? 0,
      factsInjected: metrics?.memoryFactsInjected ?? 0,
      recalledMessagesLoaded: metrics?.recalledMessagesLoaded ?? 0,
    },
    modules: {
      contextsLoaded: metrics?.moduleContextsLoaded ?? 0,
      blocksLoaded: metrics?.moduleBlocksLoaded ?? moduleBlocksInjected,
      blocksInjected: moduleBlocksInjected,
      matchedHighRelevance: metrics?.matchedHighRelevance ?? 0,
    },
    blocks: {
      loaded: metrics?.blocksLoaded ?? injectedBlocks.length,
      afterProfile: metrics?.blocksAfterProfile ?? injectedBlocks.length,
      ranked: metrics?.blocksRanked ?? injectedBlocks.length,
      injected: metrics?.blocksInjected ?? injectedBlocks.length,
      synthetic,
      live,
      profileExcluded: metrics?.profileExcludedCount ?? 0,
    },
    tokenBudget: {
      totalAllocated: totalBudget,
      totalUsedEstimate: tokensUsedEstimate,
      byTier,
    },
    missingContextCount: input.assembled.missingContext.length,
  };
}

export function toContextDensitySummary(report: ContextDensityReport): ContextDensitySummary {
  return {
    providersAttempted: report.providers.attempted,
    providersSucceeded: report.providers.succeeded,
    providersFailed: report.providers.failed,
    cacheHits: report.providers.cacheHits,
    memoryFactsLoaded: report.memory.factsLoaded,
    memoryFactsInjected: report.memory.factsInjected,
    moduleContextsLoaded: report.modules.contextsLoaded,
    moduleBlocksInjected: report.modules.blocksInjected,
    blocksInjected: report.blocks.injected,
    syntheticBlocks: report.blocks.synthetic,
    liveBlocks: report.blocks.live,
    tokensUsedEstimate: report.tokenBudget.totalUsedEstimate,
    tokenBudget: report.tokenBudget.totalAllocated,
    missingContextCount: report.missingContextCount,
  };
}

export function readContextDensityReport(
  queryContext: Record<string, unknown> | undefined
): ContextDensityReport | undefined {
  const raw = queryContext?.contextDensityReport;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return raw as ContextDensityReport;
}
