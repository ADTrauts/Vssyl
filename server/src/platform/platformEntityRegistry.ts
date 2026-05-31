/**
 * Platform entity descriptor registry (Tier 0).
 * Modules register entity types for trash, search, V_Link, and activity normalization.
 */

export interface PlatformEntityDescriptor {
  entityType: string;
  moduleId: string;
  displayName: string;
  pluralName: string;
  vlinkEntityType?: string;
  supportsTrash: boolean;
  supportsSearch: boolean;
  activityTargetType: string;
}

const registry = new Map<string, PlatformEntityDescriptor>();

function registryKey(moduleId: string, entityType: string): string {
  return `${moduleId}:${entityType}`;
}

export function registerPlatformEntity(descriptor: PlatformEntityDescriptor): void {
  registry.set(registryKey(descriptor.moduleId, descriptor.entityType), descriptor);
}

export function getPlatformEntity(
  moduleId: string,
  entityType: string
): PlatformEntityDescriptor | undefined {
  return registry.get(registryKey(moduleId, entityType));
}

export function listPlatformEntitiesForModule(moduleId: string): PlatformEntityDescriptor[] {
  return [...registry.values()].filter((d) => d.moduleId === moduleId);
}

export function listAllPlatformEntities(): PlatformEntityDescriptor[] {
  return [...registry.values()];
}

/** File Hub (drive) file + folder entity descriptors — FH-2. */
export function registerDrivePlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'file',
    moduleId: 'drive',
    displayName: 'File',
    pluralName: 'Files',
    vlinkEntityType: 'FILE',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'file',
  });
  registerPlatformEntity({
    entityType: 'folder',
    moduleId: 'drive',
    displayName: 'Folder',
    pluralName: 'Folders',
    vlinkEntityType: 'FOLDER',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'folder',
  });
}

/** Test-only reset. */
export function clearPlatformEntityRegistryForTests(): void {
  registry.clear();
}
