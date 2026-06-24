# Marketplace & Module Ecosystem — Phase 1B-D Closeout

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1B-D — Business Billing Lifecycle Completion  
**Date:** 2026-06-24  
**Status:** **Complete**

---

## 1. Bottom line

Business-scoped module billing now has a **real write path** to `BusinessModuleSubscription`, aligned install/runtime gates, Stripe webhook sync, and admin billing probe. Free partner modules work end-to-end for businesses; paid modules work when Stripe is configured.

---

## 2. Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | BusinessModuleSubscription write path exists | ✅ |
| 2 | Business-scoped entitlement checks correct | ✅ |
| 3 | Free partner business lifecycle works | ✅ |
| 4 | Paid lifecycle functional or documented | ✅ Documented Stripe prerequisites |
| 5 | Runtime respects subscription status | ✅ |
| 6 | Tests pass | ✅ |
| 7 | Documentation updated | ✅ |

---

## 3. Deliverables

### Code
- `server/src/services/businessModuleSubscriptionService.ts`
- Wired: `moduleProvisionController`, `moduleRuntimeController`, `moduleSubscriptionService`, `billingController`
- `server/src/marketplace/businessBillingProbe.ts`
- Admin: `GET /api/admin-portal/modules/:id/business-billing-probe`

### Documentation
- `BUSINESS_BILLING_REALITY_REVIEW.md`
- `BUSINESS_MODULE_BILLING_LIFECYCLE.md`
- Updated lifecycle + Phase 0A/1A summaries

---

## 4. Known remaining gaps

| Gap | Notes |
|-----|-------|
| Developer revenue from `BusinessModuleSubscription` only | Revenue still via paired `ModuleSubscription` |
| Full payout system | Out of scope |
| Stripe price auto-provisioning | Manual / env / `Module.stripePriceId` |

---

**Last updated:** 2026-06-24
