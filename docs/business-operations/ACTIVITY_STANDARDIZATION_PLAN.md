# Activity Standardization Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-01 — BO Platform Activity Envelope Program  
**Gap:** G03 (P1)  
**Last updated:** 2026-06-14  
**Platform reference:** `docs/architecture/DOMAIN_EVENTS.md`, Drive L4 (`emitModuleActivityEvent`)  
**Alignment:** [BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md](./BUSINESS_OPERATIONS_CONSTITUTIONAL_ALIGNMENT.md)

---

## Purpose

Convert CO-01 into executable work standardizing `emitModuleActivityEvent` for all Business Operations authorized write paths — shared event taxonomy, success-only emission, activity vs analytics separation.

**Resolves:** G03 — Activity standardization. Enables G16, G18 (future).

**Current state (0A/0B):** Scheduling and HR have **no** `emitModuleActivityEvent`. HR has supplementary `auditLog` only.

---

## Activity envelope contract

### Authorize → execute → emit

```
1. authorize   — PE and/or legacy middleware (CO-03); tenant scope verified
2. execute     — Prisma mutation or service call
3. emit        — emitModuleActivityEvent on SUCCESS ONLY
```

| Rule | Detail |
|------|--------|
| Success only | Never emit on failed or unauthorized actions |
| Normalized envelope | Per `moduleSpecs.md` / `moduleActivityService` |
| Activity ≠ analytics | Module analytics derived separately — not conflated |
| HR `auditLog` | Supplementary — not substitute for module activity |

### Reference patterns

| Module | Pattern |
|--------|---------|
| **Drive (L4)** | 100% write path `emitModuleActivityEvent` (`moduleId: 'drive'`) |
| **Chat (L3)** | Activity on message/thread mutations |
| **Calendar (L3)** | Activity on event mutations |
| **Notes** | `emitModuleActivityEvent` on create/update/delete |

---

## Shared BO event taxonomy template

| Field | Convention |
|-------|--------------|
| `moduleId` | `scheduling` \| `hr` \| `workforce` (future WC module id TBD) |
| `eventType` | `[domain]_[entity]_[action]` e.g. `scheduling_shift_created` |
| `actorUserId` | Authenticated user from `req.user` |
| `businessId` | Tenant scope — required |
| `dashboardId` | When workspace context available |
| `entityType` | Prisma model name or canonical entity label |
| `entityId` | Primary key of affected entity |
| `metadata` | Bounded JSON — no secrets; tenant-safe |

---

## Per-module event inventory

### Scheduling (Phase 0A)

| Event type (planned) | Trigger path | Priority |
|---------------------|--------------|----------|
| `scheduling_shift_created` | Admin/manager shift create | P1 |
| `scheduling_shift_updated` | Shift update | P1 |
| `scheduling_shift_deleted` | Shift delete / trash (CO-04) | P1 |
| `scheduling_schedule_published` | `publishSchedule` / team publish | P1 |
| `scheduling_swap_requested` | Employee swap request | P1 |
| `scheduling_swap_approved` | Manager/admin approve | P1 |
| `scheduling_swap_denied` | Manager/admin deny | P1 |
| `scheduling_availability_updated` | Employee/admin availability | P2 |
| `scheduling_open_shift_claimed` | Open-shift claim | P1 |
| `scheduling_shift_restored` | Trash restore (CO-04) | P1 |

### HR (Phase 0B)

| Event type (planned) | Trigger path | Priority |
|---------------------|--------------|----------|
| `hr_employee_profile_created` | `createEmployee` | P1 |
| `hr_employee_profile_updated` | Profile update | P1 |
| `hr_employee_terminated` | `terminateEmployee` | P1 |
| `hr_time_off_requested` | PTO request | P1 |
| `hr_time_off_approved` | PTO approve | P1 |
| `hr_time_off_denied` | PTO deny | P1 |
| `hr_attendance_punch_in` | Clock in | P1 |
| `hr_attendance_punch_out` | Clock out | P1 |
| `hr_attendance_exception_created` | Exception record | P1 |
| `hr_onboarding_step_completed` | Onboarding progress | P2 |
| `hr_onboarding_journey_completed` | Journey complete | P1 |
| `hr_profile_restored` | Trash restore (CO-04) | P1 |

### Workforce Communications (future — pattern only)

| Event type (planned) | Trigger path | Stage |
|---------------------|--------------|-------|
| `workforce_campaign_published` | Campaign publish | Stage 3 (CO-11) |
| `workforce_campaign_acknowledged` | User ack | Stage 3 |
| `workforce_audience_resolved` | Audience resolve (optional) | Stage 3 |

**Stage 1 deliverable:** Taxonomy slot + naming convention — not implementation.

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-01.1** | BO activity taxonomy document | Canonical event naming + envelope field spec |
| **WP-01.2** | Scheduling event inventory | Table above finalized + controller→event mapping |
| **WP-01.3** | HR event inventory | Table above finalized + controller→event mapping |
| **WP-01.4** | WC placeholder taxonomy | `workforce_*` event slots for CO-11 |
| **WP-01.5** | Emit placement guide | Where in controller/service to call `emitModuleActivityEvent` |
| **WP-01.6** | HR auditLog relationship doc | Supplementary vs primary activity — no duplication |
| **WP-01.7** | Verification checklist | Per-event success-only + tenant scope tests |

---

## Entry criteria

| Criterion | Required |
|-----------|----------|
| CO-05 identity trust in progress or complete | ✅ G02 stable subjects |
| CO-06 governance adopted | ✅ Recommended |
| `DOMAIN_EVENTS.md` reviewed | ✅ |
| Stage 1 Track 1 exit or parallel near-complete | ✅ |

---

## Exit criteria (G03)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | BO activity taxonomy published (WP-01.1) | Document exists |
| 2 | Scheduling event inventory complete (WP-01.2) | All P1 paths mapped |
| 3 | HR event inventory complete (WP-01.3) | All P1 paths mapped |
| 4 | WC placeholder taxonomy defined (WP-01.4) | Naming convention ready |
| 5 | Emit placement guide published (WP-01.5) | Implementation-ready |
| 6 | `authorize → execute → emit` contract adopted | Referenced in all BO mutation specs |
| 7 | HR auditLog supplementary role documented (WP-01.6) | No conflation |

---

# Assumptions

- `emitModuleActivityEvent` platform API remains stable
- Activity emission does not require service layer extraction (CO-10 is Stage 2) — controllers may emit initially
- Scheduling realtime socket events remain separate from activity — not conflated
- Tenant scoping (`businessId`) already present on BO mutations per 0A/0B
- CO-01 completes before CO-02 and CO-04

---

# Risks

| Risk | Mitigation |
|------|------------|
| Inconsistent event naming across modules | WP-01.1 canonical taxonomy — mandatory |
| Emit on failure paths | WP-01.5 placement guide + code review gate |
| Fat controllers make emit placement unclear | WP-01.5 maps controller handler → event |
| HR auditLog duplication | WP-01.6 relationship doc |
| Activity events leak cross-tenant data | Envelope review + tenant scope in metadata rules |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-07.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| CO-05 (G02) | Actor/subject references need stable identity |
| CO-06 (G01) | Recommended — socket events not labeled as activity/comms |
| CO-02 | **Blocked by CO-01** — notifications emit after authorized success |
| CO-04 | **Blocked by CO-01** — trash/restore activity events |
| CO-03 | Parallel after CO-05 — PE gates authorization before emit |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Taxonomy review | WP-01.1 approved by BO program steward |
| Inventory completeness | All P1 Scheduling + HR write paths have event type |
| Placement guide review | Each P1 path has documented emit location |
| Success-only review | No emit on error/401/403 paths in spec |
| Cross-module spot check | Publish + PTO approve scenarios have activity + tenant scope |
| Stage 1 exit gate | G03 row satisfied |

---

## Certification statement

**No certification awarded.** Activity standardization plan only.
