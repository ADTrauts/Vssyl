# Admin Portal — AI Context UX Retirement Report

**Package:** 0D-F — AI Control Plane UX Consolidation  
**Date:** 2026-06-17  
**Finding:** AP-F-029 (UI tail), AP-F-008 (navigation)  
**Canonical destination:** `/admin-portal/ai-pipeline/diagnostics`

---

## Summary

The legacy `/admin-portal/ai-context` five-tab debug surface is **retired**. All operator diagnostics and evaluation forensics flow through **AI Pipeline → Response Diagnostics**. Deep links preserve `traceId`, `sessionId`, and `userId` query parameters where applicable.

---

## Redirects

| Source | Destination | Mechanism |
|--------|-------------|-----------|
| `/admin-portal/ai-context` | `/admin-portal/ai-pipeline/diagnostics` | `web/src/app/admin-portal/ai-context/page.tsx` server `redirect()` |
| `/admin-portal/ai-context?*` | `/admin-portal/ai-pipeline/diagnostics?*` | `web/src/middleware.ts` (query preserved) |

### Deep-link mapping

| Legacy param | Pipeline param | Notes |
|--------------|----------------|-------|
| `traceId` | `traceId` | Direct |
| `sessionId` | `traceId` | Session treated as trace selector |
| `userId` | `userId` | Pre-fills diagnostics user filter |
| `tab` | — | Tab intent dropped; all tabs superseded by pipeline trace/evidence |

---

## Removed

| Asset | Type | Rationale |
|-------|------|-----------|
| `web/src/components/admin-portal/UserContextInspector.tsx` | Component | Duplicate of pipeline diagnostics + trace detail |
| `web/src/components/admin-portal/AIReasoningViewer.tsx` | Component | Superseded by `PipelineTraceDetail` evidence |
| `web/src/components/admin-portal/ContextValidationTools.tsx` | Component | Validation via test-lab + pipeline quality |
| `web/src/components/admin-portal/CrossModuleContextMap.tsx` | Component | Module context via `ContextProviderHealthPanel` |
| `web/src/components/admin-portal/RealTimeContextMonitor.tsx` | Component | Ops monitoring via pipeline hub |
| `web/src/api/aiContextDebug.ts` | Client API | No UI consumers; pipeline uses `adminApiService` |

**LOC retired (approx.):** ~65 KB across 6 files.

---

## Redirected (route stub preserved)

| Asset | Status |
|-------|--------|
| `web/src/app/admin-portal/ai-context/page.tsx` | Minimal redirect stub (~25 LOC) — bookmark compatibility |

---

## Preserved (canonical)

| Asset | Role |
|-------|------|
| `web/src/app/admin-portal/ai-pipeline/diagnostics/page.tsx` | Canonical diagnostics UI |
| `web/src/components/admin-portal/ai-pipeline/PipelineTraceTable.tsx` | Trace list |
| `web/src/components/admin-portal/ai-pipeline/PipelineTraceDetail.tsx` | Trace/evidence detail |
| `web/src/components/admin-portal/ai-pipeline/PipelineOperationsHub.tsx` | Hub link to diagnostics |
| `server/src/routes/ai-context-debug.ts` | Transitional API (Deprecation headers — 0D-E); mount shrink deferred 0D-G / 1B |
| `web/src/app/admin-portal/modules/page.tsx` (`ai-context` tab) | **Module certification** surface — distinct from retired admin debug UX |

---

## Navigation pathways removed

| Removed pathway | Former target |
|-----------------|---------------|
| ai-system `context-debug` system card | `/admin-portal/ai-context` |
| ai-system Quick Action "Debug AI Context" | `/admin-portal/ai-context` |
| Pipeline hub footer ai-context link | Removed in 0D-E |

---

## Tests

| File | Coverage |
|------|----------|
| `web/src/lib/__tests__/adminPortalAiControlPlaneUx.test.ts` | Redirect, component removal, launcher integrity |
| `web/src/lib/__tests__/adminPortalDiagnosticsOwnership.test.ts` | Updated redirect assertion |

---

## AP-F-029 UI closure

| Criterion | Status |
|-----------|--------|
| ai-context page retired | **Done** |
| Duplicate tab components removed | **Done** |
| Single diagnostics destination | **Done** |
| API mount merge | Deferred 0D-G / 1B (transitional middleware remains) |

**Verdict:** AP-F-029 **substantially closed** for operator UX. API consolidation remains on 0D-G / 1B track.

---

## References

- [ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md](./ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md)
- [ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md](./ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md)
- [ADMIN_PORTAL_AI_NAVIGATION_MATRIX.md](./ADMIN_PORTAL_AI_NAVIGATION_MATRIX.md)
