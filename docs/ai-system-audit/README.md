# Vssyl AI System Audit

**Status:** Active — **official whole-system analysis** (adopted AI Architecture Phase 0, 2026-07-12)  
**Date:** 2026-07-12  
**Mode:** Documentation analysis (no production code changes in the audit itself)  
**Repository:** https://github.com/ADTrauts/Vssyl  

**Phase 0 entry docs:** [`../architecture/AI_SYSTEM_MENTAL_MODEL.md`](../architecture/AI_SYSTEM_MENTAL_MODEL.md) · [`../architecture/AI_READING_GUIDE.md`](../architecture/AI_READING_GUIDE.md) · [`../architecture/AI_INTELLIGENCE_MODEL.md`](../architecture/AI_INTELLIGENCE_MODEL.md)

**Accepted ADRs:** [`../architecture/AI_ARCHITECTURE_DECISION_RECORDS.md`](../architecture/AI_ARCHITECTURE_DECISION_RECORDS.md) · **Dispositions:** [`../architecture/AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md`](../architecture/AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md) · **Doc status:** [`../architecture/AI_DOCUMENT_STATUS_MATRIX.md`](../architecture/AI_DOCUMENT_STATUS_MATRIX.md)

---

## Purpose

Establish a trustworthy, repository-grounded model of Vssyl’s AI architecture so a product owner, engineer, or future agent can answer:

- What happens when a user talks to Vssyl?
- Why does each layer exist?
- Which system owns each decision?
- Where does information come from?
- What can become knowledge?
- What can take action?
- Which model performs the work?
- How can the provider change without rebuilding Vssyl?
- What complexity protects the system?
- What complexity should eventually be removed?

This audit **validates documentation against code**. Older docs are treated as hypotheses until confirmed by imports, callers, route mounts, and tests.

**Authority:** Official **analysis** reference for the current AI system. Constitutional **principles** remain in `AI_PLATFORM_CONSTITUTION.md` and `AI_KNOWLEDGE_CONSTITUTION.md`. Code remains runtime truth.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| `server/src/ai/**` (~162 production TS files, ~99 tests) | Redesign or deletion of components |
| `server/src/knowledge/**` (Knowledge Engine runtime) | Changing model names or provider config |
| AI routes, controllers, Prisma AI modules | Product code modifications |
| Frontend AI surfaces under `web/src/**` | Pushing to Git |
| Shared AI types under `shared/src/types/**` | Implementing routing tiers |
| Module AI context providers and registration | Training / fine-tuning |
| Admin AI Pipeline and Business AI | Non-AI analytics product surfaces (except AI adjacency) |
| Existing AI docs under `docs/ai/`, `docs/ai-knowledge/`, `docs/architecture/AI_*` | |

**Prior art:** `docs/ai-knowledge/deep-dive/*` (2026-07-05) is **Historical** — prefer this audit package for whole-system navigation. Constitutional docs remain authoritative for governance principles.

---

## Document map

| # | Document | Contents |
|---|----------|----------|
| 1 | [README.md](./README.md) | This navigation page |
| 2 | [AI_SYSTEM_EXECUTIVE_OVERVIEW.md](./AI_SYSTEM_EXECUTIVE_OVERVIEW.md) | Plain-English system story |
| 3 | [AI_SYSTEM_COMPONENT_INVENTORY.md](./AI_SYSTEM_COMPONENT_INVENTORY.md) | Component-by-component inventory |
| 4 | [AI_SYSTEM_END_TO_END_FLOWS.md](./AI_SYSTEM_END_TO_END_FLOWS.md) | Traced request flows + sequence diagrams |
| 5 | [AI_SYSTEM_LAYER_MAP.md](./AI_SYSTEM_LAYER_MAP.md) | Architectural layers and ownership |
| 6 | [AI_CUSTOMER_FACING_AND_BACKGROUND_MAP.md](./AI_CUSTOMER_FACING_AND_BACKGROUND_MAP.md) | Surfaces vs infrastructure |
| 7 | [AI_REDUNDANCY_AND_COMPLEXITY_AUDIT.md](./AI_REDUNDANCY_AND_COMPLEXITY_AUDIT.md) | Overlap register |
| 8 | [AI_PROVIDER_AND_MODEL_AUDIT.md](./AI_PROVIDER_AND_MODEL_AUDIT.md) | Providers, models, hardcoded inventory |
| 9 | [AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md](./AI_MODEL_ROUTING_TARGET_ARCHITECTURE.md) | Recommended FAST/BALANCED/DEEP routing (design only) |
| 10 | [AI_KNOWLEDGE_MEMORY_AND_LEARNING_MAP.md](./AI_KNOWLEDGE_MEMORY_AND_LEARNING_MAP.md) | Memory-like concepts distinguished |
| 11 | [AI_ACTION_GOVERNANCE_AUDIT.md](./AI_ACTION_GOVERNANCE_AUDIT.md) | Permissions, approvals, execution safety |
| 12 | [AI_OBSERVABILITY_COST_AND_QUALITY_AUDIT.md](./AI_OBSERVABILITY_COST_AND_QUALITY_AUDIT.md) | Telemetry and cost gaps |
| 13 | [AI_TEST_AND_REGRESSION_AUDIT.md](./AI_TEST_AND_REGRESSION_AUDIT.md) | Test inventory and gaps |
| 14 | [AI_ARCHITECTURE_DECISION_REGISTER.md](./AI_ARCHITECTURE_DECISION_REGISTER.md) | Embodied decisions and doc conflicts |
| 15 | [AI_SIMPLIFICATION_RECOMMENDATIONS.md](./AI_SIMPLIFICATION_RECOMMENDATIONS.md) | Retain / clarify / deprecate / sequence |
| 16 | [AI_SYSTEM_GLOSSARY.md](./AI_SYSTEM_GLOSSARY.md) | Term definitions |
| 17 | [AI_SYSTEM_SOURCE_OF_TRUTH_PROPOSAL.md](./AI_SYSTEM_SOURCE_OF_TRUTH_PROPOSAL.md) | Canonical doc ownership proposal |
| 18 | [AI_SYSTEM_AUDIT_FINDINGS_REGISTER.md](./AI_SYSTEM_AUDIT_FINDINGS_REGISTER.md) | Machine-readable findings table |
| 19 | [AI_SYSTEM_AUDIT_CLOSEOUT.md](./AI_SYSTEM_AUDIT_CLOSEOUT.md) | Closeout, uncertainties, next phase |

---

## Recommended reading order

1. **Product / leadership:** Executive Overview → Customer Facing Map → Simplification Recommendations → Closeout  
2. **Engineers joining AI:** Executive Overview → Layer Map → End-to-End Flows → Component Inventory → Glossary  
3. **Governance / knowledge:** Knowledge Memory Map → Action Governance → Decision Register  
4. **Provider / model work:** Provider Audit → Model Routing Target Architecture  
5. **Cleanup program:** Redundancy Audit → Findings Register → Simplification Recommendations  

---

## One-sentence architecture

Vssyl’s customer AI is a **governed Digital Life Twin pipeline** (`POST /api/ai/twin` → `DigitalLifeTwinService` → `DigitalLifeTwinCore`) that assembles authorized context, optionally reasons about conversation posture, calls a provider adapter, may run tools through domain services, enforces grounding, records diagnostics, and may propose (not silently apply) learning — with **parallel specialized paths** for ambient suggestions, Notebook completions, media (Whisper/TTS/images), Business AI policy wrappers, and admin pipeline operations.

---

## Related authorities (unchanged by this audit)

| Authority | Path |
|-----------|------|
| Repo SoT | `docs/VSSYL_SOURCE_OF_TRUTH.md` |
| AI Platform Constitution | `docs/architecture/AI_PLATFORM_CONSTITUTION.md` |
| AI Knowledge Constitution | `docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md` |
| Knowledge Decision Model | `docs/ai-knowledge/AI_KNOWLEDGE_DECISION_MODEL.md` |
| Attachment / vision | `docs/ai/ARCHITECTURE.md`, `docs/ai/PROVIDERS.md` |
| AI Retrieval Constitution | `docs/ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md` |
| Navigation guide | `docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md` |

---

## Product code confirmation

**No production code was modified during this audit.** Only documentation under `docs/ai-system-audit/` was created.
