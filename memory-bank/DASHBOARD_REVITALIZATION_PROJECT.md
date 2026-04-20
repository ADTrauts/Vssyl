# Dashboard Revitalization Project

**Project Start Date:** February 26, 2026  
**Status:** ✅ PROJECT COMPLETE  
**Last Updated:** April 6, 2026

---

## Executive Summary

The dashboard system is one of the most neglected areas of Vssyl. While the multi-tab architecture, module installation system, and basic widget components exist, the actual dashboard UX is lackluster with outdated styling, no grid layout, and missing functionality. This project transforms the dashboard into a modern, professional workspace hub.

---

## Current State Assessment

### What Already Exists ✅
- **Multi-tab dashboard system** -- Users can create multiple dashboard tabs (each a `Dashboard` record)
- **Module installation per tab** -- Modules can be installed on specific tabs via `DashboardBuildOutModal`
- **5 widget types** -- Chat, Drive, Calendar, Todo, AI (all functional)
- **Basic drag-and-drop** -- `@dnd-kit/core` with `DraggableWrapper` for reordering
- **Widget CRUD backend** -- Create, update, delete with ownership checks
- **Prisma Widget model** -- Has `config` (JSON) and `position` (JSON) fields
- **Dashboard context system** -- Supports Personal/Business/Household/Educational
- **Classification badges** -- Context menus on widgets for data classification
- **Tab navigation** -- Handled in `DashboardLayout.tsx`

### What's Wrong ❌
1. **No grid layout** -- Widgets render in `display: flex; flex-wrap: wrap`. No snapping, no resizing.
2. **All inline styles** -- `DashboardClient.tsx` (1,084 lines) uses raw `style={{}}` objects, not Tailwind.
3. **Widget configs never persist** -- All 4 `onConfigChange` callbacks are `// TODO` stubs (lines 120, 133, 146, 159).
4. **Widget `position` field unused** -- Prisma model has it but nothing reads/writes grid coordinates.
5. **Hardcoded add buttons** -- Only "Add Chat Widget" and "Add File Hub Widget" buttons.
6. **No widget picker** -- No way to discover and add available widgets.
7. **No widget settings UI** -- Widgets have config interfaces but no settings panel.
8. **Missing widgets** -- HR, Scheduling, Notifications, Analytics have no dashboard widgets.
9. **No edit mode** -- Widgets always draggable. No way to lock layout.
10. **Legacy header cruft** -- `<h1>Dashboards</h1>`, `<h2>{name}</h2>`, `<p>Widgets: {count}</p>` -- redundant and ugly.
11. **No responsive grid** -- No breakpoint handling for tablet/mobile.

---

## Architecture Decisions

### Grid Library: `react-grid-layout`
- Industry standard for dashboard grids (18k+ GitHub stars)
- Native support for drag, resize, responsive breakpoints
- Collision detection and grid snapping built-in
- Well-documented, battle-tested in production dashboards

### Widget Picker Scope
- **Only shows widgets for modules installed on the current dashboard tab**
- If a tab has Chat + Calendar installed, only Chat and Calendar widgets appear
- Utility widgets (Quick Stats, Quick Notes, Bookmarks) always available
- Users can add multiple instances of the same widget type

### Edit Mode Design
- **Default: Locked** -- Widgets cannot be moved or resized
- **Edit Mode: Unlocked** -- Grid lines visible, resize handles appear, drag enabled
- Toggle via button in dashboard header area
- Prevents accidental layout changes

### Widget Size Constraints
- Each widget type has min/max grid dimensions
- Prevents broken layouts from undersized widgets
- Default sizes optimized for common use cases

---

## Phase Breakdown

---

## Phase 1: Grid Layout Infrastructure

**Goal:** Replace flex-wrap layout with a proper resizable, draggable grid system.

**Status:** ✅ COMPLETE (February 26, 2026)

### Tasks

#### 1.1 Install Dependencies
- [ ] Add `react-grid-layout` to web package
- [ ] Add required CSS imports

#### 1.2 Create DashboardGrid Component
**File:** `web/src/components/dashboard/DashboardGrid.tsx`

- [ ] Wrap `ResponsiveGridLayout` from react-grid-layout
- [ ] Configure responsive breakpoints:
  - `lg` (≥1200px): 12 columns
  - `md` (≥996px): 8 columns  
  - `sm` (≥768px): 4 columns
  - `xs` (<768px): 2 columns
- [ ] Define default widget sizes per type:
  ```typescript
  const DEFAULT_WIDGET_SIZES: Record<string, { w: number; h: number; minW: number; minH: number; maxW?: number; maxH?: number }> = {
    chat: { w: 4, h: 4, minW: 3, minH: 3 },
    drive: { w: 4, h: 4, minW: 3, minH: 3 },
    calendar: { w: 6, h: 5, minW: 4, minH: 4 },
    todo: { w: 4, h: 4, minW: 3, minH: 3 },
    ai: { w: 4, h: 5, minW: 3, minH: 4 },
    quickstats: { w: 12, h: 2, minW: 6, minH: 2 },
    notifications: { w: 3, h: 4, minW: 2, minH: 3 },
    quicknotes: { w: 3, h: 3, minW: 2, minH: 2 },
    bookmarks: { w: 2, h: 3, minW: 2, minH: 2 },
  };
  ```
- [ ] Implement layout change handler (debounced save)
- [ ] Support edit mode prop (enable/disable drag & resize)
- [ ] Grid background lines (visible only in edit mode)

#### 1.3 Create useDashboardGrid Hook
**File:** `web/src/hooks/useDashboardGrid.ts`

- [ ] Manage grid layout state
- [ ] Convert widget positions to/from react-grid-layout format
- [ ] Handle layout save with debounce (500ms)
- [ ] Provide `addWidget`, `removeWidget`, `updateWidgetPosition` functions

#### 1.4 Widget Position Persistence
- [ ] Read `Widget.position` JSON on load, convert to layout format
- [ ] Write layout changes back to widget positions
- [ ] Handle missing positions (auto-assign for existing widgets)

#### 1.5 Backend: Batch Position Update
**Files:** 
- `server/src/controllers/widgetController.ts`
- `server/src/routes/widget.ts`

- [ ] Add `PUT /api/widget/batch-positions` endpoint
- [ ] Accept array of `{ widgetId, x, y, w, h }`
- [ ] Update all positions in single transaction
- [ ] Validate ownership for all widgets

#### 1.6 Frontend API Update
**File:** `web/src/api/widget.ts`

- [ ] Add `updateWidgetPositions(token, dashboardId, positions[])` function

#### 1.7 Migration Logic
- [ ] On dashboard load, if any widget has null position, auto-assign
- [ ] Use grid packing algorithm to prevent overlaps
- [ ] Save auto-assigned positions to backend

### Files Created
- `web/src/components/dashboard/DashboardGrid.tsx`
- `web/src/hooks/useDashboardGrid.ts`

### Files Modified
- `web/package.json` (add react-grid-layout)
- `web/src/api/widget.ts`
- `server/src/controllers/widgetController.ts`
- `server/src/routes/widget.ts`

### Acceptance Criteria
- [ ] Widgets display in a proper grid layout
- [ ] Widgets can be dragged to new positions (in edit mode)
- [ ] Widgets can be resized (in edit mode)
- [ ] Layout persists across page refreshes
- [ ] Grid is responsive across breakpoints
- [ ] No visual regressions on existing widget content

---

## Phase 2: Widget Shell & Framework

**Goal:** Create unified, polished widget container with consistent UX.

**Status:** ✅ COMPLETE

### Tasks

#### 2.1 Create WidgetShell Component ✅ (Completed in Phase 1)
**File:** `web/src/components/dashboard/WidgetShell.tsx`

- [x] Consistent container with Tailwind styling (no inline styles)
- [x] Header bar with widget icon, title, drag handle (edit mode), action buttons
- [x] Loading skeleton state
- [x] Error boundary with retry button
- [x] Overflow handling with scroll
- [x] Fullscreen expansion mode

#### 2.2 Widget Settings (Inline per-widget) ✅
Each widget retains its own inline settings panel toggled by a Settings button within the widget content area. This keeps settings contextual and discoverable.

#### 2.3 Implement Widget Config Persistence ✅
**File:** `web/src/hooks/useWidgetConfig.ts`

- [x] Hook that wraps config read/write
- [x] Debounced save to backend (600ms)
- [x] Optimistic updates (set state immediately, save async)
- [x] TypeScript generics for type-safe config
- [x] Reset to defaults function

#### 2.4 Fix Config TODO Stubs ✅ (Completed in Phase 1)
**File:** `web/src/app/dashboard/DashboardClient.tsx`

- [x] `onConfigChange` wired to `updateWidget` API
- [x] All widget types persist their configs via `handleWidgetConfigChange`

#### 2.5 Refactor Existing Widgets ✅
**Files:** `web/src/components/widgets/*.tsx`

- [x] ChatWidget: Removed Card wrapper, removed internal header/remove buttons, content-only rendering
- [x] DriveWidget: Removed Card wrapper, removed internal header/remove buttons, content-only rendering
- [x] CalendarWidget: Removed internal header/remove buttons, kept div structure
- [x] TodoWidget: Removed Card wrapper, removed internal header/remove buttons, content-only rendering
- [x] All widgets use Tailwind (no inline styles)
- [x] Each widget keeps its own settings toggle and settings panel

### Files Created
- `web/src/components/dashboard/WidgetShell.tsx` (Phase 1)
- `web/src/hooks/useWidgetConfig.ts`

### Files Modified
- `web/src/app/dashboard/DashboardClient.tsx` (WidgetContentRenderer updated, config casting)
- `web/src/components/widgets/ChatWidget.tsx` (stripped Card/header/remove, content-only)
- `web/src/components/widgets/DriveWidget.tsx` (stripped Card/header/remove, content-only)
- `web/src/components/widgets/CalendarWidget.tsx` (stripped header/remove, kept div structure)
- `web/src/components/widgets/TodoWidget.tsx` (stripped Card/header/remove, content-only)

### Acceptance Criteria
- [x] All widgets have consistent header/container styling via WidgetShell
- [x] Settings work for each widget type (inline toggles)
- [x] Config changes persist to backend via updateWidget API
- [x] Config loads correctly from widget.config field
- [x] Loading skeletons display during data fetch (WidgetShell + internal)
- [x] Errors display with retry option (WidgetShell)

---

## Phase 3: Dashboard Header & Cleanup

**Goal:** Remove legacy header cruft, add modern greeting and controls.

**Status:** ✅ COMPLETE

### Tasks

#### 3.1 Remove Legacy Header ✅ (Completed in Phase 1)
All legacy header text, hardcoded buttons, and inline styles removed.

#### 3.2 Create DashboardHeader Component ✅
**File:** `web/src/components/dashboard/DashboardHeader.tsx`

- [x] Time-based greeting ("Good morning/afternoon/evening, {firstName}")
- [x] Today's date formatted nicely
- [x] Edit Mode toggle button
- [x] "Add Widget" button (opens picker, only in edit mode)
- [x] Saving indicator
- [x] Quick summary stats as clickable pills (unread messages → /chat, pending tasks → /todo, upcoming events → /calendar)
- [x] Stats pills only appear when count > 0 (clean, non-cluttered)

#### 3.3 Create useDashboardStats Hook ✅
**File:** `web/src/hooks/useDashboardStats.ts`

- [x] Fetch summary stats for header display
- [x] Aggregate data from chat, todo, and calendar APIs
- [x] Auto-refresh on 2-minute interval
- [x] Uses `Promise.allSettled` for resilient fetching (one failing API doesn't break others)
- [x] Loading states

#### 3.4 Edit Mode State Management ✅ (Completed in Phase 1)
- [x] `isEditMode` state via `useDashboardGrid` hook
- [x] Passed to `DashboardGrid` and `WidgetShell`
- [x] UI updates based on mode (drag handles, remove buttons, add widget button)

#### 3.5 Clean Up Inline Styles ✅ (Completed in Phase 1)
- [x] All inline styles replaced with Tailwind
- [x] Component structure simplified
- [x] `DashboardClient` fully rewritten

### Files Created
- `web/src/components/dashboard/DashboardHeader.tsx` (Phase 1, enhanced Phase 3)
- `web/src/hooks/useDashboardStats.ts`

### Acceptance Criteria
- [x] No legacy header text visible
- [x] New header shows greeting with user's name
- [x] Quick stats display correctly as clickable pills
- [x] Edit mode toggle works
- [x] Add Widget button only visible in edit mode
- [x] All inline styles replaced with Tailwind

---

## Phase 4: Widget Picker

**Goal:** Replace hardcoded add buttons with a proper widget picker scoped to installed modules.

**Status:** ✅ COMPLETE

### Tasks

#### 4.1 Create Widget Registry ✅
**File:** `web/src/components/dashboard/widgetRegistry.ts`

- [x] 12 widget types registered (chat, drive, calendar, todo, ai, notifications, quickstats, quicknotes, bookmarks, hr, scheduling, activityfeed)
- [x] 5 categories: Communication, Files & Storage, Productivity, Business, Utility
- [x] Utility widgets marked `alwaysAvailable: true` (AI, Notifications, Quick Stats, Quick Notes, Bookmarks, Activity Feed)
- [x] `getAvailableWidgets()` filters by installed module IDs
- [x] `getWidgetsByCategory()` groups for display

#### 4.2 Create WidgetPicker Component ✅
**File:** `web/src/components/dashboard/WidgetPicker.tsx`

- [x] Full-screen modal with backdrop
- [x] Search input with real-time filtering
- [x] Category tab navigation (All, Productivity, Communication, etc.)
- [x] Each widget card shows icon, name, description, "Add" button, count of existing instances
- [x] Fetches installed modules via `getInstalledModules` API
- [x] Only shows widgets for installed modules + always-available utility widgets
- [x] Empty state for no-results and no-modules cases

#### 4.3 Get Installed Modules for Dashboard ✅
- [x] Uses existing `getInstalledModules()` API from `web/src/api/modules.ts`
- [x] No new API endpoint needed

#### 4.4 Integrate Widget Picker ✅
**File:** `web/src/app/dashboard/DashboardClient.tsx`

- [x] Replaced old `AddWidgetDropdown` with `WidgetPicker` modal
- [x] Removed hardcoded `AVAILABLE_WIDGET_TYPES` constant
- [x] Passes `existingWidgetTypes` for count display
- [x] Widget selection calls `createWidget` API with proper grid position
- [x] Cleaned up unused imports (X, useRef)

### Files Created
- `web/src/components/dashboard/widgetRegistry.ts`
- `web/src/components/dashboard/WidgetPicker.tsx`

### Files Modified
- `web/src/app/dashboard/DashboardClient.tsx` (replaced dropdown with modal picker)

### Acceptance Criteria
- [x] Widget picker opens from Add Widget button
- [x] Only widgets for installed modules are shown
- [x] Utility widgets always available
- [x] Adding widget creates it with proper grid position
- [x] Widget count per type shown accurately
- [x] Empty state handles no-modules case

---

## Phase 5: New Widget Types

**Goal:** Create widgets for all active modules and add utility widgets.

**Status:** ✅ COMPLETE (February 26, 2026)

### Tasks

#### 5.1 Quick Stats Widget
**File:** `web/src/components/widgets/QuickStatsWidget.tsx`

- [x] Aggregate key metrics across modules
- [x] Display cards for:
  - Unread messages
  - Today's events
  - Pending tasks
  - Storage usage percentage
- [x] Click to navigate to respective module
- [x] **Always available** (utility widget)
- [x] Settings panel: toggle each stat category, compact mode

#### 5.2 Notifications Widget
**File:** `web/src/components/widgets/NotificationsWidget.tsx`

- [x] Recent unread notifications from `/api/notifications`
- [x] Color-coded by category (chat, drive, calendar, todo, hr)
- [x] Quick actions: mark as read
- [x] Badge count showing unread total
- [x] Settings: max items, show/hide read notifications
- [x] **Always available** (utility widget)
- [x] Link to full notifications page

#### 5.3 HR Widget
**File:** Deferred to Phase 6 - Requires business-specific HR API endpoints

#### 5.4 Scheduling Widget
**File:** Deferred to Phase 6 - Requires business-specific scheduling API endpoints

#### 5.5 Activity Feed Widget
**File:** `web/src/components/widgets/ActivityFeedWidget.tsx`

- [x] Cross-module activity stream
- [x] Display recent activity items with module icons
- [x] Relative timestamps using formatRelativeTime
- [x] Settings: max items
- [x] Placeholder activities when no API available
- [x] **Always available** (utility widget)

#### 5.6 Quick Notes Widget
**File:** `web/src/components/widgets/QuickNotesWidget.tsx`

- [x] Simple scratchpad with textarea
- [x] Auto-save to widget config (debounced)
- [x] Multiple notes with tabs
- [x] Pin important notes
- [x] Delete notes (requires at least one)
- [x] **Always available** (utility widget)

#### 5.7 Bookmarks Widget
**File:** `web/src/components/widgets/BookmarksWidget.tsx`

- [x] Custom quick links with favicon auto-detection
- [x] Add/edit/delete bookmarks
- [x] One-click navigation (opens in new tab)
- [x] Inline edit mode
- [x] Auto-save to widget config
- [x] **Always available** (utility widget)

### Backend Support

#### 5.8 Quick Stats Endpoint
- Deferred - QuickStatsWidget uses existing module APIs directly (chat, todo, calendar)

#### 5.9 Activity Feed Endpoint
- Deferred - ActivityFeedWidget falls back to placeholder activities
- Full activity feed API can be added in Phase 6

### Files Created
- [x] `web/src/components/widgets/QuickStatsWidget.tsx`
- [x] `web/src/components/widgets/NotificationsWidget.tsx`
- [x] `web/src/components/widgets/QuickNotesWidget.tsx`
- [x] `web/src/components/widgets/BookmarksWidget.tsx`
- [x] `web/src/components/widgets/ActivityFeedWidget.tsx`

### Files Modified
- [x] `web/src/app/dashboard/DashboardClient.tsx` (imports + WidgetContentRenderer cases)
- [x] `web/src/components/dashboard/widgetRegistry.ts` (already had entries)

### Acceptance Criteria
- [x] Each new widget renders correctly
- [x] Data loads and displays properly
- [x] Settings work for each widget (inline settings panels)
- [x] Widgets appear in picker (utility widgets always available)
- [x] All lint checks pass

---

## Phase 6: Backend Enhancements

**Goal:** Support all frontend features with proper APIs.

**Status:** ✅ COMPLETE (February 26, 2026)

### Tasks

#### 6.1 Dashboard Preferences API
**Files:**
- `server/src/controllers/dashboardController.ts`
- `server/src/routes/dashboard.ts`

- [x] `PUT /api/dashboards/:id` already supports `preferences` field
- [x] Preferences stored in `Dashboard.preferences` JSON field
- [x] Includes: theme, defaultView, refreshInterval, notifications

#### 6.2 Widget Data Aggregation (Quick Stats Endpoint)
**File:** `server/src/controllers/dashboardAIContextController.ts`

- [x] `GET /api/dashboards/ai/context/quick-stats` aggregates module data
- [x] Returns: pendingTasks, completedTasks, totalConversations, totalFiles, unreadNotifications
- [x] Reduces multiple API calls to single endpoint

#### 6.3 Dashboard AI Context Provider
**File:** `server/src/startup/registerBuiltInModules.ts`

- [x] Registered dashboard as built-in module
- [x] Added AI context providers:
  - `dashboard_overview` — widget list, layout summary
  - `dashboard_quick_stats` — aggregated metrics
  - `dashboard_widget_summary` — what widgets exist, their configs
- [x] Enables AI queries: "What's on my dashboard?", "How many widgets do I have?"

#### 6.4 Dashboard AI Context Controller
**File:** `server/src/controllers/dashboardAIContextController.ts`

- [x] `getDashboardOverview` — dashboard summary with widget counts by type
- [x] `getDashboardQuickStats` — aggregated stats from tasks, files, notifications
- [x] `getDashboardWidgets` — detailed widget list with descriptions
- [x] All endpoints return AI-friendly structured data

### Files Created
- [x] `server/src/controllers/dashboardAIContextController.ts`

### Files Modified
- [x] `server/src/routes/dashboard.ts` (added AI context routes)
- [x] `server/src/startup/registerBuiltInModules.ts` (added dashboard module)

### Acceptance Criteria
- [x] Preferences save and load correctly (existing PUT endpoint)
- [x] AI can answer questions about dashboard (3 context providers)
- [x] Aggregated quick stats endpoint works
- [x] All lint checks pass

---

## Phase 7: Polish & Refinement

**Goal:** Premium feel with animations, templates, and edge case handling.

**Status:** ✅ COMPLETE (February 26, 2026)

### Tasks

#### 7.1 Animations & Transitions
- [x] Smooth grid layout transitions on drag/resize (cubic-bezier easing)
- [x] Widget load-in stagger animation (up to 300ms delay)
- [x] Enhanced drag feedback (scale, shadow, opacity)
- [x] Resize state visual feedback

#### 7.2 Empty Dashboard State
- [x] Beautiful gradient illustration with icon
- [x] Welcoming copy explaining dashboard purpose
- [x] Template selection grid for quick start
- [x] "Or build manually" fallback option

#### 7.3 Dashboard Templates
- [x] "Personal Productivity" — Calendar, Todo, Quick Notes, Drive, Notifications
- [x] "Business Admin" — Quick Stats, HR, Scheduling, Chat, Activity Feed
- [x] "Household" — Calendar, Drive, Chat, Quick Notes, Bookmarks
- [x] "Minimal" — Quick Stats + Calendar only
- [x] Template cards with icons, descriptions, and widget previews
- [x] "Recommended" badges based on dashboard type
- [x] One-click template application with toast feedback

#### 7.4 Fullscreen Widget Mode
- [x] Click expand button (Maximize2 icon) on any widget
- [x] Fixed fullscreen overlay with backdrop blur
- [x] Minimize button to return to normal view
- [x] Refresh button available in fullscreen
- [x] Already implemented in WidgetShell.tsx

#### 7.5 Dashboard Background/Themes
- [x] Base background and widget hover/edit indicators implemented in revitalization phases
- [x] April 2026 hardening pass: dashboard chrome and key widgets updated for dark-mode readability parity
  - `DashboardLayout.tsx`: tab border style conflict resolved; sidebar fallback contrast improved
  - `WidgetShell.tsx`: stronger dark surface/border/shadow separation
  - `DriveWidget.tsx` + `NotificationsWidget.tsx`: explicit dark text/surface variants for previously low-contrast areas
- [x] Theme parity now aligned with current app-wide light/dark/system behavior for dashboard shell and primary widgets

#### 7.6 Keyboard Shortcuts
- [x] `E` — Toggle edit mode
- [x] `Escape` — Exit edit mode or close widget picker
- [x] `A` — Open add widget picker (in edit mode only)
- [x] Input field detection to prevent accidental triggers

### Files Created
- [x] `web/src/components/dashboard/DashboardTemplates.tsx`

### Files Modified
- [x] `web/src/components/dashboard/DashboardGrid.tsx` (enhanced animations)
- [x] `web/src/app/dashboard/DashboardClient.tsx` (templates, keyboard shortcuts, empty state)

### Acceptance Criteria
- [x] Animations feel smooth and professional
- [x] Empty state guides new users with templates
- [x] Templates apply correctly with toast feedback
- [x] Fullscreen mode works (expand/minimize)
- [x] Keyboard shortcuts functional (E, Escape, A)
- [x] All lint checks pass

---

## Technical Notes

### React Grid Layout Integration

```typescript
// Example DashboardGrid usage
<DashboardGrid
  widgets={widgets}
  onLayoutChange={handleLayoutChange}
  isEditMode={isEditMode}
  onWidgetRemove={handleWidgetRemove}
>
  {(widget) => (
    <WidgetShell
      key={widget.id}
      widget={widget}
      onConfigChange={handleConfigChange}
      onRemove={() => handleWidgetRemove(widget.id)}
      isEditMode={isEditMode}
    >
      <WidgetContent widget={widget} />
    </WidgetShell>
  )}
</DashboardGrid>
```

### Widget Position Format

```typescript
// Widget.position JSON structure
interface WidgetPosition {
  x: number;      // Grid column (0-indexed)
  y: number;      // Grid row (0-indexed)
  w: number;      // Width in grid units
  h: number;      // Height in grid units
  minW?: number;  // Minimum width
  minH?: number;  // Minimum height
  maxW?: number;  // Maximum width
  maxH?: number;  // Maximum height
}
```

### Widget Config Pattern

```typescript
// Each widget type has its own config interface
interface ChatWidgetConfig {
  showUnreadOnly: boolean;
  maxConversations: number;
  refreshInterval: number;
}

interface DriveWidgetConfig {
  showRecentFiles: boolean;
  maxFilesToShow: number;
  showStorageUsage: boolean;
  sortBy: 'name' | 'date' | 'size';
}
// etc.
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| react-grid-layout learning curve | Start with basic usage, add advanced features later |
| Breaking existing widgets | Wrap in WidgetShell without modifying internal logic initially |
| Performance with many widgets | Virtualize if needed, lazy load widget content |
| Mobile responsiveness | Test responsive breakpoints early in Phase 1 |
| Backend migration for positions | Auto-assign positions on first load, don't require migration script |

---

## Success Metrics

- [ ] Dashboard loads in < 2 seconds
- [ ] Grid layout works on all screen sizes
- [ ] Widget positions persist correctly
- [ ] 0 regressions in existing widget functionality
- [ ] User can add/remove/configure widgets without friction
- [ ] Edit mode clearly distinguishes editable state

---

## Post-Completion Refinements (March 2026)

After the initial 7-phase delivery, the following refinements were made based on user feedback.

### Widget Picker
- **Add multiple** — Checkbox "Add multiple" in the picker header; when checked, the modal stays open after adding a widget so users can add several in one session. Header shows "X widgets added" when any have been added.
- **Filter already-added widgets** — Single-instance widgets (e.g. `quickstats`) are filtered out of the picker when already on the dashboard (`existingWidgetTypes`). Other widget types remain available for multiple instances.
- **Visual feedback** — Widget cards show a green "Added!" badge and green border when just added in the same session (`recentlyAdded` state).

### Dashboard Grid (Drag & Layout)
- **Library** — Uses `react-grid-layout/legacy` (Responsive + WidthProvider). External CSS imports were removed; essential react-grid-layout and react-resizable styles are inlined in the component to avoid Next.js module resolution issues.
- **Mount delay** — Component sets `mounted` to true after first paint so WidthProvider can measure the container; a loading placeholder is shown until then.
- **Layout algorithm** — `buildLayout(widgets, cols)` places widgets with saved positions first, then packs widgets without positions using `currentX`/`nextY`/`rowMaxH` to avoid overlaps.
- **Drag handle** — `draggableHandle=".widget-drag-handle"`; the entire widget header is the drag handle in edit mode (see WidgetShell).

### Widget Shell
- **Full header as drag handle** — In edit mode the header div has class `widget-drag-handle` and blue styling (`bg-blue-50/70`, `cursor-grab`). Users drag by the header bar, not a small grip.
- **"Drag header" label** — Shown in edit mode so users know where to grab.
- **Buttons don't trigger drag** — Refresh, Expand, and Remove buttons are in a wrapper with `onMouseDown` and `onTouchStart` calling `stopPropagation()` so clicks don't start a drag.

### Dashboard Header
- **Add Widget always visible** — "Add Widget" is always shown; blue solid in edit mode, blue outline when not. Users can add widgets without entering edit mode first.
- **Edit / Done** — "Done" button turns green in edit mode. Edit button tooltip: "Edit layout - drag and resize widgets".

---

## Changelog

| Date | Phase | Changes |
|------|-------|---------|
| 2026-02-26 | Planning | Initial project document created |
| 2026-02-26 | Phase 1 | Grid Layout Infrastructure COMPLETE |
| 2026-02-26 | Phase 2 | Widget Shell & Framework COMPLETE |
| 2026-02-26 | Phase 3 | Dashboard Header & Cleanup COMPLETE |
| 2026-02-26 | Phase 4 | Widget Picker COMPLETE |
| 2026-02-26 | Phase 5–7 | New Widget Types, Backend AI Context, Polish COMPLETE |
| 2026-04-06 | Theming | Dashboard dark-mode readability hardening for layout/widget surfaces and text contrast |
| 2026-03-02 | Refinements | Widget Picker multi-add & filtering; Grid drag/layout fixes; full-header drag handle; header UX |

---

## Next Steps

Project complete. Optional future enhancements:
- Additional widget types (e.g. HR, Scheduling) when backend APIs are ready
- Dashboard layout presets per context (personal vs business)
- Widget-to-widget linking or drill-down
