# Teach Vssyl — Product Specification

**Program:** AI Knowledge Reference Program — Phase 0B  
**Date:** 2026-07-05  
**Status:** Product specification — **no UI implementation in this phase**

Defines what Teach Vssyl should do, from which surfaces, for which audiences.

---

## 1. Product thesis

**Teach Vssyl** is how users and admins turn corrections and intent into **governed organizational intelligence** — not chatbot fine-tuning.

Vssyl is an operating system that reasons across Applications. Teach Vssyl must:

1. Fix wrong answers at the moment of failure
2. Route fixes to the correct store (not duplicate module data)
3. Respect personal vs business vs platform boundaries
4. Prove taught knowledge appears in future answers

---

## 2. Core product capabilities

| Capability | User label | Purpose |
|------------|------------|---------|
| **Teach Vssyl** | Teach Vssyl | Explicitly add or correct knowledge |
| **Improve Answer** | Improve this answer | Low-friction correction after bad response |
| **What Vssyl Knows** | What Vssyl knows | Inventory of taught knowledge + live source explainability |
| **Why Vssyl Answered This** | Why this answer | Existing explain drawer — add correction CTA |
| **Knowledge Health** | Knowledge health | Staleness, conflicts, pending review, coverage gaps |

---

## 3. Entry points and flows

### 3.1 From AI chat (primary — Phase 1)

**Surface:** `/ai-chat` → assistant message actions  
**Audience:** Personal user; business user in workspace chat

| Action | Flow |
|--------|------|
| **Improve Answer** | Acknowledge → classify (chips) → capture text → confirm scope → route to store → confirmation |
| **Teach Vssyl** | Same flow; skip "bad answer" framing — for proactive teaching |
| **Thumbs down** | Opens Improve Answer with pre-filled "this wasn't right" |
| **Why this answer** | Existing drawer + **"Correct this"** button → Improve Answer |

**Constraints:**
- Never show pipeline intent IDs, provider names, or raw traces
- Module redirect when correction is about Application data ("Edit in Calendar")

**Backend:** Existing APIs only — see [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md)

---

### 3.2 From bad answer (implicit)

**Trigger:** User regenerates, thumbs down, or selects incorrect assistant content

| Step | Behavior |
|------|----------|
| Detect dissatisfaction | Thumbs down or Improve Answer click |
| Pre-fill context | Original query, assistant response snippet, optional `responseInfluence` summary |
| Classify | User chips + rule assist |
| Create audit | `AILearningEvent` type `correction` linked to turn |
| Apply or queue | Explicit fact → immediate; ambiguous → Learning tab review |

**Do not:** Auto-create memory from thumbs alone without user text confirmation in v1.

---

### 3.3 From Operations Platform diagnostics (operator)

**Surface:** `/admin-portal/ai-pipeline/diagnostics`  
**Audience:** Platform operators only

| Action | Purpose |
|--------|---------|
| View trace | Understand retrieval/grounding failure |
| Copy trace reference | Support ticket attachment |
| Open test lab replay | Reproduce with same query |
| Export evidence | Compliance |

**Not in v1:** Operator "teach" that writes user memory. Operators fix **policies**, not user facts.

**Future (Phase 3):** "Suggest policy adjustment" link from grounding failure → intents/grounding registry (operator workflow).

---

### 3.4 From business admin AI settings

**Surface:** `/business/[id]/ai` → Business AI Control Center  
**Audience:** Business admins

| Action | Teach type |
|--------|------------|
| Configure twin personality/restrictions | Business policy |
| Approve business learning events | Business-wide correction |
| Add business-scoped context (future) | Business rule / vocabulary |
| View employee AI sources (future) | Read-only What Vssyl Knows (business scope) |

**Employees:** Teach personal facts; propose business corrections → admin review queue.

---

### 3.5 From documents and modules

**Principle:** Documents and Application objects are **not taught into memory** — they are **referenced live**.

| User intent | Product response |
|-------------|------------------|
| "Vssyl should know this document" | Explain: attach in chat or ensure file in Drive; AI reads at query time |
| "Remember what's in this PDF" | Offer: create **fact summary** user confirms — not full doc copy |
| "Wrong meeting time" | Redirect: open Calendar event |
| "Wrong employee count" | Redirect: HR module; if systemic, business admin teach |

**Drive "Ask AI about this file":** Query-time intelligence — not Teach Vssyl unless user saves extracted fact.

---

## 4. Capability specifications

### 4.1 Teach Vssyl

**Goal:** Proactive knowledge addition without requiring a bad answer first.

**Surfaces:**
- `/ai` Control Center → Memory tab (exists — consolidate UX)
- Chat → "Teach Vssyl" on assistant messages
- Global header AI → teach from dropdown (Phase 2)

**Flow:**
1. What should Vssyl know? (free text)
2. What type? (fact / preference / rule) — chips
3. Scope (personal / business if admin)
4. Save → immediate apply for explicit types

---

### 4.2 Improve Answer

**Goal:** Minimum friction correction after failure.

**Primary surface:** Chat assistant message menu

**Differentiation from Teach Vssyl:**
- Pre-filled with wrong answer context
- Always creates `AILearningEvent` correction record for analytics
- Stronger default toward **correction** classification

---

### 4.3 What Vssyl Knows

**Goal:** User-readable inventory of taught knowledge and live source awareness.

**Sections:**

| Section | Content | Source |
|---------|---------|--------|
| **Your facts** | UserMemoryFact list | Memory API |
| **Your rules & preferences** | UserAIContext active rows | Context API |
| **Pending review** | Inferred + learning events | Learning API |
| **What Vssyl can access** | Modules installed, @mentions, business scope | Read-only catalog (new content, not new store) |
| **Not in memory** | Explain live Application data | Educational copy |

**Location:** Extend `/ai?tab=memory` — do not create duplicate route.

**Business variant:** Business admin sees business-scoped rows + twin policy summary.

---

### 4.4 Why Vssyl Answered This

**Goal:** Explain influence; bridge to correction.

**Exists:** `AIResponseExplainDrawer` with `responseInfluence`

**Phase 1 additions:**
- **Correct this** primary CTA → Improve Answer
- **See in What Vssyl Knows** link when memory items listed
- Optional support reference ID (not full trace)

**Do not add:** Pipeline trace, provider model, token counts.

---

### 4.5 Knowledge Health

**Goal:** Surface staleness, conflicts, and review backlog — not operator diagnostics.

**Personal indicators:**

| Indicator | Meaning | Action |
|-----------|---------|--------|
| Pending review count | Inferred knowledge awaiting promote | Go to Learning |
| Duplicate fact warning | Same subject in fact + context | Resolve in Memory |
| Expired facts | `expiresAt` passed | Renew or dismiss |
| Unused teach | Fact never retrieved in 90d (future) | Review or archive |

**Business indicators (admin):**
- Unapproved business learning backlog
- Policy conflicts with employee teaches (future)

**Location:** `/ai` Control Center card or Memory tab header — not admin portal.

---

## 5. Audience matrix

| Capability | Personal user | Business employee | Business admin | Platform operator |
|------------|---------------|-------------------|----------------|-------------------|
| Teach Vssyl | ✓ | ✓ personal scope | ✓ + business scope | ✗ |
| Improve Answer | ✓ | ✓ | ✓ | ✗ |
| What Vssyl Knows | ✓ | ✓ personal | ✓ business view | ✗ user knowledge |
| Why Vssyl Answered This | ✓ | ✓ (port to employee drawer Phase 3) | ✓ | ✓ full trace |
| Knowledge Health | ✓ | ✓ | ✓ business | aggregate metrics only |
| Pipeline diagnostics | ✗ | ✗ | ✗ | ✓ |
| Policy editing | ✗ | ✗ | ✗ | ✓ |

---

## 6. What Teach Vssyl should do first (Phase 1 scope)

| Priority | Deliverable |
|----------|-------------|
| P0 | Improve Answer + Teach Vssyl modal in personal chat |
| P0 | Classification chips → existing store APIs |
| P0 | Thumbs down → reviewable correction event |
| P0 | Correct this CTA in explain drawer |
| P1 | What Vssyl Knows copy refresh (Memory tab labels) |
| P1 | Knowledge Health: pending count + conflict warning |
| P2 | Business admin teach branch |
| P2 | Employee drawer parity |
| P3 | Operator aggregate correction metrics in pipeline quality |

**Explicitly defer:** Thread-only corrections, LLM auto-classifier, new routes, new stores.

---

## 7. Success metrics

| Metric | Target (90 days post-ship) |
|--------|---------------------------|
| Correction completion rate | >70% start → save |
| Classification override rate | <20% (chips work) |
| Repeat wrong answer (same topic) | Down 30% vs baseline |
| Pending review backlog | <5 per active user median |
| CI teach regression tests | 100% pass on main |

---

## 8. Non-goals

- Model training or fine-tuning UI
- User-editable pipeline policies
- Knowledge graph visualization for end users
- Bulk import wizard (future separate program)
- Replacing module UIs for entity edits

---

## 9. Related documents

- [AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md) — Phase 0A wireframes (superseded in detail by this spec + routing spec)
- [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) — backend routing
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) — lifecycle stages
- [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md) — proof requirements
