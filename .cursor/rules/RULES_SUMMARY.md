# Vssyl Application Rules - Quick Reference

Quick index; each `.mdc` file is the source of truth for its topic.

## Rule files (`.cursor/rules/`)

| File | Role |
|------|------|
| **`source-of-truth.mdc`** | Repo vs Memory Bank authority; stop on conflicts |
| **`core.mdc`** | Plan/act, reuse-first, baseline reads, pointers to Memory Bank for roadmap |
| **`memory-bank.mdc`** | Documentation placement; **baseline reads** (`VSSYL_SOURCE_OF_TRUTH.md`, `activeContext`, `progress`) + task-specific Memory Bank files |
| **`coding-standards.mdc`** | **Index** to split standards below (legacy “coding standards” = this index + splits) |
| **`api-and-auth.mdc`** | URLs, env, auth, proxy, clients, tenancy, validation, logging, dev workflow |
| **`database-prisma.mdc`** | Modular Prisma, pnpm commands, migrations, drift (globs: `prisma/**`, `server/**`) |
| **`storage-and-ai-attachments.mdc`** | `storageService`, GCS, vision pipeline (globs: `server/src/services/**`, `server/src/ai/**`) |
| **`ui-standards.mdc`** | `shared/components`, contrast (globs: `web/**/*.tsx`, `shared/**/*.tsx`) |
| **`typescript-quality.mdc`** | `any` policy, routers, Prisma JSON |
| **`module-development.mdc`** | Short module checklist; long form: `docs/guides/MODULE_DEVELOPMENT_LONG_REFERENCE.md` |
| **`module-interoperability.mdc`** | `moduleSpecs.md` contract enforcement |
| **`backend-trust-boundaries.mdc`** | Auth, tenancy, sockets, webhooks |
| **`frontend-proxy-auth-consistency.mdc`** | Proxy, auth UX, providers |
| **`release-safety-gates.mdc`** | CI, deploy, health, rollback |
| **`memory-bank/AI_CODING_STANDARDS.md`** | Additional AI-oriented code notes (if present) |

## Critical rules (must follow)

1. **Source of truth** — `docs/VSSYL_SOURCE_OF_TRUTH.md` + `source-of-truth.mdc`; repo vs Memory Bank conflicts get flagged before coding.
2. **Reuse-first** — `core.mdc`; search codebase and Memory Bank before new routes/models/components.
3. **Backend trust boundaries** — Never trust client-supplied authority IDs alone; prove membership before IO (`backend-trust-boundaries.mdc`).
4. **Frontend proxy** — Browser calls through `/api/*` proxy / shared helpers (`frontend-proxy-auth-consistency.mdc`, `api-and-auth.mdc`).
5. **Release safety** — CI and startup gates (`release-safety-gates.mdc`).
6. **Env / URLs** — No localhost in production paths; hierarchy in `api-and-auth.mdc`.
7. **Prisma** — Edit `prisma/modules/**` only; migrations required (`database-prisma.mdc`).
8. **Tenancy** — Scope queries per context (`api-and-auth.mdc`).
9. **TypeScript** — No careless `any` (`typescript-quality.mdc`).
10. **Modules** — Interop + hub + AI context + notifications + trash (`module-interoperability.mdc`, `module-development.mdc`).
11. **Docs placement** — `memory-bank.mdc` (no root `.md` except README).

## When to open which rule

- **Any task:** `source-of-truth.mdc`, `core.mdc`, baseline Memory Bank per `memory-bank.mdc`.
- **API / server / client fetch:** `api-and-auth.mdc`, `backend-trust-boundaries.mdc`.
- **Frontend UI:** `ui-standards.mdc`, `frontend-proxy-auth-consistency.mdc`.
- **Schema / DB:** `database-prisma.mdc`, `docs/guides/PRISMA_MIGRATION_DISCIPLINE.md`.
- **Storage / AI vision:** `storage-and-ai-attachments.mdc`.
- **New module or module surface:** `module-interoperability.mdc`, `module-development.mdc`, long reference in `docs/guides/`.
- **Deploy / CI:** `release-safety-gates.mdc`.

## Quick checklist before a change

- [ ] Baseline: `VSSYL_SOURCE_OF_TRUTH.md`, `activeContext.md`, `progress.md`
- [ ] Reuse-first search done (`core.mdc`)
- [ ] Module work: `moduleSpecs.md` / `module-interoperability.mdc`
- [ ] No localhost in production paths; proxy pattern preserved
- [ ] Tenancy scoped; trust boundaries respected
- [ ] Prisma workflow if schema touched
- [ ] Type safety / lint expectations (`typescript-quality.mdc`)

**Last updated:** 2026-05-05
