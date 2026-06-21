# BO-1A Policy Engine Coverage Report

**Program:** Business Operations BO-1A  
**Date:** 2026-06-19

---

## Scheduling (F-SCH-005)

### Target routes (finding scope)

| Route group | Before | After |
|-------------|--------|-------|
| Job locations CRUD | No PE | `SCHEDULING_STATION_WRITE` |
| AI generate/suggest | No PE | `SCHEDULING_SCHEDULE_WRITE` |
| Recommendations GET | No PE | `SCHEDULING_SCHEDULE_READ` |
| Schedule-template DELETE | Partial | `SCHEDULING_TEMPLATE_WRITE` |
| Open shift claim | No PE | **`SCHEDULING_SHIFT_CLAIM`** (new action) |

### Coverage summary

| Metric | Before BO-1A | After BO-1A |
|--------|--------------|-------------|
| Routes with `checkSchedulingPolicy` | ~32 / ~60 (~53%) | **36 / ~60 (~60%)** |
| Finding-scoped auxiliary routes | 0 / 5 compliant | **5 / 5 compliant** |
| New policy action | — | `scheduling:shift.claim` |

**F-SCH-005:** Closed for finding scope (auxiliary routes + claim). Remaining team/employee read routes rely on legacy scheduling middleware with dual-enforcement soft-fail pattern — tracked as advisory for BO-1B+.

---

## HR (F-HR-001)

### Routes expanded in BO-1A

- Onboarding admin reads (templates, library, journeys)
- Attendance admin reads + team/manager reads
- Enterprise stub dashboards (payroll, recruitment, performance, benefits)
- Team onboarding/attendance/time-off calendar
- Employee self-service: attendance, time-off balance/requests/cancel, onboarding journeys, pay-stubs stub
- AI context trio
- Workforce bridge (2 routes)

### Coverage summary

| Metric | Before BO-1A | After BO-1A |
|--------|--------------|-------------|
| HR routes with `checkHRPolicy` | ~26 / ~61 (~42%) | **60 / 61 (~98%)** |
| Exempt | — | `/health` only |

**F-HR-001:** Closed — all operational HR routes now carry PE; health check intentionally exempt.

---

## Policy engine registration

| Action | Set | Tier |
|--------|-----|------|
| `scheduling:shift.claim` | `SCHEDULING_MEMBER_ACTIONS` | Active business member |
| Type union | `SchedulingPolicyAction` in `schedulingPolicyDual.ts` | — |

---

## Disposition

| Finding | Status |
|---------|--------|
| F-SCH-005 | **Closed** (scoped auxiliary + claim) |
| F-HR-001 | **Closed** |
