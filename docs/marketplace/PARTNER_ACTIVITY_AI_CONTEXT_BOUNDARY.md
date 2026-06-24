# Partner Activity — AI Context Boundary

**Program:** Marketplace & Module Ecosystem — Phase 1B-E  
**Date:** 2026-06-24  
**Status:** Future-path specification — **no implementation, no Context Graph / V_Link adapters**

---

## 1. Principle

Partner activity becomes AI-readable **only after** it exists as a normalized `module_activity_event` log row — the same authority model as first-party activity. AI consumers read through platform query boundaries; partners do not push AI context directly.

---

## 2. Current AI consumption of activity

| Consumer | Mechanism | Partner today |
|----------|-----------|---------------|
| **CrossModuleContextEngine** | Activity slice from platform logs | First-party only |
| **Place AI provider** | `GET /api/place/ai/context/activity` | Module-local |
| **Module AI context providers** | `registerBuiltInModules` `/api/.../ai/context/...` | First-party manifest |
| **AI Retrieval** | Evidence from search/indexed sources | Not activity stream |
| **Context Graph** | Entity grounding via retrieval bridge | Not activity ingest |
| **Unified Search** | Indexed entities | Not activity stream |

---

## 3. Future path: Activity → AI (recommended)

### Stage 1 — Feed query reuse (pilot+)

```
partner ingest → emitModuleActivityEvent → Log
                    ↓
platformActivityQueryService.getFeedForUser / getActivityForEntity
                    ↓
CrossModuleContextEngine activity slice
```

**Requirements:**

- Visibility scope respected (`business`, `personal`, `direct-share`)
- Tenant scoping on all queries
- Bounded result sets (existing patterns: top N, time window)

**No new AI API required** for baseline readability.

### Stage 2 — Module activity context provider (optional)

Certified partner modules may register a **read-only** AI context provider:

```
GET /api/modules/:moduleId/ai/context/activity?businessId=&limit=
```

| Rule | Detail |
|------|--------|
| Auth | User session + tenant membership |
| Data source | `platformActivityQueryService` filtered by `moduleId` |
| Write | ❌ Provider is read-only |
| Partner iframe | Cannot call provider directly — platform AI pipeline only |

Mirrors Place module pattern; hosted in marketplace runtime registration.

### Stage 3 — AI Retrieval integration

| Approach | Fit |
|----------|-----|
| Index recent activity snippets | Low priority — activity is temporal |
| On-demand query at inference | **Preferred** — query service at pipeline hook |
| Full-text index of metadata | Only for high-signal actions; bounded |

Align with `aiRetrievalPipelineHook` — activity as **evidence source** with provenance:

```typescript
{
  source: 'module_activity',
  moduleId: 'partner-foo',
  eventId: 'evt_...',
  action: 'complete',
  target: { type: 'work_order', id: 'wo-123' },
  occurredAt: '...'
}
```

### Stage 4 — Context Graph (deferred)

| Concern | Decision |
|---------|----------|
| Partner activity → graph nodes | **Deferred** — requires entity resolution |
| V_Link adapters | **Out of scope** |
| Retrieval bridge | Existing bridge is retrieval → graph, not activity → graph |

When entity registry matures, high-signal partner events may emit **graph enrichment hints** — platform-validated only.

### Stage 5 — Search

Activity is generally **not search-indexed** today. If surfaced in search:

- Index only `important` severity or allowlisted actions
- Respect visibility at index time
- Deep link to entity in partner module via workspace embed URL

---

## 4. What AI must not do (partner activity)

| Anti-pattern | Reason |
|--------------|--------|
| Trust partner metadata as facts | Metadata is partner-claimed |
| Bypass visibility scope | Tenant leak |
| Use activity for write authorization | Activity is observability, not authZ |
| Infinite history in prompt | Token + privacy bounds |
| Partner POST to AI context API | Trust boundary violation |

---

## 5. Visibility & privacy

| Scope | AI access rule |
|-------|----------------|
| `business` | User must be business member |
| `personal` | Actor or explicit share only |
| `household` | Household member |
| `direct-share` | Share graph proof |

AI pipeline must call query service — never raw `Log` table from partner context.

---

## 6. Provenance in AI responses

When partner activity informs an AI answer:

- Cite `moduleId` + `action` + `target` + `occurredAt`
- Label as partner-sourced ("According to [Module Name]…")
- Link to workspace embed deep link when available

---

## 7. Recommended rollout

| Phase | AI capability |
|-------|---------------|
| **1B-F** (ingest live) | Activity in user feed only — no AI |
| **1C** | CrossModuleContextEngine reads partner module rows |
| **1D** | Optional module activity provider endpoint |
| **2** | AI Retrieval evidence mapping for allowlisted actions |
| **3** | Context Graph hints (if entity registry exists) |

**Day-one AI readability:** ❌ Not recommended — prove ingest security and feed quality first.

---

## 8. Strategic alignment

| Platform initiative | Partner activity role |
|--------------------|----------------------|
| AI Retrieval Constitution | Evidence with provenance |
| Context Graph L4 | Deferred enrichment |
| Unified Search | Optional index for high-signal events |
| Module AI context | Read-only provider pattern |

---

**Last updated:** 2026-06-24
