# Admin Portal — AI Context Debug Disposition

**Package:** 0D-E — Diagnostics & Evaluation Consolidation  
**Finding:** AP-F-029  
**Date:** 2026-06-17  
**Mount:** `/api/ai-context-debug` (6 handlers)

---

## Disposition legend

| Action | Meaning in 0D-E |
|--------|-----------------|
| **MERGE** | Capability absorbed by pipeline route/UI; legacy endpoint transitional |
| **KEEP** | Remains until pipeline parity; Deprecation header added |
| **REDIRECT** | UI redirect only (0D-F) |
| **RETIRE** | 410 or delete — not in 0D-E |

---

## Endpoint disposition

| # | Endpoint | Disposition | Target destination | Parity | 0D-E action |
|---|----------|-------------|-------------------|--------|-------------|
| 1 | `GET /user/:userId` | **MERGE** | `GET /api/admin-portal/ai-pipeline/diagnostics?userId=` + trace detail | Partial — diagnostics filters by user; lacks personality/autonomy bundle | Deprecation header |
| 2 | `GET /session/:sessionId` | **MERGE** | `GET /api/admin-portal/ai-pipeline/diagnostics` (trace metadata) | Partial — session correlation via trace/history | Deprecation header |
| 3 | `POST /validate` | **KEEP** | `/admin-portal/ai-pipeline/test-lab` (future validate panel) | **Gap** — no pipeline validate equivalent | Deprecation header; retain endpoint |
| 4 | `GET /cross-module/:userId` | **MERGE** | `POST /ai-pipeline/context-providers/health` + trace module context | Partial — health probe ≠ full module map | Deprecation header |
| 5 | `GET /stats` | **MERGE** | `GET /api/admin-portal/ai-pipeline/quality/stats` | Partial — overlapping adoption metrics | Deprecation header |
| 6 | `POST /assemble` | **MERGE** | `GET /ai-pipeline/diagnostics/:traceId/evidence` + test-lab | Partial — density report in evidence/test-lab | Deprecation header |

---

## UI disposition

| Surface | Disposition | Target | Phase |
|---------|-------------|--------|-------|
| `/admin-portal/ai-context` (5 tabs) | **REDIRECT** | `/admin-portal/ai-pipeline/diagnostics` | 0D-F |
| `web/src/api/aiContextDebug.ts` | **RETIRE** (client) | `adminApiService` pipeline methods | After UI redirect |
| 5 tab components | **RETIRE** | Pipeline trace/evidence panels | 0D-F |

---

## 0D-E implementation

| Change | File |
|--------|------|
| Transitional middleware | `server/src/middleware/aiContextDebugTransitional.ts` |
| Mount middleware | `server/src/index.ts` |
| Transitional banner | `ai-context/page.tsx` |
| Hub link update | `PipelineOperationsHub.tsx` → Response Diagnostics |
| Tests | `aiContextDebugTransitional.test.ts` |

**No endpoint deleted in 0D-E.** No functional redesign.

---

## Gap register (for 0D-F / 1B)

| Gap | Endpoint | Resolution options |
|-----|----------|-------------------|
| Context validation checks | `POST /validate` | Add pipeline validate route OR fold into test-lab |
| Rich user context bundle | `GET /user/:userId` | Enrich diagnostics user panel OR keep read-only debug API |
| Cross-module file/chat counts | `GET /cross-module/:userId` | Pipeline module context summary widget |

---

## Successor header mapping

Implemented in `AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES` — each response includes:

- `Deprecation: true`
- `Link: <successor>; rel="successor-version"`
- `X-AI-Context-Debug-Disposition: MERGE|KEEP`

---

**Conclusion:** All six endpoints dispositioned; pipeline is documented successor; full UI/API retirement deferred to **0D-F** without blocking current operators.
