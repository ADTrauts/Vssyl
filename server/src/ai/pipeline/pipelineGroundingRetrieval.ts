/**
 * Phase 4 — supplemental retrieval for grounding (location + module sources via orchestrator).
 */

import { geolocationService, type LocationData } from '../../services/geolocationService';
import { logger } from '../../lib/logger';
import type {
  PipelineCatalog,
  PipelineContextRetrievedRecord,
  PipelineIntentId,
  PipelineToolPolicy,
  PipelineToolUsageRecord,
} from '../types/pipelineDiagnostics';
import {
  getGroundingRuleForIntentInCatalog,
  getIntentDefinitionFromCatalog,
} from './pipelineCatalogDefaults';
import {
  detectVLinkQuerySignals,
  fetchVLinkPipelineContext,
  mapVLinkPipelineContextToRetrieved,
  shouldPrioritizeVLinkContext,
} from '../context/vlinkPipelineContextService';
import {
  detectGraphBundleQuerySignals,
  fetchGraphBundlePipelineContext,
  mapGraphBundlePipelineContextToRetrieved,
} from '../context/graphBundlePipelineContextService';
import { inferPipelineIntents } from './inferPipelineIntents';
import { optionalSourcesForInferredIntents } from './pipelineGroundingRuleReconcile';
import { orchestratePipelineModuleSources } from '../context/ContextProviderOrchestrator';
import { isModuleBackedPipelineSource } from '../context/pipelineSourceProviderMap';
import { classifyProviderFailure } from '../context/contextDensityReport';
import { runPipelineRetrievalDiscovery } from '../retrieval/aiRetrievalPipelineHook';
import { resolveRetrievalConsumerIntent } from '../retrieval/aiRetrievalConsumerContract';
import type { AIRetrievalDiscoverResult } from '../retrieval/aiRetrievalTypes';
import {
  buildPipelineEvidenceSourceDiagnostics,
  type PipelineEvidenceSourceDiagnostics,
} from './pipelineEvidenceSourceDiagnostics';
import {
  emptyGraphBundlePipelineContext,
  enrichGraphBundlesFromRetrieval,
} from '../../context-graph/enrichGraphBundlesFromRetrieval.js';
import { isRetrievalBundleBridgeEnabled } from '../../context-graph/retrievalBundleBridgeConfig.js';
import type { TenantScope } from '../../context-graph/contextGraphTypes.js';
import { composePipelineKnowledgeBundles } from '../../knowledge/knowledgeCompositionOrchestrator.js';
import { isKnowledgeCompositionEnabled } from '../../knowledge/knowledgeCompositionConfig.js';
import { buildNeighborhoodModuleContextPatch } from '../../knowledge/projectAssistantNeighborhoodConsumer.js';
import { memoryRetrievalService } from '../memory/MemoryRetrievalService.js';
import {
  isGroundingReconcileEnabled,
  reconcileGroundingArtifacts,
  type GroundingReconcileDiagnostics,
} from '../context/groundingReconcile.js';

export interface PipelineGroundingRetrievalInput {
  userId: string;
  userMessage: string;
  catalog: PipelineCatalog;
  clientIp?: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  existingModuleContexts?: Record<string, unknown>;
  existingVLinkPipelineContext?: import('../context/vlinkPipelineContextService').VLinkPipelineContextResult;
  existingGraphBundlePipelineContext?: import('../context/graphBundlePipelineContextService').GraphBundlePipelineContextResult;
  requestId?: string;
  conversationId?: string;
  /** Phase B.5 — force orchestration snapshot (admin paths). */
  snapshotForce?: boolean;
}

export interface PipelineGroundingRetrievalResult {
  moduleContextsPatch: Record<string, unknown>;
  contextRetrieved: PipelineContextRetrievedRecord[];
  sourcesUsed: string[];
  toolsUsed: PipelineToolUsageRecord[];
  locationSummary?: string;
  vlinkPipelineContext?: import('../context/vlinkPipelineContextService').VLinkPipelineContextResult;
  graphBundlePipelineContext?: import('../context/graphBundlePipelineContextService').GraphBundlePipelineContextResult;
  requiredSourceFailures?: string[];
  contextOrchestration?: {
    contextGenerationId: string;
    generatedAt: string;
    requestId?: string;
  };
  providerSelectionDiagnostics?: import('../../../../shared/src/types/ai-context-provider-contract').ProviderSelectionDiagnostic[];
  staleContextWarnings?: string[];
  groundingSourceToProvider?: Array<{
    sourceId: string;
    providerId: string;
    moduleId: string;
    providerName: string;
  }>;
  orchestrationSnapshot?: import('../../../../shared/src/types/ai-orchestration-snapshot').AIOrchestrationSnapshot;
  /** Phase 1A — optional Unified Search discovery for planning intent pilot. */
  retrievalDiscovery?: AIRetrievalDiscoverResult;
  /** Phase 1B — grounding dedup diagnostics (project_assistant pilot). */
  groundingReconcileDiagnostics?: GroundingReconcileDiagnostics;
  /** Wave 3 — operator breakdown of evidence sources. */
  evidenceSourceDiagnostics?: PipelineEvidenceSourceDiagnostics;
}

function isToolEnabled(catalog: PipelineCatalog, toolId: PipelineToolPolicy['toolId']): boolean {
  return catalog.toolPolicies.some((p) => p.toolId === toolId && p.enabled);
}

function isSourceEnabled(catalog: PipelineCatalog, sourceId: string): boolean {
  return catalog.contextSources.some((s) => s.id === sourceId && s.enabled);
}

function requiredSourcesForIntents(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): Set<string> {
  const sources = new Set<string>();
  for (const intentId of intentIds) {
    const rule = getGroundingRuleForIntentInCatalog(catalog, intentId);
    if (!rule) continue;
    for (const s of rule.requiredSources) sources.add(s);
    for (const s of rule.optionalSources) sources.add(s);
  }
  return sources;
}

function moduleHasExistingContext(
  existing: Record<string, unknown> | undefined,
  moduleId: string
): boolean {
  const entry = existing?.[moduleId];
  return Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry);
}

async function resolveLocation(clientIp?: string): Promise<LocationData | null> {
  if (!clientIp) return null;
  try {
    return await geolocationService.detectUserLocation(clientIp);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Pipeline location retrieval failed', {
      operation: 'pipeline_grounding_location',
      error: { message: err.message },
    });
    return null;
  }
}

function formatLocationSummary(location: LocationData): string {
  return `${location.city}, ${location.region}, ${location.country}`;
}

function toolForModuleSource(sourceId: string): PipelineToolPolicy['toolId'] | undefined {
  switch (sourceId) {
    case 'vssyl_place':
      return 'place_search';
    case 'drive_files':
      return 'list_drive_files';
    case 'calendar':
      return 'module_context';
    default:
      return 'module_context';
  }
}

function mergeModuleContextPatch(
  existing: Record<string, unknown> | undefined,
  moduleId: string,
  fetched: Record<string, unknown>
): Record<string, unknown> {
  const prior =
    typeof existing?.[moduleId] === 'object' && existing[moduleId] !== null
      ? (existing[moduleId] as Record<string, unknown>)
      : {};

  return {
    ...prior,
    ...fetched,
    pipelineGroundingBoost: true,
  };
}

async function ensureKnowledgeCompositionOnGraphContext(
  graphContext: import('../context/graphBundlePipelineContextService.js').GraphBundlePipelineContextResult | undefined,
  consumerIntent: ReturnType<typeof resolveRetrievalConsumerIntent>,
  input: { userId: string; userMessage: string; businessId?: string }
): Promise<import('../context/graphBundlePipelineContextService.js').GraphBundlePipelineContextResult | undefined> {
  if (!graphContext || graphContext.bundles.length === 0 || graphContext.knowledgeCompositionApplied) {
    return graphContext;
  }

  const knowledgeConsumer =
    consumerIntent && isKnowledgeCompositionEnabled(consumerIntent as import('../../knowledge/knowledgeTypes.js').KnowledgeConsumerId)
      ? consumerIntent
      : undefined;

  let memoryFacts: import('../../services/userMemoryFactService.js').RetrievedMemoryFact[] | undefined;
  if (knowledgeConsumer) {
    try {
      const memoryResult = await memoryRetrievalService.retrieve({
        userId: input.userId,
        query: input.userMessage,
        businessId: input.businessId,
      });
      memoryFacts = memoryResult.facts;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.warn('Knowledge pipeline memory retrieval failed', {
        operation: 'knowledge_memory_compose',
        error: { message: err.message },
      });
    }
  }

  const composed = composePipelineKnowledgeBundles({
    contextBundles: graphContext.bundles,
    consumerIntent,
    userId: input.userId,
    memoryFacts,
  });
  if (!composed.compositionApplied || !composed.knowledgeBundles) {
    return graphContext;
  }
  return {
    ...graphContext,
    knowledgeBundles: composed.knowledgeBundles,
    knowledgeCompositionDiagnostics: composed.compositionDiagnostics,
    knowledgeCompositionApplied: true,
    knowledgeNeighborhoods: composed.knowledgeNeighborhoods,
    knowledgeConvergenceDiagnostics: composed.convergenceDiagnostics,
    knowledgeConvergenceApplied: composed.convergenceApplied,
  };
}

export async function runPipelineGroundingRetrieval(
  input: PipelineGroundingRetrievalInput
): Promise<PipelineGroundingRetrievalResult> {
  const result: PipelineGroundingRetrievalResult = {
    moduleContextsPatch: {},
    contextRetrieved: [],
    sourcesUsed: [],
    toolsUsed: [],
    requiredSourceFailures: [],
  };

  const inferredIntents = inferPipelineIntents(input.userMessage);
  const groundingIntents = inferredIntents.filter(
    (id) => getIntentDefinitionFromCatalog(input.catalog, id)?.groundingRequired === true
  );
  const optionalSourcesForInferred = optionalSourcesForInferredIntents(input.catalog, inferredIntents);

  const neededSources = new Set<string>();
  if (groundingIntents.length > 0) {
    for (const s of requiredSourcesForIntents(input.catalog, groundingIntents)) {
      neededSources.add(s);
    }
  }

  if (
    neededSources.has('location') &&
    isSourceEnabled(input.catalog, 'location') &&
    isToolEnabled(input.catalog, 'location')
  ) {
    const location = await resolveLocation(input.clientIp);
    if (location) {
      result.locationSummary = formatLocationSummary(location);
      result.contextRetrieved.push({
        source: 'location',
        provider: 'ip_geolocation',
        itemCount: 1,
      });
      result.sourcesUsed.push('location');
      result.toolsUsed.push({ name: 'location', round: 0, success: true });
    } else {
      result.toolsUsed.push({ name: 'location', round: 0, success: false });
    }
  }

  const moduleSourceCandidates = new Set<string>();
  const needsPlace =
    (neededSources.has('vssyl_place') || groundingIntents.includes('local_discovery')) &&
    isSourceEnabled(input.catalog, 'vssyl_place') &&
    isToolEnabled(input.catalog, 'place_search');

  if (needsPlace) {
    moduleSourceCandidates.add('vssyl_place');
  }
  if (neededSources.has('drive_files') && isSourceEnabled(input.catalog, 'drive_files')) {
    moduleSourceCandidates.add('drive_files');
  }
  if (neededSources.has('calendar') && isSourceEnabled(input.catalog, 'calendar')) {
    moduleSourceCandidates.add('calendar');
  }
  for (const sourceId of optionalSourcesForInferred) {
    if (isModuleBackedPipelineSource(sourceId) && isSourceEnabled(input.catalog, sourceId)) {
      moduleSourceCandidates.add(sourceId);
    }
  }

  const sourcesToFetch = [...moduleSourceCandidates].filter((sourceId) => {
    if (sourceId === 'vssyl_place' && moduleHasExistingContext(input.existingModuleContexts, 'place')) {
      return false;
    }
    if (sourceId === 'drive_files' && moduleHasExistingContext(input.existingModuleContexts, 'drive')) {
      return false;
    }
    if (sourceId === 'calendar' && moduleHasExistingContext(input.existingModuleContexts, 'calendar')) {
      return false;
    }
    return true;
  });

  if (sourcesToFetch.length > 0) {
    try {
      const orchestration = await orchestratePipelineModuleSources({
        userId: input.userId,
        query: input.userMessage,
        scope: {
          businessId: input.businessId,
          dashboardId: input.dashboardId,
          householdId: input.householdId,
          requestId: input.requestId,
        },
        existingModuleContexts: input.existingModuleContexts,
        sourceIds: sourcesToFetch,
      });

      result.contextOrchestration = orchestration.contextOrchestration;
      result.providerSelectionDiagnostics = orchestration.providerSelectionDiagnostics;
      result.staleContextWarnings = orchestration.staleContextWarnings;
      result.groundingSourceToProvider = orchestration.groundingSourceToProvider;
      if (orchestration.orchestrationSnapshot) {
        result.orchestrationSnapshot = orchestration.orchestrationSnapshot;
      }

      if (orchestration.requiredSourceFailures.length > 0) {
        result.requiredSourceFailures = [
          ...(result.requiredSourceFailures ?? []),
          ...orchestration.requiredSourceFailures,
        ];
      }

      for (const [moduleId, ctx] of Object.entries(orchestration.moduleContexts)) {
        if (moduleId.startsWith('_')) continue;
        if (typeof ctx !== 'object' || ctx === null) continue;
        result.moduleContextsPatch[moduleId] = mergeModuleContextPatch(
          input.existingModuleContexts,
          moduleId,
          ctx as Record<string, unknown>
        );
      }

      for (const audit of orchestration.providerFetchAudit) {
        if (audit.status === 'skipped') continue;

        const sourceId =
          orchestration.groundingSourceToProvider.find((g) => g.moduleId === audit.moduleId)
            ?.sourceId ?? audit.moduleId;

        if (audit.status === 'succeeded') {
          result.contextRetrieved.push({
            source: sourceId,
            provider: audit.providerName,
            itemCount: audit.resultStatus === 'miss' ? 0 : 1,
          });
          result.sourcesUsed.push(sourceId, audit.moduleId);
          const tool = toolForModuleSource(sourceId);
          if (tool) {
            result.toolsUsed.push({ name: tool, round: 0, success: true });
          }
        } else if (audit.status === 'failed') {
          const tool = toolForModuleSource(sourceId);
          if (tool) {
            result.toolsUsed.push({ name: tool, round: 0, success: false });
          }
          void logger.warn('Pipeline module source retrieval failed', {
            operation: 'pipeline_grounding_module_source',
            sourceId,
            moduleId: audit.moduleId,
            providerName: audit.providerName,
            failureReason: audit.failureReason,
          });
        }
      }

      for (const sourceId of sourcesToFetch) {
        if (sourceId === 'vssyl_place' && !result.sourcesUsed.includes('vssyl_place')) {
          if (moduleHasExistingContext(input.existingModuleContexts, 'place')) {
            result.contextRetrieved.push({
              source: 'vssyl_place',
              provider: 'place_discoveries',
              itemCount: 1,
            });
            result.sourcesUsed.push('vssyl_place', 'place');
          }
        }
        if (sourceId === 'drive_files' && !result.sourcesUsed.includes('drive_files')) {
          if (moduleHasExistingContext(input.existingModuleContexts, 'drive')) {
            result.contextRetrieved.push({
              source: 'drive_files',
              provider: 'recent_files',
              itemCount: 1,
            });
            result.sourcesUsed.push('drive_files', 'drive');
          }
        }
        if (sourceId === 'calendar' && !result.sourcesUsed.includes('calendar')) {
          if (moduleHasExistingContext(input.existingModuleContexts, 'calendar')) {
            result.contextRetrieved.push({
              source: 'calendar',
              provider: 'upcoming_events',
              itemCount: 1,
            });
            result.sourcesUsed.push('calendar');
          }
        }
      }
    } catch (error: unknown) {
      const failure = classifyProviderFailure(error);
      void logger.warn('Pipeline module source orchestration failed', {
        operation: 'pipeline_grounding_module_orchestration',
        error: { message: failure.message, code: failure.reason },
      });
      for (const sourceId of sourcesToFetch) {
        const tool = toolForModuleSource(sourceId);
        if (tool) {
          result.toolsUsed.push({ name: tool, round: 0, success: false });
        }
      }
    }
  } else {
    for (const sourceId of moduleSourceCandidates) {
      if (sourceId === 'vssyl_place' && moduleHasExistingContext(input.existingModuleContexts, 'place')) {
        result.contextRetrieved.push({
          source: 'vssyl_place',
          provider: 'place_discoveries',
          itemCount: 1,
        });
        result.sourcesUsed.push('vssyl_place', 'place');
        result.toolsUsed.push({ name: 'place_search', round: 0, success: true });
      }
      if (sourceId === 'drive_files' && moduleHasExistingContext(input.existingModuleContexts, 'drive')) {
        result.contextRetrieved.push({
          source: 'drive_files',
          provider: 'recent_files',
          itemCount: 1,
        });
        result.sourcesUsed.push('drive_files', 'drive');
      }
      if (sourceId === 'calendar' && moduleHasExistingContext(input.existingModuleContexts, 'calendar')) {
        result.contextRetrieved.push({
          source: 'calendar',
          provider: 'upcoming_events',
          itemCount: 1,
        });
        result.sourcesUsed.push('calendar');
      }
    }
  }

  if (neededSources.has('web_search') && isToolEnabled(input.catalog, 'web_search')) {
    result.toolsUsed.push({ name: 'web_search', round: 0, success: false });
  }

  const vlinkSignals = detectVLinkQuerySignals(input.userMessage, {
    intentBoost: inferredIntents.some((id) =>
      ['planning', 'workflow_action', 'business_operations', 'project_assistant'].includes(id)
    ),
  });
  const shouldFetchVLink =
    optionalSourcesForInferred.has('vlink') ||
    shouldPrioritizeVLinkContext(vlinkSignals) ||
    vlinkSignals.vlCodeReferenced;

  if (
    shouldFetchVLink &&
    isSourceEnabled(input.catalog, 'vlink') &&
    !input.existingVLinkPipelineContext
  ) {
    try {
      const vlinkContext = await fetchVLinkPipelineContext({
        userId: input.userId,
        query: input.userMessage,
        businessId: input.businessId,
        dashboardId: input.dashboardId,
        householdId: input.householdId,
        catalogEnabled: true,
        intentBoost: vlinkSignals.intentBoost,
      });
      result.vlinkPipelineContext = vlinkContext;
      result.contextRetrieved.push(...mapVLinkPipelineContextToRetrieved(vlinkContext));
      if (vlinkContext.vlinksUsed > 0) {
        result.sourcesUsed.push('vlink');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.warn('Pipeline vlink retrieval failed', {
        operation: 'pipeline_grounding_vlink',
        error: { message: err.message },
      });
    }
  } else if (input.existingVLinkPipelineContext) {
    result.vlinkPipelineContext = input.existingVLinkPipelineContext;
    result.contextRetrieved.push(
      ...mapVLinkPipelineContextToRetrieved(input.existingVLinkPipelineContext)
    );
    if (input.existingVLinkPipelineContext.vlinksUsed > 0) {
      result.sourcesUsed.push('vlink');
    }
  }

  const graphBundleSignals = detectGraphBundleQuerySignals(input.userMessage, {
    intentBoost: inferredIntents.some((id) =>
      ['planning', 'workflow_action', 'business_operations', 'project_assistant', 'technical_help'].includes(id)
    ),
  });
  const shouldFetchGraphBundle =
    optionalSourcesForInferred.has('graph_bundle') ||
    graphBundleSignals.graphBundleEligible ||
    graphBundleSignals.vlCodeReferenced;

  if (
    shouldFetchGraphBundle &&
    isSourceEnabled(input.catalog, 'graph_bundle') &&
    !input.existingGraphBundlePipelineContext
  ) {
    try {
      const graphBundleContext = await fetchGraphBundlePipelineContext({
        userId: input.userId,
        query: input.userMessage,
        businessId: input.businessId,
        dashboardId: input.dashboardId,
        householdId: input.householdId,
        catalogEnabled: true,
        intentBoost: graphBundleSignals.intentBoost,
      });
      result.graphBundlePipelineContext = graphBundleContext;
      result.contextRetrieved.push(...mapGraphBundlePipelineContextToRetrieved(graphBundleContext));
      if (graphBundleContext.bundlesUsed > 0) {
        result.sourcesUsed.push('graph_bundle');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.warn('Pipeline graph_bundle retrieval failed', {
        operation: 'pipeline_grounding_graph_bundle',
        error: { message: err.message },
      });
    }
  } else if (input.existingGraphBundlePipelineContext) {
    result.graphBundlePipelineContext = input.existingGraphBundlePipelineContext;
    result.contextRetrieved.push(
      ...mapGraphBundlePipelineContextToRetrieved(input.existingGraphBundlePipelineContext)
    );
    if (input.existingGraphBundlePipelineContext.bundlesUsed > 0) {
      result.sourcesUsed.push('graph_bundle');
    }
  }

  const retrievalHook = await runPipelineRetrievalDiscovery({
    userId: input.userId,
    userMessage: input.userMessage,
    inferredIntents,
    businessId: input.businessId,
    dashboardId: input.dashboardId,
    householdId: input.householdId,
  });

  if (retrievalHook?.retrievalDiscovery) {
    result.retrievalDiscovery = retrievalHook.retrievalDiscovery;
    if (retrievalHook.moduleContextPatch) {
      Object.assign(result.moduleContextsPatch, retrievalHook.moduleContextPatch);
    }
    if (retrievalHook.contextRetrieved) {
      result.contextRetrieved.push(retrievalHook.contextRetrieved);
    }
    if (retrievalHook.sourcesUsed) {
      result.sourcesUsed.push(...retrievalHook.sourcesUsed);
    }

    const bridgeConsumerIntent = resolveRetrievalConsumerIntent(
      inferredIntents,
      input.userMessage
    );
    if (
      bridgeConsumerIntent &&
      isRetrievalBundleBridgeEnabled(bridgeConsumerIntent) &&
      input.dashboardId
    ) {
      const tenantScope: TenantScope = {
        dashboardId: input.dashboardId,
        businessId: input.businessId ?? null,
        householdId: input.householdId ?? null,
        scope: input.businessId ? 'BUSINESS' : input.householdId ? 'HOUSEHOLD' : 'PERSONAL',
      };
      const baseGraphContext =
        result.graphBundlePipelineContext ?? emptyGraphBundlePipelineContext();
      const memoryForBridge = await memoryRetrievalService
        .retrieve({
          userId: input.userId,
          query: input.userMessage,
          businessId: input.businessId,
        })
        .then((r) => r.facts)
        .catch(() => undefined);

      const bridgeResult = enrichGraphBundlesFromRetrieval({
        graphBundleContext: baseGraphContext,
        retrievalDiscovery: retrievalHook.retrievalDiscovery,
        inferredIntents,
        tenantScope,
        userMessage: input.userMessage,
        userId: input.userId,
        memoryFacts: memoryForBridge,
      });
      result.graphBundlePipelineContext = bridgeResult.graphBundleContext;
      if (bridgeResult.graphBundleContext.knowledgeConvergenceApplied) {
        result.contextRetrieved.push({
          source: 'knowledge_neighborhood',
          provider: 'knowledge_convergence_engine',
          itemCount: bridgeResult.graphBundleContext.knowledgeNeighborhoods?.length ?? 0,
        });
        if (!result.sourcesUsed.includes('knowledge_neighborhood')) {
          result.sourcesUsed.push('knowledge_neighborhood');
        }
      }
      if (bridgeResult.enrichment?.enrichmentApplied) {
        result.contextRetrieved.push({
          source: 'graph_bundle',
          provider: 'retrieval_inference_bridge',
          itemCount: bridgeResult.enrichment.inferenceNodesAdded,
        });
        if (!result.sourcesUsed.includes('graph_bundle')) {
          result.sourcesUsed.push('graph_bundle');
        }
        result.sourcesUsed.push('retrieval_inference_bridge');
      }
    }
  }

  const reconcileConsumerIntent = resolveRetrievalConsumerIntent(
    inferredIntents,
    input.userMessage
  );
  if (isGroundingReconcileEnabled(reconcileConsumerIntent)) {
    const reconciled = reconcileGroundingArtifacts({
      consumerIntent: reconcileConsumerIntent,
      vlinkPipelineContext: result.vlinkPipelineContext,
      graphBundlePipelineContext: result.graphBundlePipelineContext,
      moduleContextsPatch: result.moduleContextsPatch,
      retrievalDiscovery: result.retrievalDiscovery,
    });
    result.vlinkPipelineContext = reconciled.vlinkPipelineContext;
    result.graphBundlePipelineContext = reconciled.graphBundlePipelineContext;
    result.retrievalDiscovery = reconciled.retrievalDiscovery;
    Object.assign(result.moduleContextsPatch, reconciled.moduleContextsPatch);
    result.groundingReconcileDiagnostics = reconciled.diagnostics;
  }

  result.evidenceSourceDiagnostics = buildPipelineEvidenceSourceDiagnostics({
    contextRetrieved: result.contextRetrieved,
    retrievalDiscovery: result.retrievalDiscovery,
  });

  const compositionConsumerIntent = resolveRetrievalConsumerIntent(
    inferredIntents,
    input.userMessage
  );
  const composedGraphContext = await ensureKnowledgeCompositionOnGraphContext(
    result.graphBundlePipelineContext,
    compositionConsumerIntent,
    {
      userId: input.userId,
      userMessage: input.userMessage,
      businessId: input.businessId,
    }
  );
  if (
    composedGraphContext?.knowledgeCompositionApplied &&
    composedGraphContext !== result.graphBundlePipelineContext
  ) {
    result.graphBundlePipelineContext = composedGraphContext;
    result.contextRetrieved.push({
      source: 'knowledge_bundle',
      provider: 'knowledge_composition_engine',
      itemCount: composedGraphContext.knowledgeBundles?.length ?? 0,
    });
    if (!result.sourcesUsed.includes('knowledge_bundle')) {
      result.sourcesUsed.push('knowledge_bundle');
    }
  }

  if (composedGraphContext?.knowledgeConvergenceApplied) {
    result.contextRetrieved.push({
      source: 'knowledge_neighborhood',
      provider: 'knowledge_convergence_engine',
      itemCount: composedGraphContext.knowledgeNeighborhoods?.length ?? 0,
    });
    if (!result.sourcesUsed.includes('knowledge_neighborhood')) {
      result.sourcesUsed.push('knowledge_neighborhood');
    }
  }

  const neighborhoodConsumerIntent = resolveRetrievalConsumerIntent(
    inferredIntents,
    input.userMessage
  );
  const neighborhoodPatch = buildNeighborhoodModuleContextPatch(
    neighborhoodConsumerIntent,
    result.graphBundlePipelineContext
  );
  if (neighborhoodPatch) {
    Object.assign(result.moduleContextsPatch, neighborhoodPatch);
  }

  return result;
}
