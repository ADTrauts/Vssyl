# Recommendation Permission Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-3 — Recommendation constitutional architecture  
**Status:** Canonical permission rules  
**Date:** 2026-06-14  
**Parity:** [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md), [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md)

> **Scope:** Visibility and privacy rules for recommendations. **Fail-closed.**

---

## Core rule

**Recommendations cannot reveal information the user cannot access.**

Recommendation generation and display use the **same authority gates** as read adapters, search, and graph projections.

---

## Visibility requirements

| Stage | Gate |
|-------|------|
| **Signal input** | Every entity ref in signal must pass module visibility |
| **Candidate generation** | Only actions user could perform if they chose manually |
| **Preview on card** | Hydrate via Pattern C — same as open |
| **Accept** | Full PE on canonical mutation API |

### Candidate action filter

User may receive recommendation **only if**:

- They can **see** anchor entity (when applicable)  
- Accept action would pass PE **or** would prompt for missing permission clearly  
- Target entity preview is visible or explicitly "request access" flow — not leak  

**Forbidden:** "Accept to view hidden file" where accept grants self unauthorized access bypass.

---

## Cross-tenant restrictions

| Rule | Requirement |
|------|-------------|
| RT1 | Signals computed inside single tenant partition |
| RT2 | Business A signals never use Business B private entities |
| RT3 | Public Place listings may appear in personal context — not reverse |
| RT4 | V_Link BUSINESS scope — businessId match on signal |
| RT5 | No "global popularity" exposing private module titles |

---

## Permission inheritance (misconceptions)

Recommendations **must not assume**:

| False inference | Truth |
|-----------------|-------|
| V_Link co-member → recommend sharing private file | File visibility independent |
| Tag match → recommend share | Tag ≠ access |
| Graph neighbor → recommend membership | Membership requires invite |
| AI saw entity → user owns it | Provider scope ≠ ownership |
| Colleague → see their personal dashboard | Business ≠ personal |

---

## Redaction rules

| Scenario | Display |
|----------|---------|
| Target entity denied | **Omit recommendation** — do not show card with hidden title |
| Partial V_Link context | "Item in shared V_Link" — no filename |
| Connection suggestion | Name only if directory allows |
| Aggregate signal | "3 items" — no ids |
| Restricted attendee list | Count only |

Aligns with search/graph redaction tiers.

---

## Privacy protections

| Protection | Detail |
|------------|--------|
| **User control** | Dismiss, snooze, opt-out per family |
| **No surveillance** | Do not recommend based on other users' private behavior |
| **Search history** | User-scoped only |
| **Frequency caps** | Prevent recommendation harassment |
| **Audit** | Accept/dismiss logged — not sold as activity SoR |
| **Minor / HR** | HR signals require elevated certification |

### Opt-out storage

Preference class — `UserRecommendationPreference` (future) — **not** relationship edge.

---

## Accept vs preview permission

| Action | PE |
|--------|-----|
| Show recommendation card | Preview metadata only |
| Open preview drawer | Full entity read if user clicks |
| Accept | Mutation PE — may fail if revoked since suggest |

**Stale recommendation:** Re-check PE on accept — fail gracefully "no longer available".

---

## Module-specific rules

| Module | Rule |
|--------|------|
| **Drive** | Never recommend share recipient sees file name unless already shared or public |
| **Chat** | No recommend from hashtag content scraping v1 |
| **Place** | Public listing vs private workspace listing partitions |
| **V_Link** | Suggest link only if `userCanLinkEntity` would pass |
| **Todo** | Assign suggest only if assigner role |
| **Notes** | Share suggest follows note visibility |

---

## AI-generated recommendations

| Rule | Detail |
|------|--------|
| AI uses same candidate filter | Not wider than rules engine |
| AI reasonText must not quote hidden content | Summarize from visible metadata |
| AI confidence ≠ permission | Band is UX only |

See [AI_RECOMMENDATION_BOUNDARY.md](./AI_RECOMMENDATION_BOUNDARY.md).

---

## Failure modes

| Failure | Behavior |
|---------|----------|
| Visibility deny during signal build | Drop signal |
| All signals dropped | No recommendation — not fail open |
| Accept PE deny | Show error — do not partial mutate |
| Cross-tenant leak attempt | Log security event |

---

## Review checklist

- [ ] Signal inputs adapter-gated  
- [ ] No cross-tenant candidates  
- [ ] Preview uses hydrate  
- [ ] Accept uses module API  
- [ ] Dismiss stored as preference not edge  
- [ ] explainabilityKey present  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RECOMMENDATION_SIGNAL_MODEL.md](./RECOMMENDATION_SIGNAL_MODEL.md) | Signal sources |
| [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md) | Automation overlap |

**Last updated:** 2026-06-14
