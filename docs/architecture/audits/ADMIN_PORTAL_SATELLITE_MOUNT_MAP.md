# Admin Portal Satellite Mount Map

**Program:** Admin Portal Modernization — Stage 0B Package 0B-A  
**Date:** 2026-06-17  
**Findings addressed:** AP-F-006 (API mount fragmentation), AP-F-022 (Emergency ops route inventory)  
**Status:** Authoritative inventory — no route behavior changed in this package

**Related:** [Control Plane Architecture](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md) · [Surface Inventory](./ADMIN_PORTAL_SURFACE_INVENTORY.md) · [Findings Register](./ADMIN_PORTAL_FINDINGS_REGISTER.md) · [Implementation Package Plan](./ADMIN_PORTAL_IMPLEMENTATION_PACKAGE_PLAN.md) · [Operation Matrix](./ADMIN_PORTAL_OPERATION_MATRIX.md)

> **Note:** `ADMIN_PORTAL_ENGINEERING_BLUEPRINT.md` is not present in the repository. Planning-state architecture lives in [ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md](./ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md). This document is the **implementation inventory** produced by Stage 0B-A.

---

## 1. Purpose

Establish an authoritative map of Admin Portal and admin-adjacent API mounts **before** consolidation, registry cleanup, or auth unification (0B-B+).

**Source of truth for mounts:** `server/src/index.ts` (verified 2026-06-17 via repository grep).

---

## 2. Mount inventory (21 prefixes)

| # | Mount Prefix | Route File(s) | Owner Classification | Current Maturity | Auth Pattern | Future Disposition |
|---|--------------|---------------|----------------------|------------------|--------------|-------------------|
| 1 | `/api/admin-portal` | `routes/admin-portal.ts` → `admin-portal/adminPortalRoutes.{core,analyticsOps,platform,aiPipeline}.ts` | **Canonical Admin Portal** | implemented | Per-route `authenticateJWT` + `requireAdmin` from `adminPortalShared.ts` (~144 handlers) | **keep canonical** |
| 2 | `/api/admin-portal/security` | `routes/adminSecurityRoutes.ts` (sub-mount via `admin-portal.ts`) | **Canonical Admin Portal** | partial | Parent mount applies JWT+admin on `/security` prefix (7 handlers) | **keep canonical** |
| 3 | `/api/admin-portal/testing` | `routes/admin-portal-testing.ts` | **Developer/Test Surface** | debug | `ADMIN_PORTAL_DEBUG_ENABLED` gate → then JWT + inline `requireAdmin` (4 handlers; shell `exec`) | **gate** (done 0E-E); consider **move to CLI/runbook** |
| 4 | `/api/admin` | `routes/admin.ts` | **Platform Control Plane Satellite** | implemented | Per-route JWT + local inline `requireAdmin` (4 handlers: Block ID / audit) | **document satellite**; **migrate into canonical Admin Portal** (0B-B+) |
| 5 | `/api/admin/ai-providers` | `routes/ai-provider-usage.ts` | **AI Admin Satellite** | implemented | Per-route JWT + local inline `requireAdmin` (8 handlers) | **document satellite**; align auth in 0B-B; surface owned by Admin Portal UI |
| 6 | `/api/admin/business-ai` | `routes/adminBusinessAI.ts` | **AI Admin Satellite** | implemented | Router-level JWT; per-handler inline `userRole === 'ADMIN'` (5 handlers) | **document satellite**; **defer to 0D AI Admin** for retirement/merge |
| 7 | `/api/admin/seed` | `routes/admin-seed-modules.ts` | **Emergency Ops** | emergency | Mount: JWT; handler: `getUserFromRequest` + ADMIN role (1 handler) | **move to CLI/runbook**; **gate** behind env flag (0B-B+) |
| 8 | `/api/admin/logs` | `routes/admin-logs.ts` | **Platform Control Plane Satellite** | implemented | Mount: JWT; admin paths: `requireRole('ADMIN')`; `/client` open to any authed user (12 handlers) | **document satellite**; keep until log ops unified under canonical portal |
| 9 | `/api/admin-override` | `routes/admin-override.ts` | **Platform Control Plane Satellite** | implemented | Per-route JWT + local inline `requireAdmin` (6 handlers: role/tier overrides) | **document satellite**; **migrate into canonical Admin Portal** (overrides UI exists) |
| 10 | `/api/admin-setup` | `routes/admin-setup.ts` | **Emergency Ops** | emergency | **Conditional mount:** `ENABLE_ADMIN_SETUP_ROUTES=true` + `ADMIN_SETUP_SECRET` ≥16 chars; router-level shared-secret header/body (6 handlers; no JWT) | **gate** (already conditional); **move to CLI/runbook** |
| 11 | `/api/admin/hr-setup` | `routes/admin-hr-setup.ts` | **Emergency Ops** | emergency | Mount: JWT; handler: inline ADMIN check via `getUserFromRequest` (2 handlers) | **move to CLI/runbook**; document in HR runbook |
| 12 | `/api/admin/fix-hr` | `routes/admin-fix-hr.ts` | **Emergency Ops** | emergency | Mount: JWT; handler: inline ADMIN check (3 handlers; `execSync` migrations) | **move to CLI/runbook**; **retire** HTTP after HR module stable |
| 13 | `/api/admin/create-hr-tables` | `routes/admin-create-hr-tables.ts` | **Emergency Ops** | emergency | Mount: JWT; handler: inline ADMIN check (1 handler; raw SQL DDL) | **move to CLI/runbook**; **retire** HTTP |
| 14 | `/api/admin/fix-subscriptions` | `routes/admin-fix-subscriptions.ts` | **Emergency Ops** | emergency | Mount: JWT; handler: inline ADMIN check (2 handlers; raw SQL ALTER) | **move to CLI/runbook**; **retire** HTTP |
| 15 | `/api/centralized-ai` | `routes/ai-centralized.ts` | **AI Admin Satellite** | legacy | Mount: JWT + `requireAdmin` (`adminPortalShared`) + `centralizedAiDeprecatedMiddleware` (97 handlers; mock-heavy scaffold) | **defer to 0D AI Admin**; retire body / return 410 for remaining duplicates |
| 16 | `/api/ai-context-debug` | `routes/ai-context-debug.ts` | **Developer/Test Surface** | debug | Per-route JWT + `requireRole('ADMIN')` (6 handlers) | **gate** (same pattern as 0E-E); **document satellite** |
| 17 | `/api/admin/modules/ai/*` | `routes/moduleAIContext.ts` (paths under `/admin/modules/ai/…`) | **Platform Control Plane Satellite** | implemented | Mounted at `/api`; admin section: JWT + `requireRole('ADMIN')` (9 handlers) | **document satellite**; keep with module AI context system |
| 18 | `/api/debug` | `routes/debug-modules.ts` | **Developer/Test Surface** | debug | **No auth**; mount only when `NODE_ENV !== 'production'` OR `ENABLE_PUBLIC_DEBUG_ROUTES=true` (3 handlers) | **gate** (env); **retire** from production paths |
| 19 | `/api/debug/database` | `routes/debug-database.ts` | **Developer/Test Surface** | debug | **No auth**; same env gate as `/api/debug` (1 handler) | **gate** (env); **retire** |
| 20 | `/api/debug/business-tier` | `routes/debug-business-tier.ts` | **Developer/Test Surface** | debug | Mount when non-prod OR `ENABLE_DEBUG_BUSINESS_TIER=true`; router JWT + `requireRole('ADMIN')` (2 handlers) | **gate** (env); **document satellite** |
| 21 | `/api/business-ai` | `routes/businessAI.ts` | **Business Admin Surface** | implemented | Business-scoped AI (not platform admin); listed for boundary clarity — **not** Admin Portal | **document satellite** (out of portal scope) |

### 2.1 Canonical mount internal emergency paths (same prefix)

These are **not** separate mounts but are high-risk ops on the canonical router:

| Path | File | Auth | Gate | Future Disposition |
|------|------|------|------|-------------------|
| `POST /api/admin-portal/database/migrations/delete` | `adminPortalRoutes.platform.ts` | JWT + admin | `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED` + confirm token (0E-B) | **keep canonical** (gated) |
| `POST /api/admin-portal/database/migrations/reset-baseline` | `adminPortalRoutes.platform.ts` | JWT + admin | Same dangerous-ops gate (0E-B) | **keep canonical** (gated) |
| `GET /api/admin-portal/test` | `adminPortalRoutes.core.ts` | JWT + admin | UI gated via `ADMIN_PORTAL_DEBUG_ENABLED` (0E-E) | **gate** / remove debug handler in 0B-B |

---

## 3. Domain summary — `/api/admin-portal` (canonical)

| Domain file | Approx. handlers | Primary UI surfaces |
|-------------|------------------|---------------------|
| `adminPortalRoutes.core.ts` | 16 | dashboard, users, moderation, impersonation |
| `adminPortalRoutes.analyticsOps.ts` | 45 | analytics, performance, security events |
| `adminPortalRoutes.platform.ts` | 38 | BI, support, system, database, integrations |
| `adminPortalRoutes.aiPipeline.ts` | 45 | ai-pipeline admin |
| `adminSecurityRoutes.ts` | 7 | security monitoring (sub-mount) |

---

## 4. Emergency ops inventory (10 HTTP surfaces)

### 4.1 Bootstrap / one-time setup

| Route | Method | Purpose | Route File | Auth | Risk | Remain HTTP? | Future Disposition |
|-------|--------|---------|------------|------|------|--------------|-------------------|
| `/api/admin-setup/create-andrew-admin` | POST | Create named bootstrap admin in production | `admin-setup.ts` | Shared secret only (no JWT) | Account creation / privilege escalation if secret leaks | **No** (prefer CLI) | **move to CLI/runbook**; keep secret gate until retired |
| `/api/admin-setup/update-andrew-password` | POST | Reset bootstrap admin password | `admin-setup.ts` | Shared secret | Credential takeover | **No** | **move to CLI/runbook** |
| `/api/admin-setup/promote-existing-user` | POST | Promote user to ADMIN | `admin-setup.ts` | Shared secret | Privilege escalation | **No** | **move to CLI/runbook** |
| `/api/admin-setup/delete-duplicate-admin` | DELETE | Remove duplicate admin records | `admin-setup.ts` | Shared secret | Destructive identity ops | **No** | **retire** after bootstrap stable |
| `/api/admin-setup/admin-users` | GET | List admin users | `admin-setup.ts` | Shared secret | User enumeration | **No** | **retire** |
| `/api/admin-setup/all-users` | GET | List all users | `admin-setup.ts` | Shared secret | PII enumeration | **No** | **retire** |

**Mount condition:** `ENABLE_ADMIN_SETUP_ROUTES=true` **and** `ADMIN_SETUP_SECRET` length ≥ 16 (`server/src/index.ts` L938–947).

### 4.2 HR / schema emergency repairs

| Route | Method | Purpose | Route File | Auth | Risk | Remain HTTP? | Future Disposition |
|-------|--------|---------|------------|------|------|--------------|-------------------|
| `/api/admin/hr-setup/seed` | POST | Manually seed HR module record/installation | `admin-hr-setup.ts` | JWT + inline ADMIN | Module/registry mutation | **Maybe** (diagnostics) | **move to CLI/runbook** |
| `/api/admin/hr-setup/status` | GET | HR module/installation diagnostic | `admin-hr-setup.ts` | JWT + inline ADMIN | Read-only diagnostic | **Yes** (low) | **migrate into canonical Admin Portal** or HR ops runbook |
| `/api/admin/fix-hr/run-migrations` | POST | Run `npx prisma migrate deploy` via `execSync` | `admin-fix-hr.ts` | JWT + inline ADMIN | Shell execution, schema drift | **No** | **move to CLI/runbook**; **retire** |
| `/api/admin/fix-hr/check-db` | GET | Inspect HR table presence | `admin-fix-hr.ts` | JWT + inline ADMIN | Schema introspection | **Yes** (read-only) | **document satellite** → runbook |
| `/api/admin/fix-hr/seed-module` | POST | Seed HR module after repair | `admin-fix-hr.ts` | JWT + inline ADMIN | Module mutation | **No** | **move to CLI/runbook** |
| `/api/admin/create-hr-tables` | POST | Create HR tables via raw SQL DDL | `admin-create-hr-tables.ts` | JWT + inline ADMIN | Raw DDL / bypass migrations | **No** | **retire**; replace with migration pipeline |
| `/api/admin/fix-subscriptions/add-employee-columns` | POST | ALTER subscriptions table (raw SQL) | `admin-fix-subscriptions.ts` | JWT + inline ADMIN | Schema mutation outside migrations | **No** | **retire** |
| `/api/admin/fix-subscriptions/check` | GET | Verify subscriptions column state | `admin-fix-subscriptions.ts` | JWT + inline ADMIN | Read-only diagnostic | **Yes** (low) | **document satellite** |

### 4.3 Module seed emergency

| Route | Method | Purpose | Route File | Auth | Risk | Remain HTTP? | Future Disposition |
|-------|--------|---------|------------|------|------|--------------|-------------------|
| `/api/admin/seed/seed-core-modules` | POST | Create Drive/Chat/Calendar modules + install for all businesses | `admin-seed-modules.ts` | JWT + inline ADMIN | Mass module installation | **No** | **move to CLI/runbook**; UI at `/admin-portal/seed-modules` gated (0E-E) |

### 4.4 Canonical mount dangerous ops (documented for AP-F-022 completeness)

| Route | Method | Purpose | Route File | Auth | Risk | Remain HTTP? | Future Disposition |
|-------|--------|---------|------------|------|------|--------------|-------------------|
| `/api/admin-portal/database/migrations/delete` | POST | Delete `_prisma_migrations` row | `adminPortalRoutes.platform.ts` | JWT + admin + dangerous-ops env + confirm | Migration history corruption | **Only gated** | **keep canonical** (0E-B gate) |
| `/api/admin-portal/database/migrations/reset-baseline` | POST | Reset migration baseline | `adminPortalRoutes.platform.ts` | JWT + admin + dangerous-ops env + confirm | Database integrity | **Only gated** | **keep canonical** (0E-B gate) |

---

## 5. Auth pattern fragmentation (updated 0B-D — AP-F-011 resolved)

| Pattern | Used by |
|---------|---------|
| `requireAdmin` from `adminPortalShared.ts` / `adminPortalAuth.ts` | `admin-portal/*`, `admin.ts`, `admin-portal-testing.ts`, mount-level `centralized-ai` |
| Local inline `requireAdmin` (documented exceptions) | `admin-override.ts`, `ai-provider-usage.ts`, `pricing.ts` (adjacent) |
| `requireRole('ADMIN')` | `admin-logs.ts`, `ai-context-debug.ts`, `moduleAIContext.ts` admin paths, `debug-business-tier.ts` |
| Inline `getUserFromRequest` + role check | Emergency HR/seed/fix routes |
| Shared secret only | `admin-setup.ts` |
| Env feature gates | `admin-setup`, `admin-portal/testing`, `debug/*`, dangerous migration ops |

**Canonical reference:** [ADMIN_PORTAL_AUTH_MODEL.md](./ADMIN_PORTAL_AUTH_MODEL.md) · [ADMIN_PORTAL_AUTH_MATRIX.md](./ADMIN_PORTAL_AUTH_MATRIX.md)

---

## 6. Future disposition summary

| Disposition | Mounts / routes |
|-------------|-----------------|
| **keep canonical** | `/api/admin-portal`, `/api/admin-portal/security`, gated dangerous migration ops |
| **document satellite** | `/api/admin`, `/api/admin/logs`, `/api/admin-override`, `/api/admin/ai-providers`, `/api/admin/modules/ai/*`, `/api/business-ai` (boundary only), `/api/debug/business-tier` |
| **migrate into canonical Admin Portal** | `/api/admin` (Block ID), `/api/admin-override` (overrides UI), `/api/admin/hr-setup/status` (diagnostics) |
| **retire** | `/api/admin/create-hr-tables`, `/api/admin/fix-hr/run-migrations`, `/api/admin/fix-subscriptions/add-employee-columns`, `/api/centralized-ai` body (0D), unauthenticated `/api/debug/*` |
| **gate** | `/api/admin-portal/testing` (**done** 0E-E), `/api/ai-context-debug` (recommended 0B-B), `/api/admin/seed`, `/api/admin-setup` (already conditional) |
| **move to CLI/runbook** | All `/api/admin-setup/*`, HR fix/seed routes, `/api/admin/seed/seed-core-modules`, `/api/admin-portal/testing` shell runner |
| **defer to 0D AI Admin** | `/api/centralized-ai`, `/api/admin/business-ai` |
| **defer to 1B Governance Architecture** | Unified audit taxonomy across all mounts; Policy Engine evaluation |

---

## 7. Verification (2026-06-17)

```bash
rg "app.use\('/api/(admin|centralized-ai|ai-context-debug|debug)" server/src/index.ts
rg "admin-setup|fix-hr|create-hr-tables|fix-subscriptions|admin-override" server/src/index.ts server/src/routes
```

All mounts in §2 were found in `server/src/index.ts` except:

- `/api/admin/modules/ai/*` — mounted via `app.use('/api', moduleAIContextRouter)` (L951)
- `/api/admin-portal/security` — sub-mount inside `admin-portal.ts` (not a separate `app.use` in index)

**Count:** 21 distinct admin-adjacent mount prefixes (+ 1 business-adjacent boundary entry) inventoried.

---

## 8. Finding status

| Finding | Status | Evidence |
|---------|--------|----------|
| **AP-F-006** — API mount fragmentation | **Resolved** (inventory) | This document §2–§3; verification §7 |
| **AP-F-022** — Emergency HR ops mounts outside portal | **Resolved** (inventory) | This document §4 |

**Not closed by this package:** consolidation (AP-F-015), registry (AP-F-009), or route removal. Auth unification (AP-F-011) closed in 0B-D.
