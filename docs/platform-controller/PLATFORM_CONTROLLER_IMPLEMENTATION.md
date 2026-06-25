# Platform Controller — Phase 1B Implementation

**Program:** Platform Controller Program — Phase 1B  
**Date:** 2026-06-24  
**Status:** Implemented

**Phase 1A design:** [Information Architecture](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) · [Navigation Model](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) · [Platform Programs Hub Design](./PLATFORM_PROGRAMS_HUB_DESIGN.md)

---

## 1. Summary

Phase 1B implements the approved information architecture **without new platform capabilities, backend refactors, or duplicate dashboards**. Routes, folders, and code identifiers remain `admin-portal`; only **shell copy** and **navigation** reflect **Platform Controller**.

---

## 2. Delivered changes

### 2.1 Branding (shell copy only)

| Surface | Before | After |
|---------|--------|-------|
| Header title | Admin Portal | **Platform Controller** |
| Header subtitle | Platform Administration | **Operational control plane** |
| Dashboard title | Admin Dashboard | **Platform Overview** |
| Root redirect loading | Admin Portal | Platform Controller |

### 2.2 Navigation

**Source of truth:** `web/src/config/platformControllerNavigation.ts`  
**Consumer:** `web/src/app/admin-portal/layout.tsx`

| Domain | Items |
|--------|-------|
| Overview | Platform Overview, Platform Analytics |
| Platform Programs | Platform Programs hub |
| Marketplace | Modules, Developers |
| AI & Diagnostics | AI Pipeline, Diagnostics, System Logs, Performance |
| Operations | Users, Moderation, Support, Impersonation |
| Providers | Provider Governance (deep link) |
| Security | Security & Compliance |
| Billing | Financial Management, Pricing |
| Configuration | System, Governance, Data Retention |
| Operator Labs (collapsed) | Overrides, Testing*, Seed Modules* |

\*Env-gated via `ADMIN_PORTAL_DEBUG_ENABLED`

**Removed from nav:** AI System (route preserved at `/admin-portal/ai-system`)

### 2.3 Platform Programs hub

| Attribute | Value |
|-----------|-------|
| Route | `/admin-portal/platform-programs` |
| Page | `web/src/app/admin-portal/platform-programs/page.tsx` |
| Config | `web/src/config/platformPrograms.ts` |
| Health hook | `usePlatformProgramsHubHealth.ts` (existing APIs only) |
| Card | `PlatformProgramCard.tsx` |

### 2.4 Workflow improvements

| Workflow | Improvement |
|----------|-------------|
| Platform program discovery | Hub + dashboard quick links |
| Context Graph | `modules?tab=ai-context` query support |
| Impersonation | Duplicate debug routes → `/impersonate` |
| Provider management | Providers nav → `#provider-governance` |
| AI diagnostics | Diagnostics under AI & Diagnostics section |

### 2.5 API alignment (proxy aliases only)

**File:** `web/src/lib/platformControllerApiAliases.ts`  
**Applied in:** `web/src/app/api/[...slug]/route.ts`

| Canonical alias | Existing mount |
|-----------------|----------------|
| `/api/admin-portal/providers/*` | `/api/admin/ai-providers/*` |
| `/api/admin-portal/overrides/*` | `/api/admin-override/*` |
| `/api/admin-portal/modules/ai/*` | `/api/admin/modules/ai/*` |

Existing `adminApiService` paths unchanged — aliases enable gradual client migration.

---

## 3. Files added

```
web/src/config/platformPrograms.ts
web/src/config/platformControllerNavigation.ts
web/src/components/admin-portal/PlatformProgramCard.tsx
web/src/components/admin-portal/usePlatformProgramsHubHealth.ts
web/src/app/admin-portal/platform-programs/page.tsx
web/src/lib/platformControllerApiAliases.ts
web/src/lib/__tests__/platformControllerPhase1B.test.ts
docs/platform-controller/PLATFORM_CONTROLLER_IMPLEMENTATION.md
docs/platform-controller/PLATFORM_PROGRAM_CARD_STANDARD.md
docs/platform-controller/PLATFORM_CONTROLLER_PHASE_1B_CLOSEOUT.md
```

---

## 4. Files modified

```
web/src/app/admin-portal/layout.tsx
web/src/app/admin-portal/dashboard/page.tsx
web/src/app/admin-portal/page.tsx
web/src/app/admin-portal/modules/page.tsx
web/src/app/admin-portal/test-impersonation/page.tsx
web/src/app/admin-portal/impersonation-test/page.tsx
web/src/middleware.ts
web/src/app/api/[...slug]/route.ts
web/src/lib/__tests__/adminPortalBoundaryCleanup.test.ts
docs/platform-controller/*.md (Phase 1A updates)
```

---

## 5. Explicitly not changed

- Express route mounts and handlers
- Domain services
- Certification ledger
- AI System page implementation (bookmark-compatible)
- MarketplaceReadinessCard / certification panel behavior
- Visual redesign / token migration wave

---

## 6. Verification

```bash
cd web && pnpm vitest run src/lib/__tests__/platformControllerPhase1B.test.ts
```

---

**Last updated:** 2026-06-24 (Phase 1B implementation)
