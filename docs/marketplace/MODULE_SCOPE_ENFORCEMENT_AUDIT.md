# Module Scope — Enforcement Audit

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5  
**Date:** 2026-06-24  
**Status:** Gap analysis — **gaps G-01–G-05, G-07–G-08 closed in Phase 1B-E.5-F**  
**Implementation:** [MODULE_SCOPE_ENFORCEMENT.md](./MODULE_SCOPE_ENFORCEMENT.md)  
**Companion:** [MODULE_SCOPE_CLASSIFICATION_REVIEW.md](./MODULE_SCOPE_CLASSIFICATION_REVIEW.md)

---

## 1. Audit method

For each platform surface, verified whether **manifest-declared scope** (or equivalent) is **read and enforced**, or whether only **install-context** (query param + membership) applies.

**Legend:** ✅ Enforced · 🟡 Partial · ❌ Not enforced · N/A Not applicable

---

## 2. Enforcement matrix

| Surface | Reads manifest scope? | Enforces scope? | Mechanism today | Gap |
|---------|----------------------|-----------------|-----------------|-----|
| **Marketplace browse** (`getMarketplaceModules`) | ❌ | ❌ | Returns all `APPROVED` modules; client `scope` affects install **status** only | Business-only modules visible in personal browse |
| **Marketplace install** (`installModule`) | ❌ | ❌ | `scope` query → correct install table + membership/policy | Can install business-only partner module to personal |
| **Installed list** (`getInstalledModules`) | ❌ | 🟡 | Personal: built-ins + `ModuleInstallation`; Business: `BusinessModuleInstallation` | Built-ins always “installed” personal regardless of true scope |
| **Runtime config** (`getModuleRuntimeConfig`) | ❌ | 🟡 | Requires install row for scope; entitlement for business | No manifest scope check |
| **Personal dashboard nav** (`PositionAwareModuleProvider`) | ❌ | ❌ | Hardcoded `DEFAULT_PERSONAL_MODULES` + installed personal | Business modules may appear if personally installed |
| **Business workspace hub** (`BusinessWorkspaceContent`) | ❌ | 🟡 | Static first-party `case` list + partner default embed | Non-business modules not blocked by scope |
| **Policy Engine** (`module:install`) | 🟡 | 🟡 | `resolveModuleScope()` from metadata / businessId | Does not read manifest `supportedContexts` |
| **Billing — personal** (`ModuleSubscription`) | ❌ | 🟡 | Subscription check on personal runtime | No scope alignment |
| **Billing — business** (`BusinessModuleSubscription`) | ❌ | 🟡 | Entitlement on business runtime | No scope alignment; proprietary tier gate separate |
| **Search delegate registration** | ✅ | ✅ | `parseSearchDelegateFromManifest` + registry load on publish | Sub-contract only; top-level scope not checked |
| **Search delegate query** | ✅ | ✅ | `searchDelegateProxy` — `supportedContexts.includes(active)` | ✅ Reference pattern for enforcement |
| **Workspace bridge registration** | ✅ | ✅ | `parseWorkspaceParticipationFromManifest` | Sub-contract only |
| **Workspace bridge init** | ✅ | 🟡 | JWT binds tenant; built-ins rejected | Context must match participation block |
| **Activity ingest** (future) | 📋 | 📋 | Designed in 1B-E | Not implemented |
| **AI context providers** | ❌ | 🟡 | Registry sync; G1–G7 certification | No scope on provider fetch |
| **Certification validator** | ✅ | 🟡 | Requires ≥1 context string | Does not validate allowed values or block wrong-scope install |

---

## 3. Surface-by-surface detail

### 3.1 Marketplace visibility

**Path:** `GET /api/modules/marketplace?scope=personal|business&businessId=`

| Behavior | Detail |
|----------|--------|
| Filters modules by scope | ❌ No `WHERE manifest` filter |
| Scope param usage | Install status computation, subscription join |
| Built-in handling | All `BUILT_IN_MODULE_IDS` marked installed in personal scope |

**Gap G-M01:** Personal marketplace lists modules that declare only `business` in `supportedContexts`.

---

### 3.2 Installation flow

**Path:** `POST /api/modules/:moduleId/install?scope=...`

| Check | Enforced? |
|-------|-----------|
| Module `APPROVED` | ✅ |
| Business membership + role | ✅ (business scope) |
| Policy Engine dual | ✅ |
| Subscription / tier | ✅ (paid/proprietary) |
| Manifest `supportedContexts` includes install scope | ❌ |

**Gap G-I01:** Install succeeds for wrong scope — only install **table** differs.

**Gap G-I02:** No `household` install scope exists.

---

### 3.3 Runtime activation

**Path:** `GET /api/modules/:moduleId/runtime?scope=...`

| Check | Enforced? |
|-------|-----------|
| Install exists for scope | ✅ |
| Business entitlement | ✅ |
| Manifest scope match | ❌ |

**Gap G-R01:** Runtime can activate in a scope the module did not declare if install row exists.

---

### 3.4 Business workspace

**Path:** `BusinessWorkspaceContent.tsx` → `case` per first-party module; `default` → `PartnerModuleWorkspaceEmbed`

| Module type | Behavior |
|-------------|----------|
| First-party | Hardcoded cases (hr, scheduling, …) |
| Partner | Embed if installed for business |

**Gap G-W01:** No manifest check that module supports `business` workspace before embed.

**Gap G-W02:** `analytics` case exists but `analytics` not in `BUILT_IN_MODULE_IDS` — drift risk.

---

### 3.5 Personal dashboard

Built-in list and `getInstalledModules({ scope: 'personal' })` drive availability.

**Gap G-P01:** `hr`, `scheduling`, `workforce_comms` treated as personal-installed via built-in blanket rule.

---

### 3.6 Billing

| Path | Scope tie-in |
|------|--------------|
| Personal subscribe | `ModuleSubscription` — user-scoped |
| Business subscribe | `BusinessModuleSubscription` — business-scoped |
| `moduleRequiresBusinessSubscription()` | Pricing heuristic — **not** manifest scope |

**Gap G-B01:** Paid business module could theoretically lack `business` in `supportedContexts` but still require business subscription.

---

### 3.7 Search delegate registration

**Reference implementation** for scope enforcement:

```typescript
// searchDelegateProxy.ts — pattern to replicate platform-wide
registration.supportedContexts.includes(activeScope)
```

Registration loads from manifest on publish; disabled if not `APPROVED` or allowlist blocks.

**Gap G-S01:** Module can lack top-level `business` in `supportedContexts` but still register search delegate with `business` — inconsistent classification.

---

### 3.8 Workspace bridge registration

Same pattern as search: manifest sub-block with `supportedContexts`.

**Gap G-S02:** Workspace participation can declare `business` while top-level manifest infers `personal` only.

---

### 3.9 Certification system

| Rule | Enforces scope? |
|------|-----------------|
| `supportedContexts` non-empty | ✅ Structural |
| Valid enum values (`personal`, `business`, `household`) | ❌ |
| `business`-only cannot claim personal routes | ❌ |
| Internal modules excluded from marketplace | ❌ |

**Gap G-C01:** Certification passes with inconsistent or misleading context keys.

---

## 4. Cross-cutting gaps (prioritized)

| ID | Severity | Gap | Impact |
|----|----------|-----|--------|
| **G-01** | **P0** | No install-time scope validation | Wrong-scope installs; support burden |
| **G-02** | **P0** | Marketplace does not filter by scope | Users see/install incompatible modules |
| **G-03** | **P1** | Built-in blanket personal install | Business modules appear personal-installed |
| **G-04** | **P1** | No canonical enum validation in certification | Manifest drift |
| **G-05** | **P1** | Sub-capability scopes can contradict top-level | Search/workspace vs install mismatch |
| **G-06** | **P2** | No household install lifecycle | Household declared but not actionable |
| **G-07** | **P2** | No internal/admin module flag | Cannot mark platform-only modules |
| **G-08** | **P2** | Runtime does not re-check scope | Stale installs after manifest change |

---

## 5. Enforcement target state

```
manifest.supportedContexts (canonical, enum-validated)
        │
        ├── certification gate (fail if empty / invalid)
        ├── marketplace filter (browse)
        ├── install reject (wrong scope)
        ├── runtime guard (scope param)
        ├── searchDelegate.supportedContexts ⊆ manifest
        ├── workspaceParticipation.supportedContexts ⊆ manifest
        └── activityIngest.supportedContexts ⊆ manifest (future)
```

---

## 6. Recommended enforcement order (implementation phase)

| Phase | Deliverable |
|-------|-------------|
| E.5-F1 | Enum validation in `moduleCertificationValidator` |
| E.5-F2 | `assertModuleSupportsInstallScope(module, scope)` on install |
| E.5-F3 | Marketplace `where`/post-filter by scope |
| E.5-F4 | Per-built-in scope map replacing blanket personal install |
| E.5-F5 | Sub-capability ⊆ superset validation |
| E.5-F6 | Admin Portal scope badge + mismatch warnings |

---

**Last updated:** 2026-06-24
