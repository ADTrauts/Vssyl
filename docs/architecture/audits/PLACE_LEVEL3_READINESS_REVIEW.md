# Place Level 3 Readiness Review

**Module id:** `place`  
**Date:** 2026-06-03  
**Phase:** **2B** — Constitutional refresh & certification readiness audit (governance only)  
**Prior audits:** [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md), [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md), [PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](../PLACE_PRODUCT_ARCHITECTURE_REVIEW.md)  
**Extraction plan:** [PLACE_SERVICE_EXTRACTION_PLAN.md](../PLACE_SERVICE_EXTRACTION_PLAN.md)  
**Domain model:** [PLACE_DOMAIN_MODEL.md](../PLACE_DOMAIN_MODEL.md)  
**Benchmarks:** File Hub #1, Chat #2, Calendar #3, Todo #4, Notebook (L3 Certified, non-Reference) — [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)  
**Authorities:** [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

> **This document is a readiness audit only.** It does **not** certify Place at Level 2 or Level 3. It does **not** open Reference Module #5 council review.

---

## Executive summary

Place completed **Wave 1B–1G** (service extraction, AI read twins, communities, connection boundary) and **Wave 2A** (Global Trash, V_Link, platform entities, manifest truth for trash/vlink/entities). Wave **2B** re-audits the **true constitutional state** after those changes.

| Decision | Outcome |
|----------|---------|
| **Current estimated level** | **Level 2 candidacy** (not certified L2 or L3) |
| **Formal L3 certification review** | **Not ready to open** |
| **Formal L2 certification review** | **Approaching** — open after Phase 2C prep (see §10) |
| **Reference Module #5** | **Reference #5 candidate** (teaching value present) — **not ready for council review** |
| **Runtime changes in 2B** | **None** — documentation and audit only |

**Headline:** Place is no longer Level 0. Canonical services, thin controllers (except transactions), Policy Engine on most writes, platform activity/domain events on mutation paths, meeting + connection notifications, realtime via Chat adapter, read-only AI twins, Global Trash, and V_Link for listing/meeting are **real**. Remaining gaps are **documented partials** (dual activity feed, transaction controller, connection PE, hub landing, manifest notification subset) and **deferred commerce** (transactions).

---

## 1. Constitutional audit refresh

Re-evaluated against File Hub / Todo / Calendar bar post–Wave 2A.

| Area | C / P / N | 🟢 / 🟡 / 🔴 | Evidence |
|------|-----------|--------------|----------|
| **Canonical services** | **P** | 🟡 | 18 files under `server/src/services/place/`; **`placeTransactionService` absent** |
| **Thin controllers** | **P** | 🟡 | 7/8 controllers delegate (0 Prisma); **`placeTransactionController` ~18 Prisma calls** |
| **Policy Engine** | **P** | 🟡 | `placePolicyDual` on graph, listing, meeting, trash; **gaps:** connections (N), transactions (N), location privacy (N), some reads (P) |
| **Visibility services** | **C** | 🟢 | `placeVisibilityService` owns explore, profile, search, AI context reads, feed adapter |
| **Activity** | **P** | 🟡 | `placeActivityService` on mutations + trash; **dual model:** legacy `PlaceActivityFeedItem` + platform activity merge on read |
| **Domain events** | **P** | 🟡 | `placeDomainEventService` on graph, listing, meeting, trash; not all read paths; transactions/communities omit |
| **Notifications** | **P** | 🟡 | `placeNotificationService` emits **4 types**; manifest declares **2** |
| **Realtime** | **C** | 🟢 | `placeRealtimeService` → `chatSocketService.broadcastPlaceEvent` (nodes, meetings, connections) |
| **AI compliance** | **C** | 🟢 | `placeAIActionService`; ActionExecutor + toolExecutor read-only; no controller/Prisma in executor paths |
| **Platform entities** | **C** | 🟢 | `place:listing`, `place:meeting` registered; community/node/transaction correctly omitted |
| **Global Trash** | **C** | 🟢 | `placeTrashService` + handler (`listing`, `meeting`); no HTTP Place trash routes (by design) |
| **V_Link** | **C** | 🟢 | Access + lifecycle + resolver + Notebook `PLACE_LISTING` backend validation |
| **Manifest truth** | **P** | 🟡 | trash/vlink/search/realtime/globalActivity/ai/entities **aligned**; notifications **underclaim**; businessWorkspace **overclaim** vs hub pattern |
| **Documentation** | **P** | 🟡 | Wave 0 constitutional audit body stale until 2B refresh; operation matrix had pre-extraction totals |
| **Tests** | **P** | 🟡 | **27** `*place*.test.ts` files; strong unit/contract; 1 calendar-link integration test |

### Constitutional posture (updated)

| Metric | Wave 0 (2026-06-02) | Wave 2B (2026-06-03) |
|--------|---------------------|----------------------|
| Estimated level | Level 0 — Legacy | **Level 2 candidacy** |
| 🔴 blockers | Many | **2 P0 architectural:** dual activity model; transaction controller bypass |
| 🟡 partials | Dominant | Documented; acceptable for L2 validation track with plan |
| 🟢 compliant areas | Few | Visibility, trash, V_Link, AI read twins, core write services |

---

## 2. Operation matrix refresh

Full matrix: [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md) (deduplicated, 2B totals).

### Coverage confirmation

All required operation groups were re-audited:

| Group | Inventoried | Primary service | Notes |
|-------|-------------|-----------------|-------|
| Graph / settings | ✅ | `placeService`, `placeVisibilityService` | `getEnrichedPlaceGraph` |
| Nodes | ✅ | `placeService` | Hard remove unfollow; no node trash (by design) |
| Connections | ✅ | `placeConnectionService` | PE gap; notifications + RT wired |
| Listings / explore | ✅ | `placeVisibilityService`, `placeListingService` | |
| Listing media | ✅ | `placeListingService` + `storageService` | Multer in controller |
| Interaction links | ✅ | `placeListingService` | Hard delete (not trash) |
| Reports | ✅ | `placeListingService` | Moderator notify deferred |
| Discovery | ✅ | `placeVisibilityService`, `placeService` | |
| Meetings / RSVP / calendar | ✅ | `placeMeetingService`, `placeVisibilityService` | Cancel ≠ trash |
| Communities | ✅ | `placeCommunityService` | No activity/notifications |
| Dismiss suggestions | ✅ | `placeService` | |
| Transactions / clicks | ✅ | **`placeTransactionController` only** | Deferred extraction |
| Trash / restore / permanent delete | ✅ | `placeTrashService` | Global Trash only |
| V_Link access | ✅ | `placeVlinkAccessService` | |
| Notebook PLACE_LISTING | ✅ | `assertNotebookListingTargetReadable` | No new UI |
| AI context / recommend / purchase / reservation | ✅ | `placeAIActionService`, visibility | Read-only |

### Updated totals (primary row verdict)

**Method:** Each operation row assigned one primary verdict — **C** if service-owned and mutation pipeline complete (or read-only with visibility); **P** if functional with documented gap; **N** if missing service or pipeline.

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Graph / settings / interests | 8 | 0 | 8 | 0 |
| Connections | 2 | 0 | 2 | 0 |
| Listings / explore / moderation | 11 | 1 | 10 | 0 |
| Discovery / connections UX | 3 | 0 | 3 | 0 |
| Meetings / calendar / privacy | 6 | 0 | 6 | 0 |
| Communities | 4 | 0 | 3 | 1 |
| Feed / analytics / export | 3 | 0 | 3 | 0 |
| Transactions / clicks | 7 | 0 | 2 | 5 |
| AI (HTTP + context + executor) | 8 | 3 | 5 | 0 |
| Trash / V_Link / Notebook | 9 | 6 | 3 | 0 |
| UX / workspace | 2 | 0 | 1 | 1 |
| **Total** | **63** | **10** | **46** | **7** |

**Interpretation:** Majority **P** is expected for a Level 2 candidacy module (PE partial on reads, connection PE gap, deferred commerce). **C** concentration in trash/V_Link/AI read paths matches Wave 2A intent. **N** rows cluster in transactions and auto-cluster batch + hub landing.

---

## 3. Manifest truth audit

Source: `builtInModuleManifests.ts` `case 'place'` vs runtime.

| Capability / surface | Manifest | Runtime | Verdict |
|---------------------|----------|---------|---------|
| `trash` | true | `placeTrashService` + Global Trash handler | **C** |
| `vlink` | true | Access, lifecycle, resolver, entities | **C** |
| `search` | true | `placeSearchProvider` → listing search only | **C** |
| `realtime` | true | `placeRealtimeService` via Chat socket | **C** |
| `globalActivity` | true | `placeActivityService` → `emitModuleActivityEvent` | **C** (writes); read feed dual-model **P** |
| `notifications` | true | 4 server emit types | **P** — manifest lists 2 |
| `ai` | true | 5 context providers + read-only executor/tools | **C** |
| `businessWorkspace` | true | Inline `PlaceListingEditor`; no hub landing | **P** |
| `entities[]` | listing, meeting | `registerPlacePlatformEntities` | **C** |
| `notifications[]` | meeting invite, meeting rsvp | Also emits connection request/accepted | **Underclaim** |

### Findings

| Type | Item | Recommendation |
|------|------|----------------|
| **Underclaim** | `place_connection_request`, `place_connection_accepted` emitted but not in manifest | Add to manifest in Phase 2C or document as intentional subset |
| **Underclaim** | ActionExecutor ops `get_place_context`, `reservation_help` not exposed as tools | Add tools or trim AI context marketing patterns |
| **Overclaim (soft)** | `registerBuiltInModules` AI `actions` includes `add_node` | ActionExecutor rejects — manifest/context should say read-only |
| **Overclaim (soft)** | `businessWorkspace: true` without `PlaceWorkspaceLanding` / dashboard helpers | Hub build or capability footnote |
| **UI drift** | `place_community_invite` in web notifications UI | No server emitter — remove UI type or defer community invites |
| **Missing (intentional)** | community, node, transaction entities | Correct per domain model |

**2B action:** Document findings only. No manifest code change unless product owner chooses notification catalog expansion in 2C.

---

## 4. Controller debt inventory

| Location | Behavior | Class | Rationale |
|----------|----------|-------|-----------|
| `placeTransactionController.ts` | All transaction + click analytics (~18 Prisma) | **P0** | Only fat controller; no PE/activity/events |
| `placeAnalyticsController.recordActivity` | Dead helper; `prisma.placeActivityFeedItem.create` | **P2** | Not routed; deprecated |
| `placeListingController` | Multer + `storageService` for images | **P2** | Acceptable; could move to service |
| `placeCommunityController` → service | No side-effect adapters | **P1** | Product-complete; cert partial |
| All other controllers | Delegate to services | **—** | Resolved Wave 1 |

---

## 5. AI compliance audit

| Check | Status |
|-------|--------|
| `placeAIActionService` owns AI orchestration | ✅ |
| Grounding via `placeVisibilityService` / search | ✅ |
| 5 module context providers registered with live routes | ✅ |
| ActionExecutor `place` → service only; rejects writes | ✅ |
| toolExecutor: `search_places`, `get_place_recommendations`, `get_place_purchase_help` | ✅ |
| No `place*Controller` in executor paths | ✅ |
| No direct Prisma in AI execution paths | ✅ |
| No write-capable AI actions exposed | ✅ |
| `reservation_help`, `get_place_context` in executor but not tools | 🟡 Gap — document or add tools |

**Verdict:** `ai: true` in manifest remains **constitutionally valid** (read-only twins present).

---

## 6. V_Link audit

| Check | Status |
|-------|--------|
| `place:listing` / `place:meeting` platform registration | ✅ |
| `PLACE_LISTING` / `PLACE_MEETING` enum values | ✅ |
| `placeVlinkAccessService` — published+EIN or admin; trashed fail-closed | ✅ |
| `placeVlinkAccessService` — meeting creator/invitee/calendar visibility | ✅ |
| `placeVlinkLifecycleService` — unlink on permanent delete only | ✅ |
| Soft trash does not unlink | ✅ |
| Resolver delegates in `vlinkEntityResolverService` | ✅ |
| Notebook `PLACE_LISTING` backend validation | ✅ |
| V_Link membership never grants content access | ✅ |
| `place:meeting` Notebook link target | Deferred (by design) |
| Community/node/transaction V_Link | Correctly not registered |

**Remaining gaps:** None blocking L2/L3 readiness for declared entities. Meeting notebook links remain a product decision.

---

## 7. Reference Module #5 readiness

Place teaches patterns no single certified module combines:

| Pattern | Teaches? | Evidence |
|---------|----------|----------|
| External relationship graph | ✅ | PlaceNode graph, connections, follow visibility |
| Discovery | ✅ | Local/for-you suggestions, explore, search provider |
| Marketplace / storefront | 🟡 Partial | Listings, interaction links; transactions deferred |
| External interaction lifecycle | 🟡 Partial | Clicks/transactions telemetry in controller; not extracted |
| Calendar delegation | ✅ | `placeMeetingService.linkToCalendar` → `calendarEventService` |
| Dual-surface (consumer + publisher) | 🟡 Partial | Personal Place + business listing editor; hub incomplete |

| Recommendation | Rationale |
|----------------|-----------|
| **Not Ready** | ❌ — too strong; substantial teaching value exists |
| **Level 3 Candidate** | ✅ — architectural posture approaching L3 |
| **Reference #5 Candidate** | ✅ **Selected** — primary catalog candidate with documented commerce/hub gaps |
| **Ready for Council Review** | ❌ — open after L3 cert + hub + transaction story |

**Do not promote Place in ledger or catalog to Reference #5.** Continue as **Reference Module #5 candidate** pending L3 certification and council gate.

---

## 8. Certification readiness decision

### Level 2

| Criterion | Status |
|-----------|--------|
| Canonical services for core domains | 🟡 P — transactions exception |
| Thin controllers | 🟡 P — one exception |
| PE on primary writes | 🟡 P |
| Activity + events on mutations | 🟡 P — dual feed |
| Manifest truth (core capabilities) | 🟢 C |
| Test suite | 🟡 P — 27 files; not exhaustive |

**Decision:** **Approaching L2 certification** — recommend **Phase 2C prep** then formal **L2 validation review** (not started in 2B).

### Level 3

| Criterion | Status |
|-----------|--------|
| Majority operation matrix **C** | ❌ 10/63 C |
| No P0 architectural debt | ❌ dual activity + transactions |
| Hub / workspace module pattern | ❌ |
| Commerce boundary documented + extracted or explicitly out-of-scope | 🟡 Partial defer |
| Reference-grade docs + tests | 🟡 Partial |

**Decision:** **Not ready to open formal Level 3 certification review.**

---

## 9. P0 / P1 / P2 punch-list (post–2B)

| Priority | Item | Blocks |
|----------|------|--------|
| **P0** | Consolidate activity feed to platform activity single read model | L3 |
| **P0** | Extract `placeTransactionService` or formally exclude commerce from cert scope | L2/L3 |
| **P1** | Reconcile manifest `notifications[]` with runtime (4 types) | Manifest truth |
| **P1** | Connection request/accept Policy Engine | L3 polish |
| **P1** | `PlaceWorkspaceLanding` + `BrandedWorkDashboard` place helpers | Module-development + Reference #5 |
| **P1** | Community activity/notifications or manifest/UI trim | Product truth |
| **P2** | Remove dead `recordActivity` helper | Hygiene |
| **P2** | Add AI tools for `reservation_help` / `get_place_context` or trim context | AI parity |
| **P2** | Split `placeVisibilityService` read models | Maintainability |

---

## 10. Recommended next phase

**Phase 2C — L2 certification prep** (suggested scope, not started):

1. Activity feed single-model migration plan + execution  
2. `placeTransactionService` extraction **or** signed commerce-out-of-scope for L2  
3. Manifest notification catalog reconciliation  
4. Business workspace hub (`PlaceWorkspaceLanding`)  
5. Formal **L2 certification review** gate (produce `PLACE_LEVEL2_CERTIFICATION_REVIEW.md` only when approved)

**Do not:** create `PLACE_LEVEL3_CERTIFICATION_REVIEW.md`, update ledger to Certified, or start Reference #5 council in Phase 2C.

---

## 11. Related updates (2B)

| Document | Change |
|----------|--------|
| [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md) | Scorecard + Wave 2B delta |
| [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md) | Deduplicated matrix + 2B totals |
| [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md) | Phase 2B entry; wave tracking |
| [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) | 2B complete; 2C next |
| [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) | Reference #5 candidate posture |
| Memory Bank | `activeContext.md`, `progress.md` |

---

*Wave 2B complete 2026-06-03. Certification not started.*
