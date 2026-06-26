import type {
  ConflictRecord,
  KnowledgeBundle,
  KnowledgeBundleDiagnostics,
  KnowledgeCompositionDiagnosticsAggregate,
  KnowledgeConfidence,
  KnowledgeTier,
} from './knowledgeTypes.js';

function emptyTierCounts(): Record<KnowledgeTier, number> {
  return { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 };
}

function emptyConfidenceDistribution(): Record<KnowledgeConfidence, number> {
  return { C1: 0, C2: 0, C3: 0, C4: 0 };
}

export function buildBundleDiagnostics(params: {
  bundle: KnowledgeBundle;
  compositionDurationMs: number;
  conflicts?: ConflictRecord[];
  omittedUnauthorized?: number;
}): KnowledgeBundleDiagnostics {
  const tierCounts = emptyTierCounts();
  const confidenceDistribution = emptyConfidenceDistribution();
  const origins: Record<string, number> = {};
  const consumerEligibilitySummary: Record<string, number> = {};
  let completeEdges = 0;
  let incompleteEdges = 0;

  for (const node of params.bundle.nodes) {
    tierCounts[node.provenance.tier]++;
    origins[node.provenance.origin] = (origins[node.provenance.origin] ?? 0) + 1;
    for (const ce of node.consumerEligibility) {
      consumerEligibilitySummary[ce.consumer] = (consumerEligibilitySummary[ce.consumer] ?? 0) + 1;
    }
  }

  for (const edge of params.bundle.edges) {
    tierCounts[edge.provenance.tier]++;
    confidenceDistribution[edge.confidence]++;
    origins[edge.provenance.origin] = (origins[edge.provenance.origin] ?? 0) + 1;
    if (edge.provenance.tier && edge.provenance.origin) {
      completeEdges++;
    } else {
      incompleteEdges++;
    }
    for (const ce of edge.consumerEligibility) {
      consumerEligibilitySummary[ce.consumer] = (consumerEligibilitySummary[ce.consumer] ?? 0) + 1;
    }
  }

  for (const fact of params.bundle.facts) {
    tierCounts[fact.provenance.tier]++;
    confidenceDistribution[fact.confidence]++;
    origins[fact.provenance.origin] = (origins[fact.provenance.origin] ?? 0) + 1;
  }

  return {
    compositionSources: params.bundle.contextBundle.provenance.sources,
    tierCounts,
    confidenceDistribution,
    provenanceSummary: {
      origins,
      completeEdges,
      incompleteEdges,
    },
    consumerEligibilitySummary,
    bundleSize: {
      nodes: params.bundle.nodes.length,
      edges: params.bundle.edges.length,
      facts: params.bundle.facts.length,
    },
    compositionDurationMs: params.compositionDurationMs,
    conflicts: params.conflicts ?? [],
    omittedUnauthorized: params.omittedUnauthorized ?? params.bundle.contextBundle.composition.nodesOmitted,
  };
}

export function aggregateCompositionDiagnostics(
  bundles: KnowledgeBundle[],
  compositionDurationMs: number
): KnowledgeCompositionDiagnosticsAggregate {
  const tierCounts = emptyTierCounts();
  const confidenceDistribution = emptyConfidenceDistribution();
  const sourceMap = new Map<string, { system: string; recordsRead: number; recordsUsed: number }>();

  let totalNodes = 0;
  let totalEdges = 0;
  let totalFacts = 0;

  for (const bundle of bundles) {
    totalNodes += bundle.nodes.length;
    totalEdges += bundle.edges.length;
    totalFacts += bundle.facts.length;

    for (const [tier, count] of Object.entries(bundle.diagnostics.tierCounts) as [KnowledgeTier, number][]) {
      tierCounts[tier] += count;
    }
    for (const [conf, count] of Object.entries(bundle.diagnostics.confidenceDistribution) as [
      KnowledgeConfidence,
      number,
    ][]) {
      confidenceDistribution[conf] += count;
    }
    for (const source of bundle.diagnostics.compositionSources) {
      const existing = sourceMap.get(source.system);
      if (existing) {
        existing.recordsRead += source.recordsRead;
        existing.recordsUsed += source.recordsUsed;
      } else {
        sourceMap.set(source.system, {
          system: source.system,
          recordsRead: source.recordsRead,
          recordsUsed: source.recordsUsed,
        });
      }
    }
  }

  const consumer = bundles[0]?.metadata.consumer ?? 'ai_pipeline';

  return {
    bundlesComposed: bundles.length,
    totalNodes,
    totalEdges,
    totalFacts,
    tierCounts,
    confidenceDistribution,
    compositionSources: [...sourceMap.values()],
    consumer,
    compositionDurationMs,
  };
}

export function toOperatorDiagnosticsView(bundle: KnowledgeBundle): Record<string, unknown> {
  return {
    bundleId: bundle.bundleId,
    composedAt: bundle.composedAt,
    consumer: bundle.metadata.consumer,
    trustTier: bundle.metadata.trustTier,
    diagnostics: bundle.diagnostics,
    permissionOutcome: bundle.contextBundle.permissionOutcome,
    truncated: bundle.contextBundle.composition.truncated,
  };
}
