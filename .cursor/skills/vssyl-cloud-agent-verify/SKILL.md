---
name: vssyl-cloud-agent-verify
description: Verifies Vssyl changes in the isolated Cloud Agent workstation using local PostgreSQL, targeted checks, runtime health, and browser evidence. Use for reproduce-implement-run-inspect-verify loops, Cloud Agent testing, UI verification, or evidence-based completion checks.
---

# Vssyl Cloud Agent verification

Use the existing workstation; do not create a second environment.

## Workstation contract

- Bootstrap: `bash scripts/cloud-agent/bootstrap.sh`
- Prepare without starting servers: `bash scripts/cloud-agent/bootstrap.sh --prepare-only`
- Database: local PostgreSQL only, database `vssyl_ci`
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health: `/api/live`, `/api/ready`, `/api/health`
- Seeded tester: `place.tester@vssyl.local` / `password123`
- Credentials are synthetic. Never load production database, Stripe live, Postmark, or GCP credentials.

`scripts/cloud-agent/env.sh` is the executable authority for local database safeguards. Do not weaken or bypass its `DATABASE_URL` checks.

## Loop

1. **Reproduce** — identify the smallest failing test, route, or UI flow and capture the initial evidence.
2. **Implement** — make only the approved change under applicable Rules and source-of-truth docs.
3. **Run** — use the narrowest relevant static checks/tests. Prepare or start the workstation only when runtime evidence is needed.
4. **Inspect** — confirm server output and:

   ```bash
   curl --fail http://localhost:5000/api/live
   curl --fail http://localhost:5000/api/ready
   curl --fail http://localhost:5000/api/health
   ```

5. **Verify** — for UI-affecting work, use browser tooling against port 3000, authenticate with the seeded tester when required, exercise the changed flow, and record visual/runtime evidence.

## Completion report

Return `PASS`, `PASS WITH FINDINGS`, or `FAIL`, including:

- affected scope and checks selected;
- exact commands/flows and outcomes;
- health and browser evidence when applicable;
- skipped checks with reasons;
- findings that remain.

Never claim runtime or browser verification without evidence from the current workstation.
