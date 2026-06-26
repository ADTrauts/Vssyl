/**
 * Knowledge Card — canonical presentation contract for Neighborhood UI/AI consumers.
 * Phase 1C: maps KnowledgeNeighborhood → portable read model without re-composition.
 */

import { filterElementsForConsumer, isTierEligibleForConsumer } from './consumerEligibility.js';
import type {
  ConvergedFact,
  KnowledgeConfidence,
  KnowledgeConsumerId,
  KnowledgeEdge,
  KnowledgeNeighborhood,
  KnowledgeNode,
  KnowledgeTier,
} from './knowledgeTypes.js';

export const KNOWLEDGE_CARD_CONTRACT_VERSION = '1.0';

export interface KnowledgeCardAnchor {
  nodeKey: string;
  title: string;
  subtitle?: string;
  neighborhoodType: KnowledgeNeighborhood['neighborhoodType'];
  trustTier: KnowledgeTier;
}

export interface KnowledgeCardRelationship {
  edgeId: string;
  from: string;
  to: string;
  relationshipClass: string;
  edgeType: string;
  label?: string;
  provenance: KnowledgeEdge['provenance'];
  confidence: KnowledgeConfidence;
  trust: KnowledgeEdge['trust'];
}

export interface KnowledgeCardFact {
  factId: string;
  content: string;
  provenance: ConvergedFact['provenance'];
  confidence: KnowledgeConfidence;
  corroborationCount: number;
  mergedFromFactIds: string[];
}

export interface KnowledgeCardSuggestedRelationship {
  edgeId: string;
  from: string;
  to: string;
  relationshipClass: string;
  edgeType: string;
  label?: string;
  provenance: KnowledgeEdge['provenance'];
  confidence: KnowledgeConfidence;
  reason: 'suggestion_pending' | 'l5_governance' | 'superseded_conflict';
}

export interface KnowledgeCardKnowledgeLevels {
  tiers: Record<KnowledgeTier, number>;
  confidence: Record<KnowledgeConfidence, number>;
  trustTier: KnowledgeTier;
}

export interface KnowledgeCardDiagnostics {
  neighborhoodSize: {
    entities: number;
    relationships: number;
    facts: number;
    suggestedRelationships: number;
  };
  compositionAgeMs: number;
  knowledgeDensity: number;
  consumerCompatibility: {
    consumer: KnowledgeConsumerId;
    eligible: boolean;
    allowedTiers: KnowledgeTier[];
  };
}

export interface KnowledgeCard {
  cardId: string;
  version: typeof KNOWLEDGE_CARD_CONTRACT_VERSION;
  neighborhoodId: string;
  convergedAt: string;
  summary: KnowledgeNeighborhood['summary'];
  anchor: KnowledgeCardAnchor;
  entities: KnowledgeNode[];
  relationships: KnowledgeCardRelationship[];
  facts: KnowledgeCardFact[];
  activity: KnowledgeNeighborhood['activity'];
  history: KnowledgeNeighborhood['history'];
  knowledgeLevels: KnowledgeCardKnowledgeLevels;
  provenance: KnowledgeNeighborhood['provenanceSummary'];
  suggestedRelationships: KnowledgeCardSuggestedRelationship[];
  diagnostics: KnowledgeCardDiagnostics;
}

export interface ToKnowledgeCardOptions {
  consumer: KnowledgeConsumerId;
  composedAt?: string;
  now?: number;
}

function resolveAnchorEntity(neighborhood: KnowledgeNeighborhood): KnowledgeCardAnchor {
  const anchorNode =
    neighborhood.entities.find((n) => n.nodeKey === neighborhood.anchorNodeKey) ??
    neighborhood.entities[0];
  return {
    nodeKey: neighborhood.anchorNodeKey,
    title: anchorNode?.display.title ?? neighborhood.anchorNodeKey,
    subtitle: anchorNode?.display.subtitle,
    neighborhoodType: neighborhood.neighborhoodType,
    trustTier: neighborhood.trustTier,
  };
}

function extractSuggestedRelationships(
  neighborhood: KnowledgeNeighborhood,
  consumer: KnowledgeConsumerId
): KnowledgeCardSuggestedRelationship[] {
  const includedEdgeIds = new Set(neighborhood.relationships.map((e) => e.edgeId));
  const suggested: KnowledgeCardSuggestedRelationship[] = [];

  for (const bundle of neighborhood.sourceBundles) {
    for (const edge of bundle.edges) {
      if (includedEdgeIds.has(edge.edgeId)) continue;
      const isSuggestion =
        edge.provenance.tier === 'L5' || edge.provenance.origin === 'suggestion_pending';
      if (!isSuggestion) continue;
      if (!isTierEligibleForConsumer(edge.provenance.tier, consumer) && edge.provenance.tier !== 'L5') {
        continue;
      }
      suggested.push({
        edgeId: edge.edgeId,
        from: edge.from,
        to: edge.to,
        relationshipClass: edge.relationshipClass,
        edgeType: edge.edgeType,
        label: edge.display?.label,
        provenance: edge.provenance,
        confidence: edge.confidence,
        reason:
          edge.provenance.origin === 'suggestion_pending' ? 'suggestion_pending' : 'l5_governance',
      });
    }

    for (const conflict of bundle.diagnostics.conflicts) {
      if (!conflict.nodeOrEdgeKey.startsWith('edge:')) continue;
      const edgeId = conflict.nodeOrEdgeKey.replace(/^edge:/, '');
      if (includedEdgeIds.has(edgeId)) continue;
      const loserEdge = bundle.edges.find((e) => e.edgeId === edgeId);
      if (!loserEdge) continue;
      if (suggested.some((s) => s.edgeId === edgeId)) continue;
      suggested.push({
        edgeId: loserEdge.edgeId,
        from: loserEdge.from,
        to: loserEdge.to,
        relationshipClass: loserEdge.relationshipClass,
        edgeType: loserEdge.edgeType,
        label: loserEdge.display?.label,
        provenance: loserEdge.provenance,
        confidence: loserEdge.confidence,
        reason: 'superseded_conflict',
      });
    }
  }

  return suggested;
}

function buildKnowledgeLevels(neighborhood: KnowledgeNeighborhood): KnowledgeCardKnowledgeLevels {
  return {
    tiers: { ...neighborhood.provenanceSummary.tiers },
    confidence: { ...neighborhood.diagnostics.confidenceDistribution },
    trustTier: neighborhood.trustTier,
  };
}

function buildCardDiagnostics(
  neighborhood: KnowledgeNeighborhood,
  consumer: KnowledgeConsumerId,
  suggestedCount: number,
  compositionAgeMs: number
): KnowledgeCardDiagnostics {
  const eligible = neighborhood.consumerEligibility.some((e) => e.consumer === consumer);
  const allowedTiers = neighborhood.consumerEligibility
    .filter((e) => e.consumer === consumer)
    .flatMap((e) => e.allowedTiers);

  return {
    neighborhoodSize: {
      entities: neighborhood.entities.length,
      relationships: neighborhood.relationships.length,
      facts: neighborhood.facts.length,
      suggestedRelationships: suggestedCount,
    },
    compositionAgeMs,
    knowledgeDensity: neighborhood.diagnostics.knowledgeDensity,
    consumerCompatibility: {
      consumer,
      eligible: eligible || consumer === neighborhood.consumer,
      allowedTiers: allowedTiers.length > 0 ? allowedTiers : ['L0', 'L1', 'L2', 'L3', 'L4', 'L6'],
    },
  };
}

export function toKnowledgeCard(
  neighborhood: KnowledgeNeighborhood,
  options: ToKnowledgeCardOptions
): KnowledgeCard {
  const composedAt =
    options.composedAt ??
    neighborhood.sourceBundles[0]?.composedAt ??
    neighborhood.convergedAt;
  const now = options.now ?? Date.now();
  const compositionAgeMs = Math.max(0, now - Date.parse(composedAt));

  const entities = filterElementsForConsumer(neighborhood.entities, options.consumer);
  const relationships = filterElementsForConsumer(neighborhood.relationships, options.consumer).map(
    (edge): KnowledgeCardRelationship => ({
      edgeId: edge.edgeId,
      from: edge.from,
      to: edge.to,
      relationshipClass: edge.relationshipClass,
      edgeType: edge.edgeType,
      label: edge.display?.label,
      provenance: edge.provenance,
      confidence: edge.confidence,
      trust: edge.trust,
    })
  );
  const facts = filterElementsForConsumer(neighborhood.facts, options.consumer).map(
    (fact): KnowledgeCardFact => ({
      factId: fact.factId,
      content: fact.content,
      provenance: fact.provenance,
      confidence: fact.confidence,
      corroborationCount: fact.corroborationCount,
      mergedFromFactIds: fact.mergedFromFactIds,
    })
  );
  const suggestedRelationships = extractSuggestedRelationships(neighborhood, options.consumer);

  return {
    cardId: `kc-${neighborhood.neighborhoodId}`,
    version: KNOWLEDGE_CARD_CONTRACT_VERSION,
    neighborhoodId: neighborhood.neighborhoodId,
    convergedAt: neighborhood.convergedAt,
    summary: neighborhood.summary,
    anchor: resolveAnchorEntity(neighborhood),
    entities,
    relationships,
    facts,
    activity: neighborhood.activity,
    history: neighborhood.history,
    knowledgeLevels: buildKnowledgeLevels(neighborhood),
    provenance: neighborhood.provenanceSummary,
    suggestedRelationships,
    diagnostics: buildCardDiagnostics(
      neighborhood,
      options.consumer,
      suggestedRelationships.length,
      compositionAgeMs
    ),
  };
}

export function toKnowledgeCards(
  neighborhoods: KnowledgeNeighborhood[],
  options: ToKnowledgeCardOptions
): KnowledgeCard[] {
  return neighborhoods.map((n) => toKnowledgeCard(n, options));
}
