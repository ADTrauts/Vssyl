# Launch Readiness Assessment

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-07-05 (Stripe closure pass)  
**Method:** Code-path trace + production URL probes + Stripe API smoke test + production browser E2E + test suite

---

## Executive question

**Would you allow 20 businesses to begin using Vssyl next week?**

| Scenario | Answer |
|----------|--------|
| **Controlled early beta** (operator verifies SMTP + Stripe test-mode billing; named cohort; support SLA; known limitations documented) | **Yes** |
| **Self-serve public launch** (no operator smoke tests; no support staffing; live Stripe) | **No** |

---

## Launch Readiness score

### **74%**

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Customer journey completeness | 25% | 80% | Onboarding strong; personal billing E2E verified |
| Production verification | 20% | 68% | SMTP ✅; Stripe test-mode E2E ✅; schema drift patched |
| Billing & commercial | 15% | 85% | Prod price sync; Pro $49.99 aligned; webhook + checkout verified |
| Operations & infra | 15% | 70% | Cloud Run, health endpoints, CI/CD mature |
| Trust & public surfaces | 10% | 72% | Docs/help/security exist; status is manual |
| Observability & analytics | 10% | 35% | No product funnel instrumentation |
| Support & comms | 5% | 60% | APIs fixed; depends on SMTP |

**Product Readiness (prior program):** 76% — measures *capability in code*.  
**Launch Readiness:** 74% — measures *confidence for real paying customers*.

---

## Critical blockers (must resolve before 20-business beta)

| # | Blocker | Why critical | Owner |
|---|---------|--------------|-------|
| C1 | **SMTP not operator-verified in production** | Invites, verification, password reset | ✅ **Resolved** — [SMTP_SMOKE_TEST_RESULTS.md](./SMTP_SMOKE_TEST_RESULTS.md) |
| C2 | **Stripe live checkout + webhook not operator-smoke-tested** | Revenue and entitlements | ✅ **Resolved (test mode)** — [STRIPE_LIVE_SMOKE_TEST_RESULTS.md](./STRIPE_LIVE_SMOKE_TEST_RESULTS.md); **`sk_live_` still required for real revenue** |
| C3 | **Contact form returns 500 without SMTP** | Public trust surface | Operator + Eng |
| C4 | **No automated monitoring linked to `/status`** | Incidents invisible | Operator |
| C5 | **Business paid module checkout E2E unverified** | Admins may hit dead-end on paid marketplace apps | Eng |

---

## High priority (resolve during beta window)

| # | Item | Risk |
|---|------|------|
| H1 | No auth endpoint rate limiting | Abuse / credential stuffing |
| H2 | Email verification not enforced when SMTP configured | Unverified accounts in production |
| H3 | No signup → first-action product analytics | Cannot measure onboarding success |
| H4 | `/status` manually maintained — not tied to `/api/health` | False confidence during outages |
| H5 | Public marketplace requires login | Prospect discovery friction |
| H6 | Seat count billing UI weak | Business tier upgrades incomplete UX |
| H7 | Swap Stripe to **`sk_live_`** before accepting real payments | Revenue blocked on test keys |

---

## Medium priority

| # | Item |
|---|------|
| M1 | No Stripe trials (copy aligned — acceptable if documented) |
| M2 | Landing lacks product screenshots |
| M3 | HR onboarding not auto-triggered on invite accept |
| M4 | Cancel UX shows "no subscription" when status is `cancelled` (immediate, not end-of-period display) |
| M5 | Duplicate subscription webhook handlers — monitor for double-processing |
| M6 | Production DB schema drift (`subscriptions.lastSyncedAt`) — patched; ensure `migrate deploy` on prod |

---

## Low priority

| # | Item |
|---|------|
| L1 | Public layout not shared across all marketing pages |
| L2 | Developer Connect payouts not implemented |
| L3 | Household persona not in onboarding branch |
| L4 | Invoice PDF/hosted link UX |

---

## Recommended closure order

1. **Operator:** ~~SMTP send test~~ ✅ Done
2. **Operator:** ~~Stripe test-mode sync + E2E~~ ✅ Done — see [STRIPE_LIVE_SMOKE_TEST_RESULTS.md](./STRIPE_LIVE_SMOKE_TEST_RESULTS.md)
3. **Operator:** Register **live** Stripe webhook + swap `sk_live_` before paid GA
4. **Eng:** Business paid module subscription E2E verification
5. **Operator:** Wire `/status` to health probe or Statuspage
6. **Eng:** Minimal product analytics (Phase 0B)
7. **Eng:** Auth rate limiting on sensitive auth endpoints
8. **GTM:** Controlled beta cohort + support runbook — [EARLY_BETA_READINESS.md](./EARLY_BETA_READINESS.md)

---

## What is ready (preserve)

- Persona onboarding (Personal / Business / Join Team)
- Default dashboard at registration
- Business bootstrap (Drive, Chat, Calendar)
- Invite accept page + public preview API
- `/billing` hub + Stripe Hosted Checkout (test mode)
- Webhook → subscription persistence (after 2026-07-05 fixes)
- Support ticket API for authenticated users
- Employee read-only business marketplace view
- Health endpoints (`/api/health`, `/api/ready`, `/api/live`)
- CI/CD (GitHub Actions + Cloud Build → Cloud Run)

---

## Relationship to Product Readiness

| Program | Question | Score |
|---------|----------|-------|
| Product Readiness Sprint 2 | Can the product teach itself in the first hour? | 76% |
| Launch Readiness | Can real customers depend on it next week? | **74%** |

Gap is now primarily **live Stripe keys**, **business paid-module browser proof**, and **observability** — not missing billing architecture.

---

## Stripe closure summary (2026-07-05)

| Fix | Impact |
|-----|--------|
| Webhook signing secret rotated (`whsec_` in GCP v2) | Real Stripe events verify |
| `stripeSubscriptionPeriod.ts` | Checkout webhooks persist subscriptions on Stripe API 2025+ |
| Production `PricingConfig` sync + Pro **$49.99 / $499.99** | Checkout charges correct tier price |
| Migration `20260705173000_subscription_stripe_sync_columns` | `lastSyncedAt` / `stripeMetadata` on prod DB |
| Personal browser E2E on `vssyl.com` | Checkout, portal, cancel verified |

**Stripe launch-ready for controlled beta (test billing):** ✅ Yes  
**Stripe launch-ready for live revenue:** ❌ No — requires `sk_live_` + live webhook

---

*Phase 0A updated 2026-07-05 — Stripe validation closure complete for test mode.*
