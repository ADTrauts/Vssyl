# AI Pipeline Review

**Program:** AI Knowledge Reference Program — Phase 0A  
**Date:** 2026-07-05  
**Scope:** Audit of existing Operations Platform AI Pipeline — not a rebuild proposal

---

## 1. Page inventory

| Route | Component | Primary purpose |
|-------|-----------|---------------|
| `/admin-portal/ai-pipeline` | `PipelineOperationsHub` | Operator overview — health, activity, tool directory |
| `.../diagnostics` | Diagnostics page + `PipelineTraceTable` | Per-response traces, evidence, issues |
| `.../test-lab` | `AITestLabPanel` | Dry-run twin without side effects |
| `.../intents` | Intent registry + `PipelineIntentRegistrySection` | Intent catalog, grounding-required flags |
| `.../grounding` | `PipelinePolicyEditors` (grounding) | Required/optional sources per intent |
| `.../sources` | Context source catalog | `wiredInTwin`, priority, module mapping |
| `.../tools` | Tool policy editor | Tool availability, risk, grounding requirements |
| `.../quality` | `PipelineQualityDashboard` | Weak phrases, enforcement, at-risk trends |
| `.../audit` | `PipelinePolicyAuditTable` | Admin policy change history |
| `.../compliance` | `PipelineCompliancePanel` | Retention, export, purge |

**Hub embeds:** `ProviderGovernancePanel` at `#provider-governance`

---

## 2. Hub sections (main page)

| Section | Components | Knowledge relevance |
|---------|------------|---------------------|
| Header | Title, enforcement badge, refresh | Pipeline mode visibility |
| Pipeline health | `PipelineHealthMetrics` | Aggregate quality signals |
| Live activity | `PipelineLiveActivityFeed` | Recent traces |
| At-risk trends | `PipelineAtRiskTrends` | Grounding/quality drift |
| Tool directory | `PipelineHubToolSections` | Navigation to Configure/Observe/Govern |
| Provider governance | `ProviderGovernancePanel` | LLM provider usage — not user knowledge |

---

## 3. Capability matrix

| Capability | Location | Maturity |
|------------|----------|----------|
| Intent management | intents page | Production |
| Grounding rules | grounding page | Production |
| Context source catalog | sources page | Production |
| Tool policies | tools page | Production |
| Quality enforcement | quality page | Production |
| Policy audit trail | audit page | Production |
| Compliance export | compliance page | Production |
| Response diagnostics | diagnostics page | Production |
| Trace evidence viewer | `PipelineEvidenceViewer`, `PipelineTraceDetail` | Production |
| Test lab dry-run | test-lab | Production |
| Provider admin APIs | Provider governance | Production |
| Context provider health | `ContextProviderHealthPanel` (in test-lab/sources context) | Production |
| Context density debug | `ContextDensityPanel` | Dev/operator |
| User memory inspection | — | **Not present** (correct default) |
| Knowledge health summary | Partial via health metrics | **Gap — label only in Phase 2B** |

---

## 4. Navigation assessment

| Aspect | Finding |
|--------|---------|
| Sidebar items | 2 + anchor (Pipeline, Diagnostics, Providers) |
| Hub as wayfinder | ✅ Effective — Observe/Configure/Govern matches mental model |
| Deep links | Platform Programs link to subpages |
| Legacy redirects | `ai-system`, `ai-learning` → pipeline |
| Breadcrumbs | `PipelineSubpageShell` on subpages |

**Not overloaded:** Subpages are **already split**. Hub is ~90 lines + components — appropriate overview.

---

## 5. What belongs together?

| Group | Rationale | Current placement |
|-------|-----------|-------------------|
| Observe (diagnostics, test lab) | Answer "what happened?" | ✅ Hub section + routes |
| Configure (intents, grounding, sources, tools) | Answer "what rules apply?" | ✅ Hub section + routes |
| Govern (quality, audit, compliance) | Answer "is it safe/compliant?" | ✅ Hub section + routes |
| Providers | External dependency | ✅ Hub anchor + nav |
| **Knowledge controls** | User/business taught data | ❌ **Not in pipeline** — belongs in `/ai` and Business AI |
| **Memory admin** | User facts | ❌ Should not be in pipeline (privacy) |

**Conclusion:** Pipeline correctly holds **governance and observability**, not user teach surfaces.

---

## 6. What is overloaded?

| Item | Assessment |
|------|------------|
| Main hub page | **Not overloaded** — summary + links |
| Diagnostics page | Moderate complexity — appropriate for audience |
| Sources page | Dense — acceptable for operators |
| Policy editors | Multiple policy types — unified editor pattern helps |

**Do not split diagnostics further** unless operator research shows confusion.

---

## 7. What should become its own section?

| Candidate | Recommendation |
|-----------|----------------|
| Test Lab | ✅ Already own route — optional sidebar item |
| Provider Governance | ✅ Already nav item |
| **Knowledge Health** | **New label** for aggregate of health + at-risk + provider failures — Phase 2B panel on hub |
| **Prompt Lab** | Rename Test Lab only — same page |
| Memory / Knowledge Explorer | **Defer** — support-only tool in Phase 2B, not pipeline core |

---

## 8. What should remain unified?

| Unified surface | Why |
|-----------------|-----|
| **Pipeline hub** | Single operational front door |
| **Diagnostics + evidence** | Trace without evidence is incomplete |
| **Intent + grounding + sources** | Tight coupling — but separate pages OK with hub grouping |
| **Quality + enforcement** | Same operator persona |

---

## 9. Knowledge controls in pipeline?

| Control type | In pipeline today? | Should be? |
|--------------|-------------------|------------|
| Prompt overrides (user) | No | No — user `/ai` |
| Memory facts | No | No |
| Pipeline system prompts | Code only | No UI (correct) |
| Grounding requirements | Yes | Yes |
| Source wiring | Yes | Yes |
| Weak phrase detection | Yes | Yes |
| Provider selection | User `/ai` + env | Provider governance for ops |

---

## 10. Gaps for operator knowledge mission

| Gap | Mitigation (existing arch) |
|-----|---------------------------|
| See what a user taught | Support workflow + future read-only API aggregate |
| Correlate trace → user memory | Diagnostics has userId — link to support context |
| Source not wired | Sources page `wiredInTwin` vs Test Lab health |
| Stale grounding rules | Quality at-risk trends |

---

## 11. Final recommendation

| Question | Answer |
|----------|--------|
| Remain single page? | **No** — already multi-page; hub stays as overview |
| Replace AI Pipeline? | **No** |
| Evolve into AI section? | **Yes** — sidebar grouping + optional Knowledge Health panel |
| Split more? | **No** — current Observe/Configure/Govern is sufficient |

**Pipeline review maturity:** Operator tooling **~85%**; knowledge-specific operator views **~40%**.
