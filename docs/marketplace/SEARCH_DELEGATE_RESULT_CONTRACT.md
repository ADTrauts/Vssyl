# Search Delegate — Result Contract

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Contract specification — **implemented in Phase 1B-B** (`shared/src/types/search-delegate.ts`, `searchDelegateNormalizer.ts`)  
**Authority:** `shared/types/search.ts`, `server/src/ai/retrieval/aiRetrievalEvidenceMapper.ts`, [SEARCH_CONSTITUTION.md](../search/SEARCH_CONSTITUTION.md)

---

## 1. Purpose

Define the **canonical partner search result format** that aligns with Unified Search, AI Retrieval evidence, and Context Graph inference — without requiring changes to those downstream systems.

**Design principle:** Partner delegate returns a **narrow superset** of `SearchResult`; platform normalizer produces strict `SearchResult[]`.

---

## 2. Type hierarchy

```
PartnerSearchResultItem  (partner returns)
        ↓ normalizePartnerSearchResults()
SearchResult             (platform internal — shared/types/search.ts)
        ↓ mapSearchResultToEvidence()
AIRetrievalEvidence      (aiRetrievalTypes.ts)
        ↓ enrichGraphBundlesFromRetrieval (optional, flag-gated)
RetrievalInferenceProvenance nodes/edges
```

---

## 3. Partner result item (`PartnerSearchResultItem` v1)

```typescript
interface PartnerSearchResultItem {
  /** Stable entity id in partner SoR — required */
  id: string;
  /** Display title — required */
  title: string;
  /** Optional snippet for search UI and AI summary */
  description?: string;
  /** Entity type slug — required; must be in manifest entityTypes */
  type: string;
  /** Deep link path or URL — required */
  url: string;
  /** Partner-side relevance 0–1 recommended */
  relevanceScore?: number;
  /** ISO-8601 last modified */
  lastModified?: string;
  /** Structured metadata for AI/graph — optional */
  metadata?: Record<string, unknown>;
  /** Read permission — required */
  permissions: Array<{
    type: 'read' | 'write' | 'admin';
    granted: boolean;
  }>;
}
```

### 3.1 Platform-injected fields (partner must NOT set)

Normalizer overwrites/sets:

| Field | Source |
|-------|--------|
| `moduleId` | Registry `moduleId` |
| `moduleName` | Registry manifest name |

Partner-supplied `moduleId` / `moduleName` if present are **ignored**.

---

## 4. Required fields

| Field | Rule | Unified Search | AI Retrieval | Graph inference |
|-------|------|----------------|--------------|-----------------|
| `id` | Non-empty string, max 128 chars | Hit key | `entityId` | Dedup key |
| `title` | Non-empty, max 512 chars | UI title | `title` | Node title |
| `type` | Must be in manifest `searchDelegate.entityTypes` | Filter by type | `entityType` | Entity ref |
| `url` | HTTPS or app-relative path `/...` | Navigation | `route` via mapper | `display.url` |
| `permissions` | ≥1 entry; `read.granted` must be true to include | Security | `permissionsVerified` | Eligibility |

---

## 5. Optional fields

| Field | Rule | Downstream use |
|-------|------|----------------|
| `description` | Max 1024 chars; plain text | UI subtitle; `summary` in evidence |
| `relevanceScore` | 0–1 float | Merge sort; `confidence` in evidence |
| `lastModified` | ISO-8601 | UI sorting; freshness signal |
| `metadata` | Max 4 KB JSON | Extensibility; graph metadata |

### 5.1 Recommended metadata keys (future-compatible)

| Key | Type | Purpose |
|-----|------|---------|
| `entityType` | string | Redundant with `type` — ignored if conflicts |
| `businessId` | string | Audit; must match request context if present |
| `dashboardId` | string | Audit |
| `status` | string | e.g. `active`, `archived` — exclude archived in partner SoR |
| `tags` | string[] | Future facet search |
| `thumbnailUrl` | string | UI enrichment (HTTPS only) |

**Do not include:** PII beyond what search UI already shows; secrets; internal partner ids unrelated to `id`.

---

## 6. Normalization rules

`normalizePartnerSearchResults(raw, context)` applies:

| Rule | Action |
|------|--------|
| **N-01** | Drop rows missing `id`, `title`, `type`, or `url` |
| **N-02** | Drop rows where `permissions` lacks `read` with `granted: true` |
| **N-03** | Set `moduleId`, `moduleName` from registry |
| **N-04** | Clamp `relevanceScore` to [0, 1]; default 0.5 if absent |
| **N-05** | Parse `lastModified` to `Date`; default `new Date()` if invalid |
| **N-06** | Strip HTML from `title`, `description` |
| **N-07** | Truncate title 512, description 1024 |
| **N-08** | Reject `type` not in registered `entityTypes` |
| **N-09** | Normalize `url`: if relative, ensure leading `/`; if absolute, must be HTTPS |
| **N-10** | Cap metadata serialized size 4 KB |
| **N-11** | Cap total results to request `limit` (default 10, max 25) |
| **N-12** | Strip unknown top-level keys |

### 6.1 URL / deep link conventions

| Scope | URL pattern (pilot) |
|-------|---------------------|
| **Business** | `/business/{businessId}/workspace/{moduleId}?entity={id}` |
| **Personal** | `/modules/run/{moduleId}?scope=personal&entity={id}` |

Partners should emit URLs matching workspace embed plan ([WORKSPACE_PARTICIPATION_ARCHITECTURE.md](./WORKSPACE_PARTICIPATION_ARCHITECTURE.md)).

Platform may rewrite URLs in Phase 1C when workspace embed ships.

---

## 7. Mapping to AI Retrieval evidence

Existing mapper (`mapSearchResultToEvidence`) — **no changes required** if normalization is correct:

```typescript
// aiRetrievalEvidenceMapper.ts (existing)
{
  sourceType: 'search',
  sourceModule: result.moduleId,      // partner moduleId
  entityId: result.id,
  entityType: result.type,
  title: result.title,
  summary: result.description,
  score: result.relevanceScore,
  confidence: normalizeEvidenceConfidence(result.relevanceScore),
  route: normalizeRoute(result.url),
  permissionsVerified: /* all permissions granted */,
  retrievedAt: ISO8601,
}
```

### 7.1 Evidence eligibility for Context Graph bridge

From [CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md](../context-graph/CONTEXT_GRAPH_RETRIEVAL_BRIDGE.md):

| Condition | Partner result requirement |
|-----------|---------------------------|
| `permissionsVerified: true` | N-02 enforced |
| confidence ≥ 0.2 | N-04 clamp or default 0.5 |
| Valid entity ref | `moduleId` + `type` + `id` |
| Not duplicate SoR node | Dedup in bridge |

**No Context Graph code changes in 1B-A.**

---

## 8. Unified Search ranking

Post-normalization merge in `executeGlobalSearch`:

1. Concatenate all provider results
2. Sort by `relevanceScore` descending (existing)
3. Optional future: provider weight by manifest tier

Partner modules compete equally with first-party on score. Platform may apply **minimum score threshold** (0.1) to drop noise — same as string-heuristic floor in `calculateRelevanceScore`.

---

## 9. Entity type registry

Manifest declares:

```json
{
  "entities": [{
    "type": "asset",
    "displayName": "Asset",
    "supportsSearch": true
  }],
  "searchDelegate": {
    "entityTypes": ["asset"]
  }
}
```

**Parity rule (PS-03):** Every `searchDelegate.entityTypes[]` entry must match an `entities[].type` where `supportsSearch: true`.

**Namespacing (recommended for multi-tenant partners):** `{moduleId}_{type}` e.g. `acme_assets_asset` — prevents collision in graph dedup.

---

## 10. Versioning & compatibility

| Contract version | Status |
|----------------|--------|
| **v1** | Phase 1B-A (this document) |
| **v2** (future) | Faceted filters, suggestions endpoint, cursor pagination |

Request/response include `contractVersion: '1'`. Platform rejects partner responses with unsupported major version.

**Forward compatibility:** Normalizer ignores unknown optional fields in `metadata`.

---

## 11. Example

### Partner response

```json
{
  "success": true,
  "contractVersion": "1",
  "results": [
    {
      "id": "ast_9f2a",
      "title": "Forklift #12",
      "description": "Warehouse A — serial FL-2024-012",
      "type": "asset",
      "url": "/business/biz_abc/workspace/acme-assets?entity=ast_9f2a",
      "relevanceScore": 0.92,
      "lastModified": "2026-06-20T14:00:00.000Z",
      "permissions": [{ "type": "read", "granted": true }],
      "metadata": { "status": "active", "location": "Warehouse A" }
    }
  ],
  "meta": { "durationMs": 45, "totalMatches": 1 }
}
```

### After normalization (`SearchResult`)

```json
{
  "id": "ast_9f2a",
  "title": "Forklift #12",
  "description": "Warehouse A — serial FL-2024-012",
  "moduleId": "acme-assets",
  "moduleName": "Acme Asset Tracker",
  "url": "/business/biz_abc/workspace/acme-assets?entity=ast_9f2a",
  "type": "asset",
  "metadata": { "status": "active", "location": "Warehouse A" },
  "permissions": [{ "type": "read", "granted": true }],
  "lastModified": "2026-06-20T14:00:00.000Z",
  "relevanceScore": 0.92
}
```

---

## 12. Contract tests (implementation phase)

| Test | Asserts |
|------|---------|
| `partnerSearchResultNormalizer.test.ts` | N-01–N-12 |
| `searchDelegateContract.test.ts` | Golden partner response → evidence mapping |
| `searchProviderRegistry.test.ts` | Dynamic provider merge |
| CI fixture | `docs/test-modules/partner-search-delegate-v1.json` |

---

**Last updated:** 2026-06-24 (Phase 1B-B — `searchDelegateNormalizer.ts` implements this contract)
