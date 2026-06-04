# AI Legacy and Duplication Register

**Phase:** AI Platform Wave 0 (2026-06-04)  
**Parent:** [AI_PLATFORM_CONSTITUTIONAL_AUDIT.md](./AI_PLATFORM_CONSTITUTIONAL_AUDIT.md)

Disposition key: **Keep** | **Consolidate** | **Deprecate** | **Delete later** | **Needs further review**

---

## Route and API duplicates

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| R-01 | `ai.ts` + `ai-centralized.ts` | Twin product vs 3494-line centralized admin/learning router | **Keep** twin; **Consolidate** or document fence for centralized | 1A |
| R-02 | `ai.ts` `GET /context` + `ai-user-context.ts` | Same mount prefix `/api/ai/context` | **Consolidate** mount paths | 1A |
| R-03 | `ai.ts` `POST /chat` | Legacy chat before twin | **Deprecate** → redirect to twin | 1A |
| R-04 | `ai.ts` personality/autonomy shims | Duplicate of dedicated routers | **Deprecate** shims | 1A |
| R-05 | `ai/autonomous.ts` | Marked deprecated May 2026 | **Deprecate** then **Delete later** | 1A / 2 |
| R-06 | `/api/ai/learning/*` vs centralized learning | Two learning pipelines | **Needs further review** | 1D |

---

## Execution duplicates

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| E-01 | `toolExecutor` drive tools vs `ActionExecutor` drive | Tools use services; actions use mock controllers | **Consolidate** actions onto drive services | 1B |
| E-02 | `ActionExecutorRegistry` vs `executeByModule` | Partners use registry; built-ins hardcoded | **Keep** both; **document** exemption | 1A |
| E-03 | `AutonomousActionExecutor` vs `ActionExecutor` | Parallel autonomous path with Prisma | **Deprecate** autonomous | 1B |
| E-04 | Twin tool loop vs post-hoc LifeTwin actions | Two action channels in Core | **Keep** — different lifecycle stages | — |

---

## Context duplicates

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| C-01 | `CrossModuleContextEngine` vs `ContextProviderOrchestrator` | Historical overlap; orchestrator is Phase A canonical | **Keep** orchestrator; **review** engine call sites | 1C |
| C-02 | `AIContextAssembler` vs module raw payloads | Assembly compresses provider JSON | **Keep** | — |
| C-03 | Notebook providers → notes/todo endpoints | Intentional composition reuse | **Keep** — document in registry | 1C |
| C-04 | `legacyProviderCanHandle.ts` | Legacy provider routing | **Deprecate** when selection unified | 2 |
| C-05 | `driveAIContextController` Prisma vs `listAccessibleDriveFiles` | Duplicate read paths for same data | **Consolidate** to visibility service | 1C |

---

## Prompt / diagnostics duplicates

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| P-01 | Multiple prompt builders | `buildSystemPrompt`, `providerUserPrompt`, preference blocks | **Keep** — layered; **document** order in 1A map | 1A |
| P-02 | `pipelineTrace` vs legacy trace fields in metadata | Additive diagnostics | **Keep** — **Consolidate** admin UI field list | 1D |
| P-03 | `ai-context-debug` vs pipeline diagnostics | Overlapping debug endpoints | **Needs further review** | 1D |

---

## Documentation duplicates

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| D-01 | `AI_SYSTEM_ARCHITECTURE_MAP.md` (guides) | Superseded by AI_PLATFORM_OVERVIEW | **Deprecate** banner only (already) | 1D |
| D-02 | `AI_SYSTEM_TEXTBOOK.md` vs OVERVIEW | Textbook vs diagram hub | **Keep** both — cross-link | — |
| D-03 | Missing `AI_TOOL_COMPLIANCE_REGISTER` | Requested doc absent | **Keep** new MATRIX as substitute | — |
| D-04 | `CONVERSATION_REASONING_LAYER.md` vs `AI_CONVERSATION_REASONING.md` | Naming drift | **Keep** `AI_CONVERSATION_REASONING.md` | 1D |

---

## Frontend stale surfaces

| ID | Items | Description | Disposition | Wave |
|----|-------|-------------|-------------|------|
| F-01 | `AIProviderTest.tsx` | Dev/test component | **Delete later** or gate behind dev flag | 2 |
| F-02 | `PredictiveIntelligenceDashboard` vs admin quality | Overlapping “insights” UX | **Needs further review** | 1D |
| F-03 | `centralized-ai` client callers | If any web client still calls `/api/centralized-ai` | **Review** grep in 1A | 1A |

---

## Services — legacy / competing

| ID | Service | Disposition |
|----|---------|-------------|
| S-01 | `WorkflowAutomationService.ts` | **Needs further review** — not on twin path |
| S-02 | `WorkflowAutomationService` vs domain event suggestions | **Keep** suggestions; fence workflow automation | 1D |
| S-03 | `CentralizedLearningEngine` | **Keep** for admin; fence from twin | 1A |
| S-04 | `AutoMLService` / `AIModelManagementService` | Admin/scaffold — **Keep** off twin path | — |
| S-05 | Multiple intelligence engines under `ai/intelligence` and `ai/analytics` | **Consolidate** naming/docs | 2 |

---

## Hardcoded module IDs (review list)

Grep samples — not exhaustive:

| Location | Pattern | Disposition |
|----------|---------|-------------|
| `ActionExecutor.executeByModule` | `drive`, `chat`, `tasks`, `todo`, … | **Keep** until registry unify |
| `toolDefinitions` | Implicit module binding per tool | **Keep** |
| `registerBuiltInModules` | `moduleId` keys | **Keep** — canonical |
| Pipeline catalog defaults | Source ids (`drive_files`, `calendar`, …) | **Keep** — align with provider matrix |

---

## Delete-later candidates (no action in Wave 0)

- `server/src/routes/ai/autonomous.ts` (after sunset period)  
- `AutonomousActionExecutor.ts` (after migration)  
- Unused centralized-ai handlers (after traffic audit)  
- `legacyProviderCanHandle.ts` (after orchestrator-only routing)
