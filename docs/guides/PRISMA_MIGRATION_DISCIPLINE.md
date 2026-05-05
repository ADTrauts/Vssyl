# Prisma migration discipline (R-007)

Operational playbook for schema changes and CI. Aligns with `.cursor/rules/database-prisma.mdc` and the Prisma index entry in `.cursor/rules/coding-standards.mdc`.

## Rules

1. **Never edit** `prisma/schema.prisma` by hand. It is built from `prisma/modules/**/*.prisma`.
2. **Change modules** under `prisma/modules/<domain>/`, then run **`pnpm prisma:build`**.
3. **Always create a migration** for schema changes: `pnpm prisma migrate dev --name descriptive_name` (or `--create-only` to review SQL first).
4. **CI** runs `pnpm prisma migrate deploy` against the Postgres service (see `.github/workflows/ci.yml`). Local and CI must stay compatible with migration history.

## Drift and “reset” prompts

If `migrate dev` asks to reset the database:

- Do **not** reset production or shared dev data without a backup and explicit intent.
- Prefer: `pnpm prisma migrate status`, `prisma migrate diff`, `--create-only`, and `prisma migrate resolve` as documented in coding standards.

## Quick check commands

```bash
pnpm prisma migrate status
pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
node scripts/check-migration-coverage.js
pnpm prisma:build
pnpm prisma migrate dev --name descriptive_name
```

## References

- Modular schema: `prisma/modules/`
- Build order: `pnpm prisma:build` → `pnpm prisma:generate` → migrate
