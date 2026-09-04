---

⚠️ **Architecture Notice**

This document is retained for historical context only. It is **not** current authority.

Archived from `memory-bank/` on 2026-09-03 (Batch 1A).

---

# Notes Module — Build Phases

**Purpose**: Single authoritative document for building the Notes module phase by phase.  
**Reference**: This is the only document to consult during implementation.  
**Workflow**: Complete each phase → run linter and fix errors → ask user: **"Proceed to next phase?"**

---

## Scope Summary

- **Dual-context module** (personal + business)
- **Personal-first** for MVP
- **Rich text notes** (title, content, tags, pinned)
- **Multi-tenant scoping** (dashboardId + businessId)
- **AI context** required (2 context providers)
- **Notification metadata** (minimal for MVP)

---

## Phase 1: Database Schema & Migration

**Goal**: Add Notes models to Prisma and run migration.

### 1.1 Create module schema file

**File**: `prisma/modules/notes/notes.prisma`

**Content** (models to add):

```prisma
// ============================================================================
// NOTES MODULE
// ============================================================================

model Note {
  id              String   @id @default(uuid())
  title           String
  content         String   // Rich text (markdown or plain for MVP)
  
  // Context & Scoping (MANDATORY - multi-tenant isolation)
  dashboardId     String
  businessId      String?  // Null = personal, set = business
  
  // Organization
  tags            String[] @default([])
  pinned          Boolean  @default(false)
  
  // Ownership
  createdById     String
  createdBy       User     @relation("NoteCreator", fields: [createdById], references: [id])
  updatedById     String?
  updatedBy       User?    @relation("NoteUpdater", fields: [updatedById], references: [id])
  
  // Soft delete
  deletedAt       DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([dashboardId, businessId])
  @@index([createdById])
  @@index([deletedAt])
  @@index([pinned])
  @@map("notes")
}
```

**Required**: Add `Note` relations to `User` model in `prisma/modules/auth/user.prisma`.

Add after the Todo Module relations block (around line 141), before Vssyl Place:

```prisma
  // Notes Module relations
  notesCreated   Note[] @relation("NoteCreator")
  notesUpdated   Note[] @relation("NoteUpdater")
```

### 1.2 Add notes to schema build script

**File**: `scripts/build-prisma-schema.js`

Add `'notes'` to the `moduleOrder` array (e.g. after `'todo'`):

```js
const moduleOrder = [
  'auth',
  'chat',
  'business',
  'ai',
  'billing',
  'calendar',
  'drive',
  'admin',
  'support',
  'hr',
  'scheduling',
  'todo',
  'notes',   // Add this
  'place'
];
```

### 1.3 Run migration

```bash
pnpm prisma:build
pnpm prisma migrate dev --name add_notes_module
pnpm prisma:generate
```

### Phase 1 Checkpoint

- [ ] `prisma/modules/notes/notes.prisma` exists
- [ ] User model has `notesCreated` and `notesUpdated` relations
- [ ] Migration applied successfully
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 1 complete. Proceed to Phase 2?"**

---

## Phase 2: Backend API — Notes Controller & Routes

**Goal**: Implement CRUD API for notes with proper auth and scoping.

### 2.1 Create notes controller

**File**: `server/src/controllers/notesController.ts`

**Functions** (match route handler names exactly):

| Function      | Method | Route              | Description                    |
|--------------|--------|--------------------|--------------------------------|
| getNotes     | GET    | /api/notes         | List notes (search, tag, pinned) |
| getNoteById  | GET    | /api/notes/:id     | Get single note                |
| createNote   | POST   | /api/notes         | Create note                    |
| updateNote   | PUT    | /api/notes/:id     | Update note                    |
| deleteNote   | DELETE | /api/notes/:id     | Soft delete note               |

**Query validation** (coding-standards compliant):

- `dashboardId` — required, `typeof === 'string'`
- `businessId` — optional, `typeof === 'string'` if present
- `search` — optional, search in title and content
- `tag` — optional, filter by tag
- `pinned` — optional, filter by pinned

**Scoping rules**:

- Personal: `where: { dashboardId, businessId: null }`
- Business: `where: { dashboardId, businessId }`
- Always verify `req.user` exists before any operation

### 2.2 Create notes routes

**File**: `server/src/routes/notes.ts`

- Use `authenticateJWT` middleware on all routes
- Mount at `/api/notes`
- Import controller with `.js` extension: `import * as notesController from '../controllers/notesController.js'`

### 2.3 Register routes in server

**File**: `server/src/index.ts`

- Add: `import notesRouter from './routes/notes';`
- Add: `app.use('/api/notes', notesRouter);`

### Phase 2 Checkpoint

- [ ] `notesController.ts` implements all 5 functions
- [ ] `notes.ts` routes wired to controller
- [ ] Server mounts `/api/notes`
- [ ] All endpoints validate `dashboardId` and scope correctly
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 2 complete. Proceed to Phase 3?"**

---

## Phase 3: AI Context Integration

**Goal**: Add AI context providers so the AI can answer questions about notes.

### 3.1 Create AI context controller

**File**: `server/src/controllers/notesAIContextController.ts`

**Context providers**:

1. **getRecentNotesContext** — `GET /api/notes/ai/context/recent`
   - Returns last 10–15 notes (title, tags, pinned, lastUpdated)
   - Query: `dashboardId`, `businessId?`
   - Response format: `{ success, context: { summary, details: { notes } }, metadata }`

2. **getPinnedNotesContext** — `GET /api/notes/ai/context/pinned`
   - Returns pinned notes
   - Same scoping and format

**Validation**: Check `req.user`, `dashboardId`, verify member access for business context.

### 3.2 Add AI context routes

**File**: `server/src/routes/notes.ts` (extend) or create `server/src/routes/notesAIContext.ts`

- Mount under `/api/notes/ai/context/*` or include in notes router

### 3.3 Register in registerBuiltInModules

**File**: `server/src/startup/registerBuiltInModules.ts`

Add to `BUILT_IN_MODULE_DEFINITIONS`:

```ts
{
  id: 'notes',
  name: 'Notes',
  description: 'Rich text notes with tags, search, and organization',
  version: '1.0.0',
  category: 'PRODUCTIVITY',
  tags: ['notes', 'journal', 'ideas', 'writing'],
  icon: 'file-text',
  pricingTier: 'free',
}
```

Add to `BUILT_IN_MODULES` with full `aiContext`:

- `keywords`: note, notes, journal, ideas, meeting notes, writing, jot down, etc.
- `patterns`: "show my notes", "what did I write about X", "pinned notes"
- `entities`: Note
- `actions`: create_note, update_note, delete_note
- `contextProviders`: recent, pinned

### Phase 3 Checkpoint

- [ ] `notesAIContextController.ts` exists with 2 providers
- [ ] Routes registered
- [ ] Module + AI context in registerBuiltInModules
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 3 complete. Proceed to Phase 4?"**

---

## Phase 4: Module Registration & Seeding

**Goal**: Notes module exists in DB, available in marketplace for installation.

### 4.1 Create seed script

**File**: `server/src/startup/seedNotesModule.ts`

- Follow `seedTodoModule.ts` pattern
- Create Module record with id `notes`
- manifest: personalContext, businessContext, routes, permissions, etc.

### 4.2 Call seed on startup

**File**: `server/src/index.ts`

- Import and call `seedNotesModuleOnStartup()` (non-blocking, same pattern as todo)

### 4.3 Update ensure-builtin-modules (optional)

**File**: `scripts/ensure-builtin-modules.ts`

- Add notes module definition if this script is used for manual seeding

### Phase 4 Checkpoint

- [ ] `seedNotesModule.ts` creates Notes module
- [ ] Server calls seed on startup
- [ ] Notes appears in marketplace / installed modules API
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 4 complete. Proceed to Phase 5?"**

---

## Phase 5: Frontend API Client & Module Shell

**Goal**: API client and basic Notes module component that loads in dashboard.

### 5.1 Create API client

**File**: `web/src/api/notes.ts`

- Use native `fetch` (no apiClient import)
- Helper: `authHeaders(token, headers?)`
- Functions: `getNotes`, `getNoteById`, `createNote`, `updateNote`, `deleteNote`
- Use relative paths (`/api/notes`) — proxy adds prefix
- Throw on missing token or non-ok response

### 5.2 Create Notes module component

**File**: `web/src/components/notes/NotesModule.tsx`

**MVP layout**:

- Left: note list (search input, tag filter, list of note titles)
- Right: selected note view/edit or empty state
- Create note button
- Use shared components: Button, Card, Input, Textarea
- Text contrast: `text-gray-700` or darker on light backgrounds

### 5.3 Add Notes page/route

**File**: `web/src/app/notes/page.tsx` or integrate via dashboard

- Personal route: `/notes` (if using app router)
- Or render `NotesModule` inside dashboard as full-module view

### 5.4 Add to sidebar / module config

- Add Notes to `DEFAULT_PERSONAL_MODULES` in `PositionAwareModuleProvider.tsx` **or** ensure it appears via `getInstalledModules` once user installs
- If Notes is a default-installed module: add to default list with path `/notes`

### Phase 5 Checkpoint

- [ ] `web/src/api/notes.ts` complete
- [ ] `NotesModule.tsx` renders list + basic editor
- [ ] Route accessible (e.g. `/notes`)
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 5 complete. Proceed to Phase 6?"**

---

## Phase 6: Widget & Dashboard Integration

**Goal**: Notes widget in Widget Picker, available on dashboards.

### 6.1 Add widget to widget registry

**File**: `web/src/components/dashboard/widgetRegistry.ts`

- Add `notes` entry: id, name, description, icon (FileText or StickyNote), category productivty, moduleId `notes`

### 6.2 Create Notes widget component

**File**: `web/src/components/widgets/NotesWidget.tsx`

- Compact view: recent notes list or quick-create
- Click to open full Notes module (or expand)
- Follow `TodoWidget`, `DriveWidget` patterns

### 6.3 Wire widget in DashboardClient

- Ensure NotesWidget is rendered when notes widget is added
- Widget picker shows Notes when notes module is installed

### Phase 6 Checkpoint

- [ ] Notes in widget registry
- [ ] NotesWidget component exists
- [ ] Widget picker shows Notes for users with Notes installed
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 6 complete. Proceed to Phase 7?"**

---

## Phase 7: Polish & Notification Metadata

**Goal**: Final polish, notification metadata, and documentation.

### 7.1 Notification metadata

**File**: `server/src/startup/registerBuiltInModules.ts` (or module manifest)

- Add `notifications` array to Notes module (can be empty for MVP or stub types like `notes_shared` for future)

### 7.2 Notification center (if new types)

**File**: `web/src/app/notifications/page.tsx`

- Add any Notes notification types to `getNormalizedType`, `getNotificationIcon`, `categories` if we add real notification types

### 7.3 Documentation updates

- Update `memory-bank/activeContext.md` with Notes module completion
- Update `memory-bank/progress.md` with Notes implementation summary
- Update `memory-bank/moduleBrainstorming.md` — mark Notes as ✅ Complete

### 7.4 Final checks

- Rich text: evaluate markdown vs plain for MVP (plain is fine; markdown can be Phase 8)
- Empty states, loading states, error handling
- Keyboard shortcuts (optional)

### Phase 7 Checkpoint

- [ ] Notification metadata added (even if minimal)
- [ ] Memory bank updated
- [ ] moduleBrainstorming Notes marked complete
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes

**→ Ask user: "Phase 7 complete. Notes module is done. Any follow-up work?"**

---

## Summary Table

| Phase | Description                    | Key Deliverables                                       |
|-------|--------------------------------|--------------------------------------------------------|
| 1     | Database Schema & Migration    | notes.prisma, migration, User relations               |
| 2     | Backend API                    | notesController.ts, notes routes, index.ts mount        |
| 3     | AI Context                     | notesAIContextController.ts, registerBuiltInModules   |
| 4     | Module Registration & Seeding| seedNotesModule.ts, startup call                       |
| 5     | Frontend API & Module Shell    | notes.ts API, NotesModule.tsx, /notes route            |
| 6     | Widget & Dashboard             | widgetRegistry, NotesWidget.tsx                        |
| 7     | Polish & Metadata              | notifications, memory bank updates                   |

---

## Coding Standards Reminders

- **Multi-tenant**: Always scope by `dashboardId` + `businessId`
- **Auth**: Check `req.user` on every endpoint
- **Query params**: Validate `typeof param === 'string'` before use
- **Controller/route names**: Must match exactly (use `.js` on imports)
- **API client**: Native fetch, authHeaders, no apiClient import
- **Components**: Import from `shared/components`; Button variants: primary | secondary | ghost
- **Text contrast**: `text-gray-700` or darker on light backgrounds

---

**Last Updated**: March 2026  
**Status**: ✅ Complete — All 7 phases implemented
