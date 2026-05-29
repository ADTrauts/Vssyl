# Legacy cleanup and deprecation tracker

**Status:** Governance tracker — Batch 1+ execution  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.3, §0.4, §30

## Deprecation process

1. **Mark** — `@deprecated` in code, banner in docs, entry in this file
2. **Overlap** — minimum one release with dual path (PE dual-enforcement pattern)
3. **Migrate** — consumers to canonical system per §30 batches
4. **Archive** — move docs to `docs/archive/` with stub redirect per [VSSYL_SOURCE_OF_TRUTH.md](../VSSYL_SOURCE_OF_TRUTH.md)
5. **Remove** — code only after zero callers + `progress.md` note

## Active deprecations

| Item | Location(s) | Replacement | Batch | Status |
|------|-------------|-------------|-------|--------|
| Duplicate module registration scripts | `scripts/register-built-in-modules.ts`, `server/src/scripts/register-built-in-modules.ts`, `scripts/ensure-builtin-modules.ts` | `server/src/startup/registerBuiltInModules.ts` | 1 | Documented |
| Memory Bank Cursor rules copy | `memory-bank/.cursor/rules` | `.cursor/rules/` | 1 | Archived stub |
| AI coding standards (Memory Bank) | `memory-bank/AI_CODING_STANDARDS.md` | `.cursor/rules/typescript-quality.mdc`, `api-and-auth.mdc`, `RULES_SUMMARY.md` | 1 | Deprecated banner |
| Org-chart parallel RBAC | `server/src/middleware/orgChartPermissions.ts` | Policy Engine resource adapter | 3 | Planned |
| Notes `deletedAt` soft delete | `notesController` | Global Trash `trashedAt` | 2 | Planned |
| WorkflowAutomationService | `server/src/ai/workflows/WorkflowAutomationService.ts` | Domain event → canonical service router (§23) | 4 | Tier 4 |
| AI autonomous routes | `/api/ai/autonomous/*` | `/api/ai/twin` + governed actions | — | Deprecated |
| E2E `.js` spec pairs | `tests/e2e/*.js` | `.ts` specs only | 1 | Planned |
| Dead WorkspaceLanding components | `hr`, `scheduling`, `vlink` | Documented hub/wrapper pattern | 2 | Planned |
| Fragmented crons | `index.ts`, `cleanupService`, `setInterval` loops | §22 Platform Job Registry | 4 | Inventory complete |
| Dual widget/module icon switches | `BrandedWorkDashboard`, `moduleIcons.ts` | `coreModuleRegistry` lookups | 3 | Planned |
| Jest references in testing docs | `memory-bank/testingStrategy.md` | Vitest + Playwright | 1 | Planned |

## Script deprecation notes

**Do not use** standalone registration scripts for normal deploys. Built-in modules register on server startup via `registerBuiltInModulesOnStartup()`.

Legacy scripts remain for one-off admin recovery only until removed in Batch 1 polish.

## Archived documentation

| Former location | Archive / redirect |
|-----------------|-------------------|
| `memory-bank/.cursor/rules` | Stub points to `.cursor/rules/RULES_SUMMARY.md` |
| `memory-bank/AI_CODING_STANDARDS.md` | Deprecated banner; use split `.mdc` rules |

**Last updated:** 2026-05-28
