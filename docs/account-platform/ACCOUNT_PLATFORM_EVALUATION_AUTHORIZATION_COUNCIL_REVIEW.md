# Account Platform — Evaluation Authorization Council Review

**Program:** Account Platform — Umbrella Certification Evaluation Authorization Council Review  
**Date:** 2026-06-20  
**Type:** Council governance review — **no evaluation performed**  
**Surface under vote:** Account Platform umbrella composite capability

**Prior artifacts:**

- [ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_REVIEW.md](./ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_REVIEW.md)
- [ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_DECISION.md)
- [ACCOUNT_PLATFORM_CERTIFICATION_RISK_REVIEW.md](./ACCOUNT_PLATFORM_CERTIFICATION_RISK_REVIEW.md)
- [ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md](./ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md)
- [ACCOUNT_PLATFORM_EVALUATION_READINESS_REVIEW.md](./ACCOUNT_PLATFORM_EVALUATION_READINESS_REVIEW.md)

**Precedent:** [PP1_EVALUATION_AUTHORIZATION_COUNCIL_REVIEW.md](./PP1_EVALUATION_AUTHORIZATION_COUNCIL_REVIEW.md) · [PP3_EVALUATION_AUTHORIZATION_DECISION.md](./PP3_EVALUATION_AUTHORIZATION_DECISION.md)

---

## Council question

Should the **Account Platform umbrella composite** formally enter certification evaluation under the **L3 WITH FINDINGS** path?

---

## Council review inputs

| Input | Reference | Status |
|-------|-----------|--------|
| Authorization recommendation | [ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_AUTHORIZATION_DECISION.md) | **AUTHORIZE** |
| Composite readiness | 22/27 (~81%) | Meets threshold |
| Unified matrix validation | [ACCOUNT_PLATFORM_UNIFIED_MATRIX_VALIDATION.md](./ACCOUNT_PLATFORM_UNIFIED_MATRIX_VALIDATION.md) | Validated — 122 rows |
| Composite evidence binder | [ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md](./ACCOUNT_PLATFORM_COMPOSITE_EVIDENCE_BINDER.md) | Complete |
| Findings register | [ACCOUNT_PLATFORM_COMPOSITE_FINDINGS_REVIEW.md](./ACCOUNT_PLATFORM_COMPOSITE_FINDINGS_REVIEW.md) | Complete |
| Risk review | [ACCOUNT_PLATFORM_CERTIFICATION_RISK_REVIEW.md](./ACCOUNT_PLATFORM_CERTIFICATION_RISK_REVIEW.md) | Acceptable |
| Trilogy ratification | PP-1/PP-2/PP-3 L3 WF | Complete |

---

## A. Authorization recommendation review

| Artifact | Council assessment |
|----------|-------------------|
| Authorization review | ✅ Thorough — denial criteria not met |
| Risk review | ✅ Acceptable for L3 WF entry |
| Composite evidence binder | ✅ All 9 gates documented; ~57 tests cited |
| Readiness review | ✅ All prep prerequisites complete |
| Preparation summary | ✅ Packet index complete |

**Council finding:** Authorization recommendation is **well-supported**. No material gaps in the evidence chain.

---

## B. Findings review

### Blocking — **NONE**

| Check | Result |
|-------|--------|
| AP-UMB blockers | **0** |
| Sub-domain reopen | **None** |
| Undisclosed defects | **None identified** |

### Major — WITH FINDINGS (7)

| ID | Description | Council disposition |
|----|-------------|---------------------|
| **AP-UMB-M01** | MFA not implemented | **Accepted WITH FINDINGS** — [PP1_MFA_DISPOSITION_REVIEW.md](./PP1_MFA_DISPOSITION_REVIEW.md) |
| **AP-UMB-M02** | Modal-only billing UX | **Accepted WITH FINDINGS** — functional within modal |
| **AP-UMB-M03** | Business settings triplication | **Accepted WITH FINDINGS** — BA-owned |
| **AP-UMB-M04** | Tier enum vocabulary drift | **Accepted WITH FINDINGS** — ACC-01 waiver |
| **AP-UMB-M05** | Invoice webhook activity gap | **Accepted WITH FINDINGS** — lifecycle complete |
| **AP-UMB-M06** | Photo multer in controller | **Accepted WITH FINDINGS** — service exists |
| **AP-UMB-M07** | Module commerce PE gap | **Accepted WITH FINDINGS** — JWT auth present |

**Council finding:** No major warrants DEFER or REJECT. All pre-dispositioned for WITH FINDINGS path — consistent with BO (17 advisories), WS (23/27), PP-3 (23/27) precedent.

### Advisory — track-only (18)

AP-UMB-ADV-01 through ADV-18 — **track-only on certificate**. No individual waivers required.

### Accepted WITH FINDINGS (2)

| ID | Council acceptance |
|----|-------------------|
| AP-UMB-ACC-01 | Tier `normalizeTier()` boundary — **accepted** |
| AP-UMB-ACC-02 | Billing Global Trash exception — **accepted** |

### Evaluation constraints (council-imposed)

| # | Constraint |
|---|------------|
| 1 | Target **L3 WITH FINDINGS** — not plain L3 |
| 2 | Do not reopen closed sub-domain findings without regression evidence |
| 3 | Apply G9 compensation rule per composite G1–G9 model |
| 4 | Maximum 3 new AP-UMB-EVAL-* findings at evaluation |
| 5 | No runtime changes during evaluation unless blocker discovered |
| 6 | No ledger update until post-ratification charter |

---

## C. Certification expectations

| Field | Council expectation |
|-------|---------------------|
| **Expected score** | **21–23/27** (prep 22/27) |
| **Expected outcome** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Plain L3** | **Not targeted** — M01, M02, M03, M04, M06 block |
| **NOT CERTIFIED** | Very low (~10%) — would require G3/G4 failure |
| **Evaluation should proceed?** | **Yes** — upon this APPROVE vote |

---

## D. Program readiness review

| Slice | Ratified | Council assessment |
|-------|----------|-------------------|
| **Identity (PP-1)** | L3 WF · 24/27 | ✅ Strong substrate; MFA dispositioned |
| **Settings (PP-2)** | L3 WF · 26/27 | ✅ Strongest sub-domain; 0N core matrix |
| **Billing (PP-3)** | L3 WF · 23/27 | ✅ Lifecycle strong; UX gap pre-briefed |
| **Entitlements (PP-3)** | Within PP-3 | ✅ SoR coherent; F02 partial accepted |
| **Cross-domain integration** | Unified matrix | ✅ Coherent WITH FINDINGS |

**Overall readiness:** **Sufficient** for umbrella evaluation entry.

---

## E. Risk posture review

| Risk | Severity | Council acceptance |
|------|----------|-------------------|
| MFA absent (M01) | Medium | ✅ Dispositioned |
| Modal billing UX (M02) | Medium | ✅ WITH FINDINGS |
| G9 compensation rejected | Medium | ✅ Rule documented — evaluator briefed |
| Business dedup (M03) | Low | ✅ BA-owned |
| Evaluator conservative scoring | Low | ✅ 21/27 floor acceptable |
| Plain L3 stakeholder mismatch | Medium | ✅ Pre-brief required |
| Sub-domain regression | Low | ✅ None identified |

**Council finding:** Residual risk **LOW–MODERATE**, acceptable for evaluation entry — consistent with trilogy ratification band.

---

## F. Portfolio consistency review

| Surface | Score at eval auth | Blockers | Council precedent |
|---------|-------------------|----------|-------------------|
| Business Operations | 24/27 | 0 | ✅ Accepted L3 WF |
| Reference Workspace | 23/27 | 0 | ✅ Accepted L3 WF |
| PP-3 Billing | 23/27 (eval) | 0 | ✅ Authorized + ratified |
| **Account Platform umbrella** | **22/27** | **0** | **✅ Consistent** |

Umbrella at 22/27 with 7 dispositioned majors is **within portfolio norm**. Advisory count (18) below Business Operations (17 majors+advisories combined at ratification).

---

## G. Council vote

| Field | Value |
|-------|-------|
| **Vote options** | APPROVE · DEFER · REJECT |
| **Council vote** | **APPROVE** |
| **Decision ID** | EA-AP-UMB-001 |
| **Effective** | Upon ratification of [ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_EVALUATION_COUNCIL_DECISION.md) |
| **Authorization granted** | Account Platform umbrella may enter formal certification evaluation |

### Vote rationale

1. Trilogy ratified L3 WITH FINDINGS — umbrella is the logical next gate.
2. Preparation packet complete — no missing prerequisites.
3. Zero blocking findings — all 7 majors pre-dispositioned.
4. Composite 22/27 exceeds WITH FINDINGS threshold; aligns with WS/BO bands.
5. Cross-domain coherence validated — 0 ownership conflicts.
6. Deferral options (MFA, billing UX, ledger PR) rejected — no material risk reduction.
7. REJECT has no governance basis.

### Alternatives considered

| Option | Verdict |
|--------|---------|
| **APPROVE** | **✅ Selected** |
| DEFER (MFA) | Rejected — disposition complete |
| DEFER (billing UX) | Rejected — functional within modal |
| DEFER (ledger PR) | Rejected — recommended parallel, not blocking |
| REJECT | Rejected — 0 blockers, complete packet |

### Dissent / conditions

None recorded. Evaluator must include MFA disposition, G9 compensation rule, and unified matrix in evaluation packet.

---

**Last updated:** 2026-06-20 (Umbrella Evaluation Authorization Council Review)
