# Layout Shell Standardization Review (Wave 3C-0)

**Status:** Planning complete — review only  
**Date:** 2026-06-03  
**Mode:** Architecture and inventory — no code changes  
**Prerequisite:** Wave 3A-5 Platform Menu Certification — [`audits/PLATFORM_MENU_CERTIFICATION.md`](./audits/PLATFORM_MENU_CERTIFICATION.md)  
**UX archetype reference:** [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md) (Dashboard, Workspace, Management, Detail)

---

## 1. Executive Summary

Vssyl has **four documented layout archetypes** and **shared layout primitives** in `web/src/components/layouts/` (`PlatformShell`, `WorkspaceSplitLayout`, `PlatformHeader`). Module workspaces still mix ad hoc patterns where not yet migrated. **AI Chat deduplication (3C-5)** is **done** — `AIChatWorkspace` is the single implementation; `ai-chat/page.tsx` and `AIChatModule.tsx` are thin entry points. **Notifications layout (3C-6)** is **done** — `PageHeader` + `PageToolbar`; double chrome removed. Remaining duplication: Calendar/HR outer shells (3C-7), settings/admin management grids (deferred).

**Recommendation:** Wave **3C is justified**. Extract a **WorkspaceSplitLayout** primitive first (Drive as reference), then unify global dashboard chrome. Do **not** force one shell across Admin, BrandedWorkDashboard, or specialty builders.

| Question | Answer |
|----------|--------|
| Shell families discovered | **~12** (see §2) |
| Reference layout #1 (workspace) | **Drive** — `DrivePageContent` + `DriveModule` |
| Reference layout #1 (global shell) | **DashboardLayoutInner** — with business parity via extraction |
| Shared primitives today | **Partial** — `SidebarFolderRenderer`, `GlobalHeaderTabs`; no `PageHeader`/`SplitLayout` |
| Wave 3C justified? | **Yes** — duplication is structural, not cosmetic |

---

## 2. Shell Families Discovered

### 2A. Inventory table

| # | Shell family | Archetype | Key files | Regions | Duplication | Classification |
|---|--------------|-----------|-----------|---------|-------------|----------------|
| 1 | **Personal global shell** | Dashboard | `DashboardLayout.tsx`, `DashboardLayoutInner.tsx` | Fixed header (64px) + L sidebar (240) + main + R rail (40) | Medium | **Reference implementation** |
| 2 | **Business global shell** | Dashboard | `DashboardLayoutWrapper.tsx`, `GlobalHeaderTabs.tsx` | Same regions; business header extracted | **High** vs #1 | **Candidate for extraction** |
| 3 | **Drive / File Hub** | Workspace | `DrivePageContent.tsx`, `DriveModule.tsx`, `DriveSidebar.tsx` | L tree \| main grid + optional R details | Medium (2 wiring sites) | **Reference implementation** |
| 4 | **Chat** | Workspace | `ChatContent.tsx`, `ChatLeftPanel`, `ChatMainPanel`, `ChatRightPanel` | L 260 \| main \| R 320 | Low | **Reference implementation** |
| 5 | **AI Chat** | Workspace | `AIChatWorkspace.tsx` ← `page.tsx`, `AIChatModule.tsx` | L conv sidebar (320) \| chat column | **Resolved** (3C-5) | **Reference implementation** |
| 6 | **Calendar** | Workspace | `calendar/month/page.tsx`, `CalendarListSidebar` | L calendar list \| main grid | Medium | **Specialized pattern** |
| 7 | **Todo** | Workspace | `TodoModule.tsx` | Header row + optional project drawer + views | Low | **Specialized pattern** |
| 8 | **Notebook** | Workspace | `NotebookShell.tsx` | L sidebar \| editor + links rail | Low | **Specialized pattern** |
| 9 | **Notifications** | Management | `notifications/page.tsx` + `PageHeader`/`PageToolbar` | Category sidebar (256) \| feed | **Resolved** (3C-6) | **Reference implementation** |
| 10 | **Place** | Workspace | `PlaceContent.tsx`, `/place/page.tsx`, `PlaceWorkspaceLanding.tsx` | Tab nav \| content; route uses manual `marginTop: 64` | Medium | **Specialized pattern** |
| 11 | **Business profile** | Management | `business/[id]/profile/page.tsx` | Breadcrumbs + tabs \| panels | Low | **Management pattern** |
| 12 | **Settings** | Management | `profile/settings/page.tsx` | Title + sticky tab nav (lg:3) \| forms (lg:9) | Low | **Management pattern** |
| 13 | **Admin Portal** | Management | `admin-portal/layout.tsx` | Dark header + L nav (64/256) \| `p-6` main | Low (isolated) | **Reference for admin** |
| 14 | **Branded Work entry** | Specialized | `BrandedWorkDashboard.tsx`, Work tab in Inner | Full-bleed; **no** L/R sidebars | Low | **Specialized pattern** |
| 15 | **HR / Scheduling** | Workspace sub-shell | `HRLayout.tsx`, `SchedulingLayout.tsx` | L module sidebar \| content view | Medium (parallel copies) | **Candidate for extraction** |
| 16 | **Module landing hubs** | Workspace entry | `*WorkspaceLanding.tsx` (5 modules) | Hub header + card grid | Low per module | **Specialized pattern** |

**Count:** **12 core families** + **4 sub-families** (HR, Scheduling, landings, Work tab) = **~16 named surfaces**, collapsing to **~10 structural patterns**.

---

### 2B. Per-family detail

#### Drive (Reference #1 — workspace)

| Aspect | Implementation |
|--------|----------------|
| **Structure** | `flex h-full` → `DriveSidebar` \| `DriveModuleWrapper` |
| **Header** | Module-internal title/breadcrumb row in `DriveModule` at root |
| **Sidebar** | Folder tree, quick links, "New" `DropdownMenu` |
| **Toolbar** | Bulk selection bar; filter `Popover` |
| **Content** | Grid/list + optional `DriveDetailsPanel` (right rail) |
| **Responsive** | `flex h-full`; details panel behavior module-local |
| **Wiring** | Personal: `DrivePageContent`; Business: `BusinessWorkspaceContent` `case 'drive'` (duplicate flex row) |

#### Dashboard (Reference — global shell)

| Aspect | Implementation |
|--------|----------------|
| **Structure** | `100vh` fixed header + flex body + fixed right rail |
| **Header** | Dashboard tabs, search, AI dropdown, trash, avatar — **inline styles** in Inner |
| **Sidebar** | `SidebarFolderRenderer` + customization context |
| **Toolbar** | Module-specific (`DashboardHeader` on widget canvas) |
| **Content** | Widget grid OR `{children}` module routes |
| **Responsive** | `isMobile` reflow; sidebar collapse to 0/240 |
| **Special** | Work tab hides sidebars; Place tab inlines `PlaceContent` |

#### Business Workspace

| Aspect | Implementation |
|--------|----------------|
| **Structure** | Mirrors personal shell via `DashboardLayoutWrapper` |
| **Header** | `GlobalHeaderTabs` (partial extraction from Inner) |
| **Sidebar** | Same folder renderer logic as personal |
| **Content** | `BusinessWorkspaceContent` module `switch` |
| **Duplication** | ~400+ lines of parallel sidebar/rail JSX vs Inner |

#### AI Chat

| Aspect | Implementation |
|--------|----------------|
| **Structure** | `h-full flex` — 320px conversation list \| main |
| **Duplication** | **Resolved** — `AIChatWorkspace.tsx` (~3045 lines); entry points 7 + 21 LOC |
| **Classification** | **Reference** — single workspace, `variant: page \| embedded` |

#### Chat

| Aspect | Implementation |
|--------|----------------|
| **Structure** | 3-panel: left 260 \| main \| right 320 |
| **Responsive** | Panel collapse `<768px` in `ChatContent.tsx` |
| **Classification** | **Reference** for 3-panel workspace |

#### Calendar

| Aspect | Implementation |
|--------|----------------|
| **Structure** | `CalendarListSidebar` \| main; month view uses `h-screen` inside dashboard shell |
| **Risk** | Nested `h-screen` may conflict with parent `h-full` |
| **Classification** | **Specialized** — view-specific headers/toolbars |

#### Notifications

| Aspect | Implementation |
|--------|----------------|
| **Structure** | `DashboardLayout` main → `PageHeader` + category sidebar + `PageToolbar` + feed |
| **Classification** | **Reference** — first management-page primitive consumer (3C-6) |

#### Admin Portal

| Aspect | Implementation |
|--------|----------------|
| **Structure** | Standalone dark shell; not nested in dashboard |
| **Classification** | **Reference for admin** — intentional isolation |

---

## 3. Reference Layout Recommendation

### Workspace module shell → **Drive**

**Rationale (vs Business Workspace, Dashboard):**

| Candidate | Pros | Cons |
|-----------|------|------|
| **Drive** | Clearest 2-panel + optional 3-panel split; tokenized toolbars/menus post-3A; File Hub is architecture Reference #1; `DrivePageContent` is small and composable | Duplicated wiring in business switch |
| **Business Workspace** | Central module router | Shell is duplicated global chrome, not module layout; hub is a switch, not a layout |
| **Dashboard** | Platform entry point | Widget canvas ≠ module workspace; heavy inline styles |

**Drive wins** for **WorkspaceSplitLayout** extraction: `sidebar | main | optionalDetails`.

### Global platform shell → **DashboardLayoutInner** (with extraction plan)

Personal shell is the behavioral source of truth. Business shell should **consume extracted primitives**, not remain a parallel implementation. `GlobalHeaderTabs` is the start of header extraction.

### Dual-reference model (ratified for 3C)

```
Global shell reference     →  DashboardLayoutInner (extract → PlatformShell)
Workspace module reference →  DrivePageContent + DriveModule (extract → WorkspaceSplitLayout)
Management reference       →  admin-portal/layout + profile/settings grid
Detail reference           →  FilePreviewPanel, event drawers (per LAYOUT_PATTERNS.md §4)
```

---

## 4. Common Primitives Today

| Primitive | Location | Adoption | Notes |
|-----------|----------|----------|-------|
| **`SidebarFolderRenderer`** | `web/src/components/sidebar/SidebarFolderRenderer.tsx` | **High** | Primary L-nav (personal + business) |
| **`SidebarCustomizationContext`** | `web/src/contexts/SidebarCustomizationContext.tsx` | **High** | Folder/pin config |
| **`GlobalHeaderTabs`** | `web/src/components/GlobalHeaderTabs.tsx` | Business only | Partial header extraction |
| **`SidebarNavigation`** | `shared/src/components/SidebarNavigation.tsx` | **Low** | Generic 224px nav; legacy gray-900 styling; underused |
| **`BusinessLayoutRuntimeShell`** | `web/src/runtime/workspace/BusinessLayoutRuntimeShell.tsx` | Scope bridge | Not visual shell |
| **`FilePreviewPanel`** | `shared/src/components/FilePreviewPanel.tsx` | Detail panel | Not page shell |

### Not found (gaps)

| Proposed primitive | Status |
|--------------------|--------|
| `PageHeader` | ✅ `layouts/PageHeader.tsx` (3C-6) |
| `PageToolbar` | ✅ `layouts/PageToolbar.tsx` (3C-6) |
| `PageSection` | ❌ Does not exist |
| `PageSidebar` | ❌ Does not exist |
| `SplitLayout` / `WorkspaceShell` | ❌ Does not exist |
| `ModuleContainer` | ❌ Does not exist |
| `web/src/components/layouts/*` | ✅ `WorkspaceSplitLayout` + `PlatformShell` (3C-4A) |

---

## 5. Duplication Findings

### High priority

| Duplication | Files | Est. overlap |
|-------------|-------|--------------|
| Personal ↔ Business global shell | `DashboardLayoutInner` ↔ `DashboardLayoutWrapper` | Header, sidebar, right rail, collapse logic |
| ~~AI Chat workspace~~ | ~~`ai-chat/page.tsx` ↔ `AIChatModule.tsx`~~ | **Done (3C-5)** — `AIChatWorkspace` |
| Drive workspace wiring | `DrivePageContent` ↔ `BusinessWorkspaceContent` drive branch | Identical `flex h-full` row |

### Medium priority

| Duplication | Notes |
|-------------|-------|
| Calendar workspace | Personal routes + business `case 'calendar'` |
| HR / Scheduling sub-shells | Same `sidebar \| main` pattern, separate implementations |
| ~~Notifications double chrome~~ | **Done (3C-6)** — `PageHeader` + `PageToolbar` |
| Place routing | `PlaceContent` tab vs `/place/page` manual offset |

### Low priority / acceptable

| Surface | Notes |
|---------|-------|
| Admin portal | Isolated by design |
| BrandedWorkDashboard | Full-bleed intentional |
| Module landing hubs | Small, module-specific card grids |
| Todo / Notebook | Specialized headers; low structural overlap |

### Quantitative signals

| Signal | Value |
|--------|------:|
| Routes using `DashboardLayout` | **14** layout wrappers |
| `flex h-full` workspace patterns | **20+** files |
| Shared layout directory | **0** files |
| `DashboardLayoutInner` | ~1200 lines (inline styles) |
| `DashboardLayoutWrapper` | ~800 lines |

---

## 6. Extraction Opportunities

### Recommended primitives (Wave 3C implementation)

| Primitive | Purpose | Reference source | Priority |
|-----------|---------|------------------|----------|
| **`WorkspaceSplitLayout`** | `sidebar \| main \| optionalRight`; width props; collapse hooks | `DrivePageContent`, `ChatContent` | **P0** |
| **`PlatformShell`** | Header + L sidebar + main + R rail slots | Extract from `DashboardLayoutInner` + `DashboardLayoutWrapper` | **P1** |
| **`PageHeader`** | Title, description, primary action, breadcrumbs slot | Notifications, Todo, Management pages | **P2** |
| **`PageToolbar`** | Filter row, view toggles, bulk actions slot | Drive bulk bar, Todo header, Calendar toolbar | **P2** |
| **`ManagementLayout`** | Sticky side nav + content grid (`lg:grid-cols-12`) | Settings, Admin patterns | **P3** |
| **`ModuleLandingLayout`** | Hub title + badge + card grid | `*WorkspaceLanding.tsx` family | **P3** (optional) |

### Proposed file placement

```
web/src/components/layouts/
  PlatformShell.tsx          # P1 — global chrome slots
  WorkspaceSplitLayout.tsx   # P0 — module workspace
  PageHeader.tsx             # P2
  PageToolbar.tsx            # P2
  ManagementLayout.tsx       # P3
  index.ts
```

Use `v.*` tokens and landmark roles per [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md).

---

## 7. What Should NOT Be Standardized

| Exception | Rationale | Classification |
|-----------|-----------|----------------|
| **BrandedWorkDashboard** | Full-bleed work entry; sidebars intentionally hidden | Certified exception |
| **Admin Portal dark shell** | Isolated governance UX; different density and nav model | Certified exception |
| **Place graph / explore tabs** | Domain-specific sub-navigation and inline styles | Specialized — extract tabs only if reused elsewhere |
| **HR / Scheduling visual builders** | Builder canvases with hide-sidebar modes | Specialized — use `WorkspaceSplitLayout` for outer shell only |
| **Widget dashboard canvas** | Grid layout is not a module workspace | Keep `DashboardGrid` separate |
| **Global chat floating stack** | Overlay widgets, not page shell | Certified exception |
| **Chat layout without `?dashboard=`** | Intentional bare mode for embed contexts | Certified exception |
| **Detail panels** (`FilePreviewPanel`, event drawers) | Detail archetype, not workspace shell | Use Detail pattern per §4 LAYOUT_PATTERNS |

---

## 8. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Inline styles in `DashboardLayoutInner`** | High | Extract incrementally; tokenize during PlatformShell pass |
| **`h-screen` inside `h-full` parents** | Medium | Audit Calendar, Chat; enforce single height owner in `WorkspaceSplitLayout` |
| **Business vs personal context** | High | PlatformShell must accept `variant: personal \| business` without forking files |
| **Module-specific responsive collapse** | Medium | WorkspaceSplitLayout exposes `collapseBelow`, `onPanelToggle` — don't hardcode Chat widths globally |
| **Large file migrations (AI chat)** | Mitigated | 3C-5 complete — future splits can extract `AIChatSidebar` / composer subcomponents |
| **Regression in sidebar customization** | High | Keep `SidebarFolderRenderer` as slot content; don't rewrite folder logic in 3C |
| **Scope creep into module UX redesign** | Medium | 3C is shell extraction only — no workflow changes |

---

## 9. Recommended Implementation Order

| Phase | Scope | Reference | Outcome |
|-------|-------|-----------|---------|
| **3C-0** | This review | — | Inventory + architecture decision ✅ |
| **3C-1** | `WorkspaceSplitLayout` primitive | Drive `DrivePageContent` + `DriveModule` | Sidebar \| main \| optional right ✅ |
| **3C-2** | Drive rollout (all routes + business branch) | Drive | **Done** ✅ |
| **3C-3** | Migrate Chat 3-panel variant | Chat | **Done** ✅ |
| **3C-4** | `PlatformShell` planning | Inner + Wrapper | **Done (PLAN)** ✅ — see [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](./PLATFORMSHELL_STANDARDIZATION_PLAN.md) |
| **3C-4A** | `PlatformShell` foundation | `layouts/PlatformShell.tsx` | **Done** ✅ |
| **3C-4B** | Shared shell content extraction | `PlatformLeftSidebar`, `PlatformRightRail` | **Done** ✅ |
| **3C-4C** | Business shell → `PlatformShell` | `DashboardLayoutWrapper.tsx` | **Done** ✅ |
| **3C-4D** | Header unification planning | `GlobalHeaderTabs` ↔ Inner | **Done (PLAN)** ✅ — [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](./PLATFORM_HEADER_STANDARDIZATION_PLAN.md) |
| **3C-4D.1** | `PlatformHeader` foundation | layouts | **Done** ✅ |
| **3C-4D.2** | `GlobalHeaderTabs` → `PlatformHeader` | business header | **Done** ✅ |
| **3C-4D.3** | Personal header → `PlatformHeader` | `DashboardLayoutInner` | **Done** ✅ |
| **3C-4D.4** | Shared header actions | `PlatformHeaderActionRow` | **Done** ✅ |
| **3C-4E** | Personal `PlatformShell` | `DashboardLayoutInner` | **Done** ✅ |
| **3C-4F** | Certification | both shells | **Done** ✅ — [`PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md) |
| **3C-5** | AI Chat deduplication | `AIChatWorkspace` + thin entry points | **Done** ✅ — [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./audits/AI_CHAT_DEDUPLICATION_CLOSEOUT.md) |
| **3C-6** | `PageHeader` + `PageToolbar` + Notifications adoption | Notifications | **Done** ✅ — [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](./audits/NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md) |
| **3C-7** | Calendar + HR/Scheduling outer shells | Calendar, HR | Medium duplication cleanup |
| **3C-8** | `ManagementLayout` | Settings, Admin alignment | Optional grid primitive |
| **3C-9** | Certification closeout | All 3C consumers | `LAYOUT_SHELL_CERTIFICATION.md` |

**Defer:** Place specialty tabs, BrandedWorkDashboard, widget grid internals, detail panel internals.

---

## 10. Is Wave 3C Justified?

**Yes.**

| Criterion | Assessment |
|-----------|------------|
| Documented archetypes exist | ✅ `LAYOUT_PATTERNS.md` |
| Shared primitives missing | ✅ No `layouts/` directory |
| Duplication is structural | ✅ Inner/Wrapper, AI×2, Drive×2 |
| Reference module available | ✅ Drive (workspace) + Inner (global) |
| Prior waves established pattern | ✅ 2A Modals, 3A Menus — same extract-then-rollout model |
| Risk manageable with phased order | ✅ P0 WorkspaceSplitLayout is narrow |

Wave 3C is the layout equivalent of Wave 3A: **inventory → primitive → reference rollout → certification**.

---

## 11. Relationship to Other Waves

| Wave | Relationship |
|------|--------------|
| **3A (Menus)** | Complete — toolbars in layouts should compose certified `DropdownMenu` / `ContextMenu` |
| **3B (Drive interaction)** | Can run parallel or after 3C-1 — ConfirmModal purge is orthogonal to shell extraction |
| **3C (Layouts)** | **This review** — begins 3C-0 |
| **Wave 4 (Module UX audits)** | Layout compliance becomes a scorecard category |
| **Accessibility Wave** | Skip links, landmark regions, panel focus — post-shell extraction |

---

## 12. Route Layout Map (Appendix)

| Route | `layout.tsx` | Shell |
|-------|--------------|-------|
| `dashboard/` | `DashboardLayout` | Personal global |
| `drive/`, `chat/`, `calendar/`, `todo/`, `ai-chat/`, `notifications/`, `notebook/`, `notes/`, `profile/` | `DashboardLayout` | Personal global + module |
| `business/[id]/workspace/` | `DashboardLayoutWrapper` | Business global |
| `admin-portal/` | Standalone | Admin |
| `place/` | `PlaceProvider` only | Manual offset / specialty |
| `business/` | Passthrough | None |

---

### 3C-1 WorkspaceSplitLayout foundation (2026-06-03)

**Primitive:** `web/src/components/layouts/WorkspaceSplitLayout.tsx`

| Export | Role |
|--------|------|
| `WorkspaceSplitLayout` | Root `flex h-full min-h-0` row |
| `WorkspaceSidebar` | Left slot (`flex-shrink-0`) |
| `WorkspaceMain` | Primary slot (`flex-1 min-w-0`, `overflow` prop) |
| `WorkspaceSecondary` | Right slot (`flex-shrink-0`) |

**Drive pilot consumers:**

| File | Mode | Slots |
|------|------|-------|
| `DrivePageContent.tsx` | 2-column | Sidebar + Main |
| `DriveModule.tsx` | 2/3-column | Main + Secondary (details panel) |

### 3C-2 Drive WorkspaceSplitLayout rollout (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS** (manual QA pending)

| Consumer | Path | Mode | Migrated |
|----------|------|------|----------|
| My Drive (outer) | `DrivePageContent.tsx` | 2-col | 3C-1 ✅ |
| My Drive (inner) | `DriveModule.tsx` | 2/3-col | 3C-1 ✅ |
| Starred / Pinned | `drive/starred/page.tsx` | 2/3-col | 3C-2 ✅ |
| Shared | `drive/shared/page.tsx` | 2-col | 3C-2 ✅ |
| Recent | `drive/recent/page.tsx` | 2-col | 3C-2 ✅ |
| Trash | `drive/trash/page.tsx` | 2-col | 3C-2 ✅ |
| Business workspace Drive | `BusinessWorkspaceContent.tsx` `case 'drive'` | 2-col | 3C-2 ✅ |

**Remaining Drive shell exceptions:**

| Exception | Path | Notes |
|-----------|------|-------|
| Loading states | `drive/page.tsx` | Auth/loading spinners only — not workspace shells |
| `h-screen` in Suspense fallback | `drive/shared/page.tsx` | Loading overlay — not workspace shell |

**Drive layout rollout:** **complete** for active workspace routes.

### 3C-3 Chat WorkspaceSplitLayout rollout (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS** (manual QA pending)

**Chat layout inventory (pre-migration):**

| Surface | Path | Classification | Action |
|---------|------|----------------|--------|
| Primary 3-panel workspace | `app/chat/ChatContent.tsx` | Primary workspace shell | **Migrated** ✅ |
| Enterprise 2/3-panel workspace | `components/chat/enterprise/EnhancedChatModule.tsx` | Secondary workspace shell | **Migrated** ✅ |
| Page wrapper | `app/chat/page.tsx` | Thin `flex h-full` passthrough | **Unchanged** — not a duplicated shell |
| Module wrappers | `ChatModule.tsx`, `ChatModuleWrapper.tsx` | `h-full` passthrough to `ChatContent` | **Unchanged** |
| Panel content | `ChatLeftPanel`, `ChatMainPanel`, `ChatRightPanel` | Content within shell | **Unchanged** |
| Floating global widget | `UnifiedGlobalChat.tsx` | Specialized fixed/minimized widget | **Certified exception** |
| Floating window | `ChatWindow.tsx` | Overlay window (not page workspace) | **Not a layout shell** |
| Mobile full-screen | `MobileChat.tsx` | Mobile-only vertical column | **Certified exception** |
| Legacy stub | `ChatSidebar.tsx` | Unused / stub | **Not a layout shell** |

**Migrated consumers:**

| Consumer | Path | Mode | Slots |
|----------|------|------|-------|
| Primary chat workspace | `ChatContent.tsx` | 3-col (collapsible L/R) | Sidebar + Main + Secondary |
| Enterprise chat | `EnhancedChatModule.tsx` | 2/3-col | Sidebar + Main + optional Secondary (enterprise panel) |

**Certified exceptions:**

| Exception | Path | Notes |
|-----------|------|-------|
| Mobile chat | `MobileChat.tsx` | Single-column vertical layout (`header \| messages \| input`); forcing `WorkspaceSplitLayout` would change mobile UX |
| Global floating chat | `UnifiedGlobalChat.tsx` | Fixed-position widget with minimize/resize; internal 2-col is widget-local, not primary workspace |
| Auth/loading states | `ChatContent.tsx` | Centered spinners — not workspace shells |

**Remaining duplicated chat shells:** None in active primary workspace routes. `UnifiedGlobalChat` retains widget-local flex (certified exception).

**Chat layout rollout:** **complete** for primary and enterprise workspace surfaces.

**PlatformShell:** Foundation shipped (3C-4A); consumer rollout pending (3C-4B–4F).

### 3C-4 PlatformShell planning (2026-06-03)

**Status:** Closed — **PLAN only** (no code changes)

**Deliverable:** [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](./PLATFORMSHELL_STANDARDIZATION_PLAN.md)

| Question | Answer |
|----------|--------|
| Shells inventoried | Personal (`DashboardLayoutInner`), Business (`DashboardLayoutWrapper`), partial header (`GlobalHeaderTabs`), Admin, Auth, 14× `DashboardLayout` passthroughs |
| Duplication | ~2,900 LOC shell code; ~55–65% structural overlap (sidebar, right rail, collapse, branding) |
| `PlatformShell` justified? | **Yes** |
| 3C-4A ready for ACT? | **Yes** — primitive + structural slots only; no consumer migration |
| Recommended migration order | 4A primitive → 4B shared sidebar/rail → 4C Wrapper → 4D header unify → 4E Inner → 4F certification |

**Certified exceptions (remain outside PlatformShell):** Admin portal, Auth, BrandedWorkDashboard/Work tab geometry, floating chat stack, chat bare layout.

### 3C-4A PlatformShell foundation (2026-06-03)

**Status:** Closed — **PASS** (foundation only; no consumers)

| Primitive | Path | Slots |
|-----------|------|-------|
| `PlatformShell` | `web/src/components/layouts/PlatformShell.tsx` | header, leftNav, main, rightRail |
| Subcomponents | `PlatformShellHeader`, `PlatformShellLeftNav`, `PlatformShellMain`, `PlatformShellRightRail` | Structural landmarks |
| Defaults | `PLATFORM_SHELL_DEFAULTS` | 64px header, 240px left nav, 40px right rail, 700px collapse breakpoint (documented) |

**Validation:** `pnpm type-check` PASS.

**Next:** **3C-4B** — shared sidebar/rail content extraction.

### 3C-4B Shared shell content extraction (2026-06-03)

**Status:** Closed — **PASS** (manual QA pending)

| Component | Role |
|-----------|------|
| `PlatformLeftSidebar` | Collapse UI, aside frame, customize footer; nav via children |
| `PlatformRightRail` | 40px fixed rail frame |
| `PlatformRightRailModuleButton` | Shared rail button styling |
| `PlatformRightRailSpacer` | Rail flex spacer |

**Wired into:** `DashboardLayoutInner.tsx`, `DashboardLayoutWrapper.tsx` (identical behavior; duplicated JSX removed).

**Validation:** `pnpm type-check` PASS.

**Next:** **3C-4C** — `DashboardLayoutWrapper` → `PlatformShell` adoption.

### 3C-4C Business PlatformShell adoption (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS** (manual QA pending)

| Consumer | Adoption |
|----------|----------|
| `DashboardLayoutWrapper.tsx` | `PlatformShell mode="business"` + `useNativePanels` |

**Unchanged:** `GlobalHeaderTabs`, `BusinessWorkspaceContent`, sidebar/rail logic, providers.

**Validation:** `pnpm type-check` PASS.

**Next:** **3C-4D** — header unification.

### 3C-4D Header unification planning (2026-06-03)

**Status:** Closed — **PLAN only**

**Recommendation:** Option B — `PlatformHeader` + shared tab primitives; unify before Inner → `PlatformShell`.

**Deliverable:** [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](./PLATFORM_HEADER_STANDARDIZATION_PLAN.md)

**Next:** **3C-4D.1** `PlatformHeader` foundation ACT.

### 3C-4D.1 PlatformHeader foundation (2026-06-03)

**Status:** Closed — **ACT complete** — `PlatformHeader`, tab utilities, `useNativeHeader`; no consumers.

**Next:** **3C-4D.2** — `GlobalHeaderTabs` refactor.

### 3C-4D.2 GlobalHeaderTabs refactor (2026-06-03)

**Status:** Closed — **ACT complete** — first `PlatformHeader` consumer; `useNativeHeader` on business shell.

**Next:** **3C-4D.3** — personal header extraction.

### 3C-4D.3 Personal header refactor (2026-06-03)

**Status:** Closed — **ACT complete** — `DashboardLayoutInner` on `PlatformHeader`; PlatformShell still deferred.

**Next:** **3C-4D.4** — shared header actions.

### 3C-4D.4 Shared header actions (2026-06-03)

**Status:** Closed — **ACT complete** — `PlatformHeaderActionRow` in both headers.

**Next:** **3C-4E** — `DashboardLayoutInner` → `PlatformShell`.

### 3C-4E Personal PlatformShell (2026-06-03)

**Status:** Closed — **ACT complete** — both personal and business shells on `PlatformShell`.

**Next:** **3C-4F** — certification.

### 3C-4F PlatformShell certification (2026-06-03)

**Status:** Closed — **PASS WITH FINDINGS** — [`PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md)

**Verdict:** Wave 3C PlatformShell program **complete** (engineering). Manual QA pending.

**Last updated:** 2026-06-03 (3C-4F certification closeout)
