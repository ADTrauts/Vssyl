# Business Operations Phase 0B Closeout

**Phase:** Business Operations Phase 0B — HR Module Reality Assessment  
**Status:** Complete (discovery only)  
**Last updated:** 2026-06-14  
**Prior phase:** [BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md)  
**Next phase:** Phase 0C — Workforce Communications Reality Assessment

---

## What was inspected

### HR module (primary)

- Prisma models (`core`, `attendance`, `onboarding`)
- Express routes, monolithic controller, 5 services, middleware
- Frontend: 25 components, 9 app routes, 2 API clients
- Module registration, AI context/actions, notifications
- Analytics dashboards and services
- Enterprise stub surfaces

### Org chart boundary (critical)

- `org-chart.prisma`, `org-chart.ts`, `orgChartService`, `employeeManagementService`
- Org chart UI (`EmployeeManager`, builder, visual view)
- HR vs org-chart lifecycle asymmetries
- CSV import parallel write path

### Cross-module (integration only)

- `hrScheduleService` — validated as shared bridge (Scheduling not re-audited)
- Phase 0A boundary rows for HR — **validated, not contradicted**

### Not inspected (out of scope)

- Scheduling module interior (Phase 0A complete)
- Workforce Communications implementation (Phase 0C)
- Reference program re-certification

---

## Files created

| # | File | Role |
|---|------|------|
| 1 | [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md) | Operational reality |
| 2 | [HR_ARCHITECTURE_AUDIT.md](./HR_ARCHITECTURE_AUDIT.md) | Architectural gates |
| 3 | [HR_UX_AUDIT.md](./HR_UX_AUDIT.md) | UX assessment |
| 4 | [HR_STRATEGIC_POSITIONING.md](./HR_STRATEGIC_POSITIONING.md) | Strategic positioning |
| 5 | [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md) | **Ownership** — HR ↔ Org Chart |
| 6 | [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) | **Structure** — identity stack |
| 7 | [BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md) | This document |
| 8 | [HR_CAPABILITY_MAP.md](./HR_CAPABILITY_MAP.md) | Executive entry point |

**Stakeholder entry:** [HR_CAPABILITY_MAP.md](./HR_CAPABILITY_MAP.md)  
**Identity authority:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)  
**Ownership authority (HR↔Org):** [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md)

---

## Key findings

### What HR is

A **standalone built-in module** (`hr`) providing workforce **time-and-people tracking** and employment lifecycle metadata — **extending** org-chart `EmployeePosition`, not replacing org structure.

### What HR owns

- `EmployeeHRProfile`, PTO, attendance, onboarding, HR analytics, HR notifications (partial), HR AI context
- **Does not own:** org structure, primary employee assignment, shift planning, calendar recurrence, workforce comms

### Identity conclusions

| Question | Answer |
|----------|--------|
| Does HR own identity? | **No** |
| Does Org Chart own identity? | **Yes** — `EmployeePosition` is workforce identity anchor |
| Does HR extend Org Chart? | **Yes** |
| Does Org Chart extend HR? | **No** |
| Duplication? | **Yes, partial** |

### Phase 0A baseline

[WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) HR-owned and Shared rows **validated** — no amendments required.

---

## Ownership decisions (canonical)

| Domain | Owner |
|--------|-------|
| User account | Platform |
| Business membership | Business module |
| Org structure (tier, dept, position, reporting) | Org chart |
| Workforce placement / identity | Org chart — `EmployeePosition` |
| HR profile & employment metadata | HR — `EmployeeHRProfile` |
| PTO & attendance records | HR |
| Calendar event projection | Calendar (via `hrScheduleService` shared bridge) |
| Shift planning | Scheduling (Phase 0A) |
| Workforce communications | NOT PRESENT |

---

## Architectural risks

1. **HR CSV import bypasses org-chart API** — highest structural risk  
2. **`hrScheduleService` ownership ambiguity** — HR-named, multi-consumer  
3. **Monolithic `hrController.ts`** — ~77 Prisma calls, ~50 handlers  
4. **Enterprise stubs return 200 JSON** — misleading maturity  
5. **Asymmetric terminate vs org remove** — lifecycle drift  
6. **Legacy `BusinessMember.department`/`title`** — parallel to org chart  
7. **`ManagerApprovalHierarchy` dead schema**  
8. **`AttendanceShiftTemplate` vs Scheduling `ShiftTemplate`** — cross-module naming (0A)  
9. **`hrProductContext.md` overstatement** vs code reality  

---

## Constitutional gaps

| Gap | Status |
|-----|--------|
| Normalized module activity | NOT PRESENT |
| Policy Engine | NOT PRESENT |
| V_Link | NOT PRESENT |
| Global Trash | FAIL — `deletedAt` only |
| Notification manifest (seed) | FAIL — types sent but manifest incomplete |
| Realtime | NOT PRESENT |
| Dedicated tests | FAIL |

Platform matrix row (hr): ai ✅, vlink ❌, trash ❌, realtime partial, notifications ⚠️, businessWorkspace ✅, globalActivity ❌

---

## Readiness assessment

| Question | Verdict |
|----------|---------|
| HR reality understood? | **Yes** |
| Identity architecture documented? | **Yes** |
| Org-chart boundary clear? | **Yes** |
| Ready for certification? | **No** |
| Ready for modernization planning? | **Yes** — with import bypass and constitutional debt in scope |
| Ready for implementation? | **No** — discovery only |
| Phase 0C scoped? | **Yes** — comms should consume EP + Department per identity doc |

---

## Implications for Phase 0C — Workforce Communications

1. **Do not create parallel employee identity** — consume `EmployeePosition` + `Department` per [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)
2. **Distinguish** Chat DMs, front-page announcements, and operational workforce messaging
3. **Integrate** with notifications platform; define `workforce_*` or `comms_*` types in Phase 0C assessment
4. **Target** department-scoped audiences via org-chart `Department`
5. **Hook** scheduling publish and coverage events as integration points — not identity sources
6. **Accept** Phase 0A/0B ownership docs as baseline — do not re-litigate HR or scheduling interiors

---

## Recommended sequencing

| Step | Action |
|------|--------|
| 1 | Publish 8 Phase 0B artifacts |
| 2 | **Phase 0C — Workforce Communications Reality Assessment** |
| 3 | Business Operations Strategic Architecture Program — synthesize 0A + 0B + 0C using identity + boundary docs |

---

## Certification statement

**No certification awarded.** Phase 0B is discovery and documentation only. No modernization waves defined.

---

## Amendment to Phase 0A

**None required.** Phase 0B repository evidence **confirms** Phase 0A HR-owned and Shared rows in [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md).
