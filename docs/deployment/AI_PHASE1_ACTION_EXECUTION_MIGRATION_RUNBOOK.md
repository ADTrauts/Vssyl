# AI Phase 1 — Action Execution Migration Runbook

**Program:** AI Architecture Phase 1 / 1B  
**Migration:** `prisma/migrations/20260712150000_ai_action_execution_phase1`  
**Table:** `ai_action_executions`  
**Date:** 2026-07-12  

---

## Prerequisites

- Prisma CLI available via workspace (`pnpm prisma` / package scripts)
- Database URL set (`DATABASE_URL`)
- Do **not** squash or rewrite older migrations to “clean” history
- Treat pre-existing migration drift as a separate ops issue from this additive migration

---

## What this migration adds

- Table `ai_action_executions` (idempotency / execution ledger)
- Unique index on `idempotencyKey`
- Indexes on `userId+actionName`, `businessId`, `approvalId`, `status`
- FK `userId` → `users(id)` ON DELETE CASCADE
- SQL uses `CREATE TABLE IF NOT EXISTS` / `CREATE UNIQUE INDEX IF NOT EXISTS` / duplicate_object-safe FK for local re-apply safety

---

## Clean / fresh environment procedure

```bash
# From repo root
pnpm prisma:build
pnpm prisma:generate
pnpm exec prisma validate

# Apply all migrations from empty DB (preferred for CI / new environments)
pnpm exec prisma migrate deploy
```

Verify:

```bash
pnpm exec prisma db execute --stdin <<'SQL'
SELECT COUNT(*) AS c FROM information_schema.tables
WHERE table_name = 'ai_action_executions';
SQL
```

Expect `c = 1`. Confirm model appears once in generated `prisma/schema.prisma` as `model AIActionExecution`.

---

## Staging / production application

1. Deploy migration **before** or **with** the server build that writes to `AIActionExecution`.
2. Prefer: `prisma migrate deploy` (non-interactive).
3. Do **not** run `prisma migrate reset` in production.
4. Do **not** require interactive `migrate dev` (it may prompt because of older drift).

### If `_prisma_migrations` already marked applied but table missing

```bash
pnpm exec prisma db execute --file prisma/migrations/20260712150000_ai_action_execution_phase1/migration.sql
# Then ensure migration history row exists; if missing:
pnpm exec prisma migrate resolve --applied 20260712150000_ai_action_execution_phase1
```

### If table already exists (local Phase 1A manual apply) but migration not recorded

```bash
pnpm exec prisma migrate resolve --applied 20260712150000_ai_action_execution_phase1
```

---

## Drift warning

Older migrations may block interactive `migrate dev` with a reset prompt. That is **pre-existing** and unrelated to Phase 1 content. Document and remediate drift in a dedicated ops track; do not edit historical migration files solely for cosmetics.

---

## Rollback / forward-fix

- **Preferred:** forward-fix (keep table; disable feature flags / stop writing if needed).
- **Destructive rollback** (dev only): drop table `ai_action_executions` only if no production data depends on it.
- Production rollback of code that reads/writes the ledger without dropping the table is safe.

---

## Health checks after deploy

1. Server boots / imports succeed.
2. `share_file` Twin tool creates `AIApprovalRequest` + `AIActionExecution` with `AWAITING_APPROVAL`.
3. Approve via `POST /api/ai/approvals/:id/respond` completes ledger to `COMPLETED` once.
4. Duplicate approve returns idempotent replay.

---

## Failure handling

| Symptom | Action |
|---------|--------|
| Unique constraint on create | Expected for concurrent retries — treat as replay |
| FK user missing | Client bug / deleted user — do not disable FK |
| Migration already applied | `migrate resolve --applied` if history lagging |

---

## No data-destructive command required

Applying this migration does not truncate or alter user/business data outside the new table.
