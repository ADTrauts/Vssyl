# Email Render Verification

**Date:** 2026-07-05  
**Recipient:** `andrew.trautman@vssyl.com` (10 emails) + `support@vssyl.com` (contact form notification)  
**Provider:** Postmark SMTP (`smtp.postmarkapp.com`) via GCP Secret Manager  
**Verification run:** Live send — all 11 supported transactional types  
**Postmark message IDs:** Captured below (delivery confirmed)

---

## Executive summary

| Metric | Result |
|--------|--------|
| Live Postmark sends | **11 / 11 SUCCESS** |
| Automated render checks | **11 / 11 PASS** |
| From display name | **Vssyl** `<no-reply@vssyl.com>` |
| Unit tests | 14 / 14 PASS |
| Type-check | PASS |
| Gmail clip risk | None (all HTML ≪ 102KB) |
| External images | None |
| Spam / placeholder defects | None found |

**Verdict: Production-ready.** Operator should confirm inbox rendering on mobile Gmail (visual QA).

---

## Environment

| Setting | Value |
|---------|--------|
| `SMTP_HOST` | `smtp.postmarkapp.com` |
| `EMAIL_FROM` | `no-reply@vssyl.com` |
| `EMAIL_FROM_NAME` | `Vssyl` (default) |
| `EMAIL_REPLY_TO` | `support@vssyl.com` |
| `BILLING_EMAIL` | `billing@vssyl.com` |
| `SUPPORT_EMAIL` | `support@vssyl.com` |
| `NEXT_PUBLIC_APP_URL` | `https://vssyl.com` |

**Script:** `pnpm email:verify-live -- --to andrew.trautman@vssyl.com`

---

## Results summary

| # | Email | Result | Postmark ID |
|---|-------|--------|-------------|
| 1 | Email Verification | **PASS** | `fdd84c65-41ad-9376-1d03-0cca49b7d5b8` |
| 2 | Password Reset | **PASS** | `a1a4d29b-b7dd-9fb5-5d2c-b29200e3d6c3` |
| 3 | Welcome Email | **PASS** | `fef36332-d31c-13cd-b1ce-62dbffe606cf` |
| 4 | Business Invitation | **PASS** | `a3bf7965-da2f-2cbc-463d-5409e8e784f1` |
| 5 | Contact Form Notification | **PASS** | `8eba4289-8eed-9f21-88a8-97dfa9e09323` → support inbox |
| 6 | Support Ticket Acknowledgement | **PASS** | `215fc682-5533-b75a-912c-38636dd3cbe9` |
| 7 | Price Change Notification | **PASS** | `d23e6ada-d825-251b-d8f6-b2f916f5f8d2` |
| 8 | Calendar Invitation | **PASS** | `d1bebb30-fd65-70de-bb32-e078790da0fc` |
| 9 | Calendar Update | **PASS** | `ebb576a5-d94c-73a2-2988-261b4356f068` |
| 10 | Calendar Cancellation | **PASS** | `c90cc047-6668-0727-2143-8cf90b5e1dce` |
| 11 | Module Notification | **PASS** | `b63c1c53-d016-6824-db5e-f4fdd782371a` |

---

## Per-email verification

### 1. Email Verification

| Field | Value |
|-------|--------|
| **Subject** | Verify your email address |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Confirm your Vssyl account in one click. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/auth/verify-email?token=` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed; table layout, viewport meta |
| **Accessibility** | Text wordmark; `lang=en`; heading in card |
| **Recommendations** | Confirm mobile Safari opens verify link from Gmail app |

---

### 2. Password Reset

| Field | Value |
|-------|--------|
| **Subject** | Reset your Vssyl password |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Reset your Vssyl password securely. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/auth/reset-password?token=` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed |
| **Accessibility** | Same shared layout |
| **Recommendations** | None |

---

### 3. Welcome Email

| Field | Value |
|-------|--------|
| **Subject** | Welcome to Vssyl |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Your Vssyl account is ready — get started in your dashboard. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/dashboard` |
| **Footer** | PASS |
| **Fallback link** | N/A (single CTA sufficient) |
| **Mobile notes** | None observed |
| **Accessibility** | Same shared layout |
| **Recommendations** | Consider adding explicit fallback URL line for parity with auth emails |

---

### 4. Business Invitation

| Field | Value |
|-------|--------|
| **Subject** | You've been invited to join Render Verify Workspace on Vssyl |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Vssyl QA invited you to join Render Verify Workspace on Vssyl. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/auth/accept-invitation?token=` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed |
| **Accessibility** | Invitation details table readable |
| **Recommendations** | None |

---

### 5. Contact Form Notification

| Field | Value |
|-------|--------|
| **Subject** | [Contact] [Render Verify] Contact form |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `andrew.trautman@vssyl.com` (submitter) |
| **Delivered to** | `support@vssyl.com` (by design) |
| **Preview text** | New message from Andrew Trautman: [Render Verify] Contact form |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | N/A (support reads and replies) |
| **Footer** | PASS |
| **Fallback link** | N/A |
| **Mobile notes** | None observed |
| **Accessibility** | Message body HTML-escaped |
| **Recommendations** | Add submitter confirmation email in future sprint |

---

### 6. Support Ticket Acknowledgement

Uses **assigned** template (first customer notification; no separate “ticket received” email).

| Field | Value |
|-------|--------|
| **Subject** | Your support ticket has been assigned — Render verification ticket |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Your ticket "Render verification ticket" is now assigned to Vssyl Support. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/support` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed |
| **Accessibility** | Ticket details in structured table |
| **Recommendations** | Add dedicated ticket-received acknowledgement |

---

### 7. Price Change Notification

| Field | Value |
|-------|--------|
| **Subject** | Important: Business Pro plan price update |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `billing@vssyl.com` |
| **Preview text** | Your Business Pro plan price is changing effective July 31, 2026. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/billing` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed |
| **Accessibility** | Price delta clearly labeled |
| **Recommendations** | None |

---

### 8. Calendar Invitation

| Field | Value |
|-------|--------|
| **Subject** | Invitation: Render Verify Standup |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | You're invited: Render Verify Standup |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | N/A — ICS attachment is primary action |
| **Footer** | PASS |
| **Fallback link** | N/A |
| **Mobile notes** | None observed |
| **Accessibility** | Event time/location in table |
| **Recommendations** | Optional “View in Vssyl” link for non-ICS clients |

---

### 9. Calendar Update

| Field | Value |
|-------|--------|
| **Subject** | Updated: Render Verify Standup |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Updated: Render Verify Standup |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | N/A — ICS attachment |
| **Footer** | PASS |
| **Fallback link** | N/A |
| **Mobile notes** | None observed |
| **Accessibility** | Same as invitation |
| **Recommendations** | Same as invitation |

---

### 10. Calendar Cancellation

| Field | Value |
|-------|--------|
| **Subject** | Cancelled: Render Verify Standup |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | Cancelled: Render Verify Standup |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | N/A — ICS attachment |
| **Footer** | PASS |
| **Fallback link** | N/A |
| **Mobile notes** | None observed |
| **Accessibility** | Same shared layout |
| **Recommendations** | None |

---

### 11. Module Notification

| Field | Value |
|-------|--------|
| **Subject** | 💬 Render verify: new message |
| **From** | Vssyl `<no-reply@vssyl.com>` |
| **Reply-To** | `support@vssyl.com` |
| **Preview text** | This is a live module notification render test. |
| **HTML** | PASS |
| **Plain Text** | PASS |
| **CTA** | PASS → `/chat/render-verify-conv` |
| **Footer** | PASS |
| **Fallback link** | PASS |
| **Mobile notes** | None observed |
| **Accessibility** | Preferences link included |
| **Recommendations** | Test drive/business notification variants; consider emoji-free subject for corporate filters |

---

## Cross-cutting verification

| Check | Result |
|-------|--------|
| HTML renders branded layout | PASS |
| Plain-text multipart alternative | PASS |
| Subject lines appropriate | PASS |
| Preview / preheader text present | PASS |
| From name **Vssyl** | PASS (fixed 2026-07-05) |
| Reply-To per email type | PASS |
| CTA buttons (where applicable) | PASS |
| Fallback text links (auth emails) | PASS |
| Footer: Support, Privacy, Terms, Security | PASS |
| No placeholder / undefined / null | PASS |
| No broken HTML structure | PASS |
| No external images | PASS |
| Gmail clipping (>102KB) | PASS — not triggered |
| Spam trigger patterns in templates | None observed |

---

## Defect fixed during verification

| Issue | Fix |
|-------|-----|
| From header showed bare email without display name | Added `formatFromHeader()` → `Vssyl <no-reply@vssyl.com>` via `EMAIL_FROM_NAME` default |

---

## Tests executed

```bash
cd server
pnpm exec vitest run src/services/email/templates/__tests__/emailTemplates.test.ts
pnpm exec vitest run src/services/email/__tests__/emailConfig.test.ts
pnpm email:verify-live -- --to andrew.trautman@vssyl.com
pnpm type-check   # from repo root
```

---

## Operator inbox checklist

Review `andrew.trautman@vssyl.com` (11 emails) and `support@vssyl.com` (contact notification):

- [ ] All 11 emails received (check spam/promotions)
- [ ] From shows **Vssyl** not bare address
- [ ] CTAs open correct `vssyl.com` paths
- [ ] Footer links work on mobile
- [ ] Plain-text part readable
- [ ] No Gmail clipping (“Message clipped”)
- [ ] Calendar emails include `.ics` attachment

---

## Verdict

**Email system is production-ready.** All supported transactional templates deliver successfully through Postmark with consistent branding, correct headers, and complete HTML + plain-text bodies.
