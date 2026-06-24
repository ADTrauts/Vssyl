# V_Link Participation — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture recommendation — **no implementation**  
**Authority:** [V_LINK.md](../architecture/V_LINK.md), [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)

---

## 1. Participation readiness

| Mode | Level | Partner today? |
|------|-------|----------------|
| **Create V_Link relationships** | **1 — First Party Only** | ❌ |
| **Consume V_Link relationships** | **1 — First Party Only** | ❌ Platform UI only |
| **Expose V_Link-aware entities** | **1 — First Party Only** | ❌ |
| **Appear in V_Link search** | **1 — First Party Only** | ❌ In-process provider |

V_Link is a **Tier 0 platform layer** — not installable. Partner participation is the **hardest** ecosystem integration due to in-process resolver requirement today.

---

## 2. Current state

### Integration pattern (first-party)

1. Declare `entities[]` + `vlink` in manifest
2. Implement `*VlinkAccessService` (in-process)
3. Add resolver case in `vlinkEntityResolverService.ts`
4. Lifecycle unlink on permanent delete
5. Optional: search provider entry

### Module status (summary)

| Module | VLinkEntityType | Resolver |
|--------|-----------------|----------|
| drive | FILE, FOLDER | ✅ Reference |
| calendar | CALENDAR_EVENT | ✅ |
| chat | CHAT_CONVERSATION | ✅ |
| todo | TASK, TODO | ✅ |
| place | PLACE_LISTING, PLACE_MEETING | ✅ |
| notes | NOTE | ⚠️ Partial |
| **Marketplace/partner** | MODULE_ENTITY (enum placeholder) | ❌ No resolver |

**Non-negotiable:** Membership does not grant access to linked entity content.

---

## 3. Why partners are blocked

| Requirement | First-party | Partner |
|-------------|-------------|---------|
| Entity hydration for link picker | In-process resolver | Needs resolver |
| Content access check | `*VlinkAccessService` | External SoR |
| Lifecycle unlink on delete | Module delete hooks | Partner webhook? |
| Search for linkable entities | In-process search | Search delegate |
| AI grounding | Pipeline catalog | Requires resolver |

**Core conflict:** V_Link resolver runs in platform API process. Partners are out-of-process by design.

---

## 4. Recommended models

### Model A — V_Link Entity Proxy (recommended long-term)

Platform exposes **generic partner entity proxy** in resolver:

```
VLinkEntityType: PARTNER_ENTITY
metadata: { moduleId, partnerEntityType, partnerEntityId }
```

Resolver calls partner **V_Link delegate**:

```json
{
  "vlinkDelegate": {
    "hydrateUrl": "https://partner.example.com/vssyl/vlink/hydrate",
    "accessCheckUrl": "https://partner.example.com/vssyl/vlink/access",
    "searchUrl": "https://partner.example.com/vssyl/vlink/search",
    "version": "1"
  }
}
```

| Operation | Purpose |
|-----------|---------|
| `hydrate` | Title, subtitle, icon for link picker |
| `accessCheck` | User can read linked entity? |
| `search` | Find linkable entities (scoped) |

Platform stores V_Link edges; partner validates access on view.

**Effort:** Large (Phase 2–3). **Unlocks:** create + consume for partners.

---

### Model B — Consume-only via deep links (Phase 1B interim)

Partners **do not** create platform V_Links. They:

1. Display V_Link UI components inside iframe (read-only, if bundled)
2. Link **out** to platform entities via URLs passed in runtime config
3. Use search delegate to find platform entities to reference

**Does not** integrate partner entities into platform V_Link graph.

**Readiness:** Level 2 — architecturally clear, limited value.

---

### Model C — Integrated Partner resolver (exception tier)

Platform engineers add in-process resolver for strategic partner (like first-party).

**Use sparingly** — defeats marketplace scale benefits.

---

## 5. Standards (when Model A ships)

### 5.1 Entity declaration

```json
{
  "entities": [{
    "type": "property_unit",
    "displayName": "Property Unit",
    "vlink": {
      "linkable": true,
      "primaryLabelField": "name",
      "icon": "building"
    }
  }]
}
```

### 5.2 Security requirements

| # | Requirement |
|---|-------------|
| **VL-P01** | Access check on every hydrate — no link preview leakage |
| **VL-P02** | Membership ≠ content access (platform rule preserved) |
| **VL-P03** | User must have read on partner entity to link |
| **VL-P04** | Unlink on partner entity permanent delete (webhook to platform) |
| **VL-P05** | No auto-linking — user approval for AI suggestions |
| **VL-P06** | Tenant scope on all delegate calls |

### 5.3 Ownership requirements

| Asset | Owner |
|-------|-------|
| V_Link container record | Platform (user-owned) |
| Partner entity SoR | Partner |
| Link edge metadata | Platform |
| Entity content | Partner |

Partner delete → platform receives `entity.deleted` webhook → soft-unlink per [RELATIONSHIP_CASCADE_RULES.md](../architecture/RELATIONSHIP_CASCADE_RULES.md).

---

## 6. Participation matrix

| Action | Model A | Model B (interim) | Today |
|--------|---------|-------------------|-------|
| User links partner entity in V_Link | ✅ | ❌ | ❌ |
| User links platform entity from partner UI | ✅ | 🟡 URL only | 🟡 |
| V_Link search includes partner entities | ✅ | ❌ | ❌ |
| AI grounds on partner V_Links | ✅ | ❌ | ❌ |
| Partner module in vlink search provider | ✅ via delegate | ❌ | ❌ |

---

## 7. Vertical impact

| Vertical | V_Link value | Without partner V_Link |
|----------|--------------|------------------------|
| **CRM** | Link contacts to Chat/Drive | Manual copy/paste |
| **Property** | Link units to Calendar/Todo | Disconnected workflows |
| **Healthcare** | Link patients to notes (compliance) | Critical gap |
| **Inventory** | Link SKUs to Place/listings | Moderate gap |
| **Manufacturing** | Link work orders to tasks | Moderate gap |

---

## 8. Dependency order

```
Phase 1B: Search delegate (find platform entities from partner UI)
    ↓
Phase 2:  V_Link Entity Proxy delegate (Model A design + pilot)
    ↓
Phase 3:  AI grounding + graph integration for partner V_Links
```

**Do not add `VLinkEntityType` enum values without resolver** — existing platform rule.

---

## 9. Security: invalid V_Links

| Attack | Defense |
|--------|---------|
| Link to entity user cannot access | accessCheck delegate |
| Forge partner entity ids | Resolver validates with partner |
| Leak via link preview | Hydrate returns minimal metadata only |
| Cross-tenant link creation | JWT scoped context |

---

## 10. Recommendation

| Question | Answer |
|----------|--------|
| Can partners use V_Link today? | **No** (create or expose) |
| Interim path? | Model B — consume platform links via search/URLs |
| Target architecture? | Model A — V_Link Entity Proxy delegate |
| Rebuild V_Link? | **No** — extend resolver with partner branch |
| Target readiness | **Level 3** in Phase 2+ (after search) |

---

**Last updated:** 2026-06-23
