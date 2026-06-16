# CO-05 Identity Trust Hardening — Engineering Blueprint

**CO:** CO-05 (G02)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [IDENTITY_TRUST_HARDENING_PLAN.md](./IDENTITY_TRUST_HARDENING_PLAN.md)  
**Authority:** [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)

---

## Purpose

Engineering scope to close identity trust gaps: CSV import bypass, lifecycle asymmetry, and `EmployeePosition` authority path. No ownership or identity architecture changes.

---

## Work packages (engineering mapping)

| WP | Engineering deliverable |
|----|-------------------------|
| WP-05-01 | `importEmployeesCSV` delegates to `employeeManagementService` |
| WP-05-02 | `terminateEmployee` / `deleteEmployee` lifecycle symmetry |
| WP-05-03 | `assignEmployeeToPosition` / `removeEmployeeFromPosition` audit + activity hooks (CO-01 dependency) |
| WP-05-04 | Org-chart route + `EmployeeManager.tsx` alignment |
| WP-05-05 | Consumer matrix documentation in code comments / contract doc |

---

## EmployeePosition authority path

**Canonical write path:** Org Chart → `employeeManagementService` → Prisma `EmployeePosition`

```
web/src/components/org-chart/EmployeeManager.tsx
  → web/src/api/org-chart.ts (or equivalent client)
    → server/src/routes/org-chart.ts (~L608 assign/remove routes)
      → server/src/services/employeeManagementService.ts
        → assignEmployeeToPosition (L90)
        → removeEmployeeFromPosition (L169)
          → prisma EmployeePosition / EmployeeOrgAssignment
```

**Stage 1 modifications:**

| File | Function / area | Change |
|------|-----------------|--------|
| `employeeManagementService.ts` | `assignEmployeeToPosition` | Ensure single authority; add structured logging; optional activity emit (CO-01) |
| `employeeManagementService.ts` | `removeEmployeeFromPosition` | Symmetric lifecycle with assign; no direct Prisma bypass |
| `server/src/routes/org-chart.ts` | Assign/remove handlers | Route only through service; no inline Prisma writes |
| `EmployeeManager.tsx` | Position assign UI | Confirm API calls hit org-chart routes only |

---

## CSV import path

**Current (non-compliant):**

```
server/src/routes/hr.ts
  → POST /admin/employees/import (~L76)
    → hrController.importEmployeesCSV (~L3339)
      → Direct Prisma / inline position creation (bypasses employeeManagementService)
```

**Target path:**

```
hrController.importEmployeesCSV
  → employeeManagementService.importEmployeesFromCSV (NEW or extended)
    → assignEmployeeToPosition (per row)
    → EmployeeHRProfile create/update (HR-owned)
```

| File | Change type |
|------|-------------|
| `server/src/controllers/hrController.ts` | MODIFY — `importEmployeesCSV` delegate |
| `server/src/services/employeeManagementService.ts` | MODIFY — add `importEmployeesFromCSV` |
| `server/src/routes/hr.ts` | MODIFY — no route change; middleware unchanged |

---

## Lifecycle ownership path

| Action | Owner | Current handler | Target |
|--------|-------|-----------------|--------|
| Terminate | HR | `hrController.terminateEmployee` (~L1942) | Service-mediated; soft lifecycle |
| Delete employee | HR | `hrController.deleteEmployee` | Align with `trashedAt` (CO-04) |
| Remove from position | Org Chart | `removeEmployeeFromPosition` | Symmetric with assign |
| HR profile soft delete | HR | `deletedAt` on `EmployeeHRProfile` | Migrate to `trashedAt` (CO-04) |

| File | Function | Line ref (inspection) |
|------|----------|----------------------|
| `hrController.ts` | `terminateEmployee` | ~L1942 |
| `hrController.ts` | `deleteEmployee` | route L66 |
| `hrController.ts` | `deletedAt` usage | ~L1010 |
| `hrAttendanceService.ts` | Employee lookups | Verify `deletedAt` filter → `trashedAt` (CO-04 dep) |

---

## Consumer matrix

| Consumer | Reads EP? | Writes EP? | Stage 1 action |
|----------|-----------|------------|----------------|
| **Org Chart** | Yes | **Yes (authority)** | No bypass in routes |
| **HR CSV import** | Yes | **Yes (fix)** | Delegate to service |
| **HR terminate** | Yes | Indirect | Lifecycle via service |
| **Scheduling** | Yes (shift assign) | No | Read-only; no EP writes |
| **Calendar** | Via bridge | No | Read-only |
| **hrScheduleService** | Yes | No | Document consumer (CO-07) |
| **Chat / WC** | No | No | Out of scope |

---

## Models

| Model | Schema file | CO-05 change |
|-------|-------------|--------------|
| `EmployeePosition` | `prisma/modules/org-chart/` or HR core | No schema change in CO-05 alone |
| `EmployeeHRProfile` | `prisma/modules/hr/core.prisma` | `deletedAt` — CO-04 migration |
| `EmployeeOrgAssignment` | org-chart module | Verify cascade rules |

---

## Services

| Service | Path | Change |
|---------|------|--------|
| `employeeManagementService.ts` | `server/src/services/` | CREATE/MODIFY import + lifecycle |
| `hrController.ts` | `server/src/controllers/` | MODIFY import, terminate, delete |

---

## Controllers & routes

| Controller | Routes file | Endpoints |
|------------|-------------|-----------|
| `hrController.ts` | `server/src/routes/hr.ts` | `POST /admin/employees/import`, `POST .../terminate`, `DELETE .../employees/:id` |
| org-chart handlers | `server/src/routes/org-chart.ts` | Position assign/remove (~L608) |

---

## Imports / dependencies

| From | To | Notes |
|------|-----|-------|
| `hrController` | `employeeManagementService` | Add import for CSV + lifecycle |
| `org-chart routes` | `employeeManagementService` | Verify existing |
| `scheduling controllers` | `EmployeePosition` (read) | No write additions |

---

## Migrations

**None in CO-05 alone.** `EmployeeHRProfile.deletedAt` → `trashedAt` is CO-04 (M2).

---

## Tests

| Test file (CREATE) | Scope |
|--------------------|-------|
| `server/src/services/__tests__/employeeManagementService.identity.test.ts` | assign/remove symmetry |
| `server/src/controllers/__tests__/hrController.import.test.ts` | CSV delegates to service |
| Extend `server/src/__tests__/scheduling-tenant-scope.integration.test.ts` | EP read scoping unchanged |

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | CO-06 checklist available; identity architecture docs frozen |
| **Exit** | CSV path uses `employeeManagementService`; terminate/delete symmetric; org-chart sole EP write authority; consumer matrix documented |

---

## Assumptions

- Org Chart remains sole `EmployeePosition` write authority.
- HR owns `EmployeeHRProfile` lifecycle; position assignment is delegated.
- No new identity models in Stage 1.

---

## Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R-02 | CSV regression | Import test + staging dry-run |
| R-03 | Lifecycle data loss | Soft delete only; CO-04 trash alignment |

---

## Dependencies

| Dependency | Reason |
|------------|--------|
| CO-04 | `deletedAt` → `trashedAt` for HR profile |
| CO-01 | Optional activity emit on assign/remove |
| None | CSV delegation can start independently |

---

## Verification criteria

- [ ] `grep` shows no direct `EmployeePosition.create` in `importEmployeesCSV`
- [ ] All EP writes trace to `employeeManagementService`
- [ ] Terminate and delete use consistent soft-lifecycle pattern
- [ ] Consumer matrix documented in blueprint + code comments
- [ ] Identity tests pass
