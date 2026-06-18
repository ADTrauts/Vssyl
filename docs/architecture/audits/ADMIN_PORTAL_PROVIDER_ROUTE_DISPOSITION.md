# Admin Portal — Provider Route Disposition

**Package:** 0D-C — Provider Governance Consolidation  
**Initiative:** AP-AI-01  
**Date:** 2026-06-17  
**Constraint:** Documentation and ownership only — **no route migrations implemented in 0D-C**

---

## Disposition legend

| Action | Meaning |
|--------|---------|
| **KEEP** | Route remains at current path; canonical for its domain |
| **WRAP** | UI/client wraps satellite route from pipeline hub (no server move) |
| **MOVE** | Relocate to pipeline prefix — **deferred** |
| **RETIRE** | Remove or 410 — not applicable to live provider routes |

---

## `/api/admin/ai-providers` (8 handlers)

| # | Route | Method | Disposition | Rationale | Replacement / wrapper |
|---|-------|--------|-------------|-----------|----------------------|
| 1 | `/usage/combined` | GET | **KEEP** | Real combined usage; active consumer | Wrapped by `ProviderGovernancePanel` via `getAIProviderUsageCombined` |
| 2 | `/usage/openai` | GET | **KEEP** | Official OpenAI admin API | Tab in `ProviderUsageView` |
| 3 | `/usage/anthropic` | GET | **KEEP** | Official Anthropic admin API | Tab in `ProviderUsageView` |
| 4 | `/expenses/openai` | GET | **KEEP** | Used internally by `/expenses/providers` aggregate | No direct UI — server-side only |
| 5 | `/expenses/anthropic` | GET | **KEEP** | Used internally by `/expenses/providers` aggregate | No direct UI — server-side only |
| 6 | `/expenses/providers` | GET | **KEEP** | Canonical combined expense endpoint | **WRAP** — `ProviderExpensesView` on billing |
| 7 | `/history/usage` | GET | **KEEP** | Historical trends for usage charts | **WRAP** — `ProviderUsageView` |
| 8 | `/history/expenses` | GET | **KEEP** | Historical trends for expense charts | **WRAP** — `ProviderExpensesView` |

**Mount disposition:** **KEEP** `/api/admin/ai-providers` — satellite mount preserved per control-plane architecture.

---

## `/api/admin-portal/ai-pipeline/*` (provider-related only)

| Route | Method | Disposition | Rationale |
|-------|--------|-------------|-----------|
| `/ai-pipeline/context-providers/health` | POST | **KEEP** | Module context provider dry-run — not LLM billing |
| `/ai-pipeline/test-lab` (body.provider) | POST | **KEEP** | Inference provider selection in evaluation — 0D-E scope |

**No new provider routes added in 0D-C.**

---

## Retired centralized-ai provider scaffold (0D-B)

| Route cluster | Disposition | Notes |
|---------------|-------------|-------|
| `/api/centralized-ai/models/*` | **RETIRE** (410) | Mock — replaced by `GET /api/ai/models` |
| `/api/centralized-ai/automl/*` | **RETIRE** (410) | Mock scaffold |

---

## Client route disposition (`adminApiService`)

| Method | Disposition | Notes |
|--------|-------------|-------|
| `getAIProviderUsageCombined` | **KEEP** | Active |
| `getAIProviderUsageOpenAI` | **KEEP** | Active |
| `getAIProviderUsageAnthropic` | **KEEP** | Active |
| `getAIProviderExpensesCombined` | **KEEP** | Active |
| `getAIProviderHistoricalUsage` | **KEEP** | Active |
| `getAIProviderHistoricalExpenses` | **KEEP** | Active |
| `getAIProviderExpensesOpenAI` | **RETIRE** (client) | Removed — zero consumers |
| `getAIProviderExpensesAnthropic` | **RETIRE** (client) | Removed — zero consumers |
| `testModuleAIProvider` | **KEEP** | Module context — separate domain |
| `runModuleContextProviderHealthCheck` | **KEEP** | Pipeline canonical |

---

## UI route disposition

| Path | Disposition | Target |
|------|-------------|--------|
| `/admin-portal/ai-pipeline` | **KEEP** | Canonical hub + `#provider-governance` |
| `/admin-portal/ai-pipeline#provider-governance` | **KEEP** (anchor) | Provider usage governance |
| `/admin-portal/ai-system` | **WRAP** | Launcher links only — no provider embed |
| `/admin-portal/billing` | **KEEP** | Expense satellite |
| `/admin-portal/ai-pipeline/test-lab` | **KEEP** | Module context provider health |

---

## MOVE candidates (deferred — not 0D-C)

| Current | Proposed future | Blocker |
|---------|-----------------|---------|
| `/api/admin/ai-providers/*` → `/api/admin-portal/ai-pipeline/providers/*` | Prefix unification | Contract risk; 1B decision |
| Dedicated `/admin-portal/ai-pipeline/providers` page | Sub-page extraction | 0D-F UX optional |

---

## Summary

| Disposition | API handlers | Client methods | UI surfaces |
|-------------|--------------|----------------|-------------|
| KEEP | 8 + 2 pipeline | 6 + 2 module/pipeline | 3 canonical + 1 satellite |
| WRAP | — | — | Pipeline hub wraps satellite APIs |
| MOVE | 0 | 0 | 0 (deferred) |
| RETIRE | 0 live | 2 removed | 1 duplicate embed removed |

**Verification:** No `ai-providers` routes deleted; all 8 handlers unchanged in `ai-provider-usage.ts`.
