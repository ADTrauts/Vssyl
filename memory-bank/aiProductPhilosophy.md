# AI Product Philosophy

**Status:** Active product philosophy · **Last verified:** 2026-09-05  
**Authority:** Durable AI product intent and user-facing expectations  
**Not:** Architecture Source of Truth, implementation guide, provider API, status ledger, or vendor documentation

This file preserves durable AI product philosophy and user-facing expectations. Implementation mechanics and technical authority live in the canonical AI architecture documentation.

---

## Purpose

Vssyl provides **contextual intelligence** across the platform so people can **understand, decide, and act with less operational friction**.

Intelligence should work through the existing Vssyl system; use product/domain truth; connect relevant authorized context; help explain state; support decisions; assist with action when permitted; and **reduce work** rather than become another system users administer. It is not merely a chatbot bolted onto an API.

---

## Digital Life Twin

**The Digital Life Twin is Vssyl’s governed contextual intelligence layer.** It brings together the user’s authorized identity, relevant context, memory, relationships, domain truth, available capabilities, and reasoning so Vssyl can understand and assist within the user’s current situation.

**Twin is:** shared Vssyl intelligence; contextual; governed; permission-aware; able to reason across authorized context; scoped to Personal and/or Business situation.

**Twin is not:** synonymous with an LLM; a system of record for product domains; a second copy of Vssyl data; an independent AI brain per application; an unrestricted universal-context engine.

How visible the name “Digital Life Twin” should be to end users is an **open product decision**. The philosophy stands either way.

---

## Model role

**The model provides language and reasoning capability. Vssyl provides the system around that reasoning: identity, authoritative context, memory, relationships, permissions, tools/capabilities, actions, and provenance.**

The model is not the system of record. Model output alone is not authoritative product truth. Model or provider may change without redefining Vssyl intelligence. Product logic must not depend conceptually on a specific provider brand. Model training is not memory and is not ordinary Vssyl personalization. Replacing the LLM should not replace the Twin’s product identity.

---

## Systems of record

**Applications remain systems of record for their domains.**

AI may read authorized domain truth, reason over it, and recommend or act through governed product capabilities. AI must not create shadow authoritative copies of domain entities. Actions flow through the owning product/domain.

At product level: **authorize → perform → recognize success → surface resulting activity/attention.** Unauthorized or failed AI actions must not be represented as successful.

---

## Context

**Context is the authorized, relevant information Vssyl can appropriately use for the current situation.**

Keep distinct: **domain truth** (authoritative app records); **memory** (governed durable continuity); **relationship context**; **conversational history**; **inference** (suggested, not confirmed); **external information** (only when retrieved and governed).

Relevant ≠ everything. Authorized ≠ universally available. Unavailable truth must not be fabricated. Moving between Personal and Business (or tenants) can change what is appropriate. Relationship context does not automatically grant access.

---

## Personal and Business

**Personal and Business are governed scopes over shared Vssyl intelligence, not separate AI brains.**

- **Shared:** reasoning infrastructure, Twin platform capabilities, interaction principles, common governance patterns.
- **Personal:** personal context, preferences, governed personal memory, personal history and relationships.
- **Business:** tenant/domain truth, business policies, organization/module state, business-authorized actions.

No silent transfer of private Personal knowledge into Business context. No silent transfer of one Business’s private knowledge into another. Cross-scope relationship ≠ cross-scope permission. Deliberate cross-scope knowledge reuse remains an **open product decision**.

---

## Memory and continuity

**Memory gives Vssyl continuity without turning conversation or inference into an uncontrolled source of truth.**

Not everything said becomes durable memory. Explicit facts/preferences and inferred information are different; inference must not silently become authoritative fact. Durable memory should retain provenance where appropriate and remain governable. Recall should be relevant — not dump everything into every turn. Conversation should stay lean and natural. AI should use memory naturally rather than narrating internal memory machinery to the user.

**User control over durable memory is a product principle.** Exact inspection, correction, and deletion UX remains an **open product decision**.

---

## Relationships (V_Link)

**V_Link supplies governed relationship context; it does not own linked entities and does not create access by itself.**

Source applications retain entity ownership. Relationships may enrich reasoning. Link ≠ access. Relationship context ≠ memory. Suggested or unconfirmed relationships must not be treated as established truth where confirmation is required. V_Link is not an omniscient AI graph.

---

## Tools and action

Distinguish **explain · recommend · assist/prepare · act** without treating these as a formal state machine.

AI may act through Vssyl capabilities when the capability exists, the action is permitted, relevant policy allows it, and required approval or confirmation has been satisfied. **A model’s proposed tool call is not permission.** Actions route through domain owners. Do not claim unshipped purchase, booking, commerce, or similar external action capabilities as product promises.

---

## Autonomy

**Autonomy does not mean silent autopilot.**

Vssyl should reduce unnecessary work while preserving understandable control over material actions. Ambient observation, suggestion, and drafting can reduce friction. Approval-gated actions remain approval-gated. AI must not silently expand its authority. Confidence does not replace permission. Exact confirmation expectations remain an **open product decision**.

---

## Permissions and governance

**Policy Engine** owns authorization enforcement. AI inherits the user’s authority — never broader. Tenant/business scope matters; personal privacy remains enforceable. Business policy may constrain AI behavior. Restricted tools and data remain restricted. Privileged AI actions should be auditable. Denial must not appear as success.

---

## Conversational behavior

Users should receive answers that match **intent and trust needs**, not a forced template.

- **Conversation** — natural explanation, exploration, education, coaching, ordinary discussion.
- **Grounded answer** — correctness materially depends on authoritative or private Vssyl context.
- **Enterprise-shaped answer** — structured analytical / decision-support form when genuinely appropriate.

Conversation ≠ ungrounded. Grounded ≠ rigid. Enterprise-shaped ≠ “anything about a business.” Business topic ≠ enterprise format. Educational comparison can remain conversational. Simple questions should not be buried under unnecessary structure. Recommendations and coaching should not overwhelm the requested answer.

---

## AI-exposed products

**Products may expose context and capabilities to shared Vssyl intelligence without each product creating its own independent AI system.**

The AI contract applies **if a product is AI-exposed**. Not every module must expose AI. AI-exposed modules must provide healthy, governed integration. Domain truth remains with the module. Shared Twin reasoning may appear across product surfaces.

---

## Learning, memory, and personalization

| Term | Meaning |
|------|---------|
| Baseline intelligence | Reasoning/language capability (model/system) |
| Context | Authorized relevant information available now |
| Memory | Governed durable continuity |
| Domain truth | Authoritative application records |
| Personalization | Preferences / reviewed knowledge that adjust behavior |
| Learning | Governed improvement/personalization only where supported — **not** general intelligence |

Reject: “AI learns everything”; ContinuousLearning as universal platform truth; private-knowledge harvesting as “global intelligence”; any implication that normal Vssyl use automatically trains the underlying model. Long-term product vocabulary for “learning” remains open.

---

## Trust and provenance

Authoritative records ≠ inference. AI must not fabricate Vssyl state. Inferred information should remain distinguishable from confirmed truth. Durable information should retain provenance where supported. Actions should be verified through their owning product/domain. Uncertainty must not masquerade as certainty. Exact citation UI is not defined here.

---

## Non-goals

AI is not a domain system of record · no independent AI brain per application by default · no unrestricted universal context · no permission bypass · no shadow authoritative database of domain entities · no private-knowledge harvesting as “global intelligence” · no “learns/trains from everything” implication · no silent autopilot · model/provider brand is not Vssyl’s intelligence identity · not every module must expose AI · V_Link ≠ memory · link ≠ permission · response shape ≠ business-topic classification · Personal and Business are not two unrelated engines.

---

## Open product questions

1. How visible should “Digital Life Twin” be to end users?  
2. Exact Personal ↔ Business memory ownership and boundaries  
3. Depth of business-controlled AI policy  
4. How inferred knowledge becomes durable  
5. Exact user memory-control UX (inspect / correct / delete)  
6. Autonomy and confirmation expectations  
7. Desired level of proactive assistance  
8. Whether any cross-business knowledge reuse is ever allowed — and under what rules  
9. Organizational memory ownership  
10. Long-term product meaning of “learning”

---

## Canonical architecture pointers

| Concern | Owner |
|---------|--------|
| Mental model | [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../docs/architecture/AI_SYSTEM_MENTAL_MODEL.md) |
| Platform AI law | [`docs/architecture/AI_PLATFORM_CONSTITUTION.md`](../docs/architecture/AI_PLATFORM_CONSTITUTION.md) |
| Personal / Business boundaries | [`docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md`](../docs/architecture/AI_BUSINESS_PERSONAL_TWIN_BOUNDARIES.md) |
| Intelligence / knowledge | [`docs/architecture/AI_INTELLIGENCE_MODEL.md`](../docs/architecture/AI_INTELLIGENCE_MODEL.md), [`docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md`](../docs/ai-knowledge/AI_KNOWLEDGE_CONSTITUTION.md) |
| Context assembly / providers | [`docs/architecture/AI_CONTEXT_ASSEMBLY.md`](../docs/architecture/AI_CONTEXT_ASSEMBLY.md), [`docs/guides/AI_CONTEXT_PROVIDER_API.md`](../docs/guides/AI_CONTEXT_PROVIDER_API.md) |
| Memory notes (current) | [`memory-bank/AI_CONTEXT_MEMORY_ARCHITECTURE.md`](./AI_CONTEXT_MEMORY_ARCHITECTURE.md) |
| Tools / approval | [`docs/architecture/AI_TOOL_RISK_AND_APPROVAL_POLICY.md`](../docs/architecture/AI_TOOL_RISK_AND_APPROVAL_POLICY.md) |
| Authorization | [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md) |
| V_Link | [`docs/architecture/V_LINK.md`](../docs/architecture/V_LINK.md) |
| Module AI exposure | [`memory-bank/moduleSpecs.md`](./moduleSpecs.md) |
| Navigation / status | [`docs/architecture/AI_READING_GUIDE.md`](../docs/architecture/AI_READING_GUIDE.md), [`docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md`](../docs/architecture/AI_DOCUMENT_STATUS_MATRIX.md) |

Legacy narratives in `aiContextSystem.md` are **not** philosophy authority here; retirement and reference repair are a separate batch.
