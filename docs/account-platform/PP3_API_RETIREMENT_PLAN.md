# PP-3 — API Retirement Plan

**Program:** Account Platform — PP-3 Phase 3  
**Date:** 2026-06-20  
**Status:** **Phase 2–3 complete** (client + JWT route retirement)

---

## Retirement phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** (Package 2) | Deprecation headers; cancel/resume delegation | ✅ |
| **2** (Phase 3) | Client migration to `/api/billing`; `billing/intent` | ✅ |
| **3** (Phase 3) | JWT `/api/payment` routes → 410 Gone | ✅ |
| **4** (future) | Unmount payment router; webhook path optional rename | ⏳ |

---

## Route retirement matrix

| Legacy route | Canonical successor | Client migrated | Server status |
|--------------|---------------------|-----------------|---------------|
| `POST /api/payment/intent` | `POST /api/billing/intent` | ✅ | **410 Gone** |
| `POST /api/payment/subscription` | `POST /api/billing/subscriptions` or module subscribe | ✅ | **410 Gone** |
| `DELETE /api/payment/subscription/:id` | `DELETE /api/billing/subscriptions/:id` | ✅ | **410 Gone** |
| `POST /api/payment/subscription/:id/reactivate` | `POST /api/billing/subscriptions/:id/reactivate` | ✅ | **410 Gone** |
| `GET /api/payment/methods` | `GET /api/billing/payment-methods` | ✅ | **410 Gone** |
| `POST /api/payment/webhook` | Same (Stripe dashboard URL) | N/A | **Active** — `index.ts` mount |

---

## 410 response shape

```json
{
  "error": "This /api/payment endpoint has been retired. Use the canonical /api/billing API.",
  "retired": true,
  "successor": "/api/billing/...",
  "documentation": "/api/billing"
}
```

Middleware: `server/src/middleware/paymentRouteRetired.ts`

---

## Compatibility guarantees (Phase 3)

| Guarantee | Status |
|-----------|--------|
| Web clients do not call legacy subscription routes | ✅ |
| `payment.ts` deprecated wrappers call billing client | ✅ |
| Webhook URL unchanged for Stripe dashboard | ✅ |
| Billing modals unchanged (already canonical) | ✅ |

---

## Future Phase 4 (not authorized)

| Action | Risk | Prerequisite |
|--------|------|--------------|
| Remove `paymentRouter` mount from `index.ts` | Low if 410-only | Monitor 410 logs zero |
| Move webhook to `/api/billing/webhook` | Stripe dashboard update | Council + ops runbook |
| Delete `paymentController` subscription handlers | Cleanup | Phase 4 |

---

## Findings impact

| Finding | Expected closure |
|---------|------------------|
| **PP3-F03** | **Closed** — no production client dual API |
| **PP3-F12** | **Closed** — `payment.ts` delegates to billing |

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
