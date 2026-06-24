# Search Platform Standard

**Program:** Unified Search Capability — Phase 1B  
**Version:** 1.0.0  
**Date:** 2026-06-23  
**Status:** Platform standard — binding for certified modules and capabilities  
**Constitutional authority:** [SEARCH_CONSTITUTION.md](./SEARCH_CONSTITUTION.md)

---

## 1. Standard scope

This standard defines **how Vssyl implements Unified Search** as platform infrastructure. It applies to:

- Built-in modules with `capabilities.search: true`
- Platform providers (member, vlink)
- Future marketplace modules
- AI retrieval adapters (when implemented)

It does **not** define UI design, ranking algorithms, or central indexing implementation (deferred).

---

## 2. Capability classification

| Attribute | Value |
|-----------|-------|
| **Class** | Platform Capability |
| **Id** | `unified_search` |
| **Not** | Product module (`registerBuiltInModules` workspace landing) |
| **Certification** | L2 Certified With Findings (RD-US-001) |
| **Architecture** | Option C Hybrid — federation authoritative |

---

## 3. Required runtime components

| Component | Path / artifact | Required |
|-----------|-----------------|----------|
| Orchestrator service | `server/src/services/searchCapabilityService.ts` | ✅ |
| Provider registry | `server/src/services/search/searchProviderRegistry.ts` | ✅ |
| PE dual wrapper | `server/src/auth/searchPolicyDual.ts` | ✅ |
| PE action | `search:read` in `policyActions.ts` | ✅ |
| Shared contract | `shared/types/search.ts` | ✅ |
| HTTP entry | `POST /api/search` via thin `searchController` | ✅ |
| Parity test | `searchProviderRegistry.test.ts` | ✅ |

---

## 4. Provider implementation standard

### 4.1 Registration

1. Add `RegisteredSearchProvider` to `searchProviderRegistry.ts`.
2. Set `manifestSearchClaim: true` iff `builtInModuleManifests` declares `search: true`.
3. Add provider to `MANIFEST_SEARCH_MODULE_IDS` when manifest claims search.
4. Ensure `assertManifestSearchProviderParity()` passes in CI.

### 4.2 Implementation pattern

```
Provider.search(query, userId, filters)
  → resolve tenant scope from filters.context
  → module visibility service (searchAccessible*)
  → map to SearchResult[] with relevanceScore
  → include deep link (personal or business workspace URL)
```

**Anti-pattern:** Prisma queries in controller or orchestrator for module entities.

### 4.3 Readiness states

| State | Meaning | Global inclusion |
|-------|---------|------------------|
| `ready` | Production-safe; PE + tenant scoped | Yes |
| `partial` | Limited contexts or entity types | Only if documented |
| `planned` | Manifest may not claim search | No |

---

## 5. Security standard

### 5.1 Two-layer authorization

| Layer | Action | Blocks |
|-------|--------|--------|
| **Orchestrator** | `search:read` | Non-member business/household; dashboard tenant mismatch |
| **Provider** | Module read PE | Inaccessible entities filtered post-query |

### 5.2 Tenant context standard

Clients **should** pass:

```typescript
filters: {
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  };
  contexts?: string[]; // calendar dashboard contexts
}
```

Providers **must** honor scope when present; default to user-accessible personal scope when absent.

---

## 6. Result standard

Every `SearchResult` **must** include:

| Field | Requirement |
|-------|-------------|
| `id` | Entity id |
| `title` | Display title (no restricted content beyond read policy) |
| `moduleId` | Source module |
| `moduleName` | Human label |
| `type` | Entity type string |
| `url` | Deep link when navigable |
| `metadata` | Non-sensitive scoping hints |
| `permissions` | At minimum `[{ type: 'read', granted: true }]` for hits |
| `lastModified` | Entity timestamp |
| `relevanceScore` | Optional; orchestrator may re-sort |

---

## 7. Manifest standard

| Declaration | Rule |
|-------------|------|
| `capabilities.search: true` | Requires `ready` global provider |
| `capabilities.search: false` / absent | No global provider |
| `entities[].supportsSearch: true` | Entity type must appear in provider `entityTypes` when federated |
| Operator-only search (admin) | **Must not** set `capabilities.search` — separate control-plane contract |

---

## 8. Testing standard

| Test class | Required |
|------------|----------|
| Provider parity | Manifest ↔ registry |
| Orchestrator | PE denial, module filter, merge |
| Tenant isolation | Business/dashboard mismatch returns empty / 403 |
| Provider unit | Visibility service delegation |
| Route contract | `POST /api/search` backward compatibility |

---

## 9. Documentation standard

Modules with search **must** link:

- Operation matrix row (C/P/N)
- Provider entry in registry
- Visibility service search method

Platform capability **must** maintain:

- Constitution, platform standard, compliance requirements
- Certification review + executive summary
- Ledger row

---

## 10. Deferred standards (not required for L2 CwF)

| Topic | Standard status |
|-------|-----------------|
| Central / vector index | Charter required before implementation |
| AI retrieval adapter | Phase 2 standard TBD |
| Marketplace dynamic registry | Phase 2 standard TBD |
| Search activity audit events | Policy decision required |
| Parallel fan-out SLA | Performance standard TBD |

---

## 11. Compliance verification

| Verifier | Method |
|----------|--------|
| CI | `searchProviderRegistry.test.ts`, `searchCapabilityService.test.ts` |
| PR review | Provider + manifest diff together |
| Quarterly audit | Operation matrix vs runtime |
| Certification | G1–G9 scorecard refresh |

---

**Last updated:** 2026-06-23
