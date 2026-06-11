# PlatformShell Standardization Plan (Wave 3C-4)

**Status:** Planning complete — no code changes  
**Date:** 2026-06-03  
**Mode:** Architecture and inventory — implementation deferred  
**Prerequisite:** Wave 3C-3 Chat `WorkspaceSplitLayout` rollout — complete  
**Workspace primitive:** [`WorkspaceSplitLayout`](../../web/src/components/layouts/WorkspaceSplitLayout.tsx) (Drive + Chat certified)  
**Shell inventory baseline:** [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](./LAYOUT_SHELL_STANDARDIZATION_REVIEW.md)

---

## 1. Executive Summary

Vssyl's **global platform chrome** is implemented twice at scale:

| Implementation | Path | Lines | Role |
|----------------|------|------:|------|
| Personal shell | `web/src/app/dashboard/DashboardLayoutInner.tsx` | ~1,644 | Header (inline tabs) + L sidebar + main + R rail |
| Business shell | `web/src/components/business/DashboardLayoutWrapper.tsx` | ~800 | `GlobalHeaderTabs` + L sidebar + main + R rail |
| Partial header extract | `web/src/components/GlobalHeaderTabs.tsx` | ~485 | Business header only — **Inner still duplicates tab logic** |

**~2,900 lines** of shell code with **~55–65% structural overlap** (sidebar, right rail, collapse, branding, customization hooks). Inline styles dominate both implementations.

**Verdict:** **`PlatformShell` is justified.** Extract a canonical global shell primitive and shared slot content components. Do **not** merge Admin Portal, Auth, or module workspace layouts into `PlatformShell`.

**Recommended first ACT scope (3C-4A):** Structural primitive + slot subcomponents only — no consumer migration.

---

## 2. Shell Inventory

### 2A. Classification table

| Shell | Key files | Archetype | Classification |
|-------|-----------|-----------|----------------|
| **Personal platform shell** | `DashboardLayout.tsx`, `DashboardLayoutInner.tsx` | Dashboard (global) | **Reference — personal** |
| **Business platform shell** | `business/[id]/workspace/layout.tsx`, `DashboardLayoutWrapper.tsx` | Dashboard (global) | **Candidate for extraction** |
| **Partial header extract** | `GlobalHeaderTabs.tsx` | Header fragment | **Legacy partial extract** — incomplete |
| **Admin shell** | `admin-portal/layout.tsx` | Management | **Certified exception** — isolated dark chrome |
| **Auth shell** | `auth/layout.tsx` | Auth | **Certified exception** — centered card |
| **Module route wrappers** | 14× `app/*/layout.tsx` importing `DashboardLayout` | Passthrough | **Not shells** — delegate to personal shell |
| **Module workspace shells** | `WorkspaceSplitLayout` consumers (Drive, Chat, …) | Workspace | **Out of PlatformShell scope** |
| **Business module sub-shells** | `HRLayout.tsx`, `SchedulingLayout.tsx` | Workspace sub-shell | **Specialized** — outer chrome stays PlatformShell |
| **Work entry (full bleed)** | `WorkTab.tsx`, `BrandedWorkDashboard.tsx` | Specialized | **Certified exception** — sidebars hidden intentionally |
| **Floating chat stack** | `StackableChatContainer` (root layout) | Overlay | **Certified exception** — not page chrome |

### 2B. Personal platform shell wiring

```
app/dashboard/layout.tsx
  └── DashboardLayout.tsx
        ├── BusinessConfigurationProvider
        ├── PositionAwareModuleProvider
        ├── WorkspaceRuntimeScopeBridge
        └── SidebarCustomizationProvider
              └── DashboardLayoutInner.tsx  ← shell body
```

**14 module routes** reuse `DashboardLayout` via thin `layout.tsx` wrappers:

`drive`, `chat`, `calendar`, `todo`, `notifications`, `notes`, `notebook`, `ai`, `ai-chat`, `modules`, `vlink`, `profile`, `member`, `dashboard`.

**Chat exception:** `chat/layout.tsx` skips `DashboardLayout` when `?dashboard=` is absent (embed/bare mode).

### 2C. Business platform shell wiring

```
app/business/[id]/workspace/layout.tsx  (SSR: session + business fetch)
  ├── BusinessConfigurationProvider
  ├── PositionAwareModuleProvider
  └── SidebarCustomizationProvider
        └── DashboardLayoutWrapper.tsx  ← shell body
              ├── GlobalHeaderTabs
              ├── Left sidebar (SidebarFolderRenderer)
              ├── Main → BusinessWorkspaceContent | nested children
              └── Right rail (40px fixed)
```

### 2D. Admin and Auth (intentionally separate)

| Shell | Structure | Notes |
|-------|-----------|-------|
| `admin-portal/layout.tsx` | Dark header + collapsible L nav (64/256) + `p-6` main | Role-gated; different density and nav model |
| `auth/layout.tsx` | Centered card on gradient | No sidebars or rails |
| `admin/layout.tsx` | Redirect stub → `/admin-portal` | Not a visual shell |

---

## 3. Duplication Findings

### 3A. Primary pair: `DashboardLayoutInner` ↔ `DashboardLayoutWrapper`

| Concern | Inner | Wrapper | Overlap |
|---------|-------|---------|---------|
| **Root geometry** | `100vh` + fixed header 64px + body `top: 64` | Same | **High** |
| **Left sidebar width** | 240px, collapse to 0 | 240px, collapse to 0 | **High** |
| **Collapse control** | Fixed chevron button, `left: 0 \| 228` | Same pattern | **High** |
| **Sidebar content** | `SidebarFolderRenderer` + loose modules + Customize | Same | **High** |
| **Default sidebar config** | `defaultLeftSidebarConfig` (Core Apps folder) | `defaultLeftSidebarConfig` (Communication folder) | **Medium** — logic duplicate, defaults differ |
| **Right rail** | 40px fixed, `top: 64`, `calc(100vh - 64px)` | Same | **High** |
| **Right rail slots** | Dashboard → pinned → spacer → AI → VLink → Modules → Trash | Same order | **High** |
| **Right rail context** | `personal` \| `currentBusinessId` | `effectiveBusiness.id` | **Medium** — same API, different source |
| **Main padding** | `paddingRight: 40` when sidebars shown | Always `paddingRight: 40` | **High** |
| **Mobile** | `isMobile` at `<700px`, auto-collapse sidebar | Same | **High** |
| **Branding** | `useGlobalBranding`, `getSidebarStyles`, `getHeaderStyles` | Same | **High** |
| **Customization** | `SidebarCustomizationModal`, `collapsedFolders` | Same | **High** |
| **Inline styles** | Extensive `style={{}}` on shell regions | Extensive `style={{}}` | **High** |

### 3B. Header duplication (three-way)

| File | Header implementation | Unique features |
|------|----------------------|-----------------|
| `DashboardLayoutInner` | Inline `<header>` ~250 lines | Place tab, Work tab, dashboard edit mode (drag/delete/add), household creation modals |
| `GlobalHeaderTabs` | Extracted `<header>` | Used by business only; scheduling/todo context hooks; **no Place tab** |
| `DashboardLayoutWrapper` | Delegates to `GlobalHeaderTabs` | — |

**Problem:** Header was partially extracted for business but **personal still owns a parallel implementation**. Tab palette, `getTabStyle`, AI button, search, and avatar patterns are duplicated.

### 3C. Provider / context duplication

Both shells require the same provider stack (with minor ordering differences):

| Provider | Personal (`DashboardLayout`) | Business (`workspace/layout`) |
|----------|-------------------------------|-------------------------------|
| `BusinessConfigurationProvider` | ✅ (`currentBusinessId` from WorkAuth) | ✅ (`businessId` from route) |
| `PositionAwareModuleProvider` | ✅ | ✅ |
| `SidebarCustomizationProvider` | ✅ (+ `availableModules`) | ✅ (no modules arg) |
| `WorkspaceRuntimeScopeBridge` | ✅ personal only | ❌ |

Shell extraction must **not** relocate provider wiring — layouts keep owning context boundaries.

### 3D. Route / content switching (not duplicated — mode-specific)

| Behavior | Inner only | Wrapper only |
|----------|------------|--------------|
| Place tab → `PlaceContent` | ✅ | ❌ |
| Work tab → `WorkTab` (hides sidebars) | ✅ | ❌ |
| `BusinessWorkspaceContent` module router | ❌ | ✅ |
| Business dashboard ensure/create | ❌ | ✅ |
| Nested workspace routes (`shouldRenderNestedRoute`) | ❌ | ✅ |

These stay **outside** `PlatformShell` as slot content or layout-level orchestration.

### 3E. Quantitative signals

| Signal | Value |
|--------|------:|
| Shell LOC (Inner + Wrapper + GlobalHeaderTabs) | ~2,929 |
| Est. duplicate structural LOC | ~1,200–1,500 |
| Routes on personal `DashboardLayout` | 14 |
| Business workspace entry | 1 (`/business/[id]/workspace`) |
| Shared `web/src/components/layouts/` primitives today | 1 (`WorkspaceSplitLayout`) |

---

## 4. Recommended PlatformShell Ownership

### 4A. PlatformShell SHOULD own

| Responsibility | Rationale |
|----------------|-----------|
| **Viewport frame** | Single owner of `100vh` / header offset / body flex row |
| **Header region slot** | Fixed 64px top chrome landmark (`<header>`) |
| **Left navigation slot** | 240px collapsible aside landmark |
| **Main content slot** | Scrollable primary region with right-rail padding |
| **Right rail slot** | 40px fixed aside landmark |
| **Sidebar visibility flags** | `showLeftNav`, `showRightRail` (Work tab full-bleed) |
| **Collapse state plumbing** | `leftNavCollapsed`, `onLeftNavToggle`, mobile auto-collapse |
| **Shell-level responsive** | `collapseBelow` breakpoint (default 700px) |
| **Landmark roles + min-h-0** | Consistent a11y and overflow contract |
| **Token-oriented class hooks** | Prefer `v.*` / Tailwind over inline styles for shell regions |

### 4B. PlatformShell should NOT own

| Exclusion | Owner |
|-----------|-------|
| Module workspace layout (Drive, Chat, Calendar, …) | `WorkspaceSplitLayout` |
| Dashboard tab logic (create/delete/reorder, Place, Work) | `PlatformDashboardTabs` slot content |
| `SidebarFolderRenderer` folder tree logic | Existing sidebar components |
| `BusinessWorkspaceContent` routing | Business layout orchestration |
| Business dashboard initialization | `DashboardLayoutWrapper` (pre-shell data gate) |
| Admin portal chrome | `admin-portal/layout.tsx` |
| Auth card layout | `auth/layout.tsx` |
| `StackableChatContainer` / floating widgets | Root layout overlays |
| Module-specific toolbars (Drive bulk bar, Todo header) | Module workspace / `PageToolbar` (future) |
| Provider trees (`SidebarCustomizationProvider`, etc.) | Route `layout.tsx` files |
| AI dropdown positioning / suggestion polling | Header slot content |
| Global trash item handlers | `GlobalTrashBin` in right rail slot |

---

## 5. Proposed Slot API (design only)

### 5A. Core primitive

```tsx
// web/src/components/layouts/PlatformShell.tsx (proposed — not implemented)

export type PlatformShellMode = 'personal' | 'business';

export interface PlatformShellProps {
  mode: PlatformShellMode;
  children: React.ReactNode; // main content
  /** Fixed 64px header slot */
  header?: React.ReactNode;
  /** 240px left nav slot — omit when showLeftNav=false */
  leftNav?: React.ReactNode;
  /** 40px right rail slot — omit when showRightRail=false */
  rightRail?: React.ReactNode;
  /** Hide left aside (Work tab full-bleed) */
  showLeftNav?: boolean;   // default true
  /** Hide right aside (Work tab full-bleed) */
  showRightRail?: boolean;  // default true
  /** Controlled left collapse */
  leftNavCollapsed?: boolean;
  onLeftNavToggle?: () => void;
  /** px — default 64 */
  headerHeight?: number;
  /** px — default 240 */
  leftNavWidth?: number;
  /** px — default 40 */
  rightRailWidth?: number;
  /** default 700 */
  collapseBelow?: number;
  className?: string;
}
```

**Structural composition (mirrors verified Inner/Wrapper geometry):**

```tsx
<PlatformShell mode="personal" header={...} leftNav={...} rightRail={...}>
  {children}
</PlatformShell>
```

Renders:

```
┌─────────────────────────────────────────────────────────────┐
│ PlatformHeader (slot)                          height: 64   │
├──────────┬──────────────────────────────────────┬───────────┤
│ Platform │ PlatformMain (children)               │ Platform  │
│ LeftNav  │ paddingRight: rightRailWidth          │ RightRail │
│ 240/0    │ overflow-y-auto                       │ 40 fixed  │
└──────────┴──────────────────────────────────────┴───────────┘
```

### 5B. Recommended companion slot components (extract from duplication)

| Component | Purpose | Source |
|-----------|---------|--------|
| `PlatformHeader` | Brand row + center tabs + actions wrapper | Merge `GlobalHeaderTabs` + Inner header frame |
| `PlatformDashboardTabs` | Tab strip only (personal vs business variants) | Split from Inner / GlobalHeaderTabs |
| `PlatformHeaderActions` | Search, AI button, avatar | Shared actions row |
| `PlatformLeftSidebar` | Collapse control + nav list + Customize footer | Inner + Wrapper sidebar JSX |
| `PlatformRightRail` | Dashboard / pinned / AI / VLink / Modules / Trash | Inner + Wrapper right rail JSX |

`PlatformShell` stays **structural**; companion components hold duplicated JSX but **not** business rules (dashboard creation stays in personal orchestrator).

### 5C. Mode-aware props (slot content, not shell)

```tsx
// Personal orchestrator (future DashboardLayoutInner consumer)
<PlatformShell
  mode="personal"
  showLeftNav={!showWorkTab}
  showRightRail={!showWorkTab}
  header={
    <PlatformHeader
      mode="personal"
      tabs={<PlatformDashboardTabs variant="personal" showPlace showWork editMode={...} />}
      actions={<PlatformHeaderActions />}
    />
  }
  leftNav={<PlatformLeftSidebar contextId={currentDashboardId} modules={modules} />}
  rightRail={<PlatformRightRail contextId={rightSidebarContext} modules={modules} />}
>
  {showWorkTab ? <WorkTab /> : showPlaceTab ? <PlaceContent /> : children}
</PlatformShell>

// Business orchestrator (future DashboardLayoutWrapper consumer)
<PlatformShell
  mode="business"
  header={
    <PlatformHeader
      mode="business"
      tabs={<PlatformDashboardTabs variant="business" />}
      actions={<PlatformHeaderActions />}
    />
  }
  leftNav={<PlatformLeftSidebar contextId={businessDashboardId} modules={displayModules} />}
  rightRail={<PlatformRightRail contextId={effectiveBusiness.id} modules={displayModules} />}
>
  {/* loading gates + BusinessWorkspaceContent remain outside or as children */}
  {children}
</PlatformShell>
```

### 5D. Relationship to WorkspaceSplitLayout

| Layer | Primitive | Scope |
|-------|-----------|-------|
| **Global** | `PlatformShell` | Header + platform sidebars + module route `{children}` |
| **Module** | `WorkspaceSplitLayout` | Inside main slot — module-owned sidebar/main/secondary |

**Never nest PlatformShell inside WorkspaceSplitLayout.** Module routes already receive PlatformShell via `DashboardLayout`.

---

## 6. Migration Strategy (phased rollout)

Adjusted from generic 3C-4A–E based on repo findings. **Wrapper-first** reduces risk because header is already extracted.

| Phase | Scope | Rationale | Outcome |
|-------|-------|-----------|---------|
| **3C-4A** | `PlatformShell` + slot subcomponents | Pure geometry; no consumer migration | **Done** ✅ — `layouts/PlatformShell.tsx` |
| **3C-4B** | Extract `PlatformLeftSidebar` + `PlatformRightRail` shared content | Removes largest duplicated block (~600 LOC) | **Done** ✅ — Inner + Wrapper consume shared components |
| **3C-4C** | Migrate `DashboardLayoutWrapper` → `PlatformShell` | Already uses `GlobalHeaderTabs`; fewer special tabs | **Done** ✅ |
| **3C-4D** | Unify header → `PlatformHeader` + `PlatformDashboardTabs` | Collapse Inner ↔ GlobalHeaderTabs duplication | Single header implementation |
| **3C-4E** | Migrate `DashboardLayoutInner` → `PlatformShell` | **Done** ✅ — personal shell on primitive |
| **3C-4F** | Business/personal reconciliation + certification | **Done** ✅ — [`audits/PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md) PASS WITH FINDINGS |

**Defer within 3C-4:** Admin portal, Auth, HR/Scheduling sub-shells, BrandedWorkDashboard, inline style full tokenization (incremental).

**Post-3C-4 (separate waves):** 3C-5 AI Chat dedupe, 3C-6 Notifications double chrome, module `PageHeader`.

---

## 7. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Auth / session redirect loops** | High | Keep Wrapper client auth redirect; do not move session gates into PlatformShell |
| **SSR / client boundary** | High | `PlatformShell` is `'use client'`; business `layout.tsx` stays async server wrapper for data fetch |
| **Business vs personal context** | High | `mode` prop + slot content passes explicit `contextId`; no implicit pathname inference inside shell |
| **Sidebar customization regression** | High | `SidebarFolderRenderer` unchanged; only wrapper divs move to `PlatformLeftSidebar` |
| **Work tab full-bleed** | Medium | `showLeftNav={false}` / `showRightRail={false}` — verify padding reset on main |
| **Place tab (personal only)** | Medium | Keep Place orchestration in Inner consumer; business header intentionally omits Place |
| **Right rail fixed positioning** | Medium | Preserve `position: fixed; right: 0; top: headerHeight` — document single height owner |
| **`h-screen` / `100vh` nesting** | Medium | PlatformShell owns viewport; module layouts use `h-full` only |
| **Global chat / StackableChatContainer** | Low | Root layout overlay — unaffected by PlatformShell |
| **Chat bare layout (`?dashboard=` absent)** | Low | Certified exception — no PlatformShell |
| **Inline style migration scope creep** | Medium | 4A–4B: structural classes only; tokenize header/sidebar in 4D–4E |
| **Dashboard tab edit mode / drag** | High | Migrate only after header unification (4D); test drag-and-drop tab reorder |
| **14 route wrappers unchanged** | Low | `DashboardLayout` public API stable; Inner swap is internal |

---

## 8. Certification Criteria (3C-4F)

| Check | Personal | Business |
|-------|----------|----------|
| Header 64px fixed | ✅ | ✅ |
| Left sidebar collapse | ✅ | ✅ |
| Right rail always visible (when sidebars on) | ✅ | ✅ |
| Sidebar customization modal | ✅ | ✅ |
| Module navigation | ✅ | ✅ |
| Work tab hides sidebars | ✅ | N/A |
| Place tab renders | ✅ | N/A |
| Business dashboard scoping | N/A | ✅ |
| `pnpm type-check` | ✅ | ✅ |
| Manual QA: resize, dark mode, mobile collapse | Pending | Pending |

---

## 9. Decision Record

| Question | Answer |
|----------|--------|
| Is `PlatformShell` justified? | **Yes** — ~1,200+ LOC structural duplication; 14 routes depend on personal shell; business shell mirrors it |
| Is Admin shell in scope? | **No** — certified exception |
| Is `WorkspaceSplitLayout` replaced? | **No** — complementary layer inside main slot |
| Ready for 3C-4A ACT? | **Yes** — primitive-only; no consumer migration in 4A |
| Recommended 4A deliverables | `PlatformShell.tsx`, slot exports in `layouts/index.ts`, unit smoke test optional |

### 3C-4A PlatformShell foundation (2026-06-03)

**Status:** Closed — **PASS** (no consumers; manual QA N/A)

| Export | Path | Role |
|--------|------|------|
| `PlatformShell` | `web/src/components/layouts/PlatformShell.tsx` | Root viewport frame + slot composition |
| `PlatformShellHeader` | same | Fixed header slot (`role="banner"`) |
| `PlatformShellLeftNav` | same | 240px / collapsed left slot |
| `PlatformShellMain` | same | Scrollable main with right-rail padding |
| `PlatformShellRightRail` | same | Fixed 40px rail (`role="complementary"`) |
| `PLATFORM_SHELL_DEFAULTS` | same | `headerHeight: 64`, `leftNavWidth: 240`, `rightRailWidth: 40`, `collapseBelow: 700` |

**Validation:** `pnpm type-check` PASS. Zero consumer imports.

**Next:** **3C-4B** — extract shared `PlatformLeftSidebar` + `PlatformRightRail` content components.

### 3C-4B Shared shell content extraction (2026-06-03)

**Status:** Closed — **PASS** (manual QA pending)

| Component | Path | Extracted from |
|-----------|------|----------------|
| `PlatformLeftSidebar` | `layouts/PlatformLeftSidebar.tsx` | Aside frame, collapse control, customize footer |
| `PlatformRightRail` | `layouts/PlatformRightRail.tsx` | 40px fixed rail frame |
| `PlatformRightRailModuleButton` | same | Shared rail icon button styles |
| `PlatformRightRailSpacer` | same | Flex spacer |

**Consumers updated (behavior preserved):**

| Consumer | Uses |
|----------|------|
| `DashboardLayoutInner.tsx` | `PlatformLeftSidebar`, `PlatformRightRail`, rail buttons |
| `DashboardLayoutWrapper.tsx` | `PlatformLeftSidebar`, `PlatformRightRail`, rail buttons |

**Not extracted (consumer-specific):** Nav list logic (folders/loose modules interleave vs separate), Work tab sidebar states, AI/modules routing, `GlobalHeaderTabs`.

**Validation:** `pnpm type-check` PASS.

**Next:** **3C-4C** — migrate `DashboardLayoutWrapper` onto `PlatformShell` primitive.

### 3C-4C DashboardLayoutWrapper PlatformShell migration (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS** (manual QA pending)

| Consumer | Primitive | Notes |
|----------|-----------|-------|
| `DashboardLayoutWrapper.tsx` | `PlatformShell` `mode="business"` | First production consumer |

**Slots:**

| Slot | Content |
|------|---------|
| `header` | `GlobalHeaderTabs` (unchanged) |
| `leftNav` | `PlatformLeftSidebar` + nav logic (unchanged) |
| `rightRail` | `PlatformRightRail` + actions (unchanged) |
| `children` | Loading gates + `BusinessWorkspaceContent` / nested routes |

**PlatformShell addition:** `useNativePanels` — renders 3C-4B panel components without double-wrapping `PlatformShellLeftNav` / `PlatformShellRightRail`.

**Validation:** `pnpm type-check` PASS.

**Next:** **3C-4D** — header unification (`GlobalHeaderTabs` ↔ `DashboardLayoutInner`).

### 3C-4D Header unification planning (2026-06-03)

**Status:** Closed — **PLAN only** (no code changes)

**Deliverable:** [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](./PLATFORM_HEADER_STANDARDIZATION_PLAN.md)

| Question | Answer |
|----------|--------|
| Recommended option | **B** — `PlatformHeader` + shared tab primitives |
| Unify before Inner → PlatformShell? | **Yes** — reject Option C |
| 3C-4D.1 ready for ACT? | **Yes** — frame primitive only |

**Next:** **3C-4D.1** `PlatformHeader` foundation ACT.

### 3C-4D.1 PlatformHeader foundation (2026-06-03)

**Status:** Closed — **ACT complete**

| Deliverable | Path |
|-------------|------|
| `PlatformHeader` + subcomponents | `web/src/components/layouts/PlatformHeader.tsx` |
| Tab palette utilities | `web/src/components/layouts/platformHeaderTabs.tsx` |
| `useNativeHeader` | `PlatformShell.tsx` |

**Validation:** `pnpm type-check` PASS. No consumer migration.

**Next:** **3C-4D.2** — refactor `GlobalHeaderTabs` onto `PlatformHeader`.

### 3C-4D.2 GlobalHeaderTabs PlatformHeader refactor (2026-06-03)

**Status:** Closed — **ACT complete**

| Change | Detail |
|--------|--------|
| `GlobalHeaderTabs` | Renders via `PlatformHeader mode="business"` + `PlatformDashboardTab` |
| `DashboardLayoutWrapper` | `useNativeHeader` enabled — no nested `<header>` |

**Validation:** `pnpm type-check` PASS. Manual QA pending.

**Next:** **3C-4D.3** — personal header extraction (`DashboardLayoutInner`).

### 3C-4D.3 Personal header PlatformHeader refactor (2026-06-03)

**Status:** Closed — **ACT complete**

| Change | Detail |
|--------|--------|
| `DashboardLayoutInner` | Inline `<header>` → `PlatformHeader mode="personal"` |
| Tab logic | Remains in Inner (Place/Work/edit/drag/delete) |

**PlatformShell migration:** Still deferred (3C-4E).

**Next:** **3C-4D.4** — shared header actions + AI badge alignment.

### 3C-4D.4 Shared header actions (2026-06-03)

**Status:** Closed — **ACT complete**

| Deliverable | Detail |
|-------------|--------|
| `PlatformHeaderActionRow` | Search + AI + avatar shared row |
| AI polling | Option A — business only; personal deferred |

**Next:** **3C-4E** — `DashboardLayoutInner` → `PlatformShell`.

### 3C-4E Personal PlatformShell migration (2026-06-03)

**Status:** Closed — **ACT complete**

| Change | Detail |
|--------|--------|
| `DashboardLayoutInner.tsx` | `PlatformShell mode="personal"` + `useNativeHeader` + `useNativePanels` |
| Work tab | `showLeftNav={!showWorkTab}` · `showRightRail={!showWorkTab}` |
| Primitives | `PlatformHeader`, `PlatformLeftSidebar`, `PlatformRightRail`, `PlatformHeaderActionRow` |

**Validation:** `pnpm type-check` PASS. Manual QA pending.

**Next:** **3C-4F** — certification.

### 3C-4F PlatformShell certification (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS**

| Deliverable | Path |
|-------------|------|
| Certification audit | [`audits/PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md) |
| Blocking issues | 0 |
| Manual QA | Pending |

**Wave 3C PlatformShell program:** **Complete** (engineering).

---

## 10. File Map (implementation reference)

| Current | Future role |
|---------|-------------|
| `DashboardLayoutInner.tsx` | Personal orchestrator — composes PlatformShell + tabs/modals |
| `DashboardLayoutWrapper.tsx` | Business orchestrator — composes PlatformShell + dashboard ensure |
| `GlobalHeaderTabs.tsx` | Absorbed into `PlatformHeader` / `PlatformDashboardTabs` (4D) |
| `DashboardLayout.tsx` | Unchanged provider wrapper |
| `business/[id]/workspace/layout.tsx` | Unchanged SSR + providers |
| `SidebarFolderRenderer.tsx` | Unchanged — slot content |
| `SidebarCustomizationContext.tsx` | Unchanged — provider |
| `layouts/WorkspaceSplitLayout.tsx` | Unchanged — module layer |

---

**Last updated:** 2026-06-03 (3C-4F certification closeout)
