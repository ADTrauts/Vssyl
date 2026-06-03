# Place Operation Matrix

**Module id:** `place`  
**Status:** Level **3 — Certified**; **Reference Module #5** (Wave 4B council 2026-06-02).  
**Certification review:** [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md) · **Reference #5:** [PLACE_REFERENCE_COUNCIL_REVIEW.md](./PLACE_REFERENCE_COUNCIL_REVIEW.md)  
**Related:** [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct layer, side effects on success |
| **P** | Partial — works; wrong layer, incomplete pipeline, or documented gap |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `PL` = Place-owned · `Biz` = Business · `Cal` = Calendar #3 · `Mem` = Member · `Chat` = Chat realtime · `FH` = File Hub · `NB` = Notebook

**Primary verdict:** Row-level **C/P/N** in last column — worst material gap on write paths (service + PE + activity for mutations). **—** columns do not block **C**.

---

## Master operation matrix (3B — reconciled)

| Operation | Owner | Service | Controller | PE | Visibility | Activity | Event | Notification | RT | AI | Trash | V_Link | Primary |
| --------- | ----- | ------- | ---------- | -- | ---------- | -------- | ----- | ------------ | -- | -- | ----- | ------ | ------- |
| **Get Place graph** | PL | `placeVisibilityService` | `getPlace` | P | C | — | — | — | — | — | — | — | **P** |
| **Update Place settings** | PL | `placeService` | `updatePlaceSettings` | C | — | — | — | — | — | — | — | — | **P** |
| **Complete setup** | PL | `placeService` | `completeSetup` | C | — | C | C | — | — | — | — | — | **C** |
| **Add node (follow)** | PL | `placeService` | `addNode` | C | — | C | C | — | C | — | — | — | **C** |
| **Update node layout** | PL | `placeService` | `updateNode` | C | C | C | C | — | — | — | — | — | **C** |
| **Remove node (unfollow)** | PL | `placeService` | `removeNode` | C | — | C | C | — | C | — | — | — | **C** |
| **Set interests** | PL | `placeService` | `setInterests` | C | — | C | C | — | — | — | — | — | **C** |
| **Get/update follow visibility** | PL | `placeService` | follow visibility handlers | C | — | C | C | — | — | — | — | — | **C** |
| **Send connection request** | Mem+PL | `placeConnectionService` | `sendConnectionRequest` | C | — | C | C | C | C | — | — | — | **C** |
| **Accept connection** | Mem+PL | `placeConnectionService` | `acceptConnection` | C | — | C | C | C | C | — | — | — | **C** |
| **Explore listings** | PL | `placeVisibilityService` | `explorePlaces` | P | P | — | — | — | — | — | — | — | **P** |
| **Business profile (public)** | PL | `placeVisibilityService` | `getBusinessProfile` | P | P | — | — | — | — | — | — | — | **P** |
| **Get listing (admin)** | PL | `placeVisibilityService` | `getListing` | P | P | — | — | — | — | — | — | — | **P** |
| **Get categories** | PL | `placeVisibilityService` | `getCategories` | — | — | — | — | — | — | — | — | — | **C** |
| **Upsert listing** | PL | `placeListingService` | `upsertListing` | C | — | C | C | — | C | — | — | — | **C** |
| **Upload/delete cover** | PL+FH | `placeListingService` | cover handlers | C | — | C | C | — | C | — | — | — | **C** |
| **Upload/delete avatar** | PL+FH | `placeListingService` | avatar handlers | C | — | C | C | — | C | — | — | — | **C** |
| **CRUD interaction links** | PL | `placeListingService` | link handlers | C | — | C | C | — | C | — | — | — | **C** |
| **Report listing** | PL | `placeListingService` | `reportListing` | C | — | C | C | — | — | — | — | — | **C** |
| **Local / for-you discovery** | PL | `placeVisibilityService` | discovery handlers | P | P | — | — | — | — | — | — | — | **P** |
| **Dismiss suggestion** | PL | `placeService` | `dismissSuggestion` | C | C | — | — | — | — | — | — | — | **P** |
| **List connections** | PL+Mem | `placeVisibilityService` | `getConnections` | P | P | — | — | — | — | — | — | — | **P** |
| **Search users (Place)** | PL | `placeVisibilityService` | `searchUsers` | N | P | — | — | — | — | — | — | — | **P** |
| **Global search listings** | PL | `placeVisibilityService` | `searchController` | P | P | — | — | — | — | — | — | — | **P** |
| **Activity feed read** | PL | `placeVisibilityService` | `getActivityFeed` | P | P | C | — | — | — | — | — | — | **P** |
| **Personal analytics** | PL | `placeVisibilityService` | `getPersonalAnalytics` | P | P | — | — | — | — | — | — | — | **P** |
| **GDPR export** | PL | `placeVisibilityService` | `exportUserData` | P | P | — | — | — | — | — | — | — | **P** |
| **List/get meeting** | PL | `placeVisibilityService` | meeting read handlers | P | P | — | — | — | — | — | — | — | **P** |
| **Create meeting** | PL | `placeMeetingService` | `createMeeting` | C | — | C | C | C | C | — | — | — | **C** |
| **Update meeting** | PL | `placeMeetingService` | `updateMeeting` | C | — | C | C | — | C | — | — | — | **C** |
| **Cancel meeting** | PL | `placeMeetingService` | `deleteMeeting` | C | — | C | C | — | C | — | — | — | **C** |
| **RSVP meeting** | PL | `placeMeetingService` | `rsvpMeeting` | C | — | C | C | C | C | — | — | — | **C** |
| **Link meeting to calendar** | PL+Cal | `placeMeetingService` | `linkToCalendar` | C | C | C | C | — | C | — | — | — | **C** |
| **Location privacy** | PL | `placeMeetingService` | privacy handlers | C | — | — | — | — | — | — | — | — | **C** |
| **List/create/get community** | PL | `placeCommunityService` | community handlers | C | C | C | C | — | — | — | — | — | **C** |
| **Join/leave community** | PL | `placeCommunityService` | join/leave | C | C | C | C | C | C | — | — | — | **C** |
| **Auto-cluster communities** | PL | `placeCommunityService` | `generateAutoClusters` | C | — | C | C | — | C | — | — | — | **C** |
| **List transactions** | PL | `placeTransactionService` | `getTransactions` | P | P | — | — | — | — | — | — | — | **P** |
| **Get/create/update transaction** | PL | `placeTransactionService` | transaction handlers | P | P/N | — | — | — | — | — | — | — | **P** |
| **Transaction summary** | PL | `placeTransactionService` | `getTransactionSummary` | P | P | — | — | — | — | — | — | — | **P** |
| **Track interaction click** | PL | `placeTransactionService` | `trackInteractionClick` | P | — | — | — | — | — | — | — | — | **P** |
| **Interaction stats** | PL | `placeTransactionService` | `getInteractionStats` | P | P | — | — | — | — | — | — | — | **P** |
| **AI recommendations** | PL | `placeAIActionService` | `getAIRecommendations` | — | C | — | — | — | — | C | — | — | **C** |
| **AI purchase help** | PL | `placeAIActionService` | `getPurchaseHelp` | — | C | — | — | — | — | C | — | — | **C** |
| **AI reservation help** | PL | `placeAIActionService` | `getReservationHelp` | — | C | — | — | — | — | C | — | — | **C** |
| **AI context (5 providers)** | PL | visibility / AI | context handlers | P | P | — | — | — | — | P | — | — | **P** |
| **Trash listing** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **Restore listing** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **Permanent delete listing** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **Trash meeting** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **Restore meeting** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **Permanent delete meeting** | PL | `placeTrashService` | Global Trash | C | — | C | C | — | — | — | C | — | **C** |
| **V_Link resolve listing** | PL | `placeVlinkAccessService` | resolver | C | C | — | — | — | — | — | — | C | **C** |
| **V_Link resolve meeting** | PL | `placeVlinkAccessService` | resolver | C | C | — | — | — | — | — | — | C | **C** |
| **Notebook PLACE_LISTING link** | NB+PL | `placeVlinkAccessService` | Notebook API | P | P | — | — | — | — | — | — | P | **P** |
| **Business workspace hub** | PL | `PlaceWorkspaceLanding` | workspace switch | — | C | — | — | — | — | — | — | — | **C** |
| **Place home UX** | PL | — | client | — | P | — | — | — | P | — | — | — | **P** |

---

## Manifest truth rows (3B)

| Surface | Claim | Runtime | Verdict |
|---------|-------|---------|---------|
| `capabilities.trash` | true | `placeTrashService` + handler | **C** |
| `capabilities.vlink` | true | Access + lifecycle + resolver | **C** |
| `capabilities.search` | true | Listing search provider | **C** |
| `capabilities.realtime` | true | `placeRealtimeService` (+ community events) | **C** |
| `capabilities.globalActivity` | true | Platform activity writes + reads | **C** |
| `capabilities.notifications` | true | 6 server types; manifest lists 6 | **C** |
| `capabilities.ai` | true | Read-only HTTP + executor + tools | **C** |
| `capabilities.businessWorkspace` | true | `PlaceWorkspaceLanding` + listing editor | **C** |
| `entities[]` | listing, meeting | Platform registry | **C** |
| `notifications[]` | 6 types | Matches `placeNotificationService` | **C** |

---

## Operation count summary (3B)

| Class | Rows | C | P | N |
|-------|------|---|---|---|
| Graph / settings / interests | 8 | 6 | 2 | 0 |
| Connections | 2 | 2 | 0 | 0 |
| Listings / explore / moderation | 11 | 6 | 5 | 0 |
| Discovery / connections UX | 3 | 0 | 3 | 0 |
| Meetings / calendar / privacy | 6 | 5 | 1 | 0 |
| Communities | 4 | 4 | 0 | 0 |
| Feed / analytics / export | 3 | 0 | 3 | 0 |
| Transactions / clicks | 7 | 0 | 7 | 0 |
| AI | 8 | 3 | 5 | 0 |
| Trash / V_Link / Notebook | 9 | 8 | 1 | 0 |
| UX / workspace | 2 | 1 | 1 | 0 |
| **Total** | **63** | **35** | **28** | **0** |

**3A → 3B delta:** **12 → 35 C** (+23); **51 → 28 P** (−23); **0 N** unchanged.

---

## Remaining P rows — reconciliation (3B)

| Operation | Why P | Requirement for C | Blocks L3? |
|-----------|-------|-------------------|----------|
| **Get Place graph** | Read path; PE dual on graph reads still partial vs write handlers | Dedicated `place:graph.read` PE + visibility audit | No — read path |
| **Update Place settings** | No activity/domain on settings mutation | Add normalized activity + domain event for settings | No — low fan-out |
| **Explore / profile / admin listing / discovery reads** | Visibility + read PE partial | Consolidate read PE; document visibility matrix | No |
| **Dismiss suggestion** | Idempotent preference; no activity by design | Optional preference domain event | No |
| **List connections / global search / analytics / export** | Read-heavy; PE partial on cross-user reads | Read PE handlers + bounded result sets | No |
| **Search users (Place)** | `PLACE_DISCOVERY_READ` PE not fully wired on route | Wire PE on `searchUsers` | **Soft** — discovery surface |
| **Activity feed read** | Feed adapter PE partial | Align feed read with platform activity contract | No |
| **List/get meeting** | Read path PE partial | Meeting read PE consolidation | No |
| **Transactions (7 rows)** | No activity/events on commerce writes | Transaction activity + domain events + optional notifications | **Yes** — commerce lifecycle |
| **AI context providers** | Provider latency / scoping partial | Provider perf + authZ audit per provider | **Soft** — AI exposure |
| **Notebook PLACE_LISTING link** | Cross-module V_Link validation partial | Notebook link resolver parity with listing V_Link | **Soft** — cross-module |
| **Place home UX** | Client-only; realtime partial on graph UX | Client hub parity with workspace landing | No — UX polish |

---

## Certification impact (3C)

| Area | L2 | L3 | Status |
|------|----|----|--------|
| Graph lifecycle writes | ✅ | ✅ | **C** |
| Connection lifecycle | ✅ | ✅ | **C** |
| Meeting lifecycle writes | ✅ | ✅ | **C** |
| Listing lifecycle writes | ✅ | ✅ | **C** |
| Community lifecycle | ✅ | ✅ | **C** |
| Location privacy | ✅ | ✅ | **C** |
| Transaction commerce | ✅ | 🟡 | **P** — post-L3 punch-list PL-H2 |
| Operation matrix **N** rows | — | ✅ | **0** |
| Formal L3 certification | — | ✅ | **[PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md)** |

**L2 certification:** **Certified** (Wave 2D).  
**L3 certification:** **Certified** (Wave 3C).  
**Reference Module #5:** **Designated** (Wave 4B council).

---

*Wave 3C matrix status 2026-06-02. Operation rows unchanged from 3B; certification posture updated.*
