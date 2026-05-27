/**
 * Maps pipeline catalog context source ids to module context providers.
 */

export interface PipelineSourceProviderRef {
  moduleId: string;
  providerName: string;
  fallbackProviderName?: string;
}

/** Module-backed catalog sources → concrete provider refs. */
export const PIPELINE_SOURCE_PROVIDER_MAP: Record<string, PipelineSourceProviderRef[]> = {
  vssyl_place: [{ moduleId: 'place', providerName: 'place_discoveries' }],
  drive_files: [
    { moduleId: 'drive', providerName: 'recent_files', fallbackProviderName: 'storage_overview' },
  ],
  calendar: [
    { moduleId: 'calendar', providerName: 'today_events', fallbackProviderName: 'upcoming_events' },
  ],
};

/** Platform sources handled outside module HTTP providers (Phase A). */
export const PLATFORM_ONLY_PIPELINE_SOURCES = new Set([
  'location',
  'vlink',
  'web_search',
  'business_context',
  'user_memory',
  'profile',
  'recent_conversations',
  'notifications_activity',
  'repo_context',
]);

export function isModuleBackedPipelineSource(sourceId: string): boolean {
  return sourceId in PIPELINE_SOURCE_PROVIDER_MAP;
}

export function getProvidersForPipelineSource(sourceId: string): PipelineSourceProviderRef[] {
  return PIPELINE_SOURCE_PROVIDER_MAP[sourceId] ?? [];
}
