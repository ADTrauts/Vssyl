/**
 * Connected Knowledge Platform — Phase 1A types.
 * Constitutional contract per KNOWLEDGE_CONSTITUTION.md and KNOWLEDGE_PROVENANCE_STANDARD.md.
 */

import type { ContextBundleDescriptor, EntityRef, RootRef, TenantScope } from '../context-graph/contextGraphTypes.js';

export const KNOWLEDGE_BUNDLE_CONTRACT_VERSION = '1.0';

export type KnowledgeTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export type KnowledgeConfidence = 'C1' | 'C2' | 'C3' | 'C4';

export type KnowledgeOrigin =
  | 'module_native'
  | 'vlink_manual'
  | 'vlink_ai_accepted'
  | 'user_memory_explicit'
  | 'user_memory_learned'
  | 'partner_delegate'
  | 'platform_registry'
  | 'ai_inference'
  | 'retrieval_evidence'
  | 'search_discovery'
  | 'suggestion_pending';

export type ProvenanceActorType = 'user' | 'system' | 'partner' | 'ai';

export interface ProvenanceActor {
  type: ProvenanceActorType;
  id: string;
  displayName?: string;
  modelId?: string;
  partnerModuleId?: string;
}

export interface RelationshipSourceDetail {
  relationshipClass: string;
  sorRef?: {
    store: 'module' | 'vlink' | 'partner' | 'memory';
    moduleId?: string;
    table?: string;
    recordId?: string;
  };
  vlinkId?: string;
  vlinkEntityId?: string;
  evidenceRef?: string;
  retrievalConsumerId?: string;
  searchProviderId?: string;
}

export interface VerificationEvent {
  at: string;
  action: 'created' | 'confirmed' | 'revalidated' | 'unlinked' | 'revoked' | 'restored';
  actor: ProvenanceActor;
  method: 'manual' | 'ai_accept' | 'ai_reject' | 'delegate' | 'lifecycle' | 'admin';
  note?: string;
}

export interface KnowledgeProvenance {
  tier: KnowledgeTier;
  origin: KnowledgeOrigin;
  assertedAt: string;
  verifiedAt: string;
  actor: ProvenanceActor;
  sourceSystem: string;
  relationshipSource?: RelationshipSourceDetail;
  verificationHistory?: VerificationEvent[];
}

export interface KnowledgeNodeProvenance {
  tier: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L6';
  origin: KnowledgeOrigin;
  moduleId: string;
  entityType: string;
  hydratedAt: string;
  hydrateSource: 'module_adapter' | 'vlink_resolver' | 'partner_delegate' | 'retrieval_inference';
  delegateVersion?: string;
}

export interface KnowledgeTrust {
  /** Authorization resolved at compose time. */
  authorized: boolean;
  /** Constitutional trust label derived from tier. */
  label: 'invariant' | 'delegated_authoritative' | 'authoritative' | 'governed' | 'contextual' | 'hypothesis';
  /** Freshness gate passed. */
  fresh: boolean;
}

export interface ConsumerEligibility {
  /** Consumer id that may read this element. */
  consumer: KnowledgeConsumerId;
  /** Tiers this consumer may use for this element. */
  allowedTiers: KnowledgeTier[];
  /** Whether disclosure is required (L4/L6). */
  requiresDisclosure: boolean;
}

export type KnowledgeConsumerId =
  | 'project_assistant'
  | 'planning'
  | 'business_operations'
  | 'local_discovery'
  | 'ai_pipeline'
  | 'hub_ui'
  | 'api_client'
  | 'search'
  | 'admin_diagnostic';

export interface KnowledgeNode {
  nodeKey: string;
  descriptor: EntityRef | import('../context-graph/contextGraphTypes.js').VLinkContainerRef;
  display: {
    title: string;
    subtitle?: string;
    icon?: string;
    url?: string;
  };
  access: 'full' | 'restricted';
  role: 'root' | 'attachment' | 'neighbor';
  provenance: KnowledgeNodeProvenance;
  trust: KnowledgeTrust;
  consumerEligibility: ConsumerEligibility[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEdge {
  edgeId: string;
  from: string;
  to: string;
  relationshipClass: string;
  edgeType: string;
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
  trust: KnowledgeTrust;
  consumerEligibility: ConsumerEligibility[];
  display?: { label?: string };
}

export interface KnowledgeFact {
  factId: string;
  content: string;
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
  trust: KnowledgeTrust;
  consumerEligibility: ConsumerEligibility[];
}

export interface KnowledgeBundleDiagnostics {
  compositionSources: Array<{
    system: string;
    adapterId?: string;
    recordsRead: number;
    recordsUsed: number;
  }>;
  tierCounts: Record<KnowledgeTier, number>;
  confidenceDistribution: Record<KnowledgeConfidence, number>;
  provenanceSummary: {
    origins: Record<string, number>;
    completeEdges: number;
    incompleteEdges: number;
  };
  consumerEligibilitySummary: Record<string, number>;
  bundleSize: {
    nodes: number;
    edges: number;
    facts: number;
  };
  compositionDurationMs: number;
  conflicts: ConflictRecord[];
  omittedUnauthorized: number;
}

export interface ConflictRecord {
  nodeOrEdgeKey: string;
  winnerTier: KnowledgeTier;
  loserTier: KnowledgeTier;
  reason: string;
}

export interface KnowledgeBundle {
  bundleId: string;
  version: typeof KNOWLEDGE_BUNDLE_CONTRACT_VERSION;
  composedAt: string;
  anchor?: RootRef;
  contextBundleId: string;
  kind: ContextBundleDescriptor['kind'];
  tenantScope: TenantScope;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  facts: KnowledgeFact[];
  /** Underlying Context Graph descriptor — retained for fallback consumers. */
  contextBundle: ContextBundleDescriptor;
  diagnostics: KnowledgeBundleDiagnostics;
  metadata: {
    consumer: KnowledgeConsumerId;
    trustTier: KnowledgeTier;
  };
}

export interface KnowledgeCompositionInput {
  contextBundles: ContextBundleDescriptor[];
  consumer: KnowledgeConsumerId;
  facts?: KnowledgeFact[];
  composedAt?: string;
}

export interface KnowledgeCompositionResult {
  bundles: KnowledgeBundle[];
  diagnostics: KnowledgeCompositionDiagnosticsAggregate;
  compositionDurationMs: number;
}

export interface KnowledgeCompositionDiagnosticsAggregate {
  bundlesComposed: number;
  totalNodes: number;
  totalEdges: number;
  totalFacts: number;
  tierCounts: Record<KnowledgeTier, number>;
  confidenceDistribution: Record<KnowledgeConfidence, number>;
  compositionSources: Array<{ system: string; recordsRead: number; recordsUsed: number }>;
  consumer: KnowledgeConsumerId;
  compositionDurationMs: number;
}

export function nodeKeyFromDescriptor(
  descriptor: EntityRef | import('../context-graph/contextGraphTypes.js').VLinkContainerRef
): string {
  if ('kind' in descriptor && descriptor.kind === 'container') {
    return `vlink:container:${descriptor.vlinkId}`;
  }
  const ref = descriptor as EntityRef;
  return `${ref.moduleId}:${ref.entityType}:${ref.entityId}`;
}

// --- Phase 1B: Knowledge Neighborhood & Convergence ---

export const KNOWLEDGE_NEIGHBORHOOD_CONTRACT_VERSION = '1.0';

export type KnowledgeNeighborhoodType =
  | 'project'
  | 'person'
  | 'business'
  | 'asset'
  | 'customer'
  | 'place'
  | 'entity';

export interface KnowledgeNeighborhoodActivity {
  recentActions: number;
  source: 'context_bundle' | 'none';
}

export interface KnowledgeNeighborhoodHistory {
  verificationEvents: number;
  oldestAssertedAt?: string;
  newestVerifiedAt?: string;
}

export interface KnowledgeNeighborhoodSummary {
  human: string;
  nodeCount: number;
  edgeCount: number;
  factCount: number;
  authoritativeEdgeCount: number;
  inferredEdgeCount: number;
}

export interface KnowledgeNeighborhoodProvenanceSummary {
  origins: Record<string, number>;
  tiers: Record<KnowledgeTier, number>;
}

export interface ConvergedFact extends KnowledgeFact {
  corroborationCount: number;
  mergedFromFactIds: string[];
  confidenceHistory: KnowledgeConfidence[];
}

export interface KnowledgeConvergenceDiagnostics {
  mergedFacts: number;
  duplicateFactsRemoved: number;
  corroboratedEdges: number;
  conflicts: ConflictRecord[];
  duplicateReduction: { nodes: number; edges: number; facts: number };
  knowledgeDensity: number;
  tierCounts: Record<KnowledgeTier, number>;
  confidenceDistribution: Record<KnowledgeConfidence, number>;
  convergenceDurationMs: number;
}

export interface KnowledgeNeighborhood {
  neighborhoodId: string;
  version: typeof KNOWLEDGE_NEIGHBORHOOD_CONTRACT_VERSION;
  convergedAt: string;
  anchor: RootRef;
  anchorNodeKey: string;
  neighborhoodType: KnowledgeNeighborhoodType;
  consumer: KnowledgeConsumerId;
  facts: ConvergedFact[];
  relationships: KnowledgeEdge[];
  entities: KnowledgeNode[];
  activity: KnowledgeNeighborhoodActivity;
  history: KnowledgeNeighborhoodHistory;
  summary: KnowledgeNeighborhoodSummary;
  provenanceSummary: KnowledgeNeighborhoodProvenanceSummary;
  consumerEligibility: ConsumerEligibility[];
  /** Source bundles retained for backward compatibility. */
  sourceBundles: KnowledgeBundle[];
  diagnostics: KnowledgeConvergenceDiagnostics;
  trustTier: KnowledgeTier;
}

export interface KnowledgeConvergenceResult {
  neighborhoods: KnowledgeNeighborhood[];
  aggregateDiagnostics: KnowledgeConvergenceDiagnosticsAggregate;
  convergenceDurationMs: number;
}

export interface KnowledgeConvergenceDiagnosticsAggregate {
  neighborhoodsConverged: number;
  totalMergedFacts: number;
  totalDuplicateFactsRemoved: number;
  totalCorroboratedEdges: number;
  consumer: KnowledgeConsumerId;
  convergenceDurationMs: number;
}
