# AI Knowledge User Experience

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Scope:** How users teach Vssyl today; how they should — **design guidance, not implementation**

---

## 1. The answer (target state)

> **To teach Vssyl something, go to Teach — or say it in chat.**

| User goal | Primary action | Location |
|-----------|----------------|----------|
| Teach a fact or preference | **Add to Teach** or "remember that…" | `/ai?tab=memory` (renamed **Teach**), `/ai-chat` |
| Review what Vssyl inferred | **Review suggestions** | `/ai?tab=learning` |
| See what Vssyl knows | **What Vssyl knows** | Unified read view under Teach |
| Fix how Vssyl talks to me | **Behavior** | `/ai?tab=behavior` |
| Configure business AI | **Business AI** | `/business/[id]/ai` |
| Use AI with workspace data | **Chat** (attachments, @mentions) | `/ai-chat` |

Users should **not** choose between "Memories," "Custom Context," "Facts," and "Learning" — those are implementation partitions.

---

## 2. Current experience map

### Personal AI Control Center (`/ai`)

| Tab (canonical) | Legacy aliases | What it does | Knowledge role |
|-----------------|----------------|--------------|----------------|
| **identity** | overview | Persona, onboarding | Identity framing |
| **memory** | memories, context | `AIMemoriesView` — facts, context, patterns | **Primary teach surface** |
| **learning** | — | `PersonalLearningEventsReview` — approve corrections | **Review inferred** |
| **suggestions** | — | Ambient `AISuggestion` | Passive signals |
| **behavior** | personality, autonomy | Questionnaire, autonomy | Preferences |
| **more → provider** | provider | Model/provider pick | Not knowledge |
| **more → actions** | actions | AI action permissions | Not knowledge |
| **more → insights** | intelligence | Patterns, analytics | Optional collective |

### AI Chat (`/ai-chat`)

| Mechanism | Knowledge effect |
|-----------|------------------|
| Natural message | Twin uses all layers |
| "remember that…" | Creates `UserMemoryFact` |
| File attachment | `fileAnalysisService` — ephemeral + message persist |
| @module mentions | Direct provider fetch |
| Streaming response | No teach affordance on message |

### Business AI (`/business/[id]/ai`)

| Area | Knowledge role |
|------|----------------|
| Twin configuration | Business policy, personality |
| Learning tab | `BusinessAILearningEvent` approval |
| Employee drawer | Consumption — not teach |

---

## 3. Current UX problems

| Problem | Impact |
|---------|--------|
| **Two teach paths** (Memory tab vs "remember that") | Users don't know which to use |
| **Memory vs Learning split** | Corrections may land in Learning — user looks in Memory |
| **Pending inferred context** | Exists (`learningStatus: pending`) — low discoverability |
| **No post-answer correction** | User must navigate away from chat |
| **Workspace data invisible in Teach** | User thinks Memory should list calendar/files |
| **@mentions undiscoverable** | Power feature hidden |
| **Business vs personal** | Unclear when business policy overrides |
| **No explainability** | User can't see what influenced answer |

---

## 4. Proposed information architecture (Phase 1A)

### Rename and merge (no new APIs)

```
/ai
├── Identity        (unchanged)
├── Teach           (was: memory) — CRUD + "what Vssyl knows" read view
│   ├── Facts & preferences you added
│   ├── Pending review (badge count — merged from learning pending)
│   └── [Link] Workspace data lives in Drive, Calendar, etc.
├── Learning        (narrowed: correction history + applied changes log)
├── Suggestions     (unchanged)
└── Behavior        (unchanged)
```

### Chat affordances (Phase 1B)

On each assistant message:

- **Improve this answer** → opens correction flow ([AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md))
- **Teach Vssyl** → quick-add fact inline

---

## 5. Discoverability standards

| Element | Standard |
|---------|----------|
| Empty Teach state | "Tell Vssyl in chat: remember that… or add below" |
| Source badge | "You added" / "From a conversation" / "From Business" — **exists** in `AIMemoriesView` |
| Pending count | Nav badge on Teach tab |
| Workspace clarification | "Calendar and files aren't listed here — Vssyl reads them live" |
| Business context indicator | Banner in chat when `businessId` active |

---

## 6. Audience: who sees what

| Surface | End user | Business admin | Workspace owner | Operator |
|---------|:--------:|:--------------:|:---------------:|:--------:|
| `/ai` Teach | ✅ | ✅ (personal) | ✅ | — |
| `/business/.../ai` | — | ✅ | ✅ (if admin) | — |
| `/ai-chat` | ✅ | ✅ | ✅ | — |
| Module edit UIs | ✅ | ✅ | ✅ | — |
| `/admin-portal/ai-pipeline` | — | — | — | ✅ |

**Workspace owner** today has same personal `/ai` as end user; business knowledge requires business admin role on Business AI CC.

---

## 7. Onboarding teach moment

Existing copy on `/ai` memory tab:

> "Teach your twin facts, preferences, and workflows it should keep in mind."

**Strengthen (Phase 0B copy):**

1. One sentence: what Teach is  
2. Three examples: fact, preference, instruction  
3. One sentence: workspace data is automatic  
4. CTA: Open chat with "remember that…" template

---

## 8. Metrics for UX success (future)

| Metric | Target |
|--------|--------|
| % corrections via Improve flow vs manual re-teach | >60% after Phase 1B |
| Pending review clearance time | <7 days median |
| User can name where to teach (survey) | >80% say "Teach" |
| Support tickets "AI wrong" with memory path | Decrease 30% |

---

## 9. User experience maturity

| Dimension | Score |
|-----------|------:|
| Core teach mechanics work | 80% |
| Single mental model | 35% |
| Correction from chat | 15% |
| Explainability | 10% |
| Business parity | 55% |
| **Overall user knowledge UX** | **~52%** |

Phase 1A Teach consolidation → target **~70%**.
