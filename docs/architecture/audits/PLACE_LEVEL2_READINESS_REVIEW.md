# Place Level 2 Readiness Review

**Module id:** `place`  
**Date:** 2026-06-03  
**Phase:** **2C** — Level 2 certification preparation & constitutional cleanup  
**Prior audits:** [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md), [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md), [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md) (Wave 2B)  
**Extraction plan:** [PLACE_SERVICE_EXTRACTION_PLAN.md](../PLACE_SERVICE_EXTRACTION_PLAN.md)  
**Benchmarks:** File Hub #1, Chat #2, Calendar #3, Todo #4 — [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)

> **This document prepares Place for formal Level 2 certification review.** It does **not** certify Place at Level 2 or Level 3. It does **not** open Reference Module #5 council review.

---

## Executive summary

Wave **2C** resolves the **P0 findings** from Wave 2B: dual activity ownership, transaction controller Prisma debt, connection Policy Engine gaps, and manifest underclaims. Place is now **eligible for formal Level 2 certification review**.

| Decision | Outcome |
|----------|---------|
| **Wave 2B P0 blockers** | **Resolved** — single activity read model; `placeTransactionService`; connection + transaction PE |
| **Current estimated level** | **Level 2 candidacy** — ready for **formal L2 validation review** |
| **Formal L2 certification** | **Not yet granted** — governance review is the next gate |
| **Formal L3 certification review** | **Not ready to open** |
| **Reference Module #5** | **Candidate** — teaching value present; **not council-ready** |
| **Runtime changes in 2C** | Activity consolidation, transaction service extraction, connection/transaction PE, manifest reconciliation |

**Headline:** Place exits Wave 2C with **no P0 architectural blockers**, **manifest truth** for declared capabilities, **thin controllers on all 8 route handlers**, and **platform module activity as the single feed source of truth on product read paths**.

---

## 1. Wave 2B P0 resolution

| P0 finding (2B) | 2C resolution | Evidence |
|-----------------|---------------|----------|
| Dual activity model (`PlaceActivityFeedItem` + platform merge) | **Resolved** — platform activity only on read/write product paths | `placeVisibilityService.getActivityFeed`, `getPersonalAnalytics`, `exportUserData`; legacy table not read on product paths |
| `placeTransactionController` Prisma bypass | **Resolved** — `placeTransactionService` + thin controller | `placeTransactionService.ts`, `placeTransactionController.ts` (no Prisma) |
| Connection Policy Engine gap | **Resolved** — `place:connection.*` actions + handlers + dual | `POLICY_ACTIONS.PLACE_CONNECTION_*`, `policyEngine.ts`, `placeConnectionService.ts` |
| Manifest notification underclaim | **Resolved** — 4 emitted types in manifest | `builtInModuleManifests.ts` |
| AI action catalog mismatch (`add_node`) | **Resolved** — read-only catalog aligned with executor | `registerBuiltInModules.ts` |

---

## 2. Activity model decision

**Canonical model:** `placeActivityService` → **platform module activity only** (`emitModuleActivityEvent` / `prisma.log` with `operation: module_activity_event`, `module: place`).

| Path | Before 2C | After 2C |
|------|-----------|----------|
| Mutation writes | Platform activity via `placeActivityService` | Unchanged |
| Feed read (`getActivityFeed`) | Dual-read merge with legacy table | **Platform activity adapter only** |
| Personal analytics activity count | Legacy `placeActivityFeedItem` | **`countUserPlatformActivitySince`** |
| GDPR export activity count | Legacy table | Platform log count |
| `placeAnalyticsController.recordActivity` | Dead helper with legacy Prisma | **Removed** |

**Historical compatibility:** `PlaceActivityFeedItem` may remain in schema for migration/audit; it is **not** read or written on product paths. No dual-write. Documented sunset — drop table in a future migration after data audit if needed.

**Verdict:** **Single source of truth** ✅

---

## 3. Transaction extraction decision

**Decision:** Full extraction — **no constitutional exception**.

| Artifact | Role |
|----------|------|
| `placeTransactionService.ts` | create/list/get/update/summary, interaction click + stats |
| `placeTransactionController.ts` | Thin delegation; `respondPlaceServiceError`; **zero Prisma** |
| `placePolicyDual` | `PLACE_TRANSACTION_*`, `PLACE_INTERACTION_*` actions |
| `policyEngine.ts` | Handlers for transaction read/create and interaction telemetry |

Commerce telemetry remains **product-complete but not payment-processor certified** — acceptable for L2; L3 may require explicit commerce boundary doc.

---

## 4. Connection Policy Engine summary

| Operation | PE action | Handler | Service call | Verdict |
|-----------|-----------|---------|--------------|---------|
| Send connection request | `place:connection.request` | `authorizePlaceConnectionRequest` | `placeConnectionService.sendConnectionRequest` | **P→C on PE column** |
| Accept connection | `place:connection.accept` | `authorizePlaceConnectionAccept` | `placeConnectionService.acceptConnection` | **P→C on PE column** |
| Connection visibility (list/read) | `place:connection.read` (via graph/visibility PE) | Existing read handlers | `placeVisibilityService.getConnections` | **P** (read dual) |
| Connection notifications | — | — | `placeNotificationService` | **C** (runtime + manifest) |
| Connection node mirroring | — | — | `placeService` + realtime | **P** (activity partial on some graph paths) |

**Verdict:** Connection **write** paths now meet constitutional PE requirement for L2 validation.

---

## 5. Manifest reconciliation summary

Source: `builtInModuleManifests.ts` + `registerBuiltInModules.ts` vs runtime (post–2C).

| Surface | Manifest | Runtime | Verdict |
|---------|----------|---------|---------|
| `capabilities.trash` | true | `placeTrashService` + Global Trash handler | **C** |
| `capabilities.vlink` | true | Access, lifecycle, resolver, entities | **C** |
| `capabilities.search` | true | Listing search provider | **C** |
| `capabilities.realtime` | true | `placeRealtimeService` | **C** |
| `capabilities.globalActivity` | true | Writes + **platform-only reads** | **C** |
| `capabilities.notifications` | true | 4 server emit types | **C** |
| `capabilities.ai` | true | Read-only HTTP + executor + tools | **C** |
| `capabilities.businessWorkspace` | true | Inline `PlaceListingEditor`; no hub landing | **P** — documented; not L2 blocker |
| `entities[]` | listing, meeting | Platform registry | **C** |
| `notifications[]` | 4 types | All emitted by `placeNotificationService` | **C** |
| AI `actions[]` (registration) | read-only ops | Matches ActionExecutor reject-writes | **C** |

**Intentional non-claims:** community/node/transaction entities; meeting V_Link in Notebook; `place_community_invite` UI type without server emitter (web hygiene deferred).

---

## 6. Workspace alignment

| Check | Status | Classification |
|-------|--------|----------------|
| `PlaceWorkspaceLanding.tsx` | **Absent** | **L3 / Reference #5 enhancement** — not L2 blocker |
| `BusinessWorkspaceContent` `case 'place'` | **Present** — inline `PlaceListingEditor` | Functional publisher surface |
| `BrandedWorkDashboard` icon/name | **Missing** `getModuleIcon` / `getModuleName` for place | **L3 / Reference #5** — module-development hub pattern |
| Personal `/place` UX | **Present** — 5 sub-tabs | Consumer surface complete |

**Recommendation:** Document hub landing as **post-L2 product polish** unless product owner elevates to L2 gate. Current inline editor satisfies business listing administration for L2 constitutional bar.

---

## 7. Updated constitutional scorecard

| Area | 2B | 2C | Evidence |
|------|----|----|----------|
| Canonical services | 🟡 P | 🟢 **C** | 19 services incl. `placeTransactionService` |
| Thin controllers | 🟡 P | 🟢 **C** | 8/8 delegate; contract tests |
| Policy Engine | 🟡 P | 🟡 **P** | Core writes + connections + transactions; location privacy / some reads partial |
| Activity | 🔴 P0 | 🟢 **C** | Platform-only model |
| Domain events | 🟡 P | 🟡 P | Mutations covered; communities/transactions omit |
| Notifications | 🟡 P | 🟢 **C** | Manifest = runtime (4 types) |
| Realtime | 🟢 C | 🟢 C | `placeRealtimeService` |
| AI compliance | 🟢 C | 🟢 C | Read-only twins |
| Platform entities | 🟢 C | 🟢 C | listing + meeting |
| Global Trash | 🟢 C | 🟢 C | Wave 2A |
| V_Link | 🟢 C | 🟢 C | Wave 2A |
| Manifest truth | 🟡 P | 🟢 **C** | Core capabilities aligned |
| Tests | 🟡 P | 🟡 P | 29+ place test files; L3 breadth still growing |
| Hub / workspace landing | 🟡 P | 🟡 P | Documented defer |

**Constitutional posture:** **No P0 blockers.** Majority **P** on operation rows remains expected for L2 candidacy; **C** concentration in trash, V_Link, AI, activity, manifest, controllers.

---

## 8. Updated operation matrix totals

Full matrix: [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md) (2C refresh).

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Graph / settings / interests | 8 | 0 | 8 | 0 |
| Connections | 2 | 0 | 2 | 0 |
| Listings / explore / moderation | 11 | 1 | 10 | 0 |
| Discovery / connections UX | 3 | 0 | 3 | 0 |
| Meetings / calendar / privacy | 6 | 0 | 6 | 0 |
| Communities | 4 | 0 | 3 | 1 |
| Feed / analytics / export | 3 | 1 | 2 | 0 |
| Transactions / clicks | 7 | 0 | 7 | 0 |
| AI | 8 | 3 | 5 | 0 |
| Trash / V_Link / Notebook | 9 | 6 | 3 | 0 |
| UX / workspace | 2 | 0 | 1 | 1 |
| **Total** | **63** | **11** | **50** | **2** |

**Delta from 2B:** +1 C (activity feed read), +4 P (transactions), −5 N (transactions). Remaining **N:** auto-cluster batch, business workspace hub landing.

---

## 9. Remaining debt (non-P0)

| Item | Severity | L2 blocker? | L3 blocker? | Notes |
|------|----------|-------------|-------------|-------|
| Location privacy PE | P1 | No | Yes | `placeMeetingService` ad hoc checks |
| Community activity/notifications | P1 | No | Yes | `placeCommunityService` silent side effects |
| Auto-cluster batch job | P2 | No | Yes | No service/PE |
| `PlaceWorkspaceLanding` + dashboard helpers | P1 | No | Yes | Module-development hub pattern |
| `reservation_help` / `get_place_context` executor-only | P2 | No | Optional | Tool parity gap |
| Legacy `PlaceActivityFeedItem` schema row | P2 | No | Optional | Sunset after audit |
| Commerce/payment boundary doc | P2 | No | Yes | Telemetry extracted; not Stripe-certified |

---

## 10. Level 2 readiness decision

| Criterion | Status |
|-----------|--------|
| No P0 architectural debt | ✅ |
| Canonical services for all route domains | ✅ |
| Thin controllers (zero Prisma in handlers) | ✅ |
| PE on primary writes (graph, listing, meeting, connection, transaction) | ✅ |
| Single activity model on product paths | ✅ |
| Manifest truth for declared capabilities | ✅ |
| Global Trash + V_Link + entities (Wave 2A) | ✅ |
| Test suite with contract coverage | ✅ (not exhaustive) |

**Decision:** Place is **eligible for formal Level 2 certification review**. Recommend opening **L2 validation review** as the next governance gate — **not** L3 certification and **not** Reference #5 council.

---

## 11. Reference Module #5 trajectory

Place remains the **primary Reference Module #5 candidate** with teaching patterns (external graph, discovery, calendar delegation, dual-surface marketplace). Wave 2C strengthens the candidacy by removing P0 debt but **does not** promote catalog status.

| Gate | Status |
|------|--------|
| L3 certification | Not ready — hub landing, community pipeline, majority matrix **C** |
| Council review | Not ready — requires L3 + explicit commerce/hub narrative |
| Teaching value | High — document extraction as pattern guide after L3 |

---

## 12. Recommended next phase

| Phase | Scope |
|-------|-------|
| **Formal L2 certification review** | Architecture sign-off on this document + matrix + spot-check tests |
| **Post-L2 (optional parallel)** | `PlaceWorkspaceLanding`, `BrandedWorkDashboard` helpers, community side effects |
| **L3 prep (later)** | Location privacy PE, community notifications, auto-cluster service, matrix **C** push |
| **Reference #5 council** | After L3 certified — **do not start now** |

---

*Wave 2C readiness review 2026-06-03. Supersedes Wave 2B L2 approaching posture for P0 items only; L3 readiness remains [PLACE_LEVEL3_READINESS_REVIEW.md](./PLACE_LEVEL3_READINESS_REVIEW.md) until L3 review opens.*
