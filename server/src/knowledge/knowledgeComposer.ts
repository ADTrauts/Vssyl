import type { ContextBundleDescriptor } from '../context-graph/contextGraphTypes.js';
import { resolveEdgeConflicts } from './conflictDetector.js';
import { isTierEligibleForConsumer } from './consumerEligibility.js';
import { buildBundleDiagnostics } from './knowledgeCompositionDiagnostics.js';
import {
  aggregateCompositionSources,
  mapContextEdgeToKnowledgeEdge,
  mapContextNodeToKnowledgeNode,
} from './provenanceMapper.js';
import { resolveBundleTrustTier } from './trustResolver.js';
import type {
  KnowledgeBundle,
  KnowledgeCompositionInput,
  KnowledgeCompositionResult,
  KnowledgeFact,
  KnowledgeTier,
} from './knowledgeTypes.js';
import { KNOWLEDGE_BUNDLE_CONTRACT_VERSION } from './knowledgeTypes.js';
import { aggregateCompositionDiagnostics } from './knowledgeCompositionDiagnostics.js';

function composeSingleBundle(
  contextBundle: ContextBundleDescriptor,
  consumer: KnowledgeCompositionInput['consumer'],
  facts: KnowledgeFact[],
  composedAt: string,
  startMs: number
): KnowledgeBundle {
  const knowledgeNodes = contextBundle.nodes.map((node) =>
    mapContextNodeToKnowledgeNode(node, contextBundle, consumer, composedAt)
  );

  const mappedEdges = contextBundle.edges
    .map((edge) => mapContextEdgeToKnowledgeEdge(edge, contextBundle, consumer, composedAt))
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  const { edges: resolvedEdges, conflicts } = resolveEdgeConflicts(mappedEdges);

  const filteredNodes = knowledgeNodes.filter((n) =>
    isTierEligibleForConsumer(n.provenance.tier, consumer)
  );

  const filteredEdges = resolvedEdges.filter((e) =>
    isTierEligibleForConsumer(e.provenance.tier, consumer)
  );

  const bundleFacts = facts.filter((f) => isTierEligibleForConsumer(f.provenance.tier, consumer));

  const allTiers: KnowledgeTier[] = [
    ...filteredNodes.map((n) => n.provenance.tier),
    ...filteredEdges.map((e) => e.provenance.tier),
    ...bundleFacts.map((f) => f.provenance.tier),
  ];

  const durationMs = Date.now() - startMs;

  const partialBundle: KnowledgeBundle = {
    bundleId: `kb-${contextBundle.bundleId}`,
    version: KNOWLEDGE_BUNDLE_CONTRACT_VERSION,
    composedAt,
    anchor: contextBundle.root,
    contextBundleId: contextBundle.bundleId,
    kind: contextBundle.kind,
    tenantScope: contextBundle.tenantScope,
    nodes: filteredNodes,
    edges: filteredEdges,
    facts: bundleFacts,
    contextBundle,
    diagnostics: {
      compositionSources: contextBundle.provenance.sources,
      tierCounts: { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 },
      confidenceDistribution: { C1: 0, C2: 0, C3: 0, C4: 0 },
      provenanceSummary: { origins: {}, completeEdges: 0, incompleteEdges: 0 },
      consumerEligibilitySummary: {},
      bundleSize: { nodes: 0, edges: 0, facts: 0 },
      compositionDurationMs: durationMs,
      conflicts: [],
      omittedUnauthorized: contextBundle.composition.nodesOmitted,
    },
    metadata: {
      consumer,
      trustTier: resolveBundleTrustTier(allTiers),
    },
  };

  partialBundle.diagnostics = buildBundleDiagnostics({
    bundle: partialBundle,
    compositionDurationMs: durationMs,
    conflicts,
    omittedUnauthorized: contextBundle.composition.nodesOmitted,
  });

  return partialBundle;
}

/**
 * Canonical Knowledge Composition Engine — transforms Context Graph bundles into governed Knowledge Bundles.
 * Single compose path; consumers must not independently assemble provenance.
 */
export function composeKnowledgeBundles(input: KnowledgeCompositionInput): KnowledgeCompositionResult {
  const startMs = Date.now();
  const composedAt = input.composedAt ?? new Date().toISOString();
  const facts = input.facts ?? [];

  const bundles = input.contextBundles.map((contextBundle) =>
    composeSingleBundle(contextBundle, input.consumer, facts, composedAt, startMs)
  );

  const compositionDurationMs = Date.now() - startMs;

  return {
    bundles,
    diagnostics: aggregateCompositionDiagnostics(bundles, compositionDurationMs),
    compositionDurationMs,
  };
}

export { aggregateCompositionSources };
