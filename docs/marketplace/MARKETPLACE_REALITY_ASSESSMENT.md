# Marketplace — Reality Assessment

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Authority:** Post–Platform Kernel L2, Unified Search L2 CwF, AI Retrieval L2 CwF, Context Graph L4 CwF  
**Status:** Discovery only — **no implementation, no redesign, no SDK**

---

## 1. Executive summary

Vssyl has a **substantial marketplace backend and admin surface** that exceeds what Memory Bank product context still describes as "planned UI." The platform is **not greenfield** for module distribution.

| Layer | Reality | Maturity |
|-------|---------|----------|
| **Marketplace API** | Full CRUD: browse, install, submit, review, runtime, upload | **L3** (managed lifecycle) |
| **Marketplace UI** | `/modules` browse/install; submit wizard; admin portal governance | **L2** (functional, not polished) |
| **Third-party runtime** | Sandboxed iframe + GCS bundle path via `ModuleHost` | **L2** (MVP shipped) |
| **Artifact pipeline** | GCS upload sessions, baseline scan, version publish | **L2** (production-capable) |
| **Billing** | Stripe personal subs; business module subs model unused | **L1** (partial) |
| **Ecosystem participation** | Search/V_Link/CG adapters static; partner AI context works | **L1** (first-party biased) |

**Bottom line:** Marketplace is a **real platform capability** with ~**70% of installable-module infrastructure** in place. It is **not yet a third-party ecosystem platform** — dynamic capability registration, partner onboarding UX, business billing parity, and runtime integration into business workspace remain gaps.

---

## 2. Marketplace functionality inventory

### 2.1 Marketplace UI

| Surface | Path | Status | Notes |
|---------|------|--------|-------|
| **Module marketplace browse** | `web/src/app/modules/page.tsx` | **Implemented** | Search, category filter, scope (personal/business), install/uninstall/configure, "Open" → `/modules/run/:id` |
| **Module submission wizard** | `web/src/app/modules/submit/page.tsx` | **Implemented** | Metadata + artifact upload flow (init → GCS PUT → finalize) |
| **Third-party runtime page** | `web/src/app/modules/run/[moduleId]/page.tsx` | **Implemented** | Loads runtime config; renders `ModuleHost` |
| **Developer portal (revenue/pricing)** | Backend `/api/developer` | **Partial** | API exists; dedicated public partner portal UI limited |
| **Admin module governance** | `web/src/app/admin-portal/modules/page.tsx` | **Implemented** | Submissions queue, certification panel, version promote/rollback, bulk actions (~2100 lines) |
| **Module details modal** | Embedded in `/modules` page | **Implemented** | Reviews, screenshots, install CTA |
| **Marketplace notifications** | — | **Stubbed** | No marketplace-specific notification types for updates/approvals |
| **AI module recommendations** | — | **Unused** | Not implemented |

**Memory Bank drift:** `memory-bank/marketplaceProductContext.md` §4a still marks "UI for Browsing/Managing Modules" as planned — **code contradicts this**; UI exists at basic maturity.

### 2.2 Marketplace routes (API)

Primary router: `server/src/routes/module.ts` → mounted at **`/api/modules`**.

| Endpoint | Handler | Status |
|----------|---------|--------|
| `GET /marketplace` | `getMarketplaceModules` | **Implemented** |
| `GET /installed` | `getInstalledModules` | **Implemented** |
| `GET /categories` | `getModuleCategories` | **Implemented** |
| `GET /:moduleId` | `getModuleDetails` | **Implemented** |
| `POST /submit` | `submitModule` | **Implemented** |
| `GET /submissions` | `getModuleSubmissions` (admin) | **Implemented** |
| `GET /user/submissions` | `getUserSubmissions` | **Implemented** |
| `POST /submissions/:id/review` | `reviewModuleSubmission` | **Implemented** |
| `POST /:moduleId/install` | `installModule` | **Implemented** |
| `DELETE /:moduleId/uninstall` | `uninstallModule` | **Implemented** |
| `PUT /:moduleId/configure` | `configureModule` | **Implemented** |
| `GET /:moduleId/runtime` | `getModuleRuntimeConfig` | **Implemented** |
| `POST /:moduleId/uploads/init` | `initModuleArtifactUpload` | **Implemented** (503 without GCS) |
| `POST /:moduleId/uploads/:id/finalize` | `finalizeModuleArtifactUpload` | **Implemented** |
| `POST /:moduleId/versions/:version/promote` | `promoteModuleVersion` | **Implemented** |
| `POST /link-business` | `linkModuleToBusiness` | **Implemented** |
| `GET /business/:businessId` | `getBusinessModules` | **Implemented** |

Duplicate admin APIs under `/api/admin-portal/modules/*` (`adminPortalRoutes.analyticsOps.ts`) — same underlying services.

### 2.3 Module installation flows

| Flow | Scope | Status | Key files |
|------|-------|--------|-----------|
| **Personal install** | `ModuleInstallation` | **Implemented** | `moduleProvisionController.installModule` |
| **Business install** | `BusinessModuleInstallation` | **Implemented** | Membership + role checks |
| **Core business bootstrap** | Auto-install on business create | **Implemented** | `businessBootstrapService.installCoreBusinessModules` |
| **Built-in always-available** | Personal scope without DB row | **Implemented** | `BUILT_IN_MODULE_IDS` merge in `getInstalledModules` |
| **Paid module gate** | Personal: `ModuleSubscription`; Business: `BusinessModuleSubscription` | **Partial** | Business subscription **never created** in code |
| **Policy Engine gate** | `module:install` / `module:uninstall` | **Implemented** | `moduleInstallPolicyDual.ts`, `moduleUninstallPolicyDual.ts` |
| **Domain events** | `module.installed` / `module.uninstalled` | **Implemented** | `domainEventEmitters.ts` |

### 2.4 Module management

| Capability | Status | Notes |
|------------|--------|-------|
| Enable/disable installed module | **Implemented** | `configureModule` |
| Per-scope configuration JSON | **Implemented** | `ModuleInstallation.configured` |
| Version history | **Implemented** | `ModuleVersion` + admin promote/rollback |
| Developer business linkage | **Implemented** | `linkModuleToBusiness` → `isDeveloperBusiness` |
| Module suspension | **Implemented** | Admin `PATCH /modules/:id/status` |
| Module analytics (admin) | **Implemented** | Downloads, revenue, developer stats |
| User-facing module settings UI | **Partial** | Configure API exists; limited dedicated settings pages for third-party |

### 2.5 Module discovery

| Mechanism | Status | Notes |
|-----------|--------|-------|
| Marketplace search/filter | **Implemented** | Query params on `/marketplace` |
| Category browse | **Implemented** | Prisma `ModuleCategory` enum |
| Global unified search | **Partial** | Only static first-party providers; no marketplace module registry |
| AI context registry sync | **Implemented** | `ModuleRegistrySyncService` on approval |
| Manifest `tags[]` | **Implemented** | Stored; used in marketplace filters |
| Recommendations/ranking | **Unused** | No ML or featured algorithm |

### 2.6 Module metadata & registry

| Source | Status | Notes |
|--------|--------|-------|
| `Module` Prisma row | **Implemented** | Canonical marketplace record |
| `Module.manifest` JSON | **Implemented** | Runtime, frontend, permissions, AI context |
| `ModuleVersion.manifestSnapshot` | **Implemented** | Immutable published version |
| `builtInModuleManifests.ts` | **Implemented** | First-party manifest reconcile at startup |
| `ModuleAIContextRegistry` | **Implemented** | Synced from approved modules |
| `web/src/runtime/modules/coreModuleRegistry.ts` | **Implemented** | **First-party only** — hardcoded workspace definitions |
| Dynamic marketplace → workspace registry | **Partial** | Third-party modules use `/modules/run` iframe, not business workspace switch |

### 2.7 Module permissions

| Layer | Status | Notes |
|-------|--------|-------|
| Manifest `permissions[]` | **Implemented** | Declared + validated in certification |
| Install/uninstall PE | **Implemented** | Platform-level |
| Runtime permission exposure | **Implemented** | Sanitized in runtime config payload |
| Entity-level PE for partner data | **Unavailable on platform** | Partners enforce on their HTTPS APIs |
| Manifest permission → runtime enforcement bridge | **Partial** | Structural validation only; no generic PE adapter |

---

## 3. Marketplace maturity score

| Level | Definition | Assessment |
|-------|------------|------------|
| **0** | No marketplace | ❌ Not applicable |
| **1** | Module catalog | ✅ Surpassed |
| **2** | Installable modules | ✅ **Current baseline** — install, runtime, admin review work |
| **3** | Managed module ecosystem | 🟡 **Partial** — versioning, scan, certification, billing gaps |
| **4** | Platform ecosystem ready | ❌ — no dynamic capability registration |
| **5** | Third-party marketplace platform | ❌ — partner self-service incomplete |

**Current maturity: Level 2.5** (between Installable Modules and Managed Ecosystem)  
**Target maturity (12–18 mo): Level 4** (Platform Ecosystem Ready with partner program)  
**Stretch target: Level 5** (Open/partner marketplace with SDK)

### Blockers to Level 3

1. `BusinessModuleSubscription` write path missing  
2. Business workspace does not host third-party modules natively  
3. Hosted-URL-only submission still allowed (90-day cutoff not enforced)  
4. Docker sandbox not production-viable on Cloud Run  
5. No marketplace-specific operational runbooks beyond Phase 7 rollout

### Blockers to Level 4

1. Dynamic search provider registration (M-02)  
2. Dynamic Context Graph adapter registration  
3. V_Link entity type registration for partners  
4. Partner activity feed ingestion API  
5. Published Module SDK / developer portal UX

---

## 4. Platform readiness score (marketplace-specific)

| Dimension | Score (0–5) | Rationale |
|-----------|-------------|-----------|
| **Third-party modules** | 3 | Pipeline + runtime exist; workspace integration weak |
| **Module SDK** | 1 | Docs exist (`THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`); no npm SDK |
| **Marketplace certification** | 3 | Automated structural validator + admin gate; runtime behavior manual |
| **Capability participation** | 2 | AI context providers work; search/CG/V_Link static |
| **Ecosystem growth** | 2 | No public partner program, SLA, or revenue tooling completeness |

**Composite platform readiness: 2.2 / 5**

---

## 5. Reuse assessment

| Asset | Reuse recommendation |
|-------|---------------------|
| `/api/modules/*` router | **Keep** — extend, do not replace |
| Prisma module models | **Keep** — add fields via migration only when needed |
| GCS artifact pipeline | **Keep** — production path |
| `ModuleHost` iframe/bundle | **Keep** — extend postMessage bridge |
| `moduleCertificationValidator` | **Keep** — add checks incrementally |
| Admin portal governance UI | **Keep** — primary operator surface |
| `registerBuiltInModulesOnStartup` | **Keep** — separate from marketplace path |
| `coreModuleRegistry.ts` | **Extend** — add marketplace module resolution layer |
| Duplicate admin APIs | **Consolidate** (Phase 1 hygiene, not rebuild) |

---

## 6. Critical gaps vs. product vision

1. **Business workspace integration:** First-party modules render via `BusinessWorkspaceContent` switch; third-party modules redirect to iframe run page only.  
2. **Capability federation:** Platform capabilities (Search L2, AI Retrieval L2, Context Graph L4) do not expose partner registration APIs.  
3. **Billing parity:** Business paid modules cannot complete subscription lifecycle.  
4. **Developer experience:** Submission works; onboarding, sandbox tenant, test harness, and SDK are documentation-only.  
5. **Operational maturity:** Security monitoring endpoints partially mock; no marketplace SLO dashboard.

---

## 7. Related documents

| Document | Purpose |
|----------|---------|
| [MODULE_ECOSYSTEM_ARCHITECTURE_AUDIT.md](./MODULE_ECOSYSTEM_ARCHITECTURE_AUDIT.md) | Architecture alignment |
| [MODULE_LIFECYCLE_REVIEW.md](./MODULE_LIFECYCLE_REVIEW.md) | Registration → runtime lifecycle |
| [MODULE_CAPABILITY_INTEGRATION_MATRIX.md](./MODULE_CAPABILITY_INTEGRATION_MATRIX.md) | Platform capability access |
| [MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md](./MARKETPLACE_GCP_DEPLOYMENT_ANALYSIS.md) | Cloud deployment fit |
| [MARKETPLACE_SECURITY_REVIEW.md](./MARKETPLACE_SECURITY_REVIEW.md) | Isolation and trust boundaries |
| [MARKETPLACE_STRATEGIC_POSITIONING.md](./MARKETPLACE_STRATEGIC_POSITIONING.md) | Strategic options |
| [MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_0A_EXECUTIVE_SUMMARY.md) | Executive rollup |

**Canonical pipeline:** [`docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)

---

**Last updated:** 2026-06-23
