# Admin Portal Authentication & Authorization Model

**Program:** Admin Portal Modernization — Stage 0B Package 0B-D  
**Finding:** AP-F-011 — Authentication / authorization pattern consolidation  
**Date:** 2026-06-17  
**Status:** Canonical reference — no security redesign in this package

**Related:** [Auth Matrix](./ADMIN_PORTAL_AUTH_MATRIX.md) · [Satellite Mount Map](./ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) · [Operation Matrix](./ADMIN_PORTAL_OPERATION_MATRIX.md) · [Findings Register](./ADMIN_PORTAL_FINDINGS_REGISTER.md)

---

## 1. Purpose

Document the **existing** admin authorization model across Admin Portal and admin-adjacent API surfaces. Package 0B-D standardizes imports where response contracts are identical and publishes this model so certification reviewers can verify consistent application.

**Not in scope:** Policy Engine, new roles, JWT changes, emergency route consolidation, API renames, or permission semantic changes.

---

## 2. Authentication layers

Admin surfaces compose one or more of the following layers. Order matters where noted.

### 2.1 JWT (`authenticateJWT`)

- **Source:** `server/src/middleware/auth.ts`
- **Behavior:** Validates Bearer token, attaches `req.user` (`id`, `email`, `role`, etc.).
- **Failure:** 403 `{ message: 'Invalid or expired token' }` (or 401 paths when combined with `requireRole` and user missing).
- **Usage:** Nearly all admin HTTP surfaces except bootstrap secret routes and unauthenticated debug mounts.

### 2.2 Platform ADMIN role — canonical `requireAdmin`

- **Implementation:** `server/src/routes/admin-portal/adminPortalShared.ts` → re-exported via `adminPortalAuth.ts`
- **Prerequisite:** `authenticateJWT` (expects `req.user` already set).
- **Check:** `req.user.role === 'ADMIN'`
- **Failure:** 403 `{ error: 'Admin access required' }` (no separate 401 if user missing — treated as forbidden).
- **Preferred import:** `import { requireAdmin } from './admin-portal/adminPortalAuth'`

### 2.3 `requireRole('ADMIN')` (middleware variant)

- **Source:** `server/src/middleware/auth.ts` → `requireRole(role)`
- **Prerequisite:** `authenticateJWT`
- **Check:** Same role semantics as `requireAdmin`
- **Failure:** 401 `{ message: 'Authentication required' }` if no user; 403 `{ message: 'Access denied. ADMIN role required.' }`
- **Note:** Semantically equivalent to ADMIN check but **different HTTP contracts**. Documented exception — do not swap without client impact review.

### 2.4 Inline admin user checks (`getUserFromRequest` + role)

- **Source:** Emergency HR/seed/fix handlers
- **Pattern:** Handler calls `getUserFromRequest(req)` then `user.role !== 'ADMIN'`
- **Failure:** Typically 403 with handler-specific JSON
- **Note:** Mount-level JWT may already run; handler re-resolves user. **Out of scope for consolidation** per package rules.

### 2.5 Feature gates (env)

| Gate | Env var | Middleware / helper | Failure |
|------|---------|---------------------|---------|
| Debug tools | `ADMIN_PORTAL_DEBUG_ENABLED` | `requireAdminPortalDebugEnabled` (`adminPortalDebugGate.ts`) | 403 `{ error: 'Admin portal debug tools are disabled in this environment' }` |
| Dangerous migration ops | `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED` | `enforceDangerousMigrationOpGate` (`adminPortalShared.ts`) | 403/400/401 per deny reason + audit log |
| Admin setup bootstrap | `ENABLE_ADMIN_SETUP_ROUTES` + `ADMIN_SETUP_SECRET` (≥16) | Mount conditional in `index.ts`; `requireAdminSetupSecret` per request | Mount omitted or 403 on bad secret |
| Public debug routes | `NODE_ENV !== 'production'` OR `ENABLE_PUBLIC_DEBUG_ROUTES` | Mount conditional in `index.ts` | Routes not mounted |
| Business tier debug | `ENABLE_DEBUG_BUSINESS_TIER` (prod) | Mount conditional in `index.ts` | Routes not mounted |

### 2.6 Secret bootstrap gates (no JWT)

- **`admin-setup.ts`:** `requireAdminSetupSecret` — compares `x-admin-setup-secret` header or `secret` body field to `ADMIN_SETUP_SECRET` using timing-safe compare.
- **No user identity** on these routes; audit trail is limited to secret presentation.

### 2.7 Deprecated / fence middleware

- **`centralizedAiDeprecatedMiddleware`:** Returns 410 for deprecated duplicate paths; does not replace auth.
- Mount order: `authenticateJWT` → `requireAdmin` → fence → router.

---

## 3. Canonical pattern (preferred stack)

```
authenticateJWT
  → requireAdmin          (from adminPortalAuth / adminPortalShared)
  → [feature gate]        (only when surface requires it)
  → [route validation]    (express-validator / handler checks)
  → service / controller
```

### 3.1 Documented stack exports (`adminPortalAuth.ts`)

| Export | Composition | Use case |
|--------|-------------|----------|
| `requireAdmin` | Re-export from `adminPortalShared` | Per-route middleware |
| `requireAdminPortalDebugEnabled` | Re-export from `adminPortalDebugGate` | Testing / debug surfaces |
| `adminPortalAccessMiddleware` | `[authenticateJWT, requireAdmin]` | Standard admin-portal routes |
| `adminPortalSecurityAccessMiddleware` | `[authenticateJWT, requireAdmin]` | Parent mount for `/security` sub-router |
| `adminPortalTestingAccessMiddleware` | `[requireAdminPortalDebugEnabled, authenticateJWT, requireAdmin]` | Testing router (order preserved) |

### 3.2 Dangerous operations (canonical portal only)

On top of JWT + admin:

1. `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED === 'true'`
2. Request body `confirm` matches expected token (`DELETE_PRISMA_MIGRATION`, etc.)
3. Handler calls `enforceDangerousMigrationOpGate` before executing

### 3.3 Impersonation (canonical portal)

- Auth: JWT + `requireAdmin` on route
- Additional policy: `validateImpersonationTarget` / deny reasons in `adminPortalShared.ts` (0E-D)
- Not a separate middleware layer — handler-level validation after admin gate

---

## 4. Documented exceptions (intentional drift)

These surfaces **must not** import shared `requireAdmin` in 0B-D without changing client-visible responses or error paths.

| Surface | Reason | Target state |
|---------|--------|--------------|
| `/api/admin-override` | 403 body includes `success: false` wrapper | Align response contract in future API normalization (not 0B-D) |
| `/api/admin/ai-providers` | Async middleware; 401 if unauthenticated; 500 on check failure; uses `getUserFromRequest` | Consolidate when AI admin package (0D) unifies mounts |
| `/api/admin/logs`, `/api/ai-context-debug`, `/api/admin/modules/ai/*`, `/api/debug/business-tier` | `requireRole('ADMIN')` message shape | Optional future align to `requireAdmin` with client audit |
| Emergency HR/seed/fix routes | Inline handler checks; package forbids emergency consolidation | CLI/runbook migration per mount map |
| `/api/admin-setup` | Secret-only auth (no JWT) | Remain gated bootstrap; retire HTTP |
| `/api/debug`, `/api/debug/database` | No auth when env gate allows mount | Never in production without explicit env |
| `/api/pricing` (admin writes) | Local `requireAdmin` via `getUserFromRequest`; adjacent billing admin | Out of portal scope; note in matrix |

---

## 5. Fragmentation measurement (AP-F-011)

### 5.1 Before 0B-D

| Pattern | Count | Locations |
|---------|-------|-----------|
| Canonical `requireAdmin` (`adminPortalShared`) | 1 impl | ~151 admin-portal handlers + centralized-ai mount |
| Duplicate inline `requireAdmin` (same 403 contract) | 2 | `admin.ts`, `admin-portal-testing.ts` |
| Duplicate inline `requireAdmin` (different contract) | 2 | `admin-override.ts`, `ai-provider-usage.ts` |
| `requireRole('ADMIN')` | 4 surfaces | admin-logs, ai-context-debug, moduleAIContext, debug-business-tier |
| Inline handler ADMIN checks | 5 files | HR/seed emergency routes |
| Secret bootstrap | 1 | admin-setup |

**Duplicate `requireAdmin` implementations:** 5 (finding AP-F-011 evidence).

### 5.2 After 0B-D

| Pattern | Count | Notes |
|---------|-------|-------|
| Canonical implementation | 1 | `adminPortalShared.ts`; import via `adminPortalAuth.ts` |
| Safe deduplication | 2 files updated | `admin.ts`, `admin-portal-testing.ts` import shared |
| Documented exceptions (different contract) | 2 | `admin-override.ts`, `ai-provider-usage.ts` |
| `requireRole('ADMIN')` | 4 | Documented in matrix |
| Emergency inline checks | 5 | Unchanged |
| Adjacent billing | 1 | `pricing.ts` — documented, out of scope |

**Remaining duplicate `requireAdmin` implementations:** 2 (override, ai-provider) + 1 adjacent (pricing).

**Drift risk reduction:** 40% fewer inline `requireAdmin` copies (5 → 3); 100% of same-contract satellites now use shared import.

---

## 6. Code map

| File | Role |
|------|------|
| `server/src/middleware/auth.ts` | `authenticateJWT`, `requireRole`, `getUserFromRequest` |
| `server/src/routes/admin-portal/adminPortalShared.ts` | Canonical `requireAdmin`, dangerous-ops gate, impersonation helpers |
| `server/src/routes/admin-portal/adminPortalAuth.ts` | AP-F-011 entry point: re-exports + stack arrays |
| `server/src/routes/admin-portal/adminPortalDebugGate.ts` | `ADMIN_PORTAL_DEBUG_ENABLED` gate |
| `server/src/routes/admin-portal.ts` | Security sub-mount applies parent JWT+admin |

---

## 7. Verification

```bash
# Canonical requireAdmin definition (single source)
rg "export const requireAdmin" server/src/routes

# Surfaces still using local requireAdmin (expected exceptions)
rg "const requireAdmin" server/src/routes

# Env gates
rg "ADMIN_PORTAL_DEBUG_ENABLED|ADMIN_PORTAL_DANGEROUS_OPS_ENABLED|ADMIN_SETUP_SECRET" server/src
```

**Tests:** `server/src/routes/__tests__/admin-portal-auth-consolidation.test.ts`

---

## 8. Finding status

| Finding | Status |
|---------|--------|
| **AP-F-011** | **Resolved (0B-D)** — canonical model published, matrix published, same-contract duplicates consolidated; intentional exceptions documented with target states |
