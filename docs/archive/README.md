# Documentation archive (`docs/archive/`)

Historical material kept for **audit trail and recovery**, not day-to-day onboarding. Prefer **`docs/guides/`**, **`docs/setup/`**, **`docs/deployment/`**, **`docs/plans/`**, and **`memory-bank/`** for current truth.

## Layout

| Path | Contents |
|------|----------|
| **`session-summaries/`** | Per-session or per-theme writeups (business workspace, admin, org chart, fixes, migrations, trimmed `activeContext`/`progress`/`systemPatterns`/`techContext` pretrims, Batch 1A Memory Bank historical plans/summaries, etc.) |
| **`migration/`** | Baseline / migration snapshots, drift notes, `CLEAN_RESTART_*`, `DEPLOYMENT_INSTRUCTIONS`, audit reports, pricing-system-simplification |
| **`guides-merged-2026/`** | Long AI architecture + module AI guides + deprecated AI coding standards consolidated out of living trees (see folder README) |
| **`stripe-merged-2026/`** | Superseded Stripe markdown (see folder README) |
| **`hr-merged-2026/`** | HR framework “complete” era docs + Priority-2 onboarding plan (see folder README) |
| **`troubleshooting-historical-incidents.md`** | Full platform incident log (moved from `memory-bank/troubleshooting.md` body) |

## Living guides index

For current implementation docs (not archive), see **`docs/guides/README.md`**.

## Rules

1. **Do not** resurrect archive files as canonical without merging into `memory-bank/` or `docs/guides/` first.  
2. **New** session writeups go under `session-summaries/` (or a dated subfolder if you introduce one).  
3. When archiving, add a one-line pointer from the living doc (as done for AI / Stripe / HR / active context).
4. **Never preserve literal credentials or secret payloads in archives.** Historical implementation details may be kept; passwords, full credential-bearing URLs, private keys, tokens, and similar material must be redacted. Placeholders only; runtime secrets belong in managed secret systems.
