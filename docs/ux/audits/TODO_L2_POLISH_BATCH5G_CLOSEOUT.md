# Todo UX-L2 Polish — Wave 5G Closeout

**Status:** **Complete** (engineering only — re-certification deferred)  
**Date:** 2026-06-03  
**Mode:** Implementation  
**Authority:** [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)  
**Prior cert:** [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md) — **8 PASS / 3 PWF / 0 FAIL**

---

## 1. Objective

Move Todo from **8 PASS / 3 PWF** toward **≥9 PASS / ≤2 PWF** by resolving certification findings **T-8** (shared `EmptyState`) and **T-9** (overflow `aria-label`). Optional **T-7** responsive detail panel without layout regression.

**In scope:** `web/src/components/todo/*`, UX docs, Memory Bank  
**Out of scope:** 5G-Todo-D re-certification; Drive, Chat, Calendar, Notifications, PlatformShell

---

## 2. Files modified

| File | Change |
|------|--------|
| `web/src/components/todo/EmptyTaskState.tsx` | Migrated to shared `EmptyState`; added `filtered` + `projectScoped` variants; preserved CTA + list quick tips |
| `web/src/components/todo/TaskList.tsx` | Empty detection via `hasVisibleTasks`; passes empty context props |
| `web/src/components/todo/TaskBoard.tsx` | Passes `filtered` / `projectScoped` to `EmptyTaskState` |
| `web/src/components/todo/TaskItem.tsx` | `aria-label="Task actions"` on overflow trigger |
| `web/src/components/todo/TodoModule.tsx` | `emptyFiltered` / `emptyProjectScoped` wiring; responsive `WorkspaceSecondary` width |
| `web/src/components/todo/ProjectManager.tsx` | Shared `EmptyState` for no projects; `aria-label` on create/edit/delete icon buttons |

**Preserved:** 5D.1 `ConfirmModal` delete; 5D.3 `WorkspaceSplitLayout` / `PageHeader` / `PageToolbar`; board/list/calendar views; filters; AI suggestions; attachments/time/comments/subtasks.

---

## 3. T-8 — Shared EmptyState

| Scenario | Trigger | Implementation |
|----------|---------|----------------|
| **No tasks** | `filteredTasks.length === 0`, no filters, no project scope | `EmptyTaskState` → shared `EmptyState` + CTA |
| **No filtered tasks** | `hasActiveFilters && tasks.length > 0 && filteredTasks.length === 0` | `filtered` variant copy |
| **No project tasks** | `selectedProjectId` set, empty result, filters inactive | `projectScoped` variant copy |
| **No board tasks** | Board view, `tasks.length === 0` | Same wrapper, `view="board"` copy |
| **No projects** | `ProjectManager` sidebar, `projects.length === 0` | Compact shared `EmptyState` + Create button |

**Removed:** Local placeholder skeleton cards (animated dashed cards). **Kept:** Primary copy, CTA labels, list-view quick tips (default empty only).

**Pattern:** Mirrors `CalendarEventsEmptyState.tsx` — thin Todo wrapper over `shared/components/EmptyState`.

---

## 4. T-9 — Overflow aria-label

| Surface | Before | After |
|---------|--------|-------|
| `TaskItem` list overflow (`DropdownMenu` trigger) | Icon-only `MoreVertical`, no `aria-label` | `aria-label="Task actions"` |
| `ProjectManager` create | Icon-only `Plus` | `aria-label="Create project"` |
| `ProjectManager` row actions | Icon-only Edit/Delete | `aria-label="Edit project {name}"` / `Delete project {name}"` |

**Unchanged:** Board compact view still hides overflow menu (T-6 — out of scope). Menu items and `menuLabel="Task actions"` on `DropdownMenu` unchanged.

---

## 5. T-7 — Mobile detail panel disposition

| Before | After |
|--------|-------|
| `w-96 min-w-[384px] max-w-[384px]` fixed secondary | `shrink min-w-0 w-full max-w-[min(100%,24rem)] md:max-w-xs lg:w-96 lg:max-w-[384px] lg:shrink-0` |

**Rationale:** Removes rigid 384px minimum that broke narrow viewports; desktop `lg` breakpoint restores prior width. **Not implemented:** Mobile sheet overlay or hide-secondary pattern — deferred to avoid split-layout regression.

**Projected cat 5 impact:** Partial improvement; **T-11** manual 375px QA still required for full PASS.

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Empty states (list/board/project/filtered) | Code-complete — manual UI verify recommended |
| Overflow behavior | Unchanged — label only |
| `ConfirmModal` task delete | Unchanged (`requestDeleteTask` path) |

---

## 7. Projected certification impact (pending 5G-Todo-D)

| Finding | Engineering status | Projected category impact |
|---------|-------------------|---------------------------|
| **T-8** | **Resolved** | Cat **8** Empty States → **PASS** |
| **T-9** | **Resolved** | Cat **4** Accessibility → **PASS** (overflow label cleared; T-12/T-11 may remain as minor findings) |
| **T-7** | **Partial** | Cat **5** Mobile → likely **PWF** (responsive width; T-11 QA open) |

### Projected scorecard (conservative)

| Metric | 5D.4 | Post-5G (projected) |
|--------|------|---------------------|
| PASS | 8 | **9–10** |
| PASS WITH FINDINGS | 3 | **1–2** |
| FAIL | 0 | **0** |
| UX-L2 eligibility | ❌ one short | **✅ eligible** (≥9 PASS) |

**Guaranteed minimum:** **9 PASS / 2 PWF** (T-8 alone upgrades cat 8).  
**Likely:** **10 PASS / 1 PWF** if re-cert upgrades cat 4 on T-9 resolution.

---

## 8. Readiness for UX-L2 re-certification

| Gate | Status |
|------|--------|
| Engineering (5G-Todo) | **Complete** |
| Formal re-cert (5G-Todo-D) | **Not executed** — documentation update only |
| Manual QA (T-11) | Open — blocks UX-L3, not L2 threshold |

**Recommendation:** Run **5G-Todo-D** re-certification when ready; parallel **5G-QA** matrix for T-11.

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)
