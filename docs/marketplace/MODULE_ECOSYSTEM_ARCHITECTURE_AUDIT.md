# Module Ecosystem — Architecture Audit

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only  
**Authority:** [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md)

---

## 1. Purpose

Audit how Vssyl represents, registers, loads, and executes modules today — and how that architecture aligns with the constitutional platform model (Runtime Kernel + module contract + platform capabilities).

---

## 2. Architectural model (as designed)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vssyl Platform (Cloud Run)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Runtime      │  │ Platform     │  │ First-party modules    │ │
│  │ Kernel       │  │ Capabilities │  │ (in-process monorepo)  │ │
│  │ Activity, DE │  │ Search, AI   │  │ drive, chat, todo, …   │ │
│  │ PE, Entities │  │ Retrieval, CG│  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Marketplace Layer                                            │ │
│  │ Module DB · Install records · Version/Artifact · Review     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    signed URL / HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Third-party module (out-of-process)                 │
│  Sandboxed iframe OR GCS zip bundle (ModuleHost blob URL)       │
│  Partner HTTPS APIs for data + AI context providers             │
└─────────────────────────────────────────────────────────────────┘
```

**Locked decision:** No in-process third-party code (`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`, `third-party-modules.mdc`).

---

## 3. Module representation — dual registry problem

Vssyl maintains **two parallel module representation systems**:

| Registry | Location | Scope | Dynamic? |
|----------|----------|-------|----------|
| **Marketplace DB registry** | `Module`, `ModuleVersion`, `ModuleInstallation` | All installable modules | ✅ Third-party + built-in |
| **Workspace runtime registry** | `web/src/runtime/modules/coreModuleRegistry.ts` | First-party workspace rendering | ❌ Hardcoded |
| **Built-in startup registry** | `server/src/startup/registerBuiltInModules.ts` | Ensures DB rows + AI context | ❌ 12 built-in IDs |
| **Search provider registry** | `server/src/services/search/searchProviderRegistry.ts` | Global search | ❌ Static array |
| **Context Graph adapter registry** | `server/src/context-graph/adapterRegistry.ts` | Graph federation | ❌ Static array |

**Finding:** Marketplace modules exist in the database but **do not automatically appear** in workspace runtime, search, or context graph unless platform engineers add compile-time registrations.

---

## 4. Module manifests — source of truth

### 4.1 Manifest storage

| Field | Location | When used |
|-------|----------|-----------|
| `Module.manifest` | Prisma JSON column | Legacy + draft; fallback for runtime |
| `ModuleVersion.manifestSnapshot` | Immutable on publish | **Authoritative** for approved versions |
| `builtInModuleManifests.ts` | Code | First-party reconcile at startup |

### 4.2 Manifest schema (effective)

Key sections validated by `moduleCertificationValidator.ts` (v1.1.0):

```typescript
{
  name: string;
  version: string;          // semver
  description?: string;
  runtime: { apiVersion: string };
  frontend: {
    entryUrl?: string;      // HTTPS hosted
    bundleRuntime?: boolean;
    entryPath?: string;     // default index.html
  };
  permissions: string[];
  dependencies?: string[];
  capabilities?: string[];
  contexts?: ('personal' | 'business' | 'household')[];
  aiContext?: ModuleAIContext;
  aiActionExecutor?: { webhookUrl, hmacSecretRef, ... };
  notifications?: NotificationMetadata[];
  entities?: EntityDeclaration[];  // V_Link (first-party enforced in-process)
  settings?: Record<string, unknown>;
}
```

### 4.3 Forbidden patterns (third-party)

- Manifest keys: `backend`, `serverRuntime`, `executeOnServer`, `nodeIntegration`
- Capability strings matching: `in-process`, `raw-database`, `vssyl-server`, etc.

---

## 5. Registration process

### First-party (built-in)

1. Add module id to `server/src/constants/builtInModuleIds.ts`
2. Add definition to `registerBuiltInModules.ts` + `builtInModuleManifests.ts`
3. Implement in-process routes, controllers, workspace landing
4. On server startup: upsert `Module` row (APPROVED) + `ModuleAIContextRegistry`
5. Optionally add to `searchProviderRegistry`, `adapterRegistry`, V_Link resolver

### Third-party (marketplace)

1. Developer `POST /api/modules/submit` → `Module` (PENDING) + `ModuleSubmission`
2. Artifact: `uploads/init` → GCS PUT → `uploads/finalize` → `ModuleVersion` (READY_FOR_REVIEW)
3. Baseline zip scan + advisory certification on finalize
4. Admin review → certification gate → `PUBLISHED` + `isCurrent`
5. `ModuleRegistrySyncService.syncModule` → AI context registry
6. User install → runtime via `ModuleHost`

**Gap:** Steps 5–6 do not propagate to search/CG/V_Link/workspace registries.

---

## 6. Loading process

| Module class | UI load path | Data path |
|--------------|--------------|-----------|
| **First-party** | `BusinessWorkspaceContent` switch / personal routes | In-process Express routes |
| **Third-party** | `/modules/run/:moduleId` → `ModuleHost` iframe | Partner HTTPS APIs (external) |
| **Built-in "always available"** | Same as first-party | In-process; may skip `ModuleInstallation` row |

Frontend client: `web/src/api/modules.ts` — native `fetch` to `/api/modules/*` via Next.js proxy.

Runtime resolution (`moduleRuntimeController.ts`):

1. Verify install + APPROVED status + subscription (if paid)
2. Resolve current `PUBLISHED` `ModuleVersion` or legacy manifest
3. Issue GCS signed read URL for bundle (15 min TTL)
4. Return sanitized config (no secrets)

---

## 7. Activation process

| Stage | Trigger | Result |
|-------|---------|--------|
| **Submit** | Developer | PENDING module, non-installable |
| **Scan pass** | Finalize | Artifact `scanStatus: PASSED` |
| **Admin approve** | Review action | Version PUBLISHED, module APPROVED |
| **Install** | User/business admin | Installation record created |
| **Configure** | User | `enabled: true/false`, settings JSON |
| **Runtime** | User opens module | Iframe/bundle load |
| **Suspend** | Admin | Module hidden from marketplace; runtime blocked |
| **Rollback** | Admin promote-previous | Prior version becomes current |

Certification gate (`moduleVersionCertificationGate.ts`) blocks approve/promote on hard errors.

---

## 8. Alignment with platform standards

| Standard | First-party | Third-party | Gap |
|----------|-------------|-------------|-----|
| **authorize → execute → emit → notify** | ✅ Enforced in code | ⚠️ Contract + manual review | No runtime verification |
| **Tenant scoping** | ✅ dashboardId/businessId | ⚠️ Partner responsibility | No automated audit |
| **Normalized activity events** | ✅ `emitModuleActivityEvent` | ❌ No ingest API | Partners cannot feed platform feed |
| **Module interoperability contract** | ✅ Reference: File Hub | ⚠️ Structural cert only | Runtime behavior unchecked |
| **Platform capability participation** | ✅ Static registration | ❌ No dynamic hooks | Major architectural gap |
| **No in-process partner code** | N/A | ✅ Enforced | Correct isolation model |

---

## 9. Architecture risks

| ID | Risk | Severity | Mitigation path |
|----|------|----------|-----------------|
| **ME-A01** | Dual registry drift (DB vs workspace runtime) | High | Marketplace module resolver in workspace runtime |
| **ME-A02** | Static capability registries block ecosystem | Critical | Phase 2 delegate APIs (search, CG) |
| **ME-A03** | Business workspace excludes third-party modules | High | ModuleHost embed in workspace or deep-link contract |
| **ME-A04** | V_Link requires in-process resolver | High | Partner entity proxy or deferred V_Link for partners |
| **ME-A05** | Duplicate admin API surfaces | Medium | Consolidate to admin-portal canonical |
| **ME-A06** | Legacy hosted URL path bypasses artifact immutability | Medium | Enforce 90-day cutoff policy |
| **ME-A07** | `coreModuleRegistry` normalization aliases hide module id errors | Low | Stricter id validation at install |

---

## 10. Reuse vs. rebuild recommendation

**Do not rebuild the marketplace.** Extend existing layers:

1. Add **marketplace module adapter** to workspace runtime (resolve installed third-party modules from API, not hardcoded registry)
2. Add **dynamic search delegate registration** from published manifest (Phase 2 per Search compliance doc)
3. Fix **BusinessModuleSubscription** write path before business paid modules
4. Extend **postMessage bridge** in `ModuleHost` for platform auth token handoff (if needed)
5. Consolidate admin APIs under `/api/admin-portal/modules`

---

## 11. File reference index

| Concern | Primary files |
|---------|---------------|
| API routes | `server/src/routes/module.ts` |
| Controllers | `server/src/controllers/module/*.ts` |
| Prisma models | `prisma/modules/business/modules.prisma` |
| Built-in registration | `server/src/startup/registerBuiltInModules.ts`, `builtInModuleManifests.ts` |
| Certification | `server/src/services/moduleCertificationValidator.ts`, `moduleVersionCertificationGate.ts` |
| Runtime host | `web/src/components/ModuleHost.tsx` |
| Workspace runtime | `web/src/runtime/modules/`, `web/src/components/business/BusinessWorkspaceContent.tsx` |
| Pipeline spec | `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md` |

---

**Last updated:** 2026-06-23
