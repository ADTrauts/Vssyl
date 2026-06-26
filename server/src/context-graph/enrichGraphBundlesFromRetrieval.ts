import type { AIRetrievalDiscoverResult } from '../ai/retrieval/aiRetrievalTypes.js';
import { resolveRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalConsumerContract.js';
import type { PipelineIntentId } from '../ai/types/pipelineDiagnostics.js';
import { bundleToAiGroundingPayload } from './contextBundleAiContract.js';
import type { ContextBundleDescriptor, TenantScope } from './contextGraphTypes.js';
import { enrichBundlesWithRetrievalEvidence } from './retrievalBundleInferenceBridge.js';
import { isRetrievalBundleBridgeEnabled } from './retrievalBundleBridgeConfig.js';
import type { RetrievalBundleEnrichmentResult } from './retrievalInferenceTypes.js';
import type { GraphBundlePipelineContextResult } from '../ai/context/graphBundlePipelineContextService.js';
import { composePipelineKnowledgeBundles } from '../knowledge/knowledgeCompositionOrchestrator.js';
import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';

export function emptyGraphBundlePipelineContext(): GraphBundlePipelineContextResult {
  return {
    bundles: [],
    groundingPayloads: [],
    bundlesConsidered: 0,
    bundlesUsed: 0,
    totalNodes: 0,
    totalRestrictedNodes: 0,
    totalOmittedNodes: 0,
    estimatedTokens: 0,
    querySignals: {
      vlCodeReferenced: false,
      relationshipQuery: false,
      intentBoost: true,
    },
  };
}

export interface EnrichGraphBundlesFromRetrievalParams {
  graphBundleContext: GraphBundlePipelineContextResult;
  retrievalDiscovery: AIRetrievalDiscoverResult;
  inferredIntents: PipelineIntentId[];
  tenantScope: TenantScope;
  userMessage?: string;
  userId?: string;
  memoryFacts?: import('../services/userMemoryFactService.js').RetrievedMemoryFact[];
}

export interface EnrichGraphBundlesFromRetrievalResult {
  graphBundleContext: GraphBundlePipelineContextResult;
  enrichment?: RetrievalBundleEnrichmentResult;
}

function applyKnowledgeComposition(
  graphBundleContext: GraphBundlePipelineContextResult,
  consumerIntent?: AIRetrievalConsumerIntent,
  options?: {
    userId?: string;
    memoryFacts?: import('../services/userMemoryFactService.js').RetrievedMemoryFact[];
  }
): GraphBundlePipelineContextResult {
  const composed = composePipelineKnowledgeBundles({
    contextBundles: graphBundleContext.bundles,
    consumerIntent,
    userId: options?.userId,
    memoryFacts: options?.memoryFacts,
  });
  if (!composed.compositionApplied || !composed.knowledgeBundles) {
    return graphBundleContext;
  }
  return {
    ...graphBundleContext,
    knowledgeBundles: composed.knowledgeBundles,
    knowledgeCompositionDiagnostics: composed.compositionDiagnostics,
    knowledgeCompositionApplied: true,
    knowledgeNeighborhoods: composed.knowledgeNeighborhoods,
    knowledgeConvergenceDiagnostics: composed.convergenceDiagnostics,
    knowledgeConvergenceApplied: composed.convergenceApplied,
  };
}

function buildTenantScopeFromParams(params: EnrichGraphBundlesFromRetrievalParams): TenantScope {
  const fromBundle = params.graphBundleContext.bundles[0]?.tenantScope;
  if (fromBundle?.dashboardId) {
    return fromBundle;
  }
  return params.tenantScope;
}

/**
 * Pipeline hook: enrich graph bundle composition with retrieval inference (additive only).
 */
export function enrichGraphBundlesFromRetrieval(
  params: EnrichGraphBundlesFromRetrievalParams
): EnrichGraphBundlesFromRetrievalResult {
  const consumerIntent = resolveRetrievalConsumerIntent(
    params.inferredIntents,
    params.userMessage
  );
  const composeOptions = { userId: params.userId, memoryFacts: params.memoryFacts };

  if (!consumerIntent || !isRetrievalBundleBridgeEnabled(consumerIntent)) {
    return {
      graphBundleContext: applyKnowledgeComposition(
        params.graphBundleContext,
        consumerIntent,
        composeOptions
      ),
      enrichment: {
        bundles: params.graphBundleContext.bundles,
        enrichmentApplied: false,
        inferenceNodesAdded: 0,
        inferenceEdgesAdded: 0,
        skippedReason: 'bridge_disabled',
      },
    };
  }

  const tenantScope = buildTenantScopeFromParams(params);
  const enrichment = enrichBundlesWithRetrievalEvidence({
    bundles: params.graphBundleContext.bundles,
    evidence: params.retrievalDiscovery.evidence,
    consumerIntent,
    tenantScope,
  });

  if (!enrichment.enrichmentApplied) {
    return {
      graphBundleContext: applyKnowledgeComposition(
        params.graphBundleContext,
        consumerIntent,
        composeOptions
      ),
      enrichment,
    };
  }

  const groundingPayloads = enrichment.bundles.map((b) => bundleToAiGroundingPayload(b));
  let totalNodes = 0;
  let totalRestrictedNodes = 0;
  let totalOmittedNodes = 0;
  let estimatedTokens = 0;
  for (const bundle of enrichment.bundles) {
    totalNodes += bundle.nodes.length;
    totalRestrictedNodes += bundle.summaries.stats.restrictedNodeCount;
    totalOmittedNodes += bundle.composition.nodesOmitted;
    estimatedTokens += bundleToAiGroundingPayload(bundle).estimatedTokens;
  }

  return {
    graphBundleContext: applyKnowledgeComposition(
      {
        ...params.graphBundleContext,
        bundles: enrichment.bundles,
        groundingPayloads,
        bundlesUsed: enrichment.bundles.length,
        totalNodes,
        totalRestrictedNodes,
        totalOmittedNodes,
        estimatedTokens,
      },
      consumerIntent,
      composeOptions
    ),
    enrichment,
  };
}
