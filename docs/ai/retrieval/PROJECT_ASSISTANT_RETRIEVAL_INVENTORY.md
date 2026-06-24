# Project Assistant — AI Retrieval Inventory

**Program:** AI Retrieval Adapter — Phase 2B-2  
**Date:** 2026-06-23  
**Status:** Adoption inventory  
**Purpose:** Map Project Assistant retrieval paths before adapter integration

---

## 1. Scope

Project Assistant represents **cross-module contextual intelligence** — helping users understand everything related to a project across Drive, Chat, Calendar, Todo, Notes, V_Link, and related modules.

There is no standalone "Project Assistant" product module. The workflow is **intent-driven** via pipeline inference + context orchestration.

---

## 2. AI entry points

### 2.1 Pipeline intent — `project_assistant` (new Phase 2B-2)

| Attribute | Value |
|-----------|-------|
| **Detector** | `inferPipelineIntents()` — `PROJECT_ASSISTANT` regex |
| **Triggers** | `this project`, `project status`, `everything related to this project`, `help me understand this project`, `all files for this project`, etc. |
| **Grounding** | `groundingRequired: false` |
| **Optional sources** | `module_context`, `drive_files`, `calendar`, `vlink`, `graph_bundle`, `notifications_activity` |
| **Twin path** | `DigitalLifeTwinCore` → `runPipelineGroundingRetrieval` |
| **Retrieval (post-2B-2)** | Adapter when `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true` |

### 2.2 Overlapping intents (not replaced)

| Intent | Overlap | Resolution |
|--------|---------|------------|
| `planning` | "plan my project roadmap" | `project_assistant` wins when project phrase matches |
| `business_operations` | Business project in workspace | `business_operations` wins (higher priority) |
| `workflow_action` | "create a todo for project" | `workflow_action` wins (higher priority) |
| `research` | "look up project requirements" | Separate intent; adapter not triggered |

### 2.3 Context provider orchestration

| Module | Providers | Retrieval type | Search overlap |
|--------|-----------|----------------|----------------|
| **Drive** | `recent_files`, `storage_overview` | Recency / stats | ✅ `drive` search |
| **Chat** | `recent_conversations` | Participant recent | ✅ `chat` search |
| **Calendar** | `today_events`, `upcoming_events` | Time windows | ✅ `calendar` search |
| **Todo** | `upcoming_tasks`, `task_overview` | Lists / stats | ✅ `todo` search |
| **Notes** | `recent_notes`, `pinned_notes` | Recency | ✅ `notes` search |
| **V_Link** | pipeline + `recent_vlinks` | Relationship signals | ✅ `vlink` search |
| **Place** | `place_discoveries` | Curated | ✅ `place` search |
| **Member** | via business context | — | ✅ `member` search |
| **Dashboard** | dashboard provider | Owner scope | ✅ `dashboard` search |

**Pre-2B-2 Search usage:** None on provider paths.

### 2.4 V_Link and graph bundle

| Path | Role in project context |
|------|-------------------------|
| `fetchVLinkPipelineContext` | Confirmed cross-module links |
| `fetchGraphBundlePipelineContext` | Relationship bundle hydration |
| **Adapter** | Query-shaped entity discovery across modules |

These **compose** — adapter does not replace V_Link/graph signals.

### 2.5 Duplicate discovery logic

| Discovery need | Current path | Adapter path (2B-2) |
|----------------|--------------|---------------------|
| Find project file by name | None unified | `drive` via Search |
| Find project tasks | `upcoming_tasks` list | `todo` via Search |
| Find project messages | `recent_conversations` | `chat` via Search |
| Find project events | `upcoming_events` | `calendar` via Search |
| Find linked entities | V_Link pipeline | `vlink` via Search + pipeline |
| Project notes | `recent_notes` | `notes` via Search |

---

## 3. Integration decision

| Option | Risk | Value | Decision |
|--------|------|-------|----------|
| **Pipeline `project_assistant` intent** | Low | High — full Search fan-out | ✅ **Selected** |
| Dedicated project entity model | High | Future | Out of scope |
| Tool-based discovery | Medium | Medium | Deferred |

**Feature flag:** Opt-in `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true` (default off for safe rollout).

---

## 4. Target flow

```
User: "Help me understand everything related to this project"
  → inferPipelineIntents → project_assistant
  → pipelineGroundingRetrieval
  → ContextProviderOrchestrator (unchanged)
  → runPipelineRetrievalDiscovery (when flag enabled)
  → executeGlobalSearch → cross-module evidence
  → projectProfile diagnostics
  → Reasoning
```

---

**Last updated:** 2026-06-23
