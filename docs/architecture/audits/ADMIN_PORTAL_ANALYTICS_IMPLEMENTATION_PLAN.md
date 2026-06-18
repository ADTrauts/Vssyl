# Admin Portal Analytics Implementation Plan

**Program:** Stage 0C — AP-F-007  
**Date:** 2026-06-18  
**Complexity:** S (1 sprint)  
**Status:** **Complete**

---

## 1. Scope

Close AP-F-007 by rationalizing admin analytics ownership without new products, dashboards, or schema changes.

**Allowed:** redirects, nav cleanup, ownership enforcement, service delegation, documentation, registry, hygiene tests.  
**Not allowed:** new analytics frameworks, UX modernization (1A), unrelated findings.

---

## 2. Implementation phases (executed)

### Phase A — Assessment (complete)

- Inventory 12 analytics-related systems (see Reality Assessment)
- Classify canonical vs satellite vs retired
- Answer ten required questions in Executive Summary

### Phase B — Ownership registry (complete)

- `web/src/lib/adminAnalyticsOwnership.ts`
- Constants for canonical path, insights tab, retired BI path
- `ADMIN_ANALYTICS_SURFACES` array for governance

### Phase C — UI convergence (complete)

1. BI page → server redirect to insights tab
2. Analytics page → Overview + Strategic Insights tabs
3. Insights panel → strategic BI sections only (no duplicate overview cards)
4. AI System → remove platform chart fetches and ~550 lines of duplicate charts
5. Layout → single Platform Analytics nav entry

### Phase D — Verification (complete)

- `adminPortalAnalyticsOwnership.test.ts`
- Extend existing AI UX test expectations (no BI in quick actions — already present)
- Type-check / targeted vitest run

### Phase E — Governance closeout (complete)

- Seven audit deliverables
- Findings register updates
- Implementation package plan 0C status

---

## 3. Rollback

| Change | Rollback |
|--------|----------|
| BI redirect | Restore prior `business-intelligence/page.tsx` from git |
| Analytics tabs | Revert `analytics/page.tsx` |
| AI System charts | Revert `ai-system/page.tsx` (not recommended) |
| Nav | Re-add BI item in `layout.tsx` |

Low risk — no migrations or API contract breaks.

---

## 4. Residual items (non-blocking)

| Item | Owner | Notes |
|------|-------|-------|
| Dashboard deep-link to canonical analytics | Future hygiene | Summary cards acceptable as satellite |
| Operation matrix AP-OP-062+ BI label | Doc hygiene | APIs remain; UI canonical is analytics |
| G9 UX shell | 1A | AP-F-023–026 |

---

**Last updated:** 2026-06-18
