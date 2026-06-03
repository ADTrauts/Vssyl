# Notebook Workspace Architecture

**Phase:** 0.5 — Product definition + workspace architecture  
**Date:** 2026-06-01  
**Status:** Definitive product architecture (pre-implementation)  
**Mode:** Design only — no code, schema, routes, or services  

**Parent initiative:** [NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md](./NOTEBOOK_PRODUCT_ARCHITECTURE_REVIEW.md)  
**Companion specs:** [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md), [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md), [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md), [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md), [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md), [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md)

**Platform constraints:** Todo remains Reference Module #4 — task mutations stay in `todo*` services. Notes domain unchanged until governed Notebook phases.

---

## 1. What is a Notebook Page?

### 1.1 Definition

A **Notebook Page** is the primary **durable work artifact** in the Notebook product: a tenant-scoped document that combines **narrative context** (what happened, what we know, what we decided) with **optional structured work** (checklists, linked tasks, linked files and events). It is the unit users open, share, search, and anchor cross-module work around.

**Implementation mapping (Phase 1–2):** A Page is backed by the existing `Note` row (`notes` table). Product language says **Page**; API may remain `/api/notes` until alias migration.

### 1.2 Purpose

| Purpose | Description |
|---------|-------------|
| **Capture** | Record meetings, rounds, handoffs, project context, SOPs |
| **Coordinate** | Hold action items and links to tasks without replacing Todo |
| **Reference** | Act as the “why” behind tasks, files, and calendar events |
| **Share knowledge** | Distribute SOPs, training, survey prep across a facility or department |

A Page is **not** a chat thread, calendar event, file, map node, or analytics dashboard. It **references** those artifacts.

### 1.3 What a Page is (and is not)

| A Page **is** | A Page **is not** |
|---------------|-------------------|
| Project hub (brief + linked work) | A Gantt chart or full PM suite (Todo/projects own structure) |
| Meeting hub (agenda + notes + actions) | The calendar event itself (Calendar owns time) |
| Operational workspace (daily/shift checklist + narrative) | A scheduling grid (Scheduling module) |
| Knowledge article (SOP, training) | A file binary (File Hub owns bytes) |
| **All of the above** — via **page type** metadata and templates, not separate products |

**Product stance:** Page type selects **default template, sidebar panels, and AI prompts** — not separate databases per type.

### 1.4 Ownership

| Role | Rule |
|------|------|
| **Creator** | `createdById` — full edit/trash/share (subject to PE) |
| **Collaborators** | `NoteShare` — viewer or editor on **page content** (Notes domain ACL) |
| **Task assignees** | Todo domain — assignment does **not** grant page edit |
| **Business context** | `businessId` set → page visible within business dashboard scope |
| **Personal context** | `businessId` null → personal dashboard only |

**Principle:** Page ownership (document) and task ownership (work item) stay **decoupled**.

### 1.5 Lifecycle

```
Draft → Active → (Pinned) → Trashed → Permanent delete
         ↑           │
         └─ Shared ──┘ (share does not change lifecycle state)
```

| State | Behavior |
|-------|----------|
| **Draft** | Created, minimal content; optional Phase 2 flag |
| **Active** | Default; listed in Recent/My Pages |
| **Pinned** | `pinned: true` — surfaces in Favorites/Home |
| **Trashed** | `trashedAt` set — Global Trash (Notes handler deferred to Notebook track) |
| **Deleted** | Permanent remove after trash retention policy |

**Version history** is out of Phase 1 scope; activity feed records create/update/delete.

### 1.6 Visibility

| Layer | Mechanism |
|-------|-----------|
| **Tenant** | `dashboardId` + `businessId` / personal null |
| **Document ACL** | `NoteShare` — explicit users |
| **Policy Engine** | `evaluateModuleMutationPolicyDual` on note mutations today; read visibility service future |
| **Linked assets** | Opening a linked file/event/task re-checks **that module’s** visibility (Todo/File Hub/Calendar) |

**Rule:** Seeing a Page does **not** imply seeing all linked entities; embeds show “no access” stubs.

### 1.7 Tenant model

| Context | `dashboardId` | `businessId` | Typical use |
|---------|---------------|--------------|-------------|
| Personal | User personal dashboard | `null` | Individual journaling, personal errands |
| Business | Business workspace dashboard | Business id | Department ops, leadership meetings, projects |
| Household | Personal/household dashboard | `householdId` (tasks only today) | Family coordination — pages personal until household notes scope defined |

Notebook **container** is virtual: one Notebook per active dashboard context (personal or business). No separate `Notebook` table in Phase 1.

### 1.8 Personal workspace behavior

- Route: `/notebook` (target) — composes pages + personal tasks
- Sidebar: Home, Recent, My Pages, Templates, Shared With Me
- Tasks: Filter “due soon / my tasks” from Todo API (personal scope)
- AI: Recent/pinned pages + personal task context (facade providers)
- No org-chart assignment on personal tasks unless user invites collaborators on a shared page

### 1.9 Business workspace behavior

- Route: `/business/[id]/workspace/notebook`
- `NotebookWorkspaceLanding` → hub with department-relevant **views** (Meetings, Projects — filtered lists, not separate apps)
- Pages scoped to `businessId`; share within business members
- Tasks: Business Todo views embedded (list/board) — **no Todo controller changes**
- Permissions: Business module install + `notes:*` / `todo:*` / future `notebook:*`
- Activity: Emits with business scope for facility audit trails (Phase 2 facade metadata)

---

## 2. Core user workflows

Detailed step tables; relationship and AI details in companion docs.

### 2.1 Meeting notes

**Actors:** Meeting lead, attendees, optional AI Twin.

| Step | User action | System behavior | Owning module |
|------|-------------|-----------------|---------------|
| 1 | Open Calendar event | Event detail drawer | Calendar |
| 2 | “Open meeting page” / create from event | Create Page (Meeting type) + link event | Notebook UI → Notes API; link Phase 2 |
| 3 | Take notes during meeting | Edit Page content (markdown/sections) | Notes |
| 4 | “Summarize” | AI recap on page body | Notebook AI (read Page) |
| 5 | “Extract tasks” | Parse action items → create Tasks | Notebook AI → **Todo AI/task service** |
| 6 | Assign owners / due dates | Task assign UI | **Todo only** |
| 7 | Attach agenda PDF | Link file on page | Notebook link → File Hub visibility check |
| 8 | Share page with team | NoteShare editors/viewers | Notes |

**Phase 1 shortcut:** Template “Meeting notes”; manual task create in embedded Todo panel; calendar/file links as deep links (new tab). Phase 2: inline embeds + `NotebookLink` rows.

### 2.2 Project workspace

| Step | User action | System behavior | Owning module |
|------|-------------|-----------------|---------------|
| 1 | Create Project Page | Template “Project brief” | Notebook |
| 2 | Write scope, goals | Page content | Notes |
| 3 | Link files (specs, drawings) | File embeds / links | File Hub + Notebook link |
| 4 | Link tasks (existing project) | Filter tasks by `projectId` in sidebar | Todo |
| 5 | Link milestone events | Event embeds | Calendar + link |
| 6 | Review activity | Unified feed slice (page updates + linked task events) | Activity facade Phase 2 |

**Page role:** Narrative **hub**; Todo **owns** task state and project entity.

### 2.3 Daily operations

| Step | User action | System behavior | Owning module |
|------|-------------|-----------------|---------------|
| 1 | Open Daily Page (template) | Checklist section in markdown or blocks | Notebook |
| 2 | Check off items | Local checklist state OR linked subtasks | UI / Todo if promoted |
| 3 | “Promote to task” | Create Task with title, optional due, link to page | **Todo create API** |
| 4 | Track completion | Task status DONE | Todo |
| 5 | Next day | Duplicate template or rolling daily page | Notebook |

**Rule:** Ephemeral checklist lines stay on Page until promoted; **committed work** lives in Todo.

### 2.4 Knowledge management

| Step | User action | System behavior | Owning module |
|------|-------------|-----------------|---------------|
| 1 | Create SOP Page | Template + tags (`sop`, `dietary`, etc.) | Notebook |
| 2 | Link policy PDFs | File links | File Hub |
| 3 | Share read-only with department | NoteShare viewer | Notes |
| 4 | AI “find our tray line SOP” | Search pages + files (federated Phase 3) | Notebook + Drive AI context |
| 5 | Training assignment (future) | HR onboarding link — reference only | HR |

**Page role:** Canonical **readable** procedure; files remain source documents in Drive.

---

## 3. Navigation model (summary)

Full spec: [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md).

**Recommended sidebar (business + personal):**

```
Notebook
├── Home
├── Recent
├── Favorites (pinned)
├── My Pages
├── Meetings          ← filtered view (pageType=meeting)
├── Projects          ← filtered view + linked Todo projects
├── Templates
├── Tasks             ← embedded Todo view (not duplicate module)
├── Shared With Me
└── Trash
```

**Phase 1 MLVP:** Home, Recent, Favorites, My Pages, Templates, Shared With Me, Trash + **Tasks** panel (embed). Meetings/Projects filters as **views** over same Page list.

---

## 4. Page types (summary)

Full spec: [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md).

**First-class in Phase 1:** `general`, `meeting`, `project`, `daily`  
**Phase 2:** `sop`  
**Metadata-only Phase 1:** `pageType` string on Note (JSON metadata column or tags convention until migration)

---

## 5. Relationship model (summary)

Full spec: [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md).

**Split ownership:**

| Link class | Owner | Purpose |
|------------|-------|---------|
| **V_Link** | Platform | User-approved entity relationships for AI/context/navigation; membership ≠ content |
| **NotebookLink** | Notebook product | Operational edges: page↔task↔file↔event↔conversation↔place for **work execution** |

Todo retains `TaskFileLink` / `TaskEventLink`; NotebookLink **indexes** page-centric view without replacing Todo links.

---

## 6. AI strategy (summary)

Full spec: [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md).

Notebook AI = **orchestration** over page content; Todo AI = **task mutations**; Calendar/File Hub AI unchanged.

---

## 7. Future-proofing

### 7.1 Evolution paths

| Vision | Feasible if… | Constraint |
|--------|--------------|------------|
| **Notion-style workspace** | Sections/blocks schema; Page as root | Tasks stay in Todo tables |
| **Operational command center** | Home dashboard + filters + linked tasks | Not a replacement for Scheduling/HR |
| **Project management hub** | Project Pages + Todo projects/Gantt | PM depth stays Todo Reference #4 |
| **Knowledge management** | SOP types, search, share | Files stay File Hub; not a CMS duplicate |

### 7.2 Reference module preservation

| Module | Must remain authoritative for |
|--------|------------------------------|
| File Hub #1 | Files, folders, storage, file trash, file V_Link |
| Chat #2 | Messages, conversations, realtime chat |
| Calendar #3 | Events, recurrence, reminders, availability |
| Todo #4 | Tasks, assign, status, projects, task trash, task AI writes |

**Notebook may not:** inline Prisma task writes, re-register task trash handlers, merge `Task` into `Note`, or claim `todo:task` entity ownership.

### 7.3 Extension points

- `pageType` + templates (product)
- `NotebookLink` table (Phase 2)
- Section blocks JSON (Phase 3)
- Federated search index (Phase 3)
- `moduleId: 'notebook'` activity facade (Phase 2)

---

## 8. Notebook vs Place (summary)

| Dimension | Notebook | Place |
|-----------|----------|-------|
| **Metaphor** | Internal work surface (pages + tasks) | External “Main Street” (businesses, discovery, transactions) |
| **Primary user** | Staff doing operations inside a facility | Consumer/creator curating local business graph |
| **Data** | `Note` / Page, links to work artifacts | `BusinessPlaceListing`, graph nodes, meetings in **public/social** sense |
| **Overlap risk** | “Meeting” in both | **Disambiguate:** Calendar event + Notebook Page = **internal ops**; Place Meeting = **coordination/social** with location |

**Boundary rule:**

- **Notebook:** Inside the building — handoffs, SOPs, leadership notes, unit action plans, survey prep.
- **Place:** Outside/market — vendor relationships, local suppliers, community graph (e.g. dietary vendor on Main Street).

**Link:** Page may `place_embed` a vendor listing for “Kitchen renovation — supplier X” — deep link only Phase 1.

Full healthcare examples: [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md).

---

## 9. Minimum lovable product (Phase 1 recommendation)

See [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md).

**MLVP one sentence:** One **Notebook** hub where staff open **meeting and daily pages**, see **due tasks beside their notes**, and **promote checklist lines to real tasks** — without new backend domains.

| In MLVP | Out of MLVP |
|---------|-------------|
| `notebook` workspace route + landing | `notebookLinkService` |
| Compose `NotesModule` + Todo list panel | Section block schema |
| Page types via metadata + 4 templates | Global Trash handler (targeted Notes hygiene Phase 1.5) |
| Promote-to-task → existing Todo API | AI extract tasks (Phase 2) |
| Home / Recent / Favorites / Shared | Federated search |
| Business + personal contexts | Deprecate `notes` sidebar entry |

---

## Document index (Phase 0.5)

| # | Topic | Document |
|---|-------|----------|
| 1 | Page definition | This doc §1 |
| 2 | Workflows | This doc §2 |
| 3 | Navigation | [NOTEBOOK_NAVIGATION_MODEL.md](./NOTEBOOK_NAVIGATION_MODEL.md) |
| 4 | Page types | [NOTEBOOK_PAGE_TYPES.md](./NOTEBOOK_PAGE_TYPES.md) |
| 5 | Relationships | [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) |
| 6 | AI | [NOTEBOOK_AI_STRATEGY.md](./NOTEBOOK_AI_STRATEGY.md) |
| 7 | Future-proofing | This doc §7 |
| 8 | Healthcare | [NOTEBOOK_HEALTHCARE_USE_CASES.md](./NOTEBOOK_HEALTHCARE_USE_CASES.md) |
| 9 | Place boundary | This doc §8 |
| 10 | Readiness | [NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md](./NOTEBOOK_IMPLEMENTATION_READINESS_REVIEW.md) |

---

*Last updated: 2026-06-01 — Phase 0.5 complete; implementation requires separate ACT approval.*
