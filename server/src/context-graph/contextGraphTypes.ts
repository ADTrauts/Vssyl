/**
 * Context Graph federation types — read-only views; no SoR persistence.
 * @see docs/context-graph/CONTEXT_GRAPH_FEDERATION_CONTRACT.md
 */

export const CONTEXT_GRAPH_CONTRACT_VERSION = '1.0';

export const DEFAULT_NODE_BUDGET = 50;
export const DEFAULT_EDGE_BUDGET = 50;
export const DEFAULT_DEPTH = 1;
export const MAX_DEPTH = 2;
export const MAX_BATCH_HYDRATE = 25;

export type ContextGraphAccess = 'full' | 'restricted' | 'denied';

export type BundleKind =
  | 'vlink'
  | 'entity_neighborhood'
  | 'ai_session'
  | 'notebook_context'
  | 'resolved';

export interface EntityRef {
  moduleId: string;
  entityType: string;
  entityId: string;
}

export interface VLinkContainerRef {
  kind: 'container';
  containerType: 'vlink';
  vlinkId: string;
  publicCode?: string;
}

export type RootRef = EntityRef | VLinkContainerRef;

export interface NodePermissions {
  canRead: boolean;
  access: ContextGraphAccess;
  reason?: string;
}

export interface ContextGraphNode {
  moduleId: string;
  entityType: string;
  entityId: string;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  permissions: NodePermissions;
  display?: {
    subtitle?: string;
    icon?: string;
    url?: string;
  };
}

export interface NeighborEdge {
  edgeId: string;
  edgeType: string;
  relationshipClass: string;
  source: EntityRef | VLinkContainerRef;
  target: EntityRef;
  direction: 'outbound' | 'inbound' | 'undirected';
  grantsContentAccess: boolean;
  metadata?: Record<string, unknown>;
}

export interface AdapterContext {
  userId: string;
  dashboardId?: string;
  businessId?: string | null;
  householdId?: string | null;
}

export interface ContextGraphAdapter {
  readonly moduleId: string;
  readonly supportedEntityTypes: readonly string[];

  getNode(ctx: AdapterContext, ref: EntityRef): Promise<ContextGraphNode | null>;
  getNeighbors(ctx: AdapterContext, ref: EntityRef): Promise<NeighborEdge[]>;
  getPermissions(ctx: AdapterContext, ref: EntityRef): Promise<NodePermissions>;
  getSummary(ctx: AdapterContext, ref: EntityRef): Promise<string | null>;
}

export interface BundleResolveOptions {
  kind?: BundleKind;
  depth?: number;
  nodeBudget?: number;
  edgeBudget?: number;
  consumer?: 'ai_pipeline' | 'hub_ui' | 'api_client' | 'search' | 'admin_diagnostic';
}

export interface TenantScope {
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  scope: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
}

export interface ContextBundleNode {
  descriptor: EntityRef | VLinkContainerRef;
  display: {
    title: string;
    subtitle?: string;
    icon?: string;
    url?: string;
  };
  access: 'full' | 'restricted';
  role: 'root' | 'attachment' | 'neighbor';
  metadata?: Record<string, unknown>;
}

export interface ContextBundleEdge {
  edge: NeighborEdge;
  display?: { label?: string };
}

export interface ContextBundleDescriptor {
  bundleId: string;
  kind: BundleKind;
  version: typeof CONTEXT_GRAPH_CONTRACT_VERSION;
  createdAt: string;
  root: EntityRef | VLinkContainerRef;
  tenantScope: TenantScope;
  composition: {
    depthRequested: number;
    depthUsed: number;
    nodeBudgetRequested: number;
    nodeBudgetUsed: number;
    edgeBudgetRequested: number;
    edgeBudgetUsed: number;
    truncated: boolean;
    truncationReason?: 'node_budget' | 'depth_cap' | 'permission_omit';
    nodesOmitted: number;
  };
  nodes: ContextBundleNode[];
  edges: ContextBundleEdge[];
  summaries: {
    human?: string;
    ai?: string;
    stats: {
      nodeCount: number;
      edgeCount: number;
      restrictedNodeCount: number;
      omittedNodeCount: number;
    };
  };
  provenance: {
    sources: Array<{
      system: string;
      adapterId?: string;
      recordsRead: number;
      recordsUsed: number;
    }>;
    consumer: string;
  };
  permissionOutcome: {
    overall: 'full' | 'partial' | 'empty';
    gatesApplied: string[];
    restrictedNodes: number;
    omittedNodes: number;
  };
}

export function entityRefKey(ref: EntityRef): string {
  return `${ref.moduleId}:${ref.entityType}:${ref.entityId}`;
}

export function isVLinkContainerRef(root: RootRef): root is VLinkContainerRef {
  return 'kind' in root && root.kind === 'container';
}

export function isEntityRef(root: RootRef): root is EntityRef {
  return !isVLinkContainerRef(root);
}
