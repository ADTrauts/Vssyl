# Launch Readiness Assessment

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30  
**Method:** Code-path trace + production URL probes + test suite — not live payment/email sends

---

## Executive question

**Would you allow 20 businesses to begin using Vssyl next week?**

| Scenario | Answer |
|----------|--------|
| **Controlled early beta** (operator verifies SMTP + Stripe; named cohort; support SLA; known limitations documented) | **Conditional yes** |
| **Self-serve public launch** (no operator smoke tests; no support staffing) | **No** |

---

## Launch Readiness score

### **64%**

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Customer journey completeness | 25% | 78% | Code paths exist; Sprint 2 onboarding strong |
| Production verification | 20% | 45% | SMTP/Stripe live not confirmed in this audit |
| Billing & commercial | 15% | 68% | Stack complete; operator + E2E gaps |
| Operations & infra | 15% | 70% | Cloud Run, health endpoints, CI/CD mature |
| Trust & public surfaces | 10% | 72% | Docs/help/security exist; status is manual |
| Observability & analytics | 10% | 35% | No product funnel instrumentation |
| Support & comms | 5% | 60% | APIs fixed; depends on SMTP |

**Product Readiness (prior program):** 76% — measures *capability in code*.  
**Launch Readiness:** 64% — measures *confidence for real paying customers*.

---

## Critical blockers (must resolve before 20-business beta)

| # | Blocker | Why critical | Owner |
|---|---------|--------------|-------|
| C1 | **SMTP not operator-verified in production** | Invites, verification, password reset, contact form depend on delivery | Operator |
| C2 | **Stripe live checkout + webhook not operator-smoke-tested** | Revenue and entitlements unproven in prod | Operator |
| C3 | **Contact form returns 500 without SMTP** | Public trust surface breaks silently | Operator + Eng |
| C4 | **No automated monitoring linked to `/status`** | Incidents invisible to customers and ops | Operator |
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

---

## Medium priority

| # | Item |
|---|------|
| M1 | No Stripe trials (copy aligned — acceptable if documented) |
| M2 | Landing lacks product screenshots |
| M3 | HR onboarding not auto-triggered on invite accept |
| M4 | Price change email billing link was `/settings/billing` — **fixed to `/billing` in Phase 0A** |
| M5 | Duplicate subscription webhook handlers (`StripeService` + `ModuleSubscriptionService`) — monitor for double-processing |

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

1. **Operator:** SMTP send test (register, invite, reset, contact) — [SMTP_PRODUCTION_CHECKLIST.md](./SMTP_PRODUCTION_CHECKLIST.md)
2. **Operator:** Stripe checkout + webhook smoke test — [STRIPE_PRODUCTION_CHECKLIST.md](./STRIPE_PRODUCTION_CHECKLIST.md)
3. **Eng:** Business paid module subscription E2E verification
4. **Operator:** Wire `/status` to health probe or Statuspage
5. **Eng:** Minimal product analytics (Phase 0B) — see Launch Assessment analytics section in [PRODUCTION_VALIDATION_REPORT.md](./PRODUCTION_VALIDATION_REPORT.md)
6. **Eng:** Auth rate limiting on `/api/auth/forgot-password`, `/api/auth/register`
7. **GTM:** Controlled beta cohort + support runbook — [EARLY_BETA_READINESS.md](./EARLY_BETA_READINESS.md)

---

## What is ready (preserve)

- Persona onboarding (Personal / Business / Join Team)
- Default dashboard at registration
- Business bootstrap (Drive, Chat, Calendar)
- Invite accept page + public preview API
- `/billing` hub + deep links
- Support ticket API for authenticated users
- Employee read-only business marketplace view
- Health endpoints (`/api/health`, `/api/ready`, `/api/live`)
- CI/CD (GitHub Actions + Cloud Build → Cloud Run)

---

## Relationship to Product Readiness

| Program | Question | Score |
|---------|----------|-------|
| Product Readiness Sprint 2 | Can the product teach itself in the first hour? | 76% |
| Launch Readiness Phase 0A | Can real customers depend on it next week? | **64%** |

Gap is almost entirely **operator verification**, **observability**, and **commercial E2E proof** — not missing architecture.

---

*Phase 0A complete. No architecture redesign. One low-risk code fix: price-change email billing URL → `/billing`.*
