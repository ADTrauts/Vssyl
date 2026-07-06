# AI Knowledge Principles

**Version:** 1.0.0  
**Status:** Active — derived from [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)  
**Date:** 2026-07-05

Quick-reference principles for design review, PR checklist, and onboarding. If a principle conflicts with the Constitution, the Constitution wins.

---

## Core principles

| # | Principle | One line |
|---|-----------|----------|
| **P1** | **Applications are SoR** | Knowledge references Applications; it never owns business data |
| **P2** | **Engine is emergent** | Knowledge Engine = governed composition of existing components — not a new database |
| **P3** | **Explicit beats inferred** | Deliberate teaching overrides observation |
| **P4** | **Inference is reviewable** | No prompt use until user or admin approves inferred knowledge |
| **P5** | **Tenant separation** | Personal and business knowledge remain isolated and scoped |
| **P6** | **Models are replaceable** | Organizational knowledge outlives any provider or model |
| **P7** | **Answers are explainable** | Every answer should say what shaped it |
| **P8** | **Corrections are governed** | Wrong answers follow classification → review → application → proof |
| **P9** | **Improve by evaluation** | No silent mutation; prove retrieval and assembly |
| **P10** | **Apps teach; Engine composes** | Applications produce truth; Engine retrieves and assembles |
| **P11** | **Assemble, don't duplicate** | Context is per-turn composition — not a shadow SoR |
| **P12** | **Permissions always** | Retrieval respects the same auth as Applications |
| **P13** | **Plain-language teach** | Users teach facts, preferences, rules — not RAG or embeddings |
| **P14** | **Tiered governance** | Users → personal; business admins → business; operators → platform |
| **P15** | **Governed improvement only** | Continuous learning yes; autonomous self-modification no |

---

## Design principles (feature-level)

| # | Principle | Application |
|---|-----------|-------------|
| **D1** | **Route, don't reinvent** | Teach Vssyl routes to existing stores — no new memory tables without constitutional amendment |
| **D2** | **Redirect entity fixes** | Wrong calendar time → Calendar app, not memory |
| **D3** | **Two explainability audiences** | Users get influence summary; operators get trace |
| **D4** | **Eval before scale** | Teach loop requires CI retrieval proof before broad UI rollout |
| **D5** | **Correction creates audit** | Improve Answer leaves a learning event trail |
| **D6** | **Module providers are read paths** | Context providers fetch; they do not teach |
| **D7** | **Pipeline is operator-only** | Users never edit intents, grounding, or tool policies |
| **D8** | **Behavior ≠ memory** | Thumbs, stars, analytics are not durable taught knowledge unless reviewed |
| **D9** | **Business employee ≠ business admin** | Employee business teaches require admin approval |
| **D10** | **Constitution travels with features** | New AI knowledge PRs cite applicable principles |

---

## Anti-patterns (forbidden)

| # | Anti-pattern | Why forbidden |
|---|--------------|---------------|
| **A1** | Copy module entity into `UserMemoryFact` for convenience | Violates P1, P11 |
| **A2** | Auto-promote chat inference to active context | Violates P4 |
| **A3** | User correction writes pipeline policy | Violates P14 |
| **A4** | Skip permission check on AI retrieval path | Violates P12 |
| **A5** | Ship teach UX without retrieval eval | Violates P9, D4 |
| **A6** | Fine-tune on tenant data as default improvement | Violates P6, P15 |
| **A7** | Hide what influenced an answer | Violates P7 |
| **A8** | Unified "AI database" for all knowledge types | Violates P2 |

---

## PR checklist (minimal)

- [ ] **P1** — Entity data still lives in Application SoR?  
- [ ] **P4** — Inferred paths gated by review?  
- [ ] **P5** — Scoped by userId / businessId / dashboardId?  
- [ ] **P7** — Explainability updated or preserved?  
- [ ] **P9** — Tests prove store → retrieval → assembly?  
- [ ] **P13** — User-facing copy is non-technical?  
- [ ] **P14** — Correct governance tier?

---

## Related documents

- [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md) — full authority  
- [AI_KNOWLEDGE_GLOSSARY.md](./AI_KNOWLEDGE_GLOSSARY.md) — terms  
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) — lifecycle stages  
- [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) — routing implementation spec
