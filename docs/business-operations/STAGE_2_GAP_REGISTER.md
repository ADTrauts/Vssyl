# Stage 2 Gap Register

**Program:** Business Operations Stage 2 Closeout  
**Status:** Remaining debt — prioritized  
**Assessment date:** 2026-06-16  
**Source:** Repository verification against [STAGE_2_ENGINEERING_BLUEPRINT.md](./STAGE_2_ENGINEERING_BLUEPRINT.md) and [STAGE_2_FILE_TARGET_MATRIX.md](./STAGE_2_FILE_TARGET_MATRIX.md)

---

## Priority definitions

| Priority | Meaning |
|----------|---------|
| **P0** | Would block certification review from starting |
| **P1** | Would likely fail Level 3 certification if reviewed today |
| **P2** | Architectural debt — acceptable for conditional readiness |
| **P3** | Enhancements — post-certification or optional |

---

## P0 — Certification review blockers

**None.**

Both Scheduling and HR have demonstrable activity, notifications, trash, V-Link, service layers, and test evidence. No gap prevents initiating a formal certification evaluation program.

---

## P1 — Likely certification failures

| ID | Module | Gap | Evidence | Package |
|----|--------|-----|----------|---------|
| P1-001 | Both | No formal Level 3 operation matrix / audit document | Chat/Calendar/Todo have `*_OPERATION_MATRIX.md` and `*_LEVEL3_CERTIFICATION_REVIEW.md`; Scheduling/HR lack equivalents | Post-6C |
| P1-002 | Scheduling | Incomplete Policy Dual route coverage | Admin availability update, template list, swap list, some station routes without `checkSchedulingPolicy` | Cross-cutting |
| P1-003 | HR | Incomplete Policy Dual route coverage | ~58% of `hr.ts` handlers without `checkHRPolicy` | Cross-cutting |
| P1-004 | HR | 6B not executed — no `web/src/api/hr.ts` | 0 files; inline `fetch` in `employees/page.tsx`, `me/page.tsx`, `team/page.tsx` | 6B |
| P1-005 | Scheduling | G09 tests at service layer only | `schedulingManagerService.g09.test.ts` exists; `schedulingTeamController.g09.test.ts` missing per matrix | 5B |
| P1-006 | Scheduling | `schedulingAdminToolsController` — 32 Prisma calls | Not in blueprint deferral list | 5C tail |
| P1-007 | HR | `hrAIContextController` — 15 Prisma calls | AI routes not decomposed | 6A deferral |

---

## P2 — Architectural debt

| ID | Module | Gap | Evidence | Package |
|----|--------|-----|----------|---------|
| P2-001 | Both | Search not adopted | All BO entities `supportsSearch: false` | Deferred by blueprint |
| P2-002 | Scheduling | `schedulingAiContextController` — 16 Prisma | Blueprint-allowed AI deferral | 5C |
| P2-003 | Scheduling | `schedulingDashboardController` — 3 Prisma | Not extracted | 5C |
| P2-004 | HR | `hrController.ts` — 2,242 LOC | Prisma-free but orchestration-heavy | 6A |
| P2-005 | HR | `hrControllerUtils.ts` unused | Zero imports of `mapHrServiceError` | 6A |
| P2-006 | HR | Settings stubs | `hrSettingsService` framework placeholders | Pre-existing |
| P2-007 | Both | No module audit trail service | HR has `logEmployeeAudit` only; Scheduling has none | Out of Stage 2 scope |
| P2-008 | Scheduling | 5A filename drift | `SHIFT_TEMPLATE_DOMAIN_DECISION.md` vs blueprint `CO08_SHIFT_TEMPLATE_DECISION.md` | 5A |
| P2-009 | Scheduling | Prisma model CO-08 comments missing | Tier A file matrix item | 5A |
| P2-010 | HR | Global trash limited to `employee_profile` | By design per blueprint | Stage 1 |

---

## P3 — Enhancements

| ID | Module | Gap | Notes |
|----|--------|-----|-------|
| P3-001 | Scheduling | Schedule/shift template V-Link entities | Deferred per 5D blueprint |
| P3-002 | Scheduling | Extended manager tenant integration tests | Matrix item not extended |
| P3-003 | Scheduling | `useScheduling.ts` CO-08 terminology | Matrix MODIFY not applied |
| P3-004 | Scheduling | G18 analytics 501 trio | Stage 4 scope — `schedulingAdminController` |
| P3-005 | HR | `HRWorkspaceLanding` naming vs `HRLayout` | Functional hub exists |
| P3-006 | HR | Analytics controllers in main `hrController` | Could split in future hygiene |
| P3-007 | Both | Domain event bus adoption beyond activity | Platform-wide partial adoption |

---

## Unfinished packages

| Package | Status | Impact |
|---------|--------|--------|
| **6B** — G12 HR API consolidation | **NOT DONE** | P1-004; web client pattern |
| **5A** — CO-08 | **PARTIAL** | P2-008, P2-009 — doc hygiene only |
| **5C** — Scheduling extraction | **PARTIAL** | P1-006, P2-002, P2-003 — tail controllers |

---

## Gap summary by module

| Priority | Scheduling | HR | Both |
|----------|------------|-----|------|
| P0 | 0 | 0 | 0 |
| P1 | 3 | 3 | 1 |
| P2 | 4 | 4 | 2 |
| P3 | 4 | 2 | 1 |

---

## Recommended disposition before certification council

1. **Address P1-001** — Create operation matrices for Scheduling and HR (documentation only).
2. **Address P1-002 / P1-003** — Publish PE route coverage matrices; expand or document waivers.
3. **Decide P1-004** — Complete 6B or waive for certification with explicit finding.
4. **Decide P1-006** — Extract AdminTools or defer with architecture sign-off.
5. **Accept P2 search deferral** — Document as intentional non-capability in manifest.

---

## Related documents

- [STAGE_2_CLOSEOUT_REPORT.md](./STAGE_2_CLOSEOUT_REPORT.md)
- [SCHEDULING_CERTIFICATION_READINESS.md](./SCHEDULING_CERTIFICATION_READINESS.md)
- [HR_CERTIFICATION_READINESS.md](./HR_CERTIFICATION_READINESS.md)
