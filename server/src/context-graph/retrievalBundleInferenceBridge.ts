import type { AIRetrievalEvidence, AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';
import {
  CONTEXT_GRAPH_CONTRACT_VERSION,
  type ContextBundleDescriptor,
  type ContextBundleEdge,
  type ContextBundleNode,
  type EntityRef,
  type NeighborEdge,
  type RootRef,
  type TenantScope,
  entityRefKey,
  isEntityRef,
} from './contextGraphTypes.js';
import {
  isRetrievalBundleBridgeEnabled,
  RETRIEVAL_INFERENCE_DEFAULT_CONFIDENCE,
  RETRIEVAL_INFERENCE_MIN_CONFIDENCE,
} from './retrievalBundleBridgeConfig.js';
import type { RetrievalBundleEnrichmentResult, RetrievalInferenceProvenance } from './retrievalInferenceTypes.js';

const INFERENCE_EDGE_TYPE = 'retrieval_co_occurrence';
const INFERENCE_RELATIONSHIP_CLASS = 'inference';

export function evidenceToEntityRef(evidence: AIRetrievalEvidence): EntityRef {
  return {
    moduleId: evidence.sourceModule,
    entityType: evidence.entityType,
    entityId: evidence.entityId,
  };
}

export function buildInferenceProvenance(
  evidence: AIRetrievalEvidence,
  consumerIntent: AIRetrievalConsumerIntent
): RetrievalInferenceProvenance {
  return {
    provenance: 'inference',
    source: 'ai_retrieval',
    retrievalOrigin: evidence.sourceModule,
    confidence: evidence.confidence ?? RETRIEVAL_INFERENCE_DEFAULT_CONFIDENCE,
    timestamp: evidence.retrievedAt,
    consumerIntent,
  };
}

export function isEvidenceEligibleForInference(evidence: AIRetrievalEvidence): boolean {
  if (!evidence.permissionsVerified) {
    return false;
  }
  if (!evidence.entityId || !evidence.sourceModule || !evidence.entityType) {
    return false;
  }
  const confidence = evidence.confidence ?? RETRIEVAL_INFERENCE_DEFAULT_CONFIDENCE;
  return confidence >= RETRIEVAL_INFERENCE_MIN_CONFIDENCE;
}

function collectExistingNodeKeys(bundles: ContextBundleDescriptor[]): Set<string> {
  const keys = new Set<string>();
  for (const bundle of bundles) {
    for (const node of bundle.nodes) {
      if ('moduleId' in node.descriptor) {
        keys.add(entityRefKey(node.descriptor));
      }
    }
  }
  return keys;
}

function resolveSessionAnchor(
  bundles: ContextBundleDescriptor[],
  topEvidence: AIRetrievalEvidence
): RootRef {
  if (bundles.length > 0) {
    return bundles[0].root;
  }
  return evidenceToEntityRef(topEvidence);
}

function buildInferenceNode(
  evidence: AIRetrievalEvidence,
  consumerIntent: AIRetrievalConsumerIntent
): ContextBundleNode {
  const ref = evidenceToEntityRef(evidence);
  const inference = buildInferenceProvenance(evidence, consumerIntent);

  return {
    descriptor: ref,
    display: {
      title: evidence.title,
      subtitle: evidence.summary,
      url: evidence.route.startsWith('/') ? evidence.route : `/${evidence.route}`,
    },
    access: 'full',
    role: 'neighbor',
    metadata: {
      inference,
      retrievalOnly: false,
    },
  };
}

function buildInferenceEdge(
  anchor: RootRef,
  target: EntityRef,
  evidence: AIRetrievalEvidence,
  consumerIntent: AIRetrievalConsumerIntent,
  index: number
): ContextBundleEdge {
  const inference = buildInferenceProvenance(evidence, consumerIntent);
  const source: EntityRef | import('./contextGraphTypes.js').VLinkContainerRef = isEntityRef(anchor)
    ? anchor
    : anchor;

  const edge: NeighborEdge = {
    edgeId: `inference:${entityRefKey(target)}:${index}`,
    edgeType: INFERENCE_EDGE_TYPE,
    relationshipClass: INFERENCE_RELATIONSHIP_CLASS,
    source,
    target,
    direction: 'outbound',
    grantsContentAccess: false,
    metadata: {
      inference,
      dashed: true,
    },
  };

  return {
    edge,
    display: { label: 'inferred via retrieval' },
  };
}

function appendInferenceProvenance(
  bundle: ContextBundleDescriptor,
  recordsRead: number,
  recordsUsed: number
): ContextBundleDescriptor['provenance'] {
  const sources = [...bundle.provenance.sources];
  const existing = sources.find((s) => s.system === 'ai_retrieval');
  if (existing) {
    existing.recordsRead += recordsRead;
    existing.recordsUsed += recordsUsed;
  } else {
    sources.push({
      system: 'ai_retrieval',
      adapterId: 'retrieval_inference_bridge',
      recordsRead,
      recordsUsed,
    });
  }
  return {
    ...bundle.provenance,
    sources,
  };
}

function createInferenceSessionBundle(params: {
  anchor: RootRef;
  nodes: ContextBundleNode[];
  edges: ContextBundleEdge[];
  tenantScope: TenantScope;
  consumerIntent: AIRetrievalConsumerIntent;
  evidenceRead: number;
}): ContextBundleDescriptor {
  const restrictedNodeCount = params.nodes.filter((n) => n.access === 'restricted').length;
  return {
    bundleId: `inference-session-${Date.now()}`,
    kind: 'ai_session',
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: new Date().toISOString(),
    root: params.anchor,
    tenantScope: params.tenantScope,
    composition: {
      depthRequested: 0,
      depthUsed: 0,
      nodeBudgetRequested: params.nodes.length,
      nodeBudgetUsed: params.nodes.length,
      edgeBudgetRequested: params.edges.length,
      edgeBudgetUsed: params.edges.length,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: params.nodes,
    edges: params.edges,
    summaries: {
      ai: params.nodes.map((n) => `${n.display.title} [inferred]`).join('; '),
      stats: {
        nodeCount: params.nodes.length,
        edgeCount: params.edges.length,
        restrictedNodeCount,
        omittedNodeCount: 0,
      },
    },
    provenance: {
      sources: [
        {
          system: 'ai_retrieval',
          adapterId: 'retrieval_inference_bridge',
          recordsRead: params.evidenceRead,
          recordsUsed: params.nodes.length,
        },
      ],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: params.nodes.length === 0 ? 'empty' : 'partial',
      gatesApplied: ['tenant', 'search_permissions', 'inference_only'],
      restrictedNodes: restrictedNodeCount,
      omittedNodes: 0,
    },
  };
}

/**
 * Additively enrich federation bundles with retrieval inference nodes and edges.
 * No persistence, no graph writes — inference provenance retained on every addition.
 */
export function enrichBundlesWithRetrievalEvidence(params: {
  bundles: ContextBundleDescriptor[];
  evidence: AIRetrievalEvidence[];
  consumerIntent: AIRetrievalConsumerIntent;
  tenantScope: TenantScope;
}): RetrievalBundleEnrichmentResult {
  if (!isRetrievalBundleBridgeEnabled(params.consumerIntent)) {
    return {
      bundles: params.bundles,
      enrichmentApplied: false,
      inferenceNodesAdded: 0,
      inferenceEdgesAdded: 0,
      skippedReason: 'bridge_disabled',
    };
  }

  const eligible = params.evidence.filter(isEvidenceEligibleForInference);
  if (eligible.length === 0) {
    return {
      bundles: params.bundles,
      enrichmentApplied: false,
      inferenceNodesAdded: 0,
      inferenceEdgesAdded: 0,
      skippedReason: 'no_eligible_evidence',
    };
  }

  const existingKeys = collectExistingNodeKeys(params.bundles);
  const anchor = resolveSessionAnchor(params.bundles, eligible[0]);
  const anchorKey = isEntityRef(anchor) ? entityRefKey(anchor) : `vlink:${anchor.vlinkId}`;

  const newNodes: ContextBundleNode[] = [];
  const newEdges: ContextBundleEdge[] = [];
  let edgeIndex = 0;

  for (const item of eligible) {
    const ref = evidenceToEntityRef(item);
    const key = entityRefKey(ref);
    if (existingKeys.has(key) || key === anchorKey) {
      continue;
    }
    existingKeys.add(key);
    newNodes.push(buildInferenceNode(item, params.consumerIntent));
    newEdges.push(buildInferenceEdge(anchor, ref, item, params.consumerIntent, edgeIndex));
    edgeIndex += 1;
  }

  if (newNodes.length === 0 && params.bundles.length > 0) {
    return {
      bundles: params.bundles,
      enrichmentApplied: false,
      inferenceNodesAdded: 0,
      inferenceEdgesAdded: 0,
      skippedReason: 'no_eligible_evidence',
    };
  }

  if (params.bundles.length === 0) {
    const anchor = evidenceToEntityRef(eligible[0]);
    const anchorKey = entityRefKey(anchor);
    const sessionNodes: ContextBundleNode[] = [];
    const sessionEdges: ContextBundleEdge[] = [];
    let sessionEdgeIndex = 0;

    for (const item of eligible) {
      const ref = evidenceToEntityRef(item);
      const key = entityRefKey(ref);
      const isRoot = key === anchorKey;
      sessionNodes.push({
        ...buildInferenceNode(item, params.consumerIntent),
        role: isRoot ? 'root' : 'neighbor',
      });
      if (!isRoot) {
        sessionEdges.push(
          buildInferenceEdge(anchor, ref, item, params.consumerIntent, sessionEdgeIndex)
        );
        sessionEdgeIndex += 1;
      }
    }

    const sessionBundle = createInferenceSessionBundle({
      anchor,
      nodes: sessionNodes,
      edges: sessionEdges,
      tenantScope: params.tenantScope,
      consumerIntent: params.consumerIntent,
      evidenceRead: params.evidence.length,
    });
    return {
      bundles: [sessionBundle],
      enrichmentApplied: true,
      inferenceNodesAdded: sessionNodes.length,
      inferenceEdgesAdded: sessionEdges.length,
    };
  }

  const enrichedBundles = params.bundles.map((bundle, bundleIndex) => {
    if (bundleIndex !== 0) {
      return bundle;
    }

    const nodes = [...bundle.nodes, ...newNodes];
    const edges = [...bundle.edges, ...newEdges];
    const restrictedNodeCount = nodes.filter((n) => n.access === 'restricted').length;

    return {
      ...bundle,
      nodes,
      edges,
      summaries: {
        ...bundle.summaries,
        stats: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          restrictedNodeCount,
          omittedNodeCount: bundle.summaries.stats.omittedNodeCount,
        },
      },
      provenance: appendInferenceProvenance(bundle, params.evidence.length, newNodes.length),
      permissionOutcome: {
        ...bundle.permissionOutcome,
        overall: 'partial' as const,
        gatesApplied: [...bundle.permissionOutcome.gatesApplied, 'inference_only'],
      },
    };
  });

  return {
    bundles: enrichedBundles,
    enrichmentApplied: true,
    inferenceNodesAdded: newNodes.length,
    inferenceEdgesAdded: newEdges.length,
  };
}
