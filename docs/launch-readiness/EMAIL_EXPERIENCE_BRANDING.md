# Email Experience & Branding

**Sprint:** Email Experience & Branding  
**Date:** 2026-07-04  
**Scope:** Branded HTML + plain-text transactional templates only (no SMTP/provider changes)

**References:**  
- `server/src/services/email/` — centralized email module  
- `server/src/services/email/templates/` — branded template builders  
- [SMTP_PRODUCTION_CHECKLIST.md](./SMTP_PRODUCTION_CHECKLIST.md)  
- [SMTP_SMOKE_TEST_RESULTS.md](./SMTP_SMOKE_TEST_RESULTS.md)

---

## Templates created

| File | Purpose |
|------|---------|
| `templates/layout.ts` | Shared Vssyl card layout, wordmark, footer |
| `templates/buttons.ts` | Primary CTA + fallback link helpers |
| `templates/utils.ts` | HTML escape, brand colors, footer links |
| `templates/verificationEmail.ts` | Email verification |
| `templates/passwordResetEmail.ts` | Password reset |
| `templates/welcomeEmail.ts` | Post-registration welcome |
| `templates/businessInvitationEmail.ts` | Team/business invite |
| `templates/contactEmail.ts` | Contact form → support inbox |
| `templates/supportEmail.ts` | Ticket assigned / in progress / resolved |
| `templates/billingEmail.ts` | Subscription price change notice |
| `templates/calendarEmail.ts` | Calendar invite / update / cancel |
| `templates/notificationEmail.ts` | Module notification emails |

---

## Emails covered

| User-facing email | Builder | Send path |
|-------------------|---------|-----------|
| Email verification | `buildVerificationEmail` | `sendVerificationEmail` |
| Password reset | `buildPasswordResetEmail` | `sendPasswordResetEmail` |
| Welcome | `buildWelcomeEmail` | `sendWelcomeEmail` |
| Business invitation | `buildBusinessInvitationEmail` | `sendBusinessInvitationEmail` |
| Contact form (support) | `buildContactFormEmail` | `sendContactFormEmail` |
| Support ticket assigned | `buildSupportTicketAssignedEmail` | `SupportTicketEmailService` |
| Support ticket in progress | `buildSupportTicketInProgressEmail` | `SupportTicketEmailService` |
| Support ticket resolved | `buildSupportTicketResolvedEmail` | `SupportTicketEmailService` |
| Price change / billing | `buildPriceChangeEmail` | `sendPriceChangeNotification` |
| Calendar invite/update/cancel | `buildCalendarEventEmail` | `sendCalendar*Email` via `calendarNotificationService` |
| Module notifications | `buildNotificationEmail` | `EmailNotificationService.createTemplateFromNotification` |

**Not in SMTP scope:** Stripe billing receipts (Stripe-hosted).

---

## Brand system

| Element | Value |
|---------|--------|
| Wordmark | Text **Vssyl** (no external image dependency) |
| Primary blue | `#2563eb` |
| Layout | Light gray outer background, white card, inline CSS |
| Mobile | Table-based, viewport meta, preheader text |
| Plain text | Generated for every template |

### Footer (every email)

- Vssyl wordmark + copyright
- Support page + `support@vssyl.com`
- Privacy (`/privacy`), Terms (`/terms`), Security (`/security`)
- Context line: “You received this because…”

---

## Sender / reply-to rules

| Email type | From | Reply-To |
|------------|------|----------|
| Default transactional | `EMAIL_FROM` (`no-reply@vssyl.com`) | `EMAIL_REPLY_TO` (`support@vssyl.com`) |
| Contact form → support | `EMAIL_FROM` | Submitter email |
| Billing / price change | `EMAIL_FROM` | `BILLING_EMAIL` |
| Support tickets | `EMAIL_FROM` | default reply-to |

Configured via env / Secret Manager — see SMTP checklist. **Never hardcode tokens or passwords in templates.**

---

## Preview locally (no SMTP)

```bash
cd server
pnpm email:previews
open tmp/email-previews/verification.html
```

Output directory: `server/tmp/email-previews/` (gitignored).

---

## Tests

```bash
cd server
pnpm exec vitest run src/services/email/templates/__tests__/emailTemplates.test.ts
pnpm exec vitest run src/services/email/__tests__/emailConfig.test.ts
```

Validates HTML/text presence, required links, footer, no `undefined`/`null`, no secret patterns in output.

---

## Recommended visual QA checklist

| # | Check |
|---|--------|
| 1 | Open each preview HTML in Chrome + iOS Mail / Gmail |
| 2 | Vssyl wordmark and blue CTA visible above the fold |
| 3 | Primary button tappable on mobile (44px+ touch target) |
| 4 | Fallback URL readable if button blocked |
| 5 | Footer links resolve on `https://vssyl.com` |
| 6 | Plain-text `.txt` counterpart readable without HTML |
| 7 | Live smoke: verification, reset, invite to real inbox |
| 8 | Contact form lands in support inbox with reply-to set |
| 9 | No images blocked / no broken external assets |
| 10 | Context line matches email type |

---

## Remaining improvements

| Item | Priority |
|------|----------|
| Contact form auto-reply confirmation to submitter | Medium |
| Dark-mode client testing (Apple Mail, Outlook) | Medium |
| Per-business white-label sender (future) | Low |
| Richer calendar emails (RSVP CTA, timezone label) | Medium |
| HTML minification for size | Low |
| Postmark template analytics tags | Low |

---

## Architecture note

All templates render through **`buildBrandedEmail` → `sendEmail` → single SMTP transport**. No duplicate email services or transports were added in this sprint.
