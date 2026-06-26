import type {
  KnowledgeBundle,
  KnowledgeConvergenceDiagnostics,
  KnowledgeConvergenceDiagnosticsAggregate,
  KnowledgeConfidence,
  KnowledgeNeighborhood,
  KnowledgeTier,
} from './knowledgeTypes.js';

export function aggregateConvergenceDiagnostics(
  neighborhoods: KnowledgeNeighborhood[]
): KnowledgeConvergenceDiagnosticsAggregate {
  let totalMergedFacts = 0;
  let totalDuplicateFactsRemoved = 0;
  let totalCorroboratedEdges = 0;
  let convergenceDurationMs = 0;

  for (const n of neighborhoods) {
    totalMergedFacts += n.diagnostics.mergedFacts;
    totalDuplicateFactsRemoved += n.diagnostics.duplicateFactsRemoved;
    totalCorroboratedEdges += n.diagnostics.corroboratedEdges;
    convergenceDurationMs += n.diagnostics.convergenceDurationMs;
  }

  return {
    neighborhoodsConverged: neighborhoods.length,
    totalMergedFacts,
    totalDuplicateFactsRemoved,
    totalCorroboratedEdges,
    consumer: neighborhoods[0]?.consumer ?? 'ai_pipeline',
    convergenceDurationMs,
  };
}

export function toOperatorConvergenceView(neighborhood: KnowledgeNeighborhood): Record<string, unknown> {
  return {
    neighborhoodId: neighborhood.neighborhoodId,
    anchorNodeKey: neighborhood.anchorNodeKey,
    neighborhoodType: neighborhood.neighborhoodType,
    consumer: neighborhood.consumer,
    trustTier: neighborhood.trustTier,
    summary: neighborhood.summary,
    diagnostics: neighborhood.diagnostics,
    provenanceSummary: neighborhood.provenanceSummary,
  };
}

function emptyTierCounts(): Record<KnowledgeTier, number> {
  return { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 };
}

function emptyConfidence(): Record<KnowledgeConfidence, number> {
  return { C1: 0, C2: 0, C3: 0, C4: 0 };
}

export function buildConvergenceDiagnosticsFromNeighborhood(
  params: Omit<KnowledgeConvergenceDiagnostics, 'tierCounts' | 'confidenceDistribution'> & {
    entities: KnowledgeNeighborhood['entities'];
    relationships: KnowledgeNeighborhood['relationships'];
    facts: KnowledgeNeighborhood['facts'];
  }
): KnowledgeConvergenceDiagnostics {
  const tierCounts = emptyTierCounts();
  const confidenceDistribution = emptyConfidence();

  for (const node of params.entities) {
    tierCounts[node.provenance.tier]++;
  }
  for (const edge of params.relationships) {
    tierCounts[edge.provenance.tier]++;
    confidenceDistribution[edge.confidence]++;
  }
  for (const fact of params.facts) {
    tierCounts[fact.provenance.tier]++;
    confidenceDistribution[fact.confidence]++;
  }

  return {
    ...params,
    tierCounts,
    confidenceDistribution,
  };
}

export function computeKnowledgeDensity(bundle: KnowledgeBundle): number {
  const nodes = bundle.nodes.length;
  const edges = bundle.edges.length;
  const facts = bundle.facts.length;
  if (nodes === 0) return 0;
  return Math.round(((edges + facts) / nodes) * 100) / 100;
}
