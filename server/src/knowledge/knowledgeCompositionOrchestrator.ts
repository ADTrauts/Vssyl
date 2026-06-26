/**
 * Knowledge Composition Orchestrator — Context Graph orchestration layer.
 * Resolves context bundles then composes governed Knowledge Bundles.
 * Phase 1B: converges bundles into Knowledge Neighborhoods.
 * Context Graph MUST delegate composition here; consumers MUST NOT duplicate mapping logic.
 */

import { resolveContextBundle, resolveVLinkBundle } from '../context-graph/contextGraphOrchestrator.js';
import type { ContextBundleDescriptor, TenantScope } from '../context-graph/contextGraphTypes.js';
import { enrichBundlesWithRetrievalEvidence } from '../context-graph/retrievalBundleInferenceBridge.js';
import type { AIRetrievalEvidence } from '../ai/retrieval/aiRetrievalTypes.js';
import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';
import type { RetrievedMemoryFact } from '../services/userMemoryFactService.js';
import {
  isKnowledgeCompositionEnabled,
  mapRetrievalConsumerToKnowledgeConsumer,
} from './knowledgeCompositionConfig.js';
import { isKnowledgeConvergenceEnabled } from './knowledgeConvergenceConfig.js';
import { composeKnowledgeBundles } from './knowledgeComposer.js';
import { convergeKnowledgeNeighborhoods } from './knowledgeConvergenceEngine.js';
import { mapRetrievedMemoryFactsForCompose } from './memoryFactComposeHelper.js';
import type {
  KnowledgeBundle,
  KnowledgeCompositionDiagnosticsAggregate,
  KnowledgeCompositionResult,
  KnowledgeConvergenceDiagnosticsAggregate,
  KnowledgeConsumerId,
  KnowledgeFact,
  KnowledgeNeighborhood,
} from './knowledgeTypes.js';

export interface ComposeKnowledgeFromContextBundlesParams {
  contextBundles: ContextBundleDescriptor[];
  consumer: KnowledgeConsumerId;
  facts?: KnowledgeFact[];
}

export interface OrchestrateKnowledgeBundleParams {
  userId: string;
  vlinkIdOrCode?: string;
  root?: import('../context-graph/contextGraphTypes.js').RootRef;
  tenantScope?: TenantScope;
  consumer: KnowledgeConsumerId;
  options?: import('../context-graph/contextGraphTypes.js').BundleResolveOptions;
  retrievalEvidence?: AIRetrievalEvidence[];
  retrievalConsumerIntent?: AIRetrievalConsumerIntent;
  facts?: KnowledgeFact[];
  memoryFacts?: RetrievedMemoryFact[];
  converge?: boolean;
}

export interface OrchestrateKnowledgeBundleResult {
  knowledgeBundles: KnowledgeBundle[];
  knowledgeNeighborhoods?: KnowledgeNeighborhood[];
  contextBundles: ContextBundleDescriptor[];
  composition: KnowledgeCompositionResult;
  convergenceDiagnostics?: KnowledgeConvergenceDiagnosticsAggregate;
  fallbackUsed: boolean;
}

export function composeKnowledgeFromContextBundles(
  params: ComposeKnowledgeFromContextBundlesParams
): KnowledgeCompositionResult {
  return composeKnowledgeBundles({
    contextBundles: params.contextBundles,
    consumer: params.consumer,
    facts: params.facts,
  });
}

/**
 * Full orchestration: resolve context bundle(s) → optional retrieval enrichment → compose → optional converge.
 */
export async function orchestrateKnowledgeBundle(
  params: OrchestrateKnowledgeBundleParams
): Promise<OrchestrateKnowledgeBundleResult> {
  let contextBundles: ContextBundleDescriptor[] = [];

  if (params.vlinkIdOrCode) {
    const bundle = await resolveVLinkBundle({
      userId: params.userId,
      vlinkIdOrCode: params.vlinkIdOrCode,
      options: {
        ...params.options,
        consumer: params.options?.consumer ?? 'api_client',
      },
    });
    contextBundles = [bundle];
  } else if (params.root && params.tenantScope) {
    const bundle = await resolveContextBundle({
      userId: params.userId,
      root: params.root,
      tenantScope: params.tenantScope,
      options: params.options,
    });
    contextBundles = [bundle];
  }

  if (
    params.retrievalEvidence &&
    params.retrievalEvidence.length > 0 &&
    params.retrievalConsumerIntent &&
    params.tenantScope
  ) {
    const enrichment = enrichBundlesWithRetrievalEvidence({
      bundles: contextBundles,
      evidence: params.retrievalEvidence,
      consumerIntent: params.retrievalConsumerIntent,
      tenantScope: params.tenantScope,
    });
    contextBundles = enrichment.bundles;
  }

  const memoryKnowledgeFacts =
    params.memoryFacts && params.userId
      ? mapRetrievedMemoryFactsForCompose(
          params.memoryFacts,
          params.userId,
          params.consumer,
          new Date().toISOString()
        )
      : [];

  const allFacts = [...(params.facts ?? []), ...memoryKnowledgeFacts];

  const composition = composeKnowledgeFromContextBundles({
    contextBundles,
    consumer: params.consumer,
    facts: allFacts,
  });

  const shouldConverge =
    params.converge !== false && isKnowledgeConvergenceEnabled(params.consumer);

  let knowledgeNeighborhoods: KnowledgeNeighborhood[] | undefined;
  let convergenceDiagnostics: KnowledgeConvergenceDiagnosticsAggregate | undefined;

  if (shouldConverge && composition.bundles.length > 0) {
    const convergence = convergeKnowledgeNeighborhoods(composition.bundles, params.consumer);
    knowledgeNeighborhoods = convergence.neighborhoods;
    convergenceDiagnostics = convergence.aggregateDiagnostics;
  }

  return {
    knowledgeBundles: composition.bundles,
    knowledgeNeighborhoods,
    contextBundles,
    composition,
    convergenceDiagnostics,
    fallbackUsed: false,
  };
}

export interface ComposePipelineKnowledgeBundlesParams {
  contextBundles: ContextBundleDescriptor[];
  consumerIntent?: AIRetrievalConsumerIntent;
  facts?: KnowledgeFact[];
  memoryFacts?: RetrievedMemoryFact[];
  userId?: string;
}

export interface ComposePipelineKnowledgeBundlesResult {
  knowledgeBundles?: KnowledgeBundle[];
  knowledgeNeighborhoods?: KnowledgeNeighborhood[];
  compositionDiagnostics?: KnowledgeCompositionDiagnosticsAggregate;
  convergenceDiagnostics?: KnowledgeConvergenceDiagnosticsAggregate;
  compositionApplied: boolean;
  convergenceApplied: boolean;
}

/**
 * Pipeline hook: compose (+ converge) Knowledge for pilot consumers when feature flags enabled.
 * Returns undefined bundles when disabled — callers retain ContextBundleDescriptor fallback.
 */
export function composePipelineKnowledgeBundles(
  params: ComposePipelineKnowledgeBundlesParams
): ComposePipelineKnowledgeBundlesResult {
  const knowledgeConsumer =
    mapRetrievalConsumerToKnowledgeConsumer(params.consumerIntent) ?? 'ai_pipeline';

  if (!isKnowledgeCompositionEnabled(knowledgeConsumer)) {
    return { compositionApplied: false, convergenceApplied: false };
  }

  if (params.contextBundles.length === 0) {
    return { compositionApplied: false, convergenceApplied: false };
  }

  const composedAt = new Date().toISOString();
  const memoryKnowledgeFacts =
    params.memoryFacts && params.userId
      ? mapRetrievedMemoryFactsForCompose(
          params.memoryFacts,
          params.userId,
          knowledgeConsumer,
          composedAt
        )
      : [];

  const composition = composeKnowledgeFromContextBundles({
    contextBundles: params.contextBundles,
    consumer: knowledgeConsumer,
    facts: [...(params.facts ?? []), ...memoryKnowledgeFacts],
  });

  let knowledgeNeighborhoods: KnowledgeNeighborhood[] | undefined;
  let convergenceDiagnostics: KnowledgeConvergenceDiagnosticsAggregate | undefined;
  let convergenceApplied = false;

  if (isKnowledgeConvergenceEnabled(knowledgeConsumer) && composition.bundles.length > 0) {
    const convergence = convergeKnowledgeNeighborhoods(composition.bundles, knowledgeConsumer);
    knowledgeNeighborhoods = convergence.neighborhoods;
    convergenceDiagnostics = convergence.aggregateDiagnostics;
    convergenceApplied = true;
  }

  return {
    knowledgeBundles: composition.bundles,
    knowledgeNeighborhoods,
    compositionDiagnostics: composition.diagnostics,
    convergenceDiagnostics,
    compositionApplied: true,
    convergenceApplied,
  };
}
