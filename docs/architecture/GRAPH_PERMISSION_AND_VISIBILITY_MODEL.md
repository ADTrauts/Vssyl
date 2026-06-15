# Graph Permission and Visibility Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph visualization constitutional architecture  
**Status:** Canonical visibility rules  
**Date:** 2026-06-14  
**Search parity:** [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md)  
**Hydration:** [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md)

> **Scope:** Permission and visibility rules for graph projections. **Fail-closed** — same bar as search and adapters.

---

## Core rule

**A graph cannot reveal data a user could not otherwise open** through normal module authorization paths.

Graph projection runs **the same visibility gates** as read adapters — not a weaker shortcut.

---

## Visibility filtering pipeline

```
1. Resolve acting user + tenant context
2. For each adapter call: visibility service / PE / resolver
3. Build nodes only from allowed DTOs
4. Build edges only when both endpoints policy allows (class-specific)
5. Apply redaction tier for partial visibility
6. Return subgraph — omit or redact denied — never leak title/content
```

| Stage | Owner |
|-------|-------|
| AuthN | Platform session |
| AuthZ | Module visibility + PE |
| Projection | Graph builder — no override |

---

## Cross-tenant protection

| Rule | Requirement |
|------|-------------|
| C1 | Subgraph query includes tenant scope keys |
| C2 | Adapters reject cross-tenant anchor ids |
| C3 | No unified "global graph" query |
| C4 | Business A subgraph never includes Business B nodes without membership proof |
| C5 | Public catalog nodes (`Place Listing`) partitioned by `visibilityClass` |

**Forbidden:** Admin-style graph without admin role.

---

## Permission inheritance (what graph must NOT assume)

| Misconception | Truth |
|---------------|-------|
| V_Link membership → see attachment content | **False** — resolver per entity |
| Folder share → see sibling files | **False** — per-file gate |
| Calendar member → see all events private to others | **False** — event visibility |
| Business member → see all employee personal dashboards | **False** — dashboard scope |
| Graph edge exists → both nodes readable | **False** — partial edge display allowed |

Graph may show **edge with redacted target** only where contract explicitly allows (V_Link restricted attachment).

---

## Hidden node behavior

| Scenario | Default behavior |
|----------|------------------|
| User lacks entity access | **Omit node** — do not show grey spy node with title |
| User lacks access but edge exists from visible anchor | **Redacted target node** OR omit edge — surface-specific |
| Trashed entity | Omit (default) or trash badge if policy allows |
| Permanent delete | Omit — no orphan node |
| Cross-tenant entity | Omit |
| AI memory node in team graph | Omit unless user-private graph mode |

### Redacted node (certified cases)

| Surface | Allowed placeholder |
|---------|---------------------|
| V_Link hub | "Restricted item" — no filename/title |
| Federated explorer | Omit edge entirely (prefer over redacted) |
| Place public graph | N/A — public nodes only |

**Forbidden:** Redacted node with guessable title from edge metadata.

---

## Hidden edge behavior

| Scenario | Behavior |
|----------|----------|
| Source visible, target denied | Omit edge OR redacted target per policy |
| Membership roster hidden | Omit membership edges |
| Revoked share | Edge removed on next projection |
| Pending V_Link suggestion | **Do not render** as solid edge |
| Inference-only link | Dashed only — user toggle |

---

## V_Link membership

| Check | Gate |
|-------|------|
| See container node | `vlinkPermissionService` — member |
| See attachment list | Member + `listVLinkEntities` |
| See attachment label | `vlinkEntityResolverService` → full vs restricted |
| See attachment deep link | Only if `full` |

Non-member: **no container node** in user's projection.

---

## PE checks

| Action | PE required |
|--------|-------------|
| Project graph for user | Implicit via visibility services |
| Graph gesture → open entity | Module route PE |
| Graph gesture → mutate relationship | Module mutation PE — not graph |
| Export subgraph (future) | Export permission + same visibility re-run |

Graph builder does **not** cache PE decisions across users.

---

## Partial visibility

| Pattern | Use |
|---------|-----|
| **Full node** | Label + deep link + tags |
| **Restricted node** | Generic icon + "Restricted" |
| **Aggregate only** | Count badge on container — no ids |
| **Edge-only metadata** | Role label without target title — rare |

Aligns with [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) counts vs hits.

---

## Aggregate counts

| Allowed | Forbidden |
|---------|-----------|
| "3 restricted attachments" on V_Link for members | Listing attachment filenames |
| "12 members" on container | Member list when user lacks roster read |
| Public follower count on listing | Private workspace tag counts cross-user |

Counts must not enable **enumeration attack** (infer hidden entity ids).

---

## Tag visibility on graph

| Context | Rule |
|---------|------|
| Private workspace entity | Tags only if user can open entity |
| Public listing | Public tags only |
| Cross-module federated graph | Module badge on tag chip |
| Chat hashtags | **Not** tag overlays v1 |

---

## Session cache

| Rule | Detail |
|------|--------|
| Cache key | `(userId, tenantScope, anchor, depth, adapterVersions)` |
| TTL | Short — 60–120s UI cache max |
| Invalidation | Domain events (Pattern E) or manual refresh |
| Cross-user | **Forbidden** shared graph cache |

---

## Failure modes (fail-closed)

| Failure | Behavior |
|---------|----------|
| Adapter timeout | Partial graph + warning badge |
| Hydrate deny | Omit/redact — never fail open |
| Resolver error | Treat as restricted |
| Stale cache | Re-run adapters on explicit refresh |

---

## Review checklist

- [ ] Every node type mapped to adapter + gate  
- [ ] V_Link uses resolver  
- [ ] No cross-tenant anchor  
- [ ] Suggestions not solid edges  
- [ ] Tags overlays not edges  
- [ ] Same user sees same labels as search would allow  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) | AI read of graph |
| [V_LINK.md](./V_LINK.md) | Membership ≠ access |

**Last updated:** 2026-06-14
