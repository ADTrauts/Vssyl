# Scheduling Findings Register

**Module:** Scheduling (`scheduling`)  
**Evaluation date:** 2026-06-16  
**Parent:** [SCHEDULING_CERTIFICATION_AUDIT.md](./SCHEDULING_CERTIFICATION_AUDIT.md)

---

## Summary

| Severity | Count | Blocks certification? |
|----------|-------|----------------------|
| **Blocking** | 3 | **Yes** |
| **Major** | 4 | Contributes to FAIL |
| **Advisory** | 5 | No — track post-certification or parallel remediation |
| **Total** | **12** | |

---

## Blocking findings (certification blockers)

| ID | Finding | Evidence | Gate | Remediation |
|----|---------|----------|------|-------------|
| **F-SCH-001** | **Direct Prisma mutations in `schedulingAdminToolsController`** — 32 calls including `scheduleShift.create`, station CRUD, job location CRUD | `server/src/controllers/scheduling/schedulingAdminToolsController.ts` | #2 Thin controllers | Extract to `schedulingStationService`, `schedulingLocationService`, bulk shift service; reduce controller to HTTP orchestration |
| **F-SCH-002** | **Manifest declares `realtime: true` without realtime adapter** — no `schedulingRealtimeService` or socket integration | `builtInModuleManifests.ts` L660; grep: no `schedulingRealtime` in `server/src` | #10, #12 | Set `realtime: false` until implemented OR ship `schedulingRealtimeService` per Chat pattern |
| **F-SCH-003** | **No domain event taxonomy** — no `scheduling.*` types in domain event registry; activity-only fan-out | `server/src/events/` — no scheduling namespace | #7 | Add `schedulingDomainEventService` + registry entries OR architecture-approved platform waiver ticket |

---

## Major findings (likely certification failure contributors)

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| **F-SCH-004** | **AI context controller uses direct Prisma** — 16 calls in `schedulingAiContextController` | `server/src/controllers/scheduling/schedulingAiContextController.ts` | Route reads through `schedulingVisibilityService` or dedicated context service (Calendar pattern) |
| **F-SCH-005** | **Incomplete Policy Dual on admin paths** — schedule-template delete, admin tools writes lack `checkSchedulingPolicy` | `scheduling.ts` L292, L335, L358; AdminTools routes | Add PE middleware or document explicit legacy waiver with security review |
| **F-SCH-006** | **No operation matrix** — Chat/Calendar/Todo ship `*_OPERATION_MATRIX.md` | `docs/architecture/audits/` — no scheduling matrix | Create `SCHEDULING_OPERATION_MATRIX.md` |
| **F-SCH-007** | **G09 tests at service layer only** — no HTTP controller integration tests | Missing `schedulingTeamController.g09.test.ts` | Add controller or route integration tests for publish/assign |

---

## Advisory findings (do not block re-evaluation after P0 fix)

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| **F-SCH-008** | `schedulingDashboardController` — 3 Prisma calls | Dashboard controller | Extract to service |
| **F-SCH-009** | G18 analytics 501 trio | `schedulingAdminController` L744–752 | Stage 4 Analytics — no action for BO cert |
| **F-SCH-010** | Search not enabled | `supportsSearch: false` | Intentional deferral — document in manifest |
| **F-SCH-011** | No module audit trail | No scheduling audit service | P2 — optional workforce compliance feature |
| **F-SCH-012** | CO-08 decision doc filename drift | `SHIFT_TEMPLATE_DOMAIN_DECISION.md` vs blueprint name | Rename or cross-link alias |

---

## Finding disposition matrix

| ID | Blocks cert? | Advisory only? | Required before L3? |
|----|-------------|----------------|-------------------|
| F-SCH-001 | **Yes** | No | **Yes** |
| F-SCH-002 | **Yes** | No | **Yes** |
| F-SCH-003 | **Yes** | No | **Yes** (or waiver) |
| F-SCH-004 | No | No | Recommended |
| F-SCH-005 | No | No | Recommended |
| F-SCH-006 | No | No | Recommended |
| F-SCH-007 | No | **Yes** | No |
| F-SCH-008 | No | **Yes** | No |
| F-SCH-009 | No | **Yes** | No |
| F-SCH-010 | No | **Yes** | No |
| F-SCH-011 | No | **Yes** | No |
| F-SCH-012 | No | **Yes** | No |

---

## Required remediation sequence

1. **F-SCH-001** — AdminTools service extraction (highest priority)
2. **F-SCH-002** — Manifest realtime correction
3. **F-SCH-003** — Domain events or waiver
4. **F-SCH-004** — AI context extraction
5. **F-SCH-005** — PE route completion
6. **F-SCH-006** — Operation matrix
7. Re-submit for certification evaluation

---

## Related documents

- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)
- [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md) — P1-002, P1-005, P1-006 overlap
