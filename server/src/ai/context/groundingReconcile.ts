import type { AIRetrievalDiscoverResult, AIRetrievalEvidence } from '../retrieval/aiRetrievalTypes.js';
import type { GraphBundlePipelineContextResult } from './graphBundlePipelineContextService.js';
import type { VLinkPipelineContextResult } from './vlinkPipelineContextService.js';
import type { ContextBundleDescriptor, ContextBundleEdge, ContextBundleNode } from '../../context-graph/contextGraphTypes.js';
import { entityRefKey, isEntityRef } from '../../context-graph/contextGraphTypes.js';
import type { RetrievalInferenceProvenance } from '../../context-graph/retrievalInferenceTypes.js';

/** Source-of-truth tier — lower rank = higher authority. */
export const GROUNDING_SOURCE_PRIORITY = [
  'vlink_explicit',
  'graph_bundle_sor',
  'context_provider',
  'retrieval_evidence',
  'graph_bundle_inference',
] as const;

export type GroundingSourceTier = (typeof GROUNDING_SOURCE_PRIORITY)[number];

export interface GroundingReconcileDiagnostics {
  preReconcileCount: number;
  postReconcileCount: number;
  duplicateCount: number;
  sourcePriorityApplied: string[];
  provenanceMergedCount: number;
  skippedUnsafeMergeCount: number;
}

export interface GroundingReconcileInput {
  consumerIntent?: string;
  vlinkPipelineContext?: VLinkPipelineContextResult;
  graphBundlePipelineContext?: GraphBundlePipelineContextResult;
  moduleContextsPatch?: Record<string, unknown>;
  retrievalDiscovery?: AIRetrievalDiscoverResult;
}

export interface GroundingReconcileResult {
  vlinkPipelineContext?: VLinkPipelineContextResult;
  graphBundlePipelineContext?: GraphBundlePipelineContextResult;
  moduleContextsPatch: Record<string, unknown>;
  retrievalDiscovery?: AIRetrievalDiscoverResult;
  diagnostics: GroundingReconcileDiagnostics;
  applied: boolean;
}

export interface GroundingEntityRef {
  key: string;
  moduleId: string;
  entityType: string;
  entityId: string;
  tier: GroundingSourceTier;
  access?: 'full' | 'restricted';
}

/**
 * Feature flag: CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=true
 * Pilot scope: project_assistant only (Phase 1B).
 */
export function isGroundingReconcileEnabled(consumerIntent?: string): boolean {
  if (process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED !== 'true') {
    return false;
  }
  return consumerIntent === 'project_assistant';
}

export function toGroundingEntityKey(
  moduleId: string,
  entityType: string,
  entityId: string
): string {
  return `${moduleId}:${entityType}:${entityId}`.toLowerCase();
}

export function toVLinkContainerKey(vlinkId: string): string {
  return `vlink:container:${vlinkId}`.toLowerCase();
}

function tierRank(tier: GroundingSourceTier): number {
  return GROUNDING_SOURCE_PRIORITY.indexOf(tier);
}

function isInferenceNode(node: ContextBundleNode): boolean {
  const inference = node.metadata?.inference as RetrievalInferenceProvenance | undefined;
  return inference?.provenance === 'inference';
}

function isInferenceEdge(edge: ContextBundleEdge): boolean {
  return (
    edge.edge.relationshipClass === 'inference' ||
    (edge.edge.metadata?.inference as RetrievalInferenceProvenance | undefined)?.provenance ===
      'inference'
  );
}

function collectVLinkEntities(context?: VLinkPipelineContextResult): GroundingEntityRef[] {
  if (!context?.items?.length) return [];
  const refs: GroundingEntityRef[] = [];
  for (const item of context.items) {
    refs.push({
      key: toVLinkContainerKey(item.vlinkId),
      moduleId: 'vlink',
      entityType: 'container',
      entityId: item.vlinkId,
      tier: 'vlink_explicit',
    });
    for (const linked of item.linkedEntities) {
      refs.push({
        key: toGroundingEntityKey(linked.moduleId, linked.entityType, linked.entityId),
        moduleId: linked.moduleId,
        entityType: linked.entityType,
        entityId: linked.entityId,
        tier: 'vlink_explicit',
        access: linked.access,
      });
    }
  }
  return refs;
}

function collectGraphBundleEntities(
  context?: GraphBundlePipelineContextResult
): GroundingEntityRef[] {
  if (!context?.bundles?.length) return [];
  const refs: GroundingEntityRef[] = [];
  for (const bundle of context.bundles) {
    for (const node of bundle.nodes) {
      if ('moduleId' in node.descriptor) {
        refs.push({
          key: entityRefKey(node.descriptor).toLowerCase(),
          moduleId: node.descriptor.moduleId,
          entityType: node.descriptor.entityType,
          entityId: node.descriptor.entityId,
          tier: isInferenceNode(node) ? 'graph_bundle_inference' : 'graph_bundle_sor',
          access: node.access,
        });
      } else if (node.descriptor.kind === 'container') {
        refs.push({
          key: toVLinkContainerKey(node.descriptor.vlinkId),
          moduleId: 'vlink',
          entityType: 'container',
          entityId: node.descriptor.vlinkId,
          tier: isInferenceNode(node) ? 'graph_bundle_inference' : 'graph_bundle_sor',
          access: node.access,
        });
      }
    }
  }
  return refs;
}

function collectRetrievalEvidenceEntities(
  discovery?: AIRetrievalDiscoverResult
): GroundingEntityRef[] {
  if (!discovery?.evidence?.length) return [];
  return discovery.evidence.map((item) => ({
    key: toGroundingEntityKey(item.sourceModule, item.entityType, item.entityId),
    moduleId: item.sourceModule,
    entityType: item.entityType,
    entityId: item.entityId,
    tier: 'retrieval_evidence' as const,
    access: item.permissionsVerified ? 'full' : 'restricted',
  }));
}

function buildAuthorityIndex(refs: GroundingEntityRef[]): Map<string, GroundingEntityRef> {
  const index = new Map<string, GroundingEntityRef>();
  for (const ref of refs) {
    const existing = index.get(ref.key);
    if (!existing || tierRank(ref.tier) < tierRank(existing.tier)) {
      index.set(ref.key, ref);
    }
  }
  return index;
}

function hasAccessConflict(a: GroundingEntityRef, b: GroundingEntityRef): boolean {
  if (!a.access || !b.access) return false;
  return a.access !== b.access;
}

function shouldSuppressLowerTier(
  lower: GroundingEntityRef,
  authority: GroundingEntityRef,
  diagnostics: GroundingReconcileDiagnostics
): boolean {
  if (hasAccessConflict(lower, authority)) {
    diagnostics.skippedUnsafeMergeCount += 1;
    return false;
  }
  diagnostics.sourcePriorityApplied.push(`${lower.tier}->${authority.tier}:${lower.key}`);
  diagnostics.provenanceMergedCount += 1;
  return true;
}

function filterRetrievalEvidence(
  discovery: AIRetrievalDiscoverResult | undefined,
  authority: Map<string, GroundingEntityRef>,
  diagnostics: GroundingReconcileDiagnostics
): AIRetrievalDiscoverResult | undefined {
  if (!discovery) return undefined;
  const filtered: AIRetrievalEvidence[] = [];

  for (const item of discovery.evidence) {
    const key = toGroundingEntityKey(item.sourceModule, item.entityType, item.entityId);
    const winner = authority.get(key);
    const candidate: GroundingEntityRef = {
      key,
      moduleId: item.sourceModule,
      entityType: item.entityType,
      entityId: item.entityId,
      tier: 'retrieval_evidence',
      access: item.permissionsVerified ? 'full' : 'restricted',
    };

    if (!winner || tierRank(winner.tier) >= tierRank('retrieval_evidence')) {
      filtered.push(item);
      continue;
    }

    if (shouldSuppressLowerTier(candidate, winner, diagnostics)) {
      continue;
    }
    filtered.push(item);
  }

  if (filtered.length === discovery.evidence.length) {
    return discovery;
  }

  diagnostics.duplicateCount += discovery.evidence.length - filtered.length;

  return {
    ...discovery,
    evidence: filtered,
    diagnostics: {
      ...discovery.diagnostics,
      evidenceCount: filtered.length,
      resultsSelected: filtered.length,
    },
  };
}

function pruneGraphBundleContext(
  context: GraphBundlePipelineContextResult | undefined,
  authority: Map<string, GroundingEntityRef>,
  diagnostics: GroundingReconcileDiagnostics
): GraphBundlePipelineContextResult | undefined {
  if (!context?.bundles?.length) return context;

  const bundles: ContextBundleDescriptor[] = context.bundles.map((bundle) => {
    const keptNodes: ContextBundleNode[] = [];
    const keptNodeKeys = new Set<string>();

    for (const node of bundle.nodes) {
      if (!isInferenceNode(node)) {
        keptNodes.push(node);
        if ('moduleId' in node.descriptor) {
          keptNodeKeys.add(entityRefKey(node.descriptor).toLowerCase());
        }
        continue;
      }

      if (!('moduleId' in node.descriptor)) {
        keptNodes.push(node);
        continue;
      }

      const key = entityRefKey(node.descriptor).toLowerCase();
      const winner = authority.get(key);
      const candidate: GroundingEntityRef = {
        key,
        moduleId: node.descriptor.moduleId,
        entityType: node.descriptor.entityType,
        entityId: node.descriptor.entityId,
        tier: 'graph_bundle_inference',
        access: node.access,
      };

      if (
        winner &&
        tierRank(winner.tier) < tierRank('graph_bundle_inference') &&
        shouldSuppressLowerTier(candidate, winner, diagnostics)
      ) {
        diagnostics.duplicateCount += 1;
        continue;
      }

      keptNodes.push(node);
      keptNodeKeys.add(key);
    }

    const keptEdges = bundle.edges.filter((entry) => {
      if (!isInferenceEdge(entry)) return true;
      if (!isEntityRef(entry.edge.target)) return true;
      const targetKey = entityRefKey(entry.edge.target).toLowerCase();
      const winner = authority.get(targetKey);
      if (
        winner &&
        tierRank(winner.tier) < tierRank('graph_bundle_inference') &&
        !keptNodeKeys.has(targetKey)
      ) {
        diagnostics.duplicateCount += 1;
        diagnostics.sourcePriorityApplied.push(
          `graph_bundle_inference_edge->${winner.tier}:${targetKey}`
        );
        return false;
      }
      return true;
    });

    const restrictedNodeCount = keptNodes.filter((n) => n.access === 'restricted').length;
    return {
      ...bundle,
      nodes: keptNodes,
      edges: keptEdges,
      summaries: {
        ...bundle.summaries,
        stats: {
          nodeCount: keptNodes.length,
          edgeCount: keptEdges.length,
          restrictedNodeCount,
          omittedNodeCount: bundle.summaries.stats.omittedNodeCount,
        },
      },
    };
  });

  return {
    ...context,
    bundles,
    totalNodes: bundles.reduce((sum, b) => sum + b.nodes.length, 0),
  };
}

function patchModuleContextsRetrievalEvidence(
  moduleContextsPatch: Record<string, unknown>,
  filteredDiscovery?: AIRetrievalDiscoverResult
): Record<string, unknown> {
  const patch = { ...moduleContextsPatch };
  const existing = patch._ai_retrieval_discovery;
  if (!existing || typeof existing !== 'object' || !filteredDiscovery) {
    return patch;
  }

  const record = existing as Record<string, unknown>;
  patch._ai_retrieval_discovery = {
    ...record,
    evidence: filteredDiscovery.evidence,
    diagnostics: filteredDiscovery.diagnostics,
  };
  return patch;
}

/**
 * Deduplicate overlapping grounding artifacts while preserving provenance boundaries.
 * Authoritative sources (V_Link, federation SoR) outrank inference and retrieval evidence.
 */
export function reconcileGroundingArtifacts(
  input: GroundingReconcileInput
): GroundingReconcileResult {
  const diagnostics: GroundingReconcileDiagnostics = {
    preReconcileCount: 0,
    postReconcileCount: 0,
    duplicateCount: 0,
    sourcePriorityApplied: [],
    provenanceMergedCount: 0,
    skippedUnsafeMergeCount: 0,
  };

  const emptyResult: GroundingReconcileResult = {
    vlinkPipelineContext: input.vlinkPipelineContext,
    graphBundlePipelineContext: input.graphBundlePipelineContext,
    moduleContextsPatch: input.moduleContextsPatch ?? {},
    retrievalDiscovery: input.retrievalDiscovery,
    diagnostics,
    applied: false,
  };

  if (!isGroundingReconcileEnabled(input.consumerIntent)) {
    return emptyResult;
  }

  const vlinkRefs = collectVLinkEntities(input.vlinkPipelineContext);
  const bundleRefs = collectGraphBundleEntities(input.graphBundlePipelineContext);
  const evidenceRefs = collectRetrievalEvidenceEntities(input.retrievalDiscovery);

  const allRefs = [...vlinkRefs, ...bundleRefs, ...evidenceRefs];
  diagnostics.preReconcileCount = allRefs.length;

  const authority = buildAuthorityIndex([...vlinkRefs, ...bundleRefs]);

  const filteredDiscovery = filterRetrievalEvidence(
    input.retrievalDiscovery,
    authority,
    diagnostics
  );

  const prunedGraphBundle = pruneGraphBundleContext(
    input.graphBundlePipelineContext,
    authority,
    diagnostics
  );

  const moduleContextsPatch = patchModuleContextsRetrievalEvidence(
    input.moduleContextsPatch ?? {},
    filteredDiscovery
  );

  moduleContextsPatch._grounding_reconcile = diagnostics;

  diagnostics.postReconcileCount =
    collectVLinkEntities(input.vlinkPipelineContext).length +
    collectGraphBundleEntities(prunedGraphBundle).length +
    collectRetrievalEvidenceEntities(filteredDiscovery).length;

  const hasChanges =
    diagnostics.duplicateCount > 0 ||
    diagnostics.skippedUnsafeMergeCount > 0 ||
    diagnostics.provenanceMergedCount > 0 ||
    filteredDiscovery !== input.retrievalDiscovery ||
    prunedGraphBundle !== input.graphBundlePipelineContext;

  return {
    vlinkPipelineContext: input.vlinkPipelineContext,
    graphBundlePipelineContext: prunedGraphBundle,
    moduleContextsPatch,
    retrievalDiscovery: filteredDiscovery,
    diagnostics,
    applied: hasChanges || diagnostics.preReconcileCount > 0,
  };
}
