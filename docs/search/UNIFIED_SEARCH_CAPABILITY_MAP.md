# Unified Search — Capability Map

**Program:** Unified Search Capability — Phase 1A  
**Date:** 2026-06-23  
**Status:** Updated post–Phase 1A  
**Status:** Entity discoverability inventory

---

## 1. Searchability matrix

| Entity type | Searchable | Source module | Method | Permission aware | Global provider |
|-------------|:----------:|---------------|--------|:----------------:|:---------------:|
| **Files** | ✅ | Drive | `searchAccessibleDriveFiles` | ✅ visibility + PE | ✅ `drive` |
| **Folders** | ✅ | Drive | `searchAccessibleDriveFolders` | ✅ | ✅ `drive` |
| **Chat messages** | ✅ | Chat | `searchAccessibleChat` | ✅ participant + PE | ✅ `chat` |
| **Conversations** | ✅ | Chat | same | ✅ | ✅ `chat` |
| **Calendar events** | ✅ | Calendar | `searchEvents` via global provider | ✅ calendar PE | ✅ global |
| **Tasks** | ✅ | Todo | `searchAccessibleTasks` | ✅ todo PE | ✅ global |
| **Note pages** | ✅ | Notes | `searchAccessiblePages` | ✅ notes PE | ✅ global |
| **Calendars** | ⚠️ | Calendar | via event search context | ✅ | ❌ |
| **Notebook links** | ❌ | Notebook | — | — | ❌ |
| **Place listings** | ✅ | Place | `searchListingsForUser` | ✅ publish + PE | ✅ `place` |
| **Place meetings** | ❌ | Place | entity not `supportsSearch` | — | ❌ |
| **Businesses (catalog)** | ✅ | Place | via listing | ✅ | ✅ (as listing) |
| **Users (member)** | ✅ | Platform | member provider / controllers | ✅ org/connection | ✅ `member` |
| **Dashboards** | ✅ | Dashboard | inline Prisma owner | ⚠️ owner only | ✅ `dashboard` |
| **V_Links** | ✅ | Platform | `searchVLinksForUser` | ✅ membership | ✅ `vlink` |
| **Notifications** | ⚠️ | Notifications | inbox `contains` filter | ✅ user scope | ❌ |
| **Activities** | ❌ | Platform Activity | feed not searchable | — | ❌ |
| **Domain events** | ❌ | Domain Events | audit log only | — | ❌ |
| **HR employee profiles** | ❌ | HR | — | — | ❌ |
| **Time-off requests** | ❌ | HR | — | — | ❌ |
| **Scheduling shifts** | ❌ | Scheduling | — | — | ❌ |
| **Workforce broadcasts** | ❌ | Workforce Comms | — | — | ❌ |
| **Org chart nodes** | ❌ | Business Admin | — | — | ❌ |
| **AI memories / learning** | ⚠️ | AI | internal signals | partial | ❌ |
| **Platform entity types** | ⚠️ | Registry | metadata only | N/A | ❌ |
| **Admin users** | ✅ | Admin Portal | operator list filter | ✅ admin role | ❌ (operator) |
| **Admin businesses** | ✅ | Admin Portal | operator filter | ✅ admin role | ❌ |
| **Tags (cross-module)** | ⚠️ | Context Graph | `tagIndexService` | ✅ scoped | ❌ not in global UI |
| **Widgets** | ❌ | Dashboard | — | — | ❌ |
| **Modules (marketplace)** | ⚠️ | Modules page | client filter | N/A | ❌ |

---

## 2. Capability layers map

```
┌──────────────────────────────────────────────────────────────┐
│ USER INTENT: "Find anything in Vssyl"                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Entity Search   │ │ Container Search│ │ Identity Search │
│ (T1 providers)  │ │ V_Link (T2)     │ │ member (T3)     │
│ drive chat place│ │                 │ │ dashboard       │
│ *calendar todo  │ │                 │ │                 │
│ *notes          │ │                 │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
              ┌──────────────────────────┐
              │ Optional derived readers   │
              │ • Tag index (T4)         │
              │ • DE search index (stub) │
              │ • Relationship adapters  │
              └──────────────────────────┘
```

\* = module-capable but **not** in global registry today.

---

## 3. Consumer map

| Consumer | Uses search via | Maturity |
|----------|-----------------|----------|
| End user global bar | `POST /api/search` | L2 partial |
| Drive module UI | Local `DriveSearch` + global | L3/L4 |
| Calendar UI | Module API | L2 |
| Todo UI | List filter | L2 |
| Notebook UI | Notes list filter | L2 |
| AI chat / pipeline | Context providers + grounding | L2 parallel |
| Admin operators | Admin services | L1 operator |
| Business workspace | Inherited global bar | L1 context gap |
| Marketplace modules | Interface only | L0 |

---

## 4. Manifest vs runtime map

| Module | `capabilities.search` | Global provider | Entity `supportsSearch` |
|--------|:---------------------:|:---------------:|:-------------------------:|
| drive | ✅ | ✅ | files/folders |
| chat | ✅ | ✅ | — |
| calendar | ✅ | ✅ | — |
| todo | ✅ | ✅ | — |
| place | ✅ | ✅ | listings |
| notes | ✅ | ✅ | pages |
| notebook | ❌ | ❌ | pages |
| dashboard | ✅ | ✅ | — |
| vlink | ✅ | ✅ | — |
| hr | ❌ | ❌ | false |
| scheduling | ❌ | ❌ | — |
| workforce_comms | ❌ | ❌ | — |

**Drift count:** **0** manifest search modules without providers (Phase 1A).

---

## 5. Deep link contract

All global hits return `SearchResult.url` for navigation. Formats are **module-owned** and **not standardized** across providers (query params vary).

---

**Last updated:** 2026-06-23
