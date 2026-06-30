# Customer Journey Validation

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30  
**Method:** Route + service trace (code is canonical; live E2E where noted)

**Legend:** ✅ Pass · ⚠️ Warning · ❌ Fail · 🔧 Operator-dependent

---

## 1. Personal registration

| Step | Route / service | Status | Notes |
|------|-----------------|--------|-------|
| Landing CTA | `/landing`, `/auth/register` | ✅ | Honest copy post Sprint 1 |
| Register API | `POST /api/auth/register` → `registerWithSession` | ✅ | |
| Default dashboard | `ensureDefaultPersonalDashboard` in `authService.ts` | ✅ | Sprint 2 |
| Primary calendar | `ensurePersonalPrimaryCalendar` | ✅ | |
| Auto-login | JWT + refresh token returned | ✅ | |
| Redirect | `/dashboard` | ✅ | |
| Verification email | `sendVerificationEmail` | 🔧 | Skipped if no SMTP; auto-verifies |
| Welcome email | `sendWelcomeEmail` | 🔧 | Same |

---

## 2. Business registration + creation

| Step | Status | Notes |
|------|--------|-------|
| Persona → Business branch | ✅ | `DashboardBuildOutModal` → `/business/create` |
| Business create form | ✅ | `/business/create` |
| Bootstrap modules | ✅ | `businessBootstrapService` — drive, chat, calendar |
| Business dashboard | ✅ | `useEnsureBusinessDashboard` |
| Workspace landing | ✅ | `/business/[id]/workspace` |
| Setup checklist (admin) | ✅ | `BusinessWorkspaceHubPanel` Sprint 2 |

---

## 3. Workspace & dashboard initialization

| Step | Status | Notes |
|------|--------|-------|
| Personal dashboard exists at register | ✅ | No lazy-create flash |
| Empty dashboard templates | ✅ | `EmptyDashboard` + `DashboardTemplates` |
| Persona onboarding modal | ✅ | First visit to main personal dashboard |
| Template apply | ✅ | `handleApplyTemplate` in `DashboardClient` |
| Tab build-out modal | ✅ | Additional tabs via `DashboardBuildOutModal` |
| Business workspace modules | ✅ | Sidebar filtered to installed business modules |

---

## 4. Application installation & marketplace

| Context | Install | Uninstall | Browse |
|---------|---------|-----------|--------|
| Personal `/modules` | ✅ Auth required | ✅ | ✅ Marketplace tab |
| Business admin `/business/[id]/modules` | ✅ | ✅ | ✅ |
| Business employee | ✅ Hidden | ✅ Hidden | ⚠️ Read-only discover view |
| Public unauthenticated | ❌ | ❌ | ❌ Login wall |

**Permission enforcement:** API returns 403 for non-admin business install — UI now matches (Sprint 2).

---

## 5. Business invitations

| Step | Route / API | Status | Notes |
|------|-------------|--------|-------|
| Admin sends invite | `businessMemberService.inviteMember` | ✅ | |
| Invitation email | `sendBusinessInvitationEmail` | 🔧 | Requires SMTP |
| Preview (public) | `GET /api/business/invite/preview/:token` | ✅ | |
| Accept page | `/auth/accept-invitation` | ✅ | Sprint 1 |
| Accept API | `POST /api/business/invite/accept/:token` | ✅ | |
| Register-from-invite | `/auth/register?inviteToken=` | ✅ | |
| Post-accept redirect | Business workspace | ✅ | |

---

## 6. Authentication recovery

| Flow | Route | Status | Notes |
|------|-------|--------|-------|
| Forgot password | `POST /api/auth/forgot-password` | ✅ | Generic response (no enumeration) |
| Reset email | `sendPasswordResetEmail` → `/auth/reset-password?token=` | 🔧 | URL correct in code |
| Reset password | `POST /api/auth/reset-password` | ✅ | Invalidates refresh tokens |
| Verify email | `/auth/verify-email?token=` | ✅ | |
| Resend verification | `POST /api/auth/resend-verification` | ✅ | |

---

## 7. Billing & subscriptions

| Flow | Status | Notes |
|------|--------|-------|
| Billing hub | ✅ | `/billing` → `BillingModal` |
| Checkout session | ✅ | `POST /api/billing/checkout/session` |
| Stripe redirect | ✅ | Hosted checkout |
| Success/cancel | ✅ | `/billing/success`, `/billing/cancel` |
| Webhook | ✅ | `POST /api/payment/webhook` (raw body) |
| Entitlements sync | ✅ | `entitlementService`, `stripeSyncService` |
| Customer portal | ✅ | `POST /api/billing/customer-portal` |
| Cancel / reactivate | ✅ | Billing routes |
| Upgrade deep links | ✅ | `/billing/upgrade` redirect |
| Module subscriptions | ⚠️ | Personal strong; business paid E2E gap |
| Live Stripe proof | 🔧 | Operator checklist required |

---

## 8. Support & trust surfaces

| Surface | Route | Status | Notes |
|---------|-------|--------|-------|
| Support tickets | `/support` → `POST /api/support/tickets/customer` | ✅ | Auth required |
| Contact form | `/contact` → `POST /api/contact` | 🔧 | 500 if SMTP fails |
| Help FAQ | `/help` | ✅ | Curated |
| Documentation | `/docs` | ✅ | Curated getting started |
| Security | `/security` | ✅ | Honest overview |
| Status | `/status` | ⚠️ | Static "all operational" — not probed |
| Legal | `/privacy`, `/terms` | ✅ | |

---

## 9. Core modules (first-action paths)

| Module | Entry | Empty-state guidance | Status |
|--------|-------|---------------------|--------|
| Drive | `/drive`, widget | Upload first file | ✅ |
| Chat | `/chat`, widget | Start conversation | ✅ |
| Calendar | `/calendar` | Create first event | ✅ |
| AI | `/ai` | Ask first question | ✅ |
| Todo, Notebook, etc. | Module routes | Module-specific | ✅ |

---

## Journey summary

| Journey | Code ready | Production proven |
|---------|------------|-------------------|
| Personal signup → dashboard → first action | ✅ | ⚠️ Needs SMTP optional path tested |
| Business admin signup → create → invite | ✅ | 🔧 Invite requires SMTP |
| Employee invite accept | ✅ | 🔧 SMTP |
| Billing upgrade | ✅ | 🔧 Stripe live |
| Support request | ✅ | ✅ (in-app ticket DB) |
| Contact form | ✅ | 🔧 SMTP to deliver |

---

## Failures recorded

| ID | Finding | Severity |
|----|---------|----------|
| F1 | Contact form fails closed without SMTP | Critical (operator) |
| F2 | No live proof of invitation email delivery | Critical (operator) |
| F3 | No live proof of Stripe webhook → entitlement | Critical (operator) |
| F4 | Public marketplace browse requires account | High (GTM) |
| F5 | Status page not connected to health API | High (ops) |

---

*See [PRODUCTION_VALIDATION_REPORT.md](./PRODUCTION_VALIDATION_REPORT.md) for URL probe results.*
