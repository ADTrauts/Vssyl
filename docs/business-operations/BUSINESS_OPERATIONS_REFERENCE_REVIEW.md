# Business Operations Reference Review (BO-2)

**Program:** Business Operations BO-2 — Certification Evaluation  
**Date:** 2026-06-19  
**Authority:** [BUSINESS_OPERATIONS_REFERENCE_READINESS.md](./BUSINESS_OPERATIONS_REFERENCE_READINESS.md), [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

---

## Reference hierarchy context

| Level | Name | BO modules (post BO-2) |
|-------|------|------------------------|
| **4** | Reference Implementation | Not eligible (File Hub only) |
| **3** | Certified Reference Module | **Candidate** — pending council vote post L3 WITH FINDINGS |
| **—** | Reference Capability | Multiple patterns copy-worthy today |

---

## Module reference assessments

### Scheduling — Reference Module Candidate #6 (Planning)

| Criterion | Pre BO-1A | Post BO-2 |
|-----------|-----------|-----------|
| L3 majors closed | No | **Yes** |
| AI context service | Fail | **Pass** |
| Operation matrix in audits | Fail | **Pass** |
| Claim lifecycle | Fail | **Pass** |
| UX shell (G9) | Fail | **Pass** |
| PE completeness | Partial | **Partial** (advisory) |

**Recommendation:** **Reference Module Candidate** — eligible for council candidacy vote after domain L3 WITH FINDINGS ratification.

**Copy-worthy patterns:**

- `schedulingScheduleService` / `schedulingShiftService` decomposition  
- `schedulingManagerService` G09 facade  
- `schedulingDomainEventService` taxonomy  
- V-Link + trash lifecycle  
- AI action executor alignment  

**Not ready for Reference Module (promotion beyond candidate):** Scheduling PE expansion + analytics deferral remain on certificate.

---

### HR — Reference Module Candidate #1 (Workforce Lifecycle)

| Criterion | Pre BO-1A | Post BO-2 |
|-----------|-----------|-----------|
| L3 majors closed | No | **Yes** |
| PE coverage | ~42% | **~98%** |
| AI context service | Fail | **Pass** |
| Operation matrix | Fail | **Pass** |

**Recommendation:** **Reference Module Candidate** — **strongest BO reference** for employee lifecycle patterns.

**Copy-worthy patterns:**

- `employeeManagementService` import/terminate/delete  
- Multi-entity V-Link (profile, PTO, attendance, onboarding)  
- Scoped global trash (`employee_profile`)  
- HR ↔ Calendar PTO bridge via `hrScheduleService`  
- Policy Dual resource types  

**Reference Capability (immediate, no vote):** Org-chart symmetric lifecycle, scoped trash, PE dual enforcement patterns.

---

### Workforce Communications — Reference Module Candidate #7 (Workforce Broadcast)

| Criterion | Pre BO-1A | Post BO-2 |
|-----------|-----------|-----------|
| Phase G majors | Closed | Closed |
| PE | 32/32 | **32/32** |
| Bridge from HR | Unwired | **Wired (BO-1A)** |
| UX | Partial | **Aligned (BO-1B)** |

**Recommendation:** **Reference Module Candidate** — **strongest certification posture** of the three modules.

**Copy-worthy patterns:**

- Full broadcast lifecycle (compose → audience → publish → ack → report)  
- Audience resolution service  
- ConfirmModal destructive flows  
- Read-only AI context (appropriate for comms module)  

**Plain L3 at module scope:** Evaluator notes WC **could** receive plain L3 on isolated module certificate; domain bundle remains WITH FINDINGS due to sibling modules and partial G6.

---

## Reference Capability candidates (no council vote required)

| Capability | Best module | Status |
|------------|-------------|--------|
| Employee lifecycle + org-chart symmetry | HR | **Ready** |
| Shift planning + publish + domain events | Scheduling | **Ready** |
| Workforce operational broadcast | WC | **Ready** |
| HR → WC domain bridge (integration contract) | Domain | **Ready** |
| Cross-module EmptyState / ConfirmModal bar | Domain (BO-1B) | **Ready** |
| Labor analytics | None | **Not ready** (501 deferral) |

---

## Not ready

| Item | Reason |
|------|--------|
| **Domain as Reference Implementation (L4)** | File Hub remains sole L4 |
| **Reference Module promotion (all three)** | Requires L3 WITH FINDINGS ratification first + council vote |
| **Analytics reference patterns** | BO-F-D07 / F-SCH-009 — Stage 4 |

---

## Recommended reference sequence (post-ratification)

1. Ratify domain **L3 WITH FINDINGS**  
2. Council vote: WC **#7** (strongest)  
3. Council vote: HR **#1**  
4. Council vote: Scheduling **#6** (after advisory PE plan acknowledged)  
5. Domain **Reference Domain** designation (separate governance track)

---

## Summary table

| Module | Reference Module Candidate? | Reference Capability? | Plain L3 module-only? |
|--------|----------------------------|---------------------|------------------------|
| Scheduling | **Yes (#6)** | Yes | No — advisories + partial PE |
| HR | **Yes (#1)** | Yes | Borderline — still WITH FINDINGS in domain bundle |
| Workforce Comms | **Yes (#7)** | Yes | **Nearest plain L3** |
