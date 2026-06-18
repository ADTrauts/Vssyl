# Admin Portal — AI Pipeline Extraction Register

**Package:** 0D-D — AI Pipeline Consolidation  
**Initiative:** AP-AI-02  
**Date:** 2026-06-17  
**Constraint:** Register only — **no extraction performed in 0D-D**

---

## Register

| Capability | Current Location | Target Location | Priority | Risk |
|------------|------------------|-----------------|----------|------|
| Context debug — user context | `ai-context-debug.ts` `GET /user/:userId` | Pipeline diagnostics UI or merged debug panel | **P1** | M — parity gaps (0D-E) |
| Context debug — session context | `ai-context-debug.ts` `GET /session/:sessionId` | Pipeline trace/session correlation | **P1** | M |
| Context debug — validate | `ai-context-debug.ts` `POST /validate` | Pipeline test-lab or diagnostics | **P1** | M |
| Context debug — cross-module | `ai-context-debug.ts` `GET /cross-module/:userId` | Pipeline diagnostics enrichment | **P2** | M |
| Context debug — stats | `ai-context-debug.ts` `GET /stats` | Hub monitoring metrics | **P2** | L |
| Context debug — assemble | `ai-context-debug.ts` `POST /assemble` | Test-lab dry-run path | **P1** | M |
| ai-context admin page (5 tabs) | `web/.../ai-context/page.tsx` | Redirect → pipeline diagnostics | **P1** | L — bookmark breakage (0D-F) |
| Thin route handlers (45) | `adminPortalRoutes.aiPipeline.ts` (~1,322 LOC) | Dedicated `adminPortalAiPipelineController` or service facades | **P2** | M — 1B scope creep guard |
| Route-level `DigitalLifeTwinService` instance | `adminPortalRoutes.aiPipeline.ts` L71 | Shared admin pipeline service injector | **P3** | L |
| Suggestion evaluation UI split | `test-lab/page.tsx` (3 panels) | Optional sub-routes under test-lab | **P3** | L |
| Policy audit persistence queries | Inline in `pipelineCatalogService` | `pipelineAuditQueryService` | **P3** | L |
| ai-system launcher cards | `ai-system/page.tsx` systemCards | Nav-only hub (remove cards) | **P2** | L — 0D-F |
| ai-system embedded BI charts | `ai-system/page.tsx` | Link to analytics / BI only | **P2** | M — AP-F-007 coordination |
| Module context test helper | `adminApiService.testModuleAIProvider` | Remains modules admin; cross-link to pipeline | **P4** | L — boundary OK |
| Provider usage API | `/api/admin/ai-providers` | Optional prefix unify `/ai-pipeline/providers/*` | **P4** | H — contract break; defer 1B+ |
| Centralized-ai handler file | `ai-centralized.ts` (3,491 LOC) | Delete after 0D-G allowlist | **P1** | M — hidden callers |
| HTTP integration tests | None | `admin-portal-ai-pipeline.test.ts` | **P1** | L — AP-F-030 (0D-E) |
| Operation matrix AI rows | `ADMIN_PORTAL_OPERATION_MATRIX.md` | Post-0D-G refresh | **P2** | L |

---

## Not extraction candidates (correctly placed)

| Capability | Location | Rationale |
|------------|----------|-----------|
| Pipeline catalog/registry | `server/src/ai/pipeline/*` | Already canonical |
| Provider admin services | `aiProviderServices/*` | Satellite by design (0D-C) |
| Business AI admin | `adminBusinessAI.ts` | Domain satellite |
| Twin production path | `server/src/routes/ai.ts` | User API — not admin |
| `adminService` dashboard mocks | `adminService.ts` | No pipeline logic present |

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P1** | Blocks AP-F-029/030 closure or 0D-G |
| **P2** | 0D-F / 1A / 1B architectural hygiene |
| **P3** | Nice-to-have refactor |
| **P4** | Optional / high contract risk |

---

## Risk legend

| Risk | Meaning |
|------|---------|
| **H** | Production contract or operator breakage |
| **M** | Parity or scope creep |
| **L** | Low — redirects or internal refactor |

---

## 0D-D actions taken

- **Documented** all rows above
- **Did not** move code, merge debug, or delete routes
- **Reduced** navigation duplication so pipeline hub is undisputed entry for sub-capabilities

**Next extraction work:** 0D-E (debug merge + HTTP tests), 0D-F (ai-system/ai-context redirects), 0D-G (centralized-ai deletion), 1B (route thinning).
