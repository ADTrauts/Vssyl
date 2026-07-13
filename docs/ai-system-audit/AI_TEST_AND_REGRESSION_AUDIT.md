# AI Test and Regression Audit

**Date:** 2026-07-12  

---

## Inventory summary

| Area | Approx tests | Notes |
|------|--------------|-------|
| `server/src/ai/context` | 19 | Orchestrator, freshness, density, CrossModule activity |
| `server/src/ai/pipeline` | 17 | Enforcement, grounding, diagnostics, catalog |
| `server/src/ai/core` | 9 | Action executors, activity, webhooks |
| `server/src/ai/preferences` | 8 | Resolver, session, influence |
| `server/src/ai/utils` | 8 | Continuity, normalize, structured |
| `server/src/ai/suggestions` | 6 | Ranking/correlation |
| `server/src/ai/retrieval` | 6 | Consumer contract, evidence, hook |
| `server/src/ai/tools` | 5 | Tool execution |
| `server/src/ai/services` | 5 | Module AI context |
| `server/src/ai/learning` | 3 | AdvancedLearning, contracts |
| `server/src/ai/providers` | 2 | Limited |
| `server/src/ai/conversation` | 1 | Thin vs importance |
| `server/src/ai/memory` | 3 | Facts / injection |
| Frontend | Few | Stream/response handlers; admin retirement |
| Routes | Some | admin-portal coverage tests |

**Total under `server/src/ai`:** ~99 test files/cases clusters.

---

## Coverage map (responsibility → tests)

| Responsibility | Coverage | Gap severity |
|----------------|----------|--------------|
| Request routing (HTTP twin) | Indirect / route tests limited | High |
| Context selection | Strong | — |
| Retrieval pilot | Strong unit | Medium E2E |
| Conversation reasoning | Weak | High |
| Knowledge decisions / transitions | Philosophy docs; few ingress E2E | High |
| Learning transitions | Partial | Medium |
| Permissions / tenant | Module + some twin | High for cross-tenant regression |
| Approvals | Weak E2E | High |
| Provider selection | Partial | Medium |
| Model selection / catalog | Indirect prefs tests | Medium |
| Fallback | Weak automated | High |
| Tool calling | Good unit | Medium integration |
| Structured outputs | Some utils | Medium |
| Vision / files | Docs strong; automated limited | High |
| Grounding / enforcement | Strong unit | Medium live |
| Prompt construction | Some | Medium |
| Cost / query consume | Service-level elsewhere | Medium |
| Observability persistence | Pipeline tests | Medium |
| Frontend rendering | Thin | Medium |

---

## Gap register (prioritized)

| ID | Gap | Priority | Recommendation |
|----|-----|----------|----------------|
| T-01 | No full twin E2E (auth→persist) in CI | P0 | ADD_TEST integration with mocked providers |
| T-02 | Conversation reasoning under-tested | P0 | ADD_TEST objective/confidence/coaching fixtures |
| T-03 | Provider fallback not asserted | P0 | ADD_TEST RATE_LIMITED → alternate provider |
| T-04 | Vision multimodal contract tests sparse | P1 | Provider-contract tests for OpenAI/Anthropic shapes |
| T-05 | Approval + tool side-effect policy tests | P1 | Share_file / create_todo AuthZ matrices |
| T-06 | Knowledge ingress vs Decision Model cases | P1 | Table-driven teach / remember / infer / ignore |
| T-07 | Notebook path regression | P2 | Query balance + model env |
| T-08 | Tests tied only to mocks without wiring | P2 | Add registry/startup smoke |
| T-09 | Dead system tests (if any) for orphans | P3 | Don’t expand; delete with code |
| T-10 | Frontend twin UI tests | P2 | Critical render + error/fileIssues |

---

## Obsolete / mock-only risks

- Preference tests hardcode current catalog model ids — update when catalog changes (expected).  
- Avoid adding tests that lock orphan analytics engines into “must keep.”  
- Admin portal tests that only assert redirects are valuable for retirement but not twin quality.

---

## Recommended regression pack (future)

1. Twin text-only happy path  
2. Multi-turn continuity  
3. Module context drive/calendar  
4. Vision image + PDF  
5. Tool list_drive_files AuthZ  
6. Grounding enforcement qualify  
7. Fallback 429  
8. remember-that + learning pending  
9. Business interact membership denial  
10. Query balance exhaustion  
