/**
 * Maps workspace navigation module ids to Twin `currentModule` for the header AI dropdown.
 * Reuses resolver output as-is; falls back to `search` when the surface is not a registered module.
 */

/** Built-in registry module ids that workspace resolvers may return 1:1 (no alias conversion). */
const HEADER_TWIN_MODULE_IDS = new Set([
  'calendar',
  'chat',
  'drive',
  'hr',
  'notebook',
  'notes',
  'place',
  'scheduling',
  'todo',
  'vlink',
  'workforce_comms',
]);

export function resolveHeaderTwinCurrentModule(input: {
  workspaceModuleId?: string | null;
  moduleContextModule?: string | null;
}): string {
  const fromContext = input.moduleContextModule?.trim();
  if (fromContext) {
    return fromContext;
  }

  const fromWorkspace = input.workspaceModuleId?.trim();
  if (fromWorkspace && HEADER_TWIN_MODULE_IDS.has(fromWorkspace)) {
    return fromWorkspace;
  }

  return 'search';
}

export function isHeaderTwinRegisteredModule(moduleId: string | null | undefined): boolean {
  const id = moduleId?.trim();
  return Boolean(id && HEADER_TWIN_MODULE_IDS.has(id));
}
