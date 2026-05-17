import { normalizeModuleId } from '../modules/moduleRegistry';
import type { PermissionSnapshot } from './types';

export interface ModulePermissionSource {
  id: string;
  permissions: string[];
}

/**
 * Build runtime permission snapshot from module permission lists.
 * Callers supply already-filtered module sets (no separate evaluation here).
 */
export function buildPermissionSnapshotFromModules(
  modules: ModulePermissionSource[]
): PermissionSnapshot {
  const snapshot: PermissionSnapshot = {};
  for (const mod of modules) {
    const id = normalizeModuleId(mod.id);
    const perms = mod.permissions?.length ? [...mod.permissions] : ['view'];
    snapshot[id] = perms;
  }
  return snapshot;
}

/**
 * Business configuration modulePermissions map (moduleId → granted names).
 */
export function buildPermissionSnapshotFromModulePermissions(
  modulePermissions: Record<string, string[]>,
  moduleIds: string[]
): PermissionSnapshot {
  const snapshot: PermissionSnapshot = {};
  for (const rawId of moduleIds) {
    const id = normalizeModuleId(rawId);
    const configured = modulePermissions[rawId] ?? modulePermissions[id];
    snapshot[id] = configured?.length ? [...configured] : ['view'];
  }
  return snapshot;
}

/** Personal / position-aware modules without business configuration. */
export function buildPersonalPermissionSnapshot(
  modules: ModulePermissionSource[]
): PermissionSnapshot {
  return buildPermissionSnapshotFromModules(modules);
}
