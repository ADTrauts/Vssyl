# Admin Portal — Modernization Plan

**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Date:** 2026-07-05  
**Status:** Wave 2 complete — Wave 3+ planning

**Product name (UI):** Operations Platform — routes remain `/admin-portal`.

**Constraint:** Consolidation over creation. No architecture redesign. No parallel systems. Do not rebuild completed subsystems (AI Pipeline, module certification, billing, impersonation).

**Related:** [Reference Assessment](./ADMIN_PORTAL_REFERENCE_ASSESSMENT.md) · [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md) · [Information Architecture](./ADMIN_PORTAL_INFORMATION_ARCHITECTURE.md)

---

## 1. Objective

Close the **~7% gap** between today's Operations Platform (~93% operational maturity post–Wave 2) and full operational excellence (~95% target).

**Not in scope:** Policy Engine admin UI, full GCP console replacement, product funnel instrumentation platform, Stripe Connect payouts, sub-role RBAC.

---

## 2. Guiding rules

| Rule | Detail |
|------|--------|
| Reuse shells | `AdminPortalPageShell`, `PlatformProgramCard`, `PipelineSubpageShell` |
| Reuse services | Extend `admin*Service` — no new monolith |
| Canonical API first | New routes on `/api/admin-portal` only |
| No mock fallbacks | Error + retry per 0E-C standard |
| Preserve certification | AI Pipeline and module gate unchanged |
| Env gates preserved | Debug and dangerous ops stay gated |

---

## 3. Work packages

### Wave 0 — Quick wins (1 week) ✅ **Complete 2026-07-05**

See [Wave 0 Closeout](./ADMIN_PORTAL_WAVE_0_CLOSEOUT.md).

| ID | Item | Type | Files / surfaces | Effort | Status |
|----|------|------|------------------|--------|--------|
| W0-1 | Wire header "System Online" to live health | Modernize | `layout.tsx`, `PlatformHealthIndicator` | S | ✅ |
| W0-2 | Redirect `ai-context` → `ai-pipeline/diagnostics` | Consolidate | `ai-context/page.tsx` | S | ✅ |
| W0-3 | Redirect `ai-system` → `ai-pipeline` | Deprecate | `ai-system/page.tsx` | S | ✅ |
| W0-4 | Probe result toast on readiness card | Modernize | `MarketplaceReadinessCard` | S | ✅ |
| W0-5 | Link email test API from System Admin | Consolidate | `system/page.tsx`, email-notification | S | ✅ |
| W0-6 | Dashboard health panel | Modernize | `PlatformOperationsPanel`, operations-status API | S | ✅ |

### Wave 1 — Operator workflow (2–3 weeks) ✅ **Complete 2026-07-05**

See [Wave 1 Closeout](./ADMIN_PORTAL_WAVE_1_CLOSEOUT.md).

| ID | Item | Type | Description | Effort | Status |
|----|------|------|-------------|--------|--------|
| W1-1 | **Businesses hub** | Missing → Complete | `/admin-portal/businesses` — list, owners, tier, health, impersonate/billing links | M | ✅ |
| W1-2 | **Email Operations** | Missing → Complete | `/admin-portal/email-operations` — SMTP, templates, previews, test send | M | ✅ |
| W1-3 | **Global operator search** | Missing → Complete | Header search → users, businesses, modules, tickets, subscriptions, settings | M | ✅ |
| W1-4 | **Analytics federation** | Consolidate | `analytics?tab=federation` — links to billing, modules, AI, performance satellites | M | ✅ |
| W1-5 | **Operator UX** | Modernize | Nav, breadcrumbs, dashboard quick links, cross-linking | S | ✅ |
| W1-6 | **System timeline** | Consolidate | Dashboard timeline from auditLog + securityEvent + business creates | M | ✅ |

### Wave 2 — Operational intelligence ✅ **Complete 2026-07-05**

See [Wave 2 Closeout](./OPERATIONS_PLATFORM_WAVE_2_CLOSEOUT.md).

| ID | Item | Type | Description | Effort | Status |
|----|------|------|-------------|--------|--------|
| W2-0 | **Operations Platform rename** | Positioning | UI terminology; routes unchanged | S | ✅ |
| W2-1 | **Business intelligence** | Modernize | Warnings, activity, billing events on Businesses hub | M | ✅ |
| W2-2 | **Email intelligence** | Modernize | Failure rate, recent sends, provider health | M | ✅ |
| W2-3 | **Infrastructure intelligence** | Modernize | GCP links, Stripe/SMTP modes, service grid | M | ✅ |
| W2-4 | **Feature flags snapshot** | Missing → Complete | Read-only `/admin-portal/feature-flags` | M | ✅ |
| W2-5 | **Grouped timeline** | Modernize | Category-grouped operations timeline | M | ✅ |
| W2-6 | **Global operator insight** | Modernize | Dashboard intelligence panel | M | ✅ |

### Wave 3 — P2 operator depth (2 weeks)

| ID | Item | Type | Description | Effort |
|----|------|------|-------------|--------|
| W3-0 | **Support context sidebar** | Modernize | Link ticket → user profile + business | S |
| W3-1 | **Persist probe results** | Modernize | Store last probe outcome | M |
| W3-2 | **Search ops page** | Missing → Complete | Lightweight page: delegate registry status, pilot module probe, link to Modules | S |
| W3-3 | **Performance metrics real probes** | Modernize | Replace synthetic CPU/memory where possible with health service data | M |
| W3-4 | **Modules page tab extraction** | Modernize | Split 2,100 LOC page into tab components (no behavior change) | M |

### Wave 4 — P3 satellite migration (ongoing, low urgency)

| ID | Item | Type | Description | Effort |
|----|------|------|-------------|--------|
| W4-1 | Migrate `/api/admin/logs` handlers | Consolidate | Proxy to `/api/admin-portal/logs` | M |
| W4-2 | Migrate `/api/admin/ai-providers` | Consolidate | Under `/api/admin-portal/providers` | M |
| W4-3 | Migrate `/api/admin-override` | Consolidate | Under `/api/admin-portal/overrides` | S |
| W4-4 | Migrate `/api/pricing` admin ops | Consolidate | Under `/api/admin-portal/pricing` | M |
| W4-5 | Remove debug pages from prod build | Deprecate | Tree-shake or 404 when debug gate off | S |

---

## 4. Recommended implementation order

```
W0 (quick wins)
  ↓
W1-3 Dashboard health strip
  ↓
W1-1 Businesses hub
  ↓
W1-2 Email Operations
  ↓
W1-4 Global search
  ↓
W2-1 Analytics/BI merge
  ↓
W2-2 Infra health panel
  ↓
W2-3 Feature flags snapshot
  ↓
W3-1 Jobs monitor
  ↓
W3-2 Search ops
  ↓
W4 satellite migration (parallel, low risk)
```

**Total estimated calendar time:** 6–8 weeks with one engineer (waves sequential; W4 parallel).

---

## 5. What we explicitly will NOT do

| Item | Reason |
|------|--------|
| Rebuild AI Pipeline admin | L3 reference — complete |
| Rebuild module certification gate | Production-grade |
| Create parallel billing admin | billing page complete |
| Register admin as marketplace module | Constitutional violation |
| Build analytics warehouse | Analytics program scope |
| Replace GCP console for infra provisioning | Ops outside portal charter |
| Implement sub-role RBAC in Wave 1–3 | Future hardening |
| Product funnel instrumentation | Launch/product readiness program |

---

## 6. Success metrics

| Metric | Baseline (2026-07-05) | Post–Wave 0 | Target (post-Wave 3) |
|--------|----------------------:|------------:|---------------------:|
| Operational maturity | 82% | **86%** | 92% |
| UX completion | 78% | **82%** | 88% |
| IA maturity | 75% | 76% | 90% |
| Routine ops without leaving portal | ~70% | **~78%** | ~90% |
| Orphan pages | 13 | ≤5 (debug only) |
| Satellite mounts unmigrated | 6 | ≤2 |
| Operator clicks to find business | 3+ | 1–2 |

---

## 7. Dependencies

| Dependency | Blocks | Owner |
|------------|--------|-------|
| `/api/health` stable in production | W0-1, W1-3, W2-2 | Backend (exists) |
| `emailNotification` routes documented | W1-2 | Backend (exists) |
| `platformCronJobs` registration | W3-1 | Backend (exists) |
| Business list API completeness | W1-1 | May need new admin-portal route |
| Launch Readiness SMTP verified | W1-2 | ✅ Complete |
| Stripe billing portal | W1-1 business subscription join | ✅ Complete |

---

## 8. Risk register

| Risk | Mitigation |
|------|------------|
| Businesses hub duplicates impersonation | Impersonation stays; Businesses adds CRM context |
| BI merge breaks bookmarks | Permanent redirect from business-intelligence |
| Feature flags page exposes secrets | Show flag names + boolean only; never values |
| Satellite migration breaks clients | Deprecation headers; 2-release overlap |
| Modules page refactor introduces regressions | Extract-only; no logic change; integration tests |

---

## 9. Testing expectations per wave

| Wave | Tests |
|------|-------|
| W0 | Manual smoke; optional redirect tests |
| W1 | `admin-portal-businesses` integration test; search e2e |
| W2 | Analytics tab route test; probe persistence unit test |
| W3 | Cron status endpoint test |
| W4 | Existing route governance tests updated |

---

## 10. Memory Bank updates (post-implementation)

When waves complete, update:
- `memory-bank/adminProductContext.md` — new surfaces
- `docs/guides/ADMIN_PORTAL.md` — operator how-to
- `docs/admin-portal/README.md` — index

---

**Last updated:** 2026-07-05
