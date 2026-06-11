# Platform Header Standardization Plan (Wave 3C-4D)

**Status:** 3C-4D.4 complete — shared header actions extracted  
**Date:** 2026-06-03  
**Mode:** 3C-4D PLAN ✅ · 3C-4D.1–4D.4 ACT ✅  
**Prerequisite:** Wave 3C-4C — `DashboardLayoutWrapper` on `PlatformShell` ✅  
**Platform shell reference:** [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](./PLATFORMSHELL_STANDARDIZATION_PLAN.md)

---

## 1. Executive Summary

Vssyl has **two parallel global header implementations**:

| Implementation | Path | ~LOC | Used by |
|----------------|------|-----:|---------|
| **GlobalHeaderTabs** | `web/src/components/GlobalHeaderTabs.tsx` | 485 | `DashboardLayoutWrapper` → `PlatformShell` header slot |
| **Inline header** | `web/src/app/dashboard/DashboardLayoutInner.tsx` | ~265 (header JSX) + ~120 (tab state/helpers) | Personal `DashboardLayout` (14 module routes) |

Both render a **fixed 64px `<header>`** with identical frame geometry, duplicated `tabPalette` / `getTabStyle`, shared action row components, and overlapping personal dashboard tab UI. **Critical divergence:** Inner owns **Place**, **full edit mode** (drag/delete/add), and **layout-coupled** `showPlaceTab` / `showWorkTab` state; GlobalHeaderTabs owns **business branding fetch**, **scheduling/todo AI context**, and a **stub** edit-mode toggle.

**Recommendation:** **Option B** — `PlatformHeader` + shared tab primitives; refactor `GlobalHeaderTabs` into a thin business composer; migrate Inner personal tabs onto the same header frame and tab styling model **before** 3C-4E `PlatformShell` adoption on personal shell.

**Verdict:** Header unification is **justified** and **should precede** `DashboardLayoutInner` → `PlatformShell`. Option C (PlatformShell first) would force incomplete `GlobalHeaderTabs` onto personal routes or duplicate header inside the shell slot.

---

## 2. Files Reviewed

| File | Role |
|------|------|
| `web/src/components/GlobalHeaderTabs.tsx` | Business + cross-route header (485 LOC) |
| `web/src/app/dashboard/DashboardLayoutInner.tsx` | Personal shell + inline header (~385 LOC header-related) |
| `web/src/components/business/DashboardLayoutWrapper.tsx` | `PlatformShell` consumer; `header={<GlobalHeaderTabs />}` |
| `web/src/components/layouts/PlatformShell.tsx` | `PlatformShellHeader` slot wrapper (`useNativePanels` pattern) |
| `web/src/components/layouts/PlatformLeftSidebar.tsx` | 3C-4B — no header overlap |
| `web/src/components/layouts/PlatformRightRail.tsx` | 3C-4B — no header overlap |

**Adjacent (referenced, not migrated in 4D):**

- `web/src/components/header/CompactSearchButton.tsx`
- `web/src/components/header/AIChatDropdown.tsx`
- `web/src/components/AvatarContextMenu.tsx`

---

## 3. Header Ownership Matrix

### 3A. GlobalHeaderTabs

| Concern | Ownership | Notes |
|---------|-----------|-------|
| **Header frame** | ✅ Full `<header>` fixed 64px | Inline styles; duplicates Inner |
| **Business tabs** | ⚠️ Partial | Shows personal dashboard tabs on business routes; Work active when `pathname.startsWith('/business/')` |
| **Active module state** | ❌ None | No business `?module=` tab strip; not a module header |
| **Navigation callbacks** | ✅ `handleTabClick` | Personal tabs → `navigateToDashboard` or `/dashboard/:id` from business; Work → local `showWorkTab` only (no layout effect on business) |
| **Branding** | ✅ Business-first | Fetches `getBusiness` on `/business/:id`; falls back to `BusinessConfigurationContext` + `GlobalBrandingContext` |
| **Logo / title** | ✅ | `V` glyph (non-business path in component) or business logo + name |
| **Place tab** | ❌ | Not present |
| **Work tab** | ✅ Visual | Active on business workspace; click sets local state or navigates away |
| **Edit mode** | ⚠️ Stub | `+/-` toggles `editMode` but **no** drag, delete, or add tab |
| **Personal dashboard order** | ✅ | `localStorage` `dashboardTabOrder` — duplicated logic with Inner |
| **Actions** | ✅ | `CompactSearchButton`, AI button (Brain 52px, scheduling/todo pulse), `AvatarContextMenu` |
| **AI dropdown** | ✅ | `AIChatDropdown` + `moduleContext` for scheduling/todo |
| **AI suggestion badge** | ✅ | Polls `getSuggestions` every 3s |
| **Responsive** | ✅ | `isMobile` at `<700px`; column header layout |
| **Styles** | Inline + Tailwind on AI button | `getHeaderStyle`, `tabPalette`, `getTabStyle` |

### 3B. DashboardLayoutInner inline header

| Concern | Ownership | Notes |
|---------|-----------|-------|
| **Header frame** | ✅ Full `<header>` fixed 64px | Identical geometry to GlobalHeaderTabs |
| **Personal dashboard tabs** | ✅ Full | Main + draggable secondary tabs |
| **Place tab** | ✅ | First tab; sets `showPlaceTab` → renders `PlaceContent` in main |
| **Work tab** | ✅ Coupled | Sets `showWorkTab` → hides sidebars, renders `WorkTab` |
| **Edit mode** | ✅ Full | `+/-`, drag reorder (`DraggableWrapper`), delete (modal + trash), dashed "New Tab" |
| **Add/delete/reorder** | ✅ | `showAddModal`, `DashboardDeletionModal`, `handleTabDragEnd`, `handleTrashDashboard` |
| **Branding** | ✅ Personal | `B` + `highlightYellow` personal; business logo when `isBusinessContext` |
| **Navigation** | ✅ `handleTabClick` | Coupled to `showPlaceTab` / `showWorkTab` / `navigateToDashboard` |
| **Actions** | ✅ | Same trio; AI button shows **"AI" text** 40px with purple border (differs from GlobalHeaderTabs) |
| **AI dropdown** | ✅ | No scheduling/todo `moduleContext` |
| **AI suggestion badge** | ⚠️ Dead state | `pendingSuggestionsCount` declared but **never polled** — badge never appears on personal |
| **Responsive** | ✅ | Same `<700px` rules |
| **Styles** | Inline + `dragStyles` injected | `tabPalette` includes `newTabBg` / `newTabText` for add tab |

### 3C. PlatformShell header slot (today)

| Concern | Ownership |
|---------|-----------|
| Structural wrap | `PlatformShellHeader` — `role="banner"`, fixed top, height 64 |
| Content | Consumer supplies full header (`GlobalHeaderTabs` renders **nested** `<header>` inside `PlatformShellHeader`) |
| Native passthrough | **Not implemented** — recommend `useNativeHeader` mirroring `useNativePanels` in 4D.1 |

---

## 4. Duplication Findings

### High overlap (~70–90%)

| Duplicated concern | GlobalHeaderTabs | DashboardLayoutInner |
|--------------------|------------------|----------------------|
| Fixed header frame (64px, flex, shadow, z-index) | ✅ | ✅ |
| `tabPalette` object | ✅ | ✅ (+ newTab colors) |
| `getTabStyle()` | ✅ | ✅ (borderStyle vs border shorthand — equivalent) |
| `getDashboardIcon()` helper | ✅ | ✅ (Inner imports from moduleIcons path) |
| Personal dashboard list + `dashboardTabOrder` localStorage | ✅ | ✅ |
| Main + secondary personal tabs | ✅ | ✅ |
| Work tab button | ✅ | ✅ |
| `+/-` edit toggle | ✅ (non-functional) | ✅ (functional) |
| Brand row layout (logo + h1) | ✅ | ✅ (different glyph/color) |
| Center tab `<nav>` scroll region | ✅ | ✅ |
| Actions row (search, AI, avatar) | ✅ | ✅ |
| `AIChatDropdown` positioning logic | ✅ | ✅ |
| Mobile column reflow | ✅ | ✅ |

### Intentional divergence (must preserve)

| Concern | GlobalHeaderTabs | DashboardLayoutInner |
|---------|------------------|----------------------|
| Place tab | ❌ | ✅ |
| Tab drag-and-drop | ❌ | ✅ |
| Tab delete / trash | ❌ | ✅ |
| Add dashboard modal | ❌ | ✅ |
| `showPlaceTab` / `showWorkTab` layout coupling | ❌ (local Work state unused on business) | ✅ |
| Business branding API fetch | ✅ | ❌ |
| Scheduling/todo AI pulse + moduleContext | ✅ | ❌ |
| AI suggestion polling | ✅ | ❌ (dead state) |
| AI button visual (Brain vs "AI" text) | Different | Different |

### Quantitative estimate

| Signal | Value |
|--------|------:|
| Duplicated header frame + tab styling LOC | ~180–220 |
| Duplicated dashboard ordering LOC | ~40 |
| Duplicated actions row LOC | ~80 |
| Total recoverable (post Option B) | ~250–350 LOC |
| Double `<header>` nesting risk (4C) | Yes — needs `useNativeHeader` |

---

## 5. Recommended Extraction Option

### ✅ Option B — `PlatformHeader` + shared tab primitives (phased)

**Why not Option A:** Leaves tab duplication and dual `<header>` implementations; only saves frame CSS.

**Why not Option C:** `DashboardLayoutInner` → `PlatformShell` without header unification requires either (a) swapping in `GlobalHeaderTabs` and **losing Place/edit mode**, or (b) keeping inline header inside `PlatformShell` slot — **no deduplication**, double header wrapper.

**Option B phased delivery:**

1. Shared **header frame** + **actions** + **tab styling utilities**
2. **Business composer** thins `GlobalHeaderTabs`
3. **Personal composer** extracts Inner tab strip; layout state stays in Inner orchestrator via callbacks
4. Then **3C-4E** wraps unified header in `PlatformShell`

---

## 6. Proposed API (design only)

### 6A. Core header frame

```tsx
// web/src/components/layouts/PlatformHeader.tsx (proposed)

export type PlatformHeaderMode = 'personal' | 'business';

export interface PlatformHeaderProps {
  mode: PlatformHeaderMode;
  /** Brand slot — logo + title */
  brand: React.ReactNode;
  /** Center tab strip */
  tabs: React.ReactNode;
  /** Right actions — search, AI, avatar */
  actions: React.ReactNode;
  /** Portals: AIChatDropdown, etc. */
  overlays?: React.ReactNode;
  /** From useThemeColors().getHeaderStyle */
  headerStyle?: React.CSSProperties;
  isMobile?: boolean;
  className?: string;
}
```

**Subcomponents:**

| Export | Role |
|--------|------|
| `PlatformHeader` | Single fixed 64px `role="banner"` — **replaces duplicate `<header>`** |
| `PlatformHeaderBrand` | Left cluster: logo img or glyph + `h1` |
| `PlatformHeaderTabsRegion` | Center flex + scrollable `<nav>` |
| `PlatformHeaderActions` | Right cluster with mobile margin rules |

### 6B. Shared tab primitives

```tsx
// web/src/components/layouts/platformHeaderTabs.tsx (or navigation/)

export function usePlatformDashboardTabPalette(): PlatformTabPalette;

export interface PlatformDashboardTabProps {
  isActive: boolean;
  onClick: () => void;
  borderRadius: string;
  marginLeft: number;
  children: React.ReactNode;
  className?: string;
  /** Place tab indigo override */
  activeColor?: string;
}

export function PlatformDashboardTab(props: PlatformDashboardTabProps): JSX.Element;

export function useOrderedPersonalDashboards(): {
  mainPersonalDashboard: Dashboard;
  draggableDashboards: Dashboard[];
  reorder: (ids: string[]) => void;
};
```

### 6C. Composed tab strips (consumers)

```tsx
// Business — thin GlobalHeaderTabs refactor target
<PlatformHeader
  mode="business"
  brand={<PlatformHeaderBrand mode="business" logo={...} title={...} />}
  tabs={<PlatformBusinessDashboardTabs />}
  actions={<PlatformHeaderActions variant="business" schedulingPulse={...} />}
  overlays={<AIChatDropdown ... />}
/>

// Personal — Inner orchestrator (4D.3)
<PlatformHeader
  mode="personal"
  brand={<PlatformHeaderBrand mode="personal" />}
  tabs={
    <PlatformPersonalDashboardTabs
      showPlaceTab={showPlaceTab}
      showWorkTab={showWorkTab}
      editMode={editMode}
      onTabClick={handleTabClick}
      onEditModeToggle={...}
      onAddTab={...}
      onDragEnd={handleTabDragEnd}
      ...
    />
  }
  actions={<PlatformHeaderActions variant="personal" />}
  overlays={<AIChatDropdown ... />}
/>
```

### 6D. PlatformShell integration

Add to `PlatformShell`:

```tsx
useNativeHeader?: boolean; // When true, header slot renders directly (no PlatformShellHeader wrap)
```

Mirror of `useNativePanels` (3C-4C). `GlobalHeaderTabs` refactor removes inner `<header>`; `PlatformHeader` owns the landmark.

---

## 7. Migration Strategy

| Phase | Scope | Outcome |
|-------|-------|---------|
| **3C-4D.1** | `PlatformHeader` + subcomponents + `usePlatformDashboardTabPalette` + `PlatformDashboardTab` + `useNativeHeader` on `PlatformShell` | **Done** ✅ — frame primitive; no consumer migration |
| **3C-4D.2** | Refactor `GlobalHeaderTabs` → `PlatformHeader` + shared tab primitives | **Done** ✅ — business header unified; `useNativeHeader` on Wrapper |
| **3C-4D.3** | Wire `DashboardLayoutInner` header to `PlatformHeader` + `PlatformDashboardTab` | **Done** ✅ — Place/Work/edit/drag preserved in Inner orchestrator |
| **3C-4D.4** | Extract `PlatformHeaderActionRow` + action primitives + `computePlatformAIDropdownPosition` | **Done** ✅ — Option A: polling business-only; personal badge deferred |
| **3C-4E** | `DashboardLayoutInner` → `PlatformShell` (`mode="personal"`, `useNativePanels`, unified header slot) | Personal shell parity with business |
| **3C-4F** | Certification | Manual QA both shells |

**Adjustments from generic 4D sequence:**

- **4D.4** (actions dedupe) can run in parallel with 4D.2/4D.3 but should complete before 4E.
- **Do not** migrate `DashboardLayoutInner` to `PlatformShell` until **4D.3** completes (header slot stable).

---

## 8. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Place / Work layout coupling** | High | Keep `showPlaceTab` / `showWorkTab` in Inner; pass callbacks into `PlatformPersonalDashboardTabs`; do not move body switching into header |
| **Edit mode + drag/delete** | High | Personal tab composer owns DnD; test `DraggableWrapper` + global trash drop |
| **Business route tab navigation** | High | Preserve `router.push('/dashboard/:id')` when on `/business/` |
| **Double `<header>` nesting** | Medium | `useNativeHeader` + remove `<header>` from refactored `GlobalHeaderTabs` |
| **AI button visual parity** | Medium | Explicit `variant="personal" \| "business"` on `PlatformHeaderActions`; document intentional diff until aligned |
| **Inner suggestion badge** | Low | **Deferred** — Option A: dead state removed; shared polling in future wave |
| **GlobalHeaderTabs stub edit mode** | Low | Either wire to no-op clearly or remove until personal parity not needed on business |
| **Branding context** | Medium | `PlatformHeaderBrand` reads hooks; business fetch stays in business composer |
| **Mobile header** | Medium | Single `isMobile` breakpoint (700px) owned by `PlatformHeader` |
| **SSR/client** | Low | Header components remain `'use client'`; no server header extraction |
| **Scheduling `scheduleSelected` event** | Medium | Keep in business actions composer through 4D.2 |

---

## 9. Certification Criteria (post 4D)

| Check | Business (GlobalHeaderTabs path) | Personal (Inner path) |
|-------|----------------------------------|------------------------|
| Header 64px fixed | ✅ | ✅ |
| Brand displays correctly | ✅ | ✅ |
| Personal dashboard tabs | ✅ (navigate away from business) | ✅ |
| Work tab | ✅ visual on business | ✅ + sidebar hide |
| Place tab | N/A | ✅ |
| Edit mode | Stub acceptable | ✅ full |
| Search / AI / Avatar | ✅ | ✅ |
| No double `<header>` | ✅ | ✅ (after 4E) |
| `pnpm type-check` | ✅ | ✅ |

---

## 10. Decision Record

| Question | Answer |
|----------|--------|
| Recommended option | **B** — `PlatformHeader` + shared tab primitives |
| Unify before Inner → PlatformShell? | **Yes** (reject Option C) |
| Modify `GlobalHeaderTabs` in 4D.1? | **No** — 4D.2 |
| Modify `DashboardLayoutInner` in 4D.1? | **No** — 4D.3 |
| 3C-4D.1 ready for ACT? | **Done** ✅ |
| 3C-4D.2 ready for ACT? | **Done** ✅ |
| 3C-4D.3 ready for ACT? | **Done** ✅ |
| 3C-4D.4 ready for ACT? | **Done** ✅ |
| 3C-4E ready for ACT? | **Yes** — `DashboardLayoutInner` → `PlatformShell` |

### 3C-4D.4 Implementation (2026-06-03)

| Artifact | Path |
|----------|------|
| Action primitives | `web/src/components/layouts/platformHeaderActionComponents.tsx` |
| Composed row | `PlatformHeaderActionRow` |
| AI positioning helper | `computePlatformAIDropdownPosition` |
| Consumers | `GlobalHeaderTabs.tsx`, `DashboardLayoutInner.tsx` |

**AI polling:** Option A — business polls every 3s; personal badge deferred (dead state removed).

**Validation:** `pnpm type-check` PASS. Manual QA pending.

### 3C-4D.3 Implementation (2026-06-03)

| Change | Detail |
|--------|--------|
| `DashboardLayoutInner.tsx` | Personal header → `PlatformHeader mode="personal"` |
| Tab strip | `PlatformDashboardTab` + `usePlatformDashboardTabPalette` |
| Orchestration | Place/Work/edit/drag/delete/add remain in Inner |
| PlatformShell | **Not migrated** — deferred to 3C-4E |

**Validation:** `pnpm type-check` PASS. Manual QA pending.

### 3C-4D.2 Implementation (2026-06-03)

| Change | Detail |
|--------|--------|
| `GlobalHeaderTabs.tsx` | First `PlatformHeader` consumer; `PlatformDashboardTab` for tab strip |
| `DashboardLayoutWrapper.tsx` | `useNativeHeader` — single `<header role="banner">` |
| Removed duplication | Header frame, `tabPalette`, `getTabStyle`, inline mobile layout |

**Validation:** `pnpm type-check` PASS. Manual QA pending.

### 3C-4D.1 Implementation (2026-06-03)

| Artifact | Path |
|----------|------|
| Header frame | `web/src/components/layouts/PlatformHeader.tsx` |
| Tab utilities | `web/src/components/layouts/platformHeaderTabs.tsx` |
| Barrel exports | `web/src/components/layouts/index.ts` |
| Shell passthrough | `useNativeHeader` on `PlatformShell` |

**Validation:** `pnpm type-check` PASS. No consumer imports changed.

---

**Last updated:** 2026-06-03 (3C-4D.4 ACT closeout)
