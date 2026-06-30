# Stripe Production Validation

**Program:** Commercial Readiness Sprint 1  
**Date:** 2026-06-30  
**Scope:** Code-path audit — live Stripe keys not verified in this sprint

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Checkout sessions | **Working** | `POST /api/billing/checkout/session` |
| Webhooks | **Working** | `POST /api/payment/webhook` (raw body) |
| Subscription sync | **Working** | `stripeSyncService.ts` |
| Pricing synchronization | **Working** | `pricingService.ts` + admin seed/sync |
| Personal subscriptions | **Working** | `Subscription` user-scoped |
| Business subscriptions | **Working** | `businessId` in checkout metadata |
| Module subscriptions | **Partial** | Personal E2E strong; business paid module E2E gaps remain |
| Entitlements | **Working** | `entitlementService.ts` |
| Feature gating | **Working** | `featureGatingService.ts` + middleware |
| Upgrade flows | **Working** | `UpgradeFlow.tsx` + checkout/update |
| Cancellation | **Working** | `DELETE /api/billing/subscriptions/:id` |
| Billing portal | **Working** | `POST /api/billing/customer-portal` |
| Free trials | **Missing** | No `trial_period_days` in checkout; marketing copy aligned in Sprint 1 |
| Coupons | **Missing** | Not implemented |
| Developer payouts (Connect) | **Missing** | Ledger only |
| Production key verification | **Partial** | Operator manual per `STRIPE_OPERATIONAL_VALIDATION.md` |

---

## Working (preserve)

### Checkout

- **Route:** `POST /api/billing/checkout/session` (`server/src/routes/billing.ts`)
- **Service:** `stripeService.ts` — creates Stripe Checkout with `PricingConfig.stripePriceId`
- **Frontend:** `UpgradeFlow.tsx`, `BillingModal.tsx` — redirects to Stripe hosted checkout
- **Return URLs:** `/billing/success`, `/billing/cancel`

### Webhooks

- **Route:** `POST /api/payment/webhook` (`server/src/index.ts` — raw body parser)
- **Handler:** `paymentService.ts` / webhook handlers — `invoice.payment_succeeded`, `checkout.session.completed`, subscription lifecycle events
- **Tests:** `stripe-webhook.integration.test.ts`

### Subscription lifecycle

- Create, read, update tier, cancel, reactivate via `subscriptionService.ts` / `billingService.ts`
- **Facade pattern:** authorize → execute → emit on mutations

### Entitlements & gating

- `resolveTier({ userId, businessId })` authoritative order documented in PP-3
- HR/scheduling middleware uses feature gating

### Customer portal

- `PaymentMethodManager.tsx` → `POST /api/billing/customer-portal`

### Sprint 1 UX fix

- **`/billing` hub** — canonical destination for all billing deep links (`web/src/app/billing/page.tsx`)
- **`/billing/upgrade`** — redirects to `/billing?upgrade=business_advanced&tab=plans`

---

## Partial

| Item | Gap | Recommendation |
|------|-----|----------------|
| Business module paid checkout | Install gate exists; checkout E2E incomplete | Sprint 2 |
| Invoice PDF / hosted link | List in modal only | Sprint 3 |
| Seat billing UI | API `PUT .../employee-count` exists | Sprint 2 |
| Tier vocabulary `standard` | Legacy in some billing routes | Deprecate alias to `pro` |
| Production Stripe keys | Requires operator smoke test | Run `STRIPE_OPERATIONAL_VALIDATION.md` checklist |
| Checkout success page | Client-side only verification | Optional server verify session |

---

## Missing (not blockers for Sprint 1)

- Stripe trial periods in checkout
- Promotion codes / coupons
- Stripe Connect for developer payouts
- Business-scoped invoice list API

---

## Recommended improvements (priority)

1. **Operator:** Run live webhook + checkout smoke test in production/staging
2. **Sprint 2:** Business paid module subscription checkout E2E
3. **Sprint 2:** Seat count UI wired to existing API
4. **Sprint 3:** Stripe trials OR keep honest copy (Sprint 1 chose honest copy)
5. **Sprint 3:** Stripe Connect for partner payouts

---

## Evidence index

| Artifact | Path |
|----------|------|
| Billing routes | `server/src/routes/billing.ts` |
| Stripe service | `server/src/services/stripeService.ts` |
| Sync | `server/src/services/stripeSyncService.ts` |
| PP-3 model | `docs/account-platform/PP3_BILLING_SERVICE_MODEL.md` |
| Prior audit | `docs/platform-controller/STRIPE_OPERATIONAL_VALIDATION.md` |
| Billing hub | `web/src/app/billing/page.tsx` |

---

*Code audit only — live payment verification is an operator task.*
