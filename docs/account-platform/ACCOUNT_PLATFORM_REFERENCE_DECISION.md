# Account Platform — Reference Decision

**Program:** Account Platform — Umbrella Certification Ratification Council  
**Date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — catalog **EXECUTED** 2026-06-20 — see [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md)

**Input:** [ACCOUNT_PLATFORM_REFERENCE_REVIEW.md](./ACCOUNT_PLATFORM_REFERENCE_REVIEW.md)  
**Prior decisions:** [PP3_REFERENCE_DECISION.md](./PP3_REFERENCE_DECISION.md) · PP-1/PP-2 reference deferrals

---

## Council reference vote — umbrella lens

| Capability / surface | Evaluator recommendation | Council decision |
|---------------------|-------------------------|------------------|
| **Account Platform composite** | Not a reference domain | **✅ Denied** — program umbrella, not copyable pattern |
| **#AP-BILL-1 Billing Platform Pattern** | Reference Capability With Findings | **✅ RATIFIED — Reference Capability With Findings** |
| **Reference Entitlement Resolver** | Candidate | **Deferred** — promote after F02/ACC-01 closure |
| **PP-1 Identity Pattern** | Deferred | **✅ Affirmed deferred** |
| **PP-2 Settings Pattern** | Deferred | **✅ Affirmed deferred** — revisit at pattern council |
| Reference Implementation (L4) | Denied | **✅ Denied** — File Hub only |

---

## RD-AP-UMB-REF-001 — Account Platform umbrella

| Field | Decision |
|-------|----------|
| **Designation** | **Not a reference domain** |
| **Rationale** | Composite certification validates cross-domain coherence; not a teaching artifact for third-party modules |
| **Catalog entry** | **None** |
| **Teaching scope** | N/A — use sub-domain and capability references instead |

---

## RD-AP-UMB-REF-002 — #AP-BILL-1 Billing Platform Pattern

| Field | Decision |
|-------|----------|
| **Designation** | **Reference Capability With Findings** |
| **Catalog ID** | `#AP-BILL-1` |
| **Inherited from** | PP-3 ratification (RD-AP3-REF-001) — **affirmed at umbrella** |
| **Open findings on reference** | M02, M05, M07, ACC-01 (umbrella roll-up) |
| **Catalog PR authorized?** | **YES** — separate from certification ledger |
| **Catalog updated in session?** | **YES** — executed 2026-06-20 Final Governance Execution |

**Council rationale:** Umbrella evaluation confirms billing → entitlement integration across the platform. Strongest copyable pattern in Account Platform portfolio.

---

## RD-AP-UMB-REF-003 — PP-1 / PP-2 / Entitlement patterns

| Pattern | Status | Revisit trigger |
|---------|--------|-----------------|
| PP-1 Identity substrate | **Deferred** | MFA closure (M01) OR dedicated pattern council |
| PP-2 Settings orchestration | **Deferred** | PP-2 at 26/27 — candidate for future promotion |
| Entitlement resolver | **Candidate** | Tier migration (M04) complete |

**Note:** PP-2 settings pattern may promote before PP-1 identity given score differential — separate pattern council charter.

---

## Reference posture summary

| Layer | Reference status |
|-------|------------------|
| **Account Platform program** | L3 WITH FINDINGS certified — **not** a reference domain |
| **PP-1 Identity** | L3 WF sub-domain — pattern **deferred** |
| **PP-2 Settings** | L3 WF sub-domain — pattern **deferred** (strongest candidate) |
| **PP-3 Billing** | L3 WF sub-domain — **#AP-BILL-1** Reference Capability With Findings |
| **Platform L4** | File Hub only |

---

## Catalog action items (executed)

| # | Action | Status |
|---|--------|--------|
| 1 | Draft `#AP-BILL-1` in `REFERENCE_MODULE_CATALOG` | **Executed** 2026-06-20 |
| 2 | Update Account Platform section (PP-3 + umbrella + program ARCHIVED) | **Executed** 2026-06-20 |
| 3 | Link governance records to execution | **Executed** 2026-06-20 |

---

**Last updated:** 2026-06-20 (Reference Decision · catalog executed)
