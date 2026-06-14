# Tag / Relationship Boundary Review

**Program:** Vssyl Relationship Framework  
**Phase:** 2A — Tag constitutional architecture  
**Status:** Canonical boundary reference  
**Date:** 2026-06-14  
**Taxonomy:** [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md)  
**Strategy:** [TAG_STRATEGY.md](./TAG_STRATEGY.md)

> Explicit comparison to **prevent semantic collapse** between tags and relationship mechanisms. Use in PR review, product specs, and AI feature design.

---

## One-line definitions

| Mechanism | One line |
|-----------|----------|
| **Tag** | Label on one entity for filter/facet — no target entity |
| **Relationship** | Typed connection with platform taxonomy class — may involve two principals or entities |
| **V_Link** | User-curated cross-module **Association container** + membership — not access grant |
| **Operational link** | Module-owned edge with workflow meaning (NotebookLink, TaskFileLink, share, assign) |

---

## Comparison matrix

| Dimension | Tag | Relationship (generic) | V_Link | Operational link |
|-----------|-----|--------------------------|--------|------------------|
| **Taxonomy class** | Tag | Varies (14+ classes) | Association (+ Membership on container) | Association / Reference / Access grant / … |
| **Direction** | None | Often directed | Container → entities | Often directed |
| **Target entity** | None | Yes | Yes (attachments) | Yes |
| **Grants content access** | No | Sometimes (share, member) | **No** (constitutional) | Sometimes |
| **Cross-module** | Module-local v1 | Module junction or platform | **Yes** — core purpose | Often cross-module |
| **User curated** | Yes (labels) | Varies | **Yes** | Often yes |
| **AI pipeline source** | No (via provider only) | Via providers / vlink | **`vlink` source** | Via module providers |
| **SoR** | Host entity row | Module/platform table | `VLinkEntity` | Module table |
| **Trash lifecycle** | With host | Class-specific | Edge persists on entity trash | Class-specific |
| **Example storage** | `Task.tags[]` | `FilePermission` | `VLinkEntity` | `NotebookLink` |

---

## Decision tree

```
Need to connect two entities for user workflow?
  ├─ Need collaborator to READ file content? → Access grant (share)
  ├─ Need task on page for work execution? → NotebookLink (operational)
  ├─ Need task linked to file in Todo? → TaskFileLink (operational)
  ├─ Need cross-module "project context" for human + AI? → V_Link (Association)
  └─ Need filter label on one entity only? → Tag
```

```
Need AI to know items are related?
  ├─ User confirmed grouping? → V_Link (persisted)
  ├─ User stated fact? → UserMemoryFact (AI context)
  ├─ Module already links them? → Module provider
  ├─ Same tag string on two items? → NOT sufficient — do not infer relationship
  └─ Query-time similarity? → Inference only (ephemeral)
```

---

## Worked examples

### Example 1 — Tax project

| User intent | Wrong mechanism | Correct mechanism |
|-------------|-----------------|-------------------|
| "Label tasks `#2024-tax`" | — | **Tag** on each Task |
| "Group receipt PDF + spreadsheet + deadline task for AI" | Tags only | **V_Link** container with FILE + TASK attachments |
| "Share receipt with accountant" | Tag `#shared` | **FilePermission** grant |
| "Link meeting notes page to tax task" | Tag on both | **NotebookLink** PAGE→TASK |
| "Remember I prefer FIFO accounting" | Tag on user | **UserMemoryFact** |

### Example 2 — Vendor on Place

| User intent | Wrong | Correct |
|-------------|-------|---------|
| "Find organic grocery stores" | V_Link | **Place listing tags** + explore search |
| "Follow Joe's Market" | Tag `#followed` | **BusinessFollow** (Follow class) |
| "Save supplier listing to renovation vlink" | Tag on listing | **V_Link** PLACE_LISTING attachment |
| "Link vendor page in notebook" | Listing tag | **NotebookLink** PAGE→PLACE_LISTING |

### Example 3 — Team chat

| User intent | Wrong | Correct |
|-------------|-------|---------|
| "Mark conversation `#project-alpha`" | **Forbidden** tag field v1 | Folder/star UX or V_Link to conversation |
| "Add conversation to project vlink" | Tag | **V_Link** CHAT_CONVERSATION |
| "Invite teammate to chat" | Tag | **ConversationParticipant** (Membership) |

### Example 4 — Calendar

| User intent | Wrong | Correct |
|-------------|-------|---------|
| "Tag event `#client-acme`" | — | **Tag** (if/when Event.tags shipped) |
| "Invite client to event" | Tag | **EventAttendee** (Participation) |
| "Link event to project vlink" | Tag on event | **V_Link** CALENDAR_EVENT |

### Example 5 — AI custom context

| User intent | Wrong | Correct |
|-------------|-------|---------|
| "Organize my AI instructions by `#finance`" | UserMemoryFact | **UserAIContext.tags** |
| "AI should remember I hate mornings" | Tag `#not-morning` | **UserMemoryFact** with category preference |
| "Link files for AI project" | Tags on files only | **V_Link** + Drive visibility |

---

## Semantic collapse risks

| Collapse | Symptom | Prevention |
|----------|---------|------------|
| **Tag = V_Link** | User tags two items and expects cross-module AI graph | Product copy + V_Link UX for grouping; tags stay single-entity |
| **Tag = share** | `#shared-with-jane` grants access | PE + FilePermission only |
| **Tag = assignment** | `#assignee-jane` on task | `assignedToId` + notifications |
| **Same string = linked** | Search `#urgent` implies relationship | Federation doc: no inference from tag collision |
| **Tag = memory** | Tags on tasks become AI facts | UserMemoryFact promotion flow |
| **Hashtag = tag SoR** | Chat `#topic` indexed globally without membership | Forbidden until message tag contract exists |
| **Listing tag = follow** | Clicking tag follows business | Follow is explicit action |

---

## Review checklist (PR / spec)

- [ ] Does this feature connect two entities? → **Not a tag** — pick relationship class  
- [ ] Does this grant read access? → **Access grant**, not tag  
- [ ] Does this group items for AI across modules? → **V_Link**, not tag  
- [ ] Does this only filter one module's list? → **Tag** candidate  
- [ ] Does AI need it as durable fact? → **UserMemoryFact**, not tag  
- [ ] Is storage module-local `tags[]`? → Update [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](./TAG_OWNERSHIP_AND_SCOPE_MATRIX.md) if new module  
- [ ] Does global search expose it? → [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md)  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) | All relationship classes |
| [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | NotebookLink vs V_Link pattern |
| [V_LINK.md](./V_LINK.md) | V_Link non-negotiables |

**Last updated:** 2026-06-14
