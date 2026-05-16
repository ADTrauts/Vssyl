# Policy Engine (v1)

Centralized authorization lives under **`server/src/auth/`**. A discoverability re-export is **`server/src/services/policyEngine.ts`** (same API).

**v1 scope:** `dashboard:read` (with optional query scope) and `file:read` for **`resourceType: `'folder'`** only. Other actions fail closed (`POLICY_NOT_IMPLEMENTED`). Denies are logged with `operation: 'policy_deny'`.

## API

### `authorize(input)`

- **What:** Async pure decision. Returns `{ allow, reason?, matchedPolicy? }`.
- **When:** Controllers or services where you need the full decision (custom status bodies, branching, dual enforcement next to legacy checks) or you are not in Express middleware.
- **Auth:** Caller must already have an authenticated actor (`userId` or `user` on `PolicyInput`). It does not replace `authenticateJWT`.

### `enforcePolicy(input)`

- **What:** Calls `authorize`; if `allow` is false, throws **`PolicyDeniedError`** carrying the decision.
- **When:** Service-layer code that prefers “throw on deny” over handling `PolicyDecision` at every callsite.

### `requirePolicy(action, resourceType, options?)`

- **What:** Express middleware. Runs **`authorize`** with `userId` / `user` from **`AuthenticatedRequest`**. On deny: **403** with `{ message: 'Forbidden', reason }`. On success: `next()`.
- **When:** Route-level gates **after** `authenticateJWT`, when you can supply `resolveResourceId(req)` and optionally `resolveScope(req)` (see `RequirePolicyOptions` in `server/src/middleware/policyMiddleware.ts`).
- **Note:** If you need 404 vs 403 semantics or to attach extra context to the response, use `authorize` in the controller instead.

## Types and actions

- **`PolicyInput` / `PolicyDecision` / `PolicyScope`:** `server/src/auth/policyTypes.ts`
- **Named actions:** `server/src/auth/policyActions.ts` (`POLICY_ACTIONS`)

## Tests

`server/src/auth/__tests__/policyEngine.test.ts`

## Follow-ups (not v1)

- Dashboard **sharing/collaboration**: extend `dashboard:read` so non-owners can be allowed or denied explicitly instead of delegating to legacy “owner-only” service behavior where appropriate.
- **`file:read`** with **`resourceType: 'file'`** (resolve file + Drive scope/shares).
- Migrate **business/member** routes incrementally with **dual enforcement** until legacy checks are removed.

**Last updated:** 2026-05-16
