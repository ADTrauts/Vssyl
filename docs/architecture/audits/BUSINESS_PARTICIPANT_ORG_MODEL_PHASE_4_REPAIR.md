# Business Participant & Organizational Model — Phase 4 Repair

**Status:** NON-authoritative evidence/history  
**Date:** 2026-09-08  
**Program:** Business Participant & Role-Aware Experience  
**Phase:** 4 — Targeted Business Administration Org-Chart Repair  
**Baseline HEAD:** `6a38bac233d9a3ee8fa64fce24af9949c8b24524`  
**Constraint:** Repair existing BA org-chart UI ↔ backend contracts only. No org-model redesign, role-aware UX, PE migration, multi-position product decision, Responsibility model, or module-install changes.

**Canonical composition:** [`../BUSINESS_PARTICIPANT_COMPOSITION.md`](../BUSINESS_PARTICIPANT_COMPOSITION.md)  
**Phase 3:** [`BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_3_RUNTIME.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_3_RUNTIME.md)

---

## 1. Scope

Evidence-backed frontend/API contract repairs for Business Administration organizational tools:

- EmployeePosition assign / remove / transfer request contracts
- Position field normalization (`title`, `maxOccupants`, `active`, `startDate`)
- 204-safe delete parsing
- Reporting mutation via shared org-chart API helper
- Occupancy/vacancy display from canonical fields
- Synthetic `member-*` guards on mutate paths
- Narrow server support: DELETE remove query params; soft-remove reactivation on re-assign (unique constraint)

Out of scope: permission systems, front-page `await`, PE architecture, WC audience product semantics, approval hierarchy product wiring.

---

## 2. Baseline

| Item | Value |
|------|-------|
| Branch | `main` |
| Initial HEAD / origin/main | `6a38bac23` (aligned) |
| Unrelated dirty work | Preserved (deploy/auth/GTM/etc.) — not staged |
| Shared proxy (`[...slug]`) | **Not modified** (unrelated dirty risk + query-string DELETE preferred) |
| Browser E2E | **SKIPPED** (no authenticated local BA session this phase) |

---

## 3. Repairs completed

### Assignment `effectiveDate` → `startDate`

| | |
|--|--|
| **Defect** | UI/API sent `effectiveDate`; server expects `startDate` |
| **Previous** | Stale client field → validation/persistence failure |
| **Corrected** | `assignEmployeeToPosition` sends `startDate`; route validates/coerces |
| **Files** | `web/src/api/orgChart.ts`, `web/src/components/org-chart/EmployeeManager.tsx`, `server/src/routes/org-chart.ts` |

### Removal POST → DELETE (+ proxy-safe transport)

| | |
|--|--|
| **Defect** | Client used POST; route is DELETE; Next proxy may omit DELETE bodies |
| **Previous** | Remove failed at method/body boundary |
| **Corrected** | Client `DELETE` with `userId`/`positionId`/`businessId` query; server `fromBodyOrQuery` |
| **Files** | `web/src/api/orgChart.ts`, `server/src/routes/org-chart.ts` |

### Soft-remove re-assign (unique constraint)

| | |
|--|--|
| **Defect** | Soft-remove leaves inactive row; `@@unique([userId, positionId, businessId])` blocked re-create |
| **Previous** | Assign after remove to same seat → 500 |
| **Corrected** | `assignEmployeeToPosition` reactivates inactive row (preserves soft-delete history semantics) |
| **Files** | `server/src/services/employeeManagementService.ts` |

### Position field contract + edit

| | |
|--|--|
| **Defect** | Aliases `name`/`capacity`/`isActive`/`currentEmployees`/`effectiveDate` |
| **Previous** | Create mapped; edit/display used stale names |
| **Corrected** | Canonical `title` / `maxOccupants` / `active` / `startDate`; occupancy derived |
| **Files** | `web/src/api/orgChart.ts`, `OrgChartBuilder.tsx`, `EmployeeManager.tsx`, `StationsAndPositionsEditor.tsx` (mechanical), `AudiencePicker.tsx` (`title` only) |

### 204-safe deletes

| | |
|--|--|
| **Defect** | `response.json()` on HTTP 204 |
| **Previous** | Client parse crash after successful delete |
| **Corrected** | `authenticatedApiCall` returns on 204/205/empty; org-chart DELETE helpers normalize `{ success: true }` |
| **Files** | `web/src/lib/apiUtils.ts`, `web/src/api/orgChart.ts` |

### Reporting mutation

| | |
|--|--|
| **Defect** | `OrgChartVisualView` bespoke `fetch` bypassed shared helper |
| **Previous** | Cookie/proxy-dependent ad-hoc path |
| **Corrected** | `updatePosition(..., session.accessToken)` via org-chart API |
| **Files** | `web/src/components/org-chart/OrgChartVisualView.tsx` |

### Occupancy / BCC

| | |
|--|--|
| **Defect** | Display/lookup used `isActive` / stale capacity fields |
| **Previous** | Wrong vacancy/occupancy |
| **Corrected** | `active` + `countActiveOccupants` / nested `employeePositions` |
| **Files** | `EmployeeManager.tsx`, `OrgChartBuilder.tsx`, `OrgChartVisualView.tsx`, `BusinessConfigurationContext.tsx` |

### Synthetic member safety

| | |
|--|--|
| **Defect** | Risk of submitting `member-*` as EmployeePosition id |
| **Previous** | No client guard |
| **Corrected** | `isSyntheticEmployeeRowId` / `assertRemovablePlacement` on assign/remove/transfer |
| **Files** | `web/src/api/orgChart.ts`, `EmployeeManager.tsx` |

---

## 4. Assignment / removal / transfer

| Flow | Result |
|------|--------|
| Assign | Sends `startDate`; route coerces Date; create or reactivate |
| Remove | `DELETE` + query; soft-deactivate unchanged |
| Transfer | Existing UI + API; client maps UI date → server `effectiveDate` (route contract); no new UX |

---

## 5. Position field normalization

Canonical at API boundary: `title`, `maxOccupants`, `active`, `startDate`, nullable `positionId` on synthetic rows. Occupancy derived — not a second schema.

---

## 6. Occupancy / vacancy

UI distinguishes empty / partial / full via `countActiveOccupants` and `maxOccupants`; inactive assignments excluded via `active`.

---

## 7. Reporting mutation

Uses shared `updatePosition` + session access token. Cookie → Next proxy → Bearer architecture **unchanged**. No server auth changes.

---

## 8. Synthetic-member safety

Guard **needed: YES** (unsafe path was possible). Assign/remove/transfer reject synthetic ids. Adapter retained; WC audience semantics unchanged aside from `title` display mapping.

---

## 9. Tests

| Suite | Result |
|-------|--------|
| `web` `orgChart.contracts.test.ts` + BCC | Pass (18) |
| `server` org-chart integration + policy/activity | Pass |
| `server` `employeeManagementService.identity` (incl. reactivation) | Pass |
| Web / server `tsc --noEmit` | Pass |
| `pnpm security:secrets` | Pass |

---

## 10. Browser/runtime verification

**SKIPPED** — no authenticated local BA browser session. Contract coverage via unit/integration tests.

---

## 11. Explicitly deferred findings

| Item | Status |
|------|--------|
| Front-page `requiredPermission` missing `await` | Deferred (permission migration risk) |
| Org JSON RBAC expansion / PE migration | Deferred |
| Multi-position product behavior | Deferred |
| WC BUSINESS audience (members vs positions) | Deferred |
| Approval hierarchy product UI | Deferred |
| Long-term synthetic adapter redesign | Deferred |

---

## 12. Business Admin org-chart readiness

**READY_WITH_KNOWN_GAPS**

Foundation contracts for structure CRUD, placement assign/remove, transfer (existing UI), reporting update, occupancy display, and deletes are repaired and tested. Remaining gaps are deferred product/authz items above and lack of live browser E2E in this phase — not blocking role-aware **product modeling** discussion, but live BA smoke is still recommended before treating placement UX as production-certified.
