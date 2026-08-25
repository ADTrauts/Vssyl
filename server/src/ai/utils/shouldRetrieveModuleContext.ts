/**
 * C3 — Mechanical gate for MODULE ContextProvider orchestration.
 *
 * Consumes already-resolved routing axes only. No query text, classifiers,
 * or side effects. When false, Core may skip getContextForAIQuery.
 */

import type { InferStructuredResponseModeResult } from './structuredResponseMode';

export function shouldRetrieveModuleContext(
  resolution: InferStructuredResponseModeResult | undefined,
  hasAttachedFiles: boolean
): boolean {
  // Missing early resolution → retrieve (safe default).
  if (!resolution) return true;

  return (
    resolution.responseContract !== 'conversation' ||
    resolution.requiresAuthoritativeContext === true ||
    resolution.isActionRequest === true ||
    hasAttachedFiles ||
    resolution.isFollowUp === true ||
    resolution.isBroadDiscovery === true
  );
}
