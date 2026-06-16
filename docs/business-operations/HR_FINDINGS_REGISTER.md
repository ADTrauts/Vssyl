# HR Findings Register

**Module:** HR (`hr`)  
**Evaluation date:** 2026-06-16  
**Parent:** [HR_CERTIFICATION_AUDIT.md](./HR_CERTIFICATION_AUDIT.md)

---

## Summary

| Severity | Count | Blocks certification? |
|----------|-------|----------------------|
| **Blocking** | 0 | **No** |
| **Major** | 3 | Tracked under L3 WITH FINDINGS |
| **Advisory** | 6 | No |
| **Total** | **9** | |

---

## Blocking findings

**None.** All Level 3 gates pass or have acceptable partial status per Calendar certification precedent.

---

## Major findings (certified with findings — require remediation tracking)

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| **F-HR-001** | **Incomplete Policy Dual route coverage** — ~58% of `hr.ts` handlers lack `checkHRPolicy`; team/me reads and analytics routes use legacy middleware only | 25 `checkHRPolicy` vs ~59 handlers in `hr.ts` | Expand PE to read routes OR implement Chat-style post-query PE filter with documented waiver |
| **F-HR-002** | **No operation matrix** — no `HR_OPERATION_MATRIX.md` | `docs/architecture/audits/` | Create operation matrix per Chat/Calendar template |
| **F-HR-003** | **AI context controller direct Prisma** — 15 calls in `hrAIContextController` | `server/src/controllers/hrAIContextController.ts` | Extract to `hrVisibilityService` or context service (Calendar AI pattern) |

---

## Advisory findings

| ID | Finding | Evidence | Remediation |
|----|---------|----------|-------------|
| **F-HR-004** | **6B not executed** — no consolidated `web/src/api/hr.ts` | Inline `fetch` in HR pages | Complete 6B API consolidation (client hygiene) |
| **F-HR-005** | **Main controller size** — 2,242 LOC orchestration | `hrController.ts` | Optional split of analytics handlers |
| **F-HR-006** | **`hrControllerUtils` unused** | Zero imports of `mapHrServiceError` | Wire or delete |
| **F-HR-007** | **No `hr.*` domain event taxonomy** | Activity only | Add `hrDomainEventService` or platform waiver |
| **F-HR-008** | **Partial audit trail** — `logEmployeeAudit` for employee mutations only | `hrServiceShared.ts` | Extend or document scope limitation |
| **F-HR-009** | **Settings framework stubs** | `hrSettingsService` placeholders | Await `hRModuleSettings` migration |

---

## Finding disposition matrix

| ID | Blocks cert? | Advisory only? | Required for L3 WITH FINDINGS closure? |
|----|-------------|----------------|--------------------------------------|
| F-HR-001 | No | No | **Yes** — track to closure |
| F-HR-002 | No | No | **Yes** |
| F-HR-003 | No | No | **Yes** |
| F-HR-004 | No | **Yes** | No (6B hygiene) |
| F-HR-005 | No | **Yes** | No |
| F-HR-006 | No | **Yes** | No |
| F-HR-007 | No | **Yes** | No |
| F-HR-008 | No | **Yes** | No |
| F-HR-009 | No | **Yes** | No |

---

## Destructive mutation PE verification (not findings)

The following critical paths **are** Policy Dual gated — no finding raised:

| Route | PE action |
|-------|-----------|
| `DELETE /admin/employees/:id` | `HR_EMPLOYEE_DELETE` |
| `POST /admin/employees/:id/terminate` | `HR_EMPLOYEE_TERMINATE` |
| `POST /admin/employees` | `HR_EMPLOYEE_WRITE` |
| `POST /team/time-off/:id/approve` | `HR_TIME_OFF_APPROVE` |
| `POST /me/time-off/request` | `HR_TIME_OFF_REQUEST` |

---

## Required remediation (findings closure timeline)

| Priority | IDs | Target |
|----------|-----|--------|
| **90 days** | F-HR-001, F-HR-002, F-HR-003 | Promote to unconditional L3 or Reference Candidate |
| **Next hygiene sprint** | F-HR-004, F-HR-006 | 6B + utils cleanup |
| **Backlog** | F-HR-005, F-HR-007, F-HR-008, F-HR-009 | Enhancement / platform tickets |

---

## Related documents

- [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)
- [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md) — P1-003, P1-004, P1-007 overlap
