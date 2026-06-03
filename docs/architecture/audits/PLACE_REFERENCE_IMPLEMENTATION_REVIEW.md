# Place Reference Implementation Review

**Module id:** `place`  
**Date:** 2026-06-02  
**Phase:** **4A** — Reference Module #5 preparation (governance only)  
**Certification:** **Level 3 — Certified** (Wave 3C)  
**Prior reviews:** [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md), [PLACE_LEVEL2_CERTIFICATION_REVIEW.md](./PLACE_LEVEL2_CERTIFICATION_REVIEW.md)  
**Companion docs:** [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md)  
**Benchmarks:** Reference Modules #1–4, Notebook (composition) — [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)

> **Governance-only phase.** No runtime code, schema, certification promotion, or Reference #5 assignment. **Council review not opened.**

---

## Executive summary

Place introduces **external graph + dual-surface directory + commerce routing + bounded community** patterns not taught by File Hub, Chat, Calendar, Todo, or Notebook. Level 3 certification (Wave 3C) confirms constitutional maturity on primary write lifecycles. Wave **4A** completes the **evidence package** for a future council session.

| Outcome | Status |
|---------|--------|
| **Reference Module #5 assigned** | **Yes** — Wave 4B council **Approve** |
| **Evidence package** | **Complete** — see [PLACE_REFERENCE_COUNCIL_REVIEW.md](./PLACE_REFERENCE_COUNCIL_REVIEW.md) |
| **Council readiness** | **B. Ready with Conditions** (see §9) |
| **Strongest #5 candidate vs Dashboard / Analytics / Business Workspace** | **Yes — Place** |

---

## Part 1 — Reference module assessment

### 1.1 Unique patterns (not covered by References #1–4 or Notebook)

| Pattern | Description | Teachable value |
|---------|-------------|-----------------|
| **External personal graph** | User-curated Main Street of businesses/people | How to model **market-facing** relationships vs internal workspace data |
| **Dual-surface module** | Consumer `/place` + publisher business workspace | Same domain, two personas, two PE scopes |
| **Directory with verification gates** | Published listing + EIN gate on discovery | Public directory without owning business master data |
| **Commerce routing layer** | Interaction links + click/transaction telemetry | Marketplace **router** without payment/PO/invoice ownership |
| **Connection mirror** | Member `Relationship` + PlaceNode sync on accept | Delegation + side-effect mirror pattern |
| **Bounded community graph** | Interest communities + auto-cluster | Social coordination without Chat message persistence |
| **Meeting-at-place** | Social meeting + Calendar delegation | Location-centric coordination vs Calendar event-of-record |
| **Private follower analytics** | Business insights without public counts | Product principle encoded in architecture |

### 1.2 Shared patterns (correctly reused — not novel)

| Pattern | Copied from | Place implementation |
|---------|-------------|---------------------|
| Global Trash + handler | File Hub #1 | `placeTrashService` |
| V_Link access + lifecycle | File Hub #1 | listing + meeting entities |
| Realtime adapter | Chat #2 | `placeRealtimeService` |
| Side-effect pipeline | Todo #4 | activity / domain / notify / RT services |
| Calendar event CRUD | Calendar #3 | `linkToCalendar` → `calendarEventService` |
| Thin controllers + PE dual | All references | Wave 1B–2C extraction |
| Read-only AI executor | Chat + Todo | `placeAIActionService` |
| Platform entities + manifest | File Hub #1 | `place:listing`, `place:meeting` |

### 1.3 Redundant patterns (would duplicate a reference — Place avoids)

| If Place tried to… | Already taught by | Place stance |
|--------------------|-------------------|--------------|
| Own file/document lifecycle | File Hub #1 | Images only via `storageService` |
| Own messaging | Chat #2 | Realtime transport borrow only |
| Own schedule of record | Calendar #3 | Delegate event CRUD |
| Own task/work items | Todo #4 | AI read-only; no task writes |
| Own in-workspace composition | Notebook | NotebookLink **embeds** Place listing — fail-closed until validated |

### 1.4 Final assessment (Part 1)

**Place teaches materially new architecture** for external-market modules. It **does not duplicate** References #1–4. Notebook is **composition over** certified modules; Place is a **domain module** for the outside graph. **Suitable Reference #5 candidate** on uniqueness grounds.

---

## Part 2 — External graph architecture

Place is the platform's **external relationship graph** — how individuals relate to organizations and people **outside** their Business Workspace.

### 2.1 Personal graph

| Concept | Model / service | Notes |
|---------|-----------------|-------|
| Root | `Place` per user | Lazy create; `isSetupComplete` gate |
| Visual graph | `PlaceNode[]` | BUSINESS / USER types; layout fields |
| Settings | `PlaceSettings` | Low-traffic; activity omitted by design |
| Interests | `PlaceInterest[]` | Discovery input; domain event on update |

**Unlike File Hub:** nodes are **relationships**, not files.  
**Unlike Todo:** no assignee/completion semantics.  
**Unlike Calendar:** not time-indexed.  
**Unlike Notebook:** not page/task composition.

### 2.2 PlaceNode model

| `nodeType` | `entityId` | Sync behavior |
|------------|------------|---------------|
| BUSINESS | `businessId` | Upsert/delete `BusinessFollow` on add/remove |
| USER | connected user id | Created on connection accept (mirror) |

Side effects on add/remove: activity, domain event, realtime (owner socket).

### 2.3 Connections

Interim: `placeConnectionService` writes `Relationship` (Member domain). On accept: mirror USER node + full notification/realtime pipeline.

**Long-term:** Relationship lifecycle may move to Member service; Place retains mirror side effects only (documented in service header).

### 2.4 Discovery

| Surface | Service | Constitutional |
|---------|---------|----------------|
| Explore / profile | `placeVisibilityService` | Read PE partial (PL-H3) |
| Dismiss | `placeService` | Idempotent preference |
| Categories | static | **C** |
| Search listings | search provider | Published + verified only |

### 2.5 Interest systems

`setInterests` replaces category set atomically; emits activity + `place.interests.updated`.

### 2.6 Follow visibility

`PlaceFollowVisibility` — user controls whether a business follow appears in public follower context. Private-by-default product principle.

### 2.7 Communities

`PlaceCommunity` + members; USER_CREATED and AUTO_CLUSTER types. Join/leave notifies creator; auto-cluster realtime to members.

**Not Chat:** no messages, threads, or conversation trash.

### 2.8 Listings on the graph

Business nodes point to **`BusinessPlaceListing`** presentation. Graph membership (follow) ≠ listing publish (admin action).

---

## Part 3 — Marketplace / directory architecture

### 3.1 BusinessPlaceListing lifecycle

| Stage | Flags / state | Side effects |
|-------|---------------|--------------|
| Draft | unpublished | upsert activity + domain + RT |
| Published | `isPublished` + enabled + EIN verified for discovery | published event |
| Hidden | unpublish / disable | updated event |
| Trashed | `trashedAt` | trash service + V_Link restrict |
| Permanent delete | hard delete | unlink V_Links |

### 3.2 Publishing lifecycle

Publisher surface: business ADMIN/MANAGER via `place:listing.*` PE. Consumer surface: read published only through visibility service.

### 3.3 Discovery lifecycle

Verification gate: Business `einVerified` + listing flags. Explore/search providers enforce — Place does not store verification proofs (Business domain).

### 3.4 Reporting lifecycle

`reportListing` → platform moderation (`ContentReport`). Activity + domain; notification deferred (no moderator recipient product path).

### 3.5 Verification lifecycle

Place **consumes** Business verification; does not **perform** vendor qualification. See [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md).

### 3.6 Search lifecycle

Federated provider for published listings; bounded queries; admin get listing separate from public explore.

### 3.7 Why Place owns discovery, listings, marketplace routing

| Owns | Because |
|------|---------|
| Discovery | External graph is meaningless without findability |
| Listings | Storefront is the publisher artifact on Main Street |
| Routing | Product promise is **get user to vendor channel** — links + telemetry |

### 3.8 Why Place does not own contracts, purchasing, invoicing, vendor management

| Does not own | Because |
|--------------|---------|
| Contracts | Legal artifacts → File Hub + Notebook |
| Purchasing / PO | Enterprise workflow → future Vendor/ERP |
| Invoicing | Finance system of record |
| Vendor management | Onboarding, scorecards, spend compliance → HR/Vendor module |

Full boundary: [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md).

---

## Part 4 — Commerce boundary

**Authoritative doc:** [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md)

**Summary for council:**

- Place = **discovery + referrals + routing + interaction links + storefront + meeting coordination**
- Place ≠ **payment processing, PO, invoices, procurement, ERP vendor management**
- `PlaceTransaction` = personal telemetry, not AP ledger
- Transaction rows **P** in matrix (PL-H2) — documented, not scope creep

---

## Part 5 — Dual-surface pattern

| Surface | Entry | Primary writes |
|---------|-------|----------------|
| **Consumer** | `/place` tabs | Graph, connections, meetings, communities, discovery preferences |
| **Publisher** | `/business/.../place`, workspace `place` | Listing CRUD, images, links, publish |

**Unique among Vssyl modules:** co-equal consumer product and business publisher admin on one certified module. Business Workspace is a **shell** that hosts publisher surface — it does not own listing persistence.

**Evidence:** `PlaceWorkspaceLanding.tsx`, `BusinessWorkspaceContent` case `place`, matrix row **C**.

Detail: [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md) §3.

---

## Part 6 — Cross-module composition

| Module | Integration | Ownership boundary | Good delegation example |
|--------|-------------|-------------------|-------------------------|
| **Calendar** | Meeting → event link | Calendar owns `Event` | `calendarEventService` in `linkToCalendar` |
| **Notebook** | `PLACE_LISTING` embed | NotebookLink fail-closed; Place validates listing read | Visibility read before link |
| **File Hub** | Cover/avatar upload | File Hub storage infra | `storageService` in listing service |
| **Todo** | AI suggests tasks (future) | Todo owns tasks | No task writes in Place executor |
| **Chat** | Realtime transport | Chat owns messages | `broadcastPlaceEvent` adapter only |
| **Business Workspace** | Hub switch | Composition only | Landing + editor routing |

**Rule:** Internal work → Notebook + Todo + Calendar. External market subject → Place.

---

## Part 7 — Reference module criteria scoring

Scale: **5** = meets/exceeds reference bar · **3** = acceptable partial · **1** = gap blocks reference teaching

| # | Criterion | Score | Rationale |
|---|-----------|-------|-----------|
| 1 | **Constitutional maturity** | **5** | L3 certified; 35 matrix **C** rows; 0 primary **N**; P0 none |
| 2 | **Service architecture** | **5** | 16+ services; thin controllers; extraction plan complete |
| 3 | **Delegation quality** | **4** | Calendar link fixed; connection interim; Notebook link partial (PL-H7) |
| 4 | **Platform integration** | **4** | Trash, V_Link, entities, manifest, RT, notifications — read PE partial |
| 5 | **Architectural uniqueness** | **5** | External graph + dual-surface + routing — not duplicated elsewhere |
| 6 | **Reusability of patterns** | **5** | Pattern guide §2–8 directly copyable for future Vendor/Market modules |
| 7 | **Documentation quality** | **5** | Full audit pack + L3 review + 4A trilogy (this doc, pattern guide, commerce boundary) |
| 8 | **Long-term strategic importance** | **5** | Main Street metaphor; healthcare external-supplier scenarios; Reference #5 slot |

**Composite:** **38 / 40** — exceeds reference candidacy bar. Deductions: read PE parity (criterion 4) and Notebook/cross-module polish (criterion 3).

---

## Part 8 — Candidate comparison (Reference #5)

| Candidate | Level | Teachable uniqueness | Strategic fit | Verdict |
|-----------|-------|---------------------|---------------|---------|
| **Place** | **3 — Certified** | External graph, dual-surface, commerce routing | High — market-facing product | **Strongest #5** |
| **Dashboard** | 1 — Stabilizing | Widget composition only | Medium — shell not domain | Weak — no novel persistence patterns |
| **Analytics** | 1 — Stabilizing | Derived metrics / subscribers | Medium — read-only pseudo-module | Weak — no mutation contract to teach |
| **Business Workspace** | 1 — Stabilizing | Hub switch, landing pattern | High UX — low architecture | Weak — composition shell, not reference domain |

**Rationale:** Dashboard and Analytics lack certified mutation pipelines and unique entity lifecycles. Business Workspace teaches **hub routing** (already partially in module-development rules) but not a fifth orthogonal domain. **Place** fills the **external market graph** slot References #1–4 and Notebook do not cover.

**Notebook note:** L3 certified composition module — **explicitly not** Reference #5. Does not compete with Place for #5.

---

## Part 9 — Council readiness

### Decision: **B. Ready with Conditions**

Place may schedule a formal **Reference Module #5 Council Review** using **only** the Wave 4A evidence package. Council must **not** use the session to discover undocumented gaps.

### Conditions (accept before council vote)

| ID | Condition | Owner |
|----|-----------|-------|
| RC-1 | Council reads [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md), this review, and [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md) **before** vote | Council chair |
| RC-2 | **Transaction telemetry P** (PL-H2) accepted as **in-scope routing boundary**, not missing ERP — no council blocker for Reference designation | Architecture |
| RC-3 | **Read-path PE partials** (PL-H1, PL-H3) tracked as post-Reference hygiene if designated — not ad-hoc discovery in council | Architecture |
| RC-4 | Council produces **`PLACE_REFERENCE_COUNCIL_REVIEW.md`** (future phase) — **not** created in Wave 4A | Governance |
| RC-5 | **No ledger promotion** to Reference #5 until council vote passes | Governance |

### Not chosen: **A. Not Ready**

Would require missing evidence package or L3 failure. L3 certified; 4A docs complete.

### Not chosen: **C. Ready for Council Review** (unconditional)

Unconditional readiness reserved when runtime partials are closed or explicitly out of council scope with no conditions. Transaction and read PE items require **RC-2/RC-3** acknowledgment.

---

## Remaining gaps before council (documented — not for discovery in session)

| ID | Gap | Blocks council? |
|----|-----|-----------------|
| PL-H1 | `searchUsers` PE dual | No — RC-3 |
| PL-H2 | Transaction activity/events | No — RC-2 |
| PL-H3 | Read PE parity | No — RC-3 |
| PL-H5 | Legacy `PlaceActivityFeedItem` schema sunset | No |
| PL-H7 | Notebook PLACE_LISTING resolver parity | No |
| PL-H8 | Commerce boundary **doc** | **Closed in 4A** |
| — | `PLACE_REFERENCE_COUNCIL_REVIEW.md` | Next phase — RC-4 |

---

## Recommended next phase

| Phase | Scope |
|-------|-------|
| **Wave 4B — Reference Module #5 Council Review** | Create `PLACE_REFERENCE_COUNCIL_REVIEW.md`; council vote; **if approved only** — catalog + ledger Reference #5 promotion |
| **Post-council hygiene** | PL-H1–H3 optional before or after designation |
| **Do not start** | Reference #5 assignment in Wave 4A |

---

## Evidence index (council pre-read)

| Document | Role |
|----------|------|
| [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md) | L3 certification baseline |
| [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md) | Full constitutional inventory + scorecard |
| [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md) | 63 ops — 35 C / 28 P / 0 N |
| [PLACE_SERVICE_EXTRACTION_PLAN.md](../PLACE_SERVICE_EXTRACTION_PLAN.md) | Service map + phase history |
| [PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](../PLACE_PRODUCT_ARCHITECTURE_REVIEW.md) | Product identity + healthcare scenarios |
| [PLACE_DOMAIN_MODEL.md](../PLACE_DOMAIN_MODEL.md) | Aggregates, PE catalog, lifecycles |
| [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md) | Teachable patterns |
| [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md) | Commerce ownership law |
| [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) | Reference #1–4 + candidate row |

---

*Wave 4A Reference Module #5 preparation — governance only, 2026-06-02.*
