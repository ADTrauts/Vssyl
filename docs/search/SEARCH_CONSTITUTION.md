# Search Constitution

**Program:** Unified Search Capability — Phase 1B  
**Version:** 1.0.0  
**Ratified:** 2026-06-23  
**Status:** **Constitutional** — permanent platform law for discovery infrastructure  
**Authority:** Peer to [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §24 (Search), [SEARCH_ARCHITECTURE_DECISION_RECORD.md](../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md), [RELATIONSHIP_SEARCH_ARCHITECTURE.md](../architecture/RELATIONSHIP_SEARCH_ARCHITECTURE.md)

**Capability id:** `unified_search`

---

## 1. Purpose

Unified Search is **platform discovery infrastructure**. It answers:

> *Can this user find information anywhere in Vssyl that they are authorized to see?*

It is **not** a product module, not a UI feature, and not a substitute for module systems of record.

---

## 2. Architectural law

### 2.1 Federation first (Option C)

1. **Authoritative reads** come from module **visibility services** and platform delegates — never from a shadow store that replaces SoR.
2. **Derived indexes** (tags, events, acceleration) are **optional read facets** — never write paths, never permission authorities.
3. The **orchestrator merges views**; it does not own entity truth.

### 2.2 Capability boundary

| Layer | Owner | May |
|-------|-------|-----|
| **Orchestrator** | `searchCapabilityService` | PE gate, fan-out, merge, sort |
| **Providers** | Module / platform | Query visibility APIs; normalize results |
| **Visibility services** | Module SoR | Permission-aware queries |
| **Controllers** | HTTP | Parse, auth extract, delegate |

Controllers **must not** contain provider implementations or Prisma search logic.

---

## 3. Search guarantees

Every module and platform surface participating in Unified Search **must**:

| # | Guarantee |
|---|-----------|
| **G-S1** | **Respect permissions** — every hit passes module read policy (PE dual or visibility equivalent) |
| **G-S2** | **Respect tenant boundaries** — `dashboardId`, `businessId`, `householdId` scoped; no cross-tenant leakage |
| **G-S3** | **Respect platform identity** — results scoped to authenticated actor; no anonymous global search |
| **G-S4** | **Respect Policy Engine** — orchestrator enforces `search:read`; providers enforce entity read actions |
| **G-S5** | **Return normalized results** — `SearchResult` shape from `shared/types/search.ts` |
| **G-S6** | **Declare honesty** — manifest `capabilities.search` must match registered provider readiness |
| **G-S7** | **Fail closed on security denies** — `NOT_MEMBER`, `TENANT_MISMATCH`, `NOT_OWNER` block orchestrator |
| **G-S8** | **Exclude trashed / deleted** — unless explicit operator/admin surface with separate contract |

---

## 4. Search prohibitions

Modules and platform code **must not**:

| # | Prohibition |
|---|-------------|
| **P-S1** | **Leak inaccessible entities** — never return titles/content the user cannot read via SoR |
| **P-S2** | **Bypass Policy Engine** — no global search path without `search:read` evaluation |
| **P-S3** | **Return raw unrestricted results** — no unfiltered Prisma dumps to global merge |
| **P-S4** | **Implement shadow permission systems** — search-specific ACLs that contradict module PE |
| **P-S5** | **Claim search in manifest without provider** — capability lies violate §19 |
| **P-S6** | **Write SoR from search** — search is read-only infrastructure |
| **P-S7** | **Index restricted content in derived stores** without same visibility contract |
| **P-S8** | **Conflate search with activity** — discovery ≠ immutable activity records |

---

## 5. Provider contract (constitutional minimum)

A **RegisteredSearchProvider** must declare:

- `providerId`, `displayName`, `moduleId`
- `entityTypes[]` — searchable entity types
- `supportedContexts[]` — personal | business | household
- `requiredPermission` — primary PE read action
- `searchMethod` — visibility_service | prisma_filter | platform_delegate
- `readiness` — ready | partial | planned
- `manifestSearchClaim` — boolean alignment with manifest

Provider `search()` **must** delegate to visibility service or approved platform delegate — not ad hoc controller Prisma.

---

## 6. API law

| Rule | Requirement |
|------|-------------|
| **Entry point** | `POST /api/search` remains the tenant global search contract |
| **Backward compatibility** | Additive filter fields only without version bump |
| **Context** | `filters.context` is the canonical tenant scope carrier |
| **Module facet** | `filters.moduleId` restricts to one provider |
| **Response** | `{ success, results }` until explicit v2 charter |

---

## 7. Relationship to peer capabilities

| Capability | Relationship |
|------------|--------------|
| **Policy Engine** | Gates orchestrator; providers use module read actions |
| **Context Graph** | Tag index is optional **facet** reader — not SoR |
| **V_Link** | Separate provider; container discovery without restricted entity titles |
| **Platform Kernel / Activity** | Activity is not user search; future audit may emit search events |
| **AI Platform** | Must consume search delegates — not duplicate visibility paths |
| **Marketplace** | Third-party modules register `SearchProvider` — same contract |

---

## 8. Amendment process

1. Architecture governance proposes amendment with impact on providers and manifests.
2. Operation matrix and certification scorecard updated before ratification.
3. Ledger row updated if certification band changes.
4. Breaking API changes require explicit version charter — not silent drift.

---

## 9. Supersession

This constitution **supersedes** ad hoc search guidance in Memory Bank and informal module READMEs where they conflict. Module-specific visibility rules remain authoritative for **what** is searchable; this document governs **how** federation works.

**Related:** [SEARCH_PLATFORM_STANDARD.md](./SEARCH_PLATFORM_STANDARD.md), [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](./SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md)

---

**Last updated:** 2026-06-23
