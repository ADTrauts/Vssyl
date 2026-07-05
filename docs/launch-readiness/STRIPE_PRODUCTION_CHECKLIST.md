# Stripe Production Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-07-05 (updated after smoke test)  
**Scope:** Review existing PP-3 billing stack — no redesign

**Prior audit:** [STRIPE_PRODUCTION_VALIDATION.md](../product-readiness/STRIPE_PRODUCTION_VALIDATION.md)  
**Smoke test results:** [STRIPE_LIVE_SMOKE_TEST_RESULTS.md](./STRIPE_LIVE_SMOKE_TEST_RESULTS.md)

---

## Architecture (preserve)

```
UpgradeFlow / BillingModal
  → POST /api/billing/checkout/session
  → Stripe Hosted Checkout
  → POST /api/payment/webhook (raw body)
  → stripeService.handleWebhook + ModuleSubscriptionService
  → billingService / stripeSyncService
  → entitlementService.syncEntitlementCacheFromSubscription
```

---

## Checklist

### Environment & secrets

| # | Item | Status | Owner |
|---|------|--------|-------|
| S1 | `STRIPE_SECRET_KEY` in Secret Manager (live mode for prod) | ⚠️ **Test mode** (`sk_test_`) in GCP — swap to `sk_live_` before real revenue | Operator |
| S2 | `STRIPE_WEBHOOK_SECRET` matches dashboard endpoint | ✅ Signed probe → HTTP 200 (2026-07-05) | Operator |
| S3 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on frontend | ✅ `pk_test_` in Secret Manager | Operator |
| S4 | Webhook URL: `https://vssyl-server-.../api/payment/webhook` | ✅ `we_1SlA9xI7vbumyzaWrcIsXRpn` enabled | Operator |
| S5 | Price IDs in `PricingConfig` match Stripe Dashboard products | ⚠️ Sync bug fixed — **run `pnpm stripe:sync` on production DB** | Operator |

### Checkout

| # | Item | Code | Live test |
|---|------|------|-----------|
| S6 | Personal Pro checkout | ✅ `createCheckoutSession` | ⚠️ Pro DB ($39) ≠ Stripe ($49.99) |
| S7 | Business Basic checkout | ✅ metadata `businessId` | ✅ Price IDs validated after sync fix |
| S8 | Business Advanced checkout | ✅ | ✅ Price IDs validated after sync fix |
| S9 | Return URL `/billing/success` | ✅ | 🔧 Browser E2E pending |
| S10 | Cancel URL `/billing/cancel` | ✅ | 🔧 Browser E2E pending |
| S11 | Free tier (no checkout) | ✅ | N/A |

### Portal & payment methods

| # | Item | Code | Live test |
|---|------|------|-----------|
| S12 | Customer portal session | ✅ `POST /api/billing/customer-portal` | 🔧 Browser E2E pending |
| S13 | Setup intent / payment methods | ✅ billing routes | 🔧 |
| S14 | PaymentMethodManager UI | ✅ BillingModal | 🔧 |

### Subscription lifecycle

| # | Item | Code | Live test |
|---|------|------|-----------|
| S15 | `checkout.session.completed` handler | ✅ | 🔧 No recent Stripe events |
| S16 | `invoice.payment_succeeded` | ✅ | ✅ Unit tests |
| S17 | `invoice.payment_failed` | ✅ | ✅ Unit tests |
| S18 | `customer.subscription.deleted` | ✅ | ✅ Unit tests |
| S19 | Cancel at period end | ✅ `DELETE /api/billing/subscriptions/:id` | 🔧 |
| S20 | Reactivate | ✅ `POST .../reactivate` | 🔧 |
| S21 | Tier upgrade/downgrade | ✅ `PUT /api/billing/subscriptions/:id` | 🔧 |
| S22 | Employee count / seats | ✅ API exists | ⚠️ UI weak |

### Entitlements

| # | Item | Status |
|---|------|--------|
| S23 | `resolveTier({ userId, businessId })` | ✅ |
| S24 | Feature gating middleware | ✅ |
| S25 | Module install tier gate | ✅ |
| S26 | Entitlement cache sync on webhook | ✅ |

### Module marketplace billing

| # | Item | Status |
|---|------|--------|
| S27 | Personal module subscribe | ✅ |
| S28 | Business paid module checkout E2E | ⚠️ Code + webhook tests pass; browser E2E pending |
| S29 | Module webhook via `ModuleSubscriptionService` | ✅ |

### Known gaps (not blockers for free-tier beta)

| Item | Status |
|------|--------|
| Stripe trials (`trial_period_days`) | ❌ Not implemented — copy honest |
| Promotion codes | ❌ |
| Stripe Connect developer payouts | ❌ Ledger only |
| Invoice PDF download | ⚠️ List in modal only |

---

## Operator smoke test script

```bash
# Automated (API + webhook signature)
export STRIPE_SECRET_KEY=$(gcloud secrets versions access latest --secret=stripe-secret-key --project=vssyl-472202)
export STRIPE_WEBHOOK_SECRET=$(gcloud secrets versions access latest --secret=stripe-webhook-secret --project=vssyl-472202)
cd server && pnpm stripe:sync && pnpm stripe:smoke --probe-webhook
```

**Browser E2E (still required):**

1. Create test user → `/billing` → upgrade to Pro (Stripe test card `4242…`)
2. Confirm redirect to `/billing/success`
3. Confirm subscription row in DB + entitlement tier = `pro`
4. Stripe Dashboard → verify webhook delivery 200
5. Cancel subscription → confirm `cancelAtPeriodEnd`
6. Open customer portal → confirm manage payment method
7. (Business) Create business → upgrade Business Basic with `businessId` in session metadata
8. (Optional) Install paid marketplace module → verify module subscription webhook

**Reference:** `docs/platform-controller/STRIPE_OPERATIONAL_VALIDATION.md`

---

## Failure recovery

| Scenario | Expected behavior | Verified |
|----------|-------------------|----------|
| Webhook missed | Manual sync via admin or `syncSubscription` | ⚠️ Admin path exists |
| Payment failed | `invoice.payment_failed` → status update | ✅ Unit tests |
| Checkout abandoned | No subscription created | ✅ |
| Duplicate webhook | Idempotent upsert | ⚠️ Review handlers |
| Wrong price ID (per-employee) | Checkout charges wrong amount | ✅ **Fixed** in `syncStripePrices.ts` (2026-07-05) |

---

## Verdict

**Code readiness:** ✅ ~90% (sync bug fixed)  
**Production readiness:** ⚠️ **Partial** — webhook infra verified; test keys only; pro price drift; browser E2E pending

Do not accept **live-mode** paying customers until S1 uses `sk_live_`, S5 prod DB sync complete, pro price aligned, and browser E2E passes.

**Last updated:** 2026-07-05
