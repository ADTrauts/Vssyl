# AI Knowledge, Memory, and Learning Map

**Date:** 2026-07-12  
**Authorities validated against:** `AI_KNOWLEDGE_DECISION_MODEL.md`, `KNOWLEDGE_TRANSITION_MODEL.md`, runtime stores  

---

## Distinction table

| Concept | Owner | Storage | Lifetime | User visible | User control | Review required | SoT? | Provider-independent? | Influences future answers? | Triggers actions? | Deletion | Audit |
|---------|-------|---------|----------|--------------|--------------|-----------------|------|----------------------|----------------------------|-------------------|----------|-------|
| Conversation history | Twin Service / conversations | `AIConversation` / `AIMessage` | Until deleted | Yes (thread) | Delete thread | No | Thread SoT | Yes | Same-thread yes | No | User delete | Messages persisted |
| Conversation continuity | Service | Metadata on assistant msgs | Thread | Indirect | Clear thread | No | Ephemeral state | Yes | Yes (posture) | No | With thread | In metadata |
| Persisted provider reasoning | N/A today | — | — | No | — | — | **Must not** be knowledge | Provider-specific | Should not | No | — | If added: obs only |
| Temporary / session context | Preferences / Core | Session soft prefs, attach text | Session/thread | Partial (notices) | Dismiss/promote | Promote yes | No | Yes | Current session | No | Session end | Limited |
| Retrieved live context | Modules + orchestrator | Module SoR (read) | Turn | Indirect | Via module apps | No | **App SoR** | Yes | That turn | No | N/A | Provider audit |
| User profile / prefs | PreferenceResolver | Personality, autonomy settings, pref keys | Durable | Yes (/ai) | Edit | No | Preference SoT | Yes | Yes | No | User edit | Settings |
| Business data | Modules / Business twin | Module DB + `BusinessAIDigitalTwin` | Durable | Role-based | Admins | Policy | App / biz twin | Yes | When scoped | Via tools | Module rules | Module audit |
| Observations | Rules / learning heuristics | Often ephemeral then signal | Moment | Usually no | — | Before durable | No | Yes | Only if promoted | No | Dropped | Signals |
| Suggestions | Suggestion services | `AISuggestion` | TTL / dismiss | Yes | Accept/dismiss | Accept is act | No | Yes | May spawn learning | Navigate/propose | Dismiss/expire | Feedback rows |
| Learning-review candidates | AdvancedLearning / personal events | `AILearningEvent`, pending `UserAIContext` | Until review | Yes (Learning tab) | Promote/dismiss | **Yes** | Proposal | Yes | After apply | No | Dismiss | Review fields |
| Durable knowledge | Memory / context / biz policy | `UserMemoryFact`, active `UserAIContext`, biz twin | Until trash | Yes | CRUD / forget | Explicit teach bypasses inference review | Taught SoT | Yes | Yes | No (knowledge≠action) | Trash/delete | Provenance |
| Model training | Not Vssyl product path | Vendor | Vendor | No | Vendor settings | N/A | Vendor | No | Opaque | No | Vendor | Out of band |
| Prompt caching | Adapter (future) | Provider cache | Short | No | No | No | No | No | Turn perf only | No | TTL | Should log |
| Context graph relationships | Knowledge / Place / V_Link | Graph/neighborhood services | Durable links | Partial | Module UIs | Module | Relationship SoT | Yes | Via retrieval | No | Module | Module |
| Source-of-record data | Applications | Module Prisma | Durable | App UIs | App CRUD | App AuthZ | **Canonical** | Yes | Via live retrieval | App actions | Trash patterns | Activity events |
| Analytics | Product analytics (separate) | Analytics stores | Aggregate | Dashboards | Limited | No | Metrics | Yes | Should not alter knowledge silently | No | Retention | Ops |
| Behavioral signals | Learning / suggestions | Events / patterns | Varies | Sometimes | Review | Often | Signal | Yes | Soft prefs if applied | No | Retention | Learning pipeline |

---

## Decision Model vs implementation

| Decision Model outcome | Runtime path | Gap? |
|------------------------|--------------|------|
| Explicit teaching | Teach Vssyl, user-context CRUD, “remember that…” | remember-that is heuristic auto-persist — **explicit phrase** treated as teach (OK) but weak NLP risk |
| Inference → review | Learning events / pending UserAIContext | Partially wired; not one classifier service |
| Temporary context | Session prefs, continuity, attachment text | OK |
| Suggestion | `AISuggestion` ambient | OK — not durable knowledge |
| Live retrieval | Orchestrator + grounding + knowledge compose | OK |
| Ignore | Dedup/rules drop | Distributed; hard to audit all ignores |

---

## Paths that write durable state — governance check

| Write | Gate | Concern |
|-------|------|---------|
| `maybePersistRememberThatFact` | Phrase heuristic; user-initiated message | Medium — ensure tenantscope + no silent inference without phrase |
| UserAIContext create (user) | Auth + CRUD | OK |
| UserAIContext pending→active | Review endpoints | OK |
| AILearningEvent apply | Review / validation flags | Confirm all apply paths require review for inferred |
| BusinessAIDigitalTwin config | Biz admin | OK |
| AdvancedLearningEngine.processInteraction | May create proposals | Must not auto-mark prompt-eligible without validation |
| Suggestion accept | User action | May spawn learning — follow transition model |
| Tool/action DB writes | Domain AuthZ | Not knowledge — execution governance |

**Finding KNL-01:** Distributed ingress — Decision Model is not a single runtime gate. Risk is **inconsistent classification**, not absence of all gates.

**Finding KNL-02:** `server/src/ai/knowledge/` empty vs `server/src/knowledge/` active — naming hazard for agents.

---

## Learning vs Knowledge Engine

```
Ingress (Decision Model philosophy)
  → stores / proposals
Per-turn (Knowledge Engine runtime in server/src/knowledge + assemblers)
  → retrieve → assemble → reason (LLM) → explain → feedback
```

Do not conflate AdvancedLearningEngine (signals) with Knowledge Engine (composition).
