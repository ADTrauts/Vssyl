/** Platform defaults for module AI context provider fetches (Phase 4B). */

/** Matches `ModuleAIContextService.fetchModuleContext` axios timeout. */
export const MODULE_CONTEXT_PROVIDER_TIMEOUT_MS = 5000;

/** Recommended max JSON response size; larger payloads may be truncated in assembly. */
export const MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES = 32_768;

/** Minimum allowed cacheDuration in registry (1 minute). */
export const MODULE_CONTEXT_PROVIDER_MIN_CACHE_MS = 60_000;

/** Maximum allowed cacheDuration in registry (24 hours). */
export const MODULE_CONTEXT_PROVIDER_MAX_CACHE_MS = 86_400_000;

/** Default cacheDuration when omitted in registry (15 minutes). */
export const MODULE_CONTEXT_PROVIDER_DEFAULT_CACHE_MS = 900_000;
