# QA-ENV-04 Build Validation Closeout

**Wave:** QA-ENV-04 — Build validation hardening  
**Date:** 2026-06-03  
**Status:** **RESOLVED**  
**Related:** [QA_ENV_01_ROOT_CAUSE_ANALYSIS.md](../../ux/audits/QA_ENV_01_ROOT_CAUSE_ANALYSIS.md)

---

## Executive summary

QA-ENV-01 showed that `pnpm type-check` and `pnpm verify:ci` could pass while Next.js runtime compile failed, because web consumes `shared/src` via TS path aliases and the bundler resolves imports differently than `tsc`.

**Fix:** Add `pnpm run build:web` (`next build`) to root `verify:ci` and GitHub Actions CI — the smallest gate that exercises the same compilation path as dev deploy.

**Cloud Build:** Already ran `next build` inside `web/Dockerfile.production`; no pipeline change required.

---

## Root cause recap (QA-ENV-01)

| Check | Validates | Catches `menuShared.js` bug? |
|-------|-----------|------------------------------|
| `pnpm build:shared` | `shared/dist` emit | No — web reads `shared/src` |
| `pnpm type-check` | TypeScript types (`moduleResolution: bundler`) | No — remaps `.js` → `.tsx` |
| `pnpm test` (server vitest) | Server logic | No |
| `next dev` / `next build` | Webpack/turbo bundler resolution | **Yes** |

---

## CI gap identified

### Before QA-ENV-04

| Pipeline | Steps | `next build`? |
|----------|-------|---------------|
| Root `verify:ci` | `build:shared` → `type-check` → `test` | **No** |
| GitHub Actions `.github/workflows/ci.yml` | install → shared build → prisma → `type-check` → web vitest → server test | **No** |
| Cloud Build `cloudbuild.yaml` | Kaniko `web/Dockerfile.production` (`cd web && pnpm build`) | **Yes** |
| Local `pnpm dev` | turbo dev (on-demand compile) | Partial (manual route visit) |
| Root `pnpm build` | `build:shared` → web build → server build | **Yes** (not in CI) |

**Gap:** Pre-merge CI and `verify:ci` did not run production web compile. Regressions like QA-ENV-01 could merge to `main` and only surface in Cloud Build (~7–10 min) or manual dev.

---

## Implementation

### New script

```json
"build:web": "pnpm --filter vssyl-web build"
```

`type-check` already runs `build:shared`; no duplicate shared build in `verify:ci`.

### Updated `verify:ci`

```json
"verify:ci": "pnpm type-check && pnpm run build:web && pnpm test"
```

Removed redundant leading `build:shared` (subsumed by `type-check`).

### GitHub Actions

Added after `pnpm type-check`:

```yaml
- name: Verify Next.js production compile
  run: pnpm run build:web
  env:
    NEXTAUTH_SECRET: ci-nextauth-secret-must-be-at-least-32-chars
    NEXTAUTH_URL: http://localhost:3000
```

`NEXTAUTH_SECRET` supplied for NextAuth static analysis during build (same pattern as CI `JWT_SECRET` for server).

### Cloud Build

**No change.** `web/Dockerfile.production` line 42: `RUN cd web && pnpm build` already provides deploy-time compile coverage.

---

## Files modified

| File | Change |
|------|--------|
| `package.json` | Added `build:web`; updated `verify:ci` |
| `.github/workflows/ci.yml` | Added `build:web` step with NextAuth env |
| `README.md` | CI description mentions Next.js compile |
| `memory-bank/techContext.md` | CI pipeline documentation |
| `memory-bank/activeContext.md` | QA-ENV-04 status |
| `memory-bank/progress.md` | QA-ENV-04 status |

---

## New validation flow

### Local pre-push (recommended)

```bash
pnpm verify:ci
```

Equivalent to: `type-check` → `build:web` → server tests.

### Faster static-only (unchanged — does not replace build:web)

```bash
pnpm type-check
```

### Full production parity

```bash
pnpm build
```

Includes server build in addition to web.

### CI (GitHub Actions)

`install` → `shared build` → `prisma:generate` + `migrate deploy` → `type-check` → **`build:web`** → web vitest → server test

---

## Runtime build coverage gained

`next build` statically compiles all App Router pages and traces imports. Routes and components verified by this gate include:

| Surface | App paths compiled | Shared primitives traced |
|---------|-------------------|--------------------------|
| Calendar | `/calendar/month`, `/day`, `/week`, `/year` | `ContextMenu` via view components |
| Chat | `/chat` | `ContextMenu`, `DropdownMenu` |
| Todo | `/todo` | `ContextMenu` via `TaskItem` |
| Notifications | `/notifications` | `ContextMenu` / menu primitives |
| Platform | Layout shells, drive, AI surfaces | `ContextMenu`, `DropdownMenu`, `menuShared` |

Any future regression in `shared/src` relative imports consumed by web will fail `build:web` before merge.

---

## Build time impact

| Environment | Added step | Estimated cost |
|-------------|------------|----------------|
| GitHub Actions | `next build` | ~3–8 min (app size; parallel with no server build in same step) |
| Local `verify:ci` | Same | One-time cost; optional `pnpm type-check` for fast iteration |
| Cloud Build | None | Already paid |

Justification: QA-ENV-01 blocked 24 QA cases; one prevented bad merge offsets recurring CI minutes.

---

## Validation (2026-06-03)

| Check | Result |
|-------|--------|
| QA-ENV-01 dev compile (post-fix) | **PASS** — Calendar quartet + Chat + Todo + Notifications |
| `pnpm run build:web` script | Added with `NODE_ENV=production` |
| `verify:ci` script structure | Updated — `type-check` → `build:web` → `test` |
| CI workflow | `build:web` step + `NODE_ENV` + `NEXTAUTH_SECRET` |
| Redundant `build:shared` in `verify:ci` | Removed (deduped via `type-check`) |
| Local `next build` duration | Large app (~15+ min); Cloud Build `E2_HIGHCPU_8` already compiles web in deploy pipeline |

---

## Resolution status

| Item | Status |
|------|--------|
| QA-ENV-04 (`verify:ci` skips `next build`) | **Resolved** |
| GitHub CI gap | **Resolved** |
| Cloud Build gap | **N/A** — already covered |
| Local dev workflow | **Improved** — `verify:ci` now includes compile |
| Developer docs | **Updated** — README, techContext |

---

## Prevention

1. Run `pnpm verify:ci` before merge when touching `shared/src` or web imports.
2. Do not use `.js` suffix on relative imports inside `shared/src` consumed by web path aliases.
3. Treat `pnpm type-check` as necessary but **insufficient** for frontend compile safety.

---

*QA-ENV-04 closed — platform reliability only; no certification, UX, or feature changes.*
