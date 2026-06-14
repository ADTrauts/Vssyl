# Tag Ownership and Scope Matrix

**Program:** Vssyl Relationship Framework  
**Phase:** 2A — Tag constitutional architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Strategy:** [TAG_STRATEGY.md](./TAG_STRATEGY.md)

> Per-module policy for user-facing **tags** (`String[]` or equivalent). **Allowed** = permitted pattern; **Recommended** = product-endorsed; **Forbidden** = do not introduce without architecture review.

---

## Legend

| Verdict | Meaning |
|---------|---------|
| **Allowed** | May use module-local tags if product needs them |
| **Recommended** | Existing or strong product fit — prefer tags over relationship misuse |
| **Forbidden** | Do not add entity tags — use relationship class or metadata named in "Why" |
| **N/A** | No user-entity tagging surface today |

---

## Summary matrix

| Module | Tags on user entities | Verdict | Primary storage (if any) | Why |
|--------|----------------------|---------|--------------------------|-----|
| **Drive** | User file/folder tags | **Allowed** (not shipped) | — or future `File.tags` | Folders = hierarchy; starred = Preference; share = Access grant |
| **Chat** | Message/conversation tags | **Forbidden** (v1) | — | Membership + content; hashtags = body text not SoR |
| **Calendar** | Event tags | **Allowed** (not shipped) | — or future `Event.tags` | Attendees = Participation; calendar = Containment |
| **Todo** | Task tags | **Recommended** ✅ | `Task.tags` | Filter/board views; assignment separate |
| **Notes** | Page tags | **Recommended** ✅ | `Note.tags` | In-module organization |
| **Place** | Listing/community tags | **Recommended** ✅ | `BusinessPlaceListing.tags`, `PlaceCommunity.tags` | Public discovery facets |
| **AI** | Custom context tags | **Recommended** ✅ | `UserAIContext.tags` | User org of instructions — not UserMemoryFact |
| **Business** | Org/module marketplace tags | **Allowed** | `Module.tags` (marketplace) | Admin/catalog — not personal relationship graph |
| **HR** | Employee/record tags | **Allowed** (future) | TBD | Use PE + HR visibility; not V_Link |
| **Scheduling** | Shift/coverage tags | **Allowed** (future) | TBD | Structured schedules prefer typed fields |

---

## Drive (File Hub)

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Allowed** — not required for reference implementation |
| **Current state** | No `File.tags` / `Folder.tags`; `starred` = Preference; folders = Hierarchy |
| **Recommended use** | Optional future `#labels` on files for personal/business filter (like Gmail labels) |
| **Forbidden** | Tags as substitute for folder hierarchy, file share, or V_Link grouping |
| **Visibility** | Tag facet only within Drive search/list user already accesses |
| **AI** | Export via Drive provider if added — not `vlink` source |
| **Why allowed but not recommended yet** | File Hub reference patterns prioritize visibility, trash, share, V_Link — tags add facet complexity without blocking certification |

---

## Chat

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Forbidden** for structured conversation/message tag fields in v1 |
| **Current state** | No tag columns; `ConversationParticipant` = Membership |
| **Allowed alternative** | Message **content** may contain `#hashtag` text — not indexed as Tag SoR unless Phase 2B+ defines message metadata contract |
| **Forbidden** | Conversation-level tags that imply access; tags replacing thread membership |
| **AI** | Recent/unread providers — no tag facet |
| **Why** | Chat organization is temporal + membership; tag SoR would duplicate search across message bodies and confuse with relationship graph |

---

## Calendar

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Allowed** — not shipped |
| **Current state** | Event fields (title, location); attendees = Participation; calendar color = presentation |
| **Recommended use** | Optional `Event.tags[]` for personal/business event filters (e.g. `#client`, `#deep-work`) |
| **Forbidden** | Tags instead of attendees, calendar membership, or V_Link to event |
| **AI** | If added, expose in calendar providers only |
| **Why allowed** | Low risk metadata on owned events; does not overlap RSVP or V_Link |

---

## Todo

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Recommended** ✅ |
| **Current state** | `Task.tags String[]` + optional `Task.category` (single metadata) |
| **Recommended use** | Multi-label filter on boards; category for structured reporting |
| **Forbidden** | Tags for assignee (`assignedToId`), dependencies, or file links |
| **Coexistence** | `TaskFileLink` / V_Link remain separate relationship classes |
| **AI** | May appear in task overview provider when task visible |
| **Why recommended** | Core task UX pattern; already implemented; clear boundary from Assignment/Association |

---

## Notes

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Recommended** ✅ |
| **Current state** | `Note.tags String[]` on pages |
| **Recommended use** | Personal/business page organization and filter |
| **Forbidden** | Tags replacing NotebookLink, NoteShare, or V_Link |
| **Notebook product** | Notebook composes notes — tags stay on Note row (notes module SoR) |
| **AI** | recent/pinned providers may include tags when exported |
| **Why recommended** | Standard notes UX; module-owned; no cross-module identity needed |

---

## Place

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Recommended** ✅ (listing/community); **N/A** (personal graph nodes) |
| **Current state** | `BusinessPlaceListing.tags`, `PlaceCommunity.tags`; `PlaceInterest.category` = Preference not Tag |
| **Recommended use** | Discovery facets on **published** listings; community discovery |
| **Forbidden** | Tags on `PlaceNode` as relationship edges; tags granting listing admin access |
| **Public vs private** | Listing tags may appear in explore/search when published; personal graph tags N/A |
| **AI** | Place providers use graph + listings — listing tags as facet metadata |
| **Why recommended** | Directory/discovery product requires faceted search; distinct from Follow relationship |

---

## AI

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Recommended** ✅ (UserAIContext only) |
| **Current state** | `UserAIContext.tags` for custom context UI filter |
| **Distinct from** | `UserMemoryFact` (uses `category` enum — AI context class, not Tag) |
| **Forbidden** | Tags on memory facts as replacement for structured category; tags as pipeline context source id |
| **AI retrieval** | Custom context filtered by tag in UI — twin sees row content when active, not tag index alone |
| **Why recommended** | User organization of instruction rows; bounded scope; no cross-module facet |

**Also N/A for tagging:** Pipeline catalog labels, intent categories, provider registry categories — platform **config**, not user tags.

---

## Business

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Allowed** (marketplace/admin module metadata) |
| **Current state** | `Module.tags` on marketplace module records |
| **Recommended use** | Marketplace discovery, admin classification |
| **Forbidden** | Tags on `BusinessMember` as role substitute; tags as org-chart relationships |
| **N/A** | Personal user content — belongs in workspace modules |
| **Why allowed** | Catalog metadata pattern; isolated from tenant user data tags |

---

## HR

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Allowed** (future — not required for certification) |
| **Current state** | No widespread `tags[]` on employee records in product UX |
| **Recommended use** | Optional skills/team labels on HR entities with strict PE |
| **Forbidden** | Tags replacing job assignment, org chart edges, or business membership |
| **AI** | HR providers read via visibility service — tags optional export |
| **Why allowed not mandatory** | Enterprise customers may want labels; must not collide with BusinessMember roles |

---

## Scheduling

| Aspect | Policy |
|--------|--------|
| **Verdict** | **Allowed** (future) |
| **Current state** | Shift/coverage models use structured fields |
| **Recommended use** | Optional shift labels (`#floor`, `#opening`) if product adds tags[] |
| **Forbidden** | Tags instead of shift assignment or coverage rules |
| **Why allowed** | Similar to Todo — local filter metadata if product needs it |

---

## Cross-module rules

| Rule | Detail |
|------|--------|
| **No shared tag namespace** | `urgent` on task ≠ `urgent` on note unless future index defines equivalence |
| **No tag-triggered access** | Reading a tag never grants entity access |
| **Composition modules** | Notebook reads Note.tags via notes SoR — does not duplicate |
| **V_Link** | Container has no tags in v1; linked entities retain own tags |
| **Place + Todo** | Listing tags public facet; task tags private — federation must scope |

---

## Governance

| Change | Gate |
|--------|------|
| Add tags[] to new module entity | Update this matrix + TAG_STRATEGY anti-patterns |
| Platform Tag Index | Phase 2B+ architecture doc + federation contract amendment |
| Chat/message tagging | Requires TAG_SEARCH guidelines update + boundary review |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [TAG_STRATEGY.md](./TAG_STRATEGY.md) | Definitions and lifecycle |
| [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](./TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) | Semantic boundaries |
| [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) | Relationship SoR |

**Last updated:** 2026-06-14
