# Stage 1 Implementation Complexity Report

**Program:** Business Operations Stage 1 Engineering Blueprint  
**Status:** Complexity estimates — no implementation  
**Last updated:** 2026-06-14  
**Matrix:** [STAGE_1_FILE_TARGET_MATRIX.md](./STAGE_1_FILE_TARGET_MATRIX.md)

---

## Complexity by CO

| CO | Name | Overall | Implementation | Migration | Testing | Operational risk |
|----|------|---------|----------------|-----------|---------|------------------|
| CO-06 | FALSE POSITIVE Governance | **Low** | Low | None | None | Low |
| CO-05 | Identity Trust Hardening | **High** | High | Low (CO-04 dep) | Medium | High |
| CO-01 | Activity Standardization | **Medium** | Medium | None | Medium | Low |
| CO-02 | Notification Standardization | **Medium** | Medium | None | Medium | Low |
| CO-03 | Policy Engine Adoption | **High** | High | None | Medium | Medium |
| CO-04 | Global Trash Alignment | **High** | High | High | High | High |
| CO-07 | hrScheduleService Contract | **Low** | Low | None | Low | Low |

---

## CO-06 — FALSE POSITIVE Governance

**Overall: Low**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | Low | Single checklist document; no code |
| Migration | None | — |
| Testing | None | — |
| Operational risk | Low | Process gate only |

---

## CO-05 — Identity Trust Hardening

**Overall: High**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | High | `hrController.importEmployeesCSV` (~L3339) refactor; lifecycle symmetry across terminate/delete/position; multi-file touch |
| Migration | Low | Schema change deferred to CO-04; query filter updates |
| Testing | Medium | CSV regression; import idempotency; position assign symmetry |
| Operational risk | High | Production employee data; CSV import is high-traffic admin path |

**Implementation drivers:**

- CSV path currently bypasses `employeeManagementService`
- `terminateEmployee` vs `removeEmployeeFromPosition` asymmetry
- Org-chart route + `EmployeeManager.tsx` must stay sole EP write authority
- 6+ files modified; 2 new test suites

---

## CO-01 — Activity Standardization

**Overall: Medium**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | Medium | 2 new services; 6+ controller insertion points; envelope compliance |
| Migration | None | Uses existing activity log |
| Testing | Medium | 2 unit test files; emit-on-success assertions |
| Operational risk | Low | Additive; no behavior change to core flows |

**Implementation drivers:**

- Scheduling controllers emit **zero** activity today
- `hrController` emits **zero** activity today
- Pattern replication from Chat/Todo straightforward
- Ordering: emit only after successful commit

---

## CO-02 — Notification Standardization

**Overall: Medium**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | Medium | New scheduling service; manifest gaps in `builtInModuleManifests.ts`; 3 HR attendance emitters commented not implemented |
| Migration | None | Manifest sync via startup |
| Testing | Medium | Manifest reconciliation; recipient resolution for shift assignees |
| Operational risk | Low | Additive notifications; mis-routing is primary risk |

**Implementation drivers:**

- Scheduling has **zero** `NotificationService.createNotification` calls
- `notificationGroupingService.ts` maps only 2 hr types
- `web/src/app/notifications/page.tsx` needs type labels
- `workforce_*` hooks are doc-only (no complexity)

---

## CO-03 — Policy Engine Adoption

**Overall: High**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | High | `policyActions.ts` expansion; 2 dual evaluators; 2 route files with many endpoints |
| Migration | None | — |
| Testing | Medium | Dual middleware matrix (legacy/PE/both deny) |
| Operational risk | Medium | AuthZ regression if dual wiring wrong |

**Implementation drivers:**

- No Scheduling or HR actions registered today
- `scheduling.ts` and `hr.ts` have 40+ routes each
- Must preserve legacy permission behavior during transition
- Reference `todoPolicyDual.ts` / `calendarPolicyDual.ts` reduces novelty

---

## CO-04 — Global Trash Alignment

**Overall: High**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | High | 2 trash services; handler registration; replace hard deletes in `schedulingAdminController` (~L400,424,1302,1976) |
| Migration | High | `trashedAt` on scheduling models; `deletedAt` → `trashedAt` on HR; data backfill |
| Testing | High | trash/restore/purge; list query filters; cross-module integration |
| Operational risk | High | Irreversible purge; migration on employee + schedule data |

**Implementation drivers:**

- Scheduling lacks `trashedAt` entirely
- HR uses `deletedAt` not platform convention
- `registerGlobalTrashHandlers.ts` missing scheduling/hr
- `ScheduleStatus.ARCHIVED` disposition decision (M3)
- Web `GlobalTrashBin.tsx` partial `scheduleTrashed` hook exists

---

## CO-07 — hrScheduleService Contract

**Overall: Low**

| Dimension | Rating | Drivers |
|-----------|--------|---------|
| Implementation | Low | Documentation + JSDoc header; ~1,014 LOC service unchanged |
| Migration | None | — |
| Testing | Low | 1 contract test with mocks |
| Operational risk | Low | No runtime behavior change |

**Implementation drivers:**

- 7+ consumer files to document
- Contract test validates sync idempotency
- CO-04 dependency for trashed exclusion in sync

---

## Aggregate estimates

| Metric | Estimate |
|--------|----------|
| **Total files** | 62 (matrix rows) |
| **New server files** | 8 services + 2 dual auth + 14 tests ≈ 14–18 |
| **Migrations** | 2–3 |
| **Engineering person-days (rough)** | 25–40 across all COs |
| **Highest complexity COs** | CO-05, CO-04, CO-03 |
| **Lowest complexity COs** | CO-06, CO-07 |

---

## Complexity heat map

```
        Impl    Migr    Test    Ops
CO-06   ░░░     —       —       ░░░
CO-05   ███     ░░░     ▒▒▒     ███
CO-01   ▒▒▒     —       ▒▒▒     ░░░
CO-02   ▒▒▒     —       ▒▒▒     ░░░
CO-03   ███     —       ▒▒▒     ▒▒▒
CO-04   ███     ███     ███     ███
CO-07   ░░░     —       ░░░     ░░░

░░░ Low   ▒▒▒ Medium   ███ High
```

---

## Risk-complexity correlation

| Risk ID (from risk register) | CO | Complexity driver |
|------------------------------|-----|-------------------|
| R-01 | CO-04 | Migration data loss |
| R-02 | CO-05 | CSV regression |
| R-08 | CO-03 | Dual middleware ordering |
| R-10 | CO-04 | Orphan hard-delete callers |
| R-11 | CO-04 | ARCHIVED vs trashed |
