# Business Participant & Organizational Model — Phase 3 Runtime Verification

**Status:** NON-authoritative evidence/history  
**Date:** 2026-09-08  
**Program:** Business Participant & Role-Aware Experience  
**Phase:** 3 — Business Administration Org Runtime Verification  
**Baseline HEAD:** `58bba3d9658d9e91ff8b34856598c0b230e2cf5a`  
**Constraint:** Verification only. No code, schema, architecture SoT, Product Definition, Phase 1/2, or test modifications.

**Canonical composition:** [`../BUSINESS_PARTICIPANT_COMPOSITION.md`](../BUSINESS_PARTICIPANT_COMPOSITION.md)  
**Phase 1:** [`BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md)  
**Phase 2:** [`BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_2.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_2.md)

---

## 1. Purpose

Answer: **Can an authorized business administrator reliably configure and maintain Vssyl’s existing organizational structure through the current Business Administration experience?**

Produce concrete evidence for a **small targeted repair** phase. Do not fix defects. Do not design role-aware UX.

---

## 2. Baseline / environment

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD / origin/main | `58bba3d96` (0 ahead / 0 behind) |
| Unrelated dirty work | Preserved (deploy/auth/GTM, etc.) — not staged |
| Production systems | **Not touched** |
| Browser/local authenticated BA UI | **Not available** in this session (no active `pnpm dev` / no disposable browser session) |
| Primary methods | Static contract tracing + existing Vitest integration/unit tests + exhaustive consumer greps |

**Evidence legend**

| Tag | Meaning |
|-----|---------|
| **STATIC** | Code/route/type evidence |
| **TEST** | Automated test run this phase |
| **RUNTIME** | Live browser/API against local app (not obtained) |
| **F** | Classification F — environment unknown |

---

## 3. Verification methods

1. Re-mapped UI ↔ API contracts from current `web/src/api/orgChart.ts`, org-chart components, `server/src/routes/org-chart.ts`, services.  
2. Re-checked auth: Next proxy cookie→Bearer vs Express Bearer-only.  
3. Traced member-without-placement, multi-position, synthetic `member-*`, permission JSON, module maps, approval hierarchy, realtime.  
4. Exhaustive greps for legacy candidates (`Job`, `PermissionManagementRights`, `PermissionChange`, dual member APIs).  
5. Ran targeted Vitest suites (org-chart, assignment identity, member PE dual, approval hierarchy, BCC contract, activity).  
6. `pnpm security:secrets`.

Browser end-to-end BA flows marked **UNKNOWN (F)** where only static+test evidence exists; defects that are pure contract mismatches are still classified as **B** from STATIC evidence.

---

## 4. Executive findings

1. **Backend org structure + EmployeePosition assignment are largely sound and well-tested.**  
2. **Business Administration Employees UI cannot reliably assign or remove** due to frontend↔API contract defects (`effectiveDate`≠`startDate`; `POST`≠`DELETE`).  
3. **Transfer API path is viable** (route maps `effectiveDate` → service `startDate`); UI transfer likely works if from/to positions are already known — still undermined by broken occupancy display (`isActive` vs `active`).  
4. **Tier/department create and position create (with mapping) are the strongest BA UI structure paths;** position **edit** and **delete** (and tier/dept delete) have additional contract defects.  
5. **Missing Authorization on VisualView reportsTo is NOT a security defect under cookie JWT + Next proxy Bearer injection.** It remains fragile client hygiene (depends on session cookie + proxy). **Security defect: NO.**  
6. **Org JSON RBAC is transitional and weakly active** (check API exists; front-page `requiredPermission` is effectively broken due to missing `await`). PE remains AuthZ SoT for protected ops.  
7. **`assignedModules` / `departmentModules` / BCC maps do not meaningfully gate apps** today (maps empty; install lifecycle wins).  
8. **Member without EP is generally safe** for membership/workspace; some domain audiences/lists are EP-centric (graceful empty / incorrect assumption vs product “valid participant,” not hard crash).  
9. **Approval hierarchy is API infrastructure only** — not wired into HR/Scheduling approval product flows.  
10. **Realtime org→BCC reload is wired** (tests + code); live browser refresh **F**.

**Primary question answer:** An authorized admin **cannot reliably** maintain workforce placement through the current BA Employees experience. They **can** create tiers/departments and create positions (create mapping works). Reporting via VisualView **likely works** when session cookies authenticate the proxy. Overall BA org tooling is **PARTIAL / not production-trustworthy for placement CRUD** until targeted contract repairs.

---

## 5. UI ↔ API contract matrix

Auth baseline (**STATIC**):

| Layer | Behavior |
|-------|----------|
| `authenticatedApiCall` | Sets `Authorization: Bearer`; same-origin cookies by default |
| VisualView raw `fetch` | No Authorization; default same-origin cookies |
| Next `/api/[...slug]` proxy | If no Authorization, injects Bearer from NextAuth `getToken` → `accessToken` |
| Proxy DELETE | Body **not** forwarded (`DELETE` excluded) |
| Express `authenticateJWT` | **Bearer header only** — no direct cookie JWT |

| Operation | FE | Method/path | FE body | Server expects | Status |
|-----------|----|-------------|---------|----------------|--------|
| Create tier | OrgChartBuilder → `createOrganizationalTier` | POST `/tiers` | name, level, … | aligned | **WORKS** (STATIC) |
| Edit tier | → `updateOrganizationalTier` | PUT `/tiers/:id` | name, level, … | aligned | **WORKS** (STATIC) |
| Delete tier | → `deleteOrganizationalTier` | DELETE `/tiers/:id` | none | 204 | **FAILS** client JSON on 204 (**B**) |
| Create dept | → `createDepartment` | POST `/departments` | aligned | aligned | **WORKS** (STATIC) |
| Edit dept | → `updateDepartment` | PUT | aligned | aligned | **WORKS** (STATIC) |
| Delete dept | → `deleteDepartment` | DELETE | none | 204 | **FAILS** client JSON (**B**) |
| Create position | → `createPosition` | POST `/positions` | maps name→title, capacity→maxOccupants | title, maxOccupants | **WORKS** create adapter (**A** for create) |
| Edit position | → `updatePosition` raw form | PUT | `name`/`capacity` | title/maxOccupants | **FAILS** (**B**) |
| Delete position | → `deletePosition` | DELETE | none | 204 | **FAILS** client JSON (**B**) |
| Assign | EmployeeManager → `assignEmployeeToPosition` | POST `/employees/assign` | **effectiveDate** | **startDate** | **FAILS** (**B**) |
| Remove | → `removeEmployeeFromPosition` | **POST** `/employees/remove` | body | **DELETE** + body | **FAILS** (**B**); fixing method alone still blocked by proxy DELETE body |
| Transfer | → `transferEmployee` | POST `/employees/transfer` | effectiveDate | route maps to Date | **WORKS** API (**A**/PARTIAL UI) |
| reportsTo | VisualView raw PUT | PUT `/positions/:id` | reportsToId | aligned | **PARTIAL** — auth via cookie→proxy (**A** under cookie path; fragile client) |
| List employees | `getBusinessEmployees` | GET `/employees/:id` | — | `{success,data}` + `active`/`startDate` | envelope OK; FE reads `isActive`/`effectiveDate` (**B**/C) |
| Vacant | `getVacantPositions` | GET `.../vacant` | — | positions w/ zero active EPs | API OK; UI `name`/`capacity` (**C**) |
| Approval hierarchy | **no BA UI** | `/approval-hierarchy/*` | — | full CRUD API | **BACKEND_ONLY** |

Phase 1 findings **still accurate** in current code for assign/remove/field aliases. Auth finding **refined** (cookie+proxy).

---

## 6. EmployeePosition assignment

| Path | Result | Evidence |
|------|--------|----------|
| BA UI assign | **FAILS** | FE sends `effectiveDate` (`EmployeeManager.tsx` ~189–195; `orgChart.ts` AssignEmployeeData). Route passes body through; service requires `startDate` (`employeeManagementService.ts` AssignEmployeeData + create). **STATIC** |
| Server/API + tests | **WORKS** | Integration tests assign with `startDate`; identity tests pass (**TEST**) |
| Reload/display after assign | **PARTIAL/BROKEN** | Even if assign succeeded via API, UI filters `emp.isActive` while API returns `active` |

Classification: **B — FRONTEND/API CONTRACT DEFECT** (UI path). Domain logic: **A** when called correctly.

---

## 7. Removal / transfer

### Removal

| Path | Result | Evidence |
|------|--------|----------|
| BA UI remove | **FAILS** | Client POST (`orgChart.ts` ~457–466); server `router.delete` (`org-chart.ts` ~843+). No compatibility POST route found. **STATIC** |
| Even if method fixed to DELETE with body | **FAILS** via proxy | Proxy skips DELETE bodies (`route.ts` ~134–139). Repair must use query params or alternate method design. **STATIC** |
| Service remove | **WORKS** | Soft-deactivates `active: false`; tested via integration. **TEST** |

Classification: **B**.

### Transfer

| Path | Result | Evidence |
|------|--------|----------|
| API transfer | **WORKS** | Route maps `effectiveDate` → `new Date(...)` → service `startDate` (`org-chart.ts` ~885–893; service ~286–327). Soft-removes source then assigns target. **STATIC** + **TEST** coverage of assign/remove building blocks |
| BA UI transfer | **PARTIAL** | Uses Bearer client + correct date field name at route; depends on UI listing positions/employees — occupancy filters broken (`isActive`). Multi-position not modeled in UI. |

History: source EP deactivated; new EP created. Schema multi-position preserved (transfer is remove+assign, not “single seat product rule”).

---

## 8. Reporting relationships

| Question | Answer | Evidence |
|----------|--------|----------|
| Does VisualView send Authorization? | **No** | `OrgChartVisualView.tsx` ~206–217 |
| Does Express accept cookies? | **No** | Bearer-only `authenticateJWT` |
| Can request succeed? | **Yes, via Next proxy** injecting Bearer from NextAuth session cookie when Authorization absent | `api/[...slug]/route.ts` ~103–110 |
| credentials:'include'? | Not set; default same-origin cookies on `/api` | browser default |
| Builder reportsTo editor? | **None** | only Visual drag |
| Security defect? | **NO** | Cookie JWT + proxy is intentional adapter; missing header is fragile client style, not AuthZ bypass |

Classification: reportsTo under cookie session = **A** (works as designed via proxy) with **B**/hygiene risk if caller hits Express without proxy or without session. Live drag success: **F**.

---

## 9. Position field contracts

| Server field | FE alias / use | Classification |
|--------------|----------------|----------------|
| `title` | create maps from `name`; list/edit often use `name` | create = intentional adapter; edit/list = **B**/stale (**D** type) |
| `maxOccupants` | `capacity` | same |
| `active` (EP) | FE `isActive` | **B**/C — real display/filter failure |
| `employeePositions` | FE `currentEmployees` | **C**/stale |
| `startDate` | FE `effectiveDate` | assign **B**; transfer route adapts |
| `description` on Position | FE type has it | no Prisma column — stale type |
| `reportsToId` | Visual OK | aligned |
| station fields | Scheduling editors | out of BA Employees path |

---

## 10. Vacancy / capacity behavior

| Aspect | Result | Evidence |
|--------|--------|----------|
| Vacant query | **WORKS** (backend) | Zero active assignees; **TEST**/service |
| Partial fill | Capacity enforced on assign (`maxOccupants`) | **STATIC** |
| UI occupancy | **FAILS display** | Filters `isActive`; uses `capacity`/`name` | **C** + **B** |
| Inactive EPs | Excluded from active lists server-side | **A** |

---

## 11. Member-without-placement behavior

Architecture: **valid**. Runtime:

| Surface | Class |
|---------|-------|
| Workspace / PE membership | **EXPECTED** |
| Module visibility | **GRACEFUL_DEGRADATION** → full installed set when no position / empty maps |
| Members roster | **EXPECTED** |
| Scheduling self | **EXPECTED** (member sufficient) |
| Scheduling manager (non-admin) | **EXPECTED** deny without EP |
| HR self | **GRACEFUL_DEGRADATION** stub |
| HR manager | **EXPECTED** deny |
| HR directory | **GRACEFUL_DEGRADATION** (EP-centric) |
| WC `BUSINESS` audience | **INCORRECT_ASSUMPTION** vs “all members” (EPs only) |
| WC role/custom groups | **GRACEFUL_DEGRADATION** (members; EP id may be null) |
| Org JSON check | deny without EP — **EXPECTED** for that transitional path |
| Crash BusinessMember⇒EP | **Not found** as RUNTIME_FAILURE for core paths |

Live browser matrix: **F** for UX polish; static classification above.

---

## 12. Multi-position behavior

| Question | Answer |
|----------|--------|
| Schema supports multiple EPs? | **Yes** |
| Product UI support? | **No** first-class multi-seat UX |
| BCC `getUserPosition` | First match with `ep.isActive` — often **finds none** due to `active` field (**B**) |
| HR/Scheduling `findFirst` | Non-deterministic which EP without `orderBy` |
| permissionService | Unions **all** EPs |
| Front-page | Uses **all** positions |
| Contradictory manager trees? | **Possible** if multiple manager seats (**E**) |

Classification: **E — PRODUCT SEMANTIC QUESTION** + incidental **B** (isActive).

---

## 13. Permission-set / org JSON runtime use

| Question | Answer |
|----------|--------|
| Actively granting/denying? | **Weakly** — `GET /permissions/check` + intended front-page gate |
| Protected PE ops? | **No** — PE/membership/role for install, members, org mutations |
| Front-page `requiredPermission` | **Broken** — `checkUserPermission` is `async` but **not awaited** → Promise always truthy (`businessFrontPageService.ts` ~336–343) (**C**/B) |
| PermissionSet UI | CRUD exists; sets **not** read by `checkUserPermission` inheritance loop |
| BCC maps | Stay `{}` — presentation only |
| Retiring today? | Would break PermissionManager/check API; PE/membership unchanged; front-page permission already ineffective |

Classification: **D — TRANSITIONAL / LEGACY BEHAVIOR**.

---

## 14. Module-assignment metadata runtime use

| Artifact | Class (Phase 3 A–E) | Impact |
|----------|---------------------|--------|
| `Position.assignedModules` | C persistable + D unused for nav | **No** install authority |
| `Department.departmentModules` | C/D; PermissionManager TODO | **No** |
| BCC position/tier/dept maps | **B always empty** | Filters inert |
| `getModulesForUser` / PositionAwareModuleProvider | **E** wired but collapses to enabled installs | App list ≈ `BusinessModuleInstallation` |

**Actual impact on application visibility today: none meaningful from org metadata.**

---

## 15. Synthetic member adapter

| Aspect | Finding | Class |
|--------|---------|-------|
| Generation | Members without EP get `id: member-${userId}`, `positionId: null`, `active: true` | **VALID PRESENTATION ADAPTER** / transitional for scheduling |
| Org assign | Uses `userId` — does not treat synthetic id as EP FK | **A** for org assign |
| WC AudiencePicker | May set `employeePositionId: e.id` including `member-*` | **BUG RISK** (**B**/G-adjacent data integrity — **not** classified G without exploit path) |
| Scheduling create shift | FK connect if non-null; update path strips `member-*` | **BUG RISK** on create |
| Duplicates | User appears once (EP **or** synthetic) | OK |

Overall: **TRANSITIONAL COMPATIBILITY** with **BUG RISK** — not fully BROKEN.

---

## 16. Approval hierarchy

| Aspect | Status |
|--------|--------|
| Persistence / API / PE dual / activity / tests | **ACTIVE_DOMAIN_INFRASTRUCTURE** (**TEST** 39 org-related tests include AH) |
| BA UI | **None** |
| HR PTO / Scheduling / WC consumers of model | **None found** — people manager uses `reportsTo` occupancy |
| Distinct from reporting | **Yes** |

Verdict: **PARTIAL / UNUSED_CONFIG** for product workflows; **API ready**.

---

## 17. Realtime / state refresh

| Step | Status |
|------|--------|
| Mutation success → activity/domain event | Wired (**STATIC**/TEST) |
| → `notifyOrgStructureChange` → `business:config:updated` | Wired |
| BCC join + reload on matching businessId | Wired (**STATIC**); BCC test covers subscribe/reload contract (**TEST** 6 pass) |
| Live multi-tab refresh | **F** |

Classification: **A** for infrastructure; live confirmation **F**.

---

## 18. Legacy/dead candidate inventory

| Candidate | Classification | Evidence |
|-----------|----------------|----------|
| `Job` | **COMPATIBILITY** / near-dead writes | Schema + member includes/reads; **no** `prisma.job.*` service writes found |
| `PermissionManagementRights` | **DEAD_CANDIDATE (H)** | Schema only; no TS service/route usage |
| `PermissionChange` | **DEAD_CANDIDATE (H)** | Schema only; no TS usage |
| Dual member APIs | **ACTIVE** (duplicate surfaces) | `/api/business/.../members` + `/api/member/...` |
| `BusinessMember.title` / `.department` | **ACTIVE** metadata | Invite/update/AI reads |
| Org JSON permission fields | **TRANSITIONAL (D)** | See §13 |

---

## 19. Tests executed

| Command | Result | Evidence |
|---------|--------|----------|
| Vitest: org-chart.integration, org-chart-policy-activity, employeeManagementService.identity, businessMemberService, businessMemberPolicyDual, approvalHierarchy.integration, approvalHierarchyPolicy, approvalHierarchyService, orgChartActivityService | **PASS** — 9 files / 39 tests | Server suite this phase |
| Vitest: `web/src/lib/__tests__/businessConfigurationContext.test.ts` | **PASS** — 6 tests | Reload/subscribe contract only — **does not** cover assign field contracts |
| `pnpm security:secrets` | **PASS** | No leaks |
| Browser BA E2E | **SKIPPED** | No local authenticated BA session |
| Frontend tests for EmployeeManager assign/remove contracts | **SKIPPED / absent** | No dedicated FE contract tests found |

---

## 20. Confirmed implementation defects

| ID | Classification | Frontend | Backend | Actual | Expected contract | Blast radius |
|----|----------------|----------|---------|--------|-------------------|--------------|
| D1 | **B** | `EmployeeManager` / `orgChart.ts` assign | `employeeManagementService.assignEmployeeToPosition` | Sends `effectiveDate`; service needs `startDate` | Shared field name or route mapper | BA cannot place people via UI |
| D2 | **B** | `removeEmployeeFromPosition` POST | `DELETE /employees/remove` + proxy no DELETE body | Method mismatch; DELETE body dropped | Aligned method + body transport (query/alt) | BA cannot remove placements via UI |
| D3 | **B** | `OrgChartBuilder` position edit | `updatePosition` Prisma | Sends `name`/`capacity` | `title`/`maxOccupants` | Position edits don’t persist correctly |
| D4 | **B** | `authenticatedApiCall` always `response.json()` | Org deletes return **204** | Client throws after successful delete | Handle 204 / empty body | Tier/dept/position delete UI fails after success |
| D5 | **C**+**B** | EmployeeManager / BCC `isActive`/`effectiveDate` | API `active`/`startDate` | Filters/labels wrong | Align names or map in client | Empty occupancy; BCC position-aware paths inert |
| D6 | **C** | Builder vacant/list `name`/`capacity`/`currentEmployees` | Prisma `title`/`maxOccupants`/`employeePositions` | Wrong labels | Map or rename | Confusing UI; capacity wrong |
| D7 | **B** (hygiene; **not G**) | VisualView fetch no Bearer | Proxy cookie→Bearer; Express Bearer-only | Works only via proxy+session | Prefer same `authenticatedApiCall` | Fragile if called outside proxy |
| D8 | **C**/B | `businessFrontPageService` | `permissionService.checkUserPermission` async | Missing `await` → never deny | Await boolean | `requiredPermission` ineffective |
| D9 | **D**/bug risk | AudiencePicker / scheduling create | Synthetic `member-*` | May treat as EP id | Strip/normalize synthetic ids | Bad FKs / audience resolve |
| D10 | **D** | PermissionManager / unused check paths | permissionService | Parallel RBAC; sets not in check loop | Transitional — don’t expand | Confusion; PE migration debt |

**No G (authorization/security defect)** claimed for VisualView cookie path.

---

## 21. Product semantic questions

1. Should BA Employees UI treat multi-position as first-class, or enforce single active placement for presentation?  
2. Should WC `BUSINESS` audience mean all `BusinessMember`s or all placed workforce (`EmployeePosition`)?  
3. Should synthetic `member-*` remain a scheduling presentation adapter, or should unplaced members use a dedicated non-EP identity in consumers?  
4. When should PermissionSet attach to enforcement vs remain administrative templates until PE migration?

---

## 22. Recommended targeted repair scope

Smallest verified repair categories (no implementation steps):

1. **Employee assign/remove/transfer client↔server field and HTTP contracts** (D1, D2; preserve transfer mapper).  
2. **Employee list/occupancy response mapping** (`active`/`startDate` ↔ UI) (D5).  
3. **Position edit field mapping** (D3) and **204-safe delete client** (D4).  
4. **Position display aliases** for list/vacant (D6) — may piggyback on (2)/(3).  
5. **VisualView use shared authenticated API helper** (D7 hygiene).  
6. **Optional follow-ons (smaller / separate):** front-page `await` (D8); synthetic id guards (D9); do **not** expand org JSON RBAC.

Out of scope for “make BA org usable”: PE migration, approval hierarchy UI, role-aware UX, Responsibility model, deleting dead tables.

---

## 23. Readiness

### **READY_FOR_TARGETED_REPAIR**

Evidence is sufficient to justify a **small contract-repair phase** for BA org placement usability. Remaining **F** items (live browser) should be smoke-tested after repairs, not used to block starting the targeted fix set above.

---

## Explicit answers (checklist)

1. Assign from BA today? **FAILS** (UI contract). API **WORKS**.  
2. Remove? **FAILS** (UI + proxy DELETE body).  
3. Transfer? **API WORKS**; UI **PARTIAL**.  
4. reportsTo Visual? **Likely WORKS** via cookie→proxy; **F** live.  
5. Missing Authorization a bug under cookie JWT? **Not a security defect**; fragile client — use shared auth helper.  
6. Field mismatches causing real failures? **effectiveDate/startDate**, **POST/DELETE**, **name/capacity on edit**, **isActive/active**, **204 JSON**, display aliases.  
7. Member without EP safe? **Mostly yes** (EXPECTED/GRACEFUL); WC BUSINESS audience EP-only assumption.  
8. Multi-position? Schema yes; consumers first/`findFirst`/union — **E**.  
9. Org JSON RBAC active? **Weakly**; not PE; front-page gate broken.  
10. assignedModules/departmentModules impact apps? **No meaningful impact**.  
11. Synthetic members safe? **Mostly**; bug risk in WC/scheduling create.  
12. Approval hierarchy used? **API only**; not product workflows.  
13. Realtime/config refresh? **Wired**; live **F**.  
14. Dead-code candidates? **`PermissionManagementRights`, `PermissionChange`** (strong). `Job` near-dead writes.  
15. Exact repairs justified? §22.

---

**End of Phase 3.** Non-authoritative. No production systems mutated. No secrets in report.
