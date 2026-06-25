# Platform Adoption Reality Assessment

**Program:** Platform Capability Adoption — Phase 0A  
**Date:** 2026-06-25  
**Status:** Discovery only — **no implementation**

**Authority:** Post-completion of Platform Kernel, Unified Search, AI Retrieval, Context Graph, Marketplace Partner Runtime, and Platform Controller capability programs.

---

## 1. Executive summary

Vssyl's **platform capabilities are certified**; **first-party module participation is not**. The gap is not architectural immaturity — it is **adoption unevenness**.

The certified module core (File Hub, Chat, Calendar, Todo, Place) participates strongly in search, AI context, policy engine, notifications, and V_Link. Business operations modules (HR, Scheduling, Workforce Comms) participate in policy, activity writes, and V_Link but are **invisible in unified discovery surfaces**. Dashboard-hosted widgets (Quick Stats, Quick Notes, Bookmarks, Activity Feed) remain **siloed projections** that users experience as part of the product but that do not participate in platform intelligence.

**Portfolio weighted adoption: 68 / 100.**

The single highest-impact adoption debt is **ACT-R1**: platform readers (activity feed, personal analytics, AI context engines) still query legacy `prisma.activity`, `Message`, `Event`, and `Task` tables instead of the normalized Platform Kernel.

---

## 2. What "platform adoption" means (working definition)

| Term | Definition |
|------|------------|
| **Platform capability** | Cross-cutting infrastructure any module can consume (search, retrieval, graph, kernel, controller) |
| **Platform adoption** | A module's runtime participation in those capabilities — not merely having its own features work |
| **Adoption level** | A–E scale distinct from L1–L4 certification (see scorecard) |
| **User-visible adoption** | Whether a user searching, asking AI, or viewing their feed experiences the module's data |
| **Manifest adoption** | Whether `builtInModuleManifests.ts` honestly declares consumed capabilities |

A module can be **L3 certified** and still be **Level C adoption** if it does not register search providers or its data is excluded from cross-module reads.

---

## 3. Module inventory

### 3.1 Built-in product modules (`BUILT_IN_MODULE_IDS`)

| Module id | Display name | Registry status | Certification (architecture) |
|-----------|--------------|-----------------|------------------------------|
| `drive` | File Hub | Active | **L4 Reference Implementation** |
| `chat` | Chat | Active | **L3** |
| `calendar` | Calendar | Active | **L3** |
| `todo` | To-Do | Active | **L3** |
| `notes` | Notes | Disabled in UI (→ Notebook) | **L2** dependency |
| `notebook` | Notebook | Active | **L3** composition |
| `vlink` | V_Link | Active | Platform substrate |
| `place` | Place | Active | **L3** |
| `dashboard` | Dashboard | Active | **L3 CwF** (composition) |
| `hr` | HR | Active | **L3 CwF** (BO) |
| `scheduling` | Scheduling | Active | **L3 CwF** (BO) |
| `workforce_comms` | Workforce Communications | Active | **L3 CwF** (BO) |

Source: `server/src/constants/builtInModuleIds.ts`, `web/src/runtime/modules/coreModuleRegistry.ts`

### 3.2 Additional production surfaces (discovered)

| Surface | Type | Notes |
|---------|------|-------|
| `analytics` | Business workspace redirect | Consumes Analytics Capability; not a built-in module id |
| `members` | Business admin surface | Identity/membership; `memberSearchProvider` |
| `ai` | Workspace landing | AI Platform consumer; not data SoR |
| `notifications` | Utility module | Delivery + UX reference; event consumer |
| `activityfeed` | Dashboard widget | Cross-module display; legacy reads |
| `quickstats` | Dashboard widget | Analytics capability projection |
| `quicknotes` | Dashboard widget | Local widget storage |
| `bookmarks` | Dashboard widget | Local links |
| Business Workspace shell | Platform shell | Reference Workspace L3; routes child modules |
| Business Administration | Platform capability (#OC) | Org chart, permissions, approvals — not installable module |

### 3.3 Modules explicitly out of inventory

| Item | Reason |
|------|--------|
| `household` | Referenced in legacy scripts only; not in `BUILT_IN_MODULE_IDS` or core registry |
| `admin` | Control plane; `NON_INSTALLABLE_MODULE_IDS` |
| Third-party marketplace modules | Out of scope — partner runtime assessed separately in marketplace docs |

---

## 4. Capability participation reality

### 4.1 Platform Kernel

**Certified capability:** Activity envelope + domain events (L1–L2 hybrid).

| Adoption dimension | Reality |
|--------------------|---------|
| **Write path** | 18 `*ActivityService.ts` files; L3 modules emit on success paths |
| **Read path** | `activityFeedController` merges legacy tables — **ACT-R1** |
| **AI consumers** | `CrossModuleContextEngine`, `DigitalLifeTwinService` read `prisma.activity` |
| **Analytics** | `analyticsCapabilityService` personal path uses legacy Activity (AN-M2) |
| **Best module** | File Hub — 100% normalized writes |
| **Weakest surfaces** | Activity Feed widget, AI debug paths |

### 4.2 Unified Search

**Certified:** L2 CwF (RD-US-001). Nine built-in providers ready.

| Registered | Not registered |
|------------|----------------|
| drive, chat, calendar, todo, notes, place, dashboard, vlink, members (platform) | hr, scheduling, workforce_comms, notebook, analytics, widgets |

Manifest parity test: `assertManifestSearchProviderParity()` enforces manifest `search: true` ↔ provider.

### 4.3 AI Retrieval

**Certified:** L2 CwF (RD-AR-001). Option B Hybrid architecture.

| Adoption state | Detail |
|----------------|--------|
| **Providers** | All 12 built-in modules with AI register context providers |
| **Discovery gap** | AR-O-07/08 — Unified Search delegate and retrieval facade not wired for query-driven find |
| **Quality split** | Drive/Chat/Calendar/Todo use visibility services (**C**); HR/Scheduling use direct Prisma (**P**) |

### 4.4 Context Graph

**Certified:** L4 CwF consumption amendment (RD-CG-L4-001).

| Ready adapters | Partial |
|----------------|---------|
| V_Link, Drive, Calendar, Todo, Place, HR, Scheduling, Workforce Comms | Chat (threads), Notes (CG-F-002), Notebook (no adapter registration), Business Admin |

Tag index: notes + place tag providers registered.

### 4.5 Marketplace Partner Runtime

**Certified:** L3 CwF (2026-06-24).

Built-in modules are **not partner modules** — marketplace compatibility for first-party means:

- Manifest structure would pass certification validator patterns
- Workspace bridge, search delegate, activity ingest probes exist for **partner** modules via Platform Controller
- Built-ins use **compile-time registration** (search registry, V_Link resolvers) — correct for first-party but means no runtime delegate parity test

**Notebook** has the thinnest manifest (missing trash, search, realtime, notifications capability flags).

### 4.6 Platform Controller

**Certified:** Phase 1B–1E consolidation.

| Operator visibility today | Adoption gap |
|---------------------------|--------------|
| Module governance (`/admin-portal/modules`) | No per-module adoption scorecard |
| Platform Programs hub (Search, Context Graph, Marketplace cards) | Fleet-wide search readiness = pilot module only |
| Probes: search-delegate, workspace-bridge, activity-ingest | Built-in modules never probed — assumed compliant |
| AI context tab per module | Shows registration, not adoption depth |

### 4.7 Policy Engine

**Strongest cross-module adoption dimension.**

14 modules/surfaces have dedicated `*PolicyDual` wrappers. Widgets and bookmarks lack module-scoped PE. Business member and org chart policies cover admin surfaces.

### 4.8 Activity System

| Tier | Modules |
|------|---------|
| **Dedicated activity service** | drive (inline), chat, calendar, todo, notes, dashboard, place, hr, scheduling, workforce, org chart, approval, business, analytics capability, account (identity/billing/settings/entitlement), notebook links |
| **Module-local only** | V_Link (`VLinkActivity` table), Place local feed |
| **Display-only / legacy read** | Activity Feed widget |

### 4.9 Notifications

Manifest metadata in `builtInModuleManifests.ts` for all built-in product modules except notebook and vlink. Server emitters verified on L3 paths. **Planned** notification types (drive folder variants, reserved workforce types) declared but not emitted.

Notifications **utility module** is the delivery surface — it consumes domain events; it does not emit module activity.

### 4.10 Realtime

| Full realtime fan-out | Platform refresh only |
|-----------------------|----------------------|
| Drive, Chat, Calendar, Place | Todo (manifest claims; limited), HR, Scheduling, Workforce, Notebook, Dashboard, widgets |

`activity:feed:refresh` is platform-wide but not module-specific realtime.

### 4.11 AI Integration

All built-in modules register in `registerBuiltInModulesOnStartup()` with `ModuleAIContext` including `contextProviders`. Route inventory:

| Module | AI context routes |
|--------|-------------------|
| drive | `/ai/context/recent`, `/storage` |
| chat | `/recent`, `/unread` |
| calendar | `/upcoming`, `/today` |
| todo | 5 routes (overview, upcoming, overdue, priority, priority-analysis) |
| notes | `/recent`, `/pinned` |
| dashboard | `/overview`, `/quick-stats`, `/widgets` |
| place | 5 routes |
| hr | `/overview`, `/headcount`, `/time-off` |
| scheduling | `/overview` (+ team routes) |
| workforce_comms | `/overview`, `/reach` |
| vlink | `/recent` |

AI workspace module is the **orchestration consumer** — adoption is strong as consumer, N/A as data provider.

### 4.12 V_Link

10 modules have `*VlinkAccessService.ts`. Notes uses inline resolver (gap). Notebook uses operational `NotebookLink` edges — not V_Link manifest participation. V_Link module itself is the association substrate.

### 4.13 Business / Personal scope

**Strongest adoption dimension** after Policy Engine. Tenant scoping (`dashboardId`, `businessId`) on SoR paths is consistent on L3+ modules. Business-only modules correctly declare `supportedContexts: ['business']`. Place and V_Link serve dual surfaces.

---

## 5. User-perspective fragmentation map

```
User action                    What they expect              What happens today
─────────────────────────────────────────────────────────────────────────────────
Search "my shift Tuesday"      Find scheduling data          ❌ Not in global search
Search "time off request"      Find HR record                ❌ Not in global search
View Activity Feed             All recent workspace actions  ⚠️ Partial — legacy sources
Ask AI "what did I do today?"  Cross-module summary          ⚠️ Misses normalized-only events
Open Dashboard Quick Notes     Notes in AI/search/graph      ❌ Widget-local only
Business workspace hub         Connected modules             ✅ Routes work; intelligence siloed
```

---

## 6. Adoption vs certification (explicit separation)

| Module | Certification | Adoption level | Divergence reason |
|--------|---------------|----------------|-------------------|
| File Hub | L4 Reference | **A** | Aligned — reference implementation |
| Chat | L3 | **B** | Certified; graph threads + retrieval delegate gaps |
| HR | L3 CwF | **C** | Certified for domain; missing search + kernel reads |
| Dashboard | L3 CwF | **C** | Certified composition; widgets not adopted |
| Bookmarks | None | **E** | No certification path; no platform participation |

**Key insight:** Certification proves a module meets **contract minimums**. Adoption measures **how fully the module uses platform intelligence already built**.

---

## 7. Architectural risks if adoption stalls

| Risk | Impact |
|------|--------|
| **Two truths** | Module UI shows activity AI/feed does not — erodes trust in AI twin |
| **Search blind spots** | Workforce users rebuild search inside each BO module |
| **AI list-only retrieval** | Twin answers "what's overdue" but not "find the document about X" |
| **Operator blindness** | Platform Controller cannot answer "which modules are platform-native?" |
| **Partner confusion** | First-party modules skip delegate patterns partners must implement |

---

## 8. Evidence index

| Artifact | Path |
|----------|------|
| Built-in manifests | `server/src/startup/builtInModuleManifests.ts` |
| Search providers | `server/src/services/search/searchProviderRegistry.ts` |
| Activity services | `server/src/services/*ActivityService.ts` |
| Policy dual wrappers | `server/src/auth/*PolicyDual.ts`, `server/src/services/**/*PolicyDual.ts` |
| Context graph inventory | `docs/context-graph/CONTEXT_GRAPH_ADAPTER_INVENTORY.md` |
| AI retrieval matrix | `docs/ai/retrieval/AI_RETRIEVAL_OPERATION_MATRIX.md` |
| Platform kernel assessment | `docs/platform-kernel/PLATFORM_KERNEL_REALITY_ASSESSMENT.md` |
| File Hub reference | `docs/architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md` |
| Core module registry | `web/src/runtime/modules/coreModuleRegistry.ts` |

---

**Last updated:** 2026-06-25
