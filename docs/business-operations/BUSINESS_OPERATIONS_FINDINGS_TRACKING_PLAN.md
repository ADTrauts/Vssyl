# Business Operations Findings Tracking Plan

**Program:** Business Operations Architecture Council Ratification  
**Ratification date:** 2026-06-14  
**Tracking deadline:** **2026-09-12** (90 days)  
**Status:** **APPROVED** — council-mandated remediation tracking

**Council authorization:** [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](./BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md)

---

## 1. Purpose

Track open certification findings for ratified Business Operations modules without blocking certified status. Major findings require closure or documented waiver within 90 days. Advisory findings are tracked but do not block certification or reference candidacy.

---

## 2. Summary

| Module | Major (90-day) | Advisory (track) | Blocking |
|--------|----------------|------------------|----------|
| HR | 3 | 6 | 0 |
| Scheduling | 4 | 5 | 0 |
| Workforce Communications | 0 | 4 | 0 |
| **Total** | **7** | **15** | **0** |

---

## 3. HR — 90-day major findings

| ID | Finding | Owner | Target date | Success criteria |
|----|---------|-------|-------------|------------------|
| **F-HR-001** | Incomplete Policy Dual route coverage (~58% handlers) | HR module owner | 2026-09-12 | PE on read routes OR documented Chat-style post-query filter waiver approved by Architecture |
| **F-HR-002** | No `HR_OPERATION_MATRIX.md` | BO Program Steward + HR | 2026-09-12 | Matrix published under `docs/architecture/audits/` per Chat/Calendar template |
| **F-HR-003** | AI context controller direct Prisma (15 calls) | HR module owner | 2026-09-12 | Reads extracted to `hrAiContextService` or visibility service; controller Prisma **0** |

### HR — advisory (track, no 90-day gate)

| ID | Finding | Priority |
|----|---------|----------|
| F-HR-004 | No consolidated `web/src/api/hr.ts` | P2 |
| F-HR-005 | Main controller size (2,242 LOC) | P3 |
| F-HR-006 | `hrControllerUtils` unused | P3 |
| F-HR-007 | No `hr.*` domain event taxonomy | P2 |
| F-HR-008 | Partial audit trail scope | P3 |
| F-HR-009 | Settings framework stubs | P3 (await migration) |

**Register:** [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)  
**Closure plan:** [HR_FINDINGS_CLOSURE_PLAN.md](./HR_FINDINGS_CLOSURE_PLAN.md)

---

## 4. Scheduling — 90-day major findings

| ID | Finding | Owner | Target date | Success criteria |
|----|---------|-------|-------------|------------------|
| **F-SCH-004** | AI context controller direct Prisma (16 calls) | Scheduling owner | 2026-09-12 | Extract to `schedulingAiContextService`; controller Prisma **0** |
| **F-SCH-005** | Partial PE on auxiliary admin routes | Scheduling owner | 2026-09-12 | PE on job-locations, AI tools, template delete OR security-reviewed waiver |
| **F-SCH-006** | No `SCHEDULING_OPERATION_MATRIX.md` | BO Program Steward + Scheduling | 2026-09-12 | Matrix in `docs/architecture/audits/` |
| **F-SCH-007** | Open-shift claim missing activity + domain events | Scheduling owner | 2026-09-12 | `claimOpenShiftForEmployee` wires activity + domain events |

### Scheduling — advisory (track)

| ID | Finding | Priority |
|----|---------|----------|
| F-SCH-008 | Dashboard controller Prisma reads | P2 |
| F-SCH-009 | G18 analytics 501 stubs | Deferred (Analytics program) |
| F-SCH-010 | Search not enabled in manifest | P3 — document deferral |
| F-SCH-011 | No module audit trail | P2 |
| F-SCH-012 | CO-08 decision doc filename drift | P3 |

**Register:** [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md)

---

## 5. Workforce Communications — advisory tracking

No major findings. Advisory items tracked for hygiene; **do not block** L3 or Reference Candidate #7.

| ID | Finding | Owner | Target date | Success criteria |
|----|---------|-------|-------------|------------------|
| **F-WC-006** | Server `notificationGroupingService` lacks `workforce_*` mappings | Platform / WC | 2026-09-12 | Parity with client mappings |
| **F-WC-007** | `workforce_attachment_added` taxonomy not emitted | WC owner | 2026-09-12 | Emit on attach OR remove from taxonomy |
| **F-WC-008** | `workforce_ack_reminder` planned, no job | WC owner | **Deferred** | Keep `planned: true` until scheduler program |
| **F-WC-009** | Operation matrix not in `architecture/audits/` | BO Steward | 2026-09-12 | Mirror or relocate per ledger convention |

**Register:** [WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md](./WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md)

---

## 6. Tracking mechanics

| Mechanism | Requirement |
|-----------|-------------|
| **Issue tracker** | One ticket per major finding (7 tickets minimum) |
| **Monthly status** | BO Program Steward reports to Architecture Council |
| **Day 90 review** | 2026-09-12 — closure verification or waiver vote |
| **Regression** | Any closed finding reopening triggers certification review |
| **Ledger update** | On major closure batch, update CERTIFICATION_LEDGER Status column |

---

## 7. Waiver process

Major findings may receive **documented architecture waiver** instead of code fix if:

1. Security review confirms no tenant leak risk
2. Waiver doc linked in findings register
3. Council approves in minutes

Applicable primarily to F-HR-001 and F-SCH-005 (partial PE on read/auxiliary routes).

---

## 8. Promotion triggers (post-90-day)

| Module | When majors close | Eligible promotion |
|--------|-------------------|-------------------|
| HR | F-HR-001..003 | Unconditional L3 or Reference Module #1 |
| Scheduling | F-SCH-004..007 | Unconditional L3 or Reference Module #6 |
| WC | F-WC-006..007..009 (advisory) | Reference Module #7 vote (optional) |

---

## 9. Out of scope for this plan

| Item | Reason |
|------|--------|
| Analytics G18 stubs (F-SCH-009) | Analytics program not authorized |
| Emergency alerts / SMS for WC | Blueprint deferred |
| HR/Scheduling redesign | GD-BO-009 prohibited |
| New BO modules | Program closed |

---

## Related

- [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](./BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md)
- [BUSINESS_OPERATIONS_PROGRAM_CLOSEOUT.md](./BUSINESS_OPERATIONS_PROGRAM_CLOSEOUT.md)
