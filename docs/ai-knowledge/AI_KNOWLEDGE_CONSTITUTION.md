# AI Knowledge Constitution

**Version:** 1.0.0  
**Status:** Active — constitutional authority for AI knowledge, learning, and teaching in Vssyl  
**Date:** 2026-07-05  
**Program:** AI Knowledge Reference Program  
**Phase:** Constitution (post–0A, deep-dive, 0B)

---

## Preamble

Vssyl is not a chatbot with a memory file. Vssyl is an **Organizational Intelligence Platform** — an operating system that reasons across Applications: Drive, Chat, Calendar, Tasks, Notes, V_Link, Business, Scheduling, HR, Analytics, Marketplace, and future Applications.

OpenAI, Anthropic, and other providers supply **reasoning models**. Vssyl supplies **organizational intelligence**: what the model may know, who may teach it, how knowledge is governed, and how improvement is proven.

This Constitution is the **Source of Truth for every future AI knowledge feature**. It states **principles**, not implementation. When product, engineering, or operator decisions conflict, this document governs.

**Companion authorities (read together):**

| Document | Role |
|----------|------|
| **This document** | Philosophy, principles, lifecycle, ownership — *why* Vssyl learns this way |
| [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md) | Numbered principles — quick reference |
| [AI_KNOWLEDGE_GLOSSARY.md](./AI_KNOWLEDGE_GLOSSARY.md) | Canonical term definitions |
| [docs/architecture/AI_PLATFORM_CONSTITUTION.md](../architecture/AI_PLATFORM_CONSTITUTION.md) | AI Platform runtime boundaries |
| [docs/ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) | Retrieval and SoR alignment |
| Phase 0B specs (`AI_KNOWLEDGE_ENGINE_SPEC.md`, etc.) | Operational specification derived from this Constitution |

**Hierarchy:** Constitution (philosophy) → Phase 0B specs (design) → code (implementation). Implementation must not contradict the Constitution. Specs may be updated to align; the Constitution changes only through explicit revision.

---

## Article I — Purpose

The AI Knowledge system exists to:

1. **Compose** authorized information from Applications and taught knowledge into each AI answer.
2. **Govern** what Vssyl remembers, who may teach it, and how corrections become durable intelligence.
3. **Explain** why an answer was given — to users in plain language, to operators with diagnostic depth.
4. **Improve** through evaluation and governed learning — never through silent or uncontrolled self-modification.
5. **Preserve** organizational knowledge when models, providers, or prompts change.

The AI Knowledge system does **not** exist to replace Applications, duplicate business data, or train language models on user data without explicit governance.

---

## Article II — Foundational Principles

### §1 Applications are always the System of Record

Every Application owns its domain entities. Drive owns files. Calendar owns events. HR owns employees. Tasks owns tasks. V_Link owns relationships.

**Knowledge never owns business data.** Knowledge **references** Systems of Record through authorized retrieval at query time. Teaching Vssyl does not copy a calendar event into a memory table — it either records a **user intent** about how AI should behave, or directs the user to edit the Application.

### §2 The Knowledge Engine is emergent, not a database

The **Knowledge Engine** is the governed composition of existing components: Digital Life Twin, Business Digital Twin, context orchestration, memory stores, V_Link, search, pipeline policies, and diagnostics.

It is **not** a standalone service, knowledge graph product, or unified memory table. Naming the engine clarifies responsibility; building a new engine does not.

### §3 Explicit teaching has priority over inferred learning

What a user **deliberately teaches** overrides what the system **infers** from chat. Inference is a proposal, not a fact, until reviewed.

### §4 Inference must be reviewable

Any knowledge derived from observation without explicit user intent must pass a **review gate** before it influences answers. Users must be able to promote, edit, or dismiss inferred knowledge.

### §5 Business knowledge and personal knowledge remain separate

Personal intelligence belongs to the user. Business intelligence belongs to the organization and its admins. Tenant boundaries are non-negotiable. Business policy may overlay personal preferences **in business context** — never the reverse across tenants or users.

### §6 The AI model is replaceable; organizational knowledge is permanent

Provider models change. Prompts evolve. **Taught knowledge, Application data, and governance policies** persist independently. Vssyl does not bind organizational intelligence to a single model vendor.

### §7 Every AI answer should be explainable

Users deserve to know **what shaped an answer** — memory, preferences, workspace data, business policy — in language they understand. Operators deserve diagnostic depth. Explainability is a right, not a debug feature.

### §8 Every correction should have a governed learning path

A wrong answer is an opportunity to improve — through **classification, routing, review, application, and proof** — not through silent weight updates or unaudited prompt mutation.

### §9 Knowledge improves through evaluation, not silent mutation

No change to taught knowledge, retrieval behavior, or learning application may ship without **observable proof**: retrieval tests, assembly checks, regression protection. Improvement is measured, not assumed.

### §10 Applications teach the Knowledge Engine; the Engine never replaces Applications

Applications produce authoritative data and user actions. The Engine observes, retrieves, and composes. Users edit files in Drive, not in a shadow AI database.

### §11 Context should be assembled, not duplicated

Each turn **assembles** a view from live Application retrieval, taught memory, conversation continuity, and platform rules. The Engine does not maintain a parallel copy of module entities for convenience.

### §12 Retrieval always respects permissions

Every knowledge path — memory, providers, search, graph — must enforce the same authorization the Application would enforce for the user. AI is not a privilege escalation channel.

### §13 Teaching must be understandable by non-technical users

Teach Vssyl speaks in **facts, preferences, and rules** — not embeddings, RAG, providers, or pipeline intents. Implementation disappears behind the product experience.

### §14 Governance is tiered

| Tier | Governs |
|------|---------|
| **Users** | Personal knowledge |
| **Business admins** | Business knowledge and workspace AI policy |
| **Platform operators** | Platform behavior — intents, grounding, tools, quality |

Users do not edit pipeline policies. Operators do not edit user memory. Business admins do not override platform safety rules.

### §15 Continuous improvement is governed, never autonomous

Vssyl may detect patterns, propose suggestions, and observe behavior — but **application of learning** requires governance appropriate to scope. Uncontrolled self-modification is forbidden.

---

## Article III — Canonical Definitions

Full definitions: [AI_KNOWLEDGE_GLOSSARY.md](./AI_KNOWLEDGE_GLOSSARY.md).

| Term | Constitutional meaning |
|------|------------------------|
| **Knowledge** | Anything that may influence an AI answer: taught intent, live Application data, conversation continuity, platform rules |
| **Memory** | Durable taught knowledge a user or admin chose to retain (facts, preferences, instructions) |
| **Context** | The assembled bundle presented for a single turn — memory + live data + continuity + policy |
| **Learning** | The governed process of turning observation or correction into prompt-eligible knowledge |
| **Correction** | A user or admin signal that an answer was wrong, with an proposed fix |
| **Reasoning** | Vssyl's preparation for the model (intent, assembly, policy) plus the provider model's generation |
| **Evaluation** | Proof that knowledge was stored, retrieved, and assembled correctly |
| **Explainability** | The obligation to show what influenced an answer |
| **Organizational Intelligence** | The composed understanding of a person, team, or business across Applications — governed, scoped, explainable |
| **Knowledge Engine** | The emergent composition system that retrieves, governs, assembles, and proves knowledge |
| **Digital Life Twin** | The personal AI orchestration path |
| **Business Digital Twin** | The business-scoped AI orchestration path |
| **System of Record (SoR)** | The Application or module that authoritatively owns an entity |
| **Teaching** | The deliberate act of adding or correcting governed knowledge |

---

## Article IV — Knowledge Layers

Canonical stack. Each layer has a single responsibility. No layer may absorb another's ownership.

```
Applications (Systems of Record)
        ↓
Knowledge Engine (govern, retrieve, scope)
        ↓
Context Assembly (merge, tier, cap)
        ↓
Reasoning (intent, conversation logic, tool policy)
        ↓
Provider (language model generation)
        ↓
Explainability (influence summary, diagnostics)
        ↓
Learning (observation, correction, evaluation)
```

### Applications

**Responsibility:** Authoritative data and user edits. Files, events, tasks, employees, relationships, analytics.

**Must not:** Defer entity truth to AI memory. **Must:** Expose authorized read paths (context providers) for the Engine.

### Knowledge Engine

**Responsibility:** Decide what to retrieve, enforce scope and permissions, apply review gates, route corrections to stores, orchestrate live fetches alongside taught memory.

**Must not:** Own domain entities. **Must not:** Bypass Application permissions.

### Context Assembly

**Responsibility:** Merge retrieved pieces into a bounded, tiered prompt bundle for one turn. Prefer continuity and explicit teaching over noisy breadth.

**Must not:** Duplicate Application SoR into taught memory.

### Reasoning

**Responsibility:** Intent detection, conversation continuity, cross-module synthesis, tool and action policy — everything Vssyl does **before and after** the model call to make organization-aware answers coherent.

**Must not:** Conflate with model weights or fine-tuning.

### Provider

**Responsibility:** Language and multimodal generation from assembled context. Replaceable vendor capability.

**Must not:** Become the store of organizational knowledge.

### Explainability

**Responsibility:** Surface what shaped the answer — `responseInfluence` for users, pipeline trace for operators.

**Must not:** Expose other tenants' data or raw secrets.

### Learning

**Responsibility:** Close the loop from feedback to governed knowledge to evaluation to regression protection.

**Must not:** Auto-apply inferred knowledge without review. **Must not:** Retrain models silently.

---

## Article V — Knowledge Ownership

| Asset | Owner | Editors | Notes |
|-------|-------|---------|-------|
| **Facts** (personal) | User | User | Declarative truths about the user |
| **Facts** (business-scoped) | Business | Business admin | Employee proposals → admin review |
| **Policies** | Business / Platform | Business admin / Operator | Business twin vs pipeline rules |
| **Preferences** | User (personal) / Business (scoped) | Same | Communication style, not entity data |
| **Procedures** | User | User | Workflow habits — taught, not inferred from one turn |
| **Relationships** | Application (V_Link) | V_Link permissions | Graph is SoR — not copied to memory |
| **Documents** | Application (Drive) | Drive permissions | Live fetch or attachment — not full doc in memory |
| **Business knowledge** | Business | Business admin | Twin config, approved business learning |
| **Personal knowledge** | User | User | Memory, context, personality |
| **Temporary context** | User (session/thread) | User | Not cross-session without explicit teach |
| **Corrections** | User / Business admin | Submitter + reviewer | Audit trail via learning events |
| **Evaluations** | Platform engineering | Operators + CI | EvalCases, diagnostics — not user-editable |

**Rule:** When ownership is unclear, default to **Application SoR** for entity truth and **user review** for inferred AI knowledge.

Detail: [AI_KNOWLEDGE_GOVERNANCE.md](./AI_KNOWLEDGE_GOVERNANCE.md), [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md).

---

## Article VI — Knowledge Lifecycle

Every piece of governed knowledge follows this lifecycle. Stages may be instantaneous (explicit teach) or paused (pending review); none may be skipped silently.

```
Observation → Correction → Classification → Review → Application
      → Retrieval → Reasoning → Answer → Feedback → Evaluation → Regression Protection
```

| Stage | Constitutional requirement |
|-------|---------------------------|
| **Observation** | System may notice patterns; observation alone does not change answers |
| **Correction** | Users must have a path to fix wrong answers |
| **Classification** | Route to the correct knowledge type — fact, preference, rule, or Application redirect |
| **Review** | Required for inferred or ambiguous knowledge |
| **Application** | Only approved knowledge becomes prompt-eligible |
| **Retrieval** | Authorized fetch of taught + live knowledge per turn |
| **Reasoning** | Governed assembly and intent — not opaque model drift |
| **Answer** | Response carries explainability metadata |
| **Feedback** | Teach, improve, dismiss — feeds learning loop |
| **Evaluation** | Prove retrieval and assembly — required before scale |
| **Regression protection** | Future changes must not break proven teach paths |

Detail: [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md).

---

## Article VII — Teach Vssyl

**Teach Vssyl** is the product expression of this Constitution — how people add and correct organizational intelligence without seeing the machinery.

### What users should think

> "I tell Vssyl what's true, how I want it to help me, and when it's wrong — and it remembers with my permission."

Users think in **facts, preferences, and rules**. They edit workspace data in Applications. They review what Vssyl inferred before it sticks.

### What business admins should think

> "I set how AI behaves for our company, approve what employees teach, and keep workspace intelligence accurate."

Admins configure business policy. They do not need pipeline intent editors.

### What operators should think

> "I govern how the platform retrieves, grounds, and enforces AI behavior — not what users know."

Operators tune platform rules. They diagnose failures. They do not edit user memory except under documented support policy.

### What engineers should think

> "I route teaching to existing stores, enforce the lifecycle, respect SoR, and prove retrieval in tests."

Implementation is routing, governance, and eval — not a new knowledge monolith.

**Product capabilities (constitutional names):**

| Capability | Meaning |
|------------|---------|
| **Teach Vssyl** | Deliberate addition of knowledge |
| **Improve Answer** | Correction after a bad response |
| **What Vssyl Knows** | Inventory of taught knowledge and source awareness |
| **Why Vssyl Answered This** | Explainability with path to correct |
| **Knowledge Health** | Staleness, conflicts, pending review |

Detail: [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md).

---

## Article VIII — What Vssyl Does Not Do

1. **Retrain foundation models** on tenant data as default improvement.  
2. **Fork Application entities** into AI-only tables for convenience.  
3. **Auto-apply inferred knowledge** without review.  
4. **Allow users to edit pipeline policies** that affect all tenants.  
5. **Treat behavioral analytics** as durable memory.  
6. **Hide learning** — silent prompt mutation without audit.  
7. **Conflate search, chat, and teach** — search discovers; teach governs retention.

---

## Article IX — Long-Term Vision

### Vssyl's AI philosophy

Vssyl intelligence is **embedded in work** — across Applications, scoped to tenant, governed by role, improved by teaching and proof. The platform gets smarter because **people and organizations teach it deliberately**, not because a model mysteriously updates overnight.

### Contrast with alternatives

| Alternative | Limitation | Vssyl difference |
|-------------|------------|------------------|
| **General-purpose LLM** | No org context, no SoR, no governance | Composes live Application data + taught knowledge + policy |
| **Enterprise copilot** | Often document-centric, single-app | Multi-Application OS with V_Link relationships |
| **Knowledge base / wiki** | Static, decoupled from work | Live retrieval from SoR + governed memory |
| **Search** | Finds documents, does not learn preferences | Search informs retrieval; Teach Vssyl governs retention |
| **Autonomous agents** | Risk of uncontrolled action and learning | Governed learning path; actions through approvals |

### Organizational Intelligence Platform

An **Organizational Intelligence Platform** reasons across the systems where work already happens. It does not ask users to migrate truth into a chat sidebar. It **references** Drive, Calendar, HR, and the rest — and **remembers** what people choose to teach, with proof that teaching worked.

---

## Article X — Amendment and Compliance

### Amendment

This Constitution is **Version 1**. Amendments require:

1. Documented rationale tied to product or safety need  
2. Update to [AI_KNOWLEDGE_PRINCIPLES.md](./AI_KNOWLEDGE_PRINCIPLES.md) and glossary if terms change  
3. Explicit note in [README.md](./README.md) revision history  

Implementation may not outpace the Constitution without either compliance or formal amendment.

### Compliance checklist for new AI knowledge features

Before shipping any feature that stores, retrieves, or learns knowledge, confirm:

- [ ] Does it respect Application SoR?  
- [ ] Does it scope by tenant and role?  
- [ ] Is inference reviewable?  
- [ ] Is there an explainability surface?  
- [ ] Is there an eval or regression path?  
- [ ] Is ownership clear (user / business admin / operator)?  
- [ ] Does Teach Vssyl language stay non-technical?

---

## Article XI — Relationship to Other Constitutions

| Constitution | Relationship |
|--------------|--------------|
| [AI Platform Constitution](../architecture/AI_PLATFORM_CONSTITUTION.md) | Runtime orchestration, module boundaries — **this doc governs knowledge philosophy** |
| [AI Retrieval Constitution](../ai/retrieval/AI_RETRIEVAL_CONSTITUTION.md) | Retrieval must not duplicate SoR — **aligned** |
| [VSSYL Platform Standards](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | Module contract — Applications remain SoR |
| [UX Constitution](../ux/UX_CONSTITUTION.md) | Teach Vssyl UX must be accessible and plain-language |

**Conflict resolution:** If implementation contradicts this Constitution, stop and reconcile. If this Constitution and AI Platform Constitution conflict on **runtime ownership**, AI Platform Constitution wins. On **learning, teaching, and memory philosophy**, this document wins.

---

## Signatures

This document is effective upon commit to the canonical repository. All future AI knowledge work shall cite **AI Knowledge Constitution v1** as authority.

**Next implementation phase (post-Constitution):** Phase 1A engineering — correction routing tests, eval gates, feedback wiring — per [AI_KNOWLEDGE_PHASE_0B_EXECUTIVE_SUMMARY.md](./AI_KNOWLEDGE_PHASE_0B_EXECUTIVE_SUMMARY.md). No Teach Vssyl UI until eval gates exist.
