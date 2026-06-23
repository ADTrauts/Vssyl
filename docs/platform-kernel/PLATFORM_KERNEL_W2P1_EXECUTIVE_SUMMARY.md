# Platform Kernel W2P1 — Executive Summary

**Program:** Platform Kernel Modernization — Wave 2 Package 1  
**Package:** ACT-R1 Read Migration Charter  
**Date:** 2026-06-22  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Charter complete — **no implementation, no certification, no ledger updates**

---

## Bottom line

Wave 1 identified **ACT-R1** as the highest architectural debt. Wave 2 Package 1 defines the **authoritative read architecture**: a `platformActivityQueryService` over normalized `Log` rows (`module_activity_event`), retiring 8 production legacy readers and eliminating SoR surrogate queries in the global feed.

**Next step (not authorized here):** PK-W3-IMP-1 — implement query service and migrate `activityFeedController`.

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| **1** | How many production activity readers exist? | **12** read sites (8 ACT-R1 violations, 2 compliant, 2 partial) + 3 frontend delegates |
| **2** | Which readers are compliant? | **C-09** Place feed, **C-10** workforce Log count, **C-11** Place export count |
| **3** | Which readers are ACT-R1 violations? | **C-01–C-08** (see migration matrix) |
| **4** | Which reader is highest risk? | **C-01 `activityFeedController`** — daily dashboard feed; 5 data sources including SoR surrogates |
| **5** | Should Platform Activity expose a dedicated query service? | **Yes** |
| **6** | Proposed service name? | **`platformActivityQueryService`** |
| **7** | Required read operations? | `queryActivityFeed`, `queryByTarget`, `queryByActor`, `queryRecentForContext`, `countByModule`, `queryModuleFeed` |
| **8** | Feed ownership model? | Platform owns federated query + global HTTP API + generic DTO mapping; modules own specialized feed type mapping |
| **9** | Should activityFeedController become a thin consumer? | **Yes** — auth, validation, delegate only |
| **10** | Analytics ownership implications? | Analytics **consumes** query API; does not own activity SoR; closes **AN-M2**; metric semantics may shift (honesty correction) |
| **11** | AI ownership implications? | AI **consumes** `queryRecentForContext`; remove `prisma.activity` from CrossModuleContextEngine and DigitalLifeTwinService |
| **12** | Search ownership implications? | **No change in ACT-R1**; future index reads envelopes via platform API — not Activity table or SoR |
| **13** | Expected maturity after ACT-R1 completion? | Platform Activity **L2** (reads); combined kernel **L1–L2** |
| **14** | Earliest certification posture after ACT-R1? | **Platform Activity L2 evaluation candidate** (~75%+ G-score projected); Domain Events L2 remains separate (W2P2) |
| **15** | Recommended next package? | **PK-W3-IMP-1** (query service + feed) **or** governance-only **PK-W2-P2** Domain Events Charter |

---

## Architectural decisions (ratified)

| ID | Decision |
|----|----------|
| **A** | Canonical API = `platformActivityQueryService` (6 operations) |
| **B** | SoT = `Log` / `module_activity_event` for all consumer classes |
| **C** | Legacy retirement phased; no `Activity` schema drop in ACT-R1 |
| **D** | Platform owns reads; modules own presentation mapping |
| **E** | Consumers classified: Platform, Module, Analytics, AI |
| **F** | Notifications use **domain events** — not direct activity consumption |

---

## Consumer summary

| Status | Count | IDs |
|--------|------:|-----|
| ACT-R1 violation | 8 | C-01–C-08 |
| Partial | 2 | C-06, C-07 |
| Compliant | 2 | C-09, C-10 (+ C-11) |
| Legacy write coupling | 1 | C-12 |

---

## Implementation priority (when authorized)

| Priority | Consumer | Operation |
|----------|----------|-----------|
| **P0** | Global feed | `queryActivityFeed` |
| **P0** | Analytics | `queryByActor` |
| **P1** | AI services | `queryRecentForContext` |
| **P1** | Drive APIs | `queryByTarget` / `queryByActor` |
| **P2** | Place / workforce | `queryModuleFeed` / `countByModule` |

---

## Risk highlights

| Risk | Tier |
|------|------|
| Feed regression (C-01) | High |
| Analytics metric shift (AN-M2) | Medium |
| Drive API shape change | Medium |
| Log query performance | Medium |

---

## Deliverables index (W2P1)

| Document | Purpose |
|----------|---------|
| [PLATFORM_ACTIVITY_QUERY_MODEL.md](./PLATFORM_ACTIVITY_QUERY_MODEL.md) | Read architecture + decisions |
| [ACT_R1_MIGRATION_MATRIX.md](./ACT_R1_MIGRATION_MATRIX.md) | Full inventory + migration plan |
| [ACTIVITY_FEED_SOURCE_OF_TRUTH_REVIEW.md](./ACTIVITY_FEED_SOURCE_OF_TRUTH_REVIEW.md) | Feed SoT deep review |
| [ACTIVITY_CONSUMER_AUDIT.md](./ACTIVITY_CONSUMER_AUDIT.md) | Consumer classification + ownership |
| [ACT_R1_MODERNIZATION_PROGRAM.md](./ACT_R1_MODERNIZATION_PROGRAM.md) | Program structure + sequencing |
| This summary | Executive brief |

---

## Stop condition

- W2P1 governance artifacts **complete**
- No code, services, routes, schema changes, migrations, certification, or ledger updates

**Last updated:** 2026-06-22
