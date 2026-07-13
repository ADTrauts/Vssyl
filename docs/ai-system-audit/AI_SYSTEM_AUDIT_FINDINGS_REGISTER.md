# AI System Audit Findings Register

**Date:** 2026-07-12  

| ID | Severity | Category | Evidence | Files | Recommendation | Confidence | Phase |
|----|----------|----------|----------|-------|----------------|------------|-------|
| F-001 | Info | Architecture | Twin is canonical conversational path | `routes/ai.ts`, `DigitalLifeTwinService.ts`, `DigitalLifeTwinCore.ts` | RETAIN | H | 0 |
| F-002 | Medium | Complexity | Core over-broad (~2575 LOC, many layers) | `DigitalLifeTwinCore.ts` | REFACTOR later | H | 5+ / post-tests |
| F-003 | Low | Naming | CrossModule facade vs Orchestrator | `CrossModuleContextEngine.ts`, `ContextProviderOrchestrator.ts` | CLARIFY / RENAME later | H | 0–1 |
| F-004 | High | Dead code | analytics/AutoML/workflow orphans | `server/src/ai/analytics/*`, `models/*`, `workflows/*` | REMOVE_LATER | H | 1 |
| F-005 | Medium | Dead code | DecisionEngine unused methods | `DecisionEngine.ts` | REMOVE_LATER or wire | H | 1 |
| F-006 | Medium | Legacy | Autonomy not on Core; UI still implies control | `AutonomyManager.ts`, Identity UI | CLARIFY + DEPRECATE auto path | H | 0–1 |
| F-007 | Medium | Legacy | Autonomous executor/routes retired but residue | `AutonomousActionExecutor.ts`, `routes/ai/autonomous.ts`, `AutonomousActions.tsx` | REMOVE_LATER | H | 1 |
| F-008 | High | Parallel | Notebook bypasses twin layers | `notebookAICompletion.ts` | DOCUMENT exemption; share catalog | H | 0 / 3 |
| F-009 | Medium | Config | Hardcoded models outside catalog | `documentExtractionService.ts`, `factExtractionService.ts`, `routes/ai.ts` media | Centralize SPECIALIZED | H | 3 |
| F-010 | Medium | Routing | No task-tier routing; coarse complexity heuristic | `providerRouting.ts` | REPLACE with ModelTier | H | 3 |
| F-011 | High | Governance | In-loop tools may mutate without approval UX | `toolExecutor.ts` share/create | CONFIRM policy + ADD_GUARDRAIL | H | 1–2 |
| F-012 | Medium | Governance | Dual approval surfaces | twin approvals vs autonomy ApprovalManager; orphan UI | CONSOLIDATE ownership | H | 2 |
| F-013 | Medium | Knowledge | Decision Model not single runtime gate | docs vs distributed services | DOCUMENT mapping; ADD_TEST | H | 0 / 2 |
| F-014 | Low | Naming | Empty `ai/knowledge/` vs `src/knowledge/` | directories | CLARIFY | H | 0 |
| F-015 | Medium | Learning | Advanced vs Centralized vs ContinuousLearning confusion | learning/*, orphan ContinuousLearning | CLARIFY; remove Continuous | H | 0–1 |
| F-016 | Medium | Frontend | Orphan AI components | ApprovalManager, SchedulingAIAssistant, AIProviderTest, etc. | REMOVE_LATER or remount | H | 1 |
| F-017 | Low | Frontend | Deprecated chat API unused by web | `POST /api/ai/chat` | DEPRECATE → REMOVE_LATER | H | 1 |
| F-018 | Medium | Observability | No unified execution record across surfaces | twin vs notebook vs media | ADD_OBSERVABILITY | H | 4 |
| F-019 | High | Tests | Weak E2E twin, fallback, reasoning, vision | test tree distribution | ADD_TEST | H | 1 |
| F-020 | Medium | Docs | Deep-dive lists orphaned EnhancedSearchBar | deep-dive component map | DOCUMENT supersession | H | 0 |
| F-021 | Low | Docs | PROVIDERS.md twin-scoped but not labeled exempt paths | `docs/ai/PROVIDERS.md` | CLARIFY scope | H | 0 |
| F-022 | Medium | Product | Intelligence hub looks like second AI | `ai-intelligence.ts`, Identity More | CLARIFY UX | M | 0–2 |
| F-023 | Medium | Retrieval | AI retrieval feature-flagged pilot | `AI_RETRIEVAL_*`, retrieval/* | RETAIN; certify before default-on | H | — |
| F-024 | Low | Ops | Pattern scheduler off by default | `ENABLE_PATTERN_ANALYSIS_SCHEDULER` | NO_ACTION / DOCUMENT | H | 0 |
| F-025 | Medium | Safety | Sensitive→local keyword heuristic brittle | `providerRouting.ts` | REPLACE later | M | 3 |
| F-026 | Low | Routes | Centralized-ai 410 fence | middleware | RETAIN fence; REMOVE_LATER code | H | 1 |
| F-027 | Medium | Actions | ActionExecutor vs tools service consolidation incomplete | Wave E-01 register | CONSOLIDATE | M | 2 |
| F-028 | Info | Necessary | Pipeline grounding/enforcement protect answers | pipeline/* | RETAIN | H | — |
| F-029 | Info | Necessary | Conversation reasoning protects posture | conversation/* | RETAIN | H | — |
| F-030 | Medium | Cost | queryCost ≠ dollar cost; incomplete across paths | modelCatalog, AIQueryService | ADD_OBSERVABILITY | H | 4 |

Severity: Info < Low < Medium < High < Critical. No Critical cross-tenant bypass confirmed in this audit; GOV tool policy is High product risk, not proven exploit.
