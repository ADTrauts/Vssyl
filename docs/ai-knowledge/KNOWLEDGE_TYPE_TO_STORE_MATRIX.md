# Knowledge Type to Store Matrix

**Program:** AI Knowledge Reference Program — Phase 0B  
**Date:** 2026-07-05  
**Status:** Canonical mapping — **no new stores**

Maps each knowledge type to existing Vssyl storage, scope, governance mode, and prompt influence path.

---

## 1. Master matrix

| Knowledge type | User label | Canonical store | Alternate / legacy | Scope | Review | Prompt path |
|----------------|------------|-----------------|---------------------|-------|--------|-------------|
| **Fact** | Something true about me/work | `UserMemoryFact` | `UserAIContext` (fact) — avoid duplicate | personal / business / household | None if explicit | `MemoryRetrievalService` |
| **Policy** | Company rule AI must follow | `BusinessAIDigitalTwin` (restrictions, capabilities) | `Business.aiSettings` JSON | business | Business admin | Business policy block |
| **Preference** | How I want AI to communicate | `UserAIContext` (`contextType: preference`) | `AIPersonalityProfile`, applied `AILearningEvent` | personal / business | Pending if inferred | `PreferenceResolver` |
| **Procedure** | Steps for recurring workflow | `UserAIContext` (`contextType: workflow`) | — | personal / module scope | Pending if inferred | Context block in assembler |
| **Instruction** | Always/never rules | `UserAIContext` (`contextType: instruction`) | — | personal / business | Pending if inferred | Context block + preference resolver |
| **Vocabulary** | Terms and meanings | `UserAIContext` (fact/instruction) or `UserMemoryFact` | Not separate table | personal / business | None if explicit | Memory or context retrieval |
| **Relationship** | Who/what is connected to whom | **V_Link** (`VLink`, `VLinkEntity`) | Graph via `vlinkPipelineContextService` | tenant | Module permissions | Pipeline + `vlink.recent_vlinks` provider |
| **Document reference** | A file AI should know about | **Drive `File`** (SoR) | Attachment on `AIMessage` for turn | dashboard / business | Module PE | `fileAnalysisService` + drive providers |
| **Application object** | Calendar event, task, employee, etc. | **Module SoR tables** | Context providers | tenant | Module PE | Live provider fetch — never memory |
| **Temporary context** | This conversation only | `AIMessage`, session prefs | `AIConversation` continuity | session / thread | None | Same-thread history; not cross-session |
| **Business rule** | Employee-facing company norm | `BusinessAIDigitalTwin` + business-scoped `UserAIContext` | `BusinessAILearningEvent` | business | Admin if employee-proposed | Business policy + scoped context |
| **Personal memory** | Umbrella UX term | `UserMemoryFact` + active `UserAIContext` | — | personal | Mixed | Combined retrieval |
| **Correction** | Fix for wrong answer | `AILearningEvent` (`eventType: correction`) | → applies to fact/context | personal | User approve if ambiguous | After apply → target store |
| **Pattern** | Repeated behavior signal | `AILearningEvent` (`pattern_recognition`) | `GlobalPattern` (collective) | personal / platform | User / consent | Low priority context block |
| **Suggestion** | Ambient proposal | `AISuggestion` | — | personal | User accept/dismiss | Accept → pending preference |
| **Experiential** | Chat-derived rollup | `AIConversation.threadSummary`, `topics` | `AIMessageRecallIndex` | personal | None | Cross-session + recall intent |
| **Platform rule** | Intent/grounding/tool policy | `AIPipeline*Policy`, `AIPipelineSettings` | Code defaults | platform | Operator | Gates retrieval — not content |
| **Module manifest** | Keywords, provider URLs | `ModuleAIContextRegistry` | — | platform | Operator | Query routing |
| **Diagnostic evidence** | What influenced a turn | `AIPipelineDiagnostic`, `AIConversationHistory` | — | platform / user audit | None | Not prompt — audit only |

---

## 2. Detailed type specifications

### Fact

**Definition:** Stable declarative statement about the user, their role, or their environment.

**Canonical store:** `UserMemoryFact`  
**Fields:** `subject`, `predicate`, `scope`, `sourceType`, `confidence`

**When to use `UserAIContext` fact instead:** Short-lived or module-scoped fact tied to `scopeId` (project/folder). Prefer memory fact for global personal truths.

**Teach Vssyl route:** `POST /api/ai/memory/facts`

---

### Policy

**Definition:** Organizational rule that constrains AI behavior for all members of a business.

**Canonical store:** `BusinessAIDigitalTwin` (`restrictions`, `capabilities`, `aiPersonality`)  
**Not:** Personal memory with business scope for company-wide rules — use twin config.

**Teach surface:** Business AI Control Center — not personal chat (unless admin).

---

### Preference

**Definition:** Communication style, verbosity, tone, formatting — how AI responds.

**Canonical store:** `UserAIContext` (`contextType: preference`)  
**Also:** `AIPersonalityProfile.personalityData` for questionnaire-derived soft prefs

**Conflict:** Session overrides ephemeral; promoted session → profile or context.

---

### Procedure

**Definition:** Multi-step habitual workflow ("when I ask for weekly review, do X then Y").

**Canonical store:** `UserAIContext` (`contextType: workflow`)

---

### Instruction

**Definition:** Imperative rules ("always use metric", "never schedule before 9am").

**Canonical store:** `UserAIContext` (`contextType: instruction`)

**Classifier hint:** Contains "always" / "never" → instruction.

---

### Vocabulary

**Definition:** Domain terms, acronyms, internal names — not a separate type in schema.

**Canonical store:** `UserMemoryFact` (subject=term) or `UserAIContext` (fact/instruction)  
**Business:** Business-scoped context rows for company glossary.

---

### Relationship

**Definition:** Links between people, places, businesses, documents — organizational graph.

**Canonical store:** V_Link module (`prisma/modules/platform/vlink.prisma`)  
**Retrieval:** `vlinkPipelineContextService`, `vlink.recent_vlinks` provider, context-graph bundles

**Teach Vssyl:** Redirect to V_Link UI — do not duplicate edges in memory.

---

### Document reference

**Definition:** A file whose content AI should reason about.

**Canonical store:** Drive `File` record  
**Turn-scoped:** `AIMessage.attachments` + `fileAnalysisService`

**Teach Vssyl:** "Ensure file is in Drive" or attach in chat — not copy full text to memory unless user confirms summary fact.

---

### Application object

**Definition:** Entity owned by a module — event, task, employee record, schedule shift, etc.

**Canonical store:** Module tables (Calendar, Todo, HR, Scheduling, …)  
**Retrieval:** Module context providers only

**Teach Vssyl:** Deep link to module edit — **never** write to memory.

---

### Temporary context

**Definition:** Valid for current thread or session only.

**Canonical store:** `AIMessage` content/metadata, session preference store  
**Future:** Thread note in message metadata (Phase 2)

**Not prompt-eligible cross-session.**

---

### Business rule

**Definition:** Norm or constraint proposed by employee or admin for the workspace.

**Canonical store:** `BusinessAILearningEvent` → on approve → business-scoped `UserAIContext` or twin update  
**Admin-authored:** Direct twin config

**Review:** Employee proposals require business admin approval.

---

### Correction

**Definition:** Meta-record that a specific answer was wrong, with proposed fix.

**Canonical store:** `AILearningEvent` (`correction`)  
**Application target:** Resolved via `learningApplicationService` to fact/context/personality

**Always create for Improve Answer flow** — analytics + audit.

---

### Pattern

**Definition:** Detected repetition across interactions.

**Personal:** `AILearningEvent` (`pattern_recognition`)  
**Collective:** `GlobalPattern` (opt-in)

**Review:** Personal patterns → Learning tab; collective → platform only.

---

## 3. Scope matrix

| Type | personal | business | household | platform |
|------|----------|----------|-----------|----------|
| Fact | ✓ | ✓ | ✓ | ✗ |
| Preference | ✓ | ✓ scoped | ✗ | ✗ |
| Instruction | ✓ | ✓ scoped | ✗ | ✗ |
| Policy | ✗ | ✓ | ✗ | ✗ |
| Application object | ✓ tenant | ✓ tenant | ✓ | ✗ |
| Relationship | ✓ tenant | ✓ tenant | ✗ | ✗ |
| Platform rule | ✗ | ✗ | ✗ | ✓ |

---

## 4. Overlap resolution (which store wins)

| Situation | Winner |
|-----------|--------|
| Same fact in MemoryFact + UserAIContext | Prefer **UserMemoryFact** for declarative; dedupe in UX |
| Memory fact vs live module data for entity attribute | **Module SoR** |
| Personal preference vs business policy in business chat | **Business policy** |
| Explicit vs inferred same topic | **Explicit** |
| Instruction vs preference conflict | **Instruction** |
| Taught doc summary vs Drive file content | **Drive live fetch** for full content; memory for user-confirmed summary only |

---

## 5. Types that must NOT get new stores

| Proposed type | Use instead |
|---------------|-------------|
| Knowledge graph node | V_Link + context-graph |
| TeachVssylFact | UserMemoryFact |
| PromptOverride | AIPipeline policies |
| Embedding index (user facts) | MemoryRetrievalService scoring (extend if needed) |
| Unified Knowledge table | Product taxonomy only |

---

## 6. Application → store quick reference

| Application | Knowledge types | Store / mechanism |
|-------------|-------------------|-------------------|
| Drive | Document reference | `File` + drive providers |
| Chat | Application object, experiential | Chat tables + providers |
| Calendar | Application object | Calendar tables + providers |
| Tasks | Application object | Todo tables + providers |
| Notes | Application object, document-like | Notes tables + providers |
| V_Link | Relationship | V_Link graph |
| Business | Policy, business rule | BusinessAIDigitalTwin |
| Scheduling | Application object | Scheduling tables + providers |
| HR | Application object | HR tables + providers |
| Analytics | Application object (aggregates) | Dashboard/analytics providers |
| Marketplace | Module manifest + Application objects | Registry + partner providers |
| AI Control Center | Fact, preference, instruction, correction | Memory + context + learning tables |

---

## 7. Related documents

- [AI_KNOWLEDGE_TAXONOMY.md](./AI_KNOWLEDGE_TAXONOMY.md) — Phase 0A taxonomy
- [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) — router logic
- `docs/ai-knowledge/deep-dive/AI_KNOWLEDGE_STORE_INVENTORY.md` — schema detail
