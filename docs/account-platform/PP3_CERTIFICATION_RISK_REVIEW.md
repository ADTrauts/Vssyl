# PP-3 — Certification Risk Review

**Program:** Account Platform — PP-3 Certification Evaluation Authorization Review  
**Date:** 2026-06-20  
**Type:** Governance risk assessment — no evaluation executed

---

## Risk summary

| Tier | Count | Eval impact |
|------|-------|-------------|
| **Critical** | 0 | — |
| **High** | 1 | F08 UX — manageable at WITH FINDINGS |
| **Medium** | 4 | F02, Stripe ops, module commerce, evaluator interpretation |
| **Low** | 6+ | Advisories, orphan file, docs gaps |

**Overall certification risk posture:** **Acceptable** for L3 WITH FINDINGS entry.

---

## A. Billing lifecycle risks

| Risk | Likelihood | Impact | Mitigation | Residual |
|------|------------|--------|------------|----------|
| Unauthorized subscription mutation | Low | High | `billing:write` PE on owner | Low |
| Activity gap on failed authZ | Low | Medium | No emit on failure — contract compliant | Low |
| Checkout → entitlement desync | Low | High | `upsertSubscriptionFromCheckout` + cache sync | Low |
| Invoice webhook without activity | Medium | Low | F05 partial — documented | Medium |
| Module subscribe without stripeCustomerId | Medium | Medium | Pre-existing edge; server-side create | Medium |

---

## B. Entitlement risks

| Risk | Likelihood | Impact | Mitigation | Residual |
|------|------------|--------|------------|----------|
| Tier read from stale `Business.tier` | Low | High | `resolveTier` canonical; cache sync on writes | Low |
| Admin override bypass | Low | High | F04 closed — `setBusinessTierAuthority` | Low |
| HR matrix diverges from catalog | Low | Medium | F07 by design — document boundary | Low |
| Orphan gating file reintroduced | Very low | Low | F09 — file unused, no imports | Low |
| `normalizeTier` misses edge enum | Medium | Medium | F02 partial — validators still mixed | Medium |

---

## C. Tier authority risks

| Risk | Status |
|------|--------|
| Dual SoR (`Subscription` vs `Business.tier`) | **Closed** — write authority on Subscription |
| Consumer bypass of resolver | **Low** — primary paths aligned |
| Data migration debt | **Medium** — legacy rows may exist; F02 |
| Checkout `pro` vs API `standard` | **Medium** — F11 advisory overlap |

---

## D. Stripe dependency risks

| Risk | Likelihood | Impact | Notes |
|------|------------|--------|-------|
| Webhook URL on `/api/payment/webhook` | — | Low | Ops convention; not API drift |
| Webhook signature failure | Low | High | Raw body + secret — tested |
| Stripe dashboard misconfiguration | Medium | High | External ops — out of code scope |
| Stripe API version drift | Low | Medium | Version pinned in service |
| Revenue-critical outage | Low | Critical | Standard third-party dependency |

**Certification note:** Stripe depth supports **reference billing pattern** advisory post-award — not a risk, an asset.

---

## E. Billing UX risks

| Risk | Finding | Severity | Eval disposition |
|------|---------|----------|------------------|
| No standalone billing dashboard | F08 | **Major** | **Accepted WITH FINDINGS** |
| Modal-only subscription management | F08 | Major | Functional; not blocking award |
| Settings hub fragmentation (billing tab) | PP-2 scope | Medium | Cross-program; pre-brief |
| Product trial UX missing | F10 | Advisory | Stripe trialing only |
| PaymentModal simplified flow | — | Low | Now uses canonical `subscribeModule` |

**G9 FAIL** is the primary UX certification risk — drives plain L3 ineligibility, not WITH FINDINGS ineligibility.

---

## F. Evaluation risks (process)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Evaluator uses stale Phase 0B matrix | Low | High | Re-audit in packet |
| Evaluator treats F08 as blocking | Medium | Medium | Pre-brief in disposition doc |
| Plain L3 expected by stakeholder | Medium | Medium | Target WITH FINDINGS explicit in authorization |
| Evidence binder insufficient for G6 | Low | Low | Test inventory attached |
| New blocker discovered at eval | Low | High | Standard eval risk — packet comprehensive |

---

## G. Certification outcome risks

| Scenario | Probability | Trigger |
|----------|-------------|---------|
| **L3 WITH FINDINGS awarded** | **~75%** | Expected path |
| NOT CERTIFIABLE | **~10%** | Undiscovered blocker or G9 strict interpretation |
| Deferred re-evaluation | **~10%** | Evaluator requests F08 remediation first |
| Plain L3 | **<5%** | Would require closing F08 + G9 + F02 |

---

## H. Plain L3 blockers (explicit)

| Blocker | ID / Gate |
|---------|-----------|
| No billing dashboard | F08, G9 |
| Tier vocabulary not fully normalized | F02 partial, G8 |
| Invoice webhook activity incomplete | F05 partial, G2 |
| Module subscription PE gap | G1 partial |
| Open major count | F08 |

**Plain L3 is not the authorization target.**

---

## I. L3 WITH FINDINGS blockers

| Potential blocker | Status |
|-------------------|--------|
| Open blocking findings | **None** |
| Implementation incomplete vs charter | **Complete** |
| Matrix re-audit | **Done** |
| Evidence packet | **Ready** |
| Council authorization | **This review recommends AUTHORIZE** |

**No WITH FINDINGS blockers remain** except formal authorization vote (outside this document).

---

## Umbrella certification risk (cross-program)

| Risk | PP-3 contribution |
|------|---------------------|
| PP-3 delays umbrella | **Reduced** — API drift closed |
| Premature umbrella eval | **Still possible** if PP-1/PP-2 not certified |
| Composite advisory inflation | Medium — expect 6–12 cross-program advisories at umbrella |

---

**Last updated:** 2026-06-20 (Evaluation Authorization Review)
