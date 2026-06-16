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

/** Notes page entity — storage domain (Global Trash `moduleId: notes`). */
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

/**
 * Product-level page entity for Notebook (`notebook:page`).
 * Storage remains `Note` under module `notes`; V_Link resolves via `NOTE`.
 */
export const NOTEBOOK_PAGE_ENTITY_TYPE = 'NOTEBOOK_PAGE';

export function registerNotebookPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'page',
    moduleId: 'notebook',
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

/** Place listing + meeting entity descriptors — Wave 2A (community/node/transaction deferred). */
export function registerPlacePlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'listing',
    moduleId: 'place',
    displayName: 'Place listing',
    pluralName: 'Place listings',
    vlinkEntityType: 'PLACE_LISTING',
    supportsTrash: true,
    supportsSearch: true,
    activityTargetType: 'listing',
  });
  registerPlatformEntity({
    entityType: 'meeting',
    moduleId: 'place',
    displayName: 'Place meeting',
    pluralName: 'Place meetings',
    vlinkEntityType: 'PLACE_MEETING',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'meeting',
  });
}

/** Scheduling schedule, shift, and swap request descriptors — CO-09 / G13. */
export function registerSchedulingPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'schedule',
    moduleId: 'scheduling',
    displayName: 'Schedule',
    pluralName: 'Schedules',
    vlinkEntityType: 'SCHEDULE',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'schedule',
  });
  registerPlatformEntity({
    entityType: 'shift',
    moduleId: 'scheduling',
    displayName: 'Shift',
    pluralName: 'Shifts',
    vlinkEntityType: 'SCHEDULE_SHIFT',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'shift',
  });
  registerPlatformEntity({
    entityType: 'swap_request',
    moduleId: 'scheduling',
    displayName: 'Shift swap request',
    pluralName: 'Shift swap requests',
    vlinkEntityType: 'SHIFT_SWAP_REQUEST',
    supportsTrash: false,
    supportsSearch: false,
    activityTargetType: 'swap_request',
  });
}

/** HR employee profile, time-off, attendance exception, and onboarding journey — CO-09 / G13. */
export function registerHRPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'employee_profile',
    moduleId: 'hr',
    displayName: 'Employee profile',
    pluralName: 'Employee profiles',
    vlinkEntityType: 'HR_EMPLOYEE_PROFILE',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'employee_profile',
  });
  registerPlatformEntity({
    entityType: 'time_off_request',
    moduleId: 'hr',
    displayName: 'Time-off request',
    pluralName: 'Time-off requests',
    vlinkEntityType: 'HR_TIME_OFF_REQUEST',
    supportsTrash: false,
    supportsSearch: false,
    activityTargetType: 'time_off_request',
  });
  registerPlatformEntity({
    entityType: 'attendance_exception',
    moduleId: 'hr',
    displayName: 'Attendance exception',
    pluralName: 'Attendance exceptions',
    vlinkEntityType: 'HR_ATTENDANCE_EXCEPTION',
    supportsTrash: false,
    supportsSearch: false,
    activityTargetType: 'attendance_exception',
  });
  registerPlatformEntity({
    entityType: 'onboarding_journey',
    moduleId: 'hr',
    displayName: 'Onboarding journey',
    pluralName: 'Onboarding journeys',
    vlinkEntityType: 'HR_ONBOARDING_JOURNEY',
    supportsTrash: false,
    supportsSearch: false,
    activityTargetType: 'onboarding_journey',
  });
}

/** Workforce Communications communication + campaign — Phase A registration. */
export function registerWorkforceCommsPlatformEntities(): void {
  registerPlatformEntity({
    entityType: 'communication',
    moduleId: 'workforce_comms',
    displayName: 'Communication',
    pluralName: 'Communications',
    vlinkEntityType: 'WORKFORCE_COMMUNICATION',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'communication',
  });
  registerPlatformEntity({
    entityType: 'campaign',
    moduleId: 'workforce_comms',
    displayName: 'Campaign',
    pluralName: 'Campaigns',
    vlinkEntityType: 'WORKFORCE_CAMPAIGN',
    supportsTrash: true,
    supportsSearch: false,
    activityTargetType: 'campaign',
  });
}

/** Test-only reset. */
export function clearPlatformEntityRegistryForTests(): void {
  registry.clear();
}
