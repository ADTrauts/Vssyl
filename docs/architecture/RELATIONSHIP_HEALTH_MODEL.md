# Relationship Health Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-4 — Relationship analytics constitutional architecture  
**Status:** Canonical interpretation layer  
**Date:** 2026-06-14  
**Lifecycle:** [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md)

> **Scope:** **Health** as an analytics **interpretation** of relationship and container state — not relationship truth.

---

## Core rule

**Health is an interpretation layer.**

**Health is not relationship truth.** SoR lifecycle states (active, trashed, archived, revoked) remain authoritative. Health labels guide UX, AI narrative, and admin insight only.

---

## Health vs lifecycle

| Lifecycle (SoR) | Health (analytics) |
|-----------------|---------------------|
| `active` | May map to **Healthy** or **Inactive** |
| `trashed` | **Archived** (entity) — not "Unhealthy relationship" |
| `soft-unlinked` | **Orphaned** (edge) |
| `revoked` | **Disconnected** |
| `archived` (V_Link) | **Archived** |

Health **never** mutates SoR rows.

---

## Health states

### Healthy

| Aspect | Value |
|--------|-------|
| **Definition** | Edge/container active with recent activity in window |
| **Signals** | Events in last N days; adapter confirms active row |
| **Typical thresholds** | Activity within 30d (configurable per class) |
| **Confidence** | medium — heuristic |
| **Visibility** | User sees own/workspace scope only |
| **AI** | ✅ "Your project links look active" — narrative |

---

### Inactive

| Aspect | Value |
|--------|-------|
| **Definition** | Active SoR but no activity beyond threshold |
| **Signals** | No events in 90d; snapshot still active |
| **Confidence** | medium |
| **Visibility** | Owner/admin — not public |
| **AI** | ✅ Suggest review/archive — **recommendation** not auto-archive |

---

### Orphaned

| Aspect | Value |
|--------|-------|
| **Definition** | Edge exists; target entity missing, trashed, or permanently inaccessible |
| **Signals** | Lifecycle matrix orphan rules; resolver deny + edge row |
| **SoR examples** | V_Link attachment after entity permanent delete (soft-unlinked) |
| **Confidence** | high when edge id + delete event correlated |
| **Visibility** | Container members |
| **AI** | ✅ Suggest unlink cleanup — user action |

---

### Disconnected

| Aspect | Value |
|--------|-------|
| **Definition** | Relationship explicitly revoked — share removed, member left |
| **Signals** | `file.unshared`, `vlink.member.removed` |
| **Confidence** | high |
| **Visibility** | Participants |
| **AI** | Historical narrative only — not active relationship |

---

### Fragmented

| Aspect | Value |
|--------|-------|
| **Definition** | User/workspace has many isolated containers — low cross-link density |
| **Signals** | Graph projection + container counts — **low confidence** |
| **Threshold** | Heuristic — e.g. >5 V_Links each with ≤1 attachment |
| **Confidence** | low |
| **Visibility** | User-private insight |
| **AI** | ✅ Suggest consolidation V_Link — recommendation flow |

---

### Archived

| Aspect | Value |
|--------|-------|
| **Definition** | Container or edge in archived lifecycle state |
| **Signals** | `vlink.archived`, `notebook.link.archived` |
| **Confidence** | high |
| **Visibility** | Members |
| **AI** | Exclude from active grounding contexts |

---

### Expired

| Aspect | Value |
|--------|-------|
| **Definition** | Time-bound invalidation — suggestion expired, memory expire |
| **Signals** | TTL events, lifecycle Expired state |
| **Confidence** | high |
| **Visibility** | Owner |
| **AI** | Exclude from active context |

---

## Threshold principles

| Principle | Rule |
|-----------|------|
| H1 | Thresholds are **product config** — document defaults, not hardcode in SoR |
| H2 | Different classes different windows (chat vs calendar vs V_Link) |
| H3 | Health recompute **async** — eventual |
| H4 | Downgrade confidence when adapter snapshot stale |
| H5 | Never auto-trash from health score |

---

## Visibility

| Audience | Scope |
|----------|-------|
| End user | Own dashboards, own V_Links, own modules |
| Business ADMIN | Business tenant aggregates — no employee personal dashboard detail |
| Platform admin | Aggregated cross-tenant — PII-minimized |
| Partner | **Forbidden** relationship health on user private data |

Health labels on **hidden** relationships are **omitted** — not inferred.

---

## AI eligibility

| Allowed | Forbidden |
|---------|-----------|
| Summarize health distribution for visible scope | State health as persisted UserMemoryFact without confirm |
| Suggest actions (archive, link, cleanup) | Auto-archive from Inactive |
| Explain orphan with generic wording | Leak restricted entity titles via health |
| Use health as **ranking signal** for recommendations (low weight) | Health overrides V_Link pipeline |

Precedence: below [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) confirmed relationships.

---

## Health computation flow

```
Domain events + optional adapter snapshot
  → Health interpreter (analytics job)
  → Label per (edgeId | containerId | workspace scope)
  → Store as derived R3 row OR compute on read
  → UI / AI consume with confidence band
```

**Never** write health back to `VLinkEntity`, `FilePermission`, etc.

---

## Anti-patterns

| Anti-pattern | Correct |
|--------------|---------|
| Health column on SoR table | Derived table only |
| "Unhealthy" auto-deletes share | User action |
| Cross-tenant health leaderboard | Forbidden |
| Graph density → health without events | Label low confidence |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_METRICS_CATALOG.md](./RELATIONSHIP_METRICS_CATALOG.md) | Input metrics |
| [ANALYTICS_PERMISSION_MODEL.md](./ANALYTICS_PERMISSION_MODEL.md) | Visibility |

**Last updated:** 2026-06-14
