# SMTP Production Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-06-30

**Reference:** `docs/setup/SMTP_SETUP.md`, `docs/setup/EMAIL_NOTIFICATIONS_SETUP.md`

---

## Required environment variables

| Variable | Purpose | Set in prod? |
|----------|---------|--------------|
| `SMTP_HOST` | Mail server | 🔧 Operator |
| `SMTP_PORT` | Usually 587 | 🔧 |
| `SMTP_USER` | Auth user | 🔧 |
| `SMTP_PASS` | Auth password / app password | 🔧 |
| `SMTP_SECURE` | TLS (`true` for 465) | 🔧 |
| `SMTP_FROM` | From address (verified domain) | 🔧 |
| `NEXT_PUBLIC_APP_URL` | Link base (`https://vssyl.com`) | 🔧 Verify |
| `SUPPORT_EMAIL` | Contact form destination (optional) | 🔧 |

**Behavior when SMTP missing:** Registration auto-verifies email; no verification/invite/reset emails sent.

---

## Email inventory

| Email | Function | Template quality | Tested live |
|-------|----------|------------------|-------------|
| Registration verification | `sendVerificationEmail` | ⚠️ Basic HTML | 🔧 |
| Welcome | `sendWelcomeEmail` | ⚠️ Basic HTML | 🔧 |
| Password reset | `sendPasswordResetEmail` | ✅ Token in URL | 🔧 |
| Business invitation | `sendBusinessInvitationEmail` | ✅ Branded HTML | 🔧 |
| Contact form (to support) | `sendContactFormEmail` | ✅ | 🔧 |
| Notification emails | `EmailNotificationService` | ✅ Module events | 🔧 |
| Calendar invites | `sendCalendarInviteEmail` | ✅ ICS attachment | 🔧 |
| Price change notice | `sendPriceChangeNotification` | ✅ HTML; link → `/billing` (fixed Phase 0A) | 🔧 |
| Billing receipts | Stripe (not SMTP) | N/A | Stripe |

---

## Critical path tests (operator)

Run in production with a test mailbox:

| # | Test | Steps | Pass criteria |
|---|------|-------|---------------|
| M1 | Registration verification | Register new user | Email received; link opens `/auth/verify-email?token=` |
| M2 | Welcome email | Same registration | Welcome email received |
| M3 | Password reset | Forgot password flow | Reset link opens `/auth/reset-password?token=`; reset works |
| M4 | Business invitation | Admin invites new email | Invitation link opens `/auth/accept-invitation?token=` |
| M5 | Contact form | Submit `/contact` | Message arrives at `SUPPORT_EMAIL` or `SMTP_FROM` |
| M6 | Resend verification | `/auth/verify-email` resend | Email received |
| M7 | Link domain | Click any link | Lands on `vssyl.com`, not localhost |

---

## DNS & deliverability (SendGrid / SES / etc.)

| # | Item | Status |
|---|------|--------|
| M8 | SPF record | 🔧 Operator |
| M9 | DKIM records | 🔧 Operator |
| M10 | DMARC policy | 🔧 Operator |
| M11 | From domain verified in provider | 🔧 Operator |
| M12 | Not landing in spam (seed test) | 🔧 Operator |

---

## Failure modes

| Condition | User impact | Mitigation |
|-----------|-------------|------------|
| SMTP down at register | User auto-verified; no welcome email | Acceptable for dev; not for prod marketing |
| SMTP down at invite | **Invite link never arrives** — blocker | Must fix before team onboarding |
| SMTP down at reset | User locked out | Critical — monitor SMTP health |
| SMTP down at contact | 500 error to visitor | Show fallback "email support@vssyl.com" (future) |
| Wrong `NEXT_PUBLIC_APP_URL` | Links point to wrong host | Verify Secret Manager value |

---

## Security

| Item | Status |
|------|--------|
| Password reset tokens expire | ✅ 1 hour (token utils) |
| Verification tokens expire | ✅ 24 hours |
| Invitation tokens expire | ✅ 7 days |
| No secrets in email body | ✅ |
| Generic forgot-password response | ✅ No email enumeration |

---

## Verdict

| Category | Status |
|----------|--------|
| Implementation | ✅ Complete |
| Production configuration | 🔧 **Not verified in Phase 0A** |
| Blocking beta? | **Yes** — invitations and reset require SMTP |

**Minimum for 20-business beta:** M1–M7 pass in production.
