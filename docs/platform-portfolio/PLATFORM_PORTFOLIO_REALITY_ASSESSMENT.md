# Platform Portfolio — Reality Assessment

**Program:** Vssyl Platform Portfolio Reality Assessment  
**Assessment date:** 2026-06-19  
**Authority:** Post-completion of Admin Portal, Business Administration, Context Graph, and Business Operations certification programs  
**Status:** Discovery only — **no certification, no implementation, no ledger changes**

**Constraint:** Governance and discovery only. No runtime code, schemas, routes, tests, UX, modernization packages, or certification execution.

---

## Purpose

Produce a complete inventory of the Vssyl platform landscape after four major modernization/certification programs closed. Identify what remains **unaudited**, **uncertified**, **architecturally indebted**, and **candidate for next modernization**.

This is **not** a certification program.

---

## Assessment scope

| Area | Sections |
|------|----------|
| A | Identity & Profile |
| B | Settings Ecosystem |
| C | Billing & Commerce |
| D | AI Platform |
| E | Calendar |
| F | Place |
| G | Platform Capabilities |

**Authoritative inputs:** [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md), [`PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md), [`REFERENCE_MODULE_CATALOG.md`](../architecture/REFERENCE_MODULE_CATALOG.md), completed program archives (Admin Portal, BA, Context Graph, Business Operations), codebase inventory (routes, services, web surfaces).

---

## Executive posture

Four platform programs are **complete and archived**. The certified core is strong: **File Hub (L4)**, **six architecture L3 modules** (Chat, Calendar, Todo, Notebook, Place + Notes L2 dependency), **three platform domains/systems at L3** (Admin Portal, Business Administration, Context Graph), and **Business Operations domain L3 WITH FINDINGS** (HR, Scheduling, Workforce Communications).

The **remaining landscape** clusters into four buckets:

1. **Certified but hygiene-only** — Calendar, Place, Chat, Todo, Notebook (post-L3 punch-lists; no new certification waves)
2. **Platform capability gaps (L1–L2)** — Identity, Settings, Billing, AI Platform, Dashboard, Analytics, Workspace shells, cross-cutting systems (Domain Events, Activity reads, Search, Scheduler)
3. **Unaudited product domains** — No constitutional audit or operation matrix for Identity/Profile, Settings platform, or Billing/Commerce as platform capabilities
4. **Deferred by explicit council/ROI decision** — AI Platform L3 (52/100 readiness, rank 5/5); Reference Workspace WS-L3; Analytics product module

---

## A. Identity & Profile

### Inventory

| Surface | Route / API | Backend | Web | SoR |
|---------|-------------|---------|-----|-----|
| Personal profile (name) | `GET/PUT /api/profile` | Inline in `server/src/index.ts` (no controller module) | `/profile` | `User` model |
| Profile photos / avatar | `/api/profile-photos` | `profilePhotoController.ts` + `storageService` | `/profile/settings?tab=photos`, `ProfilePhotoManager` | `UserProfilePhoto`; slots on `User` |
| User preferences (KV) | `/api/user/preferences/:key` | `userPreferenceService.ts` | `/profile/settings?tab=preferences` | `UserPreference` |
| Location / Vssyl ID | `/api/location/*` | `locationService.ts` | `/profile/settings?tab=location` | `User` + location fields |
| Member connections ("contacts") | `/api/member/*` | `memberController.ts` | `/member` | Connection graph models |
| Business profile | `/api/business/:id` | `businessProfileService.ts` | `/business/[id]/profile` | `Business` |
| Place public business profile | `/api/place/business/:businessId/profile` | Place routes | Place publisher UI | Place graph |
| AI identity (parallel) | `/api/ai/identity`, personality, effective-preferences | AI route modules | `/ai` Control Center | AI preference stores |

**Marketing `/contact`** is a lead form — not a user contacts product.

### Ownership

| Concern | Owner |
|---------|-------|
| Personal identity | Auth / platform kernel (fragmented — no `profileService`) |
| Avatar library | Profile photos subsystem (controller-centric) |
| Business identity | Business Administration subdomain (`businessProfileService`) |
| Workforce identity | Org chart / BA (#OC-1) — HR consumes, does not own |
| AI persona | AI Platform (separate from user profile) |

### Maturity

| Signal | Rating |
|--------|--------|
| Personal profile | **L1** — JWT-only; direct Prisma; name-only edit surface |
| Profile photos | **L1–L2** — Strong upload pipeline (sharp, GCS); `trashedAt` on library; no Global Trash handler registration |
| Business profile | **L2** — Service layer, PE dual, activity events |
| Member graph | **L1** — Legacy role checks; no PE on mutations |
| Consolidated profile service | **Missing** |

### Certification readiness

| Metric | Value |
|--------|-------|
| Constitutional audit | **None** |
| Operation matrix | **None** |
| Ledger row | **None** |
| Readiness | **Low** |

**Gaps:** No canonical `profileService`; API drift (`useUserSettings` → `/settings` not implemented); profile photos lack module activity; personal profile not aligned with File Hub thin-controller pattern.

---

## B. Settings Ecosystem

### Inventory

| Category | Web entry | API backbone | Persistence |
|----------|-----------|--------------|-------------|
| User / account | `/profile/settings` (account) | `/api/profile` | `User` |
| Photos | `/profile/settings?tab=photos` | `/api/profile-photos` | `UserProfilePhoto` |
| Location & ID | `/profile/settings?tab=location` | `/api/location` | `User` / location |
| User KV preferences | preferences tab | `/api/user/preferences/:key` | `UserPreference` |
| Privacy / GDPR | `/profile/analytics` (privacy tab) | `/api/privacy/*` | Privacy models |
| In-app notifications | `/notifications/settings` | `/api/notifications/preferences` | Notification prefs |
| Email notifications | `EmailNotificationSettings` | `/api/email-notifications` | Email prefs |
| Push | `PushNotificationSettings` | `/api/push-notifications` | Push subscriptions |
| Appearance / theme | `AvatarContextMenu` | **None** (localStorage) | Client-only |
| AI provider / personality / autonomy | `/ai` (multi-tab) | 7+ AI route modules | AI + user prefs |
| Business workspace | `/business/[id]/workspace/settings` | `/api/business/:id` + webhooks | `Business` |
| Business profile (duplicate) | `/business/[id]/profile` | Same business APIs | Overlap |
| Module settings | `ModuleSettingsPanel`, HR editors | `/api/modules`, `/api/hr/admin/settings` | Per-module |
| Place privacy | Place UI | `/api/place/settings` | Place |
| Admin retention / governance | Admin portal | `/api/retention`, `/api/governance` | Admin |
| Admin AI pipeline settings | Admin portal | `/api/admin-portal/.../ai-pipeline` | Pipeline catalog |

### Fragmentation

| Issue | Severity |
|-------|----------|
| **6+ user-facing settings hubs** (profile, analytics/privacy, AI, notifications, avatar theme, business) | High |
| **Duplicate business settings** (profile page vs workspace settings) | High |
| **Three notification preference backends** (in-app, email, push) | Medium |
| **API contract drift** — Memory Bank `/settings` bulk API vs per-key server routes | High |
| **Appearance not server-backed** | Medium |
| **AI settings isolated** from `/profile/settings` | Medium |
| **No cross-cutting settings ownership model** | High |

### Maturity & certification readiness

| Metric | Value |
|--------|-------|
| Maturity | **L1** — functional but fragmented |
| Audit | **None** (Notifications UX certified separately — not settings platform) |
| Readiness | **Low** |

---

## C. Billing & Commerce

### Inventory

| Capability | Routes / services | Notes |
|------------|-------------------|-------|
| Core subscriptions | `/api/billing/subscriptions` | `subscriptionService`, Stripe |
| Module subscriptions | `/api/billing/modules` | `moduleSubscriptionService`, App Store model |
| Checkout / portal | Checkout sessions, customer portal | `stripeService` |
| Payment methods | `/api/billing/payment-methods` | Stripe Elements |
| Invoices | `/api/billing/invoices` | Linked to subscriptions |
| Usage / overage | `/api/usage`, `overageBillingService` | Metering |
| Entitlements | `/api/feature-gating`, HR/scheduling middleware | `featureGatingService` |
| Pricing admin | `/api/pricing`, admin portal | DB-driven `pricingService` |
| Developer payouts | `/api/developer`, admin billing | `revenueSplitService` |
| Webhooks | `POST /api/payment/webhook` | Signature-verified |
| Legacy overlap | `/api/payment/*` | Parallel to `/api/billing` |

**Platform vs domain:** Billing is a **platform capability** (kernel-adjacent), not a product module. Place has commerce **routing** boundary only ([`PLACE_COMMERCE_BOUNDARY.md`](../architecture/PLACE_COMMERCE_BOUNDARY.md)).

### Maturity

| Signal | Rating |
|--------|--------|
| Stripe integration | **L2+** — checkout, portal, webhooks, sync, tests |
| Service layer | **L2** — multiple named services |
| Controllers | **L1–L2** — fat `billingController` (~900 LOC) |
| End-user UX | **L1** — modal-driven; no dedicated billing dashboard |
| Constitutional patterns | **Partial** — no PE on writes; no activity events |
| Admin portal billing ops | **L3-adjacent** — covered in Admin Portal operation matrix |

### Certification readiness

| Metric | Value |
|--------|-------|
| Platform capability audit | **None** |
| Ledger row | **None** |
| Backend readiness | **Medium** |
| UX / constitutional package | **Low** |

---

## D. AI Platform

### Inventory

| Layer | Components | Status |
|-------|------------|--------|
| Orchestration | `DigitalLifeTwinCore`, `ContextProviderOrchestrator`, `AIContextAssembler` | L2 operational |
| Providers | `providerCapabilityMatrix`, `providerRouting` | Wave 1E complete |
| Grounding | `pipelineGroundingRetrieval`, Context Graph bundle, V_Link pipeline | CG-integrated post-cert |
| Diagnostics | Pipeline trace, admin AI pipeline routes | Admin Portal L3 owns admin surface |
| Preferences | `ai-preferences`, `ai-personality`, `ai-autonomy`, effective prefs | Fragmented from settings |
| Memory | LifeTwin memory paths | Partial; stubs in places |
| Reasoning | `conversationReasoning`, pipeline trace | Backend complete; admin UI parity gap |
| Context assembly | Module providers + CG federation | L3 modules mostly compliant; dashboard/household stubs |
| Multimodal | Attachment/vision via storage patterns | Drive-aligned; not platform-certified |

### Modernization status

| Program | Status |
|---------|--------|
| Waves G0, 1A–1E | **Complete** — L2 certified 2026-06-03 |
| L3 readiness review | **Defer L3** — 52/100; rank **5/5** near-term ROI |
| Context Graph integration | **Complete** — bundle grounding post CG-6 |

### Remaining debt (L3 blockers)

| ID | Blocker |
|----|---------|
| B-01 | Operation matrix **~82% C** vs **90%** L3 threshold |
| B-02 | Stub ActionExecutors (household, business, dashboard) |
| B-03 | Context provider controller Prisma (HR/scheduling resolved in BO-1A; dashboard open) |
| B-04 | Legacy duplication register P1 items |
| B-05 | Twin + tool integration smoke suite |
| B-06 | Admin pipeline UI schema parity |
| B-07 | Notifications executor partial |

**Estimated L3 effort:** 8–14 engineering weeks when resumed.

---

## E. Calendar

### Inventory

| Layer | Evidence |
|-------|----------|
| Routes | `server/src/routes/calendar.ts` |
| Services | `calendar*Service` family (visibility, trash, vlink, AI, scheduler, reminders) |
| Recurrence | `calendarRecurrenceService` |
| Permissions | `calendarPolicyDual` |
| UI | Calendar module + Reference UX #5 |
| Tests | Constitutional + operation matrix tests |

### Status

| Metric | Value |
|--------|-------|
| Architecture certification | **L3 Certified** — Reference Module #3 |
| UX certification | **UX-L3 Certified** — Reference UX #5 (Approved with Findings) |
| Constitutional / FH | **High / High** |
| Remaining debt | **Hygiene only** — comment controller Prisma, stale matrix, optional workspace landing, reminder job transitional |

**Certification readiness:** **Complete** at architecture L3. No new certification wave recommended.

---

## F. Place

### Inventory

| Layer | Evidence |
|-------|----------|
| Routes | `server/src/routes/place.ts` |
| Services | 16+ `place*Service` under `server/src/services/place/` |
| UI | `PlaceWorkspaceLanding`, dual consumer/publisher surfaces |
| Reference | **Reference Module #5** (Wave 4B, 2026-06-02) |
| Tests / matrix | 63 ops — 35 C / 28 P / 0 N |

### Status

| Metric | Value |
|--------|-------|
| Certification | **L3 Certified** |
| Reference program | **Complete** — not L4 |
| Remaining work | **PL-H1–H9** post-cert hygiene (PE on discovery, transaction activity, legacy schema sunset) |
| Business Workspace blocker | **ENG-1** — Place publisher `/workspace/place` segment 404 affects Reference Workspace QA |

**Certification readiness:** **Complete** at L3. Hygiene and workspace segment fix are operational, not certification.

---

## G. Platform Capabilities

| System | Ledger level | Maturity summary | Certification |
|--------|--------------|------------------|---------------|
| **Policy Engine** | L2 | v1 scoped; L3 write modules covered; read paths partial | Platform L2 — no L3 charter |
| **Domain Events** | L1 | Registry exists; taxonomy thin beyond drive; placeholder subscribers | Uncertified |
| **Notifications** | L2 | Central service + L3 adapters; UX Reference #2 | Service L2; UX certified |
| **Module Activity** | L1 | L3 write paths good; **legacy read paths** platform-wide | Uncertified |
| **Global Trash** | L2 | Handlers on L3 modules + notes | Platform L2 |
| **V_Link** | L2 | L3 modules + NOTE; resolver expansion partial | Platform L2 |
| **Context Graph** | **L3** | Federated read; 9 adapters; #CG-1/#CG-2/#CG-3 | **Certified** (program archived) |
| **Realtime** | — | Module-declared; `chatSocketService` hub | No platform row |
| **Search** | — | Federated `searchController` providers | No audit |
| **Workspace Runtime** | L1 (shells) | Reference Workspace **WS-L2 CwF**; 12 open findings | WS-L2 only |
| **Platform Scheduler** | L1 | Inventory-first per §22 | Uncertified |
| **Manifest governance** | L1 | Reconcile-on-startup incomplete | Uncertified |

---

## Cross-portfolio findings

### 1. Major domains remain unaudited

| Domain | Audit status |
|--------|--------------|
| Identity & Profile | **No audit** |
| Settings Platform | **No audit** |
| Billing & Commerce (platform) | **No audit** |
| Dashboard (product module) | Wave 0 partial only |
| Analytics (pseudo-module) | **Not started** |
| Search (platform) | Guidelines only |
| Marketplace / partner pipeline | Rulebook exists; no platform cert |

### 2. Major capabilities remain uncertified

See [`PLATFORM_PORTFOLIO_CERTIFICATION_STATUS.md`](./PLATFORM_PORTFOLIO_CERTIFICATION_STATUS.md).

### 3. Significant architectural debt clusters

| Cluster | Debt |
|---------|------|
| Workspace shells | Business Workspace L1; Reference Workspace 12 findings; ENG-1 P0 |
| Settings fragmentation | 6+ hubs; API drift; duplicate business surfaces |
| Identity | No profile service; inconsistent PE/activity |
| Platform L1 systems | Domain Events, Activity reads, Scheduler, Manifest |
| AI Platform | Stub executors; legacy duplication; L3 deferred |
| Billing | Dual payment APIs; fat controllers; weak end-user UX cert path |

### 4. What should be modernized next

See [`PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md`](./PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md).

**Do not modernize next:** Completed cert programs (Admin, BA, CG, BO); Calendar/Place L4 pursuit; AI L3 before workspace/dashboard foundation; standalone Notes L3; Analytics implementation before audit.

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [PLATFORM_PORTFOLIO_DOMAIN_MAP.md](./PLATFORM_PORTFOLIO_DOMAIN_MAP.md) | Domain topology |
| [PLATFORM_PORTFOLIO_CERTIFICATION_STATUS.md](./PLATFORM_PORTFOLIO_CERTIFICATION_STATUS.md) | Certification matrix |
| [PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md](./PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md) | Risk scoring |
| [PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md](./PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md) | Prioritized roadmap |
| [PLATFORM_PORTFOLIO_EXECUTIVE_SUMMARY.md](./PLATFORM_PORTFOLIO_EXECUTIVE_SUMMARY.md) | Required answers |

**Last updated:** 2026-06-19
