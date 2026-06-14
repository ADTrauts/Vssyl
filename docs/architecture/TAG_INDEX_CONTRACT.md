# Tag Index Contract

**Program:** Vssyl Relationship Framework  
**Phase:** 2B — Relationship search constitutional architecture  
**Status:** Canonical contract (future derived index)  
**Date:** 2026-06-14  
**Tag strategy:** [TAG_STRATEGY.md](./TAG_STRATEGY.md)  
**Search architecture:** [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md)

> **Scope:** Defines how a **future Tag Index** may consume module-owned tags for search and discovery. **No** index implementation, schema, service, or write API in this phase.

---

## Contract summary

The Tag Index is a **read-only, derived, non-authoritative** projection of module-local `tags[]` (and equivalent module tag fields). **Modules remain the sole SoR for tags.**

| Property | Requirement |
|----------|-------------|
| **Read-only** | Index consumers never mutate tags |
| **Derived** | Built from SoR rows or domain events |
| **Non-authoritative** | Conflict resolution always defers to module host row |
| **Tenant-scoped** | Every row carries full tenant context |
| **Invalidatable** | Host update/trash/delete triggers purge or rebuild |

---

## Relationship to other indexes

| Index | Stores | Collapse forbidden |
|-------|--------|-------------------|
| **Tag Index** | `(moduleId, entityType, entityId, tag)` | ≠ Relationship Index |
| **Entity search index** | Searchable text/metadata | Tags may duplicate as facet field only |
| **V_Link container index** | Hub titles, membership scope | ≠ tags on attachments |
| **Relationship read index** | Typed edges | ≠ tag strings |

---

## Index row shape (constitutional minimum)

Future implementations must include at minimum:

| Field | Required | Purpose |
|-------|----------|---------|
| `moduleId` | ✅ | Source module |
| `entityType` | ✅ | Host type (task, note, listing, …) |
| `entityId` | ✅ | Host primary key |
| `tag` | ✅ | Normalized display/filter string |
| `tagNormalized` | ✅ | Module-defined normalization (case fold, trim) |
| `dashboardId` | ✅* | Personal/household scope |
| `businessId` | ✅* | When business-scoped |
| `householdId` | ✅* | When household-scoped |
| `visibilityClass` | ✅ | `private_workspace` \| `business` \| `public_catalog` \| `user_ai_context` |
| `hostTrashedAt` | ✅ | Null = searchable by default |
| `hostUpdatedAt` | ✅ | Staleness / rebuild |
| `sourceVersion` | Recommended | Optimistic invalidation token from SoR |

\*At least one tenant key required per host scope rules.

**Forbidden fields on index row:**

- Permission grants  
- V_Link membership  
- Relationship target ids  
- AI memory content  

---

## Ingestion paths (allowed)

| Path | Pattern | When to use |
|------|---------|-------------|
| **I1 — Event-driven** | Domain event `entity.updated` with tag diff | Preferred at scale — Pattern D |
| **I2 — Provider pull** | Batch job reads module tables with tenant cursor | Initial backfill, repair |
| **I3 — Inline dual-write** | Module write path emits index message | Only if idempotent and async — **not** second SoR |
| **I4 — On-read cache** | Module provider tag filter only | Today — no platform index |

**Rule:** Ingestion **never** accepts tag writes from search consumers or global API.

---

## Consumer paths (allowed)

| Consumer | Allowed use |
|----------|-------------|
| **Global search orchestrator** | Facet filter → entity key set → hydrate via Entity SearchProviders |
| **Module search UI** | May bypass index — query SoR directly |
| **AI retrieval** | Tag match as rank signal on entities already visible via providers |
| **Recommendations** | Aggregate public catalog tag facets only — not private workspace tags |
| **Analytics** | Aggregated facet counts — PII-minimized |

### Hydration requirement

Tag Index returns **keys**, not openable hits. Orchestrator must **hydrate** each key through the owning module's visibility service. Stale index rows that fail hydration are dropped silently and scheduled for purge.

---

## Allowed operations

| Operation | Actor | Notes |
|-----------|-------|-------|
| Upsert index row | Index worker | From SoR event or backfill |
| Delete index row | Index worker | Host trashed, tag removed, permanent delete |
| Facet query | Search orchestrator | Tenant + visibility filtered |
| Full rebuild | Admin job | Per module or tenant — repair only |
| Staleness re-verify | Orchestrator | PE/visibility on hydrate |

---

## Forbidden operations

| Operation | Why forbidden |
|-----------|---------------|
| User tag assign via index API | Tags mutate only on module host |
| Cross-tenant facet query | Tenant isolation |
| Tag merge / rename globally | No global tag identity SoR |
| Index row as AI grounding without entity payload | Tag string alone insufficient |
| Index write on search click | Search is read path |
| Infer V_Link from tag co-occurrence | Semantic collapse |
| Store NotebookLink / share in Tag Index | Wrong mechanism |
| Public index row for private task without visibilityClass | Leak risk |

---

## Certified exceptions

Narrow cases where behavior deviates from default — **require architecture review**:

| Exception ID | Case | Condition | Guard |
|--------------|------|-----------|-------|
| **TE-1** | Admin support KB tags | Admin-only catalog | Separate `visibilityClass: admin_kb`; not mixed with user workspace facets |
| **TE-2** | Marketplace module `tags[]` | Public module discovery | Catalog-only index partition; no dashboard scope |
| **TE-3** | `UserAIContext.tags` | User-private AI instructions | UserId scope only; never in global workspace search |
| **TE-4** | Place public listing tags | Main Street explore | `public_catalog` + `isPublished` gate on ingest |
| **TE-5** | Emergency rebuild | Index corruption | Read-only rebuild from SoR; audit log required |

New exceptions require amendment to this table + TAG_OWNERSHIP_AND_SCOPE_MATRIX review.

---

## Module ingest eligibility

From [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](./TAG_OWNERSHIP_AND_SCOPE_MATRIX.md):

| Module | Index ingest | Notes |
|--------|--------------|-------|
| Todo | ✅ Recommended | `Task.tags[]` |
| Notes | ✅ Recommended | `Note.tags[]` |
| Place | ✅ Recommended | Listing/community tags — partition public vs private |
| AI | ⚠️ TE-3 only | UserAIContext — user scope partition |
| Drive | ⏳ Optional future | If product adds `tags[]` |
| Calendar | ⏳ Optional future | If product adds Event.tags |
| Chat | ❌ v1 | No structured tag SoR |
| Business catalog | ⚠️ TE-2 | Marketplace metadata only |
| HR / Scheduling | ⏳ When tags ship | Follow matrix |

---

## Invalidation events (conceptual)

Align with [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md):

| Event | Index action |
|-------|--------------|
| Host created with tags | Insert rows |
| Host tags updated | Diff upsert/delete |
| Host trashed | Delete or mark excluded |
| Host restored | Re-ingest from SoR |
| Host permanent delete | Hard purge |
| Tenant scope changed | Re-ingest host |
| Share revoked | Row may remain; hydrate denies |

Standardized tag-diff payload is **optional** — Phase 2C automation catalog may define.

---

## Consistency model

| Level | Guarantee |
|-------|-----------|
| **Strong** | Module SoR read with tag filter (no index) |
| **Eventual** | Tag Index facet — target SLA TBD at implementation |
| **Authoritative on conflict** | Always module host row |

Orchestrator must not expose "tag assigned" UX based solely on index — confirm via module API on mutation paths (future).

---

## Certification checklist (future implementation)

Before production Tag Index:

- [ ] No write endpoint exposed to clients  
- [ ] Every query filtered by tenant + visibilityClass  
- [ ] Hydration through module visibility service  
- [ ] Trashed hosts excluded by default  
- [ ] Separate partitions for TE-1 through TE-5  
- [ ] Invalidation wired to domain events or polling fallback  
- [ ] Rebuild runbook documented  
- [ ] Pen test: cross-tenant facet query returns zero  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md) | Discovery + AI interaction |
| [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) | Facet visibility |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | Pattern D |

**Last updated:** 2026-06-14
