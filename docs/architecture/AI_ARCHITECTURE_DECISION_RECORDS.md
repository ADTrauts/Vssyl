# AI Architecture Decision Records

**Program:** AI Architecture Phase 0  
**Date:** 2026-07-12  
**Status:** Active — accepted decisions for AI architecture governance  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** Formally accepted AI architecture decisions (Phase 0+)  
**Supporting evidence:** [`../ai-system-audit/AI_ARCHITECTURE_DECISION_REGISTER.md`](../ai-system-audit/AI_ARCHITECTURE_DECISION_REGISTER.md) (code-embodied inventory)  
**Code remains final runtime truth.**

---

## How to use

- **Accepted** decisions guide documentation and future design.  
- They do **not** by themselves change runtime.  
- New runtime work must still reconcile with constitutions and code.  
- Open product confirmations remain in the audit register (`CONFIRM-01` …).

---

## ADR-AI-001 — Official AI System Audit reference

| Field | Content |
|-------|---------|
| **Status** | Accepted — 2026-07-12 |
| **Decision** | `docs/ai-system-audit/` is the official whole-system **analysis** reference for current AI architecture. |
| **Rationale** | Audit is repository-grounded and more complete than fragmented prior deep-dives. |
| **Consequences** | Navigation and Reading Guide point here; deep-dive set becomes Historical; do not duplicate audit content into new parallel inventories. |

---

## ADR-AI-002 — Shared Twin runtime

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Conversational AI uses one shared runtime (`DigitalLifeTwinService` → `DigitalLifeTwinCore` via `POST /api/ai/twin`). |
| **Rationale** | Single orchestration path preserves grounding, context, and governance consistency. |
| **Consequences** | New conversational features should extend Twin, not invent a third chat stack. Specialized helpers (Notebook/media) must be labeled exemptions. |

---

## ADR-AI-003 — Business Twin as wrapper

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Business AI is a **policy and membership wrapper** over the shared Twin runtime, not a separate LLM product. |
| **Rationale** | Matches `BusinessAIDigitalTwinService` and boundary docs; protects tenant isolation. |
| **Consequences** | Business features add policy/scope, not a fork of Core. |

---

## ADR-AI-004 — Context provider architecture

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Modules expose AI context via registered providers; `ContextProviderOrchestrator` is the canonical fetch implementation; `CrossModuleContextEngine` is a facade. |
| **Rationale** | Module contract + tenant-scoped live reads; audit confirmed orchestrator ownership. |
| **Consequences** | No rename of production classes in Phase 0; documentation uses facade language. Applications remain SoR. |

---

## ADR-AI-005 — Knowledge vs Intelligence

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Knowledge (governed information) and Intelligence (reasoning/quality capability across scopes) are distinct. Global Platform Intelligence must not harvest private knowledge. |
| **Rationale** | Prevents constitutional drift and “centralized brain” misconceptions. |
| **Consequences** | [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) is SoT for this distinction. |

---

## ADR-AI-006 — Four intelligence scopes

| Field | Content |
|-------|---------|
| **Status** | Accepted (Industry = future slot only) |
| **Decision** | Personal, Business, Industry (future), and Global Platform are the official intelligence scopes. |
| **Rationale** | Gives product and engineering a shared vocabulary without implying Industry is shipped. |
| **Consequences** | Industry packs are design-only until a later phase implements them. |

---

## ADR-AI-007 — Provider independence

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Providers are adapters behind capability declarations and catalogs; business logic must not hard-depend on vendor marketing names. |
| **Rationale** | Portability and cost/capability control; matches Wave 1E matrix direction. |
| **Consequences** | Task-tier routing remains a **future** design; current heuristics stay until a later implementation phase. |

---

## ADR-AI-008 — Systems of Record ownership

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Applications own entity truth; AI reads via authorized providers and writes via domain services. |
| **Rationale** | Platform Standards §6 and AI Platform Constitution. |
| **Consequences** | Tools/actions must not bypass module AuthZ; AI stores are not a second SoR for files/events/tasks. |

---

## ADR-AI-009 — Shared runtime / scoped knowledge

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | One runtime; knowledge eligibility and policies are scoped (personal / business / future industry / platform rules). |
| **Rationale** | Matches Twin + Business wrapper + Knowledge constitutions. |
| **Consequences** | Scoping bugs are treated as trust defects, not “model mistakes.” |

---

## ADR-AI-010 — Autonomy autopilot de-emphasized

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | Silent autonomous execution is not part of the Twin hot path; autonomy settings inform boundaries; retired autonomous routes stay retired. |
| **Rationale** | Code comment A7 and audit evidence. |
| **Consequences** | Docs and mental model must not claim autopilot; product copy clarification may follow (no runtime change in Phase 0). |

---

## ADR-AI-011 — Mental Model and Reading Guide as entry docs

| Field | Content |
|-------|---------|
| **Status** | Accepted |
| **Decision** | [`AI_SYSTEM_MENTAL_MODEL.md`](./AI_SYSTEM_MENTAL_MODEL.md) and [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) are the primary human/agent entry for understanding AI architecture. |
| **Rationale** | Phase 0 objective: reduce confusion. |
| **Consequences** | Navigation guides updated; constitutions remain law for principles. |

---

## Explicitly not accepted as shipped (deferred)

| Topic | Status | Notes |
|-------|--------|-------|
| ModelTier FAST/BALANCED/DEEP live routing | Deferred | Target architecture in audit only |
| Industry knowledge packs | Deferred | Slot reserved in Intelligence Model |
| Core split refactor | Deferred | Needs tests first |
| Orphan code deletion | Deferred | Phase 1+ with gates |
| Tool always-require-approval UX | Needs Discussion | CONFIRM-01 |
| Notebook permanent exemption vs migrate | Needs Discussion | CONFIRM-02 |

See [`AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md`](./AI_AUDIT_RECOMMENDATION_DISPOSITIONS.md).
