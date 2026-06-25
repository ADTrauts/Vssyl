import { BUILT_IN_MODULE_IDS, isBuiltInModuleId } from '../constants/builtInModuleIds.js';
import { buildBuiltInModuleManifest } from '../startup/builtInModuleManifests.js';
import {
  getReadySearchProviders,
  MANIFEST_SEARCH_MODULE_IDS,
} from '../services/search/searchProviderRegistry.js';
import type {
  PlatformAdoptionLiveSignals,
  PlatformAdoptionValidationResult,
  PlatformAdoptionValidationWarning,
} from './platformAdoptionTypes.js';
import {
  getAdoptionRegistryEntry,
  getAdoptionRegistryModuleIds,
  PLATFORM_ADOPTION_REGISTRY,
} from './platformAdoptionRegistry.js';

const ACTIVITY_SERVICE_BY_MODULE: Record<string, string> = {
  drive: 'moduleActivityService',
  chat: 'chatActivityService',
  calendar: 'calendarActivityService',
  todo: 'todoActivityService',
  notes: 'notesActivityService',
  notebook: 'notebookLinkActivityService',
  place: 'placeActivityService',
  dashboard: 'dashboardActivityService',
  hr: 'hrActivityService',
  scheduling: 'schedulingActivityService',
  workforce_comms: 'workforceActivityService',
  analytics: 'analyticsActivityService',
  members: 'identityActivityService',
  business_admin: 'orgChartActivityService',
};

const COMPOSITION_SEARCH_PARENT: Record<string, string> = {
  quick_notes: 'dashboard',
  bookmarks: 'dashboard',
  activity_feed: 'dashboard',
  quick_stats: 'dashboard',
};

export function resolveLiveSignals(moduleId: string): PlatformAdoptionLiveSignals {
  const readyIds = new Set(getReadySearchProviders().map((p) => p.providerId));
  const searchModuleId = COMPOSITION_SEARCH_PARENT[moduleId] ?? moduleId;
  const searchProviderReady = readyIds.has(searchModuleId);

  let manifestSearchClaim = false;
  let manifestAiClaim = false;
  if (isBuiltInModuleId(moduleId)) {
    const manifest = buildBuiltInModuleManifest(moduleId);
    manifestSearchClaim = manifest.capabilities.search === true;
    manifestAiClaim = manifest.capabilities.ai === true;
    const entitySearch = manifest.entities?.some((e) => e.supportsSearch) ?? false;
    manifestSearchClaim = manifestSearchClaim || entitySearch;
  }

  const activityServiceDetected = ACTIVITY_SERVICE_BY_MODULE[moduleId] !== undefined;

  return {
    searchProviderReady,
    manifestSearchClaim,
    manifestAiClaim,
    activityServiceDetected,
  };
}

function warn(
  code: string,
  message: string,
  severity: PlatformAdoptionValidationWarning['severity'] = 'warning',
  moduleId?: string,
): PlatformAdoptionValidationWarning {
  return { code, message, severity, moduleId };
}

/** Compile-time + registry validation for CI and operator dashboard. */
export function runPlatformAdoptionCiValidation(): PlatformAdoptionValidationResult {
  const warnings: PlatformAdoptionValidationWarning[] = [];
  const readyIds = new Set(getReadySearchProviders().map((p) => p.providerId));

  for (const moduleId of MANIFEST_SEARCH_MODULE_IDS) {
    if (!readyIds.has(moduleId)) {
      warnings.push(
        warn(
          'SEARCH_PROVIDER_MISSING',
          `Module "${moduleId}" is in MANIFEST_SEARCH_MODULE_IDS but has no ready search provider`,
          'error',
          moduleId,
        ),
      );
    }
  }

  for (const builtInId of BUILT_IN_MODULE_IDS) {
    const manifest = buildBuiltInModuleManifest(builtInId);
    const claimsSearch =
      manifest.capabilities.search === true ||
      (manifest.entities?.some((e) => e.supportsSearch) ?? false);
    if (claimsSearch && !readyIds.has(builtInId)) {
      warnings.push(
        warn(
          'MANIFEST_SEARCH_NO_PROVIDER',
          `Built-in "${builtInId}" manifest claims search but no ready provider is registered`,
          'warning',
          builtInId,
        ),
      );
    }

    if (manifest.capabilities.ai && !manifest.capabilities.search && builtInId !== 'vlink') {
      warnings.push(
        warn(
          'AI_WITHOUT_SEARCH',
          `Built-in "${builtInId}" declares AI but not search — verify Retrieval Adapter path`,
          'warning',
          builtInId,
        ),
      );
    }
  }

  for (const entry of PLATFORM_ADOPTION_REGISTRY) {
    const live = resolveLiveSignals(entry.moduleId);
    if (entry.capabilities.unifiedSearch === 'full' && !live.searchProviderReady) {
      const parent = COMPOSITION_SEARCH_PARENT[entry.moduleId];
      if (!parent || !readyIds.has(parent)) {
        warnings.push(
          warn(
            'ADOPTION_SEARCH_REGRESSION',
            `Registry marks "${entry.displayName}" search Full but live provider is not ready`,
            'error',
            entry.moduleId,
          ),
        );
      }
    }
    if (
      entry.capabilities.activity === 'full' &&
      isBuiltInModuleId(entry.moduleId) &&
      !live.activityServiceDetected
    ) {
      warnings.push(
        warn(
          'ACTIVITY_SERVICE_GAP',
          `Registry marks "${entry.displayName}" activity Full but no known activity service mapping`,
          'warning',
          entry.moduleId,
        ),
      );
    }
  }

  const registryIds = new Set(getAdoptionRegistryModuleIds());
  for (const builtInId of BUILT_IN_MODULE_IDS) {
    if (!registryIds.has(builtInId)) {
      warnings.push(
        warn(
          'REGISTRY_MISSING_BUILTIN',
          `Built-in module "${builtInId}" has no adoption registry entry`,
          'warning',
          builtInId,
        ),
      );
    }
  }

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  return {
    assessedAt: new Date().toISOString(),
    warnings,
    errorCount,
    warningCount,
  };
}

export function getValidationWarningsForModule(moduleId: string): string[] {
  const validation = runPlatformAdoptionCiValidation();
  return validation.warnings
    .filter((w) => w.moduleId === moduleId)
    .map((w) => w.message);
}

export function getAdoptionRegistryEntryOrThrow(moduleId: string) {
  const entry = getAdoptionRegistryEntry(moduleId);
  if (!entry) {
    throw new Error(`Unknown adoption module: ${moduleId}`);
  }
  return entry;
}
