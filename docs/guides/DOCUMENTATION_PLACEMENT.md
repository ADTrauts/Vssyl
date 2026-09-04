# Documentation placement

Where to put new docs and rules. **Agent orientation** lives in root `AGENTS.md`. **Executable agent constraints** live in `.cursor/rules/` (index: `RULES_SUMMARY.md`, workflow: `core.mdc`).

## Quick decision tree

| Content | Location |
|---------|----------|
| Agent orientation / cross-repo operating guidance | Root `AGENTS.md` (not architecture law) |
| Agent must/must-not behavior | `.cursor/rules/*.mdc` (short; cross-link long docs) |
| Platform architecture (why, diagrams, checklists) | `docs/architecture/` |
| UX standards (tokens, layouts, certification) | `docs/ux/` |
| How-to, onboarding, templates, troubleshooting | `docs/guides/` |
| Product intent, status, decisions | `memory-bank/` |
| Setup / secrets / SMTP / Stripe | `docs/setup/` |
| Deploy / Cloud Run / migrations in CI | `docs/deployment/` |
| Phased execution plans | `docs/plans/` |
| Completed session notes | `docs/archive/session-summaries/` |

## Authority reminder

- **`AGENTS.md`** — agent orientation and decision guardrails across the monorepo. **Not** a new architecture source of truth.
- **`.cursor/rules/*.mdc`** — executable / scoped coding constraints.
- **`docs/architecture/`** — architectural truth and contracts.

## Rules

- **No loose `.md` at repo root** except `README.md` and `AGENTS.md`.
- **No loose `.md` under `docs/` root** except `docs/README.md`.
- **Prefer updating** an existing file over creating a duplicate.
- **Moves:** leave a short stub redirect at the old path; archive superseded content per `docs/VSSYL_SOURCE_OF_TRUTH.md` (do not silently delete history).
- **New `.mdc` rule** only for a distinct platform concern; target under ~60 lines.

## Memory Bank vs docs

| Memory Bank | `docs/` |
|-------------|---------|
| Product contexts (`*ProductContext.md`) | Operational guides |
| `activeContext.md`, `progress.md` (status; selective agent reads) | Architecture reference (`docs/architecture/`) |
| `moduleSpecs.md` (contract) | Partner onboarding (`docs/guides/`) |
| Strategic / product roadmaps (verify currency) | Setup and deployment |

Agents must **not** universally baseline-read `activeContext.md` / `progress.md`; load them only when workstream status, recent history, sequencing, or unfinished work is materially relevant (`AGENTS.md` §2).

## Indexes to update when adding docs

- `docs/guides/README.md`
- `docs/architecture/README.md` (architecture only)
- `docs/ux/README.md` (UX only; audits under `docs/ux/audits/`)
- `docs/README.md`
- `.cursor/rules/RULES_SUMMARY.md`
- Root `AGENTS.md` when changing agent orientation or placement of agent guidance

**Last updated:** 2026-09-03
