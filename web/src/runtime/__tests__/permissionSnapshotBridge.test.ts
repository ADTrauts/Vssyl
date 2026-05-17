import { describe, expect, it } from 'vitest';
import {
  buildPermissionSnapshotFromModulePermissions,
  buildPermissionSnapshotFromModules,
} from '../workspace/permissionSnapshotBridge';
import { buildWorkspaceRuntimeScopeKey } from '../workspace/workspaceRuntimeScopeKey';
import { filterModulesByPermissionSnapshot } from '../workspace/workspaceRuntimeHelpers';
import { getModuleDefinition } from '../modules/moduleRegistry';

describe('permissionSnapshotBridge', () => {
  it('builds snapshot from module permission lists', () => {
    const snapshot = buildPermissionSnapshotFromModules([
      { id: 'drive', permissions: ['view', 'upload'] },
    ]);
    expect(snapshot.drive).toEqual(['view', 'upload']);
  });

  it('builds snapshot from business modulePermissions map', () => {
    const snapshot = buildPermissionSnapshotFromModulePermissions(
      { hr: ['view', 'manage'] },
      ['hr']
    );
    expect(snapshot.hr).toEqual(['view', 'manage']);
  });

  it('defaults missing module permissions to view', () => {
    const snapshot = buildPermissionSnapshotFromModulePermissions({}, ['drive']);
    expect(snapshot.drive).toEqual(['view']);
  });
});

describe('buildWorkspaceRuntimeScopeKey', () => {
  it('changes when business id changes', () => {
    const a = buildWorkspaceRuntimeScopeKey({
      activeContextType: 'business',
      activeBusinessId: 'biz-1',
    });
    const b = buildWorkspaceRuntimeScopeKey({
      activeContextType: 'business',
      activeBusinessId: 'biz-2',
    });
    expect(a).not.toBe(b);
  });
});

describe('filterModulesByPermissionSnapshot', () => {
  it('filters modules missing required view permission', () => {
    const drive = getModuleDefinition('drive');
    expect(drive).toBeDefined();
    const filtered = filterModulesByPermissionSnapshot([drive!], { drive: [] });
    expect(filtered).toHaveLength(0);
  });
});
