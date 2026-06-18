# Admin Portal AI Administration Reality Assessment

**Program:** Admin Portal Modernization — Stage 0D Planning  
**Date:** 2026-06-17  
**Type:** Re-verified inventory — planning only; no code changes  
**Authority:** Repository grep + file inspection (not historical audit counts)

**Related:** [Ownership Analysis](./ADMIN_PORTAL_AI_ADMIN_OWNERSHIP_ANALYSIS.md) · [Control Plane Architecture](./ADMIN_PORTAL_AI_CONTROL_PLANE_ARCHITECTURE.md) · [Prior boundary review](./ADMIN_PORTAL_AI_AND_ANALYTICS_BOUNDARY_REVIEW.md)

---

## 1. Executive summary

AI administration is **fragmented across six API mount families** and **14 Admin Portal pages**. The **canonical modern control plane** is `/api/admin-portal/ai-pipeline/*` (45 handlers, 1,322 LOC route file, rich pipeline services). The **largest surface** is legacy `/api/centralized-ai` (97 handlers, 3,491 LOC, predominantly mock/scaffold). Operator UX splits between a mature **AI Pipeline sub-shell** (10 pages, 32 components) and **legacy hub pages** (ai-system, ai-learning, ai-context) that duplicate or misrepresent capability.

| Metric | Count (verified 2026-06-17) |
|--------|----------------------------|
| **Platform AI admin API handlers** | **170** (excludes tenant `/api/business-ai`) |
| **Canonical pipeline handlers** | **45** |
| **Legacy centralized-ai handlers** | **97** |
| **Admin Portal AI pages** | **14** |
| **AI Pipeline sub-pages** | **10** (hub + 9) |
| **admin-portal AI components** | **43** (32 pipeline-specific) |
| **Pipeline unit tests (server)** | **11** files under `server/src/ai/pipeline/__tests__` |
| **AI pipeline HTTP integration tests** | **0** |
| **centralized-ai HTTP tests** | **1** (admin fence only) |

---

## 2. API route inventory

### 2.1 Mount summary

| Mount prefix | Route file | Handlers | LOC | Mount auth | Maturity |
|--------------|------------|----------|-----|------------|----------|
| `/api/admin-portal/ai-pipeline/*` | `adminPortalRoutes.aiPipeline.ts` | **45** | 1,322 | Per-route JWT + `requireAdmin` | **Canonical** |
| `/api/centralized-ai` | `ai-centralized.ts` | **97** | 3,491 | Mount JWT + `requireAdmin` + deprecated fence | **Legacy / mock scaffold** |
| `/api/admin/ai-providers` | `ai-provider-usage.ts` | **8** | 397 | Per-route JWT + async local `requireAdmin` | **Satellite** |
| `/api/ai-context-debug` | `ai-context-debug.ts` | **6** | 677 | Per-route JWT + `requireRole('ADMIN')` | **Debug satellite** |
| `/api/admin/business-ai` | `adminBusinessAI.ts` | **5** | 384 | Router JWT; per-handler inline ADMIN | **Satellite** |
| `/api/admin/modules/ai/*` | `moduleAIContext.ts` | **9** | (shared file) | JWT + `requireRole('ADMIN')` | **Governance satellite** |
| `/api/business-ai` | `businessAI.ts` | **9** | — | Business-scoped (not platform admin) | **Out of scope** |

**Platform AI admin total:** 45 + 97 + 8 + 6 + 5 + 9 = **170 handlers**

### 2.2 Canonical AI Pipeline routes (45 handlers)

Registered in `registerAdminPortalAiPipelineRoutes()` — all under `/api/admin-portal`.

| Domain | Routes (representative) | Count |
|--------|-------------------------|------:|
| **Catalog / registry** | `GET catalog`, `GET registry/graph`, `POST registry/validate` | 3 |
| **Intent policies** | `POST policies/intents`, CRUD/archive/enable/disable/duplicate `policies/intents/:id` | 10 |
| **Grounding policies** | `POST policies/grounding`, CRUD variants `policies/grounding/:id` | 9 |
| **Source policies** | `POST policies/sources`, CRUD variants `policies/sources/:id` | 9 |
| **Tool policies** | `POST policies/tools`, CRUD variants `policies/tools/:id` | 9 |
| **Settings** | `PUT policies/settings` | 1 |
| **Audit / quality** | `GET audit`, `GET quality/stats` | 2 |
| **Diagnostics** | `GET diagnostics`, `GET diagnostics/:traceId`, `GET …/evidence`, `POST diagnostics/export` | 4 |
| **Test lab** | `POST test-lab` | 1 |
| **Context providers** | `POST context-providers/health` | 1 |
| **Retention / compliance** | `GET/PUT retention`, `POST retention/purge` | 3 |
| **Suggestions / evaluation** | `GET suggestions/metrics`, `POST suggestions/dry-run` | 2 |

**Backend services (real implementation):** `server/src/ai/pipeline/*` — 22 implementation files + 11 unit test files.

### 2.3 Legacy centralized-ai routes (97 handlers)

Mount: `server/src/index.ts` L910–916 — `authenticateJWT`, `requireAdmin`, `centralizedAiDeprecatedMiddleware`.

| Property | Value |
|----------|-------|
| Per-route `authenticateJWT` in handler registration | **5** of 97 |
| Handlers relying on mount-level auth only | **92** |
| Explicit `mock` / `Mock` comments in file | **6** |
| Deprecated routes returning 410 (fence) | **2 patterns** (`/learning/event`, `/models/*`) |

**Scaffold domain clusters** (handler counts approximate from route grep):

| Cluster | Example paths | Est. handlers | Data quality |
|---------|---------------|---------------|--------------|
| Learning / patterns | `/patterns`, `/insights`, `/continuous-learning` | ~12 | Mixed; some Prisma via `CentralizedLearningEngine` |
| Analytics / dashboards | `/analytics/*`, `/business/*` | ~25 | Predominantly stub responses |
| Predictive / AutoML | `/predictive/*`, `/automl/*`, `/models/*` | ~20 | Mock; `/models/*` partially 410 |
| Security / compliance | `/security/*` | ~12 | Mock comments L751, L828, L870 |
| Workflows / decision support | `/workflows/*`, `/decision-support` | ~10 | Scaffold |
| Scheduler / notifications / SSO | `/scheduler/*`, `/notifications/*`, `/sso/*` | ~15 | Mock scheduler L430 |
| A/B testing | `/ab-testing/*` | ~4 | Scaffold |
| Performance / health | `/performance/*`, `/health` | ~4 | Mock L669, L709 |

**Risk:** Large admin-gated mount presents **false maturity** — 97 paths appear live while most return scaffold/mock data.

### 2.4 AI Provider admin (`/api/admin/ai-providers`) — 8 handlers

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/usage/combined` | Combined OpenAI + Anthropic usage |
| GET | `/usage/openai` | OpenAI usage |
| GET | `/usage/anthropic` | Anthropic usage |
| GET | `/expenses/openai` | OpenAI billing |
| GET | `/expenses/anthropic` | Anthropic billing |
| GET | `/expenses/providers` | Multi-provider expenses |
| GET | `/history/usage` | Usage history |
| GET | `/history/expenses` | Expense history |

**Services:** `server/src/services/aiProviderServices/*` (6 files) — real provider API integrations.

**UI:** `ProviderUsageView.tsx`, `ProviderExpensesView.tsx`; embedded in `ai-system/page.tsx` (not standalone page).

### 2.5 AI Context Debug (`/api/ai-context-debug`) — 6 handlers

| Method | Path |
|--------|------|
| GET | `/user/:userId` |
| GET | `/session/:sessionId` |
| POST | `/validate` |
| GET | `/cross-module/:userId` |
| GET | `/stats` |
| POST | `/assemble` |

**UI:** `/admin-portal/ai-context` — 5 tabs (UserContextInspector, AIReasoningViewer, etc.) calling debug API.

### 2.6 Business AI admin (`/api/admin/business-ai`) — 5 handlers

| Method | Path |
|--------|------|
| GET | `/global` |
| GET | `/patterns` |
| POST | `/:businessAIId/enable-centralized-learning` |
| POST | `/:businessAIId/disable-centralized-learning` |
| GET | `/:businessAIId/analytics` |

**UI:** `/admin-portal/business-ai` → `BusinessAIGlobalDashboard.tsx`

**Note:** Still references "centralized-learning" toggle — coupling to legacy learning scaffold.

### 2.7 Module AI registry (`/api/admin/modules/ai/*`) — 9 handlers

Governance surface for module AI context registration (registry, status, performance, sync). Mounted at `/api` via `moduleAIContext.ts`. **Not AI Pipeline** — platform module certification adjacent.

---

## 3. Frontend page inventory

### 3.1 Admin Portal AI pages (14)

| Path | File | Primary API | Maturity |
|------|------|-------------|----------|
| `/admin-portal/ai-pipeline` | `ai-pipeline/page.tsx` | `/api/admin-portal/ai-pipeline/*` | **Canonical hub** |
| `/admin-portal/ai-pipeline/intents` | `intents/page.tsx` | Pipeline policies | Canonical |
| `/admin-portal/ai-pipeline/grounding` | `grounding/page.tsx` | Pipeline policies | Canonical |
| `/admin-portal/ai-pipeline/sources` | `sources/page.tsx` | Pipeline policies | Canonical |
| `/admin-portal/ai-pipeline/tools` | `tools/page.tsx` | Pipeline policies | Canonical |
| `/admin-portal/ai-pipeline/diagnostics` | `diagnostics/page.tsx` | Pipeline diagnostics | Canonical |
| `/admin-portal/ai-pipeline/test-lab` | `test-lab/page.tsx` | `POST test-lab` | Canonical / debug |
| `/admin-portal/ai-pipeline/audit` | `audit/page.tsx` | `GET audit` | Canonical |
| `/admin-portal/ai-pipeline/quality` | `quality/page.tsx` | `GET quality/stats` | Canonical |
| `/admin-portal/ai-pipeline/compliance` | `compliance/page.tsx` | Retention/export | Canonical |
| `/admin-portal/ai-system` | `ai-system/page.tsx` | Aggregated + provider APIs + hub links | **Partial hub** |
| `/admin-portal/ai-learning` | `ai-learning/page.tsx` | `/api/centralized-ai/*` | **Legacy / stub** |
| `/admin-portal/ai-context` | `ai-context/page.tsx` | `/api/ai-context-debug/*` | **Debug duplicate** |
| `/admin-portal/business-ai` | `business-ai/page.tsx` | `/api/admin/business-ai/*` | Satellite |

### 3.2 Navigation exposure

`layout.tsx` AI section lists only:

- `/admin-portal/ai-system`
- `/admin-portal/ai-pipeline`

**Not in primary nav:** ai-learning, ai-context, business-ai (reachable via ai-system hub links).

### 3.3 AI Pipeline UI stack

| Artifact | Count |
|----------|------:|
| Pipeline page files | 10 |
| Pipeline components (`components/admin-portal/ai-pipeline/**`) | 32 |
| Shared shell | `PipelineSubpageShell.tsx`, `PipelineOperationsHub.tsx` |
| Client types | `web/src/types/adminAiPipeline.ts` |
| Client API methods | ~35 in `adminApiService.ts` (`/ai-pipeline/*`) |

**Strength:** Only AI admin area with dedicated sub-shell, policy editors, trace forensics, and compliance export.

### 3.4 Legacy / stub UI evidence

**ai-learning/page.tsx:**

- Direct `fetch('/api/centralized-ai/...')` for scheduler, analytics, consent (L234–340 area)
- **"Data coming soon"** on stat cards (L978, L989, L1000, L1011)
- **"Module Analytics Coming Soon"** (L1044 area)

**ai-system/page.tsx:**

- Embeds `ProviderUsageView` (real provider data)
- Hub links to ai-learning, ai-context, ai-pipeline, business-ai
- Aggregates patterns from business-ai + ai-learning sources — **boundary blur**

**adminApiService.ts** still exposes centralized-ai helpers (`/api/centralized-ai/health`, `/patterns`, `/insights`, `/privacy/settings`) alongside canonical pipeline methods.

---

## 4. Test and safety evidence

| Surface | Test coverage |
|---------|---------------|
| AI Pipeline admin HTTP | **None** (`admin-portal-ai-pipeline*.test.ts` absent) |
| centralized-ai mount fence | `aiCentralizedAdminFence.test.ts` |
| Pipeline domain logic | 11 unit tests in `server/src/ai/pipeline/__tests__` |
| ai-context-debug | No dedicated route tests found |
| ai-provider-usage | No dedicated route tests found |
| admin/business-ai | No dedicated route tests found |

---

## 5. Fragmentation diagnosis (current state)

| Problem | Evidence |
|---------|----------|
| **Dual diagnostics** | `ai-pipeline/diagnostics` vs `ai-context-debug` + `ai-context` page |
| **Dual learning admin** | `ai-learning` page → centralized-ai vs user `/api/ai/learning/*` |
| **False capability signal** | 97 centralized-ai handlers on production mount |
| **Provider admin split** | Real provider APIs on satellite mount; UI embedded in ai-system hub |
| **Hub vs pipeline** | ai-system duplicates navigation and charts that belong in pipeline or 0C analytics |
| **Business AI coupling** | `enable-centralized-learning` ties business AI to legacy scaffold |

---

## 6. Re-verification commands

```bash
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/ai-centralized.ts
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/ai-provider-usage.ts
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/ai-context-debug.ts
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/adminBusinessAI.ts
find web/src/app/admin-portal -name page.tsx | rg "ai-"
```

---

## 7. Assessment close

**Reality:** AI Pipeline is the **only production-grade AI control-plane implementation**. Legacy centralized-ai dominates handler count and misleads operators. Provider admin and business AI are viable satellites. Context debug duplicates pipeline diagnostics.

**Planning only.** No implementation authorized.

**Next:** [Ownership Analysis](./ADMIN_PORTAL_AI_ADMIN_OWNERSHIP_ANALYSIS.md)
