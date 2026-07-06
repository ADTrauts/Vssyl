# Teach Vssyl — UI Flow Specification (Phase 1)

**Program:** Teach Vssyl Phase 1A  
**Date:** 2026-07-05  
**Status:** Design for implementation — **no UI built in this sprint**

Wireframes are narrative; implementation uses existing design system ([UX Constitution](../ux/UX_CONSTITUTION.md)).

---

## Entry points

| Surface | Trigger | Opens |
|---------|---------|-------|
| Assistant message menu | **Improve this answer** | `TeachVssylModal` mode=improve |
| Assistant message menu | **Teach Vssyl** | `TeachVssylModal` mode=teach |
| Assistant message menu | Thumbs down | `TeachVssylModal` mode=improve (pre-filled) |
| Explain drawer | **Correct this** | Same modal with context pre-fill |
| `/ai` Memory tab | Add knowledge (existing) | `CustomContext` / fact form — unchanged Phase 1 |

**Not in Phase 1:** Business AI CC teach, operator diagnostics teach, employee drawer.

---

## Modal flow (shared)

### Step 1 — Acknowledge (Improve Answer only)

```
This answer wasn't right. Help Vssyl do better next time.
```

Teach Vssyl mode skips to Step 2 with neutral copy: "What should Vssyl know?"

### Step 2 — Classification chips

> What kind of knowledge is this?

| Chip | User label |
|------|------------|
| `fact` | A fact about me or my work |
| `preference` | A preference (how I want answers) |
| `instruction` | A rule (always / never) |
| `module` | About a file, task, or event |
| `business` | About my company *(shown only if `businessId` + admin)* |

**Auto-suggest:** Client rules from [AI_CORRECTION_ROUTING_SPEC.md](./AI_CORRECTION_ROUTING_SPEC.md) — user can override.

### Step 3 — Capture text

```
What should Vssyl know instead?
[________________________________]
```

Pre-fill from:
- User-selected assistant text
- `responseInfluence.summary` snippet (Improve mode)

### Step 4 — Scope (when applicable)

| Option | When |
|--------|------|
| Just for me | Default |
| For [Business] | `businessId` + admin + business chip |

Phase 1 default: **personal only** (hide business chip unless admin in business chat).

### Step 5 — Submit routing (client)

```typescript
// Pseudocode — web/src/api/teachVssyl.ts (to create)
switch (classification) {
  case 'fact':
    await createMemoryFact({ subject, predicate, sourceConversationId });
    break;
  case 'preference':
    await createUserAIContext({ contextType: 'preference', ... });
    break;
  case 'instruction':
    await createUserAIContext({ contextType: 'instruction', ... });
    break;
  case 'module':
    showModuleRedirect({ moduleId, deepLink }); // no API write
    return;
  case 'business':
    if (isAdmin) await updateBusinessConfig(...);
    else await proposeBusinessLearning(...); // Phase 2
    break;
  case 'ambiguous':
    await createCorrectionEvent({ ... }); // after backend glue
    break;
}
// Always for Improve Answer:
await createCorrectionAuditEvent({ ... }); // optional analytics
```

### Step 6 — Confirmation

```
✓ Saved. Vssyl will use this next time you ask about [topic].
```

Actions:
- **Done** (close)
- **See what you taught** → `/ai?tab=memory`

If review required:
```
✓ Submitted for review. Check the Learning tab to approve.
```

---

## Module redirect flow (journey 5 & 6)

When user picks **About a file, task, or event**:

```
Vssyl reads live data from [Calendar / Tasks / Drive].
To fix the source, edit it there.
[ Open Tasks ]  [ Cancel ]
```

No memory write. Constitutional compliance (P1, D2).

---

## Document flow (journey 5)

When user mentions a document/SOP:

```
To help Vssyl use this document, keep it in Drive and attach it in chat,
or tell Vssyl a short summary to remember.

○ Attach file in chat (opens attach picker)
○ Save a summary I write (→ fact chip flow)
○ Cancel
```

---

## Explain drawer addition

Existing: `AIResponseExplainDrawer` — "Why this answer"

Add footer:

```
[ Correct this ]     [ See Memory & Learning ]
```

**Correct this** opens modal with:
- `originalQuery` from message thread
- `assistantSnippet` from message content
- `responseInfluence` from message metadata

---

## Chat message actions

On assistant message hover/menu:

| Action | Icon tone |
|--------|-----------|
| Improve this answer | Primary |
| Teach Vssyl | Secondary |
| Why this answer | Existing |
| 👎 | Opens Improve flow |

No thumbs-up learning in Phase 1 (constitutional: behavior ≠ memory).

---

## What users never see

- Pipeline intent IDs, provider names, model IDs
- Context provider URLs
- Embeddings / RAG terminology
- Raw `pipelineTrace`

---

## Existing UI to reuse

| Component | Reuse |
|-----------|-------|
| `AIMemoriesView` | Post-teach destination |
| `PersonalLearningEventsReview` | Pending review destination |
| `AILearningNotice` | Pattern for promote/dismiss — do not duplicate |
| `AIResponseExplainDrawer` | Add CTA only |
| `CustomContext` | Form patterns for preference/instruction |

---

## API clients to create (Phase 1B)

| File | Wraps |
|------|-------|
| `web/src/api/teachVssyl.ts` | Orchestration + classification router |
| Extend `aiLearningSignals.ts` | Wire regenerate on thumbs path |

Existing clients unchanged: `aiMemoryFacts.ts`, `aiLearningEvents.ts`, `aiContextLearning.ts`.

---

## Accessibility

- Modal: focus trap, `aria-labelledby`, chip group as radiogroup
- Confirmation: `role="status"` live region
- Redirect dialogs: clear primary action to module

Per UX Constitution.

---

## Related documents

- [AI_CORRECTION_WORKFLOW.md](./AI_CORRECTION_WORKFLOW.md) — Phase 0A wireframes
- [TEACH_VSSYL_PRODUCT_SPEC.md](./TEACH_VSSYL_PRODUCT_SPEC.md)
- [TEACH_VSSYL_API_REUSE_MATRIX.md](./TEACH_VSSYL_API_REUSE_MATRIX.md)
