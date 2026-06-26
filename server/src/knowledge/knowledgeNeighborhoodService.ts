/**
 * Knowledge Neighborhood Service — Phase 1C canonical read path.
 * Retrieve neighborhoods, compose/converge when required, cache, diagnostics, bundle fallback.
 */

import type { GraphBundlePipelineContextResult } from '../ai/context/graphBundlePipelineContextService.js';
import type { RootRef, TenantScope } from '../context-graph/contextGraphTypes.js';
import type { AIRetrievalEvidence } from '../ai/retrieval/aiRetrievalTypes.js';
import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';
import type { RetrievedMemoryFact } from '../services/userMemoryFactService.js';
import { isKnowledgeCompositionEnabled } from './knowledgeCompositionConfig.js';
import { orchestrateKnowledgeBundle } from './knowledgeCompositionOrchestrator.js';
import { isKnowledgeConvergenceEnabled } from './knowledgeConvergenceConfig.js';
import { toKnowledgeCard, toKnowledgeCards, type KnowledgeCard } from './knowledgeCard.js';
import type {
  KnowledgeBundle,
  KnowledgeConsumerId,
  KnowledgeNeighborhood,
} from './knowledgeTypes.js';

const DEFAULT_CACHE_TTL_MS = 30_000;

interface NeighborhoodCacheEntry {
  neighborhoods: KnowledgeNeighborhood[];
  bundles: KnowledgeBundle[];
  cachedAt: number;
}

const neighborhoodCache = new Map<string, NeighborhoodCacheEntry>();

export interface KnowledgeNeighborhoodServiceDiagnostics {
  neighborhoodCount: number;
  neighborhoodSize: {
    entities: number;
    relationships: number;
    facts: number;
  };
  compositionAgeMs: number;
  knowledgeLevelDistribution: Record<string, number>;
  relationshipCount: number;
  factCount: number;
  consumerCompatibility: Array<{
    consumer: KnowledgeConsumerId;
    neighborhoodId: string;
    eligible: boolean;
  }>;
  cacheHit: boolean;
  bundlesRetained: number;
}

export interface RetrieveNeighborhoodsParams {
  userId: string;
  consumer: KnowledgeConsumerId;
  graphBundleContext?: GraphBundlePipelineContextResult;
  vlinkIdOrCode?: string;
  root?: RootRef;
  tenantScope?: TenantScope;
  retrievalEvidence?: AIRetrievalEvidence[];
  retrievalConsumerIntent?: AIRetrievalConsumerIntent;
  memoryFacts?: RetrievedMemoryFact[];
  options?: import('../context-graph/contextGraphTypes.js').BundleResolveOptions;
  skipCache?: boolean;
}

export interface RetrieveNeighborhoodsResult {
  neighborhoods: KnowledgeNeighborhood[];
  knowledgeCards: KnowledgeCard[];
  bundles: KnowledgeBundle[];
  diagnostics: KnowledgeNeighborhoodServiceDiagnostics;
  source: 'pipeline_context' | 'cache' | 'orchestrated';
  fallbackBundlesOnly: boolean;
}

function cacheKey(params: RetrieveNeighborhoodsParams): string | undefined {
  if (params.graphBundleContext?.knowledgeNeighborhoods?.length) {
    const ids = params.graphBundleContext.knowledgeNeighborhoods.map((n) => n.neighborhoodId).join(',');
    return `ctx:${params.userId}:${params.consumer}:${ids}`;
  }
  if (params.vlinkIdOrCode) {
    return `vl:${params.userId}:${params.consumer}:${params.vlinkIdOrCode}`;
  }
  if (params.root && params.tenantScope) {
    const rootKey =
      'kind' in params.root && params.root.kind === 'container'
        ? `container:${params.root.vlinkId}`
        : `entity:${(params.root as { moduleId: string; entityType: string; entityId: string }).moduleId}:${(params.root as { entityType: string }).entityType}:${(params.root as { entityId: string }).entityId}`;
    return `root:${params.userId}:${params.consumer}:${rootKey}:${params.tenantScope.dashboardId}`;
  }
  return undefined;
}

function readCache(key: string, ttlMs: number): NeighborhoodCacheEntry | undefined {
  const entry = neighborhoodCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > ttlMs) {
    neighborhoodCache.delete(key);
    return undefined;
  }
  return entry;
}

function writeCache(key: string, neighborhoods: KnowledgeNeighborhood[], bundles: KnowledgeBundle[]): void {
  neighborhoodCache.set(key, { neighborhoods, bundles, cachedAt: Date.now() });
}

export function clearNeighborhoodServiceCache(): void {
  neighborhoodCache.clear();
}

export function neighborhoodsFromGraphContext(
  graphContext: GraphBundlePipelineContextResult | undefined,
  consumer: KnowledgeConsumerId
): KnowledgeNeighborhood[] {
  if (!graphContext?.knowledgeNeighborhoods?.length) return [];
  if (!isKnowledgeConvergenceEnabled(consumer)) return [];
  return graphContext.knowledgeNeighborhoods.filter(
    (n) => n.consumer === consumer || consumer === 'ai_pipeline' || consumer === 'admin_diagnostic'
  );
}

export function buildNeighborhoodServiceDiagnostics(
  neighborhoods: KnowledgeNeighborhood[],
  consumer: KnowledgeConsumerId,
  options?: { cacheHit?: boolean; bundles?: KnowledgeBundle[] }
): KnowledgeNeighborhoodServiceDiagnostics {
  const now = Date.now();
  let entities = 0;
  let relationships = 0;
  let facts = 0;
  const knowledgeLevelDistribution: Record<string, number> = {};
  let compositionAgeMs = 0;

  for (const n of neighborhoods) {
    entities += n.entities.length;
    relationships += n.relationships.length;
    facts += n.facts.length;
    for (const [tier, count] of Object.entries(n.provenanceSummary.tiers)) {
      knowledgeLevelDistribution[tier] = (knowledgeLevelDistribution[tier] ?? 0) + count;
    }
    const composedAt = n.sourceBundles[0]?.composedAt ?? n.convergedAt;
    compositionAgeMs = Math.max(compositionAgeMs, now - Date.parse(composedAt));
  }

  return {
    neighborhoodCount: neighborhoods.length,
    neighborhoodSize: { entities, relationships, facts },
    compositionAgeMs,
    knowledgeLevelDistribution,
    relationshipCount: relationships,
    factCount: facts,
    consumerCompatibility: neighborhoods.map((n) => ({
      consumer,
      neighborhoodId: n.neighborhoodId,
      eligible: n.consumerEligibility.some((e) => e.consumer === consumer) || n.consumer === consumer,
    })),
    cacheHit: options?.cacheHit ?? false,
    bundlesRetained: options?.bundles?.length ?? neighborhoods.reduce((s, n) => s + n.sourceBundles.length, 0),
  };
}

export async function retrieveNeighborhoods(
  params: RetrieveNeighborhoodsParams
): Promise<RetrieveNeighborhoodsResult> {
  const key = cacheKey(params);
  if (key && !params.skipCache) {
    const cached = readCache(key, DEFAULT_CACHE_TTL_MS);
    if (cached) {
      const cards = toKnowledgeCards(cached.neighborhoods, { consumer: params.consumer });
      return {
        neighborhoods: cached.neighborhoods,
        knowledgeCards: cards,
        bundles: cached.bundles,
        diagnostics: buildNeighborhoodServiceDiagnostics(cached.neighborhoods, params.consumer, {
          cacheHit: true,
          bundles: cached.bundles,
        }),
        source: 'cache',
        fallbackBundlesOnly: false,
      };
    }
  }

  const fromContext = params.graphBundleContext
    ? neighborhoodsFromGraphContext(params.graphBundleContext, params.consumer)
    : [];

  if (fromContext.length > 0) {
    const bundles =
      params.graphBundleContext?.knowledgeBundles ??
      fromContext.flatMap((n) => n.sourceBundles);
    if (key) writeCache(key, fromContext, bundles);
    const cards = toKnowledgeCards(fromContext, { consumer: params.consumer });
    return {
      neighborhoods: fromContext,
      knowledgeCards: cards,
      bundles,
      diagnostics: buildNeighborhoodServiceDiagnostics(fromContext, params.consumer, { bundles }),
      source: 'pipeline_context',
      fallbackBundlesOnly: false,
    };
  }

  if (!isKnowledgeCompositionEnabled(params.consumer)) {
    return {
      neighborhoods: [],
      knowledgeCards: [],
      bundles: params.graphBundleContext?.knowledgeBundles ?? [],
      diagnostics: buildNeighborhoodServiceDiagnostics([], params.consumer),
      source: 'orchestrated',
      fallbackBundlesOnly: true,
    };
  }

  const orchestrated = await orchestrateKnowledgeBundle({
    userId: params.userId,
    consumer: params.consumer,
    vlinkIdOrCode: params.vlinkIdOrCode,
    root: params.root,
    tenantScope: params.tenantScope,
    retrievalEvidence: params.retrievalEvidence,
    retrievalConsumerIntent: params.retrievalConsumerIntent,
    memoryFacts: params.memoryFacts,
    converge: true,
    options: params.options,
  });

  const neighborhoods = orchestrated.knowledgeNeighborhoods ?? [];
  const bundles = orchestrated.knowledgeBundles;

  if (neighborhoods.length > 0 && key) {
    writeCache(key, neighborhoods, bundles);
  }

  const cards = toKnowledgeCards(neighborhoods, { consumer: params.consumer });

  return {
    neighborhoods,
    knowledgeCards: cards,
    bundles,
    diagnostics: buildNeighborhoodServiceDiagnostics(neighborhoods, params.consumer, { bundles }),
    source: 'orchestrated',
    fallbackBundlesOnly: neighborhoods.length === 0 && bundles.length > 0,
  };
}

export function isNeighborhoodReadEnabled(consumer?: KnowledgeConsumerId): boolean {
  return isKnowledgeCompositionEnabled(consumer) && isKnowledgeConvergenceEnabled(consumer);
}

export function resolvePipelineConsumerIntent(
  moduleContexts?: Record<string, unknown>
): string | undefined {
  if (!moduleContexts) return undefined;
  const discovery = moduleContexts._ai_retrieval_discovery;
  if (discovery && typeof discovery === 'object') {
    const intent = (discovery as Record<string, unknown>).intent;
    if (typeof intent === 'string') return intent;
  }
  return undefined;
}

export interface NeighborhoodAssemblyContent {
  contractVersion: string;
  cards: KnowledgeCard[];
  serviceDiagnostics: KnowledgeNeighborhoodServiceDiagnostics;
  bundlesRetainedForFallback: number;
}

export function buildNeighborhoodAssemblyContent(
  neighborhoods: KnowledgeNeighborhood[],
  consumer: KnowledgeConsumerId,
  bundles?: KnowledgeBundle[]
): NeighborhoodAssemblyContent {
  const cards = toKnowledgeCards(neighborhoods, { consumer });
  return {
    contractVersion: '1.0',
    cards,
    serviceDiagnostics: buildNeighborhoodServiceDiagnostics(neighborhoods, consumer, { bundles }),
    bundlesRetainedForFallback: bundles?.length ?? neighborhoods.reduce((s, n) => s + n.sourceBundles.length, 0),
  };
}
