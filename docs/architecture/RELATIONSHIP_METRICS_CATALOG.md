# Relationship Metrics Catalog

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-4 — Relationship analytics constitutional architecture  
**Status:** Canonical metrics reference  
**Date:** 2026-06-14  
**Model:** [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md)

> **Scope:** Catalog of **relationship-oriented metrics** — source, owner, derivation, confidence, retention. **No** metric implementation or dashboard specs.

---

## How to read entries

| Column | Meaning |
|--------|---------|
| **Source** | Events, adapters, graph projection, or recommendation store |
| **Owner** | Team accountable for metric definition |
| **Derivation** | event \| adapter_snapshot \| graph_projection \| recommendation |
| **Confidence** | high \| medium \| low |
| **Retention** | R2 source / R3 rollup guidance |

---

## Core metrics

### Relationship counts (by class)

| Field | Value |
|-------|-------|
| **Definition** | Count of active edges per taxonomy class in tenant scope |
| **Source** | Domain events (net create − revoke/delete) or adapter snapshot |
| **Owner** | Platform architecture + module |
| **Derivation** | event (preferred), adapter_snapshot |
| **Confidence** | high (events), medium (snapshot) |
| **Retention** | R3 rollup 1–7y; rebuild from R2 events |
| **Notes** | Per-class dashboards — no single "total relationships" without class breakdown |

---

### Membership growth

| Field | Value |
|-------|-------|
| **Definition** | Net new members over window (business, V_Link, community) |
| **Source** | `business.member.added`, `vlink.member.added`, `place.community.joined` |
| **Owner** | Business / Platform / Place |
| **Derivation** | event |
| **Confidence** | high |
| **Retention** | R3 |

---

### V_Link adoption

| Field | Value |
|-------|-------|
| **Definition** | Users/businesses with ≥1 active V_Link; new containers per period |
| **Source** | `vlink.created`, membership events |
| **Owner** | Platform V_Link |
| **Derivation** | event |
| **Confidence** | high |
| **Retention** | R3 |

---

### V_Link utilization

| Field | Value |
|-------|-------|
| **Definition** | Attachments per container; active members; hub views (if instrumented) |
| **Source** | `vlink.entity.linked`, VLinkActivity, adapter snapshot |
| **Owner** | Platform V_Link |
| **Derivation** | event + adapter_snapshot |
| **Confidence** | high (links), medium (snapshot attachment count) |
| **Retention** | R3 |

---

### Cross-module linkage

| Field | Value |
|-------|-------|
| **Definition** | Count of V_Link attachments by `entityType` / moduleId |
| **Source** | `vlink.entity.linked` metadata |
| **Owner** | Platform |
| **Derivation** | event |
| **Confidence** | high |
| **Retention** | R3 |
| **Forbidden** | Cross-tenant module linkage comparison |

---

### Tag utilization

| Field | Value |
|-------|-------|
| **Definition** | Distinct tags used; entities with ≥1 tag; top facets (public catalog only cross-user) |
| **Source** | Entity update events with tag diff (**gap**: standardize metadata), adapter snapshot |
| **Owner** | Module owners |
| **Derivation** | event (when diff exists), adapter_snapshot |
| **Confidence** | medium |
| **Retention** | R3 — public catalog facets longer; private workspace shorter |
| **Notes** | No cross-module tag identity metric without namespace governance |

---

### Recommendation acceptance rate

| Field | Value |
|-------|-------|
| **Definition** | Accepted / (Accepted + Rejected + Dismissed) per type |
| **Source** | Proposal terminal states, `vlink.suggestion.accepted` |
| **Owner** | AI platform / V_Link |
| **Derivation** | recommendation |
| **Confidence** | high |
| **Retention** | R3 — diagnostic 90d–1y typical |

---

### Recommendation rejection rate

| Field | Value |
|-------|-------|
| **Definition** | Rejected / shown proposals |
| **Source** | Reject/dismiss events |
| **Owner** | AI platform |
| **Derivation** | recommendation |
| **Confidence** | high |
| **Retention** | R3 |

---

### Graph density

| Field | Value |
|-------|-------|
| **Definition** | Edges / nodes in **visible** session subgraph |
| **Source** | Graph projection builder |
| **Owner** | Graph provider owner |
| **Derivation** | graph_projection |
| **Confidence** | low–medium |
| **Retention** | R4 ephemeral — do not warehouse without event backing |
| **Label required** | `derivation: graph_projection` |

---

### Participation activity

| Field | Value |
|-------|-------|
| **Definition** | RSVP changes, meeting joins, event attendee counts |
| **Source** | `calendar.event.rsvpUpdated`, place meeting events |
| **Owner** | Calendar / Place |
| **Derivation** | event |
| **Confidence** | high |
| **Retention** | R3 |

---

### Relationship churn

| Field | Value |
|-------|-------|
| **Definition** | Revokes, unlinks, member removes, unshares per period |
| **Source** | `file.unshared`, `vlink.entity.unlinked`, `vlink.member.removed`, etc. |
| **Owner** | Platform + modules |
| **Derivation** | event |
| **Confidence** | high |
| **Retention** | R3 |

---

### Relationship lifespan

| Field | Value |
|-------|-------|
| **Definition** | Duration from create event to revoke/delete event per edge id |
| **Source** | Paired domain events + edge id in metadata |
| **Owner** | Platform architecture |
| **Derivation** | event |
| **Confidence** | high when edge id stable |
| **Retention** | R3 aggregate; raw pairs R2 |

---

### Association depth

| Field | Value |
|-------|-------|
| **Definition** | V_Link nesting depth; task dependency chain length (bounded) |
| **Source** | Adapter snapshot on container/project |
| **Owner** | Platform / Todo |
| **Derivation** | adapter_snapshot |
| **Confidence** | medium |
| **Retention** | R3 |
| **Cap** | Report max depth — align with traversal limits |

---

### Container usage

| Field | Value |
|-------|-------|
| **Definition** | Active conversations, calendars, projects, V_Links with activity in window |
| **Source** | Activity events + last-access instrumentation |
| **Owner** | Module owners |
| **Derivation** | event |
| **Confidence** | medium–high |
| **Retention** | R3 |

---

## Supplementary metrics (module-specific)

| Metric | Source | Owner |
|--------|--------|-------|
| Share recipient cardinality | `file.shared` | Drive |
| NotebookLink create rate | `notebook.link.created` | Notebook |
| Task dependency count | adapter / future event | Todo |
| Place follow growth | connection events | Place |
| Chat attachment rate | `chat.message.sent` metadata | Chat |
| Orphaned V_Link attachment ratio | unlink + delete events | Platform |

---

## Confidence guidelines

| Level | When to use |
|-------|-------------|
| **high** | Single domain event type with idempotency |
| **medium** | Adapter snapshot or multi-event inference |
| **low** | Graph projection or heuristic health |

Dashboards must display confidence band for medium/low.

---

## Retention guidance (summary)

| Data class | Default |
|------------|---------|
| Raw domain events (R2) | Indefinite unless compliance override |
| Tenant rollups (R3) | 90d–7y by product tier |
| Graph session metrics | Do not persist |
| Recommendation funnels | 1y diagnostic |
| PII in metrics | **Forbidden** — counts and ids hashed in partner exports |

---

## Gaps (documentation — not Phase 2D-4 implementation)

| Gap | Metric impact |
|-----|---------------|
| Tag diff not on all `*.updated` events | Tag utilization under-reported |
| TaskDependency events | Dependency metrics activity-only |
| Unified metric registry runtime | Catalog is constitutional only |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_HEALTH_MODEL.md](./RELATIONSHIP_HEALTH_MODEL.md) | Interpreted health |
| [RELATIONSHIP_ANALYTICS_GOVERNANCE.md](./RELATIONSHIP_ANALYTICS_GOVERNANCE.md) | Metric certification |

**Last updated:** 2026-06-14
