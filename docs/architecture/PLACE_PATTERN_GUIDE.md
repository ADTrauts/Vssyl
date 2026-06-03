# Place Pattern Guide

**Module id:** `place`  
**Status:** Reference prep (Wave 4A — 2026-06-02)  
**Audience:** Module developers, architecture council  
**Authorities:** [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

> **Reference Module #5** — designated Wave 4B council (2026-06-02). This guide is the authoritative pattern source for external graph, directory, and commerce routing modules.

---

## 1. When to copy Place patterns

Copy Place when building modules that:

- Model **external** relationships (people/orgs outside the tenant workspace)
- Publish **discoverable directory** surfaces with verification gates
- **Route** users to external commerce/booking URLs without owning checkout
- Combine **consumer UX** and **publisher admin** on the same domain
- Mirror cross-module entities on a **personal graph** (nodes, not org charts)

**Do not copy Place** for: internal file storage (File Hub), messaging (Chat), scheduling of record (Calendar), work items (Todo), or in-workspace composition (Notebook).

---

## 2. External graph pattern

### 2.1 Personal graph aggregate

| Element | Pattern | Artifacts |
|---------|---------|-----------|
| Root aggregate | One `Place` per user (lazy create) | `placeService`, `placePermissionService` |
| Child nodes | Typed `PlaceNode` (BUSINESS, USER, …) | `addNode` / `removeNode` syncs `BusinessFollow` or mirrors connection |
| Setup gate | `isSetupComplete` before full discovery | `completeSetup` + domain event |
| Interests | User-scoped categories for discovery | `setInterests` + activity + `place.interests.updated` |
| Follow visibility | Per-business public/private follow | `PlaceFollowVisibility` — user-controlled discovery |

**Diff from Todo/Calendar:** Graph is **user-curated market neighborhood**, not assignee/task or time-block model.

**Diff from Notebook:** Notebook links **internal** pages/tasks/events/files; Place nodes reference **external** businesses and people.

### 2.2 Connection lifecycle (Member delegation)

```
sendConnectionRequest → Relationship PENDING (Member domain)
acceptConnection → Relationship ACCEPTED + PlaceNode USER mirror + side effects
```

| Layer | Owner |
|-------|-------|
| Relationship CRUD | Member / `Relationship` (interim in `placeConnectionService`) |
| PlaceNode mirror | Place-owned side effect on accept |
| Notifications / RT | Place (`placeNotificationService`, `placeRealtimeService`) |

**Copy rule:** Cross-module entity ownership stays in source domain; Place emits mirror + fan-out only.

---

## 3. Dual-surface pattern

Place is the only certified module with **two primary product surfaces** on one domain:

| Surface | Routes / entry | Persona | Writes |
|---------|----------------|---------|--------|
| **Consumer** | `/place` — My Place, Explore, Meetings, Feed, Insights | Individual | Graph, connections, meetings, communities, discovery dismiss |
| **Publisher** | `/business/[id]/place`, workspace `case 'place'` | Business admin | Listing, images, interaction links, publish |

| Concern | Consumer | Publisher |
|---------|----------|-----------|
| Scope key | `userId` / personal dashboard | `businessId` + membership |
| PE actions | `place:*`, `place:node.*` | `place:listing.*` |
| Hub component | Place home tabs | `PlaceWorkspaceLanding` + listing editor |
| Visibility | Public explore reads published listings | Admin reads draft + analytics |

**Why unique:** File Hub/Chat/Todo/Calendar are primarily **single-context** (personal or business-scoped, not both as co-equal product surfaces). Business Workspace is **composition shell**, not a data module.

**Implementation checklist:**

1. `[Module]WorkspaceLanding.tsx` for business hub
2. `BusinessWorkspaceContent` switch case
3. `BrandedWorkDashboard` icon + name
4. Separate visibility services or scoped helpers for public vs admin reads

---

## 4. Directory / listing pattern

### 4.1 Storefront aggregate

Root: **`BusinessPlaceListing`** (per business)

| Phase | Operations | Side effects |
|-------|------------|--------------|
| Draft | upsert unpublished | activity + domain + listing RT |
| Publish | `isPublished` flip | additional published event |
| Images | cover/avatar via File Hub storage | same pipeline as upsert |
| Links | CRUD `BusinessInteractionLink` | activity + domain + RT |
| Report | user report | activity + domain (no notify — no moderator type) |
| Trash | Global Trash handler | trash/restore/permanent + V_Link lifecycle |

### 4.2 Verification gates

Explore and search **must** filter:

- `isPublished` + `isEnabled`
- Business `einVerified` (Business domain read)

**Copy rule:** Directory modules gate public discovery on **verification flags** from owning domain — do not duplicate verification logic inside listing service.

---

## 5. Discovery pattern

| Mechanism | Service | Side effects |
|-----------|---------|--------------|
| Local / for-you | `placeVisibilityService` | Read-only; bounded result sets |
| Dismiss suggestion | `placeService.dismissSuggestion` | Idempotent preference — no activity by design |
| Categories | static read | **C** matrix row |
| User search | `searchUsers` | Visibility bounded; wire PE (PL-H1) |
| Federated listing search | search provider | Published listings only |

**Diff from File Hub search:** File Hub searches **owned/shared files**; Place searches **public marketplace directory**.

---

## 6. Commerce routing pattern

See [PLACE_COMMERCE_BOUNDARY.md](./PLACE_COMMERCE_BOUNDARY.md).

| Pattern | Implementation |
|---------|----------------|
| Interaction links | External URL + sort order + active flag |
| Click tracking | `trackInteractionClick` — telemetry only |
| Transaction log | `placeTransactionService` — user history, not AP |
| AI purchase help | Read-only `placeAIActionService` — surfaces links, no checkout |

**Do not copy:** Stripe charge creation in Place services (future Payments module).

---

## 7. Meeting coordination pattern

| Step | Delegate |
|------|----------|
| Create Place meeting | `placeMeetingService` |
| Calendar event | `calendarEventService` + `calendarPolicyDual` on link |
| Invites / RSVP | Place notifications + realtime |
| Location privacy | `PlaceLocationPrivacy` — PE on read/update |

**Diff from Calendar:** Calendar owns **event record**; Place owns **social meeting place** metaphor and external location context.

---

## 8. Community pattern (bounded social)

| Type | Behavior |
|------|----------|
| USER_CREATED | Creator admin; join/leave notifications to creator |
| AUTO_CLUSTER | Shared business follows ≥3 — batch job creates cluster |

**Diff from Chat:** No message persistence; communities are **interest graph**, not channels.

**Product guardrail:** No public vanity metrics; feed is activity-based, not engagement ranking.

---

## 9. Cross-module composition (delegation map)

| Partner | Place uses | Place does not |
|---------|------------|----------------|
| **Calendar** | `linkToCalendar`, event CRUD via service | Own recurrence/reminder cron |
| **File Hub** | `storageService` for listing images | Store vendor contract PDFs as Place entities |
| **Chat** | `chatSocketService.broadcastPlaceEvent` adapter | Persist messages |
| **Todo** | AI may suggest; no task writes in Place executor | Create RFP tasks |
| **Notebook** | `PLACE_LISTING` link validation (partial) | Own page storage |
| **Business** | EIN, membership, `BusinessFollow` | Org chart, HR records |
| **Member** | `Relationship` for connections | Own connection domain long-term |

**Good delegation example:** `placeMeetingService.linkToCalendar` — Calendar certification pipeline preserved (Wave 1D fix).

---

## 10. Platform integration patterns (from References #1–4)

Place **reuses** certified patterns — not novel, but required for council evidence:

| Pattern | Source reference | Place artifact |
|---------|------------------|----------------|
| Global Trash + handler | File Hub #1 | `placeTrashService` |
| V_Link access + lifecycle | File Hub #1 | `placeVlinkAccessService`, `placeVlinkLifecycleService` |
| Realtime adapter | Chat #2 | `placeRealtimeService` |
| Calendar delegation | Calendar #3 | `placeMeetingService.linkToCalendar` |
| Side-effect adapters | Todo #4 | `placeActivityService`, `placeDomainEventService`, `placeNotificationService` |
| Thin controllers | All | 8 place controllers, contract tests |
| AI read-only executor | Chat + Todo | `placeAIActionService`, ActionExecutor |

---

## 11. Service map (canonical boundaries)

| Service | Domain |
|---------|--------|
| `placeService` | Graph, settings, interests, follow visibility, dismiss |
| `placeVisibilityService` | All read/search/discovery/analytics/export/feed |
| `placeListingService` | Listing, links, images, report |
| `placeMeetingService` | Meetings, privacy, calendar link |
| `placeConnectionService` | Connection request/accept (interim) |
| `placeCommunityService` | Communities |
| `placeTransactionService` | Transactions, clicks, stats |
| `placeTrashService` | Global Trash |
| `placeVlinkAccessService` / `placeVlinkLifecycleService` | V_Link |
| `placeAIActionService` | Read-only AI |
| `placePolicyDual` | PE dual wrapper |
| `placePermissionService` | Legacy scope helpers |
| `placeRealtimeService` | Socket adapter |
| `placeActivityService` / `placeDomainEventService` / `placeNotificationService` | Side effects |

---

## 12. Manifest truth (copy checklist)

| Capability | Must be true in runtime |
|------------|-------------------------|
| `trash` | Handler for listing + meeting |
| `vlink` | Resolver + lifecycle |
| `search` | Listing provider registered |
| `realtime` | Adapter events wired |
| `globalActivity` | Platform activity on writes |
| `notifications` | 6 types in manifest |
| `ai` | Read-only paths only |
| `businessWorkspace` | `PlaceWorkspaceLanding` |

---

## Evidence links

- [PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./audits/PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md)
- [PLACE_OPERATION_MATRIX.md](./audits/PLACE_OPERATION_MATRIX.md)
- [PLACE_SERVICE_EXTRACTION_PLAN.md](./PLACE_SERVICE_EXTRACTION_PLAN.md)

---

*Wave 4A pattern guide — governance only, 2026-06-02.*
