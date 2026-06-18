# BA-4 Approval Hierarchy Operation Matrix

**Program:** BA-4 — BA-F-005  
**Mount:** `/api/org-chart/approval-hierarchy`  
**Date:** 2026-06-18

---

## Operations

| Operation | Method | Route | PE action | Activity | Domain event | Auth |
|-----------|--------|-------|-----------|----------|--------------|------|
| List hierarchies | GET | `/approval-hierarchy/:businessId` | `orgchart:approval_hierarchy.read` | — | — | Member |
| Get entry detail | GET | `/approval-hierarchy/entries/:id` | `orgchart:approval_hierarchy.read` | — | — | Member |
| Create entry | POST | `/approval-hierarchy` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_created` | `approval_hierarchy.created` | Manage |
| Update entry | PATCH | `/approval-hierarchy/:id` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_updated` | `approval_hierarchy.updated` | Manage |
| Delete entry | DELETE | `/approval-hierarchy/:id` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_deleted` | `approval_hierarchy.deleted` | Manage |
| Assign to employee | POST | `/approval-hierarchy/assign/employee` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_assigned` | `approval_hierarchy.assigned` | Manage |
| Assign to position | POST | `/approval-hierarchy/assign/position` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_assigned` | `approval_hierarchy.assigned` | Manage |
| Assign to department | POST | `/approval-hierarchy/assign/department` | `orgchart:approval_hierarchy.write` | `approval_hierarchy_assigned` | `approval_hierarchy.assigned` | Manage |
| Resolve chain | GET | `/approval-hierarchy/resolve/:businessId/:employeePositionId` | `orgchart:approval_hierarchy.read` | — | — | Member |
| Validate integrity | GET | `/approval-hierarchy/validate/:businessId` | `orgchart:approval_hierarchy.read` | `approval_hierarchy_validated` | `approval_hierarchy.validated` | Member |

---

## Request shapes

### Create / assign (employee)

```json
{
  "businessId": "uuid",
  "employeePositionId": "uuid",
  "managerPositionId": "uuid",
  "approvalTypes": ["time-off", "expenses"],
  "approvalLevel": 1,
  "isPrimary": true,
  "active": true
}
```

### Assign to position

```json
{
  "businessId": "uuid",
  "positionId": "uuid",
  "managerPositionId": "uuid",
  "approvalTypes": ["time-off"]
}
```

### Assign to department

```json
{
  "businessId": "uuid",
  "departmentId": "uuid",
  "managerPositionId": "uuid",
  "approvalTypes": ["time-off"]
}
```

---

## Validation codes

| Code | Meaning |
|------|---------|
| `SELF_APPROVAL` | Employee and manager positions identical |
| `INVALID_EMPLOYEE_POSITION` | Employee position not in business |
| `INVALID_MANAGER_POSITION` | Manager position not in business |
| `INACTIVE_EMPLOYEE_POSITION` | Active hierarchy → inactive employee |
| `INACTIVE_MANAGER_POSITION` | Active hierarchy → inactive manager |
| `EMPTY_APPROVAL_TYPES` | No approval types on entry |
| `DUPLICATE_PRIMARY` | Multiple primary for same type/level |

---

## Test coverage map

| Test file | Coverage |
|-----------|----------|
| `approvalHierarchyService.test.ts` | CRUD, assign, resolve, validate, activity hooks |
| `approvalHierarchyActivityService.test.ts` | Activity actions |
| `approvalHierarchy.integration.test.ts` | HTTP + PE deny + activity |
| `approvalHierarchyPolicy.test.ts` | PE dual read/write |

---

## Related

- [BA_4_APPROVAL_HIERARCHY_ARCHITECTURE.md](./BA_4_APPROVAL_HIERARCHY_ARCHITECTURE.md)
