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

/** Chat conversation entity descriptor — Wave 1 Phase 4 (message/thread deferred). */
export function registerChatPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'conversation',
    moduleId: 'chat',
    displayName: 'Conversation',
    pluralName: 'Conversations',
    vlinkEntityType: 'CHAT_CONVERSATION',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'conversation',
  });
}

/** Todo task entity descriptor — Wave 2 Phase 2 (comments/subtasks/projects deferred). */
export function registerTodoPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'task',
    moduleId: 'todo',
    displayName: 'Task',
    pluralName: 'Tasks',
    vlinkEntityType: 'TODO',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'task',
  });
}

/** Notes page entity (Notebook product surface; storage model Note). */
export function registerNotesPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'page',
    moduleId: 'notes',
    displayName: 'Page',
    pluralName: 'Pages',
    vlinkEntityType: 'NOTE',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'page',
  });
}

/** Calendar event entity descriptor — Wave 2 Phase 2B (calendar/reminder/attendee deferred). */
export function registerCalendarPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'event',
    moduleId: 'calendar',
    displayName: 'Calendar event',
    pluralName: 'Calendar events',
    vlinkEntityType: 'CALENDAR_EVENT',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'event',
  });
}

/** Test-only reset. */
export function clearPlatformEntityRegistryForTests(): void {
  registry.clear();
}
