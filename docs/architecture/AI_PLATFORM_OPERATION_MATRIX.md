# AI Platform Operation Matrix

**System:** Vssyl AI Platform Layer  
**Status:** Governance baseline (Wave **G0**) — reflects Wave 0 audit; updated on each implementation wave  
**Last updated:** 2026-06-03 (Level **2** certification review)  
**Related:** [AI_PLATFORM_CONSTITUTION.md](./AI_PLATFORM_CONSTITUTION.md), [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md), [audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./audits/AI_PLATFORM_CONSTITUTIONAL_AUDIT.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct layer, scope, and governance |
| **P** | Partial — works; wrong layer, gap, duplicate path, or missing tests |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `PLAT` = AI Platform · `MOD` = Module (per `moduleId`) · `ADM` = Admin Portal · `BW` = Business Workspace shell

**Columns (platform-focused):**

| Col | Meaning |
|-----|---------|
| **Layer** | Service / Core / Route / UI where logic lives |
| **Scope** | Tenant isolation enforced |
| **Canonical** | Uses required pattern (service dispatch, no mock controller) |
| **Trace** | Pipeline trace / diagnostics on twin path |
| **Tests** | Automated coverage for operation class |

**Primary verdict:** Last column — worst material gap for the operation.

---

## Summary (certification-time)

| Domain | Operations | C | P | N |
|--------|------------|---|---|---|
| Context retrieval | 14 | 10 | 4 | 0 |
| Provider orchestration | 12 | 10 | 2 | 0 |
| Grounding | 7 | 6 | 1 | 0 |
| Tool execution | 8 | 8 | 0 | 0 |
| Action execution | 16 | 11 | 2 | 3 |
| Diagnostics | 10 | 9 | 1 | 0 |
| Memory | 5 | 5 | 0 | 0 |
| Preferences | 6 | 6 | 0 | 0 |
| Admin pipeline | 12 | 9 | 3 | 0 |
| Learning | 8 | 6 | 2 | 0 |
| **Total** | **98** | **80** | **15** | **3** |

**Blocking N = 0** per § Blocking. Non-blocking **N**: household/business/dashboard stub actions (3).

*Counts are operation-class rows below, not HTTP endpoints.*

---

## 1. Context retrieval

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Twin cross-module context API** | PLAT | `ai.ts` → orchestrator | C | C | C | partial | **C** |
| **HTTP fetch module provider** | PLAT | `fetchModuleContextProvider` | C | C | C | C | **C** |
| **Provider cache + TTL** | PLAT | `moduleContextProviderCache` | C | C | — | C | **C** |
| **Freshness warnings** | PLAT | `contextProviderFreshness` | C | C | C | C | **C** |
| **Chat context providers** | MOD | `chatAIContextController` → services | C | C | — | C | **C** |
| **Calendar context providers** | MOD | `calendarAIContextController` | C | C | — | C | **C** |
| **Todo context providers** | MOD | `todoAIContextController` | C | C | — | C | **C** |
| **Notebook/Notes providers** | MOD | notes visibility + todo overview | C | C | — | partial | **C** |
| **Place context providers** | MOD | place visibility / AI controllers | C | C | — | partial | **P** |
| **Drive context providers** | MOD | `driveAIContextController` → `driveAIContextService` → `driveVisibilityService` | C | C | — | C | **C** |
| **Dashboard context providers** | MOD | `dashboardAIContextController` | P | P | — | N | **P** |
| **HR / Scheduling providers** | MOD | AI context controllers | P | P | — | N | **P** |
| **User AI context CRUD** | PLAT | `ai-user-context.ts` | C | C | — | partial | **P** |
| **Route: GET /api/ai/context collision** | PLAT | `/api/ai/user-context` canonical (1B) | C | — | — | C | **C** |

---

## 2. Provider orchestration

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Query analysis + module match** | PLAT | `moduleContextProviderSelection` | C | C | C | C | **C** |
| **Pipeline intent inference** | PLAT | `inferPipelineIntents` | C | C | C | C | **C** |
| **Provider selection plan** | PLAT | `contextProviderSelection` | C | C | C | C | **C** |
| **Orchestrate retrieval pass** | PLAT | `ContextProviderOrchestrator` | C | C | C | C | **C** |
| **Installed module filter** | PLAT | registry + business scope | C | C | — | C | **C** |
| **Orchestration snapshot emit** | PLAT | `orchestrationSnapshot` | C | C | C | partial | **C** |
| **Entity linking merge** | PLAT | `entityLinking` | C | C | C | C | **C** |
| **Synthetic context (flagged)** | PLAT | `ContextSynthesisService` | C | C | C | C | **P** |
| **Legacy provider routing** | PLAT | `legacyProviderCanHandle` | P | P | — | N | **P** |
| **LLM provider capability matrix** | PLAT | `providerCapabilityMatrix.ts` | C | C | C | C | **C** |
| **LLM provider selection / fallback** | PLAT | `providerRouting.ts` → `DigitalLifeTwinCore` | C | C | C | C | **C** |
| **GET /api/ai/models + capabilities** | PLAT | `ai.ts` + `buildModelsApiPayload` | C | C | — | partial | **C** |

---

## 3. Grounding

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Grounding prepass** | PLAT | `pipelineGroundingRetrieval` | C | C | C | C | **C** |
| **V_Link pipeline context** | PLAT | `vlinkPipelineContextService` | C | C | C | C | **C** |
| **Catalog source reconcile** | PLAT | `pipelineGroundingRuleReconcile` | C | — | — | C | **C** |
| **Enforcement apply** | PLAT | `pipelineEnforcement` | C | C | C | C | **C** |
| **Evidence bundle** | PLAT | `buildPipelineEvidenceBundle` | C | C | C | partial | **C** |
| **Unapproved V_Link block** | PLAT | vlink + linking policy | C | C | C | C | **C** |
| **Place/location prepass** | PLAT + MOD | grounding + place reads | C | C | C | partial | **P** |

---

## 4. Tool execution

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Tool round loop (max 3)** | PLAT | `DigitalLifeTwinCore` | C | C | C | partial | **C** |
| **list_drive_files** | PLAT→MOD | `toolExecutor` → visibility | C | C | C | C | **C** |
| **share_file** | PLAT→MOD | `grantFileShareByEmail` (no Prisma in toolExecutor) | C | C | C | C | **C** |
| **create_todo** | PLAT→MOD | `todoAIActionService` | C | C | C | C | **C** |
| **notebook summarize / extract** | PLAT→MOD | `notebookAIActionService` | C | C | C | C | **C** |
| **place search / recommend / purchase_help** | PLAT→MOD | `placeAIActionService` | C | C | C | C | **C** |
| **Catalog tool policy** | PLAT | pipeline registry | C | C | C | C | **C** |
| **Unknown tool reject** | PLAT | `toolExecutor` default | C | C | — | partial | **C** |

---

## 5. Action execution

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Dispatch by module key** | PLAT | `ActionExecutor.executeByModule` | C | partial | — | partial | **C** |
| **Chat actions** | PLAT→MOD | `chatAIActionService` | C | C | — | C | **C** |
| **Calendar actions** | PLAT→MOD | `calendarAIActionService` | C | C | — | C | **C** |
| **Todo/tasks actions** | PLAT→MOD | `todoAIActionService` | C | C | — | C | **C** |
| **Notebook actions** | PLAT→MOD | `notebookAIActionService` | C | C | — | C | **C** |
| **Place actions (read-only)** | PLAT→MOD | `placeAIActionService` | C | C | — | C | **C** |
| **Drive actions** | PLAT | `driveAIActionService` | C | C | — | C | **C** |
| **HR actions** | PLAT | `hrAIActionService` (+ attendance service) | C | C | — | C | **C** |
| **Scheduling actions** | PLAT | `schedulingAIActionService` | C | C | — | C | **C** |
| **Household actions** | PLAT | stub success | P | N | — | N | **N** |
| **Business actions** | PLAT | stub success | P | N | — | N | **N** |
| **Dashboard actions** | PLAT | stub success | P | N | — | N | **N** |
| **Notifications actions** | PLAT | partial impl | P | P | — | N | **P** |
| **Approval gate** | PLAT | `ActionExecutor` + `ApprovalManager` | C | C | — | partial | **P** |
| **Third-party registry execute** | PLAT | `ActionExecutorRegistry` | C | C | — | C | **C** |
| **AutonomousActionExecutor** | PLAT | writes retired 410; history read-only audit | C | C | — | partial | **C** |

---

## 6. Diagnostics

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Build pipeline trace** | PLAT | `buildPipelineTrace` | C | C | C | C | **C** |
| **Trace persistence** | PLAT | `pipelineTraceStore` | C | C | C | partial | **C** |
| **Trace insights** | PLAT | `pipelineTraceInsights` | C | C | C | C | **C** |
| **Context density report** | PLAT | `contextDensityReport` | C | C | C | C | **C** |
| **User metadata subset** | PLAT | twin `metadata.pipelineTrace` | C | C | C | partial | **C** |
| **Admin list diagnostics** | ADM+PLAT | admin pipeline routes | C | C | C | partial | **C** |
| **Admin trace detail + evidence** | ADM+PLAT | diagnostics/:traceId | C | C | C | partial | **C** |
| **Test-lab dry-run** | ADM+PLAT | test-lab POST | C | C | C | partial | **C** |
| **Context debug API** | PLAT | `ai-context-debug` | C | C | — | partial | **C** |
| **Retention policy** | PLAT | `pipelineRetentionService` | C | — | — | partial | **P** |

---

## 7. Memory

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Recall intent detection** | PLAT | `recallIntent` | C | C | C | C | **C** |
| **Relevant memory facts** | PLAT | `MemoryRetrievalService` | C | C | C | C | **C** |
| **Memory context injection** | PLAT | `memoryContextInjection` | C | C | C | C | **C** |
| **Conversation memory API** | PLAT | `aiConversations` + service | C | C | — | C | **C** |
| **User memory facts CRUD** | PLAT | `/api/ai/memory/facts` | C | C | — | C | **C** |

---

## 8. Preferences

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Resolve effective preferences** | PLAT | `PreferenceResolver` | C | C | C | C | **C** |
| **Session soft overrides** | PLAT | `sessionPreferenceDetection` | C | C | C | C | **C** |
| **Provider wiring** | PLAT | `preferenceProviderWiring` | C | C | C | C | **C** |
| **Response influence summary** | PLAT | `buildResponseInfluence` | C | C | C | C | **C** |
| **Business workspace block** | PLAT+BW | `businessWorkspaceBoundaries` | C | C | C | C | **C** |
| **Effective preferences API** | PLAT | `ai-effective-preferences` | C | C | — | C | **C** |

---

## 9. Admin pipeline

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **Catalog GET** | ADM+PLAT | ai-pipeline/catalog | C | admin | — | partial | **C** |
| **Registry graph / validate** | ADM+PLAT | registry endpoints | C | admin | — | C | **C** |
| **Intent policy CRUD** | ADM+PLAT | policies/intents | C | admin | — | partial | **C** |
| **Source policy CRUD** | ADM+PLAT | policies/sources | C | admin | — | partial | **C** |
| **Tool policy CRUD** | ADM+PLAT | policies/tools | C | admin | — | partial | **C** |
| **Grounding policy CRUD** | ADM+PLAT | policies/grounding | C | admin | — | C | **C** |
| **Policy audit log** | ADM+PLAT | ai-pipeline/audit | C | admin | — | partial | **C** |
| **Quality stats** | ADM+PLAT | quality/stats | C | admin | — | partial | **P** |
| **Provider usage / expenses** | ADM+PLAT | `/api/admin/ai-providers` | C | admin | — | partial | **C** |
| **AI System hub UI** | ADM | `ai-system/page.tsx` | C | — | — | N | **P** |
| **Pipeline hub UI** | ADM | ai-pipeline pages | C | — | — | N | **P** |
| **requireAdmin on pipeline routes** | ADM+PLAT | middleware | C | C | — | partial | **C** |

---

## 10. Learning

| Operation | Owner | Layer | Scope | Canonical | Trace | Tests | Primary |
|-----------|-------|-------|-------|-----------|-------|-------|---------|
| **User learning events API** | PLAT | `/api/ai/learning/*` | C | C | partial | partial | **C** |
| **Learning signals POST** | PLAT | learning/signals | C | C | — | partial | **C** |
| **Ambient suggestion accept/dismiss** | PLAT | suggestions + consumer | C | C | — | C | **C** |
| **Centralized learning engine** | PLAT | `CentralizedLearningEngine` | P | partial | — | partial | **P** |
| **Centralized-ai routes** | PLAT | `ai-centralized.ts` + mount fence | C | C | — | partial | **C** |
| **Admin learning page** | ADM | ai-learning | P | overlap | — | N | **P** |
| **Autonomous learning writes** | PLAT | `autonomous.ts` writes **410** (1B); executor audit read-only | C | C | — | partial | **C** |
| **Collective consent gate** | PLAT | `collectiveLearningConsent` | C | C | — | partial | **C** |

---

## Blocking rows for Level 2 (platform)

Promotion to **Level 2 — Platform Compliant** requires **zero N** on:

- Twin path: orchestration, grounding, enforcement, trace  
- Tool execution (all catalog tools)  
- Action execution for **built-in modules with `ai: true` and registered tools/actions**  
- Admin pipeline auth  
- Context route collision resolved  

**Known N rows after L2 review (2026-06-03):** Household/Business/Dashboard stub actions only (structured stub success in `ActionExecutor`) — acceptable; not blocking L2.

**Resolved in 1B:** `/api/ai/context` collision, Drive/HR/Scheduling ActionExecutor mocks, `share_file` tool Prisma, `AutonomousActionExecutor` writes, `POST /api/ai/chat` deprecated.

**Resolved in 1C:** Drive context provider direct Prisma — `driveVisibilityService` AI context path.

**Resolved in 1D:** centralized-ai `requireAdmin` mount fence; deprecated `/learning/event` and `/models/*` (410); diagnostics trace/reasoning alignment — `mergeDiagnosticsFromHistoryContext.ts`, `aiCentralizedAdminFence.test.ts`.

**Resolved in 1E:** Canonical LLM provider capability matrix + fallback constraints — `providerCapabilityMatrix.ts`, `providerRouting.ts`, `llmProviderRouting` on pipeline trace.

---

## Update protocol

1. Implementation wave merges → update affected rows + summary counts.  
2. Reference [AI_TOOL_ACTION_COMPLIANCE_MATRIX.md](./audits/AI_TOOL_ACTION_COMPLIANCE_MATRIX.md) for tool/action detail.  
3. Reference [AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md) for per-provider detail.  
4. Certification review cites this matrix in [AI_PLATFORM_CERTIFICATION_STRATEGY.md](./AI_PLATFORM_CERTIFICATION_STRATEGY.md).

---

*Governance Wave G0 — 2026-06-04.*
