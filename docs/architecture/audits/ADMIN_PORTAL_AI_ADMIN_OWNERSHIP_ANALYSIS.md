# Admin Portal AI Administration Ownership Analysis

**Program:** Admin Portal Modernization — Stage 0D Planning  
**Date:** 2026-06-17  
**Input:** [AI Admin Reality Assessment](./ADMIN_PORTAL_AI_ADMIN_REALITY_ASSESSMENT.md)

---

## 1. Ownership principles

| Classification | Definition |
|----------------|------------|
| **Canonical** | Authoritative control-plane surface; other surfaces must converge here or document satellite status |
| **Satellite** | Legitimate adjunct mount/page with distinct contract; documented in auth matrix; not duplicated elsewhere |
| **Legacy** | Superseded scaffold; scheduled retirement; must not receive new features |
| **Debug** | Operator diagnostics; env-gated or merged into canonical diagnostics |
| **Retire** | Remove HTTP surface after migration window; CLI/runbook if ops still needed |

**Platform vs tenant:** `/api/business-ai` is **tenant business admin**, not platform AI control plane — documented for boundary only.

---

## 2. Domain ownership matrix

### 2.1 AI Pipeline (canonical control plane)

| Capability | Owner | Route prefix | UI | Classification |
|------------|-------|--------------|-----|----------------|
| **Pipeline catalog** | Admin Portal — AI Pipeline | `GET /ai-pipeline/catalog` | Hub + registry sections | **Canonical** |
| **Registry graph / validation** | Admin Portal — AI Pipeline | `registry/graph`, `registry/validate` | Registry panels | **Canonical** |
| **Intent policies** | Admin Portal — AI Pipeline | `policies/intents/*` | `/ai-pipeline/intents` | **Canonical** |
| **Grounding policies** | Admin Portal — AI Pipeline | `policies/grounding/*` | `/ai-pipeline/grounding` | **Canonical** |
| **Source policies** | Admin Portal — AI Pipeline | `policies/sources/*` | `/ai-pipeline/sources` | **Canonical** |
| **Tool policies** | Admin Portal — AI Pipeline | `policies/tools/*` | `/ai-pipeline/tools` | **Canonical** |
| **Enforcement settings** | Admin Portal — AI Pipeline | `policies/settings` | `PipelineEnforcementSettings` | **Canonical** |
| **Policy audit** | Admin Portal — AI Pipeline | `GET audit` | `/ai-pipeline/audit` | **Canonical** |
| **Quality stats** | Admin Portal — AI Pipeline | `GET quality/stats` | `/ai-pipeline/quality` | **Canonical** |
| **Diagnostics / traces** | Admin Portal — AI Pipeline | `diagnostics/*` | `/ai-pipeline/diagnostics` | **Canonical** |
| **Test lab** | Admin Portal — AI Pipeline | `POST test-lab` | `/ai-pipeline/test-lab` | **Canonical** (ops-gated UI recommended) |
| **Retention / export** | Admin Portal — AI Pipeline | `retention/*`, `diagnostics/export` | `/ai-pipeline/compliance` | **Canonical** |
| **Suggestion evaluation** | Admin Portal — AI Pipeline | `suggestions/metrics`, `suggestions/dry-run` | Test lab / hub panels | **Canonical** |
| **Context provider health** | Admin Portal — AI Pipeline | `context-providers/health` | `ContextProviderHealthPanel` | **Canonical** |

**Service owner:** `server/src/ai/pipeline/*` — not `adminService.ts` monolith.

---

### 2.2 Legacy AI Admin — centralized-ai

| Capability | Current owner | Classification | Target owner |
|------------|---------------|----------------|--------------|
| Entire `/api/centralized-ai` router (97 handlers) | Legacy scaffold (`ai-centralized.ts`) | **Legacy → Retire** | None — 410 or remove |
| Learning patterns / insights (mock) | centralized-ai | **Legacy** | User `/api/ai/learning/*` or remove admin UI |
| Analytics dashboards (mock) | centralized-ai | **Legacy** | Platform analytics (0C) or remove |
| Model / AutoML / predictive (mock) | centralized-ai | **Legacy** | **Retire** — not product roadmap |
| Security/compliance mock reports | centralized-ai | **Legacy** | Admin Portal security page (existing) |
| Scheduler triggers | centralized-ai | **Legacy** | **Retire** or CLI |
| `ai-learning` page | Admin Portal UI | **Legacy** | **Retire** or redirect to pipeline + real learning APIs |
| `CentralizedLearningEngine` | `server/src/ai/learning/` | **Candidate evaluate** | Keep only if wired to real user learning path — not centralized-ai HTTP |

**Disposition:** **AP-F-008** — retire >80% handlers; expand fence; remove client calls from `adminApiService` and `ai-learning` page.

---

### 2.3 Business AI

| Capability | Owner | Classification | Notes |
|------------|-------|----------------|-------|
| Global business AI dashboard | `/api/admin/business-ai` + `/admin-portal/business-ai` | **Satellite** | Platform-wide view of tenant business AI |
| Per-business AI patterns | `GET /patterns` | **Satellite** | Distinct from pipeline policy registry |
| Centralized learning toggle | `enable/disable-centralized-learning` | **Legacy coupling** | **Retire toggles** when centralized-ai retires |
| Business AI analytics | `GET /:id/analytics` | **Satellite** | Clarify vs platform analytics (0C) |

**Not canonical pipeline** — business-scoped AI operations remain satellite with documented boundary.

---

### 2.4 AI Provider Admin

| Capability | Owner | Classification | Notes |
|------------|-------|----------------|-------|
| Usage (OpenAI, Anthropic, combined) | `/api/admin/ai-providers` | **Satellite** | Real provider integrations |
| Expenses / billing history | Same mount | **Satellite** | Distinct auth middleware (documented exception) |
| Provider UI | `ai-system` hub tab + `ProviderUsageView` | **Satellite** | **Target:** linked from pipeline hub or dedicated provider sub-page |

**Disposition:** Keep mount; improve discoverability under AI control plane UX (AP-AI-01, AP-AI-05).

---

### 2.5 AI Context Debug

| Capability | Owner | Classification | Notes |
|------------|-------|----------------|-------|
| User/session context inspect | `/api/ai-context-debug` | **Debug satellite** | Overlaps pipeline trace forensics |
| Cross-module context map | Same | **Debug satellite** | UI in `ai-context` page |
| Context assemble / validate | Same | **Debug satellite** | Partial overlap with pipeline evidence bundle |

**Disposition:** **AP-F-029** — merge into pipeline diagnostics UX or gate + redirect; retire duplicate page tabs.

---

### 2.6 Module AI registry (governance adjacent)

| Capability | Owner | Classification |
|------------|-------|----------------|
| Module AI registry, sync, performance | `/api/admin/modules/ai/*` | **Satellite** (governance) |
| UI surface | `/admin-portal/modules` AI tab | **Satellite** |

**Not part of 0D pipeline consolidation** — document boundary; link from AI control plane hub.

---

### 2.7 AI System hub (transitional)

| Surface | Classification | Target |
|---------|----------------|--------|
| `/admin-portal/ai-system` | **Transitional hub** | **Nav-only launcher** after 0D-F — remove embedded charts/provider duplication |

---

## 3. Ownership conflicts (must resolve in 0D)

| Conflict | Surfaces | Resolution |
|----------|----------|------------|
| **Diagnostics dual path** | ai-pipeline/diagnostics vs ai-context-debug vs ai-context page | Canonical: pipeline; retire debug mount UI path |
| **Learning admin dual path** | ai-learning + centralized-ai vs `/api/ai/learning/*` | Retire centralized-ai; learning page real-or-empty |
| **Provider ops location** | ai-system embed vs satellite mount | Satellite API; canonical **link** from pipeline hub |
| **Business learning toggle** | admin/business-ai → centralized-ai | Remove when legacy retires |
| **Operator navigation** | ai-system lists ai-learning, ai-context, pipeline | Consolidate under pipeline-centric IA |

---

## 4. Classification summary

| Classification | Surfaces | Handler/page count |
|----------------|----------|-------------------|
| **Canonical** | `/api/admin-portal/ai-pipeline/*`, `/admin-portal/ai-pipeline/**` | 45 API / 10 pages |
| **Satellite** | ai-providers, admin/business-ai, admin/modules/ai | 22 API / 2 pages |
| **Legacy** | centralized-ai, ai-learning page, adminApiService centralized helpers | 97 API / 1 page |
| **Debug** | ai-context-debug, ai-context page, test-lab (partial) | 6 API / 2 pages |
| **Retire** | centralized-ai body (>80%), ai-learning stubs, ai-context duplicate UI | TBD in 0D-B/E |
| **Transitional** | ai-system hub | 1 page → nav-only |

---

## 5. Finding mapping

| Finding | Ownership gap |
|---------|-----------------|
| **AP-F-008** | centralized-ai classified legacy but still canonical by handler count |
| **AP-F-029** | ai-context-debug ownership overlaps pipeline diagnostics |
| **AP-F-030** | Canonical pipeline lacks HTTP test ownership evidence |

---

**Analysis close.** Planning only. Next: [Control Plane Architecture](./ADMIN_PORTAL_AI_CONTROL_PLANE_ARCHITECTURE.md).
