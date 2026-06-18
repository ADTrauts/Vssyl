# Admin Portal — AI Pipeline Ownership Model

**Package:** 0D-D — AI Pipeline Consolidation  
**Initiative:** AP-AI-02  
**Date:** 2026-06-17  
**Canonical control plane:** `/admin-portal/ai-pipeline` + `/api/admin-portal/ai-pipeline/*`

---

## 1. Tier model

| Tier | Definition | Examples |
|------|------------|----------|
| **CANONICAL** | Single operator truth for AI administration | Pipeline hub, policy routes, diagnostics UI |
| **SATELLITE** | Real adjunct mount; discovered from pipeline | `/api/admin/ai-providers`, billing expenses |
| **TRANSITIONAL** | Launcher until 0D-F; must not duplicate pipeline UX | `ai-system` |
| **LEGACY** | Competing path scheduled for merge/retire | `ai-context-debug`, `centralized-ai` |

---

## 2. Ownership by dimension

### Capability owner

| Domain | Owner | Not owned by |
|--------|-------|--------------|
| Intent/grounding/source/tool policies | **AI Pipeline** | centralized-ai, ai-context-debug |
| Pipeline diagnostics & traces | **AI Pipeline** | ai-context-debug (duplicate) |
| Test lab & suggestion evaluation | **AI Pipeline** | centralized-ai A/B scaffold |
| Retention, export, purge | **AI Pipeline** | Global retention page (platform-wide) |
| LLM provider usage/cost | **Provider Governance** (satellite) | Pipeline API prefix |
| Module context provider health | **AI Pipeline** (test-lab) | Modules page tests (certification) |
| Business digital twins | **Business AI** | Pipeline |
| Platform usage analytics | **Platform Analytics (0C)** | Pipeline |

### Route owner

| Prefix | Owner | Auth |
|--------|-------|------|
| `/api/admin-portal/ai-pipeline/*` | **AI Pipeline** | `authenticateJWT` + shared `requireAdmin` |
| `/api/admin/ai-providers/*` | **Provider Governance satellite** | Local `requireAdmin` |
| `/api/ai-context-debug/*` | **Legacy diagnostics** | `requireAdmin` — merge to pipeline (0D-E) |
| `/api/centralized-ai/*` | **DEPRECATED** | Fenced 410 |

### Service owner

| Service layer | Owner | Location |
|---------------|-------|----------|
| Pipeline catalog/registry/diagnostics | **AI Pipeline** | `server/src/ai/pipeline/*` |
| Suggestion dry-run / funnel metrics | **AI Pipeline** (via routes) | `server/src/ai/suggestions/*` |
| Module context health check | **AI Pipeline** (admin probe) | `server/src/ai/services/moduleContextProviderHealthCheck.ts` |
| Twin runtime (test-lab invocation) | **AI Platform runtime** | `DigitalLifeTwinService` |
| Provider admin APIs | **Provider satellite** | `server/src/services/aiProviderServices/*` |
| Context debug assembly | **Legacy** | `ai-context-debug.ts` route handlers |
| `adminService` | **Platform admin** | No pipeline logic |

### UI owner

| Surface | Owner |
|---------|-------|
| `/admin-portal/ai-pipeline` (+ 9 sub-pages) | **AI Pipeline** |
| `PipelineHubToolSections` navigation cards | **AI Pipeline** (canonical deep links) |
| `layout.tsx` → AI Pipeline nav item | **Admin Portal shell** (single entry) |
| `/admin-portal/ai-system` pipeline card | **Transitional launcher** (one card only post-0D-D) |
| `/admin-portal/billing` provider expenses | **Commercial satellite** |
| `/admin-portal/ai-context` | **Legacy** — diagnostics duplicate |
| `/admin-portal/business-ai` | **Business AI satellite** |

---

## 3. Boundary rules (enforced in 0D-D)

1. **No new AI admin routes** outside `/api/admin-portal/ai-pipeline/*` without architecture review.
2. **Pipeline sub-capabilities** are reached from hub `PipelineHubToolSections` or sub-pages — not duplicate launchers on `ai-system`.
3. **Provider governance** UI lives on pipeline hub; API stays on satellite mount (0D-C).
4. **Diagnostics consolidation** is documented but **not started** in 0D-D.
5. **`adminService`** must not absorb pipeline logic (extraction register tracks drift).

---

## 4. Explicit non-ownership

| Belongs elsewhere | Why |
|-------------------|-----|
| **Diagnostics merge work** | 0D-E — ai-context-debug parity |
| **Provider API merge** | Not planned in 0D; satellite contract |
| **Business AI toggles** | `adminBusinessAI.ts` satellite |
| **Module marketplace AI context** | `modules/page.tsx` certification |
| **User provider settings** | Personal AI settings — not admin |

---

## 5. Operator flow (canonical)

```
layout.tsx → AI Pipeline
    ├── Hub (health, activity, provider governance)
    ├── Observe → Diagnostics, Test Lab
    ├── Configure → Intents, Grounding, Sources, Tools
    └── Govern → Quality, Audit, Compliance, Provider Governance
```

`ai-system` → single **AI Pipeline** card → hub (transitional; full launcher refactor in 0D-F).

---

## 6. Related documents

- [ADMIN_PORTAL_AI_PIPELINE_SURFACE_MAP.md](./ADMIN_PORTAL_AI_PIPELINE_SURFACE_MAP.md)
- [ADMIN_PORTAL_PROVIDER_OWNERSHIP_MATRIX.md](./ADMIN_PORTAL_PROVIDER_OWNERSHIP_MATRIX.md)
- [ADMIN_PORTAL_AI_CONTROL_PLANE_ARCHITECTURE.md](./ADMIN_PORTAL_AI_CONTROL_PLANE_ARCHITECTURE.md)
