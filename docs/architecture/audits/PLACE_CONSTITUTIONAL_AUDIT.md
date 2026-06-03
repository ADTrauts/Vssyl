# Place Constitutional Audit

**Module id:** `place`  
**Phase:** **Wave 0 — Audit & governance** (2026-06-02)  
**Certification status:** **Level 3 — Certified** (post–Wave 3C 2026-06-02)  
**Date:** 2026-06-02  
**Benchmarks:** [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) — File Hub #1, Chat #2, Calendar #3, Todo #4  
**Related:** [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md)

> **Wave 1F delta (2026-06-03):** `placeAIActionService` owns read-only AI ops; `placeAIController` is thin (no Prisma); `ActionExecutor` + `toolExecutor` register read-only Place twins. Manifest `ai: true` reconciled.
>
> **Wave 1G delta (2026-06-03):** `placeCommunityService`; `placeService.dismissSuggestion`; `placeVisibilityService.getEnrichedPlaceGraph`; `placeConnectionService` boundary documented; transactions deferred (superseded by 2C).
>
> **Wave 2B delta (2026-06-03):** Full constitutional refresh — [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md). Scorecard §3 below superseded for current posture. **Estimated level: Level 2 candidacy.** Not ready for formal L3 certification review.
>
> **Wave 2C delta (2026-06-03):** P0 cleanup — [PLACE_LEVEL2_READINESS_REVIEW.md](./PLACE_LEVEL2_READINESS_REVIEW.md). Single platform activity read model; `placeTransactionService`; connection/transaction PE; manifest reconciliation.
>
> **Wave 2D delta (2026-06-02):** Formal L2 certification — [PLACE_LEVEL2_CERTIFICATION_REVIEW.md](./PLACE_LEVEL2_CERTIFICATION_REVIEW.md). **Level 2 — Certified.** Reference #5 **Strong Candidate** (council not opened). **Not certified L3.**
>
> **Wave 3A delta (2026-06-02):** L3 preparation — workspace hub, community side effects, location privacy PE. Matrix **0 N** rows. **L3 certification review not opened.**
>
> **Wave 3B delta (2026-06-02):** C density push — graph/meeting/listing/connection/community lifecycle **C**; community join/leave notifications (6 manifest types); listing realtime on writes; interests/follow-visibility/node-update domain events. Matrix **35 C / 28 P / 0 N**. **Formal L3 certification review not opened** (eligible after product sign-off).
>
> **Wave 3C delta (2026-06-02):** Formal Level 3 certification — [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md). **Level 3 — Certified.** Reference #5 council **not opened**.
>
> **Wave 4B delta (2026-06-02):** Reference Module #5 council — [PLACE_REFERENCE_COUNCIL_REVIEW.md](./PLACE_REFERENCE_COUNCIL_REVIEW.md). **Reference Module #5 designated.** Level remains **3 — Certified**.

---

## 1. Inventory

### 1.1 Classification key

| Class | Meaning |
|-------|---------|
| **Place-owned** | Place product persistence, composition, or Place-specific UX |
| **Delegated — certified module** | Calendar, Chat, File Hub, Member/Relationship domain |
| **Delegated — Business domain** | `Business`, `BusinessMember`, `BusinessFollow`, EIN verification |
| **Deferred** | Planned; not shipped or fail-closed elsewhere |

### 1.2 Frontend routes

| Route | Class | Notes |
|-------|-------|-------|
| `/place` | Place-owned | 5 sub-tabs: My Place, Explore, Meetings, Feed, Insights |
| `/place/transactions` | Place-owned | Transaction history page |
| `/business/[id]/place` | Place-owned | Business admin listing editor entry |
| Business workspace `case 'place'` | Place-owned | `PlaceListingEditor` only — **no** `PlaceWorkspaceLanding.tsx` |

### 1.3 Backend routes

**Prefix:** `/api/place` (62 endpoints, `server/src/routes/place.ts`)

| Area | Controller | Endpoints (approx.) |
|------|------------|---------------------|
| Place CRUD, nodes, interests, connections | `placeController` | 13 |
| Listings, explore, interaction links, images | `placeListingController` | 14 |
| Discovery / suggestions | `placeDiscoveryController` | 5 (3 user + 2 AI context) |
| Transactions / clicks | `placeTransactionController` | 7 |
| Meetings, location privacy, calendar link | `placeMeetingController` | 9 |
| Communities | `placeCommunityController` | 6 |
| Feed, analytics, export, AI context | `placeAnalyticsController` | 4 |
| AI recommendations / purchase / reservation | `placeAIController` | 4 |

All routes use `authenticateJWT` at router level.

### 1.4 Services

| Service | Class | Role |
|---------|-------|------|
| `place*Service` | **Missing** | **No canonical Place services exist** |
| `storageService` | Delegated — File Hub infra | Listing cover/avatar uploads in `placeListingController` |
| `chatSocketService.broadcastPlaceEvent` | Delegated — Chat realtime infra | Node add/remove, connection accept/request |
| `calendarEventService` | Delegated — Calendar #3 | **Not used** — meetings create `prisma.event` directly |
| `calendarVisibilityService` | Delegated — Calendar #3 | **Not used** for meeting calendar link reads |
| `NotificationService` | Platform | **Not called** from any Place controller |
| `vlinkService` | Platform | **No Place entity resolver or lifecycle** |
| `searchController.placeSearchProvider` | Place-owned (inline) | Federated search for published listings |

**Service ownership maturity:** **None.** All mutation and read logic lives in 8 controllers (~3,847 LOC total).

### 1.5 Controllers

| Controller | Lines | Prisma in handler? | Policy dual? | Side effects in handler? |
|------------|-------|-------------------|--------------|--------------------------|
| `placeController` | 739 | **Yes** (all ops) | **No** | Socket broadcast; `businessFollow` sync |
| `placeListingController` | 685 | **Yes** | **No** | `storageService`; `contentReport` |
| `placeMeetingController` | 522 | **Yes** | **No** | Socket; **direct `prisma.event.create`** |
| `placeAnalyticsController` | 440 | **Yes** | **No** | `recordActivity` helper (unused by callers) |
| `placeAIController` | 435 | **Yes** | **No** | Read-only scoring heuristics (not LLM in controller) |
| `placeDiscoveryController` | 364 | **Yes** | **No** | — |
| `placeTransactionController` | 339 | **Yes** | **No** | Click → transaction create |
| `placeCommunityController` | 323 | **Yes** | **No** | Auto-cluster writes |

**Violations:** §16 canonical boundaries — every controller is a fat handler with direct Prisma, inline authorization, and ad hoc side effects.

### 1.6 Prisma models (Place-owned)

| Model | Table | Notes |
|-------|-------|-------|
| `Place` | `places` | One per user; lazy-created on GET |
| `PlaceNode` | `place_nodes` | Graph node; unique `(placeId, nodeType, entityId)` |
| `PlaceSettings` | `place_settings` | Privacy, layout, discovery prefs |
| `PlaceInterest` | `place_interests` | Discovery categories |
| `BusinessPlaceListing` | `business_place_listings` | Business “building” on Main Street |
| `BusinessInteractionLink` | `business_interaction_links` | External commerce links |
| `PlaceDismissedSuggestion` | `place_dismissed_suggestions` | User dismisses discovery |
| `PlaceTransaction` | `place_transactions` | Purchase / external click / reservation stub |
| `PlaceInteractionClick` | `place_interaction_clicks` | Analytics clicks |
| `PlaceFollowVisibility` | `place_follow_visibility` | Per-business follow visibility |
| `PlaceMeetingPlace` | `place_meeting_places` | Meeting coordination; optional `eventId` |
| `PlaceMeetingInvite` | `place_meeting_invites` | RSVP |
| `PlaceLocationPrivacy` | `place_location_privacy` | Location sharing prefs |
| `PlaceCommunity` | `place_communities` | User + auto-cluster communities |
| `PlaceCommunityMember` | `place_community_members` | Membership |
| `PlaceActivityFeedItem` | `place_activity_feed` | **Module-local feed** (not platform activity) |
| `PlaceAnalyticsSnapshot` | `place_analytics_snapshots` | Periodic snapshots (write path unclear) |

**Enums:** `PlaceNodeType`, `PlaceCategory`, `InteractionLinkType`, `PlaceTransactionStatus`, `PlaceTransactionType`, `MeetingPlaceStatus`, `MeetingInviteStatus`, `PlaceCommunityType`, `PlaceActivityType`.

**Cross-module tables touched (not owned):** `Relationship`, `BusinessFollow`, `Business`, `BusinessMember`, `User`, `Household`, `Event`, `Calendar`, `CalendarMember`, `ContentReport`.

**No `trashedAt`** on any Place model.

### 1.7 Manifests & registration

| Artifact | Status | Notes |
|----------|--------|-------|
| `builtInModuleManifests` case `place` | Minimal | `read`, `write`, `ai`, `businessWorkspace`; **no** `trash`, `vlink`, `realtime`, `notifications`, `entities[]` |
| `registerBuiltInModules` | Partial | Rich `ModuleAIContext` + 5 context providers |
| `registerGlobalTrashHandlers` | **Absent** | No Place handler |
| `registerPlatformEntities` | **Absent** | No `place:listing` / `place:meeting` |
| `coreModuleRegistry` | Present | Personal + business routes to `/place` |
| `widgetRegistry` | **Absent** | No `PlaceWidget` |
| `BrandedWorkDashboard` | **Gap** | No `getModuleIcon` / `getModuleName` for `place` (icon exists in `moduleIcons.ts` only) |
| `ActionExecutor` / `toolExecutor` | **Absent** | No Place operations registered |
| `seedPlaceDemoData.ts` | Dev script | Demo seed only |

### 1.8 Widgets

| Widget | Status |
|--------|--------|
| Dashboard `PlaceWidget` | **Missing** |
| Business front-page widgets | Place-specific widgets **not** in `business/widgets/index.tsx` |

### 1.9 AI surfaces

| Surface | Class | Notes |
|---------|-------|-------|
| `GET /api/place/ai/context/*` (5 providers) | Place-owned | Registered in `registerBuiltInModules`; Prisma in controllers |
| `GET /api/place/ai/recommendations` | Place-owned | Rule-based scoring in `placeAIController` |
| `POST /api/place/ai/purchase-help` | Place-owned | Link matching heuristic |
| `POST /api/place/ai/reservation-help` | Place-owned | OpenTable/Resy link suggestion |
| `ActionExecutor` | **Missing** | No twin paths |
| `toolExecutor` | **Missing** | Pipeline tests reference `place_search` tool id only |
| `moduleContextProviderSelection` | Partial | Routes `place_connections` / `place_discoveries` by query |

### 1.10 Search

| Integration | Status |
|-------------|--------|
| `searchController.placeSearchProvider` | **Inline Prisma** in search controller |
| Tenant scoping | Published + EIN-verified listings only; no user-specific follow filter |
| Dedicated `placeSearchService` | **Missing** |

### 1.11 Realtime

| Event | Emitter | Consumer |
|-------|---------|----------|
| `place:node:added` | `placeController.addNode` | `usePlaceWebSocket` |
| `place:node:removed` | `placeController.removeNode` | `usePlaceWebSocket` |
| `place:connection:accepted` | `placeController.acceptConnection` | `usePlaceWebSocket` |
| `place:connection:request` | `placeMeetingController.createMeeting` (invites) | `usePlaceWebSocket` |

**Ownership:** Events routed through **`chatSocketService`** — not a Place-owned realtime service. Manifest omits `realtime: true` (truthful omission; runtime exists partially).

### 1.12 Tests

| File | Scope |
|------|-------|
| `place-meeting-calendar-link.integration.test.ts` | Calendar link 403 on foreign event |
| `seedPlaceDemoData.ts` | Script only |

**No** controller contract tests, service tests, manifest tests, trash tests, PE tests, notification tests, or V_Link tests for Place.

### 1.13 Frontend components (Place-owned)

| Component | Role |
|-----------|------|
| `PlaceGraph`, `PlaceContent`, `PlaceExplore`, `PlaceOnboarding` | Main Street UX |
| `PlaceMeetings`, `PlaceActivityFeed`, `PlaceAnalyticsDashboard` | Sub-tabs |
| `PlacePrivacySettings`, `PlaceListingEditor` | Settings / business admin |
| `BusinessProfilePanel`, `HouseholdProfilePanel` | Profile panels |
| `nodes/BusinessNode`, `UserNode`, `HouseholdNode` | Graph nodes |
| `PlaceContext` | Client state + `/api/place` fetch |
| API clients | `placeListing.ts`, `placeMeeting.ts`, `placeTransaction.ts`, `placeAnalytics.ts` |

---

## 2. Ownership review

### 2.1 What Place owns (correct)

| Domain | Rationale |
|--------|-----------|
| Personal Main Street graph (`Place`, `PlaceNode`, settings, interests) | Core product |
| Business listing presentation (`BusinessPlaceListing`, interaction links) | Place-specific storefront layer atop Business |
| Discovery dismissals, follow visibility | Place privacy UX |
| Place-local activity feed + analytics snapshots | Place social/commerce analytics (distinct from platform module activity) |
| Place meetings as coordination objects | Place product surface (with Calendar delegation for events) |
| Place communities (interest clusters) | Place social layer |
| Transactions / interaction clicks | Place commerce telemetry (Stripe fields present; full payment flow deferred) |

### 2.2 What Place should own vs delegate

| Concern | Should own | Should delegate to |
|---------|------------|-------------------|
| Calendar events for meetings | Link + metadata only | **Calendar #3** — `calendarEventService`, visibility, trash, domain events |
| User connections | PlaceNode mirror | **Member/Relationship domain** — `Relationship` CRUD should not live only in Place controller |
| Business follow | Sync from node | **Business domain** — `BusinessFollow` is shared; Place should call a business/member service |
| Listing images | Place URLs/metadata | **File Hub #1** — uploads via `storageService` (acceptable infra); consider drive-backed assets for lifecycle |
| Chat about meetings | — | **Chat #2** — no message writes in Place |
| Notebook links to listings | — | **Notebook** — `PLACE_LISTING` target **fail-closed** until Place entity + visibility exist |
| Permanent delete / restore | Soft-delete policy TBD | **Global Trash** — if listings/meetings become trashable |
| Notifications | Place-specific types | **NotificationService** — types declared in UI, **never emitted** server-side |
| Search | Query adapter | Dedicated **`placeVisibilityService`** / search service (pattern: drive) |
| V_Link to listing/meeting | Entity descriptor + access | **V_Link platform** — `place:listing`, `place:meeting` when lifecycle defined |

### 2.3 Boundary risks

1. **`placeMeetingController.linkToCalendar`** creates `prisma.event` directly — bypasses Calendar canonical write path, PE, activity, domain events, and notifications.
2. **`placeController`** owns `Relationship` create/accept — duplicates Member module concerns.
3. **`PlaceActivityFeedItem`** vs **`emitModuleActivityEvent`** — parallel activity systems; feed helper **`recordActivity` is never imported** by mutation controllers (feed likely empty in production).
4. **Product doc vs platform truth:** `memory-bank/vssylPlaceProductContext.md` claims “Notifications: Place category integrated” — server does not call `NotificationService`.

---

## 3. Constitutional compliance scorecard

**Wave 2B refresh (2026-06-03)** — see [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md) for full rationale.

| Standard | C/P/N | 🟢/🟡/🔴 | Evidence |
| -------- | ----- | -------- | -------- |
| **Canonical Services** | P | 🟡 | 18 `place*Service` files; **`placeTransactionService` missing** |
| **Thin Controllers** | P | 🟡 | 7/8 thin; **`placeTransactionController` Prisma-inline** |
| **Policy Engine** | P | 🟡 | `placePolicyDual` on graph/listing/meeting/trash; gaps on connections, transactions, location privacy |
| **Global Trash** | C | 🟢 | Wave 2A — listing + meeting via `placeTrashService` |
| **Visibility Services** | C | 🟢 | `placeVisibilityService` — explore, search, AI context, feed adapter |
| **Domain Events** | P | 🟡 | `placeDomainEventService` on mutations + trash; communities/transactions omit |
| **Module Activity** | P | 🟡 | `placeActivityService` on mutations; **dual feed** with legacy `PlaceActivityFeedItem` |
| **Notifications** | P | 🟡 | 4 types emitted; manifest declares 2 |
| **Realtime** | C | 🟢 | `placeRealtimeService` via Chat socket adapter |
| **Platform Entity Registration** | C | 🟢 | `place:listing`, `place:meeting` — Wave 2A |
| **V_Link** | C | 🟢 | Access, lifecycle, resolver, Notebook listing validation |
| **Capability Matrix** | P | 🟡 | Core capabilities aligned; notifications subset; businessWorkspace partial |
| **AI Compliance** | C | 🟢 | `placeAIActionService`; read-only ActionExecutor + tools |
| **Scheduler Integration** | 🔴 | 🔴 | No jobs; analytics snapshots unscheduled |
| **Documentation** | P | 🟡 | Wave 0 body retained for history; 2B readiness doc authoritative |
| **Tests** | P | 🟡 | 27 `*place*.test.ts` files; 1 calendar-link integration |

**Overall constitutional posture:** **Medium–High for Level 2 candidacy** — no longer Level 0. **Two P0 items** remain: dual activity model; transaction controller bypass. **Not ready for Level 3 certification review.**

### Wave 0 scorecard (historical — superseded)

<details>
<summary>Pre-extraction scorecard (2026-06-02)</summary>

| Standard | Status | Evidence |
| -------- | ------ | -------- |
| **Canonical Services** | 🔴 | Zero `place*Service.ts` files |
| **Thin Controllers** | 🔴 | 8 controllers, ~3,847 LOC, all Prisma-inline |
| **Policy Engine** | 🔴 | No `placePolicyDual` |
| **Global Trash** | 🔴 | No `trashedAt`; no handler |
| **Visibility Services** | 🔴 | No `placeVisibilityService` |
| **Domain Events** | 🔴 | No `place.*` registered |
| **Module Activity** | 🔴 | No `emitModuleActivityEvent` |
| **Notifications** | 🔴 | Zero server emits |
| **Realtime** | 🟡 | Partial via chat socket |
| **Platform Entity Registration** | 🔴 | None |
| **V_Link** | 🔴 | No resolver |
| **AI Compliance** | 🔴 | Prisma in controllers |
| **Tests** | 🔴 | One integration test |

</details>

---

## 4. Policy Engine

| Check | Result |
|-------|--------|
| `PolicyResourceType` includes `'place'` | ✅ in `policyTypes.ts` |
| Place-specific `PolicyAction` entries | 🔴 **None** in `policyActions.ts` |
| `placePolicyDual` / dual enforcement on writes | 🔴 **None** |
| Legacy inline checks | 🟡 `verifyBusinessAdmin` in listing controller; meeting participant checks; calendar member role checks |
| Dual enforcement readiness | 🔴 **Not ready** — must define actions (`PLACE_LISTING_UPDATE`, `PLACE_MEETING_CREATE`, etc.) before dual wrapper |

---

## 5. Global Trash

| Check | Result |
|-------|--------|
| `trashedAt` on Place models | 🔴 **None** |
| `registerGlobalTrashHandlers('place')` | 🔴 **Absent** |
| Soft delete flows | 🔴 Nodes, listings links, meetings use **hard delete** |
| Restore / permanent delete | 🔴 **N/A** |
| Product need | 🟡 Listings and meetings may need trash in future; transactions likely immutable |

---

## 6. Activity & domain events

### 6.1 Module activity (`emitModuleActivityEvent`)

| Check | Result |
|-------|--------|
| Normalized platform activity on writes | 🔴 **None** |
| Place-local `PlaceActivityFeedItem` | 🟡 Schema + `recordActivity()` helper in `placeAnalyticsController` |
| Helper wired to mutations | 🔴 **`recordActivity` never called** from other controllers |

### 6.2 Domain events

| Check | Result |
|-------|--------|
| Registered `place.*` events | 🔴 **None** |
| Controller-based emits | 🔴 **None** |
| Analytics subscriber | Place events **not** consumed |

**Recommended event taxonomy (future):** `place.listing.published`, `place.node.added`, `place.meeting.created`, `place.transaction.completed` — emit from services only after Phase 1 extraction.

---

## 7. Notifications

| Type (UI registry) | Server emit | Manifest |
|--------------------|-------------|----------|
| `place_meeting_invite` | 🔴 | omitted |
| `place_meeting_rsvp` | 🔴 | omitted |
| `place_connection_request` | 🔴 | omitted |
| `place_connection_accepted` | 🔴 (socket only) | omitted |
| `place_community_invite` | 🔴 | omitted |

**Verdict:** **Overclaim in product memory bank**; **underclaim in manifest** (no false `notifications: true`). Runtime is **non-compliant** with module contract for user-facing notification types already in UI.

---

## 8. AI compliance

| Check | Result |
|-------|--------|
| Prisma in AI controllers | 🔴 All context + recommendation handlers |
| Mock req/res | ✅ Not observed |
| Context providers auth'd + bounded | 🟡 JWT on routes; bounded `take` limits in places |
| Writes via canonical services | 🔴 N/A — no AI writes; purchase/reservation are read-only heuristics |
| ActionExecutor participation | 🔴 **None** |
| ToolExecutor participation | 🔴 **None** |
| Manifest `actions[]` vs runtime | 🟡 Declares `view_place`, `add_node`, `explore_businesses` — not wired to executors |

---

## 9. Platform entities (recommendations)

| Entity id | Lifecycle? | Recommend |
|-----------|------------|-----------|
| `place:listing` | **Yes** — publish/unpublish, business-scoped | **Register** when V_Link + visibility service exist |
| `place:meeting` | **Yes** — create/update/cancel/complete | **Register** when Calendar delegation fixed |
| `place:node` | **Maybe** — user graph composition | Defer — low V_Link value |
| `place:vendor` | **No** — maps to `Business` | **Do not register** — Business domain owns vendor |
| `place:location` | **No** — string/geo on meeting | **Do not register** as standalone entity |
| `place:review` | **Not shipped** | Defer |
| `place:resource` | **Ambiguous** | Defer until product defines bookable resources |

**NotebookLink:** `PLACE_LISTING` remains **fail-closed** in `notebookLinkService` until `place:listing` visibility + entity registration ship.

---

## 10. V_Link

| Check | Result |
|-------|--------|
| Place entity in `platformEntityRegistry` | 🔴 |
| `placeVlinkAccessService` / lifecycle | 🔴 |
| Cross-module `PLACE_LISTING` enum | 🟡 In Prisma `NotebookLink` target types only |
| Future opportunity | Shareable business listing URLs; meeting invites linked to calendar events |

---

## 11. Reference module comparison

| Pattern | File Hub #1 | Todo #4 | Place |
|---------|-------------|---------|-------|
| Canonical services | ✅ | ✅ | 🔴 **None** |
| Thin controllers | ✅ | 🟡 | 🔴 |
| Trash + handler | ✅ | ✅ | 🔴 |
| Visibility reads | ✅ | ✅ | 🔴 |
| Policy dual | ✅ | ✅ | 🔴 |
| Domain events | ✅ | ✅ | 🔴 |
| Activity on writes | ✅ | ✅ | 🔴 |
| Notifications | ✅ | ✅ | 🔴 |
| AI → services + executors | ✅ | ✅ | 🔴 |
| V_Link + entity | ✅ | ✅ | 🔴 |
| Realtime | partial | ✅ | 🟡 via Chat socket |
| Search provider | ✅ | ✅ | 🟡 inline |

---

## 12. Certification assessment (current state only)

| Level | Fit | Rationale |
|-------|-----|-----------|
| **0 — Legacy** | **✅ Current** | Fat controllers; no service layer; no PE; no trash; no module activity; no domain events; no notification pipeline |
| **1 — Stabilizing** | Partial signals only | AI context providers, search provider, partial realtime — insufficient to promote |
| **2 — Modernized** | **No** | Core constitutional requirements not met |
| **3 — Certified** | **No** | File Hub patterns not applied |
| **4 — Reference** | **No** | — |

**Assigned level:** **0 — Legacy**

---

## 13. Reference Module #5 viability

| Factor | Assessment |
|--------|------------|
| Product completeness | **High** — broad UX, 62 endpoints, rich schema |
| Platform contract | **Low** — largest gap in Wave 3 candidates |
| Cross-module leverage | **High** — natural Calendar, Chat, Notebook, File Hub, V_Link integrations |
| Audit clarity | **High** — boundaries identifiable; extraction path mirrors Todo Phase 1 |
| **Viability as Reference #5** | **Yes, after modernization** — best candidate **once** service extraction, listing/meeting entities, and Calendar delegation are complete. **Not viable as reference today.** |

---

## 14. Biggest risks

1. **Calendar bypass** — meeting→event creates orphan events outside Calendar certification pipeline.
2. **No authorization layer** — business listing and meeting mutations rely on ad hoc role checks; no PE fail-closed path.
3. **Dead activity feed** — `recordActivity` never called; product Feed tab may appear empty.
4. **Notification UI without backend** — users may expect alerts that never arrive.
5. **Hard deletes** — no recovery path for meetings, nodes, or listing links.
6. **Monolithic controllers** — highest regression risk for any Place change; blocks AI executor registration.
7. **Memory bank / product overclaim** — “notifications integrated” and “Level 3-ready” narratives conflict with ledger Level 0.

---

## 15. Recommended next phase

**Wave 2C — L2 certification prep** (governance only until ACT approval):

1. Activity feed single-model migration (platform activity only; retire or bridge legacy feed)
2. **`placeTransactionService`** extraction **or** signed commerce-out-of-scope for L2 validation
3. Manifest `notifications[]` reconciliation (4 runtime types vs 2 declared)
4. **`PlaceWorkspaceLanding`** + `BrandedWorkDashboard` place icon/name
5. Connection Policy Engine on send/accept
6. Formal **L2 certification review** when above P0/P1 items addressed — produce `PLACE_LEVEL2_CERTIFICATION_REVIEW.md` only when approved

**Do not** open Level 3 certification review or Reference #5 council until L2 certified and hub/commerce story complete. See [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md).

---

*Wave 0 audit baseline; Wave 2B refresh 2026-06-03 — no runtime code changes in 2B.*

---

## 16. Current constitutional scorecard (Wave 3B — 2026-06-02)

| Contract area | Verdict | Notes |
|---------------|---------|-------|
| Service extraction | **C** | 12+ canonical `place*Service` modules; thin controllers |
| Policy Engine (writes) | **C** | Graph, listing, meeting, connection, community, privacy handlers wired |
| Policy Engine (reads) | **P** | Visibility/discovery reads partial vs write parity |
| Activity + domain events | **C** | All primary write lifecycles emit on success |
| Notifications | **C** | 6 runtime types; manifest aligned; community join/leave added 3B |
| Realtime | **C** | Graph, connections, meetings, listings, community |
| Global Trash + V_Link | **C** | Listing + meeting entities |
| Business workspace hub | **C** | `PlaceWorkspaceLanding` |
| Transactions / commerce | **P** | Service extracted; activity/events deferred |
| Operation matrix | **35 C / 28 P / 0 N** | Exceeds 20+ **C** L3 prep target |

**Estimated certification level:** **Level 3 — Certified** + **Reference Module #5** (Wave 4B).
