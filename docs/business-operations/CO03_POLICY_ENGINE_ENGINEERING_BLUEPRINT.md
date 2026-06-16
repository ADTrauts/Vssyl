# CO-03 Policy Engine Adoption — Engineering Blueprint

**CO:** CO-03 (G05)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [POLICY_ENGINE_ADOPTION_PLAN.md](./POLICY_ENGINE_ADOPTION_PLAN.md)  
**Architecture:** `docs/architecture/POLICY_ENGINE.md`

---

## Purpose

Engineering scope to register Scheduling and HR policy domains/actions, implement Policy Dual evaluators, and wire route middleware. Legacy `schedulingPermissions.ts` / `hrPermissions.ts` remain during transition.

---

## Work packages (engineering mapping)

| WP | Deliverable |
|----|-------------|
| WP-03-01 | Expand `policyActions.ts` with SCHEDULING_* and HR_* |
| WP-03-02 | CREATE `schedulingPolicyDual.ts` |
| WP-03-03 | CREATE `hrPolicyDual.ts` |
| WP-03-04 | Wire dual middleware on scheduling routes |
| WP-03-05 | Wire dual middleware on HR routes |
| WP-03-06 | Policy dual tests |

---

## Policy domains

| Domain constant | moduleId | Scope field |
|-----------------|----------|-------------|
| `SCHEDULING` | `scheduling` | `businessId` |
| `HR` | `hr` | `businessId` |

---

## Policy actions (policyActions.ts expansion)

**File:** `server/src/auth/policyActions.ts`

### Scheduling actions (CREATE constants)

| Action | Legacy permission | Routes |
|--------|-------------------|--------|
| `SCHEDULING_SCHEDULE_READ` | admin/team/employee read | GET schedules |
| `SCHEDULING_SCHEDULE_WRITE` | admin create/update | POST/PUT schedules |
| `SCHEDULING_SCHEDULE_DELETE` | admin delete | DELETE schedules |
| `SCHEDULING_SCHEDULE_PUBLISH` | admin + team publish | POST .../publish |
| `SCHEDULING_SHIFT_WRITE` | admin shift CRUD | shift routes |
| `SCHEDULING_SHIFT_DELETE` | admin shift delete | DELETE shifts |
| `SCHEDULING_SWAP_MANAGE` | admin swap approve/deny | swap admin routes |
| `SCHEDULING_SWAP_REQUEST` | employee swap create | employee swap POST |
| `SCHEDULING_TEMPLATE_WRITE` | template CRUD | template routes |
| `SCHEDULING_STATION_WRITE` | station/location admin | station routes |

### HR actions (CREATE constants)

| Action | Legacy permission | Routes |
|--------|-------------------|--------|
| `HR_EMPLOYEE_READ` | admin/team read | GET employees |
| `HR_EMPLOYEE_WRITE` | admin create/update | POST/PUT employees |
| `HR_EMPLOYEE_DELETE` | admin delete | DELETE employees |
| `HR_EMPLOYEE_TERMINATE` | admin terminate | POST .../terminate |
| `HR_EMPLOYEE_IMPORT` | admin CSV import | POST .../import |
| `HR_TIME_OFF_READ` | team/admin calendar | time-off routes |
| `HR_TIME_OFF_APPROVE` | manager approve | team approve |
| `HR_ONBOARDING_MANAGE` | admin onboarding | onboarding routes |
| `HR_ATTENDANCE_MANAGE` | admin attendance | attendance routes |
| `HR_SETTINGS_WRITE` | admin settings | settings routes |

---

## Policy Dual insertion points

### Reference patterns (read-only)

| File | Module |
|------|--------|
| `server/src/auth/todoPolicyDual.ts` | Todo |
| `server/src/auth/drivePolicyDual.ts` | Drive |
| `server/src/auth/calendarPolicyDual.ts` | Calendar |

### New dual evaluators (CREATE)

**`server/src/auth/schedulingPolicyDual.ts`**

```typescript
// Pattern: evaluateSchedulingPolicy(action, req) → legacy OR policyEngine.authorize
export function checkSchedulingPolicy(action: PolicyAction) { ... }
```

**`server/src/auth/hrPolicyDual.ts`**

```typescript
export function checkHRPolicy(action: PolicyAction) { ... }
```

**Dual semantics:** Legacy middleware passes → allow. Legacy fails → consult `policyEngine.authorize()`. Both fail → 403.

---

## Middleware targets

### Scheduling routes

**File:** `server/src/routes/scheduling.ts`

| Current middleware | Replacement / augmentation |
|--------------------|---------------------------|
| `checkSchedulingAdmin` | Wrap with dual on admin routes |
| `checkSchedulingManagerAccess` | Dual on team routes |
| `checkSchedulingEmployeeAccess` | Dual on employee routes |

**Legacy file (retain):** `server/src/middleware/schedulingPermissions.ts`

**Controller files (no PE logic in controllers):**

- `schedulingAdminController.ts`
- `schedulingTeamController.ts`
- `schedulingEmployeeController.ts`

### HR routes

**File:** `server/src/routes/hr.ts`

| Current middleware | Dual target |
|--------------------|-------------|
| `checkHRAdmin` | Admin routes (~L60+) |
| `checkManagerAccess` | Team routes (~L234+) |

**Legacy file (retain):** `server/src/middleware/hrPermissions.ts`

**Controller:** `server/src/controllers/hrController.ts` — no inline authZ changes

---

## policyEngine.ts

**File:** `server/src/services/policyEngine.ts` (or `server/src/auth/policyEngine.ts`)

| Change | Detail |
|--------|--------|
| Register domains | SCHEDULING, HR action catalogs |
| No Scheduling/HR today | Inspection confirmed zero registered actions |

---

## Models / schema

No Prisma changes for Policy Engine v1.

---

## Migrations

None.

---

## Tests

| Test file (CREATE) | Pattern source |
|--------------------|----------------|
| `server/src/auth/__tests__/schedulingPolicyDual.test.ts` | `todoPolicyDual.test.ts` |
| `server/src/auth/__tests__/hrPolicyDual.test.ts` | `calendarPolicyDual.test.ts` |

**Test requirements:**

- Legacy allow → request succeeds without PE call
- Legacy deny + PE allow → succeeds
- Both deny → 403
- Action constants match `policyActions.ts`

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | `policyActions.ts` pattern established from Todo/Drive |
| **Exit** | All P1 scheduling + HR routes behind dual middleware; tests pass |

---

## Assumptions

- Policy Engine v1 authorize API stable.
- Legacy permissions remain source of truth until PE rules seeded.
- No per-route PE rule UI in Stage 1.

---

## Risks

| ID | Risk |
|----|------|
| R-08 | Dual middleware ordering / double denial |
| R-09 | Missing action mapping for edge routes |

---

## Dependencies

| CO | Reason |
|----|--------|
| None | Can parallel with CO-02, CO-04, CO-07 |
| CO-05 | Terminate/import actions reference identity paths |

---

## Verification criteria

- [ ] `policyActions.ts` contains all SCHEDULING_* and HR_* P1 actions
- [ ] Route files import dual middleware
- [ ] `grep authorize` shows scheduling/hr domain usage
- [ ] Dual tests pass; no regression on legacy-only tenants
