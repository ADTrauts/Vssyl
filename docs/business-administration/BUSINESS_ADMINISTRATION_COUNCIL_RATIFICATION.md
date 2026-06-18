# Business Administration — Certification Council Ratification

**Program:** BA-3 — Certification Council Ratification  
**Ratification date:** 2026-06-18  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **ledger PR authorized separately**; **no automatic ledger update in this session**

**Scope:** Business Administration platform subdomain certification, BA-F-005 waiver, and Reference Platform Capability candidacy (#OC-1, #OC-2)

**Authoritative inputs:**

- [BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_SCORECARD.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_SCORECARD.md)
- [BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md](./BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md)
- [BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md](./BUSINESS_ADMINISTRATION_REFERENCE_REVIEW.md)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_EXECUTIVE_SUMMARY.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md)

**Precedent:**

- [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) — HR/Scheduling L3 WITH FINDINGS; WC unconditional L3
- [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](../architecture/audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md) — control-plane L3 WITH FINDINGS; major waiver

**Constraint:** No runtime changes. No schema changes. No `CERTIFICATION_LEDGER.md` modification in this program. No certification award execution. No BA-F-005 implementation.

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Business Administration Certification Council — Ratification |
| Surface under vote | Business Administration (platform subdomain) |
| Framework | Adapted G1–G9 subdomain gates (not module L3 15-item gate) |
| Validated score at vote | **22/27 (~81%)** |
| Blocking findings | **0** |
| Open major findings | **1** (BA-F-005) |
| Level 4 denial | **Affirmed** — File Hub remains sole Reference Implementation (L4) |
| Reference Domain denial | **Affirmed** — Business Operations program scope |

---

## Ratification decisions

### RD-BA-001 — Business Administration certification

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_EVALUATION.md) |
| **Blockers** | **0** |
| **Open major findings** | BA-F-005 |
| **Open advisory findings** | BA-F-008, BA-F-009, BA-F-010, BA-F-011, BA-F-012, BA-F-003-R1 |
| **Downgraded findings** | BA-F-013 (97 residual `gray-*` tokens) |

**Council rationale:** Business Administration meets subdomain Level 3 on constitutional gates G2, G3, G6, and G9 with repository evidence. Zero blocking findings after BA-1A through BA-1E. Open major BA-F-005 is **schema-only approval hierarchy** with no user-facing broken surface — waivable at WITH FINDINGS certification, consistent with HR (F-HR-001..003) and Admin Portal (AP-F-007) ratification while majors remain open. Score 22/27 exceeds CONDITIONALLY READY threshold (70%); borderline on 85% READY FOR REVIEW but acceptable given zero blockers and four gates at PASS. Unconditional Level 3 deferred until BA-F-005 closes.

**Not ratified:** NOT CERTIFIED, plain LEVEL 3 CERTIFIED (BA-F-005 open), REFERENCE IMPLEMENTATION (L4), Reference Domain.

---

### RD-BA-002 — BA-F-005 waiver

| Field | Decision |
|-------|----------|
| **Blocks certification entirely?** | **No** |
| **Disposition** | **Major — waivable** |
| **Required before plain L3?** | **Yes** |
| **Tracking** | **Required** — 90-day implementation plan |

**Council rationale:** `ManagerApprovalHierarchy` exists in Prisma but has no server routes, service layer, API, or UI. HR ad-hoc manager assignment routes remain interim. Product must not market "approval chains" as shipped BA capability until BA-F-005 closes. Waiver mirrors RD-BO-001 (HR majors open at ratification) and RD-AP-002 (AP-F-007 waivable for control-plane scope). BA-F-005 is a **governance completeness** gap, not an authorization bypass or audit failure on live mutation paths.

**Waiver conditions:**

1. No approval-hierarchy UI or API exposure until `BusinessApprovalService` (or equivalent) ships with PE + activity.
2. Document interim HR manager routes in BO/BA boundary docs.
3. 90-day closure target from ratification — see [BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md](./BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md).

---

### RD-BA-003 — Reference Platform Capability candidacy

| Capability | Designation | Ratified? | Condition |
|------------|-------------|-----------|-----------|
| **#OC-1** | **Reference Platform Capability — Org Chart Identity & Structure** | **YES** | BA-F-005 waiver active; 90-day advisory hygiene (BA-F-011) |
| **#OC-2** | **Reference Platform Capability — Permission Sets & Module Access** | **YES** | Pairs with #OC-1; not standalone module reference |
| **#OC-3** | **Approval Boundaries** | **DEFERRED** | Until BA-F-005 runtime exists |

**Not approved:** Reference Domain; Reference Implementation (L4); monolithic "whole BA" reference designation.

**Promotion path:** Reference Platform Capability Candidate → promoted capability reference requires BA-F-005 closure for #OC-3; #OC-1/#OC-2 may be cited in pattern guides after ledger PR without waiting for plain L3.

---

### RD-BA-004 — Ledger row

| Field | Decision |
|-------|----------|
| **Add to certification ledger?** | **YES** — recommended |
| **Row placement** | Platform systems (non-module) |
| **Ledger PR** | Authorized separately — see [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md) |
| **Executed in this program?** | **NO** |

---

## Council question answers

### Question 1 — Should Business Administration receive certification?

**LEVEL 3 CERTIFIED WITH FINDINGS**

| Option | Council vote |
|--------|--------------|
| NOT CERTIFIED | Rejected — 0 blockers; G2/G3/G6/G9 PASS; 81% &gt; 70% |
| LEVEL 3 CERTIFIED | Rejected — BA-F-005 major open |
| **LEVEL 3 CERTIFIED WITH FINDINGS** | **Ratified** |

---

### Question 2 — Does BA-F-005 block certification?

| Classification | Council vote |
|----------------|--------------|
| Blocking | Rejected — no live unsafe mutation path |
| **Major waivable** | **Ratified** |
| Required before plain L3 | **Affirmed** — not waived for unconditional L3 |

---

### Question 3 — Should #OC-1 receive Reference Candidate status?

**YES** — ratified as **Reference Platform Capability Candidate #OC-1** (Org Chart Identity & Structure).

---

### Question 4 — Should #OC-2 receive Reference Candidate status?

**YES** — ratified as **Reference Platform Capability Candidate #OC-2** (Permission Sets & Module Access).

---

### Question 5 — Should #OC-3 be deferred until approval hierarchy runtime exists?

**YES** — #OC-3 Approval Boundaries **not** ratified; deferred until BA-F-005 closes.

---

### Question 6 — Should Business Administration be added to CERTIFICATION_LEDGER.md later?

**YES** — proposed row in [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md). Ledger file **not** modified in BA-3.

---

### Question 7 — What is the next initiative?

**BA-F-005 approval hierarchy implementation** (90-day major closure plan)

| Option | Council vote |
|--------|--------------|
| **BA-F-005 approval hierarchy implementation** | **Ratified** — primary BA program continuation |
| Business Operations BO-1A | Parallel — not blocking BA cert; independent charter |
| Context Graph Platform | Deferred — cross-cutting; no BA cert dependency |
| Business Administration advisory cleanup | **Authorized as parallel track 0** — BA-F-011 matrix publish within 30 days |

---

## Certification consistency review

### Comparison to prior council outcomes

| Program | Certification | Score / bar | Open majors | Blockers | Reference at ratification |
|---------|---------------|-------------|-------------|----------|---------------------------|
| **HR** | L3 WITH FINDINGS (2026-06-14) | Constitutional PASS | 3 (F-HR-001..003) | 0 | Reference Candidate #1 |
| **Scheduling** | L3 WITH FINDINGS (2026-06-14) | Post-remediation PASS | 4 (F-SCH-004..007) | 0 | Reference Candidate #6 |
| **Workforce Communications** | L3 Certified (2026-06-14) | Full PASS | 0 (advisories only) | 0 | Reference Candidate #7 |
| **Admin Portal** | L3 WITH FINDINGS → promoted plain L3 (2026-06-18) | 24/27 (~89%) → 27/27 | 1 → 0 | 0 | Control Plane Reference With Findings |
| **Business Administration** | **L3 WITH FINDINGS (2026-06-18)** | **22/27 (~81%)** | **1 (BA-F-005)** | **0** | **#OC-1, #OC-2 capability candidates** |

### Consistency determination

**L3 WITH FINDINGS is consistent** for Business Administration.

| Factor | Assessment |
|--------|------------|
| HR/Scheduling precedent | BA has **fewer** open majors (1 vs 3–4) with same zero-blocker posture |
| WC bar | BA does not qualify for unconditional L3 — one major remains (WC had 0 majors) |
| Admin Portal | BA score (81%) is below AP pre-promotion (89%) but above NOT READY; same WITH FINDINGS tier appropriate |
| G9 | BA **PASS** (unlike AP pre-1A G9 FAIL) — stronger UX evidence than HR/Scheduling at ratification |
| Subdomain vs module | BA uses adapted G1–G9, not 15-item module gate — analogous to Admin Portal control-plane adaptation |

**Council rule affirmed:** Open majors with zero blockers and constitutional gates PASS on auditability, service boundaries, and test evidence warrant **LEVEL 3 CERTIFIED WITH FINDINGS** — not NOT CERTIFIED and not plain L3 until majors close.

---

## Governance actions ratified

| # | Action | Owner | Deadline |
|---|--------|-------|----------|
| G-BA-1 | Apply ledger update per [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md) | Platform Engineering | Next ledger PR |
| G-BA-2 | Publish operation matrix to `docs/architecture/audits/` (BA-F-011) | BA Program Steward | 30 days |
| G-BA-3 | Execute BA-F-005 90-day plan per [POST_RATIFICATION_ROADMAP](./BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md) | BA + HR joint | 90 days |
| G-BA-4 | Track advisories BA-F-008..012, BA-F-003-R1, BA-F-013 | BA Program Steward | Quarterly |
| G-BA-5 | Register #OC-1/#OC-2 in reference catalog annex | Architecture Governance | With G-BA-1 |
| G-BA-6 | **Do not** market approval chains as shipped until BA-F-005 closes | Product | Immediate |

---

## Final decision table

| Question | Decision |
|----------|----------|
| BA certified? | **YES — LEVEL 3 CERTIFIED WITH FINDINGS** |
| BA-F-005 blocks L3 WITH FINDINGS? | **No — major waivable** |
| BA-F-005 blocks plain L3? | **Yes** |
| #OC-1 ratified? | **YES** |
| #OC-2 ratified? | **YES** |
| #OC-3 deferred? | **YES** |
| Ledger update approved? | **YES** (PR authorized; not executed) |
| Next initiative? | **BA-F-005 implementation** (+ BA-F-011 parallel) |

---

## Related deliverables

1. [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md)
2. [BUSINESS_ADMINISTRATION_REFERENCE_CANDIDATE_DECISION.md](./BUSINESS_ADMINISTRATION_REFERENCE_CANDIDATE_DECISION.md)
3. [BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md](./BUSINESS_ADMINISTRATION_POST_RATIFICATION_ROADMAP.md)
4. [BUSINESS_ADMINISTRATION_COUNCIL_EXECUTIVE_SUMMARY.md](./BUSINESS_ADMINISTRATION_COUNCIL_EXECUTIVE_SUMMARY.md)

---

**Stop condition met.** Ratification complete. No implementation. No ledger file edit in this session. No certification award execution.
