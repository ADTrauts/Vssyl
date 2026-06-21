import { describe, expect, it } from 'vitest';
import {
  permissionsFromAccess,
  shouldOmitNode,
  toBundleAccess,
  trimNodesForBundle,
} from '../permissionResolver.js';
import type { ContextGraphNode } from '../contextGraphTypes.js';

function node(access: 'full' | 'restricted' | 'denied'): ContextGraphNode {
  return {
    moduleId: 'drive',
    entityType: 'file',
    entityId: 'f1',
    title: 'Test',
    permissions: permissionsFromAccess(access),
  };
}

describe('context graph permission resolver', () => {
  it('omits denied nodes', () => {
    expect(shouldOmitNode(permissionsFromAccess('denied'))).toBe(true);
    expect(shouldOmitNode(permissionsFromAccess('full'))).toBe(false);
    expect(shouldOmitNode(permissionsFromAccess('restricted'))).toBe(false);
  });

  it('maps bundle access — denied becomes null', () => {
    expect(toBundleAccess('full')).toBe('full');
    expect(toBundleAccess('restricted')).toBe('restricted');
    expect(toBundleAccess('denied')).toBeNull();
  });

  it('trimNodesForBundle omits denied only', () => {
    const { included, omittedCount } = trimNodesForBundle([
      node('full'),
      node('denied'),
      node('restricted'),
    ]);
    expect(included).toHaveLength(2);
    expect(omittedCount).toBe(1);
  });
});
