# Wave 1 / 1.5 UX QA Closeout

**Status:** Closed — approved for Wave 2 planning  
**Date:** 2026-06-03  
**Reviewer:** Product / engineering manual QA (signed off in-session)  
**Scope:** Shared primitive token migration (Wave 1 + Wave 1.5); no module pages

---

## Scope reviewed

### Wave 1 — Shared primitives (`v.*` tokens)

| Component | Location | Token families used |
|-----------|----------|---------------------|
| Spinner | `shared/src/components/Spinner.tsx` | `v-primary` |
| EmptyState | `shared/src/components/EmptyState.tsx` | surface, border, text, radius, spacing |
| Card | `shared/src/components/Card.tsx` | surface, border, shadow, radius, spacing |
| Input | `shared/src/components/Input.tsx` | surface, border, text, focus, radius, spacing |
| Button | `shared/src/components/Button.tsx` | primary, surface-muted, text, focus ring, radius |
| LoadingOverlay | `shared/src/components/LoadingOverlay.tsx` | surface, primary, modal radius/shadow |

### Wave 1.5 — Skeleton

| Item | Location |
|------|----------|
| LoadingSkeleton | `shared/src/components/LoadingSkeleton.tsx` |
| Skeleton tokens | `web/src/styles/tokens.css` (Family 6) |
| Skeleton animation | `web/src/styles/ux.css` (`.v-skeleton`, `@keyframes skeleton-loading`) |
| Documentation | `docs/ux/DESIGN_TOKENS.md` Family 6 |

**Out of scope for this closeout:** module routes, layout shells, non-migrated shared components (`Modal`, `Switch`, etc.), UX certification scores.

---

## Validation summary

| Check | Result |
|-------|--------|
| `pnpm run build:shared` | **Passed** |
| `pnpm type-check` | **Passed** |
| Manual QA (Tier A routes) | **Completed** |
| Light mode review | **Completed** |
| Dark mode review | **Completed** |
| Blocking regressions | **None identified** |

### Manual QA coverage (representative)

- **Button + Input:** LoginModal, profile/business settings  
- **Card + Spinner:** `/modules`, admin dashboard, widgets  
- **EmptyState (shared):** HR workspace/admin empty views  
- **LoadingOverlay:** Drive sub-routes (`/drive/trash`, `/drive/recent`, etc.)  
- **LoadingSkeleton:** Isolated verification (no production `web/` consumers at closeout)

### Automated metrics (Wave 1 migration)

- In-scope shared primitives: `bg-blue-600` / `text-blue-600` / `border-blue-600` reduced to **0** in migrated files  
- Remaining raw blue classes in `shared/src/components`: deferred to Wave 2 (documented in [`COMPONENT_INVENTORY.md`](../COMPONENT_INVENTORY.md))

---

## Outcome

```text
PASS
```

### Summary

- **Token adoption succeeded** — Wave 1 primitives use Tailwind `v.*` mapped to `--v-*` CSS variables; Wave 1.5 added Family 6 skeleton tokens and a working shimmer keyframe.  
- **Visual intent preserved** — Primary actions remain info-blue; surfaces and borders align with existing light/dark platform vars.  
- **APIs unchanged** — No prop or export signature changes on migrated components.  
- **No module page changes** — All diffs confined to `shared/src/components/` and global token CSS.  
- **Shared primitive migration successful** — High-blast-radius `Button` / `Card` / `Input` validated without module refactors.

---

## Known notes (accepted outcomes)

These are **not defects**; they are documented acceptable shifts from tokenization:

| Note | Description | Status |
|------|-------------|--------|
| EmptyState muted surface | Light background uses `v-surface-muted` (`#F4F4F4`) vs prior `gray-50` | Accepted |
| Secondary button hover | `hover:bg-v-border-strong` replaces `hover:bg-gray-300` | Accepted |
| Skeleton dark mode | Wave 1.5 adds slate shimmer stops (`#334155` / `#475569`); previously light-gray only | Accepted improvement |
| Skeleton keyframe | Shimmer animation now defined in `ux.css` (was missing before 1.5) | Accepted functional fix |
| Input dark styling | Single token path vs explicit `dark:` classes; verified against `globals.css` input overrides | Accepted |
| Local EmptyState copies | `/notifications`, `WidgetPicker` use **local** components — not Wave 1 scope | Tracked for Wave 2+ |

---

## Approval

```text
Wave 1 / 1.5 Approved for Closure

Eligible to begin Wave 2 Planning
```

**Next:** [`COMPONENT_INVENTORY.md`](../COMPONENT_INVENTORY.md) and Wave 2 implementation planning — **no Wave 2 code** until a separate ACT-approved execution plan.

---

## Related

- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)
- [`DESIGN_TOKENS.md`](../DESIGN_TOKENS.md)
- Commit: `feat(ux): Wave 1–1.5 shared primitives on v.* design tokens` (`ccd335e0`)

**Last updated:** 2026-06-03
