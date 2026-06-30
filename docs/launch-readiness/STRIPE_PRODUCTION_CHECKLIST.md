# Stripe Production Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30  
**Scope:** Review existing PP-3 billing stack — no redesign

**Prior audit:** [STRIPE_PRODUCTION_VALIDATION.md](../product-readiness/STRIPE_PRODUCTION_VALIDATION.md)

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
| S1 | `STRIPE_SECRET_KEY` in Secret Manager (live mode for prod) | 🔧 Verify | Operator |
| S2 | `STRIPE_WEBHOOK_SECRET` matches dashboard endpoint | 🔧 Verify | Operator |
| S3 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on frontend | 🔧 Verify | Operator |
| S4 | Webhook URL: `https://vssyl-server-.../api/payment/webhook` | 🔧 Verify | Operator |
| S5 | Price IDs in `PricingConfig` match Stripe Dashboard products | 🔧 Verify | Operator |

### Checkout

| # | Item | Code | Live test |
|---|------|------|-----------|
| S6 | Personal Pro checkout | ✅ `createCheckoutSession` | 🔧 |
| S7 | Business Basic checkout | ✅ metadata `businessId` | 🔧 |
| S8 | Business Advanced checkout | ✅ | 🔧 |
| S9 | Return URL `/billing/success` | ✅ | 🔧 |
| S10 | Cancel URL `/billing/cancel` | ✅ | 🔧 |
| S11 | Free tier (no checkout) | ✅ | N/A |

### Portal & payment methods

| # | Item | Code | Live test |
|---|------|------|-----------|
| S12 | Customer portal session | ✅ `POST /api/billing/customer-portal` | 🔧 |
| S13 | Setup intent / payment methods | ✅ billing routes | 🔧 |
| S14 | PaymentMethodManager UI | ✅ BillingModal | 🔧 |

### Subscription lifecycle

| # | Item | Code | Live test |
|---|------|------|-----------|
| S15 | `checkout.session.completed` handler | ✅ | 🔧 |
| S16 | `invoice.payment_succeeded` | ✅ | 🔧 |
| S17 | `invoice.payment_failed` | ✅ | 🔧 |
| S18 | `customer.subscription.deleted` | ✅ | 🔧 |
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
| S28 | Business paid module checkout E2E | ⚠️ Partial |
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

1. Create test user → `/billing` → upgrade to Pro (live test card or live mode small charge)
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
| Payment failed | `invoice.payment_failed` → status update | 🔧 Live test |
| Checkout abandoned | No subscription created | ✅ |
| Duplicate webhook | Idempotent upsert | ⚠️ Review handlers |

---

## Verdict

**Code readiness:** ✅ ~85%  
**Production readiness:** 🔧 **Operator verification required**

Do not accept paying customers until S1–S5 and S6–S18 live smoke tests pass.
