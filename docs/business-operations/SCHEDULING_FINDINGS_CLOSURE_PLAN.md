# Scheduling Findings Closure Plan

**Module:** Scheduling (`scheduling`)  
**Program:** Business Operations Certification Finalization  
**Certification status (recommended):** LEVEL 3 CERTIFIED WITH FINDINGS (post-remediation)  
**Closure deadline:** 90 days from council ratification date  
**Last updated:** 2026-06-14

---

## 1. Purpose

Track closure of Scheduling findings after remediation of blockers F-SCH-001..003. Promote Scheduling from conditional Reference Candidate to **Reference Module #6 (Planning)** upon major findings closure.

---

## 2. Full findings table

| Finding | Severity | Status | Closure Path |
|---------|----------|--------|--------------|
| **F-SCH-001** | Blocking (was) | **Closed** | AdminTools extracted — `schedulingAdminToolsService`, `schedulingStationService`, `schedulingJobLocationService`; controller 0 Prisma |
| **F-SCH-002** | Blocking (was) | **Closed** | `realtime` removed from manifest; test asserts not declared |
| **F-SCH-003** | Blocking (was) | **Closed** | 20 `scheduling.*` domain events + `schedulingDomainEventService` wired |
| **F-SCH-004** | Major | **Open** | Extract `schedulingAiContextController` to `schedulingAiContextService`; 0 Prisma in controller |
| **F-SCH-005** | Major | **Open** | Add `checkSchedulingPolicy` to job-locations, AI tools, recommendations, schedule-template delete OR approved waiver |
| **F-SCH-006** | Major | **Open** | Publish `docs/architecture/audits/SCHEDULING_OPERATION_MATRIX.md` |
| **F-SCH-007** | Major | **Open** | Wire `recordShiftMutationActivities` + `recordSchedulingShiftMutationDomainEvents` in `claimOpenShiftForEmployee` |
| **F-SCH-008** | Advisory | **Open** | Extract `schedulingDashboardController` reads to `schedulingDashboardService` |
| **F-SCH-009** | Advisory | **Open** | No action — Stage 4 Analytics; document out of scope in operation matrix |
| **F-SCH-010** | Advisory | **Open** | Document intentional `supportsSearch: false` in manifest |
| **F-SCH-011** | Advisory | **Open** | P2 — scheduling audit service or document exception |
| **F-SCH-012** | Advisory | **Open** | Cross-link `SHIFT_TEMPLATE_DOMAIN_DECISION.md` in operation matrix |

---

## 3. Priority tiers

### Tier 1 — Required for Reference Module promotion (90 days)

| ID | Owner | Deliverable | Verification |
|----|-------|-------------|--------------|
| F-SCH-004 | Scheduling | `schedulingAiContextService.ts` | Controller 0 Prisma |
| F-SCH-005 | Scheduling / PE | PE on auxiliary routes or waiver | Route audit `scheduling.ts` |
| F-SCH-006 | Scheduling / Architecture | `SCHEDULING_OPERATION_MATRIX.md` | Doc review |
| F-SCH-007 | Scheduling | Claim-shift lifecycle events | Unit test on claim path |

### Tier 2 — Hygiene (120 days)

| ID | Deliverable |
|----|-------------|
| F-SCH-008 | Dashboard service extraction |
| F-SCH-012 | Doc cross-link |

### Tier 3 — Backlog / document only

| ID | Notes |
|----|-------|
| F-SCH-009 | Analytics 501 — documented deferral |
| F-SCH-010 | Search deferral — manifest accurate |
| F-SCH-011 | Module audit — P2 |

---

## 4. F-SCH-005 route checklist

Routes requiring PE (per re-evaluation):

| Route | Action to add |
|-------|---------------|
| `POST /admin/job-locations` | `SCHEDULING_STATION_WRITE` or new `WORKFORCE_LOCATION_WRITE` — use `SCHEDULING_STATION_WRITE` pattern / new action |
| `PUT/DELETE /admin/job-locations/:id` | Same |
| `GET /recommendations` | `SCHEDULING_SCHEDULE_READ` |
| `POST /ai/generate-schedule` | `SCHEDULING_SCHEDULE_WRITE` |
| `POST /ai/suggest-assignments` | `SCHEDULING_SHIFT_WRITE` |
| `DELETE /admin/schedule-templates/:id` | `SCHEDULING_TEMPLATE_WRITE` |

**Stations routes:** Already gated (remediation partial credit).

---

## 5. F-SCH-007 fix specification

In `schedulingShiftService.claimOpenShiftForEmployee`, after successful update:

1. `recordShiftMutationActivities({ previous: null, next: finalEmployeePositionId })`
2. `recordSchedulingShiftMutationDomainEvents(...)` 
3. Existing `notifyShiftAssigned` if applicable

Matches `assignShiftToEmployeeByManager` pattern.

---

## 6. Promotion criteria

| Milestone | Requirement |
|-----------|-------------|
| **L3 WITH FINDINGS ratified** | Council approval (blockers already closed) |
| **Unconditional L3** | F-SCH-004..007 closed |
| **Reference Candidate #6 confirmed** | Ratification + closure plan accepted |
| **Reference Module #6 (Planning)** | F-SCH-004..007 closed + operation matrix + council vote |

---

## 7. Re-evaluation trigger

Scheduling does **not** require full re-evaluation for findings closure. Quarterly governance review accepts evidence PRs.

Full re-evaluation only if:

- New blocking finding introduced
- Regression in primary controller Prisma count
- Manifest truthfulness violation

---

## Related

- [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md)
- [SCHEDULING_CERTIFICATION_REEVALUATION.md](./SCHEDULING_CERTIFICATION_REEVALUATION.md)
- [SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md](./SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md)
