# Module Scope Enforcement

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5-F  
**Date:** 2026-06-24  
**Status:** ✅ Implemented

---

## 1. Enforcement layers

| Layer | Implementation | Fail behavior |
|-------|----------------|---------------|
| **Certification** | `validateModuleScopeManifest` in `moduleCertificationValidator.ts` v1.3.0 | Certification `failed` — blocks publish |
| **Marketplace browse** | `getMarketplaceModules` filters by `moduleScopeVisibleInMarketplace` | Module omitted from list |
| **Install** | `assertModuleInstallScopeAllowed` in `installModule` | `403` + reason |
| **Runtime** | `assertModuleInstallScopeAllowed` in `getModuleRuntimeConfig` | `403` + reason |
| **Business entitlement** | `evaluateBusinessModuleEntitlement` scope check | `403` — scope not business-compatible |
| **Search delegate** | Existing `searchDelegateProxy` context filter + certification ⊆ check | Query skip / cert fail |
| **Workspace bridge** | Certification ⊆ check + existing JWT tenant binding | Cert fail / bridge reject |
| **Built-in personal list** | `builtInModuleAvailableForPersonalScope` | HR/scheduling not auto-installed personal |

---

## 2. Core service

**`server/src/marketplace/moduleScopeService.ts`**

| Function | Purpose |
|----------|---------|
| `validateModuleScopeManifest` | Enum + alignment validation |
| `resolveEffectiveModuleScope` | Runtime resolution (manifest + built-in map) |
| `assertModuleInstallScopeAllowed` | Install/runtime gate |
| `moduleScopeVisibleInMarketplace` | Browse filter |
| `validateSubCapabilityContexts` | Search/workspace ⊆ manifest |

---

## 3. Examples

| moduleScope | `scope=personal` install | `scope=business` install | Marketplace personal | Marketplace business |
|-------------|--------------------------|--------------------------|----------------------|----------------------|
| personal | ✅ | ❌ | ✅ | ❌ |
| business | ❌ | ✅ | ❌ | ✅ |
| both | ✅ | ✅ | ✅ | ✅ |
| internal | ❌ | ❌ | ❌ | ❌ |

---

## 4. Tests

- `server/src/marketplace/__tests__/moduleScopeService.test.ts`
- `server/src/services/__tests__/moduleCertificationValidator.test.ts` (scope cases)
- `server/src/services/__tests__/businessModuleSubscriptionService.test.ts` (entitlement scope)

---

## 5. Gap closure (from 1B-E.5 audit)

| Gap ID | Status |
|--------|--------|
| G-01 Install validation | ✅ |
| G-02 Marketplace filter | ✅ |
| G-03 Built-in personal blanket | ✅ |
| G-04 Enum validation | ✅ |
| G-05 Sub-capability ⊆ | ✅ |
| G-06 Household install | ⏸ Deferred |
| G-07 Internal flag | ✅ (`internal` scope) |
| G-08 Runtime guard | ✅ |

---

**Last updated:** 2026-06-24
