# PP-3 — Reference Review (Certification Evaluation)

**Program:** Account Platform — PP-3 Certification Evaluation  
**Date:** 2026-06-20  
**Authority:** Reference capability assessment — **no catalog or ledger updates**  
**Prior baseline:** [PP3_BILLING_ENTITLEMENTS_CERTIFICATION_READINESS.md](./PP3_BILLING_ENTITLEMENTS_CERTIFICATION_READINESS.md)

---

## Assessment summary

| Capability | Pre-PP-3 status | Post-eval recommended status |
|------------|-----------------|------------------------------|
| **Reference Billing Pattern** (Stripe + lifecycle) | Candidate (medium confidence) | **Reference Capability With Findings** ⬆ |
| **Reference Entitlement Resolver Pattern** | Not assessed | **Candidate** |
| Reference Implementation (L4) | Denied | **Denied** |
| Reference Domain (whole PP-3) | Denied | **Denied** |

---

## Reference Billing Pattern — Stripe integration + lifecycle

### Runtime evidence

| Criterion | Evidence |
|-----------|----------|
| `billingService` facade | Single lifecycle entry point |
| Checkout → entitlement sync | `upsertSubscriptionFromCheckout` + cache |
| Webhook security | Raw body, signature, no JWT |
| API convergence | `/api/billing` canonical; 410 retirement |
| PE + activity | Platform lifecycle mutations |
| Client library | `web/src/api/billing.ts` |
| Tests | billingService, webhook, client migration |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Rationale** | Copyable Stripe + subscription + entitlement sync pattern proven in production code; open majors F08/F05 prevent plain Reference Capability |
| **Teaching value** | `billingService` facade; checkout webhook → entitlement cache; API retirement with 410; canonical client migration |

### What prevents plain Reference Capability

| Blocker | Finding |
|---------|---------|
| Modal-only billing UX | F08 |
| Invoice activity gap | F05 |
| Module commerce PE gap | PP3-EVAL-F01 |
| Tier vocabulary drift | F02 partial |

### Council action (if ratified)

Recommend catalog entry as **Reference Capability With Findings — Billing Platform Pattern** pending separate reference vote per `REFERENCE_MODULE_CATALOG` process.

---

## Reference Entitlement Resolver Pattern

### Runtime evidence

| Criterion | Evidence |
|-----------|----------|
| `entitlementService.resolveTier` | Canonical read path |
| `Subscription.tier` SoR | Enforced on writes |
| Consumer alignment | featureGating, middleware, AI, usage |
| Admin authority | PE + activity + domain events |
| Read APIs | `/api/account/entitlements`, `/tier`, `/effective` |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Candidate** |
| **Rationale** | Strong resolver pattern; bundled with billing cert; promote after F02 closure |
| **Teaching value** | Single tier resolver; cache model; normalizeTier boundaries |

---

## Explicit denials

| Designation | Reason |
|-------------|--------|
| **Reference Implementation (L4)** | File Hub only — platform policy |
| **Reference Domain (PP-3 whole)** | G9 FAIL; open majors; mixed UX/backend maturity |
| **UX Reference slot** | F08 — no billing dashboard |

---

## Comparison to certified programs

| Program | Score | Reference outcome | PP-3 comparison |
|---------|------:|-------------------|-----------------|
| Business Operations | 24/27 | L3 WITH FINDINGS | PP-3 at 23/27 — comparable |
| Reference Workspace | 23/27 | L3 WITH FINDINGS | PP-3 stronger on API coherence |
| Context Graph | 24/27 | Reference Capability With Findings (#CG-1, #CG-2) | PP-3 billing pattern similar teaching value |

---

## Reference recommendation summary

| # | Question | Answer |
|---|----------|--------|
| 8 | Reference candidate status? | **Reference Billing Pattern — Reference Capability With Findings** |
| Plain reference? | No — open majors |
| Entitlement resolver? | **Candidate** — defer promotion |
| Catalog update? | **Not in this evaluation** — separate council vote |

---

**Last updated:** 2026-06-20 (Certification Evaluation)
