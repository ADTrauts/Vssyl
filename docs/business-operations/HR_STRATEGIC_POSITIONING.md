# HR Strategic Positioning

**Module id:** `hr`  
**Phase:** Business Operations Phase 0B — Discovery only  
**Last updated:** 2026-06-14  
**Related:** [HR_ORG_CHART_BOUNDARY_ANALYSIS.md](./HR_ORG_CHART_BOUNDARY_ANALYSIS.md), [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md), [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## What HR is today (confirmed facts)

| Question | Answer | Evidence |
|----------|--------|----------|
| Module type | Standalone built-in `hr` | `seedHRModule.ts`, `/api/hr` |
| Domain focus | Time/people **tracking** and employment lifecycle metadata | `prisma/modules/hr/README.md`; Phase 0A planning vs tracking split |
| Identity role | **Extends** org chart — does not own placement | `EmployeeHRProfile.employeePositionId` required FK |
| Tier model | Business Advanced (limited) + Enterprise (stubs) | `hrFeatureGating.ts` |
| Workspace | WS-L1 hub via `HRLayout` | `businessWorkspaceContracts.ts` |

**HR is not** an org-chart replacement, scheduling extension, or workforce communications module.

---

## What HR owns (validated against Phase 0A baseline)

| Domain | Ownership | Maturity |
|--------|-----------|----------|
| Employee HR profiles | HR-owned | MEDIUM |
| PTO requests/approvals | HR-owned | MEDIUM |
| Attendance policies/records/exceptions | HR-owned | MEDIUM |
| Onboarding journeys | HR-owned | MEDIUM |
| HR analytics | HR-owned | MEDIUM |
| Calendar bridge service | **Shared** | MEDIUM — `hrScheduleService` |
| Org structure / assignment | **Not HR** — org chart | MEDIUM |
| Shift planning | **Not HR** — scheduling (Phase 0A) | — |
| Workforce comms | **NOT PRESENT** | — |

Phase 0A boundary rows **validated** — no contradictions found in HR repository evidence.

---

## Identity question (summary — detail in identity architecture doc)

| Question | Answer |
|----------|--------|
| Does HR own workforce identity? | **No** |
| Does Org Chart own workforce identity? | **Yes** — `EmployeePosition` is the workforce identity anchor |
| Does HR extend Org Chart? | **Yes** — `EmployeeHRProfile` 1:1 extension |
| Does Org Chart extend HR? | **No** |

---

## What HR should become (discovery recommendation — not implementation)

HR should remain the **workforce time-and-people domain** within Business Operations:

### Should own

- Employment lifecycle metadata (hire, status, termination, types)
- PTO and leave workflows
- Attendance tracking and exceptions
- Onboarding and compliance-oriented employee workflows
- Workforce records layered on org-chart identity
- HR-scoped analytics and AI context for headcount/time-off

### Should not own

- Org structure CRUD (tiers, departments, positions, reporting lines)
- Primary employee-to-position assignment (org-chart path)
- Shift planning and availability (scheduling — Phase 0A)
- Calendar recurrence/reminder infrastructure (calendar)
- Operational workforce messaging (future Workforce Communications — Phase 0C)
- User accounts or business membership (platform/business modules)

### Shared contracts (preserve, document)

- `hrScheduleService` — calendar projection for PTO and published shifts
- PTO conflict reads by scheduling (Phase 0A)
- Attendance expectation stubs from scheduling publish (Phase 0A)

---

## Relationship maps

### Org chart

```
Org Chart (identity + structure)
    ↓ EmployeePosition required
HR (profile + time/people workflows)
```

### Scheduling (accepted from Phase 0A — not re-audited)

```
HR ← reads/writes integration ← Scheduling
  PTO data, attendance stubs, calendar sync trigger
```

### Workforce Operations (hybrid model C from Phase 0A)

HR is the **tracking/lifecycle** pillar alongside Scheduling **planning** and future **Communications**.

---

## Enterprise vision areas (current vs future)

| Area | Today | Evidence |
|------|-------|----------|
| Employee management | Implemented | Admin employees API |
| Workforce records | Partial | `EmployeeHRProfile` + audit logs |
| Compliance | Partial | Onboarding, attendance policies; no compliance analytics module |
| Attendance | Implemented | Punch, policies, exceptions |
| PTO | Implemented | Request/approve/calendar |
| Employment lifecycle | Partial | Create profile, terminate; import bypass |
| Payroll/recruitment/performance/benefits | NOT PRESENT | 200 JSON stubs |

---

## Modernization priorities (ordered — not waves)

1. Constitutional alignment — activity, notification manifest, Global Trash, Policy Engine
2. Controller decomposition — extract employee, time-off, attendance, onboarding services
3. Org-chart write-path consolidation — eliminate CSV import bypass drift
4. Complete settings and self-profile update stubs
5. Route attendance shift templates or document as out-of-scope
6. Resolve `ManagerApprovalHierarchy` vs `reportsToId` — deprecate or implement
7. Formalize `hrScheduleService` ownership in integration contract

---

## Open architectural questions

| # | Question |
|---|----------|
| 1 | Should `hrScheduleService` move to neutral workforce integration package? |
| 2 | Should HR CSV import be restricted to profile-only on existing `EmployeePosition` rows? |
| 3 | Should `AttendanceShiftTemplate` merge conceptually with Scheduling `ShiftTemplate`? |
| 4 | Where do certifications/skills live — HR profile JSON vs future module? |
| 5 | Should enterprise stubs remain in API surface or be feature-flagged off? |

---

## Confirmed facts vs recommendations

### Confirmed facts

- HR extends org chart per schema and README.
- Phase 0A ownership model holds for HR-owned capabilities.
- Enterprise features are framework placeholders.

### Recommendations (strategic only)

- Preserve standalone HR module; strengthen integration contracts rather than merging with org chart or scheduling.
- Use [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md) as identity authority for all future programs.
