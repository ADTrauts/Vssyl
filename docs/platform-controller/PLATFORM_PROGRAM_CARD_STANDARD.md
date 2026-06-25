# Platform Program Card — Standard

**Program:** Platform Controller Program — Phase 1B  
**Date:** 2026-06-24  
**Component:** `web/src/components/admin-portal/PlatformProgramCard.tsx`  
**Registry:** `web/src/config/platformPrograms.ts`

---

## 1. Purpose

Every **certified platform capability** uses the same card presentation on the Platform Programs hub. New programs add a registry entry + health probe mapping — **no card redesign**.

---

## 2. Required fields (executive layer — always visible)

| Field | Source |
|-------|--------|
| Program Name | `PlatformProgramDefinition.name` |
| Description | Static registry |
| Certification Status | `certificationLabel` |
| Health Status | Live API via `usePlatformProgramsHubHealth` |
| Version | Static registry |
| Last Validation | Static registry (ISO date string) |
| Open Findings | Static registry string array |
| Readiness summary | Optional — from existing API |
| Primary action | Deep link to canonical page |
| Secondary actions | Optional deep links |

---

## 3. Progressive disclosure layers

### Executive (default)

Certification, health badge, version, last validation, open findings count, readiness one-liner, primary/secondary CTAs.

### Operator (expand: "Operator details")

- Subsystem / workflow links (`operatorLinks`)
- Note that probes run on Marketplace submission detail (Marketplace program)

### Engineer (expand: "Technical details")

- Diagnostics, policy, registry, and documentation links (`engineerLinks`)
- External doc links open in new tab

---

## 4. Health status enum

| Value | Meaning |
|-------|---------|
| `healthy` | Existing API indicates nominal state |
| `degraded` | Gap or elevated risk from existing metrics |
| `unknown` | API unavailable — card still links to canonical surface |
| `loading` | Initial fetch in progress |

**Rule:** Never invent mock health values. If API fails, show `unknown` and link-only CTAs.

---

## 5. Health source mapping

| Program ID | `healthSource` | API |
|------------|----------------|-----|
| `platform-kernel` | `dashboard` | `getDashboardStats` |
| `unified-search` | `searchPilotReadiness` | `getMarketplaceReadiness('vssyl-pilot-assets')` |
| `ai-retrieval` | `pipeline` | `getAiPipelineQualityStats` |
| `context-graph` | `catalog` | `getAiPipelineCatalog` → `contextSources.length` |
| `marketplace-partner-runtime` | `moduleStats` | `getModuleStats` |

---

## 6. Adding a new program

1. Add entry to `PLATFORM_PROGRAM_DEFINITIONS` in `platformPrograms.ts`
2. Extend `healthSource` union + `loadProgramHealth` switch in `usePlatformProgramsHubHealth.ts`
3. Hub page auto-renders via map — **no hub layout change**

---

## 7. Anti-patterns

| Do not | Why |
|--------|-----|
| Embed full dashboards in card | Duplicates existing pages |
| Add probe buttons on hub | Probes stay on `MarketplaceReadinessCard` |
| Create program-specific card components | Breaks consistency |
| Fetch new backend endpoints | Out of scope for control plane IA |

---

**Last updated:** 2026-06-24 (Phase 1B)
