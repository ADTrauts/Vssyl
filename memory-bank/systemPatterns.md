# System Patterns

**Last verified:** 2026-09-03  
**Role:** Compact pattern index — durable rules + pointers  
**Authority:** Canonical architecture docs and `.cursor/rules` win. This file is **not** a second architecture handbook.

Historical encyclopedia body: [`docs/archive/session-summaries/system-patterns-archive-2026-09-pretrim.md`](../docs/archive/session-summaries/system-patterns-archive-2026-09-pretrim.md).

---

## How to use this file

1. Identify the pattern that matches the change.  
2. Follow the **canonical owner** (architecture doc and/or rule).  
3. Confirm behavior in **code** before treating Memory Bank prose as current.  
4. Treat the legacy table as **exceptions**, not recommended design.

Platform-wide contract overview: [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md). Architecture map: [`VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md).

---

## Pattern index

| Pattern | Durable rule | Canonical owner | Key implementation |
|---------|--------------|-----------------|-------------------|
| Actor identity / auth | Resolve actor from verified auth; treat client-supplied IDs as untrusted | [`api-and-auth.mdc`](../.cursor/rules/api-and-auth.mdc), [`backend-trust-boundaries.mdc`](../.cursor/rules/backend-trust-boundaries.mdc) | NextAuth / JWT; Express `req.user` |
| Tenancy / resource ownership | Scope every persisted read/write by authorized context (`dashboardId`, `businessId`, `householdId` as applicable) | Same as auth/trust rules | Controllers/services with tenant filters |
| Policy Engine | JWT before policy; fail closed for out-of-v1 actions; dual-enforce until parity proven | [`POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md), [`policy-engine.mdc`](../.cursor/rules/policy-engine.mdc) | `server/src/auth/` |
| Canonical domain services | Mutations flow UI/API/AI/workflow → auth boundary → domain service → persist → events; routes/sockets/AI must not become alternate mutation owners | Root [`AGENTS.md`](../AGENTS.md) §6; Platform Standards | Canonical `*Service.ts` under `server/src/` |
| Module interoperability | `authorize → execute → emit activity → notify/realtime`; never emit on failed/unauthorized actions | [`moduleSpecs.md`](./moduleSpecs.md); Platform Standards; [`module-interoperability.mdc`](../.cursor/rules/module-interoperability.mdc) | Module routes + activity emitters |
| Domain events vs activity | Domain events after success for cross-cutting; module activity for feeds — do not conflate | [`DOMAIN_EVENTS.md`](../docs/architecture/DOMAIN_EVENTS.md), [`domain-events.mdc`](../.cursor/rules/domain-events.mdc) | `server/src/events/` |
| Realtime / notifications | Prove membership before join/emit; notification types `[module]_[event]` with manifest metadata | Platform Standards; [`NOTIFICATION_METADATA_GUIDE.md`](../docs/guides/NOTIFICATION_METADATA_GUIDE.md); `module-development.mdc` | Socket services; `NotificationService` |
| Workspace routing | Canonical href helpers; no new `?module=` navigation; no shell stub data as SoR | [`WORKSPACE_ROUTING_CONTRACT.md`](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md) | `businessWorkspaceNavigation.ts` and related |
| Workspace runtime contracts | Module/widget contracts owned by runtime docs/code — not reinvented per module | [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](../docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md), `workspace-runtime.mdc` | `web/src/runtime/` |
| Application / module lifecycle | Install/enable/assign via Application Manager; apps remain SoR for their entities | [`APPLICATION_LIFECYCLE.md`](../docs/architecture/APPLICATION_LIFECYCLE.md) | Module provision + registry |
| Global Trash / lifecycle | Soft delete via `trashedAt` + Global Trash; exclude trashed from normal lists | [`GLOBAL_TRASH.md`](../docs/architecture/GLOBAL_TRASH.md) | Trash handlers per module |
| V_Link / relationships | Relationships ≠ permissions; membership does not grant content access | [`V_LINK.md`](../docs/architecture/V_LINK.md); `vlinkProductContext.md` | Platform V_Link services |
| File Hub / storage | All file bytes via `storageService` / GCS abstraction; File Hub is reference module | [`storage-and-ai-attachments.mdc`](../.cursor/rules/storage-and-ai-attachments.mdc); Platform Standards § storage | `storageService`, drive services |
| Unified search | Federation under Search Constitution; no shadow ACL; PE `search:read` | [`SEARCH_CONSTITUTION.md`](../docs/search/SEARCH_CONSTITUTION.md) | Search orchestrator / providers |
| AI / Digital Life Twin | Governed Twin; act only through normal service boundaries; AI ≤ actor authority | [`AI_SYSTEM_MENTAL_MODEL.md`](../docs/architecture/AI_SYSTEM_MENTAL_MODEL.md) → [`AI_READING_GUIDE.md`](../docs/architecture/AI_READING_GUIDE.md) → [`AI_DOCUMENT_STATUS_MATRIX.md`](../docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md) | `DigitalLifeTwinCore`, `/api/ai/twin` |
| Module AI context | **If AI-exposed:** real `ModuleAIContext` + bounded authenticated context providers | [`AI_CONTEXT_PROVIDER_API.md`](../docs/guides/AI_CONTEXT_PROVIDER_API.md); [`moduleSpecs.md`](./moduleSpecs.md); product boundaries: [`aiProductPhilosophy.md`](./aiProductPhilosophy.md) | Context providers; registry |
| Model / provider selection | Follow current AI architecture status — not archived MB AI plans or old preference narratives | Status Matrix; [`docs/ai/PROVIDERS.md`](../docs/ai/PROVIDERS.md) | Provider selection + shadow paths in server AI code |
| Background jobs | Prefer Platform Job Registry direction; avoid new ad-hoc `setInterval`/cron islands | [`PLATFORM_JOB_REGISTRY.md`](../docs/architecture/PLATFORM_JOB_REGISTRY.md) | Existing job owners (migrating) |
| Third-party modules | Same contract as first-party; iframe/bundle runtime; no in-process partner code | Pipeline SoT / rulebook; [`third-party-modules.mdc`](../.cursor/rules/third-party-modules.mdc) | Marketplace + workspace bridge |
| UX / design system | Tokens and UX constitution; no parallel module design systems | [`UX_CONSTITUTION.md`](../docs/ux/UX_CONSTITUTION.md); `ui-standards.mdc` | `web/src/styles/tokens.css` |
| Prisma / data ownership | Edit `prisma/modules/**` only; migrations required; preserve tenant ownership fields | [`database-prisma.mdc`](../.cursor/rules/database-prisma.mdc); [`databaseContext.md`](./databaseContext.md) | `prisma/modules/` |
| Frontend API access | Browser → `/api/*` proxy; native `fetch` + auth headers; no bypass for user-facing calls | `api-and-auth.mdc`, `frontend-proxy-auth-consistency.mdc` | `web/src/app/api/[...slug]/route.ts` |

---

## Legacy / transitional (not recommended patterns)

| Item | Status | Where to look |
|------|--------|---------------|
| Org-chart parallel RBAC as platform authorization | LEGACY — do not expand; PE owns authz | [`LEGACY_CLEANUP.md`](../docs/architecture/LEGACY_CLEANUP.md) |
| `?module=` navigation | Resolve-only legacy | Workspace routing contract |
| Dual PE + legacy permission checks | Intentional during migration | `POLICY_ENGINE.md` |
| Fragmented schedulers / `setInterval` | Transitional | Job Registry + LEGACY_CLEANUP |
| Module-local trash / Notes `deletedAt` soft delete | Migrate toward Global Trash | LEGACY_CLEANUP |
| Historical centralized AI / autonomy routes / old MB AI phase plans | Historical / deprecated | AI Status Matrix; `docs/archive/` |
| Old Business Workspace sync as SoR | Superseded by Application Lifecycle / workspace contracts | Lifecycle + routing docs |
| Block-on-Block naming | Historical brand | Prefer **Vssyl** |

---

## Canonical navigation

1. Root [`AGENTS.md`](../AGENTS.md)  
2. [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../docs/VSSYL_SOURCE_OF_TRUTH.md)  
3. [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md)  
4. Task-relevant `.cursor/rules` and code
