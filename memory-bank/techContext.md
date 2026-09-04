# Technical Context

**Last verified:** 2026-09-03  
**Role:** Concise technical orientation  
**Authority:** Code/configuration and canonical operational docs win. Do not treat this file as deployment or version SoT.

Historical stack/incident encyclopedia: [`docs/archive/session-summaries/tech-context-archive-2026-09-pretrim.md`](../docs/archive/session-summaries/tech-context-archive-2026-09-pretrim.md).

---

## Monorepo

| Item | Current |
|------|---------|
| Packages | `web/`, `server/`, `shared/` (`pnpm-workspace.yaml`) |
| Package manager | **pnpm** (`packageManager`: `pnpm@10.11.0` in root `package.json`) |
| Node | `>=20 <21` (root `engines`) |
| Product name | **Vssyl** (not “Block-on-Block”) |

Root scripts of note: `pnpm dev`, `pnpm test` (server Vitest), `pnpm test:e2e` (Playwright), `pnpm type-check`, `pnpm verify:ci`, `pnpm build`, `pnpm lint`, `pnpm prisma:*`.

---

## Frontend

| Item | Current |
|------|---------|
| App | Next.js **14.1.0** + React 18 (`web/`) |
| Dev server | `next dev --turbo --port **3002**` (`web` `dev` script) |
| Tests | **Vitest** (`web` `test`) |
| API calls | Relative `/api/...` via Next proxy — see `api-and-auth.mdc` |

---

## Backend

| Item | Current |
|------|---------|
| App | Express + TypeScript (`server/`) |
| Dev | `ts-node-dev` (`server` `dev`) |
| Default port | `process.env.PORT \|\| **5000**` (`server/src/index.ts`) |
| Tests | **Vitest** (`server` `test`) |
| Auth | Passport/JWT patterns; verify `req.user` |
| Realtime | Socket.IO (membership-proven rooms) |

---

## Database / Prisma

| Item | Current |
|------|---------|
| Schema source | **`prisma/modules/**/*.prisma`** (edit these) |
| Generated | **`prisma/schema.prisma`** — **do not hand-edit** |
| Workflow | `pnpm prisma:build` → `pnpm prisma:generate` → migrate |
| Rules | [`.cursor/rules/database-prisma.mdc`](../.cursor/rules/database-prisma.mdc) |
| Orientation | [`databaseContext.md`](./databaseContext.md) |

---

## Testing

| Layer | Tool | Command |
|-------|------|---------|
| Server unit/integration | Vitest | `pnpm test` / `pnpm test:server` |
| Web unit | Vitest | `pnpm --filter vssyl-web test` |
| E2E | Playwright | `pnpm test:e2e` |
| CI verify | type-check + web build + server test | `pnpm verify:ci` (see `.github/workflows/ci.yml`) |

**Lint:** `pnpm lint` exists at root but is **not** currently part of `verify:ci` / GitHub Actions CI (as of 2026-09-03). Treat lint as a local/contributor quality gate unless CI is updated.

Philosophy: [`testingStrategy.md`](./testingStrategy.md).

---

## Local Development

```bash
pnpm install
# configure env from .env.example (and package-specific env as needed)
pnpm prisma:generate
pnpm dev   # web :3002 + server (default :5000 unless PORT set)
```

Do not hardcode localhost in production-capable paths — use env URL hierarchy (`api-and-auth.mdc`).

---

## Build / Validation

| Goal | Command |
|------|---------|
| Type-check | `pnpm type-check` |
| Full build | `pnpm build` |
| CI-like gate | `pnpm verify:ci` |
| Lint (local) | `pnpm lint` |

Prefer focused package/test commands when changing a single area.

---

## Deployment Orientation

Operational truth lives under **`docs/deployment/`** (index: [`docs/deployment/README.md`](../docs/deployment/README.md)).

Notable: manual Cloud Build path may apply — see deployment README (“push to main does not auto-deploy” as documented there). Do not invent infra details here; read current runbooks.

Setup for external services: **`docs/setup/`**.

---

## Canonical Technical References

| Topic | Owner |
|-------|--------|
| Agent orientation | Root [`AGENTS.md`](../AGENTS.md) |
| Architecture map | [`VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md) |
| Patterns index | [`systemPatterns.md`](./systemPatterns.md) |
| Prisma rules | `database-prisma.mdc` |
| API / proxy / tenancy | `api-and-auth.mdc` |
| Release / CI safety | `release-safety-gates.mdc` |
| Deployment | `docs/deployment/` |
