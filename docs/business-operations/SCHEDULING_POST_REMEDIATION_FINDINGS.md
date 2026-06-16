# Scheduling Post-Remediation Findings

**Module:** Scheduling (`scheduling`)  
**Re-evaluation date:** 2026-06-14  
**Parent:** [SCHEDULING_CERTIFICATION_REEVALUATION.md](./SCHEDULING_CERTIFICATION_REEVALUATION.md)  
**Prior register:** [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md)

---

## Summary

| Severity | Count | Blocks certification? |
|----------|-------|----------------------|
| **Blocking** | **0** | **No** |
| **Major** | **4** | No — attached to WITH FINDINGS certification |
| **Advisory** | **5** | No |
| **Total open** | **9** | |

**Closed by remediation:** F-SCH-001, F-SCH-002, F-SCH-003

---

## Closed findings (remediation verified)

| ID | Finding | Closure evidence |
|----|---------|------------------|
| **F-SCH-001** | AdminTools controller Prisma mutations | Controller **0** `prisma.`; services own mutations |
| **F-SCH-002** | Manifest `realtime: true` without adapter | `realtime` removed from scheduling manifest |
| **F-SCH-003** | No domain event taxonomy | 20 `scheduling.*` types + `schedulingDomainEventService` + service wiring |

---

## Major findings (open — WITH FINDINGS attachment)

| ID | Finding | Evidence | Remediation | Deadline |
|----|---------|----------|-------------|----------|
| **F-SCH-004** | **AI context controller direct Prisma** — 16 read calls bypass canonical visibility layer | `server/src/controllers/scheduling/schedulingAiContextController.ts` | Extract to `schedulingAiContextService` or visibility service (Calendar pattern) | 90 days |
| **F-SCH-005** | **Partial Policy Engine on admin auxiliary routes** — job-locations CRUD, AI generate/suggest, recommendations, schedule-template delete lack `checkSchedulingPolicy` | `server/src/routes/scheduling.ts` L292, L345–358, L361, L367–377; stations now gated L322–339 | Add PE middleware or document approved legacy waiver with security review | 90 days |
| **F-SCH-006** | **No operation matrix** — Chat/Calendar/Todo ship `*_OPERATION_MATRIX.md` | `docs/architecture/audits/` — no scheduling matrix | Create `SCHEDULING_OPERATION_MATRIX.md` | 90 days |
| **F-SCH-007** | **Employee open-shift claim missing activity + domain events** — `claimOpenShiftForEmployee` updates assignment without `recordShiftMutationActivities` or domain event emission | `schedulingShiftService.ts` L558–673 — returns after calendar sync only | Wire activity + `recordSchedulingShiftMutationDomainEvents` on claim path | 90 days |

**Note on F-SCH-007:** Not in original register; identified during re-evaluation from repository inspection. Same severity class as incomplete lifecycle coverage on a write path.

---

## Advisory findings (open — track, do not block)

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| **F-SCH-008** | `schedulingDashboardController` — 3 Prisma reads | `schedulingDashboardController.ts` | Extract to dashboard query service |
| **F-SCH-009** | G18 analytics 501 trio | `schedulingAdminController` analytics stubs | Stage 4 Analytics — out of BO cert scope |
| **F-SCH-010** | Search not enabled | `supportsSearch: false` in manifest entities | Intentional deferral — document |
| **F-SCH-011** | No module audit trail | No scheduling audit service | P2 workforce compliance feature |
| **F-SCH-012** | CO-08 decision doc filename drift | `SHIFT_TEMPLATE_DOMAIN_DECISION.md` vs blueprint name | Rename or cross-link |

---

## Finding disposition matrix (post-remediation)

| ID | Blocks cert? | Status | Required for unconditional L3? |
|----|-------------|--------|-------------------------------|
| F-SCH-001 | — | **Closed** | — |
| F-SCH-002 | — | **Closed** | — |
| F-SCH-003 | — | **Closed** | — |
| F-SCH-004 | No | Open | Recommended |
| F-SCH-005 | No | Open (partially improved — stations now PE-gated) | Recommended |
| F-SCH-006 | No | Open | Recommended |
| F-SCH-007 | No | Open | Recommended |
| F-SCH-008 | No | Open | No |
| F-SCH-009 | No | Open | No |
| F-SCH-010 | No | Open | No |
| F-SCH-011 | No | Open | No |
| F-SCH-012 | No | Open | No |

---

## Promotion to unconditional Level 3

Scheduling may be re-evaluated for **unconditional PASS** when:

- [ ] F-SCH-004 closed (AI context service extraction)
- [ ] F-SCH-005 closed (PE route completion or approved waiver)
- [ ] F-SCH-006 closed (operation matrix published)
- [ ] F-SCH-007 closed (claim-shift lifecycle events)
- [ ] `pnpm type-check` pass
- [ ] Scheduling test suite pass (including tenant-scope integration)

---

## Related documents

- [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md) — pre-remediation register
- [SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md](./SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md)
