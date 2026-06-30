# Launch Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30

**Status key:** ✅ Ready · ⚠️ Partial · ❌ Not ready · 🔧 Operator · 🚫 Blocking

**Owner key:** Eng = Engineering · Ops = Operator · GTM = Go-to-market · Sup = Support

---

## Authentication

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Register + auto-login | ✅ | Low | No | Eng |
| Login / logout | ✅ | Low | No | Eng |
| Password reset flow | ⚠️ Code ✅; SMTP 🔧 | High | 🚫 if SMTP down | Ops |
| Email verification | ⚠️ Optional when SMTP off | Medium | No for beta | Ops |
| Session refresh | ✅ | Low | No | Eng |
| Invite accept (existing + new user) | ✅ | Low | No | Eng |
| Auth rate limiting | ❌ | Medium | No | Eng |

---

## Business

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Business create | ✅ | Low | No | Eng |
| Bootstrap (drive, chat, calendar) | ✅ | Low | No | Eng |
| Member invite | ⚠️ SMTP 🔧 | High | 🚫 | Ops |
| Invite accept page | ✅ | Low | No | Eng |
| Employee workspace access | ✅ | Low | No | Eng |
| Admin setup checklist | ✅ | Low | No | Eng |
| Org chart / HR admin | ✅ | Low | No | Eng |

---

## Workspace & dashboard

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Default personal dashboard at register | ✅ | Low | No | Eng |
| Persona onboarding | ✅ | Low | No | Eng |
| Dashboard templates | ✅ | Low | No | Eng |
| Business workspace hub | ✅ | Low | No | Eng |
| Multi-tab personal dashboards | ✅ | Low | No | Eng |

---

## Billing

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| `/billing` hub | ✅ | Low | No | Eng |
| Stripe checkout | ⚠️ Code ✅; live 🔧 | Critical | 🚫 for paid | Ops |
| Webhooks → entitlements | ⚠️ Code ✅; live 🔧 | Critical | 🚫 for paid | Ops |
| Customer portal | ⚠️ | Medium | No for free beta | Ops |
| Cancel / upgrade | ⚠️ | Medium | No for free beta | Ops |
| Module subscriptions | ⚠️ | Medium | Partial | Eng |
| Seat billing UI | ⚠️ | Medium | No | Eng |
| Free tier usable without payment | ✅ | Low | No | Eng |

---

## Marketplace

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Personal install/uninstall | ✅ | Low | No | Eng |
| Business admin install | ✅ | Low | No | Eng |
| Employee read-only view | ✅ | Low | No | Eng |
| Public catalog browse | ❌ | Medium | No | Eng |
| Paid module E2E | ⚠️ | Medium | No for free apps | Eng |
| Developer submit pipeline | ✅ | Low | No | Eng |

---

## Core applications

| Module | Status | Risk | Blocking? | Owner |
|--------|--------|------|-----------|-------|
| Drive / File Hub | ✅ | Low | No | Eng |
| Chat + realtime | ✅ | Medium | No | Eng |
| Calendar | ✅ | Low | No | Eng |
| AI Assistant | ✅ | Medium | No | Eng |
| Todo | ✅ | Low | No | Eng |
| Notifications | ✅ | Low | No | Eng |

---

## Support & documentation

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| `/help` FAQ | ✅ | Low | No | GTM |
| `/docs` getting started | ✅ | Low | No | GTM |
| `/support` tickets (auth) | ✅ | Low | No | Sup |
| `/contact` form | ⚠️ SMTP 🔧 | High | 🚫 public trust | Ops |
| `/security` | ✅ | Low | No | GTM |
| `/status` | ⚠️ Manual | Medium | No | Ops |

---

## Public experience

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Landing page | ✅ | Low | No | GTM |
| Honest pricing copy | ✅ | Low | No | GTM |
| Legal (privacy, terms) | ✅ | Low | No | GTM |
| Product screenshots | ❌ | Low | No | GTM |
| Logo asset | ⚠️ Text wordmark | Low | No | GTM |

---

## Infrastructure

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Cloud Run deploy | ✅ | Low | No | Ops |
| Cloud SQL | ✅ | Low | No | Ops |
| GCS storage | ✅ | Low | No | Ops |
| Health endpoints | ✅ | Low | No | Ops |
| CI/CD tests on merge | ✅ | Low | No | Eng |
| Secrets in Secret Manager | 🔧 Verify | Critical | 🚫 | Ops |
| DB backups | 🔧 Verify | High | No | Ops |

---

## Operations

| Item | Status | Risk | Blocking? | Owner |
|------|--------|------|-----------|-------|
| Structured logging | ✅ | Low | No | Eng |
| Uptime monitoring | ❌ | High | 🚫 for scale | Ops |
| Error alerting | ❌ | High | No for beta | Ops |
| Product analytics funnel | ❌ | Medium | No | Eng |
| Support runbook | ⚠️ | Medium | No | Sup |
| Incident comms (`/status`) | ⚠️ | Medium | No | Ops |

---

## Blocking summary

**Must pass before 20-business beta:**

1. SMTP live tests (invite + reset + contact)
2. Stripe live tests (if any paid tier in cohort)
3. Secrets verified in production
4. Named support contact + response SLA

**Can defer:**

- Public marketplace browse
- Product funnel analytics (recommended Week 1 of beta)
- Screenshot polish
- Auth rate limiting (recommended before broad launch)

---

*Total checklist items: 60+ · Ready: ~75% · Blocking gaps: 4 operator-dependent*
