# Local Discovery — AI Retrieval Inventory

**Program:** AI Retrieval Adapter — Phase 2B-3  
**Date:** 2026-06-23  
**Status:** Adoption inventory

---

## 1. Scope

Local Discovery helps users find nearby places, events, clubs, workshops, and local activities — combining **location grounding**, **Place module context**, **web search**, and (with Phase 2B-3) **Unified Search evidence** across platform modules.

---

## 2. AI entry points

### 2.1 Pipeline intent — `local_discovery`

| Attribute | Value |
|-----------|-------|
| **Detector** | `inferPipelineIntents()` — `matchesLocalDiscovery()` |
| **Triggers** | `near me`, `nearby`, `in my area`, local clubs/workshops/events + geo phrases |
| **Grounding** | `groundingRequired: true` |
| **Required sources** | `location` |
| **Optional sources** | `vssyl_place`, `web_search` |
| **Twin path** | `DigitalLifeTwinCore` → `runPipelineGroundingRetrieval` |
| **Place-specific grounding** | `vssyl_place` when `local_discovery` in grounding intents |
| **Retrieval (post-2B-3)** | Adapter when `AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED=true` |

### 2.2 Place module paths

| Path | Mechanism | Search delegate |
|------|-----------|-----------------|
| **Context provider** | `place_discoveries` | Curated — not query search |
| **AI tool** | `search_places` → `placeAIActionService.searchPlaces` | `searchListingsForUser` direct |
| **Unified Search** | `place` provider in registry | `searchListingsForUser` |
| **Retrieval Adapter** | `discover()` full fan-out | Via `executeGlobalSearch` (includes `place`) |

### 2.3 Other retrieval paths (unchanged)

| Path | Role |
|------|------|
| **IP geolocation** | `location` source — ambient context |
| **web_search tool** | External knowledge (optional grounding) |
| **V_Link pipeline** | Relationship signals when query references links |
| **ContextProviderOrchestrator** | Place `place_discoveries` provider |

### 2.4 Duplicate discovery logic

| Need | Path A | Path B | Path C | Adapter (2B-3) |
|------|--------|--------|--------|----------------|
| Find place listings | `search_places` tool | Unified Search `place` | — | Full Search fan-out |
| Curated discoveries | `place_discoveries` provider | — | — | Complementary |
| Local events | — | `calendar` search | — | Via adapter |
| Related platform context | — | — | — | drive, chat, todo, notes, vlink |

**Consolidation:** Documented only — no tool or provider migration in 2B-3.

---

## 3. Visibility services

| Entity | Service | Used by |
|--------|---------|---------|
| Place listings | `searchListingsForUser` | Search provider, `search_places` tool |
| Place context | `placeVisibilityService` | Context providers |
| Calendar events | `searchEvents` | Search provider |
| V_Link | `searchVLinksForUser` | Search provider |

---

## 4. Integration decision

| Option | Decision |
|--------|----------|
| Full Search fan-out via adapter | ✅ Selected — platform + place discovery |
| `moduleId: 'place'` only | ❌ Too narrow for strategic objective |
| Replace `search_places` tool | ❌ Out of scope — document only |

**Feature flag:** `AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED=true` (opt-in, default off).

---

## 5. Target flow

```
User: "yoga clubs near me"
  → local_discovery intent
  → location grounding + place_discoveries (unchanged)
  → runPipelineRetrievalDiscovery (when flag on)
  → executeGlobalSearch → place + calendar + vlink + …
  → discoveryProfile diagnostics
  → Reasoning
```

---

**Last updated:** 2026-06-23
