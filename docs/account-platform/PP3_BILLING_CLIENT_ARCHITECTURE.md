# PP-3 — Billing Client Architecture

**Program:** Account Platform — PP-3 Phase 3  
**Date:** 2026-06-20  
**Status:** Implemented

---

## Design

All browser billing operations flow through **`web/src/api/billing.ts`** using **`authenticatedApiCall`** (Next.js API proxy). No direct backend URL fetch; no `/api/payment` paths.

```mermaid
flowchart LR
  UI[React components]
  BC[billing.ts]
  Proxy[Next.js /api proxy]
  Bill[/api/billing/*]
  BS[billingController / billingService]

  UI --> BC
  BC --> Proxy
  Proxy --> Bill
  Bill --> BS
```

---

## Module layout

| Module | Responsibility |
|--------|----------------|
| `web/src/api/billing.ts` | Canonical typed client |
| `web/src/lib/stripe.ts` | Stripe.js loader, amount formatters, error helpers; thin billing delegates |
| `web/src/api/payment.ts` | **Deprecated** — re-exports billing for backward compatibility |

---

## API surface (`billing.ts`)

### Platform subscriptions

| Function | Route |
|----------|-------|
| `getUserSubscription()` | `GET /api/billing/subscriptions/user` |
| `getSubscription(id)` | `GET /api/billing/subscriptions/:id` |
| `createPlatformSubscription()` | `POST /api/billing/subscriptions` |
| `updatePlatformSubscription()` | `PUT /api/billing/subscriptions/:id` |
| `cancelPlatformSubscription()` | `DELETE /api/billing/subscriptions/:id` |
| `reactivatePlatformSubscription()` | `POST /api/billing/subscriptions/:id/reactivate` |

### Checkout

| Function | Route |
|----------|-------|
| `createCheckoutSession()` | `POST /api/billing/checkout/session` |

### Module subscriptions

| Function | Route |
|----------|-------|
| `subscribeModule(moduleId, tier)` | `POST /api/billing/modules/:moduleId/subscribe` |
| `getUserModuleSubscriptions()` | `GET /api/billing/modules/subscriptions` |
| `getModuleSubscriptionById(id)` | `GET /api/billing/modules/subscriptions/:id` |
| `cancelModuleSubscription(id)` | `DELETE /api/billing/modules/subscriptions/:id` |

### Payment methods

| Function | Route |
|----------|-------|
| `listPaymentMethods()` | `GET /api/billing/payment-methods` |
| `createSetupIntent()` | `POST /api/billing/payment-methods/setup-intent` |
| `deletePaymentMethod(id)` | `DELETE /api/billing/payment-methods/:id` |
| `createCustomerPortalSession()` | `POST /api/billing/customer-portal` |

### One-off charges

| Function | Route |
|----------|-------|
| `createPaymentIntent()` | `POST /api/billing/intent` |

### Usage & invoices

| Function | Route |
|----------|-------|
| `getBillingUsage()` | `GET /api/billing/usage` |
| `getInvoices()` | `GET /api/billing/invoices` |

---

## Adoption pattern

**Preferred:** import from `web/src/api/billing.ts`

```typescript
import { subscribeModule, createCheckoutSession } from '@/api/billing';
```

**Inline `authenticatedApiCall`** in billing modals remains valid; future waves may consolidate into `billing.ts`.

**Do not:** add new `/api/payment` calls or direct `fetch` to backend billing URLs.

---

## Server alignment

| Client path | Server handler |
|-------------|----------------|
| `/api/billing/intent` | `paymentController.createPaymentIntent` (shared handler) |
| Subscription lifecycle | `billingController` → `billingService` |
| Module subscribe | `billingController.createModuleSubscription` |

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
