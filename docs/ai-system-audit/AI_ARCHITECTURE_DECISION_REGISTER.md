# AI Architecture Decision Register

**Date:** 2026-07-12  

Decisions **embodied in code** (whether or not a formal ADR exists), plus doc↔code conflicts needing confirmation.

---

## Embodied decisions (code is evidence)

| ID | Decision | Evidence | Confirm? |
|----|----------|----------|----------|
| ADR-E-01 | Canonical conversational entry is `POST /api/ai/twin` | `routes/ai.ts`, frontend clients | Confirmed |
| ADR-E-02 | Service preloads conversation/memory; Core orchestrates turn | Service/Core split | Confirmed |
| ADR-E-03 | ContextProviderOrchestrator is canonical fetch implementation | Flag + CrossModule delegation | Confirmed |
| ADR-E-04 | Autonomy auto-execution de-emphasized; not wired to Core | AutonomyManager A7 comment | Confirmed |
| ADR-E-05 | Autonomous routes retired | `routes/ai/autonomous.ts` | Confirmed |
| ADR-E-06 | Centralized-ai admin fence returns 410 | Middleware | Confirmed |
| ADR-E-07 | Tools execute via domain services (Drive visibility/share) | toolExecutor | Confirmed |
| ADR-E-08 | Pipeline catalog drives grounding/enforcement | pipeline/* + Core | Confirmed |
| ADR-E-09 | Conversation reasoning is pre-provider understanding | conversation/* + Core | Confirmed |
| ADR-E-10 | Provider capability matrix is routing SoT (Wave 1E) | providerCapabilityMatrix + routing | Confirmed |
| ADR-E-11 | Inferred learning requires review before prompt eligibility (philosophy + partial impl) | Decision Model + pending stores | Needs ongoing enforcement audit |
| ADR-E-12 | Business AI wraps personal twin with policy | BusinessAIDigitalTwinService | Confirmed |
| ADR-E-13 | Ambient suggestions are parallel non-twin path | AIEventConsumer + suggestions | Confirmed |
| ADR-E-14 | Notebook AI is separate OpenAI completion helper | notebookAICompletion.ts | Confirmed — document as intentional exemption |
| ADR-E-15 | Built-in modules register AI context at startup | registerBuiltInModules.ts | Confirmed |

---

## Doc ↔ implementation conflicts

| ID | Documents say | Code shows | Resolution proposal |
|----|---------------|------------|---------------------|
| CONF-01 | Some older Memory Bank / plans imply ContinuousLearning platform | ContinuousLearning only in orphan analytics | Treat ContinuousLearning as **historical scaffold** |
| CONF-02 | `ai/knowledge/` naming suggests engine there | Production Knowledge Engine in `server/src/knowledge/` | Redirect docs; don’t put new code in empty folder |
| CONF-03 | Autonomy product language in UI | Not on twin execution path | Clarify UX copy in Phase 0 |
| CONF-04 | Deep-dive (2026-07-05) lists AIEnhancedSearchBar as entry | Component **orphaned** (no imports) 2026-07-12 | Update deep-dive or mark superseded by this audit |
| CONF-05 | Decision Model “every ingress declares branch” | Not all ingress points labeled in code | ADD documentation mapping; optional lint later |
| CONF-06 | Legacy duplication register R-01 centralized router size | Fenced 410 — may still exist as dead tree | Confirm file presence vs mount only |
| CONF-07 | PROVIDERS.md “callAIProvider routing” | Still accurate for twin; not for Notebook | Scope docs to twin + note exemptions |

---

## Decisions needing formal confirmation (product/architecture)

| ID | Question | Options |
|----|----------|---------|
| CONFIRM-01 | Should in-loop tools (share_file, create_todo) require explicit approval UX always? | Always / risk-based / never beyond AuthZ |
| CONFIRM-02 | Keep Notebook outside twin permanently? | Exempt SPECIALIZED vs migrate to twin tools |
| CONFIRM-03 | Retire intelligence dashboards or rebrand as analytics? | Product call |
| CONFIRM-04 | Delete orphan analytics/AutoML/workflow code in Phase 1? | Yes with schema holdbacks / No archive |
| CONFIRM-05 | Introduce ModelTier routing in Phase 3? | Approve target architecture |
| CONFIRM-06 | Is keyword→local sensitive routing acceptable? | Replace with classifier / classification labels |

---

## Relationship to constitutional docs

Constitutional documents remain authoritative for **principles**. This register records **what the codebase currently does**. When conflict: stop and reconcile per `docs/VSSYL_SOURCE_OF_TRUTH.md` before changing either.

**Phase 0 (2026-07-12):** Formally accepted decisions live in [`../architecture/AI_ARCHITECTURE_DECISION_RECORDS.md`](../architecture/AI_ARCHITECTURE_DECISION_RECORDS.md). Recommendation dispositions: [`../architecture/AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md`](../architecture/AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md).
