# Place Level 2 Certification Review

**Module id:** `place`  
**Date:** 2026-06-02  
**Phase:** **2D** — Formal Level 2 certification review (governance only)  
**Prior audits:** [PLACE_LEVEL2_READINESS_REVIEW.md](./PLACE_LEVEL2_READINESS_REVIEW.md) (Wave 2C), [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md), [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md)  
**Extraction plan:** [PLACE_SERVICE_EXTRACTION_PLAN.md](../PLACE_SERVICE_EXTRACTION_PLAN.md)  
**Benchmarks:** File Hub #1, Chat #2, Calendar #3, Todo #4 — [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)  
**Authorities:** [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

> **This document is the formal Level 2 certification gate.** It does **not** certify Place at Level 3. It does **not** open Reference Module #5 council review. **No runtime modernization** was performed in Wave 2D.

---

## Executive summary

Place completed Waves **1B–2C** (service extraction, Global Trash, V_Link, AI read twins, P0 constitutional cleanup). Wave **2D** re-verifies implementation evidence against the **Level 2 — Modernized** bar in [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md): canonical services for primary mutations, Policy Engine on writes, Global Trash, truthful manifest for declared capabilities, and no P0 architectural debt.

| Decision | Outcome |
|----------|---------|
| **Certification** | **Level 2 — Certified** (2026-06-02) |
| **Prior status** | Level 2 candidacy (Wave 2C) |
| **Level 3 certification review** | **Not opened** — not ready |
| **Reference Module #5 council** | **Not opened** — **Strong Candidate** assessment only |
| **Runtime changes in 2D** | **None** — governance review only |

**Headline:** Place satisfies the constitutional requirements for **Level 2 — Certified**. Remaining gaps are **documented P1/P2 partials** appropriate for a modernized module on the path to Level 3 (hub landing, community side-effect pipeline, location privacy PE, matrix **C** density). **No P0 blockers** remain.

---

## 1. Constitutional verification

Reviewed against Platform Standards §3 (mutation contract), §4 (Policy Engine), §7 (Global Trash), §16 (service boundaries), §19 (manifest truth), and §21 (platform entities).

| Area | C / P / N | 🟢 / 🟡 / 🔴 | Evidence | L2 gate |
|------|-----------|--------------|----------|---------|
| **Canonical services** | **C** | 🟢 | 16 `place*Service` files + `placePolicyDual`; all route domains covered incl. `placeTransactionService` | ✅ |
| **Thin controllers** | **C** | 🟢 | 8/8 controllers delegate; **zero** `\bprisma\.` in `server/src/controllers/place*.ts`; contract tests | ✅ |
| **Policy Engine** | **P** | 🟡 | Dual on graph, listing, meeting, trash, connection writes, transaction writes; gaps: location privacy (N), some reads (P) | ✅ — L2 accepts write-path PE + documented read partials |
| **Visibility services** | **C** | 🟢 | `placeVisibilityService` owns explore, profile, search, feed, analytics, export, AI context reads | ✅ |
| **Activity** | **C** | 🟢 | `placeActivityService` → platform module activity only; no legacy feed reads in `server/src` | ✅ |
| **Domain events** | **P** | 🟡 | `placeDomainEventService` on graph, listing, meeting, trash; communities/transactions omit | ✅ — L2 accepts partial event coverage |
| **Notifications** | **C** | 🟢 | `placeNotificationService`; 4 types; manifest aligned | ✅ |
| **Realtime** | **C** | 🟢 | `placeRealtimeService` → Chat socket adapter | ✅ |
| **AI compliance** | **C** | 🟢 | `placeAIActionService`; ActionExecutor + toolExecutor read-only; no controller/Prisma in executor paths | ✅ |
| **Manifest truth** | **C** | 🟢 | trash, vlink, search, realtime, globalActivity, ai, entities, notifications match runtime | ✅ |
| **Global Trash** | **C** | 🟢 | `placeTrashService` + handler (`listing`, `meeting`) | ✅ |
| **V_Link + entities** | **C** | 🟢 | `place:listing`, `place:meeting`; access, lifecycle, resolver; Notebook `PLACE_LISTING` validation | ✅ |
| **Testing coverage** | **P** | 🟡 | **28** `*place*.test.ts` files; contract + unit + 1 calendar-link integration; not exhaustive | ✅ — adequate for L2 |
| **Documentation** | **C** | 🟢 | Constitutional audit, operation matrix, extraction plan, L2 readiness + this review | ✅ |

**P0 violations:** **None.**

**Level 2 constitutional verdict:** Place **meets** the Level 2 modernized bar. Partial (🟡) areas are expected and documented; they do **not** block Level 2 certification.

---

## 2. Operation matrix verification

Source: [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md) (2C totals, verified unchanged in 2D).

### Totals

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| **Total** | **63** | **11** | **50** | **2** |

### P0 operations

| Check | Result |
|-------|--------|
| Dual activity feed | **None** — resolved 2C |
| Controller Prisma on primary paths | **None** — resolved 2C |
| Missing service for routed mutations | **None** — transactions extracted 2C |
| Manifest lies on declared capabilities | **None** — reconciled 2C |

**No remaining P0 operations.**

### Group verification

| Group | Rows | Primary verdict mix | P0? | L2 assessment |
|-------|------|---------------------|-----|---------------|
| Graph / nodes / settings | 8 | 8× **P** | No | Service + PE present; activity/events partial on low-traffic settings |
| Connections | 2 | 2× **P** | No | PE **C** on writes; side-effect pipeline partial |
| Listings / explore | 11 | 1× C, 10× P | No | Core listing writes service-owned |
| Discovery | 3 | 3× **P** | No | Visibility-owned reads |
| Meetings / calendar | 6 | 6× **P** | No | Calendar delegation **C**; location privacy PE gap |
| Communities | 4 | 3× P, 1× **N** | No | Auto-cluster **N** is batch/deferred — not primary mutation path |
| Feed / analytics / export | 3 | 1× C, 2× P | No | Activity feed read **C** post–2C |
| Transactions / clicks | 7 | 7× **P** | No | Service + PE; activity/events not wired (telemetry) |
| AI | 8 | 3× C, 5× P | No | Read paths **C**; context providers partial |
| Trash / V_Link / Notebook | 9 | 6× C, 3× P | No | Wave 2A compliance |
| Workspace / UX | 2 | 1× P, 1× **N** | No | Hub landing **N** — documented L3 gap |

### Remaining P1 operations (L3 prep)

| Operation / area | Gap | Blocker for L2? |
|------------------|-----|-----------------|
| Location privacy handlers | No PE; no activity/events | No |
| Community join/leave/create | No activity, notifications, domain events | No |
| Graph settings / follow visibility | Activity/events partial | No |
| Transaction telemetry | No activity/domain events on clicks/purchases | No |
| Search users (Place) | PE **N** on read | No |
| Business workspace hub | No `PlaceWorkspaceLanding`; dashboard helpers missing | No — inline editor functional |

### Remaining P2 operations

| Operation | Gap |
|-----------|-----|
| Auto-cluster communities | No service layer; controller/batch path |
| AI tool parity | `get_place_context`, `reservation_help` executor-only |
| Legacy `PlaceActivityFeedItem` schema | Orphan table; sunset candidate |

**Matrix verdict for L2:** Majority **P** is **expected** at Level 2. **11 C** rows concentrate in trash, V_Link, AI read, activity feed, categories — sufficient evidence of modernized core paths.

---

## 3. Controller verification

| Controller | Prisma in handler? | Delegates to | Contract test | Verdict |
|------------|-------------------|--------------|---------------|---------|
| `placeController` | No | `placeService`, `placeConnectionService`, visibility | ✅ | **C** |
| `placeListingController` | No | `placeListingService`, visibility | ✅ | **C** |
| `placeMeetingController` | No | `placeMeetingService`, visibility | ✅ | **C** |
| `placeAnalyticsController` | No | `placeVisibilityService` | ✅ | **C** |
| `placeAIController` | No | `placeAIActionService` | ✅ | **C** |
| `placeDiscoveryController` | No | visibility, `placeService` | ✅ | **C** |
| `placeTransactionController` | No | `placeTransactionService` | ✅ Wave 2C | **C** |
| `placeCommunityController` | No | `placeCommunityService` | ✅ | **C** |

**Documented exceptions (non-blocking):**

| Exception | Class | Rationale |
|-----------|-------|-----------|
| Multer + `storageService` in listing controller for image upload | **P2** | Acceptable; bytes handled at HTTP boundary; metadata in `placeListingService` |
| `generateAutoClusters` batch path | **P2** | Deferred satellite; not a primary user mutation route |

**Verdict:** All primary controllers are **thin**. Transaction extraction **verified**.

---

## 4. Manifest verification

Source: `builtInModuleManifests.ts` `case 'place'`.

| Surface | Claim | Runtime | Verdict |
|---------|-------|---------|---------|
| `capabilities.trash` | true | `placeTrashService` + Global Trash handler | **C** |
| `capabilities.vlink` | true | Access, lifecycle, resolver, entities | **C** |
| `capabilities.search` | true | Listing search provider | **C** |
| `capabilities.realtime` | true | `placeRealtimeService` | **C** |
| `capabilities.globalActivity` | true | Platform activity writes + reads | **C** |
| `capabilities.notifications` | true | 4 server emit types | **C** |
| `capabilities.ai` | true | Read-only HTTP + executor + tools | **C** |
| `capabilities.businessWorkspace` | true | Inline `PlaceListingEditor` | **P** — soft overclaim vs hub pattern; functional |
| `entities[]` | listing, meeting | `registerPlacePlatformEntities` | **C** |
| `notifications[]` | 4 types | Matches `placeNotificationService` | **C** |

**Verdict:** Declared capabilities **match runtime**. No false negatives or false positives blocking L2.

---

## 5. AI verification

| Check | Status |
|-------|--------|
| `placeAIActionService` owns AI orchestration | ✅ |
| Grounding via `placeVisibilityService` / search | ✅ |
| 5 module context providers with live routes | ✅ |
| ActionExecutor `place` → `placeAIActionService` only | ✅ |
| toolExecutor: `search_places`, recommendations, purchase help | ✅ |
| Write actions rejected on executor (`add_node`, etc.) | ✅ |
| No `place*Controller` in executor paths | ✅ |
| No direct Prisma in AI execution paths | ✅ |
| `reservation_help` / `get_place_context` in executor but not all tools | 🟡 P2 — document or add tools for L3 |

**Verdict:** `ai: true` is **constitutionally valid** at Level 2 (read-only twins + grounded context).

---

## 6. Activity & event verification

| Check | Status |
|-------|--------|
| Single activity model on product paths | ✅ — no `placeActivityFeedItem` references in `server/src` |
| `placeActivityService` owns mutation emits | ✅ |
| Feed read via platform log adapter only | ✅ |
| No dual-write architecture | ✅ |
| Domain events on graph, listing, meeting, trash mutations | ✅ |
| Domain events on communities, transactions | ❌ omitted — **P1** for L3 |

**Verdict:** Activity model **C** for L2. Domain events **P** — acceptable at Level 2.

---

## 7. Certification decision

### Options considered

| Option | Assessment |
|--------|------------|
| **A. Not Certified** | Rejected — all Wave 2C L2 criteria met; no P0 debt |
| **B. Conditionally Certified** | Rejected — no outstanding L2 gate conditions requiring conditional status; P1 items are L3 prep |
| **C. Level 2 Certified** | **Selected** |

### Rationale

Place meets the [CERTIFICATION_LEDGER](../CERTIFICATION_LEDGER.md) Level 2 definition:

1. **Canonical services** for all primary mutation domains (graph, listing, meeting, connection, transaction, trash, V_Link, AI reads).
2. **Thin controllers** — contract-verified, zero Prisma on route handlers.
3. **Policy Engine** on primary writes including connections and transactions (Wave 2C).
4. **Global Trash** handler + `trashedAt` on listing and meeting (Wave 2A).
5. **Single platform activity model** — no dual-read/write (Wave 2C).
6. **Manifest truth** for declared capabilities (Wave 2C).
7. **Test suite** with contract coverage adequate for L2 validation track.

The **2 N matrix rows** (auto-cluster batch, workspace hub landing) and **50 P rows** do not violate Level 2 — they mirror Todo/Chat pre-L3 posture and are explicitly scoped to L3 / Reference #5 work.

### Formal decision

**Place is certified at Level 2 — Modernized** effective **2026-06-02**.

**Not certified:** Level 3, Reference Module #5.

---

## 8. Reference Module #5 evaluation

**Council review:** **Not opened** (per constraints).

| Dimension | Maturity | Notes |
|-----------|----------|-------|
| External graph | **Strong** | PlaceNode graph, connections, follow visibility, enriched reads |
| Marketplace / listings | **Strong** | Published listings, explore, interaction links, EIN gate, reports |
| Calendar delegation | **Strong** | `placeMeetingService.linkToCalendar` → `calendarEventService` |
| Discovery | **Strong** | Local/for-you, dismiss, federated search |
| Communities | **Emerging** | CRUD + join/leave service; no activity/notifications; auto-cluster **N** |
| Transactions | **Emerging** | Service extracted + PE; telemetry without full activity/event pipeline |
| Workspace experience | **Emerging** | Inline editor works; hub landing + dashboard helpers missing |

| Assessment tier | Verdict |
|-----------------|---------|
| Not Ready | ❌ |
| Emerging Candidate | ❌ — superseded by extraction maturity |
| **Strong Candidate** | ✅ **Selected** |

**Rationale:** Place now combines patterns no single certified module owns (external graph + directory + discovery + listing commerce routing + calendar delegation) with **Level 2 certified** platform compliance. Council remains gated on **Level 3 certification** and hub/commerce narrative — **do not promote** catalog to Reference #5 in this phase.

---

## 9. Remaining debt (post-L2, updated Wave 3B)

| Item | Severity | Status after 3B |
|------|----------|-----------------|
| `PlaceWorkspaceLanding` + `BrandedWorkDashboard` helpers | P1 | ✅ **Resolved 3A** |
| Community activity / domain events / notifications | P1 | ✅ **Resolved 3B** (6 manifest types) |
| Location privacy Policy Engine | P1 | ✅ **Resolved 3A** |
| Graph lifecycle constitutional completeness | P1 | ✅ **Resolved 3B** (interests, node update, follow visibility events) |
| Meeting / listing / connection lifecycle **C** | P1 | ✅ **Resolved 3B** (matrix reconciliation + listing RT) |
| Transaction activity / domain events | P2 | Open — blocks commerce **C** |
| Matrix **C** density (20+ target) | P1 | ✅ **35/63 C**, **0 N** |
| Commerce / payment boundary documentation | P2 | Open — L3 / Reference #5 |
| Legacy `PlaceActivityFeedItem` schema sunset | P2 | Open — hygiene |
| Read-path PE parity (discovery/search) | P2 | Open — soft L3 gap |
| AI tool parity (`reservation_help`, context tool) | P2 | Optional |

---

## 10. Recommended next phase

| Phase | Scope | Do not start |
|-------|-------|--------------|
| **Formal L3 certification review** | `PLACE_LEVEL3_CERTIFICATION_REVIEW.md` after product sign-off | Reference #5 council |
| **Transaction C push** | Activity + domain events on commerce writes | — |
| **Reference #5 council** | After L3 certified + pattern guide | **Not now** |

---

## 11. Wave 3A post-certification prep (2026-06-02)

Governance-only verification of implementation deliverables:

| Focus | Outcome |
|-------|---------|
| Workspace hub | `PlaceWorkspaceLanding.tsx`; `BusinessWorkspaceContent` switch; `BrandedWorkDashboard` uses shared `normalizeModuleId` + `MODULE_ICONS.place` |
| Community side effects | Activity + domain events on create/join/leave/auto-cluster; realtime on join/leave (creator) + auto-cluster members |
| Location privacy PE | `place:locationPrivacy.read` / `update` + `placeMeetingService` dual |
| Matrix | **63** ops — **12 C / 51 P / 0 N** |
| Manifest | `businessWorkspace: true` backed by hub UI |

**L3 certification review:** **Not ready to open** — recommend Wave **3B** readiness refresh before formal L3 gate.

---

## 12. Wave 3B L3 readiness assessment (2026-06-02)

Governance verification of C density push (no formal L3 certification opened):

| Focus | Outcome |
|-------|---------|
| Community notifications | `place_community_member_joined` / `_left` → community creator; manifest 6 types |
| Graph lifecycle | Interests + follow visibility + node layout domain events; PE reconciliation **C** |
| Meeting lifecycle | create/update/cancel/RSVP/calendar rows **C** |
| Listing lifecycle | upsert/images/links/report + `broadcastListingUpdated` **C** |
| Connection lifecycle | request/accept full pipeline **C** |
| Matrix | **63** ops — **35 C / 28 P / 0 N** |
| Manifest | 6 notification types match runtime |

**Formal L3 certification review:** **Level 3 — Certified** (Wave 3C). Reference #5 council **not opened**.

---

## Sign-off record

| Role | Outcome | Date |
|------|---------|------|
| Architecture governance (Wave 2D review) | **Level 2 — Certified** | 2026-06-02 |
| Ledger update | [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md) | 2026-06-02 |

---

*Wave 2D certification review 2026-06-02. Supersedes Level 2 candidacy in [PLACE_LEVEL2_READINESS_REVIEW.md](./PLACE_LEVEL2_READINESS_REVIEW.md) for certification status. L3 posture remains [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md) until L3 prep completes.*
