/**
 * Context Graph Project Assistant pilot — environment flag helpers (Phase 1C).
 * All flags default OFF; production must not enable without validation sign-off.
 */

export const PROJECT_ASSISTANT_PILOT_ENV = {
  retrieval: 'AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED',
  bridge: 'CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED',
  reconcile: 'CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED',
} as const;

export type ProjectAssistantPilotFlag = keyof typeof PROJECT_ASSISTANT_PILOT_ENV;

export function isProjectAssistantPilotRetrievalEnabled(): boolean {
  return process.env[PROJECT_ASSISTANT_PILOT_ENV.retrieval] === 'true';
}

export function isProjectAssistantPilotBridgeEnabled(): boolean {
  return process.env[PROJECT_ASSISTANT_PILOT_ENV.bridge] === 'true';
}

export function isProjectAssistantPilotReconcileEnabled(): boolean {
  return process.env[PROJECT_ASSISTANT_PILOT_ENV.reconcile] === 'true';
}

/** True when all three pilot flags are explicitly enabled. */
export function isProjectAssistantPilotStackEnabled(): boolean {
  return (
    isProjectAssistantPilotRetrievalEnabled() &&
    isProjectAssistantPilotBridgeEnabled() &&
    isProjectAssistantPilotReconcileEnabled()
  );
}

/** Enable full pilot stack — local/dev and tests only. */
export function enableProjectAssistantPilotStack(): void {
  process.env[PROJECT_ASSISTANT_PILOT_ENV.retrieval] = 'true';
  process.env[PROJECT_ASSISTANT_PILOT_ENV.bridge] = 'true';
  process.env[PROJECT_ASSISTANT_PILOT_ENV.reconcile] = 'true';
}

/** Restore safe defaults (unset = off for opt-in flags). */
export function disableProjectAssistantPilotStack(): void {
  delete process.env[PROJECT_ASSISTANT_PILOT_ENV.retrieval];
  delete process.env[PROJECT_ASSISTANT_PILOT_ENV.bridge];
  delete process.env[PROJECT_ASSISTANT_PILOT_ENV.reconcile];
}
