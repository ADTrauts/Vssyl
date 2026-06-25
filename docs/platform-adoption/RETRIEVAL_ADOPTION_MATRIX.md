# Retrieval Adoption Matrix

**Program:** Platform Capability Adoption — Wave 3  
**Date:** 2026-06-25  
**Status:** Post-Wave 3 baseline

---

## 1. AI Retrieval by module (query-driven path)

| Module | Search provider | Auto in `discover()` | Module-specific retrieval adapter |
|--------|-----------------|----------------------|--------------------------------|
| Drive | ✅ | ✅ | ❌ None |
| Calendar | ✅ | ✅ | ❌ |
| Todo | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ❌ |
| Notebook | ✅ | ✅ | ❌ |
| Notes | ✅ | ✅ | ❌ |
| Place | ✅ | ✅ | ❌ |
| HR | ✅ | ✅ | ❌ |
| Scheduling | ✅ | ✅ | ❌ |
| Workforce Comms | ✅ | ✅ | ❌ |
| V_Link | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ❌ |
| Member | ✅ | ✅ | ❌ |
| Partner modules | Delegate | ✅ when enabled | ❌ |

---

## 2. Consumer intent × capability

| Consumer intent | Unified Search | Context patch | Graph bridge | Grounding reconcile |
|---------------|----------------|---------------|--------------|---------------------|
| workflow_action | ✅ | ✅ | Flag | Flag |
| business_operations | ✅ | ✅ operationalProfile | Flag | Flag |
| project_assistant | ✅ | ✅ projectProfile | Flag | Flag |
| local_discovery | ✅ | ✅ discoveryProfile | Flag | Flag |
| planning | ✅ | ✅ | Flag | Flag |
| general_discovery | ✅ | ✅ queryNativeProfile | Flag | Flag |
| scheduling (planned) | ✅ via search | — | — | — |

**Flag** = `CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED` / `CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED`

---

## 3. Evidence source classification

| Tier | Examples | Diagnostic bucket |
|------|----------|-------------------|
| Recency | `recent_files`, `upcoming_events`, `place_discoveries` | `recencyContext` |
| Query-native search | `unified_search`, `ai_retrieval_adapter` | `searchEvidence` |
| Graph | `graph_bundle`, `retrieval_inference_bridge`, `vlink` | `graphInference` |

---

## 4. Remaining gaps

| Gap | Notes |
|-----|-------|
| List-only AI context providers | Still used for non-query intents; complementary to search |
| `scheduling` named consumer | Planned — covered by `general_discovery` find patterns today |
| Partner delegate coverage | Depends on marketplace enablement |

**Last updated:** 2026-06-25
