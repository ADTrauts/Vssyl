# CO-02 Notification Standardization — Engineering Blueprint

**CO:** CO-02 (G04)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [NOTIFICATION_STANDARDIZATION_PLAN.md](./NOTIFICATION_STANDARDIZATION_PLAN.md)  
**Guide:** `docs/guides/NOTIFICATION_METADATA_GUIDE.md`

---

## Purpose

Engineering scope for Scheduling notification establishment and HR notification completion: manifests, emitters, metadata, grouping, and `scheduling_*` / `hr_*` type taxonomy. `workforce_*` documented as future hooks only.

---

## Work packages (engineering mapping)

| WP | Deliverable |
|----|-------------|
| WP-02-01 | Manifest `notifications` blocks for `hr` + `scheduling` |
| WP-02-02 | CREATE `schedulingNotificationService.ts` |
| WP-02-03 | Wire scheduling emitters (publish, swap, open shift) |
| WP-02-04 | Complete HR attendance notification emitters |
| WP-02-05 | Grouping map + web notification page |
| WP-02-06 | `workforce_*` future hook documentation |

---

## Manifests

| File | Location | Change |
|------|----------|--------|
| `builtInModuleManifests.ts` | `server/src/startup/` | ADD `notifications` to `hr` case (~L475) and `scheduling` case (~L495) |
| `registerBuiltInModules.ts` | `server/src/startup/` | Verify manifest sync on startup |
| `scripts/ensure-builtin-modules.ts` | `scripts/` | Reconcile DB `Module.manifest` if used |

**Scheduling manifest types (P1):**

| type | category | trigger |
|------|----------|---------|
| `scheduling_schedule_published` | scheduling | Admin/team publish |
| `scheduling_shift_assigned` | scheduling | Shift assign to employee |
| `scheduling_swap_requested` | scheduling | Employee swap request |
| `scheduling_swap_approved` | scheduling | Manager approval |
| `scheduling_swap_denied` | scheduling | Manager denial |
| `scheduling_open_shift_available` | scheduling | Open shift posted |

**HR manifest additions (complete partial):**

| type | status |
|------|--------|
| `hr_attendance_exception_created` | ADD emitter (commented ~L263) |
| `hr_attendance_policy_violation` | ADD emitter |
| `hr_attendance_missing_punch` | ADD emitter |
| `hr_attendance_exception_resolved` | EXISTS (~L592) |
| `hr_onboarding_assigned` | Verify in `hrOnboardingService` |
| `hr_time_off_requested` | ADD if missing |
| `hr_time_off_approved` | ADD if missing |
| `hr_time_off_denied` | ADD if missing |

---

## Emitters

### Scheduling (currently **zero** `NotificationService.createNotification`)

**New service:** `server/src/services/schedulingNotificationService.ts`

| Function | Type | Called from |
|----------|------|-------------|
| `notifySchedulePublished` | `scheduling_schedule_published` | `publishSchedule`, `publishTeamSchedule` |
| `notifyShiftAssigned` | `scheduling_shift_assigned` | shift create/update with assignee |
| `notifySwapRequested` | `scheduling_swap_requested` | employee swap create |
| `notifySwapResolved` | `scheduling_swap_approved` / `scheduling_swap_denied` | admin swap handlers |

**Controller insertion points:**

| File | Functions |
|------|-----------|
| `schedulingAdminController.ts` | `publishSchedule`, swap handlers, shift assign |
| `schedulingTeamController.ts` | `publishTeamSchedule` |
| `schedulingEmployeeController.ts` | swap request create |

### HR (partial)

| File | Line / area | Type | Status |
|------|-------------|------|--------|
| `hrAttendanceService.ts` | ~L592 | `hr_attendance_exception_resolved` | EXISTS |
| `hrAttendanceService.ts` | ~L263 comments | 3 attendance types | ADD |
| `hrOnboardingService.ts` | onboarding assign | `hr_onboarding_*` | VERIFY/COMPLETE |
| `hrController.ts` | time-off flows | `hr_time_off_*` | ADD |

**Platform emitter:** `NotificationService.createNotification` in `server/src/services/notificationService.ts`

---

## Metadata

Per `NOTIFICATION_METADATA_GUIDE.md`, each type needs:

- `title`, `body` template keys
- `icon` (Drive-style consistency)
- `deepLink` pattern (`/business/{businessId}/scheduling/...` or `/hr/...`)
- `groupKey` for deduplication

Manifest JSON structure in `builtInModuleManifests.ts`:

```typescript
notifications: {
  types: [
    { id: 'scheduling_schedule_published', category: 'scheduling', ... },
  ]
}
```

---

## Grouping

| File | Change |
|------|--------|
| `notificationGroupingService.ts` | `server/src/services/` — ADD scheduling types + remaining hr types (currently only 2 hr types mapped) |

**Grouping keys (planned):**

| Group key | Types |
|-----------|-------|
| `scheduling_publish` | `scheduling_schedule_published` |
| `scheduling_swap` | `scheduling_swap_*` |
| `hr_attendance` | `hr_attendance_*` |
| `hr_time_off` | `hr_time_off_*` |

---

## Web targets

| File | Change |
|------|--------|
| `web/src/app/notifications/page.tsx` | ~L179 — ADD scheduling + hr type labels/icons |
| `web/src/api/notifications.ts` | Type union extension if typed |

---

## workforce_* future hooks (DOC only)

| Hook | Purpose | Stage |
|------|---------|-------|
| `workforce_announcement_posted` | WC module | Stage 3 |
| `workforce_policy_ack_required` | WC module | Stage 3 |

Document in manifest as **reserved** types with `enabled: false` OR in `WORKFORCE_COMMUNICATIONS_ESTABLISHMENT_REQUIREMENTS.md` cross-link only — no emitters in Stage 1.

---

## Models

No schema changes. Notifications use existing `Notification` model.

---

## Routes

No new routes. Notifications emitted post-handler in existing HR/Scheduling routes.

---

## Migrations

None. Manifest updates sync via startup seed / `ensure-builtin-modules`.

---

## Tests

| Test file (CREATE) | Scope |
|--------------------|-------|
| `server/src/services/__tests__/schedulingNotificationService.test.ts` | Type strings; recipient resolution |
| Manifest reconciliation test | `builtInModuleManifests` includes all emitted types |
| Extend notification grouping test if exists | New group keys |

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | CO-01 activity events defined (parallel OK) |
| **Exit** | All P1 types in manifest; scheduling emitters live; HR attendance complete; grouping + web page updated |

---

## Assumptions

- Notification delivery infrastructure unchanged.
- Chat notifications remain separate (boundary frozen).
- WC types are taxonomy placeholders only.

---

## Risks

| ID | Risk |
|----|------|
| R-06 | Manifest drift from emitters |
| R-07 | Recipient resolution for shift assignees |

---

## Dependencies

| CO | Reason |
|----|--------|
| CO-01 | Parallel; publish triggers both activity + notification |
| None | Manifest can start independently |

---

## Verification criteria

- [ ] Every `createNotification` type appears in manifest
- [ ] `notificationGroupingService` maps all new types
- [ ] `notifications/page.tsx` renders scheduling + hr labels
- [ ] Zero `scheduling_*` grep before → N>0 after implementation
