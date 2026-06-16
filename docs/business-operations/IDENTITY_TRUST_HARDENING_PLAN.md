# Identity Trust Hardening Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-05 — Workforce Identity Trust Hardening  
**Gap:** G02 (P0)  
**Last updated:** 2026-06-14  
**Identity authority:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)  
**Org boundary:** [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md)

---

## Purpose

Convert CO-05 into executable work establishing **trustworthy workforce identity** so all BO modules and future audience resolution consume a single, org-chart-authoritative `EmployeePosition` stack.

**Resolves:** G02 — Identity cleanup (CSV bypass, lifecycle asymmetry, legacy member fields).

**Invariant (unchanged):** Org Chart owns identity. HR extends — never owns placement.

---

## EmployeePosition authority model

```
User → BusinessMember → EmployeePosition (ORG CHART — authoritative)
                              ↓
                      EmployeeHRProfile (HR — extension only)
```

| Layer | Owner | Write authority |
|-------|-------|-----------------|
| `User` | Platform | Auth flows |
| `BusinessMember` | Business module | Invites, membership |
| `Department`, `Position` | Org chart | Org structure CRUD |
| **`EmployeePosition`** | **Org chart** | **`employeeManagementService` — sole placement writer** |
| `EmployeeHRProfile` | HR | HR metadata on existing EP |

**Rule:** All BO modules **read** EP + Department. Only org chart (and delegated org-chart APIs) **write** placement.

---

## Issues addressed (Phase 0B findings)

| Issue | Severity | Work package |
|-------|----------|--------------|
| HR CSV import bypasses org-chart API | **High** | WP-05.1 |
| Terminate vs org remove asymmetry | **Medium** | WP-05.2 |
| Legacy `BusinessMember.department`/`title` | **Medium** | WP-05.3 |
| Hire date vs assignment date drift | **Medium** | WP-05.4 |
| Org list vs HR directory semantics | **Medium** | WP-05.5 (documentation) |

---

## Work packages

| ID | Work package | Scope | Deliverable |
|----|--------------|-------|-------------|
| **WP-05.1** | CSV import remediation | Route `importEmployeesCSV` through org-chart write path (`employeeManagementService` / org-chart API) — no direct Prisma placement writes | Implementation spec: import flow diagram + API contract |
| **WP-05.2** | Lifecycle symmetry | Align `terminateEmployee` (HR) and `removeEmployeeFromPosition` (org chart) — unified contract for EP deactivation + HR status | Lifecycle decision record + state transition matrix |
| **WP-05.3** | Legacy field deprecation | Deprecate `BusinessMember.department`/`title` for audience and workforce purposes; document org chart as authoritative | Deprecation notice + consumer audit |
| **WP-05.4** | Date field alignment | Align `EmployeeHRProfile.hireDate` and `EmployeePosition.startDate` on all write paths | Field sync rules document |
| **WP-05.5** | Consumer documentation | Document identity read paths for Scheduling, HR, Analytics, future WC audience resolver | Identity consumer matrix (extends identity architecture) |
| **WP-05.6** | Verification harness | Define test scenarios: import → EP → HR profile → Scheduling assign → audience resolve | Verification scenario list |

---

## Affected domains

| Domain | Role in CO-05 |
|--------|---------------|
| **HR** | Primary — CSV bypass, terminate, profile creation |
| **Org chart** | Authority — EP write path |
| **Scheduling** | Consumer — `employeePositionId` on shifts |
| **Workforce Communications** | Future consumer — audience resolver depends on G02 |
| **Analytics** | Consumer — `employeePositionId` aggregations |
| **Calendar** | Consumer — via `hrScheduleService` |

---

## Entry criteria

| Criterion | Status |
|-----------|--------|
| `WORKFORCE_IDENTITY_ARCHITECTURE.md` final | ✅ |
| Ownership decisions final | ✅ |
| CO-06 governance in progress or complete | Recommended parallel with CO-06 |
| Stage 1 program authorized | ✅ |

---

## Exit criteria (G02)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Single EP write path documented and enforced in implementation spec | WP-05.1 + WP-05.5 |
| 2 | CSV import bypass eliminated in implementation plan | WP-05.1 spec shows org-chart route only |
| 3 | Terminate/remove lifecycle symmetry contract published | WP-05.2 decision record |
| 4 | Legacy `BusinessMember.department`/`title` deprecated for audience | WP-05.3 deprecation notice |
| 5 | All BO identity consumers documented | WP-05.5 matrix |
| 6 | Verification scenarios defined | WP-05.6 pass |

---

# Assumptions

- Org chart retains identity ownership — not transferred to HR
- No parallel `WorkforceEmployee` or duplicate department tables created
- Existing `EmployeePosition` records remain valid — migration is behavioral not greenfield
- HR `createEmployee` continues to require existing `employeePositionId`
- CO-05 can run parallel with CO-06

---

# Risks

| Risk | Mitigation |
|------|------------|
| CSV import migration breaks existing tenant data | WP-05.6 verification scenarios; staged rollout plan in implementation program |
| Lifecycle symmetry change affects in-flight employees | State transition matrix (WP-05.2); backward-compatible defaults |
| Consumers still read legacy member fields | WP-05.3 consumer audit + lint/review gate |
| Scheduling assign uses stale EP after import fix | WP-05.6 cross-module scenario |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-01.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| None (P0 entry) | CO-05 may start immediately |
| CO-01 | Activity events reference EP subjects — best after identity stable |
| CO-03 | PE authZ subjects use EP — best after CO-05 |
| CO-07 | Bridge contract assumes identity stack stable |
| CO-11 (Stage 3) | Audience resolver blocked without G02 |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Write path audit | Only org-chart APIs create/modify EP placement |
| Import flow review | WP-05.1 spec — no direct Prisma EP creation in HR import |
| Lifecycle matrix review | WP-05.2 — all terminate/remove paths mapped |
| Consumer audit | WP-05.3 — no audience logic uses legacy member fields |
| Cross-module scenario | WP-05.6 — import → assign → read succeeds in test plan |
| Stage 1 exit gate | G02 row satisfied |

---

## Certification statement

**No certification awarded.** Identity trust plan only.
