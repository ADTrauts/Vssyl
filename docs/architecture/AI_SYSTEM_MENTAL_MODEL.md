# AI System Mental Model

**Program:** AI Architecture Phase 0  
**Date:** 2026-07-12  
**Status:** Active — constitutional explanation for product owners and new developers  
**Owner:** AI Platform / Architecture council  
**Source of Truth for:** Plain-English AI mental model (what Vssyl AI *is*)  
**Supporting:** [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) · [`../ai-system-audit/README.md`](../ai-system-audit/README.md) · [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md)  
**Reading order:** [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md)

---

## One sentence

Vssyl AI is a **governed Digital Life Twin**: it answers using authorized live workspace data and user-approved knowledge, through a shared runtime, while applications remain the systems of record and model providers remain replaceable adapters.

---

## What happens when a user talks to Vssyl?

1. The user opens AI chat (or the header assistant) and sends a message — optionally with files.  
2. The platform authenticates the user, checks usage limits, and applies workspace scope (personal and/or business).  
3. A **shared AI runtime** loads conversation continuity and any durable personal memory the user has allowed.  
4. It gathers **context**: relevant live facts from modules (Drive, Calendar, Chat, Todo, Place, and others) the user is allowed to see.  
5. It may **ground** the answer against required sources so the reply is not free-floating invention.  
6. It sends a carefully assembled prompt to an **external model provider** (or a local/private path when policy requires).  
7. The model proposes language and, sometimes, tool calls. Tools that change the workspace run only through **application services** with normal permissions.  
8. Risky or uncertain learning is **proposed**, not silently written as lasting knowledge.  
9. The user sees the answer, optional explanations, and any attachment issues. Operators can inspect diagnostics separately.

The model is a reasoning and language component. It is **not** the database, **not** the permission system, and **not** durable memory by itself.

---

## The pieces (plain English)

### Personal Twin

The user’s conversational assistant for their life and work in Vssyl. It uses personal memory, preferences, and module context the user can access. Product surfaces: `/ai-chat`, header AI, dashboard AI, AI Identity (`/ai`).

### Business Twin

The same shared runtime, wrapped with **business policy and membership**. Employees get assistance under business rules; admins configure business AI behavior. Personal private knowledge must not leak across businesses.

### Shared AI Runtime

One orchestration path for conversational turns (context assembly, grounding, provider call, tools, diagnostics). Personal and Business Twins are **scopes over the same runtime**, not two unrelated AI products.

### Knowledge

Information that may legitimately influence answers: taught facts, approved learning, live application data, business policies. Knowledge has **ownership, review, and deletion**. See the Knowledge Decision Model for how new information is classified.

### Intelligence

The platform’s ability to **reason well over knowledge and context** — routing, grounding quality, conversation posture, evaluations, safety. Intelligence improves *how* Vssyl thinks; it is not a pile of private customer facts. See [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md).

### Context

What is true *for this turn*: identity, workspace, conversation, permissions, and relevant records fetched live. Context is mostly temporary. It is not automatically “learning.”

### Learning

The governed process of turning observations or teaching into **prompt-eligible** knowledge — usually with review for inferred items. Learning is not model fine-tuning of Vssyl’s vendor models.

### Global platform improvement

How Vssyl gets better for everyone: better prompts, grounding rules, evaluations, routing policy, safety — **without** harvesting private personal or business knowledge into a shared brain.

### Business protection

Tenant isolation, membership checks, business AI policies, and review gates so organizational data stays inside authorized boundaries.

### Personal memory

Facts and preferences the user has saved or approved (for example memory facts and taught context). User-visible and user-controllable. Distinct from conversation history and from provider-side “memory” features.

### Systems of Record

Applications own entities (files, events, tasks, messages, HR records). AI **reads** them through authorized context providers and **writes** only through domain services. AI must not become a second copy of the truth.

### Model providers

External (or local) LLM services that generate text and tool proposals. Today: OpenAI, Anthropic, and a local/private path. Providers are adapters behind capability declarations.

### Provider independence

Product logic must not depend on a single vendor’s model marketing names. Selection and capabilities belong in configuration and adapters so providers can change without rebuilding Vssyl.

---

## Why multiple layers exist

| Layer idea | Why it exists |
|------------|---------------|
| Experience | What people click and read |
| Understanding | Decide posture before solving (avoid premature answers) |
| Context | Authorized facts for this turn |
| Retrieval / grounding | Evidence, not vibes |
| Knowledge | Durable influence with governance |
| Governance | Permissions, approvals, policies |
| Execution | Side effects only via apps |
| Model routing | Which provider/model; cost and capability |
| Observability | Operators can see what happened |

Layers exist because **different decisions have different owners and failure modes**. Collapsing them into “just call the model” would break trust, tenancy, and product ownership.

---

## What is implemented today (honest summary)

| Capability | Today |
|------------|--------|
| Personal conversational Twin | **Shipped** — primary path |
| Business-scoped Twin wrapper | **Shipped** |
| Module context providers | **Shipped** for built-in modules |
| Pipeline grounding & diagnostics | **Shipped** (operator hub) |
| Governed personal memory / learning review | **Shipped** (surfaces still evolving) |
| Ambient suggestions | **Shipped** (separate from Twin chat) |
| Full autopilot autonomy | **Not on Twin path** — settings exist; silent auto-execution de-emphasized |
| Industry knowledge packs | **Future** — not a shipped product layer |
| Task-tier model routing (FAST/BALANCED/DEEP) | **Future design** — current routing is preference + heuristics + capabilities |
| Notebook / media helpers | **Shipped** as specialized paths alongside Twin |

Authoritative analysis of runtime detail: [`../ai-system-audit/README.md`](../ai-system-audit/README.md).

---

## What this document is not

- Not a replacement for the AI Platform Constitution (principles and boundaries).  
- Not an inventory of every class and route (see the System Audit).  
- Not a license to redesign runtime in documentation-only phases.

---

## Related documents

| Need | Document |
|------|----------|
| Reading order | [`AI_READING_GUIDE.md`](./AI_READING_GUIDE.md) |
| Knowledge vs Intelligence | [`AI_INTELLIGENCE_MODEL.md`](./AI_INTELLIGENCE_MODEL.md) |
| Platform law | [`AI_PLATFORM_CONSTITUTION.md`](./AI_PLATFORM_CONSTITUTION.md) |
| Personal vs business boundaries | [`AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](./AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) |
| Whole-system audit | [`../ai-system-audit/README.md`](../ai-system-audit/README.md) |
