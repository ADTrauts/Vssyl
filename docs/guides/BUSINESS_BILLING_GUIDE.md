# Business Billing Guide (Partners)

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Status:** Implemented Phase 1B-D

---

## 1. Purpose

Business-scoped modules use **`BusinessModuleSubscription`** for entitlement. Free modules get an automatic subscription row on install. Paid modules require Stripe subscription before install/runtime.

---

## 2. Requirements

| Module type | Partner action |
|-------------|----------------|
| **Free** (`pricingTier: free`) | Declare free tier; ensure business install path works |
| **Paid** (`pricingTier: premium` or `enterprise`) | Configure Stripe price; document subscribe flow for business admins |

**Scope:** Business billing applies when `moduleScope` is `business` or `both` and install scope is `business`.

---

## 3. Submission / module metadata

At submit time (top-level submission JSON):

```json
{
  "pricingTier": "free",
  "name": "Asset Register",
  "manifest": { "moduleScope": "business", ... }
}
```

For paid modules (operator-assisted setup):

- Platform stores `Module.stripePriceId` or env `STRIPE_MODULE_PRICE_{MODULE_ID}_{TIER}`
- Stripe must be configured in target environment

---

## 4. Lifecycle

### Free business module

```
Business admin installs module (scope=business)
  → BusinessModuleInstallation created
  → ensureFreeBusinessModuleSubscription (tier=free, status=active)
  → Runtime + delegates allowed when other gates pass
```

### Paid business module

```
Business admin POST /api/billing/modules/:moduleId/subscribe { tier, businessId }
  → Stripe subscription (when configured)
  → BusinessModuleSubscription upserted
  → Install allowed
  → Runtime returns 402 if subscription lapses
```

---

## 5. Entitlement checks

Platform function: `evaluateBusinessModuleEntitlement`

Denies when:

- Module not `APPROVED`
- Not installed for business
- User not active business member
- Paid module without active subscription
- `moduleScope` incompatible with business install

Partners do **not** implement this — but must **not assume** install alone skips subscription for paid tiers.

---

## 6. Certification / readiness

| Surface | Who validates |
|---------|---------------|
| Structural certification | Validator + admin |
| Billing probe | Admin `GET .../business-billing-probe` |
| Readiness card | `businessBilling.applicable`, `scopeCompatible` |

No separate manifest block for billing today — **`moduleScope` + `pricingTier`** drive behavior.

---

## 7. Common mistakes

| Mistake | Result |
|---------|--------|
| `moduleScope: personal` but target business customers | Wrong marketplace; install failures |
| Paid tier without Stripe setup | Subscribe API errors in production |
| Assume publish grants business access | Still requires business install + entitlement |
| Proprietary flag confusion | Review with operator for pricing model |

---

## 8. Pilot recommendation

First external pilot: **`pricingTier: free`** to isolate delegate validation from Stripe configuration.

---

## 9. Related docs

- [BUSINESS_MODULE_BILLING_LIFECYCLE.md](../marketplace/BUSINESS_MODULE_BILLING_LIFECYCLE.md)
- [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md)
- [PARTNER_OPERATOR_RUNBOOK.md](../marketplace/PARTNER_OPERATOR_RUNBOOK.md)

**Last updated:** 2026-06-24
