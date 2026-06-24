# Business Operations — AI Retrieval Inventory

**Program:** AI Retrieval Adapter — Phase 2B-1  
**Date:** 2026-06-23  
**Status:** Adoption inventory — pre-wiring baseline  
**Purpose:** Map all Business Operations AI retrieval paths before adapter integration

---

## 1. Scope

Business Operations AI covers manager/operator workflows across HR, scheduling, workforce communications, and cross-module business workspace context.

---

## 2. AI entry points

### 2.1 Pipeline intent — `business_operations`

| Attribute | Value |
|-----------|-------|
| **Detector** | `inferPipelineIntents()` — `BUSINESS_OPERATIONS` regex |
| **Triggers** | `business kpi`, `our team`, `employees`, `workforce`, `company policy`, `quarterly results`, `org chart` |
| **Grounding** | `groundingRequired: true` |
| **Required sources** | `business_context`, `module_context` |
| **Optional sources** | `notifications_activity`, `calendar`, `vlink`, `graph_bundle` |
| **Twin path** | `DigitalLifeTwinCore` → `runPipelineGroundingRetrieval` |
| **Retrieval (pre-2B-1)** | Context providers only — no Unified Search |
| **Retrieval (post-2B-1)** | ✅ Adapter via `runPipelineRetrievalDiscovery` |

### 2.2 Context provider orchestration

| Module | Provider | Endpoint | Intents | Retrieval type |
|--------|----------|----------|---------|----------------|
| **HR** | `hr_overview` | `/api/hr/ai/context/overview` | business_operations | Rollup stats |
| **HR** | `employee_count` | `/api/hr/ai/context/headcount` | business_operations | Headcount |
| **HR** | `time_off_summary` | `/api/scheduling/ai/context/time-off` | business_operations | Time-off window |
| **Scheduling** | `scheduling_overview` | `/api/scheduling/ai/context/overview` | business_operations | Coverage stats |
| **Scheduling** | `coverage_status` | `/api/scheduling/ai/context/coverage` | business_operations | Coverage window |
| **Scheduling** | `scheduling_conflicts` | `/api/scheduling/ai/context/conflicts` | business_operations | Conflict list |
| **Workforce Comms** | `workforce_comms_overview` | `/api/workforce-comms/ai/context/overview` | business_operations | Comms rollup |
| **Workforce Comms** | `workforce_comms_reach` | `/api/workforce-comms/ai/context/reach` | business_operations | Reach metrics |
| **Todo** | `task_overview`, `upcoming_tasks` | module AI context | business_operations | Task summaries |
| **Calendar** | `today_events`, `upcoming_events` | module AI context | business_operations | Event windows |
| **Drive** | `recent_files` | module AI context | business_operations | Recency list |

**Search usage:** None on these provider paths.

### 2.3 Action execution paths

| Path | Service | Operation | Retrieval type |
|------|---------|-----------|----------------|
| **Staffing suggestions** | `schedulingAIActionService.aiSuggestShiftAssignments` | `suggest_assignments` | Direct scheduling service — not Search |
| **Schedule generation** | `schedulingAIActionService.aiGenerateSchedule` | `generate_schedule` | Philosophy engine |
| **Shift assignment** | `schedulingAIActionService.aiAssignShift` | `assign_shift` | Write action |

**Selected for Phase 2B-1:** Pipeline `business_operations` intent (operational planning) — **not** action executor staffing path (higher risk, write-adjacent).

### 2.4 Module context selection

| File | Role |
|------|------|
| `moduleContextProviderSelection.ts` | Routes HR/scheduling queries to `hr_overview`, `scheduling_overview`, `scheduling_conflicts` |
| `BUSINESS_SCOPED_MODULE_IDS` | `hr`, `scheduling` require business context |

### 2.5 Parallel retrieval (not replaced in 2B-1)

| Path | Mechanism | Duplication opportunity |
|------|-----------|------------------------|
| V_Link pipeline | `fetchVLinkPipelineContext` | Composes with adapter evidence |
| Graph bundle | `fetchGraphBundlePipelineContext` | Composes with adapter evidence |
| Member search | Unified Search `member` provider | **Now reachable via adapter** |
| Task search | Unified Search `todo` provider | **Now reachable via adapter** |
| Chat search | Unified Search `chat` provider | **Now reachable via adapter** |

---

## 3. Current vs target retrieval flow

### Pre-2B-1

```
User (business workspace)
  → Twin
  → pipelineGroundingRetrieval (business_operations)
  → ContextProviderOrchestrator
  → HR / Scheduling / WC providers (rollups)
  → Reasoning
```

### Post-2B-1 (additive)

```
User (business workspace)
  → Twin
  → pipelineGroundingRetrieval (business_operations)
  → ContextProviderOrchestrator (unchanged)
  → runPipelineRetrievalDiscovery (NEW)
  → executeGlobalSearch (member, todo, calendar, chat, drive, …)
  → Evidence + operationalProfile diagnostics
  → Reasoning (enriched)
```

---

## 4. Duplication register

| Entity discovery | Provider path | Search path | Adapter (2B-1) |
|------------------|---------------|-------------|----------------|
| Team members | `hr_overview` (stats) | `member` search | ✅ Search via adapter |
| Tasks | `task_overview` (counts) | `todo` search | ✅ Search via adapter |
| Events | `upcoming_events` (window) | `calendar` search | ✅ Search via adapter |
| Headcount | `employee_count` | — | Provider only (Tier C rollup) |
| Coverage | `coverage_status` | — | Provider only (Tier C rollup) |
| Shift assignments | `aiSuggestShiftAssignments` | — | Action path — deferred |

---

## 5. Integration decision (Phase 2B-1)

| Option | Risk | Value | Decision |
|--------|------|-------|----------|
| **Operational planning** (`business_operations` intent) | Low | High — cross-module entity discovery in business context | ✅ **Selected** |
| **Staffing recommendations** (action executor) | Medium | High — but write-adjacent | Deferred Phase 2B-2 |

---

**Last updated:** 2026-06-23
