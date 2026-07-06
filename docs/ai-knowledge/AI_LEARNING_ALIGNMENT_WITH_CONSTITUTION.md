# AI Learning Alignment with Constitution

**Program:** AI Learning Experience Review — Phase 0A  
**Date:** 2026-07-06  
**Status:** Constitutional alignment assessment

---

## Summary

The Learning page **implements Constitution P4** (inference must be reviewable) and **supports P8** (governed correction path). Backend architecture is **correct**. Misalignment is **product-layer**: terminology collisions, duplicate “suggestions” naming, engineering labels, and CTAs that say “AI Identity” when outcomes land in **Knowledge**.

**No constitutional conflict requires removing the Learning tab.**

---

## Principle-by-principle alignment

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| **P3** Explicit beats inferred | **Aligned** | Teach Vssyl bypasses Learning; page only handles inferred |
| **P4** Inference reviewable | **Aligned** | `learningStatus: pending` until promote — core purpose |
| **P5** Tenant separation | **Aligned** | Scoped by `userId`; business scope on events/context |
| **P7** Explainable answers | **Partial** | Explain drawer links to Learning; page doesn’t explain inference source depth |
| **P8** Governed correction path | **Aligned** | `AILearningEvent` + `learningApplicationService` audit trail |
| **P9** Improve by evaluation | **Partial** | “What changed” is user feedback; no eval cases in UI |
| **P13** Plain-language teach | **Gap** | eventType, confidence % violate plain-language bar |
| **P14** Tiered governance | **Aligned** | User personal scope; no operator controls on page |
| **P15** Governed improvement only | **Aligned** | No auto-promote for pending context (except explicit teach paths) |
| **D8** Behavior ≠ memory | **Minor gap** | Session style + community learning on Learning tab blur lines |

---

## Constitution conflicts (UX only)

| Conflict | Severity | Resolution (copy/IA, not backend) |
|----------|----------|-----------------------------------|
| “Save to AI Identity” vs Knowledge rename | Medium | Use **“Save to Knowledge”** |
| Three “Suggestions” meanings | High | Rename sections/sub-tabs per IA doc |
| Confidence % and eventType visible | Medium | Hide behind “Details” or remove |
| Learning tab name vs “community learning” | Low | Rename collective block |
| Empty “What changed” references wrong suggestion | Low | Point to **inferred items below** |

**No conflicts** with P1 (SoR), P2 (emergent engine), or P11 (assemble don’t duplicate).

---

## Final questions (required answers)

### 1. What is the Learning page actually for?

**Reviewing inferred knowledge** — pending `UserAIContext` and reviewable `AILearningEvent` rows — before they become prompt-eligible durable knowledge.

It is **not** the primary teach surface, knowledge browser, workspace suggestion inbox, or operator console.

---

### 2. What should NOT live there?

| Should NOT be on Learning | Why |
|---------------------------|-----|
| Teach Vssyl | Explicit path (P3) |
| Browse/edit active knowledge | Knowledge tab |
| Primary `AISuggestion` inbox | Suggestions tab |
| Operator pipeline controls | P14 tier |
| Full analytics dashboards | Insights (optional depth) |
| Direct personality questionnaire | Behavior tab |

**Debatable relocate:** community privacy toggle, session-style info card.

---

### 3. What belongs in Knowledge instead?

| Item | When |
|------|------|
| Active `UserAIContext` (promoted) | After Save |
| `UserMemoryFact` from correction events or explicit teach | After apply or Teach Vssyl |
| User-added instructions / facts | Direct CRUD |
| **Viewing** all of the above | Browse/manage |

Learning is **ante-room**; Knowledge is **archive of what counts**.

---

### 4. What belongs in Teach Vssyl instead?

| Item | Why |
|------|-----|
| User says answer is wrong and supplies correction | Explicit teach (Phase 1A) |
| Fact / preference / vocabulary from chat | Auto-apply — skips review |
| Future: thumbs-down → classified teach | P8 correction entry in chat |

Learning handles **system-inferred** proposals; Teach Vssyl handles **user-initiated** teaching.

---

### 5. What belongs in Suggestions instead?

| Item | Why |
|------|-----|
| `AISuggestion` pending/history | Correlation-based workspace actions |
| Accept → open chat / Drive / module | Action-oriented, not knowledge store |
| Dismiss / do not show again | Suppression keys |

**Exception:** After repeated accepts, a **derived preference proposal** may appear on Learning — constitutionally valid (inference from behavior) but should be labeled as **from your suggestion activity**, not duplicate the Suggestions inbox.

---

### 6. What belongs in AI Pipeline instead?

| Item | Why |
|------|-----|
| Intent catalog, grounding rules | Operator tier (P14) |
| Pipeline traces, enforcement | Operator explainability |
| Provider/tool policy | Not user learning review |
| Eval cases / regression (future) | P9 operator tooling |

Users never edit pipeline policy through Learning — **correct today**.

---

### 7. Does the page need Keep / Simplify / Split / Rename / No changes?

| Verdict | Detail |
|---------|--------|
| **Keep** | Tab and both review queues |
| **Simplify** | **Primary recommendation** — copy, badges, section titles, empty states |
| **Reorganize** | Optional moves (community toggle, session info) |
| **Rename** | Subsections and CTAs; optional tab subtitle |
| **Split** | **Not recommended** |
| **No changes** | **Not recommended** — terminology debt remains |

---

### 8. Can existing functionality be reorganized rather than rewritten?

**Yes.**

| Change type | Effort | Backend change |
|-------------|--------|----------------|
| Rename sections / CTAs | Low | None |
| Fix empty states / cross-links | Low | None |
| Hide engineering badges | Low | None |
| Include learning events in home badge | Low | Optional count API |
| Rename Insights sub-tab “Suggestions” | Low | None |
| Merge two queues into one list | Medium | UI-only possible; different APIs remain |

**Rewrite not required** — two review models (`UserAIContext` pending vs `AILearningEvent`) are intentional and constitutionally sound.

---

## Designer onboarding (success criteria)

After reading this package, a designer should understand:

| Question | Answer |
|----------|--------|
| Why Learning exists | **P4 review gate** for inference |
| Fit in AI Identity | Between **Suggestions** (propose) and **Knowledge** (stored) |
| Fit with Teach Vssyl | Explicit teach **skips** Learning |
| Fit with Knowledge | Promoted items **appear** in Knowledge |
| Constitution | **Governed, reviewable, non-autonomous** learning |

---

## Verdict

| Dimension | Assessment |
|-----------|------------|
| Fundamentally correct? | **Yes** — right constitutional job |
| Needs reorganization? | **Yes** — terminology and section clarity |
| Needs backend rewrite? | **No** |
| Architecture frozen? | **Respect** — UX-only changes ahead |

---

## Related documents

- [AI_LEARNING_EXPERIENCE_AUDIT.md](./AI_LEARNING_EXPERIENCE_AUDIT.md)  
- [AI_LEARNING_INFORMATION_ARCHITECTURE.md](./AI_LEARNING_INFORMATION_ARCHITECTURE.md)  
- [AI_LEARNING_RESPONSIBILITY_MATRIX.md](./AI_LEARNING_RESPONSIBILITY_MATRIX.md)  
- [AI_KNOWLEDGE_CONSTITUTION.md](./AI_KNOWLEDGE_CONSTITUTION.md)  
- [KNOWLEDGE_LIFECYCLE.md](./KNOWLEDGE_LIFECYCLE.md)
