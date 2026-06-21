# PP-1 — Certification Ratification

**Program:** Account Platform — PP-1 + PP-2 Certification Ratification Council  
**Sub-program:** PP-1 Identity & Profile  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **ledger PR authorized separately**; **certification execution not performed in this session**

**Authoritative inputs:**

- [PP1_CERTIFICATION_EVALUATION.md](./PP1_CERTIFICATION_EVALUATION.md)
- [PP1_CERTIFICATION_SCORECARD.md](./PP1_CERTIFICATION_SCORECARD.md)
- [PP1_FINDINGS_REVIEW.md](./PP1_FINDINGS_REVIEW.md)
- [PP1_REFERENCE_REVIEW.md](./PP1_REFERENCE_REVIEW.md)
- [PP1_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PP1_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md)

**Precedent:** [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](../architecture/audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md) · [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md)

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — PP-1 Ratification |
| Surface under vote | PP-1 Identity & Profile (Account Platform sub-program) |
| Framework | Account Platform G1–G9 |
| Score at vote | **24/27 (~89%)** |
| Blocking findings | **0** |
| Evaluator recommendation | **LEVEL 3 CERTIFIED WITH FINDINGS** |

---

## A. Evaluation packet review

| Artifact | Council assessment |
|----------|-------------------|
| G1–G9 scorecard | ✅ Adequate — 24/27 confirmed |
| Operation matrix (7C / 27P / 3N) | ✅ Validated — N rows confined to security UX |
| MFA disposition | ✅ Accepted for L3 WF path |
| Test evidence (6 core tests) | ⚠️ Thin but documented — acceptable WITH FINDINGS |
| Service boundary extraction | ✅ F01, F02, F05, F06 closures verified |

**Council finding:** Evaluation packet is **complete and credible**. No material discrepancies between evaluator claims and prep artifacts.

---

## B. Findings review

### Open at ratification

| ID | Class | Disposition on certificate |
|----|-------|---------------------------|
| PP1-F03 | Major → WF | MFA not implemented — accepted WITH FINDINGS |
| PP1-F04 | Major partial | Photo multer in controller — WITH FINDINGS |
| PP1-F08 | Advisory | Session revoke / password UX — WITH FINDINGS |
| PP1-EVAL-A01 | Advisory | No identity domain events — WITH FINDINGS |
| PP1-EVAL-A02 | Advisory | Auth security logging (informational) |
| PP1-F09 | Advisory | Legacy photo URL fields |
| PP1-F11 | Advisory | Global Trash photos |
| G6 | Advisory | Test coverage gaps |
| PP1-F10 | Advisory | Business 2FA UI (BA) |

### Closed (confirmed)

PP1-F01, F02, F05, F06, F07, F12 — no reopen.

---

## C. Risk posture

| Risk | Severity | Council acceptance |
|------|----------|-------------------|
| No MFA (F03) | Medium | ✅ Compensating controls + Phase 1B charter |
| Photo controller (F04) | Low | ✅ Service layer exists |
| Session UX (F08) | Low | ✅ WITH FINDINGS |
| Test gaps (G6) | Low | ✅ Hygiene track |
| No identity domain events | Low | ✅ Module activity covers writes |

**Residual risk:** **LOW–MODERATE** — acceptable for L3 WITH FINDINGS consistent with Admin Portal MFA-adjacent waivers and HR open-major-at-ratification precedent.

---

## D. Council vote

| Field | Value |
|-------|-------|
| **Vote options** | APPROVE · REJECT · DEFER |
| **Council vote** | **APPROVE** |
| **Alternatives considered** | DEFER (rejected — no benefit from delay); REJECT (rejected — 0 blockers) |

---

## Ratification decision — RD-AP1-001

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [PP1_CERTIFICATION_EVALUATION.md](./PP1_CERTIFICATION_EVALUATION.md) (2026-06-20) |
| **Blockers** | **0** |
| **Open major findings** | PP1-F03 (WF), PP1-F04 (partial) |
| **Open advisory findings** | 7 + G6 hygiene |

**Council rationale:** PP-1 meets Account Platform L3 WITH FINDINGS bar at 89% with zero blocking findings. Identity mutation substrate (profile, privacy, connections, photos, preferences) is service-owned with PE and module activity. MFA gap is explicitly dispositioned — consistent with portfolio acceptance of documented security gaps when compensating controls exist (Admin Portal, PP1_MFA_DISPOSITION_REVIEW). Three matrix N rows are security UX only — not substrate failures.

**Not ratified:** NOT CERTIFIED; plain **LEVEL 3 CERTIFIED** (F03, F04, G6 block plain L3).

---

## Reference status (PP-1)

| Field | Decision |
|-------|----------|
| **Reference Module #N** | **Not applicable** |
| **Identity pattern reference** | **Deferred** — per [PP1_REFERENCE_REVIEW.md](./PP1_REFERENCE_REVIEW.md) |
| **Reference council opened** | **No** |

---

## Ledger recommendation (PP-1)

| Field | Recommendation |
|-------|----------------|
| **Ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Ledger updated in this session?** | **NO** |
| **Proposed level** | **3 — Certified** |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS · PP-1 Identity & Profile · G1–G9 24/27 · 9 tracked findings |

---

**Last updated:** 2026-06-20 (Certification Ratification Council)
