/**
 * Knowledge Convergence Engine — Phase 1B.
 * Transforms composed Knowledge Bundles into unified Knowledge Neighborhoods.
 * Converge once; consume everywhere. Never silently overwrite authoritative knowledge.
 */

import type { EntityRef, RootRef } from '../context-graph/contextGraphTypes.js';
import { resolveEdgeConflicts } from './conflictDetector.js';
import { resolveConsumerEligibilityForElement } from './consumerEligibility.js';
import { convergeFacts, isAuthoritativeTier } from './factConvergence.js';
import {
  aggregateConvergenceDiagnostics,
  buildConvergenceDiagnosticsFromNeighborhood,
  computeKnowledgeDensity,
} from './knowledgeConvergenceDiagnostics.js';
import { resolveBundleTrustTier } from './trustResolver.js';
import type {
  KnowledgeBundle,
  KnowledgeConsumerId,
  KnowledgeConvergenceResult,
  KnowledgeNeighborhood,
  KnowledgeNeighborhoodType,
  KnowledgeTier,
} from './knowledgeTypes.js';
import { KNOWLEDGE_NEIGHBORHOOD_CONTRACT_VERSION, nodeKeyFromDescriptor } from './knowledgeTypes.js';

function inferNeighborhoodType(anchor: RootRef): KnowledgeNeighborhoodType {
  if ('kind' in anchor && anchor.kind === 'container') {
    return 'project';
  }
  const ref = anchor as EntityRef;
  if (ref.moduleId === 'place' && ref.entityType === 'listing') return 'place';
  if (ref.moduleId === 'hr' && ref.entityType === 'employee_profile') return 'person';
  if (ref.moduleId === 'business' && ref.entityType === 'business') return 'business';
  if (ref.moduleId === 'drive' && ref.entityType === 'file') return 'asset';
  if (ref.moduleId === 'place' && ref.entityType === 'meeting') return 'place';
  return 'entity';
}

function dedupeNodes<T extends { nodeKey: string }>(nodes: T[]): { deduped: T[]; removed: number } {
  const seen = new Set<string>();
  const deduped: T[] = [];
  let removed = 0;
  for (const node of nodes) {
    if (seen.has(node.nodeKey)) {
      removed++;
      continue;
    }
    seen.add(node.nodeKey);
    deduped.push(node);
  }
  return { deduped, removed };
}

function buildSummary(
  neighborhood: Pick<KnowledgeNeighborhood, 'entities' | 'relationships' | 'facts' | 'neighborhoodType'>
): KnowledgeNeighborhood['summary'] {
  const authoritativeEdgeCount = neighborhood.relationships.filter((e) =>
    isAuthoritativeTier(e.provenance.tier)
  ).length;
  const inferredEdgeCount = neighborhood.relationships.length - authoritativeEdgeCount;

  const typeLabel = neighborhood.neighborhoodType;
  const human = `${typeLabel} neighborhood: ${neighborhood.entities.length} entities, ${neighborhood.relationships.length} relationships, ${neighborhood.facts.length} facts (${authoritativeEdgeCount} authoritative links).`;

  return {
    human,
    nodeCount: neighborhood.entities.length,
    edgeCount: neighborhood.relationships.length,
    factCount: neighborhood.facts.length,
    authoritativeEdgeCount,
    inferredEdgeCount,
  };
}

function buildProvenanceSummary(
  neighborhood: Pick<KnowledgeNeighborhood, 'entities' | 'relationships' | 'facts'>
): KnowledgeNeighborhood['provenanceSummary'] {
  const origins: Record<string, number> = {};
  const tiers: Record<KnowledgeTier, number> = {
    L0: 0,
    L1: 0,
    L2: 0,
    L3: 0,
    L4: 0,
    L5: 0,
    L6: 0,
  };

  for (const node of neighborhood.entities) {
    origins[node.provenance.origin] = (origins[node.provenance.origin] ?? 0) + 1;
    tiers[node.provenance.tier]++;
  }
  for (const edge of neighborhood.relationships) {
    origins[edge.provenance.origin] = (origins[edge.provenance.origin] ?? 0) + 1;
    tiers[edge.provenance.tier]++;
  }
  for (const fact of neighborhood.facts) {
    origins[fact.provenance.origin] = (origins[fact.provenance.origin] ?? 0) + 1;
    tiers[fact.provenance.tier]++;
  }

  return { origins, tiers };
}

function buildHistory(
  neighborhood: Pick<KnowledgeNeighborhood, 'relationships' | 'facts'>
): KnowledgeNeighborhood['history'] {
  let verificationEvents = 0;
  let oldestAssertedAt: string | undefined;
  let newestVerifiedAt: string | undefined;

  const timestamps: string[] = [];
  for (const edge of neighborhood.relationships) {
    verificationEvents += edge.provenance.verificationHistory?.length ?? 0;
    timestamps.push(edge.provenance.assertedAt, edge.provenance.verifiedAt);
  }
  for (const fact of neighborhood.facts) {
    verificationEvents += fact.provenance.verificationHistory?.length ?? 0;
    timestamps.push(fact.provenance.assertedAt, fact.provenance.verifiedAt);
  }

  const sorted = timestamps.filter(Boolean).sort();
  if (sorted.length > 0) {
    oldestAssertedAt = sorted[0];
    newestVerifiedAt = sorted[sorted.length - 1];
  }

  return { verificationEvents, oldestAssertedAt, newestVerifiedAt };
}

/**
 * Converge a single Knowledge Bundle into a Knowledge Neighborhood.
 */
export function convergeKnowledgeNeighborhood(
  bundle: KnowledgeBundle,
  consumer: KnowledgeConsumerId,
  convergedAt?: string
): KnowledgeNeighborhood {
  const startMs = Date.now();
  const at = convergedAt ?? new Date().toISOString();
  const anchor = bundle.anchor ?? bundle.contextBundle.root;

  const { deduped: entities, removed: nodesRemoved } = dedupeNodes(bundle.nodes);
  const { edges: relationships, conflicts: edgeConflicts } = resolveEdgeConflicts(bundle.edges);

  const corroboratedEdges = bundle.edges.length - relationships.length;

  const { converged: facts, mergedCount, duplicateFactsRemoved } = convergeFacts(bundle.facts);

  const trustTier = resolveBundleTrustTier([
    ...entities.map((n) => n.provenance.tier),
    ...relationships.map((e) => e.provenance.tier),
    ...facts.map((f) => f.provenance.tier),
  ]);

  const eligibilityTier = trustTier === 'L5' ? 'L4' : trustTier;
  const consumerEligibility = resolveConsumerEligibilityForElement(eligibilityTier, consumer);

  const partial: Omit<KnowledgeNeighborhood, 'diagnostics'> = {
    neighborhoodId: `kn-${bundle.bundleId}`,
    version: KNOWLEDGE_NEIGHBORHOOD_CONTRACT_VERSION,
    convergedAt: at,
    anchor,
    anchorNodeKey: nodeKeyFromDescriptor(anchor),
    neighborhoodType: inferNeighborhoodType(anchor),
    consumer,
    facts,
    relationships,
    entities,
    activity: {
      recentActions: bundle.contextBundle.summaries.stats?.nodeCount ?? 0,
      source: 'context_bundle',
    },
    history: buildHistory({ relationships, facts }),
    summary: buildSummary({ entities, relationships, facts, neighborhoodType: inferNeighborhoodType(anchor) }),
    provenanceSummary: buildProvenanceSummary({ entities, relationships, facts }),
    consumerEligibility,
    sourceBundles: [bundle],
    trustTier,
  };

  partial.summary = buildSummary(partial);

  const durationMs = Date.now() - startMs;
  const diagnostics = buildConvergenceDiagnosticsFromNeighborhood({
    mergedFacts: mergedCount,
    duplicateFactsRemoved,
    corroboratedEdges,
    conflicts: [...bundle.diagnostics.conflicts, ...edgeConflicts],
    duplicateReduction: {
      nodes: nodesRemoved,
      edges: bundle.edges.length - relationships.length,
      facts: duplicateFactsRemoved,
    },
    knowledgeDensity: computeKnowledgeDensity(bundle),
    convergenceDurationMs: durationMs,
    entities: partial.entities,
    relationships: partial.relationships,
    facts: partial.facts,
  });

  return { ...partial, diagnostics };
}

/**
 * Converge multiple bundles — merges bundles sharing the same anchor into one neighborhood.
 */
export function convergeKnowledgeNeighborhoods(
  bundles: KnowledgeBundle[],
  consumer: KnowledgeConsumerId
): KnowledgeConvergenceResult {
  const startMs = Date.now();
  const byAnchor = new Map<string, KnowledgeBundle[]>();

  for (const bundle of bundles) {
    const anchor = bundle.anchor ?? bundle.contextBundle.root;
    const key = nodeKeyFromDescriptor(anchor);
    const group = byAnchor.get(key) ?? [];
    group.push(bundle);
    byAnchor.set(key, group);
  }

  const neighborhoods: KnowledgeNeighborhood[] = [];

  for (const group of byAnchor.values()) {
    if (group.length === 1) {
      neighborhoods.push(convergeKnowledgeNeighborhood(group[0], consumer));
      continue;
    }

    const mergedBundle: KnowledgeBundle = {
      ...group[0],
      nodes: group.flatMap((b) => b.nodes),
      edges: group.flatMap((b) => b.edges),
      facts: group.flatMap((b) => b.facts),
      diagnostics: {
        ...group[0].diagnostics,
        conflicts: group.flatMap((b) => b.diagnostics.conflicts),
      },
    };
    mergedBundle.metadata.trustTier = resolveBundleTrustTier(
      group.flatMap((b) => [
        ...b.nodes.map((n) => n.provenance.tier),
        ...b.edges.map((e) => e.provenance.tier),
        ...b.facts.map((f) => f.provenance.tier),
      ])
    );
    neighborhoods.push(convergeKnowledgeNeighborhood(mergedBundle, consumer));
  }

  const convergenceDurationMs = Date.now() - startMs;

  return {
    neighborhoods,
    aggregateDiagnostics: aggregateConvergenceDiagnostics(neighborhoods),
    convergenceDurationMs,
  };
}
