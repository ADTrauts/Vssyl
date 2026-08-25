# AI Platform Constitution

**Version:** 1.0.0
**Status:** Active — constitutional authority for AI Platform modernization
**Last updated:** 2026-08-25 (Digital Life Twin documentation reconciliation — Twin path §6.1)
**Phase:** Governance Wave **G0** (framework); runtime truth follows GitHub `main`

**Authorities (read together):**

| Document | Role |
|----------|------|
| [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | Platform-wide §6 AI governance |
| This document | AI Platform layer — purpose, boundaries, patterns, violations |
| [AI_PLATFORM_BOUNDARY_MODEL.md](./AI_PLATFORM_BOUNDARY_MODEL.md) | Ownership matrix across five surfaces |
| [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) | Operation-level C/P/N compliance |
| [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) | Platform certification levels 0–4 |
| [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md) | Live architecture diagrams (implementation truth) |

**Evidence baseline:** Wave 0 audits under [`audits/`](./audits/) — start with [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md).

---

## 1. Purpose

The **AI Platform** is the cross-cutting runtime that:

1. Assembles **authorized, tenant-scoped context** from modules and platform sources.
2. Runs the **Digital Life Twin** conversational pipeline (grounding, reasoning, generation, enforcement).
3. Executes **governed tools and actions** only through module canonical services or registered partner executors.
4. Emits **observable diagnostics** (pipeline trace, orchestration snapshots) for admins and additive user metadata.
5. Operates **parallel non-twin paths** (ambient suggestions, query billing) without bypassing authorization.

The AI Platform is **not** a product `moduleId`. It does not own domain entities (files, tasks, events, listings). It **orchestrates** and **governs** access to them.

---

## 2. Ownership boundaries

### 2.1 AI Platform owns

| Domain | Responsibility |
|--------|----------------|
| Twin lifecycle | `DigitalLifeTwinService` → `DigitalLifeTwinCore.processAsDigitalTwin` |
| Context orchestration | `ContextProviderOrchestrator`, `AIContextAssembler`, budget/freshness |
| Pipeline catalog | Intents, sources, tools, grounding rules, enforcement |
| Provider routing | Model catalog, capabilities, fallback between OpenAI/Anthropic |
| Conversation reasoning | Pre-generation objective, confidence, coaching policy |
| Preference resolution | `PreferenceResolver`, session overrides, business workspace boundary blocks |
| Memory injection | `MemoryRetrievalService`, recall intent (platform assembly) |
| Tool loop | `toolExecutor` dispatch (definitions in platform; execution delegates to modules) |
| Action dispatch | `ActionExecutor` / `ActionExecutorRegistry` routing (not domain mutations) |
| Pipeline diagnostics | `buildPipelineTrace`, evidence bundle, trace store, retention |
| Ambient suggestions | `AIEventConsumer`, ranking rules (no auto-execute) |
| Module AI registry | `ModuleAIContextService`, provider certification metadata |
| User AI context records | CRUD for user-declared AI context (distinct from module providers) |
| Admin pipeline API | Catalog, policies, diagnostics, test-lab (admin-only) |

### 2.2 Modules own

| Domain | Responsibility |
|--------|----------------|
| Domain data | All Prisma models and business rules for the module |
| Context provider HTTP handlers | Thin controllers → visibility/read services |
| AI action services | `*AIActionService` — authorize → execute → activity → notify |
| Manifest truth | `aiContext`, `contextProviders`, tool/action declarations |
| Policy Engine | Module `*PolicyDual` on writes initiated by AI or users |
| Side effects | Notifications, realtime, domain events, trash — module adapters |

### 2.3 AI Platform must not own

- File folders, chat messages, calendar events, tasks, notebook pages, place graphs, HR records, or scheduling shifts.
- Product analytics aggregates (tenant dashboards).
- Business Workspace shell layout or module install state (runtime only **consumes** scope).
- Marketplace module business logic inside the twin process (partner code via registry/webhook only).

See [AI_PLATFORM_BOUNDARY_MODEL.md](./AI_PLATFORM_BOUNDARY_MODEL.md) for the five-surface matrix.

---

## 3. Platform responsibilities

Every twin request must satisfy:

1. **Authentication** — `req.user` verified before any AI path.
2. **Tenant scope** — `dashboardId`, and `businessId` / `householdId` when in that context; never cross-tenant provider fetch.
3. **Order of operations** — `authorize → execute → emit → notify/realtime` for **writes** initiated by tools or actions; never emit activity for failed/unauthorized AI operations.
4. **Grounding** — Pipeline catalog + `runPipelineGroundingRetrieval`; unapproved V_Link suggestions never ground responses.
5. **Traceability** — Successful twin turns produce additive `pipelineTrace` (and evidence for admins when persisted).
6. **Separation** — Ambient suggestions and centralized admin learning do not auto-execute privileged mutations on the twin path.

---

## 4. Module responsibilities (AI contract)

Modules exposing AI must ship:

| Requirement | Reference |
|-------------|-----------|
| `ModuleAIContext` in manifest | `registerBuiltInModules.ts` patterns |
| At least one `/api/.../ai/context/...` provider | [MODULE_DEVELOPMENT_GUIDE.md](../guides/MODULE_DEVELOPMENT_GUIDE.md) |
| Writes via `*AIActionService` when AI can mutate | Chat #2, Todo #4 |
| Reads via visibility/list services in context handlers | File Hub #1, Calendar #3 |
| Tests for executor/tool paths touching the module | Module operation matrix |
| No mock `req`/`res` in platform executors for that module | Platform § Forbidden patterns |

**Certified modules (Wave 0):** Chat, Calendar, Todo, Notebook, Place — platform must **not** re-open their extraction; only fix platform-layer gaps (e.g. Drive tools vs drive actions).

---

## 5. Constitutional violations

A change **violates** this constitution when it:

| # | Violation |
|---|-----------|
| V1 | Performs **privileged persistence** inside `server/src/ai/**` without calling a module canonical service (direct Prisma for domain entities). |
| V2 | Invokes **Express controllers** via mock `req`/`res` from `ActionExecutor` or `toolExecutor` for writes. |
| V3 | Emits **module activity**, **notifications**, or **domain events** for failed or unauthorized AI operations. |
| V4 | Fetches module context **without tenant scope** or without membership proof for realtime/targeted data. |
| V5 | Grounds twin responses on **unapproved V_Link suggestions** or V_Link membership alone. |
| V6 | Adds a **duplicate twin path** (second LLM orchestrator for the same user prompt) without architecture approval. |
| V7 | Registers a **product analytics** route as a pipeline context source without catalog entry, PE, and visibility service. |
| V8 | Exposes **admin pipeline** diagnostics or collective learning aggregates to non-admin users. |
| V9 | Bypasses **Policy Engine** on AI-initiated writes when the module requires PE. |
| V10 | Declares **manifest `ai: true`** without registered providers and compliant action/tool paths. |

**Blocking violations (halt promotion):** V1, V2, V5, V8 on production paths.

---

## 6. Required architectural patterns

### 6.1 Twin path (canonical)

```
POST /api/ai/twin   (+ optional context.businessId for business scope)
  → DigitalLifeTwinService
      resolveCanonicalTwinRouting (outcome / truth need / action / contract / …)
      conversation history + personal recall + UserMemoryFact
  → DigitalLifeTwinCore
      C3: shouldRetrieveModuleContext?
        ├─ retrieve → CrossModuleContextEngine → ContextProviderOrchestrator
        └─ skip MODULE orchestration on safe conversation (not LLM-only)
      V_Link (confirmed) / entity linking / files / preferences / business policy
      optional runPipelineGroundingRetrieval (source/grounding/tool policy)
      assembleAIContext
      coaching / structured response format
      provider + tool rounds (executeTool → module services)
      post-turn learning / observation
      buildPipelineTrace + applyPipelineEnforcement
```

**Noncanonical:** `POST /api/business-ai/:businessId/interact` (mock) — not this path.

Plain-English model: [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md). Runtime map: [`AI_CANONICAL_ROUTE_MAP.md`](./AI_CANONICAL_ROUTE_MAP.md).

### 6.2 Context provider pattern

- Registry metadata in `moduleAIContextRegistry`.
- HTTP fetch via `fetchModuleContextProvider` with cache + freshness warnings.
- Controller: auth → scope → **visibility/read service** → JSON DTO.
- Pipeline `pipelineSourceIds` aligned with catalog.

### 6.3 Tool pattern

- Definition in `toolDefinitions.ts` + catalog tool policy.
- `executeTool` → dynamic import of `*AIActionService` or platform visibility service.
- No controller imports; no Prisma for domain tables in `toolExecutor`.

### 6.4 Action pattern (post-response / approval)

- `ActionExecutor.executeByModule` → `*AIActionService` for built-ins.
- `requiresApproval` honored before execute.
- Third-party: `ActionExecutorRegistry` only (webhook or signed in-process).

### 6.5 Diagnostics pattern

- `mapOrchestrationToPipelineTraceInput` + `buildPipelineEvidenceBundle`.
- Admin: `/admin-portal/ai-pipeline/diagnostics` — not mixed into product Analytics module.

### 6.6 Ambient pattern

- Domain event → `AIEventConsumer` → ranked suggestion → user accept/dismiss — **no** silent execute.

---

## 7. Forbidden patterns

| Pattern | Why forbidden | Remediation wave |
|---------|---------------|------------------|
| `mockReq` / `mockRes` + controller import in executors | Bypasses service layer, PE, and tests | 1B |
| Direct `prisma.*` on domain models in `server/src/ai/tools` or `actions` | Violates §16 / V1 | 1B |
| Second mount for same HTTP path without explicit router design | Route shadowing (`/api/ai/context`) | 1A |
| Twin auto-execution of `LifeTwinAction` without approval when `requiresApproval` | Autonomy violation | 1B |
| `centralized-ai` handlers called from user twin UI | Wrong trust boundary | 1A |
| Hardcoded module mutation in Core without ActionExecutor/tool | Hidden writes | 1B |
| Stubs that return `success: true` for household/business/dashboard writes | False compliance | 1B / review |
| Product Analytics SQL/API as grounding source without governance | Tenant data leakage risk | 1C / 1D |
| New AI service file duplicating `DigitalLifeTwinCore` responsibilities | Platform drift | Architecture review |

---

## 8. Relationship to module certification

| Layer | Certification |
|-------|---------------|
| **Modules** | Level 0–4 per [CERTIFICATION_LEDGER.md](./CERTIFICATION_LEDGER.md) (File Hub #1–Place #5) |
| **AI Platform** | Level 0–4 per [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md) |

Module **Level 3** does not automatically promote AI Platform. Platform **Level 2** is required before claiming “platform AI compliant” in release notes.

---

## 9. Modernization waves (governance)

All implementation waves must cite this constitution and update [AI_PLATFORM_OPERATION_MATRIX.md](./AI_PLATFORM_OPERATION_MATRIX.md) when operations change.

| Wave | Type | May change runtime? |
|------|------|-------------------|
| **0** | Audit | No (complete) |
| **G0** | Constitution (this doc set) | No |
| **1A** | Route/pipeline plan | Plan only unless ACT |
| **1B–1E** | Compliance implementation | Yes — scoped PRs |
| **2** | Level 2 readiness review | Review + ledger |

---

## 10. Amendment process

1. Propose change via PR updating this file + operation matrix.
2. Architecture sign-off for any new **forbidden pattern** or **blocking violation**.
3. Update `AI_PLATFORM_CERTIFICATION_STRATEGY.md` exit criteria if levels affected.
4. Update Memory Bank `activeContext.md` / `progress.md` on promotion.

---

*Governance Wave G0 — 2026-06-04. No runtime code modified.*
