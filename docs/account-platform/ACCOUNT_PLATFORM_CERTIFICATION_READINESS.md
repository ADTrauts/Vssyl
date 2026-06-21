# Account Platform — Certification Readiness

**Program:** Account Platform — Umbrella Progress Review  
**Date:** 2026-06-20  
**Status:** **UPDATED** — supersedes Phase 0A discovery readiness (2026-06-19) for umbrella posture  
**Type:** Readiness determination — **no certification execution**

**Supersedes for umbrella posture:** Phase 0A sections in prior [ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md](./ACCOUNT_PLATFORM_CERTIFICATION_READINESS.md) discovery estimates — sub-program scores now reflect **ratified evaluations**.

**Review basis:** [ACCOUNT_PLATFORM_UMBRELLA_PROGRESS_REVIEW.md](./ACCOUNT_PLATFORM_UMBRELLA_PROGRESS_REVIEW.md)

---

## Program-level readiness

| Field | Phase 0A (2026-06-19) | **Current (2026-06-20)** |
|-------|----------------------|--------------------------|
| **Account Platform umbrella** | Not certifiable | **Ready for evaluation planning** |
| **Sub-domain certification** | Unaudited | **All three ratified L3 WITH FINDINGS** |
| **Composite score** | ~44% avg estimate | **22/27 (~81%) umbrella / 24/27 (~89%) trilogy mean** |
| **Blocking findings** | Multiple (pre-impl) | **0** |
| **Ledger row** | 0 | **0** — trilogy PR authorized, not executed |
| **Unified operation matrix** | None | **Pending** — planning prerequisite |
| **Recommended topology** | Hybrid Option C | **Validated in production** |

---

## Sub-domain readiness (ratified)

| Sub-domain | G1–G9 | Level | Blocking | Open findings | Status |
|------------|------:|-------|----------|---------------|--------|
| **PP-1 Identity & Profile** | 24/27 (~89%) | L3 WF | 0 | ~9 | **✅ Ratified** |
| **PP-2 Settings Platform** | 26/27 (~96%) | L3 WF | 0 | ~6 | **✅ Ratified** |
| **PP-3 Billing & Entitlements** | 23/27 (~85%) | L3 WF | 0 | ~10 | **✅ Ratified** |

---

## Umbrella readiness gates

| Gate | Requirement | Status | Blocks |
|------|-------------|--------|--------|
| All sub-domains ratified L3 WF | 3/3 ratified | **✅ Met** | — |
| Zero umbrella blockers | 0 blocking | **✅ Met** | — |
| Composite score ≥80% (planning) | 81% cross-cutting | **✅ Met** | — |
| Unified operation matrix | Merged PP-1/2/3 matrices | **❌ Not met** | Umbrella eval |
| Composite evidence binder | G1–G9 umbrella binder | **❌ Not met** | Umbrella eval |
| Shared findings register | AP-UMB-* register | **✅ Met** (this review) | — |
| Evaluation authorization | Council vote | **❌ Not met** | Umbrella eval |
| Trilogy ledger rows | CERTIFICATION_LEDGER | **❌ Not met** | Composite cert execution |
| Cross-cutting security disposition | MFA doc | **✅ Met** (PP1 disposition) | — |

---

## Certification path status

| Path stage | Applicable today? |
|------------|-------------------|
| Not certifiable | **No** |
| Progress review only | **Complete** |
| **Ready for evaluation planning** | **✅ YES — current posture** |
| Ready for evaluation | **No** — 3 prep gates open |
| Ready for ratification | **No** |

---

## Certification candidates

### Umbrella composite (primary)

| Candidate | Rationale | Likely outcome |
|-----------|-----------|----------------|
| **Account Platform (umbrella)** | Trilogy ratified; coherent substrate; 0 blockers | **L3 WITH FINDINGS** after eval |

### Reference capabilities (ratified at sub-domain)

| Capability | Status |
|------------|--------|
| `#AP-BILL-1` Billing Pattern | Reference Capability With Findings — catalog PR pending |
| PP-1 identity pattern | Deferred |
| PP-2 settings pattern | Deferred |

### Not certification candidates (held)

| Area | Reason |
|------|--------|
| Business profile | BA L3 certified |
| AI persona | AI Platform deferred L3 |
| Dashboard layout | Dashboard Wave 3 |
| Admin billing ops | Admin Portal L3 |

---

## Likely certification path (updated)

```
✅ Phase 0B: PP-1, PP-2, PP-3 implementation + evaluation
✅ Phase 1:  Sub-domain ratification (trilogy complete)
✅ Phase 2:  Umbrella progress review ← THIS REVIEW
⏳ Phase 2b: Umbrella certification planning charter
⏳ Phase 2c: Unified operation matrix + composite binder
⏳ Phase 2d: Trilogy ledger PR
⏳ Phase 3:  Umbrella evaluation authorization
⏳ Phase 4:  Umbrella certification evaluation
⏳ Phase 5:  Umbrella ratification council
⏳ Phase 6:  Umbrella ledger row + program closeout (optional)
```

**Earliest umbrella evaluation:** After Phase 2b–2c complete + evaluation authorization.  
**Illustrative timeline:** Q1 2027 (planning prep ~4–8 weeks governance; eval + ratification ~4–6 weeks).

**Earliest umbrella certification (composite L3 WF):** Q1–Q2 2027 illustrative.

---

## Readiness by concern area

| Concern | Readiness | Notes |
|---------|-----------|-------|
| **Identity** | ✅ Certified WF | PP-1 ratified |
| **Settings** | ✅ Certified WF | PP-2 ratified — strongest sub-domain |
| **Billing** | ✅ Certified WF | PP-3 ratified |
| **Entitlements** | ✅ Certified WF | Within PP-3; F02 partial |
| **Security (account)** | ⚠️ WF | MFA dispositioned; not blocking |
| **Privacy** | ✅ | Within PP-1 cert scope |
| **Preferences** | ✅ | Within PP-2 cert scope |
| **Cross-domain integration** | ⚠️ WF | Settings→billing UX gap |
| **Shared governance** | ⏳ | Umbrella planning next |

---

## Prerequisites before umbrella evaluation

| # | Prerequisite | Owner | Est. effort |
|---|--------------|-------|-------------|
| 1 | Unified operation matrix (merge PP-1/2/3) | Program governance | 1–2 weeks |
| 2 | Composite G1–G9 evidence binder | Program governance | 1 week |
| 3 | Umbrella evaluation authorization vote | Council | 1 session |
| 4 | Trilogy ledger PR (recommended before eval) | Platform Engineering | 1 PR |

**Optional (not blocking eval):**

- MFA implementation (plain L3 only)
- Billing dashboard UX (plain L3 only)
- Reference catalog PR (`#AP-BILL-1`)

---

## Stop condition

Readiness determination **complete**. No certification. No execution. No ledger. No ratification.

**Recommendation:** Proceed to **umbrella certification planning charter**.

---

**Last updated:** 2026-06-20 (Umbrella Progress Review — supersedes Phase 0A umbrella estimates)
