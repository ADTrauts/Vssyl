# Recommendation Signal Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-3 — Recommendation constitutional architecture  
**Status:** Canonical signal reference  
**Date:** 2026-06-14  
**Architecture:** [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](./RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md)

> **Scope:** Signal families that **may** inform recommendations. **No** ranker, ML pipeline, or embedding store in this phase. Future ML may consume **approved signal families** under governance only.

---

## Signal envelope (conceptual)

| Field | Purpose |
|-------|---------|
| `signalId` | Stable family + instance hash |
| `signalFamily` | Category below |
| `sourceAdapter` | Read path — not raw SQL |
| `tenantScope` | Required |
| `actorUserId` | User receiving recommendation |
| `confidenceBand` | `low` \| `medium` \| `high` |
| `explainabilityKey` | Maps to user-facing reasonText |
| `entityRefs[]` | Safe ids only — visibility pre-checked |
| `decayAt` | Optional TTL hint |

**Rule:** Signal generation runs **after** permission filter on inputs — not on hidden data.

---

## Confidence bands

| Band | Meaning | Typical UI |
|------|---------|------------|
| **low** | Weak/heuristic — easy dismiss | Subtle chip |
| **medium** | Multiple weak or one strong signal | Standard card |
| **high** | Explicit user intent or strong co-occurrence within tenant | Prominent — still requires accept |

**Forbidden:** Present as certainty; auto-accept on `high` without product exception (none in v1).

---

## Signal catalog

### Relationship proximity

| Aspect | Value |
|--------|-------|
| **Definition** | Existing SoR edge between entities user already sees |
| **Source** | Read adapters — Pattern C |
| **Confidence** | medium–high (edge exists) |
| **Explainability** | "Already linked via {class} in {module}" |
| **Permission** | Both endpoints visible — adapter gate |
| **Use** | Suggest **related** action (e.g. also add to V_Link) — not duplicate link |

---

### Shared V_Link membership

| Aspect | Value |
|--------|-------|
| **Definition** | User and target entity co-occur in same V_Link container |
| **Source** | `vlink.platform` roster + resolver |
| **Confidence** | medium |
| **Explainability** | "Both in V_Link '{title}'" |
| **Permission** | User must be V_Link member; target attachment visible or restricted count only |
| **Use** | Suggest cross-link, NotebookLink — **not** access grant |

---

### Shared tags

| Aspect | Value |
|--------|-------|
| **Definition** | Same tag string on visible entities **within module** |
| **Source** | Module entity reader — host `tags[]` |
| **Confidence** | low–medium |
| **Explainability** | "Both tagged #{tag} in {module}" |
| **Permission** | Entities must be visible; **no cross-module tag equivalence** |
| **Forbidden** | Auto V_Link from tag match alone |

---

### Shared participants

| Aspect | Value |
|--------|-------|
| **Definition** | Same conversation, event attendees, or meeting invitees |
| **Source** | Chat, calendar, place meeting adapters |
| **Confidence** | medium |
| **Explainability** | "You were both in {conversation/event}" |
| **Permission** | Participant scope only |
| **Use** | Suggest connect, share, V_Link — accept required |

---

### Shared business

| Aspect | Value |
|--------|-------|
| **Definition** | Co-membership in `BusinessMember` |
| **Source** | Business module reader |
| **Confidence** | medium |
| **Explainability** | "Colleague at {business}" |
| **Permission** | Active member; directory visibility rules |
| **Use** | Pin colleague, start chat, share — not HR data leak |

---

### Shared project

| Aspect | Value |
|--------|-------|
| **Definition** | Tasks in same `TaskProject` or todo project scope |
| **Source** | `todo.visibility` |
| **Confidence** | medium |
| **Explainability** | "Same project {name}" |
| **Permission** | Project visible to user |

---

### Shared calendar events

| Aspect | Value |
|--------|-------|
| **Definition** | Co-attendance on `EventAttendee` |
| **Source** | Calendar adapters |
| **Confidence** | medium |
| **Explainability** | "Same meeting {title}" |
| **Permission** | Event visible to user |

---

### Shared files

| Aspect | Value |
|--------|-------|
| **Definition** | Co-access via share or same folder visibility |
| **Source** | `drive.visibility` |
| **Confidence** | medium |
| **Explainability** | "You both access {file}" — title only if visible |
| **Permission** | File must be visible — no inferring shares from V_Link |

---

### Shared conversations

| Aspect | Value |
|--------|-------|
| **Definition** | Same `ConversationParticipant` set overlap |
| **Source** | `chat.visibility` |
| **Confidence** | medium |
| **Explainability** | "Active in same chat" |
| **Permission** | Participant only — no message content in signal |

---

### Shared location

| Aspect | Value |
|--------|-------|
| **Definition** | Place listing geography, event location field, user Place interests |
| **Source** | Place providers, calendar event location |
| **Confidence** | low–medium |
| **Explainability** | "Near {area}" or "Matches your interests" |
| **Permission** | Public catalog or user's own location prefs |

---

### Graph proximity

| Aspect | Value |
|--------|-------|
| **Definition** | 1-hop visible neighbors in **session graph projection** |
| **Source** | Graph builder — dashed eligible only |
| **Confidence** | low |
| **Explainability** | "Connected in your workspace graph" |
| **Permission** | Same as [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) |
| **Forbidden** | Deep graph mining; N-hop |

---

### Search behavior

| Aspect | Value |
|--------|-------|
| **Definition** | User recently searched/opened entity A then B |
| **Source** | Client session / search history — user scoped |
| **Confidence** | low |
| **Explainability** | "You recently viewed both" |
| **Permission** | Acting user only — never other users' search |
| **Use** | Suggest link/group — not surveillance |

---

### AI context overlap

| Aspect | Value |
|--------|-------|
| **Definition** | Same module providers returned both entities in recent twin turn |
| **Source** | Pipeline diagnostics / correlation rules |
| **Confidence** | low–medium |
| **Explainability** | "Appeared together in AI context" |
| **Permission** | User's own AI session only |
| **Forbidden** | Persist overlap as UserMemoryFact without confirm |

---

### Domain event correlation (cross-cutting)

| Aspect | Value |
|--------|-------|
| **Definition** | Temporal proximity of events (file upload after chat message) |
| **Source** | [RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md](./RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md) — T2 tier |
| **Confidence** | rule-defined |
| **Explainability** | Rule name + event types |
| **Permission** | Event metadata safe fields only |

Reference: `AISuggestionSignal`, ambient suggestion rules.

---

## Signal combination rules

| Rule | Statement |
|------|-----------|
| SC1 | Multiple **low** may upgrade band to **medium** — not **high** without explicit intent signal |
| SC2 | Conflicting signals → prefer **deny** recommendation |
| SC3 | Cross-tenant signals → **discard** |
| SC4 | Signals on trashed entities → **discard** |
| SC5 | Same signal family dedupe per `(user, targetAction, window)` |

---

## ML / embeddings (future — governance only)

| Rule | Statement |
|------|-----------|
| ML1 | ML may **rank within** pre-filtered candidate set — not expand candidates |
| ML2 | Candidates must come from adapter-visible entities only |
| ML3 | Model output requires **explainabilityKey** mapping — no pure embedding neighbor without reason |
| ML4 | No vector store as relationship SoR |
| ML5 | Phase 3+ intelligence platform — separate charter |

**Phase 2D-3:** Document families only — no ML implementation.

---

## Signal ownership

| Family | Owner team |
|--------|------------|
| Place / follow / location | Place |
| V_Link co-membership | Platform V_Link |
| Chat / conversation | Chat |
| Calendar / meeting | Calendar |
| Todo / project | Todo |
| Drive / file | File Hub |
| AI correlation | AI platform |
| Cross-module correlator (future) | Platform architecture |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RECOMMENDATION_PERMISSION_MODEL.md](./RECOMMENDATION_PERMISSION_MODEL.md) | Filter rules |
| [RECOMMENDATION_GOVERNANCE.md](./RECOMMENDATION_GOVERNANCE.md) | Signal certification |

**Last updated:** 2026-06-14
