# Admin Portal — AI Context Debug Final Assessment

**Package:** 0D-G — AI Administration Readiness Review & Legacy Retirement Closure  
**Finding:** AP-F-029 (API tail)  
**Date:** 2026-06-17  
**Mount:** `/api/ai-context-debug` (6 handlers)

---

## Executive summary

The ai-context-debug mount is **transitional only**. UI duplication was **retired in 0D-F**. API endpoints remain **live with Deprecation headers** because pipeline parity gaps exist on validation and rich context bundles. **No large migration performed in 0D-G** per package scope.

**Recommendation:** **RETAIN transitional** until **1B Governance Architecture** merges or gates remaining endpoints.

---

## Current usage

| Consumer | Status |
|----------|--------|
| Admin portal web client | **0** — `aiContextDebug.ts` deleted (0D-F) |
| `/admin-portal/ai-context` UI | **Redirect** → pipeline diagnostics |
| Direct API callers (grep) | **0** in `web/`; mount + tests in `server/` |
| Support / ops scripts | **Unknown** — no repo evidence |

**Runtime usage:** Effectively **dormant** from product UI; mount exists for API compatibility and transitional ops access.

---

## Endpoint final assessment

| # | Endpoint | 0D-E disposition | **0D-G verdict** | Replacement |
|---|----------|------------------|----------------|-------------|
| 1 | `GET /user/:userId` | MERGE | **TRANSITIONAL** | `GET /ai-pipeline/diagnostics?userId=` + trace detail |
| 2 | `GET /session/:sessionId` | MERGE | **TRANSITIONAL** | Pipeline diagnostics trace correlation |
| 3 | `POST /validate` | KEEP | **RETAIN** | Test lab validate panel (gap) |
| 4 | `GET /cross-module/:userId` | MERGE | **TRANSITIONAL** | Context provider health + trace module context |
| 5 | `GET /stats` | MERGE | **TRANSITIONAL** | `GET /ai-pipeline/quality/stats` |
| 6 | `POST /assemble` | MERGE | **TRANSITIONAL** | Diagnostics evidence + test-lab dry-run |

### Category summary

| Category | Count |
|----------|-------|
| Transitional (Deprecation headers, merge candidate) | 5 |
| Retain until pipeline parity | 1 (`POST /validate`) |
| Retire now | **0** — parity gaps block safe deletion |

---

## Replacement surfaces (canonical)

| Capability | Canonical surface |
|------------|-------------------|
| Operator diagnostics | `/admin-portal/ai-pipeline/diagnostics` |
| Trace evidence | `GET /api/admin-portal/ai-pipeline/diagnostics/:traceId/evidence` |
| Quality stats | `GET /api/admin-portal/ai-pipeline/quality/stats` |
| Evaluation | `/admin-portal/ai-pipeline/test-lab` |
| Module context health | `POST /api/admin-portal/ai-pipeline/context-providers/health` |

---

## Remaining gaps (1B scope)

| Gap | Endpoint | Risk if retired now |
|-----|----------|---------------------|
| Context validation checks | `POST /validate` | Ops lose validate-only workflow |
| Rich user personality/autonomy bundle | `GET /user/:userId` | Diagnostics user filter lacks full bundle |
| Cross-module file/chat counts | `GET /cross-module/:userId` | Health probe ≠ full module map |

---

## Retirement recommendation

| Action | Phase | Rationale |
|--------|-------|-----------|
| Keep mount + transitional middleware | **Now (0D-G)** | Zero UI consumers; headers document successors |
| Add pipeline validate route or test-lab panel | **1B** | Closes `POST /validate` retain |
| 410 individual merged endpoints | **1B** | After parity verification |
| Delete `ai-context-debug.ts` | **1B+** | After all six dispositioned |

**Do not delete mount in 0D-G** — would break transitional ops access without pipeline parity.

---

## Test evidence

| File | Cases | Coverage |
|------|-------|----------|
| `aiContextDebugTransitional.test.ts` | 9 | All 6 handlers emit Deprecation + disposition headers |
| `admin-portal-ai-pipeline.test.ts` | 8 | Diagnostics + quality/stats successors |

---

## AP-F-029 contribution

| Criterion | Status |
|-----------|--------|
| Diagnostics ownership explicit | **Yes** |
| Duplicate diagnostics UX removed | **Yes** (0D-F) |
| Canonical diagnostics route | **Yes** |

**UX/API split:** Operator UX criteria → **CLOSED**. API mount → **transitional advisory** tracked in 1B, not blocking AP-F-029 closure per 0D scope.

---

## References

- [ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md](./ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md)
- [ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md](./ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md)
- [ADMIN_PORTAL_AI_CONTEXT_RETIREMENT_REPORT.md](./ADMIN_PORTAL_AI_CONTEXT_RETIREMENT_REPORT.md)
