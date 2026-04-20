# Shared package imports (R-009)

Canonical entry points for the `shared` workspace package.

## Prefer

| Area | Import pattern | Notes |
|------|------------------|--------|
| React components | `from 'shared/components'` | Re-exported from `shared/src/index.ts` |
| Types | `from 'shared/types'` or `from 'shared/types/<file>'` | Barrel includes search, file, widget, dashboard, chat, module-ai-context |
| Utils | `from 'shared/utils/...'` | e.g. `brandColors` |
| Theme | `from 'shared/styles/theme'` | |

## Avoid

- **Deep paths** like `../../../shared/src/types/...` in app code — use `shared/types` or `shared/types/<file>` so resolution stays stable when package layout changes.
- **Duplicating** the same type from different paths in one file — pick one import path.

## Package surface

`shared/src/index.ts` re-exports `./types` (full barrel including `./types/search`), `./components`, `./utils`, and `./styles/theme`.
