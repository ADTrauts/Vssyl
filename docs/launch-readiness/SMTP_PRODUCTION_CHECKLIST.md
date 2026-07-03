# SMTP Production Checklist

**Program:** Launch Readiness — Phase 0A  
**Date:** 2026-07-03 (updated)

**Reference:** `docs/setup/SMTP_SETUP.md`, `docs/setup/EMAIL_NOTIFICATIONS_SETUP.md`  
**Implementation:** `server/src/services/email/` (centralized transport)

---

## Required environment variables

| Variable | Purpose | Set in prod? |
|----------|---------|--------------|
| `SMTP_HOST` | Mail server (`smtp.postmarkapp.com` for Postmark) | 🔧 Operator |
| `SMTP_PORT` | Usually `587` (STARTTLS) | 🔧 |
| `SMTP_USER` | SMTP auth user (Postmark: Server API token) | 🔧 Secret Manager |
| `SMTP_PASS` | SMTP auth password (Postmark: same Server API token) | 🔧 Secret Manager |
| `SMTP_SECURE` | `true` only for port 465; leave unset/`false` for 587 | 🔧 |
| `EMAIL_FROM` | Verified sender (`no-reply@vssyl.com`) | 🔧 |
| `EMAIL_REPLY_TO` | Default reply-to (`support@vssyl.com`) | 🔧 |
| `SUPPORT_EMAIL` | Contact form + support inbound destination | 🔧 |
| `BILLING_EMAIL` | Billing notices reply-to (`billing@vssyl.com`) | 🔧 |
| `NEXT_PUBLIC_APP_URL` | Link base (`https://vssyl.com`) | 🔧 Verify |

**Legacy alias:** `SMTP_FROM` is accepted if `EMAIL_FROM` is unset.

**Postmark SMTP (production target):**

```env
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=<server-api-token>
SMTP_PASS=<server-api-token>
EMAIL_FROM=no-reply@vssyl.com
EMAIL_REPLY_TO=support@vssyl.com
SUPPORT_EMAIL=support@vssyl.com
BILLING_EMAIL=billing@vssyl.com
```

**Behavior when SMTP missing:**

| Path | Behavior |
|------|----------|
| Registration | Auto-verifies email; no verification/welcome emails |
| Password reset / invite / resend | Email silently skipped (`sendEmail` returns `{ sent: false }`) |
| Contact form | HTTP 503 with fallback message to email support |
| Notification emails | `EmailNotificationService.isAvailable()` → `false` |
| Support ticket emails | Returns `false`; logged |

---

## Architecture

| Layer | File | Role |
|-------|------|------|
| Config | `email/config.ts` | Env validation, address defaults |
| Transport | `email/transport.ts` | Single nodemailer SMTP transport |
| Core send | `email/sendEmail.ts` | Typed `sendEmail()` |
| Transactional | `email/transactional.ts` | Verification, reset, invite, contact, billing, calendar |
| Notifications | `emailNotificationService.ts` | Module notification templates → `sendEmail` |
| Support tickets | `supportTicketEmailService.ts` | Ticket lifecycle → `EmailNotificationService` |

**No duplicate transports.** All SMTP paths share one nodemailer instance.

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
| Support ticket updates | `SupportTicketEmailService` | ✅ | 🔧 |
| Calendar invites | `sendCalendarInviteEmail` | ✅ ICS attachment | 🔧 |
| Price change notice | `sendPriceChangeNotification` | ✅ HTML; link → `/billing` | 🔧 |
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
| M5 | Contact form | Submit `/contact` | Message arrives at `SUPPORT_EMAIL` |
| M6 | Resend verification | `/auth/verify-email` resend | Email received |
| M7 | Link domain | Click any link | Lands on `vssyl.com`, not localhost |
| M8 | Reply-to | Reply to transactional email | Routes to `EMAIL_REPLY_TO` / support |

---

## DNS & deliverability (Postmark)

| # | Item | Status |
|---|------|--------|
| M9 | SPF record (include Postmark) | 🔧 Operator |
| M10 | DKIM (Postmark-provided CNAMEs) | 🔧 Operator |
| M11 | DMARC policy | 🔧 Operator |
| M12 | Sender signature verified in Postmark | 🔧 Operator |
| M13 | Not landing in spam (seed test) | 🔧 Operator |

---

## Failure modes

| Condition | User impact | Mitigation |
|-----------|-------------|------------|
| SMTP down at register | User auto-verified; no welcome email | Acceptable for dev; not for prod marketing |
| SMTP down at invite | **Invite link never arrives** — blocker | Must fix before team onboarding |
| SMTP down at reset | User locked out | Critical — monitor SMTP health |
| SMTP down at contact | 503 with fallback address shown | ✅ Implemented |
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
| SMTP credentials in env only | ✅ Never hardcoded |

---

## Verdict

| Category | Status |
|----------|--------|
| Implementation | ✅ Centralized provider (Postmark SMTP-ready) |
| Production configuration | 🔧 **Not verified in Phase 0A** |
| Blocking beta? | **Yes** — invitations and reset require SMTP |

**Minimum for 20-business beta:** M1–M8 pass in production.

---

## Smoke test log

See **[SMTP_SMOKE_TEST_RESULTS.md](./SMTP_SMOKE_TEST_RESULTS.md)** for latest live test results.

| Date | Provider | Result |
|------|----------|--------|
| 2026-07-03 | Postmark SMTP (local) | ❌ 0/4 — auth failed (no Server API token in env) |
| 2026-07-03 | Production `/api/contact` | ❌ 500 — SMTP not delivering |
