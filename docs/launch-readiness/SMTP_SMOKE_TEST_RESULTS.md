# SMTP Smoke Test Results

**Date:** 2026-07-03  
**Commit tested:** `69392970` (centralized email module)  
**Recipient:** `andrew.trautman@vssyl.com`  
**Target provider:** Postmark SMTP (`smtp.postmarkapp.com:587`)

---

## Environment used

| Variable | Value (no secrets) |
|----------|-------------------|
| `SMTP_HOST` | `smtp.postmarkapp.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` / `SMTP_PASS` | Loaded from operator env file — **interim Gmail credentials**, not Postmark Server API token |
| `EMAIL_FROM` | `no-reply@vssyl.com` |
| `EMAIL_REPLY_TO` | `support@vssyl.com` |
| `SUPPORT_EMAIL` | `support@vssyl.com` |
| `BILLING_EMAIL` | `billing@vssyl.com` |
| `NEXT_PUBLIC_APP_URL` | `https://vssyl.com` |

**Script:** `server/scripts/smtp-smoke-test.ts`

```bash
cd server
POSTMARK_SERVER_TOKEN=<server-api-token> \
  pnpm exec ts-node scripts/smtp-smoke-test.ts --to andrew.trautman@vssyl.com
```

Or pass token via env without committing:

```bash
SMTP_USER=<server-api-token> SMTP_PASS=<server-api-token> \
  pnpm exec ts-node scripts/smtp-smoke-test.ts --to andrew.trautman@vssyl.com
```

---

## SMTP connection verify

| Check | Result |
|-------|--------|
| Transport init | ✅ Connected to `smtp.postmarkapp.com:587` |
| `transporter.verify()` | ✅ **OK** (2026-07-04, after Secret Manager update) |

**Credentials:** Postmark Server API token stored in GCP Secret Manager (`smtp-user`, `smtp-pass`); `EMAIL_FROM` in `smtp-from`.

---

## Transactional email tests

| # | Test | Function | Sent | Notes |
|---|------|----------|------|-------|
| 1 | Contact form → support | `sendContactFormEmail` | ✅ | 2026-07-04 |
| 2 | Password reset | `sendPasswordResetEmail` | ✅ | 2026-07-04 |
| 3 | Business invitation | `sendBusinessInvitationEmail` | ✅ | 2026-07-04 |
| 4 | Email verification | `sendVerificationEmail` | ✅ | 2026-07-04 |

**Summary:** 4 / 4 passed (2026-07-04)

---

## Production API spot check

| Endpoint | Result |
|----------|--------|
| `POST /api/contact` (Cloud Run) | ✅ `200` — message sent (2026-07-04) |

---

## Verdict

| Item | Status |
|------|--------|
| Email module refactor | ✅ Deployed to `main` |
| Postmark SMTP credentials | ✅ In Secret Manager + Cloud Run revision `vssyl-server-00687-jj6` |
| Live email delivery | ✅ **Working** |
| Operator action | Confirm inbox delivery; verify Postmark sender signature / DNS if needed |

**Last run:** 2026-07-04 — all tests passed.
