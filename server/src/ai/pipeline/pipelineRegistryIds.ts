/**
 * Dynamic AI pipeline registry ID rules and protected system identifiers.
 */

export const SYSTEM_INTENT_IDS = [
  'emotional_support',
  'local_discovery',
  'recommendation',
  'planning',
  'research',
  'personal_reflection',
  'business_operations',
  'technical_help',
  'workflow_action',
  'general_chat',
] as const;

export const SYSTEM_CONTEXT_SOURCE_IDS = [
  'user_memory',
  'profile',
  'recent_conversations',
  'active_goals',
  'location',
  'calendar',
  'drive_files',
  'business_context',
  'vssyl_place',
  'vlink',
  'web_search',
  'module_context',
  'notifications_activity',
  'repo_context',
] as const;

export const SYSTEM_TOOL_IDS = [
  'memory',
  'location',
  'place_search',
  'web_search',
  'list_drive_files',
  'share_file',
  'create_todo',
  'module_context',
  'business_context',
] as const;

export type SystemPipelineIntentId = (typeof SYSTEM_INTENT_IDS)[number];
export type SystemPipelineContextSourceId = (typeof SYSTEM_CONTEXT_SOURCE_IDS)[number];
export type SystemPipelineToolId = (typeof SYSTEM_TOOL_IDS)[number];

/** Registry slug: lowercase snake_case, 3–50 chars */
export const REGISTRY_ID_SLUG_REGEX = /^[a-z][a-z0-9_]{2,49}$/;

export const RESERVED_REGISTRY_IDS = new Set([
  'system',
  'default',
  'admin',
  'api',
  'twin',
  'null',
  'undefined',
  'true',
  'false',
  'new',
  'copy',
  'test',
  'settings',
]);

export function isValidRegistrySlug(id: string): boolean {
  const trimmed = id.trim();
  if (!REGISTRY_ID_SLUG_REGEX.test(trimmed)) return false;
  if (RESERVED_REGISTRY_IDS.has(trimmed)) return false;
  return true;
}

export function isSystemIntentId(id: string): boolean {
  return (SYSTEM_INTENT_IDS as readonly string[]).includes(id);
}

export function isSystemContextSourceId(id: string): boolean {
  return (SYSTEM_CONTEXT_SOURCE_IDS as readonly string[]).includes(id);
}

export function isSystemToolId(id: string): boolean {
  return (SYSTEM_TOOL_IDS as readonly string[]).includes(id);
}

export function suggestDuplicateId(baseId: string): string {
  const base = baseId.replace(/_copy\d*$/, '');
  return `${base}_copy`;
}
