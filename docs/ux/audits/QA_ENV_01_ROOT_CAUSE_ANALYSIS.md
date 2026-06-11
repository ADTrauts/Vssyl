# QA-ENV-01 Root Cause Analysis

**Wave:** QA-ENV-01 — Environment investigation and remediation  
**Date:** 2026-06-03  
**Status:** **RESOLVED**  
**Related:** [ENVIRONMENT_BLOCKER.md](./qa-evidence/5G-QA/calendar/ENVIRONMENT_BLOCKER.md), [CALENDAR_QA_EXECUTION_REPORT_2026.md](./CALENDAR_QA_EXECUTION_REPORT_2026.md)

---

## Executive summary

Calendar QA (5G-QA-EXEC) was blocked because Next.js turbo could not resolve `./menuShared.js` when compiling `ContextMenu.tsx` and `DropdownMenu.tsx` from **shared source** (`shared/src/`). Type-check passed because TypeScript's `moduleResolution: bundler` maps `.js` import specifiers to `.tsx` sources. Next.js/webpack/turbo does not perform that mapping when bundling aliased source files.

**Fix:** Change relative imports from `./menuShared.js` to `./menuShared` in the two affected shared components — matching every other internal import in `shared/src/components/`.

**Scope:** Platform-wide (any route importing `ContextMenu` or `DropdownMenu`), not Calendar-specific.

---

## Symptom

```
Module not found: Can't resolve './menuShared.js'
```

**Referenced by:**

- `shared/src/components/ContextMenu.tsx`
- `shared/src/components/DropdownMenu.tsx`

**Observed on disk:** `shared/src/components/menuShared.tsx` (no `menuShared.js` sibling in `src/`)

**First seen:** Wave 5G-QA-EXEC — `/calendar/month` failed to compile in local `pnpm dev` (turbo).

---

## Investigation findings

### 1. Why type-check passes while runtime compilation fails

| Layer | Resolution behavior | Result |
|-------|---------------------|--------|
| `pnpm type-check` | Runs `build:shared` (tsc → `shared/dist/`), then `tsc --noEmit` on web/server | **PASS** |
| TypeScript (web) | `moduleResolution: bundler` in `web/tsconfig.json` resolves `./menuShared.js` → `./menuShared.tsx` | Types OK |
| Next.js dev (turbo) | `web/tsconfig.json` path alias `shared/components` → `../shared/src/components` — bundles **source**, not `dist` | **FAIL** — literal `./menuShared.js` not found in `src/` |

Type-check validates types against source via path aliases and TS extension remapping. Next.js compiles the same source files but resolves import paths literally (no `.js` → `.tsx` rewrite).

### 2. Incorrect extension in ContextMenu imports

`ContextMenu.tsx` and `DropdownMenu.tsx` were the **only** files in `shared/src/` using ESM-style `./foo.js` relative imports (introduced in Wave 3A-2 `menuShared` extraction). All other shared components use extensionless paths (e.g. `from './Button'`).

The `.js` suffix is valid for **compiled output** (`shared/dist/components/menuShared.js` exists after `tsc`) but invalid when Next.js reads **source** directly.

### 3. tsconfig / path aliases masking the issue

```json
// web/tsconfig.json
"shared/components": ["../shared/src/components"]
```

Web never consumes `shared/dist` at dev/runtime compile time. `pnpm build:shared` succeeding gave a false sense that the shared package was "ready" — dist artifacts are used by server imports and type declarations, not by Next.js turbo for these components.

`web/next.config.js` does not set `transpilePackages` for `vssyl-shared`; resolution is entirely via TS path aliases into `shared/src`.

### 4. Platform scope (not Calendar-specific)

Any consumer of `ContextMenu` or `DropdownMenu` from `shared/components` would fail the same way, including:

| Module / surface | Example consumer |
|------------------|------------------|
| Calendar | `CalendarMonthView`, `CalendarDayView`, `CalendarWeekView`, `useCalendarEventContextMenu` |
| Chat | `MobileChat`, `ChatWindow`, `ChatMainPanel` |
| Todo | `TaskItem` |
| Notifications | `notifications/page.tsx` |
| Drive | `DriveModule`, `DriveSidebar` |
| Platform chrome | `platformHeaderActionComponents`, `AvatarContextMenu` |

Calendar was the first route exercised during 5G-QA-EXEC, so the failure appeared Calendar-specific.

### 5. Shared-package build vs Next.js consumption

| Artifact | Path | Used by |
|----------|------|---------|
| Source | `shared/src/components/*.tsx` | Next.js (via path alias) |
| Dist | `shared/dist/components/*.js` | Server, `tsc` references, package `main` |

`shared/package.json` points `main` at `dist/index.js` but web aliases bypass the package entry and read `src/`. Internal `.js` imports work in dist (tsc emits `from './menuShared'` without extension issues) but break in src when Next resolves literally.

---

## Remediation

### Files modified

| File | Change |
|------|--------|
| `shared/src/components/ContextMenu.tsx` | `./menuShared.js` → `./menuShared` (import + re-export) |
| `shared/src/components/DropdownMenu.tsx` | `./menuShared.js` → `./menuShared` |

No changes to `menuShared.tsx`, tsconfig, Next config, or Calendar code.

### Post-fix validation (2026-06-03)

**Dev compile (Next.js 14.1 turbo, localhost:3001):**

| Route | Compile result | HTTP |
|-------|----------------|------|
| `/calendar/month` | ✓ Compiled | 200 |
| `/calendar/day` | ✓ Compiled | 200 |
| `/calendar/week` | ✓ Compiled | 200 |
| `/calendar/year` | ✓ Compiled | 200 |
| `/chat` | ✓ Compiled | 200 |
| `/todo` | ✓ Compiled | 200 |
| `/notifications` | ✓ Compiled | 200 |

**Static analysis:**

- `pnpm build:shared` — PASS
- `pnpm type-check` (shared + web + server) — PASS

---

## CLI / CI build relevance

Root `package.json` `build` script runs `build:shared` then `vssyl-web build`. The same path-alias + source transpilation pattern applies in production builds. The **identical** `menuShared.js` resolution failure would surface in `next build` / Cloud Build web step if those routes or any `ContextMenu` consumer were compiled — same root cause, same fix.

`verify:ci` (`build:shared && type-check && test`) would **not** have caught this without a web compile step.

---

## Additional environment risks

| ID | Risk | Severity | Notes |
|----|------|----------|-------|
| QA-ENV-02 | `JWT_SECRET` missing — backend fails on `pnpm dev` | P1 for full-stack QA | Separate from QA-ENV-01; blocks API-backed cases |
| QA-ENV-03 | Port 3000 conflict → dev on 3001 | Low | Document port when running QA |
| QA-ENV-04 | `verify:ci` skips `next build` | Medium | **Resolved** — see [QA_ENV_04_BUILD_VALIDATION_CLOSEOUT.md](../../architecture/audits/QA_ENV_04_BUILD_VALIDATION_CLOSEOUT.md) |
| QA-ENV-05 | Path aliases to `shared/src` vs `dist` dual consumption | Low | Document convention: extensionless relative imports in `shared/src` |

---

## 5G-QA-EXEC readiness

| Item | Status |
|------|--------|
| QA-ENV-01 (frontend compile) | **Resolved** |
| E-14 (manual QA matrix) | **Still open** — not executed in this wave |
| 5G-QA-EXEC re-attempt | **Unblocked for frontend compile** — re-run allowed after QA-ENV-02 addressed if full-stack cases needed |
| 5G-Calendar-D | **Not ready** — requires successful QA matrix |

---

## Prevention

1. **Convention:** Use extensionless relative imports inside `shared/src/` (match `index.ts` barrel pattern).
2. **Review:** When adding ESM `.js` suffix imports for dist emit, restrict to files only consumed via `dist`, or verify Next path-alias consumers.
3. **CI:** Optional `pnpm --filter vssyl-web build` in pre-QA or nightly pipeline to catch bundler-only resolution gaps.

---

*QA-ENV-01 closed — remediation only; no certification changes, no QA re-execution in this wave.*
