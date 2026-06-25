# Discoverability Parity Matrix

**Program:** Platform Capability Adoption — Wave 2  
**Date:** 2026-06-25  
**Status:** Post-Wave 2 baseline

---

## 1. Module participation

| Module | Unified Search | AI Retrieval (query) | Context Graph (search evidence) | Manifest `search: true` | Provider ready |
|--------|----------------|----------------------|--------------------------------|-------------------------|----------------|
| **HR** | **F** | **F** (auto via search) | **F** (retrieval bridge) | ✅ | ✅ `hr` |
| **Scheduling** | **F** | **F** | **F** | ✅ | ✅ `scheduling` |
| **Workforce Comms** | **F** | **F** | **F** | ✅ | ✅ `workforce_comms` |
| **Notebook** | **F** | **F** | **F** | ✅ | ✅ `notebook` |
| Notes (legacy) | P — `notes` provider | P — list providers remain | P | ✅ | ✅ |
| Drive | F | P — list + search | F | ✅ | ✅ |
| Chat | F | F | P | ✅ | ✅ |
| Calendar | F | F | F | ✅ | ✅ |
| Todo | F | P | F | ✅ | ✅ |
| Place | F | P | F | ✅ | ✅ |
| Analytics | M | M | M | ❌ | ❌ |
| Dashboard widgets | M | M | M | ❌ | ❌ |

**Legend:** **F** = Full · **P** = Partial · **M** = Missing

---

## 2. Entity-level search coverage

| Module | Searchable entities | Not indexed (by design) |
|--------|---------------------|-------------------------|
| HR | employee_profile, time_off_request, onboarding_journey | attendance_exception |
| Scheduling | schedule, shift | swap_request |
| Workforce Comms | communication (published), campaign (managers) | draft/archived comms |
| Notebook | page | operational links (separate surface) |

---

## 3. Tenant scope matrix

| Module | Personal | Business | Household |
|--------|----------|----------|-----------|
| HR | N/A | ✅ membership + PE | N/A |
| Scheduling | N/A | ✅ | N/A |
| Workforce Comms | N/A | ✅ | N/A |
| Notebook | ✅ dashboard scope | ✅ business workspace | ✅ notes visibility rules |

---

## 4. Platform capability consumers (no duplicate paths)

| Consumer | Entry point | Wave 2 change |
|----------|-------------|---------------|
| Omnibar / `/api/search` | `executeGlobalSearch` | +4 providers |
| Search suggestions | `getSearchSuggestionsForUser` | +4 module hints |
| AI Retrieval | `discover()` → `executeGlobalSearch` | Automatic |
| Context Graph | `retrievalBundleInferenceBridge` | Automatic |
| Platform Controller | Manifest parity test | `MANIFEST_SEARCH_MODULE_IDS` +10 entries total |

---

## 5. Remaining gaps (post-Wave 2)

| Gap | Target wave |
|-----|-------------|
| AI list-provider → search delegate for Drive/Todo/Calendar | Wave 3 |
| Analytics unified search | Future |
| Dashboard widget search | Wave 4 |
| Dedicated Platform Controller adoption health UI | Wave 5 |

**Last updated:** 2026-06-25
