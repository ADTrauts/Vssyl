# Admin Portal — Provider Ownership Matrix

**Package:** 0D-C — Provider Governance Consolidation  
**Initiative:** AP-AI-01  
**Date:** 2026-06-17  
**Canonical control plane:** `/admin-portal/ai-pipeline`

---

## Ownership principles

1. **AI Pipeline** owns operator discovery and governance UX for external LLM providers.
2. **`/api/admin/ai-providers`** remains a **satellite API** — real integrations, separate mount (no merge in 0D-C).
3. **Module context providers** (per-module `/api/.../ai/context/...`) are pipeline/test-lab concerns — not LLM billing.
4. **Billing** retains expense charts as a commercial satellite with cross-links from pipeline.

---

## Matrix

| Surface | Current Owner (pre-0D-C) | Target Owner | Disposition |
|---------|--------------------------|--------------|-------------|
| Provider usage UI (tabs, charts) | `ai-system` embed | **AI Pipeline hub** `#provider-governance` | **Consolidated** |
| Provider usage API | `/api/admin/ai-providers` | Same satellite | **KEEP** |
| Provider expense UI | `billing/page.tsx` | Billing (satellite) | **KEEP** — link from pipeline |
| Provider expense API | `/api/admin/ai-providers/expenses/*` | Same satellite | **KEEP** |
| Historical usage/expense API | `/api/admin/ai-providers/history/*` | Same satellite | **KEEP** |
| `ProviderUsageView` component | Shared widget | AI Pipeline (via `ProviderGovernancePanel`) | **CANONICAL embed** |
| `ProviderExpensesView` component | Billing page | Billing satellite | **SATELLITE** |
| `ProviderGovernancePanel` | — | AI Pipeline hub | **Created (0D-C)** |
| AI Pipeline hub navigation card | — | `PipelineHubToolSections` Govern | **Added** |
| AI System launcher link | Implicit via embed | Link to pipeline anchor | **Link only** |
| `adminApiService` usage helpers (×3) | Shared client | Shared client | **KEEP** |
| `adminApiService` expense helpers (combined + history) | Shared client | Shared client | **KEEP** |
| `adminApiService` per-provider expense helpers | Orphan wrappers | — | **Removed** |
| Module context provider health | AI Pipeline test-lab | AI Pipeline test-lab | **KEEP** (separate domain) |
| `testModuleAIProvider` (modules page) | Modules admin | Modules admin | **KEEP** (module certification) |
| Provider sync cron | `platformCronJobs.ts` | Platform ops | **KEEP** |
| OpenAI/Anthropic admin services | `aiProviderServices/*` | Same | **KEEP** |
| User-facing `ProviderSettings` | Personal AI settings | User settings (not admin) | **Out of scope** |
| `AIProviderTest` component | Dev/test | Non-admin | **Out of scope** |
| Centralized-ai mock provider routes | Retired (0D-B) | — | **FENCED 410** |

---

## Operator journey (target)

```
Admin Portal → AI Pipeline → Provider governance section
                    ↓
            (optional) Financial Management → Provider expenses
```

**AI System** remains a launcher; it must not duplicate provider charts.

---

## Auth ownership

| Mount | Auth pattern | Owner doc |
|-------|--------------|-----------|
| `/api/admin-portal/ai-pipeline/*` | `authenticateJWT` + shared `requireAdmin` | `ADMIN_PORTAL_AUTH_MATRIX.md` |
| `/api/admin/ai-providers/*` | `authenticateJWT` + **local** `requireAdmin` | Documented exception — align in 1B optional |

---

## Finding alignment

| Finding | 0D-C contribution |
|---------|-------------------|
| AP-AI-01 | **Substantially complete** — canonical UX owner explicit |
| AP-F-008 | Supports — removes false centralized-ai provider narrative |
| AP-F-030 | No closure — pipeline HTTP tests deferred to 0D-E |

---

## Deferred (not 0D-C)

| Item | Package |
|------|---------|
| Merge `/api/admin/ai-providers` into pipeline prefix | 1B+ (if ever) |
| Remove ai-system launcher entirely | 0D-F (AP-AI-05) |
| Auth consolidation for ai-providers mount | 1B optional |
| Provider capability matrix admin UI | Future — runtime in `providerCapabilityMatrix.ts` |
