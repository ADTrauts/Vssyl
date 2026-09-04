# Contributor Guide

**Last verified:** 2026-09-03  
**Role:** Short onboarding / navigation for humans and agents  
**Authority:** Root [`AGENTS.md`](../AGENTS.md) and `docs/VSSYL_SOURCE_OF_TRUTH.md` win. This guide does **not** duplicate them.

---

## Do not

- **Do not** read the entire Memory Bank by default.
- **Do not** treat Memory Bank as architecture or implementation truth.
- **Do not** invent parallel systems beside existing platform owners.

---

## Default discovery sequence

1. Root [`AGENTS.md`](../AGENTS.md) — orientation and guardrails  
2. [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../docs/VSSYL_SOURCE_OF_TRUTH.md) — authority hierarchy  
3. Inspect **task-relevant code**, tests, schema, and config  
4. [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md) — locate canonical architecture  
5. Load relevant scoped [`.cursor/rules/`](../.cursor/rules/) (see [`RULES_SUMMARY.md`](../.cursor/rules/RULES_SUMMARY.md))  
6. Load targeted Memory Bank `*ProductContext.md` / [`moduleSpecs.md`](./moduleSpecs.md) only when product intent matters  
7. Load [`activeContext.md`](./activeContext.md) / [`progress.md`](./progress.md) only when current workstream status is materially relevant  

Full discipline: `AGENTS.md` §2 and [`memory-bank.mdc`](../.cursor/rules/memory-bank.mdc).

---

## Local setup (high level)

1. Install with **pnpm** (`packageManager` pinned in root `package.json`).  
2. Configure env from `.env.example` (and package-specific env as required).  
3. `pnpm prisma:generate` then `pnpm dev` (web **:3002**, server default **:5000** unless `PORT` set).  
4. Details: [`techContext.md`](./techContext.md), root `README.md`, `docs/setup/`.

---

## Before changing something

1. Search for an existing owner (reuse-first).  
2. Confirm architecture owner via Architecture Index / `ARCHITECTURE_SOURCE_OF_TRUTH.md`.  
3. Follow Prisma / API / module rules when applicable.  
4. Prefer extending certified/reference patterns (File Hub for modules).

---

## Validation (common)

| Goal | Command |
|------|---------|
| Dev | `pnpm dev` |
| Types | `pnpm type-check` |
| Server tests | `pnpm test` |
| E2E | `pnpm test:e2e` |
| CI-like | `pnpm verify:ci` |
| Lint (local; not currently in CI gate) | `pnpm lint` |
| Secret scan (docs/scripts/config/secrets-adjacent) | `pnpm security:secrets` |

Run `pnpm security:secrets` before committing documentation, scripts, deployment/config, or other secrets-adjacent changes. Full-history audit (`pnpm security:secrets:history`) is manual/informational only.

Do not claim validation passed unless the command actually succeeded.

---

## Documentation placement

| Content | Location |
|---------|----------|
| Agent orientation | `AGENTS.md` |
| Executable constraints | `.cursor/rules/` |
| Architecture | `docs/architecture/` |
| How-to | `docs/guides/` |
| Product intent / selective status | `memory-bank/` |
| Deploy | `docs/deployment/` |

See [`DOCUMENTATION_PLACEMENT.md`](../docs/guides/DOCUMENTATION_PLACEMENT.md).

---

## Related orientation

- Memory Bank role: [`README.md`](./README.md)  
- Pattern index: [`systemPatterns.md`](./systemPatterns.md)  
- Stack card: [`techContext.md`](./techContext.md)  
- Testing philosophy: [`testingStrategy.md`](./testingStrategy.md)  
- Lint policy (aspirational vs CI): [`lintingAndCodeQuality.md`](./lintingAndCodeQuality.md)
