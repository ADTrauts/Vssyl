# Admin Portal — Provider Governance Inventory

**Package:** 0D-C — Provider Governance Consolidation  
**Initiative:** AP-AI-01  
**Date:** 2026-06-17  
**Authoritative planning:** `ADMIN_PORTAL_AI_ADMIN_*` blueprint set

---

## 1. Executive summary

| Metric | Value |
|--------|-------|
| Satellite API mount | `/api/admin/ai-providers` — **8 handlers** |
| Canonical UI owner | `/admin-portal/ai-pipeline#provider-governance` |
| `adminApiService` provider methods | **6 active** (2 unused per-provider expense helpers removed in 0D-C) |
| Duplicate embed removed | `ai-system` Provider Usage section |
| Billing satellite | `ProviderExpensesView` on `/admin-portal/billing` — **retained** |

---

## 2. API routes (`/api/admin/ai-providers`)

| Route | Method | Service | Classification |
|-------|--------|---------|----------------|
| `/usage/combined` | GET | `CombinedProviderService` | SATELLITE — canonical usage aggregate |
| `/usage/openai` | GET | `OpenAIAdminService` | SATELLITE |
| `/usage/anthropic` | GET | `AnthropicAdminService` | SATELLITE |
| `/expenses/openai` | GET | `OpenAIAdminService` | SATELLITE |
| `/expenses/anthropic` | GET | `AnthropicAdminService` | SATELLITE |
| `/expenses/providers` | GET | Combined (OpenAI + Anthropic) | SATELLITE — canonical expense aggregate |
| `/history/usage` | GET | `HistoricalDataService` | SATELLITE |
| `/history/expenses` | GET | `HistoricalDataService` | SATELLITE |

**Mount:** `server/src/index.ts` L927 — `authenticateJWT` + local `requireAdmin` (documented auth exception per blueprint).

**Not provider governance (related):**

| Route | Mount | Classification |
|-------|-------|----------------|
| `POST /ai-pipeline/context-providers/health` | `/api/admin-portal` | CANONICAL — **module context** provider health (not LLM billing) |
| `POST /ai-pipeline/test-lab` (provider param) | `/api/admin-portal` | CANONICAL — inference provider selection in dry-run |

---

## 3. Pages

| Page | Path | Classification | Post-0D-C |
|------|------|----------------|-----------|
| AI Pipeline hub | `/admin-portal/ai-pipeline` | **CANONICAL** | Embeds `ProviderGovernancePanel` |
| AI System hub | `/admin-portal/ai-system` | TRANSITIONAL | Links to pipeline `#provider-governance`; embed removed |
| Financial Management | `/admin-portal/billing` | SATELLITE (expenses) | Retains `ProviderExpensesView` |
| AI Pipeline test-lab | `/admin-portal/ai-pipeline/test-lab` | CANONICAL | `ContextProviderHealthPanel` (module providers) |
| Modules admin | `/admin-portal/modules` | CANONICAL (module AI) | `testModuleAIProvider` for context provider endpoints |

**No dedicated `/ai-pipeline/providers` page** — governance section is hub anchor (per blueprint: no mount merge, minimal nav churn).

---

## 4. Components

| Component | Path | Classification | Consumer |
|-----------|------|----------------|----------|
| `ProviderGovernancePanel` | `ai-pipeline/ProviderGovernancePanel.tsx` | **CANONICAL** (new 0D-C) | `PipelineOperationsHub` |
| `ProviderUsageView` | `ProviderUsageView.tsx` | CANONICAL widget | `ProviderGovernancePanel` |
| `ProviderExpensesView` | `ProviderExpensesView.tsx` | SATELLITE widget | `billing/page.tsx` |
| `ContextProviderHealthPanel` | `ai-pipeline/ContextProviderHealthPanel.tsx` | CANONICAL (module) | `test-lab/page.tsx` |
| `PipelineOperationsHub` | `ai-pipeline/PipelineOperationsHub.tsx` | CANONICAL | `ai-pipeline/page.tsx` |
| `PipelineHubToolSections` | `ai-pipeline/PipelineHubToolSections.tsx` | CANONICAL | Hub tool cards incl. Provider Governance link |

**LEGACY / DUPLICATE (removed in 0D-C):**

| Surface | Was | Disposition |
|---------|-----|-------------|
| `ai-system` embedded `ProviderUsageView` + tabs | DUPLICATE | Removed — link to pipeline |
| Duplicate `ai-pipeline` system card (×2) | DUPLICATE | Consolidated to single card |

---

## 5. Backend services

| Service | Path | Classification |
|---------|------|----------------|
| `OpenAIAdminService` | `aiProviderServices/openAIAdminService.ts` | SATELLITE |
| `AnthropicAdminService` | `aiProviderServices/anthropicAdminService.ts` | SATELLITE |
| `CombinedProviderService` | `aiProviderServices/combinedProviderService.ts` | SATELLITE |
| `HistoricalDataService` | `aiProviderServices/historicalDataService.ts` | SATELLITE |
| `ProviderSyncService` | `aiProviderServices/providerSyncService.ts` | SATELLITE (cron) |
| `moduleContextProviderHealthCheck` | `ai/services/moduleContextProviderHealthCheck.ts` | CANONICAL (module context) |

---

## 6. adminApiService methods

| Method | API path | Classification | Post-0D-C |
|--------|----------|----------------|-----------|
| `getAIProviderUsageCombined` | `/usage/combined` | ACTIVE | Preserved |
| `getAIProviderUsageOpenAI` | `/usage/openai` | ACTIVE | Preserved — used by `ProviderUsageView` |
| `getAIProviderUsageAnthropic` | `/usage/anthropic` | ACTIVE | Preserved |
| `getAIProviderExpensesCombined` | `/expenses/providers` | ACTIVE | Preserved — `ProviderExpensesView` |
| `getAIProviderHistoricalUsage` | `/history/usage` | ACTIVE | Preserved |
| `getAIProviderHistoricalExpenses` | `/history/expenses` | ACTIVE | Preserved |
| ~~`getAIProviderExpensesOpenAI`~~ | `/expenses/openai` | UNUSED | **Removed** — no UI consumer |
| ~~`getAIProviderExpensesAnthropic`~~ | `/expenses/anthropic` | UNUSED | **Removed** — aggregate used instead |
| `testModuleAIProvider` | Dynamic module endpoints | ACTIVE (module) | Preserved — not LLM governance |
| `runModuleContextProviderHealthCheck` | `/ai-pipeline/context-providers/health` | ACTIVE (module) | Preserved |

---

## 7. Navigation entries

| Location | Entry | Classification | Post-0D-C |
|----------|-------|----------------|-----------|
| `layout.tsx` AI section | AI Pipeline | CANONICAL | Unchanged — primary destination |
| `layout.tsx` AI section | AI System | TRANSITIONAL | Unchanged — launcher only |
| `layout.tsx` Commercial | Financial Management | SATELLITE | Expenses cross-link |
| `PipelineHubToolSections` Govern | Provider Governance card | CANONICAL | **Added** → `#provider-governance` |
| `ai-system` system cards | Provider Governance | CANONICAL link | **Added** |
| `ai-system` quick actions | Provider Governance | CANONICAL link | **Added** |
| ~~`ai-system` bottom Provider Usage tabs~~ | DUPLICATE | **Removed** |

---

## 8. Tests

| File | Scope |
|------|-------|
| `adminPortalProviderGovernance.test.ts` | Single destination, no duplicate embed, helper hygiene |
| `admin-portal-auth-consolidation.test.ts` | Documents `ai-provider-usage` local `requireAdmin` exception |

---

## 9. Retirement recommendation

| Item | Recommendation |
|------|----------------|
| `/api/admin/ai-providers` mount | **KEEP** as satellite — no merge into pipeline prefix in 0D-C |
| Provider usage UI | **CANONICAL** on AI Pipeline hub |
| Provider expenses UI | **SATELLITE** on billing — link from pipeline panel |
| Module context provider health | **CANONICAL** on test-lab — separate from LLM governance |
| Per-provider expense client helpers | **Removed** — use combined endpoints |

---

**Next:** 0D-D pipeline affirmation; 0D-F removes remaining ai-system duplication per AP-AI-05.
