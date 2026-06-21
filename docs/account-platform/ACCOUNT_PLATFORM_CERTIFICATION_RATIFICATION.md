# Account Platform — Certification Ratification

**Program:** Account Platform — Umbrella Certification Ratification Council  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — certification **EXECUTED** 2026-06-20 — see [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md)

**Authoritative inputs:**

- [ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md](./ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md](./ACCOUNT_PLATFORM_CERTIFICATION_SCORECARD.md)
- [ACCOUNT_PLATFORM_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_FINDINGS_REVIEW.md)
- [ACCOUNT_PLATFORM_REFERENCE_REVIEW.md](./ACCOUNT_PLATFORM_REFERENCE_REVIEW.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ACCOUNT_PLATFORM_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md) — EA-AP-UMB-001

**Precedent:** [PP3_CERTIFICATION_RATIFICATION.md](./PP3_CERTIFICATION_RATIFICATION.md) · [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) · [WORKSPACE_COUNCIL_RATIFICATION.md](../workspace/WORKSPACE_COUNCIL_RATIFICATION.md)

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — Umbrella Ratification |
| Surface under vote | **Account Platform** (umbrella composite capability) |
| Framework | Account Platform G1–G9 (umbrella variant) |
| Score at vote | **22/27 (~81%)** |
| Trilogy inherited | PP-1 24/27 · PP-2 26/27 · PP-3 23/27 |
| Blocking findings | **0** |
| Evaluator recommendation | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Umbrella composite ratified** | **Yes** — completes Account Platform program |

---

## A. Evaluation packet review

| Artifact | Council assessment |
|----------|-------------------|
| G1–G9 scorecard | ✅ Adequate — 22/27 confirmed (prep delta 0) |
| Unified matrix (122 rows) | ✅ Validated — 49C/65P/5N |
| Cross-domain integration | ✅ Coherent WITH FINDINGS |
| Trilogy inheritance | ✅ Sub-domains not re-audited — appropriate |
| G9 compensation rule | ✅ Applied per EA-AP-UMB-001 |
| Test evidence (~57 trilogy) | ⚠️ Adequate WITH FINDINGS — G6 partial accepted |
| Documentation (60+ docs) | ✅ Strong — G7 PASS |

**Council finding:** Evaluation packet is **complete and credible**. Score aligns with authorization prediction (21–23/27). G9 compensation from PP-3 sub-score accepted per council constraint.

---

## B. Findings review

### Open at ratification (on certificate)

| ID | Class | Disposition on certificate |
|----|-------|---------------------------|
| **AP-UMB-M01** | Major | MFA not implemented — **accepted WITH FINDINGS** (disposition doc) |
| **AP-UMB-M02** | Major | Modal-only billing UX — **accepted WITH FINDINGS** |
| **AP-UMB-M03** | Major partial | Business settings triplication — **accepted WITH FINDINGS** (BA-owned) |
| **AP-UMB-M04** | Major partial | Tier enum vocabulary — **waived partial** → ACC-01 |
| **AP-UMB-M05** | Major partial | Invoice webhook activity — **accepted WITH FINDINGS** |
| **AP-UMB-M06** | Major partial | Photo multer in controller — **accepted WITH FINDINGS** |
| **AP-UMB-M07** | Major partial | Module commerce PE gap — **accepted WITH FINDINGS** |

### Advisory (track-only — 19)

AP-UMB-ADV-01 through ADV-18 + **AP-UMB-EVAL-F01** (cross-slice integration test) — **track-only on certificate**.

### Accepted WITH FINDINGS

| ID | Disposition |
|----|-------------|
| AP-UMB-ACC-01 | Tier `normalizeTier()` boundary — documented waiver |
| AP-UMB-ACC-02 | Billing Global Trash exception — documented |

### Closed (confirmed — no reopen)

~23 sub-domain findings frozen at trilogy ratification.

---

## C. Risk posture

| Risk | Severity | Council acceptance |
|------|----------|-------------------|
| MFA absent (M01) | Medium | ✅ Dispositioned — Admin Portal compensating controls |
| Modal billing UX (M02) | Medium | ✅ Functional within modal; optional UX charter |
| Business dedup (M03) | Low | ✅ BA-owned WITH FINDINGS |
| Tier vocabulary (M04) | Low–medium | ✅ ACC-01 boundary control |
| Cross-slice test gap (EVAL-F01) | Low | ✅ Advisory — not blocking |
| G9 partial at composite | Medium | ✅ Acceptable at L3 WF — WS/BO precedent |

**Residual risk:** **LOW–MODERATE** — acceptable for L3 WITH FINDINGS at 22/27.

---

## D. Council vote

| Field | Value |
|-------|-------|
| **Vote options** | APPROVE · REJECT · DEFER |
| **Council vote** | **APPROVE** |
| **Alternatives considered** | DEFER (rejected — no benefit from delay); REJECT (rejected — 0 blockers, complete packet) |

---

## Ratification decision — RD-AP-UMB-001

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md](./ACCOUNT_PLATFORM_CERTIFICATION_EVALUATION.md) (2026-06-20) |
| **Blockers** | **0** |
| **Open major findings** | **7** — AP-UMB-M01–M07 |
| **Open advisory findings** | **19** |

**Council rationale:** Account Platform meets umbrella L3 WITH FINDINGS bar at 81% with zero blocking findings. Trilogy substrate (identity, settings, billing, entitlements) is constitutionally coherent with documented exclusions held. Seven majors are pre-dispositioned and consistent with Business Operations (17 advisories at L3 WF) and Reference Workspace (23/27) precedent. G9 compensation appropriately reflects PP-1/PP-2 UX strength against PP-3 modal billing gap.

**Not ratified:** NOT CERTIFIED; plain **LEVEL 3 CERTIFIED** (M01, M02, M03, M04, M06, G9 block plain L3).

---

## Advisory treatment — RD-AP-UMB-002

| Field | Decision |
|-------|----------|
| **Blocks certification?** | **No** |
| **Disposition** | **Accepted on certificate** — ~28 tracked items (7 majors + 19 advisories + 2 accepted) |
| **Individual waivers required?** | **No** — advisories track-only; ACC-01/ACC-02 documented |
| **Remediation plan** | **Recommended** — 90-day hygiene themes (see post-ratification roadmap) |

**Promotion blockers (plain L3):** M01, M02, M03, M04, M06 + composite G9≥3.

---

## Ledger recommendation (umbrella)

| Field | Recommendation |
|-------|----------------|
| **Ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Ledger updated in this session?** | **YES** — executed 2026-06-20 Final Governance Execution |
| **Proposed level** | **3 — Certified** |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS · Account Platform · G1–G9 22/27 · 28 tracked findings |
| **Combined PR?** | **Recommended** — PP-1 + PP-2 + PP-3 + umbrella rows |

---

**Last updated:** 2026-06-20 (Umbrella Certification Ratification Council · certification executed)
