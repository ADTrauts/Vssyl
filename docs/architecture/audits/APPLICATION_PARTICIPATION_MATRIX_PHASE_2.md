# Application Participation Matrix — Phase 2

**Program:** Platform Participation Reconciliation  
**Phase:** 2 — Application Participation Matrix & Authority Gap Analysis  
**Date:** 2026-09-08  
**Status:** Non-authoritative architecture reconciliation report — **NOT** an architecture source of truth  
**Depends on:** [`APPLICATION_PARTICIPATION_TRACE_PHASE_1.md`](./APPLICATION_PARTICIPATION_TRACE_PHASE_1.md)  
**Auditor posture:** Decide what existing architecture **means**. No product code, SoT edits, or new subsystem design.

---

## 1. Purpose

Phase 1 established **how** applications participate today (mechanisms, drift, evidence).

Phase 2 answers:

1. What each participation mechanism **owns**
2. Which declaration is **authoritative** for each concern
3. Which differences are **intentional**
4. Which mechanisms are **transitional**
5. Which gaps are **genuine**
6. What, if anything, must eventually be **reconciled**

**Product principle preserved** (Product Definition & Canonical Language Guide Draft 2 still **not in repository**; Phase 1 quoted principle reused):

> Applications own their domain truth, while Vssyl connects their meaning into a shared operational understanding of the person and organization.

Working hypothesis: existing Vssyl architecture needs **reconciliation and semantic clarity**, not another architectural layer (no “Participation Engine,” “Context Fabric,” etc.).

---

## 2. Authority basis

### 2.1 Hierarchy applied

| Priority | Source |
|----------|--------|
| 1 | Repository code / config / migrations / tests |
| 2 | `docs/VSSYL_SOURCE_OF_TRUTH.md` |
| 3 | `ARCHITECTURE_SOURCE_OF_TRUTH.md` topic owners |
| 4 | Constitutional docs (Platform Standards, Search, AI, UX, Policy Engine, …) |
| 5 | Certification / status records |
| 6 | Phase 1 evidence audit (non-authoritative) |
| 7 | Memory Bank / historical audits (intent / archaeology only) |

### 2.2 Product language

- **Still absent in-repo:** VSSYL Product Definition & Canonical Language Guide — Draft 2  
- Phase 2 proceeds using Phase 1 principles + canonical architecture terminology. **Not blocked.**

### 2.3 Git state at Phase 2 start

| Field | Value |
|-------|-------|
| Branch | `main` |
| HEAD | `3feebc09a29c86da2a843b04856c462fa55be444` |
| `origin/main` | same |
| Ahead/behind | 0 / 0 |
| Staged | none |
| Unrelated dirty worktree | left untouched |

### 2.4 Key owners consulted (non-exhaustive)

| Concern | Canonical owner document |
|---------|--------------------------|
| Platform / module contract | `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` |
| Application lifecycle | `APPLICATION_LIFECYCLE.md` |
| Business workspace routing | `WORKSPACE_ROUTING_CONTRACT.md` |
| Workspace runtime | `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` |
| Policy Engine | `POLICY_ENGINE.md` |
| Domain events | `DOMAIN_EVENTS.md` |
| Module activity | Platform Standards §3 + `PLATFORM_ACTIVITY_QUERY_MODEL.md` |
| Global Trash | `GLOBAL_TRASH.md` |
| V_Link | `V_LINK.md` |
| Platform Entity Model | `PLATFORM_ENTITY_MODEL.md` |
| Search | `SEARCH_CONSTITUTION.md` + `SEARCH_PROVIDER_MODEL.md` |
| AI context / actions | `AI_CONTEXT_ASSEMBLY.md`, `AI_CONTEXT_PROVIDER_API.md`, `AI_EXECUTION_ARCHITECTURE.md` |
| Notifications | `NOTIFICATION_METADATA_GUIDE.md` |
| Dashboard widgets | `PERSONAL_DASHBOARD_WIDGET_CONTRACT.md` |
| Analytics | `ANALYTICS_STATUS_RECORD.md` + `ANALYTICS_OWNERSHIP_MODEL.md` |
| Third-party pipeline | `THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md` |
| Partner capability cert | `MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md` |
| Module interop checklist | `memory-bank/moduleSpecs.md` (certification; not architecture law) |
| Realtime | ⚠️ SoT matrix: **TBD gap** |

Phase 1 was **not** modified.

---

## 3. Executive conclusion

Vssyl already has a **coherent participation model** for first-party applications: domain SoR in the application; shared meaning via SearchProviders, AI ContextProviders/actions, V_Link resolvers, domain events, module activity, notifications, Global Trash, and Dashboard projections. Partner modules participate through a **different technical contract** (JWT HTTPS delegates + sandboxed host) that realizes the **same product idea** for Search / workspace / activity.

Most “duplication” is **not a defect**: workspace contracts describe mount metadata while the switch still renders; Policy Engine dual-enforcement is documented migration; Analytics intentionally remains domain-owned + platform rollup without a Search-like provider; Dashboard widgets are formal **projections**, not contribution registries.

What needs reconciliation is primarily **declaration semantics and composition**:

- Backend manifest capabilities are the **de-facto authoring / certification** authority; frontend capability arrays are unused for gating and drift.
- Platform Entity `supportsSearch` is **not** the Unified Search inclusion gate (SearchProvider readiness is); Scheduling’s registry flag is stale metadata relative to a live provider.
- `capabilities.realtime` means **certified module realtime participation**, not “any socket traffic exists” (Scheduling intentionally omits the claim).
- Several **live-looking docs** lag code (Scheduling operation matrix; V_Link integration table rows).

**No new subsystem is justified.** Prefer extending Platform Standards / Module Contract semantics and publishing a composition reference, then documenting stale audits, then targeted representation sync—after a small set of product decisions.

---

## 4. Canonical authority matrix

Authority statuses: `CANONICAL_SINGLE` | `CANONICAL_WITH_PROJECTIONS` | `INTENTIONAL_PARALLEL` | `TRANSITIONAL_PARALLEL` | `DRIFT` | `UNRESOLVED` | `MISSING`.

| # | Concern | Canonical architecture owner | Current implementation owner | Declaration source(s) | Runtime consumer(s) | Multi-declaration? | Same purpose? | Authority status | Migration / transitional | Evidence |
|---|---------|------------------------------|------------------------------|----------------------|---------------------|--------------------|---------------|------------------|--------------------------|----------|
| 1 | Application identity | `APPLICATION_LIFECYCLE.md` + Platform Standards | Built-in ids + `Module` rows | `builtInModuleIds` / `BUILT_IN_MODULE_DEFINITIONS` / seeds / Prisma `Module` | Install, scope, nav | Yes (seed vs bootstrap names) | Mostly yes | **CANONICAL_WITH_PROJECTIONS** | Naming cleanup transitional | Phase 1 §5–7A; bootstrap “Drive” vs File Hub |
| 2 | Module lifecycle / installability | `APPLICATION_LIFECYCLE.md` | Lifecycle helpers + install/subscription services | `applicationLifecycle` types; Module install rows | Application Manager, marketplace install | Yes (lifecycle vs marketplace) | Related but layered | **CANONICAL_SINGLE** | Marketplace continues on lifecycle | SoT Applications & Marketplace |
| 3 | Capability declaration | Platform Standards §19 + Pattern 14 | `buildBuiltInModuleManifest` → `Module.manifest` | BE boolean object; FE string[]; DB JSON | Cert, readiness, adoption; FE **unused for gating** | Yes | Intended same; FE not projected | **TRANSITIONAL_PARALLEL** | Documented `resolveModuleCapabilities()` **missing** | Standards L493–518; Pattern 14; Phase 2 investigation |
| 4 | Frontend presentation metadata | Workspace runtime + module registry | `coreModuleRegistry` | Icons, names, routes, widgets[] | Shell, drift tests | Yes (`config/modules.ts` legacy) | Partially | **CANONICAL_WITH_PROJECTIONS** | Legacy config transitional | `WORKSPACE_RUNTIME…`; registry drift tests |
| 5 | Frontend mounting / runtime resolution | `WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md` | `BusinessWorkspaceContent` switch + App Router children | Contracts describe; switch/pages execute | Business workspace UI | Yes | **Different roles** (metadata vs render) | **INTENTIONAL_PARALLEL** (until migration) | Explicit: switch remains authoritative | Runtime doc header; `workspace-runtime.mdc` |
| 6 | Business workspace participation | `WORKSPACE_ROUTING_CONTRACT.md` | Contracts + navigation resolvers + switch | `businessWorkspaceContracts.ts` | Nav, CI drift, mount | Yes | Metadata vs mount split intentional | **CANONICAL_WITH_PROJECTIONS** | Migration to registry-driven render not done | Routing contract Wave 1D |
| 7 | Domain ownership / SoR | Platform Standards + per-module audits | Module Prisma + domain services | Schema + services | All mutations/reads | Rare shadow paths | N/A | **CANONICAL_SINGLE** | Legacy Activity bridge in Drive | Phase 1 SoR traces |
| 8 | Authorization | `POLICY_ENGINE.md` | PE + dual + visibility + legacy helpers | PE actions; helpers; BCC maps | HTTP/AI/search vs UI | Yes | **Not same**: AuthZ ≠ UI gating | **TRANSITIONAL_PARALLEL** | Dual + org-chart RBAC planned migration | PE dual sections; `LEGACY_CLEANUP.md` |
| 9 | Entity registration | `PLATFORM_ENTITY_MODEL.md` | `platformEntityRegistry` | Registry + manifest `entities[]` | Trash/V_Link/activity metadata | Yes | Related; flags not always sync’d | **CANONICAL_WITH_PROJECTIONS** | Flag sync incomplete | Entity model + Scheduling `supportsSearch: false` |
| 10 | Unified Search | Search Constitution + `SEARCH_PROVIDER_MODEL.md` | `searchProviderRegistry` + visibility / partner delegates | Provider readiness; manifest `search` claim | Unified Search orchestrator | Yes (provider vs entity flag) | Entity flag ≠ inclusion gate | **CANONICAL_SINGLE** (federation) + **DRIFT** on entity flag | Align entity flags to providers | Search standard §4.3 / §7 |
| 11 | AI context | `AI_CONTEXT_ASSEMBLY.md` + provider API | Module providers + Twin assembly | `registerBuiltInModules` ModuleAIContext | Digital Life Twin | Partner path separate | Same product, different tech | **CANONICAL_SINGLE** (1P) / **INTENTIONAL_PARALLEL** (partner) | Partner AI activity deferred | AI SoT + marketplace cert F-08 |
| 12 | AI actions | `AI_EXECUTION_ARCHITECTURE.md` | `ActionExecutor` → `*AIActionService` | Declared actions + tools | Twin tools | Partner webhooks separate | Same product idea | **CANONICAL_SINGLE** (1P) | Partner executor optional | Phase 1 J traces |
| 13 | V_Link / relationships | `V_LINK.md` | Resolvers + module access/lifecycle | Entity types + access services | V_Link UI / graph | Doc table vs code | Doc lag | **CANONICAL_SINGLE** (impl) + **F** doc drift | Update integration table | Scheduling/HR services exist |
| 14 | Domain events | `DOMAIN_EVENTS.md` | Registry + emitters + subscribers | Event types | Notifications, AI suggestions | Module facades vs emitters | Same | **CANONICAL_SINGLE** | Continue adoption | Domain event matrix |
| 15 | Activity | Platform activity model + moduleSpecs | `emitModuleActivityEvent` | Normalized envelope | Feeds, mappers | Legacy Drive Activity | Transitional read bridge | **CANONICAL_SINGLE** (writes) | Legacy read paths | Platform Standards §3 |
| 16 | Notifications | Notification metadata guide | `NotificationService` + module adapters | Manifest notification types | In-app/email/push | Planned aliases | Mostly | **CANONICAL_SINGLE** | Alias cleanup | Guides + manifests |
| 17 | Realtime | ⚠️ SoT **TBD**; Pattern 14 truthfulness | `chatSocketService` hub + module adapters | `capabilities.realtime` claim | Clients | Claim vs transport | **Different meanings** | **UNRESOLVED** (platform SoT) + **INTENTIONAL_PARALLEL** (claim vs hub) | Need realtime ownership doc | SoT Realtime TBD; Scheduling test |
| 18 | Trash / lifecycle | `GLOBAL_TRASH.md` | Handler registry + module trash services | Handler registration + `trashedAt` | Global Trash UI/API | Message `deletedAt` asymmetry | Chat accepted partial | **CANONICAL_SINGLE** | Chat message model partial | Phase 1 P |
| 19 | Dashboard projections | `PERSONAL_DASHBOARD_WIDGET_CONTRACT.md` | `widgetRegistry` + bespoke widgets | Widget type + contract rows | Dashboard grids | Shell map vs module APIs | Projection intentional | **CANONICAL_WITH_PROJECTIONS** | Not a provider registry | Widget contract §§1–8 |
| 20 | Analytics contributions | `ANALYTICS_OWNERSHIP_MODEL.md` | Domain metrics + capability rollups | Domain APIs; summary facade | Widgets, enterprise panels | Dual pattern intentional | No AnalyticsProvider | **CANONICAL_SINGLE** (ownership model) | Event pipeline deferred; some stubs | OW-1/OW-2; no provider type |
| 21 | Internal app interoperability | moduleSpecs + domain bridges | Service bridges (Drive↔Chat, Sched↔HR, …) | Ad hoc contracts / service APIs | Cross-module features | Many bespoke bridges | Domain-specific OK | **INTENTIONAL_PARALLEL** | Prefer reuse patterns over one bus | Phase 1 S |
| 22 | Third-party Vssyl modules | Third-party pipeline SoT + partner cert | Marketplace host + JWT delegates | Manifest capabilities + cert | Embed, search, activity | Pilot vs full partner | Incomplete example | **CANONICAL_SINGLE** (pipeline) | Optional surfaces OFF by default | Cert record §2–3 |
| 23 | External-system interoperability | **No dedicated SoT** for ERP/POS/payroll | Domain-specific (storage, HR sync) | None platform-wide | Local integrations | Partner ≠ external SoR | Different problem | **MISSING** (platform contract) | Product decision when to invent | Phase 1 finding 10 |

---

## 5. Application participation matrix

Cell values: `CONFORMS` | `PARTIAL` | `TRANSITIONAL` | `DRIFT` | `NOT_APPLICABLE` | `NOT_IMPLEMENTED` | `UNKNOWN`.

| Row | Canonical owner | File Hub | Scheduling | Chat | Partner stand-in | Authority status | Reconciliation needed? | Notes / evidence |
|-----|-----------------|----------|------------|------|------------------|------------------|------------------------|------------------|
| identity | Lifecycle + built-in ids | CONFORMS | CONFORMS | CONFORMS | PARTIAL | CANONICAL_WITH_PROJECTIONS | Yes (naming) | Pilot sandbox id; Drive name drift |
| lifecycle | APPLICATION_LIFECYCLE | CONFORMS | CONFORMS | CONFORMS | PARTIAL | CANONICAL_SINGLE | No (pilot incomplete) | Partner install path exists; no full product |
| domain owner | Module SoR | CONFORMS | CONFORMS | CONFORMS | PARTIAL | CANONICAL_SINGLE | No | Pilot in-memory SoR atypical |
| capability declaration | Platform Standards §19 | CONFORMS | DRIFT | DRIFT | PARTIAL | TRANSITIONAL_PARALLEL | Yes | FE sparse for chat/scheduling; BE truthful |
| frontend metadata | coreModuleRegistry | CONFORMS | PARTIAL | PARTIAL | NOT_APPLICABLE | CANONICAL_WITH_PROJECTIONS | Yes (align caps) | Partner uses host metadata |
| workspace mount | Routing + switch | CONFORMS | CONFORMS | CONFORMS | CONFORMS | INTENTIONAL_PARALLEL | Doc only until migration | Switch + partner default |
| authorization | POLICY_ENGINE | TRANSITIONAL | TRANSITIONAL | TRANSITIONAL | PARTIAL | TRANSITIONAL_PARALLEL | Migration continue | Dual PE; partner JWT |
| entities | PLATFORM_ENTITY_MODEL | CONFORMS | DRIFT | PARTIAL | PARTIAL | CANONICAL_WITH_PROJECTIONS | Yes (flags) | Scheduling supportsSearch; chat msg deferred |
| Search | SEARCH_PROVIDER_MODEL | CONFORMS | CONFORMS | CONFORMS | CONFORMS | CANONICAL_SINGLE | Entity-flag sync only | Live providers / sandbox delegate |
| AI context | AI_CONTEXT_ASSEMBLY | CONFORMS | CONFORMS | CONFORMS | NOT_IMPLEMENTED | CANONICAL_SINGLE / INTENTIONAL_PARALLEL | Partner optional | F-08 deferred |
| AI actions | AI_EXECUTION | CONFORMS | CONFORMS | CONFORMS | NOT_IMPLEMENTED | CANONICAL_SINGLE | Optional for partners | Fixtures only |
| V_Link | V_LINK.md | CONFORMS | CONFORMS | PARTIAL | NOT_IMPLEMENTED | CANONICAL_SINGLE | Doc table + chat thread | Code ahead of V_LINK table |
| events | DOMAIN_EVENTS | CONFORMS | CONFORMS | CONFORMS | NOT_APPLICABLE | CANONICAL_SINGLE | No | Partner uses activity ingest |
| activity | Platform activity | CONFORMS | CONFORMS | CONFORMS | CONFORMS | CANONICAL_SINGLE | Drive legacy reads | Pilot ingest works |
| notifications | Notification guide | CONFORMS | CONFORMS | CONFORMS | NOT_IMPLEMENTED | CANONICAL_SINGLE | No | Cert: partner ntf from activity no |
| realtime | TBD + Pattern 14 | CONFORMS | PARTIAL | CONFORMS | NOT_IMPLEMENTED | UNRESOLVED / INTENTIONAL_PARALLEL | Product decision on claim | Scheduling runtime w/o claim |
| Trash | GLOBAL_TRASH | CONFORMS | CONFORMS | PARTIAL | NOT_IMPLEMENTED | CANONICAL_SINGLE | Chat message model | Accepted asymmetry |
| Dashboard | Widget contract | CONFORMS | CONFORMS | CONFORMS | NOT_IMPLEMENTED | CANONICAL_WITH_PROJECTIONS | No (not defect) | Bespoke projections OK |
| Analytics | Analytics ownership | PARTIAL | PARTIAL | CONFORMS | NOT_APPLICABLE | CANONICAL_SINGLE | Implementation stubs | No AnalyticsProvider required |
| internal interoperability | moduleSpecs / bridges | CONFORMS | CONFORMS | CONFORMS | NOT_APPLICABLE | INTENTIONAL_PARALLEL | Pattern reuse | Strong 1P bridges |
| third-party participation | Pipeline + cert | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | PARTIAL | CANONICAL_SINGLE | Complete partner product | Pilot ≠ full module |
| external-system interop | MISSING | PARTIAL | PARTIAL | NOT_APPLICABLE | NOT_APPLICABLE | MISSING | Product decision | Storage/HR ≠ ERP contract |

---

## 6. Resolution of Phase 1 questions

### Q1 — Authoritative capabilities?

**Answer:** Backend manifest capabilities (`buildBuiltInModuleManifest` → reconciled into `Module.manifest`) are the **de-facto authoring and certification authority**. Platform Standards §19 documents resolution order: manifest → `ModuleDefinition.capabilities` → inference, via `resolveModuleCapabilities()` — **helper not implemented**.

Frontend `coreModuleRegistry.capabilities` is **intended projection metadata**, **not used for runtime gating** (production consumers essentially absent; workspace switch voids registry lookup).

DB Module rows are the **persisted projection** of the backend builder for built-ins after reconcile.

**Authority status:** `TRANSITIONAL_PARALLEL` (documented target ≈ `CANONICAL_WITH_PROJECTIONS`).

**Do not treat FE/BE value differences as defects until projection sync is real**—but they **are** representation drift relative to documented intent that both should align.

### Q2 — Business workspace mounting?

**Answer:** **Switch (and App Router children for `segment-page`) are intentionally authoritative for UI mounting** until an explicit migration removes them (`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`, `workspace-runtime.mdc`).

`businessWorkspaceContracts.ts` is SSOT for **mount metadata / routeKind / CI drift**.  
`coreModuleRegistry` is **metadata only**.  
Partners: switch `default` → `PartnerModuleWorkspaceEmbed`.

**Status:** `INTENTIONAL_PARALLEL` (metadata vs render), not accidental duplication.

### Q3 — Dashboard contribution contract?

**Answer:** Dashboard has a **formal widget projection / boundary contract** (`PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`: module = capability, widget = projection). It does **not** have a SearchProvider-style application contribution registry. Widgets are **shell-registered, bespoke React** calling domain APIs. Authorization remains on domain/API; widgets must not own authoritative CRUD.

**Bespoke ≠ wrong.** Leave alone unless product wants a provider model later (**G**).

### Q4 — Analytics participation?

**Answer:** Canonical model is **domain-owned metrics + platform Analytics Capability aggregation** (`ANALYTICS_OWNERSHIP_MODEL.md` OW-1/OW-2/OW-4). There is **no** `AnalyticsProvider` type; architecture **omits** it rather than rejecting a prior promise. Dual pattern (Quick Stats via capability; HR/Scheduling via module summary) is **documented intentional**.

**Do not copy SearchProvider to Analytics** without a product decision. Scheduling 501 stubs are **implementation incompleteness**, not proof a provider registry is required.

### Q5 — Permanent vs transitional permission paths?

| Path | Classification | Role |
|------|----------------|------|
| Policy Engine | **Permanent target** (partial rollout) | Server AuthZ |
| Dual enforcement (`*PolicyDual`) | **Transitional** | Legacy first, then PE |
| Visibility services | **Permanent pattern** | Read/search/AI hit filtering |
| Legacy permission helpers | **Transitional bridge** (still shared with PE) | Ownership/share proofs |
| Business roles / membership facts | **Permanent domain facts** | Encoded into PE when wired |
| Org-chart parallel RBAC | **Transitional / planned deprecation** | `LEGACY_CLEANUP.md` |
| `BusinessConfigurationContext` `modulePermissions` / role `view`/`manage` / position/tier maps | **UI / workspace gating** — **not** AuthZ SoT | Must not replace server AuthZ |

Separate **authorization enforcement** from **UI presentation/gating**.

### Q6 — Platform Entity `supportsSearch`?

| Layer | Meaning |
|-------|---------|
| Manifest `capabilities.search` + `entities[].supportsSearch` | Module **claims** federated search / searchable types |
| `platformEntityRegistry.supportsSearch` | Tier-0 **descriptor metadata** (not Unified Search inclusion gate) |
| SearchProvider `readiness: 'ready'` | **What Unified Search actually runs** |

**Scheduling:** provider ready + manifest searchable + registry `false` = **representation drift / stale entity metadata**, not “search unimplemented.” Semantic: registry flag **should** reflect searchable intent once reconciled; today it does not.

### Q7 — What does `realtime` capability mean?

**Answer (as-built + Pattern 14):** `capabilities.realtime: true` means the module **truthfully claims certified module realtime participation** (adapter + safe fan-out)—**not** merely “emits some socket events,” and **not** “owns the Socket.IO transport” (Chat hub owns transport).

| App | Claim | Reality |
|-----|-------|---------|
| Chat | true | Owns messaging realtime via hub + `chatRealtimeService` |
| Drive | true | Module adapter on hub (`drive:item:*`) |
| Scheduling | **false (intentional)** | Schedule events on hub; test: omit until `schedulingRealtimeService` certified |

Platform Realtime SoT remains **TBD** → claim semantics are Pattern-14-local; platform ownership still `UNRESOLVED`.

**Product decision needed:** whether “runtime without claim” remains a lasting certification pattern (**G**).

### Q8 — First-party providers vs partner JWT delegates?

**Answer:** **Same PRODUCT concept, different TECHNICAL contracts** (`INTENTIONAL_PARALLEL`).

- Product: participate in Unified Search / workspace / activity / (optional) AI under tenant auth.
- First-party: in-process SearchProvider / AI HTTP providers / visibility services.
- Partner: HTTPS + platform JWT audiences; no in-process partner code; surfaces default OFF.

Not “two accidental architectures”—trust boundary requires different contracts.

### Q9 — Complete third-party module?

**Minimum for production publish/install (pipeline):** sandboxed UI artifact (HTTPS or GCS bundle scan PASSED) + structural certification + permission audit + admin review + interoperability checklist; AI SDK gates **if** AI-exposed.

**Not required for a minimal installable module:** Search/workspace/activity delegates (certified optional, ops OFF), V_Link, partner notifications, realtime iframe bridge, AI-readable activity.

**“Complete” for participation matrix rows today:** pipeline-complete + installable UI + declared capabilities; intelligence surfaces opt-in. Pilot `vssyl-pilot-assets` is **not** a complete partner product (no SPA body).

### Q10 — Stale published audits/docs?

| Document | Classification |
|----------|----------------|
| `docs/business-operations/SCHEDULING_OPERATION_MATRIX.md` (+ audits pointer) | **Live-looking, stale vs code** (PE/activity/trash/V_Link) |
| `V_LINK.md` hr/scheduling “Not integrated” rows | **Canonical doc with stale cells** |
| `REFERENCE_MODULE_CATALOG.md` `driveActivityService` / `driveDomainEventService` | **Live catalog, stale service names** |
| Older FILE_HUB constitutional/wave audits | **Explicitly historical** (superseded by FH-4/6) |
| `MARKETPLACE_PHASE_1A_EXECUTIVE_SUMMARY.md` | **Historical** (1B cert supersedes parts) |
| Platform Standards §19 matrix “scheduling realtime ✅” | **Conflicts intentional non-claim** — treat cautiously |
| FILE_HUB operation matrix / reference review | Relatively **live** |
| `V_LINK_PLATFORM_LAYER_PLAN.md` | **Explicitly historical** |

**Phase 2 does not edit these SoTs**—only classifies.

---

## 7. Gap classification

Categories A–H only. No code prescriptions.

### A — CORRECT / LEAVE ALONE

| Finding | Evidence | Owner | Apps | Why it matters | Wait on impl? |
|---------|----------|-------|------|----------------|---------------|
| Domain SoR in applications | Prisma + services | Module SoTs | drive, chat, scheduling | Core product principle | N/A — leave |
| Search federates visibility | SearchProvider model | Search Constitution | all 1P + pilot | Shared meaning without shared storage | Leave |
| AI context/actions via domain | ActionExecutor → `*AIActionService` | AI execution | 1P | Governed Twin | Leave |
| Dashboard widgets as projections | Widget contract | Dashboard widget SoT | 1P | Projection surface | Leave (not “wrong”) |
| Analytics domain + rollup (no provider) | Ownership model OW-1/2 | Analytics | 1P | Avoid false Search analogy | Leave model |
| Switch authoritative for mount | Runtime docs | Workspace runtime | all | Prevent drive-by “registry render” | Leave until migration |
| Partner JWT ≠ in-process providers | Delegate guides + cert | Marketplace | partner | Trust boundary | Leave split |
| Scheduling omit `realtime` claim while using hub | Manifest test | Pattern 14 | scheduling | Truthfulness ≠ silence sockets | Leave until decision on lasting pattern |

### B — REPRESENTATION DRIFT

| Finding | Evidence | Owner | Apps | Why | Wait? |
|---------|----------|-------|------|-----|-------|
| FE vs BE capabilities | coreModuleRegistry vs builtInModuleManifests | Platform Standards §19 | chat, scheduling (drive aligned) | Misleading certification/UI metadata | Yes — after Q1 projection rule locked |
| Entity `supportsSearch` vs provider | registry false, provider ready | Entity + Search | scheduling | Lying metadata | Yes — sync flags after meaning confirmed (done in Q6) |
| Capability shape object vs array | BuiltInManifestCapabilities vs ModuleCapability[] | Platform Standards | all | Dual parsers fragile | Yes — contract extension |
| Drive vs File Hub naming | bootstrap vs manifests | Lifecycle / bootstrap | drive | User/admin confusion | Low priority |
| Permission string vocabularies | `drive:*` vs view/upload vs seed | PE / seeds | drive | AuthZ confusion risk | Careful; may be transitional |

### C — TRANSITIONAL ARCHITECTURE

| Finding | Evidence | Owner | Apps | Why | Wait? |
|---------|----------|-------|------|-----|-------|
| PE dual enforcement | POLICY_ENGINE.md | Policy Engine | drive, chat, scheduling | Documented migration | Continue PE; don’t invent parallel RBAC |
| `resolveModuleCapabilities` missing | Standards Batch 2 target | Platform Standards | all | Declared but unimplemented | Contract/doc then impl |
| Workspace switch vs future registry render | Runtime “not replaced yet” | Workspace | all | Explicit unfinished migration | Only via named migration |
| Org-chart parallel RBAC | LEGACY_CLEANUP | Policy / org | business | Planned PE adapter | Don’t expand |
| BCC coarse permissions as AuthZ substitute | BCC `hasPermission` | Workspace runtime note | business UI | UI only | Don’t treat as AuthZ SoT |
| Drive legacy Activity reads | Phase 1 M | Activity model | drive | Write path normalized | Known partial |

### D — CONTRACT GAP

| Finding | Evidence | Owner | Apps | Why | Wait? |
|---------|----------|-------|------|-----|-------|
| Realtime platform SoT TBD | ARCHITECTURE_SOURCE_OF_TRUTH | Platform Eng | all | Claim semantics under-specified | **Yes** — ownership doc before normalize |
| No composition reference for participation mechanisms | Mechanism-plural stack | Platform Standards | all | Agents/humans re-derive Phase 1 | Doc composition (not new layer) |
| External-system interop SoT missing | No ERP/POS contract | TBD | scheduling/drive partial | Partner ≠ external SoR | **Product decision first** |
| Capability truthfulness enforcement incomplete | Pattern 14 vs FE unused | Platform Standards | chat/scheduling | Drift accumulates | Extend Module Contract semantics |

### E — IMPLEMENTATION GAP

| Finding | Evidence | Owner | Apps | Why | Wait? |
|---------|----------|-------|------|-----|-------|
| Partner AI / V_Link / ntf / realtime | Cert findings | Marketplace | pilot | Optional surfaces incomplete | Optional unless product requires |
| Scheduling analytics 501s | Admin controller stubs | Scheduling / Analytics | scheduling | Metrics incomplete | Domain impl; not provider |
| Chat message/thread entities deferred | Level 3 review | Chat | chat | Entity matrix incomplete | Accepted deferral |
| No complete partner SPA in repo | Phase 1 §8 | Marketplace | pilot | Limits Level 4 proof | Product/partner work |

### F — DOCUMENTATION DRIFT

| Finding | Evidence | Owner | Apps | Why | Wait? |
|---------|----------|-------|------|-----|-------|
| Scheduling operation matrix stale | PE/trash/V_Link claims | BO SoT points at matrix | scheduling | Misleads Phase 2+ | Mark historical / refresh |
| V_LINK integration table | hr/scheduling “not integrated” | V_LINK.md | scheduling, hr | Contradicts code | Update cells (SoT edit = later phase) |
| Catalog phantom drive services | REFERENCE_MODULE_CATALOG | Catalog | drive | Wrong mental model | Doc fix |
| Standards matrix scheduling realtime ✅ | vs intentional omit | Platform Standards | scheduling | False certified claim | Doc reconcile |

### G — PRODUCT / ARCHITECTURE DECISION REQUIRED

| Decision | Why evidence insufficient | Affects |
|----------|---------------------------|---------|
| Keep FE capabilities as synced projection vs remove unused arrays | Intent documented; value of FE list unclear if unused | Capability SoT |
| Is “runtime sockets without `realtime: true`” a lasting certification pattern? | Pattern exists; Realtime SoT TBD | Scheduling + future modules |
| Should Dashboard remain bespoke projections forever? | Contract allows; product may want contribution registry later | Dashboard |
| When (if ever) to define external-system interoperability as platform contract? | MISSING today; partner path is different | Integrations roadmap |
| Minimum bar for “complete” partner module beyond pipeline (must include Search?) | Cert says optional | Marketplace Level 4 |

### H — RUNTIME VERIFICATION REQUIRED

| Claim | Why static insufficient |
|-------|-------------------------|
| FE `capabilities` never gate UX in any code path | Need dynamic consumer audit / runtime |
| DB `Module.manifest` always matches builder post-startup for all envs | Needs live/staging row inspect |
| PE dual `POLICY_NOT_IMPLEMENTED` behavior in production configs | Env-dependent |
| Partner upload→iframe E2E | No full partner SPA statically |
| Scheduling schedule-room membership under load | Needs multi-client runtime |
| Redis adapter for Chat hub in production | Deploy-config dependent |

---

## 8. Five-principle assessment

### 1. Shared meaning > shared storage — **STRONG**

Applications expose structured meaning (entities, Search hits, AI context, V_Link types, activity, events) while retaining Prisma/service SoR. Search and AI read through visibility; they do not become shadow stores for the traced apps.

### 2. AI needs governed context — **STRONG**

Twin consumes Module ContextProviders and actions that delegate to domain services with PE/visibility. AI does not gain broader authority than the actor (confirmed ActionExecutor pattern). Partner AI remains gated / incomplete—not a shadow SoR.

### 3. Connect before replace

| Kind | Rating | Evidence |
|------|--------|----------|
| **Internal application interoperability** | **STRONG** | Drive↔Chat attachments; Scheduling↔HR publish; Chat hub fan-out; Todo↔Chat; workforce bridges |
| **External system interoperability** | **WEAK** | Partner Vssyl modules ≠ accounting/POS/payroll; no platform external-SoR contract; local storage/HR sync only |

### 4. One platform, different experiences — **PARTIAL**

| Aspect | Assessment |
|--------|------------|
| Shared identity/context infrastructure | Strong (tenancy, modules, workspace shells) |
| Business authorization | Transitional PE + dual + visibility |
| Role-aware presentation | **More permission/membership-aware than rich role-aware**; BCC coarse `view`/`manage` + business roles; position maps incomplete |
| Dashboard/workspace adaptation | Present (widgets, install, business-scoped modules) |

**Verdict:** Vssyl today is primarily **permission- and membership-aware**, with **partial** role/position awareness—not a fully matured role-experience system.

### 5. Applications as senses

| Mechanism | Realizes principle? |
|-----------|---------------------|
| Search | **Yes** — enabling app adds federated discovery |
| AI context / actions | **Yes** — new governed senses/actions |
| V_Link | **Yes** (1P) — new linkable types |
| Events / activity / notifications | **Yes** — signals into shared understanding |
| Dashboard | **Partial** — projections, not automatic sense registration |
| Analytics | **Partial / weak uniformity** — domain metrics exist; no automatic sense contribution |

Enabling an application **does** widen Search/AI/V_Link/events for first-party modules without taking ownership. Dashboard/Analytics do not automatically “grow senses” via a uniform contribution contract—and that is **not automatically a defect**.

---

## 9. Participation-contract conclusion

### Chosen: **CONCLUSION 3**

**An existing canonical Module / Platform Standards contract needs extension so current participation mechanisms share clearer declarations and semantics.**

**Why not 1:** Capability resolve helper missing; entity flag semantics; realtime SoT gap; stale docs—cleanup alone understates needed semantic clarity.

**Why not 2 alone:** Composition reference is necessary but insufficient without extending declaration semantics (capability projection rules, entity flag meaning, realtime claim meaning) already foreshadowed in Platform Standards §19 / Pattern 14.

**Why not 4:** Existing owners (Platform Standards, Search, AI, Workspace, Analytics, Marketplace pipeline) **can absorb** the concerns. No evidence that a new “Participation Engine” is required. Prefer composition + semantic extension over a new layer.

**Companion:** Produce a **non-SoT composition reference** (Phase 3 doc work) that maps mechanisms → owners → consumers—without inventing a subsystem.

---

## 10. Decisions requiring product/user input

1. **Frontend capability arrays:** maintain as synced projections of backend manifests, or delete/deprecate unused FE capability metadata?
2. **Realtime claim pattern:** permanently allow “hub traffic without `capabilities.realtime`” until a certified module adapter exists?
3. **Dashboard:** keep bespoke widget projections indefinitely, or eventually require a contribution interface?
4. **External-system interoperability:** is a platform-level contract needed in the near term, or remain domain-local + partner-iframe only?
5. **Partner “complete” bar:** is installable sandboxed UI + cert enough for Level-3 marketplace, or must Search/Activity be on by default?

(Product Definition Guide still absent—when added, re-validate terminology only; do not reopen SoR conclusions without evidence.)

---

## 11. Runtime verification requirements

| ID | Scenario | Suggested method |
|----|----------|------------------|
| RV-1 | Confirm no production FE gating on `ModuleDefinition.capabilities` | Static exhaustiveness + optional runtime instrumentation |
| RV-2 | Built-in `Module.manifest` equals `buildBuiltInModuleManifest` after startup | Staging DB inspect / startup reconcile tests |
| RV-3 | PE dual deny paths for drive/chat/scheduling | Existing `*PolicyDual` tests + staging matrix |
| RV-4 | Partner fixture zip through upload→approve→install→embed | Manual marketplace E2E |
| RV-5 | Scheduling publish → multi-client `schedule:*` events | Two-browser runtime |
| RV-6 | Chat hub Redis adapter in production | Deploy config + health |

No commands claimed executed beyond git status in Phase 2.

---

## 12. Phase 3 recommendation

**Form: F — Combination, in explicit order**

1. **E — Product decision first** on §10 items that gate contract wording (especially FE capabilities, realtime claim pattern, external interop timing).
2. **A — Documentation / SoT reconciliation** — mark/refresh stale Scheduling matrix cells, V_Link integration rows, catalog phantom services, Standards realtime matrix conflict; publish a **composition reference** under architecture docs (non-inventive).
3. **B — Contract consolidation/design** — extend Platform Standards / Module Contract semantics for: capability authority + projection rules; entity flag vs SearchProvider; realtime claim meaning; clarify AuthZ vs UI gating (BCC).
4. **D — Runtime verification** for RV-1–RV-6 before large sync PRs.
5. **C — Targeted implementation reconciliation** only after A/B/D — e.g. FE capability sync or removal; Scheduling entity `supportsSearch` alignment; **not** AnalyticsProvider invention; **not** workspace switch rewrite unless product schedules that migration.

**Phase 3 must not** invent a new participation subsystem.

---

## Appendix — evidence paths

### Phase 1
- `docs/architecture/audits/APPLICATION_PARTICIPATION_TRACE_PHASE_1.md`

### Architecture owners
- `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` (§19 capabilities; target `resolveModuleCapabilities`)
- `docs/architecture/APPLICATION_LIFECYCLE.md`
- `docs/architecture/WORKSPACE_ROUTING_CONTRACT.md`
- `docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`
- `docs/architecture/POLICY_ENGINE.md`
- `docs/architecture/PLATFORM_ENTITY_MODEL.md`
- `docs/architecture/SEARCH_PROVIDER_MODEL.md`
- `docs/search/SEARCH_CONSTITUTION.md` / `SEARCH_PLATFORM_STANDARD.md`
- `docs/architecture/PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`
- `docs/analytics/ANALYTICS_OWNERSHIP_MODEL.md`
- `docs/analytics/ANALYTICS_STATUS_RECORD.md`
- `docs/architecture/V_LINK.md`
- `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`
- `docs/marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md`
- `docs/guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md` (Pattern 14)
- `.cursor/rules/workspace-runtime.mdc`

### Implementation anchors
- `server/src/startup/builtInModuleManifests.ts` :: `buildBuiltInModuleManifest`, `reconcileBuiltInManifest`
- `web/src/runtime/modules/coreModuleRegistry.ts`
- `web/src/lib/businessWorkspaceContracts.ts`
- `web/src/components/business/BusinessWorkspaceContent.tsx`
- `web/src/contexts/BusinessConfigurationContext.tsx`
- `server/src/platform/platformEntityRegistry.ts` :: `registerSchedulingPlatformEntities`
- `server/src/services/search/searchProviderRegistry.ts`
- `server/src/services/chatSocketService.ts`
- `server/src/startup/__tests__/builtInModuleManifests.scheduling.test.ts` (realtime omission)
- `server/src/marketplace/registerSandboxPilot*.ts`

### Stale / historical (do not use as live participation truth)
- `docs/business-operations/SCHEDULING_OPERATION_MATRIX.md`
- `V_LINK.md` “Not integrated” rows for hr/scheduling (cells only)
- Older FILE_HUB wave audits superseded by FH-6 reference review

---

## Appendix B — Git / change control

| Item | Value |
|------|-------|
| Initial HEAD | `3feebc09a29c86da2a843b04856c462fa55be444` |
| Final HEAD | same |
| Created | `docs/architecture/audits/APPLICATION_PARTICIPATION_MATRIX_PHASE_2.md` |
| Phase 1 modified | **No** |
| Product code modified | **No** |
| Architecture SoT modified | **No** |
| Commit | NONE |
| Push | NONE |

---

*End of Phase 2 report.*
