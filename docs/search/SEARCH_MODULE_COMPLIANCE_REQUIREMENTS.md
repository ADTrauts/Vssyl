# Search Module Compliance Requirements

**Program:** Unified Search Capability — Phase 1B  
**Version:** 1.0.0  
**Date:** 2026-06-23  
**Status:** Binding compliance standard for modules participating in Unified Search  
**Authority:** [SEARCH_CONSTITUTION.md](./SEARCH_CONSTITUTION.md), [SEARCH_PLATFORM_STANDARD.md](./SEARCH_PLATFORM_STANDARD.md), [moduleSpecs.md](../../memory-bank/moduleSpecs.md)

---

## 1. Compliance classes

| Class | Definition |
|-------|------------|
| **Search Compliant** | Module meets all requirements below; may claim `capabilities.search` |
| **Search Exempt** | Module has no user-facing searchable entities; must not claim search |
| **Search Planned** | `readiness: planned`; must **not** claim `capabilities.search: true` |
| **Platform Provider** | Member, V_Link — platform-owned; exempt from manifest module rules |

---

## 2. Requirements to become Search Compliant

A module **must** satisfy **all** items to claim global search and remain certified:

| # | Requirement | Verification |
|---|-------------|--------------|
| **R-01** | Register a `RegisteredSearchProvider` in `searchProviderRegistry.ts` | Registry + test |
| **R-02** | Implement `searchAccessible*` (or equivalent) in visibility service | Code review |
| **R-03** | Enforce module read PE on every hit (dual or filter) | Unit test |
| **R-04** | Support tenant-aware queries (`dashboardId`, `businessId`, `householdId`) | Integration test |
| **R-05** | Return normalized `SearchResult` shape | Type check |
| **R-06** | Declare `entityTypes` matching manifest `entities[].supportsSearch` | Parity review |
| **R-07** | Set `manifestSearchClaim: true` aligned with manifest | `assertManifestSearchProviderParity` |
| **R-08** | Provide deep links (personal + business workspace when applicable) | Manual / contract test |
| **R-09** | Exclude trashed/deleted entities from global hits | Visibility where clause |
| **R-10** | Document operation matrix row | `UNIFIED_SEARCH_OPERATION_MATRIX.md` |
| **R-11** | Pass search certification tests in module or platform suite | CI green |

---

## 3. Compliance checklist (copy per module PR)

```markdown
### Search compliance — [moduleId]

- [ ] R-01 Provider registered (`providerId`: ___)
- [ ] R-02 Visibility search delegate exists (`___`)
- [ ] R-03 Entity read PE enforced on hits
- [ ] R-04 Tenant context honored from `filters.context`
- [ ] R-05 SearchResult normalization verified
- [ ] R-06 entityTypes: ___
- [ ] R-07 manifest `capabilities.search` matches provider
- [ ] R-08 Deep links: personal ___ / business ___
- [ ] R-09 Trashed excluded
- [ ] R-10 Operation matrix updated
- [ ] R-11 Tests added/updated
```

---

## 4. Current built-in compliance status

| Module | Class | Provider | Visibility delegate | Notes |
|--------|-------|----------|---------------------|-------|
| **drive** | ✅ Compliant | ✅ | `searchAccessibleDrive*` | Reference visibility pattern |
| **chat** | ✅ Compliant | ✅ | `searchAccessibleChat` | |
| **calendar** | ✅ Compliant | ✅ | `searchEvents` | |
| **todo** | ✅ Compliant | ✅ | `searchAccessibleTasks` | Pass `dashboardId` in business context |
| **notes** | ✅ Compliant | ✅ | `searchAccessiblePages` | Phase 1A |
| **place** | ✅ Compliant | ✅ | `searchListingsForUser` | |
| **dashboard** | ✅ Compliant | ✅ | inline scoped Prisma | Owner-only — SC-A4 |
| **vlink** | ✅ Compliant (platform) | ✅ | `searchVLinksForUser` | |
| **member** | ✅ Compliant (platform) | ✅ | `memberSearchVisibility` | |
| **hr** | ⚪ Exempt | — | — | No manifest search |
| **scheduling** | ⚪ Exempt | — | — | No manifest search |
| **workforce_comms** | ⚪ Exempt | — | — | No manifest search |
| **admin** | ⚪ Exempt | — | — | Operator search — separate contract |
| **notebook** | 🟡 Partial | — | via notes | Composition; no separate provider |

---

## 5. Marketplace module requirements

Third-party modules **must** meet R-01–R-11 **plus**:

| # | Marketplace requirement |
|---|-------------------------|
| **M-01** | Ship `SearchProvider` compatible with `shared/types/search.ts` |
| **M-02** | Register via marketplace manifest loader (Phase 2 — not yet runtime) |
| **M-03** | Visibility API hosted in partner boundary — no in-process Prisma in platform orchestrator |
| **M-04** | Pass module certification checklist search section |
| **M-05** | iframe/bundle modules expose search via documented HTTP delegate |

Until M-02 ships, marketplace modules are **Search Planned** — cannot claim global search in store manifest.

---

## 6. Certification test minimum

| Test | Scope |
|------|-------|
| `searchProviderRegistry` parity | All manifest search modules |
| Provider unit | Visibility delegation mocked |
| PE deny | Security reason blocks hit |
| Tenant mismatch | Business/dashboard isolation |
| Route contract | `POST /api/search` response shape |

Module teams **should** add module-specific search tests following `todoVisibilityService.test.ts` / `notesSearchVisibility.test.ts` patterns.

---

## 7. Non-compliance consequences

| Violation | Action |
|-----------|--------|
| Manifest claims search, no provider | **Block merge** — parity test fails |
| Provider without visibility PE | **Block certification** |
| Cross-tenant leakage | **P0 security fix** — revoke search claim until fixed |
| Shadow search in controller | **Architectural violation** — refactor to provider |

---

## 8. Exemption process

Modules seeking **Search Exempt** status while having searchable entities (rare):

1. Document rationale in module audit.
2. Set `capabilities.search: false` and `supportsSearch: false` on entities **or** document module-local-only search.
3. Architecture governance approval required.

---

**Last updated:** 2026-06-23
