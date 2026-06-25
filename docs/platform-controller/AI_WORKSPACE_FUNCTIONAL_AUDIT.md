# AI Workspace Functional Audit

**Program:** Platform Controller Phase 1C  
**Date:** 2026-06-24  
**Scope:** All AI-related Platform Controller pages and their effect on live AI behavior

---

## 1. Inventory — AI & Diagnostics navigation

From `platformControllerNavigation.ts` (Phase 1B sidebar):

| Nav item | Route | In sidebar |
|----------|-------|------------|
| AI Pipeline | `/admin-portal/ai-pipeline` | Yes |
| Diagnostics | `/admin-portal/ai-pipeline/diagnostics` | Yes |
| Business AI | `/admin-portal/business-ai` | Yes |
| Providers | `/admin-portal/ai-pipeline` (hub links) | Yes |
| Overrides | `/admin-portal/overrides` | Yes |

**Off-nav but reachable:** `ai-system`, `ai-learning`, `ai-context`, `retention`, `ai-pipeline/*` subpages, `pricing` (AI query packs).

---

## 2. AI Pipeline subdomain (primary operator surface)

**Hub:** `PipelineOperationsHub` → links to subpages  
**Backend mount:** `adminPortalRoutes.aiPipeline.ts` (~45 routes)  
**Tests:** `admin-portal-ai-pipeline.test.ts` (catalog, graph, diagnostics, quality, retention, suggestions)

### 2.1 Subpage matrix

| Page | Purpose | Key API(s) | Data source | Affects live AI? | Diagnostics only? | Status | Test coverage |
|------|---------|------------|-------------|------------------|-------------------|--------|---------------|
| `/ai-pipeline` | Ops hub | catalog, quality stats | Pipeline services | No | Yes | Working | Indirect |
| `/ai-pipeline/intents` | Intent registry CRUD | `/ai-pipeline/intents/*` | Pipeline policy store | **Yes** when saved | No | Working | Route tests |
| `/ai-pipeline/sources` | Context source bindings | `/ai-pipeline/catalog`, sources routes | V-Link / context graph bindings | **Yes** | No | Working | Catalog test |
| `/ai-pipeline/tools` | Tool policies | `/ai-pipeline/tools/*` | Pipeline tool policy store | **Yes** | No | Working | Partial |
| `/ai-pipeline/grounding` | Grounding rules | `/ai-pipeline/policies/grounding/*` | Grounding policy store | **Yes** | No | Working | Partial |
| `/ai-pipeline/diagnostics` | Trace forensics | `/ai-pipeline/diagnostics` | Trace store | No | **Yes** | Working | Route test |
| `/ai-pipeline/quality` | Retrieval quality KPIs | `/ai-pipeline/quality/stats` | Aggregated traces (7d window) | No | **Yes** | Working | Route test |
| `/ai-pipeline/compliance` | Compliance settings | compliance routes | Pipeline config | **Yes** | No | Working | Partial |
| `/ai-pipeline/audit` | Pipeline audit log | audit routes | Audit records | No | **Yes** | Working | Partial |
| `/ai-pipeline/test-lab` | Dry-run / prompt test | test-lab routes | Pipeline test harness | No* | **Yes** | Working | Partial |
| `/ai-pipeline/retention` | Trace retention | `/ai-pipeline/retention` | Retention settings | **Yes** (storage) | No | Working | Route test |
| `/retention` | Legacy retention entry | Same APIs | Same | Same | No | Working | Duplicate path |

\*Test lab does not change production config unless operator saves policy changes separately.

### 2.2 Registry graph

| Attribute | Value |
|-----------|-------|
| **API** | `GET /ai-pipeline/registry/graph` |
| **Purpose** | Operator visualization of intents, sources, tools |
| **Affects live AI** | No (read-only view) |
| **Status** | **Working** |
| **Stale risk** | Low — built from live catalog |

---

## 3. AI providers

| Surface | API mount | Data | Status |
|---------|-----------|------|--------|
| Usage (embedded in pipeline / legacy ai-system) | `/api/admin/ai-providers/usage/*` | Provider usage APIs + history | Needs Manual Verification |
| Expenses (billing tab) | `/api/admin/ai-providers/expenses/providers` | OpenAI + Anthropic admin billing | Needs Manual Verification |
| PC alias (Phase 1B) | `/api/admin-portal/providers/*` → `/api/admin/ai-providers/*` | Proxy only | Working |

**Silent failure mode:** Provider routes `.catch(() => null)` — UI may show $0 without error.

**Affects live AI:** Provider selection in pipeline config — **yes** when routing rules reference provider IDs.

---

## 4. Business AI admin

| Page | API | Data source | Affects live AI? | Status |
|------|-----|-------------|------------------|--------|
| `/business-ai` | `GET /api/admin/business-ai/global` | `businessAIDigitalTwin` + business | **Yes** (centralized learning flags) | Partially Working |
| Patterns panel | `GET /api/admin/business-ai/patterns` | `globalPattern`, `collectiveInsight` | Indirect | Working |
| Enable/disable centralized learning | `POST .../enable-centralized-learning` | Updates twin flags | **Yes** | Working |

**Misleading element:** Global metrics `averageConfidence` documented as placeholder in `adminBusinessAI.ts` (line ~80) — UI may show synthetic 0.75-style default.

**Recommendations block:** `generateCrossBusinessRecommendations` — template text over real patterns; not fake data but **low signal**.

---

## 5. AI System overview (off-nav launcher)

| Attribute | Value |
|-----------|-------|
| **Route** | `/admin-portal/ai-system` |
| **Purpose** | Federation card linking pipeline, business-ai, learning |
| **APIs** | `getBusinessAIGlobal`, `getBusinessAIPatterns`, learning satellites |
| **Status** | **Partially Working** — valid links; composite health scores mix sources |
| **Misleading** | Presents unified "system health" without single SoT |
| **Action** | Prefer Platform Programs hub + AI Pipeline; deprecate launcher in 1D |

---

## 6. Legacy / consolidating surfaces

| Page | Status | Notes |
|------|--------|-------|
| `/ai-learning` | Partially Working | Satellite `/api/ai-centralized` fenced; consolidating per Phase 0A |
| `/ai-context` | Partially Working | Duplicate of modules AI Context tab |
| `/centralized-ai` (if linked) | Retire deferred | Not in Phase 1B nav |

---

## 7. Admin overrides

| Feature | API | Affects live AI? | Status |
|---------|-----|------------------|--------|
| Grant/revoke admin | `/api/admin-override/users/:id/make-admin` | No | Working |
| Set business tier | `/api/admin-override/businesses/:id/set-tier` | **Yes** (entitlements) | Working |
| User/business search | list endpoints | No | Working |

Uses direct `fetch` to `/api/admin-override/*` (not `adminApiService`). Phase 1B alias exists for future migration.

---

## 8. Memories & preferences

| Capability | Admin UI | Runtime | Status |
|------------|----------|---------|--------|
| User preferences block | **None** | `PreferenceResolver`, `AIContextAssembler` | No PC surface — **N/A** |
| Long-term memories | **None** | Module / AI services | No PC surface — **N/A** |
| Grounding preferences | Grounding page | Pipeline policies | **Working** |

**Conclusion:** Memories/preferences are runtime concerns without Platform Controller admin pages. Not stubbed UI — simply **not exposed** to operators.

---

## 9. Pricing (AI query packs)

| Page | API | Stripe | Status |
|------|-----|--------|--------|
| `/admin-portal/pricing` | `/api/admin-portal/pricing/*` | `stripePriceId` on tiers + query packs | **Working** |

Affects live AI economics (query allowances) — not model behavior directly.

---

## 10. Master feature table (AI workspace)

| Feature | Page | API | Data Source | Status | Risk | Recommended Action |
|---------|------|-----|-------------|--------|------|-------------------|
| Pipeline catalog | ai-pipeline | `/ai-pipeline/catalog` | Pipeline registry | Working | Low | — |
| Intent management | intents | `/ai-pipeline/intents/*` | Policy store | Working | Medium | Document change control |
| Context sources | sources | catalog + source routes | Context graph bindings | Working | Medium | — |
| Tool policies | tools | `/ai-pipeline/tools/*` | Tool policy store | Working | Medium | — |
| Grounding rules | grounding | `/ai-pipeline/policies/grounding/*` | Grounding store | Working | High | Test before enable in prod |
| Trace diagnostics | diagnostics | `/ai-pipeline/diagnostics` | Trace DB | Working | Low | — |
| Quality stats | quality, Programs card | `/ai-pipeline/quality/stats` | Trace aggregates | Working | Low | — |
| Test lab | test-lab | test-lab routes | Harness | Working | Low | — |
| Retention settings | retention | `/ai-pipeline/retention` | Pipeline config | Working | Medium | — |
| Provider usage | pipeline / ai-system | `/admin/ai-providers/*` | Provider APIs | Needs Manual Verification | Medium | Surface API errors |
| Provider expenses | billing | expenses/providers | Provider billing APIs | Needs Manual Verification | Medium | — |
| Business AI global | business-ai | `/admin/business-ai/global` | `businessAIDigitalTwin` | Partially Working | Medium | Fix confidence placeholder |
| Cross-business patterns | business-ai | `/admin/business-ai/patterns` | patterns + insights | Working | Low | — |
| Centralized learning toggle | business-ai | POST enable/disable | DB flags | Working | High | Audit who toggles |
| AI System launcher | ai-system | mixed | federation | Partially Working | Low | Deprecate |
| AI learning (legacy) | ai-learning | ai-centralized sat | legacy | Partially Working | Medium | Retire path |
| AI context (legacy) | ai-context | module AI routes | modules | Partially Working | Low | Use modules tab |
| Admin overrides | overrides | `/admin-override/*` | user/business | Working | High | — |
| Memories admin | — | — | — | N/A | Low | Future surface if needed |
| Preferences admin | — | — | runtime resolver | N/A | Low | Future surface if needed |

---

## 11. Effect on real AI behavior — summary

| Category | Changes production AI responses |
|----------|--------------------------------|
| **High impact** | Intents, grounding rules, tool policies, context sources, compliance settings, business tier overrides, centralized learning flags |
| **Medium impact** | Retention (what traces exist), provider routing if configured |
| **Diagnostics only** | Diagnostics, quality dashboards, test lab runs, registry graph view, audit viewers |
| **No admin surface** | Memories, user preference resolver (runtime only) |

---

**Last updated:** 2026-06-24
