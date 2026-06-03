# Notebook Navigation Model

**Phase:** 0.5  
**Parent:** [NOTEBOOK_WORKSPACE_ARCHITECTURE.md](./NOTEBOOK_WORKSPACE_ARCHITECTURE.md)  
**Date:** 2026-06-01

---

## Information architecture goals

1. **One front door** — Notebook replaces separate Notes + Todo sidebar entries (Phase 1+).
2. **Tasks stay first-class** — Tasks appear inside Notebook, not hidden behind pages only.
3. **Views over apps** — Meetings/Projects are filters, not new modules.
4. **Context preservation** — Personal vs business sidebars share structure; data scope differs.

---

## Recommended sidebar

```
Notebook
├── Home
├── Recent
├── Favorites
├── My Pages
├── Meetings
├── Projects
├── Daily
├── Templates
├── Tasks
├── Shared With Me
└── Trash
```

### Item definitions

| Nav item | What it shows | Data source | Phase |
|----------|---------------|-------------|-------|
| **Home** | Pinned pages, due tasks (7d), recent meetings, quick actions | Notes + Todo APIs | 1 |
| **Recent** | Pages by `updatedAt` | `GET /api/notes` | 1 |
| **Favorites** | `pinned: true` | `GET /api/notes?pinned=true` | 1 |
| **My Pages** | Created by me; folder tree | Notes + folders | 1 |
| **Meetings** | `pageType=meeting` or tag | Filtered list | 1 |
| **Projects** | `pageType=project` | Filtered list + project task counts Phase 2 | 1.1 |
| **Daily** | `pageType=daily` or tag `daily` | Filtered by date | 1 |
| **Templates** | Static gallery → create page | UI constants → Notes create | 1 |
| **Tasks** | Embedded Todo (list) | `GET /api/todo` | 1 |
| **Shared With Me** | `sharedWithMe=true` | Notes API | 1 |
| **Trash** | Trashed pages | Notes + Global Trash Phase 1.5 | 1 / 1.5 |

---

## Layout regions (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ Global header (Business | Personal | Place | …)              │
├──────────┬──────────────────────────────┬───────────────────┤
│ Notebook │ Main canvas                   │ Context rail      │
│ sidebar  │ (Page editor OR list view)    │ (optional)        │
│          │                               │ • Linked tasks    │
│          │                               │ • Due this week   │
│          │                               │ • Files / event   │
└──────────┴──────────────────────────────┴───────────────────┘
```

| Region | Phase 1 | Phase 2 |
|--------|---------|---------|
| Sidebar | Full nav (subset above) | + folder tree drag |
| Main | List **or** editor (NotesModule pattern) | + section blocks |
| Context rail | Collapsed; “Open tasks” button → Tasks nav | Linked entities inline |

---

## Mobile navigation

**Bottom bar (Notebook scope):**

| Tab | Content |
|-----|---------|
| **Home** | Same as desktop Home |
| **Pages** | Recent + search |
| **Tasks** | Todo mobile list |
| **New** | Sheet: New page / New task / From template |

**Page editor:** Full screen; context rail as bottom sheet (“Tasks on this page”).

---

## Routing map (target)

| Route | Surface |
|-------|---------|
| `/notebook` | Personal Notebook home |
| `/notebook/page/[id]` | Page editor |
| `/notebook/tasks` | Full-page Todo embed (optional) |
| `/business/[id]/workspace/notebook` | Business Notebook landing |
| `/business/[id]/workspace/notebook/page/[id]` | Business page editor |

**Legacy (retained):** `/notes`, `/api/notes` — redirect or deep link alias Phase 1.

---

## Business workspace integration

Per `module-development.mdc`:

1. `NotebookWorkspaceLanding.tsx` — hub cards: Recent meetings, Open projects, My daily, Tasks due.
2. `BusinessWorkspaceContent.tsx` — `case 'notebook':` (replaces separate `notes` + optional todo case over time).
3. `BrandedWorkDashboard` — `getModuleIcon('notebook')`, `getModuleName('notebook')`.

**Phase 1:** Add `notebook` case; keep `notes`/`todo` routes working for bookmarks.

---

## Header / breadcrumb

```
Business Name › Notebook › Meetings › Q2 Dietary Leadership — Mar 4
```

Clicking **Meetings** returns to filtered list, not a different module.

---

## Search entry

| Phase | Behavior |
|-------|----------|
| 1 | Module search box → `GET /api/notes?search=` |
| 2 | + task title search in Tasks view |
| 3 | Platform unified search facet `notebook` |

Search box lives in **My Pages** and **Home**, not global header (until platform search).

---

## Widget (dashboard)

**`notebook` widget** (replaces `notes` widget over time):

| Row | Content |
|-----|---------|
| 1 | Last edited page title + link |
| 2 | Tasks due today (count + top 3) |
| 3 | Quick “New meeting page” |

---

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Tasks only inside each page | Hides operational inbox; Todo cert expects task surfaces |
| Meetings as Calendar sub-app | Fractures “notes + actions” workflow |
| Projects as Todo-only | Loses narrative brief on Page |
| Flat list only (no Home) | Poor discoverability for healthcare shift workers |

---

## Phase 1 nav MVP (minimum)

Ship: **Home, Recent, Favorites, My Pages, Templates, Tasks, Shared With Me, Trash**  
Defer dedicated sidebar rows: **Meetings, Projects, Daily** → use Home cards + tags until 1.1.

---

*See [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md) for MLVP scope.*
