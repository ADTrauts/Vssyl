# Documentation placement

Where to put new docs and rules. **Agent placement policy** also lives in `.cursor/rules/RULES_SUMMARY.md` and `.cursor/rules/core.mdc`.

## Quick decision tree

| Content | Location |
|---------|----------|
| Agent must/must-not behavior | `.cursor/rules/*.mdc` (short; cross-link long docs) |
| Platform architecture (why, diagrams, checklists) | `docs/architecture/` |
| UX standards (tokens, layouts, certification) | `docs/ux/` |
| How-to, onboarding, templates, troubleshooting | `docs/guides/` |
| Product intent, status, decisions | `memory-bank/` |
| Setup / secrets / SMTP / Stripe | `docs/setup/` |
| Deploy / Cloud Run / migrations in CI | `docs/deployment/` |
| Phased execution plans | `docs/plans/` |
| Completed session notes | `docs/archive/session-summaries/` |

## Rules

- **No loose `.md` at repo root** except `README.md`.
- **No loose `.md` under `docs/` root** except `docs/README.md`.
- **Prefer updating** an existing file over creating a duplicate.
- **Moves:** leave a short stub redirect at the old path; archive superseded content per `docs/VSSYL_SOURCE_OF_TRUTH.md` (do not silently delete history).
- **New `.mdc` rule** only for a distinct platform concern; target under ~60 lines.

## Memory Bank vs docs

| Memory Bank | `docs/` |
|-------------|---------|
| Product contexts (`*ProductContext.md`) | Operational guides |
| `activeContext.md`, `progress.md` | Architecture reference (`docs/architecture/`) |
| `moduleSpecs.md` (contract) | Partner onboarding (`docs/guides/`) |
| Strategic roadmaps | Setup and deployment |

## Indexes to update when adding docs

- `docs/guides/README.md`
- `docs/architecture/README.md` (architecture only)
- `docs/ux/README.md` (UX only)
- `docs/README.md`
- `.cursor/rules/RULES_SUMMARY.md`

**Last updated:** 2026-05-16
