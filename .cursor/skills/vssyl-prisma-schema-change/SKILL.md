---
name: vssyl-prisma-schema-change
description: Performs Vssyl Prisma schema and migration work using the modular schema, reviewed migrations, drift checks, and safe verification. Use for Prisma models, fields, relations, indexes, migrations, schema drift, or database-backed feature changes.
---

# Vssyl Prisma schema change

Follow `.cursor/rules/database-prisma.mdc` and `docs/guides/PRISMA_MIGRATION_DISCIPLINE.md`. Those files own the constraints and operational discipline; this Skill supplies the procedure.

## Procedure

1. Read the source-of-truth baseline and `memory-bank/databaseContext.md`.
2. Search `prisma/modules/**/*.prisma`, existing migrations, services, and tests for the owning domain and an analogous change.
3. Confirm the target is a local or explicitly approved non-production database before any migration or seed.
4. Edit only the owning file under `prisma/modules/**`. Never hand-edit generated `prisma/schema.prisma`.
5. Build and generate:

   ```bash
   pnpm prisma:build
   pnpm prisma:generate
   ```

6. Inspect status and prefer reviewable SQL:

   ```bash
   pnpm prisma migrate status
   pnpm prisma migrate dev --create-only --name descriptive_name
   ```

7. Review the generated SQL for data loss, unsafe defaults, locks, tenant effects, and compatibility. Never edit an already-applied migration.
8. Apply the new migration only to the intended local/development database, then verify generated client usage, migration coverage, relevant tests, and type-checking.
9. Report the schema module, migration path, database target, commands run, and evidence.

## Safety

- Never use `prisma migrate reset` without a separate, explicit human-approved data-loss procedure; the project hook blocks agent shell use.
- If Prisma reports drift or asks to reset, stop and inspect with status/diff. Prefer `--create-only` or `migrate resolve` when history and database already match.
- Never migrate or seed an obvious production target from a Cloud Agent.
- Do not skip a migration for a model, field, relation, constraint, or index change.
