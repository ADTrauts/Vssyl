# Account Platform — Reference Review (Certification Evaluation)

**Program:** Account Platform — Umbrella Certification Evaluation  
**Date:** 2026-06-20  
**Authority:** Reference capability assessment — **no catalog or ledger updates**  
**Prior baseline:** [PP3_REFERENCE_DECISION.md](./PP3_REFERENCE_DECISION.md) · [PP3_REFERENCE_REVIEW.md](./PP3_REFERENCE_REVIEW.md)

---

## Assessment summary

| Capability | Pre-umbrella status | Post-eval recommended status |
|------------|---------------------|------------------------------|
| **#AP-BILL-1 Billing Platform Pattern** | Reference Capability With Findings (PP-3 ratified) | **Affirm — Reference Capability With Findings** |
| **Reference Entitlement Resolver Pattern** | Candidate (PP-3) | **Candidate** (unchanged) |
| **PP-1 Identity Pattern** | Deferred | **Deferred** |
| **PP-2 Settings Pattern** | Deferred | **Deferred** |
| **Account Platform composite** | Not assessed | **Not a reference domain** |
| Reference Implementation (L4) | Denied | **Denied** — File Hub only |

Umbrella evaluation **does not promote** reference capabilities — affirms PP-3 ratified reference decisions at composite lens.

---

## #AP-BILL-1 — Reference Billing Platform Pattern

### Runtime evidence (inherited PP-3)

| Criterion | Evidence |
|-----------|----------|
| `billingService` facade | Single lifecycle entry point |
| Checkout → entitlement sync | `upsertSubscriptionFromCheckout` + cache |
| Webhook security | Raw body, signature, documented ops URL |
| API convergence | `/api/billing` canonical; 410 retirement |
| PE + activity | Platform lifecycle mutations |
| Client library | `web/src/api/billing.ts` |
| Tests | ~25+ PP-3 scoped + client migration |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Catalog ID** | `#AP-BILL-1` |
| **Rationale** | Strongest copyable billing integration pattern in Account Platform; umbrella eval confirms cross-domain integration with entitlements |
| **Open findings on reference** | M02, M05, M07, ACC-01 (via AP-UMB roll-up) |

### What prevents plain Reference Capability

| Blocker | Finding |
|---------|---------|
| Modal-only billing UX | M02 |
| Invoice activity gap | M05 |
| Module commerce PE | M07 |
| Tier vocabulary | ACC-01 |

---

## Reference Entitlement Resolver Pattern

| Field | Value |
|-------|-------|
| **Outcome** | **Candidate** |
| **Rationale** | `entitlementService.resolveTier()` proven; bundled with `#AP-BILL-1`; promote after tier migration |
| **Umbrella eval note** | Billing → entitlement sync validated in cross-cut matrix |

---

## PP-1 / PP-2 pattern references

| Pattern | Outcome | Rationale |
|---------|---------|-----------|
| Identity substrate | **Deferred** | Service layer strong; MFA gap; no standalone teaching pattern yet |
| Settings orchestration | **Deferred** | PP-2 at 26/27 — candidate for future pattern council; not required at umbrella cert |

---

## Explicit denials

| Designation | Reason |
|-------------|--------|
| Account Platform as Reference Domain | Composite program — not a copyable module pattern |
| Reference Implementation (L4) | File Hub remains sole L4 |
| Plain Reference Capability (#AP-BILL-1) | Open majors on billing pattern |

---

## Council action (if ratified)

| Action | Owner | Status |
|--------|-------|--------|
| Affirm `#AP-BILL-1` Reference Capability With Findings | Reference council / catalog PR | Recommend — separate from cert ledger |
| Defer identity/settings patterns | Umbrella pattern council | Unchanged |
| Deny L4 for Account Platform | Constitutional | Affirmed |

**Catalog update:** Not performed in this evaluation.

---

**Last updated:** 2026-06-20 (Umbrella Certification Evaluation)
