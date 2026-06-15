# AI Relationship Retrieval Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-1 — Read adapter constitutional architecture  
**Status:** Canonical AI retrieval rules  
**Date:** 2026-06-14  
**Assembly:** [AI_CONTEXT_ASSEMBLY.md](./AI_CONTEXT_ASSEMBLY.md)  
**Automation:** [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md)

> **Scope:** How AI **retrieves relationships** for grounding, suggestions, and synthesis. **No** pipeline implementation changes in this phase.

---

## Purpose

AI must compose context from **federated read adapters** — never bypass module visibility or treat derived indexes as truth. This document aligns AI retrieval with search architecture (2B), automation boundaries (2C), and context provider architecture.

---

## Core rules

| # | Rule |
|---|------|
| AI-1 | **AI never bypasses module visibility** — all entity payloads through adapters |
| AI-2 | **AI reads adapters, not raw tables** — no cross-module Prisma in twin path |
| AI-3 | **V_Link uses resolver + pipeline** — membership ≠ attachment access |
| AI-4 | **Tags are host metadata** — via module providers, not tag graph |
| AI-5 | **Search indexes are layer 4** — hydrate re-check before prompt |
| AI-6 | **Events signal re-fetch** — not grounding SoR ([AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md)) |
| AI-7 | **Pending suggestions excluded** — until user accept |
| AI-8 | **Inference is ephemeral** — disclosed, not persisted as relationship |

---

## Federation ordering (retrieval precedence)

When assembling relationship context for a twin request:

```
1. UserMemoryFact          — MemoryRetrievalService (user explicit facts)
2. Persisted V_Link        — vlinkPipelineContextService + vlinkEntityResolverService
3. Module AI providers     — ContextProviderOrchestrator → Pattern A
4. Operational links       — notebook.links / todo refs via Pattern C (when intent needs)
5. Search / index hydrate  — Pattern B/D only if tool explicitly searches — PE re-check
6. Domain event signal     — Triggers re-run of layers 2–3 — payload not injected raw
7. entityLinking inference — Merge with persistedVLinks preference — ephemeral flag
```

**Lower layers never override higher layers** for cross-module "relatedness" truth.

---

## Retrieval paths by relationship class

| Class | AI retrieval path | Pattern |
|-------|-------------------|---------|
| Ownership | Module entity providers | A |
| Membership | Container providers — roster metadata only | A |
| Assignment | Todo providers | A |
| Access grant | Implicit — user sees shared entities via Drive/Notes providers | A |
| Association (V_Link) | `vlinkPipelineContextService` | C via pipeline |
| Reference / NotebookLink | Target module hydrate after notebook adapter | C |
| Attachment | Chat provider + Drive on file analysis | A + C |
| Dependency | Todo overview provider | A |
| Hierarchy | Bounded tree in module provider | A |
| Containment | Scoped lists (project tasks, calendar events) | A |
| Participation | Calendar / place meeting providers | A |
| Follow | `place_connections`, discovery providers | A |
| Tag | On entity in module provider — not standalone | A |
| AI context | MemoryRetrievalService, UserAIContext | A |
| Preference | Pinned/recent providers | A |
| Communication | `recent_conversations`, bounded messages | A |

---

## V_Link retrieval (detailed)

### Pipeline flow

```
Intent selects vlink catalog source (optional)
  → fetchVLinkPipelineContext(user, dashboard, business, intent)
  → list confirmed VLinks user is member of
  → listVLinkEntities per vlink
  → vlinkEntityResolverService.resolve each attachment
  → full | restricted placeholder in bundle
  → entityLinking.merge(persistedVLinks preferred)
  → assembleAIContext
```

### Rules

| Rule | Detail |
|------|--------|
| Membership filter | Non-members never receive container bundle |
| Resolver mandatory | Every attachment passes `*VlinkAccessService` |
| Restricted items | Metadata-only placeholder — no title leak |
| Pending suggestions | **Excluded** from pipeline |
| Archive / trash | Per lifecycle matrix — archived container policy |

**Catalog source:** `vlink` in pipeline catalog — not generic `relationships`.

---

## Tag retrieval boundaries

From [TAG_STRATEGY.md](./TAG_STRATEGY.md) + [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md):

| Allowed | Forbidden |
|---------|-----------|
| Tags on entities returned by module providers | Standalone tag catalog source parallel to vlink |
| Tag match as rank boost within visible set | Cross-module tag equivalence inference |
| UserAIContext.tags for custom instructions | Chat hashtag scraping |
| Tag Index → hydrate → provider payload | Tag Index row without entity hydrate |

**No** `tags` pipeline catalog source at platform tier until governed namespace exists.

---

## Search interaction

| Scenario | AI behavior |
|----------|-------------|
| User asks "find my tax files" | AI tool may invoke SearchProvider path — results PE-checked |
| Ambient correlation after `file.uploaded` | Re-fetch Drive provider — not search index dump |
| Global search index (future) | Layer 4 — same rules as [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) |
| Relationship edge search (future) | Pattern C adapters — not search hit as edge SoR |

AI tools that search must use **orchestrator/API** that delegates to registered providers — not SQL.

---

## Module context providers vs read adapters

| Layer | Role |
|-------|------|
| **AI context provider** (K6) | Bounded, intent-specific bundle for twin |
| **Visibility adapter** (K1) | Authoritative relationship/entity read |
| **V_Link pipeline** (K4) | Cross-module association bundle |

**Rule:** K6 implementations **must delegate** to K1/K4 — not duplicate queries with weaker gates.

Registration: `registerBuiltInModules.ts` + [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md).

---

## Cross-module synthesis (`entityLinking`)

| Input | Weight |
|-------|--------|
| `persistedVLinks` from pipeline | Highest |
| Module provider cross-refs | Medium |
| Tag co-occurrence | **Not used** for link inference |
| Search results | Low — ephemeral unless user pins |
| Inference | Lowest — label `inferred: true` |

Output is **request-scoped** — do not write to UserMemoryFact or VLinkEntity from linking alone.

---

## Event-driven retrieval

Domain events **do not** append relationship paragraphs to prompts directly.

| Event | AI action |
|-------|-----------|
| `file.shared` | Optional ambient suggestion — re-fetch on accept |
| `vlink.entity.linked` | Invalidate vlink cache — next request refreshes layer 2 |
| `file.unshared` | Exclude from next provider fetch |
| Allowlisted types | Learning stub + suggestion schedule only |

See [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md).

---

## Multi-tenant and business twin

| Context | Retrieval scope |
|---------|-----------------|
| Personal dashboard | dashboardId scope on all adapters |
| Business workspace | businessId + membership-proven |
| V_Link BUSINESS scope | businessId on vlink + member check |
| Public Place | Public catalog providers only — no private task tags |
| HR (future) | HR adapters — never mix personal memory |

---

## Diagnostics and explainability

Pipeline diagnostics should show:

- Which registry providers supplied blocks  
- Whether V_Link attachments were full vs restricted  
- Whether inference contributed (flag)  
- **Not** raw event payloads as "relationship proof"

---

## Anti-patterns

| Anti-pattern | Correct retrieval |
|--------------|-------------------|
| JOIN File + Task in AI service | Todo provider + Pattern C |
| V_Link member → assume file read | Resolver |
| Search index → prompt without hydrate | Provider re-fetch |
| Tag `#urgent` links modules | Separate facets per module |
| Auto-create memory from share event | User-confirmed memory only |
| Graph DB query in twin | Adapter catalog + optional derived viz (2D-2) |

---

## Alignment checklist

- [ ] [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) — layer 4 search  
- [ ] [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) — no silent exec  
- [ ] [AI_CONTEXT_ASSEMBLY.md](./AI_CONTEXT_ASSEMBLY.md) — assembler flow  
- [ ] [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) — F2, F6, F7  
- [ ] [audits/AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md) — provider inventory  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md) | Patterns A–E |
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md) | Per-class adapters |

**Last updated:** 2026-06-14
