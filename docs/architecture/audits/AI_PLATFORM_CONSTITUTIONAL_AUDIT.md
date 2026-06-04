# AI Platform Constitutional Audit

**System:** Vssyl AI Platform Layer (cross-cutting)  
**Phase:** **Wave 0 — Inventory, duplication audit, constitutional map** (2026-06-04)  
**Certification status:** **Not certifiable as product module** — platform system + admin observability  
**Date:** 2026-06-04  
**Benchmarks:** Reference modules #1–5 (File Hub, Chat, Calendar, Todo, Place); Notebook L3 composition  
**Related:** [AI_PLATFORM_CONSTITUTION.md](../AI_PLATFORM_CONSTITUTION.md) (G0 authority), [AI_TOOL_ACTION_COMPLIANCE_MATRIX](./AI_TOOL_ACTION_COMPLIANCE_MATRIX.md), [AI_CONTEXT_PROVIDER_MATRIX](./AI_CONTEXT_PROVIDER_MATRIX.md), [AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW](./AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md), [AI_LEGACY_DUPLICATION_REGISTER](./AI_LEGACY_DUPLICATION_REGISTER.md), [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md), [AI_PLATFORM_OVERVIEW.md](../AI_PLATFORM_OVERVIEW.md)

> **Scope:** Discovery and governance only. No runtime code changed. Do not re-audit certified module AI extraction (Chat, Calendar, Todo, Notebook, Place, File Hub tools).

---

## Executive summary

The Vssyl AI platform is a **mature twin pipeline** (`DigitalLifeTwinCore`) with strong context orchestration, pipeline diagnostics, and admin observability. Module modernization has already routed **Chat, Calendar, Todo, Notebook, and Place** writes through canonical `*AIActionService` paths in `ActionExecutor` and `toolExecutor`.

**Primary gaps (platform layer):**

| Gap | Severity |
|-----|----------|
| `ActionExecutor` still uses **mock req/res + controller imports** for Drive, HR, Scheduling | P0 |
| `toolExecutor.share_file` uses **direct `prisma.user`** lookup | P1 |
| `AutonomousActionExecutor` + deprecated `/api/ai/autonomous` paths | P1 |
| `/api/centralized-ai` mega-router overlaps learning/insights with `/api/ai` | P1 |
| `GET /api/ai/context` mount collision (`ai.ts` vs `ai-user-context.ts`) | P1 |
| Drive context providers use **direct Prisma** in controller | P1 |
| Ledger row **AI Tools / Actions — Level 0** remains accurate for platform shell | — |

**Governance classification:** **B — Platform system** + **C — Admin portal subsystem** for pipeline ops (see Part 8).

**Recommendation:** Proceed with **AI Platform modernization Wave 1A+** after Business Workspace shell Wave 1A (or in parallel for platform-only tracks). Do not duplicate module certification work.

---

## Part 1 — AI system inventory

### Classification key

| Class | Meaning |
|-------|---------|
| **canonical** | Intended live path; documented in AI_PLATFORM_OVERVIEW |
| **modernized** | Aligns with Reference module AI patterns (service routing, tests) |
| **partial** | Shipped but gaps (Prisma, mocks, missing tests) |
| **legacy** | Superseded route or shim; still mounted |
| **duplicate** | Competing implementation for same concern |
| **deprecated** | Marked `@deprecated` in code or docs |
| **unknown** | Needs Wave 1 review |

### 1.1 Backend — routes

| Area | Path / mount | Class | Notes |
|------|--------------|-------|-------|
| Twin product API | `/api/ai` (`ai.ts`) | **canonical** | `POST /twin`, suggestions, learning, media |
| AI preferences | `/api/ai`, `/api/ai/effective-preferences`, `/api/ai/preferences`, `/api/ai/personality` | **canonical** | Split routers |
| Autonomy | `/api/ai/autonomy`, `/api/ai/autonomous` | **partial** / **deprecated** | `autonomous.ts` deprecated May 2026 |
| Intelligence / patterns | `/api/ai/intelligence`, `/api/ai/patterns` | **partial** | Adjacent to twin |
| User AI context CRUD | `/api/ai/context` (`ai-user-context.ts`) | **duplicate** | Collides with `ai.ts` `GET /context` |
| Cross-module context (twin) | `GET /api/ai/context` in `ai.ts` | **canonical** | Orchestrated context for twin |
| Centralized learning / ops | `/api/centralized-ai` (`ai-centralized.ts`, ~3494 LOC) | **legacy** / **duplicate** | Admin/enterprise scaffold; not twin path |
| Conversations | `/api/ai-conversations` | **canonical** | Thread persistence |
| Memory facts | `/api/ai/memory/facts` | **canonical** | User memory |
| Query billing | `/api/ai/queries` | **canonical** | `AIQueryService` surface |
| Business twin | `/api/business-ai`, `/api/admin/business-ai` | **partial** | Enterprise boundary layer |
| Admin provider usage | `/api/admin/ai-providers` | **canonical** | OpenAI expense/usage |
| Context debug | `/api/ai-context-debug` | **canonical** | Admin debug |
| Module registry | `/api/modules/:moduleId/ai/context` | **canonical** | `moduleAIContext.ts` |
| Admin pipeline | Admin portal mount → `adminPortalRoutes.aiPipeline.ts` | **canonical** | Catalog, diagnostics, test-lab |
| Module AI context HTTP | `/api/{module}/ai/context/*` | **modernized** (L3 modules) / **partial** (HR, scheduling, dashboard, drive) | Per-module controllers |

### 1.2 Backend — core orchestration

| Component | Path | Class |
|-----------|------|-------|
| Digital Life Twin entry | `DigitalLifeTwinService.ts` | **canonical** |
| Twin pipeline | `DigitalLifeTwinCore.ts` | **canonical** |
| Cross-module context | `CrossModuleContextEngine.ts` | **canonical** |
| Provider orchestration | `ContextProviderOrchestrator.ts` | **canonical** |
| Context assembly | `AIContextAssembler.ts` | **canonical** |
| Conversation reasoning | `conversation/conversationReasoningLayer.ts` | **canonical** (doc: `AI_CONVERSATION_REASONING.md`) |
| Preference resolution | `preferences/PreferenceResolver.ts` | **canonical** |
| Grounding | `pipeline/pipelineGroundingRetrieval.ts` | **canonical** |
| Enforcement + trace | `pipeline/pipelineEnforcement.ts`, `buildPipelineTrace.ts` | **canonical** |
| Orchestration snapshots | `context/orchestrationSnapshot.ts` | **canonical** (no standalone architecture doc) |
| Provider routing | `DigitalLifeTwinCore` + `providers/*` | **canonical** |
| Tool loop | `tools/toolExecutor.ts` | **partial** |
| Action execution | `core/ActionExecutor.ts` | **partial** |
| Third-party actions | `ActionExecutorRegistry.ts` | **canonical** (marketplace) |
| Autonomous legacy | `actions/AutonomousActionExecutor.ts` | **legacy** |
| Ambient suggestions | `consumers/AIEventConsumer.ts`, `suggestions/*` | **canonical** (separate path from twin) |
| Workflow automation | `workflows/WorkflowAutomationService.ts` | **legacy** / **unknown** |
| Centralized learning | `learning/CentralizedLearningEngine.ts` | **partial** (ties to centralized-ai routes) |

### 1.3 Backend — module AI (do not re-modernize in Wave 0)

| Module | AI action service | Context controllers | Wave 0 class |
|--------|-------------------|---------------------|--------------|
| File Hub | via tools + mock drive actions | `driveAIContextController` (direct Prisma) | **partial** |
| Chat | `chatAIActionService` | thin → chat services | **modernized** |
| Calendar | `calendarAIActionService` | thin | **modernized** |
| Todo | `todoAIActionService` | thin | **modernized** |
| Notebook | `notebookAIActionService` | notes endpoints | **modernized** |
| Place | `placeAIActionService` | place controllers | **modernized** (read-only twins) |
| HR / Scheduling | controller via mock in ActionExecutor | AI context routes | **legacy** |
| Dashboard | stub actions in ActionExecutor | `dashboardAIContextController` | **partial** |
| Business Workspace | shell widgets / business AI | no unified context provider | **partial** |

### 1.4 Frontend inventory

| Surface | Path | Class |
|---------|------|-------|
| User AI Control Center | `/ai`, `/ai-chat` | **canonical** |
| Workspace AI drawer | `WorkspaceAIDrawer.tsx` | **canonical** |
| AI widgets (business) | `business/widgets/AIAssistantWidget.tsx` | **partial** |
| Admin AI System hub | `/admin-portal/ai-system` | **canonical** |
| AI Pipeline ops | `/admin-portal/ai-pipeline/*` | **canonical** |
| AI Learning admin | `/admin-portal/ai-learning` | **partial** (overlaps user learning APIs) |
| Business AI admin | `/admin-portal/business-ai` | **partial** |
| AI context admin | `/admin-portal/ai-context` | **partial** |
| Module panels | Notebook AI, Todo AI suggestions, Scheduling assistant | **modernized** / **partial** |
| Analytics product module | business/personal analytics routes | **N/A** (product module — see boundary review) |

### 1.5 Telemetry / persistence (Prisma)

| Model / area | Role | Class |
|--------------|------|-------|
| `aIPipelineTrace` / diagnostic persistence | Pipeline diagnostics | **canonical** |
| `aILearningEvent`, conversation history | Learning + autonomy legacy | **partial** |
| `moduleAIContextRegistry` | Provider registry | **canonical** |
| User memory facts | Twin recall | **canonical** |
| AI query purchases | Billing | **canonical** |

---

## Part 2 — Canonical AI architecture map

### 2.1 Documented path (AI_PLATFORM_OVERVIEW.md)

```
User prompt
  → POST /api/ai/twin (DigitalLifeTwinService)
  → DigitalLifeTwinCore.processAsDigitalTwin
  → recall / memory
  → PreferenceResolver
  → query analysis + ContextProviderOrchestrator (module providers)
  → V_Link pipeline context (confirmed only)
  → entity linking + optional ContextSynthesisService
  → runPipelineGroundingRetrieval
  → assembleAIContext
  → runConversationReasoning (pre-generation)
  → provider call (OpenAI / Anthropic / local) + tool rounds
  → buildPipelineTrace + applyPipelineEnforcement
  → response + metadata (conversationReasoning, pipelineTrace)
```

**Parallel path (not twin LLM):** Domain events → `AIEventConsumer` → suggestion rules → UI (no auto-execute).

### 2.2 Implemented vs documented

| Step | Documented | Implemented | Divergence |
|------|------------|-------------|------------|
| Intent / objective | AI_CONVERSATION_REASONING | `runConversationReasoning` in Core | Aligned (filename differs from user checklist doc name) |
| Preference resolution | Yes | `PreferenceResolver` + session overrides | Aligned |
| Context orchestration | ContextProviderOrchestrator | Used from Core via orchestration | Aligned |
| Grounding / diagnostics | pipelineGroundingRetrieval | Yes + admin trace | Aligned |
| Provider routing | OpenAI/Anthropic/local | Yes + fallback swap | Aligned |
| Tool execution | toolExecutor | Max 3 rounds in Core | Aligned |
| Action execution | ActionExecutor (post-response actions) | Mixed service vs mock | **Divergence** on drive/HR/scheduling |
| Approval / autonomy | AutonomyManager, ApprovalManager | Partial; deprecated autonomous routes | **Divergence** |
| Logging / analytics | pipeline trace + admin portal | Yes; centralized-ai separate | **Duplicate** learning surfaces |

### 2.3 Obsolete paths

- `POST /api/ai/chat` — legacy chat shim  
- `GET/PUT /api/ai/personality`, `/autonomy` — deprecated; use split routers  
- `/api/ai/autonomous/*` — deprecated autonomy scaffolding  
- `/api/centralized-ai/*` — not on twin path; admin/legacy collective learning  
- `AutonomousActionExecutor` — direct Prisma for conversation/learning side effects  

---

## Part 3 — Duplication / legacy audit

See [AI_LEGACY_DUPLICATION_REGISTER.md](./AI_LEGACY_DUPLICATION_REGISTER.md) for full disposition table.

**Summary:**

| Duplicate | Disposition |
|-----------|-------------|
| `ai.ts` vs `ai-centralized.ts` | **Keep** twin on `ai.ts`; **consolidate** or fence `centralized-ai` in Wave 1A |
| `ai.ts` vs `ai-user-context.ts` on `/context` | **Consolidate** — rename or reorder mounts |
| ActionExecutor monolith vs per-module services | **Consolidate** — migrate drive/HR/scheduling to services |
| Drive tool path vs ActionExecutor drive | **Keep** tool path; **deprecate** mock controller path |
| Admin learning vs user `/api/ai/learning/*` | **Needs further review** |
| `WorkflowAutomationService` vs twin tools | **Deprecate** or document non-twin scope |

---

## Part 4 — Tool and action compliance

Full matrix: [AI_TOOL_ACTION_COMPLIANCE_MATRIX.md](./AI_TOOL_ACTION_COMPLIANCE_MATRIX.md).

**Headline:** 8 tools — 7 compliant with canonical services; `share_file` has direct Prisma user lookup. ActionExecutor: **5 modules modernized**, **3 legacy mock paths**, household/business/dashboard/notifications largely stub.

---

## Part 5 — Context provider audit

Full matrix: [AI_CONTEXT_PROVIDER_MATRIX.md](./AI_CONTEXT_PROVIDER_MATRIX.md).

**Headline:** 11 built-in modules register providers; L3 modules use visibility/services in controllers; **Drive** still uses direct Prisma in `driveAIContextController`.

---

## Part 6 — Provider routing / capability audit

| Provider | Implementation | Class |
|----------|----------------|-------|
| OpenAI | `OpenAIProvider.ts`, vision + image gen/edit in capabilities | **canonical** |
| Anthropic | `AnthropicProvider.ts` | **canonical** |
| Local | `LocalProvider.ts` | **stub** (no vision; limited production use) |
| Model catalog | `modelCatalog.ts` → `GET /api/ai/models` | **canonical** |
| Capabilities | `capabilities.ts` | **canonical** |
| Fallback | Core swaps openai ↔ anthropic on failure | **canonical** |
| Cost controls | `queryCost` on models; `AIQueryService` | **partial** |
| Health checks | Admin pipeline diagnostics + provider usage routes | **partial** (no unified health cron) |
| Vision | `getVisionImageParts` path in Core | **canonical** |

**Documented but absent as standalone docs:** `AI_OPERATIONAL_DIAGNOSTICS.md`, `CONTEXT_PROVIDER_ORCHESTRATOR.md`, `ORCHESTRATION_SNAPSHOT.md` — behavior exists in code/tests; docs deferred per Wave 0 rule.

---

## Part 7 — Diagnostics / admin portal

See [AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md](./AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md).

**Decision:** **D — Multiple surfaces needing explicit separation**

- **A** — `analytics` product module (tenant dashboards)  
- **B** — Admin portal AI pipeline / learning / business AI  
- **C** — Platform observability (`pipelineTrace`, orchestration snapshots)  

---

## Part 8 — Governance / certification strategy

| Option | Applicability |
|--------|----------------|
| A. Product module | **No** — AI is not a single `moduleId` |
| B. Platform system | **Yes** — primary classification |
| C. Admin portal subsystem | **Yes** — pipeline ops console |
| D. Reference architecture layer | **Yes** — module AI patterns cite Chat/File Hub |

**Recommended tracks (no implementation in Wave 0):**

1. **AI Platform constitutional hardening** — P0 mock/Prisma elimination in platform executors  
2. **AI Tool Compliance Wave (1B)** — align with CERTIFICATION_LEDGER row  
3. **AI Context Provider Wave (1C)** — Drive + dashboard + HR/scheduling  
4. **AI Diagnostics / Admin truth alignment (1D)**  
5. **Provider routing matrix (1E)**  
6. **AI Platform Level 2 readiness** — after 1A–1E; not Level 3 product certification  

---

## Part 9 — Risk register

### P0

| ID | Risk | Evidence |
|----|------|----------|
| P0-1 | Mock req/res controller invocation on **write** paths | `ActionExecutor.ts` drive, HR, scheduling |
| P0-2 | Autonomous write path without modern approval wiring | `AutonomousActionExecutor`, deprecated routes |
| P0-3 | Route mount ambiguity on `/api/ai/context` | `index.ts` order: `ai.ts` before `ai-user-context` |

### P1

| ID | Risk | Evidence |
|----|------|----------|
| P1-1 | Direct Prisma in Drive AI context | `driveAIContextController.ts` |
| P1-2 | Direct Prisma in tool share lookup | `toolExecutor.ts` |
| P1-3 | Duplicate provider/learning admin surfaces | `ai-centralized.ts` vs `ai.ts` learning |
| P1-4 | `centralized-ai` handlers without twin grounding | Large router, uneven auth patterns |
| P1-5 | Household/business/dashboard AI actions stubbed | `ActionExecutor` returns synthetic success |
| P1-6 | Missing architecture docs for orchestrator/snapshot | Code exists; doc drift |

### P2

| P2-1 | Doc naming drift (`CONVERSATION_REASONING_LAYER` vs `AI_CONVERSATION_REASONING`) | |
| P2-2 | Admin UI charts incomplete vs pipeline trace richness | |
| P2-3 | Local provider documented but minimal runtime value | |

---

## Part 10 — Recommended roadmap

| Wave | Name | Scope |
|------|------|-------|
| **0** | This audit | ✅ Complete 2026-06-04 |
| **1A** | Canonical pipeline map + legacy route retirement **plan** | Mount order, deprecations, centralized-ai fence |
| **1B** | Tool/action compliance closeout | Drive/HR/scheduling services; remove mocks |
| **1C** | Context provider compliance + grounding | Drive visibility service for context |
| **1D** | Diagnostics / admin console truth | Align admin pages with pipelineTrace fields |
| **1E** | Provider capability matrix hardening | Health, cost, fallback policy doc + tests |
| **2** | AI Platform Level 2 readiness review | Ledger promotion from Level 0 → 2 |

**Do not implement** any wave in Wave 0.

---

## Referenced docs — existence check

| Doc requested | Status |
|---------------|--------|
| `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` | ✅ Exists |
| `AI_PLATFORM_OVERVIEW.md` | ✅ Exists |
| `AI_TOOL_COMPLIANCE_REGISTER.md` | ❌ Not found — use [AI_TOOL_ACTION_COMPLIANCE_MATRIX](./AI_TOOL_ACTION_COMPLIANCE_MATRIX.md) |
| `AI_OPERATIONAL_DIAGNOSTICS.md` | ❌ Not found — partial coverage in `AI_PIPELINE_ADMIN_TOOLS.md` |
| `CONVERSATION_REASONING_LAYER.md` | ❌ Not found — use `AI_CONVERSATION_REASONING.md` |
| `ORCHESTRATION_SNAPSHOT.md` | ❌ Not found — runtime in `orchestrationSnapshot.ts` |
| `CONTEXT_PROVIDER_ORCHESTRATOR.md` | ❌ Not found — runtime in `ContextProviderOrchestrator.ts` |
| `REFERENCE_MODULE_CATALOG.md` | ✅ Exists |
| `CERTIFICATION_LEDGER.md` | ✅ Updated |
| `PLATFORM_MODULE_MODERNIZATION_ROADMAP.md` | ✅ Updated |

---

## Wave 0 sign-off

| Criterion | Met |
|-----------|-----|
| AI system inventory | ✅ |
| Canonical path documented | ✅ |
| Duplicate/legacy identified | ✅ |
| Tool/action matrix | ✅ |
| Context provider matrix | ✅ |
| Admin vs Analytics boundary | ✅ |
| Provider routing assessed | ✅ |
| Risk register | ✅ |
| Roadmap proposed | ✅ |
| No runtime code changed | ✅ |
