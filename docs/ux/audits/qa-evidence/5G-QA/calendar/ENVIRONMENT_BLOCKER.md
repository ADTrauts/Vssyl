# QA Environment — Calendar 5G-QA-EXEC (Re-run)

**Date:** 2026-06-12  
**Finding ID:** **QA-ENV-01** — **RESOLVED** (prior session)  
**Status:** Environment **functional** for re-run

---

## Re-run environment

| Item | Value |
|------|-------|
| **Target** | Local dev `http://localhost:3000` |
| **Commit** | `b393ab4f` |
| **Web** | Next.js 14.1 turbo — calendar routes **compile** |
| **API** | `http://localhost:5000` (JWT via inline env for QA session) |
| **Auth** | QA account `qa-calendar-5g-exec-2026@test.com` (registered session) |
| **NEXTAUTH_URL** | `http://localhost:3000` (required — default 3000 mismatch caused login timeout on :3001) |

## Prior blocker (resolved)

QA-ENV-01 (`menuShared.js`) fixed in `cc81dc19` / `b393ab4f`. Calendar UI loads in dev and production compile.

## Session notes

- Staging (`https://vssyl.com`) returned blank shell in automated browser (auth/session); not used for matrix.
- Event seed: 1 event via API (`[QA] Calendar Event 5G`) after UI Create overlay blocked pointer events.
- Residual env: `.env` lacks `JWT_SECRET`; backend started with inline env for QA only (**QA-ENV-02**).

---

*Updated for Wave 5G-QA-EXEC re-run — 2026-06-12.*
