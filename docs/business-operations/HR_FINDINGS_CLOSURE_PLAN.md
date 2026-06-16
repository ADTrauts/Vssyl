# HR Findings Closure Plan

**Module:** HR (`hr`)  
**Program:** Business Operations Certification Finalization  
**Certification status (recommended):** LEVEL 3 CERTIFIED WITH FINDINGS  
**Closure deadline:** 90 days from council ratification date  
**Last updated:** 2026-06-14

---

## 1. Purpose

Track closure of all HR certification findings attached to LEVEL 3 WITH FINDINGS status. Promote HR from conditional Reference Candidate to **Reference Module** eligibility upon major findings closure.

---

## 2. Full findings table

| Finding | Severity | Status | Closure Path |
|---------|----------|--------|--------------|
| **F-HR-001** | Major | **Open** | Expand `checkHRPolicy` to all `hr.ts` handlers OR document Chat-style post-query PE filter with architecture waiver; publish PE coverage matrix |
| **F-HR-002** | Major | **Open** | Create `docs/architecture/audits/HR_OPERATION_MATRIX.md` per Chat/Calendar template |
| **F-HR-003** | Major | **Open** | Extract `hrAIContextController` reads to `hrAiContextService` or `hrVisibilityService` (Calendar pattern); controller zero Prisma |
| **F-HR-004** | Advisory | **Open** | Execute Package 6B: `web/src/api/hr.ts`; migrate inline fetch from HR pages |
| **F-HR-005** | Advisory | **Open** | Optional: split analytics handlers from `hrController.ts` to dedicated controller |
| **F-HR-006** | Advisory | **Open** | Wire `mapHrServiceError` in controllers OR delete `hrControllerUtils.ts` dead code |
| **F-HR-007** | Advisory | **Open** | Add `hrDomainEventService` + registry types OR obtain platform architecture waiver ticket |
| **F-HR-008** | Advisory | **Open** | Extend `logEmployeeAudit` scope OR document limitation in operation matrix |
| **F-HR-009** | Advisory | **Open** | Complete when `hRModuleSettings` migration ships; until then document stub status |

---

## 3. Priority tiers

### Tier 1 — Required for Reference Module promotion (90 days)

| ID | Owner | Deliverable | Verification |
|----|-------|-------------|--------------|
| F-HR-001 | HR module / Platform PE | PE on all routes or approved waiver doc | `hr.ts` route audit; `hrPolicyDual.test.ts` extended |
| F-HR-002 | HR module / Architecture | `HR_OPERATION_MATRIX.md` | Doc review against Chat matrix |
| F-HR-003 | HR module | `hrAiContextService.ts` + thin controller | `grep prisma hrAIContextController` → 0 |

### Tier 2 — Hygiene sprint (next 90–120 days)

| ID | Deliverable |
|----|-------------|
| F-HR-004 | `web/src/api/hr.ts` |
| F-HR-006 | Utils wired or removed |

### Tier 3 — Backlog

| ID | Notes |
|----|-------|
| F-HR-005 | Controller split — optional |
| F-HR-007 | Domain events — platform parity enhancement |
| F-HR-008 | Audit trail extension |
| F-HR-009 | Settings framework — blocked on schema |

---

## 4. Closure evidence requirements

Each major finding closes with:

1. PR merged with tests
2. Entry in findings register updated to **Closed**
3. Evidence line in quarterly BO governance review
4. No regression on existing ~80 HR test cases

---

## 5. F-HR-001 closure options (pick one)

| Option | Work | Council approval |
|--------|------|------------------|
| **A — Full PE expansion** | Add `checkHRPolicy` to remaining ~34 handlers | Not required |
| **B — Post-query filter** | Chat-style PE on list results | Documented pattern |
| **C — Waiver** | Security review + explicit legacy route list | **Required** |

**Recommendation:** Option A for destructive + read-sensitive routes; Option B acceptable for team/me list endpoints with documented matrix.

---

## 6. F-HR-003 closure template

Follow Calendar `calendarAiContextService` / Scheduling remediation pattern:

```
hrAIContextController.ts  →  validation + auth + delegation only
hrAiContextService.ts     →  all Prisma reads, bounded result sets
```

---

## 7. Promotion criteria

| Milestone | Requirement |
|-----------|-------------|
| **Maintain L3 WITH FINDINGS** | Ratification only — no action |
| **Promote to unconditional L3** | F-HR-001..003 closed |
| **Promote Reference Candidate → Reference Module #1** | F-HR-001..003 closed + operation matrix + council vote |
| **Level 4 Reference Implementation** | Not in scope |

---

## 8. Dependencies

| Dependency | Impact |
|------------|--------|
| WC implementation | **No blocker** — HR findings independent of WC Phase A |
| Scheduling findings | Independent parallel track |
| Certification ledger | Ratification precedes formal tracking |

---

## Related

- [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)
- [HR_CERTIFICATION_AUDIT.md](./HR_CERTIFICATION_AUDIT.md)
- [BUSINESS_OPERATIONS_REFERENCE_READINESS.md](./BUSINESS_OPERATIONS_REFERENCE_READINESS.md)
