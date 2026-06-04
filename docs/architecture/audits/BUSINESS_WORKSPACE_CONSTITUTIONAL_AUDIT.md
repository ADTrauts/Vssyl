# Business Workspace Constitutional Audit

**Surface id:** `business-workspace` (platform shell — **not** a registered `moduleId`)  
**Phase:** **Wave 0 — Audit & governance** (2026-06-04)  
**Certification status:** **Not assigned** — discovery only; ledger row remains **Level 1 — Stabilizing**  
**Date:** 2026-06-04  
**Benchmarks:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) — File Hub #1, Chat #2, Calendar #3, Todo #4, Place #5, Notebook (L3 composition)  
**Related:** [BUSINESS_WORKSPACE_OPERATION_MATRIX.md](./BUSINESS_WORKSPACE_OPERATION_MATRIX.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md), [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)

> **Scope:** Business Workspace is the **tenant-scoped business context shell** (`/business/:id/workspace/*`) that mounts certified product modules. It is **not** the **Business** domain (`Business`, `BusinessMember`, EIN, branding) and **not** the **Business Front Page** product surface (`/api/business-front/*`).

---

## Executive summary

| Question | Wave 0 answer |
|----------|----------------|
| **Current maturity** | **Level 1 — Stabilizing** (composition / platform shell) |
| **Architectural identity** | **D — Hybrid** (primarily **platform shell + workspace runtime**; minor orphan product UI) |
| **Level 3 Certified module?** | **No** — not a product module; certification model does not apply as for `drive` / `todo` |
| **Reference Module #6?** | **No** — see §9 |
| **Modernization** | Defined in §10; **not implemented** in Wave 0 |

---

## 1. Inventory

### 1.1 Classification key

| Class | Meaning |
|-------|---------|
| **Shell-owned** | Workspace routing, layout, module switch, dashboard provisioning UX, stub overview widgets |
| **Delegated — Business domain** | `Business`, `BusinessMember`, invitations, follow, setup, analytics endpoints |
| **Delegated — certified module** | Drive, Chat, Calendar, Todo, Notebook, Place, HR, Scheduling, V_Link |
| **Delegated — platform** | Dashboard CRUD, module install (`moduleProvisionController`), Policy Engine, Digital Life Twin |
| **Deferred** | Real-time business-config WebSocket sync; unified segment URLs for all modules |

### 1.2 Counts (Business Workspace shell scope)

| Asset | Count | Notes |
|-------|-------|-------|
| **Controllers (shell-dedicated)** | **0** | No `businessWorkspaceController` |
| **Controllers (adjacent — Business domain)** | **1** | `businessController` (~1,505 LOC) — **not** shell-owned |
| **Controllers (adjacent — Front Page)** | **0** | Inline handlers in `businessFrontPage.ts` route file |
| **Services (shell-dedicated)** | **1** | `businessWorkspaceSeeder` — provisions Drive folder, Calendar, Chat on dashboard create |
| **Services (adjacent)** | **2+** | `businessFrontPageService`; `businessWorkspaceBoundaries` (AI policy block only) |
| **Route files (shell API prefix)** | **0** | No `/api/business-workspace/*` |
| **Route files (adjacent)** | **3** | `business.ts` (17 HTTP ops), `businessFrontPage.ts` (13), `businessAI.ts` (many) |
| **Prisma models (shell-owned)** | **0** | No workspace-specific tables |
| **Prisma models (adjacent — tenant)** | **8+** | `Business`, `BusinessMember`, `BusinessInvitation`, `BusinessFollow`, `BusinessModuleInstallation`, `BusinessFrontPageConfig`, `BusinessFrontWidget`, `BusinessAIDigitalTwin`, … |
| **Widgets (shell inline stubs)** | **4** | `BusinessDashboardWidget`, `BusinessCalendarWidget`, `BusinessAnalyticsWidget`, `BusinessMembersWidget` in `BusinessWorkspaceContent.tsx` |
| **Widgets (Front Page registry)** | **9 registered** | 5 implemented + 4 placeholders — **separate** `business/widgets/WidgetRegistry.tsx` |
| **Workspace module switch cases** | **16** | Including `connections` → members alias and `notes` → notebook |

### 1.3 Frontend components (shell & layout)

| Component / path | Class | Role |
|------------------|-------|------|
| `BusinessWorkspaceContent.tsx` | Shell-owned | Authoritative `switch (currentModule)` mount |
| `DashboardLayoutWrapper.tsx` | Shell-owned | Sidebar, module list, nested-route guard, embeds content |
| `BusinessWorkspaceWrapper.tsx` | Shell-owned | Thin `BusinessConfigurationProvider` wrapper |
| `businessWorkspaceNavigation.ts` | Shell-owned | `resolveBusinessWorkspaceModule`, `buildBusinessWorkspaceModuleHref` |
| `BusinessLayoutRuntimeShell.tsx` | Shell-owned | `WorkspaceRuntimeScopeBridge` for `contextType: business` |
| `WorkspaceRuntimeScopeBridge.tsx` | Platform runtime | Derives `WorkspaceRuntimeState` |
| `BusinessConfigurationContext.tsx` | Shell-owned state | Installed modules, org chart, WebSocket hooks, permissions |
| `PositionAwareModuleProvider.tsx` | Shell-owned | Merges personal + business module lists |
| `BrandedWorkDashboard.tsx` | Employee Work Tab | Parallel entry; **not** workspace shell but shares config context |
| `BusinessFrontPage.tsx` + front-page editors | **Adjacent product** | Public/employee front page — not workspace switch |
| `*ModuleWrapper`, `NotebookShell`, `HRLayout`, `SchedulingLayout`, `PlaceWorkspaceLanding` | Delegated | Product modules |
| `HRWorkspaceLanding.tsx`, `SchedulingWorkspaceLanding.tsx`, `NotebookWorkspaceLanding.tsx` | **Dead / unwired** | Exist on disk; **not** used in `BusinessWorkspaceContent` switch |

**`web/src/components/business/*.tsx`:** 20 component files  
**`web/src/app/business/**/page.tsx`:** 38 route pages (22 under `workspace/`)

### 1.4 Frontend routes (workspace)

| Pattern | Class | Notes |
|---------|-------|-------|
| `/business/[id]/workspace` | Shell-owned | Hub; `?module=` + path segment resolver |
| `/business/[id]/workspace/{module}` | Shell-owned | Partial deep links (`members`, `notebook`, `hr/*`, `scheduling/*`, …) |
| `/business/[id]/workspace?module=drive` | Shell-owned | Query-style modules (drive, chat, calendar, todo, …) |
| `/business/[id]/profile`, `/admin/*`, `/place` | **Adjacent** | Admin / setup — outside workspace shell |

### 1.5 Backend routes (adjacent to shell — not shell-owned)

**`/api/business`** (`server/src/routes/business.ts`) — 17 endpoints → `businessController`:

| Area | Handlers |
|------|----------|
| CRUD + logo | `createBusiness`, `getBusiness`, `updateBusiness`, `uploadLogo`, `removeLogo` |
| Membership | `getBusinessMembers`, `inviteMember`, `acceptInvitation`, `updateBusinessMember`, `removeBusinessMember` |
| Analytics | `getBusinessAnalytics`, `getBusinessModuleAnalytics`, `getBusinessSetupStatus` |
| Social graph | `followBusiness`, `unfollowBusiness`, `getBusinessFollowers`, `getUserFollowing` |

**`/api/business-front`** — 13 endpoints (inline route handlers + `businessFrontPageService`)

**`/api/business-ai`** — Business digital twin (separate product)

**`/api/dashboard`** — Business dashboard create/list (tenant isolation via `businessId`)

**`/api/module`** — `installModule` / `uninstallModule` / `getBusinessModules` (`moduleProvisionController`)

### 1.6 Services

| Service | Class | Role |
|---------|-------|------|
| `businessWorkspaceSeeder` | Shell-adjacent | Seeds Drive root folder, business calendar, general chat conversation when business dashboard created |
| `businessFrontPageService` | Front Page product | Widget layout persistence |
| `businessWorkspaceBoundaries` | Platform AI | Injects business policy block into personal twin when `businessId` in AI context — **not** workspace orchestration |
| `dashboardService` | Platform | Calls seeder on business dashboard create |
| `moduleProvisionController` | Platform | Install/uninstall; PE via `moduleInstallPolicyDual` / `moduleMutationPolicyDual` |
| `BusinessAIDigitalTwinService` | Business AI product | Employee/admin business AI |

**No** `businessWorkspace*Service` for navigation, module mount, or permission snapshots.

### 1.7 Controllers

| Controller | LOC (approx.) | Prisma in handler? | Shell? |
|------------|---------------|-------------------|--------|
| `businessController` | 1,505 | **Yes** (heavy) | **No** — Business domain |
| `moduleProvisionController` | Large | Partial | Platform — affects workspace module list |
| `businessFrontPage` routes | Inline | Via service | Front Page only |

### 1.8 Database models (relevant)

| Model | Owner | Workspace relationship |
|-------|-------|------------------------|
| `Business` | Business domain | Tenant root |
| `BusinessMember` | Business domain | Access to workspace |
| `BusinessModuleInstallation` | Platform / Business | **Enables modules in workspace** |
| `Dashboard` (`businessId`) | Platform | **Isolation boundary** for all mounted modules |
| `BusinessFrontPageConfig` / `BusinessFrontWidget` | Front Page | Separate from workspace switch |
| `ModuleInstallation` | Platform | Personal + business install records |

### 1.9 Widgets

| Registry | Count | Used by workspace switch? |
|----------|-------|---------------------------|
| Inline stubs in `BusinessWorkspaceContent` | 4 | **Yes** (`dashboard`, `analytics`, `members`, implicit calendar stub unused in switch) |
| `business/widgets/WidgetRegistry` (Front Page) | 9 | **No** — `BusinessFrontPage` only |
| `web/.../widgetRegistry.ts` (personal dashboard) | Many | **No** — personal/household dashboard |

### 1.10 AI integrations

| Integration | Owner | Shell role |
|-------------|-------|------------|
| `businessWorkspaceBoundaries.ts` | Platform AI | Policy lines when twin runs in business context |
| `workspaceAIPolicyDigest.ts` | Platform AI | Employee business AI access digest |
| `AIWidget` in switch `case 'ai'` | Shell mount | Delegates to shared AI widget |
| `BusinessAIDigitalTwin` | Business AI | `/api/business-ai/*` — not workspace shell |
| Module AI (Todo, Notebook, Place, Drive, Chat) | Certified modules | Mounted inside switch — **module-owned** |
| `ActionExecutor` / `toolExecutor` | Platform | No `business-workspace` executor |

### 1.11 Workspace / module runtime integrations

| Integration | Status |
|-------------|--------|
| `coreModuleRegistry.ts` | 18 core `ModuleDefinition` entries; `businessRoute()` for workspace keys |
| `builtInModuleManifests.ts` | `capabilities.businessWorkspace: true` on product modules — **not** a manifest for the shell itself |
| `BusinessWorkspaceContent` switch | **Authoritative** for render (per `workspace-runtime.mdc`) |
| `getModuleDefinition(normalizeModuleId(currentModule))` | Metadata lookup only — **does not drive render** |
| `WorkspaceRuntimeScopeBridge` | Wired in `BusinessLayoutRuntimeShell` / layout tree |
| `BusinessConfigurationContext` | Module install list, org chart, position filters |

### 1.12 Dashboard integrations

| Concern | Owner |
|---------|-------|
| Business dashboard create/find | `workspace/page.tsx` + `/api/dashboard` |
| `businessDashboardId` passed to modules | Shell propagates to wrappers |
| Personal dashboard widgets | Dashboard module / `WIDGET_REGISTRY` — **not** business workspace stubs |
| Seeding on create | `dashboardService` → `businessWorkspaceSeeder` |

### 1.13 Tests

| Test | Scope |
|------|-------|
| `businessWorkspaceBoundaries.test.ts` | AI policy formatting only |
| `moduleRegistry.test.ts` | `place` has `businessWorkspace` capability |
| `moduleInstallDomainEvent.test.ts` | Install/uninstall events (platform) |
| **No** `BusinessWorkspaceContent` or navigation contract tests | Gap |

---

## 2. Ownership analysis

### 2.1 What Business Workspace **is** responsible for

1. **Business context UX shell** — layout, sidebar, module switching under `/business/:id/workspace`.
2. **Module mounting** — render certified modules with `businessId` + `businessDashboardId`.
3. **Navigation coherence** — `businessWorkspaceNavigation.ts` (A-043).
4. **Dashboard context binding** — ensure per-business `Dashboard` exists before module render.
5. **Installed-module filtering** — via `BusinessConfigurationContext` + `PositionAwareModuleProvider` + `DashboardLayoutWrapper.displayModules`.
6. **Workspace runtime scope** — `BusinessLayoutRuntimeShell` / `WorkspaceRuntimeScopeBridge`.
7. **Provisioning side effects on dashboard create** — delegate to `businessWorkspaceSeeder` (Drive/Calendar/Chat bootstrap).

### 2.2 What Business Workspace must **NOT** own

| Domain | Correct owner |
|--------|---------------|
| Business CRUD, EIN, branding | **Business** domain (`businessController`) |
| Member invite/remove, roles | **Business** domain + Member/HR modules |
| File mutations | **File Hub** (`drive`) |
| Messages, threads | **Chat** |
| Events, calendars | **Calendar** |
| Tasks | **Todo** |
| Pages, NotebookLink | **Notebook** + **Notes** |
| Listings, graph | **Place** |
| HR records, attendance | **HR** module |
| Shifts, schedules | **Scheduling** module |
| Cross-module links (V_Link) | **V_Link** platform + modules |
| Module install authorization | **Policy Engine** + `moduleProvisionController` |
| Activity feed records | **Per-module** `*ActivityService` |
| Analytics metrics | **Analytics** pseudo-module / `BusinessMetric` |
| Employee front page CMS | **Business Front Page** (`businessFrontPageService`) |
| Business digital twin | **Business AI** (`businessAI` routes) |

### 2.3 Boundary evaluation

| Neighbor | Boundary health | Notes |
|----------|-----------------|-------|
| **File Hub** | 🟢 Mount only | Switch delegates; upload in content uses `/api/drive/*` |
| **Chat** | 🟢 | `ChatModuleWrapper` |
| **Calendar** | 🟢 | `CalendarModuleWrapper` + `BUSINESS` context |
| **Todo** | 🟢 | `TodoModule` |
| **Notebook** | 🟢 | `NotebookShell` (not `NotebookWorkspaceLanding`) |
| **Place** | 🟢 | `PlaceWorkspaceLanding` |
| **Business (domain)** | 🟡 Leak risk | Stub **Members** widget duplicates member UX; should link to domain API or Members module |
| **Analytics** | 🔴 Leak | `BusinessAnalyticsWidget` stub — belongs in Analytics module |
| **Dashboard** | 🔴 Overlap | `case 'dashboard'` stub overview — overlaps Dashboard module / widgets |
| **Chat (data)** | 🟢 | Seeder creates conversation — platform bootstrap, acceptable |
| **Member** | 🟡 | `members` case uses stub widget, not member module services |
| **Policy Engine** | 🟡 | Module install has PE; shell navigation has **no** PE |
| **Module Registry** | 🟡 | Registry metadata vs switch cases can drift |
| **Workspace Runtime** | 🟢 Partial | Bridge present; switch still legacy authoritative |

---

## 3. Architectural identity

**Decision: D — Hybrid** (platform shell + workspace runtime, with **orphan product UI**)

| Option | Fit | Rationale |
|--------|-----|-----------|
| **A. Product Module** | ❌ | No `moduleId`, manifest, entities, or canonical workspace services |
| **B. Composition Module** | ❌ | Unlike **Notebook**, shell does not own aggregation services (`notebookWorkspaceContextService`) or link tables — only mounts others |
| **C. Platform Shell** | ✅ Primary | Switch-based orchestration; WR-Q1 runtime bridge |
| **D. Hybrid** | ✅ **Selected** | Shell/runtime **plus** stub dashboard/analytics/members UIs that behave like immature product surfaces |

**Teachable identity:** **Internal enterprise workspace orchestrator** — tenant = `businessId` + `dashboardId`; external market graph = **Place** (per Place product review).

---

## 4. Constitutional review

| Standard | Status | Evidence |
|----------|--------|----------|
| **Canonical services** | **N/A / P** | No shell services except seeder; Business domain fat controller |
| **Thin controllers** | **N/A** | Shell has no controller; `businessController` **violates** if judged as part of workspace program |
| **Policy Engine** | **P** | `moduleInstallPolicyDual` on install; business member/update dual on domain controller; **no PE on navigation** |
| **Visibility services** | **N/A** | Shell does not read module data — delegated modules |
| **Activity** | **P** | `emitBusinessUpdatedEvent`, member events from `businessController`; **no** `business_workspace_*` activity |
| **Domain events** | **P** | `business.updated`, `business.member.*`, `module.installed` — not workspace navigation |
| **Notifications** | **P** | Invitation emails via `businessController`; no shell notification types |
| **Realtime** | **P** | `BusinessConfigurationContext` WebSocket subscription hooks — partial |
| **AI compliance** | **P** | `businessWorkspaceBoundaries` read-only policy injection; module AI remains module-owned |
| **Entities** | **N/A** | No shell entities |
| **V_Link** | **P** | Mounted via `VLinkModule` case — platform module |
| **Global Trash** | **N/A** | Shell does not delete user data |
| **Manifest truth** | **P** | Product modules declare `businessWorkspace: true`; shell itself has **no manifest** |
| **Workspace runtime compliance** | **P** | Bridge + registry; switch authoritative per docs |
| **Module orchestration** | **P** | Install path platform-owned; render path switch-owned |
| **Navigation ownership** | **C** | Single helper module (A-043) |
| **Cross-module composition** | **P** | Composition happens **inside** mounted modules (Notebook), not shell |

**Estimated constitutional maturity:** **Level 1 — Stabilizing** (cross-cutting shell, not L2 product candidacy).

---

## 5. Workspace runtime review

### 5.1 `BusinessWorkspaceContent`

- **16** `case` branches mounting product surfaces.
- **Contract lookup** (`getModuleDefinition`) is **non-authoritative** (voided).
- **Drive** case embeds client-side upload/folder handlers (should move to Drive module).
- **Default** falls back to stub `BusinessDashboardWidget`.

### 5.2 Module mounting

| Pattern | Modules | Hub landing wired? |
|---------|---------|-------------------|
| Full module wrapper / layout | drive, chat, calendar, todo, notebook, hr, scheduling, place, vlink | Place ✅; HR/Scheduling use **Layout** not `*WorkspaceLanding` |
| Inline stub widget | dashboard, analytics, members, connections | ❌ No dedicated hub services |

### 5.3 Workspace routing

- **Dual URL model:** query `?module=` vs path segments (`/workspace/members`, `/workspace/notebook`).
- `hasNestedWorkspaceRoute` prevents switch from clobbering deep HR/scheduling routes.
- **Gap:** Not all modules use segment URLs (`buildBusinessWorkspaceModuleHref` still emits query for most).

### 5.4 Workspace state

| State source | Role |
|--------------|------|
| `BusinessConfigurationContext` | Installed modules, tier, org chart, permissions |
| `DashboardContext` | Active dashboard id |
| `WorkspaceRuntimeScopeBridge` | Derived availability |
| URL (`pathname`, `searchParams`) | Active module resolution |

**Risk:** Duplicate dashboard bootstrap in `workspace/page.tsx` and `DashboardLayoutWrapper`.

### 5.5 Shell vs runtime vs product

| Role | Active? |
|------|---------|
| **Shell** | ✅ Layout + switch |
| **Runtime** | ✅ Partial (`WorkspaceRuntimeScopeBridge`, registry metadata) |
| **Product** | ⚠️ Stub widgets impersonate product surfaces |

---

## 6. Dashboard relationship

| Concern | Owner |
|---------|-------|
| **Landing experiences (business)** | **Split:** stub `dashboard` case (shell) vs real module hubs (Notebook, Place, HR layouts) |
| **Widgets (grid)** | **Dashboard** module + `WIDGET_REGISTRY` for personal; **Front Page** registry for employee landing |
| **Navigation (business sidebar)** | **Business Workspace shell** (`DashboardLayoutWrapper`) |
| **Context aggregation** | **Notebook** (`notebookWorkspaceContextService`); shell stubs use `setTimeout` mock data |
| **Module launching** | **Shell** switch + href builders; install list from **BusinessConfigurationContext** |

**Notebook / Place:** Own workspace landings when mounted; shell does not aggregate their data.

**Analytics:** Should own `BusinessAnalyticsWidget` logic — currently stub in shell.

---

## 7. AI review

| Layer | Owner | Compliance |
|-------|-------|------------|
| Business policy block in personal twin | `businessWorkspaceBoundaries` | Read-only injection ✅ |
| Workspace module AI surfaces | Drive, Chat, Todo, Notebook, Place, … | Module-owned ✅ |
| Shell `AIWidget` | Shared widget | Mount only |
| Business Digital Twin | `businessAI` routes | Separate product |
| ActionExecutor / toolExecutor | Platform | No business-workspace ops |

**Cross-module AI:** Shell must **not** assemble module context — Notebook and module providers own that.

---

## 8. Reference viability (Reference Module #6)

| Criterion | Assessment |
|-----------|------------|
| Architectural uniqueness | **Low** — hub switch is platform infrastructure |
| Platform importance | **High** — critical UX path |
| Pattern reusability | **Medium** — hub + `businessWorkspaceNavigation` — better as **platform doc** than Reference Module |
| Long-term strategic value | **High** as runtime, **low** as certifiable product |
| Ownership clarity | **Improving** — Wave 0 clarifies shell vs Business domain vs Front Page |

**Comparison:** Reference #1–#5 and Notebook teach **domain** patterns. Business Workspace teaches **orchestration** — already documented in [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) and [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) (“composition only”).

**Reference Module #6 designation:** **Not recommended** (see Final Question).

---

## 9. Modernization recommendation (definition only)

See [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) §5.8 (updated Wave 0) and phase table below.

| Phase | Goal |
|-------|------|
| **0** | ✅ This audit + operation matrix |
| **1A** | Boundary doc: shell vs Business domain vs Front Page; retire or wire dead `*WorkspaceLanding` files |
| **1B** | Hub pattern standard — one pattern per module (Wrapper vs Landing); align `module-development.mdc` checklist |
| **1C** | Navigation — segment URLs for all modules; contract tests on `businessWorkspaceNavigation` |
| **2A** | Extract dashboard bootstrap to single client hook/service (no duplicate ensure-dashboard) |
| **2B** | Replace stub widgets — dashboard → Dashboard module or real APIs; members → Business API; analytics → Analytics |
| **2C** | Manifest/registry drift CI — switch cases ⊆ `coreModuleRegistry` routes |
| **3A** | Module lifecycle visibility — install UI vs `capabilities.businessWorkspace` reconcile |
| **3B** | Real-time config sync — extend socket events for `BusinessConfigurationContext` |
| **4** | Optional **Workspace Shell Guide** (platform architecture, not Reference Module) |

**Target maturity after 2.x:** **Level 2 — Platform shell certified** (new ledger category — **not** Level 3 product module).

---

## 10. Final question

**Is Business Workspace the strongest candidate for Reference Module #6?**

**Answer: B — No**

**Rationale:**

1. Reference Modules **#1–#5** are **domain product modules** with canonical services and constitutional gates. Business Workspace has **zero** shell-owned mutation services and **no** `moduleId`.
2. **Notebook** already holds the **composition module** reference role (operational links, workspace context aggregation). The shell does not duplicate that pattern — it only mounts Notebook.
3. If a sixth reference is needed for **hub/widget/runtime** patterns, **Dashboard** (widget registry, grid composition) is a closer fit than Business Workspace; even then, platform architecture docs are the preferred home.
4. Substantial modernization (stub removal, single dashboard bootstrap, hub standardization) must land before reassessing — that yields **platform shell certification**, not Reference Module status.

**Not C:** Enough evidence exists to reject Reference candidacy; unknowns are implementation gaps, not strategic ambiguity.

---

*Wave 0 complete — 2026-06-04. No runtime code modified.*
