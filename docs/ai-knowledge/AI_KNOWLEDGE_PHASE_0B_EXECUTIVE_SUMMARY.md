# AI Knowledge Reference Program — Phase 0B Executive Summary

**Program:** AI Knowledge Reference Program  
**Phase:** 0B — Vssyl Knowledge Engine & Teach Vssyl Specification  
**Date:** 2026-07-05  
**Prior phases:** 0A discovery + deep-dive audit (complete)  
**Constitution:** [AI_KNOWLEDGE_CONSTITUTION.md v1](./AI_KNOWLEDGE_CONSTITUTION.md) — **canonical authority for all future AI knowledge work**  
**Constraint:** Documentation only. No UI. No architecture redesign. No new memory store.

---

## Bottom line

Vssyl **already has a Knowledge Engine** — distributed across Digital Life Twin, Business Digital Twin, context orchestration, memory stores, V_Link, search, pipeline policies, and diagnostics. Phase 0B **names, specifies, and binds** these components. It does **not** require a new engine service, knowledge graph, or memory table.

**Teach Vssyl** is the product layer that completes the loop: correction → governed store → retrieval → proof.

**Post-0B:** The [AI Knowledge Constitution v1](./AI_KNOWLEDGE_CONSTITUTION.md) establishes the philosophical Source of Truth. Phase 1 implementation must comply with the Constitution and [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md).

---

## Final answers

### 1. Does Vssyl need a new Knowledge Engine, or do existing systems already form one?

**Existing systems already form one.** The engine is the governed composition of:

- **Twins** — personal and business orchestration
- **Taught stores** — UserMemoryFact, UserAIContext, learning events, BusinessAIDigitalTwin
- **Live retrieval** — 35 module context providers, V_Link, search, grounding prepass
- **Governance** — pipeline policies, review gates, tenant scoping
- **Proof** — responseInfluence (user), pipeline diagnostics (operator)

What's missing is **product unification and eval closure** — not a new backend monolith.

---

### 2. What is the canonical Knowledge Lifecycle?

| Stage | Summary |
|-------|---------|
| **Observation** | Chat inference, remember-that, module signals → pending or analytics |
| **Correction** | User/admin identifies wrong answer |
| **Classification** | Route by type: fact, preference, instruction, business, module redirect |
| **Review** | Inferred/ambiguous → user or business admin approve |
| **Application** | learningApplicationService or direct write → prompt-eligible |
| **Retrieval** | Memory + providers + grounding + graph + search per turn |
| **Reasoning** | Twin assembly + conversation reasoning → LLM |
| **Answer** | Response + influence metadata + trace |
| **Feedback** | Teach, thumbs, explain, regenerate |
| **Evaluation** | Retrieval + assembly assertions |
| **Regression protection** | EvalCase CI gates |

Full detail: [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) — aligned with [Constitution Article VI](./AI_KNOWLEDGE_CONSTITUTION.md#article-vi--knowledge-lifecycle).

---

### 3. What should Teach Vssyl do first?

**Phase 1 — personal chat correction loop:**

1. **Improve Answer** + **Teach Vssyl** on assistant messages
2. Classification chips → existing APIs (UserMemoryFact, UserAIContext)
3. Thumbs down → reviewable `AILearningEvent` correction (not behavioral-only)
4. **Correct this** CTA in explain drawer
5. Confirmation linking to Memory/Learning tabs
6. CI gates G1–G4 from eval spec before ship

Full detail: [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md) — must comply with [Constitution Article VII](./AI_KNOWLEDGE_CONSTITUTION.md#article-vii--teach-vssyl).

---

### 4. What should not be touched?

| Do not touch | Reason |
|--------------|--------|
| DigitalLifeTwinCore orchestration spine | Extend only |
| Pipeline policy schema and admin CRUD | Mature operator governance |
| Module context provider HTTP contract | 35 certified providers |
| Application SoR tables | Teach redirects, not copies |
| Retired 410 routes | Stable fences |
| Model training / fine-tuning | Out of scope — [Constitution Article VIII](./AI_KNOWLEDGE_CONSTITUTION.md#article-viii--what-vssyl-does-not-do) |
| New KnowledgeGraph or unified knowledge table | Audit proves unnecessary — [Constitution §2](./AI_KNOWLEDGE_CONSTITUTION.md#2-the-knowledge-engine-is-emergent-not-a-database) |

---

### 5. What is the safest Phase 1 implementation?

| Principle | Action |
|-----------|--------|
| Reuse APIs | POST memory facts, user context, teach, learning review |
| Personal scope only | Defer business admin branch |
| Explicit auto-apply | Inferred stays in Learning tab |
| Module redirect | Never write entity data to memory |
| Prove with tests | Retrieval + assembly EvalCases in CI |
| No new routes required | Modal → existing API clients |
| **Constitution compliance** | PR checklist in [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md) |

**Ship order:** Routing tests → API wiring → chat modal → explain CTA → eval gates → release.

---

### 6. What is the long-term vision?

**Vssyl as organizational intelligence layer for an Application operating system:**

| Horizon | Vision |
|---------|--------|
| **Near (6 mo)** | Teach Vssyl from any AI surface; unified What Vssyl Knows; Knowledge Health; business teach parity |
| **Mid (12 mo)** | EvalCase library from production corrections; business-scoped diagnostics; operator quality flywheel |
| **Long (18+ mo)** | Marketplace modules register teach boundaries; cross-app relationship intelligence via V_Link; optional LLM quality eval in test lab |

**Constant:** Applications remain SoR; Knowledge Engine governs what the twin retrieves and remembers; operators govern platform rules; users govern personal and approved business intelligence.

**Never:** Confuse OpenAI/Anthropic model improvements with Vssyl knowledge governance — [Constitution Article IX](./AI_KNOWLEDGE_CONSTITUTION.md#article-ix--long-term-vision).

---

## Phase 0B deliverables

| Document | Purpose |
|----------|---------|
| [AI_KNOWLEDGE_ENGINE_SPEC.md](./AI_KNOWLEDGE_ENGINE_SPEC.md) | Engine definition and component map |
| [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) | Canonical lifecycle |
| [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md) | Product flows and surfaces |
| [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md) | Type → store mapping |
| [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) | Governance and routing |
| [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md) | Proof before ship |
| This summary | Executive decisions |

---

## Constitution deliverables (post-0B)

| Document | Purpose |
|----------|---------|
| **[AI_KNOWLEDGE_CONSTITUTION.md v1](./AI_KNOWLEDGE_CONSTITUTION.md)** | **Canonical philosophy — required for all future AI knowledge features** |
| [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md) | Principles, anti-patterns, PR checklist |
| [AI_KNOWLEDGE_GLOSSARY.md](./AI_KNOWLEDGE_GLOSSARY.md) | Term definitions |

---

## Recommended next phase

**Phase 1A — Engineering (no UI polish sprint):**

1. Implement correction routing tests (G3, G4) — per [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md)
2. Implement retrieval + assembly EvalCases (G1, G2)
3. Modify thumbs-down / feedback to create reviewable corrections — per [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md)
4. Then UI: Improve Answer modal — per [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md)

**Phase 1B — Product UI:** Teach Vssyl surfaces per product spec.

**Gate:** All Phase 1 work must pass [Constitution compliance checklist](./AI_KNOWLEDGE_CONSTITUTION.md#compliance-checklist-for-new-ai-knowledge-features).

---

## Document hierarchy

```
AI Knowledge Constitution v1  ← canonical philosophy (start here)
  ├── AI Knowledge Principles
  ├── AI Knowledge Glossary
  ├── Phase 0A (discovery)
  │     └── deep-dive/ (audit evidence)
  ├── Phase 0B (specification)
  └── Phase 1 (implementation) — must comply with Constitution
```

---

## Sign-off

Phase 0B complete. Constitution v1 establishes governing principles. No code changes until Phase 1A with constitutional compliance.
