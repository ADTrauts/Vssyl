# PP-3 — Reference Decision

**Program:** Account Platform — PP-3 Certification Ratification Council  
**Date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — catalog **EXECUTED** 2026-06-20 — see [ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md](./ACCOUNT_PLATFORM_GOVERNANCE_EXECUTION.md)

**Input:** [PP3_REFERENCE_REVIEW.md](./PP3_REFERENCE_REVIEW.md)  
**Precedent:** [ACCOUNT_PLATFORM_CERTIFICATION_COUNCIL_DECISION.md](./ACCOUNT_PLATFORM_CERTIFICATION_COUNCIL_DECISION.md) (PP-1/PP-2 reference deferrals)

---

## Council reference vote

| Capability | Evaluator recommendation | Council decision |
|------------|-------------------------|------------------|
| **Reference Billing Pattern** | Reference Capability With Findings | **✅ RATIFIED — Reference Capability With Findings** |
| **Reference Entitlement Resolver Pattern** | Candidate | **Deferred** — promote after F02 closure |
| Reference Implementation (L4) | Denied | **Denied** — File Hub only |
| Reference Domain (whole PP-3) | Denied | **Denied** |

---

## RD-AP3-REF-001 — Reference Billing Pattern

| Field | Decision |
|-------|----------|
| **Designation** | **Reference Capability With Findings** |
| **Catalog ID (proposed)** | `#AP-BILL-1` — Billing Platform Pattern |
| **Teaching scope** | `billingService` facade; Stripe checkout → entitlement cache sync; `/api/billing` canonical API; 410 retirement migration; `web/src/api/billing.ts` client |
| **Open findings on reference** | F08, F05, PP3-EVAL-F01, F02 partial |
| **Plain Reference Capability** | **Not ratified** — open majors block |
| **Catalog PR authorized?** | **YES** — separate from certification ledger |
| **Catalog updated in session?** | **YES** — executed 2026-06-20 Final Governance Execution |

**Council rationale:** PP-3 delivers the strongest **copyable billing integration pattern** in Account Platform. Stripe webhook security, service facade, entitlement sync, and API convergence are production-proven. Open UX and audit gaps prevent plain Reference Capability — consistent with Context Graph #CG-1/#CG-2 promotion to Reference Capability With Findings at L3 WF.

**Promotion path to plain Reference Capability:** Close F08, F05, PP3-EVAL-F01; separate reference promotion vote.

---

## RD-AP3-REF-002 — Reference Entitlement Resolver Pattern

| Field | Decision |
|-------|----------|
| **Designation** | **Candidate** (unchanged) |
| **Rationale** | Strong `entitlementService` pattern; bundle with billing reference sufficient for now |
| **Revisit trigger** | F02 data migration complete OR Umbrella Phase 3 pattern council |

---

## RD-AP3-REF-003 — PP-1 / PP-2 reference deferrals (affirmed)

| Sub-program | Prior decision | PP-3 council posture |
|-------------|----------------|---------------------|
| PP-1 identity pattern | Deferred | **Affirmed deferred** — revisit at umbrella pattern council |
| PP-2 settings pattern | Deferred | **Affirmed deferred** — PP-2 at 96% may promote first |

**Note:** PP-3 billing reference ratification does **not** reopen PP-1/PP-2 reference votes.

---

## Reference catalog action items (authorized, not executed)

| # | Action | Owner |
|---|--------|-------|
| 1 | Draft `#AP-BILL-1` entry in `REFERENCE_MODULE_CATALOG` | Platform Architecture |
| 2 | Link to `PP3_BILLING_SERVICE_MODEL.md`, `PP3_BILLING_CLIENT_ARCHITECTURE.md` | Platform Architecture |
| 3 | Tag open findings on reference record | Governance |

---

**Last updated:** 2026-06-20 (Certification Ratification Council · catalog executed)
