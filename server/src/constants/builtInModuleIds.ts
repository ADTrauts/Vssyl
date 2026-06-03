/**
 * Built-in product module ids — always available for personal scope without marketplace install.
 * Single source for provisioning and marketplace logic.
 */
export const BUILT_IN_MODULE_IDS = [
  'drive',
  'chat',
  'calendar',
  'hr',
  'scheduling',
  'todo',
  'notes',
  'notebook',
  'vlink',
  'place',
  'dashboard',
] as const;

export type BuiltInModuleId = (typeof BUILT_IN_MODULE_IDS)[number];

export function isBuiltInModuleId(moduleId: string): moduleId is BuiltInModuleId {
  return (BUILT_IN_MODULE_IDS as readonly string[]).includes(moduleId);
}
