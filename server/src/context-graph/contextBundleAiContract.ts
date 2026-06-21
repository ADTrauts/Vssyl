/**
 * Canonical AI-facing Context Bundle contract — read-only views for pipeline grounding.
 * @see docs/context-graph/CG_1D_CONTEXT_BUNDLE_SCHEMA.md
 */

import {
  CONTEXT_GRAPH_CONTRACT_VERSION,
  type ContextBundleDescriptor,
  type ContextBundleEdge,
  type ContextBundleNode,
  type EntityRef,
  type VLinkContainerRef,
} from './contextGraphTypes.js';

export const AI_PIPELINE_CONSUMER = 'ai_pipeline' as const;

export interface ContextBundleAiGroundingPayload {
  contractVersion: typeof CONTEXT_GRAPH_CONTRACT_VERSION;
  bundleId: string;
  kind: ContextBundleDescriptor['kind'];
  root: EntityRef | VLinkContainerRef;
  tenantScope: ContextBundleDescriptor['tenantScope'];
  nodes: Array<{
    descriptor: ContextBundleNode['descriptor'];
    title: string;
    access: ContextBundleNode['access'];
    role: ContextBundleNode['role'];
    moduleId?: string;
  }>;
  edges: Array<{
    edgeType: string;
    relationshipClass: string;
    direction: ContextBundleEdge['edge']['direction'];
    label?: string;
  }>;
  summaries: {
    ai?: string;
    stats: ContextBundleDescriptor['summaries']['stats'];
  };
  provenance: ContextBundleDescriptor['provenance'];
  permissionOutcome: ContextBundleDescriptor['permissionOutcome'];
  composition: Pick<
    ContextBundleDescriptor['composition'],
    'truncated' | 'truncationReason' | 'nodesOmitted'
  >;
  estimatedTokens: number;
}

export function estimateBundleTokenCount(bundle: ContextBundleDescriptor): number {
  const aiSummary = bundle.summaries.ai ?? '';
  const nodeTitles = bundle.nodes.map((n) => n.display.title).join(' ');
  const chars = aiSummary.length + nodeTitles.length + JSON.stringify(bundle.provenance.sources).length;
  return Math.ceil(chars / 4);
}

export function assertValidContextBundleForAi(bundle: ContextBundleDescriptor): void {
  if (bundle.version !== CONTEXT_GRAPH_CONTRACT_VERSION) {
    throw new Error(`Invalid bundle contract version: ${bundle.version}`);
  }
  if (!bundle.bundleId || !bundle.createdAt) {
    throw new Error('Bundle missing bundleId or createdAt');
  }
  if (!bundle.root) {
    throw new Error('Bundle missing root');
  }
  if (!bundle.tenantScope?.dashboardId) {
    throw new Error('Bundle missing tenantScope.dashboardId');
  }
  if (!bundle.provenance?.sources || !Array.isArray(bundle.provenance.sources)) {
    throw new Error('Bundle missing provenance.sources');
  }
  if (!bundle.permissionOutcome?.gatesApplied) {
    throw new Error('Bundle missing permissionOutcome');
  }
  if (!bundle.summaries?.stats) {
    throw new Error('Bundle missing summaries.stats');
  }
}

export function bundleToAiGroundingPayload(bundle: ContextBundleDescriptor): ContextBundleAiGroundingPayload {
  assertValidContextBundleForAi(bundle);

  return {
    contractVersion: bundle.version,
    bundleId: bundle.bundleId,
    kind: bundle.kind,
    root: bundle.root,
    tenantScope: bundle.tenantScope,
    nodes: bundle.nodes.map((node) => ({
      descriptor: node.descriptor,
      title: node.display.title,
      access: node.access,
      role: node.role,
      moduleId: 'moduleId' in node.descriptor ? node.descriptor.moduleId : 'vlink',
    })),
    edges: bundle.edges.map((entry) => ({
      edgeType: entry.edge.edgeType,
      relationshipClass: entry.edge.relationshipClass,
      direction: entry.edge.direction,
      label: entry.display?.label,
    })),
    summaries: {
      ai: bundle.summaries.ai,
      stats: bundle.summaries.stats,
    },
    provenance: {
      ...bundle.provenance,
      consumer: bundle.provenance.consumer || AI_PIPELINE_CONSUMER,
    },
    permissionOutcome: bundle.permissionOutcome,
    composition: {
      truncated: bundle.composition.truncated,
      truncationReason: bundle.composition.truncationReason,
      nodesOmitted: bundle.composition.nodesOmitted,
    },
    estimatedTokens: estimateBundleTokenCount(bundle),
  };
}
