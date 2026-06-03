# Place Service Extraction Plan (Wave 1A)

**Module id:** `place`  
**Version:** 1.0.0  
**Last updated:** 2026-06-03  
**Status:** Wave **1G complete** (2026-06-03) — communities, discovery dismiss, getPlace enrichment, connection/transaction boundaries; Wave **2A** (trash + V_Link) next  
**Wave:** Place Wave 1  

**Authorities:**

| Layer | Document |
|-------|----------|
| Constitutional | [PLACE_CONSTITUTIONAL_AUDIT.md](./audits/PLACE_CONSTITUTIONAL_AUDIT.md) |
| Product | [PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](./PLACE_PRODUCT_ARCHITECTURE_REVIEW.md) |
| Operations | [PLACE_OPERATION_MATRIX.md](./audits/PLACE_OPERATION_MATRIX.md) |
| Reference catalog | [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md) |
| Patterns | [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) |
| Execution | [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) |

**Companion (Wave 1B gate):** `PLACE_DOMAIN_MODEL.md` — entity lifecycles and PE action catalog (not yet written).

**Phase 1A deliverable:** This document only. **No service files. No controller moves. No migrations.**

---

## Section 1 — Executive summary

**Place** is **Level 0 — Legacy** with a **high product surface** (8 controllers, ~3,847 LOC, 62 endpoints, 17 owned models) and **zero canonical services**.

Unlike Todo (single mega-controller) or Calendar (recurrence/reminder complexity), Place complexity is **horizontal**:

| Domain slice | Controller | Primary gap |
|--------------|------------|-------------|
| Personal graph | `placeController` | Prisma + socket + `businessFollow` sync inline |
| Listings | `placeListingController` | Admin checks + storage + moderation inline |
| Discovery | `placeDiscoveryController` | Read queries duplicated with AI context |
| Meetings | `placeMeetingController` | **Calendar bypass** (`prisma.event.create`) |
| Transactions | `placeTransactionController` | Telemetry only — product-deferred |
| Communities | `placeCommunityController` | Batch cluster writes inline |
| Analytics / feed | `placeAnalyticsController` | **`recordActivity` never wired** |
| AI | `placeAIController` | Prisma heuristics; no executor twins |

**Objective:** Define the **complete Place service layer blueprint** so Wave 1B–2 implementation proceeds without redesign. Target: **Level 2 (Modernized)** after Phase 1E; **Level 3 (Certified)** after Phase 2 + review; **Reference Module #5** council after L3 + teachable-pattern sign-off.

**Copy order:** File Hub (visibility, trash, V_Link, entities) → Calendar (`calendarEventService` delegation for meetings) → Chat (notification, realtime, activity adapters) → Todo (policy dual, AI action service) → Notebook (composition — listing visibility for `PLACE_LISTING` links only).

**Do not combine phases** like a small module. Place has **8 controller entry points** — extract **reads before writes**, **listing before marketplace telemetry**, **meeting + Calendar fix before L2 sign-off**.

---

## Section 2 — Target service map

### 2.1 `placeService`

| Field | Detail |
|-------|--------|
| **Reference** | Calendar `calendarService` (container); Todo `todoTaskService` (mutation orchestration) |
| **Responsibilities** | Personal Main Street lifecycle: get/create `Place`, settings, setup completion, node CRUD, interests, follow-visibility, lazy graph enrichment hooks |
| **Dependencies** | `placePolicyDual`, `placePermissionService` (new), `prisma`, `placeActivityService`, `placeDomainEventService`, `placeNotificationService`, `placeRealtimeService`, Business follow sync helper |
| **Owns** | `getOrCreatePlace`, `updatePlaceSettings`, `completeSetup`, `addNode`, `updateNode`, `removeNode`, `setInterests`, `getFollowVisibility`, `updateFollowVisibility` |
| **Not owns** | Listing CRUD (→ `placeListingService`); explore/discovery reads (→ `placeVisibilityService`); meeting CRUD (→ **`placeMeetingService`** — companion §2.13); connection **request** CRUD on `Relationship` (→ Member domain or thin `placeConnectionService` Phase 1G); accept connection creates nodes **here** after Member validates |
| **Side effects (on success only)** | Node add/remove → activity + domain event + realtime; business node → sync `BusinessFollow` |
| **File target** | `server/src/services/place/placeService.ts` (+ `placeTypes.ts`, `placeErrors.ts`) |

**Connection boundary (product law):** `sendConnectionRequest` should eventually call **Member/Relationship service**; `placeService.acceptConnection` only mirrors accepted relationships into `PlaceNode` for both users.

---

### 2.2 `placeListingService`

| Field | Detail |
|-------|--------|
| **Reference** | File Hub upload + metadata pattern; Chat manifest-driven write pipeline |
| **Responsibilities** | Business listing upsert, publish flags, interaction links CRUD, cover/avatar upload/delete, content report trigger, admin authorization |
| **Dependencies** | `placePolicyDual`, `placePermissionService`, `storageService`, `placeActivityService`, `placeDomainEventService`, `placeNotificationService` (moderation alerts — optional), `placeVlinkLifecycleService` (Phase 2 on unpublish/delete) |
| **Owns** | `getListingForAdmin`, `upsertListing`, `addInteractionLink`, `updateInteractionLink`, `deleteInteractionLink`, `uploadCoverImage`, `deleteCoverImage`, `uploadAvatarImage`, `deleteAvatarImage`, `reportListing` |
| **Not owns** | Public explore/profile reads (→ `placeVisibilityService`); click/transaction (→ deferred `placeTransactionService`) |
| **Validation** | Move Zod schemas from controller into service or shared `placeListingSchemas.ts` |
| **File target** | `server/src/services/place/placeListingService.ts` |

---

### 2.3 `placeVisibilityService`

| Field | Detail |
|-------|--------|
| **Reference** | File Hub `driveVisibilityService`; Todo `todoVisibilityService` |
| **Responsibilities** | All **read models** with tenant/user scope: explore, business profile, discovery suggestions, listing access checks, AI context bundles, federated search adapter, Notebook link validation (`validateAccessibleListingIds`) |
| **Dependencies** | `placePolicyDual` (read actions), `prisma`, optional `calendarVisibilityService` (meeting hydration only) |
| **Owns** | `exploreListings`, `getBusinessProfile`, `getLocalSuggestions`, `getForYouSuggestions`, `getPlaceContextOverview`, `getConnectionsContext`, `getDiscoveriesContext`, `getActivityContext`, `getAnalyticsContext`, `searchListingsForUser`, `getListingIfAccessible`, `listMeetingsForUser`, `getMeetingIfAccessible`, `getActivityFeed`, `getPersonalAnalytics`, `exportUserData` |
| **Not owns** | Mutations (dismiss suggestion → `placeService` or `placeDiscoveryService` thin wrapper); writes |
| **Search migration** | Relocate `searchController.placeSearchProvider` body here; controller/registry calls `placeVisibilityService.searchListings` |
| **File target** | `server/src/services/place/placeVisibilityService.ts` |

---

### 2.4 `placePolicyDual`

| Field | Detail |
|-------|--------|
| **Reference** | `todoPolicyDual`, `calendarPolicyDual`, `notesPolicyDual` |
| **Responsibilities** | Wrap `evaluateModuleMutationPolicyDual` / `authorize()` for Place `PolicyAction`s; fail closed on security denies only |
| **Dependencies** | `policyEngine`, `policyActions` (new Place actions — see §6) |
| **Owns** | `evaluatePlaceMutationPolicy`, read-filter helpers for visibility |
| **Not owns** | Business logic |
| **File target** | `server/src/services/placePolicyDual.ts` (top-level like Todo, or `place/placePolicyDual.ts`) |

**Prerequisite:** Add Place actions to `policyActions.ts` + handlers in `policyEngine.ts` before dual enforcement is meaningful.

**Authoritative catalog:** [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) **Part 4** (final action names and phases). Summary below retained for navigation; **domain model wins on conflict**.

---

### 2.5 `placeActivityService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoActivityService`, `chatActivityService` |
| **Responsibilities** | **`emitModuleActivityEvent`** for Place mutations; **decide fate of `PlaceActivityFeedItem`** |
| **Dependencies** | `moduleActivityService`, `prisma` (if feed table retained) |
| **Owns** | Normalized activity: `place.node.added`, `place.listing.published`, `place.meeting.created`, `place.transaction.completed`, etc. |
| **Design decision (required in 1D):** |

| Option | Pros | Cons |
|--------|------|------|
| **A — Platform activity only** | Constitutional compliance; single feed source | Product Feed tab UX may need read adapter from module activity |
| **B — Dual write** | Keeps social feed table | Drift risk (today: feed never populated) |
| **C — Feed table only** | Minimal change | **Violates** module activity contract |

**Recommendation:** **Option A** for certification; optional **read adapter** projects module activity → Feed UI. Deprecate unwired `recordActivity()` helper.

| **Not owns** | Analytics snapshots (derived job — out of scope Wave 1) |
| **File target** | `server/src/services/place/placeActivityService.ts` |

---

### 2.6 `placeDomainEventService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoDomainEventService`, `chatDomainEventService` |
| **Responsibilities** | Register and emit `place.*` domain events on successful mutations |
| **Dependencies** | Domain event bus registry |
| **Owns** | Taxonomy e.g. `place.node.added`, `place.node.removed`, `place.listing.published`, `place.listing.unpublished`, `place.meeting.created`, `place.meeting.cancelled`, `place.meeting.linked_to_calendar`, `place.transaction.completed` |
| **Not owns** | Analytics subscriber implementation (platform track) |
| **File target** | `server/src/services/place/placeDomainEventService.ts` |

---

### 2.7 `placeNotificationService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoNotificationService`, `chatNotificationService` |
| **Responsibilities** | `NotificationService.createNotification` for Place types **only when product confirms** |
| **Dependencies** | `NotificationService`, manifest `notifications[]` |
| **Owns (target types)** | `place_connection_request`, `place_connection_accepted`, `place_meeting_invite`, `place_meeting_rsvp`, `place_community_invite` (align with `web/src/app/notifications/page.tsx`) |
| **Not owns** | Socket events (→ `placeRealtimeService`); email (future) |
| **Gate:** Phase 1E — either **implement all UI-listed types** or **remove UI entries** in same PR |
| **File target** | `server/src/services/place/placeNotificationService.ts` |

---

### 2.8 `placeRealtimeService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoRealtimeService` (Chat socket infra adapter) |
| **Responsibilities** | Single adapter over `chatSocketService.broadcastPlaceEvent`; document ownership |
| **Dependencies** | `chatSocketService` |
| **Owns** | `emitNodeAdded`, `emitNodeRemoved`, `emitConnectionAccepted`, `emitConnectionRequest`, future `emitMeetingUpdated` |
| **Not owns** | Chat message realtime |
| **Manifest** | Add `realtime: true` only when this service is wired on all claimed paths |
| **File target** | `server/src/services/place/placeRealtimeService.ts` |

---

### 2.9 `placeTrashService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoTrashService`, `calendarTrashService`, `driveDeleteService` |
| **Responsibilities** | Soft trash, restore, permanent delete, Global Trash handler registration |
| **Dependencies** | `placePolicyDual`, `placeActivityService`, `placeDomainEventService`, `placeVlinkLifecycleService`, `prisma` |
| **Owns** | Trash lifecycle for **`place:listing`** (unpublish vs trash TBD in domain model), **`place:meeting`**, optionally **`place:node`** (unfollow vs trash — product decision) |
| **Prerequisite** | Schema migration: `trashedAt` on target models **or** map listing unpublish to trash semantics |
| **Not owns** | Hard delete of interaction links (soft-delete rows or cascade from listing trash) |
| **Phase** | **1F / Wave 2** — not required for first L2 slice if product accepts hard delete temporarily **documented** |
| **File target** | `server/src/services/place/placeTrashService.ts` |
| **Handler** | `registerGlobalTrashHandlers({ moduleId: 'place', supportedTypes: ['listing', 'meeting'] })` |

---

### 2.10 `placeVlinkAccessService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoVlinkAccessService`, `calendarVlinkAccessService` |
| **Responsibilities** | Resolve `place:listing` and `place:meeting` for V_Link; membership ≠ content access; trashed/unpublished fail closed |
| **Dependencies** | `placeVisibilityService`, `placePolicyDual` |
| **Owns** | `assertCanAccessListingViaVlink`, `assertCanAccessMeetingViaVlink`, resolver payloads for `vlinkEntityResolverService` |
| **Not owns** | V_Link CRUD (`vlinkService`) |
| **Phase** | **2A** — blocks Notebook `PLACE_LISTING` link enablement |
| **File target** | `server/src/services/place/placeVlinkAccessService.ts` |

---

### 2.11 `placeVlinkLifecycleService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoVlinkLifecycleService`, `driveVlinkLifecycleService` |
| **Responsibilities** | Archive/unlink V_Links on listing unpublish, meeting cancel, permanent delete |
| **Dependencies** | `vlinkService`, `placeTrashService` |
| **Owns** | Lifecycle hooks called from trash/permanent-delete paths |
| **Not owns** | Access checks |
| **Phase** | **2A** (with platform entity registration) |
| **File target** | `server/src/services/place/placeVlinkLifecycleService.ts` |

---

### 2.12 `placeAIActionService`

| Field | Detail |
|-------|--------|
| **Reference** | `todoAIActionService`, `calendarAIActionService`, `notebookAIActionService` |
| **Responsibilities** | All Place AI **reads** and bounded **writes** (if any); HTTP AI routes + `ActionExecutor` + `toolExecutor` twins |
| **Dependencies** | `placeVisibilityService` only (**no Prisma** in action service) |
| **Owns** | `getRecommendations`, `getPurchaseHelp`, `getReservationHelp`, context provider handlers (or delegate to visibility with DTO mappers), executor registrations |
| **Not owns** | LLM provider selection (platform); task creation (Todo); calendar event creation (Calendar) |
| **Writes policy** | **Read-only v1** — purchase/reservation return links; no auto-transaction create via executor |
| **Phase** | **1F** — after visibility stable |
| **File target** | `server/src/services/place/placeAIActionService.ts` |

---

### 2.13 Companion domain services (not in Wave 1A name list — required for completeness)

These are **mandatory in the extraction roadmap** but named separately to keep the twelve kernel/adapters focused:

| Service | Phase | Responsibilities |
|---------|-------|------------------|
| **`placePermissionService`** | 1B | `assertPlaceOwner`, `assertListingAdmin`, `assertMeetingParticipant`, `assertCanReadListing` |
| **`placeMeetingService`** | 1D | Meeting CRUD, RSVP, location privacy; **`linkToCalendar` → `calendarEventService` only** |
| **`placeDiscoveryService`** | 1C | `dismissSuggestion` write (thin); or fold into `placeService` |
| **`placeTransactionService`** | **Deferred** | Clicks + transactions — isolate until product prioritizes commerce |
| **`placeCommunityService`** | 1G | Communities + auto-cluster (lower certification priority) |

---

## Section 3 — Extraction phases

### Phase 1A — Service extraction plan ✅ (this document)

| Deliverable | Status |
|-------------|--------|
| Service map (12 + companions) | ✅ |
| Phase breakdown | ✅ |
| Operation routing | ✅ |
| Certification path | ✅ |
| Risk register | ✅ |

**Gate to 1B:** Approve plan + publish `PLACE_DOMAIN_MODEL.md` (PE actions + trash semantics).

---

### Phase 1B — Policy + core graph writes (~1 week)

| Deliverable | Est. |
|-------------|------|
| `placeErrors.ts`, `placeTypes.ts`, `placePermissionService` | 0.5d |
| `placePolicyDual` + `policyActions` / `policyEngine` Place handlers | 1d |
| `placeService` — settings, setup, nodes, interests, follow visibility | 2d |
| `placeController` delegates graph mutations; contract test (no Prisma in mutation handlers) | 1d |
| Unit tests: permission, policy dual, placeService | 1d |

**Exit:** Graph mutation rows in operation matrix → **P** minimum (PE + service layer); realtime still via adapter stub OK.

---

### Phase 1C — Visibility + discovery reads (~1 week)

| Deliverable | Est. |
|-------------|------|
| `placeVisibilityService` — explore, profile, discovery, feed/analytics/export reads | 2d |
| Relocate `searchController.placeSearchProvider` | 0.5d |
| AI context controller methods delegate to visibility | 1d |
| `placeDiscoveryService` or `placeService.dismissSuggestion` | 0.5d |
| `placeDiscoveryController`, `placeAnalyticsController` (read paths), `placeListingController` (explore/profile) thin | 1d |
| Unit + integration tests (tenant scope, EIN gate, unpublished hidden) | 1d |

**Exit:** Read rows → **C** on Visibility column; AI context → **P** until 1F.

---

### Phase 1D — Listing writes + meeting + side-effect adapters (~1.5 weeks)

| Deliverable | Est. |
|-------------|------|
| `placeListingService` + controller delegate | 2d |
| `placeMeetingService` + **remove direct `prisma.event.create`** | 2d |
| Extend `place-meeting-calendar-link.integration.test.ts` → full calendar service mock path | 0.5d |
| `placeActivityService` + `placeDomainEventService` (Option A — platform activity) | 1d |
| `placeNotificationService` + `placeRealtimeService` wired from place/meeting/listing services | 1d |
| Feed UI adapter decision documented | 0.5d |

**Exit:** Listing + meeting mutation rows → **C** on PE, Activity, Event, Notification, RT (where applicable). **L2 candidacy.**

---

### Phase 1E — Controller collapse + connection boundary (~0.5 week)

| Deliverable | Est. |
|-------------|------|
| `placeController` connection paths documented; accept → `placeService` | 1d |
| Forbidden-pattern contract tests on all 8 controllers (mutation regions) | 1d |
| `PlaceWorkspaceLanding` + manifest hygiene (product — optional parallel) | — |

**Exit:** Zero Prisma on **primary certification paths** (graph, listing, meeting, visibility).

---

### Phase 1F — AI migration (~1 week)

| Deliverable | Est. |
|-------------|------|
| `placeAIActionService` | 1.5d |
| `placeAIController` thin; context via visibility | 0.5d |
| `ActionExecutor` + `toolExecutor` twins (read-only ops) | 1d |
| AI contract tests (no Prisma in executor path) | 1d |
| Manifest `ai: true` reconciled | 0.5d |

**Exit:** AI rows → **C** on AI column.

---

### Phase 1G — Satellites (optional before L2, required before L3) (~1 week)

| Deliverable | Est. |
|-------------|------|
| `placeCommunityService` | 1.5d |
| `placeTransactionService` **or** explicit defer doc in manifest | 0.5d |
| Member delegation spike for `sendConnectionRequest` | 1d |
| GDPR export hardening in visibility | 0.5d |

---

### Phase 2A — Trash + V_Link + entities (~1.5 weeks)

| Deliverable | Est. |
|-------------|------|
| `trashedAt` migration (listing, meeting; node TBD) | 1d |
| `placeTrashService` + Global Trash handler | 2d |
| `registerPlacePlatformEntities` — `place:listing`, `place:meeting` | 1d |
| `placeVlinkAccessService` + `placeVlinkLifecycleService` | 2d |
| Enable Notebook `PLACE_LISTING` link validation via visibility | 0.5d |
| Manifest `entities[]`, `vlink`, optional `trash: true` | 0.5d |

**Exit:** V_Link + Trash matrix columns → **C**; **L3 candidacy**.

---

### Phase 2B — Manifest truth + tests (~0.5 week)

| Deliverable | Est. |
|-------------|------|
| `builtInModuleManifests` ↔ runtime reconcile | 0.5d |
| `notifications[]` only for emitted types | 0.5d |
| Operation matrix refresh (~57 rows) | 0.5d |
| `builtInModuleManifests.place.test.ts`, handler registration tests | 1d |

---

### Phase 3 — Level 3 certification review (~0.5 week)

| Deliverable | Est. |
|-------------|------|
| `PLACE_LEVEL3_CERTIFICATION_REVIEW.md` | 1d |
| Ledger promotion **0 → 2 → 3** (no skip) | — |
| Reference Module #5 council packet | — |

---

### Phase 4 — Reference Module #5 (post-L3, council)

| Deliverable | |
|-------------|--|
| Pattern guide section: external graph + listing + discovery + routing | |
| `PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md` | |
| Catalog promotion Reference #5 | |

---

## Section 4 — Operation → service routing (target)

| Operation group | Primary service | Adapters |
|-----------------|-----------------|----------|
| Get/create Place, settings, setup, nodes, interests, follow visibility | `placeService` | activity, domain, realtime |
| Explore, profile, discovery read, feed/analytics/export read | `placeVisibilityService` | — |
| Dismiss suggestion | `placeService` or `placeDiscoveryService` | activity (optional) |
| Listing admin CRUD, links, images, report | `placeListingService` | activity, domain, vlink lifecycle (2A) |
| Meetings, RSVP, location privacy | `placeMeetingService` | activity, domain, notification, realtime, **calendarEventService** |
| Link meeting → calendar | `placeMeetingService` | domain |
| Connections list/search | `placeVisibilityService` | — |
| Send connection request | Member service (target) / controller interim | notification |
| Accept connection | `placeService` | notification, realtime |
| Communities | `placeCommunityService` | activity (1G) |
| Transactions / clicks | **`placeTransactionService`** (deferred) or interim controller | activity when enabled |
| Global search listings | `placeVisibilityService.searchListings` | — |
| AI recommendations / purchase / reservation | `placeAIActionService` | visibility reads |
| AI context providers | `placeVisibilityService` via `placeAIActionService` mappers | — |
| Global Trash restore/delete | `placeTrashService` | activity, domain, vlink lifecycle |
| V_Link resolve | `placeVlinkAccessService` | — |
| Notebook PLACE_LISTING link | `placeVisibilityService.validateAccessibleListingIds` | — |

---

## Section 5 — Controller → service migration map

| Controller | Lines | Phase | Target delegation |
|------------|-------|-------|-------------------|
| `placeController` | 739 | 1B, 1E | `placeService`, `placeVisibilityService` (reads), `placeAIActionService` (context overview) |
| `placeListingController` | 685 | 1C, 1D | `placeVisibilityService` (explore/profile), `placeListingService` (writes) |
| `placeMeetingController` | 522 | 1D | `placeMeetingService`, `placeVisibilityService` (reads) |
| `placeDiscoveryController` | 364 | 1C | `placeVisibilityService`, dismiss → `placeService` |
| `placeAnalyticsController` | 440 | 1C, 1D | `placeVisibilityService` (reads), remove dead `recordActivity` export |
| `placeAIController` | 435 | 1F ✅ | `placeAIActionService` |
| `placeTransactionController` | 339 | **Deferred** / 1G | `placeTransactionService` when product gates open |
| `placeCommunityController` | 323 | 1G | `placeCommunityService` |

**End state:** Each controller **&lt; 150 lines** — parse auth, call service, map errors (File Hub FH-6).

---

## Section 6 — Policy Engine action catalog (design)

Add to `policyActions.ts` (exact names subject to `PLACE_DOMAIN_MODEL.md`):

| Action | Resource | Used by |
|--------|----------|---------|
| `place:read` | `place` | Visibility reads (user's own graph) |
| `place:write` | `place` | Node, settings, interests mutations |
| `place:listing.read` | `place_listing` | Explore, profile, search |
| `place:listing.write` | `place_listing` | Admin upsert, links, images |
| `place:listing.publish` | `place_listing` | Publish/unpublish transitions |
| `place:meeting.read` | `place_meeting` | List/get meeting |
| `place:meeting.write` | `place_meeting` | Create/update/cancel |
| `place:meeting.rsvp` | `place_meeting_invite` | RSVP |
| `place:node.delete` | `place_node` | Remove node / trash |
| `place:connection.write` | `relationship` | Connection accept (dual with Member) |

**Dual enforcement:** All services call `placePolicyDual` before persist.

---

## Section 7 — Certification path

| Milestone | Level | Criteria | Est. cumulative |
|-----------|-------|----------|-----------------|
| Wave 0–0.5 complete | **0** | Audit + product architecture | Done |
| Phase 1B–1C complete | **0 → 1** | Visibility service + partial PE | +2 weeks |
| Phase 1D–1E complete | **1 → 2** | Listing + meeting + adapters; Calendar fixed; majority mutation rows **C** | +3.5 weeks |
| Phase 1F–1G complete | **2** (strong) | AI executor twins; satellites documented | +5 weeks |
| Phase 2A–2B complete | **2 → 3** | Trash, V_Link, entities, manifest truth, test suite | +7 weeks |
| Phase 3 review | **3 — Certified** | `PLACE_LEVEL3_CERTIFICATION_REVIEW.md` signed | +7.5 weeks |
| Phase 4 council | **Reference #5** | Teachable P1–P7 patterns documented | Post-L3 |

**Promotion rules:**

- Cannot skip **Level 1** — need PE + at least one canonical service path proven.
- **Level 3** requires operation matrix **majority C** on PE, Activity, Event for core ops (graph, listing, meeting).
- **Reference #5** requires L3 **plus** external-composition pattern guide approval — not automatic at L3.

| Question | Answer |
|----------|--------|
| Starting level | **0 — Legacy** |
| Realistic L2 | **~4 weeks** after 1B start (1B–1E) |
| Realistic L3 | **~7–8 weeks** after 1B start (includes 2A–2B) |
| Reference #5 | **After L3** — candidate today, designation after council |

---

## Section 8 — Risk register

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **Calendar bypass** persists if meeting extracted without `calendarEventService` | **P0** | Phase 1D gate: integration test blocks merge |
| R2 | **Dual activity models** (feed table vs module activity) | **P0** | Decide Option A in 1D; remove dead `recordActivity` |
| R3 | **Notification UI without backend** | **P1** | 1D: implement `placeNotificationService` or remove UI types same PR |
| R4 | **Scope creep** — 62 endpoints extracted at once | **P1** | Strict phase order; defer transactions/communities |
| R5 | **Member domain fork** — connection CRUD stays in Place | **P1** | Document interim; 1G spike to Member service |
| R6 | **BusinessFollow sync** race with node delete | **P2** | Single transaction in `placeService.removeNode` |
| R7 | **Manifest `ai: true`** before executors | **P2** | 1F reconciles or temp downgrade manifest |
| R8 | **Notebook PLACE_LISTING** enabled before V_Link | **P1** | Fail closed until 2A visibility + entity |
| R9 | **Trash semantics unclear** for listing (unpublish vs delete) | **P2** | `PLACE_DOMAIN_MODEL.md` before 2A migration |
| R10 | **Chat socket ownership confusion** | **P2** | `placeRealtimeService` documents adapter; manifest `realtime` when wired |
| R11 | **8 controllers** regression during partial extraction | **P1** | Contract tests per phase; forbidden Prisma regions |
| R12 | **Product doc drift** (notifications “integrated”) | **P2** | Memory bank hygiene in 2B |

---

## Section 9 — Modernization roadmap (Place module)

```text
Wave 0   Audit + operation matrix                    ✅ Done
Wave 0.5 Product architecture review                 ✅ Done
Wave 1A  Service extraction plan (this doc)          ✅ Done
Wave 1B  placePolicyDual + placeService              ✅ Done (2026-06-03)
Wave 1C  placeVisibilityService + search             ✅ Done (2026-06-03)
Wave 1D  placeListingService + placeMeetingService   ✅ Done (2026-06-03)
         + activity/domain/notification/realtime      ✅
Wave 1E  Controller collapse                         ✅ Done (2026-06-03)
Wave 1F  placeAIActionService + executors            ✅ Done (2026-06-03)
Wave 1G  Communities + dismiss + enrichment          ✅ Done (2026-06-03)
Wave 2A  placeTrashService + V_Link + entities       ○ Next
Wave 2B  Manifest + matrix refresh                   ○
Wave 3   PLACE_LEVEL3_CERTIFICATION_REVIEW           ○
Wave 4   Reference Module #5 council                 ○
```

**Parallel platform tracks (Place consumes, does not own):**

| Track | Place dependency |
|-------|------------------|
| Policy Engine taxonomy | Place actions in `policyEngine.ts` |
| Global Trash API | Handler in Phase 2A |
| V_Link resolver | `place:listing`, `place:meeting` in Phase 2A |
| Notebook links | `PLACE_LISTING` after 2A |
| Member service | Connection request delegation (1G+) |

---

## Section 10 — Effort summary

| Phase | Focus | Engineer-days (est.) | Cumulative weeks (1 FTE) |
|-------|-------|----------------------|---------------------------|
| 1B | Graph + PE | 5–6 | 1 |
| 1C | Visibility + search | 5–6 | 2 |
| 1D | Listing + meeting + adapters | 7–8 | 3.5 |
| 1E | Collapse + contracts | 2–3 | 4 |
| 1F | AI | 4–5 | 5 |
| 1G | Satellites | 3–5 | 5.5–6 |
| 2A | Trash + V_Link | 6–7 | 7 |
| 2B | Manifest + tests | 2–3 | 7.5–8 |
| 3 | L3 review doc | 2 | 8 |

**Total to Level 3:** **~35–40 engineer-days** (~**7–8 calendar weeks** at 1 FTE, assuming no marketplace/Stripe scope).

**Total to Reference #5:** **+1–2 weeks** documentation + council after L3.

---

## Section 11 — Phase 1A completion checklist

| Item | Status |
|------|--------|
| Twelve named services defined | ✅ |
| Companion services identified | ✅ |
| Phases 1B–4 documented | ✅ |
| Risks + certification path | ✅ |
| Operation routing table | ✅ |
| No Place code changes in Wave 1A | ✅ |
| Implementation gate | User approval → ~~**`PLACE_DOMAIN_MODEL.md`**~~ → start **Phase 1B** |

**Domain model (Wave 1B gate):** [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) — **locked 2026-06-02**.

**Phase 1B (2026-06-03):** Graph write layer — see above.

**Phase 1C (2026-06-03):** `placeVisibilityService`; read PE actions; `searchListingsForUser`; `validateAccessibleListingIds`; thin read controllers; public profile follower count removed; 38 Place unit tests cumulative. **Level 1 — Stabilizing.**

---

## Section 12 — Document index

| Section | Topic |
|---------|-------|
| §2 | Service definitions (12 + companions) |
| §3 | Extraction phases |
| §4 | Operation routing |
| §5 | Controller map |
| §6 | Policy actions |
| §7 | Certification path |
| §8 | Risks |
| §9 | Roadmap timeline |
| §10 | Effort |

---

*Wave 1A design only — no code changes.*
