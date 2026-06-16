# HR Alignment Requirements

**Program:** Business Operations Constitutional Alignment Program  
**Source:** Phase 0B discovery only — no repository re-audit  
**Last updated:** 2026-06-14  
**Evidence:** [HR_ARCHITECTURE_AUDIT.md](./HR_ARCHITECTURE_AUDIT.md), [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md), [BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md)  
**Identity authority:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)  
**Org boundary:** [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md)  
**Master matrix:** [BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md](./BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md)

---

## Purpose

Identify platform gaps, architectural debt, and constitutional requirements for HR to become a **first-class platform domain**. Synthesizes Phase 0B findings only.

**Current posture:** Partially implemented standalone module with **constitutional debt** and **monolithic controller** risk. HR extends org-chart `EmployeePosition`; it does **not** own workforce identity.

---

## Constitutional requirements

| Requirement | Platform standard reference | HR current | Required |
|-------------|----------------------------|------------|----------|
| Tenant scoping | `api-and-auth.mdc`, `moduleSpecs.md` | PASS WITH FINDINGS — `businessId` on models | Maintain |
| `authorize → execute → emit` | `module-interoperability.mdc` | FAIL — no module activity | AuthZ → mutation → `emitModuleActivityEvent` on success |
| Normalized activity | Platform standards §19 `globalActivity` | NOT PRESENT — `auditLog` only for employee CRUD | PTO, attendance, onboarding, profile mutations emit |
| Notifications | Manifest + `[hr]_[event]` | PARTIAL — 8 types sent; manifest gap; 3 attendance types not emitted | Complete manifest + all documented emitters |
| Policy Engine | `policy-engine.mdc` | NOT PRESENT — `hrPermissions.ts` only | PE for admin/manager writes |
| Global Trash | `trashedAt` + trash controller | FAIL — `deletedAt` soft delete; not in trash controller | Global Trash contract |
| V-Link | `V_LINK.md` | NOT PRESENT | Profile, PTO, attendance entities linkable |
| Realtime | Scoped broadcasts | NOT PRESENT | Optional for HR — notifications primary |
| AI context | `module-development.mdc` | PASS WITH FINDINGS — 3 providers, 4 actions | Maintain |
| Workspace hub | WS-L1 switch | PASS — `HRLayout` | Functional; naming convention optional |
| Service boundaries | Thin controllers | FAIL — monolithic `hrController.ts` (~50 handlers, ~77 Prisma calls) | Decompose into domain services |
| Tests | Tenant + critical paths | FAIL — no dedicated HR route/controller tests | PTO, attendance, onboarding, tenant isolation |
| Identity consumption | `WORKFORCE_IDENTITY_ARCHITECTURE.md` | PARTIAL — CSV import bypasses org-chart API | Single EP write path |

---

## Platform gaps

Per [HR_ARCHITECTURE_AUDIT.md](./HR_ARCHITECTURE_AUDIT.md) platform capability matrix:

| Platform service | Status | Gap detail |
|------------------|--------|------------|
| **Activity** | NOT PRESENT | `auditLog` is not `emitModuleActivityEvent`; activity vs analytics separated in analytics only |
| **Notifications** | PASS WITH FINDINGS | 8 types via `NotificationService`; seed manifest lacks `notifications` block; grouping map incomplete; 3 attendance types documented not sent |
| **Policy Engine** | NOT PRESENT | Custom middleware + tier gating only |
| **Realtime** | NOT PRESENT | No HR-specific socket layer |
| **V-Link** | NOT PRESENT | `V_LINK.md` — hr not integrated |
| **Global Trash** | FAIL | `EmployeeHRProfile.deletedAt`; onboarding `archivedAt`; not Global Trash API |
| **Audit** | PARTIAL | Local `auditLog` — supplementary, not normalized activity |
| **Search** | NOT EVALUATED | No Phase 0B assessment — defer to P3 |
| **AI Integration** | PASS WITH FINDINGS | 3 providers; 4 actions in `ActionExecutor` |

### Module interoperability checklist (HR)

| Item | Status |
|------|--------|
| Permission blocks in manifest | PASS WITH FINDINGS |
| Tenant scoping | PASS WITH FINDINGS |
| Activity events | **FAIL** |
| Realtime scope | NOT PRESENT |
| Notification metadata | **FAIL** — seed gap |
| AI context providers | PASS |
| Activity vs analytics separation | **FAIL** |

### Notification types (partial implementation detail)

| Category | Status |
|----------|--------|
| Emitted (8 types) | PTO, onboarding, and workflow notifications per Phase 0B operation matrix |
| Manifest gap | Seed `builtInModuleManifests.ts` hr case lacks `notifications` block |
| Not emitted (3 attendance types) | Documented in product context; not sent via `NotificationService` |
| `workforce_*` / comms types | NOT PRESENT — HR workflow notifs ≠ WC |

**Constitutional rule:** HR notifications are **workflow alerts**, not Workforce Communications. See [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md).

---

## Architectural debt

### Monolithic controller

| Issue | Evidence | Impact |
|-------|----------|--------|
| `hrController.ts` concentration | ~50 handlers, ~77 `prisma.` calls | Blocks Drive L4 service boundary pattern |
| Mixed service usage | Some paths use `hrAttendanceService`, `hrOnboardingService`; many inline Prisma | Inconsistent extraction |
| Enterprise stubs | 200 JSON responses — misleading API maturity | UX and integration risk |

### Identity and org-chart risks (P0)

Per [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) and Phase 0B closeout — **highest structural risks:**

| Issue | Impact |
|-------|--------|
| **HR CSV import bypasses org-chart API** | Corrupts audience resolution and org trust — blocks WC audience resolver |
| **Terminate vs org remove asymmetry** | Lifecycle drift across modules |
| **Legacy `BusinessMember.department`/`title`** | Parallel to org chart — audience confusion |
| **`ManagerApprovalHierarchy` dead schema** | Approval routing uses org chart directly — schema drift |

### API client gap

| Issue | Evidence |
|-------|----------|
| No general `web/src/api/hr.ts` | Inline `fetch` in pages; only `hrOnboarding.ts`, `hrAnalytics.ts` |

### Stub surfaces

| Surface | Pattern | Impact |
|---------|---------|--------|
| Enterprise dashboards | 200 JSON | Misleading maturity |
| `PUT /admin/settings` | Stub | Settings not persisted |
| `PUT /me` | Stub | Self-service profile update blocked |
| `GET /me/pay-stubs` | 200 JSON stub | — |
| Attendance shift templates | Service only, no REST | Cross-module confusion with Scheduling `ShiftTemplate` |

### Documentation drift

| Issue | Evidence |
|-------|----------|
| `hrProductContext.md` overstatement | vs code reality per Phase 0B closeout |
| `prisma/modules/hr/README.md` partially stale | — |

---

## Shared integration debt (HR + Scheduling)

| Issue | Owner | Alignment requirement |
|-------|-------|---------------------|
| `hrScheduleService` | HR-named; Scheduling + Calendar consumers | Contract formalization — G07 (P1) |
| `AttendanceShiftTemplate` vs `ShiftTemplate` | HR + Scheduling | Naming collision — G08 (P2) |
| PTO data vs scheduling enforce | HR owns; Scheduling consumes | Documented — Phase 0A validated |
| HR workflow notifications vs WC | HR emits workflow; WC authors broadcast | FALSE POSITIVE governance — G01 |

---

## Constitutional requirements mapped to platform standards

| HR requirement | Standard | Gap ID |
|----------------|----------|--------|
| Single EP write path (no CSV bypass) | `WORKFORCE_IDENTITY_ARCHITECTURE.md` | G02 |
| Emit activity on PTO, attendance, onboarding | `module-interoperability.mdc`, `moduleSpecs.md` | G03 |
| Complete `hr_*` manifest + emitters | `NOTIFICATION_METADATA_GUIDE.md` | G04, G12 |
| PE for admin/manager writes | `policy-engine.mdc` | G05 |
| `trashedAt` + Global Trash handler | `module-development.mdc` | G06 |
| V-Link for profiles, PTO, attendance | `V_LINK.md` | G13 |
| Controller decomposition | Drive L4 pattern | G11 |
| FALSE POSITIVE: HR notifs ≠ WC | `CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md` | G01 |
| `hrScheduleService` contract | `HR_SCHEDULING_BOUNDARY_REVIEW.md` | G07 |
| Lifecycle symmetry with org chart | `HR_ORG_CHART_BOUNDARY_ANALYSIS.md` | G02 |

---

## What HR alignment does not require (Phase 0B scope)

| Item | Rationale |
|------|-----------|
| Org chart ownership transfer | Org chart owns identity — unchanged |
| Workforce Communications module | Separate domain — HR may emit workflow events WC consumes |
| Realtime layer | Optional — notifications sufficient for most HR workflows |
| Enterprise feature completion | Stubs are product debt — not constitutional P0–P1 |
| Certification award | Alignment program does not certify |

---

## HR-specific vs shared alignment sequencing

| Tier | HR-specific | Shared (consume once) |
|------|-------------|----------------------|
| P0 | Identity cleanup (CSV, lifecycle) | FALSE POSITIVE governance |
| P1 | — | Activity, Notifications pattern, PE, Global Trash |
| P2 | Controller decomposition; 3 notification types; API client | V-Link; shift-template collision |
| P3 | Dedicated tests | Analytics ownership clarity |

HR should **not** independently implement Activity, PE, or Global Trash patterns — join shared BO platform constitutional alignment per [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md).

---

## Readiness assessment

| Question | Verdict |
|----------|---------|
| HR reality understood? | **Yes** — Phase 0B complete |
| Identity architecture documented? | **Yes** — `WORKFORCE_IDENTITY_ARCHITECTURE.md` |
| Platform gaps documented? | **Yes** — this document |
| Ready for first-class domain status? | **No** — P0–P2 gaps |
| Ready for shared platform alignment? | **Yes** — after P0 identity gates |
| Ready for modernization implementation? | **No** — alignment planning only |

---

## Implications for Workforce Communications

Per Phase 0B closeout implications for 0C (validated by constitutional clarification):

1. WC must consume `EmployeePosition` + `Department` — HR must not create parallel identity
2. HR workflow notifications are not WC — governance required
3. Identity cleanup (G02) is **blocking** for WC audience resolver (G14)
4. HR attendance/PTO events may become WC integration hooks after notification standardization (G04)

---

## Certification statement

**No certification awarded.** Phase 0B evidence only. No implementation plan defined.
