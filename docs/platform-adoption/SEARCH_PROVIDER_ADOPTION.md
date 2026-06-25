# Search Provider Adoption

**Program:** Platform Capability Adoption — Wave 2  
**Date:** 2026-06-25  
**Status:** Complete for HR, Scheduling, Workforce Communications, Notebook

---

## 1. Reference pattern

Copy from File Hub / Calendar / Todo — **do not invent parallel search APIs**.

### Step 1 — Visibility service

Create `searchAccessible*` in a module visibility service:

```
server/src/services/hrVisibilityService.ts
server/src/services/schedulingVisibilityService.ts
server/src/services/workforceVisibilityService.ts
```

Notebook reuses `server/src/services/notes/notesVisibilityService.ts` (`searchAccessiblePages`).

**Requirements:**

- Minimum query length: 2 characters
- Resolve business memberships when `businessId` omitted
- Scope all Prisma queries by `businessId` (business modules)
- Call `evaluate*PolicyDual` per hit — never return unauthorized rows

### Step 2 — Registry provider

Register in `server/src/services/search/searchProviderRegistry.ts`:

| Field | Value |
|-------|-------|
| `providerId` / `moduleId` | Built-in module id |
| `searchMethod` | `visibility_service` |
| `readiness` | `ready` |
| `manifestSearchClaim` | `true` |
| `search` | Async wrapper mapping hits → `SearchResult` |

Use `buildPersonalOrBusinessModuleUrl` (personal/business) or `businessModuleUrl` helper (business-only deep links).

### Step 3 — Manifest

Update `server/src/startup/builtInModuleManifests.ts`:

- `capabilities.search: true`
- `supportsSearch: true` on searchable entity types

### Step 4 — Parity

Add module id to `MANIFEST_SEARCH_MODULE_IDS` and ensure `searchProviderRegistry.test.ts` passes.

---

## 2. Wave 2 provider inventory

| Provider | Entity types | PE gate (registry) |
|----------|--------------|-------------------|
| `hr` | employee_profile, time_off_request, onboarding_journey | `HR_EMPLOYEE_READ` |
| `scheduling` | schedule, shift | `SCHEDULING_SHIFT_READ` |
| `workforce_comms` | communication, campaign | `WORKFORCE_COMMUNICATION_READ` |
| `notebook` | page | `NOTES_PAGE_READ` |

**Built-in provider count:** 13 (was 9 pre-Wave 2).

---

## 3. AI Retrieval — automatic participation

No module-specific retrieval code was added. `aiRetrievalCapabilityService.discover()` calls `executeGlobalSearch`, which fans out to all ready providers.

**Exception documented:** None for Wave 2 modules. List/summary AI context providers (pre-existing) remain separate from query-driven discovery.

---

## 4. Context Graph — automatic participation

Search evidence from new providers flows through the existing bridge:

`AI Retrieval evidence` → `retrievalBundleInferenceBridge` → bundle inference / grounding reconciliation

**No new graph adapters** were required for Wave 2.

---

## 5. Tests

| Test file | Coverage |
|-----------|----------|
| `hrVisibilityService.test.ts` | PE boundaries, membership |
| `schedulingVisibilityService.test.ts` | Schedule/shift PE |
| `workforceVisibilityService.test.ts` | Published comms PE |
| `searchProviderRegistry.test.ts` | Manifest parity, Wave 2 providers |
| `searchWave2Discovery.test.ts` | Cross-module merge |
| `aiRetrievalCapabilityService.test.ts` | HR/scheduling evidence via unified search |

---

## 6. Validation checklist

| Check | Status |
|-------|--------|
| Permission enforcement per hit | ✅ PE dual |
| Business scope | ✅ `businessId` membership |
| Household scope | N/A (business-only BO modules); Notebook inherits notes tenant rules |
| Search relevance | ✅ `calculateRelevanceScore` on titles |
| AI evidence generation | ✅ Via `discover()` |
| Context Graph enrichment | ✅ Via retrieval bridge |
| Cross-module discovery | ✅ `executeGlobalSearch` merge |

**Last updated:** 2026-06-25
