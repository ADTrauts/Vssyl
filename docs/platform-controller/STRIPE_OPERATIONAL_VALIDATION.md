# Stripe Operational Validation

**Phase:** Platform Controller 1E  
**Date:** 2026-06-25

---

## 1. Production configuration (verified)

From `cloudbuild.yaml` deploy step and live `gcloud run services describe vssyl-server`:

| Secret / env | Purpose | Mounted |
|--------------|---------|---------|
| `STRIPE_SECRET_KEY` | API calls | ✅ Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | ✅ Secret Manager |
| `NODE_ENV=production` | Runtime mode | ✅ |
| `FRONTEND_URL=https://vssyl.com` | Checkout return URLs | ✅ |

`server/src/config/stripe.ts` logs key prefix at startup in production (`sk_test_` vs `sk_live_`) — operators should confirm in Cloud Run logs after deploy.

---

## 2. Component validation

### 2.1 Customer creation

| Item | Detail |
|------|--------|
| **Paths** | `StripeService.createCustomer`, `paymentController.createPaymentIntent`, `paymentService`, `aiQueryService` |
| **Persistence** | `User.stripeCustomerId` |
| **PC visibility** | Stripe customer URL on billing rows when ID present |
| **Tests** | `billingService.test.ts` (mocked) |
| **Live prod** | Not enumerated (no Stripe API call from audit) |
| **Status** | **Working** (code); **Needs Manual Stripe Verification** (customer rows in Dashboard) |

### 2.2 Checkout session

| Item | Detail |
|------|--------|
| **Handler** | `StripeService.createCheckoutSession` → `handleCheckoutSessionCompleted` |
| **Metadata required** | `userId`, `tier`, optional `businessId` |
| **DB write** | `upsertSubscriptionFromCheckout` → `Subscription` + entitlement cache |
| **Live prod** | Not executed |
| **Status** | **Working** (code) |

### 2.3 Subscription creation (tier)

| Item | Detail |
|------|--------|
| **Tables** | `subscriptions` |
| **Stripe link** | `stripeSubscriptionId`, `stripeCustomerId` |
| **Amount in PC** | Phase 1D: from `stripeMetadata.items` after `StripeSyncService` sync |
| **Without sync** | `amountStatus: unknown`, UI **Unavailable** (not false $0) |
| **Status** | **Partially Working** in prod until sync/webhook populates metadata |

### 2.4 Webhook receipt

| Item | Detail |
|------|--------|
| **URL** | `POST /api/payment/webhook` (raw body, `index.ts`) |
| **Auth** | Stripe signature only |
| **Handler** | `paymentController.handleWebhook` → `StripeService.handleWebhookEvent` |
| **Module subs** | Delegates to `ModuleSubscriptionService.handleStripeWebhook` |
| **Live probe** | `400` without signature — proves route + secrets loaded (not misconfigured as 401) |
| **Tests** | `stripe-webhook.integration.test.ts`, `stripeWebhookBilling.test.ts` |
| **Status** | **Working** (route + handler); **Needs Manual Stripe Verification** (delivery log in Dashboard) |

### 2.5 Subscription metadata sync

| Item | Detail |
|------|--------|
| **Service** | `StripeSyncService.syncSubscriptionFromStripe` |
| **Writes** | status, periods, `stripeMetadata.items[]` with per-item `amount` |
| **Admin** | `POST /api/admin-portal/billing/subscriptions/:id/sync`, `sync-all` |
| **Status** | **Working** (code); operator must run for historical subs |

### 2.6 Amount display (post–1D)

| Scenario | API | UI |
|----------|-----|-----|
| Free tier | `amount: 0`, `amountStatus: free` | **Free** |
| Known Stripe items | Sum of metadata | `$X.XX` |
| Unknown | `amount: null`, `amountStatus: unknown` | **Unavailable** |
| Free module (`moduleSubscription.amount === 0`) | `resolveModuleSubscriptionAmount` | **Free** |

### 2.7 Module subscriptions (marketplace)

| Item | Detail |
|------|--------|
| **Personal paid** | `moduleSubscription` + Stripe subscription / payment intent |
| **Business paid** | `moduleSubscription` **and** `businessModuleSubscription` upsert |
| **Business free** | `businessModuleSubscription` only (`ensureFreeBusinessModuleSubscription`) |
| **Webhook** | Updates both tables via `updateBusinessModuleSubscriptionStatusByStripeId` |
| **PC billing list** | Tier subs on subscriptions tab; module revenue in aggregates — see marketplace doc |
| **Status** | **Partially Working** — dual-table consistency is ops concern |

### 2.8 StripeSyncService

| Method | Behavior | Verified |
|--------|----------|----------|
| `syncSubscriptionFromStripe` | Retrieves Stripe sub, maps status, stores item amounts in metadata | Code |
| `syncInvoiceFromStripe` | Updates `invoice` row | Code |
| `syncAllSubscriptions` | Batch admin sync | Code |
| URL helpers | Dashboard links on billing UI | Code |

Requires `isStripeConfigured()` — fails fast if secret missing.

---

## 3. Feature table

| Feature | Page | API | Data source | Status | Risk | Recommended action |
|---------|------|-----|-------------|--------|------|-------------------|
| Customer create | (product) | payment routes | Stripe + User | Working / manual | Low | Dashboard sample |
| Checkout | (product) | Stripe Checkout | Stripe | Working (code) | Medium | Test purchase |
| Tier webhook | infra | `/api/payment/webhook` | Stripe | Working (route) | High | Dashboard webhook config |
| Invoice webhook | infra | same | `invoice` table | Working (code) | High | Reconcile invoice count |
| PC subscription list | billing | `/billing/subscriptions` | `subscription` + metadata | Partially Working | Medium | Sync-all in prod |
| PC sync button | billing | `POST .../sync` | Stripe API | Working (code) | Low | Operator runbook |
| Module sub webhook | infra | same | `moduleSubscription` | Working (code) | Medium | Test module purchase |
| Business sub webhook | infra | same | `businessModuleSubscription` | Working (code) | High | Verify dual write |
| Developer payouts | billing | `/billing/payouts` | `developerRevenue` | Partially Working | High | Reconcile deltas (G-009) |

---

## 4. Manual Stripe verification steps

1. Stripe Dashboard → Developers → Webhooks → confirm endpoint and recent `200` deliveries.
2. Pick one production `Subscription` with `stripeSubscriptionId` → compare status to Stripe.
3. In Platform Controller billing → **Sync all** → confirm amounts change from Unavailable to dollar values.
4. Confirm `STRIPE_SECRET_KEY` mode (test vs live) matches intended environment.

---

**Last updated:** 2026-06-25
