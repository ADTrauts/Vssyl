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
| `transporter.verify()` | ❌ **Failed** — `535 5.7.8 authentication failed` |

**Root cause:** Postmark Server API token not available in local env or GCP Secret Manager (gcloud auth expired). Local `.env.production` still contains interim **Gmail** SMTP credentials, which Postmark rejects.

---

## Transactional email tests

| # | Test | Function | Sent | Notes |
|---|------|----------|------|-------|
| 1 | Contact form → support | `sendContactFormEmail` | ❌ | Auth failure before send |
| 2 | Password reset | `sendPasswordResetEmail` | ❌ | Auth failure before send |
| 3 | Business invitation | `sendBusinessInvitationEmail` | ❌ | Auth failure before send |
| 4 | Email verification | `sendVerificationEmail` | ❌ | Auth failure before send |

**Summary:** 0 / 4 passed

---

## Production API spot check

| Endpoint | Result |
|----------|--------|
| `POST /api/contact` (Cloud Run) | ❌ `500` — email delivery failed |

Production SMTP is not yet delivering mail (likely same missing/invalid Postmark configuration on Cloud Run).

---

## Verdict

| Item | Status |
|------|--------|
| Email module refactor | ✅ Deployed to `main` |
| Postmark SMTP credentials | ❌ **Not configured** for smoke test |
| Live email delivery | ❌ **Blocked** until Postmark Server API token is set |
| Operator action | Set `SMTP_USER`/`SMTP_PASS` to Postmark Server API token in Secret Manager + Cloud Run; verify sender signature for `no-reply@vssyl.com` |

---

## Rerun checklist (operator)

1. Create Postmark **Server API token** (not Account token).
2. Verify sender signature: `no-reply@vssyl.com`.
3. Export token locally: `export POSTMARK_SERVER_TOKEN=<token>` (do not commit).
4. Run smoke script (command above).
5. Confirm 4 emails in `andrew.trautman@vssyl.com` inbox.
6. Update this file with pass/fail and message IDs.

**Last run:** 2026-07-03 — all tests failed (auth).
