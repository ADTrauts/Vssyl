# Project Assistant — Retrieval Adoption

**Program:** AI Retrieval Adapter — Phase 2B-2  
**Date:** 2026-06-23  
**Status:** Adoption complete  
**Integration path:** `project_assistant` pipeline intent

---

## 1. Integration summary

| Attribute | Value |
|-----------|-------|
| **Consumer intent** | `project_assistant` (new pipeline intent) |
| **Entry point** | `runPipelineRetrievalDiscovery` |
| **Priority** | `workflow_action` > `business_operations` > `project_assistant` > `planning` |
| **Limit** | 10 evidence items |
| **Feature flag** | `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true` (**opt-in**, default off) |

---

## 2. Enabling retrieval

```bash
AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true
```

Global opt-out still applies: `AI_RETRIEVAL_DISCOVERY_ENABLED=false`

---

## 3. Cross-module evidence review

### Expected module contribution

| Module | Evidence role | Typical project query hit |
|--------|---------------|---------------------------|
| **Drive** | Project files, briefs, docs | High |
| **Todo** | Project tasks | High |
| **Chat** | Team discussions | Medium–High |
| **Calendar** | Project meetings | Medium |
| **Notes** | Project notes | Medium |
| **V_Link** | Linked entities | Low–Medium (query-dependent) |
| **Place** | Venue-related projects | Low |
| **Member** | Team members (business) | Medium (business context) |
| **Dashboard** | Workspace artifacts | Low |

### Measurement findings (design-level)

| Metric | Observation |
|--------|-------------|
| **Evidence count** | Up to 10 per request; broad queries return more modules |
| **Module contribution** | 2–5 modules typical for cross-module project queries |
| **Retrieval usefulness** | High for "find everything about X" — fills gap left by recency-only providers |
| **retrievalSourceDiversity** | Distinct module count tracked in diagnostics |
| **Gaps** | No project entity ID — query substring only; semantic linking deferred |

### Provider participation

Full Search fan-out (9 providers). Evidence distribution depends on query terms matching entity titles/descriptions across modules.

---

## 4. Diagnostics

### Standard fields

All `AIRetrievalDiagnostics` fields including `modulesContributingEvidence`, `providerParticipation`, `retrievalSourceCounts`.

### Project Assistant fields

| Field | Location | Value |
|-------|----------|-------|
| `consumerDomain` | Diagnostics | `'project_assistant'` |
| `retrievalSourceDiversity` | Diagnostics | Count of distinct contributing modules |
| `projectProfile` | Context patch | Domain, modules, diversity, scope, utilization |

```typescript
projectProfile: {
  domain: 'project_assistant';
  modulesContributing: string[];
  retrievalSourceDiversity: number;
  contextScope?: SearchContextScope;
  retrievalDurationMs: number;
  evidenceUtilization: { evidenceCount: number; providerCount: number };
}
```

---

## 5. Example queries

| Query | Intent | Expected modules |
|-------|--------|------------------|
| "Help me understand everything related to this project" | project_assistant | drive, todo, chat, notes |
| "What is the project status for the launch?" | project_assistant | drive, todo, calendar |
| "All files and tasks for this project" | project_assistant | drive, todo |
| "What's happening with my project?" | project_assistant | multi-module fan-out |

---

## 6. SC-M4 impact (assessment only)

| Question | Answer |
|----------|--------|
| Material advance? | **Yes** — fourth consumer; first explicit cross-module discovery intent |
| SC-M4 closed? | **No** |
| Recommendation | Strongest SC-M4 progress evidence to date; council review warranted; do not self-certify Search |

---

**Last updated:** 2026-06-23
