import { randomUUID } from 'crypto';
import { getAdapterForEntity } from './adapterRegistry.js';
import {
  listVLinkAttachmentEdges,
  resolveVLinkContainer,
} from './adapters/vlinkAdapter.js';
import {
  CONTEXT_GRAPH_CONTRACT_VERSION,
  DEFAULT_DEPTH,
  DEFAULT_EDGE_BUDGET,
  DEFAULT_NODE_BUDGET,
  MAX_DEPTH,
  type AdapterContext,
  type BundleKind,
  type BundleResolveOptions,
  type ContextBundleDescriptor,
  type ContextBundleEdge,
  type ContextBundleNode,
  type ContextGraphNode,
  type EntityRef,
  type NeighborEdge,
  type RootRef,
  type TenantScope,
  entityRefKey,
  isEntityRef,
  isVLinkContainerRef,
} from './contextGraphTypes.js';
import { shouldOmitNode, toBundleAccess } from './permissionResolver.js';

export interface BundleResolveInput {
  root: RootRef;
  ctx: AdapterContext;
  tenantScope: TenantScope;
  options?: BundleResolveOptions;
}

function graphNodeToBundleNode(
  node: ContextGraphNode,
  role: ContextBundleNode['role'],
  descriptor: EntityRef | { kind: 'container'; containerType: 'vlink'; vlinkId: string; publicCode?: string }
): ContextBundleNode | null {
  const access = toBundleAccess(node.permissions.access);
  if (!access) return null;

  return {
    descriptor,
    display: {
      title: node.title,
      subtitle: node.summary,
      url: node.display?.url,
      icon: node.display?.icon,
    },
    access,
    role,
    metadata: node.metadata,
  };
}

function buildSummaries(nodes: ContextBundleNode[], edges: ContextBundleEdge[]): ContextBundleDescriptor['summaries'] {
  const restrictedNodeCount = nodes.filter((n) => n.access === 'restricted').length;
  const titles = nodes
    .filter((n) => n.access === 'full')
    .map((n) => n.display.title)
    .slice(0, 10);

  const human = titles.length > 0 ? `Context bundle: ${titles.join(', ')}` : 'Empty context bundle';
  const ai =
    nodes.length > 0
      ? nodes
          .map((n) => `${n.display.title}${n.access === 'restricted' ? ' [restricted]' : ''}`)
          .join('; ')
      : 'No visible context';

  return {
    human: human.slice(0, 2048),
    ai: ai.slice(0, 4096),
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      restrictedNodeCount,
      omittedNodeCount: 0,
    },
  };
}

export async function resolveBundle(input: BundleResolveInput): Promise<ContextBundleDescriptor> {
  const depthRequested = Math.min(input.options?.depth ?? DEFAULT_DEPTH, MAX_DEPTH);
  const nodeBudgetRequested = input.options?.nodeBudget ?? DEFAULT_NODE_BUDGET;
  const edgeBudgetRequested = input.options?.edgeBudget ?? DEFAULT_EDGE_BUDGET;
  const kind: BundleKind = input.options?.kind ?? (isVLinkContainerRef(input.root) ? 'vlink' : 'resolved');

  const seenNodes = new Set<string>();
  const graphNodes: ContextGraphNode[] = [];
  const bundleNodes: ContextBundleNode[] = [];
  const edges: ContextBundleEdge[] = [];
  let omittedNodes = 0;
  let truncated = false;
  let truncationReason: ContextBundleDescriptor['composition']['truncationReason'];
  const provenanceMap = new Map<string, { recordsRead: number; recordsUsed: number }>();

  function trackProvenance(system: string, read: number, used: number): void {
    const existing = provenanceMap.get(system) ?? { recordsRead: 0, recordsUsed: 0 };
    provenanceMap.set(system, {
      recordsRead: existing.recordsRead + read,
      recordsUsed: existing.recordsUsed + used,
    });
  }

  function addGraphNode(node: ContextGraphNode, role: ContextBundleNode['role'], descriptor: ContextBundleNode['descriptor']): void {
    if (shouldOmitNode(node.permissions)) {
      omittedNodes += 1;
      return;
    }
    const key = entityRefKey({
      moduleId: node.moduleId,
      entityType: node.entityType,
      entityId: node.entityId,
    });
    if (seenNodes.has(key)) return;
    if (graphNodes.length >= nodeBudgetRequested) {
      truncated = true;
      truncationReason = 'node_budget';
      return;
    }
    seenNodes.add(key);
    graphNodes.push(node);
    const bundleNode = graphNodeToBundleNode(node, role, descriptor);
    if (bundleNode) {
      bundleNodes.push(bundleNode);
    }
  }

  function addEdge(edge: NeighborEdge, label?: string): void {
    if (edges.length >= edgeBudgetRequested) {
      truncated = true;
      truncationReason = 'node_budget';
      return;
    }
    edges.push({
      edge,
      display: label ? { label } : undefined,
    });
  }

  let depthUsed = 0;

  if (isVLinkContainerRef(input.root)) {
    trackProvenance('vlink', 1, 0);
    const resolved = await resolveVLinkContainer(input.ctx, input.root.vlinkId);
    if (!resolved) {
      omittedNodes += 1;
    } else {
      addGraphNode(resolved.node, 'root', resolved.container);
      trackProvenance('vlink', 0, 1);

      if (depthRequested >= 1) {
        depthUsed = 1;
        const attachmentEdges = await listVLinkAttachmentEdges(input.ctx, resolved.container.vlinkId);
        trackProvenance('vlink', attachmentEdges.length, 0);

        for (const edge of attachmentEdges) {
          if (!isEntityRef(edge.target)) continue;
          addEdge(edge, 'linked in vlink');

          const adapter = getAdapterForEntity(edge.target.moduleId, edge.target.entityType);
          let attachmentNode: ContextGraphNode | null = null;

          if (adapter) {
            trackProvenance(edge.target.moduleId, 1, 0);
            attachmentNode = await adapter.getNode(input.ctx, edge.target);
            if (attachmentNode) trackProvenance(edge.target.moduleId, 0, 1);
          }

          if (attachmentNode) {
            addGraphNode(attachmentNode, 'attachment', edge.target);
          }
        }
      }
    }
  } else if (isEntityRef(input.root)) {
    const adapter = getAdapterForEntity(input.root.moduleId, input.root.entityType);
    trackProvenance(input.root.moduleId, 1, 0);

    let rootNode: ContextGraphNode | null = null;
    if (adapter) {
      rootNode = await adapter.getNode(input.ctx, input.root);
      if (rootNode) trackProvenance(input.root.moduleId, 0, 1);
    }

    if (!rootNode) {
      omittedNodes += 1;
    } else {
      addGraphNode(rootNode, 'root', input.root);

      if (depthRequested >= 1) {
        depthUsed = 1;
        const neighborEdges = adapter ? await adapter.getNeighbors(input.ctx, input.root) : [];
        trackProvenance(input.root.moduleId, neighborEdges.length, 0);

        for (const edge of neighborEdges) {
          addEdge(edge);
          if (isEntityRef(edge.target)) {
            const targetAdapter = getAdapterForEntity(edge.target.moduleId, edge.target.entityType);
            if (targetAdapter) {
              const neighborNode = await targetAdapter.getNode(input.ctx, edge.target);
              if (neighborNode) {
                addGraphNode(neighborNode, 'neighbor', edge.target);
              }
            }
          }
        }
      }
    }
  }

  const restrictedNodes = bundleNodes.filter((n) => n.access === 'restricted').length;
  const overall =
    bundleNodes.length === 0
      ? 'empty'
      : restrictedNodes > 0
        ? 'partial'
        : 'full';

  const summaries = buildSummaries(bundleNodes, edges);
  summaries.stats.omittedNodeCount = omittedNodes;

  return {
    bundleId: randomUUID(),
    kind,
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: new Date().toISOString(),
    root: input.root,
    tenantScope: input.tenantScope,
    composition: {
      depthRequested,
      depthUsed,
      nodeBudgetRequested,
      nodeBudgetUsed: bundleNodes.length,
      edgeBudgetRequested,
      edgeBudgetUsed: edges.length,
      truncated,
      truncationReason,
      nodesOmitted: omittedNodes,
    },
    nodes: bundleNodes,
    edges,
    summaries,
    provenance: {
      sources: [...provenanceMap.entries()].map(([system, counts]) => ({
        system,
        adapterId: system,
        recordsRead: counts.recordsRead,
        recordsUsed: counts.recordsUsed,
      })),
      consumer: input.options?.consumer ?? 'api_client',
    },
    permissionOutcome: {
      overall,
      gatesApplied: ['tenant', 'vlink_membership', 'module_visibility', 'policy_engine'],
      restrictedNodes,
      omittedNodes,
    },
  };
}
