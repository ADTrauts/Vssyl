# Global Trash Alignment Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-04 — BO Global Trash and Lifecycle Alignment  
**Gap:** G06 (P1)  
**Last updated:** 2026-06-14  
**Reference:** Drive `trashedAt` + trash controller; Calendar `calendarTrashService`  
**Current state (0A/0B):** Scheduling hard delete; HR local `deletedAt`/`archivedAt` — not Global Trash API

---

## Purpose

Convert CO-04 into executable work migrating Scheduling and HR delete paths to `trashedAt` + Global Trash API; defining WC campaign trash handler pattern for future establishment.

**Resolves:** G06 — Global Trash alignment. Enables G13 V-Link (Stage 2).

---

## Trash lifecycle contract

### Platform standard

| Step | Behavior |
|------|----------|
| **Soft delete** | Set `trashedAt` timestamp — no hard delete for user-facing data |
| **Global Trash API** | Unified list/restore/purge via trash controller |
| **Handler registration** | Module registers entity types in trash controller |
| **Activity emit** | Trash + restore emit per CO-01 (`*_restored`, `*_deleted` or `*_trashed`) |
| **Tenant scope** | All trash operations scoped by `businessId` / authorized context |

### Current vs target

| Module | Current | Target |
|--------|---------|--------|
| **Scheduling** | Hard delete; `ScheduleStatus.ARCHIVED`; client `scheduleTrashed` event | `trashedAt` + handler + Global Trash |
| **HR** | `EmployeeHRProfile.deletedAt`; onboarding `archivedAt` | `trashedAt` + handler + Global Trash |
| **WC (future)** | No trash model | Campaign `trashedAt` + handler pattern |

---

## Entity inventory

### Scheduling entities (Phase 0A)

| Entity | Current delete | Trash handler (planned) | Activity event |
|--------|---------------|------------------------|----------------|
| `Schedule` | Hard delete / ARCHIVED | `scheduling.schedule` | `scheduling_schedule_trashed` / `_restored` |
| `ScheduleShift` | Hard delete | `scheduling.shift` | `scheduling_shift_trashed` / `_restored` |
| `ShiftSwapRequest` | Delete | `scheduling.swap` (optional) | `scheduling_swap_trashed` |
| `EmployeeAvailability` | Delete | `scheduling.availability` | `scheduling_availability_trashed` |

**Note:** Schema migration to `trashedAt` is an **implementation program** concern — planned here, not executed in this document.

### HR entities (Phase 0B)

| Entity | Current delete | Trash handler (planned) | Activity event |
|--------|---------------|------------------------|----------------|
| `EmployeeHRProfile` | `deletedAt` soft delete | `hr.employee_profile` | `hr_profile_trashed` / `_restored` |
| `OnboardingTemplate` | `archivedAt` | `hr.onboarding_template` | `hr_onboarding_template_trashed` |
| `OnboardingJourney` | Delete/archive | `hr.onboarding_journey` | `hr_onboarding_journey_trashed` |

### Workforce Communications (future pattern)

| Entity | Stage | Handler |
|--------|-------|---------|
| `WorkforceCampaign` (planned model) | Stage 3 | `workforce.campaign` |

---

## trashController handler registration plan

| Handler id | Module | Entity types | Restore | Purge policy |
|------------|--------|--------------|---------|--------------|
| `scheduling` | scheduling | schedule, shift, swap, availability | ✅ | Per platform default |
| `hr` | hr | employee_profile, onboarding_template, onboarding_journey | ✅ | Per platform default |
| `workforce` (future) | workforce | campaign | ✅ | TBD in CO-11 |

**Reference:** Drive trash handler patterns in `trashController` / module handlers.

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-04.1** | BO trash lifecycle spec | Contract document (this plan § Trash lifecycle) |
| **WP-04.2** | Scheduling entity trash spec | Entity table + handler registration + schema migration notes |
| **WP-04.3** | HR entity trash spec | Entity table + handler registration + `deletedAt`→`trashedAt` migration notes |
| **WP-04.4** | WC trash handler template | Placeholder for CO-11 |
| **WP-04.5** | Activity on trash/restore | CO-01 event types for trash/restore per entity |
| **WP-04.6** | ARCHIVED enum disposition | Scheduling `ScheduleStatus.ARCHIVED` → trash semantics decision |
| **WP-04.7** | Frontend Global Trash integration | Scheduling/HR entities appear in `GlobalTrashBin` |
| **WP-04.8** | Verification checklist | Trash→restore→activity→tenant scope |

---

## Entry criteria

| Criterion | Required |
|-----------|----------|
| CO-01 activity taxonomy in progress or complete | ✅ Trash/restore events |
| Global Trash platform API documented | ✅ |
| Drive/Calendar trash patterns reviewed | ✅ |

---

## Exit criteria (G06)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | BO trash lifecycle spec published (WP-04.1) | Document exists |
| 2 | Scheduling trash spec complete (WP-04.2) | Entities + handler + migration notes |
| 3 | HR trash spec complete (WP-04.3) | Entities + handler + migration notes |
| 4 | WC handler template (WP-04.4) | CO-11 ready |
| 5 | Trash/restore activity events in CO-01 inventory (WP-04.5) | Cross-reference |
| 6 | ARCHIVED enum disposition decided (WP-04.6) | Decision record |
| 7 | Global Trash UI integration spec (WP-04.7) | Frontend plan |
| 8 | No hard delete for user-facing Scheduling/HR data in target spec | Review pass |

---

# Assumptions

- Global Trash API and trash controller remain platform-owned
- Schema migration (`trashedAt` columns) happens in implementation program — not Stage 1 planning execution
- Hard delete exceptions (if any) require explicit documented exceptions per platform policy
- `ScheduleStatus.ARCHIVED` may map to trash or coexist — WP-04.6 decides
- Trash handlers registered per module — not unified BO handler

---

# Risks

| Risk | Mitigation |
|------|------------|
| Trash lifecycle mismatch between modules | WP-04.1 unified contract |
| Scheduling hard delete paths missed | WP-04.2 exhaustive entity inventory |
| HR `deletedAt` vs `trashedAt` migration data loss | Migration notes + verification scenarios |
| Trash without activity trail | WP-04.5 CO-01 cross-reference mandatory |
| ARCHIVED enum confusion with trash | WP-04.6 explicit decision |
| V-Link lifecycle misaligned if trash skipped | CO-04 exit gate before CO-09 (Stage 2) |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-08.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| CO-01 (G03) | **Required** — trash/restore activity events |
| CO-03 (G05) | Parallel — trash operations PE-gated |
| CO-05 (G02) | Tenant scope on trash operations |
| CO-09 (Stage 2) | **Blocked by CO-04** — V-Link lifecycle alignment |
| CO-11 (Stage 3) | WC campaign handler uses WP-04.4 template |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Entity inventory review | All user-facing Scheduling + HR delete paths mapped |
| Handler registration review | Each entity type has handler id |
| Activity cross-check | Trash/restore events in CO-01 inventory |
| Migration notes review | `trashedAt` path documented per entity |
| No hard delete review | Target spec eliminates user-facing hard delete |
| Stage 1 exit gate | G06 row satisfied |

---

## Certification statement

**No certification awarded.** Global Trash alignment plan only.
