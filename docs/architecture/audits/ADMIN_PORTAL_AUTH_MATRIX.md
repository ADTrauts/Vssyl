# Admin Portal Authorization Matrix

**Program:** Admin Portal Modernization — Stage 0B Package 0B-D  
**Finding:** AP-F-011  
**Date:** 2026-06-17  
**Companion:** [ADMIN_PORTAL_AUTH_MODEL.md](./ADMIN_PORTAL_AUTH_MODEL.md)

Route-level detail for canonical portal operations: [ADMIN_PORTAL_OPERATION_MATRIX.md](./ADMIN_PORTAL_OPERATION_MATRIX.md).

---

## 1. Surface summary matrix

| Surface | Route Prefix | Auth | Authorization | Feature Gate | Notes | Target State |
|---------|--------------|------|---------------|--------------|-------|--------------|
| **Admin Portal (canonical)** | `/api/admin-portal` | Per-route `authenticateJWT` | `requireAdmin` via `adminPortalAuth` | Per-handler: debug UI (`ADMIN_PORTAL_DEBUG_ENABLED`), dangerous migrations (`ADMIN_PORTAL_DANGEROUS_OPS_ENABLED` + confirm) | ~151 handlers across 4 domain route files | **Keep canonical** — reference stack |
| **Security (sub-mount)** | `/api/admin-portal/security` | Parent: `authenticateJWT` on `/security` prefix | Parent: `requireAdmin` | None at mount | 7 handlers in `adminSecurityRoutes.ts`; no per-route auth | **Keep canonical** — parent stack only |
| **Testing** | `/api/admin-portal/testing` | `authenticateJWT` per route | `requireAdmin` (shared import) | Router: `requireAdminPortalDebugEnabled` first | Shell `exec` endpoints; 4 handlers | **Gate** (0E-E done); future CLI/runbook |
| **Platform satellite — Block ID** | `/api/admin` | Per-route `authenticateJWT` | `requireAdmin` (shared import, 0B-D) | None | 4 handlers: users, Block ID, audit | **Document satellite**; migrate into portal |
| **Platform satellite — overrides** | `/api/admin-override` | Per-route `authenticateJWT` | Local `requireAdmin` — 403 `{ success: false, error }` | None | 6 handlers; response shape differs from canonical | **Exception** — align contract before import swap |
| **Platform satellite — logs** | `/api/admin/logs` | Mount: `authenticateJWT` | Admin paths: `requireRole('ADMIN')`; `/client` any authed user | None | 12 handlers; mixed admin/client | **Document satellite**; optional `requireAdmin` align |
| **AI admin — provider usage** | `/api/admin/ai-providers` | Per-route `authenticateJWT` | Local async `requireAdmin` — 401/403/500 | None | 8 handlers; `getUserFromRequest` inside middleware | **Exception** — defer to 0D AI Admin |
| **AI admin — centralized scaffold** | `/api/centralized-ai` | Mount: `authenticateJWT` | Mount: `requireAdmin` (`adminPortalAuth`) | `centralizedAiDeprecatedMiddleware` (410 duplicates) | ~97 handlers; legacy mock scaffold | **Defer 0D** — retire body |
| **AI admin — business AI** | `/api/admin/business-ai` | Router: `authenticateJWT` | Per-handler `userRole === 'ADMIN'` | None | 5 handlers | **Defer 0D** |
| **Bootstrap / emergency setup** | `/api/admin-setup` | None (no JWT) | `requireAdminSetupSecret` (timing-safe) | Mount only if `ENABLE_ADMIN_SETUP_ROUTES` + `ADMIN_SETUP_SECRET` ≥16 | 6 handlers; privilege escalation if secret leaks | **Gate** + **CLI/runbook** |
| **Debug — modules** | `/api/debug` | None | None | Mount: non-prod OR `ENABLE_PUBLIC_DEBUG_ROUTES` | 3 handlers; unauthenticated when mounted | **Retire** from prod paths |
| **Debug — database** | `/api/debug/database` | None | None | Same env gate as `/api/debug` | 1 handler | **Retire** |
| **Debug — business tier** | `/api/debug/business-tier` | Router: `authenticateJWT` | Router: `requireRole('ADMIN')` | Mount: non-prod OR `ENABLE_DEBUG_BUSINESS_TIER` | 2 handlers | **Gate** + document satellite |
| **Debug — AI context** | `/api/ai-context-debug` | Per-route `authenticateJWT` | Per-route `requireRole('ADMIN')` | None (recommend debug env gate) | 6 handlers | **Gate** (recommended); document satellite |
| **Module AI context (admin section)** | `/api/admin/modules/ai/*` | Per-route `authenticateJWT` | `requireRole('ADMIN')` | None | Mounted at `/api` via `moduleAIContext.ts`; 9 admin handlers | **Document satellite** |
| **Emergency — HR setup** | `/api/admin/hr-setup` | Mount: `authenticateJWT` | Inline ADMIN in handlers | None | 2 handlers | **CLI/runbook**; no consolidation |
| **Emergency — HR fix** | `/api/admin/fix-hr` | Mount: `authenticateJWT` | Inline ADMIN in handlers | None | 3 handlers; `execSync` | **CLI/runbook**; retire HTTP |
| **Emergency — HR DDL** | `/api/admin/create-hr-tables` | Mount: `authenticateJWT` | Inline ADMIN in handlers | None | 1 handler; raw SQL | **Retire** |
| **Emergency — subscriptions fix** | `/api/admin/fix-subscriptions` | Mount: `authenticateJWT` | Inline ADMIN in handlers | None | 2 handlers | **CLI/runbook** |
| **Emergency — module seed** | `/api/admin/seed` | Mount: `authenticateJWT` | Inline ADMIN in handlers | UI gated `ADMIN_PORTAL_DEBUG_ENABLED` | 1 handler | **CLI/runbook** |

### 1.1 Adjacent (out of portal certification scope)

| Surface | Route Prefix | Auth | Authorization | Feature Gate | Notes | Target State |
|---------|--------------|------|---------------|--------------|-------|--------------|
| Billing pricing admin | `/api/pricing` (mutations) | `authenticateJWT` | Local `requireAdmin` via `getUserFromRequest` | Public reads unauthenticated | Admin write paths only | Document; optional align later |
| Business AI (tenant) | `/api/business-ai` | Business-scoped | Business membership / roles | Feature gating | Not platform admin | Boundary only — not Admin Portal |

---

## 2. Auth pattern catalog

| Pattern ID | Mechanism | HTTP failures | Used by (count) |
|------------|-----------|---------------|-----------------|
| **P1** | `authenticateJWT` + `requireAdmin` (shared) | 403 `{ error: 'Admin access required' }` | admin-portal (~151), security (7), admin (4), testing (4), centralized-ai mount |
| **P2** | `authenticateJWT` + local `requireAdmin` (override shape) | 403 `{ success: false, error }` | admin-override (6) |
| **P3** | `authenticateJWT` + async `requireAdmin` (getUserFromRequest) | 401 / 403 / 500 | ai-provider-usage (8) |
| **P4** | `authenticateJWT` + `requireRole('ADMIN')` | 401 / 403 with `message` field | admin-logs, ai-context-debug, moduleAIContext, debug-business-tier |
| **P5** | Mount JWT + inline handler ADMIN | Handler-specific 403 | emergency HR/seed/fix (8 handlers) |
| **P6** | Secret only (`requireAdminSetupSecret`) | 403 on bad/missing secret | admin-setup (6) |
| **P7** | No auth (env-gated mount) | N/A when unmounted | debug-modules, debug-database |
| **P8** | P1 + `requireAdminPortalDebugEnabled` | 403 debug disabled | testing router |
| **P9** | P1 + `enforceDangerousMigrationOpGate` | 400/401/403 + audit | 2 migration ops in platform routes |
| **P10** | Router JWT + inline `userRole === 'ADMIN'` | Handler 403 | admin/business-ai (5) |

---

## 3. Required surfaces coverage (package checklist)

| Required surface | Covered in §1 | Pattern |
|------------------|---------------|---------|
| admin-portal | Yes | P1, P9 |
| security | Yes | P1 (parent mount) |
| testing | Yes | P8 + P1 |
| admin | Yes | P1 (consolidated 0B-D) |
| admin-override | Yes | P2 (exception) |
| admin/logs | Yes | P4 |
| admin/ai-providers | Yes | P3 (exception) |
| admin-setup | Yes | P6 |
| debug | Yes | P7, P4 (business-tier) |
| centralized-ai | Yes | P1 + deprecated fence |

---

## 4. Consolidation performed (0B-D)

| Change | Files | Behavior change |
|--------|-------|-----------------|
| Created `adminPortalAuth.ts` | New | No — re-exports + stack documentation |
| `admin.ts` → shared `requireAdmin` | Modified | No — identical 403 contract |
| `admin-portal-testing.ts` → shared `requireAdmin` | Modified | No — identical 403 contract |
| `admin-portal.ts`, `index.ts` → import via `adminPortalAuth` | Modified | No — same middleware |

**Not consolidated (documented exceptions):** `admin-override.ts`, `ai-provider-usage.ts`, emergency routes, `requireRole` surfaces.

---

## 5. Verification commands

```bash
rg "authenticateJWT|requireAdmin|requireRole\('ADMIN'\)|requireAdminSetupSecret|ADMIN_PORTAL_DEBUG_ENABLED|ADMIN_PORTAL_DANGEROUS_OPS_ENABLED" server/src/routes server/src/index.ts

pnpm exec vitest run server/src/routes/__tests__/admin-portal-auth-consolidation.test.ts
```

---

## 6. Finding status

**AP-F-011:** Resolved for Package 0B-D — all required surfaces documented; canonical pattern published; safe deduplication complete; remaining drift tracked in **Target State** column.
