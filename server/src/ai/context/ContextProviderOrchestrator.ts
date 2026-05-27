/**
 * Intent-aware context provider orchestration (Phase A).
 */

import { randomUUID } from 'crypto';
import type { AIQueryAnalysis } from '../../../../shared/src/types/module-ai-context';
import type {
  ContextOrchestrationMeta,
  ProviderSelectionDiagnostic,
} from '../../../../shared/src/types/ai-context-provider-contract';
import { moduleAIContextService } from '../services/ModuleAIContextService';
import { inferPipelineIntents } from '../pipeline/inferPipelineIntents';
import { getEffectivePipelineCatalog } from '../pipeline/pipelineCatalogService';
import type { PipelineEnforcementSettings, PipelineIntentId } from '../types/pipelineDiagnostics';
import { resolvePipelineEnforcementSettings } from '../pipeline/pipelineEnforcement';
import type { UserContext } from './CrossModuleContextEngine';
import type { ProviderFetchAttempt } from './contextDensityReport';
import { buildSkimUserContext } from './lazyUserContext';
import { loadInstalledRegistryProviders } from './contextProviderRegistry';
import {
  buildProviderSelectionPlan,
  optionalSourcesForGroundingIntents,
  requiredSourcesForGroundingIntents,
  type ProviderSelectionCandidate,
} from './contextProviderSelection';
import { fetchRegisteredProviderContext } from './fetchModuleContextProvider';
import { detectMultiModuleIntent } from '../services/moduleContextProviderSelection';
import { logger } from '../../lib/logger';
import { buildStaleContextWarnings } from './contextProviderFreshness';
import { getProvidersForPipelineSource } from './pipelineSourceProviderMap';
import type { OrchestrationSnapshotPassKind } from '../../../../shared/src/types/ai-orchestration-snapshot';
import {
  buildOrchestrationSnapshot,
  emitOrchestrationSnapshot,
} from './orchestrationSnapshot';

export interface OrchestrateContextScope {
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  requestId?: string;
  /** Phase B.5 — always emit orchestration snapshot (admin dry-run). */
  snapshotForce?: boolean;
  conversationId?: string;
}

export interface OrchestrateContextRetrievalInput {
  userId: string;
  query: string;
  scope?: OrchestrateContextScope;
  enforcementSettings?: PipelineEnforcementSettings;
  existingModuleContexts?: Record<string, unknown>;
  /** Limit module-backed fetches to these pipeline catalog source ids. */
  sourceFilter?: string[];
  /** When false, only grounding-mapped providers run (no query keyword module matches). */
  includeQueryMatchedModules?: boolean;
  /** Phase B.5 — force snapshot emit (admin dry-run). */
  snapshotOptions?: {
    force?: boolean;
    conversationId?: string;
    passKind?: OrchestrationSnapshotPassKind;
  };
}

export interface OrchestrateContextRetrievalResult {
  query: string;
  analysis: AIQueryAnalysis;
  fullContext: UserContext;
  moduleContexts: Record<string, unknown>;
  providerFetchAudit: ProviderFetchAttempt[];
  providerSelectionDiagnostics: ProviderSelectionDiagnostic[];
  installedModuleIds: string[];
  relevantModuleCount: number;
  multiModuleIntent: boolean;
  timestamp: Date;
  contextOrchestration: ContextOrchestrationMeta;
  groundingFailure: boolean;
  requiredSourceFailures: string[];
  staleContextWarnings: string[];
  groundingSourceToProvider: Array<{
    sourceId: string;
    providerId: string;
    moduleId: string;
    providerName: string;
  }>;
  orchestrationSnapshot?: import('../../../../shared/src/types/ai-orchestration-snapshot').AIOrchestrationSnapshot;
}

export function filterSourcesByIds(sources: Set<string>, filter?: string[]): Set<string> {
  if (!filter || filter.length === 0) return sources;
  const allowed = new Set(filter);
  return new Set([...sources].filter((id) => allowed.has(id)));
}

const DEFAULT_MAX_LATENCY_MS = 10_000;
const DEFAULT_MAX_OPTIONAL_PROVIDERS = 4;

function isEnforcementBlockMode(settings: PipelineEnforcementSettings): boolean {
  return (
    settings.enforcementEnabled &&
    (settings.enforcementMode === 'block' || settings.enforcementMode === 'regenerate')
  );
}

function moduleContextKey(moduleId: string): string {
  return moduleId;
}

async function fetchCandidate(
  candidate: ProviderSelectionCandidate,
  input: OrchestrateContextRetrievalInput,
  detectedIntents: PipelineIntentId[]
): Promise<{
  audit: ProviderFetchAttempt;
  resultModuleContext?: Record<string, unknown>;
  requiredFailure?: string;
}> {
  const { provider, moduleMatch, requiredForGrounding, groundingSourceId } = candidate;

  const retrieveResult = await fetchRegisteredProviderContext(provider, {
    query: input.query,
    detectedIntents,
    userId: input.userId,
    businessId: input.scope?.businessId,
    dashboardId: input.scope?.dashboardId,
  });

  const audit: ProviderFetchAttempt = {
    moduleId: provider.moduleId,
    providerName: provider.providerName,
    providerId: provider.id,
    requiredForGrounding,
    status: 'skipped',
  };

  if (retrieveResult.status === 'error') {
    audit.status = 'failed';
    const errorCode = retrieveResult.diagnostics?.errorCode;
    if (
      errorCode === 'timeout' ||
      errorCode === 'not_found' ||
      errorCode === 'auth' ||
      errorCode === 'network' ||
      errorCode === 'unknown'
    ) {
      audit.failureReason = errorCode;
    } else {
      audit.failureReason = 'unknown';
    }
    audit.failureMessage = retrieveResult.diagnostics?.warnings?.[0];
    audit.latencyMs = retrieveResult.latencyMs;
    audit.resultStatus = 'error';

    const failureKey = groundingSourceId ?? provider.id;
    return {
      audit,
      requiredFailure: requiredForGrounding ? failureKey : undefined,
    };
  }

  audit.status = 'succeeded';
  audit.latencyMs = retrieveResult.latencyMs;
  audit.cacheHit = retrieveResult.freshness === 'fresh';
  audit.freshness = retrieveResult.freshness;

  if (retrieveResult.status === 'miss') {
    audit.resultStatus = 'miss';
    if (requiredForGrounding) {
      const failureKey = groundingSourceId ?? provider.id;
      return {
        audit,
        requiredFailure: failureKey,
      };
    }
    return { audit };
  }

  audit.resultStatus = 'hit';

  const moduleContext = {
    data: retrieveResult.data,
    moduleName: moduleMatch?.moduleName ?? provider.moduleName,
    providerName: provider.providerName,
    relevance: moduleMatch?.relevance ?? 'high',
    matchedKeywords: moduleMatch?.matchedKeywords ?? [],
    cached: retrieveResult.freshness === 'fresh',
    latency: retrieveResult.latencyMs,
    contextGenerationId: undefined as string | undefined,
  };

  return {
    audit,
    resultModuleContext: moduleContext,
  };
}

export async function orchestrateContextRetrieval(
  input: OrchestrateContextRetrievalInput
): Promise<OrchestrateContextRetrievalResult> {
  const startedAt = new Date().toISOString();
  const contextGenerationId = randomUUID();
  const generatedAt = new Date().toISOString();
  const contextOrchestration: ContextOrchestrationMeta = {
    contextGenerationId,
    generatedAt,
    requestId: input.scope?.requestId,
  };

  const catalog = await getEffectivePipelineCatalog();
  const enforcement =
    input.enforcementSettings ?? resolvePipelineEnforcementSettings(catalog.enforcement);
  const detectedIntents = inferPipelineIntents(input.query);

  const analysis = await moduleAIContextService.analyzeQuery(input.query, input.userId);
  const { installedModuleIds, providersByModule } =
    await loadInstalledRegistryProviders(input.userId);

  const groundingIntents = detectedIntents.filter((id) => {
    const def = catalog.intents.find((i) => i.id === id);
    return def?.groundingRequired === true;
  });

  const requiredSourceIds = filterSourcesByIds(
    requiredSourcesForGroundingIntents(catalog, groundingIntents),
    input.sourceFilter
  );
  const optionalSourceIds = filterSourcesByIds(
    optionalSourcesForGroundingIntents(catalog, detectedIntents),
    input.sourceFilter
  );
  const sourceFilterSet =
    input.sourceFilter && input.sourceFilter.length > 0
      ? new Set(input.sourceFilter)
      : undefined;

  const plan = buildProviderSelectionPlan({
    query: input.query,
    analysis,
    detectedIntents,
    catalog,
    providersByModule,
    installedModuleIds,
    businessId: input.scope?.businessId,
    requiredSourceIds,
    optionalSourceIds,
    sourceFilter: sourceFilterSet,
    includeQueryMatchedModules: input.includeQueryMatchedModules,
    budget: {
      maxLatencyMs: DEFAULT_MAX_LATENCY_MS,
      maxOptionalProviders: DEFAULT_MAX_OPTIONAL_PROVIDERS,
    },
  });

  const moduleContexts: Record<string, unknown> = {
    ...(input.existingModuleContexts ?? {}),
  };
  const providerFetchAudit: ProviderFetchAttempt[] = [];
  const requiredSourceFailures: string[] = [];
  const diagnostics = [...plan.diagnostics];

  const runBatch = async (candidates: ProviderSelectionCandidate[]) => {
    const results = await Promise.all(
      candidates.map(async (candidate) => {
        if (moduleContexts[moduleContextKey(candidate.provider.moduleId)]) {
          return null;
        }
        return fetchCandidate(candidate, input, detectedIntents);
      })
    );

    for (const result of results) {
      if (!result) continue;
      providerFetchAudit.push(result.audit);

      const diagIdx = diagnostics.findIndex(
        (d) => d.providerId === result.audit.providerId && d.phase === 'selected'
      );
      if (diagIdx >= 0) {
        diagnostics[diagIdx] = {
          ...diagnostics[diagIdx],
          latencyMs: result.audit.latencyMs,
          resultStatus:
            result.audit.status === 'failed'
              ? 'error'
              : result.audit.resultStatus === 'miss'
                ? 'miss'
                : result.audit.status === 'succeeded'
                  ? 'hit'
                  : undefined,
        };
      }

      if (result.requiredFailure) {
        requiredSourceFailures.push(result.requiredFailure);
      }

      if (result.resultModuleContext) {
        const key = moduleContextKey(result.audit.moduleId);
        moduleContexts[key] = {
          ...result.resultModuleContext,
          contextGenerationId,
        };
      }
    }
  };

  await runBatch(plan.required);
  await runBatch(plan.optional);

  const fullContext = await buildSkimUserContext(input.userId);
  fullContext.activeModules = installedModuleIds;

  const multiModuleIntent = detectMultiModuleIntent(input.query, analysis.matchedModules);

  const groundingFailure =
    requiredSourceFailures.length > 0 && isEnforcementBlockMode(enforcement);

  const staleContextWarnings = buildStaleContextWarnings(
    providerFetchAudit
      .filter((a) => a.freshness === 'stale')
      .map((a) => ({
        providerId: a.providerId,
        moduleId: a.moduleId,
        providerName: a.providerName,
        freshness: a.freshness,
        requiredForGrounding: a.requiredForGrounding,
      }))
  );

  const groundingSourceToProvider: OrchestrateContextRetrievalResult['groundingSourceToProvider'] =
    [];
  for (const candidate of [...plan.required, ...plan.optional]) {
    if (!candidate.groundingSourceId) continue;
    groundingSourceToProvider.push({
      sourceId: candidate.groundingSourceId,
      providerId: candidate.provider.id,
      moduleId: candidate.provider.moduleId,
      providerName: candidate.provider.providerName,
    });
  }
  for (const sourceId of [...requiredSourceIds, ...optionalSourceIds]) {
    for (const ref of getProvidersForPipelineSource(sourceId)) {
      const providerId = `${ref.moduleId}.${ref.providerName}`;
      if (groundingSourceToProvider.some((g) => g.sourceId === sourceId)) continue;
      groundingSourceToProvider.push({
        sourceId,
        providerId,
        moduleId: ref.moduleId,
        providerName: ref.providerName,
      });
    }
  }

  void logger.info('Context orchestration complete', {
    operation: 'context_orchestration',
    contextGenerationId,
    requestId: input.scope?.requestId,
    userId: input.userId,
    considered: diagnostics.filter((d) => d.phase === 'considered').length,
    selected: diagnostics.filter((d) => d.phase === 'selected').length,
    skipped: diagnostics.filter((d) => d.phase === 'skipped').length,
    requiredFailures: requiredSourceFailures.length,
    groundingFailure,
  });

  const passKind: OrchestrationSnapshotPassKind =
    input.snapshotOptions?.passKind ??
    (input.sourceFilter && input.sourceFilter.length > 0
      ? 'grounding_module_sources'
      : 'module_context');

  const selectionBudget = {
    maxLatencyMs: DEFAULT_MAX_LATENCY_MS,
    maxOptionalProviders: DEFAULT_MAX_OPTIONAL_PROVIDERS,
  };

  const snapshot = buildOrchestrationSnapshot({
    contextGenerationId,
    requestId: input.scope?.requestId,
    conversationId: input.snapshotOptions?.conversationId,
    userId: input.userId,
    businessId: input.scope?.businessId,
    dashboardId: input.scope?.dashboardId,
    householdId: input.scope?.householdId,
    query: input.query,
    detectedIntents,
    passKind,
    requiredSourceIds: [...requiredSourceIds],
    optionalSourceIds: [...optionalSourceIds],
    groundingSourceToProvider,
    providerSelectionDiagnostics: diagnostics,
    providerFetchAudit,
    requiredSourceFailures,
    staleContextWarnings,
    groundingFailure,
    enforcement,
    budget: selectionBudget,
    timing: { startedAt, completedAt: generatedAt },
    snapshotForce: input.snapshotOptions?.force,
  });

  const orchestrationSnapshot = emitOrchestrationSnapshot(snapshot, {
    force: input.snapshotOptions?.force,
  });

  return {
    query: analysis.query,
    analysis,
    fullContext,
    moduleContexts,
    providerFetchAudit,
    providerSelectionDiagnostics: diagnostics,
    installedModuleIds,
    relevantModuleCount: Object.keys(moduleContexts).filter((k) => !k.startsWith('_')).length,
    multiModuleIntent,
    timestamp: new Date(),
    contextOrchestration,
    groundingFailure,
    requiredSourceFailures,
    staleContextWarnings,
    groundingSourceToProvider,
    ...(orchestrationSnapshot ? { orchestrationSnapshot } : {}),
  };
}

/** Grounding prepass: module-backed catalog sources only, no query-matched module fan-out. */
export async function orchestratePipelineModuleSources(
  input: OrchestrateContextRetrievalInput & { sourceIds: string[] }
): Promise<OrchestrateContextRetrievalResult> {
  return orchestrateContextRetrieval({
    ...input,
    sourceFilter: input.sourceIds,
    includeQueryMatchedModules: false,
    snapshotOptions: {
      ...input.snapshotOptions,
      passKind: 'grounding_module_sources',
    },
  });
}
