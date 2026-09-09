# Business Participant & Organizational Model — Phase 1

**Status:** NON-authoritative evidence audit  
**Date:** 2026-09-08  
**Program:** Business Participant & Role-Aware Experience  
**Phase:** 1 — Existing Organizational Model Discovery  
**Baseline HEAD:** `69d6c6baa8390c2870bbecea7562762dd492bd27` (`fix(platform): reconcile application participation metadata`)  
**Constraint:** Discovery only. No implementation, redesign, schema, or UI changes.

---

## 1. Purpose

Answer: **What does Vssyl already know about a person inside a Business, and how is that information currently used?**

This audit inventories the existing business-participant / org-chart model, traces Business Administration org-chart behavior end-to-end, separates identity / membership / employment / position / permission / presentation concerns, and assesses whether the current model is a viable foundation for future role-aware experience work.

It does **not** design role-aware Dashboards, recommendation engines, or a new “Role-Aware Experience Engine.”

### Product distinctions preserved

| Term | Meaning (Product Definition) |
|------|------------------------------|
| **Business member role** | Coarse designation on business membership / admin responsibility — not the full AuthZ model |
| **Org position** | Structural / workforce placement — must not automatically become platform authorization |
| **Permission** | Allowed action / access decision |
| **Authorization** | Protected decision; Policy Engine is the canonical platform direction |
| **Role-aware experience** | Emphasis, navigation, information, and actions adapt to role, responsibilities, context, and authority — broader than permission gating |

---

## 2. Baseline / authority

### Git baseline (start of audit)

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD | `69d6c6baa8390c2870bbecea7562762dd492bd27` |
| `origin/main` | Same commit (0 ahead / 0 behind after fetch) |
| Staged | None |
| Unstaged / untracked | Unrelated dirty work present (deploy/auth/GTM docs, etc.) — **preserved**; not part of this audit |

### Authority chain consulted

| Source | Role |
|--------|------|
| `AGENTS.md` | Agent orientation |
| `docs/VSSYL_SOURCE_OF_TRUTH.md` | Repository authority / placement |
| `docs/product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md` | Product language (Draft 2; not architecture law) |
| `docs/architecture/VSSYL_ARCHITECTURE_INDEX.md` | Architecture index |
| `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Domain ownership |
| `docs/architecture/POLICY_ENGINE.md` | AuthZ vs presentation vs role-aware boundary |
| `docs/architecture/APPLICATION_PARTICIPATION_COMPOSITION.md` | Composition / participation (referenced via index + prior audits) |
| `docs/business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md` | BA ownership matrix (planning; some rows stale vs code) |
| `docs/business-administration/BUSINESS_ADMINISTRATION_REFERENCE_STATUS_RECORD.md` | BA certification status pointer |
| `docs/architecture/audits/APPLICATION_PARTICIPATION_MATRIX_PHASE_2.md` | Org-chart parallel RBAC = transitional |
| Implementation | Prisma modules, services, routes, UI, tests — **implementation truth** |

### Code wins

Where BA ownership docs still say approval hierarchy is “unowned / unwired,” **code and tests supersede**: `approvalHierarchyService` + `/api/org-chart/approval-hierarchy/*` are implemented (API-only; no admin UI).

---

## 3. Executive findings

1. **Two parallel participant layers exist and are both real:**
   - **Tenant membership:** `User` ↔ `BusinessMember` + `BusinessRole` (`EMPLOYEE` \| `ADMIN` \| `MANAGER`) + `canInvite` / `canManage` / `canBilling`
   - **Workforce placement:** `EmployeePosition` placing a `User` on a `Position` inside `OrganizationalTier` / `Department`, with `Position.reportsToId` hierarchy

2. **There is no `Employee` Prisma model.** “Employee” in product language maps to `EmployeePosition` (+ optional `EmployeeHRProfile`). Membership ≠ employment ≠ org position (Product Definition is correct; code largely respects this structurally).

3. **Business Administration org chart models structure well on the backend** (tiers, departments, positions, reporting, assignment, capacity, vacant queries, activity/domain events, config realtime). **Admin UI ↔ API contracts for employee assignment and several display fields are broken/contradictory.**

4. **Org-chart JSON permissions (`permissionService`) are a parallel / transitional AuthZ path**, not Policy Engine facts. Documented for planned deprecation toward PE (`APPLICATION_PARTICIPATION_MATRIX_PHASE_2`, Platform Standards, `LEGACY_CLEANUP` direction).

5. **Organization structure does not currently decide application/module availability** in a reliable way. Availability is driven by `BusinessModuleInstallation` + membership (+ module feature gates). Frontend org→module maps stay empty (`{}`).

6. **Meaningful role-aware behavior already exists** — mostly driven by **BusinessRole** chrome and **position reporting** for manager scoping (HR/Scheduling/Workforce), plus front-page visibility and workforce audiences — not by a unified role-aware experience system.

7. **Foundation verdict: Conclusion 3** — the structural org model is real and consumed, but structural facts, permission JSON, and presentation maps are mixed enough that **conceptual / authority reconciliation is needed before role-aware product modeling**. Prefer extending existing owners; do not invent a parallel org model.

---

## 4. Concept inventory

Authority status key: **CANONICAL** | **LEGACY** | **TRANSITIONAL** | **UI_ONLY** | **DERIVED** | **DUPLICATE** | **UNKNOWN**

| Concept | Canonical model/type | Owner | Persistence | Primary service | Primary admin surface | Consumers | Authority status |
|---------|----------------------|-------|-------------|-----------------|----------------------|-----------|------------------|
| Platform user identity | `User` | Auth / Account | `users` (`auth/user.prisma`) | Auth/JWT stack | Platform Admin (not BA) | All | CANONICAL |
| Platform role | `User.role` (`USER`\|`ADMIN`) | Auth | `users.role` | Auth | Platform Admin | Admin portal | CANONICAL (platform only; ≠ business) |
| Business tenant | `Business` | BA | `businesses` | `businessController` / business services | `/business/[id]` profile/settings | Modules, billing, installs | CANONICAL |
| Billing tier (name collision) | `Business.tier` string | Billing / BA | `businesses.tier` | Billing/subscription paths | Billing UI | Entitlements | CANONICAL (billing; ≠ org tier) |
| Business membership | `BusinessMember` | BA / Members | `business_members` | `businessMemberService`, `businessController`, `memberController` | Members pages, profile MemberManagement | PE, feature gates, WC, search, SSO | CANONICAL |
| Business member role | `BusinessRole` on `BusinessMember.role` | BA / Members | enum on member | Same + PE helpers | Members admin | PE AuthZ, module chrome, hub tiles | CANONICAL (coarse) |
| Member capability flags | `canInvite`, `canManage`, `canBilling` | BA / Members | `business_members` | Member update APIs + PE | Members admin | PE uses invite/manage; **canBilling NOT used by PE** | CANONICAL / PARTIAL |
| Free-text title/dept on member | `BusinessMember.title`, `.department` | Members (metadata) | strings | Member invite/update | Members UI | Display / invite defaults | DUPLICATE vs org models (E) |
| Invitation | `BusinessInvitation` | Members / BA | `business_invitations` | invite flows | Members | Accept → membership | CANONICAL |
| Legacy Job title | `Job` | Unclear / near-orphan | `jobs` | No active `prisma.job` service ownership found | — | Optional include on member | LEGACY / UNKNOWN |
| Org tier (rank) | `OrganizationalTier` | BA / Org chart | `organizational_tiers` | `orgChartService` | `/business/[id]/org-chart` | Positions, front-page tiers, WC audience | CANONICAL |
| Department (structure) | `Department` | BA / Org chart | `departments` | `orgChartService` | Org chart builder | HR filters, WC audience, scheduling reads | CANONICAL |
| Org position | `Position` | BA / Org chart | `positions` | `orgChartService` | Org chart | EP, scheduling stations fields, shifts | CANONICAL |
| Position reporting | `Position.reportsToId` | BA / Org chart | positions | `orgChartService` | Visual drag (partial UI) | WC manager subtree, HR manager resolve | CANONICAL |
| Workforce placement | `EmployeePosition` | BA (writes) | `employee_positions` | `employeeManagementService` | Org chart Employees tab | HR, Scheduling, WC, AI HR context | CANONICAL |
| HR employment record | `EmployeeHRProfile` | HR | `employee_hr_profiles` | `hrEmployeeService` | HR admin employees | PTO, attendance, onboarding | CANONICAL |
| Approval hierarchy | `ManagerApprovalHierarchy` | BA API surface / HR schema | `manager_approval_hierarchy` | `approvalHierarchyService` | **No admin UI** | Resolve/validate APIs | CANONICAL persistence; UI_ONLY gap |
| Permission catalog | `Permission` | BA (org-chart) | `permissions` | `permissionService` | PermissionManager (sets) | checkUserPermission | TRANSITIONAL (parallel RBAC) |
| Permission sets | `PermissionSet` | BA | `permission_sets` | `permissionService` | PermissionManager | M2M to Position (attach UI weak) | TRANSITIONAL |
| Position/tier/dept JSON perms | columns on Position / Tier / Department | BA | JSON columns | `permissionService` | Partial / stubs | Front-page `requiredPermission`; org-chart check API | TRANSITIONAL |
| Permission management rights | `PermissionManagementRights` | — | table | **No TS service usage found** | — | — | LEGACY / UNKNOWN |
| Permission change audit | `PermissionChange` | — | table | **No TS usage found** | — | — | LEGACY / UNKNOWN |
| Module install | `BusinessModuleInstallation` | Application lifecycle | module tables | module provision | Modules page | Workspace enabled modules | CANONICAL |
| Position assigned modules | `Position.assignedModules` | BA schema | JSON | orgChartService can persist | UI stubs | **No working visibility consumer** | TRANSITIONAL / UI_ONLY wiring |
| Dept modules | `Department.departmentModules` | BA schema | JSON | — | PermissionManager TODO | BCC maps stay `{}` | TRANSITIONAL / UI_ONLY |
| Frontend permission maps | BCC `positionPermissions` etc. | Presentation | in-memory | `BusinessConfigurationContext` | Workspace | `PositionAwareModuleProvider` | UI_ONLY / DERIVED (empty) |
| Policy Engine actions | string actions in `policyActions` / PE | Platform AuthZ | code | `policyEngine.ts` | — | Dual bridges | CANONICAL (direction; partial rollout) |
| Job location | `JobLocation` | Scheduling | `job_locations` | scheduling location service | Scheduling admin | Shifts | CANONICAL (ops; not org responsibility) |
| Station | `BusinessStation` + Position station fields | Scheduling | scheduling + Position | station services | StationsAndPositionsEditor | Coverage | CANONICAL (ops) |
| Location responsibility | — | — | **No model** | — | — | — | NOT_IMPLEMENTED |
| Front-page visibility | widget `visibleToRoles/Tiers/Positions/Departments` | BA front page | front-page models | `businessFrontPageService` | Front-page editor | Hub widgets | CANONICAL (presentation) |
| Workforce audience | `WorkforceAudience*` | Workforce Comms | WC schema | `workforceAudienceService` | WC admin | Targeting | CANONICAL (consumes org facts) |

---

## 5. Business Administration org-chart trace

### Stack

```
UI:  /business/[id]/org-chart
     OrgChartBuilder | OrgChartVisualView | PermissionManager | EmployeeManager
API: web/src/api/orgChart.ts → /api/org-chart/*
Route: server/src/routes/org-chart.ts
Services: orgChartService | employeeManagementService | permissionService | approvalHierarchyService
Activity: orgChartActivityService → emitModuleActivityEvent
Domain events: orgChartDomainEventService
Realtime: broadcastBusinessConfigUpdated → business:config:updated
Reload: BusinessConfigurationContext.loadOrgChart / loadConfiguration
Prisma: prisma/modules/business/org-chart.prisma + Department in business.prisma
```

### Capability status

| Capability | Status | Evidence |
|------------|--------|----------|
| Organizational tiers | **IMPLEMENTED** | Full CRUD UI + API + service + Prisma + activity/PE dual; tests pass |
| Departments | **IMPLEMENTED** | Nested `parentDepartmentId`; `headPositionId` in schema/API, not exposed in builder form |
| Positions | **PARTIAL** | Create maps `name`→`title`; list/edit often use `name`/`capacity` vs DB `title`/`maxOccupants` |
| Employees assigned to positions | **BROKEN/CONTRADICTORY** (UI↔API) | Backend requires `startDate`, remove is **DELETE**; client sends `effectiveDate`, remove uses **POST**; filters use `isActive` vs `active` |
| Manager/subordinate (`reportsTo`) | **PARTIAL** | Schema + visual drag; VisualView PUT **omits Authorization header** (`OrgChartVisualView.tsx` ~206–217) |
| Multiple positions per employee | **PARTIAL** | Schema allows (`@@unique([userId, positionId, businessId])`); BCC `getUserPosition` returns first only |
| Vacant positions | **PARTIAL** | Backend vacant = zero active assignees; UI capacity display broken by field mismatch |
| Ordering / hierarchy | **IMPLEMENTED** (tiers/depts) / **PARTIAL** (position tree) | Tier `level`; dept nest; position `reportsTo` |
| Cross-department positions | **IMPLEMENTED** (model) | Optional `departmentId`; no cross-dept restriction |
| Position permissions | **PARTIAL** | JSON + `permissionService`; PermissionManager focuses on sets; BCC maps not hydrated |
| Module/application assignment | **PARTIAL** / mostly **UI_ONLY** stubs | `assignedModules` / `departmentModules` exist; BCC `{}`; PermissionManager department checkboxes TODO |
| Approval hierarchy | **BACKEND_ONLY** | Full API + tests; no org-chart admin UI |
| Events / realtime | **IMPLEMENTED** | Activity + domain events + `org_structure_updated` broadcast; BCC reload/polling |

### Highest-confidence UI↔backend contradictions

1. Assign: client `effectiveDate` vs service `startDate`
2. Remove: client `POST /employees/remove` vs route `DELETE /employees/remove`
3. Display: `name` / `capacity` / `isActive` / `currentEmployees` vs `title` / `maxOccupants` / `active` / nested `employeePositions`
4. Visual reporting update: missing auth header on `fetch` PUT
5. Permission/module assignment UI stubs vs empty BCC maps vs working server `checkUserPermission` API

**Backend employee assignment itself is covered by integration tests** (assign with `startDate`; remove via DELETE). The breakage is primarily the **Business Admin UI client contract**, not absence of domain logic.

---

## 6. Identity / membership / employment / position model

### Layers (as implemented)

| Layer | Question | Fact owner today | Model |
|-------|----------|------------------|-------|
| **Identity** | Who is the person? | Auth | `User` |
| **Business membership** | Does this user belong to this business? | Members / BA | `BusinessMember` (+ invitation) |
| **Employment** | Employment record? | HR | `EmployeeHRProfile` (1:1 with `EmployeePosition`) |
| **Organization structure** | Where does placement sit? | BA org chart | `OrganizationalTier`, `Department`, `Position`, `reportsTo` |
| **Assignment** | Which position(s) does the user hold? | BA (`employeeManagementService`) | `EmployeePosition` |
| **Responsibility** | What are they responsible for? | **Mostly derived** from reporting / audiences / approvals | No first-class `Responsibility` model; manager subtree + approval hierarchy only |
| **Authorization** | May they perform protected action? | Policy Engine (canonical direction) + dual legacy | Membership + BusinessRole + flags; limited position for HR manager |
| **Presentation** | What UI emphasizes/shows? | Module chrome, BCC, front-page, hub | Role chrome; incomplete org→module maps |

### Boundary respect

| Boundary | Respected? | Notes |
|----------|------------|-------|
| Membership ≠ employment | **Mostly yes** | Separate models; HR profile requires EP |
| Membership ≠ org position | **Mostly yes** | EP separate; members without positions exist (synthetic placeholders in employee list) |
| Org position ≠ AuthZ | **Partially violated in schema intent** | Position/tier/dept store permission/module JSON; PE does not consume them; parallel `permissionService` does |
| HR ≠ platform AuthZ | **Yes** | Product Definition + PE ownership |
| BA owns structure writes | **Yes** | `employeeManagementService` documents authority; HR consumes |

### Overlap surfaces

- **Members** vs **Org chart Employees:** both surface “people in the business”; only EP is workforce identity anchor
- **BusinessMember.title/department** strings vs **Position.title** / **Department** rows
- **BusinessRole.MANAGER** vs **Position.reportsTo** vs **ManagerApprovalHierarchy** vs scheduling `JobFunction.SUPERVISOR`
- **BusinessConfigurationContext** as frontend aggregator of org + empty permission maps — presentation, not server AuthZ (`POLICY_ENGINE.md`)

---

## 7. Role vs position vs permission

### Meanings traced from behavior (not names)

| Term in code | Actual meaning |
|--------------|----------------|
| `BusinessRole` | Coarse membership designation; drives PE for many business mutations and UI chrome |
| `OrganizationalTier` | Rank band for positions; optional default permission/module JSON |
| `Position` | Org seat with title, tier, optional department, reporting link, scheduling station fields, permission/module JSON |
| `EmployeePosition` | Active/historical assignment of User to Position in a Business |
| `Permission` / `PermissionSet` | Org-chart RBAC catalog/sets |
| `permissionService.checkUserPermission` | Resolves JSON inheritance: EP custom → position → tier → department |
| PE authorize | Membership + role/flags; HR manager may use `position.directReports.length > 0` |
| BCC `modulePermissions` / `positionPermissions` | Frontend presentation maps; position/tier/dept maps initialized empty |

### Answers

1. **Are “role” and “position” distinct?** **Yes** in models (`BusinessRole` vs `Position`/`EmployeePosition`). Product language requires this; some UI copy and member fields blur them.
2. **Is job title separate from position?** **Partially.** Canonical title for org placement is `Position.title`. Also: `BusinessMember.title`, invitation `title`, orphan `Job.title`.
3. **Does assigning a position automatically grant permissions?** **Not via PE.** `permissionService` *can* grant capability checks from position JSON if populated; PE does not. Assigning EP does not by itself change `BusinessRole`.
4. **Does assigning a business role automatically grant permissions?** **Yes for PE-covered actions** that key off `ADMIN`/`MANAGER`/`canManage`/`canInvite`. Not a full module permission matrix.
5. **Does org placement feed Policy Engine?** **PARTIAL** — only HR manager path via directReports occupancy; not general AuthZ.
6. **Duplicated permission models?** **Yes** — PE + member flags + org JSON RBAC + BCC maps + module-local share permissions (Drive/Chat/etc., out of scope but named similarly).
7. **Documented transitional paths?** **Yes** — org-chart parallel RBAC transitional/planned deprecation; PE dual on org-chart writes; BCC maps “loaded from backend later.”
8. **Frontend roles/positions for presentation only?** **Often.** HR/Scheduling/WC sidebars use **BusinessRole** for chrome. Org position used for manager team scoping where wired. Module catalog filtering by position is largely inert (empty maps).

---

## 8. Reporting / responsibility model

### What Vssyl knows today

| Fact | Modeled? | How |
|------|----------|-----|
| Who reports to whom (structural) | **Yes** | `Position.reportsToId` / `directReports` |
| Who manages whom (operational occupancy) | **Derived** | Occupants of manager position vs report positions; HR helpers resolve manager user for notifications |
| Who supervises a department | **Partial** | `Department.headPositionId` exists; builder does not expose assignment UI |
| Departmental ownership | **Structural only** | Department tree + optional head position |
| Location responsibility | **No** | No `LocationResponsibility`; `JobLocation` is scheduling site |
| Operational responsibility | **Limited** | Scheduling stations / job functions on Position; WC audiences; not a general responsibility graph |
| Temporary assignments | **Partial** | `EmployeePosition.endDate` / `active`; transfer API exists |
| Multiple responsibilities | **Partial** | Multiple EPs allowed by schema; product UX treats single position |
| Vacant positions | **Yes (backend)** | Vacant query; UI reliability weak |
| Approval responsibility | **Yes (API)** | `ManagerApprovalHierarchy` with approval types/levels |

**Important:** Responsibility is **not** modeled as a first-class domain beyond org reporting + approval hierarchy + audience targeting. Do not import external LTC Manager concepts; Vssyl currently lacks a general responsibility system.

---

## 9. Application-access model

### Trace (actual)

```
BusinessModuleInstallation (server)
  → getInstalledModules
  → BusinessConfigurationContext.enabledModules
  → getModulesForUser / PositionAwareModuleProvider (UI filter)
  → workspace navigation chrome
```

Server use of a module’s APIs is gated separately by **installation + membership + module feature gates / PE dual / legacy middleware** (e.g. HR/Scheduling/Workforce feature gating).

### Mechanisms

| Mechanism | Decides app access today? |
|-----------|---------------------------|
| Installed modules | **Yes** (primary) |
| Active business membership | **Yes** (server) |
| BusinessRole / canManage | **Admin ops** (install/uninstall), not catalog membership |
| Department modules | **Schema only**; BCC maps empty |
| Position `assignedModules` | **Persisted field**; no working visibility consumer found |
| Position/tier permission maps in BCC | **Empty**; filter logic present but inert |
| Feature gates | **Yes** for module API use |
| PE | Install/uninstall AuthZ; not catalog composition |

### Verdict

**Organization structure does not reliably decide application access today.**

- **UI visibility:** mostly all enabled installs (org filters unpopulated).
- **Server authorization:** installation + membership + role/flags for admin mutations + module-specific gates — **not** org-chart JSON permissions via PE.

---

## 10. Policy Engine relationship

### Organizational facts vs PE authorize

| Org fact | PE status | Notes |
|----------|-----------|-------|
| Business membership | **USED** | `NOT_MEMBER` deny path ubiquitous for business scope |
| BusinessRole | **USED** | ADMIN/MANAGER comparisons |
| canManage / canInvite | **USED** | Manage/invite helpers |
| canBilling | **NOT_USED** | Stored; PE billing = subscription owner only |
| EmployeePosition / Position | **PARTIAL** | HR manager: `directReports.length > 0` |
| Department | **NOT_USED** | |
| Business “owner” as distinct fact | **NOT_USED** | No `ownerId`; authority via membership/role |
| reportsTo walk | **NOT_USED** in PE | Used in domain services (HR/WC); PE uses directReports count for HR manager |
| Approval hierarchy structure | **NOT_USED** for authorize content | PE gates approval-hierarchy **API** via membership/role, not hierarchy edges |
| permissionService JSON | **NOT_USED** | Zero imports under `server/src/auth/` |

### What org-chart permissions are

| Classification | Fit |
|----------------|-----|
| Source of PE facts | **No** |
| Parallel authorization engine | **Yes** (narrow: org-chart routes + front-page requiredPermission) |
| UI metadata | **Partially** (sets UI; BCC maps intended presentation) |
| Transitional legacy | **Yes** (documented) |

Org-chart **mutation** AuthZ uses legacy `orgChartPermissions` + PE dual (`orgChartPolicyDual`) based on **membership/role/canManage**, not position JSON.

---

## 11. Existing role-aware behaviors

Real examples only (beyond raw “hide if no permission string”).

| # | Input | Behavior | Evidence |
|---|-------|----------|----------|
| 1 | **ROLE** | HR sidebar/dashboard admin vs manager team vs personal | `HRSidebar.tsx`, `HRDashboard.tsx` |
| 2 | **ROLE** | Scheduling sidebar builder/templates vs team vs my-schedule | `SchedulingSidebar.tsx` |
| 3 | **ROLE** + **PERMISSION** (`canManage`) | Workforce Comms admin vs employee chrome | `workforceCommsUtils.ts`, sidebars |
| 4 | **ROLE** | Business workspace hub hides `adminOnly` setup tiles | `BusinessWorkspaceHubPanel.tsx` |
| 5 | **ROLE** \| **POSITION** \| **tier/dept** \| org **PERMISSION** | Front-page widget visibility | `businessFrontPageService.getVisibleWidgets` |
| 6 | **MEMBERSHIP** \| **POSITION** \| **DEPARTMENT** \| **ROLE** \| manager subtree | Workforce audience targeting | `workforceAudienceService.ts` |
| 7 | **POSITION** / reporting | HR PTO team pending + manager notifications | `hrPtoService`, `hrServiceShared` |
| 8 | **POSITION** / reporting | Scheduling swap notify manager | `schedulingNotificationService` |
| 9 | **POSITION** (directReports) | HR/scheduling manager access middleware + PE HR manager | `hrPermissions.ts`, `policyEngine.ts` |
| 10 | **POSITION** + manager relationship | HR AI self context (title, dept, manager) | `hrAiContextService.ts` |
| 11 | **ROLE** | Modules management page admin chrome (server PE still enforces) | `modules/page.tsx` |

### Verdict on “permission-aware vs role-aware”

Vssyl is **primarily permission- and membership-role-aware** today, with **localized position-aware manager experiences** in HR/Scheduling/Workforce/front-page/audiences. It is **not** yet a coherent organization-wide role-aware experience system. Product Definition’s “adapt emphasis beyond permissions” is aspirational relative to Dashboard/workspace personalization.

**Not found as working SoT:** position-driven application catalog; PE consumption of org JSON permissions; `canBilling`-driven billing AuthZ.

---

## 12. Org-chart health assessment

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Data model | **STRONG** | Coherent tiers/depts/positions/EP/reporting/capacity; HR/scheduling FKs |
| CRUD | **PARTIAL** | Backend strong; UI field-name drift on positions |
| Hierarchy | **PARTIAL** | Tiers/depts solid; position reporting UI auth gap |
| Employee assignment | **BROKEN** (admin UI path) | Client/server contract mismatch; backend tests pass |
| Reporting relationships | **PARTIAL** | Model + visual; missing auth header; no builder reportsTo editor |
| Department relationships | **STRONG** / **PARTIAL** UI | Nesting works; headPosition not in builder |
| Permission integration | **WEAK** | Parallel RBAC; UI incomplete; BCC empty |
| Policy Engine integration | **PARTIAL** | Dual on org-chart writes via membership/role; not org JSON |
| Application-access integration | **WEAK** | Schema fields; no reliable runtime gating |
| Frontend reliability | **WEAK**–**PARTIAL** | Structure tabs usable; employees/permissions fragile |
| Business-context isolation | **STRONG** | Integration tests for tenant isolation |
| Tests | **STRONG** (backend) | Org-chart, PE/activity, approval hierarchy, EP identity tests passed in this audit |
| Realtime/state refresh | **PARTIAL**–**STRONG** | Config broadcast + BCC reload; depends on successful mutations |
| Terminology clarity | **WEAK** | role/position/tier/job/title/manager overloaded across layers |

Ratings of **BROKEN** are limited to evidenced UI↔API contract failures, not speculative.

---

## 13. Confirmed overlap / duplication / drift

| Overlap | Classification | Notes |
|---------|----------------|-------|
| Business member role vs org position | **A — DIFFERENT CONCEPTS, CORRECT** | Distinct models; must stay distinct |
| Org `Department` vs `BusinessMember.department` string | **E — TERMINOLOGY CONFUSION** (+ weak duplicate metadata) | String is not FK |
| `EmployeePosition` vs `BusinessMember` | **A — DIFFERENT CONCEPTS, CORRECT** | Membership vs workforce placement |
| `EmployeeHRProfile` vs `BusinessMember` | **A — DIFFERENT CONCEPTS, CORRECT** | Employment vs membership |
| Position permissions vs Policy Engine | **C — TRANSITIONAL DUPLICATION** | Documented parallel RBAC |
| BCC permission maps vs server authority | **B — DIFFERENT LAYERS, CORRECT** in intent; **E** in practice because maps empty / look authoritative | Presentation must not replace PE |
| Tier permissions vs role permissions | **E — TERMINOLOGY CONFUSION** | Org tier JSON vs BusinessRole vs billing `Business.tier` |
| Frontend org types vs backend Prisma fields | **D — TRUE DUPLICATE AUTHORITY** (client types as false SoT) | `effectiveDate`/`isActive`/`name` vs `startDate`/`active`/`title` |
| `/api/business/.../members` vs `/api/member` | **C — TRANSITIONAL DUPLICATION** | Dual member mutation surfaces |
| `Job` vs `Position` | **C / LEGACY** | Job near-orphan |
| Org reporting vs approval hierarchy | **A — DIFFERENT CONCEPTS, CORRECT** | Structural vs approval chains |
| Scheduling stations vs org positions | **B — DIFFERENT LAYERS, CORRECT** | Ops fields on Position; stations owned by Scheduling |
| Ownership doc “approval unwired” vs API wired | **E / doc drift** | Code wins |

---

## 14. Foundation conclusion

### **CONCLUSION 3**

**Existing organizational model mixes structural facts, permissions, and presentation concerns enough that architectural reconciliation is needed before role-aware work.**

#### Why not 1 or 2

- Not **1**: employee-assignment admin path and org→application gating are not “minor completion only”; permission authority is split and transitional.
- Not only **2**: missing “responsibility” semantics matter, but the larger blocker is **mixed authority** (structure JSON permissions + PE + BCC), not merely absent fields.

#### Why not 4

- Backend org structure is coherent, tenant-scoped, tested, evented, and **already consumed** by HR, Scheduling, Workforce Comms, front-page, and AI HR context.
- Prefer **extend existing ownership** (BA structure, Members membership, HR employment, PE AuthZ, presentation chrome) rather than redesigning a new org system.

#### Implication

Before designing role-aware Dashboards/experiences: reconcile **which facts are structural**, **which are AuthZ**, and **which are presentation inputs** — without collapsing org position into BusinessRole or PE.

---

## 15. Gaps requiring runtime verification

Code evidence is strong for contract mismatches; browser/runtime still needed to confirm severity and any compensatory paths:

1. Org-chart **Employees** tab: assign/remove/transfer against a live business (expect fail on `effectiveDate` / POST remove).
2. Org-chart **Visual** drag-to-reparent with authenticated session (expect 401/fail without Authorization header).
3. Whether any production data populates `Position.permissions` / `assignedModules` such that `permissionService` or front-page `requiredPermission` changes real UX.
4. Whether `getBusinessEmployees` synthetic `member-*` placeholders confuse operators in admin UI.
5. Multi-position users: which position BCC/`getUserPosition` selects in workspace.
6. Whether Soft-delete/Global Trash expectations for org entities matter operationally (hard deletes documented in BA findings).
7. End-to-end: member invited with BusinessRole only, never assigned EP — which apps/manager features degrade.

---

## 16. Questions for the product owner

Genuine product decisions only:

1. **Should every business participant be required to have an `EmployeePosition`, or is membership-without-placement a supported long-term state** (contractors, occasional participants, owners who never sit on the chart)?
2. **Is BusinessRole intended to remain a coarse admin/membership designation forever, or should it eventually be derived/replaced by org placement for experience shaping** (without making position = AuthZ)?
3. **Should application availability ever be constrained by department/position**, or should apps stay install-scoped with role-aware *emphasis inside* apps?
4. **Is manager experience defined by org `reportsTo` occupancy, by BusinessRole.MANAGER, by approval hierarchy, or by an explicit responsibility assignment** when those disagree?
5. **Should Business Administration continue to own permission-set UX**, or should that surface be retired in favor of Policy Engine / entitlements once reconciliation lands?

---

## 17. Recommended next phase

### **E — Combination in explicit order**

1. **B — Org-model architectural reconciliation**  
   Document authority: membership vs EP vs HR profile vs PE vs presentation inputs; mark org JSON RBAC transitional boundaries; no new engine.

2. **A — Runtime verification**  
   Confirm UI↔API broken paths and any live permission JSON usage (section 15).

3. **C — Targeted org-chart completion**  
   Fix client/server contracts for assignment/reporting display so existing structural facts are operable from BA UI (still not role-aware product design).

4. **D — Role-aware product modeling**  
   Only after facts/authority are clear: what experiences adapt for owner/manager/frontline — using existing facts, not a parallel org model.

Do **not** skip to D. Do **not** create a Role-Aware Experience Engine in the next phase.

---

## Appendix A — Targeted tests run (this audit)

| Command | Result |
|---------|--------|
| `pnpm security:secrets` | **PASS** — no secrets detected |
| Vitest: `org-chart.integration.test.ts`, `org-chart-policy-activity.integration.test.ts`, `employeeManagementService.identity.test.ts`, `businessMemberService.test.ts`, `businessMemberPolicyDual.test.ts`, `approvalHierarchy.integration.test.ts`, `approvalHierarchyPolicy.test.ts`, `approvalHierarchyService.test.ts` | **8 files / 36 tests PASS** |

Tests were not modified.

---

## Appendix B — Primary file index

**Prisma:** `prisma/modules/auth/user.prisma`, `business/business.prisma`, `business/org-chart.prisma`, `hr/core.prisma`, `scheduling/core.prisma`, `business/modules.prisma`  

**Server:** `routes/org-chart.ts`, `services/orgChartService.ts`, `employeeManagementService.ts`, `permissionService.ts`, `approvalHierarchyService.ts`, `business/businessMemberService.ts`, `auth/policyEngine.ts`, `auth/orgChartPolicyDual.ts`, `workforceAudienceService.ts`, `businessFrontPageService.ts`  

**Web:** `app/business/[id]/org-chart/page.tsx`, `components/org-chart/*`, `api/orgChart.ts`, `contexts/BusinessConfigurationContext.tsx`, `components/PositionAwareModuleProvider.tsx`  

**Docs:** Product Definition glossary; `POLICY_ENGINE.md` AuthZ vs presentation; BA ownership model; Application Participation Phase 2 matrix (org-chart RBAC transitional)

---

**End of Phase 1 audit.** Non-authoritative. Implementation truth remains code/tests.
