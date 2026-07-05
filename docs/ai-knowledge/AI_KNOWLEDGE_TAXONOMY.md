# AI Knowledge Taxonomy

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Purpose:** Proposed categories for product language — mapped to **existing** storage, not new tables

---

## 1. Should categories become first-class concepts?

**Yes — in the product UI and correction router.**  
**No — as new database primitives in Phase 1.** Existing schema already carries most distinctions (`category`, `contextType`, `interactionType`, `sourceType`).

---

## 2. Proposed user-facing taxonomy

Categories users understand without AI jargon:

| Category | User label | Meaning | Existing storage |
|----------|------------|---------|------------------|
| **Fact** | Something true about me or my work | Stable declarative statement | `UserMemoryFact`, `UserAIContext` (fact) |
| **Preference** | How I want Vssyl to communicate or decide | Style, tone, priorities | `UserAIContext` (preference), `AIPersonalityProfile`, applied `AILearningEvent` |
| **Instruction** | Rules the AI should follow | "Always…", "Never…" | `UserAIContext` (instruction/workflow) |
| **Procedure** | Steps for recurring workflows | Multi-step habits | `UserAIContext` (workflow) |
| **Memory** | Umbrella term in UI | Facts + preferences user explicitly saved | `UserMemoryFact` + promoted `UserAIContext` |
| **Suggestion** | Something Vssyl noticed | Ambient, dismissible | `AISuggestion` |
| **Pending review** | Something Vssyl inferred | Needs approval | `UserAIContext` (`learningStatus: pending`), `AILearningEvent` (pending) |
| **Workspace data** | Files, calendar, tasks, etc. | Lives in modules — not "taught" | Module providers, Drive, etc. |
| **Business policy** | Rules for this company | Admin-defined | `BusinessAIDigitalTwin`, business `UserAIContext` scope |
| **Temporary context** | This conversation only | Attachments, session prefs | `AIMessage`, session prefs, attachments |
| **Correction** | Fix for a wrong answer | Training signal | `AILearningEvent` (correction types) |

---

## 3. Operator-facing taxonomy

| Category | Operator label | Storage / surface |
|----------|----------------|-------------------|
| **Pipeline policy** | Intent / grounding / tool rule | `AIPipeline*Policy` |
| **Source catalog** | Context source | `AIPipelineContextSourcePolicy`, registry |
| **Provider config** | LLM provider governance | Provider panel, env |
| **Diagnostic evidence** | What influenced a turn | `AIPipelineDiagnostic.traceJson` |
| **Module certification** | Provider health | Test Lab, certification service |
| **Platform prompt** | Non-editable prompt block | Code in `server/src/ai/prompts` |

---

## 4. Mapping from example list to Vssyl

| Example term | Vssyl mapping | First-class UI? |
|--------------|---------------|-----------------|
| Facts | `UserMemoryFact`, context facts | Partial (Memory tab) |
| Policies | Business twin restrictions, instructions | Business AI only |
| Preferences | Personality, preference context | Behavior + Memory |
| Procedures | Workflow context type | Memory (workflow section) |
| Vocabulary | Not separate — part of facts/instructions | No |
| Memories | Umbrella UX term | Memory tab |
| Experiences | `AILearningEvent`, patterns | Learning tab |
| Relationships | V_Link + graph bundles | Place/V_Link modules — not teach UI |
| Documents | Drive `File` | Drive — not Memory |
| Reference material | Attachments, pinned notes | Chat attach, notes provider |
| Corrections | Learning events | Learning tab (no chat entry) |
| Rules | Instructions + business policy | Memory + Business AI |
| Business knowledge | Business twin + scoped context | Business AI CC |
| Personal knowledge | Layer A personal scope | `/ai` |
| Temporary context | Session + thread | Chat (implicit) |
| Permanent context | Non-expired facts/instructions | Memory |
| AI training signals | `AILearningEvent`, suggestion feedback | Learning, Suggestions |

---

## 5. Category decision tree (for correction router — design)

When user says "that's wrong," route by intent:

```
Wrong answer?
├── About me / my role / my preference → Preference or Fact
│   ├── Stable truth → UserMemoryFact (or UserAIContext fact)
│   └── How to behave → UserAIContext instruction or AILearningEvent
├── About my company → Business scope
│   └── Business admin → BusinessAILearningEvent / business context
├── About a file or document → Workspace data (Drive/module — not memory)
├── About schedule/tasks → Module data (edit in Calendar/Todo)
├── About this conversation only → Temporary (thread note — future)
└── About what Vssyl should do globally → Instruction (personal) or escalate to support
```

Full UX: [AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md)

---

## 6. Priority / lifetime (existing fields)

| Taxonomy | Priority signal | Lifetime signal |
|----------|-----------------|-----------------|
| Fact | `confidence`, explicit flag | `expiresAt`, `trashedAt` |
| Context entry | `priority` on `UserAIContext` | `learningStatus`, active flag |
| Learning event | `validated`, applied | event status |
| Module data | — | SoR lifecycle in module |
| Pipeline policy | `priority` on source policies | Until admin changes |
| Thread context | tier in assembler | thread archive |

**Gap:** No unified **stale** badge in user UI despite `expiresAt` and `updatedAt` existing.

---

## 7. AI influence by category

| Category | Typical influence strength | When loaded |
|----------|---------------------------|-------------|
| Instruction | Critical — prompt mandate | Every turn (if active) |
| Fact | High — memory retrieval | Relevant turns + recall |
| Preference | High — system prompt | Every turn |
| Workspace data | High when intent matches | Provider fetch / search |
| Pending review | **None** until promoted | Excluded from prompt |
| Suggestion | Low — sidebar only | Not in twin prompt |
| Pipeline policy | Enforced — can block/warn | Every turn (operator rules) |

---

## 8. Recommendation

1. **Adopt 6 user-facing types:** Fact, Preference, Instruction, Workspace data, Pending review, Business policy  
2. **Retire user-facing synonyms:** "Custom context" vs "Memories" vs "Facts" → under **Teach**  
3. **Keep operator types separate:** Pipeline, Diagnostics, Providers  
4. **Do not add `KnowledgeCategory` enum to Prisma in Phase 1** — map in UI layer from existing fields

---

## 9. Taxonomy maturity

| Aspect | Score |
|--------|------:|
| Schema support for categories | 75% |
| Consistent naming in code | 65% |
| User-visible taxonomy | 30% |
| Operator-visible taxonomy | 60% |
| **Overall taxonomy maturity** | **35%** as product concept, **75%** as data model |
