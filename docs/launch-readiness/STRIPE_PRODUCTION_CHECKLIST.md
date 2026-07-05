# Stripe Production Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-07-05 (closure pass)  
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
| S1 | `STRIPE_SECRET_KEY` in Secret Manager (live mode for prod) | ⚠️ **Test mode** (`sk_test_`) — swap to `sk_live_` before real revenue | Operator |
| S2 | `STRIPE_WEBHOOK_SECRET` matches dashboard endpoint | ✅ Recreated endpoint `we_1TptSfI7vbumyzaWQnBIhiFX`; GCP secret v2 (`whsec_`) | Operator |
| S3 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on frontend | ✅ `pk_test_` in Secret Manager | Operator |
| S4 | Webhook URL registered | ✅ Production URL enabled, 7 events | Operator |
| S5 | Price IDs in `PricingConfig` match Stripe Dashboard products | ✅ Production DB synced via Cloud Run Job `stripe-pricing-sync` | Operator |

### Checkout

| # | Item | Code | Live test |
|---|------|------|-----------|
| S6 | Personal Pro checkout | ✅ | ✅ Browser E2E — $49.99/mo |
| S7 | Business Basic checkout | ✅ metadata `businessId` | ✅ Price IDs validated; repeat browser test per release |
| S8 | Business Advanced checkout | ✅ | ✅ Price IDs validated |
| S9 | Return URL `/billing/success` | ✅ | ✅ Browser E2E |
| S10 | Cancel URL `/billing/cancel` | ✅ | ✅ Route exists |
| S11 | Free tier (no checkout) | ✅ | N/A |

### Portal & payment methods

| # | Item | Code | Live test |
|---|------|------|-----------|
| S12 | Customer portal session | ✅ `POST /api/billing/customer-portal` | ✅ Stripe Portal opens from `/billing` |
| S13 | Setup intent / payment methods | ✅ billing routes | ✅ Card 4242 shown on Payment Methods tab |
| S14 | PaymentMethodManager UI | ✅ BillingModal | ✅ |

### Subscription lifecycle

| # | Item | Code | Live test |
|---|------|------|-----------|
| S15 | `checkout.session.completed` handler | ✅ | ✅ Webhook → DB row after period-date + schema fixes |
| S16 | `invoice.payment_succeeded` | ✅ | ✅ Unit tests |
| S17 | `invoice.payment_failed` | ✅ | ✅ Unit tests |
| S18 | `customer.subscription.deleted` | ✅ | ✅ Unit tests |
| S19 | Cancel at period end | ✅ `DELETE /api/billing/subscriptions/:id` | ⚠️ Cancel flow works; UI shows "no active sub" when status=`cancelled` (pre-existing UX) |
| S20 | Reactivate | ✅ `POST .../reactivate` | 🔧 Not re-tested after cancel |
| S21 | Tier upgrade/downgrade | ✅ `PUT /api/billing/subscriptions/:id` | 🔧 |
| S22 | Employee count / seats | ✅ API exists | ⚠️ UI weak |

### Entitlements

| # | Item | Status |
|---|------|--------|
| S23 | `resolveTier({ userId, businessId })` | ✅ |
| S24 | Feature gating middleware | ✅ |
| S25 | Module install tier gate | ✅ |
| S26 | Entitlement cache sync on webhook | ✅ Personal verified |

### Module marketplace billing

| # | Item | Status |
|---|------|--------|
| S27 | Personal module subscribe | ✅ |
| S28 | Business paid module checkout E2E | ⚠️ **Blocker** — code + webhook tests pass; production browser E2E not run |
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
# Automated (API + webhook signature + price alignment)
export STRIPE_SECRET_KEY=$(gcloud secrets versions access latest --secret=stripe-secret-key --project=vssyl-472202)
export STRIPE_WEBHOOK_SECRET=$(gcloud secrets versions access latest --secret=stripe-webhook-secret --project=vssyl-472202)
cd server && pnpm stripe:align-pro && pnpm stripe:sync && pnpm stripe:smoke --probe-webhook
```

**Production DB sync (private Cloud SQL):**

```bash
gcloud run jobs execute stripe-pricing-sync --project=vssyl-472202 --region=us-central1 --wait
```

**Browser E2E (personal — verified 2026-07-05):**

1. Test user → `/billing` → upgrade to Pro (`4242…`)
2. Confirm `/billing/success` redirect
3. Confirm Pro plan on Overview ($49.99/mo)
4. Payment Methods → Stripe Portal opens
5. Cancel subscription → confirm API updates
6. (Business) Create business → Business Basic checkout with `businessId` metadata
7. (Optional) Paid marketplace module — **not verified in browser**

**Reference:** `docs/platform-controller/STRIPE_OPERATIONAL_VALIDATION.md`

---

## Failure recovery

| Scenario | Expected behavior | Verified |
|----------|-------------------|----------|
| Webhook missed | Replay event from Stripe Dashboard or `POST` signed payload | ✅ |
| Invalid webhook secret | Signature verification fails — rotate endpoint secret + update GCP | ✅ Fixed 2026-07-05 |
| Missing DB columns (`lastSyncedAt`) | Webhook upsert fails | ✅ Migration `20260705173000` + Cloud Run job `billing-schema-patch` |
| Stripe API period fields moved | Checkout handler silent failure | ✅ `stripeSubscriptionPeriod.ts` helper |
| Payment failed | `invoice.payment_failed` → status update | ✅ Unit tests |
| Wrong price ID (per-employee) | Checkout charges wrong amount | ✅ Fixed in `syncStripePrices.ts` |

---

## Verdict

**Code readiness:** ✅ ~95%  
**Production readiness (test mode):** ✅ **Ready for controlled beta billing** — personal E2E verified; business paid module browser E2E pending

Do not accept **live-mode** paying customers until S1 uses `sk_live_` and live webhook endpoint is registered.

**Last updated:** 2026-07-05 (closure)
