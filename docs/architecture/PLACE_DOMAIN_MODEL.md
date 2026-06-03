# Place Domain Model

**Status:** **Locked** — Wave 1B gate; **Wave 2A implemented** (2026-06-03) — `trashedAt` on listing/meeting, trash service, Global Trash, V_Link, platform entities  
**Module id:** `place`  
**Date:** 2026-06-02  
**Parent:** [PLACE_SERVICE_EXTRACTION_PLAN.md](./PLACE_SERVICE_EXTRACTION_PLAN.md)  
**Authorities:** [PLACE_CONSTITUTIONAL_AUDIT.md](./audits/PLACE_CONSTITUTIONAL_AUDIT.md), [PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](./PLACE_PRODUCT_ARCHITECTURE_REVIEW.md), [PLACE_OPERATION_MATRIX.md](./audits/PLACE_OPERATION_MATRIX.md)

**Hard stops:** No Prisma edits, no migrations, no service files, no controller changes in this phase.

**Implementation gate:** Phase **1B** (`placePolicyDual` + `placeService`) may start **after** this document is merged and linked from the ledger.

---

## Design principles

1. **External graph, internal workspace elsewhere** — Place owns market-facing relationship and storefront layers; Notebook/Todo/Calendar/File Hub own operational work inside the building ([PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](./PLACE_PRODUCT_ARCHITECTURE_REVIEW.md) §4).
2. **Calendar is authoritative for schedule records** — `PlaceMeetingPlace` holds social coordination metadata only; all `Event` mutations go through **`calendarEventService`** ([§9](#part-9--calendar-delegation-contract)).
3. **Platform module activity is canonical** — `emitModuleActivityEvent` on successful writes; **`PlaceActivityFeedItem` is deprecated** for new writes; Feed UI reads via adapter ([§8](#part-8--activity--domain-events)).
4. **Dual-write forbidden** — No parallel feed-table writes alongside module activity (constitutional drift).
5. **Member/Business domains are authoritative** for `Relationship` and `Business` identity — Place mirrors into graph nodes; does not fork ACL semantics.
6. **Immutable commerce telemetry** — Transaction and click rows are append-only; no Global Trash.
7. **Fail closed** — Notebook `PLACE_LISTING` links, V_Link resolve, and explore/search remain blocked until visibility + entity registration criteria met ([§6](#part-6--platform-entities--v_link)).

---

## Part 1 — Domain groups

| # | Domain | Owned models | Aggregate root | Primary lifecycle | Visibility | Write permissions | Delegated modules | Cert priority |
|---|--------|--------------|----------------|-------------------|------------|-------------------|-------------------|---------------|
| **1** | **Personal Graph** | `Place`, `PlaceSettings`, `PlaceInterest`, `PlaceNode`, `PlaceFollowVisibility`, `PlaceLocationPrivacy` | **`Place`** (per user) | Lazy create → setup → active graph | Owner-only writes; graph read scoped to owner (+ enriched public listing data on nodes) | `place:read`, `place:write`, `place:node.*` | `BusinessFollow` sync (Business); `Relationship` mirror (Member) | **P0** — Phase 1B |
| **2** | **Listings / Storefront** | `BusinessPlaceListing`, `BusinessInteractionLink` | **`BusinessPlaceListing`** (per business) | Draft → published → hidden/unpublished → trash (2A) | Public read: published + enabled + EIN verified; admin read: business ADMIN/MANAGER | `place:listing.*` | `storageService` (images); `ContentReport` (platform moderation) | **P0** — Phase 1D |
| **3** | **Discovery** | `PlaceDismissedSuggestion` | **`PlaceDismissedSuggestion`** (per user+business) | Active dismiss → permanent row (immutable preference) | Owner-only | `place:discovery.write` | Explore reads via visibility service | **P1** — Phase 1C |
| **4** | **Meetings** | `PlaceMeetingPlace`, `PlaceMeetingInvite` | **`PlaceMeetingPlace`** | Proposed → invited → confirmed → linked → completed/cancelled | Creator + invitees; private flag on meeting | `place:meeting.*`, `place:meeting.rsvp` | **`calendarEventService`** for `Event`; notifications | **P0** — Phase 1D |
| **5** | **Communities** | `PlaceCommunity`, `PlaceCommunityMember` | **`PlaceCommunity`** | Created → active → archived/deleted | Public communities readable when `isPublic`; membership scoped | `place:community.*` | — | **P2** — Phase 1G |
| **6** | **Commerce / Transactions** | `PlaceTransaction`, `PlaceInteractionClick` | **`PlaceTransaction`** (logical; clicks separate) | Click recorded → transaction completed (append-only) | Owner + business admin stats | `place:transaction.read`, `place:transaction.record` | Stripe (future); deferred service | **P3** — defer Phase 1G+ |
| **7** | **Analytics / Feed** | `PlaceActivityFeedItem` (legacy), `PlaceAnalyticsSnapshot` | **None** (derived/read models) | Feed: **deprecated**; snapshots: batch job (future) | Owner; connection-visible public feed items (legacy read path) | Read-only via visibility | Platform module activity (writes) | **P1** — activity in 1D; snapshots defer |

**Cross-cutting (not a domain group):** `PlaceFollowVisibility` belongs to **Personal Graph** (privacy overlay on business follows).

---

## Part 2 — Aggregate roots

### 2.1 `Place` (Personal Graph root)

| Field | Value |
|-------|-------|
| **Root authority** | One `Place` per `userId` (unique) |
| **Children** | `PlaceSettings`, `PlaceInterest[]`, `PlaceNode[]` (by reference) |
| **Allowed mutations** | Lazy create; update settings; complete setup; replace interests; **not** direct child node bulk replace without node service |
| **Delete/trash** | **No user delete** in v1 — graph persists with account; account deletion cascade via Prisma `onDelete: Cascade` |
| **Domain events** | `place.setup.completed`, `place.settings.updated` |
| **Activity** | `place.setup.completed`, `place.settings.updated` |
| **V_Link** | **No** — not a shareable entity |
| **Global Trash** | **No** |

### 2.2 `PlaceNode` (child of Place aggregate)

| Field | Value |
|-------|-------|
| **Root authority** | Parent `Place` (owner `userId`) |
| **Identity** | Unique `(placeId, nodeType, entityId)` |
| **Child types** | `BUSINESS`, `USER`, `HOUSEHOLD`, `MEETING_PLACE` (enum) |
| **Allowed mutations** | Add, update layout/label/color/pinned, remove |
| **Delete/trash** | **Phase 1:** hard remove (unfollow). **Phase 2+ defer:** optional `trashedAt` on node — **not in 2A** |
| **Sync rules** | `BUSINESS` node ↔ upsert/delete `BusinessFollow`; `USER` node ↔ accepted `Relationship` only |
| **Domain events** | `place.node.added`, `place.node.updated`, `place.node.removed` |
| **Activity** | Same as domain events |
| **V_Link** | **Defer** `place:node` — low share value |
| **Global Trash** | **Defer** — unfollow = remove |

### 2.3 `BusinessPlaceListing` (Storefront root)

| Field | Value |
|-------|-------|
| **Root authority** | One listing per `businessId` (unique) |
| **Children** | `BusinessInteractionLink[]` |
| **Allowed mutations** | Upsert metadata; publish/unpublish/hide; image URLs; enable flag; auto-unpublish on report threshold (existing controller behavior) |
| **Delete/trash** | **Unpublish ≠ trash.** Trash (2A): soft `trashedAt` on listing; links cascade hide; restore clears trash; permanent delete removes listing + links |
| **Domain events** | `place.listing.created`, `place.listing.updated`, `place.listing.published`, `place.listing.unpublished`, `place.listing.trashed`, `place.listing.restored`, `place.listing.permanently_deleted` |
| **Activity** | Same taxonomy (subset on read-only admin views optional) |
| **V_Link** | **`place:listing`** — Phase 2A |
| **Global Trash** | **Yes** — type `listing` (2A) |

**Visibility gate (public reads):** `isEnabled && isPublished && business.einVerified`.

### 2.4 `PlaceMeetingPlace` (Meeting root)

| Field | Value |
|-------|-------|
| **Root authority** | Meeting row; creator `creatorId` |
| **Children** | `PlaceMeetingInvite[]` |
| **Allowed mutations** | Create, update metadata, RSVP on invites, cancel, complete, link/unlink `eventId` |
| **Delete/trash** | Cancelled meetings soft-trash (2A); hard delete only via permanent delete from trash |
| **Calendar link** | `eventId` set only via `placeMeetingService.linkToCalendar` → **`calendarEventService`** |
| **Domain events** | `place.meeting.created`, `place.meeting.updated`, `place.meeting.invite.sent`, `place.meeting.rsvp.updated`, `place.meeting.confirmed`, `place.meeting.cancelled`, `place.meeting.completed`, `place.meeting.linked_to_calendar`, `place.meeting.unlinked_from_calendar`, `place.meeting.trashed`, `place.meeting.restored`, `place.meeting.permanently_deleted` |
| **Activity** | Same (user-visible subset) |
| **V_Link** | **`place:meeting`** — Phase 2A (participant-scoped) |
| **Global Trash** | **Yes** — type `meeting` (2A) |

**Status enum mapping (existing `MeetingPlaceStatus`):** `PROPOSED` → invited flow; `CONFIRMED` → quorum/RSVP; `CANCELLED` / `COMPLETED` terminal.

### 2.5 `PlaceCommunity` (Community root)

| Field | Value |
|-------|-------|
| **Root authority** | Community row |
| **Children** | `PlaceCommunityMember[]` |
| **Allowed mutations** | Create, join, leave, auto-cluster generation |
| **Delete/trash** | **Phase 1G:** hard delete or archive flag; **Global Trash defer** beyond 2A unless product requires |
| **Domain events** | `place.community.created`, `place.community.member.joined`, `place.community.member.left` |
| **Activity** | Optional low priority |
| **V_Link** | **Defer** `place:community` |
| **Global Trash** | **Defer** |

### 2.6 `PlaceTransaction` (Commerce telemetry root)

| Field | Value |
|-------|-------|
| **Root authority** | Transaction row |
| **Children** | None (`PlaceInteractionClick` is separate aggregate) |
| **Allowed mutations** | **Create only** (+ privacy flag update on own row) |
| **Delete/trash** | **Immutable** — no trash, no delete (audit/commerce) |
| **Domain events** | `place.transaction.recorded`, `place.transaction.completed` (optional) |
| **Activity** | `place.transaction.completed` for owner feed adapter |
| **V_Link** | **No** |
| **Global Trash** | **No** |

### 2.7 `PlaceInteractionClick` (separate aggregate)

| Field | Value |
|-------|-------|
| **Lifecycle** | Append-only click row; may spawn `PlaceTransaction` EXTERNAL_CLICK |
| **Trash** | **Immutable** |
| **Phase** | Defer dedicated service; interim controller OK until 1G |

---

## Part 3 — Lifecycle matrices

### 3.1 Place / Personal Graph

| State | Entry | Exit | Rules |
|-------|-------|------|-------|
| **Not exists** | First `GET /api/place` | Lazy create | Creates `Place` + default `PlaceSettings` |
| **Setup incomplete** | Default `isSetupComplete: false` | `completeSetup` | Onboarding gate in UI |
| **Setup complete** | `completeSetup` | — | Emits `place.setup.completed` |
| **Active** | Default after create | Account deletion | Settings/interests/nodes mutable by owner |

**Settings:** `PlaceSettings` upsert on `updatePlaceSettings` — owner only.  
**Interests:** replace-all delete+create pattern — owner only.

### 3.2 PlaceNode

| State | nodeType | Entry | Exit | Side effects |
|-------|----------|-------|------|--------------|
| **Added** | any | `addNode` | `removeNode` | RT `place:node:added` |
| **Visible** | BUSINESS | follow sync | unfollow | `BusinessFollow` upsert |
| **Visible** | USER | `acceptConnection` | `removeNode` | Both users get mirrored nodes |
| **Visible** | HOUSEHOLD | manual add | remove | Enrich name from Household |
| **Hidden follow** | BUSINESS | `PlaceFollowVisibility.isVisible: false` | toggle | Node remains; visibility overlay |
| **Removed** | any | `removeNode` | — | Hard delete; BUSINESS → delete `BusinessFollow`; RT removed |

**Blocked (defer):** `MEETING_PLACE` node type automation — enum exists; minimal product use today.

**Relationship sync:** `sendConnectionRequest` creates `Relationship PENDING` — **not** a PlaceNode until accept.

### 3.3 BusinessPlaceListing

| State | `isEnabled` | `isPublished` | `trashedAt` | Public visible | Notes |
|-------|-------------|---------------|-------------|----------------|-------|
| **Draft** | false | false | null | No | Admin editing |
| **Published** | true | true | null | Yes (if EIN verified) | Explore/search |
| **Hidden (admin)** | false | * | null | No | Disabled storefront |
| **Unpublished** | true | false | null | No | Keeps listing row |
| **Reported** | * | * | null | Maybe auto-unpublish | `contentReport` threshold → `isPublished: false` |
| **Suspended** | false | false | null | No | Moderation (manual/platform) |
| **Trashed (2A)** | * | false | set | No | Global Trash restore |
| **Permanently deleted (2A)** | — | — | — | No | Row deleted; V_Link lifecycle |

**Publish vs trash vs hide:**

| Action | Semantics |
|--------|-----------|
| **Hide (`isEnabled: false`)** | Admin toggle; reversible without trash |
| **Unpublish (`isPublished: false`)** | Off market; reversible |
| **Trash (2A)** | Soft delete; Global Trash; V_Link archive |
| **Permanent delete** | From trash only; irreversible |

**Interaction links:** CRUD under listing aggregate; hard delete today → trash cascade in 2A.  
**Images:** cover/avatar via `storageService`; clearing URL ≠ trash listing.

### 3.4 PlaceMeetingPlace

| State | `MeetingPlaceStatus` | Calendar `eventId` | Notes |
|-------|---------------------|-------------------|-------|
| **Draft / Proposed** | `PROPOSED` | null | Creator only |
| **Invited** | `PROPOSED` + invites | null | Notifications Phase 1D |
| **Scheduled** | `PROPOSED`/`CONFIRMED` | optional | `scheduledAt` set |
| **Confirmed** | `CONFIRMED` | optional | All invites accepted or creator confirms |
| **Linked to Calendar** | * | **non-null** | Link via calendar service only |
| **Completed** | `COMPLETED` | preserved | Terminal |
| **Cancelled** | `CANCELLED` | unlink policy: keep event, cancel via Calendar service if product requires | Terminal |
| **Trashed (2A)** | `CANCELLED` or terminal | — | Soft trash meeting row |
| **Permanently deleted (2A)** | — | — | From Global Trash |

**Authority split:**

| Concern | Owner |
|---------|-------|
| Social intent, note, location name/address, privacy, RSVP | Place |
| startAt, endAt, timezone, reminders, recurrence, calendar ACL | Calendar `Event` |
| Attendee emails on event | Calendar (when linking creates/updates event) |

### 3.5 PlaceCommunity

| State | Type | Rules |
|-------|------|-------|
| **Created** | `USER_CREATED` | Creator optional admin member |
| **Auto cluster** | `AUTO_CLUSTER` | System-generated; no creator |
| **Active** | | Join/leave |
| **Archived** | | Defer explicit `archivedAt` — Phase 1G |
| **Deleted** | | Hard delete community + members — defer trash |

### 3.6 Transaction / Interaction

| Event | Record | Mutable | Phase |
|-------|--------|---------|-------|
| **Link clicked** | `PlaceInteractionClick` | No | Defer service 1G |
| **External click tx** | `PlaceTransaction` EXTERNAL_CLICK | Privacy flag only | Defer |
| **Purchase routed** | AI help returns URL only | — | 1F read-only |
| **Transaction completed** | `PlaceTransaction` COMPLETED | No | Defer Stripe |
| **Refunded** | `REFUNDED` status | Status transition audit | Future |

**Phase 1 defer:** Keep controller paths; **no certification requirement** until product prioritizes commerce.

---

## Part 4 — Policy Engine action catalog (final)

**Naming convention:** `place:<resource>.<verb>` aligned with `todo:task.read`, `calendar:event.create`.

**New `PolicyResourceType` values (implementation):** extend `policyTypes.ts` with `place_listing`, `place_meeting`, `place_meeting_invite`, `place_node`, `place_community`, `place_transaction`, `relationship` (for connection actions evaluated with Member).

### 4.1 Core graph

| Action | Resource type | Service | Legacy fallback | Min context | On deny | Phase |
|--------|---------------|---------|-----------------|-------------|---------|-------|
| `place:place.read` | `place` | `placeVisibilityService`, `placeService` | Owner `userId === place.userId` | `userId` | 403 / empty | **1B** |
| `place:place.write` | `place` | `placeService` | Owner check | `userId` | 403 | **1B** |
| `place:settings.update` | `place` | `placeService` | Owner check | `userId` | 403 | **1B** |
| `place:setup.complete` | `place` | `placeService` | Owner check | `userId` | 403 | **1B** |
| `place:interests.update` | `place` | `placeService` | Owner check | `userId` | 403 | **1B** |
| `place:followVisibility.update` | `place` | `placeService` | Owner check | `userId` | 403 | **1B** |
| `place:locationPrivacy.update` | `place` | `placeMeetingService` | Owner `userId` | `userId` | 403 | **1D** |

### 4.2 Nodes

| Action | Resource type | Service | Legacy fallback | Min context | On deny | Phase |
|--------|---------------|---------|-----------------|-------------|---------|-------|
| `place:node.read` | `place_node` | `placeVisibilityService` | Owner via place | `userId`, `nodeId` | 404 | **1C** |
| `place:node.create` | `place_node` | `placeService` | Owner place | `userId`, `entityId` | 403 | **1B** |
| `place:node.update` | `place_node` | `placeService` | Owner via node→place | `userId`, `nodeId` | 403 | **1B** |
| `place:node.delete` | `place_node` | `placeService` | Owner via node→place | `userId`, `nodeId` | 403 | **1B** |

### 4.3 Listings

| Action | Resource type | Service | Legacy fallback | Min context | On deny | Phase |
|--------|---------------|---------|-----------------|-------------|---------|-------|
| `place:listing.read` | `place_listing` | `placeVisibilityService` | Public gate or admin member | `businessId` | 404 | **1C** |
| `place:listing.write` | `place_listing` | `placeListingService` | `verifyBusinessAdmin` ADMIN/MANAGER | `userId`, `businessId` | 403 | **1D** |
| `place:listing.publish` | `place_listing` | `placeListingService` | Admin + EIN verified | `businessId` | 403 | **1D** |
| `place:listing.unpublish` | `place_listing` | `placeListingService` | Admin | `businessId` | 403 | **1D** |
| `place:listing.image.update` | `place_listing` | `placeListingService` | Admin | `businessId` | 403 | **1D** |
| `place:listing.interactionLink.write` | `place_listing` | `placeListingService` | Admin | `businessId`, `linkId` | 403 | **1D** |
| `place:listing.report` | `place_listing` | `placeListingService` | Authenticated reporter | `businessId` | 400 | **1D** |
| `place:listing.trash` | `place_listing` | `placeTrashService` | Admin | `businessId` | 403 | **2A** |
| `place:listing.restore` | `place_listing` | `placeTrashService` | Admin | `businessId` | 403 | **2A** |
| `place:listing.permanentlyDelete` | `place_listing` | `placeTrashService` | Admin | `businessId` | 403 | **2A** |

### 4.4 Meetings

| Action | Resource type | Service | Legacy fallback | Min context | On deny | Phase |
|--------|---------------|---------|-----------------|-------------|---------|-------|
| `place:meeting.read` | `place_meeting` | `placeVisibilityService` | Creator or invitee | `meetingId`, `userId` | 404 | **1C** |
| `place:meeting.create` | `place_meeting` | `placeMeetingService` | Authenticated | `userId` | 403 | **1D** |
| `place:meeting.update` | `place_meeting` | `placeMeetingService` | Creator or participant policy | `meetingId` | 403 | **1D** |
| `place:meeting.cancel` | `place_meeting` | `placeMeetingService` | Creator | `meetingId` | 403 | **1D** |
| `place:meeting.rsvp` | `place_meeting_invite` | `placeMeetingService` | Invitee | `inviteId` | 403 | **1D** |
| `place:meeting.linkCalendar` | `place_meeting` | `placeMeetingService` | Participant + calendar write via Calendar PE | `meetingId`, `calendarId` | 403 | **1D** |
| `place:meeting.trash` | `place_meeting` | `placeTrashService` | Creator | `meetingId` | 403 | **2A** |
| `place:meeting.restore` | `place_meeting` | `placeTrashService` | Creator | `meetingId` | 403 | **2A** |
| `place:meeting.permanentlyDelete` | `place_meeting` | `placeTrashService` | Creator | `meetingId` | 403 | **2A** |

### 4.5 Discovery, communities, connections, commerce

| Action | Resource type | Service | Phase |
|--------|---------------|---------|-------|
| `place:discovery.dismiss` | `place` | `placeService` / discovery helper | **1C** |
| `place:discovery.read` | `place` | `placeVisibilityService` | **1C** |
| `place:community.read` | `place_community` | `placeVisibilityService` | **1G** |
| `place:community.write` | `place_community` | `placeCommunityService` | **1G** |
| `place:community.join` | `place_community` | `placeCommunityService` | **1G** |
| `place:community.leave` | `place_community` | `placeCommunityService` | **1G** |
| `place:connection.request` | `relationship` | Member service (target) / interim controller | **1G** |
| `place:connection.accept` | `relationship` | `placeService` + Member | **1E** |
| `place:transaction.read` | `place_transaction` | `placeVisibilityService` | **1G** |
| `place:transaction.record` | `place_transaction` | `placeTransactionService` | **1G** |
| `place:transaction.privacy.update` | `place_transaction` | Owner only | **1G** |

**Dual enforcement:** All mutation services call `placePolicyDual` → `authorize()`; security denies (`NOT_OWNER`, `INSUFFICIENT_ROLE`, `TENANT_MISMATCH`) **block**; `POLICY_NOT_IMPLEMENTED` **logs and allows** during rollout (same as Todo/Notes).

---

## Part 5 — Trash semantics (Wave 2A lock)

| Entity | Soft trash? | Restore? | Permanent delete? | Immutable? | Hard delete today | Global Trash type | Wave |
|--------|-------------|----------|-------------------|------------|-------------------|-------------------|------|
| **BusinessPlaceListing** | **Yes** `trashedAt` | **Yes** | **Yes** (from trash) | No | No | `listing` | **2A** |
| **BusinessInteractionLink** | Cascade hide with listing | Via listing restore | With listing permanent | No | Hard delete link | — (child) | **2A** |
| **PlaceMeetingPlace** | **Yes** | **Yes** | **Yes** | No | Hard delete | `meeting` | **2A** |
| **PlaceNode** | **Defer** | — | Unfollow = remove | No | Hard delete | — | **Post-2A** |
| **PlaceCommunity** | **Defer** | — | Hard delete OK | No | Hard delete | — | **1G+** |
| **PlaceTransaction** | **No** | **No** | **No** | **Yes** | N/A | — | — |
| **PlaceInteractionClick** | **No** | **No** | **No** | **Yes** | N/A | — | — |
| **Place** (root) | **No** | — | Account cascade only | — | — | — | — |
| **PlaceDismissedSuggestion** | **No** | N/A | User can re-dismiss | Preference row | — | — | — |

**Recommendation (locked):** Phase **2A** Global Trash handler supports **`listing`** and **`meeting`** only. Node unfollow remains **hard remove** until product requests recoverable unfollow.

**Unpublish vs trash:** Unpublish is reversible market withdrawal **without** Global Trash. Trash is user/admin recovery path for mistaken deletes.

---

## Part 6 — Platform entities + V_Link

| Entity id | Register? | When | V_Link storage type | Access resolver | Lifecycle on trash/delete | NotebookLink |
|-----------|-----------|------|---------------------|-----------------|---------------------------|--------------|
| **`place:listing`** | **Yes** | Phase **2A** | `PLACE_LISTING` or dedicated enum extension | `placeVlinkAccessService` — published, not trashed, EIN verified; admin always via business | `placeVlinkLifecycleService` archive on trash/unpublish; delete on permanent | Enable **`PLACE_LISTING`** |
| **`place:meeting`** | **Yes** | Phase **2A** | New type e.g. `PLACE_MEETING` | Creator + invitees only; trashed fail-closed | Archive on cancel/trash | Defer notebook target |
| **`place:community`** | **Defer** | Post-L3 | — | — | — | — |
| **`place:node`** | **No** | — | — | — | — | — |

### Notebook `PLACE_LISTING` enablement checklist

All must be true before removing fail-closed in `notebookLinkService`:

1. **`placeVisibilityService.validateAccessibleListingIds(userId, businessIds[])`** — returns only listings user may embed (followed, or public published, or business admin).
2. **`place:listing` platform entity** registered with resolver.
3. **`placeVlinkAccessService`** enforces same rules as Notebook validation.
4. **Integration test:** cross-tenant listing id rejected; unpublished listing rejected; trashed listing rejected.
5. **NotebookLink PE** uses `notebook:link:create` + target visibility (existing pattern).

**Until then:** `PLACE_LISTING` remains **400 fail closed** (constitutional safe default).

---

## Part 7 — Notification matrix

| Type (UI registry) | Valid now | Valid later | UI action | Server source | Recipient | Self-notify | Manifest phase |
|--------------------|-----------|-------------|-----------|---------------|-----------|-------------|----------------|
| `place_connection_request` | **Later** | Phase **1E/1G** | Keep | `placeNotificationService` after Member delegation | Target user | No | **2B** when wired |
| `place_connection_accepted` | **Later** | Phase **1E** | Keep | `placeNotificationService` | Requester | No | **2B** |
| `place_meeting_invite` | **Later** | Phase **1D** | Keep | `placeMeetingService` → notification | Invitee | No | **2B** |
| `place_meeting_rsvp` | **Later** | Phase **1D** | Keep | RSVP handler | Creator | No | **2B** |
| `place_community_invite` | **Defer** | 1G if invites added | Keep or hide until 1G | — | — | — | — |
| `place_listing_reported` | **Later** | Phase **1D** | Add when moderation notify product-ready | Admin/mod queue | Business admins | No | **2B** |
| `place_listing_published` | **Optional** | 1D | Omit from UI until wired | Business admins | No self | **2B** |

**Product claim correction:** Memory bank “notifications integrated” is **false** until Phase 1D+; manifest **`notifications[]`** only lists types actually emitted (Phase 2B).

**Rule:** No notification type in manifest without `placeNotificationService` emit on success path.

---

## Part 8 — Activity + domain events

### 8.1 Decision (locked)

| Model | Verdict |
|-------|---------|
| **Platform module activity** | **Canonical** — `emitModuleActivityEvent` via `placeActivityService` |
| **`PlaceActivityFeedItem` table** | **Deprecated for writes** — no new inserts from mutation services |
| **Feed UI (`/place` Feed tab)** | Phase 1D+: read adapter from module activity **or** legacy rows until migration empty |
| **Dual-write** | **Forbidden** |

Remove/export dead **`recordActivity()`** helper when `placeActivityService` ships.

### 8.2 Module activity taxonomy

| Activity type | When |
|---------------|------|
| `place.node.added` | Node create success |
| `place.node.updated` | Layout/label update |
| `place.node.removed` | Node delete |
| `place.setup.completed` | Setup complete |
| `place.settings.updated` | Settings change |
| `place.listing.published` | Publish transition |
| `place.listing.updated` | Admin upsert (non-publish) |
| `place.listing.unpublished` | Unpublish |
| `place.meeting.created` | Meeting create |
| `place.meeting.rsvp_updated` | RSVP change |
| `place.meeting.confirmed` | Status → CONFIRMED |
| `place.meeting.cancelled` | Cancel |
| `place.meeting.linked_to_calendar` | eventId set |
| `place.connection.accepted` | Relationship accepted + nodes mirrored |
| `place.transaction.completed` | Transaction COMPLETED (when enabled) |

### 8.3 Domain event taxonomy

| Domain event | Subscribers (future) |
|--------------|---------------------|
| `place.node.added` / `removed` | Analytics placeholder |
| `place.listing.published` / `unpublished` | Search index refresh |
| `place.listing.trashed` / `restored` / `permanently_deleted` | V_Link lifecycle |
| `place.meeting.created` / `cancelled` / `linked_to_calendar` | Calendar sync audit |
| `place.transaction.recorded` | Analytics (deferred) |

Domain events emit **only on successful service commit**, same transaction boundary as activity where possible.

---

## Part 9 — Calendar delegation contract

### PlaceMeetingPlace owns

- `creatorId`, invites/RSVP, `locationName`, `locationAddress`, lat/long
- `businessId` (optional venue link to listing)
- `status`, `note`, `isPrivate`, `scheduledAt`, `duration` (coordination hints)
- `eventId` **foreign key only** — not event body

### Calendar Event owns

- `startAt`, `endAt`, `timezone`, recurrence, reminders
- Calendar membership ACL, attendee representation on event
- Event trash/restore/permanent delete lifecycle

### Rules (mandatory for Phase 1D)

| Rule | Enforcement |
|------|-------------|
| **No** `prisma.event.create` in Place code | `placeMeetingService.linkToCalendar` → `calendarEventService.createEvent` |
| **No** `prisma.event.update` in Place | Calendar service for time/title/location changes on linked events |
| **No** `prisma.event.delete` in Place | Cancel meeting → optional `calendarEventService` cancel/trash per product |
| Link existing event | `calendarVisibilityService` / Calendar PE — existing integration test pattern |
| Unlink | Clear `eventId` on meeting only; do not delete event unless user explicitly deletes via Calendar |

### AI boundary for calendar

Place AI may **suggest** linking to Calendar; **must not** create events. User or explicit HTTP confirm triggers `placeMeetingService.linkToCalendar`.

---

## Part 10 — AI boundary (Phase 1F lock)

### Place AI may (read-only v1)

- Recommend listings (`getRecommendations`)
- Suggest interaction links for purchase/reservation help
- Suggest meeting locations (listing metadata + user graph)
- Serve context providers via `placeVisibilityService` bundles

### Place AI must not

- Create/update Todo tasks
- Create/update/delete Calendar events directly
- Upload File Hub files
- Send notifications automatically
- Create `PlaceTransaction` without explicit user HTTP action
- Auto-add `PlaceNode` without user confirm

### Executor scope (1F) — ✅ implemented 2026-06-03

| Surface | Allowed ops |
|---------|-------------|
| `ActionExecutor` / `toolExecutor` | `get_place_context`, `recommend_places`, `purchase_help`, `reservation_help`, `search_places`; tools `search_places`, `get_place_recommendations`, `get_place_purchase_help` |
| HTTP | Same read-only surface via `placeAIController` → `placeAIActionService`; context providers via visibility HTTP routes |

Writes (follow business, create meeting) remain **HTTP user actions** through `placeService` / `placeMeetingService`, not LLM tools.

---

## Part 11 — Reference Module #5 assessment (post-lock)

| Question | Answer |
|----------|--------|
| External graph patterns still unique? | **Yes** — P1 relationship graph + P2 listing layer + P4 discovery + P6 meeting/coordination unchanged by domain lock |
| Still Reference #5 candidate? | **Yes** — orthogonal to Notebook (internal composition) |
| Council requirements | **Level 3 certified** + operation matrix majority **C** + documented P1–P7 patterns + Calendar delegation proven + V_Link/entity live + no dual activity model |
| Blocked by this doc? | **No** — domain lock **unblocks** Phase 1B |

**Not automatic at L3:** Reference #5 requires separate architecture council approval ([REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md)).

---

## Part 12 — Phase 1B implementation scope (unblocked)

| In scope 1B | Out of scope 1B |
|-------------|-----------------|
| `placePermissionService` | Listing writes (1D) |
| `placePolicyDual` + PE actions §4.1–4.2 | Meeting service (1D) |
| `placeService` graph mutations | Trash/V_Link (2A) |
| `placeActivityService` + `placeDomainEventService` for **node** events only | Notifications (1D) |
| `placeRealtimeService` for node events | AI executor (1F) |
| Controller delegate graph paths | ~~Communities, transactions (1G)~~ **1G:** communities service-backed; transactions deferred |
| Unit tests for above | Prisma migration |

---

## Document index

| Part | Topic |
|------|-------|
| §1 | Domain groups |
| §2 | Aggregate roots |
| §3 | Lifecycle matrices |
| §4 | PE action catalog |
| §5 | Trash semantics |
| §6 | Platform entities + V_Link |
| §7 | Notifications |
| §8 | Activity + domain events |
| §9 | Calendar delegation |
| §10 | AI boundary |
| §11 | Reference #5 |
| §12 | Phase 1B scope |

---

*Phase 1E (2026-06-03): Graph node + connection side effects wired; `placeConnectionService` interim; feed read adapter merges platform module activity with legacy `PlaceActivityFeedItem` (read-only); location privacy in `placeMeetingService`. Level 2 candidacy — not certified.*
