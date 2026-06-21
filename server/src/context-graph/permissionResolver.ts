import type { ContextGraphAccess, ContextGraphNode, NodePermissions } from './contextGraphTypes.js';

/** Fully denied nodes are omitted from bundles — no permission inheritance. */
export function shouldOmitNode(permissions: NodePermissions): boolean {
  return permissions.access === 'denied' || !permissions.canRead;
}

export function toBundleAccess(access: ContextGraphAccess): 'full' | 'restricted' | null {
  if (access === 'denied') return null;
  return access;
}

export function permissionsFromAccess(access: ContextGraphAccess, reason?: string): NodePermissions {
  if (access === 'denied') {
    return { canRead: false, access: 'denied', reason };
  }
  return {
    canRead: true,
    access,
    reason,
  };
}

export function trimNodesForBundle(nodes: ContextGraphNode[]): {
  included: ContextGraphNode[];
  omittedCount: number;
} {
  const included: ContextGraphNode[] = [];
  let omittedCount = 0;
  for (const node of nodes) {
    if (shouldOmitNode(node.permissions)) {
      omittedCount += 1;
      continue;
    }
    included.push(node);
  }
  return { included, omittedCount };
}
