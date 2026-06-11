# Vssyl Component Inventory

**Status:** Wave 2 planning reference (2026-06-03)  
**Purpose:** Inventory reusable UI primitives, ownership, duplicates, and Wave 2 scope.  
**Not a certification document** — no UX-L0–L3 scores.

**Closeout:** Wave 1 / 1.5 approved — [`audits/WAVE1_QA_CLOSEOUT.md`](./audits/WAVE1_QA_CLOSEOUT.md)

---

## Status legend

| Status | Meaning |
|--------|---------|
| **Canonical** | Preferred shared primitive; use for new work |
| **Candidate** | Valid shared code; needs token/standards work (Wave 2+) |
| **Duplicate** | Parallel implementation; deprecate one later |
| **Deprecated** | Do not use in new code (when marked) |
| **Needs Review** | Unclear ownership or split between shared / app |

---

## Wave 1 — Migrated primitives (canonical)

| Component | Location | Shared? | Canonical? | Status | Notes |
|-----------|----------|---------|------------|--------|-------|
| Button | `shared/src/components/Button.tsx` | Yes | Yes | **Canonical** | `v.*` tokens; variants primary/secondary/ghost |
| Input | `shared/src/components/Input.tsx` | Yes | Yes | **Canonical** | Optional icon slot |
| Card | `shared/src/components/Card.tsx` | Yes | Yes | **Canonical** | Simple wrapper only |
| EmptyState | `shared/src/components/EmptyState.tsx` | Yes | Yes | **Canonical** | No `action` prop yet (Wave 2) |
| Spinner | `shared/src/components/Spinner.tsx` | Yes | Yes | **Canonical** | Inline loading indicator |
| LoadingOverlay | `shared/src/components/LoadingOverlay.tsx` | Yes | Yes | **Canonical** | Not in `index.ts`; direct path import |
| LoadingSkeleton | `shared/src/components/LoadingSkeleton.tsx` | Yes | Yes | **Canonical** | Default export; `.v-skeleton`; zero `web/` imports at inventory |

**Recommendation:** Keep all seven as canonical. Extend `EmptyState` in Wave 2; export `LoadingOverlay` / `LoadingSkeleton` from `index.ts` when convenient (non-breaking additive export).

---

## Wave 2 — Priority candidates

| Component | Location | Shared? | Canonical? | Status | Notes |
|-----------|----------|---------|------------|--------|-------|
| Modal | `shared/src/components/Modal.tsx` | Yes | Yes | **Candidate** | Portal, Escape, sizes; raw Tailwind grays/white; **~60+** `web/` imports |
| ContextMenu | `shared/src/components/ContextMenu.tsx` | Yes | Yes | **Candidate** | Drive-grade; portal; submenu support |
| Popover | `shared/src/components/Popover.tsx` | Yes | Partial | **Candidate** | De facto **dropdown** primitive; minimal a11y |
| Tabs | `shared/src/components/Tabs.tsx` | Yes | Yes | **Candidate** | `border-blue-600` active state |
| Toast | `shared/src/components/Toast.tsx` | Yes | Partial | **Candidate** | Raw `bg-blue-600`; competes with `react-hot-toast` |
| ToastProvider | `shared/src/components/ToastProvider.tsx` | Yes | Partial | **Needs Review** | Paired with `Toast`; app also uses `Toaster` from `react-hot-toast` |
| Switch | `shared/src/components/Switch.tsx` | Yes | Yes | **Candidate** | `bg-blue-600` track |
| Drawer | `shared/src/components/Drawer.tsx` | Yes | Yes | **Candidate** | Not exported from `index.ts`; rare `web/` import |
| Tooltip | `shared/src/components/Tooltip.tsx` | Yes | Yes | **Candidate** | Not tokenized |
| Avatar | `shared/src/components/Avatar.tsx` | Yes | Yes | **Candidate** | Exported; widely used |
| BrandButton | `shared/src/components/BrandButton.tsx` | Yes | No | **Needs Review** | Inline styles + `getBusinessAwareColor`; business branding |
| Alert | `shared/src/components/Alert.tsx` | Yes | Partial | **Candidate** | Near-error surface; not full ErrorState |
| ErrorBoundary | `shared/src/components/ErrorBoundary2.tsx` | Yes | Partial | **Duplicate** | Exported as `ErrorBoundary`; see error surfaces below |

---

## App-layer / duplicate surfaces (not shared canonical)

| Component | Location | Shared? | Canonical? | Status | Notes |
|-----------|----------|---------|------------|--------|-------|
| SearchBox | `web/src/components/header/CompactSearchButton.tsx` | No | No | **Needs Review** | Global search entry; module-local pattern |
| SearchBox | `web/src/components/GlobalSearchBar.tsx` | No | No | **Duplicate** | Alternate search UX |
| SearchBox | `web/src/components/AIEnhancedSearchBar.tsx` | No | No | **Duplicate** | AI-augmented search |
| ErrorState | — | — | — | **Candidate** | No dedicated shared primitive |
| ErrorBoundary | `web/src/components/ErrorBoundary.tsx` | No | No | **Duplicate** | App class component |
| ErrorBoundary | `web/src/app/ErrorBoundaryWrapper.tsx` | No | No | **Duplicate** | Uses `react-error-boundary` |
| EmptyState | `web/src/app/notifications/page.tsx` (local) | No | No | **Duplicate** | Local function; not shared |
| EmptyState | `web/src/components/dashboard/WidgetPicker.tsx` (local) | No | No | **Duplicate** | Local function |
| ~~FileContextMenu~~ | *deleted 3A-3.6* | — | — | **Removed** | Replaced by shared `ContextMenu` in DriveModule + starred |
| EventDrawer | `web/src/components/calendar/EventDrawer.tsx` | No | No | **Needs Review** | Calendar-specific drawer |
| AIResponseExplainDrawer | `web/src/components/ai/AIResponseExplainDrawer.tsx` | No | No | **Needs Review** | AI-specific panel |

---

## Other shared components (inventory)

| Component | Location | Shared? | Canonical? | Status | Notes |
|-----------|----------|---------|------------|--------|-------|
| Textarea | `shared/src/components/Textarea.tsx` | Yes | Yes | **Candidate** | Wave 2+ token pass with Input |
| Checkbox | `shared/src/components/Checkbox.tsx` | Yes | Yes | **Canonical** | Raw blue; duplicate file exists |
| Checkbox | `shared/src/components/Checkbox 2.tsx` | Yes | No | **Duplicate** | Identical to `Checkbox.tsx` — deprecate |
| Radio | `shared/src/components/Radio.tsx` | Yes | Yes | **Candidate** | `text-blue-600` |
| Badge | `shared/src/components/Badge.tsx` | Yes | Yes | **Candidate** | |
| Modal (domain) | `shared/src/components/ShareModal.tsx` | Yes | No | **Needs Review** | Domain-specific; uses raw blue |
| Modal (domain) | `shared/src/components/ShareLinkModal.tsx` | Yes | No | **Needs Review** | Domain-specific |
| UploadButton | `shared/src/components/UploadButton.tsx` | Yes | No | **Candidate** | `bg-blue-600`; not same as `Button` |
| BrandButton | `shared/src/components/BrandButton.tsx` | Yes | No | **Needs Review** | See Buttons section |
| Breadcrumbs | `shared/src/components/Breadcrumbs.tsx` | Yes | Yes | **Candidate** | Active `text-blue-600` |
| Pagination | `shared/src/components/Pagination.tsx` | Yes | Yes | **Candidate** | Active page `bg-blue-600` |
| Table | `shared/src/components/Table.tsx` | Yes | Yes | **Candidate** | |
| Accordion | `shared/src/components/Accordion.tsx` | Yes | Yes | **Candidate** | |
| Stepper | `shared/src/components/Stepper.tsx` | Yes | Yes | **Candidate** | Heavy raw blue |
| ProgressBar | `shared/src/components/ProgressBar.tsx` | Yes | Yes | **Candidate** | Default `bg-blue-600` |
| Section | `shared/src/components/Section.tsx` | Yes | No | **Needs Review** | Inline styles; Panel pattern |
| BottomSheet | `shared/src/components/BottomSheet.tsx` | Yes | Partial | **Needs Review** | Overlaps Drawer |
| Popover | `shared/src/components/Popover.tsx` | Yes | Partial | **Candidate** | Dropdown |
| DraggableWrapper | `shared/src/components/DraggableWrapper.tsx` | Yes | Yes | **Candidate** | DnD primitive |
| SidebarNavigation | `shared/src/components/SidebarNavigation.tsx` | Yes | Partial | **Candidate** | Layout-adjacent |
| Topbar | `shared/src/components/Topbar.tsx` | Yes | Partial | **Candidate** | Layout-adjacent |
| FormGroup | `shared/src/components/FormGroup.tsx` | Yes | Yes | **Candidate** | |
| Divider | `shared/src/components/Divider.tsx` | Yes | Yes | **Candidate** | |
| DateRangePicker | `shared/src/components/DateRangePicker.tsx` | Yes | Partial | **Candidate** | |
| FileGrid | `shared/src/components/FileGrid.tsx` | Yes | No | **Needs Review** | Drive-specific composite |
| FilePreview | `shared/src/components/FilePreview.tsx` | Yes | No | **Needs Review** | Drive-specific |
| FilePreviewPanel | `shared/src/components/FilePreviewPanel.tsx` | Yes | No | **Needs Review** | Embeds raw blue buttons |
| FolderCard | `shared/src/components/FolderCard.tsx` | Yes | No | **Needs Review** | Drive tile |
| ModuleCard | `shared/src/components/ModuleCard.tsx` | Yes | Partial | **Candidate** | Marketplace |
| ModuleList | `shared/src/components/ModuleList.tsx` | Yes | No | **Needs Review** | `bg-blue-600` install CTA |
| ModuleInstallButton | `shared/src/components/ModuleInstallButton.tsx` | Yes | No | **Duplicate** | Overlaps Button |
| StatCard | `shared/src/components/StatCard.tsx` | Yes | Partial | **Candidate** | Analytics |
| Charts | `BarChart`, `LineChart`, `PieChart` | Yes | No | **Needs Review** | Data viz; not form primitives |
| GridLayout | `shared/src/components/GridLayout.tsx` | Yes | Partial | **Candidate** | Dashboard layout |
| NotificationList | `shared/src/components/NotificationList.tsx` | Yes | No | **Needs Review** | Feature composite |
| Rating / Review | `shared/src/components/Rating.tsx`, `Review.tsx` | Yes | No | **Needs Review** | Niche |
| ClassificationBadge | `shared/src/components/ClassificationBadge.tsx` | Yes | No | **Needs Review** | Drive classification |
| ActivityList | `shared/src/components/ActivityList.tsx` | Yes | No | **Needs Review** | Feed composite |
| index barrel | `shared/src/components/index.ts` | Yes | Yes | **Canonical** | Export surface |
| index barrel | `shared/src/components/index 2.ts` | Yes | No | **Duplicate** | Stray duplicate — deprecate |
| index types | `shared/src/components/index.d 2.ts` | Yes | No | **Duplicate** | Stray duplicate — deprecate |

---

## Duplicate detection

| Files | Issue | Recommendation |
|-------|-------|----------------|
| `Checkbox.tsx` / `Checkbox 2.tsx` | Identical content | **Canonical:** `Checkbox.tsx`; **deprecate:** `Checkbox 2.tsx` |
| `index.ts` / `index 2.ts` | Stray barrel duplicate | **Canonical:** `index.ts`; **deprecate:** `index 2.ts` |
| `index.d.ts` / `index.d 2.ts` | Stray types duplicate | **Canonical:** `index.d.ts`; **deprecate:** `index.d 2.ts` |
| `Toast` + `ToastProvider` vs `react-hot-toast` | Dual toast stacks in `web/src/app/layout.tsx` | **Needs Review:** pick platform toast for Wave 2; document in INTERACTION_STANDARDS |
| `Button` vs `UploadButton` vs `ModuleInstallButton` | Multiple button implementations | **Canonical:** `Button`; migrate others to variants or wrap `Button` |
| `Button` vs `BrandButton` | Branding overrides | **Canonical:** `Button`; **review** `BrandButton` for token-layer branding (Tier 3) |
| `Modal` vs `ShareModal` / `ShareLinkModal` | Generic vs domain modals | **Canonical:** `Modal` shell; domain modals compose `Modal` children |
| `Popover` vs app dropdowns | Inconsistent dropdowns | **Canonical:** `Popover` (or rename Dropdown in docs) after token pass |
| `Drawer` vs `BottomSheet` vs app drawers | Multiple slide-over patterns | **Needs Review:** unify on `Drawer` or document when to use each |
| `ErrorBoundary` (×3) | shared / web / wrapper | **Needs Review:** app boundaries stay; shared for embeddable modules |
| `EmptyState` (shared vs local) | Notifications, WidgetPicker | **Canonical:** shared; replace locals in later wave |

**Do not delete duplicates in Wave 2 planning** — document and schedule deprecation after migration.

---

## Canonical ownership recommendations

### Buttons

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/Button.tsx` |
| Brand / business | `shared/src/components/BrandButton.tsx` |
| Upload CTA | `shared/src/components/UploadButton.tsx` |
| Module install CTA | `shared/src/components/ModuleInstallButton.tsx` |

**Recommendation:** Keep `Button` canonical. Wave 2: tokenize `UploadButton` / `ModuleInstallButton` via `Button` or shared variants. Review `BrandButton` in Tier 3 — route colors through `--v-color-primary` overrides, not parallel palettes.

### Inputs

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/Input.tsx` |
| Multiline | `shared/src/components/Textarea.tsx` |
| Boolean | `Checkbox.tsx`, `Radio.tsx`, `Switch.tsx` |
| Date range | `shared/src/components/DateRangePicker.tsx` |

**Recommendation:** Tokenize `Textarea`, `Checkbox`, `Radio`, `Switch` together in Wave 2 Tier 2.

### Cards

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/Card.tsx` |
| Stat / metric | `shared/src/components/StatCard.tsx` |
| Module tile | `shared/src/components/ModuleCard.tsx` |
| Folder tile | `shared/src/components/FolderCard.tsx` |
| Panel section | `shared/src/components/Section.tsx` (inline styles) |

**Recommendation:** Keep `Card` canonical. `StatCard` / `ModuleCard` should compose `Card` in a later cleanup wave.

### Modals

| Role | File |
|------|------|
| **Canonical shell** | `shared/src/components/Modal.tsx` |
| Domain | `ShareModal.tsx`, `ShareLinkModal.tsx` |
| App-specific | `web/src/components/**/*Modal.tsx` (many) |

**Recommendation:** Wave 2 Tier 1 — tokenize `Modal` (overlay, surface, radius `v-modal`, focus trap audit). Domain modals follow after shell is stable.

### Dropdowns

| Role | File |
|------|------|
| **Canonical (today)** | `shared/src/components/Popover.tsx` |
| Context actions | `shared/src/components/ContextMenu.tsx` |
| App menu | `web/src/components/AvatarContextMenu.tsx` |

**Recommendation:** Treat `Popover` as dropdown primitive in docs; improve keyboard/a11y. `ContextMenu` Tier 1 for Drive parity. No separate `Dropdown.tsx` until Popover is renamed or wrapped.

### Context menus

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/ContextMenu.tsx` |
| File Hub context menus | `DriveModule.tsx`, `drive/starred/page.tsx` → shared `ContextMenu` |

**Recommendation:** Keep shared `ContextMenu` canonical; File Hub wrapper stays thin.

### Tabs

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/Tabs.tsx` |

**Recommendation:** Wave 2 Tier 2 — migrate active state to `v-primary` / `v-border`.

### Toasts

| Role | File |
|------|------|
| Shared component | `shared/src/components/Toast.tsx` + `ToastProvider.tsx` |
| App root | `react-hot-toast` `Toaster` in `web/src/app/layout.tsx` |

**Recommendation:** Wave 2 Tier 2 — document single toast pipeline in `INTERACTION_STANDARDS.md`; align or clearly scope `Toast` vs `react-hot-toast`.

### Loading

| Role | File |
|------|------|
| Inline spin | `Spinner.tsx` (**Canonical**, migrated) |
| Block overlay | `LoadingOverlay.tsx` (**Canonical**, migrated) |
| Placeholder shimmer | `LoadingSkeleton.tsx` (**Canonical**, migrated) |
| App-local | `web/src/components/LoadingSpinner.tsx` |

**Recommendation:** Deprecate `LoadingSpinner.tsx` in favor of `Spinner` when touched.

### Empty states

| Role | File |
|------|------|
| **Canonical** | `shared/src/components/EmptyState.tsx` |
| Todo-specific | `web/src/components/todo/EmptyTaskState.tsx` |
| Local duplicates | notifications `page.tsx`, `WidgetPicker.tsx` |

**Recommendation:** Add optional `action` prop in Wave 2; replace local duplicates in a later module wave.

---

## Recommended Wave 2 scope

Based on repository usage, token debt (`bg-blue-600` count), and risk.

### Tier 1 — Highest value / lowest risk

| Component | Rationale |
|-----------|-----------|
| **Modal** | High reuse; clear shell; portal + Escape already implemented; tokenize surface/overlay/radius |
| **ContextMenu** | Reference UX (File Hub); already sophisticated; token + a11y pass |
| **Popover** (dropdown) | Small surface; completes overlay family with Modal |

**Implementation order (recommended):** `Modal` → `ContextMenu` → `Popover`

### Tier 2 — Moderate risk

| Component | Rationale |
|-----------|-----------|
| **Switch** | Common in settings/enterprise panels; isolated toggle semantics |
| **Tabs** | Admin/settings; active indicator tokenization |
| **Toast** (+ provider / `react-hot-toast` policy) | Interaction standardization required |
| **Textarea** | Pair with Input for form family consistency |
| **Checkbox** / **Radio** | After duplicate file removal plan |
| **Alert** | Feeds into future ErrorState patterns |

**Implementation order (recommended):** `Switch` → `Tabs` → `Textarea` → `Checkbox`/`Radio` → `Toast` policy + component

### Tier 3 — Architectural review required

| Component | Rationale |
|-----------|-----------|
| **BrandButton** | Business branding vs token ownership (Rule 11) |
| **ErrorState** | May need new primitive composing `Alert` + layout |
| **Drawer** / **BottomSheet** | Consolidate slide-over patterns; export from barrel |
| **SearchBox** | No shared primitive; multiple app implementations |
| **Drawer composites** | `EventDrawer`, `WorkspaceAIDrawer`, etc. — module-owned |
| **Domain modals** | `ShareModal`, enterprise modals — compose Tier 1 shell |
| **FileGrid / FilePreview*** | Drive composites — module wave, not Wave 2 core |

**Do not start Tier 3 until Tier 1–2 complete and documented in `COMPONENT_STANDARDS.md`.**

---

## Wave 2 implementation order (summary)

```text
1. Modal (tokens + a11y audit)
2. ContextMenu (tokens + Drive regression check)
3. Popover / dropdown (tokens + keyboard)
4. Switch
5. Tabs
6. Textarea + Checkbox/Radio (remove Checkbox 2.tsx in separate hygiene PR)
7. Toast strategy (react-hot-toast vs shared Toast)
8. BrandButton / ErrorState / Drawer — planning spike only until Tier 1–2 done
```

---

## Raw token debt snapshot (Wave 2 input)

Components in `shared/src/components` still using `bg-blue-600` / `text-blue-600` / `border-blue-600` (grep snapshot at inventory):

- `Switch`, `Tabs`, `Toast`, `Checkbox` (×2 files), `Radio`, `Breadcrumbs`, `Pagination`, `Stepper`, `ProgressBar`, `UploadButton`, `ModuleInstallButton`, `ModuleList`, `FileGrid`, `FilePreview`, `FilePreviewPanel`, `ShareModal`, plus embedded buttons in composites.

**Wave 1 migrated files:** 0 matches (verified at closeout).

---

## Related

- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- [`audits/WAVE1_QA_CLOSEOUT.md`](./audits/WAVE1_QA_CLOSEOUT.md)

**Last updated:** 2026-06-03
