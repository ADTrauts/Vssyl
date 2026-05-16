/**
 * Discoverability re-export — core implementation lives in `server/src/auth/`.
 */
export { authorize, enforcePolicy, PolicyDeniedError } from '../auth/policyEngine';
export { POLICY_ACTIONS } from '../auth/policyActions';
export type { PolicyInput, PolicyDecision, PolicyScope, PolicyResourceType, PolicyDenyReason } from '../auth/policyTypes';
