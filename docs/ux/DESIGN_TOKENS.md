# Vssyl Design Tokens

**Status:** Wave 0 foundation (2026-06-03)  
**Implementation:** `web/src/styles/tokens.css` (CSS variables), `web/tailwind.config.js` (`v.*` namespace)  
**Legacy:** `web/src/app/globals.css` (`:root`), `shared/src/styles/theme.ts`, `shared/src/utils/brandColors.ts`

---

## Principles

1. **Five token families** — colors, typography, spacing, radius, shadows — each with a distinct `--v-*` namespace.
2. **Additive aliasing** — new tokens map to existing platform values where possible; no module migrations in Wave 0.
3. **Single source of truth** — modules must not fork token systems ([`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md) Rule 11).
4. **Scalable theming** — structure supports white-label, business branding, theme packs, user preferences, and enterprise overrides through **one** token layer.

---

## Family 1 — Colors (`--v-color-*`)

### Semantic palette (light mode defaults)

| Token | Aliases (Wave 0) | Usage |
|-------|------------------|-------|
| `--v-color-background` | `var(--background)` | App/page background |
| `--v-color-surface` | `var(--card)` | Cards, panels, elevated surfaces |
| `--v-color-surface-muted` | `var(--muted)` | Subtle sections, striped rows |
| `--v-color-border` | `var(--border)` | Default borders |
| `--v-color-border-strong` | `#d1d5db` (light) | Emphasized dividers |
| `--v-color-text-primary` | `var(--foreground)` | Headings, primary body |
| `--v-color-text-secondary` | `var(--neutral-mid)` | Secondary copy |
| `--v-color-text-muted` | `#6b7280` | Hints, captions (min contrast on surface) |
| `--v-color-primary` | `var(--primary)` → `--info-blue` | Primary actions, links |
| `--v-color-primary-hover` | `#1e60cc` | Primary hover |
| `--v-color-primary-soft` | `rgba(39, 139, 238, 0.12)` | Tinted backgrounds |
| `--v-color-success` | `var(--primary-green)` | Success states |
| `--v-color-warning` | `var(--highlight-yellow)` | Warnings |
| `--v-color-danger` | `var(--accent-red)` | Errors, destructive |
| `--v-color-info` | `var(--info-blue)` | Informational |

Dark mode: `.dark` block in `tokens.css` adjusts aliases to match existing `globals.css` slate palette (`#0f172a`, `#1e293b`, `#334155`).

### Brand colors (documented, not replaced)

From `shared/src/styles/theme.ts`:

| Name | Hex (light) |
|------|-------------|
| info-blue (effective primary) | `#278BEE` |
| primary-green | `#228B22` |
| accent-red | `#F24E1E` |
| highlight-yellow | `#FFCD1E` |
| secondary-purple | `#A259FF` |

Tailwind legacy: `brand.*`, `primary`, `background`, `foreground`, `card`, `border` — **preserve** until migration waves.

### Tailwind color mapping

```text
bg-v-background     → var(--v-color-background)
bg-v-surface        → var(--v-color-surface)
text-v-primary      → var(--v-color-text-primary)  /* text role */
text-v-color-primary → var(--v-color-primary)        /* brand primary */
border-v-border     → var(--v-color-border)
```

(Config uses nested `colors.v` — see `web/tailwind.config.js`.)

---

## Family 2 — Typography (`--v-font-*`)

**Font family:** Inter via `next/font` — `var(--font-inter)` in `web/src/app/layout.tsx`.

### Role tokens (composite)

| Token | Size | Line height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--v-font-display` | 2.25rem (36px) | 1.2 | 700 | Marketing heroes, rare |
| `--v-font-heading` | 1.5rem (24px) | 1.3 | 600 | Page titles (H1) |
| `--v-font-body` | 1rem (16px) | 1.5 | 400 | Default body |
| `--v-font-caption` | 0.75rem (12px) | 1.4 | 400 | Captions, metadata |

### Full type scale (documented; implement via paired vars in CSS)

| Role | Size | Line height | Weight |
|------|------|-------------|--------|
| Display | 2.25rem | 1.2 | 700 |
| H1 | 1.5rem | 1.3 | 600 |
| H2 | 1.25rem | 1.35 | 600 |
| H3 | 1.125rem | 1.4 | 600 |
| H4 | 1rem | 1.4 | 600 |
| Body | 1rem | 1.5 | 400 |
| Body small | 0.875rem | 1.45 | 400 |
| Caption | 0.75rem | 1.4 | 400 |
| Label | 0.875rem | 1.2 | 500 |

Implementation detail: `tokens.css` sets `--v-font-*-size`, `--v-font-*-line-height`, `--v-font-*-weight` where needed for Tailwind `fontSize` extensions.

---

## Family 3 — Spacing (`--v-space-*`)

4px base grid (Tailwind-compatible):

| Token | Value |
|-------|-------|
| `--v-space-1` | 4px |
| `--v-space-2` | 8px |
| `--v-space-3` | 12px |
| `--v-space-4` | 16px |
| `--v-space-5` | 20px |
| `--v-space-6` | 24px |
| `--v-space-8` | 32px |
| `--v-space-10` | 40px |
| `--v-space-12` | 48px |
| `--v-space-16` | 64px |

Use for padding, gap, and margin in new components. Legacy Tailwind `p-4`, `gap-2`, etc. remain valid.

---

## Family 4 — Radius (`--v-radius-*`)

### Role tokens

| Token | Value (light) | Usage |
|-------|---------------|-------|
| `--v-radius-button` | 0.375rem (6px) | Buttons, chips |
| `--v-radius-card` | 0.5rem (8px) | Cards, file tiles |
| `--v-radius-panel` | 0.75rem (12px) | Side panels, sidebars |
| `--v-radius-modal` | 1rem (16px) | Modals, dialogs |

### Generic scale

| Name | Value |
|------|-------|
| none | 0 |
| sm | 0.25rem |
| md | 0.375rem |
| lg | 0.5rem |
| xl | 0.75rem |
| 2xl | 1rem |
| full | 9999px |

---

## Family 5 — Shadows (`--v-shadow-*`)

| Token | Usage |
|-------|-------|
| `--v-shadow-card` | Cards, file grid items |
| `--v-shadow-panel` | Side panels, sticky headers |
| `--v-shadow-overlay` | Dropdowns, popovers |
| `--v-shadow-modal` | Modals, drawers |

Also documented: **none**, **subtle** (minimal elevation for flat lists).

Example values (light): card `0 1px 3px rgba(0,0,0,0.1)`; modal `0 25px 50px -12px rgba(0,0,0,0.25)`.

---

## Family 6 — Skeleton (`--v-skeleton-*`)

**Implementation:** `web/src/styles/tokens.css` (vars), `web/src/styles/ux.css` (`.v-skeleton`, `@keyframes skeleton-loading`).  
**Component:** `shared/src/components/LoadingSkeleton.tsx`.

### Color stops

| Token | Light | Dark (`.dark`) |
|-------|-------|----------------|
| `--v-skeleton-base` | `#e5e7eb` | `#334155` |
| `--v-skeleton-highlight` | `#f3f4f6` | `#475569` |

Visually equivalent to legacy `#eee` / `#f5f5f5` shimmer in light mode.

### Motion

| Token | Value |
|-------|-------|
| `--v-skeleton-duration` | `1.2s` |
| `--v-skeleton-easing` | `ease-in-out` |
| `--v-skeleton-gradient-size` | `200% 100%` |
| `--v-skeleton-radius` | `var(--v-radius-sm)` (4px) |

### Usage standard

- Use **`LoadingSkeleton`** or class **`.v-skeleton`** only — no inline `linear-gradient(..., #eee, ...)` in modules ([`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md) Rule 11).
- Do not override `background` in `style` unless intentional (static placeholder).
- **`prefers-reduced-motion`:** shimmer disabled; flat `--v-skeleton-base` fill (see `ux.css`).

### Animation

```css
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Shimmer runs on `.v-skeleton` via `animation: skeleton-loading var(--v-skeleton-duration) var(--v-skeleton-easing) infinite`.

---

## Theming and scalability

### White labeling / enterprise

Replace token values at `:root` or via `[data-theme="enterprise"]` — never duplicate token **names** per tenant.

### Business branding

Approved path: business vars (e.g. `--business-primary-color`) **override** `--v-color-primary` at runtime through `GlobalBrandingContext` / business branding manager — not parallel module color files.

### Theme packs

Ship as CSS variable bundles that reassign `--v-color-*`, `--v-radius-*`, etc. Same class names (`bg-v-surface`), different values.

### User customization

Future: persist user theme preference; map to `.dark` or `data-theme` without forking component code.

---

## Migration guidance (future waves)

| Wave | Action |
|------|--------|
| 0 | Document + additive `tokens.css` |
| 1 | Shared primitives adopt `v.*` (except skeleton) |
| 1.5 | Skeleton tokens + `LoadingSkeleton` + keyframe in `ux.css` |
| 2+ | Module-by-module replace raw hex/Tailwind one-offs |

**New code:** prefer `var(--v-color-*)` and `bg-v-*`.  
**Existing code:** unchanged until audited.

---

## Related

- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)
- `web/src/styles/tokens.css`
- `web/tailwind.config.js`

**Last updated:** 2026-06-03 (Family 6 skeleton — Wave 1.5)
