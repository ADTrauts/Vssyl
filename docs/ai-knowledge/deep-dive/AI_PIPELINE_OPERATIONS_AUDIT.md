> **HISTORICAL DOCUMENT**  
> This document reflects an earlier stage of the AI architecture (deep-dive audit, 2026-07-05).  
> For the **current** architecture, see:  
> - [`docs/ai-system-audit/README.md`](../../ai-system-audit/README.md) — official System Audit  
> - [`docs/architecture/AI_SYSTEM_MENTAL_MODEL.md`](../../architecture/AI_SYSTEM_MENTAL_MODEL.md) — mental model  
> - [`docs/architecture/AI_READING_GUIDE.md`](../../architecture/AI_READING_GUIDE.md) — reading order  
> - [`docs/architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md`](../../architecture/AI_ARCHITECTURE_NAVIGATION_GUIDE.md) — agent navigation  

---

# AI Pipeline / Operations Platform Audit

**Program:** AI System Deep Dive Audit  
**Date:** 2026-07-05

Audit of the admin AI Pipeline section: what it exposes, what remains hidden, and recommendations for Teach Vssyl / AI Knowledge product boundaries.

---

## Current state summary

The AI Pipeline is a **mature operator console** with ~45 HTTP handlers, 10 admin portal pages, strong test coverage, and constitutional alignment with the twin runtime. It goverates **how** AI retrieves and acts — not **what users teach** as personal/business knowledge.

**Verdict:** AI Knowledge for operators should **extend** the pipeline hub, not replace it. End-user Teach Vssyl should **not** expose raw pipeline policies.

---

## Backend

| File | Role |
|------|------|
| `server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts` | All `/api/admin-portal/ai-pipeline/*` routes |
| `server/src/services/admin/adminAiPipelineDiagnosticsService.ts` | Trace enrichment |
| `server/src/ai/pipeline/*` | Catalog, registry, trace, enforcement, retention |
| `web/src/lib/adminApiService.ts` | Client API methods |
| `web/src/types/adminAiPipeline.ts` | Shared types |

**Auth:** JWT + `requireAdmin` on all routes.

**Legacy redirects:** `/admin-portal/ai-system`, `/ai-learning`, `/ai-context` → AI Pipeline hub.

---

## Admin portal pages

| Page | Route | Components | Exposes |
|------|-------|------------|---------|
| **Overview hub** | `/admin-portal/ai-pipeline` | `PipelineOperationsHub` | Health cards, live trace feed, navigation to subsections, provider governance anchor |
| **Diagnostics** | `.../diagnostics` | `PipelineTraceTable`, `PipelineTraceDetail`, evidence viewer | Per-turn traces, grounding failures, provider attempts, evidence bundles |
| **Test lab** | `.../test-lab` | `AITestLabPanel`, `ContextProviderHealthPanel` | Dry-run twin, provider health POST |
| **Intents** | `.../intents` | `PipelineIntentRegistrySection` | Intent CRUD, grounding flags, trigger examples |
| **Grounding** | `.../grounding` | Grounding registry editors | Required/optional sources per intent |
| **Sources** | `.../sources` | Context source registry + graph | Source catalog, `wiredInTwin`, sensitivity |
| **Tools** | `.../tools` | Tool policy registry | Risk levels, permissions, fallback behavior |
| **Quality** | `.../quality` | `PipelineQualityDashboard` | Weak generic phrase stats, quality metrics |
| **Audit** | `.../audit` | `PipelinePolicyAuditTable` | Policy edit history |
| **Compliance** | `.../compliance` | `PipelineCompliancePanel` | Retention settings, export, purge |
| **Providers** | Hub `#provider-governance` | `ProviderGovernancePanel`, `ProviderUsageView` | OpenAI/Anthropic usage and expenses |

**No dedicated `/providers` route** — embedded in hub anchor + billing navigation.

---

## API route inventory

### Catalog and registry

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/catalog` | GET | Effective merged catalog (DB + defaults) |
| `/registry/graph` | GET | Policy dependency graph |
| `/registry/validate` | POST | Pre-flight validation |

### Policy CRUD (each entity: create, update, enable/disable, archive/restore, duplicate)

| Prefix | Entity |
|--------|--------|
| `/policies/intents` | Intent policies |
| `/policies/grounding` | Grounding rules |
| `/policies/sources` | Context source policies |
| `/policies/tools` | Tool policies |
| `/policies/settings` | Global pipeline settings (PUT) |

### Operations

| Endpoint | Purpose |
|----------|---------|
| `/audit` | Policy audit log |
| `/quality/stats` | Quality metrics |
| `/diagnostics`, `/diagnostics/:traceId`, `/diagnostics/:traceId/evidence` | Trace list and detail |
| `/diagnostics/export` | CSV/JSON export |
| `/test-lab` | Admin dry-run twin |
| `/context-providers/health` | Module provider health check |
| `/suggestions/metrics`, `/suggestions/dry-run` | Suggestion funnel eval |
| `/retention`, `/retention/purge` | Diagnostic retention compliance |

---

## What the pipeline already exposes (operator-visible)

| Capability | Surface | User equivalent |
|------------|---------|-----------------|
| Per-turn trace | Diagnostics detail | "Why this answer" drawer (simplified) |
| Grounding failures | Trace risk badges | Not visible |
| Provider fetch attempts | Trace context density | Not visible |
| Intent detection | Trace intents section | Not visible |
| Tool usage | Trace tools section | Not visible |
| Policy registry | Intents/grounding/sources/tools pages | Not visible |
| Dry-run testing | Test lab | Not visible |
| Provider health | Context provider health panel | Not visible |
| Quality weak phrases | Quality dashboard | Not visible |
| Retention/compliance | Compliance panel | Not visible |
| Provider cost/usage | Provider governance | Not visible |

---

## What is hidden elsewhere (not in pipeline UI)

| Capability | Location |
|------------|----------|
| Personal memory CRUD | `/ai?tab=memory` |
| Learning event review | `/ai?tab=learning` |
| Business AI config | `/business/[id]/ai` |
| Module AI registry | Admin modules section |
| Context debug (transitional) | `/api/ai-context-debug/*` |
| User effective preferences preview | `GET /api/ai/effective-preferences` |
| Collective learning insights | `/ai` → More → Insights |

---

## Audience boundary recommendations

### Should remain operator-only

- Pipeline policy CRUD (intents, grounding, sources, tools, settings)
- Raw `AIPipelineTrace` and evidence bundles
- Test lab dry-run with skip flags
- Diagnostic export and retention purge
- Provider usage/expense governance
- Context provider health at scale
- Policy audit log
- Module registry sync and built-in registration
- Transitional `ai-context-debug` routes

**Rationale:** Misconfiguration risk; requires platform AI expertise; not actionable for end users.

### Should become business-admin-facing (future)

| Pipeline concept | Business-admin surface | Notes |
|------------------|------------------------|-------|
| Business grounding requirements | Business AI Control Center → "Data sources" | Read-only view of which modules feed business AI |
| Business learning events | Already in Business AI CC | Strengthen application pipeline |
| Workspace policy digest | Already in `WorkspaceAIDrawer` | Extend with source transparency |
| Quality alerts (business-scoped) | Business analytics | Filter diagnostics by `businessId` — **not built today** |

**Not:** Full intent/grounding editor for business admins in v1 — too easy to break platform invariants.

### Should become end-user-facing (Teach Vssyl)

| User need | Surface | Not pipeline raw data |
|-----------|---------|----------------------|
| Teach a fact | In-chat + Memory tab | Routes to `UserMemoryFact` |
| Teach a preference | In-chat + Behavior/Memory | Routes to `UserAIContext` |
| Review inferred learning | Learning tab (exists) | Pending promotion |
| See what influenced answer | Explain drawer (exists) | `responseInfluence` — extend with "correct this" |
| Know what modules AI can see | New "Sources" help panel | Plain language, not policy registry |
| Business employees teach workspace facts | Employee drawer + admin approval | Business-scoped memory |

---

## Should "AI Knowledge" be a new section or reorganization?

**Recommendation: Reorganization + extension, not a parallel system.**

| Audience | Structure |
|----------|-----------|
| **End users** | Extend `/ai` Control Center — unify Memory + Learning + new in-chat Teach under "AI Knowledge" branding tab group. Do not create `/ai-knowledge` route duplicating `/ai`. |
| **Business admins** | Extend `/business/[id]/ai` — "Workspace knowledge" subsection alongside existing config. |
| **Operators** | Keep `/admin-portal/ai-pipeline` as governance console. Add optional **"Knowledge ops"** hub card linking: diagnostics filtered by learning events volume, correction metrics (when built), provider health — **not** duplicate policy editors. |

**Avoid:** Splitting operator pipeline into "AI Knowledge" vs "AI Pipeline" — the pipeline already IS operator knowledge governance. Rename/marketing only if it reduces confusion.

---

## Trace production path (operator observability)

Every production twin turn (non-skipped):

1. `DigitalLifeTwinCore` → `buildPipelineTrace`
2. Embedded in response metadata + saved to `AIConversationHistory.context._pipelineTrace`
3. `persistPipelineDiagnostic` → `AIPipelineDiagnostic` table
4. Admin diagnostics UI lists and details traces

Test lab always persists trace even with `adminDryRun`.

---

## Gaps in pipeline ops (for Teach Vssyl program)

| Gap | Impact |
|-----|--------|
| No correction volume metrics | Can't measure teach program success |
| Quality stats don't include user feedback | Disconnected from `/api/ai/feedback` |
| No business-scoped diagnostic filter | Business admins can't self-serve |
| Provider page is hub anchor only | Minor navigation friction |
| No automated alerting from quality stats | Observational only |
| Learning pipeline trace in admin trace but no dedicated learning ops page | Hard to audit teach loop |

---

## Test coverage

| Test | Path |
|------|------|
| HTTP handler registry (45 handlers) | `server/src/routes/__tests__/fixtures/aiPipelineHandlerRegistry.ts` |
| Route integration | `admin-portal-ai-pipeline.test.ts` |
| Coverage smoke | `admin-portal-ai-pipeline-coverage.test.ts` |
| Constitutional alignment | `server/src/context-graph/__tests__/aiPipelineConstitutional.test.ts` |
| Trace insights | `pipelineTraceInsights.test.ts` |

---

## Related docs

- `docs/ai-knowledge/AI_PIPELINE_REVIEW.md` — Phase 0A pipeline review
- `docs/ai-knowledge/AI_KNOWLEDGE_OPERATOR_MODEL.md` — operator model evolution
- `docs/architecture/AI_TWIN_PROMPT_PIPELINE.md` — runtime integration
