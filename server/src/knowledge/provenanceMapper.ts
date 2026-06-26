import type {
  ContextBundleDescriptor,
  ContextBundleEdge,
  ContextBundleNode,
  EntityRef,
  NeighborEdge,
} from '../context-graph/contextGraphTypes.js';
import type { RetrievalInferenceProvenance } from '../context-graph/retrievalInferenceTypes.js';
import { assignConfidence } from './confidenceAssigner.js';
import { resolveConsumerEligibilityForElement } from './consumerEligibility.js';
import { resolveTrust } from './trustResolver.js';
import type {
  KnowledgeEdge,
  KnowledgeNode,
  KnowledgeNodeProvenance,
  KnowledgeOrigin,
  KnowledgeProvenance,
  KnowledgeTier,
  ProvenanceActor,
} from './knowledgeTypes.js';
import { nodeKeyFromDescriptor, type KnowledgeConsumerId } from './knowledgeTypes.js';

const COMPOSE_SYSTEM_ACTOR: ProvenanceActor = {
  type: 'system',
  id: 'knowledge_composition_engine',
  displayName: 'Knowledge Composition Engine',
};

function isInferenceMetadata(metadata: Record<string, unknown> | undefined): boolean {
  return Boolean(metadata && typeof metadata.inference === 'object' && metadata.inference !== null);
}

function getInferenceProvenance(metadata: Record<string, unknown> | undefined): RetrievalInferenceProvenance | null {
  if (!metadata || !isInferenceMetadata(metadata)) return null;
  return metadata.inference as RetrievalInferenceProvenance;
}

function mapEdgeTier(edge: NeighborEdge): KnowledgeTier {
  const inference = getInferenceProvenance(edge.metadata);
  if (inference) {
    return inference.provenance === 'inference' ? 'L4' : 'L6';
  }
  if (edge.metadata?.suggestionPending === true || edge.edgeType === 'vlink.suggestion') {
    return 'L5';
  }
  if (edge.edgeType === 'retrieval_co_occurrence' || edge.relationshipClass === 'inference') {
    return 'L4';
  }
  if (edge.edgeType === 'vlink.attachment') {
    return 'L2';
  }
  if (edge.metadata?.partnerModuleId) {
    return 'L1';
  }
  return 'L2';
}

function mapEdgeOrigin(edge: NeighborEdge): KnowledgeOrigin {
  const inference = getInferenceProvenance(edge.metadata);
  if (inference) {
    return inference.source === 'ai_retrieval' ? 'retrieval_evidence' : 'ai_inference';
  }
  if (edge.edgeType === 'retrieval_co_occurrence' || edge.relationshipClass === 'inference') {
    return 'ai_inference';
  }
  if (edge.edgeType === 'vlink.attachment') {
    return 'vlink_manual';
  }
  if (edge.metadata?.partnerModuleId) {
    return 'partner_delegate';
  }
  return 'module_native';
}

function mapNodeTier(node: ContextBundleNode): KnowledgeTier {
  const inference = getInferenceProvenance(node.metadata);
  if (inference) {
    return inference.source === 'ai_retrieval' ? 'L6' : 'L4';
  }
  if ('kind' in node.descriptor && node.descriptor.kind === 'container') {
    return 'L2';
  }
  const ref = node.descriptor as EntityRef;
  if (ref.moduleId === 'vlink') {
    return 'L2';
  }
  if (node.metadata?.partnerModuleId) {
    return 'L1';
  }
  return 'L2';
}

function mapNodeOrigin(node: ContextBundleNode): KnowledgeOrigin {
  const inference = getInferenceProvenance(node.metadata);
  if (inference) {
    return inference.source === 'ai_retrieval' ? 'retrieval_evidence' : 'ai_inference';
  }
  if ('kind' in node.descriptor && node.descriptor.kind === 'container') {
    return 'vlink_manual';
  }
  const ref = node.descriptor as EntityRef;
  if (ref.moduleId === 'vlink') {
    return 'vlink_manual';
  }
  if (node.metadata?.partnerModuleId) {
    return 'partner_delegate';
  }
  return 'module_native';
}

function hydrateSourceForNode(node: ContextBundleNode): KnowledgeNodeProvenance['hydrateSource'] {
  const inference = getInferenceProvenance(node.metadata);
  if (inference) {
    return 'retrieval_inference';
  }
  if ('kind' in node.descriptor && node.descriptor.kind === 'container') {
    return 'vlink_resolver';
  }
  if (node.metadata?.partnerModuleId) {
    return 'partner_delegate';
  }
  return 'module_adapter';
}

function buildEdgeProvenance(
  edge: NeighborEdge,
  contextBundle: ContextBundleDescriptor,
  composedAt: string
): KnowledgeProvenance {
  const tier = mapEdgeTier(edge);
  const origin = mapEdgeOrigin(edge);
  const inference = getInferenceProvenance(edge.metadata);

  const actor: ProvenanceActor = inference
    ? { type: 'system', id: 'ai_retrieval', displayName: 'AI Retrieval' }
    : COMPOSE_SYSTEM_ACTOR;

  const sourceSystem =
    inference?.retrievalOrigin ??
    ('moduleId' in edge.source ? (edge.source as EntityRef).moduleId : 'vlink');

  return {
    tier,
    origin,
    assertedAt: inference?.timestamp ?? contextBundle.createdAt,
    verifiedAt: composedAt,
    actor,
    sourceSystem,
    relationshipSource: {
      relationshipClass: edge.relationshipClass,
      vlinkId:
        'kind' in edge.source && edge.source.kind === 'container'
          ? edge.source.vlinkId
          : undefined,
      vlinkEntityId: edge.edgeId.startsWith('inference:') ? undefined : edge.edgeId,
      evidenceRef: inference ? `retrieval:${edge.edgeId}` : undefined,
      retrievalConsumerId: inference?.consumerIntent,
    },
  };
}

export function mapContextNodeToKnowledgeNode(
  node: ContextBundleNode,
  contextBundle: ContextBundleDescriptor,
  consumer: KnowledgeConsumerId,
  composedAt: string
): KnowledgeNode {
  const tier = mapNodeTier(node);
  const origin = mapNodeOrigin(node);
  const nodeTier = tier === 'L5' ? 'L4' : tier;
  const authorized = node.access === 'full';

  let moduleId = 'vlink';
  let entityType = 'container';
  if ('moduleId' in node.descriptor) {
    moduleId = node.descriptor.moduleId;
    entityType = node.descriptor.entityType;
  }

  const provenance: KnowledgeNodeProvenance = {
    tier: nodeTier as KnowledgeNodeProvenance['tier'],
    origin,
    moduleId,
    entityType,
    hydratedAt: composedAt,
    hydrateSource: hydrateSourceForNode(node),
    delegateVersion:
      typeof node.metadata?.delegateVersion === 'string' ? node.metadata.delegateVersion : undefined,
  };

  return {
    nodeKey: nodeKeyFromDescriptor(node.descriptor),
    descriptor: node.descriptor,
    display: node.display,
    access: node.access,
    role: node.role,
    provenance,
    trust: resolveTrust(nodeTier, authorized),
    consumerEligibility: resolveConsumerEligibilityForElement(nodeTier, consumer),
    metadata: node.metadata,
  };
}

export function mapContextEdgeToKnowledgeEdge(
  bundleEdge: ContextBundleEdge,
  contextBundle: ContextBundleDescriptor,
  consumer: KnowledgeConsumerId,
  composedAt: string
): KnowledgeEdge | null {
  const edge = bundleEdge.edge;
  const tier = mapEdgeTier(edge);

  if (tier === 'L5') {
    return null;
  }

  const origin = mapEdgeOrigin(edge);
  const inference = getInferenceProvenance(edge.metadata);
  const provenance = buildEdgeProvenance(edge, contextBundle, composedAt);
  const confidence = assignConfidence({
    tier,
    origin,
    normalizedScore: inference?.confidence,
  });

  const fromKey =
    'kind' in edge.source && edge.source.kind === 'container'
      ? `vlink:container:${edge.source.vlinkId}`
      : nodeKeyFromDescriptor(edge.source as EntityRef);
  const toKey = nodeKeyFromDescriptor(edge.target);

  return {
    edgeId: edge.edgeId,
    from: fromKey,
    to: toKey,
    relationshipClass: edge.relationshipClass,
    edgeType: edge.edgeType,
    provenance,
    confidence,
    trust: resolveTrust(tier, true),
    consumerEligibility: resolveConsumerEligibilityForElement(tier, consumer),
    display: bundleEdge.display,
  };
}

export function aggregateCompositionSources(
  bundles: ContextBundleDescriptor[]
): Array<{ system: string; adapterId?: string; recordsRead: number; recordsUsed: number }> {
  const map = new Map<string, { system: string; adapterId?: string; recordsRead: number; recordsUsed: number }>();

  for (const bundle of bundles) {
    for (const source of bundle.provenance.sources) {
      const existing = map.get(source.system);
      if (existing) {
        existing.recordsRead += source.recordsRead;
        existing.recordsUsed += source.recordsUsed;
      } else {
        map.set(source.system, { ...source });
      }
    }
  }

  return [...map.values()];
}
