# Application Participation Composition

**Program:** Platform Participation Reconciliation — Phase 3A  
**Date:** 2026-09-08  
**Status:** Active — composition / navigation reference (not a subsystem)  
**Owner:** Platform architecture  
**Source of Truth for:** Application participation composition and navigation only  
**Supporting to:** Per-concern canonical owners listed in §9 (Search, AI, Dashboard, V_Link, authorization, lifecycle, Analytics, realtime ownership, etc.)

> **This document does not own** Search, AI, Dashboard, V_Link, Policy Engine, lifecycle, Analytics, realtime transport, or partner pipeline contracts. It explains how those existing contracts compose when an application participates in the platform.

**Product language (not architecture law):** [`docs/product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md`](../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md)  
**Evidence baselines:** [Phase 1 trace](./audits/APPLICATION_PARTICIPATION_TRACE_PHASE_1.md) · [Phase 2 matrix](./audits/APPLICATION_PARTICIPATION_MATRIX_PHASE_2.md)

---

## 1. Purpose

Vssyl is a **contextual operational platform**. Applications retain **domain ownership** (system of record for their entities and business rules). Shared platform capabilities — Unified Search, AI / Digital Life Twin, Dashboard projections, notifications, analytics consumers, and similar — **consume governed contributions**; they do not become a second SoR.

**Application participation** is the composition of existing platform contracts (lifecycle, manifests, authorization, providers, events, workspace mounting, certification). It is **not** a new runtime, service, registry, or “Participation Engine.”

Product Definition terms used here (product meaning only):

| Term | Product meaning (abbrev.) | Architecture authority |
|------|---------------------------|------------------------|
| **Application** | User-facing domain product | Lifecycle + module contract |
| **Module** | Technical packaging / registry / lifecycle unit | Platform Standards + `moduleSpecs` |
| **Application contribution** | Authorized meaning/signals for platform use | Per-capability owners below |
| **Shared operational understanding** | Product outcome of connected meaning — **not** a named subsystem | Composition of owners below |
| **Domain owner / SoR** | Authoritative owner of records | Per-module services + Platform Standards |
| **Projection** | Contextual representation owned elsewhere | e.g. Dashboard widget contract |
| **Capability** | Shared platform function consuming contributions | Platform Standards §19 + Pattern 14 |

Architecture owners linked in §9 remain authoritative for their domains.

---

## 2. Core rule

```
Application / external system owns domain truth
  → declares appropriate module/application metadata
  → exposes authorized contributions through existing platform contracts
  → shared capabilities consume those contributions
  → authorization remains enforced on every read/write path
  → mutations return through the owning domain
```

Not every application must implement every contribution mechanism. Capability-based surfaces are opt-in via truthful claims and contract satisfaction (§4–§5).

---

## 3. Participation map

| Concern | Existing canonical mechanism | Canonical owner | Required or capability-based? | What it means |
|---------|------------------------------|-----------------|-------------------------------|---------------|
| Identity | Module id + classification + lifecycle identity | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md), Platform Standards | **Core** | Stable application identity in registry/install |
| Application lifecycle | Install / uninstall / membership / bootstrap | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) | **Core** | App can be provisioned into a tenant context |
| Capability declaration | Backend/shared Module/Application manifest `capabilities` | Platform Standards §19 + Pattern 14 | **Core** (truthful declaration) | Single canonical claim surface for what the app participates in |
| Frontend presentation metadata | Workspace/module registry display metadata | [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | **Core** (presentation) | Projection for UI — **not** independent capability authority |
| Workspace participation | Business/personal routing + mount contracts | [`WORKSPACE_ROUTING_CONTRACT.md`](./WORKSPACE_ROUTING_CONTRACT.md), workspace runtime | Capability / surface (`businessWorkspace`, mounts) | Where the app appears; not AuthZ by itself |
| Authorization | Policy Engine (+ transitional dual enforcement) | [`POLICY_ENGINE.md`](./POLICY_ENGINE.md) | **Core** | Server enforcement of protected actions |
| Entities | Platform entity descriptors + manifest `entities[]` | [`PLATFORM_ENTITY_MODEL.md`](./PLATFORM_ENTITY_MODEL.md) | Core when app owns linkable/trashable/searchable types | Describes entity types; not a substitute for providers |
| Unified Search | SearchProvider registration + readiness | [`../search/SEARCH_CONSTITUTION.md`](../search/SEARCH_CONSTITUTION.md), [`SEARCH_PROVIDER_MODEL.md`](./SEARCH_PROVIDER_MODEL.md) | **Capability-based** (`search`) | Federated discovery; inclusion via ready providers |
| AI context | Module ContextProviders | [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md), [`../guides/AI_CONTEXT_PROVIDER_API.md`](../guides/AI_CONTEXT_PROVIDER_API.md) | **Capability-based** (`ai` / AI-exposed) | Authorized context for Twin — if AI-exposed |
| AI actions | ActionExecutor → domain AI action services | [`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md) | **Capability-based** | Writes only through owning domain services |
| V_Link | Resolver + access/lifecycle + manifest `vlink` | [`V_LINK.md`](./V_LINK.md) | **Capability-based** (`vlink`) | Cross-app associations; membership ≠ content access |
| Domain events | Registered types + emit after success | [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) | Core for meaningful mutations (as applicable) | Cross-cutting fan-out after successful state change |
| Activity | `emitModuleActivityEvent` / partner ingest | Platform Standards §3, activity query model, [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | Core for meaningful governed mutations | Immutable “what happened” evidence |
| Notifications | NotificationService + manifest metadata | [`../guides/NOTIFICATION_METADATA_GUIDE.md`](../guides/NOTIFICATION_METADATA_GUIDE.md) | **Capability-based** (`notifications`) | User attention on events |
| Realtime | Shared transport (Chat hub / clients) + optional module adapter | ⚠️ Platform Realtime SoT **TBD** in [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md); claim semantics Pattern 14 | **Capability-based** (`realtime`) | Transport usage ≠ certified claim (§5, §10) |
| Global Trash | `trashedAt` + handlers | [`GLOBAL_TRASH.md`](./GLOBAL_TRASH.md) | **Capability-based** (`trash`) when soft-delete applies | Lifecycle / recovery contract |
| Dashboard projection | Personal Dashboard widget boundary contract | [`PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) | **Capability-based** / product surface | Bespoke projections — **no** SearchProvider-like Dashboard registry |
| Analytics | Analytics ownership + consumers | [`../analytics/ANALYTICS_STATUS_RECORD.md`](../analytics/ANALYTICS_STATUS_RECORD.md), ownership model | **Capability-based** / derived | Derived metrics; not a second SoR |
| Internal interoperability | Module interop contract + domain bridges | [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) | Core order: authorize → execute → activity → notify/realtime | Same product model across first-party apps |
| Third-party module participation | Sandbox + JWT/delegates + certification | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md), marketplace cert record | Core for partners: runtime/trust + cert + truthful capabilities | Partner apps inside Vssyl trust boundary |
| External-system interoperability | Domain-local adapters today; platform minimum contract | **Phase 3B definition pending** (no dedicated SoT yet) | Product-driven; connect-before-replace | Outside SoR (ERP, payroll, POS, etc.) — see §7 |

---

## 4. Required core participation vs optional capabilities

### CORE platform obligations

Grounded in existing lifecycle, security, tenancy, and module standards — not invented here:

- Stable **module/application identity** and lifecycle participation (installability where applicable)
- **Tenant / context scoping** on persisted paths
- **Server authorization** for protected actions (Policy Engine direction; fail closed)
- **Truthful capability and metadata declaration** (no aspirational claims)
- **Meaningful governed mutations** emit required **activity** (and domain events where the domain contract requires them)
- Partner apps additionally satisfy **sandbox runtime, security, and certification** gates

### CAPABILITY-BASED participation (not mandatory for every app)

Claim only if the app satisfies that capability’s canonical contract:

- Unified Search
- AI context / AI actions
- V_Link
- Notifications
- Realtime (**certified** participation)
- Global Trash
- Dashboard projections
- Analytics contribution surfaces
- Business workspace hub mounts (where product requires them)

A partner or first-party application can be **complete** for install/certification without implementing every capability. Capabilities remain opt-in and must stay truthful.

---

## 5. Capability truth

| Layer | Role |
|-------|------|
| **Backend / shared Module–Application manifest** | **Canonical capability declaration** |
| **Persisted DB `Module.manifest`** | Runtime / persisted representation after reconcile |
| **Frontend registry capability arrays** | Presentation / projection metadata — **must not independently redefine capability truth** |

Established rules:

1. One canonical capability declaration per application (manifest contract).
2. Other layers may eventually be derived, synchronized projections, or removed if unused — **synchronization implementation is Phase 3B**, not defined here.
3. Projections must not redefine capability truth.
4. A claimed capability means the application satisfies that capability’s **canonical contract** (Pattern 14 + per-capability owners).
5. **Capability claim ≠ incidental use of infrastructure** (especially realtime: hub traffic without `realtime: true` is allowed; the claim means certified module realtime participation).

Frontend capability arrays are **not** changed in Phase 3A.

---

## 6. First-party vs partner participation

Same **product model** (domain ownership, contributions, capability truthfulness, AuthZ). Different **technical trust boundary**.

| | First-party | Partner (third-party Vssyl module) |
|--|-------------|-------------------------------------|
| Runtime | In-process providers, services, adapters | Sandboxed UI (iframe/bundle); host-mediated APIs |
| Contribution path | Direct registry / service registration | JWT / delegate interfaces + certification |
| Completeness | Core obligations + claimed capabilities | Core + sandbox/security/cert + truthful claims — **not** every capability mandatory |

Do not collapse partner and first-party into one technical mechanism.

---

## 7. External systems

| | Third-party Vssyl module | External system |
|--|-------------------------|-----------------|
| What it is | Application participating **inside** the Vssyl ecosystem / partner runtime | Outside authoritative system (accounting, payroll, POS, productivity suite, etc.) |
| SoR | May own domain truth **inside** Vssyl when installed as the app SoR | Often remains **external SoR**; Vssyl **connects before it replaces** |
| Contract | Marketplace / third-party pipeline (exists) | **Minimal platform interoperability contract — Phase 3B definition pending** |

This document does **not** invent MuleSoft-like infrastructure or a connector subsystem. Domain-local integrations may exist; a platform-minimum external interoperability contract is queued for Phase 3B (§10).

---

## 8. Surface vs ownership examples

| Contribution | Consuming surface | SoR remains |
|--------------|-------------------|-------------|
| Calendar upcoming events → Dashboard widget | Dashboard projection | Calendar |
| Scheduling shifts → Unified Search hit | Search | Scheduling |
| File Hub file metadata → AI context | Twin / AI assembly | File Hub (`drive`) |
| Chat message events → notifications | Notification inbox | Chat |
| External accounting balances → future authorized financial projection | Future interop consumer | External accounting system |

The consuming capability **never** becomes system of record.

---

## 9. Authority map

| Concern | Canonical document(s) |
|---------|----------------------|
| Placement / hierarchy | [`../VSSYL_SOURCE_OF_TRUTH.md`](../VSSYL_SOURCE_OF_TRUTH.md) |
| Ownership registry | [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) |
| Architecture index | [`VSSYL_ARCHITECTURE_INDEX.md`](./VSSYL_ARCHITECTURE_INDEX.md) |
| Platform + module contract | [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) |
| Module interop checklist | [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md) |
| Capability Pattern 14 | [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) |
| Application lifecycle | [`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md) |
| Workspace runtime / FE presentation | [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](./WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) |
| Business workspace routing | [`WORKSPACE_ROUTING_CONTRACT.md`](./WORKSPACE_ROUTING_CONTRACT.md) |
| Policy Engine | [`POLICY_ENGINE.md`](./POLICY_ENGINE.md) |
| Platform entities | [`PLATFORM_ENTITY_MODEL.md`](./PLATFORM_ENTITY_MODEL.md) |
| Unified Search | [`../search/SEARCH_CONSTITUTION.md`](../search/SEARCH_CONSTITUTION.md), [`SEARCH_PROVIDER_MODEL.md`](./SEARCH_PROVIDER_MODEL.md) |
| AI context / actions | [`AI_CONTEXT_ASSEMBLY.md`](./AI_CONTEXT_ASSEMBLY.md), [`AI_EXECUTION_ARCHITECTURE.md`](./AI_EXECUTION_ARCHITECTURE.md) |
| V_Link | [`V_LINK.md`](./V_LINK.md) |
| Domain events | [`DOMAIN_EVENTS.md`](./DOMAIN_EVENTS.md) |
| Global Trash | [`GLOBAL_TRASH.md`](./GLOBAL_TRASH.md) |
| Dashboard widgets | [`PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) |
| Notifications | [`../guides/NOTIFICATION_METADATA_GUIDE.md`](../guides/NOTIFICATION_METADATA_GUIDE.md) |
| Analytics | [`../analytics/ANALYTICS_STATUS_RECORD.md`](../analytics/ANALYTICS_STATUS_RECORD.md) |
| Third-party / marketplace | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) |
| Realtime platform ownership | ⚠️ **TBD** — [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](./ARCHITECTURE_SOURCE_OF_TRUTH.md) § Realtime |
| Product language | [`../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md`](../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md) |
| Participation evidence | [Phase 1](./audits/APPLICATION_PARTICIPATION_TRACE_PHASE_1.md), [Phase 2](./audits/APPLICATION_PARTICIPATION_MATRIX_PHASE_2.md) |

---

## 10. Anti-patterns

- Creating **duplicate systems of record** in Search, AI, Dashboard, or Analytics
- Treating **frontend capability metadata** as a second capability authority
- **Dashboard** rebuilding domain logic or authoritative CRUD
- **AI** bypassing canonical domain services
- **Search** bypassing authorization / visibility
- Treating **V_Link membership** as permission to content
- Treating **role / UI visibility / module chrome** as server authorization
- Inventing another platform layer to “unify” existing contracts
- Requiring every application to implement every capability
- Confusing **partner Vssyl modules** with **external systems**
- Equating **socket/hub traffic** with certified `realtime` capability

---

## 11. Open contract work (Phase 3B handoff)

Bounded semantic contract work still required — **do not implement here**:

1. **Capability projection / resolution semantics** — how FE (and helpers such as documented `resolveModuleCapabilities()`) derive from or sync to canonical manifest claims without becoming a second authority
2. **Entity metadata consistency rule** — align `entities[].supportsSearch` / `platformEntityRegistry.supportsSearch` with searchable intent while keeping **SearchProvider readiness** as Unified Search inclusion gate
3. **Realtime participation semantics / owner gap** — document platform Realtime SoT owner (still TBD); keep claim = certified participation vs transport usage
4. **External-system interoperability minimum contract** — locate owner and define minimal connect-before-replace contract (no new subsystem invention in 3A)
5. **Authorization vs presentation wording** — finish propagating AuthZ ≠ UI gating language into any remaining ambiguous supporting docs after Policy Engine / composition clarifications

Phase 3B must **not** create a Participation Engine, AnalyticsProvider, DashboardProvider registry, or rewrite the business workspace switch unless separately product-scheduled.

---

**Last updated:** 2026-09-08
