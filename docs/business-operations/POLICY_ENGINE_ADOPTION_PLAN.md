# Policy Engine Adoption Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-03 — BO Policy Engine Registration Program  
**Gap:** G05 (P1)  
**Last updated:** 2026-06-14  
**Reference:** `docs/architecture/POLICY_ENGINE.md`, Drive `drivePolicyDual`, Chat `chatPolicyDual`  
**Current state (0A/0B):** Custom `schedulingPermissions.ts` and `hrPermissions.ts` only — no PE registration

---

## Purpose

Convert CO-03 into executable work registering Scheduling, HR, and future WC write actions in Policy Engine — migrating from ad-hoc middleware toward Policy Dual patterns.

**Resolves:** G05 — Policy Engine adoption for BO write paths.

---

## Policy Dual pattern

### Reference implementation

| Module | Pattern | Location |
|--------|---------|----------|
| **Drive** | `evaluateDrivePolicyDual` | `server/src/auth/drivePolicyDual.ts` |
| **Chat** | `chatPolicyDual` | Chat auth patterns |
| **Notes/Todo** | `evaluateModuleMutationPolicyDual` | Platform PE helper |

### BO planned patterns

| Module | Planned dual evaluator | Legacy middleware |
|--------|----------------------|-------------------|
| **Scheduling** | `evaluateSchedulingPolicyDual` (planning name) | `schedulingPermissions.ts` |
| **HR** | `evaluateHrPolicyDual` (planning name) | `hrPermissions.ts` |
| **WC (future)** | `evaluateWorkforceCommsPolicyDual` | Admin role checks on front page |

### Dual enforcement model

```
1. Legacy middleware (interim) — existing RBAC pass
2. Policy Engine dual — evaluate registered action
3. Both must allow (or PE supersedes per migration phase) → execute
```

**Migration strategy:** Register actions first; dual-evaluate alongside legacy; deprecate legacy per action in implementation program — not single-step cutover in Stage 1 planning.

---

## Action registration inventory

### Scheduling write actions (Phase 0A)

| PE action (planned) | Route/handler | Role scope |
|--------------------|---------------|------------|
| `scheduling.shift.create` | Admin/manager shift create | admin, manager |
| `scheduling.shift.update` | Shift update | admin, manager, self (limited) |
| `scheduling.shift.delete` | Shift delete/trash | admin, manager |
| `scheduling.schedule.publish` | `publishSchedule` | admin |
| `scheduling.schedule.publish_team` | `publishTeamSchedule` (G09) | manager |
| `scheduling.swap.approve` | Swap approve | manager, admin |
| `scheduling.swap.deny` | Swap deny | manager, admin |
| `scheduling.availability.update_admin` | Admin availability edit | admin |
| `scheduling.template.manage` | Shift template CRUD | admin |

### HR write actions (Phase 0B)

| PE action (planned) | Route/handler | Role scope |
|--------------------|---------------|------------|
| `hr.employee.create` | `createEmployee` | admin |
| `hr.employee.update` | Profile update | admin, manager, self (limited) |
| `hr.employee.terminate` | `terminateEmployee` | admin |
| `hr.time_off.approve` | PTO approve | manager, admin |
| `hr.time_off.deny` | PTO deny | manager, admin |
| `hr.attendance.admin_update` | Admin attendance edit | admin |
| `hr.onboarding.approve` | Task approval | manager |
| `hr.settings.update` | Admin settings (when implemented) | admin |

### Workforce Communications (future hooks — Stage 1 pattern only)

| PE action (planned) | Stage | Scope |
|--------------------|-------|-------|
| `workforce.campaign.author` | Stage 3 | admin, comms author role |
| `workforce.campaign.publish` | Stage 3 | admin, comms author |
| `workforce.campaign.send` | Stage 3 | admin + audience scope |

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-03.1** | BO PE action naming convention | `[module].[entity].[verb]` spec |
| **WP-03.2** | Scheduling action inventory + registration spec | Table above → `policyEngine.ts` entries |
| **WP-03.3** | HR action inventory + registration spec | Table above → `policyEngine.ts` entries |
| **WP-03.4** | Scheduling Policy Dual spec | `evaluateSchedulingPolicyDual` contract |
| **WP-03.5** | HR Policy Dual spec | `evaluateHrPolicyDual` contract |
| **WP-03.6** | WC PE placeholder spec | Future actions for CO-11 |
| **WP-03.7** | Middleware migration matrix | Per-action: legacy → dual → PE-only phases |
| **WP-03.8** | Verification checklist | PE deny blocks mutation; allow permits CO-01/02 emit |

---

## Entry criteria

| Criterion | Required |
|-----------|----------|
| CO-05 identity trust in progress or complete | ✅ AuthZ subjects stable |
| `POLICY_ENGINE.md` reviewed | ✅ |
| Drive/Chat dual patterns reviewed | ✅ |
| Stage 1 Track 1 near-complete | ✅ |

---

## Exit criteria (G05)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | BO PE action naming convention published (WP-03.1) | Document exists |
| 2 | Scheduling action inventory complete (WP-03.2) | All P1 writes registered on paper |
| 3 | HR action inventory complete (WP-03.3) | All P1 writes registered on paper |
| 4 | Policy Dual specs published (WP-03.4, WP-03.5) | Dual evaluator contracts |
| 5 | WC placeholder spec (WP-03.6) | CO-11 ready |
| 6 | Migration matrix published (WP-03.7) | Phased legacy→PE path |
| 7 | PE gates CO-01/02 success paths | Unauthorized → no emit |

---

# Assumptions

- Policy Engine core infrastructure stable — registration only in BO scope
- Legacy middleware remains during dual phase — no big-bang removal in Stage 1
- Manager scope continues to use `reportsToId` / direct reports per 0A/0B
- PE registration does not require service layer extraction (CO-10 is Stage 2)
- WC PE hooks are spec-only in Stage 1

---

# Risks

| Risk | Mitigation |
|------|------------|
| PE scope creep — every read path registered | WP-03.7 migration matrix — write paths only in Stage 1 |
| Dual evaluation performance overhead | Register P1 writes first; measure in implementation |
| Legacy + PE conflict (one allows, one denies) | Dual spec defines resolution order |
| Manager scope differs between scheduling and HR middleware | Document scope rules per module in WP-03.4/05 |
| Incomplete registration leaves authZ drift | WP-03.8 verification — P1 inventory complete |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-04.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| CO-05 (G02) | AuthZ subjects need stable EP identity |
| CO-01 (G03) | Parallel after CO-05 — PE before emit |
| CO-02 (G04) | Parallel — PE before notify |
| CO-06 (G01) | Recommended — PE actions scoped correctly |
| G09 (Stage 2) | Manager publish PE actions required |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Action inventory review | All P1 Scheduling + HR writes have PE action |
| Dual spec review | Legacy + PE evaluation order documented |
| Deny-path review | 403/401 → no mutation, no activity, no notification |
| Allow-path review | Success → mutation + CO-01/02 emit permitted |
| Scope review | Manager actions respect direct reports / admin |
| Stage 1 exit gate | G05 row satisfied |

---

## Certification statement

**No certification awarded.** Policy Engine adoption plan only.
