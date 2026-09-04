# Linting and Code Quality Policy

**Last verified:** 2026-09-03  
**Role:** Contributor lint/quality orientation  
**Authority:** Package scripts, ESLint configs, TypeScript configs, and `.github/workflows/ci.yml` win over this file.

---

## Current state (verified)

| Item | Reality |
|------|---------|
| Lint scripts | Root `pnpm lint` runs web + server + shared lint filters |
| Web | `pnpm --filter vssyl-web lint` → `eslint .` (`web/.eslintrc.json` or equivalent in package) |
| Server | `pnpm --filter vssyl-server lint` → `eslint . --ext .js,.jsx,.ts,.tsx` |
| Shared | Included via root `pnpm lint` |
| **CI enforcement** | **Lint is not currently run in `.github/workflows/ci.yml`.** CI runs install, shared build, Prisma generate/migrate deploy, `pnpm type-check`, `pnpm build:web`, web Vitest, and server `pnpm test`. |
| Type-check | Enforced in CI |
| Prettier | Not currently enforced as a CI gate |

Do **not** describe aspirational CI as current. Adding lint to CI belongs in a plan/PR, not as undocumented fact here.

---

## Contributor workflow

```bash
pnpm lint
# or scoped:
pnpm --filter vssyl-web lint
pnpm --filter vssyl-server lint
pnpm type-check
```

Prefer package scripts over ad-hoc `npx eslint` so configs and flags stay consistent.

Fix errors before merging when practical. Suppressions require justification.

Executable TypeScript/`any` policy: [`typescript-quality.mdc`](../.cursor/rules/typescript-quality.mdc). API/auth/logging: [`api-and-auth.mdc`](../.cursor/rules/api-and-auth.mdc).

---

## Durable quality expectations (not CI claims)

- Prefer typed Express handlers; verify `req.user` before use.
- Validate `req.body` / query / params at runtime (Zod, typeof checks, etc.).
- Use Prisma field names exactly as in schema; do not hand-edit generated `prisma/schema.prisma`.
- Prefer structured `logger` for new server code (`api-and-auth.mdc`).
- Realtime services: follow existing singleton / membership-proven patterns (see Platform Standards / chat socket patterns).

Detailed historical remediation notes from 2024-era cleanups are not current architecture and are omitted here.

---

## Related

- [`testingStrategy.md`](./testingStrategy.md) — test philosophy; CI test facts
- [`techContext.md`](./techContext.md) — stack card
- [`contributorGuide.md`](./contributorGuide.md) — navigation
- [`release-safety-gates.mdc`](../.cursor/rules/release-safety-gates.mdc) — release/CI expectations for agents
