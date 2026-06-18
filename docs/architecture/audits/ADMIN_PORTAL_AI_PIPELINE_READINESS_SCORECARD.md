# Admin Portal — AI Pipeline Readiness Scorecard

**Package:** 0D-D — AI Pipeline Consolidation  
**Initiative:** AP-AI-02  
**Findings:** AP-F-030 (partial prep), AP-F-029 (prep)  
**Date:** 2026-06-17  
**Scale:** 0–100 per dimension; **weighted overall**

---

## Scorecard

| Dimension | Weight | Current (0D-D) | Expected (post-0D-E) | Evidence |
|-----------|--------|----------------|----------------------|----------|
| **Architecture** | 20% | **82** | **88** | 45 canonical handlers; satellites documented; centralized-ai fenced |
| **Ownership** | 20% | **85** | **90** | Ownership model + extraction register; provider governance on hub (0D-C) |
| **Navigation** | 15% | **78** | **85** | Single layout entry; hub tool cards; ai-system dupes removed (0D-D) |
| **Service boundaries** | 20% | **80** | **84** | Logic in `ai/pipeline/*`; route file still thick; adminService clean |
| **Testing** | 15% | **35** | **65** | Hygiene tests only; **zero** HTTP pipeline integration tests |
| **Documentation** | 10% | **90** | **92** | Surface map, capability matrix, ownership, extraction register |

### Weighted overall

| Milestone | Score |
|-----------|-------|
| **Current (end of 0D-D)** | **76.5** |
| **Expected (end of 0D-E)** | **84.0** |
| **Target (end of 0D-G / Stage 0D)** | **88+** |

---

## Dimension detail

### Architecture (82)

| Strength | Gap |
|----------|-----|
| Single API prefix for AI admin policy/diagnostics | `ai-context-debug` parallel mount |
| Mature pipeline service layer (21 modules) | 1,322 LOC route file |
| No centralized-ai dependencies in pipeline code | No formal contract freeze doc in repo |

### Ownership (85)

| Strength | Gap |
|----------|-----|
| Explicit tier model (canonical/satellite/legacy) | ai-system still transitional launcher |
| Provider governance on pipeline hub | ai-context page still competes for diagnostics |
| Extraction register with priorities | No automated drift detection |

### Navigation (78 → 85)

| 0D-D improvement | Remaining |
|----------------|-----------|
| Removed ai-system provider-governance card | ai-context still in quick actions |
| Removed duplicate pipeline quick-action links | Full ai-system → launcher-only (0D-F) |
| Hub `PipelineHubToolSections` owns deep links | Context Debug link on hub footer |

### Service boundaries (80)

| Strength | Gap |
|----------|-----|
| No pipeline logic in `adminService` | Debug logic in separate route file |
| Registry/catalog in dedicated services | Twin service instantiated in route module |
| Suggestion services properly invoked | Thin-route extraction deferred 1B |

### Testing (35 → 65)

| Current | 0D-E target |
|---------|-------------|
| `adminPortalAiPipelineConsolidation.test.ts` (5) | `admin-portal-ai-pipeline.test.ts` (≥5 HTTP cases) |
| `adminPortalProviderGovernance.test.ts` | Catalog + policy smoke + diagnostics auth |
| Fence/hygiene tests from 0D-B | AP-F-030 partial closure |

### Documentation (90)

| Delivered (0D-D) | Pending |
|--------------------|---------|
| Surface map, capability matrix, ownership model | Operation matrix refresh (0D-G) |
| Extraction register, readiness scorecard | Stage 0D closeout doc |

---

## Readiness gates

| Gate | 0D-D | 0D-E | 0D-G |
|------|------|------|------|
| Pipeline undisputed canonical | **Pass** | — | — |
| Debug duplication resolved | — | Target | — |
| HTTP test evidence | — | Target | — |
| AP-F-029 closed | — | Target | Confirm |
| AP-F-030 partial/closed | Prep | Target | Confirm |
| AP-F-008 closed | — | — | Target |

---

## AP-AI-02 assessment

**Materially advanced:** Pipeline is documented, navigable, and bounded as the canonical AI admin control plane. Remaining AP-AI-02 work is **test evidence** (0D-E) and **legacy debug retirement** (0D-E/F) — explicitly out of 0D-D scope.

---

## Verification commands

```bash
# Handler count
node -e "const s=require('fs').readFileSync('server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts','utf8'); console.log([...s.matchAll(/router\\.(get|post|put|patch|delete)\\(\\s*['\\\"](\\/ai-pipeline[^'\\\"]*)['\\\"]/g)].length)"

# Hygiene tests
pnpm exec vitest run web/src/lib/__tests__/adminPortalAiPipelineConsolidation.test.ts
```
