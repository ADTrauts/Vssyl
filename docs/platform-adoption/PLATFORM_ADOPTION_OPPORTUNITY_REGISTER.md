# Platform Adoption Opportunity Register

**Program:** Platform Capability Adoption — Phase 0A  
**Date:** 2026-06-25  
**Status:** Prioritized opportunity backlog — **no implementation authorized**

**Legend:** **P0** = user-visible blocker · **P1** = high value · **P2** = meaningful · **P3** = hygiene

---

## 1. Register summary

| Priority | Count | Theme |
|----------|-------|-------|
| **P0** | 4 | Kernel reads, BO search, feed trust |
| **P1** | 12 | Retrieval discovery, graph gaps, dashboard widgets |
| **P2** | 14 | Realtime depth, manifest parity, controller visibility |
| **P3** | 8 | Planned notifications, deprecated paths, hygiene |

**Total opportunities:** 38

---

## 2. P0 — User-visible blockers

| ID | Opportunity | Module(s) | Capability | User impact | Effort | Evidence |
|----|-------------|-----------|------------|-------------|--------|----------|
| **PA-P0-01** | Migrate `activityFeedController` to `platformActivityQueryService` | All | Platform Kernel | Activity Feed shows truth | L | ACT-R1; `PLATFORM_KERNEL_REALITY_ASSESSMENT.md` |
| **PA-P0-02** | Migrate AI context engines off `prisma.activity` | AI, all modules | Platform Kernel + AI Retrieval | Twin remembers what users did | L | `CrossModuleContextEngine`, `DigitalLifeTwinService` |
| **PA-P0-03** | Add HR search provider (employees, time-off, onboarding) | HR | Unified Search | Managers find HR records from omnibar | M | No provider in `searchProviderRegistry.ts` |
| **PA-P0-04** | Add Scheduling search provider (shifts, schedules) | Scheduling | Unified Search | Employees find shifts without opening module | M | Manifest `supportsSearch: false` |

---

## 3. P1 — High-value adoption

| ID | Opportunity | Module(s) | Capability | User impact | Effort |
|----|-------------|-----------|------------|-------------|--------|
| **PA-P1-01** | Wire AI Retrieval to Unified Search delegate (AR-O-07) | Drive, Todo, Calendar, HR, Scheduling | AI Retrieval | AI answers "find…" with live search | L |
| **PA-P1-02** | Add Workforce Comms search provider | Workforce Comms | Unified Search | Find announcements globally | M |
| **PA-P1-03** | Notebook dedicated search provider + manifest `search: true` | Notebook, Notes | Unified Search | Meeting pages in omnibar | M |
| **PA-P1-04** | Register Notebook Context Graph adapter | Notebook | Context Graph | AI sees notebook link edges | M |
| **PA-P1-05** | Create `notesVlinkAccessService` (close CG-F-002) | Notes, Notebook | V_Link + Context Graph | Note permissions consistent | S |
| **PA-P1-06** | Activity Feed widget → kernel-only reads | Activity Feed, Dashboard | Platform Kernel | Home timeline trustworthy | M |
| **PA-P1-07** | Quick Stats widget → analytics capability activity participation | Quick Stats | Activity + AI Retrieval | Stats reflect live workspace | M |
| **PA-P1-08** | HR AI providers → visibility service reads (not direct Prisma) | HR | AI Retrieval | AI respects HR permissions | M |
| **PA-P1-09** | Scheduling AI providers → visibility service reads | Scheduling | AI Retrieval | AI shift answers permission-safe | M |
| **PA-P1-10** | Chat thread nodes in Context Graph | Chat | Context Graph | Thread context in AI graph | M |
| **PA-P1-11** | Personal analytics path off legacy Activity (AN-M2) | Analytics capability | Platform Kernel | Personal insights match feed | M |
| **PA-P1-12** | Platform Controller adoption health card per built-in module | All built-ins | Platform Controller | Operators see adoption gaps | M |

---

## 4. P2 — Meaningful improvements

| ID | Opportunity | Module(s) | Capability | User impact | Effort |
|----|-------------|-----------|------------|-------------|--------|
| **PA-P2-01** | Scheduling realtime on shift mutations | Scheduling | Realtime | Live schedule board updates | M |
| **PA-P2-02** | HR realtime on time-off status changes | HR | Realtime | Managers see requests live | M |
| **PA-P2-03** | Workforce Comms realtime on new announcements | Workforce Comms | Realtime | Front-page updates without refresh | M |
| **PA-P2-04** | Todo realtime depth (match manifest claim) | Todo | Realtime | Task collaborators see changes | S |
| **PA-P2-05** | Notebook manifest capability reconciliation | Notebook | Marketplace Compat. | Manifest honesty | S |
| **PA-P2-06** | Emit planned drive notification types | Drive | Notifications | Folder share/unshare alerts | S |
| **PA-P2-07** | Dashboard widget search participation | Quick Notes, Bookmarks | Unified Search | Search finds quick notes/bookmarks | M |
| **PA-P2-08** | Members module AI context provider | Members | AI Integration | AI knows team structure | M |
| **PA-P2-09** | Business Administration org chart graph adapter | Business Admin | Context Graph | Org structure in AI graph | L |
| **PA-P2-10** | V_Link normalized activity (replace `VLinkActivity` table reads) | V_Link | Platform Kernel | Link actions in feed | M |
| **PA-P2-11** | `notifications_activity` pipeline source wiring (AR catalog) | Notifications, AI | AI Retrieval | AI aware of unread alerts | S |
| **PA-P2-12** | Built-in module marketplace-readiness self-check (manifest validator) | All built-ins | Marketplace Compat. | Manifest drift caught in CI | S |
| **PA-P2-13** | Place meeting entity search support | Place | Unified Search | Find meetings in search | S |
| **PA-P2-14** | Analytics business workspace hub (replace redirect) | Analytics | Biz/Personal scope | Native analytics tab | M |

---

## 5. P3 — Hygiene and deferred

| ID | Opportunity | Module(s) | Capability | Notes |
|----|-------------|-----------|------------|-------|
| **PA-P3-01** | Retire legacy `prisma.activity` writes (if any remain) | Drive | Platform Kernel | FH-6 documented |
| **PA-P3-02** | Merge Notes adoption into Notebook program | Notes | All | Notes disabled in UI |
| **PA-P3-03** | Deprecate or adopt Quick Notes widget | Quick Notes | — | Level E — product decision |
| **PA-P3-04** | Deprecate or adopt Bookmarks widget | Bookmarks | — | Level E — product decision |
| **PA-P3-05** | Workforce reserved notification types — implement or remove from manifest | Workforce Comms | Notifications | `planned: true` entries |
| **PA-P3-06** | Fleet-wide search readiness card (not pilot-only) | Platform Controller | Platform Controller | Phase 1C finding |
| **PA-P3-07** | HR reserved workforce notification types in HR manifest | HR | Notifications | Cross-module manifest hygiene |
| **PA-P3-08** | Document built-in vs partner adoption pattern differences | All | Marketplace Compat. | Prevent partner confusion |

---

## 6. Opportunity by module

| Module | P0 | P1 | P2 | P3 | Top opportunity |
|--------|----|----|----|----|-----------------|
| **Drive** | — | PA-P1-01 | PA-P2-06 | PA-P3-01 | Retrieval search delegate |
| **Chat** | — | PA-P1-10 | — | — | Graph threads |
| **Calendar** | — | PA-P1-01 | — | — | Retrieval delegate |
| **Todo** | — | PA-P1-01 | PA-P2-04 | — | Retrieval delegate |
| **Place** | — | — | PA-P2-13 | — | Meeting search |
| **Notebook** | — | PA-P1-03, 04, 05 | PA-P2-05 | PA-P3-02 | Search + graph |
| **Notes** | — | PA-P1-05 | — | PA-P3-02 | V_Link service |
| **Dashboard** | — | PA-P1-06, 07 | PA-P2-07 | — | Widget adoption |
| **HR** | **PA-P0-03** | PA-P1-08 | PA-P2-02 | PA-P3-07 | **Search provider** |
| **Scheduling** | **PA-P0-04** | PA-P1-09 | PA-P2-01 | — | **Search provider** |
| **Workforce Comms** | — | PA-P1-02 | PA-P2-03 | PA-P3-05 | Search provider |
| **Analytics** | — | PA-P1-11 | PA-P2-14 | — | Kernel read + hub |
| **AI** | PA-P0-02 | PA-P1-01 | PA-P2-11 | — | Kernel reads |
| **Activity Feed** | PA-P0-01 | PA-P1-06 | — | — | Kernel reads |
| **All** | PA-P0-01, 02 | PA-P1-12 | PA-P2-12 | PA-P3-08 | ACT-R1 |

---

## 7. Opportunity by capability (ranked by user value × gap size)

| Rank | Capability | Top opportunities | Modules unlocked |
|------|------------|-------------------|------------------|
| 1 | **Platform Kernel** | PA-P0-01, PA-P0-02, PA-P1-06, PA-P1-11 | All |
| 2 | **Unified Search** | PA-P0-03, PA-P0-04, PA-P1-02, PA-P1-03 | HR, Scheduling, WC, Notebook |
| 3 | **AI Retrieval** | PA-P1-01, PA-P1-08, PA-P1-09 | All query-driven modules |
| 4 | **Context Graph** | PA-P1-04, PA-P1-05, PA-P1-10 | Notebook, Notes, Chat |
| 5 | **Dashboard widgets** | PA-P1-06, PA-P1-07, PA-P2-07 | Dashboard hub |
| 6 | **Realtime** | PA-P2-01, 02, 03, 04 | BO modules, Todo |
| 7 | **Platform Controller** | PA-P1-12, PA-P2-06 | Operator visibility |
| 8 | **Notifications** | PA-P2-06, PA-P3-05, 07 | Manifest hygiene |
| 9 | **V_Link** | PA-P1-05, PA-P2-10 | Notes, V_Link |
| 10 | **Marketplace Compat.** | PA-P2-12, PA-P3-08 | CI manifest gates |

---

## 8. Cross-module value ranking

Opportunities ranked by **business value × AI value × cross-module intelligence × UX ÷ effort**:

| Rank | ID | Rationale |
|------|-----|-----------|
| 1 | PA-P0-01 | Fixes feed for every module at once |
| 2 | PA-P0-03 | HR is daily manager workflow; search is expected |
| 3 | PA-P0-04 | Shift lookup is high-frequency employee action |
| 4 | PA-P1-01 | Unlocks intelligent AI across all searchable modules |
| 5 | PA-P0-02 | AI twin trust — cross-cutting |
| 6 | PA-P1-02 | Workforce comms discovery for entire business |
| 7 | PA-P1-03 | Notebook is meeting hub — search expected |
| 8 | PA-P1-06 | Dashboard is first screen users see |
| 9 | PA-P1-08 | HR AI without permission leaks |
| 10 | PA-P1-12 | Enables ongoing adoption governance |

---

**Last updated:** 2026-06-25
