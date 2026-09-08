# Application Participation Runtime Verification — Phase 3C

**Program:** Platform Participation Reconciliation  
**Phase:** 3C — Runtime & Implementation Verification  
**Date:** 2026-09-08  
**Status:** Historical evidence — **not** architecture authority  
**Baseline commit:** `76c77c9788c7c2e3ec3a73e1e7252ec94e2f4c90`

> Architecture contracts (Phase 3B) define intended semantics. This report records **implementation reality** from static inspection and targeted tests. **No product code was changed.**

---

## 1. Purpose

Answer:

> Does the current Vssyl implementation behave consistently with the application-participation contracts established through Phase 3B?

Identify confirmed gaps, harmless/transitional differences, satisfied contracts, environment unknowns, and the **smallest** justified targeted implementation scope — without writing that phase.

---

## 2. Baseline and authority

| Item | Value |
|------|-------|
| HEAD / origin/main at start | `76c77c9788c7c2e3ec3a73e1e7252ec94e2f4c90` |
| Product language | `docs/product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md` (not modified) |
| Composition | `docs/architecture/APPLICATION_PARTICIPATION_COMPOSITION.md` |
| Capability / entity / realtime / interop / AuthZ | Platform Standards §19, `PLATFORM_ENTITY_MODEL.md`, `REALTIME.md`, `EXTERNAL_SYSTEM_INTEROPERABILITY.md`, `POLICY_ENGINE.md` |
| Prior evidence | Phase 1 / 2 / 3B audits (not rewritten) |
| Implementation truth | Code, configs, tests |

---

## 3. Verification methods

| Method | Used |
|--------|------|
| Static source inspection | Yes (manifests, registries, FE consumers, sockets, PE dual, integrations) |
| Targeted Vitest (server + web) | Yes — see §13 |
| Live multi-client realtime | **Deferred** (F) |
| Production DB / secrets | **Not used** |
| Local `Module` row inspection | **Deferred** (F) — reconcile covered by unit tests; no row mutations |

---

## 4. Executive findings

1. **Capability contract largely holds in runtime behavior:** BE `buildBuiltInModuleManifest` is the authoring authority; startup reconciles into `Module.manifest`; FE `coreModuleRegistry.capabilities` are **not used for gating** (PRESENTATION_ONLY / unused). Wide FE↔BE drift is **representation debt (B)**, not AuthZ risk.
2. **Search runtime gate is SearchProvider readiness** — confirmed in `searchCapabilityService`. Entity registry `supportsSearch` drifts for Scheduling/HR/Workforce while search **works** — metadata-only (B).
3. **Realtime:** Chat hub is transport implementation; Scheduling hub usage without claim **conforms** to `REALTIME.md`. Claimed modules are mostly aligned statically; partial gaps on adapter boundary (Drive direct hub), Todo (no web consumer), Chat legacy socket `new_message`, Place listing target smell — mostly **D/partial**, not proven E without multi-client runtime.
4. **AuthZ vs presentation:** BCC/modulePermissions do **not** grant server authority. Direct API still hits JWT + legacy + PE dual. No FE-as-security path found on sampled modules.
5. **External-system interop:** **No** platform reference adapter (**NONE**). Domain-local / infrastructure candidates only.
6. **Dashboard / Analytics:** No participation-contract change justified. No generic contribution AnalyticsProvider.
7. **Minimum justified implementation** is small: FE capability sync/remove, optional resolver helper, registry `supportsSearch` alignment for BO modules — **not** a participation subsystem rewrite.

---

## 5. Capability verification

### Representation inventory

| Representation | Path / artifact | Role |
|----------------|-----------------|------|
| Canonical BE builder | `server/src/startup/builtInModuleManifests.ts` (`BuiltInManifestCapabilities`, `buildBuiltInModuleManifest`) | **Authoring authority** |
| Reconcile | `reconcileBuiltInManifest` → `registerBuiltInModulesOnStartup` | Persisted projection into `Module.manifest` |
| Partner claims | marketplace search/workspace/activity manifest helpers | Partner capability keys |
| FE registry | `web/src/runtime/modules/coreModuleRegistry.ts` (`ModuleCapability[]`) | Presentation projection |
| Legacy seed manifests | `seed*Module.ts` `features` blobs | Older; overwritten on reconcile |
| Workspace bridge | `shared/.../workspace-bridge.ts` capabilities | Partner embed — not FE registry |

### FE consumer audit

| Consumer | Classification | Notes |
|----------|----------------|-------|
| `coreModuleRegistry` capability arrays | PRESENTATION_ONLY | Authored; not read for workspace decisions |
| `workspaceRuntimeHelpers` / mounts | N/A (no capability reads) | Uses install/status/permissions |
| Registry unit tests asserting caps | UNUSED (tests only) | `moduleRegistry.test.ts`, workforce test |
| Business AI / model-routing `.capabilities` | Not module-contract | Homonyms |

**AUTHORIZATION_RISK for FE module capabilities:** none found.

### All-module drift matrix (built-ins)

| Module | BE vs FE | Consumer impact | Reconciliation |
|--------|----------|-----------------|----------------|
| drive | Match | None | Optional derive/remove only |
| chat | FE sparse (read/write/realtime) | Cosmetic | Yes — sync or remove FE |
| calendar | FE sparse | Cosmetic | Yes |
| todo | FE partial | Cosmetic | Yes |
| notebook | FE missing search/operationalLinks | Cosmetic | Yes |
| notes | FE sparse | Cosmetic | Yes |
| vlink | FE partial | Cosmetic | Yes |
| place | FE sparse | Cosmetic | Yes |
| dashboard | FE sparse | Cosmetic | Yes |
| hr | FE invents `admin`; missing many BE keys | Vocabulary drift | Yes |
| scheduling | FE sparse; BE correctly omits realtime | Cosmetic + intentional realtime | Sync FE or remove |
| workforce_comms | FE missing search | Cosmetic | Minor |

FE-only pseudo-modules (ai, analytics widgets, etc.) are not BE built-in IDs — document, don’t invent BE rows casually.

### Resolver status

- `resolveModuleCapabilities()`: **does not exist** in code (docs/plans only).
- Equivalents: `reconcileBuiltInManifest` (author→DB); partner `declaresCapability` / readiness helpers; adoption validation reads **builder** directly.
- Precedence today: builder → DB reconcile → FE unused for claims.

### Persisted manifest reconciliation

- Startup `ensureModuleExists` updates/creates with reconciled manifest when JSON differs.
- Unit tests cover reconcile merge semantics (drive/chat patterns) and per-module claim assertions.
- Live DB row audit: **deferred (F)**.

---

## 6. Entity metadata verification

### Search matrix (summary)

Runtime gate confirmed:

```ts
// searchCapabilityService.resolveProvidersForFilters
// filters.moduleId → provider.readiness === 'ready'
// else getReadySearchProviders()
```

| Area | Status |
|------|--------|
| drive / chat / calendar / todo / notes / notebook / place (listing) | Cap + Ent + Reg + ready provider generally aligned (some type-string naming drift) |
| scheduling schedule/shift | Cap.search + Ent.supportsSearch true; **Reg.supportsSearch false**; provider **ready** → **DRIFT (metadata)** |
| hr searchable entities | Same pattern → **DRIFT (metadata)** |
| workforce_comms | Same pattern → **DRIFT (metadata)** |
| dashboard | Cap/Ent search; ready provider; **no** platform entity registry entries |
| place meeting | supportsSearch false intentionally; provider listings-only |

Registry tests for scheduling/HR currently **assert** `supportsSearch: false` — drift is locked by tests as current truth, not accidental CI failure.

### Other descriptor consistency

| Topic | Finding | Class |
|-------|---------|-------|
| Trash / handlers | Mostly aligned; dashboard lacks Global Trash handler; scheduling TH includes `schedule_template` ahead of Ent | B / D |
| V_Link | Notes/notebook NOTE without Cap.vlink (notebook intentional) | D / B |
| Preview | Drive-only Cap.preview; no entity preview flag | A |

**Runtime impact of Search Reg drift:** **None** for built-in Unified Search inclusion (provider readiness gates). Misleading for audits/certification views.

---

## 7. Realtime verification

### Transport inventory

- **Hub:** `chatSocketService` (current transport implementation).
- **Adapters:** drive, chat, calendar, todo, place (+ businessConfig).
- **Direct hub (no module adapter):** some Drive controllers/services; Scheduling admin/publish/trash; platform notifications/activity/domain-event sockets.
- **Web:** `realtimeClient`, Drive/Place/Scheduling hooks; calendar via `chatSocket.onRaw`; **no** Todo websocket hook.

### Claim/conformance matrix (static)

| Module | Claim | Static vs REALTIME §D |
|--------|-------|------------------------|
| calendar | true | **Strong** |
| chat | true | Mostly; legacy socket `new_message` path is a gap vs “mutations via services” |
| drive | true | Partial — adapter incomplete; many direct hub emits |
| todo | true | Partial — server fan-out, **no web consumer** |
| place | true | Partial — listing broadcast target smell (`businessId` as user room) |
| scheduling | **false** | **Conforms** as transport usage without claim |

### Scheduling case

| Check | Result |
|-------|--------|
| Manifest omits realtime | **Yes** (builder + `builtInModuleManifests.scheduling.test.ts`) |
| Socket traffic | **Yes** — publish/shift CRUD/trash → hub |
| Mutation-first | **Yes** (persist then broadcast; try/catch isolation) |
| Client consumer | **Yes** — `useSchedulingWebSocket` |
| Code assumes capability claim | **No** FE capability gating found |
| Matches Phase 3B treatment | **Yes** |

### Runtime gaps

Multi-client live fan-out / room isolation: **F** (not executed in this phase).

---

## 8. Authorization vs presentation verification

### File Hub

UI (BCC / permission snapshot) → `/api/drive` → JWT → legacy canWrite* → `evaluateDrivePolicyDual` → services.  
FE hide ≠ AuthZ. Direct API still authorized server-side.

### Scheduling

UI + workspace mount → `/api/scheduling` → JWT + scheduling permission middleware → `evaluateSchedulingPolicyDual` → services.  
Dual **blocks** security denies; `POLICY_NOT_IMPLEMENTED` does **not** block (legacy remains — **D** transitional PE).

### Chat

UI → `/api/chat` → JWT → participant checks → `evaluateChatPolicyDual` → services. Same pattern.

### Security issues found

| Finding | Class |
|---------|-------|
| FE/BCC as AuthZ | **Not found** (A) |
| UI-only security | **Not found** on sampled paths |
| Incomplete PE coverage | **D** — known dual-enforcement design, not Phase 3C FE defect |

---

## 9. External-system interoperability inventory

### Candidates / classification

| Candidate | Class |
|-----------|-------|
| Stripe billing / payment webhooks | **C** infrastructure |
| GCS / storageService | **C** |
| OpenAI / Anthropic | **C** |
| Postmark / SMTP | **C** |
| Google OAuth / Workspace | **B** domain-local identity |
| SSOIntegrationService stubs | **B** / incomplete |
| HR↔calendar internal sync | **B** / internal Vssyl bridges |
| Business outbound webhooks | **B** |
| Partner modules / JWT delegates | **D** |
| POS / payroll / accounting connectors | **E** (none found) |

### Contract gaps (A/B)

Domain-local identity connections lack a full Phase 3B provenance/freshness/disconnect/SoR declaration model. Not retrofitted here.

### Reference-adapter assessment

**NONE** — no implementation qualifies as the platform reference external-system adapter today.

---

## 10. Dashboard verification

| Check | Result |
|-------|--------|
| Generic Dashboard contribution registry | **No** |
| `DashboardProvider` React context | Exists as **dashboard chrome/state** — not a contribution registry |
| Widgets | Bespoke projections via `WIDGET_REGISTRY` → domain APIs |
| SoR | Modules own data; Dashboard owns layout |
| Auth | Domain APIs / PE |
| Deep links | Present (Drive/Chat examples) |
| Architecture change needed | **NO** |

---

## 11. Analytics sanity check

- Pattern matches **domain metrics → platform aggregation/facade** (`analyticsCapabilityService`, dashboard summary).
- **No AnalyticsProvider** architecture.
- Scheduling labor/coverage admin analytics: **501 stubs**; separate working dashboard-summary counts for widgets.
- Contract change needed: **NO**.

---

## 12. Partner capability verification

- Optional Search/workspace/activity delegates **default OFF** (env flags).
- Certification requires claimed capabilities to match manifests/delegates.
- Partners **need not** implement every capability.
- Pilot `vssyl-pilot-assets` is **not** a complete partner product SPA.
- Result: contract completeness rule **holds**; pilot completeness gap remains **G**/product.

---

## 13. Tests executed

| Command | Result |
|---------|--------|
| `pnpm --filter vssyl-server exec vitest run` … manifests (scheduling, calendar, todo, drive) + PolicyDual (drive, chat, scheduling) + searchProviderRegistry + entity registry (scheduling, hr) + chat/calendar realtime + searchWave2Discovery | **PASS** (all targeted files) |
| `pnpm --filter vssyl-web exec vitest run src/runtime/__tests__/moduleRegistry.test.ts src/runtime/__tests__/runtimeRealtime.test.ts` | **PASS** (11 tests) |
| `pnpm security:secrets` | **PASS** (no leaks) |
| Broad `pnpm test` / e2e / type-check | **SKIPPED** (not required; no code changed) |
| Multi-client realtime / live Module DB audit | **SKIPPED / F** |

Relevant failures: **none** in targeted suites.

---

## 14. Confirmed implementation gaps

| ID | Classification | Item |
|----|----------------|------|
| CAP-1 | **B** | FE capability arrays drift from BE on nearly all built-ins; unused for gating |
| CAP-2 | **C** | `resolveModuleCapabilities()` absent (documented target) |
| CAP-3 | **A** | BE builder + startup reconcile path |
| CAP-4 | **A** | FE capabilities not AuthZ |
| SRCH-1 | **B** | Scheduling/HR/Workforce Reg.supportsSearch false vs ready providers + Ent true |
| SRCH-2 | **A** | SearchProvider readiness is runtime gate |
| SRCH-3 | **B** | Dashboard entities not in platformEntityRegistry |
| RT-1 | **A** / **D** | Scheduling non-claim + hub usage conforms |
| RT-2 | **D** / partial | Drive direct hub bypass of adapter |
| RT-3 | **B** / partial | Todo claims realtime without web consumer |
| RT-4 | **D** | Chat legacy `new_message` socket path |
| RT-5 | **F** | Multi-client runtime isolation unproven here |
| AUTH-1 | **A** | Presentation ≠ AuthZ on Drive/Chat/Scheduling samples |
| AUTH-2 | **D** | PE dual `POLICY_NOT_IMPLEMENTED` non-blocking (known) |
| EXT-1 | **A** / **G** | No platform external adapter; inventory only |
| EXT-2 | **G** | Reference adapter = NONE until product builds one |
| DASH-1 | **A** | Bespoke projections; no architecture change |
| AN-1 | **A** | No AnalyticsProvider; no contract change |
| PART-1 | **A** / **G** | Capability-optional rule holds; pilot incomplete as product |

**E (implementation defect with runtime risk):** none confirmed for participation-contract reconciliation. Conservative: Chat socket send and Place listing room target are **legacy/smell (D)** pending focused review — not classified E without exploit/runtime proof in this phase.

---

## 15. Runtime/environment unknowns

1. Live multi-client realtime fan-out / cross-tenant room isolation under load.
2. Persisted production/staging `Module.manifest` JSON vs builder after reconcile (local unit-tested only).
3. Partner delegates with env flags enabled in a real marketplace install.
4. Google OAuth / SSO paths end-to-end against live IdP (not exercised).

---

## 16. Recommended targeted implementation scope

Smallest evidence-backed scope (**do not implement here**):

1. **Synchronize or remove** FE `coreModuleRegistry.capabilities` projections from BE manifests (or generate them) — CAP-1.
2. **Optionally implement** `resolveModuleCapabilities()` as a thin reader of canonical/persisted claims (not a second authoring path) — CAP-2; only if consumers need it (today few do beyond adoption/partner).
3. **Align** `platformEntityRegistry.supportsSearch` for scheduling / HR / workforce searchable entities to `true` (and update tests that lock `false`) — SRCH-1.
4. **Optional hygiene (not required for participation):** Drive realtime emit consolidation through adapter; Todo client consumer or claim revisit; Chat `new_message` path review — RT-2/3/4.

**Explicitly out of minimum scope:** external connectors, DashboardProvider, AnalyticsProvider, Scheduling realtime claim, PE full cutover, role-aware UX, workspace switch rewrite.

---

## 17. Readiness for targeted implementation

**READY**

Contracts are clear; gaps are small and mostly metadata/projection. Next phase can be narrow and evidence-backed.

---

## Targeted questions (explicit answers)

1. **Are FE capability arrays safe to remove or derive?** **Yes for gating** — no runtime consumers found. Safe to derive/sync/remove after updating registry unit tests that assert hardcoded arrays.
2. **Is `resolveModuleCapabilities()` genuinely needed?** **Not urgently for FE gating.** Useful as a single read helper for adoption/cert/admin if multiple call sites grow; today reconcile + direct builder reads suffice. Implement only if a concrete consumer needs unified resolution.
3. **Which exact module/entity metadata values currently drift?** Scheduling `schedule`/`shift`; HR `employee_profile`/`time_off_request`/`onboarding_journey`; Workforce `communication`/`campaign` — Reg.supportsSearch **false** while Ent true + ready provider. Plus FE capability string arrays vs BE for most modules.
4. **Does Scheduling’s realtime behavior conform to the new contract?** **Yes** (usage without claim; mutation-first; client present).
5. **Do current `realtime: true` modules appear to satisfy the contract?** **Partially** — calendar strong; chat/drive/todo/place have static gaps noted; full runtime certification not claimed here.
6. **Does any current UI gating function as accidental authorization?** **No** on sampled Drive/Scheduling/Chat paths.
7. **What current integrations qualify as external-system interoperability?** **None as platform A.** Closest **B**: Google OAuth/Workspace, SSO stubs, outbound webhooks.
8. **Is there a viable reference external-system adapter today?** **NONE.**
9. **Does Dashboard need ANY architectural change based on runtime evidence?** **NO.**
10. **Does Analytics need ANY participation-contract change based on implementation evidence?** **NO.**
11. **What is the minimum code reconciliation now justified?** FE capability projection sync/remove; optional capability resolver helper; Scheduling/HR/Workforce registry `supportsSearch` alignment (+ test updates).

---

**Last updated:** 2026-09-08
