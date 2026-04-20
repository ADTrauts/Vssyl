# Notes Module — Advancements Plan

**Purpose**: Prioritized plan for enhancing the Notes module after the initial 7-phase build.  
**Reference**: Use this document when planning or implementing Notes improvements.  
**Current state**: MVP complete (March 2026) — CRUD, tags, search, pinned, AI context, widget, `/notes` page.

---

## Principles

- **One advancement phase at a time** — Complete and validate before starting the next.
- **Reuse-first** — Leverage existing patterns (Drive sharing, Todo comments, Calendar permissions) where applicable.
- **No breaking changes** — Advancements must remain backward-compatible with existing notes and APIs.

---

## Advancement 1: Rich text / Markdown (high impact, low risk) ✅ DONE

**Goal**: Support formatted content instead of plain text only.

**Status**: ✅ **Implemented** (March 2026). Content stored as plain string (markdown); no schema change.

**Scope**:
- Store content as markdown (or keep plain and render as markdown); optional migration for existing `content` to stay as-is.
- Frontend: Use a simple markdown editor (e.g. textarea with preview tab, or a small library like `react-markdown` + textarea for edit). No new backend fields required if we keep a single `content` string.
- Optional: Add a `contentFormat` field (`plain` | `markdown`) for future formats.

**Deliverables** (done):
- Edit / Preview toggle in NotesModule; Preview renders with ReactMarkdown (headings, bold, links, lists, code). Hint: Markdown: **bold** *italic* lists [links](url). No backend changes.
- Optional: Markdown in AI context (strip/summarize for context providers) — not done.

**Reference**: Build phases doc noted “markdown can be Phase 8”.

---

## Advancement 2: Folders / Notebooks (organization) ✅ DONE

**Goal**: Let users group notes into folders or “notebooks”.

**Scope**:
- Schema: Add `NoteFolder` (or `NoteNotebook`) with `id`, `dashboardId`, `businessId`, `name`, `parentId?`, `createdById`, timestamps. Add `folderId` (optional FK) to `Note`.
- API: CRUD for folders; `getNotes` accepts `folderId` (and “no folder”).
- Frontend: Sidebar or dropdown to create/rename/delete folders and to assign notes to a folder; filter list by folder.

**Deliverables**:
- Migration `add_note_folders`: NoteFolder model, folderId on Note; User relation noteFoldersCreated.
- Backend: notesFolderController (getFolders, createFolder, updateFolder, deleteFolder); routes under /api/notes/folders; getNotes/createNote/updateNote support folderId.
- Frontend: Folder dropdown (All / Unfiled / folders), New folder button, folder select in editor; new notes get current folder.
- AI context: Optional “notes-by-folder (optional, not done)” or folder names in recent/pinned context.

---

## Advancement 3: Sharing & notifications (personal → business / collaborator) ✅ DONE

**Goal**: Implement the stub `notes_shared` notification and allow sharing a note with another user (or team in business context).

**Scope**:
- Schema: `NoteShare` (or `NotePermission`): `noteId`, `sharedWithUserId` (or `sharedWithRole` for business), `role` (viewer | editor), timestamps.
- API: Share note (create/update/revoke); list “shared with me”; enforce viewer/editor in get/update/delete.
- Notifications: On share, create notification type `notes_shared`; recipient sees it in notification center.
- Frontend: “Share” button on note; modal to add user (and later role); “Shared with me” filter or section.

**Deliverables** (done):
- Migration add_note_shares; NoteShare model; share endpoints (shareNote, revokeShare, getNoteShares); getNotes sharedWithMe; getNoteById/updateNote by share role; notes_shared notification; Share modal and Shared with me filter in NotesModule.

**Reference**: Manifest already has `notes_shared` in `notifications` array.

---

## Advancement 4: Business workspace integration (route + context) ✅ DONE

**Goal**: Notes available and discoverable in business workspace, not only personal.

**Status**: ✅ **Implemented** (March 2026).

**Scope**:
- Route: Ensure `/business/[id]/workspace/notes` (or equivalent) exists and renders NotesModule with `dashboardId` + `businessId` from workspace context.
- Sidebar: Notes entry in business workspace sidebar when Notes module is installed for that business.
- Scoping: All existing APIs already support `businessId`; ensure workspace passes `businessId` and correct `dashboardId` (business dashboard).

**Deliverables** (done):
- `BusinessWorkspaceContent`: added `case 'notes'` rendering `NotesModule` with `dashboardId={businessDashboardId}` and `businessId={business.id}`.
- Route `/business/[id]/workspace/notes`: new page that redirects to `?module=notes`.
- Sidebar: `MODULE_ICONS.notes = FileText` in `DashboardLayoutWrapper`; Notes appears when the business has the module installed (from `getFilteredModules()`).
- Page (or dynamic module route) under business workspace for Notes — done.
- Sidebar/module list shows Notes when installed for business — done.
- Optional: “Business notes” vs “Personal notes” toggle or separate sections in NotesModule when both contexts are relevant.

**Reference**: Seed manifest already has `businessUrl: '/business/[id]/workspace/notes'`.

---

## Advancement 5: Templates (meeting notes, daily, etc.) ✅ DONE

**Goal**: Quick start from templates (e.g. “Meeting notes”, “Daily standup”, “Project brief”).

**Scope**:
- Schema: Optional `NoteTemplate` (name, content, optional folderId) — or start with frontend-only templates (hardcoded or config JSON).
- Backend: If DB-backed: CRUD for templates, scoped by dashboard/business; endpoint e.g. `GET /api/notes/templates`, `POST /api/notes/from-template/:templateId`.
- Frontend: “New from template” in NotesModule; template picker modal; create note with template content (and optional title).

**Deliverables**:
- Either: (A) Frontend-only template list and “New from template” that pre-fills title/content, or (B) Template model + API + same UX.
- AI context: Optional “available templates” in context for AI suggestions.

---

## Advancement 6: Version history / undo (optional)

**Goal**: View or restore previous versions of a note.

**Scope**:
- Schema: `NoteRevision` (noteId, content, title?, updatedAt, updatedById); optional limit (e.g. last 30 revisions).
- API: `GET /api/notes/:id/revisions`, `POST /api/notes/:id/restore/:revisionId` (or copy content into current note).
- Frontend: “History” or “Versions” in note detail; list revisions; “Restore” action.

**Deliverables**:
- Migration, revision creation on update (in notes controller or service).
- Revisions + restore endpoints; UI for history and restore.

---

## Advancement 7: Export / backup (optional)

**Goal**: Export notes (single or all) as Markdown or PDF.

**Scope**:
- Backend: `GET /api/notes/export?format=md|pdf&noteId=...` or `...&folderId=...` (or all for dashboard).
- Frontend: “Export” in note menu or module settings; “Export all” for current scope.

**Deliverables**:
- Export endpoint(s); optional server-side PDF (e.g. library) or client-side export.
- UI entry points for export.

---

## Suggested order (priority)

| Order | Advancement              | Rationale                                      |
|-------|---------------------------|------------------------------------------------|
| 1     | Rich text / Markdown ✅  | Done: Edit/Preview toggle, ReactMarkdown render      |
| 2     | Business workspace route  | Small change; unblocks business users          |
| 3     | Folders / Notebooks      | Improves organization as note count grows      |
| 4     | Sharing + notifications  | Uses existing stub; differentiator             |
| 5     | Templates                 | Improves daily use without heavy backend       |
| 6     | Version history           | Nice to have; more implementation cost         |
| 7     | Export / backup           | Nice to have; can be client-only initially     |

---

## Out of scope (for later or separate docs)

- Real-time collaboration (multiplayer editing).
- Note-to-note linking (wiki-style).
- Full-text search backend (e.g. dedicated search index); current search is sufficient for MVP.
- Mobile-specific UI (responsive MVP already in place).

---

## How to use this plan

1. Pick one advancement (e.g. “Advancement 1: Rich text”).
2. Break it into implementation steps and, if useful, add a short “Advancement 1” section to `NOTES_MODULE_BUILD_PHASES.md` or a separate `NOTES_MODULE_ADVANCEMENT_1.md`.
3. Implement phase by phase; run linter/type-check; then ask: **“Advancement N complete. Proceed to next?”**
4. Update this plan (e.g. mark advancement complete, adjust order) as you go.

---

**Last Updated**: March 2026  
**Status**: Advancement 1 (Markdown) implemented; remaining advancements planned
