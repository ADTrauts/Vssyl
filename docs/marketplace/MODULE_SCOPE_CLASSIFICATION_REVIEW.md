# Module Scope Classification — Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5  
**Date:** 2026-06-24  
**Status:** Architecture audit — **superseded for enforcement by Phase 1B-E.5-F**  
**Implementation:** [MODULE_SCOPE_STANDARD.md](./MODULE_SCOPE_STANDARD.md), [MODULE_SCOPE_ENFORCEMENT.md](./MODULE_SCOPE_ENFORCEMENT.md)

---

## 1. Executive answer

**Partially — but not consistently enforced.**

Scope exists today as **install-context** (`personal` | `business` query params), **manifest hints** (`supportedContexts` and inferred routes), and **hardcoded built-in lists** — not as a **first-class, lifecycle-wide module classification**.

Vssyl **cannot** reliably distinguish personal vs business vs shared vs internal/admin modules across the full marketplace lifecycle.

---

## 2. Scope taxonomy (target vs reality)

| Classification | Intended meaning | Platform support today |
|----------------|------------------|------------------------|
| **Personal** | Installable/usable on personal dashboard | ✅ Install path (`scope=personal`) |
| **Business** | Installable/usable in business workspace | ✅ Install path (`scope=business` + `businessId`) |
| **Both (shared)** | Valid in personal and business contexts | 🟡 Manifest `supportedContexts` can declare; **not enforced** on install/browse |
| **Household** | Valid in household dashboard | 🟡 Declared in search/workspace sub-contracts; **no** install/runtime scope |
| **Internal / Admin** | Platform-only; not marketplace | ❌ No module scope type; admin surfaces are routes, not modules |

---

## 3. Module model inventory

**Source:** `prisma` `Module` model (`prisma/modules/business/modules.prisma`)

| Field | Scope relevance | Notes |
|-------|-----------------|-------|
| `id` | Indirect | Built-in ids in `BUILT_IN_MODULE_IDS` |
| `category` | ❌ | `ModuleCategory` enum (PRODUCTIVITY, BUSINESS, …) — **product category, not install scope** |
| `status` | Lifecycle | PENDING / APPROVED / etc. — not scope |
| `businessId` | ❌ Misleading name | **Developer business link**, not “business-only module” |
| `manifest` (JSON) | ✅ Partial | May contain `supportedContexts`, `features`, `routes`, capability blocks |
| `pricingTier` | Billing | Not scope |
| `isProprietary` | Access gate | Used for HR-style tier checks — **implicit business-only behavior** |

**No DB column:** `moduleScope`, `installScope`, `audience`, `visibility`, or `isInternal`.

---

## 4. Installation tables (scope by install record)

| Table | Scope dimension |
|-------|-----------------|
| `ModuleInstallation` | Personal — `userId` |
| `BusinessModuleInstallation` | Business — `businessId` |
| `ModuleSubscription` | Personal or business-linked billing |
| `BusinessModuleSubscription` | Business billing entitlement |

Install scope is **where the row is written**, not a property read from the module definition at enforcement time.

---

## 5. Manifest & registry inventory

### 5.1 Top-level manifest fields (partner + built-in)

| Field | Purpose | Scope signal? |
|-------|---------|---------------|
| `supportedContexts` | Declared tenant contexts | ✅ **Closest to canonical scope** (certification) |
| `features` | Feature flags by context key | 🟡 Used to **infer** `supportedContexts` if missing |
| `routes` | Route map by context key | 🟡 Inference fallback |
| `frontend.personalUrl` / `businessUrl` / `entryUrl` | Entry URLs | 🟡 Inference: `personal` if `entryUrl`, `business` if `businessUrl` |
| `capabilities.businessWorkspace` | Built-in flag | 🟡 Implies business workspace hub — built-ins only |
| `isBuiltIn: true` | Built-in marker | Implicit platform module — not marketplace |
| `searchDelegate.supportedContexts` | Search participation | Sub-scope; enforced at **search query** time |
| `workspaceParticipation.supportedContexts` | Embed participation | Sub-scope; enforced at **bridge** time |
| `activityIngest` (proposed 1B-E) | Activity participation | Sub-scope; not implemented |

**Not found:** `moduleType`, `audience`, `workspaceType`, `tenantType`, `visibility` as standard manifest keys.

### 5.2 Certification resolution (`moduleCertificationValidator.ts`)

`resolveSupportedContexts(manifest)` order:

1. Explicit `manifest.supportedContexts`
2. Else keys of `manifest.features`
3. Else keys of `manifest.routes`
4. Else infer from `frontend.personalUrl` / `businessUrl` / `entryUrl`

**Certification requires ≥1 context** — hard error if empty. Values are **not validated** against an allowed enum at certification time (any string keys pass if present).

### 5.3 Built-in modules (`builtInModuleManifests.ts`, `builtInModuleIds.ts`)

| Mechanism | Behavior |
|-----------|----------|
| `BUILT_IN_MODULE_IDS` (12 modules) | Hardcoded list |
| `isBuiltInModuleId()` | Personal marketplace treats **all** built-ins as “installed” without `ModuleInstallation` |
| `capabilities.businessWorkspace` | Per-module flag on drive, chat, hr, etc. |
| No `supportedContexts` on built-in manifests | Scope implied by code paths, not manifest |

**Business-oriented built-ins** (`hr`, `scheduling`, `workforce_comms`) still appear **installed in personal marketplace scope** because of blanket built-in treatment.

---

## 6. Registry & sync inventory

| Registry | Scope awareness |
|----------|-----------------|
| `ModuleRegistrySyncService` | Syncs AI context, search delegate, workspace participation — **not** top-level scope |
| `searchDelegateRegistry` | Stores `supportedContexts` per delegate |
| `workspaceParticipationRegistry` | Stores `supportedContexts` per participant |
| `searchProviderRegistry` (first-party) | Each provider declares `supportedContexts` |
| `registerBuiltInModules` | Compile-time; no scope registry |

---

## 7. Lifecycle stage findings

| Stage | Scope behavior | Gap |
|-------|----------------|-----|
| **Developer submit** | No scope field required beyond inferred contexts | No explicit `moduleScope` |
| **Certification** | `supportedContexts` required (or inferable) | No enum validation; not surfaced as approval gate label |
| **Marketplace browse** | Client passes `scope=personal\|business` | **Does not filter** modules by manifest `supportedContexts` |
| **Install** | Writes to correct install table by query scope | **Does not reject** install when module lacks that context |
| **Runtime** | `getModuleRuntimeConfig` uses install record + scope param | **Does not check** manifest `supportedContexts` |
| **Business workspace hub** | Static `switch` for first-party; partner default embed | Business-only modules not hidden from personal nav via scope |
| **Billing** | Business vs personal subscription tables | No scope field; proprietary modules use business tier gate |
| **Search delegate** | `searchDelegateProxy` filters by registration `supportedContexts` | ✅ Enforced at query |
| **Workspace bridge** | Partner embed path; built-ins blocked | ✅ Partial; context in JWT |
| **Activity ingest** | Proposed `activityIngest.supportedContexts` | Not implemented |

---

## 8. Implicit scope signals (non-manifest)

| Signal | What it implies | Reliable? |
|--------|-----------------|-----------|
| `BUILT_IN_MODULE_IDS` | Platform module | ✅ For built-ins only |
| `module.isProprietary` + tier check | Business Advanced+ for HR | 🟡 Install-time only |
| `BusinessWorkspaceContent` case list | First-party business hub modules | ❌ Compile-time, not data-driven |
| `PositionAwareModuleProvider` DEFAULT_PERSONAL_MODULES | Personal nav | ❌ Hardcoded subset |
| `Module.businessId` | Developer org | ❌ Not install scope |
| Policy `resolveModuleScope()` | personal vs business from install metadata | ✅ At policy evaluation only |

---

## 9. Internal / admin modules

| Surface | Classification |
|---------|----------------|
| Admin Portal (`/admin-portal/*`) | **Not modules** — admin routes + `requireAdmin` |
| `admin-portal` AI pipeline, governance, etc. | Platform ops — no `Module` row |
| Built-in modules | Platform product modules — appear in marketplace DB |
| Sandbox pilot (`vssyl-pilot-assets`) | Special module id — partner testing |

**No `internal` or `admin` scope type** prevents a partner module from being marked platform-only or hides admin tools from marketplace.

---

## 10. Household scope

| Layer | Household support |
|-------|-------------------|
| Activity envelope | `householdId`, `visibility: household` |
| Search delegate contract | `household` in `supportedContexts` |
| Workspace participation | `household` allowed in manifest parser |
| Module install/runtime | **Only `personal` \| `business`** |
| Marketplace UI | No household scope toggle |

Household is **partially modeled** in subsystems but **not** in core module install lifecycle.

---

## 11. Summary matrix — “does scope exist?”

| Layer | Personal | Business | Both | Internal/Admin | Household |
|-------|----------|----------|------|----------------|-----------|
| DB model | 🟡 via install table | 🟡 via install table | ❌ | ❌ | ❌ |
| Manifest | 🟡 `supportedContexts` | 🟡 same | 🟡 declarable | ❌ | 🟡 sub-blocks only |
| Certification | 🟡 required count | 🟡 same | 🟡 not validated | ❌ | 🟡 in sub-parsers |
| Marketplace filter | ❌ | ❌ | ❌ | ❌ | ❌ |
| Install enforce | ❌ | ❌ | ❌ | ❌ | ❌ |
| Runtime enforce | ❌ | ❌ | ❌ | N/A | ❌ |
| Search delegate | ✅ | ✅ | ✅ | N/A | ✅ |
| Workspace bridge | ✅ | ✅ | ✅ | N/A | ✅ |
| Billing | ✅ personal sub | ✅ business sub | 🟡 dual paths | N/A | ❌ |

---

## 12. What is missing (exact list)

1. **Canonical `moduleScope` / `supportedContexts` enum** on manifest with certification validation (`personal` | `business` | `household` combinations).
2. **Prisma or indexed manifest field** for query/filter (optional denormalization).
3. **Marketplace API filter** — hide business-only modules from `scope=personal` browse.
4. **Install rejection** — `403` when `scope=business` but module lacks `business` in `supportedContexts`.
5. **Runtime guard** — align `getModuleRuntimeConfig` with manifest scope.
6. **Built-in scope table** — replace blanket “all built-ins installed personal” with per-module scope.
7. **Internal/admin classification** — flag for platform modules not in public marketplace.
8. **Admin Portal scope badge** — visible at review time (see alignment doc).
9. **Household install path** — if product intends household marketplace (deferred decision).

---

**Last updated:** 2026-06-24
