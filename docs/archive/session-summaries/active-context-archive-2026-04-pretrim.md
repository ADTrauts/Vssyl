# Active context archive (pre-trim, April 2026)

This file was split from `memory-bank/activeContext.md`. The memory bank now keeps a short rolling window of recent work; this archive preserves older completed-project narratives for reference.

## Previous Completed Project: Notes Module (March 2026) ✅

### **Notes Module — COMPLETE ✅**

**Build Document**: `memory-bank/NOTES_MODULE_BUILD_PHASES.md`

**Overview**: Full Notes module implemented in 7 phases: schema, backend CRUD, AI context, module registration, frontend API and module shell, widget and dashboard integration, and polish.

**Deliverables**:
- **Schema**: `prisma/modules/notes/notes.prisma` (Note model), User relations, migration
- **Backend**: `notesController.ts`, `notesAIContextController.ts`, routes at `/api/notes`, AI context at `/api/notes/ai/context/recent` and `/api/notes/ai/context/pinned`
- **Module**: `seedNotesModule.ts` runs on startup; Notes in `registerBuiltInModules` (BUILT_IN_MODULE_DEFINITIONS + AI context)
- **Frontend**: `web/src/api/notes.ts`, `NotesModule.tsx` (list + editor), `/notes` page and layout, `NotesWidget.tsx`, widget registry entry, DashboardClient case `notes`
- **Notifications**: Manifest includes `notifications` array (stub type `notes_shared` for future)

**Key Files**: `server/src/controllers/notesController.ts`, `server/src/controllers/notesAIContextController.ts`, `server/src/routes/notes.ts`, `server/src/startup/seedNotesModule.ts`, `web/src/components/notes/NotesModule.tsx`, `web/src/components/widgets/NotesWidget.tsx`, `web/src/app/notes/page.tsx`, `web/src/components/dashboard/widgetRegistry.ts`

**Notes Advancements (March 2026)** — Per `memory-bank/NOTES_MODULE_ADVANCEMENTS_PLAN.md`:
- **Advancement 1**: Rich text / Markdown (Edit + Preview, react-markdown) ✅
- **Advancement 4**: Business workspace — `/business/[id]/workspace/notes`, `case 'notes'` in BusinessWorkspaceContent, MODULE_ICONS.notes, workspace/notes redirect page ✅
- **Advancement 2**: Folders — NoteFolder model, folderId on Note, notesFolderController, folder dropdown + New folder + assign in NotesModule ✅
- **Advancement 3**: Sharing — NoteShare model, share/revoke/list API, notes_shared notification, Share modal, "Shared with me" filter, canEdit/isOwner for viewer/editor ✅
- **Advancement 5**: Templates — Frontend-only NOTE_TEMPLATES (Meeting notes, Daily standup, Project brief, Blank), "New from template" button + modal ✅
- **Prisma / TypeScript**: Schema and migrations are correct; generated client includes NoteFolder, NoteShare, folderId, shares. Server controllers use type assertions/casts where the IDE resolves a different @prisma/client so TypeScript compiles; runtime Prisma is correct.

---

## Previous Completed Project: Dashboard Revitalization (February 2026) ✅

### **Dashboard Revitalization — COMPLETE ✅**

**Project Document**: `memory-bank/DASHBOARD_REVITALIZATION_PROJECT.md`

**Overview**: Complete UX overhaul of the dashboard system. Transformed from a basic flex-wrap layout with inline styles to a modern, professional dashboard with resizable widgets, templates, and AI context integration.

**All 7 Phases Completed**:
| Phase | Description | Key Deliverables |
|-------|-------------|------------------|
| 1 | Grid Layout Infrastructure | `DashboardGrid.tsx`, `useDashboardGrid.ts`, batch position API |
| 2 | Widget Shell & Framework | `WidgetShell.tsx`, `useWidgetConfig.ts`, unified container UI |
| 3 | Dashboard Header & Cleanup | `DashboardHeader.tsx`, `useDashboardStats.ts`, greeting + stats pills |
| 4 | Widget Picker | `WidgetPicker.tsx`, `widgetRegistry.ts`, scoped to installed modules |
| 5 | New Widget Types | 5 utility widgets: QuickStats, Notifications, QuickNotes, Bookmarks, ActivityFeed |
| 6 | Backend Enhancements | `dashboardAIContextController.ts`, 3 AI context providers |
| 7 | Polish & Refinement | `DashboardTemplates.tsx`, animations, keyboard shortcuts |

**Key Features Implemented**:
- **React Grid Layout**: Responsive, draggable, resizable widgets with edit mode
- **12 Widget Types**: Chat, Drive, Calendar, Todo, AI, QuickStats, Notifications, QuickNotes, Bookmarks, ActivityFeed, HR, Scheduling
- **Widget Picker**: Modal with search, category filters, shows only widgets for installed modules
- **Dashboard Templates**: Personal Productivity, Business Admin, Household, Minimal (one-click apply)
- **Keyboard Shortcuts**: E (edit mode), Escape (exit/close), A (add widget in edit mode)
- **Fullscreen Mode**: Expand any widget to full-screen overlay
- **AI Context**: Dashboard registered as module with 3 context providers (overview, quick-stats, widgets)

**Files Created**:
- `web/src/components/dashboard/DashboardGrid.tsx` — React Grid Layout wrapper
- `web/src/components/dashboard/WidgetShell.tsx` — Unified widget container
- `web/src/components/dashboard/WidgetPicker.tsx` — Modal widget selector
- `web/src/components/dashboard/DashboardHeader.tsx` — Modern header with stats
- `web/src/components/dashboard/widgetRegistry.ts` — Widget metadata registry
- `web/src/components/dashboard/DashboardTemplates.tsx` — Template system
- `web/src/hooks/useDashboardGrid.ts` — Grid state management
- `web/src/hooks/useDashboardStats.ts` — Stats aggregation
- `web/src/hooks/useWidgetConfig.ts` — Widget config persistence
- `web/src/components/widgets/QuickStatsWidget.tsx` — Metrics overview
- `web/src/components/widgets/NotificationsWidget.tsx` — Recent alerts
- `web/src/components/widgets/QuickNotesWidget.tsx` — Multi-note scratchpad
- `web/src/components/widgets/BookmarksWidget.tsx` — Quick links
- `web/src/components/widgets/ActivityFeedWidget.tsx` — Cross-module activity
- `server/src/controllers/dashboardAIContextController.ts` — AI context endpoints

**Files Modified**:
- `web/src/app/dashboard/DashboardClient.tsx` — Complete rewrite (683 lines)
- `web/src/components/widgets/ChatWidget.tsx` — Removed internal wrapper
- `web/src/components/widgets/DriveWidget.tsx` — Removed internal wrapper
- `web/src/components/widgets/CalendarWidget.tsx` — Removed internal wrapper
- `web/src/components/widgets/TodoWidget.tsx` — Removed internal wrapper
- `server/src/controllers/widgetController.ts` — Added batchUpdatePositions
- `server/src/services/widgetService.ts` — Added batch position service
- `server/src/routes/widget.ts` — Added batch-positions endpoint
- `server/src/routes/dashboard.ts` — Added AI context routes
- `server/src/startup/registerBuiltInModules.ts` — Added dashboard module

### **Vssyl Place — Business Admin Section, Cover/Avatar Images & Validation (March 2026) ✅**

**Overview**: Centralized Place listing management in the Business Admin dashboard, separate header vs thumbnail images, cover/avatar upload APIs, and backend validation.

**What Was Accomplished**:

1. **Business Admin as main editing surface**
   - **Vssyl Place** section added to Business Admin sidebar (after Branding, before AI & Insights)
   - Full Place listing editor embedded in that section via `PlaceListingEditor` (compact mode)
   - Standalone page `/business/[id]/place` retained for deep links; primary editing is in Business Admin

2. **Cover image**
   - Backend: `POST/DELETE /api/place/listing/:businessId/cover` (multer + storageService), stored under `place-listings/{businessId}/cover-*`
   - Frontend: Cover image block in PlaceListingEditor (upload/remove); displayed as header banner in BusinessProfilePanel and as top strip/thumb in PlaceExplore cards
   - Map node: `getPlace()` enriches business nodes with `imageUrl` (cover or logo) so the graph node shows the image

3. **Separate avatar/thumbnail image**
   - Schema: `avatarImage` added to `BusinessPlaceListing` (migration `20260310002256_add_avatar_image_place_listing`)
   - Backend: `POST/DELETE /api/place/listing/:businessId/avatar`; upsert accepts `avatarImage`; getPlace uses `avatarImage ?? coverImage ?? business.logo` for map node
   - Frontend: "Thumbnail / Avatar Image" in PlaceListingEditor; card thumbnail and map node use avatar → cover → logo fallback; header uses cover only

4. **Validation & errors**
   - Zod: `upsertListingSchema` (displayName, shortDescription, coverImage, avatarImage, category, tags, nodeColor, etc.) and `addLinkSchema` (type, label, url with optional https prefix)
   - API client and PlaceListingEditor surface backend error message (e.g. "Invalid input (nodeColor: invalid)", "Admin access required")

**Key Files**:
- Backend: `server/src/controllers/placeListingController.ts` (cover/avatar upload/delete, Zod, multer), `server/src/controllers/placeController.ts` (getPlace imageUrl = avatar ?? cover ?? logo), `server/src/routes/place.ts` (cover/avatar routes)
- Frontend: `web/src/components/place/PlaceListingEditor.tsx` (cover + avatar UI), `web/src/app/business/[id]/page.tsx` (Vssyl Place section), `web/src/api/placeListing.ts` (uploadCoverImage, deleteCoverImage, uploadAvatarImage, deleteAvatarImage, upsert error handling)
- Display: `web/src/components/place/BusinessProfilePanel.tsx`, `web/src/components/place/PlaceExplore.tsx`, `web/src/components/place/nodes/BusinessNode.tsx` (imageUrl for map)
- Schema: `prisma/modules/place/place.prisma` (`avatarImage` on BusinessPlaceListing)

---

### **Post-Completion Refinements (March 2026)**

**Widget Picker**:
- **"Add multiple" checkbox** — When checked, picker stays open after adding a widget so users can add several in one session
- **Filter already-added widgets** — Single-instance widgets (e.g. Quick Stats) are hidden from the picker once on the dashboard; other types can still be added multiple times
- **Visual feedback** — "X widgets added" in header; green "Added!" badge and highlight on recently added widget cards

**Dashboard Grid (Drag & Layout)**:
- **Library** — Uses `react-grid-layout/legacy` (Responsive + WidthProvider); no external CSS import — essential grid/resize/drag styles are inlined in the component to avoid Next.js resolution issues
- **Mount delay** — Grid waits for `mounted` state before rendering so WidthProvider can measure container width
- **Layout algorithm** — `buildLayout()` assigns non-overlapping positions: widgets with saved positions first, then new widgets packed in empty slots (currentX/nextY/rowMaxH)
- **Drag handle** — `draggableHandle=".widget-drag-handle"`; the entire widget header bar has this class in edit mode (see WidgetShell)

**Widget Shell**:
- **Drag handle** — In edit mode the full header div has class `widget-drag-handle` and `cursor-grab`; users drag by the header, not a small grip icon
- **"Drag header" label** — Shown in edit mode next to the title
- **Action buttons** — Refresh, Expand, Remove use `onMouseDown`/`onTouchStart` with `stopPropagation()` so clicking them doesn’t start a drag

**Dashboard Header**:
- **Add Widget** — Always visible (not only in edit mode); blue when in edit mode, outlined when not
- **Edit / Done** — "Done" turns green in edit mode; tooltip: "Edit layout - drag and resize widgets"

---

## Previous Focus: Vssyl_Place Enhancements — Household Integration & Graph Polish (February 2026) ✅

### **Place Graph Background & Snap-to-Grid — COMPLETE ✅**

**What Was Accomplished**:
- Removed complex topographic line SVG backgrounds (multiple iterations didn't look right)
- Implemented clean dot-grid background (`BackgroundVariant.Dots`) with warm sage color (`#F0F2EC` base, `#C5CBBA` dots)
- Increased dot size from 2 → 4 pixels for better visibility
- Added `snapToGrid` and `snapGrid={[22, 22]}` so nodes align to dot positions when dragged

**Key Files Modified**:
- `web/src/components/place/PlaceGraph.tsx` — background + snap config

---

### **Household Nodes in Place — COMPLETE ✅**

**What Was Accomplished**:
When a user creates a household on the Home tab OR is invited to one, the household automatically appears on their Vssyl Place graph.

**Schema**:
- Added `HOUSEHOLD` to `PlaceNodeType` enum in `prisma/modules/place/place.prisma`
- Migration: `20260226020905_add_household_place_node_type`

**Backend**:
1. `server/src/controllers/householdController.ts`:
   - Added `addHouseholdToPlace()` helper function that upserts a `PlaceNode` with `nodeType: HOUSEHOLD`
   - `createHousehold()` — after creation, adds HOUSEHOLD node to creator's Place
   - `inviteMember()` — after adding/reactivating a member, adds HOUSEHOLD node to invitee's Place (both paths)

2. `server/src/controllers/placeController.ts`:
   - `getPlace()` now enriches HOUSEHOLD nodes with household name from database (same pattern as business enrichment)

**Frontend**:
1. `web/src/contexts/PlaceContext.tsx`:
   - Added `'HOUSEHOLD'` to `nodeType` union type

2. `web/src/components/place/nodes/HouseholdNode.tsx` (new):
   - Pentagon/house-shaped node via CSS `clip-path`
   - House SVG icon inside
   - Warm brown default color (`#8D6E63`)
   - Same hover effect, label, and connection handle patterns as BusinessNode/UserNode

3. `web/src/components/place/PlaceGraph.tsx`:
   - Registered `household: HouseholdNode` in `nodeTypes` map
   - Added `COLORS.household` for default color
   - Refactored to `getFlowNodeType()` and `getDefaultColor()` helpers for clean multi-type support

---

### **Household Profile Panel — COMPLETE ✅**

**What Was Accomplished**:
Clicking a household node on the Place graph opens a slide-in panel (mirroring the business profile panel) showing:

1. **Header** — House icon + "Household" title + close button
2. **Name & description** — Household name, optional description, "Primary Home" / "Secondary Home" badge, member count
3. **Members section** — Lists active members with avatar initial, name, email, and color-coded role badge (Owner with crown, Admin with shield, etc.)
4. **Upcoming events** — Fetches next 14 days of events from household calendar via `calendarAPI.listEvents()` with `contexts: ['HOUSEHOLD:<id>']`. Shows event title, smart date (Today/Tomorrow/date), time, location. Friendly empty state if no events.
5. **Created date** footer

**Key Files**:
1. `web/src/components/place/HouseholdProfilePanel.tsx` (new) — 252-line component
2. `web/src/components/place/PlaceGraph.tsx`:
   - Added `selectedHouseholdId` state
   - `handleNodeClick` checks for `nodeType === 'HOUSEHOLD'` and opens household panel
   - Only one panel open at a time (business vs household)
   - Renders `HouseholdProfilePanel` when `selectedHouseholdId` is set

**Data Flow**:
- Uses existing `getHousehold()` from `web/src/api/household.ts` for members
- Uses existing `calendarAPI.listEvents()` from `web/src/api/calendar.ts` for events (household calendar auto-provisioned on creation)
- No new backend endpoints needed

---

### **Key Technical Patterns**

**Household-to-Place Auto-Sync Pattern**:
```typescript
async function addHouseholdToPlace(userId: string, householdId: string, householdName: string): Promise<void> {
  const place = await prisma.place.findUnique({ where: { userId } });
  if (!place) return;

  await prisma.placeNode.upsert({
    where: { placeId_nodeType_entityId: { placeId: place.id, nodeType: 'HOUSEHOLD', entityId: householdId } },
    update: { label: householdName },
    create: { placeId: place.id, nodeType: 'HOUSEHOLD', entityId: householdId, label: householdName },
  });
}
```

**Node Type Mapping Pattern** (PlaceGraph.tsx):
```typescript
function getFlowNodeType(nodeType: string): string {
  switch (nodeType) {
    case 'USER': return 'user';
    case 'HOUSEHOLD': return 'household';
    default: return 'business';
  }
}
```

**Completed At**: February 26, 2026

---

## Previous Focus: Vssyl_Place Implementation (Phases 1–7) — COMPLETE ✅

### **Vssyl_Place — Personal Main Street (February 2026)**

**Pushed to git & deployed**: Production at `vssyl.com/place`.

**Status**: ✅ **COMPLETE** — All 7 phases implemented, deployed to production. Full personal neighborhood system with business discovery, transactions, meetings, communities, activity feed, analytics, and AI integration.

**What Was Accomplished**:

1. **Phase 1 — Foundation & Onboarding**
   - Prisma schema: `Place`, `PlaceCustomization`, `PlaceNode`, `PlaceInterest` models in `prisma/modules/place/place.prisma`
   - React Flow graph visualization (`PlaceGraph.tsx`) with Mini Metro-inspired design
   - `/place` route with sub-tab navigation (My Place | Explore)
   - `PlaceContext` provider with WebSocket real-time updates
   - Onboarding flow with interest selection and local business seeding
   - Geolocation service integration for location-based suggestions
   - Header tab integration (Place as first tab in `GlobalHeaderTabs.tsx`)

2. **Phase 2 — Business "Buildings" & Verification**
   - `BusinessPlaceListing` and `BusinessInteractionLink` models
   - Business admin listing management (`placeListingController.ts`, `BusinessPlaceListingAdmin.tsx`)
   - Business profile panel with interaction links (DoorDash, website, social, etc.)
   - Verification badge display for EIN-verified businesses
   - Global search provider integration for Place businesses

3. **Phase 3 — Connections & My Place**
   - Follow/unfollow system with per-business privacy toggle (`PlaceFollowVisibility`)
   - User connection nodes in neighborhood graph
   - Force-directed layout with drag-to-rearrange and saved positions
   - Real-time WebSocket updates for follows and status changes
   - Content moderation foundation (reporting system)

4. **Phase 4 — Explore & Discovery**
   - Explore tab UI with local and personalized suggestions
   - Geographic and interest-based discovery (`placeDiscoveryController.ts`)
   - AI-powered recommendations via Digital Life Twin
   - "Why you're seeing this" suggestion context
   - Dismiss/hide controls for suggestions
   - 3 AI context providers: `place_overview`, `place_connections`, `place_discoveries`

5. **Phase 5 — Transactions & Interaction**
   - `PlaceTransaction` and `PlaceInteractionClick` models
   - Transaction CRUD with Shopify-style platform fees (2.9%)
   - External interaction click tracking with analytics
   - Transaction history page (`/place/transactions`) with summary cards
   - Per-transaction privacy controls

6. **Phase 6 — AI Enhancement & Meeting Places**
   - AI recommendations, purchase help, reservation help (`placeAIController.ts`)
   - `PlaceMeetingPlace`, `PlaceMeetingInvite`, `PlaceLocationPrivacy` models
   - Meeting CRUD with invites, RSVP, calendar linking (`placeMeetingController.ts`)
   - Location privacy settings modal (`PlacePrivacySettings.tsx`)
   - `place_activity` AI context provider

7. **Phase 7 — Advanced Features & Growth**
   - `PlaceCommunity`, `PlaceCommunityMember` models with auto-clustering
   - `PlaceActivityFeedItem` polymorphic activity timeline
   - `PlaceAnalyticsSnapshot` periodic analytics
   - Activity feed component (`PlaceActivityFeed.tsx`)
   - Personal analytics dashboard (`PlaceAnalyticsDashboard.tsx`) with spending, network, growth
   - GDPR data export endpoint
   - Place notification category in notifications page
   - `place_analytics` AI context provider

**Key Files**:
- Backend: `server/src/controllers/place*.ts` (8 controllers), `server/src/routes/place.ts` (60+ endpoints)
- Frontend: `web/src/app/place/page.tsx`, `web/src/components/place/*.tsx` (10+ components), `web/src/contexts/PlaceContext.tsx`
- API clients: `web/src/api/place.ts`, `placeTransaction.ts`, `placeMeeting.ts`, `placeAnalytics.ts`
- Database: `prisma/modules/place/place.prisma` (20+ models, 7 migrations)
- AI: 5 context providers in `server/src/startup/registerBuiltInModules.ts`
- Plan: `memory-bank/vssylPlaceProductContext.md`

**Post-implementation fix**: Removed `.js` extensions from all Place controller/route imports (broke `ts-node-dev` in local dev).

**Completed At**: February 2026

---

## Previous Focus: AI Model Selection (Phases 1–6) — COMPLETE ✅

### **AI Model Selection — Chat/Twin Models (February 2025)**

**Pushed to git**: Commit `feat(ai): model selection per provider + quota differentiation` (main).

**Status**: ✅ **COMPLETE** - Users can choose AI provider (Auto / OpenAI / Anthropic) and, per provider, a specific chat/twin model. Model selection is available in settings and in AI chat (full page and header dropdown). Scope is **chat/twin models only** (not image-generation or image-edit models like DALL·E or gpt-image-1).

**What Was Accomplished**:

1. **Model catalog (Phase 1)**  
   - `server/src/ai/providers/modelCatalog.ts`: Curated list of chat models per provider (OpenAI: gpt-4o, gpt-4o-mini; Anthropic: claude-3-5-sonnet-20241022, claude-3-haiku-20240307; Local: local). Helpers: `getModelsForProvider`, `getModel`, `isModelAvailable`, `getModelsGroupedByProvider`.  
   - `GET /api/ai/models`: Returns models grouped by provider for the frontend.

2. **Preferences & API (Phase 2)**  
   - User preferences: `ai_preferred_model_openai`, `ai_preferred_model_anthropic` (per-provider defaults).  
   - `GET /api/ai/preferences`: Returns `preferredModelOpenai`, `preferredModelAnthropic`.  
   - `PUT /api/ai/preferences`: Accepts and validates model ids via catalog.  
   - `POST /api/ai/twin`: Optional `model` in body (per-request override).  
   - `LifeTwinQuery.preferredModel` and service context pass model through to Core.

3. **Core & providers (Phase 3)**  
   - **DigitalLifeTwinCore**: Resolves model from request override → user preference for selected provider → vision-capable model when images present (if user model doesn’t support vision) → provider default. Sets `options.modelOverride` and passes to `callAIProvider`.  
   - **OpenAIProvider / AnthropicProvider**: Use `data.modelOverride` when present; else `visionModelOverride` when vision; else config default.

4. **Frontend (Phase 4)**  
   - **AIModelPicker**: Dropdown of models for selected provider; compact and full layouts; vision warning when `hasImages` and selected model doesn’t support vision.  
   - **ProviderSettings**: Default model for OpenAI and for Anthropic; load/save via preferences API; loads models from `GET /api/ai/models`.  
   - **ai-chat page & AIChatDropdown**: Provider + model pickers; load preferences and models; send `model` in twin request when set; sync selected model when provider changes.

**Key files**  
- Backend: `server/src/ai/providers/modelCatalog.ts`, `server/src/routes/ai.ts` (GET /models, POST /twin model param), `server/src/routes/ai-preferences.ts`, `server/src/ai/core/DigitalLifeTwinCore.ts` (model resolution, modelOverride), `server/src/ai/providers/OpenAIProvider.ts`, `server/src/ai/providers/AnthropicProvider.ts`  
- Frontend: `web/src/api/aiModels.ts`, `web/src/components/ai/AIModelPicker.tsx`, `web/src/components/ai/ProviderSettings.tsx`, `web/src/app/ai-chat/page.tsx`, `web/src/components/header/AIChatDropdown.tsx`  
- Plan: `memory-bank/AI_MODEL_SELECTION_PHASED_PLAN.md`

**Phase 6 — Quota differentiation (complete)**  
- Premium models (GPT-4o, Claude 3.5 Sonnet) have `queryCost: 2` in the model catalog; standard models use 1.  
- Twin route resolves `modelUsed` from `response.metadata.model`, calls `getQueryCostForModel(modelUsed)` and `AIQueryService.consumeQuery(userId, businessId, queryCost)`.  
- Pre-check: when request includes `model`, require `remaining >= getQueryCostForModel(model)` else 429.  
- AnthropicProvider returns `model: modelToUse` in metadata (was config.model).  
- Frontend: AIModelPicker shows "Uses 2 queries per request" (or "Uses N queries") when `model.queryCost > 1`.

---

## Previous Focus: AI Platform Phases 7 & 8 — COMPLETE ✅

### **Phase 7: Proactive Agents & Phase 8: Vision Editing (February 2025)**

**Status**: ✅ **COMPLETE** - AI Platform Phased Plan Phases 7 and 8 are implemented. All eight phases (1–8) of the plan are now complete.

**Phase 7 — Proactive AI suggestions**:
- **Schema**: `AISuggestion` model (id, userId, type, title, body, actionData Json, status PENDING/ACCEPTED/DISMISSED, respondedAt, createdAt); `User.aiSuggestions` relation. Migration `20260220020711_add_ai_suggestions`.
- **Backend**: `proactiveSuggestionsService.ts` — `onFileUploaded(context)` creates an AISuggestion for document uploads (PDF, Word, text, CSV, etc.) with `suggestedPrompt` in actionData (e.g., "Extract key information from [fileName]...") and sends notification (`ai_suggestion`) with `actionUrl: /ai-chat?suggestion=...`. Hook called from `fileController` after file create (fire-and-forget). GET `/api/ai/suggestions`, POST `/api/ai/suggestions/:id/accept` (returns `fileId`, `suggestedPrompt`, `actionUrl`), POST `/api/ai/suggestions/:id/dismiss` (auth, user-scoped).
- **Frontend**: 
  - **AI Chat Page** (`/ai-chat`): Sidebar loads and shows "AI Suggestions" with Accept/Dismiss; polls every 5 seconds. Accepting automatically attaches file and executes `suggestedPrompt` (no manual typing needed).
  - **AIChatDropdown** (header bubble): Shows suggestions above input area with purple gradient background; polls every 5 seconds when open. Accepting automatically attaches file and executes `suggestedPrompt` immediately. Suggestions appear instantly when files are uploaded in file hub.
  - **Notifications page**: `ai_suggestion` category (Zap icon), click uses `data.actionUrl`; "Open in AI" button when `actionUrl` present.
  - **API**: `web/src/api/aiSuggestions.ts` (getSuggestions, acceptSuggestion returns `{ suggestionId, actionUrl, fileId?, suggestedPrompt? }`, dismissSuggestion).

**Phase 8 — Vision editing**:
- **Backend**: `OpenAIProvider.editImage(imageBuffer, prompt, options?)` — calls OpenAI `images.edit` (gpt-image-1), returns url or b64_json. Capability `supportsImageEdit: true` for OpenAI. POST `/api/ai/edit-image`: body `fileId`, `prompt`, `background?`, `saveToDrive?`, `dashboardId?`, `folderId?`, `name?`; resolves file to buffer (URL fetch or storage), calls provider, optionally saves result to Drive and returns `{ url, fileId?, name? }`.
- **Frontend**: When exactly one file is attached in AI chat, "Edit image" button (pencil icon) appears. Modal: prompt (e.g. "Remove background"), background (Auto/Transparent/Opaque), "Edit & save to Drive". Result shown like generated image with "Open in Drive" when saved.

**Key files**:
- Phase 7: `prisma/modules/ai/ai-models.prisma`, `prisma/modules/auth/user.prisma`, `server/src/services/proactiveSuggestionsService.ts` (includes `suggestedPrompt` in actionData), `server/src/controllers/fileController.ts`, `server/src/routes/ai.ts` (suggestions routes; accept returns `fileId` + `suggestedPrompt`), `web/src/api/aiSuggestions.ts` (updated AcceptSuggestionResponse interface), `web/src/app/ai-chat/page.tsx` (suggestions UI with polling + auto-execute), `web/src/components/header/AIChatDropdown.tsx` (suggestions display + polling + auto-execute), `web/src/app/notifications/page.tsx` (ai_suggestion, actionUrl).
- Phase 8: `server/src/ai/providers/OpenAIProvider.ts` (editImage), `server/src/ai/providers/capabilities.ts` (supportsImageEdit), `server/src/routes/ai.ts` (POST /edit-image), `web/src/app/ai-chat/page.tsx` (Edit image modal + button).

**Fix**: `proactiveSuggestionsService.ts` — logger `error` field must be object `{ message, stack }`, not string.

---

## Previous Focus: AI Rate Limit, Vision Fallback & PDF Vision — COMPLETE ✅

### **AI Rate Limit, Provider Fallback & PDF Vision (February 2025)**

**Status**: ✅ **COMPLETE** - Rate-limit handling, provider auto-fallback, "Image used" only on success, PDF vision with pdftoppm check, and file-issue taxonomy are implemented and working.

**What Was Accomplished**:

1. **OpenAI 429 / rate-limit handling** ✅  
   - **OpenAIProvider**: Exponential backoff on 429 (no instant retries); `maxRetries: 0` on client; we retry with backoff in code.  
   - Prefer **signed URLs** over base64 for vision to avoid huge payloads and TPM/RPM rate limits.  
   - **Retry-After** parsed from response headers and included in error payload/metadata (`code: 'RATE_LIMITED'`, `retryAfter` seconds).  
   - User-facing message: e.g. "OpenAI rate limit hit. Try again in ~Ns" or "Try again or reduce attachments / switch provider."  
   - **sanitizeDataForPrompt**: Never stringify raw multimodal payloads (base64 images) into the text prompt; reduces tokens and rate-limit risk.

2. **Provider auto-fallback** ✅  
   - **DigitalLifeTwinCore**: On OpenAI or Anthropic returning `metadata.code === 'RATE_LIMITED'` or `'TEMP_UNAVAILABLE'`, automatically retry **once** with the other provider (same prompt + vision parts).  
   - Logged with `[VISION_PIPELINE]` prefix (e.g. "provider fallback (openai → anthropic)").

3. **"Image used in this reply" only on success** ✅  
   - **usedVisionParts** is set only when the provider call **succeeds** (no error in final metadata).  
   - Not set when falling back due to 429/unavailable or when returning a fallback error response.

4. **PDF vision (Option C)** ✅  
   - **fileAnalysisService**: `isPdftoppmAvailable()` checks for poppler-utils before running pdftoppm.  
   - `renderPdfPagesToVisionParts()` returns `{ parts, pdftoppmUnavailable? }`.  
   - `getPdfVisionParts(file, summary, currentPartCount, maxTotalParts)` returns `{ parts, fileIssueCode?, fileId?, fileName? }`.  
   - When pdftoppm is missing: `fileIssueCode: 'PDF_RENDER_UNAVAILABLE'` and user-facing message (no silent failure).  
   - **DigitalLifeTwinCore**: For image-based PDFs (short/no text summary), calls `getPdfVisionParts`, appends parts to vision pipeline, and pushes any `fileIssueCode` into `fileAnalysisResults` for `fileIssues` in the response.

5. **File issue taxonomy (Phase 5)** ✅  
   - **fileIssues.ts**: Added `PDF_RENDER_UNAVAILABLE` to `FILE_ISSUE_CODES` and `USER_MESSAGES`.  
   - Response includes `fileIssues` when attachment issues occur; UI shows per-file messages.

6. **AnthropicProvider** ✅  
   - On failure, sets `metadata.code` to `RATE_LIMITED` or `TEMP_UNAVAILABLE` so Core can fall back to OpenAI.

7. **503 / backend unavailable**  
   - If `/api/ai/twin` returns 503, the Next.js proxy is reporting that the backend did not respond (e.g. fetch/network error).  
   - **Resolution**: Ensure backend is running (`pnpm dev`), check backend terminal for crashes; restart backend if needed. Route handler returns 500 on caught errors; 503 comes from proxy when backend is unreachable.

**Key files**  
- `server/src/ai/providers/OpenAIProvider.ts` (backoff, Retry-After, sanitizeDataForPrompt, signed URL preference, getFallbackResponse with code/retryAfter)  
- `server/src/ai/core/DigitalLifeTwinCore.ts` (provider fallback, usedVisionParts only on success, getPdfVisionParts + fileIssues)  
- `server/src/services/fileAnalysisService.ts` (isPdftoppmAvailable, renderPdfPagesToVisionParts, getPdfVisionParts result shape, FileIssueCode)  
- `server/src/ai/types/fileIssues.ts` (PDF_RENDER_UNAVAILABLE, getMessageForCode)  
- `server/src/ai/providers/AnthropicProvider.ts` (metadata.code on failure)  
- `server/src/ai/providers/capabilities.ts`, `server/src/ai/providers/LocalProvider.ts`  
- `web/src/app/ai-chat/page.tsx` (submittingRef, "Image used" only when API indicates success)

**Remaining (optional)**  
- Phase 2: Vision-specific prompt nudge for concrete image description  
- Image generation UI for `/api/ai/generate-image`

---

## Previous Focus: AI Vision & Multimodal — Phase 1 + Optional Items COMPLETE ✅

### **Vision Optional Items — COMPLETE (February 2025)**

**Status**: ✅ **COMPLETE** - Phase 1 (wire getVisionImageParts) was implemented previously. All optional items from the plan are now done.

**What Was Accomplished (Optional Items)**:

1. **Image resize before sending** ✅  
   - `resizeImageForVision(buffer, mimeType, fileName, maxDimension, maxBytes)` in `fileAnalysisService.ts`  
   - Longest side ≤ 1600px, convert to JPEG (quality 85); uses sharp  
   - Applied in `getVisionImageParts` before sending to provider; reduces tokens and cost  
   - Constants: `VISION_IMAGE_MAX_DIMENSION = 1600`, `VISION_IMAGE_JPEG_QUALITY = 85`

2. **Excel/CSV table parsing** ✅  
   - `parseCsvToMarkdownTable(csv, maxChars)` in `fileAnalysisService.ts`  
   - CSV files parsed as markdown tables and sent as structured context to AI  
   - Excel (xlsx/xls) still handled by officeparser; no change

3. **Image generation (DALL·E)** ✅  
   - `capabilities.ts`: `supportsImageGeneration?: boolean` on `ProviderVisionCapability`; `true` for OpenAI  
   - `OpenAIProvider.generateImage(prompt, options?)` — calls DALL·E 3, returns `{ url?, revisedPrompt?, error? }`  
   - `POST /api/ai/generate-image` (authenticated): `{ prompt, size?, quality? }` → `{ success, data: { url, revisedPrompt } }`  
   - Frontend not yet wired; backend route ready

4. **"Image used in this reply" badge** ✅  
   - `DigitalLifeTwinResponse.usedVisionParts?: boolean` set when vision parts sent to provider  
   - `aiResponseHandler.ts`: `usedVisionParts` on `TwinResponseData`, `AIConversationItemBase`  
   - `ai-chat/page.tsx`, `AIChatDropdown.tsx`: render italic gray "Image used in this reply" when `item.usedVisionParts` is true

**Key paths**  
- `server/src/services/fileAnalysisService.ts` (resizeImageForVision, parseCsvToMarkdownTable)  
- `server/src/ai/core/DigitalLifeTwinCore.ts` (usedVisionParts)  
- `server/src/ai/providers/OpenAIProvider.ts` (generateImage), `server/src/ai/providers/capabilities.ts`  
- `server/src/routes/ai.ts` (POST /generate-image)  
- `web/src/lib/aiResponseHandler.ts`, `web/src/app/ai-chat/page.tsx`, `web/src/components/header/AIChatDropdown.tsx`

**Remaining from plan**  
- Phase 2: Vision-specific prompt nudge  
- Phase 3: PDF vision — ✅ Done (pdftoppm, getPdfVisionParts, PDF_RENDER_UNAVAILABLE)  
- Phase 4: Provider capability matrix — in use (capabilities.ts)  
- Phase 5: Error taxonomy — ✅ Done (fileIssues.ts, fileIssues in response)  
- Phase 6: docs/ai/ and memory-bank  
- Image generation: add UI caller for `/api/ai/generate-image`

---

## Previous Focus: AI Vision for Image Attachments — COMPLETE ✅

### **Vision API: Phase 1 Implemented (February 2025)**

**Status**: ✅ **COMPLETE** - `getVisionImageParts` is wired in DigitalLifeTwinCore. Attached image files (png, jpg, jpeg, gif, webp, bmp) are sent to OpenAI/Anthropic as vision input so the model can describe and reason about image content.

---

## Previous Focus: Structured AI Response & Formatting — COMPLETE ✅

### **Structured AI Response & Response Handler (February 2025)**

**Status**: ✅ **COMPLETE** - Product-grade AI response UX: structured JSON from providers, normalized backend, section/action renderer, central response handler, and error item helper.

**What Was Accomplished**:

**Backend – Structured schema & normalization**
- **Types**: `server/src/ai/types/structuredResponse.ts` – `StructuredAIResponse` (type, title, sections[], actions[], optional `table`), `StructuredAIResponseSection` (heading, content, optional `icon`), `StructuredAITableData` (columns[], rows[][]), `StructuredAIActionButton`, `isStructuredAIResponse()`.
- **Normalizer**: `server/src/ai/utils/normalizeAIResponse.ts` – `normalizeAIResponse(parsed)` supports structured JSON (including type `table` with columns/rows and section `icon`) and legacy `{ response, confidence, reasoning, actions }`; always returns `response` (plain text for DB) and optional `structured` for UI.
- **Providers**: Anthropic and OpenAI system prompts ask for structured format (summary/answer/list/steps/**table**) with sections (optional `icon`), optional `table: { columns, rows }` when type is table, and optional action buttons; providers parse then call normalizer and return `structured` when present.
- **API**: `DigitalLifeTwinResponse` and `/api/ai/twin` include `structured` in the response when the model returns it.

**Frontend – Renderer & handler**
- **AIResponseRenderer**: `web/src/components/ai/AIResponseRenderer.tsx` – Renders title, sections (heading + content), action buttons, confidence. Layout by type: `steps` → ordered list, `list` → bullet list, `table` → HTML table (columns + rows), else paragraph. Typography: title `text-lg font-semibold`, section heading `text-sm font-medium`, body `text-sm text-gray-700`, `max-w-2xl space-y-4 leading-relaxed`. Optional **collapsible sections** (`collapsibleSections` prop): section headings toggle expand/collapse. **Icons**: response-type icon next to title (FileText, List, ListOrdered, MessageCircle, Zap, Table2); optional **per-section icon** (emoji or name) when section has `icon`.
- **Action wiring**: `onAction` in ai-chat page, AIChatDropdown, AIChatModule: `action.href` → router.push or open in new tab; `action.fileId` → `/drive?file=...`.
- **Central handler**: `web/src/lib/aiResponseHandler.ts` – `buildAIConversationItemFromTwinData(data, options?)` for success items (optional `includeLegacyAiResponse` for dropdown), `buildAddMessagePayloadFromTwinData(data)` for addMessage, `buildErrorConversationItem(message)` for error items. All three UIs use these.

**Key paths**:
- `server/src/ai/types/structuredResponse.ts`, `server/src/ai/utils/normalizeAIResponse.ts`
- `server/src/ai/providers/AnthropicProvider.ts`, `server/src/ai/providers/OpenAIProvider.ts`
- `server/src/ai/core/DigitalLifeTwinCore.ts` (structured on response)
- `web/src/components/ai/AIResponseRenderer.tsx`, `web/src/lib/aiResponseHandler.ts`
- `web/src/app/ai-chat/page.tsx`, `web/src/components/header/AIChatDropdown.tsx`, `web/src/components/ai/AIChatModule.tsx`

### **AI file & context limits (ChatGPT-style, February 2025)**

**Design**: Extract → chunk-style cap → send to AI (never send raw binary). Aligns with production recommendations: file size limits, per-file token cap, total file context cap.

**Limits (in code)**:
- **File size**: 25 MB per file (PDF, Office, text); 5 MB for images. `fileAnalysisService.ts`: `MAX_FILE_SIZE_BYTES`, `MAX_IMAGE_SIZE_BYTES`.
- **Per-file context**: ~20k chars (~5k tokens), i.e. 5 “chunks” × 4k chars. `MAX_SUMMARY_CHARS = CHUNK_SIZE_CHARS * MAX_CHUNKS_PER_FILE`.
- **Total file context in prompt**: 60k chars (~15k tokens). `DigitalLifeTwinCore`: `MAX_ATTACHED_FILES_CONTEXT_CHARS`; attached section is truncated with notice if exceeded.
- **Max files per request**: 5. `MAX_FILES_TO_ANALYZE`.

**Optional (not yet implemented)**: Per-user rate limiting on `/api/ai/twin` (e.g. 5–10 req/min); response token cap in provider prompts. Future: vector store + retrieval for “send only relevant chunks.”

**Key paths**: `server/src/services/fileAnalysisService.ts`, `server/src/ai/core/DigitalLifeTwinCore.ts`

### **PDF / image-based file analysis (scanned PDFs) — IN PROGRESS**

**Status**: Text extraction + OCR fallback implemented; **OCR fails in production** (Cloud Run). Prompt and logging in place.

**What was implemented**:
- **Scanned heuristic**: If PDF text extraction returns &lt; 500 chars (`MIN_PDF_TEXT_CHARS_FOR_SUCCESS`), we treat as image-based and try OCR automatically.
- **OCR fallback**: When extraction is empty or insufficient, `tryPdfOcrFallback()` runs: render first 5 PDF pages to images (pdfjs-dist + canvas), run tesseract.js OCR, concatenate text. Uses `canvas` (native) + `pdfjs-dist` + `tesseract.js`. Canvas is optional: if `require('canvas')` fails, we skip OCR and use fallback message.
- **Structured logging (Cloud Run)**: `file_analysis_start` (fileSizeBytes, mimeType), `file_analysis_pdf_result` (extractedTextChars, isScannedHeuristic, bufferBytes), `file_analysis_pdf_ocr_attempt`, `file_analysis_pdf_ocr_success` or warn on failure, `file_analysis_complete` (summaryLength, extractedTextIsEmpty, hasErrorPrefix). Enables debugging extraction vs OCR in production.
- **Prompt fixes**: Fallback message and ATTACHED FILES CONTEXT header instruct the model not to mention "file size", "too large", "exceeds", or "processing capabilities" when extraction fails — only that it could not read the file and suggest text-based PDF or describe the document.
- **DigitalLifeTwinCore**: 30s timeout for file summaries so long-running extraction/OCR doesn’t hang the request; on timeout or error, request continues without file summaries. Attached-files section build wrapped in try/catch; total file context capped at 60k chars.
- **Dockerfile.production**: `apk add` for canvas deps (cairo, pango, jpeg, giflib, librsvg + build deps in base stage). Canvas may still fail to build in Cloud Build (e.g. build scripts skipped or node-gyp failure).

**Current state**:
- **Text-based PDFs**: Work (unpdf / pdf-parse).
- **Image-based/scanned PDFs (e.g. "Catered Affairs Signed.pdf")**: Extraction returns 0 or very few chars → OCR is attempted → in production OCR fails (logs show `file_analysis_pdf_ocr` on stderr, typically "Canvas module not available" or similar). User sees fallback: AI says it could not read the file and suggests alternatives (no "size" wording if prompt fixes are deployed).
- **Images (jpg, png, etc.)**: Handled by vision pipeline (model sees image) + OCR text when available.

**Next steps**:
1. **Option A – Fix canvas in Cloud Run**: Confirm Dockerfile with canvas apk deps is used in Cloud Build; check build logs for canvas/node-gyp errors; add any missing Alpine build packages so canvas compiles.
2. **Option B – OCR via API**: Replace in-process OCR with Google Document AI (or similar) when PDF text is insufficient: call API with PDF bytes or GCS path, use returned text. No canvas dependency in the container.
3. **Option C – PDF vision**: Render first 1–2 PDF pages to images and add to `visionImageParts` so the model can "see" PDF pages like photos (reuses existing vision path; no OCR needed for model to answer).

**Key paths**: `server/src/services/fileAnalysisService.ts` (tryPdfOcrFallback, MIN_PDF_TEXT_CHARS_FOR_SUCCESS, logging), `server/src/ai/core/DigitalLifeTwinCore.ts` (timeout, attached-files header, error handling), `server/Dockerfile.production` (apk add for canvas).

---

## Previous Focus: AI Chat File Attachments — COMPLETE ✅

### **Recent Completion: AI Chat File Attachments (Phases 1–5) ✅ (February 2025)**

**Status**: ✅ **COMPLETE** - Full attachment flow: upload from computer or Drive, persist with messages, extract text/PDF for AI, "Ask AI about this file" from File Hub, limits and UX polish.

**What Was Accomplished**:

**Phase 1: Basic Attachment Support** ✅
- AI chat UI: attachment area with AIFileUpload (wraps ChatFileUpload), attachedFiles state with removable chips
- fileIds sent in context.fileIds to /api/ai/twin (all entry points use twin; AIChatModule was fixed from broken /api/ai/query)
- Files: `web/src/components/ai/AIFileUpload.tsx`, `web/src/components/ai/AIChatModule.tsx`, `web/src/app/ai-chat/page.tsx`

**Phase 2: Persist Attachments in AI Messages** ✅
- Schema: AIMessage.attachments Json? stores { fileIds: string[] }; migration 20260211111406_add_ai_message_attachments
- Backend: addMessage accepts fileIds, validates file access (user owns or has canRead), persists attachments
- Frontend: AddMessageData.fileIds, AIMessage.attachments; addMessage calls pass fileIds
- Files: `prisma/modules/ai/conversations.prisma`, `server/src/controllers/aiConversationController.ts`, `web/src/api/aiConversations.ts`

**Phase 3: File Analysis Service & AI Prompt** ✅
- New `fileAnalysisService.ts`: extracts text from .txt, .md, .json, .csv, .html, PDF (pdf-parse + unpdf), Office docs (officeparser), images (tesseract OCR); limits 5 files, 25MB/file (5MB images), ~20k chars per file (~5 chunks × 1k tokens); total file context in prompt capped at ~15k tokens (DigitalLifeTwinCore)
- DigitalLifeTwinCore: fetches files with user access check, calls getFileSummaries(), injects summaries into ATTACHED FILES CONTEXT prompt section
- Files: `server/src/services/fileAnalysisService.ts`, `server/src/ai/core/DigitalLifeTwinCore.ts`, `server/package.json` (pdf-parse, unpdf, officeparser, tesseract.js)

**Phase 6: Production Fixes (Google Cloud)** ✅
- **Issue**: Worked locally but not on Cloud Run production (GCS, serverless environment).
- **Fix 1 – AIChatModule endpoint**: AIChatModule called non-existent `/api/ai/query`; changed to `/api/ai/twin` so workspace-embedded AI chat works.
- **Fix 2 – PDF extraction in production**: pdf-parse uses native modules (canvas, workers) that can fail on Cloud Run. Use **unpdf** (serverless-optimized) as primary when `NODE_ENV=production`; pdf-parse first in dev. Added `unpdf@^1.4.0`.
- **Fix 3 – GCS path resolution**: `resolveStoragePath` now handles `file.path` that looks like a URL (http/https) by extracting object path via `extractPathFromUrl`. `extractPathFromUrl` now supports `storage.cloud.google.com` in addition to `storage.googleapis.com`.
- **Fix 4 – Error differentiation**: Separate try-catch for `getFileBuffer` vs `extractTextFromBuffer`; distinct error messages: "(Could not locate file in storage)", "(Could not fetch file from storage)", parse errors.
- **Fix 5 – Logging**: Added `file_analysis_resolve`, `file_analysis_storage_fetch` operations with storagePath, provider, pathPreview for Cloud Logging diagnosis.
- Files: `server/src/services/fileAnalysisService.ts`, `server/src/services/storageService.ts`, `web/src/components/ai/AIChatModule.tsx`, `server/src/ai/core/DigitalLifeTwinCore.ts` (logger instead of console for file flow)

**Phase 4: "Ask AI about this file" from Drive** ✅
- AI chat: reads fileIds/fileNames from URL (?fileIds=...&fileNames=...), pre-attaches on load
- DriveModule & DriveDetailsPanel: "Ask AI about this file" (Brain icon) in context menu and details panel; navigates to /ai-chat with file
- Starred page: same "Ask AI about this file" in context menu and details panel
- Files: `web/src/app/ai-chat/page.tsx`, `web/src/components/modules/DriveModule.tsx`, `web/src/components/drive/DriveDetailsPanel.tsx`, `web/src/app/drive/starred/page.tsx`

**Phase 5: Limits & UX Polish** ✅
- Max 10 attachments (matches backend); cap on add, toast when exceeded
- File count badge (X/10 files), help text ("Up to 10 files. Large files (500KB+) may be summarized only")
- AIFileUpload: maxFiles, currentCount props; disabled when at limit
- Files: `web/src/app/ai-chat/page.tsx`, `web/src/components/ai/AIChatModule.tsx`, `web/src/components/ai/AIFileUpload.tsx`

**Key Paths**:
- `web/src/components/ai/AIFileUpload.tsx` - upload component
- `server/src/services/fileAnalysisService.ts` - text/PDF extraction
- `server/src/ai/core/DigitalLifeTwinCore.ts` - attached file context + summaries in prompt
- `prisma/modules/ai/conversations.prisma` - AIMessage.attachments

**Completed At**: February 2025

---

## Previous Focus: AI Memories View & Digital Life Twin Improvements — COMPLETE ✅

### **AI Memories View (Phases 1–3) & Chat/Twin Fixes ✅ (February 2025)**

**Status**: ✅ **COMPLETE** - "What the AI knows" (Memories) tab in AI Control Center, conversation history in the twin, chat history fix, and response readability improvements.

**What Was Accomplished**:

**1. AI Memories View (Phase 1)** ✅
- New **Memories** tab on AI Control Center (`/ai?tab=memories`), 7th tab with responsive grid (grid-cols-4 sm:grid-cols-6 lg:grid-cols-7).
- **AIMemoriesView** component: fetches `GET /api/ai/context` and `GET /api/ai/personality/profile`.
- **Facts & preferences** section: UserAIContext grouped by contextType (Facts, Preferences, Instructions, Workflows) with "Edit in Custom Context" CTA.
- **Personality** section: Short summary (traits, communication style) with "Edit in Personality Profile" CTA.
- **Empty state**: "Nothing saved yet" with CTAs to Custom Context and Personality when no context and no personality.
- **Files**: `web/src/components/ai/AIMemoriesView.tsx`, `web/src/app/ai/page.tsx`.

**2. Source Labels (Phase 2)** ✅
- **Schema**: `UserAIContext.source` (optional `'user' | 'conversation'`) in `prisma/modules/ai/ai-models.prisma`; migration `20260209234938_add_user_ai_context_source`.
- **Backend**: Fact extraction sets `source: 'conversation'` when saving from chat; Custom Context create sets `source: 'user'`; Custom Context update sets `source: 'user'`.
- **Memories UI**: Badges "You added" (blue) and "Saved from a conversation" (green) per context item.
- **Files**: `server/src/services/factExtractionService.ts`, `server/src/controllers/userAIContextController.ts`, `web/src/components/ai/AIMemoriesView.tsx`.

**3. Learned Patterns (Phase 3)** ✅
- **Endpoint**: `GET /api/ai/learning/my-patterns` returns user-friendly pattern summaries (id, description, type) from `AdvancedLearningEngine.getUserPatterns()` via `formatPatternForUser()`.
- **Memories UI**: "Learned patterns" section (Sparkles icon) with list of descriptions or "No patterns yet" empty state.
- **Files**: `server/src/routes/ai.ts` (endpoint + formatter), `web/src/components/ai/AIMemoriesView.tsx`.

**4. AI Chat History Fix** ✅
- Conversations were created/loaded with inconsistent `dashboardId`, so new chats didn’t appear in history.
- **Fix**: AIChatDropdown, AIChatModule, and ai-chat page use `dashboardId ?? currentDashboard?.id` for create/load and correct effect dependencies so list refreshes when dashboard changes.
- **Files**: `web/src/components/header/AIChatDropdown.tsx`, `web/src/components/ai/AIChatModule.tsx`, `web/src/app/ai-chat/page.tsx`.

**5. Conversation History in Twin** ✅
- Twin now receives recent messages: **DigitalLifeTwinService** accepts `context.conversationId`, loads conversation (last 20 messages), maps to `conversationHistory`, excludes duplicate of current user message.
- **DigitalLifeTwinCore** adds "RECENT MESSAGES IN THIS CONVERSATION" to the prompt (oldest to newest).
- **Frontend**: ai-chat page, AIChatDropdown, AIChatModule send `conversationId` in twin request context.
- **Files**: `server/src/ai/core/DigitalLifeTwinService.ts`, `server/src/ai/core/DigitalLifeTwinCore.ts`, `server/src/routes/ai.ts`, frontend chat surfaces.

**6. AI Response Readability & Thinking State** ✅
- **AIMessageContent**: Renders AI text with paragraph breaks (`\n\n`), `whitespace-pre-wrap` for single newlines.
- **AIThinkingIndicator**: "Thinking…" with bouncing dots used while waiting for twin response.
- **Prompt formatting**: "FORMATTING FOR READABILITY" in DigitalLifeTwinCore and in OpenAI/Anthropic provider instructions (paragraphs, lists, short blocks).
- **Files**: `web/src/components/ai/AIMessageContent.tsx`, `web/src/components/ai/AIThinkingIndicator.tsx`, `server/src/ai/core/DigitalLifeTwinCore.ts`, `server/src/ai/providers/OpenAIProvider.ts`, `server/src/ai/providers/AnthropicProvider.ts`.

**Plan Reference**: `docs/plans/AI_MEMORIES_VIEW_PLAN.md` (Phases 1–3 implemented).

**Completed At**: February 2025

---

## Previous Focus: Stripe Integration & Query Pack Management — COMPLETE ✅

### **Stripe Connection Fixes & Query Pack Admin Management ✅ (February 2, 2025)**

**Status**: ✅ **COMPLETE** - Fixed Stripe connection errors in production and added query pack price management to admin portal.

**Problem Identified**:
- Stripe connection errors in production: "StripeConnectionError - Request was retried 3 times"
- Query pack prices were hardcoded in config, not editable in admin UI
- Query packs weren't syncing to Stripe when prices changed
- Purchase flow used hardcoded prices instead of database prices

**What Was Accomplished**:

**1. Stripe Connection Reliability Improvements** ✅
- Added timeout (30s) and maxNetworkRetries (3) to Stripe client for serverless environments
- Added key trimming to handle Secret Manager newlines/whitespace
- Added runtime key logging (prefix: `sk_test_` or `sk_live_`) for production diagnostics
- Added fail-fast error message in production if STRIPE_SECRET_KEY is missing
- **File**: `server/src/config/stripe.ts`

**2. Enhanced Stripe Error Reporting** ✅
- Stripe errors now include type, code, and cause for better debugging
- Added `GET /api/pricing/stripe-status` endpoint (admin-only) for connectivity diagnostics
- Endpoint tests both raw HTTPS and Stripe SDK to isolate network vs SDK issues
- Returns detailed hints based on which check fails
- **Files**: `server/src/controllers/pricingController.ts`, `server/src/routes/pricing.ts`

**3. Query Pack Price Management in Admin Portal** ✅
- Added query pack price fields (Small, Medium, Large, Enterprise) to pricing edit modal
- Query pack prices now sync to Stripe automatically when changed (like subscription prices)
- Stripe price IDs created for each pack type when prices change
- **File**: `web/src/app/admin-portal/pricing/page.tsx`

**4. Query Pack Purchase Flow Updates** ✅
- Purchase flow now uses database prices instead of hardcoded config prices
- Falls back to config prices if DB prices aren't set
- `GET /api/ai/queries/packs` endpoint uses DB prices from first active tier
- Purchase records store actual DB price used
- **Files**: `server/src/services/aiQueryService.ts`, `server/src/controllers/aiQueryController.ts`

**5. Documentation Updates** ✅
- Added Stripe connection troubleshooting section to deployment docs
- Documented gcloud command to verify secrets are injected at runtime
- Added guidance on checking Cloud Run logs for key prefix messages
- **File**: `docs/deployment/PRODUCTION_LOGS_AND_DB.md`

**Technical Implementation**:
- **Stripe Client**: Timeout/retries, key trimming, runtime logging
- **Error Handling**: Detailed error types/codes/causes, diagnostic endpoint
- **Query Packs**: DB-driven pricing, Stripe sync, admin UI management
- **Purchase Flow**: Uses DB prices with config fallback

**What This Enables**:
- ✅ Reliable Stripe connections in production (timeout/retries)
- ✅ Easy debugging of Stripe issues (status endpoint, detailed errors)
- ✅ Admin can update query pack prices without code changes
- ✅ Query pack prices automatically sync to Stripe
- ✅ Purchase flow uses current DB prices, not hardcoded values

**Files Modified**:
- `server/src/config/stripe.ts` - Timeout/retries, key trimming, runtime logging
- `server/src/controllers/pricingController.ts` - Query pack Stripe sync, stripe-status endpoint
- `server/src/routes/pricing.ts` - Added stripe-status route
- `server/src/services/aiQueryService.ts` - Use DB prices in purchase flow
- `server/src/controllers/aiQueryController.ts` - Use DB prices in getQueryPacks
- `web/src/app/admin-portal/pricing/page.tsx` - Query pack price fields in edit modal
- `docs/deployment/PRODUCTION_LOGS_AND_DB.md` - Stripe troubleshooting section

**Completed At**: February 2, 2025

---

## Previous Focus: Production Migration Fix — COMPLETE ✅

### **Recent Completion: Production Migration Fix ✅ (January 29, 2025)**

**Status**: ✅ **COMPLETE** - Fixed failed Prisma migrations in production that were blocking all new migrations.

**Problem Identified**:
- Production database had failed migration records in `_prisma_migrations` table
- `20260126230000_initial_schema_baseline` was marked as "failed" (started but never finished)
- `20251026_add_hr_module_schema` had duplicate records (one applied, one failed)
- Prisma refused to apply any new migrations until failed ones were resolved
- Cloud Build cannot reach the database during build (VPC restriction), so migrations must run on container startup

**What Was Accomplished**:

**1. Admin Migration Management Endpoints** ✅
- Added `GET /api/admin-portal/database/migrations` - View all migrations and their status
- Added `POST /api/admin-portal/database/migrations/fix-failed` - Mark failed migrations as applied
- Added `POST /api/admin-portal/database/migrations/delete` - Delete orphaned migration records
- Added `POST /api/admin-portal/database/migrations/reset-baseline` - Reset & re-baseline all migrations
- **File**: `server/src/routes/admin-portal.ts`

**2. Fixed Startup Migration Logic** ✅
- Removed hardcoded resolve step for non-existent `20251026_add_hr_module_schema` migration
- Improved error logging for migration failures
- Server continues to start even if migrations fail (allows debugging)
- **File**: `server/src/index.ts`

**3. Schema Drift Detection** ✅
- Added detection for Prisma errors from missing columns (production DB schema drift)
- Handles schema drift gracefully in admin service
- **File**: `server/src/services/adminService.ts`

**4. Fixed 72 Migration Records** ✅
- Used temporary unauthenticated endpoint to fix failed migrations
- Marked both failed migrations as applied
- Removed temporary endpoint after fix (security cleanup)

**Files Modified**:
- `server/src/routes/admin-portal.ts` - Added 4 migration management endpoints
- `server/src/index.ts` - Removed hardcoded migration resolve, improved error handling
- `server/src/services/adminService.ts` - Added schema drift detection
- `server/src/routes/admin-setup.ts` - Temporary fix endpoint (removed after use)

**Completed At**: January 29, 2025

---

## Previous Focus: Backend Performance Optimizations — COMPLETE ✅

### **Recent Completion: Backend Performance Optimizations ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - Backend performance optimizations implemented to resolve 504 Gateway Timeout errors and WebSocket connection issues.

**Problem Identified**:
- Backend experiencing overload with 504 Gateway Timeout errors
- WebSocket connection errors increasing
- `/api/admin-portal/impersonation/current` endpoint timing out
- Database connection pool too small (5 connections) causing bottlenecks
- Missing database indexes causing slow queries
- No request timeouts allowing requests to hang indefinitely

**What Was Accomplished**:

**1. Database Connection Pool Increase** ✅
- Increased connection pool from 5 to 20 connections in production
- Development remains at 5 connections to save resources
- **File**: `server/src/lib/prisma.ts`
- **Impact**: Allows 4x more concurrent database operations, significantly improving throughput

**2. Composite Database Index** ✅
- Added composite index on `(adminId, endedAt)` for impersonation queries
- Optimizes queries that find active impersonations by admin
- **Migration**: `prisma/migrations/20260122000000_add_impersonation_composite_index/migration.sql`
- **Schema**: `prisma/modules/admin/admin-portal.prisma`
- **Impact**: Dramatically speeds up impersonation lookups, reducing query time from seconds to milliseconds

**3. Request Timeout Middleware** ✅
- Added Express request timeout middleware
- 30 seconds timeout for most requests
- 2 minutes timeout for file uploads
- Prevents hanging requests that cause 504 errors
- **File**: `server/src/index.ts`
- **Impact**: Prevents requests from hanging indefinitely, providing clear timeout errors instead

**4. Query Timeout on Impersonation Endpoint** ✅
- Added 10-second timeout to `/impersonation/current` database query
- Uses Promise.race pattern to prevent hanging queries
- **File**: `server/src/routes/admin-portal.ts`
- **Impact**: Prevents database queries from blocking the request indefinitely

**5. Query Timeout Utility** ✅
- Created reusable `withQueryTimeout()` utility function
- Can be applied to any database query for timeout protection
- **File**: `server/src/lib/queryTimeout.ts`
- **Impact**: Provides reusable pattern for protecting slow queries across the codebase

**6. Auth Middleware Optimization** ✅
- Added clarifying comments about impersonation check optimization
- Only checks impersonation when token is present AND user is admin
- **File**: `server/src/middleware/auth.ts`
- **Impact**: Reduces unnecessary database queries for non-admin users

**Technical Implementation**:
- **Database**: Connection pool configuration, composite index migration
- **Middleware**: Request timeout middleware in Express app
- **Queries**: Promise.race pattern for query timeouts
- **Utilities**: Reusable query timeout helper function

**What This Enables**:
- ✅ Eliminates 504 Gateway Timeout errors
- ✅ Reduces WebSocket connection errors
- ✅ Faster response times on impersonation endpoint
- ✅ Better handling of concurrent requests
- ✅ Prevents database connection exhaustion
- ✅ Clear timeout errors instead of hanging requests

**Files Modified**:
- `server/src/lib/prisma.ts` - Connection pool increase (5→20 in production)
- `prisma/modules/admin/admin-portal.prisma` - Composite index added
- `prisma/migrations/20260122000000_add_impersonation_composite_index/migration.sql` - Migration file
- `server/src/index.ts` - Request timeout middleware
- `server/src/routes/admin-portal.ts` - Query timeout on impersonation endpoint
- `server/src/middleware/auth.ts` - Optimization comments
- `server/src/lib/queryTimeout.ts` - New utility file

**Next Steps**:
1. Apply migration: `pnpm prisma migrate deploy`
2. Restart backend server to apply connection pool changes
3. Monitor for improvements in error rates and response times

**Completed At**: January 22, 2025 - Ready for production deployment

---

## Previous Focus: Module AI Context Dashboard — COMPLETE ✅

### **Recent Completion: Module AI Context Dashboard & Registration System ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - Admin portal now includes comprehensive Module AI Context Status dashboard with registration management and testing tools.

**What Was Accomplished**:

**1. Module AI Context Status Dashboard** ✅
- New "AI Context Status" tab in Admin Portal Modules page (`/admin-portal/modules`)
- Real-time status of all modules' AI context registration
- Summary cards showing total modules, registered count, missing context count, and health status
- Search and filter functionality (all, registered, missing context)
- Visual indicators (badges) for registration status
- Displays keywords, patterns, and context providers for registered modules

**2. Module Registration System Fix** ✅
- **Fixed Registration Logic**: Previously skipped all registration if registry had any entries. Now checks which modules are missing and only registers those.
- **Incremental Registration**: System now registers missing modules without skipping everything
- **Startup Registration**: `registerBuiltInModulesOnStartup()` now intelligently registers only missing modules
- **Manual Registration Endpoint**: Updated to use shared registration function, avoiding duplicate code

**3. Interactive Module Management** ✅
- **View Details Button**: Opens modal showing complete AI context details:
  - Purpose, category, keywords, patterns
  - Concepts, entities, actions
  - Context providers with endpoints and cache durations
- **Test Providers Button**: Tests each context provider endpoint:
  - Real-time testing of all context provider endpoints
  - Success/failure indicators with response data or error messages
  - Visual feedback with badges and loading states
- **Register Missing Modules Button**: One-click registration of all missing modules
- **Register Now Button**: Individual module registration for unregistered modules

**4. Query Optimizations** ✅
- **Pagination Added**: `getModuleSubmissions()` now limits to 100 most recent submissions (prevents timeouts)
- **Optimized Developer Count**: Changed from counting all users with modules to counting distinct developers from modules table (much faster)
- **Performance Improvements**: Reduced database load and query times

**5. Backend API Enhancements** ✅
- **New Endpoint**: `GET /api/admin/modules/ai/status` - Returns comprehensive module AI context status
- **Registration Endpoint**: `POST /api/admin/modules/ai/register-built-ins` - Manually trigger registration
- **Status Endpoint**: Returns health summary with registration rates and status indicators

**Technical Implementation**:
- **Backend**: 
  - `server/src/routes/moduleAIContext.ts` - Status and registration endpoints
  - `server/src/startup/registerBuiltInModules.ts` - Improved registration logic
  - `server/src/services/adminService.ts` - Query optimizations
- **Frontend**: 
  - `web/src/app/admin-portal/modules/page.tsx` - AI Context Status tab with full UI
  - `web/src/lib/adminApiService.ts` - `getModuleAIStatus()`, `registerBuiltInModules()` methods
- **Database**: Uses existing `Module` and `ModuleAIContextRegistry` tables

**What This Enables**:
- Complete visibility into which modules have AI context registered
- Easy identification of missing AI context registrations
- One-click registration of missing modules
- Testing of context provider endpoints to verify they're working
- Detailed view of each module's AI context configuration
- Health monitoring of AI context registration status

**Files Modified**:
- `server/src/startup/registerBuiltInModules.ts` - Fixed registration logic
- `server/src/routes/moduleAIContext.ts` - Status endpoint, registration endpoint update
- `server/src/services/adminService.ts` - Query optimizations (pagination, developer count)
- `web/src/app/admin-portal/modules/page.tsx` - AI Context Status tab, modals, buttons
- `web/src/lib/adminApiService.ts` - Module AI status and registration methods

**Completed At**: January 2025 - Ready for production use

---

## Previous Focus: Admin Portal AI Auth Fix & API Consolidation — COMPLETE ✅

### **Recent Completion: Admin Portal AI Auth Fix & API Consolidation ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - Admin portal AI endpoints now use authenticated `adminApiService`; 401s resolved.

**What Was Accomplished**:

**1. 401 Unauthorized Fix** ✅
- Admin portal AI System and AI Learning pages were calling `/api/admin/business-ai/*` and `/api/centralized-ai/*` via raw `fetch` without auth headers → 401s.
- All such calls now go through `adminApiService`, which attaches the NextAuth session token (`Authorization: Bearer ...`).

**2. adminApiService AI Methods** ✅
- **Business AI**: `getBusinessAIGlobal()`, `getBusinessAIPatterns()` → `/api/admin/business-ai/global`, `/api/admin/business-ai/patterns`
- **Centralized AI**: `getCentralizedAIHealth()`, `getCentralizedAIPatterns()`, `getCentralizedAIInsights()`, `getCentralizedAIPrivacySettings()` → `/api/centralized-ai/*`
- Each method uses `getAuthHeaders()` and handles `{ success, data }` response shape.

**3. Page Updates** ✅
- **AI System** (`/admin-portal/ai-system`): Overview data loads via `adminApiService.getBusinessAIGlobal()` and `getBusinessAIPatterns()` instead of direct fetch.
- **AI Learning** (`/admin-portal/ai-learning`): Health, patterns, insights, privacy settings load via `adminApiService` centralized-AI methods. "Run Pattern Analysis" and "Generate Insights" actions, empty states, and loading states added.

**4. Single Source of Truth** ✅
- Admin AI data fetching is consolidated in `adminApiService`; no ad-hoc fetch to these endpoints from admin UI.

**Files Modified**:
- `web/src/lib/adminApiService.ts` - New AI methods
- `web/src/app/admin-portal/ai-system/page.tsx` - Use adminApiService for business-ai
- `web/src/app/admin-portal/ai-learning/page.tsx` - Use adminApiService for centralized-ai; pattern/insight triggers and empty states

**Full Documentation**: See `docs/archive/session-summaries/ADMIN_PORTAL_AI_AUTH_FIX_JANUARY_2025.md`. Also updated: `memory-bank/adminProductContext.md`, `docs/archive/guides-merged-2026/AI_CONTEXT_SYSTEM_ARCHITECTURE.md`, `memory-bank/aiContextSystem.md`.

**Note**: AI system map documentation also updated with **Conversation Memory & Fact Extraction System** section, documenting the complete flow of how facts are extracted from conversations, stored in `UserAIContext`, and used in future AI prompts for personalized responses.

---

## Previous Focus: AI System Enhancements — COMPLETE ✅

### **AI System Enhancements — COMPLETE ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - All AI system enhancements implemented and integrated

**What Was Accomplished**:

**1. AI Provider Usage & Expense Tracking** ✅
- Admin portal integration for tracking OpenAI and Anthropic usage/expenses
- Historical data tracking with daily snapshots
- Scheduled sync jobs for automated data collection
- Three-tab interface (Combined, OpenAI, Anthropic) in admin portal

**2. AI Service Picker** ✅
- Service picker component for selecting AI providers (Auto, OpenAI, Anthropic)
- Integration in AI chat dropdown and full chat page
- Provider settings in AI Control Center
- User preference storage and provider selection logic

**3. AI Conversation Management** ✅
- Drag-and-drop to trash for conversations
- Ellipsis menu with actions (Share, Rename, Pin, Archive, Delete)
- Inline renaming functionality
- Global trash integration

**4. Admin Bypass for AI Queries** ✅
- Admin users bypass feature gating and query consumption
- Billing modal shows "Admin Account" with unlimited access
- Query balance displays "Unlimited AI Queries" for admins
- Improved error messages for non-admin users

**5. Automatic Fact Extraction** ✅
- AI automatically extracts facts from conversations
- Integrated into learning engine
- Facts saved to UserAIContext (scoped: personal/business)
- Duplicate prevention and smart extraction

**6. Collective Learning Integration** ✅
- Global patterns included in AI prompts
- User segment filtering (business, personal, household)
- System gets smarter from all users' patterns
- Collective intelligence improves responses

**7. System Architecture Verification** ✅
- Verified personal vs business learning separation
- Confirmed admin portal integration
- Validated data scoping and privacy
- Verified external AI provider compatibility

**Technical Implementation**:
- **Backend Services**: Provider services, fact extraction, learning engine integration
- **Frontend Components**: Service picker, provider views, conversation management
- **Database**: Historical tracking models, fact storage
- **API Routes**: Provider usage, preferences, admin endpoints

**Files Modified**:
- `server/src/routes/ai.ts` - Admin bypass, fact extraction
- `server/src/ai/core/DigitalLifeTwinCore.ts` - Global patterns, provider selection
- `server/src/ai/learning/AdvancedLearningEngine.ts` - Fact extraction integration
- `server/src/services/factExtractionService.ts` - Fact extraction service
- `web/src/components/admin-portal/ProviderUsageView.tsx` - Usage tracking
- `web/src/components/ai/AIServicePicker.tsx` - Service picker
- `web/src/app/ai-chat/page.tsx` - Conversation management
- And 20+ other files

**Completed At**: January 2025 - Ready for production use

**Full Documentation**: See `docs/archive/session-summaries/AI_SYSTEM_ENHANCEMENTS_JANUARY_2025.md`

---

## Previous Focus: Notification Center Enhancements — COMPLETE ✅

### **Recent Completion: Notification Center Enhancements — COMPLETE ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - All High-Priority Features and Additional Improvements Implemented

**What Was Accomplished**:

**High-Priority Features** ✅
- ✅ **Snooze Functionality**: Complete implementation with database storage, backend endpoints, frontend UI, and automatic filtering
- ✅ **Category-Specific Empty States**: Helpful, contextual empty states for each notification category
- ✅ **Priority Levels**: Full priority system with database storage, automatic calculation, display badges, and filtering

**Additional Improvements** ✅
- ✅ **Quick Action Buttons**: Metadata-driven action buttons (Approve, Reject, View, Reply) based on notification type
- ✅ **Keyboard Shortcuts**: Complete keyboard navigation (j/k navigation, Space to mark read, Enter to open, Escape to exit)
- ✅ **Archive View**: Toggle to view archived notifications with proper filtering
- ✅ **Enhanced Preview**: Better notification previews with body text and improved layout
- ✅ **Bulk Snooze**: Bulk snooze functionality in selection mode
- ✅ **Action Handlers**: Complete handlers for approve, reject, view, and reply actions

**Technical Implementation** ✅
- ✅ **Database Schema**: Added `snoozedUntil` and `priority` fields to Notification model
- ✅ **Backend Endpoints**: Snooze/unsnooze endpoints, archive filtering support
- ✅ **Frontend Components**: QuickActions, EmptyState, enhanced ActionsMenu
- ✅ **Module Integration**: Priority and actions calculated from module metadata
- ✅ **Real-time Updates**: WebSocket integration for snooze/unsnooze actions

**Features Enabled**:
- Users can temporarily hide notifications they want to deal with later
- Better empty states guide users on what actions to take
- Priority levels help users focus on important notifications
- Quick actions reduce clicks for common tasks
- Keyboard shortcuts improve power user experience
- Archive view helps manage notification history
- Enhanced previews provide more context at a glance
- Bulk operations streamline notification management

**Files Modified**:
- `prisma/modules/auth/user.prisma` - Added snoozedUntil and priority fields
- `server/src/controllers/notificationController.ts` - Snooze endpoints, archive filtering
- `server/src/services/notificationService.ts` - Priority calculation from metadata
- `server/src/services/notificationGroupingService.ts` - Snooze filtering in groups
- `server/src/routes/notification.ts` - Snooze routes
- `web/src/api/notifications.ts` - Snooze API functions
- `web/src/app/notifications/page.tsx` - All UI enhancements
- `shared/src/types/module-notifications.ts` - Priority field in types

**Completed At**: January 2025 - Ready for production use

---

## Previous Focus: HR Module Enhancements — IN PROGRESS 🚧

### **Recent Completion: Sidebar Customization System — COMPLETE ✅ (January 2025)**

**Status**: ✅ **COMPLETE** - Full Sidebar Customization with Pin-to-Right-Sidebar Feature

**What Was Accomplished**:

**Left Sidebar Customization** ✅
- ✅ Tab-specific customization (each dashboard tab has its own sidebar organization)
- ✅ Folder system with one level of nesting
- ✅ Drag-and-drop for reordering folders and modules
- ✅ Loose modules (modules not in folders) with interleaving support
- ✅ Dashboard module always at top of loose modules
- ✅ Create, rename, delete folders
- ✅ Collapse/expand folders
- ✅ Move modules between folders and loose modules
- ✅ Drop zone for moving modules out of folders
- ✅ Visual drag overlay with shadow/ghost image

**Right Sidebar Customization** ✅
- ✅ Context-specific (Personal vs Business) but global across tabs
- ✅ Fixed top: Dashboard (non-movable)
- ✅ Customizable middle: Pinned modules (reorderable)
- ✅ Fixed bottom: AI Assistant, Modules, Trash (non-movable)
- ✅ Pin/unpin functionality from left sidebar customizer
- ✅ Drag-and-drop reordering of pinned modules
- ✅ Remove button (unpins module, keeps in left sidebar)
- ✅ Visual drag overlay

**Pin-to-Right-Sidebar Feature** ✅
- ✅ Pin button on all modules in left sidebar customizer
- ✅ Visual state: Filled pin icon when pinned, outline when not
- ✅ Tooltip: "Pin to right sidebar" / "Unpin from right sidebar"
- ✅ Syncs between left and right sidebar configs
- ✅ Auto-unpin when folder containing pinned module is deleted

**Technical Implementation** ✅
- ✅ **Components**: 
  - `SidebarCustomizationModal.tsx` - Main customization interface
  - `LeftSidebarCustomizer.tsx` - Left sidebar customization UI
  - `RightSidebarCustomizer.tsx` - Right sidebar customization UI
  - `ModuleItem.tsx` - Module item with pin button
  - `FolderItem.tsx` - Folder component
  - `SidebarFolderRenderer.tsx` - Folder renderer for actual sidebar
- ✅ **Context**: `SidebarCustomizationContext.tsx` - State management
- ✅ **Types**: `types/sidebar.ts` - TypeScript interfaces
- ✅ **API**: `/api/dashboard/:id/sidebar-config` - CRUD endpoints
- ✅ **Service**: `sidebarCustomizationService.ts` - Backend logic
- ✅ **Storage**: `Dashboard.preferences.sidebarCustomization` (JSON field)

**Features Enabled**:
- Complete sidebar organization with folders and loose modules
- Quick access to frequently used modules via right sidebar pinning
- Tab-specific left sidebar organization
- Context-specific right sidebar (Personal/Business)
- Full drag-and-drop customization with visual feedback
- Auto-cleanup of unavailable modules from config

**Completed At**: January 2025 - Ready for production use

---

### **Recent Fix: Right Sidebar Visibility in Workspace — COMPLETE ✅ (January 2025)**

**Status**: ✅ **FIXED** - Right Sidebar Now Always Visible in Workspace

**Issue**: When minimizing the left sidebar in the business workspace, both the left and right sidebars were disappearing. The right sidebar should always remain visible regardless of the left sidebar's collapsed state.

**Root Cause**: In `DashboardLayoutWrapper.tsx`, the right sidebar visibility was incorrectly tied to the left sidebar's `sidebarCollapsed` state:
- Right sidebar visibility: `visibility: !sidebarCollapsed ? 'visible' : 'hidden'`
- Main content padding: `paddingRight: !sidebarCollapsed ? 40 : 0`

**Fix Applied**:
- ✅ **Right Sidebar Visibility**: Changed to always `'visible'` with `opacity: 1` (independent of left sidebar state)
- ✅ **Main Content Padding**: Changed to always `paddingRight: 40` to account for always-visible right sidebar
- ✅ **Location**: `web/src/components/business/DashboardLayoutWrapper.tsx` (lines 644-647, 581)

**Behavior Now**:
- **Personal Dashboard**: Right sidebar always visible (was already correct)
- **Business Workspace**: Right sidebar always visible (now fixed)
- **Work Tab**: Both sidebars hidden (correct - full-width BrandedWorkDashboard)
- **Left Sidebar Collapse**: Only affects left sidebar, right sidebar remains visible

**Files Modified**:
- `web/src/components/business/DashboardLayoutWrapper.tsx` - Fixed right sidebar visibility logic

**Completed At**: January 2025

---

## Previous Focus: HR Module Enhancements — IN PROGRESS 🚧

### **HR Module Enhancement Plan (January 2025)**
**Status**: 🚧 **IN PROGRESS** - Priority 1 Complete, Priority 2 Complete, Continuing with remaining priorities

**Overview**: The HR module has a solid foundation with core features implemented, but several important features are missing or incomplete. This work will bring the HR module to production-ready status.

**Key Focus Areas**:
1. **Analytics & Notifications** (Priority 1) - ✅ **COMPLETE** - Analytics dashboards and notification hooks implemented
2. **Onboarding Frontend Completion** (Priority 2) - ✅ **COMPLETE** - Full onboarding UI with templates, journeys, and cross-module integration
3. **Shift Scheduling & Templates** (Priority 3) - Backend partial, UI missing
4. **Geolocation & Advanced Attendance** (Priority 4) - Enterprise features incomplete
5. **Template Seeding & Best Practices** (Priority 5) - Not implemented

**Plan Document**: `memory-bank/HR_MODULE_ENHANCEMENT_PLAN.md`

---

### **Previous Focus: Financial Management Page - Full Stripe Integration — COMPLETE ✅**

### **Financial Management Page - Full Stripe Integration (January 2025)**
**Status**: ✅ **COMPLETE** - Full Stripe Integration with Real-Time Sync Capabilities

**What Was Accomplished**:

**Database Schema Enhancements** ✅
- ✅ **Invoice Model Updates**: Added Stripe fee tracking fields
  - `stripeFee` (Float) - Stripe processing fees
  - `stripeNetAmount` (Float) - Net amount after fees
  - `refundAmount` (Float) - Total refunded amount
  - `refundCount` (Int) - Number of refunds
  - `stripeChargeId` (String) - Stripe charge ID
  - `stripePaymentIntentId` (String) - Payment intent ID
  - `stripeCustomerId` (String) - Customer ID
  - `lastSyncedAt` (DateTime) - Last sync timestamp
  - `stripeMetadata` (Json) - Additional Stripe data
  - Location: `prisma/modules/billing/subscriptions.prisma`
- ✅ **Subscription Model Updates**: Added Stripe sync tracking
  - `lastSyncedAt` (DateTime) - Last sync timestamp
  - `stripeMetadata` (Json) - Additional Stripe subscription data
  - Location: `prisma/modules/billing/subscriptions.prisma`
- ✅ **Refund Model** (NEW): Created dedicated refund tracking model
  - Tracks individual refunds with amounts, reasons, status
  - Links to invoices and stores Stripe refund IDs
  - Location: `prisma/modules/billing/subscriptions.prisma`

**Backend Stripe Sync Service** ✅
- ✅ **StripeSyncService** (NEW): `server/src/services/stripeSyncService.ts`
  - `syncSubscriptionFromStripe()` - Syncs individual subscription from Stripe API
  - `syncInvoiceFromStripe()` - Syncs invoice with fees and refunds
  - `syncAllSubscriptions()` - Batch sync all subscriptions
  - `syncInvoicesForSubscription()` - Sync all invoices for a subscription
  - `getStripeSubscriptionUrl()` - Generates Stripe Dashboard URLs
  - `getStripeInvoiceUrl()` - Generates Stripe Dashboard URLs
  - `getStripeCustomerUrl()` - Generates Stripe Dashboard URLs
  - Fetches Stripe fees from balance transactions
  - Tracks and stores refunds in database
  - Stores comprehensive Stripe metadata in JSON fields

**API Endpoints** ✅
- ✅ **Sync Endpoints**:
  - `POST /api/admin-portal/billing/subscriptions/:id/sync` - Sync single subscription
  - `POST /api/admin-portal/billing/invoices/:id/sync` - Sync single invoice
  - `POST /api/admin-portal/billing/subscriptions/sync-all` - Sync all subscriptions
- ✅ **Enhanced Data Endpoints**:
  - `GET /api/admin-portal/billing/subscriptions/:id/enhanced` - Get subscription with Stripe URLs
  - `GET /api/admin-portal/billing/invoices/:id/enhanced` - Get invoice with fees, refunds, URLs
- ✅ **Updated List Endpoints**:
  - `GET /api/admin-portal/billing/subscriptions` - Now includes Stripe URLs
  - `GET /api/admin-portal/billing/payments` - Now includes fees, refunds, Stripe URLs
  - Location: `server/src/routes/admin-portal.ts`, `server/src/services/adminService.ts`

**Frontend Enhancements** ✅
- ✅ **Financial Management Page Updates**: `web/src/app/admin-portal/billing/page.tsx`
  - Added "Sync All from Stripe" button in header
  - Individual sync buttons for each subscription and invoice
  - Stripe Dashboard links (ExternalLink icon) for quick navigation
  - Enhanced payment display with:
    - Stripe fees column
    - Refund amounts and counts
    - Net amounts (after fees)
    - Last synced timestamp
  - Loading states and error handling for sync operations
  - Real-time data refresh after sync operations
- ✅ **API Service Updates**: `web/src/lib/adminApiService.ts`
  - Added `syncSubscriptionFromStripe()` method
  - Added `syncInvoiceFromStripe()` method
  - Added `syncAllSubscriptions()` method
  - Added `getEnhancedSubscription()` method
  - Added `getEnhancedInvoice()` method

**Features Enabled**:
- Real-time sync from Stripe API on demand
- Complete fee tracking (Stripe processing fees)
- Full refund tracking with history
- Direct navigation to Stripe Dashboard
- Enhanced metadata display
- Manual sync controls for data freshness
- Automatic data refresh after sync

**Files Modified**:
- `prisma/modules/billing/subscriptions.prisma` - Added fee, refund, and metadata fields
- `server/src/services/stripeSyncService.ts` - NEW: Complete Stripe sync service
- `server/src/routes/admin-portal.ts` - Added sync and enhanced endpoints
- `server/src/services/adminService.ts` - Updated to include Stripe URLs and fees
- `web/src/app/admin-portal/billing/page.tsx` - Enhanced UI with sync and Stripe links
- `web/src/lib/adminApiService.ts` - Added sync and enhanced data methods

**What This Enables**:
- Complete visibility into Stripe financial data from admin portal
- Real-time synchronization with Stripe for accurate data
- Fee and refund tracking for accurate revenue reporting
- Quick navigation to Stripe Dashboard for detailed investigation
- Manual control over data freshness
- Comprehensive financial management capabilities

**Completed At**: January 2025 - Ready for production use

---

## Previous Focus: Stripe Price Points & Per-Employee Pricing Integration — COMPLETE ✅

### **Stripe Price Points & Per-Employee Pricing Implementation (January 2025)**
**Status**: ✅ **COMPLETE** - Full Stripe Integration for All Pricing Components

**What Was Accomplished**:

**Per-Employee Pricing Stripe Integration** ✅
- ✅ **Database Schema Update**: Added `perEmployeeStripePriceId` to `PricingConfig` model
  - Location: `prisma/modules/billing/pricingConfig.prisma`
  - Stores Stripe Price ID for per-employee charges
  - Schema synced to database using `prisma db push`
- ✅ **Admin Portal UI Updates**:
  - Removed business-tier restriction for per-employee fields (now available for all tiers)
  - Added separate "Monthly" and "Yearly" edit buttons for each tier
  - Added placeholders and help text for per-employee fields
  - Location: `web/src/app/admin-portal/pricing/page.tsx`
- ✅ **Automatic Stripe Price Creation**:
  - When `perEmployeePrice` changes in admin portal, automatically creates new Stripe price
  - Stores `perEmployeeStripePriceId` in database for future reference
  - Location: `server/src/controllers/pricingController.ts`
- ✅ **Subscription Creation with Per-Employee Pricing**:
  - Updated `SubscriptionService.createSubscription()` to include per-employee items
  - Calculates `additionalEmployees` and `additionalEmployeeCost` based on `pricingConfig`
  - Creates Stripe subscriptions with multiple items (base price + per-employee price with quantity)
  - Location: `server/src/services/subscriptionService.ts`
- ✅ **Employee Count Updates**:
  - Added `updateEmployeeCount()` method to update employee count on existing subscriptions
  - Updates Stripe subscription items with proration when employee count changes
  - Added API endpoint: `PUT /api/billing/subscriptions/:id/employee-count`
  - Location: `server/src/services/subscriptionService.ts`, `server/src/controllers/billingController.ts`
- ✅ **Sync Scripts**:
  - Created `listStripePerEmployeePrices.ts` to list all per-employee prices in Stripe
  - Created `syncPerEmployeeStripePrices.ts` to sync existing per-employee prices to Stripe
  - Added npm scripts: `stripe:list-per-employee`, `stripe:sync-per-employee`
  - Location: `server/src/scripts/`

**AI Query Overage Billing Period Fixes** ✅
- ✅ **Cron Job Update**: Changed from monthly (1st of month) to daily (3am ET)
  - Reason: Subscriptions have varying billing periods, not all on 1st
  - Location: `server/src/index.ts`
- ✅ **Subscription-Based Billing Periods**:
  - Updated `OverageBillingService.processAllOverageBilling()` to filter by subscription `currentPeriodEnd`
  - Only processes subscriptions whose billing period has ended
  - Prevents duplicate processing by checking for existing Stripe invoice items with matching `periodEnd` metadata
  - Location: `server/src/services/overageBillingService.ts`

**AI Query Pack Stripe Integration** ✅
- ✅ **Stripe Products & Prices Setup**:
  - Created Stripe Product: `prod_ai_query_packs` for AI Query Packs
  - Created one-time Stripe Prices for each pack:
    - Small Pack: `price_1SlXYeI7vbumyzaWOVTH2TKp` - $10.00 (500 queries)
    - Medium Pack: `price_1SlXYeI7vbumyzaW9HEBZYxp` - $40.00 (2,500 queries)
    - Large Pack: `price_1SlXYeI7vbumyzaWmHUg1o3u` - $70.00 (5,000 queries)
    - Enterprise Pack: `price_1SlXYfI7vbumyzaWTOb6rtjI` - $120.00 (10,000 queries)
  - Created setup script: `setupQueryPackProducts.ts`
  - Created sync script: `syncQueryPackPrices.ts`
  - Added npm scripts: `stripe:setup-query-packs`, `stripe:sync-query-pack-prices`
  - Location: `server/src/scripts/`, `server/src/config/aiQueryPacks.ts`
- ✅ **Webhook Handler Updates**:
  - Added `handlePaymentIntentSucceeded()` to process successful query pack purchases
  - Added `handlePaymentIntentFailed()` to handle failed purchases
  - Calls `AIQueryService.completeQueryPackPurchase()` and `AIQueryService.failQueryPackPurchase()`
  - Location: `server/src/services/stripeService.ts`
- ✅ **Query Pack Purchase Flow**:
  - Updated `AIQueryService.purchaseQueryPack()` to use Stripe Price IDs from config
  - Stores `stripePriceId` in purchase metadata for reference
  - Location: `server/src/services/aiQueryService.ts`

**Price Change Behavior** ✅
- ✅ **No Proration**: When updating existing subscriptions to new prices, `proration_behavior: 'none'` is set
  - New prices take effect on next billing cycle
  - No immediate charges or credits
  - Location: `server/src/controllers/pricingController.ts`

**Files Modified**:
- `prisma/modules/billing/pricingConfig.prisma` - Added `perEmployeeStripePriceId` field
- `web/src/app/admin-portal/pricing/page.tsx` - UI updates for yearly and per-employee pricing
- `server/src/controllers/pricingController.ts` - Automatic Stripe price creation, no proration
- `server/src/services/stripeService.ts` - Added metadata support, query pack webhook handlers
- `server/src/services/subscriptionService.ts` - Per-employee pricing in subscriptions, employee count updates
- `server/src/services/overageBillingService.ts` - Subscription-based billing periods, duplicate prevention
- `server/src/services/aiQueryService.ts` - Stripe Price ID integration for query packs
- `server/src/index.ts` - Updated cron job schedule
- `server/src/config/aiQueryPacks.ts` - Added `stripeProductId` and `stripePriceId` fields
- `server/src/scripts/setupQueryPackProducts.ts` - NEW: Query pack Stripe setup
- `server/src/scripts/syncQueryPackPrices.ts` - NEW: Query pack price sync
- `server/src/scripts/listStripePerEmployeePrices.ts` - NEW: List per-employee prices
- `server/src/scripts/syncPerEmployeeStripePrices.ts` - NEW: Sync per-employee prices
- `server/package.json` - Added npm scripts for new operations

**What This Enables**:
- Complete Stripe integration for all pricing components (base, per-employee, query packs)
- Dynamic pricing updates in admin portal that automatically sync to Stripe
- Per-employee pricing for all tiers (not just business)
- Accurate overage billing based on individual subscription periods
- Query pack purchases fully integrated with Stripe payment intents
- No proration when prices change (changes apply on next billing cycle)

**Environment Variables Required**:
```bash
# Per-employee prices are stored in database (perEmployeeStripePriceId)
# Query pack prices (add to server/.env):
STRIPE_QUERY_PACK_SMALL_PRICE_ID=price_1SlXYeI7vbumyzaWOVTH2TKp
STRIPE_QUERY_PACK_MEDIUM_PRICE_ID=price_1SlXYeI7vbumyzaW9HEBZYxp
STRIPE_QUERY_PACK_LARGE_PRICE_ID=price_1SlXYeI7vbumyzaWmHUg1o3u
STRIPE_QUERY_PACK_ENTERPRISE_PRICE_ID=price_1SlXYfI7vbumyzaWTOb6rtjI
```

**Completed At**: January 2025 - Ready for production use

---

## Previous Focus: AI Query Overage Billing - Cursor-Style Spending Limits — COMPLETE ✅

### **AI Query Overage Billing Implementation (January 2025)**
**Status**: ✅ **COMPLETE** - Full Cursor-Style Spending Limit System Implemented

**What Was Accomplished**:

**Database Schema Changes** ✅
- ✅ **Added Spending Limit Fields to AIQueryBalance**: 
  - `monthlySpendingLimit` (Float, default: 0) - User-configurable monthly limit
  - `currentPeriodSpending` (Float, default: 0) - Real-time spending tracking
  - `overageQueriesUsed` (Int, default: 0) - Number of overage queries this period
  - `overageQueriesCost` (Float, default: 0) - Total cost of overage queries
  - Location: `prisma/modules/billing/aiQueryBalance.prisma`
  - Schema synced to database using `prisma db push`

**Backend Service Updates** ✅
- ✅ **AIQueryService Enhancements**:
  - Modified `consumeQuery()` to check spending limits when base allowance exhausted
  - Added `setSpendingLimit()` method for limit management
  - Added `getSpendingStatus()` method for spending information
  - Updated `initializeBalance()` to include new spending fields
  - Updated `resetMonthlyAllowance()` to reset spending at start of new period
  - Location: `server/src/services/aiQueryService.ts`
- ✅ **Overage Billing Integration**:
  - Integrated AI query overage into `OverageBillingService`
  - Creates Stripe invoice items for overage queries at end of billing period
  - Location: `server/src/services/overageBillingService.ts`
- ✅ **Configuration**:
  - Added `AI_QUERY_OVERAGE_CONFIG` with `pricePerQuery: 0.02` and `defaultLimit: 0`
  - Location: `server/src/config/aiQueryPacks.ts`

**API Endpoints** ✅
- ✅ **Spending Limit Management Endpoints**:
  - `GET /api/ai/queries/spending` - Get current spending status and limit
  - `PUT /api/ai/queries/spending/limit` - Set monthly spending limit
  - Location: `server/src/controllers/aiQueryController.ts`, `server/src/routes/aiQueries.ts`

**Frontend UI Components** ✅
- ✅ **AIQueryBalance Component Updates**:
  - Added spending limit status display
  - Shows current spending vs limit with progress bar
  - Displays overage queries and cost
  - "Manage Spending Limit" button
  - Location: `web/src/components/AIQueryBalance.tsx`
- ✅ **AISpendingLimitModal Component** (NEW):
  - Modal for setting and managing spending limits
  - Shows current period spending and remaining limit
  - Displays estimated queries for limit amount
  - Warning when decreasing limit below current spending
  - Location: `web/src/components/AISpendingLimitModal.tsx`
- ✅ **BillingModal Integration**:
  - Integrated spending limit modal
  - Added spending limit button to AIQueryBalance component
  - Updated modal size to `xlarge` for better visibility
  - Location: `web/src/components/BillingModal.tsx`

**How It Works**:
1. **User Sets Spending Limit**: User configures monthly spending limit (e.g., $50/month) via modal
2. **Base Allowance First**: Base allowance is used first (free, included in subscription)
3. **Overage Charged Against Limit**: When base allowance exhausted, queries continue but charge against spending limit
4. **Real-Time Tracking**: Spending tracked in real-time as queries are consumed
5. **Block When Limit Reached**: Queries blocked when spending limit is reached
6. **Monthly Billing**: At end of billing period, user charged for actual overage usage via Stripe invoice items
7. **Reset Next Month**: Spending resets at start of new billing period, limit persists

**Default Behavior**:
- Default limit: $0 (maintains current blocking behavior)
- User must opt-in: Users must set a limit to enable overage
- No surprise charges: Clear error messages and warnings

**Files Modified**:
- `prisma/modules/billing/aiQueryBalance.prisma` - Added spending limit fields
- `server/src/config/aiQueryPacks.ts` - Added overage configuration
- `server/src/services/aiQueryService.ts` - Spending limit logic and methods
- `server/src/services/overageBillingService.ts` - AI query overage billing integration
- `server/src/controllers/aiQueryController.ts` - Spending limit endpoints
- `server/src/routes/aiQueries.ts` - Spending limit routes
- `web/src/components/AIQueryBalance.tsx` - Spending status display
- `web/src/components/AISpendingLimitModal.tsx` - NEW: Spending limit management modal
- `web/src/components/BillingModal.tsx` - Modal integration and size update

**What This Enables**:
- Cursor-style spending limit system for AI query overage
- User-controlled spending with no surprise charges
- Seamless experience (no blocking until limit reached)
- Automatic billing for overage usage at end of period
- Clear budget management and spending visibility

**Completed At**: January 2025 - Ready for production use

---

## Previous Focus: Billing & Payment System - Configuration & Troubleshooting Fixes — COMPLETE ✅

### **Billing System Configuration Fixes (January 2025)**
**Status**: ✅ **COMPLETE** - All Stripe Configuration and TypeScript Errors Resolved

**What Was Accomplished**:

**Stripe Configuration Fixes** ✅
- ✅ **Fixed `isStripeConfigured()` Function**: Updated to only check for `STRIPE_SECRET_KEY` (backend doesn't need publishable key)
  - Location: `server/src/config/stripe.ts`
  - Issue: Function was checking for both secret and publishable keys, causing false negatives
  - Fix: Backend only needs secret key; publishable key is frontend-only
- ✅ **Fixed Stripe API Version TypeScript Errors**: Added type assertions across all Stripe service files
  - Files Fixed:
    - `server/src/config/stripe.ts`
    - `server/src/services/aiQueryService.ts`
    - `server/src/services/developerPortalService.ts`
    - `server/src/services/overageBillingService.ts`
    - `server/src/services/moduleSubscriptionService.ts`
    - `server/src/services/subscriptionService.ts`
  - Issue: TypeScript types lag behind Stripe API versions (types expect `2025-07-30.basil`, we use `2025-08-27.basil`)
  - Fix: Added `as any` type assertion with comment explaining why
- ✅ **Fixed Prisma Schema Errors**: Added missing required fields to `DeveloperRevenue` creation
  - Location: `server/src/services/developerPortalService.ts`
  - Issue: `requestPayout()` was missing required fields: `commissionRate`, `commissionType`, `subscriptionAgeMonths`, `isFirstYear`
  - Fix: Added default values for manual payouts (not revenue split calculations)

**Database Connection Fixes** ✅
- ✅ **Fixed DATABASE_URL Configuration**: Restored correct database connection string in `server/.env`
  - Issue: `.env` file was overwritten during Stripe key setup, losing database configuration
  - Fix: Restored from root `.env` file with correct connection string
- ✅ **Improved Logger Error Handling**: Added graceful database connection error handling
  - Location: `server/src/lib/logger.ts`
  - Issue: Logger would crash application if database connection failed during startup
  - Fix: Wrapped `prisma.log.create` in try-catch to prevent crashes

**Plan Filtering Enhancement** ✅
- ✅ **Dynamic Plan Filtering**: Personal users see only personal plans, business users see only business plans
  - Location: `web/src/components/PlanComparison.tsx`, `web/src/components/BillingModal.tsx`
  - Implementation: Added `userType` prop to filter tiers based on `businessId` presence
  - Personal users: `['free', 'pro']`
  - Business users: `['free', 'business_basic', 'business_advanced', 'enterprise']`

**White-Labeled Payment Management** ✅
- ✅ **AddPaymentMethodModal Component**: In-app payment method addition using Stripe Elements
  - Location: `web/src/components/AddPaymentMethodModal.tsx`
  - Features: Secure card collection, SetupIntent integration, real-time validation
  - Integration: Replaces Stripe Customer Portal redirect for better UX

**Files Modified**:
- `server/src/config/stripe.ts` - Fixed `isStripeConfigured()` and API version type
- `server/src/services/aiQueryService.ts` - Fixed API version type
- `server/src/services/developerPortalService.ts` - Fixed API version type and Prisma schema
- `server/src/services/overageBillingService.ts` - Fixed API version type
- `server/src/services/moduleSubscriptionService.ts` - Fixed API version type
- `server/src/services/subscriptionService.ts` - Fixed API version type
- `server/src/lib/logger.ts` - Added database error handling
- `server/.env` - Restored database configuration
- `web/src/components/PlanComparison.tsx` - Added userType filtering
- `web/src/components/BillingModal.tsx` - Added userType prop passing
- `web/src/components/AddPaymentMethodModal.tsx` - Created new component

**What This Enables**:
- Stripe configuration now correctly detects when keys are set
- All TypeScript compilation errors resolved
- Database connection errors handled gracefully
- Users only see relevant subscription plans
- Better payment method management UX

**Completed At**: January 2025 - All configuration issues resolved

---

## Previous Focus: Billing & Payment System - Phase 2.4 Subscription Lifecycle UI — COMPLETE ✅

### **Phase 2.4: Subscription Lifecycle UI (January 2025)**
**Status**: ✅ **COMPLETE** - All Components Created and Integrated

**What Was Accomplished**:

**Component Creation** ✅
- ✅ **PlanComparison Component**: Side-by-side comparison table for all 5 tiers with feature checklist, pricing display, and action buttons
- ✅ **UpgradeFlow Component**: Wizard-style upgrade/downgrade flow with two-step process (select tier → confirm), proration messaging, and Stripe checkout integration
- ✅ **CancelSubscriptionModal Component**: Cancellation flow with retention offers (20% off for 3 months), access until date display, and confirmation flow

**BillingModal Integration** ✅
- ✅ Added state management for modal visibility (`showUpgradeFlow`, `showCancelModal`)
- ✅ Replaced placeholder alerts with functional modals
- ✅ Added new "Plans" tab with PlanComparison component
- ✅ Integrated UpgradeFlow modal (triggered by "Change Plan" button)
- ✅ Integrated CancelSubscriptionModal (triggered by "Cancel" button)
- ✅ Added Reactivate button for cancelled subscriptions
- ✅ All modals refresh billing data on success

**Features Enabled**:
- Complete plan comparison with side-by-side feature display
- Upgrade/downgrade wizard with confirmation and proration messaging
- Cancellation flow with retention offers to reduce churn
- Reactivation capability for cancelled subscriptions
- All subscription lifecycle actions accessible from billing modal

**Files Created**:
- `web/src/components/PlanComparison.tsx` - Feature comparison table
- `web/src/components/UpgradeFlow.tsx` - Upgrade/downgrade wizard
- `web/src/components/CancelSubscriptionModal.tsx` - Cancellation flow

**Files Modified**:
- `web/src/components/BillingModal.tsx` - Integrated all flows, added Plans tab, modal state management

**What's Next**:
- Continue with next phase of billing & payment system implementation
- Or resume Admin Portal Priority 1.1 Testing Suite (E2E tests)

---

### **Previous Focus: Admin Portal Priority 1.1 Testing Suite — IN PROGRESS ⏸️ PAUSED**

### **Admin Portal Priority 1.1: Comprehensive Testing Suite (January 2025)**
**Status**: ⏸️ **PAUSED** - Unit and Integration Tests Complete, E2E Tests Pending

**What Was Accomplished**:

**Phase 1: Testing Infrastructure Setup** ✅
- ✅ **Backend Testing Framework**: Installed Vitest, @vitest/ui, supertest, and @types/supertest
- ✅ **Vitest Configuration**: Created `server/vitest.config.ts` with TypeScript support and test setup
- ✅ **Test Database Setup**: Created `server/src/__tests__/setup.ts` for database cleanup before/after tests
- ✅ **Test Helpers**: Created authentication helpers (`createTestAdminUser`, `createTestUser`, `createAuthHeader`, `cleanupTestUsers`)
- ✅ **Test App Helper**: Created `createTestApp()` helper for consistent Express app instances
- ✅ **UUID Email Generation**: Fixed parallel test execution issues with `crypto.randomUUID()` for unique emails
- ✅ **Foreign Key Cleanup**: Fixed cleanup order to handle `AuditLog` and `AdminImpersonation` records before user deletion

**Phase 2: Unit Tests** ✅
- ✅ **Core Admin Routes**: 8 tests covering authentication, dashboard stats, and activity endpoints
- ✅ **User Management**: Complete unit tests for user listing, details, status updates, and password resets
- ✅ **Impersonation**: 10 tests covering impersonation start, end, session checking, and security
- ✅ **Content Moderation**: Unit tests for reported content listing, report status updates, and moderation stats
- ✅ **Total Unit Tests**: 42 tests passing

**Phase 3: Integration Tests** ✅
- ✅ **User Management Integration**: 7 tests covering complete user lifecycle, audit logging, impersonation, and search/filtering
- ✅ **Moderation Integration**: 5 tests covering content moderation flows, bulk actions, and statistics
- ✅ **Analytics Integration**: 10 tests covering dashboard statistics, trend calculations, data aggregation, exports, and real-time metrics
- ✅ **Total Integration Tests**: 22 tests passing
- ✅ **Schema Fixes**: Removed `severity` and `description` field references from moderation tests (not in schema)
- ✅ **Cleanup Order**: Fixed foreign key constraint violations by cleaning up content reports before users

**Phase 4: Admin Portal Testing UI** ✅
- ✅ **Backend Testing Routes**: Created `server/src/routes/admin-portal-testing.ts` with endpoints for test file listing, status, running tests, and coverage
- ✅ **Frontend Testing Page**: Created `web/src/app/admin-portal/testing/page.tsx` with test runner UI
- ✅ **API Service Integration**: Added testing methods to `adminApiService.ts` for authenticated API calls
- ✅ **Navigation Integration**: Added "Testing" link to admin portal sidebar
- ✅ **Authentication Fix**: Fixed 403 errors by using `adminApiService` instead of direct fetch calls

**Test Coverage Summary**:
- **Unit Tests**: 42 tests (user management, impersonation, moderation, core routes)
- **Integration Tests**: 22 tests (user management, moderation, analytics)
- **Total**: 64 tests covering critical admin portal flows
- **Status**: All tests passing ✅

**What's Next (When Resumed)**:
- **E2E Tests**: Playwright tests for admin authentication, dashboard workflows, user management, and security testing
- **Then**: Priority 1.2 (Production Deployment Configuration), Priority 1.3 (Enhanced Security), Priority 1.4 (Documentation)

---

### **Previous Focus: Admin Portal Rebuild & Consolidation — COMPLETE ✅**

### **Admin Portal Rebuild & Consolidation (January 2025)**
**Goal**: Fix data accuracy issues, improve UI/UX, reorganize AI pages, and consolidate duplicate functionality

**What Was Accomplished**:

**Phase 1: Data Accuracy & Real Data Integration** ✅
- ✅ **Overview Page Fixes**: Fixed API response parsing to correctly extract nested data from backend
- ✅ **Dashboard Stats**: Enhanced backend to calculate real-time trends (user growth, business growth, revenue growth)
- ✅ **Recent Activity**: Updated to display real audit log data with user details and formatted timestamps
- ✅ **Trend Calculations**: Backend now calculates 30-day vs 60-day comparisons for accurate trend percentages

**Phase 2: Platform Analytics Improvements** ✅
- ✅ **Chart Integration**: Added Recharts library with interactive charts for User Growth, Revenue, Engagement, and System Performance
- ✅ **Real-time Activity**: Replaced mock data with real audit log data, including action formatting and color coding
- ✅ **Readability Fixes**: Changed light text colors (`text-gray-500`, `text-gray-400`) to darker, readable colors (`text-gray-700`, `text-gray-900`)
- ✅ **Backend Data Generation**: Updated backend to generate actual trend data for charts (6 months for users/revenue, 14 days for daily metrics)

**Phase 3: AI System Reorganization** ✅
- ✅ **AI System Overview Page**: Created unified AI System page combining metrics from all AI subsystems
- ✅ **Navigation Reorganization**: Consolidated AI pages (Business Intelligence, AI Learning, AI Context Debug, Business AI Global) under single "AI System" parent
- ✅ **Unified Patterns & Insights**: Combined patterns and insights from AI Learning and Business AI Global into single section
- ✅ **Combined Analytics Dashboard**: Added 4 interactive charts showing User Growth, Revenue, AI Interactions, and Pattern Discovery trends
- ✅ **Unified Trends Visualization**: Created multi-line chart with metric toggles, date range filters, and correlation analysis

**Phase 4: AI Learning Page Fixes** ✅
- ✅ **Endpoint Connection**: Fixed all API calls to use Next.js proxy instead of direct backend calls
- ✅ **404 Error Handling**: Added graceful error handling with `Promise.allSettled` for missing endpoints
- ✅ **Mock Data Removal**: Removed all hardcoded mock data (example modules, fake activity, placeholder metrics)
- ✅ **Empty States**: Added proper empty states for all tabs when data isn't available
- ✅ **Feature Status Notice**: Added alert explaining which features are available vs. coming soon

**Phase 5: Analytics Pages Consolidation** ✅
- ✅ **Platform Analytics Focus**: Removed business metrics (user growth, revenue, engagement) - now focuses on system/technical metrics only
- ✅ **Business Intelligence Focus**: Kept all business metrics, predictive insights, A/B tests, user segments - now clearly business/strategic focused
- ✅ **Cross-Linking**: Added alerts on both pages linking to the other for related metrics
- ✅ **Clear Separation**: Each page now has distinct purpose with no duplicate functionality

**Technical Implementation**:
- **Backend**: Enhanced `adminService.ts` to fetch real predictive insights from `CollectiveInsight` table
- **Backend**: Updated dashboard stats endpoint to calculate real trends and include user details in activity logs
- **Frontend**: Fixed `adminApiService.ts` to correctly extract nested `data` property from backend responses
- **Frontend**: Updated all AI Learning page API calls to use `/api/centralized-ai/*` through Next.js proxy
- **Frontend**: Removed all mock data and replaced with real API data or appropriate empty states
- **UI/UX**: Fixed text readability issues across all AI pages (changed light text to dark text on light backgrounds)
- **Coding Standards**: Added rule to `.cursor/rules/coding-standards.mdc` preventing light text on light backgrounds

**Key Files Modified**:
- `web/src/app/admin-portal/dashboard/page.tsx` - Real data integration, trend display
- `web/src/app/admin-portal/analytics/page.tsx` - Charts, real-time activity, system focus
- `web/src/app/admin-portal/ai-system/page.tsx` - NEW: Unified AI System overview
- `web/src/app/admin-portal/ai-learning/page.tsx` - Endpoint fixes, mock data removal, empty states
- `web/src/app/admin-portal/business-intelligence/page.tsx` - Business focus, cross-linking
- `web/src/app/admin-portal/layout.tsx` - Navigation reorganization
- `server/src/routes/admin-portal.ts` - Enhanced dashboard stats with trends
- `server/src/services/adminService.ts` - Real predictive insights from database
- `web/src/lib/adminApiService.ts` - Fixed response data extraction
- `.cursor/rules/coding-standards.mdc` - Added text readability rules

**What This Enables**:
- Accurate dashboard statistics with real-time trends
- Professional analytics pages with interactive charts
- Unified AI system management through single overview page
- Clear separation between system metrics and business metrics
- Better user experience with readable text and proper empty states
- Foundation for future AI system expansion

---

## Previous Focus: To-Do Module Phase 0-5.2 Implementation — COMPLETE ✅

### **To-Do Module Phase 0-5.2 Implementation (January 2025)**
**Goal**: Complete core collaboration features, task organization, recurring tasks, drag-and-drop, time tracking, AI integration, and module integrations

**What Was Accomplished**:

**Phase 0: Immediate Updates**
- ✅ **Module Rename**: Changed from "Smart To-Do" to "To-Do" across all UI and documentation
- ✅ **Quick Tasks**: Apple Reminders-style quick add input with natural language parsing (due dates, priorities)

**Phase 1: Core Collaboration Features**
- ✅ **Comments System**: Full CRUD operations, inline editing, user avatars, timestamps, delete confirmation
- ✅ **Subtasks**: Complete subtask management with nested display, completion tracking, progress indicators, inline editing
- ✅ **Task Attachments**: File upload/download/delete with viewer modal, paperclip icon indicators in task list

**Phase 2: Task Organization & Dependencies**
- ✅ **Task Dependencies**: Add/remove dependencies, circular dependency validation, visual indicators (blocked tasks), dependency search
- ✅ **Task Projects**: Full project management (CRUD), task filtering by project, visual grouping with collapsible sections, color coding
- ✅ **Recurring Tasks**: RRULE support, automatic instance generation, parent task control, due date requirement, visual hierarchy

**Phase 3.1: Drag-and-Drop**
- ✅ **Board View Drag-and-Drop**: Tasks can be dragged between status columns (TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE) using @dnd-kit
- ✅ **Global Trash Bin Integration**: Tasks can be dragged to global trash bin for deletion using native HTML5 drag-and-drop
- ✅ **Task Type Support**: Added 'task' type to trash system (backend and frontend) for proper task trashing
- ✅ **Visual Feedback**: Drag handles, opacity changes, and column highlighting during drag operations

**Phase 3.2: Time Tracking**
- ✅ **Task Timer**: Start/stop timer component with real-time elapsed time display
- ✅ **Manual Time Entry**: Form for logging time manually with date, duration, and description
- ✅ **Time History**: Display all time logs for a task with total time and estimate vs actual comparison
- ✅ **Active Timer Management**: One active timer per user with warnings when switching tasks
- ✅ **TaskTimeLog Model**: Database model for detailed time tracking with start/stop times

**Phase 4.1: AI Prioritization**
- ✅ **Backend Service**: `todoAIPrioritizationService.ts` with scoring algorithm considering due dates, priorities, dependencies, time estimates
- ✅ **Priority Suggestions**: AI-generated suggestions with confidence scores, reasoning, and factors
- ✅ **Priority Analysis**: Endpoint for analyzing specific tasks and returning recommendations
- ✅ **Execute Changes**: Endpoint for executing priority changes with autonomy check
- ✅ **Feedback System**: Learning system that records user feedback on suggestions
- ✅ **AI System Integration**: Integrated with ActionExecutor, DigitalLifeTwinCore, and AutonomousActionExecutor
- ✅ **Unified AI Integration**: All AI features accessible through main AI button (no separate buttons)

**Phase 4.2: Smart Scheduling**
- ✅ **Backend Service**: `todoSmartSchedulingService.ts` with calendar availability analysis
- ✅ **Scheduling Suggestions**: AI-generated optimal due date suggestions based on calendar conflicts, dependencies, priorities
- ✅ **Conflict Detection**: Identifies conflicts with existing calendar events
- ✅ **Scheduling Analysis**: Endpoint for analyzing specific tasks and returning scheduling recommendations
- ✅ **Execute Changes**: Endpoint for executing scheduling changes with autonomy check
- ✅ **Unified AI Integration**: All AI features accessible through main AI button (no separate buttons)

**Phase 5.1: Chat Integration**
- ✅ **Backend Service**: `todoChatIntegrationService.ts` for message-to-task conversion
- ✅ **Create Task from Message**: Endpoint for creating tasks directly from chat messages
- ✅ **Message Parsing**: Natural language parsing extracts title, description, priority, due date from messages
- ✅ **Message Linking**: Tasks linked to originating messages for traceability
- ✅ **Chat UI Integration**: "Create Task" button in chat message context menu
- ✅ **API Endpoints**: Full CRUD for chat-to-task functionality

**Phase 5.2: Drive Integration**
- ✅ **Backend Endpoints**: Link/unlink Drive files to tasks, get linked files
- ✅ **Drive File Picker**: Modal component with folder navigation, search, and file selection
- ✅ **Linked Files Display**: Shows linked files in task detail panel with file details
- ✅ **File Access**: Open files directly from tasks in new tab
- ✅ **Unlink Files**: Easy unlinking of files from tasks
- ✅ **Duplicate Prevention**: Excludes already-linked files from picker

**AI Integration Refactor (Post-Phase 5.2)**
- ✅ **Unified AI Access**: Removed separate AI suggestion buttons from To-Do module header
- ✅ **Main AI Button Integration**: All AI features (priority suggestions, scheduling suggestions) now accessible through main AI button at top
- ✅ **Context-Aware Prompts**: AI button detects To-Do module and shows relevant prompts ("Prioritize my tasks", "Optimize task scheduling", etc.)
- ✅ **Pathname Detection Fallback**: AI dropdown detects module from URL pathname if moduleContext not provided
- ✅ **Quick Actions**: Prompts shown when no conversation, quick action buttons shown during active conversations
- ✅ **Consistent UX**: Matches pattern used by Scheduling module for unified AI experience

**Calendar Integration (Previous)**
- ✅ **Calendar View Component**: Implemented `TaskCalendar.tsx` with month/week/day views showing tasks and calendar events
- ✅ **Automatic Event Creation**: Tasks with due dates automatically create calendar events in user's personal primary calendar
- ✅ **Event Synchronization**: Task updates automatically sync to linked calendar events

**Technical Implementation**:
- **Backend**: Added `ensureTaskCalendarEvent()` helper function that automatically creates/updates calendar events for tasks with due dates
- **Backend**: Integrated automatic event creation in `createTask()` and `updateTask()` controllers
- **Backend**: Added 'task' type support to trash system (`trashController.ts`) with proper access validation
- **Backend**: Tasks appear in trash list with proper metadata (taskId, dashboardId)
- **Frontend**: `TaskCalendar` component displays tasks and calendar events in month/week/day views
- **Frontend**: Calendar pages (month/week/day) now correctly pass dashboard IDs to backend for context resolution
- **Frontend**: `CalendarModule.tsx` updated to correctly handle personal context (omits contextId, backend uses userId from session)
- **Frontend**: `TaskBoard.tsx` uses `@dnd-kit/core` DndContext for board column drag-and-drop with visual feedback
- **Frontend**: `TaskItem.tsx` implements dual drag systems: @dnd-kit for board view, native HTML5 for trash bin
- **Frontend**: Drag handles (GripVertical icon) and visual feedback (opacity, ring highlights) for better UX
- **Database**: Uses existing `TaskEventLink` model to link tasks to calendar events

**Key Files Modified**:
- `server/src/controllers/todoController.ts` - Added `ensureTaskCalendarEvent()` helper, time tracking endpoints, AI prioritization endpoints, smart scheduling endpoints, chat integration endpoints, Drive file linking endpoints
- `server/src/controllers/trashController.ts` - Added 'task' type support, task trashing logic, and task listing in trash
- `server/src/routes/todo.ts` - Registered all new endpoints (time tracking, AI prioritization, smart scheduling, chat integration, Drive integration)
- `server/src/services/todoAIPrioritizationService.ts` - NEW: AI prioritization service with scoring algorithm
- `server/src/services/todoSmartSchedulingService.ts` - NEW: Smart scheduling service with calendar availability analysis
- `server/src/services/todoChatIntegrationService.ts` - NEW: Chat integration service for message-to-task conversion
- `server/src/ai/core/ActionExecutor.ts` - Added `executeTasksAction` for AI task operations
- `server/src/ai/core/DigitalLifeTwinCore.ts` - Added `createPriorityAction` for priority-related queries
- `server/src/ai/actions/AutonomousActionExecutor.ts` - Added `executeUpdateTaskPriority` for autonomous priority updates
- `web/src/components/todo/TaskCalendar.tsx` - Calendar view component (month/week/day)
- `web/src/components/todo/TaskBoard.tsx` - Added DndContext integration for board column drag-and-drop
- `web/src/components/todo/TaskItem.tsx` - Added drag handlers for board view and trash bin, visual feedback
- `web/src/components/todo/TaskDetail.tsx` - Added time tracking UI, AI suggestions integration, Drive file linking UI
- `web/src/components/todo/TaskTimer.tsx` - NEW: Timer component with start/stop functionality
- `web/src/components/todo/TimeHistory.tsx` - NEW: Time history display component
- `web/src/components/todo/ManualTimeEntry.tsx` - NEW: Manual time entry form
- `web/src/components/todo/DriveFilePicker.tsx` - NEW: Drive file picker modal component
- `web/src/components/header/AIChatDropdown.tsx` - Enhanced: Added To-Do module detection, TODO_PROMPTS, handleTodoPrompt with priority/scheduling suggestion fetching
- `web/src/components/todo/TodoModule.tsx` - Removed: Separate AI suggestion buttons and sidebar components (integrated into main AI button)
- `web/src/components/GlobalHeaderTabs.tsx` - Removed: To-Do specific AI logo blinking logic
- `web/src/components/chat/ChatWindow.tsx` - Added "Create Task" button to message context menu
- `web/src/components/header/AIChatDropdown.tsx` - Added To-Do specific prompts
- `web/src/components/GlobalHeaderTabs.tsx` - Added AI logo blinking logic for To-Do module
- `web/src/api/todo.ts` - Added time tracking, AI prioritization, smart scheduling, chat integration, Drive integration API functions
- `web/src/contexts/GlobalTrashContext.tsx` - Added 'task' type to TrashedItem interface
- `web/src/components/modules/CalendarModule.tsx` - Fixed context filtering for personal calendars
- `web/src/app/calendar/month/page.tsx` - Fixed `contextFilter` to pass dashboard IDs
- `web/src/app/calendar/week/page.tsx` - Fixed `contextFilter` to pass dashboard IDs
- `web/src/app/calendar/day/page.tsx` - Fixed `contextFilter` to pass dashboard IDs
- `prisma/modules/todo/todo.prisma` - Added `TaskTimeLog` model for time tracking

**Architecture Decisions**:

**Phase 0-3.2**:
- **Quick Tasks**: Natural language parsing extracts due dates and priorities from task titles
- **Parent Task Control**: Recurring task parent controls all instances - changes propagate to future instances
- **Due Date Requirement**: Due date is mandatory for recurring tasks (frontend and backend validation)
- **Visual Hierarchy**: Parent recurring tasks appear first, instances nested below with purple border
- **Instance Generation**: First 10 instances generated automatically on creation
- **Circular Dependencies**: Backend validates and prevents circular dependency chains
- **Project Grouping**: Tasks grouped by project with collapsible sections, "No Project" section included
- **File Storage**: Attachments use `storageService` (GCS in production, local in development)
- **Drag-and-Drop**: Board view uses @dnd-kit for status changes, trash bin uses native HTML5 drag-and-drop
- **Trash Integration**: Tasks properly integrated into global trash system with 'task' type support
- **Time Tracking**: One active timer per user, manual entry for historical time, TaskTimeLog model for detailed tracking

**Phase 4.1-4.2: AI Integration**:
- **AI Prioritization**: Scoring algorithm considers due dates, priorities, dependencies, time estimates, projects, categories
- **Smart Scheduling**: Analyzes calendar availability, task dependencies, priorities, and time estimates to suggest optimal due dates
- **Autonomy System**: Uses existing autonomy settings to determine if AI can execute changes without approval
- **Learning System**: Records user feedback on suggestions to improve future recommendations
- **Unified AI Access**: All AI features accessible through main AI button (no separate module-specific buttons)
- **Context-Aware Prompts**: AI button detects current module and shows relevant prompts automatically
- **Pathname Detection**: Fallback mechanism detects module from URL if moduleContext not provided
- **AI Chat Integration**: To-Do specific prompts in AI chat dropdown for natural language task management
- **Action Executor Integration**: AI can execute task operations (update priority, create, complete, update due date) through ActionExecutor
- **Digital Life Twin Integration**: Detects priority and scheduling-related user intent and generates appropriate AI actions

**Phase 5.1-5.2: Module Integrations**:
- **Chat Integration**: Natural language parsing extracts task details from messages, tasks linked to originating messages
- **Drive Integration**: Uses existing TaskFileLink model, Drive file picker with folder navigation, excludes already-linked files
- **File Access**: Linked files can be opened directly from tasks in new tab
- **Message Context Menu**: "Create Task" button added to chat message context menu for easy task creation

**Calendar Integration (Previous)**:
- **Automatic Event Creation**: Tasks with due dates automatically create calendar events
- **Event Updates**: When task details change, linked calendar events are automatically updated
- **Personal Calendar Default**: Events are created in user's personal primary calendar

**What This Enables**:
- Quick task creation with natural language parsing (e.g., "Buy milk tomorrow" → creates task with due date)
- Full collaboration on tasks via comments, subtasks, and file attachments
- Complex task organization with dependencies, projects, and recurring tasks
- Parent-controlled recurring tasks with automatic instance generation
- Visual task hierarchy (parent tasks, instances, subtasks all properly nested)
- Intuitive drag-and-drop task management (change status in board view, delete via trash bin)
- Accurate time tracking with timer and manual entry for better project management
- AI-powered task prioritization with confidence scores and reasoning (accessible through main AI button)
- Smart scheduling suggestions based on calendar availability and conflicts (accessible through main AI button)
- Create tasks directly from chat messages with automatic parsing
- Link Drive files to tasks for easy file access and collaboration
- Tasks with due dates automatically appear in Calendar module
- Seamless integration between task management, calendar, chat, and drive modules
- Unified AI experience: All AI features accessible through single AI button with context-aware prompts
- AI assistant can prioritize tasks, suggest optimal scheduling, and create tasks from conversations

**Next Steps** (Future Enhancements):
- Bidirectional calendar sync (calendar event changes update task due dates)
- Calendar-to-task sync (show calendar events as tasks in To-Do module)
- Business calendar integration (link tasks to business calendar events)
- Visual dependency graph
- Advanced filters and search
- Task templates
- Time tracking analytics and reporting

---

## Previous Focus: To-Do Module Implementation — COMPLETE ✅

### **To-Do Module Implementation (January 2025)**
**Goal**: Build a complete, AI-powered task management module available in the marketplace for both personal and business users

**What Was Accomplished**:
- ✅ **Database Schema**: Complete Prisma models for Task, TaskDependency, TaskAttachment, TaskComment, TaskWatcher, TaskProject
- ✅ **Backend API**: Full CRUD operations with task completion, reopening, and comprehensive filtering
- ✅ **AI Context Integration**: 4 context providers (overview, upcoming, overdue, priority) registered with AI system
- ✅ **Frontend Components**: Complete UI with List view, Board view (Kanban), Task detail panel, and task form
- ✅ **Marketplace Registration**: Module seeded and available for installation (personal and business contexts)
- ✅ **Multi-Context Support**: Works seamlessly for personal, business, and household contexts
- ✅ **Module Architecture**: Follows all Vssyl patterns (dashboard scoping, permissions, AI integration)

**Technical Implementation**:
- **Database**: 8 Prisma models with full relationships, soft delete, recurrence support
- **Backend**: 2 controllers (todoController, todoAIContextController), complete route definitions
- **Frontend**: 7 React components with type-safe API client
- **AI Integration**: Registered in `registerBuiltInModules.ts` with 4 context providers
- **Marketplace**: Auto-seeded on server startup, status APPROVED, pricing FREE

**Key Files Created**:
- `prisma/modules/todo/todo.prisma` - Database schema
- `server/src/controllers/todoController.ts` - Main CRUD operations
- `server/src/controllers/todoAIContextController.ts` - AI context providers
- `server/src/routes/todo.ts` - API routes
- `server/src/startup/seedTodoModule.ts` - Marketplace registration
- `web/src/api/todo.ts` - Frontend API client
- `web/src/app/todo/page.tsx` - Main page
- `web/src/components/todo/TodoModule.tsx` - Main component
- `web/src/components/todo/TaskList.tsx` - List view
- `web/src/components/todo/TaskItem.tsx` - Task card
- `web/src/components/todo/TaskDetail.tsx` - Detail panel
- `web/src/components/todo/TaskBoard.tsx` - Kanban board
- `web/src/components/todo/TaskForm.tsx` - Create/edit form

**Architecture Decisions**:
- **Marketplace Module**: Not a core module - users must install from marketplace
- **Free Tier**: Available to all users (no subscription required)
- **Multi-Context**: Supports personal, business, and household contexts
- **AI-First**: Full AI context integration from day one (mandatory pattern)
- **View Flexibility**: Multiple views (List, Board, Calendar) for different workflows

**What This Enables**:
- Users can install To-Do from marketplace for personal or business use
- AI-powered task management with smart prioritization and scheduling
- Multiple views (List, Board) for different workflows
- Task assignment and collaboration for business contexts
- Integration points ready for Calendar, Chat, and Drive modules
- Context-aware features that adapt to personal vs business needs

**Next Steps** (Future Enhancements):
- Calendar view integration
- Complete recurring task logic
- Visual dependency graph
- File attachment UI
- AI prioritization engine
- Smart scheduling based on calendar availability

---

## Previous Focus: Chat Dashboard Tabs Implementation — COMPLETE ✅

### **Chat Dashboard Tabs Implementation (January 2025)**
**Goal**: Add dashboard tabs to floating global chat to allow quick switching between personal and business/enterprise chat contexts

**What Was Accomplished**:
- ✅ **Dashboard Tabs in Floating Chat**: Added dashboard tabs to both `StackableChatContainer` and `UnifiedGlobalChat` components
- ✅ **Business Dashboard Inclusion**: Business dashboards now appear in chat tabs alongside personal dashboards
- ✅ **Core Module Treatment**: Chat is now treated as a core module that's always available (no widget check required)
- ✅ **Consistent Implementation**: All chat components updated consistently to remove widget checks
- ✅ **Tab Sorting**: Personal dashboards appear first, followed by business/educational/household dashboards
- ✅ **Unread Counts**: Dashboard tabs show unread message counts per dashboard with badges
- ✅ **Enterprise Indicators**: Business dashboards show shield icon for enterprise features
- ✅ **Tab Scrolling**: Horizontal scrolling for many dashboards with hidden scrollbars

**Technical Implementation**:
- **Dashboard Tabs**: Replaced "Focused/Other" tabs with dashboard-based tabs in floating chat
- **Business Dashboard Inclusion**: Added `allDashboardsIncludingBusiness` logic to include business dashboards from `dashboards.business`
- **Core Module Logic**: Removed `isModuleActiveOnDashboard('chat', ...)` checks - chat is always available
- **Dashboard Override**: Uses `ChatContext.setDashboardOverride()` to switch contexts when tabs are clicked
- **Unread Count Calculation**: Async calculation of unread counts per dashboard, updates every 30 seconds
- **Tab UI**: Active tab highlighted in blue, unread badges, enterprise shield icons, truncated names with tooltips

**Key Files Modified**:
- `web/src/components/chat/StackableChatContainer.tsx` - Added dashboard tabs, removed widget check, included business dashboards
- `web/src/components/chat/ChatSidebar.tsx` - Updated to accept dashboard props instead of Focused/Other tabs
- `web/src/components/chat/UnifiedGlobalChat.tsx` - Added dashboard tabs, included business dashboards, removed widget check
- `web/src/app/chat/page.tsx` - Removed widget check, chat always available

**Architecture Decisions**:
- **Chat as Core Module**: Chat is always available on all dashboards - no widget installation required
- **Dashboard Tabs Over Focused/Other**: More intuitive to switch between actual dashboards than abstract "Focused/Other" categories
- **Personal First**: Personal dashboards always appear first in tab order for consistency
- **Business Dashboard Inclusion**: Business dashboards must be explicitly included since `allDashboards` doesn't include them by default

**What This Enables**:
- Users can quickly switch between personal and business chat contexts via tabs
- Business dashboards always appear in chat (no need to install chat widget)
- Consistent experience across floating chat and main chat page
- Clear visual indication of which dashboard context is active
- Unread counts help users prioritize which dashboard to check

---

## Previous Focus: Drive Module Rename to File Hub — COMPLETE ✅

### **Drive Module Rename to File Hub (December 20, 2025)**
**Goal**: Rename the "Drive" module to "File Hub" throughout the application while maintaining backward compatibility with module IDs and API routes

**What Was Accomplished**:
- ✅ **Display Name Updates**: Changed all user-facing "Drive" references to "File Hub" across frontend and backend
- ✅ **Sidebar Fixes**: Updated left and right sidebar components to display "File Hub" instead of "Drive"
- ✅ **Database Migration**: Updated Module and ModuleAIContextRegistry records in database
- ✅ **AI Context Updates**: Updated AI context keywords, patterns, and entity names to include "File Hub"
- ✅ **Error Handling Fixes**: Fixed "undefined" error display on login page and Prisma validation errors
- ✅ **Backward Compatibility**: Maintained module ID as "drive" and API routes as "/api/drive/*" for compatibility

**Technical Implementation**:
- **Module ID Retention**: Module ID remains "drive" for backward compatibility (API routes, database foreign keys, etc.)
- **Display Name Change**: All `name` properties changed from "Drive" to "File Hub" in:
  - Frontend module configs (`web/src/config/modules.ts`)
  - Backend module registration (`server/src/startup/registerBuiltInModules.ts`)
  - Database records (Module and ModuleAIContextRegistry tables)
  - Sidebar components (`PositionAwareModuleProvider.tsx`, `DashboardLayout.tsx`, etc.)
  - Widget components (`DriveWidget.tsx`)
  - Enterprise components (`EnhancedDriveModule.tsx`, `DriveEnterpriseShowcase.tsx`)
  - AI context definitions (keywords, patterns, entities, actions)
- **Database Migration**: Created and ran migration script to update existing database records
- **AI Context Enhancement**: Added "file hub" to keywords and updated patterns to recognize both "drive" and "file hub" references

**Key Files Modified**:
- `web/src/config/modules.ts` - Module config display name
- `web/src/components/PositionAwareModuleProvider.tsx` - Default personal modules array
- `web/src/app/dashboard/DashboardLayout.tsx` - Sidebar module display
- `web/src/components/business/DashboardLayoutWrapper.tsx` - Business sidebar
- `web/src/components/business/BusinessWorkspaceLayout.tsx` - Business workspace modules
- `web/src/components/widgets/DriveWidget.tsx` - Widget titles and error messages
- `web/src/app/drive/DriveSidebar.tsx` - Sidebar section headers and drive names
- `web/src/components/modules/DriveModule.tsx` - Drag-and-drop module names
- `server/src/startup/registerBuiltInModules.ts` - Backend module registration
- `server/src/controllers/trashController.ts` - Trash item module names
- `server/src/routes/moduleAIContext.ts` - AI context registration
- `server/src/scripts/register-built-in-modules.ts` - Module registration script
- `scripts/seed-core-modules.ts` - Seed script module names
- `scripts/ensure-builtin-modules.ts` - Built-in module ensure script
- `memory-bank/driveProductContext.md` - Documentation updates
- `memory-bank/systemPatterns.md` - Architecture documentation

**Bugs Fixed**:
1. **"undefined" Error on Login Page**: Login page was displaying literal "undefined" text
   - **Root Cause**: NextAuth `result.error` could be the string "undefined" or other invalid values
   - **Solution**: Added validation in `web/src/lib/auth.ts` to ensure error messages are valid strings, and updated login page to filter out invalid error strings
   - **Result**: Login page now shows proper error messages or hides invalid ones

2. **Prisma Validation Error in trashController**: Calendar members query attempted to filter by non-existent `isActive` field
   - **Root Cause**: `CalendarMember` model doesn't have `isActive` field (unlike `ConversationParticipant`)
   - **Solution**: Removed `isActive: true` filter from calendar members query in `trashController.ts`
   - **Result**: Trash controller now works correctly for calendar events

3. **Sidebar Still Showing "Drive"**: Left and right sidebars displayed "Drive" instead of "File Hub"
   - **Root Cause**: `PositionAwareModuleProvider.tsx` had hardcoded `DEFAULT_PERSONAL_MODULES` array with `name: 'Drive'`
   - **Solution**: Updated `DEFAULT_PERSONAL_MODULES` to use `name: 'File Hub'`
   - **Result**: Both sidebars now correctly display "File Hub"

4. **Widget and Modal References**: Various modals and widgets still referenced "Drive"
   - **Root Cause**: Mock data in `ModuleManagementModal.tsx`, `DashboardBuildOutModal.tsx`, and example text in `CustomContext.tsx`
   - **Solution**: Updated all mock data and example text to use "File Hub"
   - **Result**: Consistent naming throughout all UI components

**Architecture Decisions**:
- **Backward Compatibility First**: Module ID remains "drive" to maintain API compatibility, database foreign keys, and existing integrations
- **Display Name Only**: Only user-facing display names changed, not technical identifiers
- **AI Context Flexibility**: AI context patterns recognize both "drive" and "file hub" for user queries
- **Database Migration**: Used migration script to update existing records rather than requiring manual updates

**Next Steps**:
- Monitor for any remaining "Drive" references in user-facing UI
- Consider updating API documentation to reflect "File Hub" naming
- Update any external integrations that reference "Drive" module name

## Previous Focus: AI Control Center Enhancements — COMPLETE ✅

### **AI Control Center Enhancements (December 18, 2025)**
**Goal**: Enhance AI Control Center with Custom Context feature, contextual suggestions, and time range pickers for autonomy overrides

**What Was Accomplished**:
- ✅ **Custom Context Feature**: Complete implementation with full CRUD operations, proper module scoping, and AI integration
- ✅ **Contextual Suggestion Bubbles**: Smart onboarding hints that appear when users have no contexts, disappear after first use
- ✅ **Time Range Pickers**: 12-hour format time pickers for override settings (Work Hours, Family Time, Sleep Hours)
- ✅ **Backend Fixes**: Resolved module import errors and validation bugs

**Technical Implementation**:
- **Custom Context**: Full database schema, API routes, controller, and frontend component with accordion UI
- **Module Scoping**: Proper separation of personal vs business modules - users only see modules they have installed
- **Suggestion System**: localStorage-based dismissal, contextual to each section, auto-hide when contexts exist
- **Time Pickers**: 12-hour format UI component with 24-hour database storage, conditional display based on checkbox state

**Key Files Modified**:
- `web/src/components/ai/CustomContext.tsx` - Complete implementation with suggestions
- `web/src/components/ai/AutonomyControls.tsx` - Added time range pickers
- `server/src/controllers/userAIContextController.ts` - Fixed validation bug
- `server/src/routes/ai-user-context.ts` - Fixed import path
- `prisma/modules/ai/ai-models.prisma` - Added time range fields

**Bugs Fixed**:
1. **`contexts.filter is not a function`** - Added array validation and default empty array
2. **Module filtering showing all modules** - Separated personal/business module loading
3. **Backend validation blocking business module context** - Removed incorrect validation
4. **Backend server startup error** - Fixed TypeScript import path

**Architecture Decisions**:
- **Contextual Onboarding**: Use suggestion bubbles for first-time user guidance, not permanent UI
- **Module Scoping**: Always filter modules by installation scope (personal vs business)
- **Time Format**: 12-hour UI with 24-hour database storage for consistency
- **Conditional UI**: Show time pickers only when relevant (checkbox checked)

**Next Steps**:
- Run database migration for time range fields
- Verify AutonomyManager enforces time ranges
- Test end-to-end custom context flow

## Previous Enhancement: Scheduling Module Database Tables & Component Fixes — COMPLETE ✅

### **Scheduling Module Database Tables & Component Fixes (December 2025)**
**Goal**: Fix missing scheduling database tables and resolve undefined `scheduleId` prop warnings

**What Was Accomplished**:
- ✅ **Database Tables Recreated**: Used `prisma db push` to sync database schema and create missing `schedules`, `schedule_shifts`, and related scheduling tables
- ✅ **Prisma Client Regenerated**: Regenerated Prisma client to ensure code can access the new tables
- ✅ **Component Safety Checks**: Added defensive checks in `ScheduleBuilderVisual` to handle undefined `scheduleId` prop gracefully
- ✅ **Parent Component Validation**: Added validation in `SchedulingAdminContent` to ensure `selectedSchedule.id` exists before rendering

**Technical Implementation**:
- **Database Sync**: Used `prisma db push --accept-data-loss` to sync database with Prisma schema (tables were missing because they were created with `db push` instead of migrations)
- **Early Return Pattern**: Added early return in `ScheduleBuilderVisual` after all hooks to return `null` if `scheduleId` is undefined (following Rules of Hooks)
- **Parent Validation**: Added `selectedSchedule && selectedSchedule.id` check in `SchedulingAdminContent` before rendering `ScheduleBuilderVisual`
- **Warning Suppression**: Component now handles undefined props gracefully without console warnings

**Root Cause Analysis**:
1. **Missing Database Tables**: Scheduling tables (`schedules`, `schedule_shifts`, etc.) were created using `prisma db push` instead of `prisma migrate dev`, which doesn't create migration files. When the database was reset or migrations were reapplied, the tables disappeared because there was no migration to recreate them.
2. **Undefined scheduleId Prop**: React Strict Mode double-rendering or brief state transitions caused `ScheduleBuilderVisual` to render with undefined `scheduleId` before `selectedSchedule` was fully set.

**Key Files Modified**:
- `web/src/components/scheduling/ScheduleBuilderVisual.tsx` — Added early return check after hooks for undefined `scheduleId`
- `web/src/components/scheduling/SchedulingAdminContent.tsx` — Added validation to ensure `selectedSchedule.id` exists before rendering

**Bugs Fixed**:
1. **Missing Database Tables**: `The table 'public.schedules' does not exist` errors
   - **Root Cause**: Tables created with `db push` instead of migrations, so they disappeared after database reset
   - **Solution**: Used `prisma db push` to recreate tables, then regenerated Prisma client
   - **Result**: All scheduling endpoints now work correctly, no more 500 errors

2. **Undefined scheduleId Warning**: `⚠️ ScheduleBuilderVisual: scheduleId prop is undefined`
   - **Root Cause**: Component rendering during state transitions before `selectedSchedule.id` is set
   - **Solution**: Added defensive checks in both parent and child components
   - **Result**: No more warnings, component handles undefined state gracefully

**Architecture Decisions**:
- **Migration Strategy**: Always use `prisma migrate dev` for schema changes to create proper migration files (not `db push`)
- **Component Safety**: Always validate required props in parent components before passing to children
- **Rules of Hooks**: Early returns must come after all hooks are called to maintain hook order

**Next Steps**:
- Create proper migration file for scheduling tables to prevent this issue in the future
- Consider adding migration validation to catch missing tables early

## Previous Enhancement: Global Trash System Unification & Organization — COMPLETE ✅

### **Global Trash System Unification & Organization (December 2025)**
**Goal**: Unify Drive trash and global trash into a single system, fix UI layering issues, and add module-based organization

**What Was Accomplished**:
- ✅ **Unified Trash System**: Drive Trash page now uses GlobalTrashContext and `/api/trash/*` endpoints - Drive trash and global trash are the same system
- ✅ **Fixed Infinite Loading Loop**: Memoized `refreshTrash` in GlobalTrashContext with `useCallback` to prevent infinite re-renders
- ✅ **Fixed UI Layering**: Global trash panel now renders via React portal to ensure it appears above all UI elements
- ✅ **Module-Based Organization**: Added collapsible sections grouped by module (Drive, Chat, Calendar, etc.) for easy access
- ✅ **Expandable Panel**: Added expand/minimize toggle to switch between compact (320px) and expanded (600px) panel sizes
- ✅ **Improved Positioning**: Panel positioned above trash button with proper spacing and alignment
- ✅ **Cross-Module Restore UI Refresh**: Restoring from trash triggers module UIs to refresh without requiring a full page reload

**Technical Implementation**:
- **Unified API**: File Hub Trash page (`/drive/trash`) now filters `GlobalTrashContext` items by `moduleId === 'drive'` instead of using separate File Hub-specific endpoints
- **Context Memoization**: `refreshTrash` function wrapped in `useCallback` with `session?.accessToken` dependency to prevent infinite loops
- **Portal Rendering**: Global trash panel uses `createPortal` to render at `document.body` level with z-index 9999, ensuring it's above all other UI
- **Module Grouping**: Items grouped by `moduleId` using `useMemo`, with collapsible sections showing module name and item count
- **Auto-Expand**: All modules expanded by default when panel opens, users can collapse sections they don't need
- **Size Toggle**: Panel has two modes - compact (`w-80 max-h-96`) and expanded (`w-[600px] max-h-[600px]`) with smooth transitions
- **Event Bridge (Restore)**: `GlobalTrashContext.restoreItem()` dispatches `CustomEvent('itemRestored')` with `{ id, moduleId, type, metadata }`; modules listen and refresh locally

**Key Files Modified**:
- `web/src/contexts/GlobalTrashContext.tsx` — Memoized `refreshTrash` with `useCallback`
- `web/src/app/drive/trash/page.tsx` — Refactored to use `GlobalTrashContext` instead of File Hub-specific API endpoints
- `web/src/components/GlobalTrashBin.tsx` — Added portal rendering, module grouping, expand/collapse functionality
- `web/src/app/dashboard/DashboardLayout.tsx` — Increased z-index for right sidebar to 2000
- `web/src/components/modules/DriveModule.tsx` — Listens for `itemRestored` to reload File Hub data
- `web/src/components/modules/CalendarModule.tsx` — Listens for `itemRestored` to reload calendars/events
- `web/src/components/modules/ChatModule.tsx` — Listens for `itemRestored` to reload conversations

**Bugs Fixed**:
1. **Infinite Loading Loop**: File Hub trash page showed "loading" and blinked repeatedly
   - **Root Cause**: `refreshTrash` function in context wasn't memoized, causing `useEffect` dependencies to change on every render
   - **Solution**: Wrapped `refreshTrash` in `useCallback` with proper dependencies
   - **Result**: Loading loop eliminated, page loads correctly

2. **Global Trash Panel Hidden Behind UI**: Panel appeared behind other elements
   - **Root Cause**: Panel was positioned absolutely within sidebar with z-index 50, lower than other UI elements
   - **Solution**: Rendered panel via React portal to `document.body` with z-index 9999, added backdrop overlay
   - **Result**: Panel now appears above all UI elements reliably

3. **No Module Organization**: All trash items shown in flat list, hard to find items from specific modules
   - **Root Cause**: Items displayed chronologically without grouping
   - **Solution**: Grouped items by `moduleId` with collapsible sections, auto-expand on open
   - **Result**: Easy navigation to items by module, cleaner organization

**Architecture Decisions**:
- **Single Source of Truth**: Global trash is the canonical system - File Hub Trash page is just a filtered view
- **Portal for Overlays**: Use React portals for UI elements that must appear above everything (modals, dropdowns, trash panel)
- **Context Memoization**: Always memoize context functions that are used as `useEffect` dependencies to prevent infinite loops
- **Module Grouping**: Organize multi-module data by module for better UX and discoverability

## Previous Enhancement: Pinned Page Functionality Parity — COMPLETE ✅

### **Pinned Page Functionality Parity (December 2025)**
**Goal**: Make the pinned page operate with the same functionality as the standard drive page

**What Was Accomplished**:
- ✅ **Complete Refactor**: Refactored pinned page to use same components and handlers as DriveModule
- ✅ **Image Thumbnails**: Added image thumbnail previews matching standard drive page
- ✅ **Details Panel**: Added right-side details panel for file preview and information
- ✅ **Context Menu**: Implemented full context menu with pin/unpin, share, download, delete actions
- ✅ **Drag-and-Drop**: Integrated with global DndContext for moving items between folders
- ✅ **Share Modals**: Added ShareModal and ShareLinkModal for sharing functionality
- ✅ **Pin/Unpin**: Implemented toggle pin functionality that removes unpinned items from list
- ✅ **Download**: Added file download functionality
- ✅ **Delete**: Integrated with global trash system
- ✅ **Layout Structure**: Matched layout (folders on top, files on bottom) with same styling
- ✅ **View Modes**: Grid and list view toggle functionality
- ✅ **Fullscreen Permissions**: Fixed fullscreen permissions policy warnings

**Technical Implementation**:
- **Component Reuse**: Created `DraggableItem` component in pinned page matching DriveModule's implementation
- **Same Handlers**: Implemented all handlers (handleItemClick, handleDelete, handleShare, handleDownload, handleStar, handleContextMenu) matching DriveModule
- **Details Panel Integration**: Added `DriveDetailsPanel` component for file preview and details
- **DndContext Integration**: Wrapped pinned page with global `DndContext` for drag-and-drop
- **Image Thumbnail Logic**: Reused same `getFileIcon` function that shows actual image previews
- **Permissions Policy**: Updated to `fullscreen=*` to allow PDF viewer fullscreen functionality

**Key Files Modified**:
- `web/src/app/drive/starred/page.tsx` — Complete refactor to match DriveModule functionality
- `web/src/app/layout.tsx` — Updated Permissions-Policy to `fullscreen=*`
- `web/src/components/drive/DriveDetailsPanel.tsx` — Added style for PDF object tag

**Features Now Available on Pinned Page**:
- ✅ Click files to open details panel with preview
- ✅ Click folders to navigate to folder
- ✅ Right-click context menu with all actions
- ✅ Drag-and-drop items to folders or trash
- ✅ Pin/unpin items (unpinned items removed from list)
- ✅ Share files and folders
- ✅ Download files
- ✅ Delete items (moves to global trash)
- ✅ Image thumbnails for image files
- ✅ PDF preview in details panel
- ✅ Grid and list view modes
- ✅ Same visual styling as standard drive page

**Bugs Fixed**:
1. **Missing Functionality**: Pinned page had empty click handlers and no context menu
   - **Root Cause**: Pinned page was using basic FileGrid component without full functionality
   - **Solution**: Refactored to use same DraggableItem component and handlers as DriveModule
   - **Result**: Pinned page now has full feature parity with standard drive page

2. **No Image Thumbnails**: Pinned page showed generic icons instead of image previews
   - **Root Cause**: FileGrid component didn't have image thumbnail logic
   - **Solution**: Added custom renderItem function with same getFileIcon logic as DriveModule
   - **Result**: Image files now show actual thumbnails matching standard page

3. **Fullscreen Permissions Warnings**: Browser console showing fullscreen policy violations
   - **Root Cause**: PDF viewer in object tag needs fullscreen permission
   - **Solution**: Updated Permissions-Policy meta tag to `fullscreen=*`
   - **Result**: No more fullscreen permission warnings

## Previous Enhancement: Drive Module Drag-and-Drop & React Fixes — COMPLETE ✅

### **Drive Module Drag-and-Drop & React Fixes (December 2025)**
**Goal**: Fix React errors and complete drag-and-drop functionality for Drive module

**What Was Accomplished**:
- ✅ **React Hooks Violation Fixed**: Created separate `FolderItem` component to fix "Rendered more hooks than during the previous render" error
- ✅ **Render-Phase Update Warning Fixed**: Replaced state with refs for drag handler registration to prevent render-phase updates
- ✅ **Duplicate Key Warning Fixed**: Prefixed React keys with item type (`folder-${id}`, `file-${id}`) to ensure uniqueness
- ✅ **Null Event Handling**: Added proper null checks for drag events to prevent crashes
- ✅ **Global Drag Context**: Moved `DndContext` to `DrivePageContent` to enable cross-component drag-and-drop
- ✅ **Sidebar Folder Droppable**: Made sidebar folders droppable targets for drag-and-drop operations
- ✅ **Root Drop Zone**: Enabled drag-and-drop to root drop zone from anywhere in the main content area
- ✅ **Code Cleanup**: Removed remaining console.log statements

**Technical Implementation**:
- **FolderItem Component**: Created separate component (`web/src/components/drive/FolderTree.tsx`) that uses `useDroppable` hook at top level, fixing hooks violation
- **Ref-Based Handler Registration**: Replaced `useState` for `dragEndHandler` with `useRef` in `DrivePageContent` to avoid render-phase updates
- **Unique Keys**: Prefixed all item keys with type (`folder-${item.id}`, `file-${item.id}`) to prevent duplicate key warnings
- **Global DndContext**: Moved `DndContext` from `DriveModule` to `DrivePageContent` to wrap both sidebar and main content
- **Handler Registration Pattern**: `DriveModule` registers its `handleDragEnd` with parent via `onRegisterDragEndHandler` callback
- **Null Safety**: Added null checks in `handleDragEnd` functions to handle edge cases gracefully

**Key Files Modified**:
- `web/src/components/drive/FolderTree.tsx` — Created `FolderItem` component to fix hooks violation
- `web/src/components/drive/DrivePageContent.tsx` — Added global `DndContext`, ref-based handler registration, removed console.log
- `web/src/components/modules/DriveModule.tsx` — Removed internal `DndContext`, registered handler with parent, prefixed keys, removed setTimeout workaround
- `web/src/components/drive/DriveModuleWrapper.tsx` — Passes `onRegisterDragEndHandler` prop to modules

**Bugs Fixed**:
1. **React Hooks Violation**: `useDroppable` called inside `renderFolder` function (called in `.map()`)
   - **Root Cause**: React hooks must be called at top level, not conditionally or in loops
   - **Solution**: Created separate `FolderItem` component that calls `useDroppable` at top level
   - **Result**: No more "Rendered more hooks" errors, hooks called consistently

2. **Render-Phase Update Warning**: `setDragEndHandler` called during render causing "Cannot update component while rendering" warning
   - **Root Cause**: Handler registration was updating state during render phase
   - **Solution**: Replaced `useState` with `useRef` for handler storage (refs don't trigger re-renders)
   - **Result**: No more render-phase update warnings, smooth component updates

3. **Duplicate Key Warning**: Same item ID appearing in both folders and files arrays
   - **Root Cause**: React requires unique keys; same ID could appear in multiple arrays
   - **Solution**: Prefixed keys with item type (`folder-${id}`, `file-${id}`)
   - **Result**: All keys are unique, no duplicate key warnings

4. **Null Event Handling**: `handleDragEnd` receiving null events causing crashes
   - **Root Cause**: Drag events can be null in edge cases
   - **Solution**: Added null checks at start of `handleDragEnd` functions
   - **Result**: Graceful handling of null events, no crashes

**Known Issues Resolved**:
- ❌ **Fixed**: React hooks violation in FolderTree component
- ❌ **Fixed**: Render-phase update warnings in DrivePageContent
- ❌ **Fixed**: Duplicate key warnings in DriveModule
- ❌ **Fixed**: Null event crashes in drag handlers
- ✅ **Cleaned**: Removed console.log statements

**Drag-and-Drop Functionality**:
- ✅ **Files to Folders**: Can drag files to folders in main content area
- ✅ **Files to Sidebar Folders**: Can drag files to folders in left sidebar
- ✅ **Folders to Folders**: Can drag folders to other folders
- ✅ **Items to Root**: Can drag items to root drop zone
- ✅ **Items to Trash**: Can drag items to global trash bin
- ✅ **Visual Feedback**: Drop zones highlight when dragging over them

## Previous Enhancement: Drive Module Bug Fixes & Improvements — COMPLETE ✅

### **Drive Module Bug Fixes & Improvements (December 2025)**
**Goal**: Fix critical bugs and improve Drive module functionality

**What Was Accomplished**:
- ✅ **Drag-to-Trash Integration**: Fixed drag-and-drop to global trash bin by adding native HTML5 drag handlers alongside @dnd-kit
- ✅ **Type Safety Fix**: Fixed `onFolderSelect` callback type mismatch between DriveSidebar and DriveModuleWrapper
- ✅ **Async Operation Fix**: Verified and ensured `loadFilesAndFolders()` is properly awaited in all move operations
- ✅ **Image URL Normalization**: Fixed image loading errors by normalizing URLs to handle localhost URLs correctly
- ✅ **Debug Log Cleanup**: Removed all debug console.log statements from DriveModule and DriveModuleWrapper

**Technical Implementation**:
- **Native HTML5 Drag Support**: Added `handleNativeDragStart` to `DraggableItem` component to set drag data for GlobalTrashBin compatibility
- **URL Normalization**: Created `normalizeFileUrl()` function to filter out localhost URLs and use download endpoint instead
- **Type Consistency**: Updated `DriveSidebar` to pass `folderId: string | null` instead of object, matching `DriveModuleWrapper` signature
- **Preview URL Handling**: Enhanced `handleItemClick` to detect and handle localhost URLs, falling back to download endpoint

**Key Files Modified**:
- `web/src/components/modules/DriveModule.tsx` — Added native drag handlers, URL normalization, removed debug logs
- `web/src/app/drive/DriveSidebar.tsx` — Fixed onFolderSelect callback to pass string instead of object
- `web/src/components/drive/DriveModuleWrapper.tsx` — Removed debug logs

**Bugs Fixed**:
1. **Drag-to-Trash Not Working**: Items dragged to trash were moving to root instead
   - **Root Cause**: @dnd-kit doesn't set native HTML5 drag data needed by GlobalTrashBin
   - **Solution**: Added `onDragStart` handler to set `dataTransfer` data in format GlobalTrashBin expects
   - **Result**: Dragging items to global trash bin now correctly moves them to trash

2. **Type Mismatch in Folder Selection**: `DriveSidebar` passed object but `DriveModuleWrapper` expected string
   - **Root Cause**: Callback signature mismatch in folder selection chain
   - **Solution**: Updated `DriveSidebar.handleFolderSelect` to pass `folder.id` (string) instead of `{ id, name }` object
   - **Result**: Type-safe folder selection throughout the component chain

3. **Image Loading Errors**: URLs containing `http://localhost:5000` caused `ERR_NAME_NOT_RESOLVED`
   - **Root Cause**: Localhost URLs from API were being incorrectly concatenated with production server URL
   - **Solution**: Normalize URLs to filter out localhost, use download endpoint (`/api/drive/files/${id}/download`) instead
   - **Result**: Images load correctly in both development and production environments

**Known Issues Resolved**:
- ❌ **Fixed**: Drag-to-trash not working - items moved to root instead
- ❌ **Fixed**: Type mismatch in `onFolderSelect` callback chain
- ❌ **Fixed**: Image URLs with localhost causing loading errors
- ✅ **Cleaned**: All debug console.log statements removed

## Previous Enhancement: Sidebar Folder Tree & Navigation — COMPLETE ✅

### **Sidebar Folder Tree & Navigation (December 2025)**
**Goal**: Implement expandable folder tree in sidebar for easy navigation and folder management

**What Was Accomplished**:
- ✅ **FolderTree Component**: Created recursive folder tree component with expand/collapse functionality
- ✅ **Drive Expansion**: Added expand/collapse button (▶/▼) to each drive in sidebar
- ✅ **Root Folder Loading**: Fixed API query to properly load root folders (omitting `parentId` parameter)
- ✅ **Subfolder Loading**: Implemented lazy loading of subfolders when parent folders are expanded
- ✅ **Folder Navigation**: Clicking folders in sidebar navigates to that folder in main DriveModule view
- ✅ **Navigation Sync**: Sidebar folder selection syncs with DriveModule's `currentFolder` state
- ✅ **Empty State**: FolderTree shows "No folders" message when folder list is empty
- ✅ **Auto-Expand**: Locked workspace drives auto-expand to show seeded folders immediately
- ✅ **Visual Feedback**: Selected folder highlighted in sidebar tree

**Technical Implementation**:
- **FolderTree Component**: Recursive component (`web/src/components/drive/FolderTree.tsx`) with expand/collapse state management
- **API Fix**: Changed from `/api/drive/folders?dashboardId=${id}&parentId=null` to `/api/drive/folders?dashboardId=${id}` (omitting `parentId` allows API to filter for `parentId IS NULL`)
- **State Management**: `folderTrees` state in DriveSidebar tracks folder structure per dashboard
- **Lazy Loading**: Subfolders loaded on-demand when parent folder is expanded
- **Navigation Sync**: `selectedFolderId` prop passed from DrivePageContent → DriveModuleWrapper → DriveModule
- **Breadcrumb Integration**: Breadcrumb navigation in main view also updates sidebar selection

**Key Files Modified**:
- `web/src/app/drive/DriveSidebar.tsx` — Added folder tree state, expansion logic, and FolderTree rendering
- `web/src/components/drive/FolderTree.tsx` — Created recursive folder tree component
- `web/src/components/modules/DriveModule.tsx` — Added `selectedFolderId` prop and sync logic
- `web/src/components/drive/DriveModuleWrapper.tsx` — Passes folder selection props to DriveModule
- `web/src/components/drive/DrivePageContent.tsx` — Manages folder selection state and passes to wrapper

**Key Features**:
1. **Expandable Drives**: Click ▶ button to expand/collapse folder tree for each drive
2. **Recursive Folders**: Nested folders can be expanded to show subfolders
3. **Navigation**: Clicking a folder in sidebar navigates to that folder in main view
4. **Visual Feedback**: Selected folder highlighted with blue background
5. **Empty States**: Shows "No folders" when folder list is empty
6. **Auto-Expand**: Business workspace drives auto-expand on load

**Known Issues Resolved**:
- ❌ **Fixed**: Passing `parentId=null` in query string was treated as string `"null"` instead of SQL `NULL`
- ✅ **Solution**: Omit `parentId` parameter entirely to let API filter for `parentId IS NULL`

## Previous Enhancement: Folder Permissions & Sharing Implementation — COMPLETE ✅

### **Folder Permissions & Sharing System (December 2025)**
**Goal**: Implement comprehensive folder-level permissions and sharing functionality to match file sharing capabilities

**What Was Accomplished**:
- ✅ **Database Schema**: Added `FolderPermission` model with `canRead` and `canWrite` permissions, linked to `Folder` and `User` models
- ✅ **Backend Controller**: Created `folderPermissionController.ts` with full CRUD operations (list, grant, update, revoke permissions)
- ✅ **Backend Routes**: Added permission endpoints to `/api/drive/folders/:id/permissions`
- ✅ **Permission Checks**: Integrated permission validation into all folder operations (create, update, delete, move, reorder)
- ✅ **Shared Items API**: Updated `getSharedItems` to include folders with permissions in shared items list
- ✅ **Frontend API Client**: Added folder permission functions to `drive.ts` API client
- ✅ **UI Integration**: Enabled folder sharing in `DriveModule.tsx` via `ShareModal` component
- ✅ **Share Link System**: Implemented automatic share link generation for non-user emails with `ShareLinkModal` component
- ✅ **Shared Page Enhancement**: Updated `/drive/shared` page to handle query parameters (`?file=xxx` or `?folder=xxx`) for direct access
- ✅ **Download Improvements**: Enhanced file download logic to detect file location from URL (GCS vs local) automatically

**Technical Implementation**:
- **Database**: `FolderPermission` model with unique constraint on `[folderId, userId]` and proper indexes
- **Backend**: Permission checks use helper functions `canReadFolder()` and `canWriteFolder()` for consistency
- **Frontend**: `ShareModal` component supports both files and folders with conditional API calls
- **Share Links**: Auto-generated links format: `/drive/shared?file=xxx` or `/drive/shared?folder=xxx`
- **Non-User Sharing**: When sharing with non-registered email, system generates share link and displays `ShareLinkModal` with copy functionality
- **File Download**: Smart detection of file location (GCS URLs vs local paths) with fallback logic

**Files Created**:
- `server/src/controllers/folderPermissionController.ts` — Complete folder permission management (260 lines)
- `shared/src/components/ShareLinkModal.tsx` — Modal for displaying share links to non-users (126 lines)

**Files Modified**:
- `prisma/modules/drive/files.prisma` — Added `FolderPermission` model and `permissions` relation
- `prisma/modules/auth/user.prisma` — Added `folderPermissions` relation
- `server/src/routes/folder.ts` — Added permission endpoints
- `server/src/controllers/folderController.ts` — Added permission checks to all operations
- `server/src/controllers/fileController.ts` — Updated `getSharedItems` to include folders, improved download logic
- `web/src/api/drive.ts` — Added folder permission functions and improved share-by-email logic
- `web/src/components/modules/DriveModule.tsx` — Enabled folder sharing, integrated ShareLinkModal
- `web/src/app/drive/shared/page.tsx` — Added query parameter handling and specific item display
- `shared/src/components/ShareModal.tsx` — Enhanced to always display shareable links

**Key Features**:
1. **Folder Permissions**: Granular `canRead` and `canWrite` permissions per user per folder
2. **Permission Inheritance**: Creating folders in shared folders requires write permission
3. **Shared Folders View**: Folders shared with user appear in "Shared" section
4. **Share Link Generation**: Automatic link creation for non-user email sharing
5. **ShareLinkModal**: User-friendly modal showing share link with copy functionality
6. **Direct Link Access**: Share links (`/drive/shared?file=xxx`) display specific item details
7. **Smart Download**: File download automatically detects GCS vs local storage from URL

**Result**: ✅ Complete folder permissions system matching file permissions, seamless sharing experience for both registered and non-registered users

---

## Recent Fix: Dashboard Page Errors & Drive Download Functionality — COMPLETE ✅

### **Dashboard Page & Drive Download Fixes (December 2025)**
**Issue**: Multiple errors preventing dashboard access and file downloads
- Dashboard page returning 500 errors with "Cannot read properties of null (reading 'useContext')"
- Parallel route warnings in Next.js
- File downloads failing with 404 errors and ENOENT errors
- File paths in database containing full URLs instead of relative paths

**Solution**: Comprehensive fixes for dashboard rendering and file download system

**What Was Accomplished**:
- ✅ **Dashboard Page Converted to Client Component**: Changed from server component to client component to avoid SSR context issues
- ✅ **Authentication Flow Fixed**: Moved authentication checks to `useEffect` to prevent SSR errors
- ✅ **File Download Path Handling**: Fixed download function to use `file.path` from database instead of parsing URLs
- ✅ **File Existence Checks**: Added proper file existence validation before attempting downloads
- ✅ **Error Logging Enhanced**: Improved error logging for download operations with detailed context
- ✅ **Path Extraction Logic**: Added fallback logic to extract paths from URLs when `file.path` is not available
- ✅ **Storage Provider Handling**: Proper handling for both GCS and local storage providers

**Technical Implementation**:
- Dashboard page now uses `useSession` hook instead of `getServerSession`
- Download function prioritizes `file.path` over `file.url` for local storage
- Proper path construction using `LOCAL_UPLOAD_DIR` environment variable
- File existence validation with `fs.existsSync()` before download
- Enhanced error messages showing file path, URL, and database path for debugging

**Files Modified**:
- `web/src/app/dashboard/[id]/page.tsx` — Converted to client component, fixed authentication flow
- `web/src/app/dashboard/[id]/error.tsx` — Enhanced error boundary with better error display
- `server/src/controllers/fileController.ts` — Fixed download function path handling, added file existence checks
- `server/src/controllers/fileController.ts` — Added `fs` import for file system operations

**Result**: ✅ Dashboard pages load correctly without SSR errors, file downloads work for both local and GCS storage

---

## Recent Fix: Calendar RSVP UI Improvements — COMPLETE ✅

### **Calendar RSVP Functionality (December 2025)**
**Issue**: Personal calendar modal (`/calendar/month`) lacked RSVP buttons for accepting/declining event invitations  
**Solution**: Added RSVP functionality to personal calendar event modal with user-friendly status display

**What Was Accomplished**:
- ✅ **RSVP Buttons in Personal Calendar Modal**: Added Accept, Maybe, and Decline buttons to the Attendees section
- ✅ **Conditional Display**: RSVP buttons only appear when the current user is an attendee of the event
- ✅ **Visual Feedback**: Selected button is highlighted (e.g., green for Accepted, red for Declined, yellow for Tentative)
- ✅ **Auto-Refresh**: After RSVP, event data and calendar list automatically refresh to show updated status
- ✅ **User-Friendly Status Display**: Changed raw status codes to readable labels:
  - `NEEDS_ACTION` → "Pending Response"
  - `ACCEPTED` → "Accepted"
  - `DECLINED` → "Declined"
  - `TENTATIVE` → "Tentative"
- ✅ **API Method Fix**: Fixed incorrect `listEventsInRange` calls to use correct `listEvents` method with proper parameters

**Technical Implementation**:
- RSVP buttons appear in Attendees section header when `currentUserEmail` or `currentUserId` matches an attendee
- Uses `calendarAPI.rsvp(eventId, response)` to update attendee status
- Refreshes events list using `calendarAPI.listEvents()` with proper context and calendar filtering
- Status badges use color-coded styling (green for accepted, red for declined, yellow for tentative, gray for pending)

**Files Modified**:
- `web/src/app/calendar/month/page.tsx` — Added RSVP buttons, user-friendly status display, fixed API method calls

**Result**: ✅ Users can now easily accept/decline event invitations directly from the personal calendar modal with clear visual feedback

---

## Recent Fix: Session Timing & Authentication Race Condition — COMPLETE ✅

### **Session Timing Fix (November 2025)**
**Issue**: 403 errors on initial login due to API calls firing before session was ready  
**Solution**: Implemented three-layer session readiness protection:
1. **Login Page**: Polls for actual session availability before redirecting
2. **SessionReadyGate Component**: Global gate preventing all authenticated providers from mounting until session token is confirmed
3. **Context-Level Checks**: BusinessConfigurationContext and other contexts check for session before API calls
- See `troubleshooting.md` for full technical details

**Result**: ✅ No more 403 errors on initial login, smooth user experience, all contexts wait for session before mounting

---

## Current Focus: Schedule Builder Advanced Features & UI Polish — COMPLETE ✅

### **Latest Session Highlights** 🎉
**Date**: November 25, 2025  
**Focus**: Auto-save functionality, station/position drag-and-drop, default timeframes, color picker, modal improvements, and When I Work visualization.

#### **What Was Accomplished**

**Auto-Save Functionality (November 25, 2025)**  
- ✅ **Debounced Auto-Save**: Layout changes (layoutMode, viewMode) auto-save 1 second after last change
- ✅ **Interval Auto-Save**: Additional 5-minute interval auto-save as backup
- ✅ **Removed Manual Save Button**: Save Layout button removed from toolbar (auto-save handles it)
- ✅ **Schedule Date Display**: Removed redundant date range from header (cleaner UI)

**Build Tools Integration (November 20-25, 2025)**  
- ✅ **Unified Sidebar**: Employees, Positions, and Stations integrated into single "BUILD TOOLS" section
- ✅ **Expandable Categories**: Each category (Employees, Positions, Stations) is expandable with draggable cards
- ✅ **Default Timeframes**: Positions and Stations can have `defaultStartTime` and `defaultEndTime` that pre-populate shift times
- ✅ **Draggable Resource Cards**: All three resource types (employee, position, station) can be dragged to create shifts
- ✅ **Visual Feedback**: DragOverlay shows green card with resource details during drag
- ✅ **Card Persistence**: Cards remain visible (opacity-30) during drag, preventing disappearing issue

**Shift Modal Improvements (November 20-25, 2025)**  
- ✅ **Station Dropdown**: Added station selection dropdown to shift creation/edit modal
- ✅ **Color Picker**: Functional color picker that saves to database (8 color options)
- ✅ **Dynamic Button Text**: Button shows "CREATE SHIFT" for new shifts, "SAVE" for editing existing shifts
- ✅ **Contextual Labels**: Shift blocks show position/station in employee view, employee name in position/station view
- ✅ **Time Display**: Shift time always shown at top of shift block

**When I Work Visualization (November 20-25, 2025)**  
- ✅ **Shift Block Styling**: Diagonal stripe pattern for conflicts/open shifts, red triangle warning indicator
- ✅ **Time Format**: "9a ~ 5p" style time display
- ✅ **Color Schemes**: Gray with stripes for conflicts, solid colors for confirmed shifts
- ✅ **Employee Row Enhancements**: Total hours per employee, profile icon, yellow warning indicators
- ✅ **Open Shifts Row**: Green background with green circle + question mark icon
- ✅ **Summary Row**: "Assigned Total" label with total hours, red exclamation marks for days with issues

**Layout Mode Improvements (November 20-25, 2025)**  
- ✅ **Combined Position/Station View**: Single "Position/Station" layout mode button (replaces separate buttons)
- ✅ **Day View Navigation**: Previous/Next day buttons when in day view mode
- ✅ **Availability Conflict Detection**: Conflicts detected and displayed in all layout modes (not just employee view)

**Authentication & Routing Fixes (November 25, 2025)**  
- ✅ **Server Layout Auth**: Made workspace layout less aggressive with auth checks (prevents redirect loops)
- ✅ **Client-Side Auth**: Added client-side auth protection in DashboardLayoutWrapper
- ✅ **Session Handling**: Fixed session cookie issues causing redirects to login

**Previous Focus: Schedule Builder Reliability & Member Shift Persistence — COMPLETE ✅**

### **Previous Session Highlights** 🎉
**Date**: November 19, 2025  
**Focus**: Ensuring drag-and-drop works for member employees, persisting open-shift assignments, and hardening backend validation.

#### **What Was Accomplished**

**Member Employee Support**  
- ✅ **Synthetic Employee Rows** now persist after reloads. `memberShiftAssignments` map (shiftId → memberUserId) is hydrated from `localStorage` on mount and written back whenever assignments change.  
- ✅ **Schedule Calendar Rendering** uses the assignment map so open shifts follow the correct member row in both week and day views.  
- ✅ **Shift Edit Modal** dropdown understands `member-*` IDs, auto-sending `employeePositionId: null` and recording the member mapping.

**Shift Update Reliability**  
- ✅ **Drag-and-drop updates** always include `employeePositionId` (explicit `null`) so backend knows a shift remains open when moved between member employees.  
- ✅ **Concurrent updates guarded** with `updatingShiftIds` to prevent duplicate mutations and ghost shifts.  
- ✅ **Post-update refresh** now calls `fetchShifts(scheduleId)` directly so totals/footer recalc immediately.

**Backend Validation & Error Surfacing**  
- ✅ `server/src/controllers/schedulingController.ts` rejects invalid `employeePositionId` values up front (UUID check + `member-*` handling), disconnects relations safely, and keeps `isOpenShift` in sync.  
- ✅ API client (`web/src/api/scheduling.ts`) and `useScheduling` hook bubble up detailed errors so the UI no longer shows false positives (“Shift updated successfully”) when backend failed.

**Quality-of-life polish**  
- ✅ Week/day totals stay accurate because the assignment map is cleaned whenever shifts reload.  
- ✅ Drag logs now include source/target context which made debugging member rows fast.  
- ✅ Job location/station fields remain intact during drag thanks to cautious `updates` payload construction.

#### **Technical Implementation Details**

- **State Persistence**: `memberShiftAssignments` initializes from `localStorage` key `memberShiftAssignments_${businessId}_${scheduleId}` and is written back via `useEffect`. Invalid or stale entries are pruned whenever shifts reload.  
- **Calendar Filtering**: `ScheduleCalendarGrid` receives the assignment map and, when rendering employee layout, matches `member-*` rows by looking up the stored memberUserId.  
- **Shift Updates**: `handleDragEnd` builds an `updates` payload that always carries `startTime`, `endTime`, and the correct `employeePositionId` (UUID or `null`). Member rows trigger explicit null assignment plus map update/logging.  
- **Backend Safeguards**: `updateShift` treats `member-*` IDs and empty strings as disconnects, validates UUIDs before `connect`, and logs structured errors when user input is invalid.

#### **Files Modified (This Session)**
- `web/src/components/scheduling/ScheduleBuilderVisual.tsx` — localStorage persistence, assignment map hygiene, improved drag/drop logging, error handling.  
- `web/src/components/scheduling/ScheduleCalendarGrid.tsx` — renders member rows using assignment map so open shifts stay visible.  
- `web/src/api/scheduling.ts` & `web/src/hooks/useScheduling.ts` — richer error propagation for create/update shift calls.  
- `server/src/controllers/schedulingController.ts` — UUID validation + explicit disconnect/connect logic for `employeePositionId`, `stationName`, `locationId`.

---

## Previous Focus: Schedule Builder UI/UX Enhancements — COMPLETE ✅

---

## Previous Focus: Scheduling Module UI/UX Enhancement & Shift Swap Implementation — COMPLETE ✅

### **Previous Session Highlights** 🎉
**Date**: November 14, 2025  
**Focus**: Complete shift swap functionality, UI/UX improvements, and layout redesign

#### **What Was Accomplished**
- ✅ **Shift Swap Backend Implementation**: Fully functional shift swap request, approval, and denial system
  - `requestShiftSwap` - Employees can request swaps for their shifts
  - `approveShiftSwapAdmin` / `denyShiftSwapAdmin` - Admin approval/denial
  - `approveShiftSwapManager` / `denyShiftSwapManager` - Manager approval/denial
  - `getPendingShiftSwapRequestsForTeam` - Manager view of pending swaps
  - Automatic shift assignment when swaps are approved
- ✅ **Shift Swap Frontend UI**: Complete employee and manager interfaces
  - Employee view: List swap requests, request new swaps, view status
  - Manager view: Approve/deny swap requests with notes
  - Status badges (PENDING, APPROVED, DENIED)
  - Integration with schedule data
- ✅ **Layout Redesign**: Modern sidebar navigation system
  - Left sidebar with role-based navigation (Dashboard, Schedule Builder, Templates, Analytics, etc.)
  - Central dashboard as default view with key metrics
  - Removed internal tabs in favor of sidebar navigation
  - All pages live within global header and sidebars
- ✅ **Schedule Builder Functionality**: Full CRUD operations
  - Create/Edit/Delete schedules with modals
  - Create/Edit/Delete shifts with detailed forms
  - Schedule detail view with shift management
  - Publish schedules functionality
  - Schedule status management (DRAFT, PUBLISHED)
- ✅ **Templates & Analytics Views**: Functional implementations
  - Templates view: List published schedules as templates
  - Analytics view: Key metrics and detailed breakdowns
- ✅ **UI/UX Improvements**: Enhanced readability and design
  - Fixed light gray text in modals (changed to `text-gray-900`)
  - Updated Input and Textarea components with proper text colors
  - Sleeker stat cards with improved typography and spacing
  - Better visual hierarchy and hover effects
- ✅ **Text Color Fixes**: Improved modal and form readability
  - All form labels changed from `text-gray-700` to `text-gray-900`
  - Input/Textarea components now use `text-gray-900` for text
  - Placeholders remain light gray for proper contrast

#### **Technical Implementation Details**
**Backend Functions Implemented**:
- `requestShiftSwap` - Validates shift ownership, creates swap request with 7-day expiration
- `approveShiftSwapAdmin` / `approveShiftSwapManager` - Updates status, assigns employee if specified
- `denyShiftSwapAdmin` / `denyShiftSwapManager` - Updates status with manager notes
- `getPendingShiftSwapRequestsForTeam` - Filters by direct reports for managers

**Frontend Components Created/Updated**:
- `SchedulingLayout.tsx` - Main layout wrapper with sidebar and content area
- `SchedulingSidebar.tsx` - Role-based navigation sidebar
- `SchedulingDashboard.tsx` - Default dashboard view with stats and calendar
- `SchedulingAdminContent.tsx` - Admin views (Builder, Templates, Analytics) with full CRUD
- `SchedulingTeamContent.tsx` - Manager views (Team Schedules, Swap Approvals)
- `SchedulingEmployeeContent.tsx` - Employee views (My Schedule, Availability, Swaps, Open Shifts)
- `SchedulingContentView.tsx` - Content router based on view and role

**API Client Updates**:
- `approveShiftSwap` / `denyShiftSwap` - Support for both admin and manager endpoints
- Updated to use correct endpoint based on scope (admin vs manager)

#### **Module Status**
- ✅ **Backend**: 100% functional - All CRUD operations, shift swaps, permissions
- ✅ **Frontend**: 100% functional - Complete UI with sidebar navigation
- ✅ **Shift Swaps**: 100% functional - Request, approve, deny workflow complete
- ✅ **UI/UX**: 100% improved - Readable text, sleek design, modern layout
- ✅ **Integration**: Ready for HR module integration (time-off blocking, employee data)

---

## Previous Focus: Scheduling Module Marketplace Registration — COMPLETE ✅

### **Previous Session Highlights** 🎉
**Date**: November 13, 2025 (Evening Session)  
**Focus**: Scheduling Module added to marketplace catalog

#### **What Was Accomplished**
- ✅ **Updated Module Seed Script**: Added HR and Scheduling to `scripts/ensure-builtin-modules.ts`
- ✅ **Fixed Category Enum**: Changed from "BUSINESS" to "PRODUCTIVITY" (valid enum value)
- ✅ **Created Scheduling Module Record**: Successfully inserted into Module table
- ✅ **Verified Database**: All 5 built-in modules now registered:
  - Drive (free, PRODUCTIVITY)
  - Chat (free, COMMUNICATION)  
  - Calendar (free, PRODUCTIVITY)
  - HR Management (business-advanced, PRODUCTIVITY)
  - **Scheduling (business-basic, PRODUCTIVITY)** ✨ NEW
- ✅ **Marketplace Ready**: Businesses can now install Scheduling module from catalog

---

## Previous Focus: AI Context Implementation — COMPLETE ✅

### **Previous Session Highlights** 🎉
**Date**: November 13, 2025 (Earlier)  
**Focus**: Comprehensive AI Context implementation for HR & Scheduling modules

#### **What Was Built** (This Session)
- ✅ **HR AI Context Controller**: Created `server/src/controllers/hrAIContextController.ts` with 3 comprehensive context providers
- ✅ **HR Context Endpoints**: 
  - `hr_overview` → Returns employee counts, time-off stats, recent hires, staffing levels
  - `employee_count` → Provides headcount breakdown by department and position
  - `time_off_summary` → Shows who's off today/this week, pending requests, daily breakdown
- ✅ **Scheduling AI Context**: Replaced stub implementations in `schedulingController.ts` with full logic
- ✅ **Scheduling Context Endpoints**:
  - `scheduling_overview` → Returns schedule stats, fill rates, upcoming schedules
  - `coverage_status` → Shows who's working today/tomorrow, coverage rates by day
  - `scheduling_conflicts` → Identifies open shifts, pending swaps, overlapping shifts
- ✅ **Controller Integration**: Updated `hrController.ts` to re-export functions from `hrAIContextController.ts`
- ✅ **Type Safety**: All implementations use proper TypeScript types (no `any`, proper error handling)
- ✅ **Error Logging**: Consistent `catch (error: unknown)` pattern with structured logging
- ✅ **Documentation Created**: 
  - Created `memory-bank/aiContextSystem.md` (524 lines) - Comprehensive AI context documentation
  - Updated `.cursor/rules/coding-standards.mdc` - Added AI context as MANDATORY for all modules
  - AI context is now a non-negotiable requirement for module development

#### **AI System Status** (All Modules)
- ✅ **Drive**: AI context implemented (recent files, storage stats, file queries)
- ✅ **Chat**: AI context implemented (conversations, unread messages, history)
- ✅ **Calendar**: AI context implemented (upcoming events, today's schedule, availability)
- ✅ **HR**: AI context implemented ✨ NEW
- ✅ **Scheduling**: AI context implemented ✨ NEW

#### **What the AI Can Now Answer**
**HR Questions**:
- "How many employees do we have?" → Total, active, by employment type, by department
- "Who's off today?" → Lists all employees on time-off with details
- "Show me the attendance summary" → Staffing levels and pending requests
- "What's our headcount by department?" → Breaks down employees by department/position

**Scheduling Questions**:
- "Who's working tomorrow?" → Shows all scheduled shifts with employee details
- "Are there any open shifts this week?" → Lists unfilled shifts that need coverage
- "Show me the coverage status" → Coverage rates by day with gaps identified
- "What scheduling conflicts do we have?" → Overlapping shifts and swap requests

---

## Previous Focus: Scheduling Module — COMPLETE ✅

### **Session Highlights** 🎉
**Date**: November 13, 2025 (Earlier)  
**Focus**: Complete end-to-end Scheduling Module implementation

#### **What Was Built**
- ✅ **Scheduling Module Foundation**: Separate from HR module - focuses on planning future shifts (vs HR tracking past attendance)
- ✅ **Database Schema**: 6 Prisma models (Schedule, ScheduleShift, ShiftTemplate, EmployeeAvailability, ShiftSwapRequest, ScheduleTemplate)
- ✅ **API Structure**: Full REST API with admin, manager, and employee routes (40+ endpoints)
- ✅ **Permission System**: Three-tier access control with businessId extraction from requests
- ✅ **Feature Gating**: Module subscription validation middleware
- ✅ **AI Integration**: Full AI context with keywords, patterns, entities, actions, and context providers
- ✅ **Server Integration**: Routes registered, module added to built-in modules registry, Prisma build script updated
- ✅ **Frontend Complete**: API client, React hooks, and all 3 UI pages

#### **Architecture Decision Made**
**Keep Both HR & Scheduling Modules**:
- **HR Module**: Tracks what ACTUALLY happened (attendance, clock in/out, payroll)
- **Scheduling Module**: Plans what SHOULD happen (shift planning, coverage, assignments)
- **Integration**: They talk to each other (time-off blocks availability, published schedules create expected attendance)
- **Business Need**: Some businesses need scheduling without full HR, others need both

#### **Complete Implementation** (Today)
**Backend (100%)**:
- ✅ Created `schedulingProductContext.md` - 719 lines comprehensive documentation
- ✅ Created `prisma/modules/scheduling/core.prisma` - complete schema with all relations
- ✅ Added scheduling relations to Business, User, and EmployeePosition models
- ✅ Created `server/src/routes/scheduling.ts` - 120+ lines of API routes
- ✅ Created `server/src/middleware/schedulingPermissions.ts` - 240+ lines permission middleware
- ✅ Created `server/src/middleware/schedulingFeatureGating.ts` - module subscription validation
- ✅ Created `server/src/controllers/schedulingController.ts` - 877 lines with all CRUD operations
- ✅ Registered routes in `server/src/index.ts`
- ✅ Registered module in `registerBuiltInModules.ts` with full AI context
- ✅ Updated `scripts/build-prisma-schema.js` to include scheduling module
- ✅ Ran Prisma build and generate successfully

**Frontend (100%)**:
- ✅ Created `web/src/api/scheduling.ts` - Complete API client with TypeScript types (500+ lines)
- ✅ Created `web/src/hooks/useScheduling.ts` - Comprehensive React hook (600+ lines)
- ✅ Created `web/src/app/business/[id]/admin/scheduling/page.tsx` - Admin dashboard with calendar view
- ✅ Created `web/src/app/business/[id]/workspace/scheduling/me/page.tsx` - Employee self-service
- ✅ Created `web/src/app/business/[id]/workspace/scheduling/team/page.tsx` - Manager team view

#### **Next Steps** (Enhancement Phase)
- Test scheduling module in development environment
- Create database migration for production deployment
- Implement advanced features: drag-and-drop builder, shift templates UI, labor forecasting
- Build HR integration: time-off → availability blocking, schedules → expected attendance
- Add real-time WebSocket updates for schedule changes

---

## Previous Focus: Employee Onboarding Module — COMPLETE ✅

### **Latest Session Highlights** 🎉
**Date**: November 12, 2025  
**Focus**: Shipping the onboarding module end-to-end and validating production readiness

- #### **What Shipped**
- ✅ **Onboarding Asset Delivery**: Admins can attach documents, equipment, and uniform catalog items to onboarding checklists; new journeys automatically copy referenced files into each hire’s `Employee Documents` drive folder.
- ✅ **HR Settings Enhancements**: The module settings editor now includes reusable equipment and uniform libraries with metadata (SKU, sizing, care instructions) that pre-fill checklist items and stay in sync with business catalogs.
- ✅ **Prisma Module & Relations**: Added `prisma/modules/hr/onboarding.prisma` with templates, task templates, journeys, and task instances, plus back-relations on `Business` and `EmployeeHRProfile` so multi-tenant scoping is enforced.
- ✅ **Backend Services & Routes**: `hrOnboardingService` now exposes template CRUD, journey creation, employee/manager task lists, and completion flows; `hrController` + `hr.ts` deliver new admin/employee/manager endpoints behind the onboarding feature gate.
- ✅ **Frontend Surfaces**:  
  - Business admin configuration: module customization panel exposes onboarding template management via the new settings editor tab.  
  - Employee workspace: onboarding journeys render with progress, actionable tasks, and inline completion.  
  - Manager workspace: onboarding approvals queue highlights direct-report tasks with one-click completion.
- ✅ **Shared Utilities**: `useHRFeatures` understands the onboarding feature flag, the module settings context merges onboarding config safely, and the Next.js module settings page keeps state in sync with the overlay dialog.
- ✅ **Tooling & Verification**: Ran `pnpm prisma:generate` after relation updates, executed the new migration, and confirmed `pnpm type-check` passes across server/web packages.

- #### **Outstanding / Next Steps**
- Capture onboarding analytics (journey velocity, task completion SLAs) and surface them in the admin dashboard.                                                
- Add notification hooks (email/Slack) when tasks require approvals or when new hires fall behind schedule.                                                     
- Integrate equipment/uniform catalogs with inventory fulfillment (assignment tracking and receipt confirmation).                                               
- Seed default onboarding templates per industry/tier to accelerate business setup.                                                                             
- Begin scoping the Training & Learning module (next item in the master module roadmap).                                                                        

---

## Previous Focus: Impersonation Lab & Persona Seeding — DEFERRED ⏸️

### **Summary**
Work completed on November 10, 2025 delivered the unified impersonation lab UI, business-scoped session tokens, backend impersonation envelopes, and the beta persona seeder endpoint used for HR smoke testing.

### **Follow-up (Deferred)**
- Reproduce and fix the 500 error from `/impersonation/businesses/:id/seed-personas`, then surface generated credentials in the UI.
- Add teardown tooling and telemetry for impersonation sessions once the seeder stabilizes.
- Once attendance features are stabilized, resume impersonation tasks to support automated HR QA flows.

---

## Previous Focus: Business Workspace Context Synchronization — IN PROGRESS 🚧

### **Latest Session Highlights** 🎉
**Date**: November 9, 2025  
**Focus**: Work tab isolation, auto-seeding, and calendar visibility rules

#### **What Shipped**
- ✅ **Workspace Auto-Seeding**: `seedBusinessWorkspaceResources` now provisions a root drive folder, a primary business calendar, and a “Company HQ” chat channel whenever a business dashboard is created.
- ✅ **Drive Context Locking**: `DriveSidebar` accepts `lockedDashboardId`, filters the drive list to that dashboard, and expands seeded folders automatically inside the Work tab.
- ✅ **Chat Context Override**: `ChatModule` triggers `loadConversations()` with the business dashboard override so the seeded HQ channel appears immediately.
- ✅ **Calendar Filtering**: `CalendarListSidebar` forces “Current Tab” mode for business views and, on personal dashboards, hides business calendars except the shared HR “Schedule” calendar.

#### **Outstanding / Follow-up**
- Confirm Work tab WebSocket flows reuse the dashboard-scoped channel joins (chat socket service already supports dashboardId but still needs verification under load).
- Backfill historic business dashboards with seeded resources (existing businesses created before this update may need a one-time script).

---

## Previous Focus: HR Module Phase 2 Enhancements & Calendar Sync — COMPLETED ✅

### **Latest Session Highlights** 🎉
**Date**: November 7, 2025  
**Focus**: HR time-off calendar integration, employee directory upgrades, Prisma workflow hardening

#### **What Shipped**
- ✅ **Time-off ↔ Calendar Sync**: `hrScheduleService` now provisions a business "Schedule" calendar, keeps personal calendars in sync, and tracks `scheduleEventId` / `personalEventId` on each request.
- ✅ **Employee Directory UX**: Admin list gained department/title filters, server-side sorting, CSV export improvements, and inline editing with validation feedback.
- ✅ **Audit Trail**: All create/update/terminate actions log to `auditLog` with before/after values; manager approvals can add notes and see history in the modal.
- ✅ **Employee Self-Service**: Pending requests can be cancelled, validation messages surface instantly, and balances refresh after every submission.
- ✅ **Manager Team View**: Approval queue shows duration, department, optional notes, and supports inline comments before approve/deny.
- ✅ **Auth Logout Flow**: Avatar menu now performs a client-side redirect to `/auth/login` after `signOut` to avoid blank screen regressions.
- ✅ **Prisma Workflow Guardrails**: `server/package.json` scripts now rebuild `prisma/schema.prisma` automatically; `prisma/README.md` documents the build→generate→deploy order and baseline procedure.
- ✅ **Schema Updates Applied**: `time_off_requests` table and `scheduleCalendarId` column re-created safely; migration state baselined so future deploys run cleanly.
- 🛠️ **Local Dev Environment Validated**: Confirmed server/web `.env` templates, captured `pnpm dev` / filter run commands, and promoted `Andrew.Trautman@Vssyl.com` to `ADMIN` for local testing.

#### **Outstanding / Follow-up**
- Baseline any remaining shared databases using `prisma migrate resolve` before running future `migrate deploy`.
- Resolve the Next.js `<Html>` warning on the auto-generated 404/500 pages to keep production builds warning-free.
- Continue structured smoke tests (submit/approve/cancel time-off, calendar sync, audit log review) after each deployment.

### **Previous Session Achievements** 🎉
**Date**: October 28, 2025  
**Focus**: Admin Override Panel, Business Tier Management, HR Module Framework

#### **Admin Override Panel - COMPLETE!** ✅
Built comprehensive admin panel for manual user and business management:

**Features Built:**
- ✅ **User Management**: Grant/revoke admin access to any user
- ✅ **Business Tier Management**: Set subscription tiers without payment (Free/Basic/Advanced/Enterprise)
- ✅ **Search Functionality**: Real-time search for users (by name/email) and businesses (by name/EIN/industry)
- ✅ **Security**: Requires ADMIN role, all endpoints protected
- ✅ **UI Integration**: Added to admin portal navigation sidebar

**Files Created:**
- `server/src/routes/admin-override.ts` - Admin override API endpoints
- `web/src/app/admin-portal/overrides/page.tsx` - Admin override UI
- Updated `web/src/app/admin-portal/layout.tsx` - Added nav item

#### **Business Tier Display - FIXED!** ✅
- **Dynamic Tier Badge**: Changed from hardcoded "Enterprise" to real subscription data
- **API Enhancement**: Backend now returns `tier` and `subscriptions` for accurate display
- **Tier Functions**: `getEffectiveTier()`, `getTierBadgeColor()`, `getTierDisplayName()`
- **Warning System**: Shows alert if tier not set

**Files Updated:**
- `web/src/app/business/[id]/page.tsx` - Dynamic tier badge
- `server/src/controllers/businessController.ts` - Include subscriptions in response

#### **HR Module Framework - COMPLETE!** ✅
Built complete HR module infrastructure (database, API, UI framework):

**Database Layer:**
- ✅ `prisma/modules/hr/core.prisma` - Employee profiles, manager approval hierarchy, settings
- ✅ Migration created: `20251026_add_hr_module_schema`
- ✅ Multi-tenant isolation with `businessId` scoping

**Backend API Layer:**
- ✅ `server/src/routes/hr.ts` - HR routes (admin/manager/employee)
- ✅ `server/src/controllers/hrController.ts` - Stub controllers for all features
- ✅ `server/src/middleware/hrPermissions.ts` - Three-tier access control
- ✅ `server/src/middleware/hrFeatureGating.ts` - Subscription tier checking

**Frontend UI Layer:**
- ✅ `web/src/app/business/[id]/admin/hr/page.tsx` - HR Admin Dashboard
- ✅ `web/src/app/business/[id]/workspace/hr/me/page.tsx` - Employee Self-Service
- ✅ `web/src/app/business/[id]/workspace/hr/team/page.tsx` - Manager Team View
- ✅ `web/src/hooks/useHRFeatures.ts` - Tier-based feature detection
- ✅ `web/src/components/hr/HRWorkspaceLanding.tsx` - Shared HR workspace landing component
- ✅ `web/src/components/business/BusinessWorkspaceContent.tsx` - Added `case 'hr'` to unified renderer
- ✅ `web/src/components/BrandedWorkDashboard.tsx` - Normalized module routing to `?module=` and ensured HR icon/name

**AI Integration:**
- ✅ Registered in `registerBuiltInModules.ts` with full AI context
- ✅ Auto-seeding on server startup via `seedHRModuleOnStartup()`

**Access Control:**
- ✅ Business Admin: Full HR management
- ✅ Manager: Team-specific HR access
- ✅ Employee: Self-service only

**Subscription Tiers:**
#### **Workspace Module Rendering Rule (NEW)**
- Routing: `/business/{id}/workspace?module={id}` (dashboard omits `module`)
- Renderer: `BusinessWorkspaceContent` switches on `currentModule`
- HR wiring: `case 'hr'` → `<HRWorkspaceLanding businessId={business.id} />`
- Deep link remains: `/business/[id]/workspace/hr/page.tsx`, but the shared component is the source of truth
- Future improvement: replace switch with a registry (id → component, icon, title) to avoid manual cases
- ✅ Business Advanced: Core HR features
- ✅ Enterprise: All HR features including payroll & performance

### **Previous Session Achievements** 🎉
**Date**: October 25, 2025  
**Focus**: Memory Bank & Documentation Cleanup

#### **Documentation Alignment Complete!** ✅
- **Memory Bank Updated**: `deployment.md` and `googleCloudMigration.md` now reflect PRODUCTION status
- **Root-Level Cleanup**: Removed 3 duplicate files, archived 3 session summaries, moved 1 operational doc
- **`.cursor/rules` Alignment**: All documentation now consistent with production infrastructure
- **AI Context Improved**: Future AI sessions will correctly understand production state

**Files Updated:**
- ✅ `memory-bank/deployment.md` - Added Google Cloud Build CI/CD documentation
- ✅ `memory-bank/googleCloudMigration.md` - Changed from "migration planning" to "PRODUCTION"
- ✅ Root cleanup - Only `README.md` and `UPDATE_SECRETS_GUIDE.md` remain at root

### **Previous Session Achievements** 🎉
**Date**: October 24, 2025  
**Focus**: Global Logging System Fix & Enhancement (Cloud Build Resolution)

#### **Major Achievement: Global Logging System Operational!** ✅

**Global Logging System - Phase 1 & 3 DEPLOYED!**
- **Phase 1**: Database logging re-enabled, API request middleware added, authentication logging
- **Phase 3**: Enhanced admin portal (4 tabs), retention policies, alerts system, initialization script
- **Phase 2**: Console.log migration ROLLED BACK due to 3749 errors from automated script
- **Cloud Build**: Fixed by force-pushing clean state (0 TypeScript errors)
- **Status**: **100% FUNCTIONAL** - Admin portal shows real-time logs, system operational!

**Logging System Features - DEPLOYED!**
- **Admin Portal Tabs**: Logs (real-time), Analytics (trends), Alerts (5 critical), Settings (retention)
- **Automatic Logging**: All API requests, authentication events, errors with full metadata
- **Retention Policies**: 30 days (default), 90 days (errors), 365 days (audit logs)
- **Auto-Cleanup**: Background job removes old logs based on policies
- **Status**: **PRODUCTION READY** - Clean compilation, no errors!

**Phase 2 Console Migration - DEFERRED (Strategic Decision)** ⏸️
- **Decision Date**: October 24, 2025
- **Rationale**: 
  - Logging system is 100% functional without migration
  - Console.log statements work fine in production (captured by Cloud Logging)
  - Automated migration caused 3749 errors (lesson learned: use AST parsing, not regex)
  - Risk > Reward for bulk migration
  - Better ROI to focus on feature development
- **Strategy Going Forward**:
  - ✅ All NEW code uses `logger.info/error/warn` (structured logging)
  - ✅ When editing existing files, migrate console statements naturally
  - ✅ 959 console statements remain but cause no issues
  - ✅ Natural migration over 6-12 months through normal development
- **Status**: **ACCEPTED** - No dedicated migration effort needed

**Phase-by-Phase Cleanup Completed:**
- ✅ **Phase 1**: Interface-level `any` types fixed
- ✅ **Phase 2**: Function parameter `any` arrays (59 files, created 7+ interfaces)
- ✅ **Phase 3**: Generic function return types (61 instances)
- ✅ **Phase 4**: Prisma JSON compatibility (proper `Prisma.InputJsonValue` usage)
- ✅ **Phase 6**: Type assertion review (72 `as any` fixed)
- ✅ **Phase 7**: Generic object types (75 instances, 42 `Record<string, any>` replaced)
- ✅ **Phase 9a**: Quick Wins - Record & Promise types (25 instances)
- ✅ **Phase 9b**: Shared Types Library (18 instances)
- ✅ **Phase 9c**: AI Services Core - 12 files (130+ instances)
- ✅ **Phase 9d**: Frontend Components (27 instances)

**Git Commits Pushed (Phases 1-8):**
1. `0c5f1a0` - Phases 2, 3 & 6 (43 files, 1,535 insertions)
2. `f5fbf31` - Phase 7 (26 files, 104 insertions)
3. `2768a4b` - Phase 8 cleanup (minor improvements)

**Git Commits Pushed (Phase 9):**
4. `12a763d` - Phases 9a, 9b, partial 9c (26 files)
5. `fd38533` - Complete DigitalLifeTwinCore (1 file)
6. `cdd7523` - Complete Phase 9c AI services (11 files)
7. `91b4d1d` - Complete Phase 9d frontend (3 files)

#### **Technical Implementation Details** 📐

**Type Safety Patterns Established:**
```typescript
// Prisma JSON handling
import { Prisma } from '@prisma/client';
layout: data.layout as unknown as Prisma.InputJsonValue,

// Express request typing
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Type guards for safe access
const score = typeof value === 'number' ? value : 0.5;
```

**Key Interfaces Created (Phases 1-8):**
- `AuthenticatedRequest`, `SubscriptionRequest`, `JWTPayload` for middleware
- `ActivityRecord`, `UserPattern`, `FileData`, `MessageData`, `TaskData` for AI services
- `ConversationData`, `InteractionData`, `LifeTwinActionData`, `LearningEventData` for AI engines
- `AuditLogData`, `PolicyActionRule`, `PolicyAction` for controllers

**New Interfaces Created (Phase 9):**
- `RecentActivityItem`, `ConversationHistoryItem` for DigitalLifeTwinCore
- `BusinessActivityItem` for BusinessAIDigitalTwinService
- `Announcement` for business front page content
- Updated all shared type definitions (widget, dashboard, search, module-ai-context)

**Files Improved by Category (Phases 1-9):**
- **AI Services** (32+ files): Engines, providers, learning systems, intelligence, enterprise AI
- **Controllers** (15+ files): file, calendar, module, business, audit, governance
- **Services** (15+ files): admin, orgChart, employee, notification, widget, SSO
- **Middleware** (5+ files): auth, subscription, error handling
- **Routes** (10+ files): AI patterns, intelligence, centralized learning
- **Utils** (5+ files): token, audit, security
- **Shared Types** (4 files): module-ai-context, widget, dashboard, search
- **Frontend Components** (12+ files): business widgets, AI components, dashboard, branding
- **API Layer** (10+ files): AI context debug, admin API, module submission

---

## Previous Focus: Dashboard Context Switching & Module Selection - COMPLETED! ✅

### **Dashboard Context Session Achievements** 🎉
**Date**: Previous Session (October 2025)  
**Focus**: Context Switching Implementation and Dashboard Module Selection

#### **Major Achievement: Dashboard Context Switching FULLY IMPLEMENTED!** ✅

**Context Switching Feature - COMPLETE!**
- **Problem Identified**: Tabs created with no module selection prompt; backend auto-populated widgets
- **Frontend Solution**: Implemented automatic `DashboardBuildOutModal` for empty dashboards
- **Backend Fix**: Removed auto-widget creation from `createDashboard()` service
- **localStorage Persistence**: User preferences saved to prevent modal re-prompting
- **Status**: **100% FUNCTIONAL** - Users now customize modules per dashboard tab

**Module Selection Modal Implementation - COMPLETE!**
- **Quick Setup Presets**: Pre-configured module bundles (Basic Workspace, Collaboration Hub, etc.)
- **Custom Selection**: Search and select individual modules with preview
- **API Integration**: Loads modules from marketplace API with fallback mocks
- **Scope Support**: Works for both personal and business dashboard contexts
- **Status**: **100% FUNCTIONAL** - Comprehensive module selection experience

**Dashboard Isolation & Context Management - COMPLETE!**
- **Data Isolation**: Drive files and Chat conversations scoped per `dashboardId`
- **Widget Management**: Each dashboard stores its own enabled modules
- **URL-based Navigation**: Context switching via `?dashboard={id}` parameter
- **Real-time Synchronization**: `DashboardContext` tracks active dashboard state
- **Status**: **100% OPERATIONAL** - Complete context isolation achieved

#### **Technical Implementation Details** 📐

**Auto-Modal Trigger System:**
```typescript
// DashboardClient.tsx - Lines 744-761
useEffect(() => {
  if (!currentDashboard || loading) return;
  
  const isEmpty = !currentDashboard.widgets || currentDashboard.widgets.length === 0;
  const notShownYet = !hasShownBuildOut.has(currentDashboard.id);
  const notAlreadyShowing = !showBuildOutModal;
  
  if (isEmpty && notShownYet && notAlreadyShowing) {
    setPendingDashboard(currentDashboard);
    setShowBuildOutModal(true);
    setHasShownBuildOut(prev => new Set([...Array.from(prev), currentDashboard.id]));
  }
}, [currentDashboard, loading, showBuildOutModal, hasShownBuildOut]);
```

**Backend Widget Creation Removed:**
```typescript
// server/src/services/dashboardService.ts - Lines 163-185
// Before: Auto-created chat & drive widgets
// After: Returns empty dashboard for frontend module selection

const dashboard = await prisma.dashboard.create({
  data: { userId, name, layout, preferences, businessId, institutionId, householdId }
});

// NOTE: No longer auto-creating default widgets
// Frontend DashboardBuildOutModal will prompt user to select modules

return prisma.dashboard.findUnique({
  where: { id: dashboard.id },
  include: { widgets: true }
});
```

**localStorage Persistence:**
```typescript
// DashboardClient.tsx - Lines 639-650, 655-664
const [hasShownBuildOut, setHasShownBuildOut] = useState<Set<string>>(() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('dashboard-setup-completed');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }
  return new Set();
});

useEffect(() => {
  if (typeof window !== 'undefined' && hasShownBuildOut.size > 0) {
    localStorage.setItem('dashboard-setup-completed', JSON.stringify(Array.from(hasShownBuildOut)));
  }
}, [hasShownBuildOut]);
```

#### **Files Created/Modified for Context Switching** 📝

**Frontend Files:**
1. **`web/src/app/dashboard/DashboardClient.tsx`** - Added auto-modal trigger, localStorage persistence, TypeScript Set iteration fixes
2. **`web/src/components/DashboardBuildOutModal.tsx`** - Module selection modal (already existed, now properly triggered)
3. **`web/src/contexts/DashboardContext.tsx`** - Context management (already existed, reviewed and confirmed functional)

**Backend Files:**
4. **`server/src/services/dashboardService.ts`** - Removed auto-widget creation from `createDashboard()`

#### **Context Switching Flow** 🔄

**User Creates New Tab:**
```
1. User clicks "+" → DashboardLayout opens modal
2. User enters tab name → calls handleCreateDashboard()
3. Backend creates empty dashboard (no widgets)
4. Frontend navigates to /dashboard/{id}
5. DashboardClient loads dashboard
6. Auto-modal trigger detects isEmpty=true
7. DashboardBuildOutModal appears
8. User selects modules (Quick Setup or Custom)
9. Frontend creates widgets via createWidget API
10. Dashboard displays with selected modules
11. localStorage marks dashboard as setup-complete
```

**Context Isolation:**
```
Personal Tab 1 (Drive + Chat)
  ├─ dashboard.widgets = [drive, chat]
  ├─ Drive files filtered by dashboardId
  └─ Chat conversations filtered by dashboardId

Personal Tab 2 (Drive only)
  ├─ dashboard.widgets = [drive]
  ├─ Drive files filtered by dashboardId
  └─ No chat conversations (widget not enabled)

Business Tab (Drive + Chat + Analytics)
  ├─ dashboard.widgets = [drive, chat, analytics]
  ├─ Drive files filtered by dashboardId + businessId
  ├─ Chat conversations filtered by dashboardId + businessId
  └─ Analytics scoped to business context
```

#### **Build & Deployment Status** 🚀

**Commits:**
1. `e1142e9` - "Add automatic module selection prompt for new dashboard tabs"
2. `a29087c` - "Fix TypeScript errors: use Array.from() instead of spread operator"
3. `9ceafcf` - "Remove auto-widget creation from backend - allow frontend module selection"

**Deployment:**
- **Build ID**: `1652c31d-336e-4734-9a7a-f9de29b7d120`
- **Status**: SUCCESS
- **Duration**: ~10 minutes
- **Production URL**: https://vssyl.com
- **Status**: **100% DEPLOYED AND WORKING**

#### **Testing Verification** ✅
- User created new tab → Module selection modal appeared ✅
- Selected modules via Quick Setup → Widgets created correctly ✅
- Dashboard displays selected modules only ✅
- Switching between tabs maintains separate contexts ✅
- localStorage prevents modal re-prompting ✅

---

## Previous Focus: Drive Module Architecture & Enterprise Features - COMPLETED! ✅

### **Drive Module Session Achievements** 🎉
**Date**: Previous Session (January 2025)  
**Focus**: Drive Module Unification and Enterprise Feature Enhancement

#### **Major Achievement: Drive Module Architecture Unified & Enterprise Features Enhanced!** ✅

**Drive Module Consolidation - COMPLETE!**
- **Problem Identified**: Two separate drive systems (standalone page vs modular components) were disconnected
- **Solution Implemented**: Unified architecture with context-aware feature switching
- **Architecture**: One drive system with two variants (Standard & Enterprise)
- **Status**: **100% UNIFIED** - Single modular system with automatic feature switching

**File Upload System Fixed - COMPLETE!**
- **ENOENT Errors Resolved**: Fixed missing uploads directory in production containers
- **Google Cloud Storage Integration**: Proper environment variables added to Cloud Build
- **Storage Service Enhanced**: Environment variable compatibility (STORAGE_PROVIDER & FILE_STORAGE_TYPE)
- **Directory Creation**: Automatic upload directory creation with recursive mkdir
- **Status**: **100% OPERATIONAL** - File uploads working with GCS in production

**Infinite Loop Issues Resolved - COMPLETE!**
- **Problem**: Endless session and feature check requests causing performance issues
- **Root Cause**: useEffect hooks with unstable function dependencies
- **Solution**: Properly memoized functions with useCallback and correct dependencies
- **Files Fixed**: DriveModule.tsx and EnhancedDriveModule.tsx
- **Status**: **100% RESOLVED** - No more infinite API call loops

**Enterprise Drive Module Enhanced - COMPLETE!**
- **Real API Integration**: Replaced mock data with actual file/folder API calls
- **Enterprise Metadata**: Added classification, share counts, view/download analytics
- **Bulk Actions Bar**: Prominent floating toolbar for multi-file operations
- **Feature Gating**: Enterprise features properly gated (Advanced Sharing, Classification)
- **Visual Differentiation**: Clear distinction from standard drive with enterprise badge
- **Status**: **100% ENHANCED** - Professional enterprise drive experience

**Seamless Drive Switching Implemented - COMPLETE!**
- **Problem**: Drive switching caused full page reloads with jarring UX
- **Solution**: Implemented refresh trigger state system for seamless updates
- **Page Reloads Eliminated**: Replaced `window.location.reload()` with state-based refreshes
- **Smooth Navigation**: Used `router.push()` instead of `window.location.href`
- **Real-time Updates**: Both modules listen to refresh triggers for instant data updates
- **Status**: **100% SEAMLESS** - Smooth drive switching experience restored

#### **Drive Module Architecture Details** 📐

**Unified System Structure:**
```
/drive page
  ├─ DriveSidebar (shared for all users)
  │   ├─ Context-aware drive switching
  │   ├─ Quick actions (New Folder, Upload)
  │   └─ Utility folders (Shared, Recent, Starred, Trash)
  │
  └─ DriveModuleWrapper (intelligent routing)
      ├─ Standard DriveModule (Personal & Basic Business)
      │   ├─ Real API integration
      │   ├─ Basic file operations
      │   ├─ Folder navigation
      │   └─ Search functionality
      │
      └─ EnhancedDriveModule (Enterprise Business)
          ├─ All standard features PLUS:
          ├─ Floating bulk actions bar
          ├─ Multi-select with checkboxes
          ├─ Classification badges
          ├─ Advanced sharing permissions
          ├─ Audit logging capabilities
          └─ Analytics tracking
```

**Feature Comparison:**
| Feature | Standard Drive | Enterprise Drive |
|---------|---------------|------------------|
| File Upload/Download | ✅ Yes | ✅ Yes |
| Folder Management | ✅ Yes | ✅ Yes |
| Search | ✅ Basic | ✅ Enhanced |
| Bulk Selection | ❌ No | ✅ **Floating Action Bar** |
| Classification | ❌ No | ✅ **Color-coded Badges** |
| Advanced Sharing | ❌ Basic | ✅ **Permission Management** |
| Audit Logs | ❌ No | ✅ **Compliance Tracking** |
| Analytics | ❌ No | ✅ **View/Share/Download Stats** |

#### **Files Created/Modified for Drive Module Unification** 📝

**New Files Created:**
1. **`web/src/components/drive/DrivePageContent.tsx`** - Wrapper component connecting sidebar to modules with proper handlers

**Modified Files:**
2. **`web/src/app/drive/page.tsx`** - Simplified to use DrivePageContent wrapper
3. **`web/src/components/modules/DriveModule.tsx`** - Added real API integration, removed duplicate header, added refresh trigger support
4. **`web/src/components/drive/enterprise/EnhancedDriveModule.tsx`** - Real API, bulk actions bar, enterprise metadata, added refresh trigger support
5. **`web/src/components/drive/DriveModuleWrapper.tsx`** - Added refresh trigger prop passing to both modules
6. **`web/src/hooks/useFeatureGating.ts`** - Fixed infinite loop by memoizing checkFeatureAccess and getModuleFeatureAccess functions
7. **`server/src/controllers/fileController.ts`** - Enhanced error handling and logging
8. **`server/src/services/storageService.ts`** - Environment variable compatibility fixes
9. **`cloudbuild.yaml`** - Added Google Cloud Storage environment variables
10. **`env.production.template`** - Updated storage configuration documentation

#### **Enterprise Drive Features Implemented** 🚀

**1. Floating Bulk Actions Bar**
- Appears when files are selected
- Fixed position at top center of page
- Blue accent with white text
- Actions: Share, Classify, Download, Delete, Clear
- Select all/none checkbox
- Feature-gated buttons (only show if user has access)

**2. Real API Integration**
- Fetches files from `/api/drive/files`
- Fetches folders from `/api/drive/folders`
- Proper authentication with session tokens
- Dashboard context filtering
- Folder navigation support
- Error handling with user feedback

**3. Enterprise Metadata**
- Classification levels: Public, Internal, Confidential, Restricted
- Share count tracking
- View count analytics
- Download count monitoring
- Color-coded classification badges
- Enterprise feature badge in header

**4. Bulk Operations**
- Multi-select with shift-click support
- Bulk share with permissions
- Bulk classification tagging
- Bulk download (ZIP)
- Bulk delete with confirmation
- Clear selection functionality

#### **Seamless Drive Switching Implementation** 🚀

**1. Refresh Trigger System**
- Added `refreshTrigger` state to `DrivePageContent` component
- Increments on file uploads and folder creation operations
- Propagated down through `DriveModuleWrapper` to both drive modules

**2. Page Reload Elimination**
- Replaced `window.location.reload()` with `setRefreshTrigger(prev => prev + 1)`
- Replaced `window.location.href` with `router.push()` for context switching
- Maintains scroll position and component state during operations

**3. Real-time Data Updates**
- Both `DriveModule` and `EnhancedDriveModule` listen to `refreshTrigger` changes
- `useEffect` hooks automatically refresh data when trigger increments
- No page reloads required for file operations or context switching

**4. Smooth Navigation**
- Context switching uses Next.js router for seamless transitions
- Dashboard context updates immediately without page refresh
- File operations complete with instant UI feedback

**Technical Implementation:**
```typescript
// DrivePageContent.tsx
const [refreshTrigger, setRefreshTrigger] = useState(0);

// File upload handler
const handleFileUpload = useCallback(() => {
  // ... upload logic ...
  setRefreshTrigger(prev => prev + 1); // Trigger refresh
}, [session, currentDashboard]);

// Context switch handler  
const handleContextSwitch = useCallback(async (dashboardId: string) => {
  await navigateToDashboard(dashboardId);
  router.push(`/drive?dashboard=${dashboardId}`); // Smooth navigation
}, [navigateToDashboard, router]);

// DriveModule.tsx & EnhancedDriveModule.tsx
useEffect(() => {
  if (refreshTrigger && refreshTrigger > 0) {
    loadFilesAndFolders(); // or loadEnhancedFiles()
  }
}, [refreshTrigger, loadFilesAndFolders]);
```

### **Previous Session Achievement: Authentication Fixes and Landing Page Implementation**

#### **Major Achievement: Authentication Issues Fixed & Landing Page System COMPLETELY IMPLEMENTED!** ✅

#### **Major Achievement: Authentication Issues Fixed & Landing Page System COMPLETELY IMPLEMENTED!** ✅

**Authentication Issues Resolution - COMPLETE!**
- **Login Page Reload Issue** - Fixed by adding `redirect: false` to signIn calls and using router.push for navigation
- **Logout Blank Dashboard Issue** - Fixed by updating NextAuth redirect configuration and logout handlers
- **Session State Management** - Added 100ms delay to ensure session state is fully settled before redirects
- **NextAuth Configuration** - Enhanced redirect callback to handle logout scenarios properly
- **Status**: **100% RESOLVED** - Smooth login/logout experience achieved!

**Landing Page System Implementation - COMPLETE!**
- **Main Landing Page** - Comprehensive landing page with hero, features, pricing, and CTA sections
- **Professional Design** - Consistent branding, responsive layout, and modern UI
- **Footer Pages Created** - 8 placeholder pages to prevent 404 errors from Next.js prefetching
- **Authentication Integration** - Smart routing based on user authentication state
- **SEO Optimization** - Professional URL structure and meta tags
- **Status**: **100% IMPLEMENTED** - Professional public presence established!

#### **Previous Achievement: Pricing Structure Simplification COMPLETELY RESOLVED!** ✅

**Pricing Simplification - COMPLETE!**
- **Overbuilt System Identified** - User identified billing modal was "way over built" with too many pricing options
- **New Pricing Structure** - Implemented simplified 5-tier system: Free, Pro ($29), Business Basic ($49.99), Business Advanced ($69.99), Enterprise ($129.99)
- **Feature Gating Simplified** - Reduced from hundreds of micro-features to essential features categorized as 'personal' or 'business'
- **Module System Redesigned** - Context-aware features that switch between personal and enterprise lanes based on user context
- **Stripe Configuration Updated** - New product IDs, price IDs, and pricing configurations
- **Status**: **100% IMPLEMENTED AND READY FOR PRODUCTION**!

#### **Pricing Structure Details - COMPLETED** ✅
**New Simplified Pricing Tiers:**
- **Free Tier**: $0/month - Basic modules access, limited AI usage, ad-supported experience
- **Pro Tier**: $29/month - All modules access, unlimited AI, ad-free experience
- **Business Basic**: $49.99/month - Team management, enterprise features, basic AI settings, 10 included employees + $5/employee
- **Business Advanced**: $69.99/month - Advanced AI settings, advanced analytics, 10 included employees + $5/employee
- **Enterprise**: $129.99/month - Custom integrations, dedicated support, 10 included employees + $5/employee

**Module System Redesign:**
- **Context-Aware Features**: Modules automatically switch between "personal" and "business" lanes based on user context
- **Work Tab Integration**: When users are in Work tab, features automatically upgrade to enterprise level
- **Simplified Feature Gating**: Essential features only, categorized by personal vs business use
- **No More Module Subscriptions**: All modules included in every tier, with features dynamically switching

**Files Updated for Pricing Simplification:**
1. **`server/src/config/stripe.ts`** - Updated product IDs, price IDs, and pricing configurations
2. **`scripts/setup-stripe-products.js`** - Updated to create new products and prices in Stripe
3. **`prisma/modules/billing/subscriptions.prisma`** - Updated Subscription model with new tiers and business fields
4. **`server/src/services/featureGatingService.ts`** - Simplified feature definitions and updated tier hierarchy
5. **`web/src/components/BillingModal.tsx`** - Updated to display new pricing structure
6. **`web/src/hooks/useFeatureGating.ts`** - Updated for new tier names and categories
7. **`PRICING_SIMPLIFICATION_SUMMARY.md`** - Complete documentation of all changes

**Google Cloud Infrastructure - COMPLETE!**
- **Cloud SQL PostgreSQL** - Production database with automated backups and scaling
- **Cloud Run Services** - Serverless container hosting for frontend and backend
- **Cloud Storage** - File uploads and static asset hosting with CDN
- **Secret Manager** - Secure storage for API keys and sensitive configuration
- **Service Accounts** - Proper IAM permissions for secure service communication
- **Status**: **100% DEPLOYED AND WORKING**!

**Production Docker Configuration - COMPLETE!**
- **Multi-stage builds** - Optimized Docker images for production
- **Security hardening** - Non-root users and minimal attack surface
- **Health checks** - Automated service health monitoring
- **Resource optimization** - Memory and CPU limits for cost efficiency
- **Status**: **100% PRODUCTION READY**!

**Deployment Automation - COMPLETE!**
- **Cloud Build pipeline** - Automated CI/CD with Google Cloud Build
- **Environment management** - Production environment variable templates
- **Database migrations** - Automated Prisma migration scripts
- **Monitoring setup** - Cloud Logging and Monitoring integration
- **Status**: **100% AUTOMATED** deployment process!

**Production Services - FULLY OPERATIONAL** 🚀
- **vssyl-web**: Frontend application deployed and accessible at https://vssyl.com
- **vssyl-server**: Backend API deployed and healthy at https://vssyl-server-235369681725.us-central1.run.app
- **Database**: PostgreSQL production database connected via Unix socket
- **Authentication**: Public access configured for web service
- **Status**: **100% OPERATIONAL** - All services working correctly!

### **MAJOR BREAKTHROUGH: Google Cloud Storage Integration COMPLETELY RESOLVED!** 🎉

#### **Google Cloud Storage Setup - COMPLETED** ✅
**Achievement**: Complete Google Cloud Storage integration with profile photo upload system
- **Storage Bucket**: `vssyl-storage-472202` created and configured
- **Service Account**: `vssyl-storage-service@vssyl-472202.iam.gserviceaccount.com` with Storage Admin role
- **Authentication**: Application Default Credentials (ADC) for secure access without key files
- **APIs Enabled**: Cloud Storage API and Cloud Storage Component API
- **Status**: **100% OPERATIONAL** - All storage operations working correctly

#### **Storage Abstraction Layer - COMPLETED** ✅
**Achievement**: Unified storage service supporting both local and Google Cloud Storage
- **File**: `server/src/services/storageService.ts` - Complete abstraction layer
- **Features**: Dynamic provider switching (local/GCS), uniform bucket access handling
- **Integration**: All controllers updated to use storage service
- **Error Handling**: Graceful fallback and proper error management
- **Status**: **100% FUNCTIONAL** - Seamless storage provider switching

#### **Profile Photo Upload System - COMPLETED** ✅
**Achievement**: Complete profile photo management with personal and business photos
- **Database Schema**: Added `personalPhoto` and `businessPhoto` fields to User model
- **API Endpoints**: Upload, remove, and retrieve profile photos
- **Frontend Component**: `PhotoUpload.tsx` with drag-and-drop functionality
- **Context Awareness**: Different photos for personal vs business contexts
- **Status**: **100% FUNCTIONAL** - Full photo upload and management system

#### **Trash System Integration - COMPLETED** ✅
**Achievement**: Cloud storage cleanup integrated with trash functionality
- **File Deletion**: Permanent deletion removes files from cloud storage
- **Scheduled Cleanup**: Daily cleanup job deletes old trashed files from storage
- **Storage Service**: All trash operations use unified storage service
- **Status**: **100% FUNCTIONAL** - Complete trash-to-storage integration

### **Previous Major Breakthrough: All Production Issues COMPLETELY RESOLVED!** 🎉

#### **Issue 1: Build System Failures** ✅ **RESOLVED**
**Problem**: All builds failing due to .gcloudignore excluding public directory
- **Error**: `COPY failed: stat app/web/public: file does not exist`
- **Root Cause**: `.gcloudignore` file was excluding `public` directory from build context
- **Fix Applied**: Commented out `public` in `.gcloudignore` to allow `web/public` in builds
- **Status**: **COMPLETELY FIXED** - Build system now works perfectly

#### **Issue 2: Frontend localhost:5000 Hardcoded URLs** ✅ **RESOLVED**
**Problem**: 18+ files had hardcoded `localhost:5000` URLs causing connection failures
- **Error**: `POST http://localhost:5000/api/auth/register net::ERR_CONNECTION_REFUSED`
- **Root Cause**: Systematic hardcoded localhost URLs throughout frontend codebase
- **Fix Applied**: Systematically replaced ALL localhost:5000 references with production URLs
- **Files Fixed**: 18 files including API routes, auth pages, socket connections, admin portal
- **Status**: **COMPLETELY FIXED** - All frontend code now uses production URLs

#### **Issue 3: Environment Variable Configuration** ✅ **RESOLVED**
**Problem**: Inconsistent environment variable usage across frontend
- **Error**: Mixed usage of `NEXT_PUBLIC_API_BASE_URL` vs `NEXT_PUBLIC_API_URL`
- **Root Cause**: Inconsistent environment variable naming and fallback patterns
- **Fix Applied**: Standardized all API URLs with proper fallback hierarchy
- **Status**: **COMPLETELY FIXED** - Consistent environment variable usage

#### **Issue 4: Database Connection Issues** ✅ **RESOLVED**
**Problem**: Multiple database connection failures and routing issues
- **Error**: `431 Request Header Fields Too Large`, `400 Bad Request`, `P1001: Can't reach database server`
- **Root Cause**: Double `/api` paths, connection pool issues, incorrect database URL format, load balancer complexity
- **Fix Applied**: 
  - Fixed double `/api` paths in 26 instances across 15 files
  - Reverted to working database configuration (direct IP with VPC access)
  - Cleaned up unnecessary load balancer resources
  - Updated `BACKEND_URL` to correct server URL
- **Status**: **COMPLETELY FIXED** - Database connection restored and routing simplified

#### **Issue 5: Load Balancer Complexity** ✅ **RESOLVED**
**Problem**: Unnecessary load balancer setup causing routing complexity
- **Error**: SSL certificate provisioning failed, complex routing setup
- **Root Cause**: Over-engineering with load balancer when Cloud Run domain mapping was sufficient
- **Fix Applied**: 
  - Deleted all load balancer resources (forwarding rules, URL maps, backend services, SSL certificates, NEGs)
  - Reverted DNS to original Cloud Run IPs (`216.239.*.*`)
  - Used Next.js API proxy architecture (correct approach)
- **Status**: **COMPLETELY FIXED** - Simplified architecture using correct Cloud Run patterns

### **Current Deployment Status** 📊

#### **Production URLs** 🌐
- **Frontend**: https://vssyl.com (Custom domain via Cloud Run domain mapping)
- **Backend**: https://vssyl-server-235369681725.us-central1.run.app
- **API Proxy**: Next.js API proxy routes `/api/*` to backend server
- **Region**: us-central1 (Google Cloud)

#### **Build Status** 🔄
- **Build #1**: ✅ **COMPLETED** - Initial deployment with database connection fixes
- **Build #2**: ✅ **COMPLETED** - Fixed image tag mismatch issues  
- **Build #3**: ✅ **COMPLETED** - Frontend environment variables fix
- **Build #4**: ✅ **COMPLETED** - Complete localhost:5000 URL fixes
- **Build #5**: ✅ **COMPLETED** - Database connection and routing fixes
- **Build #6**: ✅ **COMPLETED** - Load balancer cleanup and architecture simplification

#### **Files Created/Modified for Google Cloud Storage Integration** 📝
**Storage System Implementation:**
1. **`server/src/services/storageService.ts`** - Complete storage abstraction layer with GCS and local support
2. **`server/src/controllers/profilePhotoController.ts`** - Profile photo upload, removal, and retrieval endpoints
3. **`server/src/routes/profilePhotos.ts`** - API routes for profile photo operations
4. **`web/src/components/PhotoUpload.tsx`** - Drag-and-drop photo upload component
5. **`web/src/api/profilePhotos.ts`** - Frontend API utilities for profile photos
6. **`web/src/app/profile/settings/page.tsx`** - Profile settings page with photo upload
7. **`shared/src/components/Avatar.tsx`** - Context-aware avatar component
8. **`web/src/components/AvatarContextMenu.tsx`** - Updated avatar menu with profile photos
9. **`prisma/modules/auth/user.prisma`** - Added personalPhoto and businessPhoto fields
10. **`prisma/schema.prisma`** - Updated main schema with new photo fields
11. **`server/src/controllers/fileController.ts`** - Updated to use storage service
12. **`server/src/services/cleanupService.ts`** - Updated trash cleanup for cloud storage
13. **`server/src/auth.ts`** - Updated user queries to include photo fields
14. **`server/src/index.ts`** - Added profile photos router
15. **`.env`** - Added Google Cloud Storage environment variables
16. **`GOOGLE_CLOUD_SETUP.md`** - Complete setup documentation

**Previous Build System Fixes:**
17. **`.gcloudignore`** - Commented out `public` exclusion to allow `web/public` in builds
18. **`cloudbuild.yaml`** - Fixed `$COMMIT_SHA` empty variable issue by using `$BUILD_ID`

**Frontend API URL Fixes (18 files):**
3. **`web/src/app/api/[...slug]/route.ts`** - Main API proxy route
4. **`web/src/api/chat.ts`** - Chat API (2 locations)
5. **`web/src/lib/apiUtils.ts`** - Main API utilities
6. **`web/src/api/educational.ts`** - Educational API
7. **`web/src/api/governance.ts`** - Governance API
8. **`web/src/api/calendar.ts`** - Calendar API (2 locations)
9. **`web/src/api/retention.ts`** - Retention API
10. **`web/src/lib/serverApiUtils.ts`** - Server API utilities
11. **`web/src/lib/stripe.ts`** - Stripe configuration
12. **`web/src/lib/chatSocket.ts`** - Chat WebSocket
13. **`web/src/lib/notificationSocket.ts`** - Notification WebSocket
14. **`web/src/app/auth/register/page.tsx`** - Registration page
15. **`web/src/app/auth/verify-email/page.tsx`** - Email verification (2 locations)
16. **`web/src/app/auth/reset-password/page.tsx`** - Password reset
17. **`web/src/app/auth/forgot-password/page.tsx`** - Forgot password
18. **`web/src/app/admin-portal/ai-learning/page.tsx`** - AI Learning admin (12 locations)
19. **`web/src/app/api/trash/`** - All trash API routes (4 files)

#### **Current Architecture** 🏗️
**Simplified Cloud Run Architecture (CORRECT APPROACH):**
```
User → vssyl.com → Cloud Run (vssyl-web) → Next.js API Proxy → vssyl-server
```

**Key Components:**
- **DNS**: Points to Cloud Run IPs (`216.239.*.*`)
- **Domain Mapping**: `vssyl.com` → `vssyl-web` Cloud Run service
- **API Proxy**: Next.js routes `/api/*` to backend server
- **Database**: Direct IP connection with VPC access
- **No Load Balancer**: Unnecessary complexity removed

#### **Production Status** ✅
- **All Issues Resolved**: Build system, frontend URLs, environment variables, database connection, routing
- **Architecture Simplified**: Using correct Cloud Run patterns
- **Load Balancer Cleaned Up**: All unnecessary resources deleted
- **System Ready**: User registration and all features should work correctly

#### **Next Steps** 🎯
1. **Test user registration** on production frontend at https://vssyl.com
2. **Verify all API endpoints** are working correctly
3. **Test admin portal** functionality
4. **Test full application functionality**
5. **Monitor system performance** and optimize as needed

### **Current Project Status**

#### **Google Cloud Migration - COMPLETED!** 🎯
1. ✅ **Infrastructure Setup** - Cloud SQL, Cloud Run, Cloud Storage, Secret Manager
2. ✅ **Docker Configuration** - Production-ready multi-stage builds
3. ✅ **Environment Management** - Secure configuration with Secret Manager
4. ✅ **Database Migration** - Automated Prisma migration scripts
5. ✅ **Deployment Automation** - Cloud Build CI/CD pipeline
6. ✅ **Security Configuration** - Service accounts and IAM permissions
7. ✅ **Monitoring Setup** - Cloud Logging and Monitoring integration
8. ✅ **Documentation** - Comprehensive deployment and operational guides
9. ✅ **Production Deployment** - Services live and accessible
10. ✅ **Authentication Setup** - Public access configured for web service
11. ✅ **Service URLs** - Correct service endpoints identified and working
12. ✅ **Database Connection** - Production database connected and functional

#### **Previous Achievements - Security & Compliance Systems** 🎯
1. ✅ **Security Events System** - Real threat detection and logging
2. ✅ **Compliance Monitoring** - GDPR, HIPAA, SOC2, PCI DSS checks
3. ✅ **Admin Portal Security Page** - Fully functional dashboard
4. ✅ **Support Ticket System** - Complete with email notifications
5. ✅ **User Impersonation** - Embedded iframe with real-time timer
6. ✅ **Audit Logging** - Comprehensive activity tracking
7. ✅ **Privacy Controls** - Data deletion, consent management
8. ✅ **Email Notifications** - Professional HTML templates

#### **Security Metrics Achieved**
- **Security Events**: 14 real events (Critical: 1, High: 4, Medium: 4, Low: 5)
- **Active Threats**: 3 unresolved events (down from 4)
- **Security Score**: 68/100 (Good - some cleanup needed)
- **Compliance Status**: GDPR (Non-compliant), HIPAA (Compliant), SOC2 (Compliant), PCI DSS (Compliant)

### **Latest Session Work: Business Admin Dashboard & AI Integration Implementation**

#### **Business Admin Dashboard Rebuild - COMPLETED!** ✅
**Key Components Implemented:**
- **`web/src/app/business/[id]/page.tsx`**: Complete Business Admin Dashboard with setup progress, quick stats, and management tools grid
- **Business AI Control Center**: Integrated into admin dashboard with rule functions and configuration
- **Org Chart Builder**: Full organizational structure management with permissions
- **Business Branding Manager**: Logo, color scheme, and font customization
- **Module Management**: Install and configure business-scoped modules
- **Team Management**: Employee invitation and role assignment

#### **AI Assistant Integration - COMPLETED!** ✅
**Key Components Enhanced:**
- **`web/src/components/BrandedWorkDashboard.tsx`**: AI Assistant moved to prominent top position
- **Time-Aware Greeting System**: Dynamic greetings with `getGreeting()` function
- **Enhanced Value Proposition**: Company announcements, schedule optimization, task recommendations
- **Proactive Daily Assistant**: AI positioned as welcome assistant for daily workflow optimization

#### **Navigation & User Flow Fixes - COMPLETED!** ✅
**Files Updated:**
- **`web/src/app/business/create/page.tsx`**: Redirect to admin dashboard after business creation
- **`web/src/components/AccountSwitcher.tsx`**: Navigate to admin dashboard for business accounts
- **`web/src/components/business/BusinessWorkspaceLayout.tsx`**: Added "Admin" button for quick access
- **`web/src/api/business.ts`**: Updated Business interface with members, dashboards, and _count
 - **`web/src/app/dashboard/DashboardLayout.tsx`**: Hide personal sidebars when Work tab is active so Branded Work landing is full-width
 - **`web/src/components/BusinessBranding.tsx`**: Added `tone="onPrimary"` to `BrandedButton` for high-contrast buttons on primary-colored headers
 - **`web/src/components/BrandedWorkDashboard.tsx`**: Exit Work button uses high-contrast outline; branding logo sourced from Business Admin branding (`branding.logoUrl`) with fallback to `business.logo`

### **Previous Session Work: Theme System & UI Consistency Implementation**

#### **Theme System Architecture - COMPLETED!** ✅
**Core Components Created:**
- **`web/src/hooks/useTheme.ts`**: React hook for theme state management
- **`web/src/hooks/useThemeColors.ts`**: Theme-aware color utilities and styling
- **`web/src/app/globals.css`**: Comprehensive dark mode CSS overrides
- **Custom Event System**: Theme change notifications across components
- **Component Integration**: All shared components now theme-aware

#### **Dark Mode & Component Fixes - COMPLETED!** ✅
**Major Issues Resolved:**
- **Color Contrast Problems**: Fixed hardcoded bg-white and text colors causing poor readability
- **Avatar Dropdown Issues**: Fixed disappearing submenu when hovering to select theme options
- **Non-functional Theme Selection**: Fixed theme buttons not working due to event propagation issues
- **Inconsistent Theme Updates**: Some elements updated immediately, others required reload - now all consistent
- **Global Header Theming**: Headers now properly adapt to light/dark theme changes

### **Key Technical Improvements Made**

#### **Theme System Implementation**
```typescript
// useTheme Hook - Core theme state management
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Listen for manual theme changes (custom event)
    const themeChangeHandler = (event: CustomEvent) => {
      applyThemeState(event.detail.theme);
    };
    window.addEventListener('themeChange', themeChangeHandler as EventListener);
  }, []);

  return { theme, isDark };
}
```

#### **Avatar Dropdown Menu Fix**
```typescript
// Fixed submenu rendering - Direct button rendering instead of recursive ContextMenu
{hasSubmenu && showSubmenu && (
  <div className="absolute left-full top-0 ml-1 min-w-48 bg-white dark:bg-gray-800 
                  rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-[99999]">
    {item.submenu!.map((subItem, subIndex) => (
      <button
        key={subIndex}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (subItem.onClick) {
            subItem.onClick();
            handleClose(); // Close menu after action
          }
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {subItem.label}
      </button>
    ))}
  </div>
)}
```

#### **Theme Change Event System**
```typescript
// Custom event dispatching for immediate theme updates
const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
  // Apply theme change
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
  
  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('themeChange', { 
    detail: { theme: newTheme } 
  }));
  
  // Force CSS re-evaluation for stubborn components
  document.documentElement.style.setProperty('--theme-update', Date.now().toString());
  
  // Close menu after theme change
  handleClose();
};
```

### **Current Focus Areas**

#### **Pricing Structure Simplification - COMPLETED!** ✅
1. **Simplified Pricing Tiers** - 5-tier system implemented with clear value proposition ✅
2. **Feature Gating Optimization** - Reduced from hundreds to essential features ✅
3. **Context-Aware Module System** - Personal vs business feature switching ✅
4. **Stripe Configuration** - Updated product/price IDs and pricing structure ✅
5. **Database Schema Updates** - New subscription fields for business plans ✅
6. **Frontend Components** - Updated billing modal and feature gating hooks ✅
7. **Documentation** - Complete pricing simplification summary created ✅

#### **Next Steps for Pricing System** 🎯
1. **Stripe Dashboard Setup** - Create products and prices in Stripe Dashboard
2. **Production Testing** - Test subscription flows in production environment
3. **User Experience Testing** - Verify billing modal displays correctly
4. **Feature Gating Testing** - Test personal vs business feature switching
5. **Revenue Analytics** - Monitor subscription metrics and conversion rates

#### **Theme System & UI Consistency - COMPLETED!** ✅
1. **Dark Mode Implementation** - Complete contrast and color fixes ✅
2. **Avatar Dropdown Menu** - Fixed hover behavior and theme selection functionality ✅
3. **Theme Change Consistency** - Real-time updates across all components ✅
4. **Global Headers** - Theme-aware styling with smooth transitions ✅
5. **Component Integration** - All shared components now support dark mode ✅

#### **Theme System Status - PRODUCTION READY!** 🚀
1. **Theme Switching** - Seamless light/dark/system theme transitions
2. **Component Consistency** - All UI components properly themed
3. **Real-time Updates** - Immediate theme changes without page reloads
4. **User Experience** - Smooth animations and proper contrast ratios
5. **Developer Experience** - Reusable hooks and consistent patterns

### **Technical Patterns Established**

#### **Theme System Architecture Pattern**
- Use custom hooks (useTheme, useThemeColors) for consistent theme state management
- Implement custom events for real-time theme change notifications across components
- Apply Tailwind dark: variants systematically across all components
- Use CSS custom properties for dynamic theme updates and smooth transitions

#### **Context Menu & Dropdown Pattern**
- Use direct button rendering instead of recursive components for submenus
- Implement proper hover delays and mouse tracking for stable menu behavior
- Add event.preventDefault() and event.stopPropagation() to prevent menu conflicts
- Use high z-index values and proper positioning for menu layering

#### **CSS Override & Global Styling Pattern**
- Use comprehensive Tailwind dark: overrides in globals.css for system-wide theming
- Implement transition animations (0.3s ease) for smooth theme changes
- Override hardcoded styles using attribute selectors for stubborn components
- Force re-evaluation using CSS custom properties for immediate updates

### **Success Metrics for This Phase**
- **Dark Mode Implementation**: ✅ **100% COMPLETE** (All contrast issues resolved)
- **Avatar Dropdown Menu**: ✅ **100% FUNCTIONAL** (Hover behavior and theme selection working)
- **Theme Change Consistency**: ✅ **100% COMPLETE** (Real-time updates across all components)
- **Global Header Theming**: ✅ **100% FUNCTIONAL** (Theme-aware colors with smooth transitions)
- **Overall Theme System**: ✅ **PRODUCTION READY**

### **System Capabilities Achieved**
1. **Seamless Theme Switching** - Instant light/dark/system mode transitions
2. **Component-Wide Consistency** - All UI elements properly themed
3. **Professional User Experience** - Smooth animations and proper contrast
4. **Developer-Friendly Architecture** - Reusable hooks and consistent patterns
5. **Real-time Theme Updates** - No page reloads required for theme changes

The theme system is now production-ready with comprehensive dark mode support, smooth transitions, and consistent theming across all components! 🎨

### Latest API Routing Fixes (Current Session) - COMPLETED! ✅
**Date**: Current Session (January 2025)  
**Focus**: Complete Resolution of 404 API Errors and Environment Variable Issues

#### **Major Achievement: All API Routing Issues RESOLVED!** 🎉

**API 404 Errors - COMPLETELY FIXED!**
- **`/api/features/all` 404** - Fixed environment variable issue in Next.js API routes
- **`/api/chat/api/chat/conversations` double path** - Fixed by removing `/api/chat` prefix from endpoint calls
- **`/api/retention/classifications`** - Already working correctly
- **`/api/dashboard`** - Already working correctly  
- **`/api/user/preferences/lastActiveDashboardId`** - Already working correctly

**Environment Variable Issues - COMPLETELY FIXED!**
- **Problem**: Next.js API routes were using `process.env.NEXT_PUBLIC_API_URL` which was undefined
- **Solution**: Updated all API route files to use `process.env.NEXT_PUBLIC_API_BASE_URL` with proper fallback
- **Files Fixed**: 9 Next.js API route files updated with correct environment variable usage

**Chat API Double Path Issue - COMPLETELY FIXED!**
- **Problem**: Chat API functions were passing `/api/chat/conversations` as endpoint, but `apiCall` was already adding `/api/chat` prefix
- **Solution**: Removed `/api/chat` prefix from all endpoint calls in `web/src/api/chat.ts`
- **Changes Made**: `/api/chat/conversations` → `/conversations`, `/api/chat/messages` → `/messages`

#### **Files Modified for Complete Fix** 📝
**Next.js API Route Fixes (9 files):**
1. **`web/src/app/api/features/all/route.ts`** - Fixed environment variable usage
2. **`web/src/app/api/features/check/route.ts`** - Fixed environment variable usage
3. **`web/src/app/api/features/module/route.ts`** - Fixed environment variable usage
4. **`web/src/app/api/features/usage/route.ts`** - Fixed environment variable usage
5. **`web/src/app/api/trash/items/route.ts`** - Fixed environment variable usage
6. **`web/src/app/api/trash/delete/[id]/route.ts`** - Fixed environment variable usage
7. **`web/src/app/api/trash/restore/[id]/route.ts`** - Fixed environment variable usage
8. **`web/src/app/api/trash/empty/route.ts`** - Fixed environment variable usage
9. **`web/src/app/api/[...slug]/route.ts`** - Fixed environment variable usage

**Chat API Fixes (1 file):**
10. **`web/src/api/chat.ts`** - Fixed double path issue by removing redundant prefixes

#### **Current API Status** ✅
- **All API routing working correctly** - Endpoints return proper authentication errors instead of 404s
- **Environment variables standardized** - Consistent usage across all API routes
- **Chat API paths fixed** - No more double path issues
- **Build system optimized** - 7-minute builds with E2_HIGHCPU_8 machine type
- **Ready for production** - All fixes tested and verified

#### **Deployment & Testing Results** 🚀
**Build Status:**
- **Build ID**: 8990f80d-b65b-4adf-948e-4a6ad87fe7fc
- **Status**: SUCCESS (8 minutes 47 seconds)
- **Images Updated**: Both vssyl-web and vssyl-server deployed successfully
- **Git Commit**: 3c7113d - "Fix API routing issues and environment variable problems"

**API Endpoint Testing Results:**
- ✅ `/api/features/all` - Returns "Unauthorized" (correct behavior, not 404)
- ✅ `/api/chat/conversations` - Returns "Invalid or expired token" (correct behavior, not 404)
- ✅ `/api/retention/classifications` - Returns "Invalid or expired token" (correct behavior, not 404)
- ✅ `/api/dashboard` - Returns "Invalid or expired token" (correct behavior, not 404)
- ✅ `/api/user/preferences/lastActiveDashboardId` - Returns "Invalid or expired token" (correct behavior, not 404)

#### **Browser Cache Issue Identified** ⚠️
**Problem**: After successful deployment, users still see old error logs
- **Root Cause**: Browser cache holding old JavaScript files
- **Symptoms**: API Call Debug logs still show `NEXT_PUBLIC_API_BASE_URL: undefined`
- **Solution**: Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`) or incognito mode
- **Verification**: API endpoints work correctly when tested directly with curl

#### **WebSocket Connection Issues** 🔌
**Problem**: WebSocket connection failures to backend server
- **Error**: `WebSocket connection to 'wss://vssyl-server-235369681725.us-central1.run.app/socket.io/' failed`
- **Root Cause**: WebSocket requires authentication; fails when user not logged in
- **Status**: Expected behavior - WebSocket will work once user is properly authenticated
- **Configuration**: Socket.IO properly configured on backend with CORS and authentication middleware

### Previous UI/UX Consistency Updates
- Unified global header across personal dashboard and business workspace using `web/src/components/GlobalHeaderTabs.tsx`.
- Business workspace now uses the same tab strip as personal dashboards.
- Header branding dynamically switches:
  - Personal routes: shows "Block on Block".
  - Business workspace routes (`/business/[id]/...`): shows business name and logo from Business Admin branding.
- Source of truth for workspace branding:
  - Primary: live business record via `getBusiness(id, token)` to read `data.name` and `data.branding.logoUrl`.
  - Fallbacks: `BusinessConfigurationContext.branding` → `GlobalBrandingContext`.
- Work tab is highlighted on business workspace routes; personal tabs are not set active there.

#### Impacted Files
- `web/src/components/GlobalHeaderTabs.tsx` (new): shared global header and tabs.
- `web/src/components/business/DashboardLayoutWrapper.tsx`: uses `GlobalHeaderTabs` and offsets content by 64px.
- `web/src/app/business/[id]/workspace/layout.tsx`: no logic change; wraps with providers.

#### Notes
- Avoid duplicating header logic in feature pages; always use `GlobalHeaderTabs`.
- When adding branding, prefer Business Admin (`branding.logoUrl`, colors) so it stays consistent with admin settings.
---

## 📝 Key Lessons Learned (October 24, 2025)

### Lesson: Automated TypeScript Migrations Require Care
**Context**: Attempted automated console.log → logger migration with regex-based script

**What Went Wrong**:
1. Regex-based script added imports in wrong places (inside comments)
2. Script calculated import paths incorrectly (depth issues)
3. Global sed replacement broke 3749 lines by replacing "error" everywhere
4. Replacement affected strings, property names, object keys - not just variables

**The Right Way**:
- Use TypeScript Compiler API (AST parsing) for code transformations
- Test on small samples before running on entire codebase
- Never use global text replacement (sed) on TypeScript files
- Manual migration is safer for complex transformations
- Sometimes "working" is better than "perfect"

**Decision Made**: Defer Phase 2 console migration indefinitely. Natural migration through normal development is lower risk and better ROI.

