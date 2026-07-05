# AI Correction Routing Specification

**Program:** AI Knowledge Reference Program — Phase 0B  
**Date:** 2026-07-05  
**Status:** Canonical routing and governance spec — **no implementation**

Defines how corrections are classified, governed, routed to existing stores, and applied.

---

## 1. Routing principles

1. **Route to existing stores** — no new tables
2. **Module SoR for entity data** — never copy Application objects into memory
3. **Explicit teach auto-applies** — inferred always review
4. **Business scope requires authority** — employee ≠ admin for business-wide rules
5. **Always audit** — `AILearningEvent` correction record for Improve Answer flows
6. **Never route user corrections to pipeline policies**

---

## 2. Governance modes

| Mode | Code | When | Prompt effect |
|------|------|------|---------------|
| **Auto-apply** | `auto_apply` | Explicit user teach via API/modal; `remember that`; direct Memory CRUD | Immediate next turn |
| **Review required** | `review_required` | Inferred context; ambiguous correction; thumbs-down without text | After user approve |
| **Business admin approval** | `business_admin` | Employee proposes business rule/policy; business-scoped teach by non-admin | After admin approve |
| **Operator approval** | `operator_only` | Pipeline policy changes — **not user corrections** | N/A |
| **Temporary only** | `temporary` | Thread/session scope (Phase 2) | Current thread only |
| **Personal only** | `personal_scope` | Default for personal chat without businessId | User-scoped retrieval |
| **Business-wide** | `business_scope` | Admin-authored twin config or approved business learning | All members in business context |
| **Never learn** | `never_learn` | Behavioral analytics; module entity redirects; pipeline edits | None |

---

## 3. Governance matrix by knowledge type

| Knowledge type | Default mode | Reviewer | Override |
|----------------|--------------|----------|----------|
| Fact (explicit) | auto_apply | — | — |
| Fact (inferred) | review_required | User | — |
| Preference (explicit) | auto_apply | — | — |
| Preference (inferred) | review_required | User | — |
| Instruction (explicit) | auto_apply | — | — |
| Instruction (inferred) | review_required | User | — |
| Correction (Improve Answer) | review_required if ambiguous; auto_apply if explicit fact | User | User chip |
| Business rule (employee) | business_admin | Business admin | — |
| Business rule (admin) | business_wide auto_apply | — | — |
| Policy (twin config) | business_wide auto_apply | Business admin | — |
| Application object | never_learn | — | Redirect to module |
| Document reference | never_learn (live fetch) | — | Redirect to Drive |
| Relationship | never_learn | — | Redirect to V_Link |
| Temporary context | temporary | — | Phase 2 |
| Behavioral signal (stars) | never_learn | — | Analytics only |
| Thumbs down (no text) | review_required | User | Must confirm text in v1 |

---

## 4. Routing decision tree

```
Correction received
│
├─ Is it about a module entity (event, file, task, employee)?
│   └─ YES → never_learn → Module redirect + help copy
│
├─ Is it about company policy/compliance?
│   ├─ User is business admin → business_scope → BusinessAIDigitalTwin or business UserAIContext
│   └─ User is employee → business_admin → BusinessAILearningEvent (pending)
│
├─ Is scope "this conversation only"?
│   └─ YES → temporary → session/thread metadata (Phase 2)
│
├─ Classify text:
│   ├─ "always" / "never" → Instruction → UserAIContext (instruction)
│   ├─ "prefer" / "tone" / "shorter" → Preference → UserAIContext (preference)
│   ├─ Declarative statement → Fact → UserMemoryFact
│   └─ Ambiguous → AILearningEvent (correction) → review_required
│
└─ Always: create AILearningEvent (correction) for Improve Answer analytics
```

---

## 5. API routing table

| Classification | Primary API | Secondary | Store |
|----------------|-------------|-----------|-------|
| Fact | `POST /api/ai/memory/facts` | — | UserMemoryFact |
| Preference | `POST /api/ai/user-context` | `POST /api/ai/teach` | UserAIContext |
| Instruction | `POST /api/ai/user-context` | — | UserAIContext |
| Ambiguous correction | — | `AILearningEvent` via learning API | Review → apply |
| Business fact (admin) | `POST /api/ai/memory/facts` + businessId | — | UserMemoryFact |
| Business rule (admin) | Business AI config PUT | business UserAIContext | BusinessAIDigitalTwin |
| Business rule (employee) | — | Business learning review API | BusinessAILearningEvent |
| Teach explicit | `POST /api/ai/teach` | — | AILearningEvent → apply on approve |
| Thumbs down | `POST /api/ai/learning/signals` **modified** | Create reviewable correction event | AILearningEvent |

**Modify (Phase 1 implementation):** Thumbs down and low star ratings must create **reviewable** `correction` events — not `behavioral_signal` only.

---

## 6. Application service routing (on approve)

**Service:** `learningApplicationService.applyApprovedEvent`

| Event payload | Target |
|---------------|--------|
| correction + declarative | `UserMemoryFact.create/update` |
| preference_update | `UserAIContext` preference row |
| correction + style | `UserAIContext` preference or `AIPersonalityProfile` |
| trait / pattern | `AIPersonalityProfile.personalityData` |

**Business gap (Phase 3):** Mirror apply logic for `BusinessAILearningEvent` → business-scoped stores.

---

## 7. Conflict handling at route time

| Conflict | Router behavior |
|----------|-----------------|
| Existing fact same subject | Show warning; offer replace or add |
| Pending inferred matches explicit | Offer dismiss pending + save explicit |
| Correction contradicts business policy | Block business employee; suggest admin |
| Correction duplicates module data | Redirect to module; do not save |
| User teaches pipeline-level rule ("never use tools") | Save as personal **instruction** — does not change pipeline |

---

## 8. Payload schema (conceptual — no new table)

Correction request body (frontend → existing APIs):

```typescript
interface CorrectionRoutePayload {
  conversationId?: string;
  messageId?: string;
  originalQuery: string;
  assistantResponseSnippet: string;
  correctionText: string;
  classification: 'fact' | 'preference' | 'instruction' | 'business' | 'module_redirect' | 'temporary';
  scope: 'personal' | 'business' | 'thread';
  businessId?: string;
  source: 'improve_answer' | 'teach_vssyl' | 'explain_drawer' | 'thumbs_down';
}
```

**Implementation:** Map to existing API bodies — no new endpoint required in Phase 1.

---

## 9. Operator vs user routing

| Source | Can route to user stores? | Can route to pipeline? |
|--------|---------------------------|------------------------|
| User chat | ✓ | ✗ |
| Business admin | ✓ business scope | ✗ |
| Operator diagnostic | ✗ | ✓ (manual policy edit separate workflow) |
| Support on behalf of user | ✓ with user consent (future) | ✗ |

---

## 10. Rate limits and abuse (future)

| Control | Recommendation |
|---------|----------------|
| Corrections per user per hour | Soft cap 20 — warn, not block |
| Duplicate correction text | Dedupe within 24h |
| Business employee flood | Queue for admin |

---

## 11. Proof of routing correctness

Before ship, CI must assert:

1. Fact classification → `UserMemoryFact` row created
2. Instruction classification → `UserAIContext` with `contextType: instruction`
3. Module redirect → no memory write; HTTP 200 with redirect payload
4. Approve ambiguous correction → `learningApplicationService` writes target store

See [AI_KNOWLEDGE_EVAL_LOOP_SPEC.md](./AI_KNOWLEDGE_EVAL_LOOP_SPEC.md).

---

## 12. Related documents

- [KNOWLEDGE_TYPE_TO_STORE_MATRIX.md](./KNOWLEDGE_TYPE_TO_STORE_MATRIX.md)
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md) — Review + Application stages
- [AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md) — Phase 0A UX wireframes
- [AI_KNOWLEDGE_GOVERNANCE.md](./AI_KNOWLEDGE_GOVERNANCE.md) — ownership rules
