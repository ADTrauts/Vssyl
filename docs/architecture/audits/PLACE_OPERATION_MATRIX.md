# Place Operation Matrix

**Module id:** `place`  
**Status:** Level **2 candidacy** (Phase 1B–1G complete 2026-06-03). **Not certified Level 2** — trash, V_Link still outstanding; transactions explicitly deferred.
**Related:** [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct layer, side effects on success |
| **P** | Partial — works; wrong layer, incomplete pipeline, or delegated dependency gap |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `PL` = Place-owned · `Biz` = Business domain · `Cal` = Calendar #3 · `Mem` = Member/Relationship · `Chat` = Chat realtime infra · `FH` = File Hub storage infra

**Columns:** PE = Policy Engine · Activity = platform module activity · Event = domain event · RT = realtime · AI = platform AI executor path · Trash = Global Trash

---

## Master operation matrix

| Operation | Owner | Service | Controller | PE | Visibility | Activity | Event | Notification | RT | AI | Trash | V_Link | Notes |
| --------- | ----- | ------- | ---------- | -- | ---------- | -------- | ----- | ------------ | -- | -- | ----- | ------ | ----- |
| **Get/create Place** | PL | `placeVisibilityService` | `placeController.getPlace` | P | C | N | N | N | — | — | — | — | `getEnrichedPlaceGraph` |
| **Update Place settings** | PL | `placeService` | `updatePlaceSettings` | P | — | N | N | N | — | — | — | — | `placePolicyDual` + legacy owner |
| **Complete setup** | PL | `placeService` | `completeSetup` | P | — | N | N | N | — | — | — | — | Sets `isSetupComplete` |
| **Add node (follow)** | PL | `placeService` | `addNode` | P | — | P | P | N | P | — | N | — | Activity + domain + RT on success |
| **Update node layout** | PL | `placeService` | `updateNode` | P | P | N | N | N | — | — | — | — | Layout-only; no activity |
| **Remove node (unfollow)** | PL | `placeService` | `removeNode` | P | — | P | P | N | P | — | N | — | Activity + domain + RT on success |
| **Set interests** | PL | `placeService` | `setInterests` | P | — | P | N | N | — | — | — | — | Platform activity only |
| **Complete setup** | PL | `placeService` | `completeSetup` | P | — | P | P | N | — | — | — | — | Setup completed domain event |
| **Get/update follow visibility** | PL | `placeService` | `getFollowVisibility` / `updateFollowVisibility` | P | — | N | N | N | — | — | — | — | Per business; user-scoped |
| **Send connection request** | Mem + PL | `placeConnectionService` | `sendConnectionRequest` | N | — | P | P | P | P | — | — | — | Interim Place-owned; Member handoff 1G |
| **Accept connection** | Mem + PL | `placeConnectionService` | `acceptConnection` | N | — | P | P | P | P | — | — | — | Mirrors PlaceNode both sides |
| **Explore listings** | PL | `placeVisibilityService` | `explorePlaces` | P | P | N | N | N | — | — | — | — | Published + EIN only |
| **Business profile (public)** | PL | `placeVisibilityService` | `getBusinessProfile` | P | P | N | N | N | — | — | — | — | No follower count leak |
| **Get listing (admin read)** | PL | `placeVisibilityService` | `getListing` | P | P | N | N | N | — | — | — | — | Admin draft read via visibility |
| **Get categories** | PL | `placeVisibilityService` | `getCategories` | — | — | — | — | — | — | — | — | — | Static catalog |
| **Local / for-you discovery** | PL | `placeVisibilityService` | `getLocalSuggestions` / `getForYouSuggestions` | P | P | N | N | N | — | — | — | — | Dismissed + interests respected |
| **List connections** | PL + Mem | `placeVisibilityService` | `getConnections` | P | P | N | N | N | — | — | — | — | Member `relationship` read; Place-owned UX |
| **Search users (Place add people)** | PL | `placeVisibilityService` | `searchUsers` | N | P | N | N | N | — | — | — | — | Broader than Member search (documented) |
| **Global search Place provider** | PL | `placeVisibilityService` | `searchController` | P | P | N | N | N | — | — | — | — | `searchListingsForUser` |
| **Activity feed read** | PL | `placeVisibilityService` | `getActivityFeed` | P | P | P | — | N | — | — | — | — | Platform activity read adapter + legacy merge |
| **Location privacy get/update** | PL | `placeMeetingService` | `get/updateLocationPrivacy` | N | — | N | N | N | — | — | — | — | User-level meeting privacy settings |
| **Personal analytics / export** | PL | `placeVisibilityService` | `getPersonalAnalytics` / `exportUserData` | P | P | N | N | N | — | — | — | — | User-scoped |
| **List/get meeting (read)** | PL | `placeVisibilityService` | `getMeetings` / `getMeeting` | P | P | N | N | N | — | — | — | — | Creator/invitee only |
| **Report listing** | PL | `placeListingService` | `reportListing` | P | — | P | P | N | — | — | — | — | `contentReport`; moderator notify deferred |
| **Upsert listing** | PL | `placeListingService` | `upsertListing` | P | — | P | P | N | — | — | — | — | Zod + auto-flag |
| **Upload/delete cover** | PL + FH | `placeListingService` | `uploadCoverImage` / `deleteCoverImage` | P | — | P | P | N | — | — | — | — | `storageService` |
| **Upload/delete avatar** | PL + FH | `placeListingService` | `uploadAvatarImage` / `deleteAvatarImage` | P | — | P | P | N | — | — | — | — | Same |
| **CRUD interaction links** | PL | `placeListingService` | `add/update/deleteInteractionLink` | P | — | P | P | N | — | — | N | — | Hard delete links |
| **List transactions** | PL | — (deferred) | `getTransactions` | N | P | N | N | N | — | — | — | — | **Deferred 1G** — controller Prisma |
| **Get transaction** | PL | — (deferred) | `getTransaction` | N | P | N | N | N | — | — | — | — | **Deferred 1G** |
| **Create transaction** | PL | — (deferred) | `createTransaction` | N | — | N | N | N | — | — | — | — | **Deferred 1G** — append-only telemetry |
| **Update transaction privacy** | PL | — (deferred) | `updateTransactionPrivacy` | N | — | N | N | N | — | — | — | — | **Deferred 1G** |
| **Transaction summary** | PL | — | `getTransactionSummary` | N | P | N | N | N | — | — | — | — | Aggregates |
| **Track interaction click** | PL | — | `trackInteractionClick` | N | — | N | N | N | — | — | — | — | Also creates EXTERNAL_CLICK tx |
| **Interaction stats (admin)** | PL | — | `getInteractionStats` | N | P | N | N | N | — | — | — | — | Business admin |
| **List meetings (legacy row)** | PL | `placeVisibilityService` | `getMeetings` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **Create meeting** | PL | `placeMeetingService` | `createMeeting` | P | — | P | P | P | P | — | — | — | Invites; `place_meeting_invite` notify + RT |
| **Update meeting** | PL | `placeMeetingService` | `updateMeeting` | P | — | P | P | N | P | — | N | — | Creator only |
| **Cancel meeting** | PL | `placeMeetingService` | `deleteMeeting` | P | — | P | P | N | P | — | N | — | Soft cancel status |
| **RSVP meeting** | PL | `placeMeetingService` | `rsvpMeeting` | P | — | P | P | P | P | — | — | — | `place_meeting_rsvp` notify creator |
| **Link meeting to calendar** | PL + Cal | `placeMeetingService` | `linkToCalendar` | P | P | P | P | N | P | — | — | — | **`calendarEventService.createEvent`**; Place owns `eventId` only |
| **Location privacy (legacy row)** | PL | `placeMeetingService` | `get/updateLocationPrivacy` | N | — | N | N | N | — | — | — | — | See consolidated row above |
| **List/create/get community** | PL | `placeCommunityService` | `placeCommunityController` | P | C | N | N | N | — | — | — | — | No activity/notifications yet |
| **Join/leave community** | PL | `placeCommunityService` | `joinCommunity` / `leaveCommunity` | P | C | N | N | N | — | — | — | — | No invite notification |
| **Auto-cluster communities** | PL | — | `generateAutoClusters` | N | — | N | N | N | — | — | — | — | Batch write |
| **Activity feed (legacy row)** | PL | `placeVisibilityService` | `getActivityFeed` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **Personal analytics (legacy row)** | PL | `placeVisibilityService` | `getPersonalAnalytics` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **GDPR export (legacy row)** | PL | `placeVisibilityService` | `exportUserData` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **Local discovery (legacy row)** | PL | `placeVisibilityService` | `getLocalSuggestions` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **For-you discovery (legacy row)** | PL | `placeVisibilityService` | `getForYouSuggestions` | P | P | N | N | N | — | — | — | — | See consolidated row above |
| **Dismiss suggestion** | PL | `placeService` | `dismissSuggestion` | P | C | N | N | N | — | — | — | — | Idempotent upsert |
| **AI recommendations** | PL | `placeAIActionService` | `getAIRecommendations` | N | C | N | N | N | — | C | — | — | `recommendPlaces` via visibility |
| **AI purchase help** | PL | `placeAIActionService` | `getPurchaseHelp` | N | C | N | N | N | — | C | — | — | Link guidance only; no transaction |
| **AI reservation help** | PL | `placeAIActionService` | `getReservationHelp` | N | C | N | N | N | — | C | — | — | External links only; no calendar create |
| **AI context overview** | PL | `placeVisibilityService` | `getPlaceContextOverview` | P | P | N | N | N | — | P | — | — | Provider registered |
| **AI context connections** | PL | `placeVisibilityService` | `getPlaceConnectionsContext` | P | P | N | N | N | — | P | — | — | |
| **AI context discoveries** | PL | `placeVisibilityService` | `getPlaceDiscoveriesContext` | P | P | N | N | N | — | P | — | — | Pipeline source `vssyl_place` |
| **AI context activity** | PL | `placeAIActionService` → visibility | `getPlaceActivityContext` | P | P | N | N | N | — | C | — | — | |
| **AI context analytics** | PL | `placeVisibilityService` | `getPlaceAnalyticsContext` | P | P | N | N | N | — | P | — | — | |
| **Global search listings** | PL | `placeVisibilityService` | `searchController` | P | P | N | N | N | — | — | — | — | `searchListingsForUser` |
| **Business workspace listing editor** | PL | — | Client `PlaceListingEditor` | — | P | N | N | N | — | — | — | — | No hub landing component |
| **Place home UX** | PL | — | Client `PlaceContext` + tabs | — | P | N | N | N | P | — | — | — | WebSocket refresh |
| **Notebook link PLACE_LISTING** | NB | — | — | — | — | — | — | — | — | — | — | N | **Fail closed 400** |

---

## Manifest truth rows

| Surface | Claim | Runtime | Verdict |
|---------|-------|---------|---------|
| `place` capabilities.trash | omitted | No `trashedAt`; hard deletes | **C** (truthful omission) |
| `place` capabilities.vlink | omitted | No entity/resolver | **C** |
| `place` capabilities.realtime | omitted | Partial socket via Chat service | **C** (omission OK; document partial RT) |
| `place` capabilities.ai | true | HTTP AI + context providers + ActionExecutor + toolExecutor (read-only) | **C** — reconciled Wave 1F |
| `place` capabilities.notifications | omitted | UI types exist; server never emits | **C** manifest; **N** product/UI gap |
| `place` entities[] | omitted | No platform registration | **C** |
| `place` notifications[] | omitted | No server notifications | **C** |
| `coreModuleRegistry` place | active | Routes registered | **C** |
| `BrandedWorkDashboard` place icon/name | missing | `moduleIcons` only | **N** hub pattern |
| `PlaceWorkspaceLanding` | missing | Listing editor inline in workspace switch | **N** module-development rule |
| Product memory bank “notifications integrated” | claimed | No `NotificationService` calls | **N** doc drift |

---

## Operation count summary (audit-time)

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Place core / graph / settings | 8 | 0 | 2 | 6 |
| Connections / member overlap | 4 | 0 | 2 | 2 |
| Listings / explore / moderation | 10 | 0 | 6 | 4 |
| Transactions / clicks | 6 | 0 | 4 | 2 |
| Meetings / calendar / privacy | 7 | 0 | 4 | 3 |
| Communities | 4 | 0 | 1 | 3 |
| Feed / analytics / export | 3 | 0 | 3 | 0 |
| Discovery | 3 | 0 | 2 | 1 |
| AI (HTTP + context) | 8 | 0 | 8 | 0 |
| Search / UX / cross-module | 4 | 0 | 3 | 1 |
| **Total inventoried** | **~57** | **0** | **35** | **22** |

---

## Certification impact

| Area | Blocker for L2? | Blocker for L3? | Rationale |
|------|-----------------|-----------------|-----------|
| Canonical services | **Yes** | **Yes** | Zero service layer |
| Policy Engine on writes | **Yes** | **Yes** | No actions / dual |
| Calendar delegation | **Yes** | **Yes** | Direct event create |
| Module activity / events | **Yes** | **Yes** | No platform activity |
| Notifications | P1 | **Yes** if product requires | UI types without backend |
| V_Link + entity | P1 | **Yes** for Reference #5 | Listing/meeting share lifecycle |
| Global Trash | P2 | **Yes** if deletes must be soft | Hard delete today |
| ActionExecutor twins | ~~P2~~ **Resolved 1F** | **Yes** for manifest `ai: true` | Read-only ops via `placeAIActionService` |
| Tests | **Yes** | **Yes** | One integration test |
| Realtime | No | No | Truthfully omitted from manifest |

---

## Target state (post–Wave 1 extraction)

Mirror Todo #4 / File Hub bar:

- **`placeVisibilityService`** — explore, profile, search, AI context reads
- **`placeAIActionService`** — read-only AI ops; visibility-backed grounding
- **`placeListingService`** + **`placePolicyDual`** — listing/link/image mutations
- **`placeMeetingService`** → **`calendarEventService`** for event creation
- **`placeNotificationService`** — align with UI types or remove UI entries
- **`placeActivityService`** OR wire feed to **`emitModuleActivityEvent`** (single model)
- **`registerPlacePlatformEntities`** → `place:listing`, `place:meeting`
- **`registerGlobalTrashHandlers('place')`** — if product requires soft delete
- Operation matrix re-run with majority **C** before L2 promotion

---

*Wave 0 audit; Phase 1B graph + Phase 1C visibility 2026-06-03 — consolidated read rows at top; legacy duplicate rows retained for diff trace.*
