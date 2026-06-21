# PP-3 — Certification Ratification

**Program:** Account Platform — PP-3 Billing & Entitlements Certification Ratification Council  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — certification **EXECUTED** 2026-06-20 — see [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md)

**Authoritative inputs:**

- [PP3_CERTIFICATION_EVALUATION.md](./PP3_CERTIFICATION_EVALUATION.md)
- [PP3_CERTIFICATION_SCORECARD.md](./PP3_CERTIFICATION_SCORECARD.md)
- [PP3_FINDINGS_REVIEW.md](./PP3_FINDINGS_REVIEW.md)
- [PP3_REFERENCE_REVIEW.md](./PP3_REFERENCE_REVIEW.md)
- [PP3_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PP3_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [PP3_EVALUATION_AUTHORIZATION_DECISION.md](./PP3_EVALUATION_AUTHORIZATION_DECISION.md)

**Precedent:** [PP1_CERTIFICATION_RATIFICATION.md](./PP1_CERTIFICATION_RATIFICATION.md) · [PP2_CERTIFICATION_RATIFICATION.md](./PP2_CERTIFICATION_RATIFICATION.md) · [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md)

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — PP-3 Ratification |
| Surface under vote | PP-3 Billing & Entitlements (Account Platform sub-program) |
| Framework | Account Platform G1–G9 |
| Score at vote | **23/27 (~85%)** |
| Blocking findings | **0** |
| Evaluator recommendation | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Third Account Platform sub-domain ratified** | **Yes** — completes trilogy |

---

## A. Evaluation packet review

| Artifact | Council assessment |
|----------|-------------------|
| G1–G9 scorecard | ✅ Adequate — 23/27 confirmed |
| Operation matrix re-audit (19C / 23P / 2N) | ✅ Validated — legacy payment rows closed |
| Service architecture (`billingService`, `entitlementService`) | ✅ Constitutional substrate verified |
| API convergence + client migration | ✅ F03/F12 closures confirmed |
| Webhook exception review | ✅ Does not constitute dual API drift |
| Test evidence (20+ tests) | ⚠️ Adequate WITH FINDINGS — G6 partial accepted |

**Council finding:** Evaluation packet is **complete and credible**. Evaluator conservative adjustment on G1/G6 accepted; does not change certification posture.

---

## B. Findings review

### Open at ratification (on certificate)

| ID | Class | Disposition on certificate |
|----|-------|---------------------------|
| **PP3-F08** | Major | Modal-only billing UX — **accepted WITH FINDINGS** |
| **PP3-F05** | Major partial | Invoice webhook activity gap — **accepted WITH FINDINGS** |
| **PP3-F07** | Major partial | HR gating matrix separation — **accepted WITH FINDINGS** |
| **PP3-F02** | Blocking partial | Tier vocabulary drift — **waived for L3 WF**; tracked |
| **PP3-EVAL-F01** | Major (waivable) | Module commerce PE gap — **accepted WITH FINDINGS** |
| **PP3-F09** | Advisory | Orphan gating file — track-only |
| **PP3-F10** | Advisory | No product trial UX — track-only |
| **PP3-F11** | Advisory | `standard` vs `pro` vocabulary — track-only |
| **PP3-F13** | Advisory | AI query balance boundary docs — track-only |
| **PP3-EVAL-F02** | Advisory | Checkout E2E test gap — track-only |
| **G9** | Gate FAIL | Modal-first billing — **WF disposition** |

### Accepted exception

| ID | Disposition |
|----|-------------|
| PP3-F14 | Global Trash exception for billing records — documented |

### Closed (confirmed — no reopen)

PP3-F01, F03, F04, F06, F12

---

## C. Risk posture

| Risk | Severity | Council acceptance |
|------|----------|-------------------|
| Modal-only billing (F08) | Medium | ✅ Functional within modal scope; UX charter optional |
| Invoice activity gap (F05) | Low | ✅ Lifecycle path complete |
| Tier vocabulary (F02) | Low–medium | ✅ `normalizeTier()` boundary mitigation |
| Module PE gap (PP3-EVAL-F01) | Low | ✅ WITH FINDINGS |
| Stripe webhook ops URL | Low | ✅ Documented exception |
| G9 FAIL | Medium | ✅ Acceptable at L3 WF per BO/WS precedent |

**Residual risk:** **LOW–MODERATE** — acceptable for L3 WITH FINDINGS; highest UX gap in Account Platform trilogy.

---

## D. Council vote

| Field | Value |
|-------|-------|
| **Vote options** | APPROVE · REJECT · DEFER |
| **Council vote** | **APPROVE** |
| **Alternatives considered** | DEFER (rejected — prep complete, 0 blockers); REJECT (rejected — score and findings within precedent) |

---

## Ratification decision — RD-AP3-001

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [PP3_CERTIFICATION_EVALUATION.md](./PP3_CERTIFICATION_EVALUATION.md) (2026-06-20) |
| **Blockers** | **0** |
| **Open major findings** | PP3-F08; PP3-F05/F07 partial; PP3-EVAL-F01 |
| **Open advisory findings** | 5 + G6/G9 hygiene |

**Council rationale:** PP-3 meets Account Platform L3 WITH FINDINGS bar at 85% with zero blocking findings. Billing and entitlement substrate (`billingService`, `entitlementService`, `/api/billing`, `/api/account/*`) is service-owned with PE and activity on platform lifecycle. API convergence closed (F03). G9 FAIL from modal-only UX is consistent with Workspace (23/27, G9 partial) and HR open-major-at-ratification precedent — explicitly dispositioned on certificate.

**Not ratified:** NOT CERTIFIED; plain **LEVEL 3 CERTIFIED** (F08, G9, F02 block plain L3).

---

## Advisory treatment — RD-AP3-002

| Field | Decision |
|-------|----------|
| **Blocks certification?** | **No** |
| **Disposition** | **Accepted on certificate** — ~10 tracked findings |
| **Individual waivers required?** | **No** — track-only per framework |
| **Formal deferrals** | F08 billing dashboard — **optional post-cert UX charter**, not waived |
| **Remediation plan** | **Recommended** — 90-day hygiene themes (see post-ratification roadmap) |

**Promotion blockers (plain L3):** F08, F02 data migration, F05 invoice events, G9≥2, G6 integration depth.

---

## Ledger recommendation (PP-3)

| Field | Recommendation |
|-------|----------------|
| **Ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Ledger updated in this session?** | **YES** — executed 2026-06-20 Final Governance Execution |
| **Proposed level** | **3 — Certified** |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS · PP-3 Billing & Entitlements · G1–G9 23/27 · ~10 tracked findings |

---

**Last updated:** 2026-06-20 (Certification Ratification Council · certification executed)
