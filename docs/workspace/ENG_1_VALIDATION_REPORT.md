# ENG-1 Validation Report

**Program:** Reference Workspace — ENG-1 Workspace Closure  
**Validation date:** 2026-06-19  
**Finding:** RWS-F1 / RWS-16 / CE-B1  
**Status:** **CLOSED** — targeted remediation executed

---

## ENG-1 charter

| Field | Value |
|-------|-------|
| **ID** | ENG-1 |
| **Title** | Business Place segment page |
| **Priority** | P0 |
| **QA case** | RWS-16 — Part 2H cross-surface matrix |
| **Finding register** | RWS-F1 |
| **Blocked** | Registration narrative; cross-surface canonical URL parity |

---

## Problem statement (historical)

| Field | Pre-remediation |
|-------|-----------------|
| **Expected** | `PlaceWorkspaceLanding` at `/business/:id/workspace/place` per [CROSS_SURFACE_TRANSITIONS.md](../architecture/CROSS_SURFACE_TRANSITIONS.md) §6 |
| **Observed** | **404 Page Not Found** at segment URL (2026-06-14 QA) |
| **Workaround** | `/business/:id/workspace?module=place` rendered publisher hub (PLC-04 PASS) |
| **Root cause** | Contract declares `segment: 'place'` (`routeKind: 'segment-switch'`) but **no** `workspace/place/page.tsx` existed — App Router requires route file |

**Corroboration:**

- [REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md](../architecture/audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md) §4
- `businessWorkspaceContracts.ts` — place `segment-switch`
- `buildBusinessWorkspaceModuleHref(businessId, 'place')` → `/workspace/place`
- Glob audit 2026-06-19 — **place/page.tsx missing** while chat/calendar/drive pages existed

---

## Remediation executed

| Action | Detail |
|--------|--------|
| **File added** | `web/src/app/business/[id]/workspace/place/page.tsx` |
| **Pattern** | Null deferral — identical to `chat/page.tsx`, `drive/page.tsx` |
| **Behavior** | `shouldRenderWorkspaceChildren('/workspace/place')` → **false** → `BusinessWorkspaceContent` switch renders `PlaceWorkspaceLanding` |
| **Scope** | Targeted — no contract changes, no navigation changes, no new capabilities |

```typescript
// Null deferral — switch mount authority unchanged
export default function BusinessWorkspacePlacePage() {
  return null;
}
```

---

## Validation evidence

| Check | Result |
|-------|--------|
| `businessWorkspaceRouteHygiene.test.ts` | **4/4 PASS** — place page includes null deferral markers |
| `businessWorkspaceNavigation.test.ts` | **15/15 PASS** — href `/workspace/place` |
| `crossSurfaceNavigation.test.ts` | **6/6 PASS** — `buildBusinessToPlacePublisherHref` |
| Segment in `businessWorkspaceSegmentSwitchSegments()` | ✅ `place` included |
| Switch case `place` in `BusinessWorkspaceContent.tsx` | ✅ Pre-existing |
| `WORKSPACE_CHILD_ROUTE_SEGMENTS` | ✅ `place` correctly **not** in set |

---

## Module mounting consistency

| Check | Status |
|-------|--------|
| Sidebar href uses `buildBusinessWorkspaceModuleHref(..., 'place')` | ✅ |
| Hub `BrandedWorkDashboard` card routing | ✅ |
| `crossSurfaceNavigation.buildBusinessToPlacePublisherHref` | ✅ |
| Personal → Business Place transition (RWS-12) | ✅ Pre-existing PASS |
| Segment URL now routable (RWS-16) | ✅ **Resolved** |

---

## Navigation & shell routing consistency

| Surface | Segment policy | Post ENG-1 |
|---------|----------------|------------|
| Business Place | `segment-switch` + null deferral page | ✅ Aligned |
| Business Chat | Same pattern | ✅ Parity |
| Business HR | `segment-page` + real children | ✅ Unchanged |
| Personal Place consumer | `/place` direct | ✅ Unchanged |

---

## Sidebar ownership

No sidebar changes required — `DashboardLayoutWrapper` already emitted correct href; failure was App Router missing route segment file only.

---

## Dashboard integration

Personal Dashboard → Business Place publisher transition (`crossSurfaceNavigation`) now lands on a **valid route** without 404. Widget escalation paths unchanged.

---

## ENG-1 completion determination

| Question | Answer |
|----------|--------|
| Is ENG-1 complete? | **Yes** |
| Is Place segment 404 resolved? | **Yes** — route file exists; switch mount renders landing |
| Re-run Part 2H RWS-16 required? | **Recommended** for QA evidence refresh — not blocking closure |
| Registration narrative unblocked? | **Yes** — primary P0 product gap closed |

---

## Residual monitoring

| Risk | Mitigation |
|------|------------|
| Future segment-switch module without `page.tsx` | Extend hygiene test to **require** page file (currently optional if missing) |
| Drift from contract | `businessWorkspaceRegistryDrift.test.ts` |

---

## Related

- [WORKSPACE_FINDINGS_REGISTER.md](./WORKSPACE_FINDINGS_REGISTER.md) — RWS-F1 closed
- [WORKSPACE_CERTIFICATION_READINESS.md](./WORKSPACE_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19
