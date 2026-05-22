/**
 * Gate demo/synthetic cross-module blocks (Phase 3C).
 * Production prompts exclude synthetic insights unless explicitly enabled for dev.
 */
export function isSyntheticContextEnabled(): boolean {
  return process.env.AI_SYNTHETIC_CONTEXT_ENABLED === 'true';
}
