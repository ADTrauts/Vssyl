# Notification Standardization Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-02 — BO Notification Manifest and Emitter Standardization  
**Gap:** G04 (P1) · partial G12 (HR manifest pattern)  
**Last updated:** 2026-06-14  
**Guide:** `docs/guides/NOTIFICATION_METADATA_GUIDE.md`  
**Platform:** [BUSINESS_OPERATIONS_PLATFORM_SERVICES.md](./BUSINESS_OPERATIONS_PLATFORM_SERVICES.md) § Notifications

---

## Purpose

Convert CO-02 into executable work establishing unified BO notification program: seed manifest `notifications` blocks, `[module]_[event]` naming, emitters after authorized success, grouping map completeness.

**Resolves:** G04 — Notification manifest + emitter standardization. Establishes G12 manifest pattern (HR type completion in Stage 2).

**Current state:**
- **Scheduling:** Zero `scheduling_*` emitters; no manifest block (0A)
- **HR:** 8 types emitted; seed manifest lacks `notifications` block; 3 attendance types documented not sent (0B)
- **WC:** No `workforce_*` — pattern only in Stage 1

**Constitutional rule:** Notifications = delivery infrastructure. Domains author and emit; Notifier delivers. Notifications ≠ Workforce Communications.

---

## Manifest alignment

### Artifacts to align

| Artifact | Current gap | Action |
|----------|-------------|--------|
| `builtInModuleManifests.ts` | HR lacks `notifications` block; Scheduling lacks block | Add per NOTIFICATION_METADATA_GUIDE |
| `registerBuiltInModules.ts` | May drift from seed | Sync with manifest blocks |
| `seedSchedulingModule.ts` / HR seed | Partial vs runtime | Align |
| `web/src/app/notifications/page.tsx` | Grouping map | Add BO types |
| `web/src/api/notifications.ts` | Type discovery | Align with manifest |

### Manifest block template

Per `NOTIFICATION_METADATA_GUIDE.md`:

```typescript
{
  "type": "[module]_[event_name]",
  "name": "Human-readable name",
  "description": "When this notification is sent",
  "category": "[module]",
  "defaultChannels": { "inApp": true, "email": false, "push": false },
  "priority": "normal",
  "requiresAction": false
}
```

---

## Notification taxonomy

### Scheduling (`scheduling_*`) — NOT PRESENT today

| Type (planned) | Trigger | Emitter after |
|----------------|---------|---------------|
| `scheduling_schedule_published` | Schedule publish | CO-01 activity + authorized publish |
| `scheduling_shift_assigned` | Shift assignment to EP | Shift assign success |
| `scheduling_swap_requested` | Swap request created | Swap create success |
| `scheduling_swap_approved` | Swap approved | Swap approve success |
| `scheduling_swap_denied` | Swap denied | Swap deny success |
| `scheduling_open_shift_available` | Open shift posted | Open shift create success |
| `scheduling_open_shift_claimed` | Employee claims open shift | Claim success |

**FALSE POSITIVE check:** These are **workflow/operational alerts** — not WC broadcast campaigns.

### HR (`hr_*`) — PARTIAL today

| Type | Emitted today | Manifest today | Stage 1 action |
|------|---------------|----------------|----------------|
| `hr_onboarding_task_approved` | ✅ | ❌ seed gap | Add manifest |
| `hr_onboarding_task_pending_approval` | ✅ | ❌ | Add manifest |
| `hr_onboarding_journey_completed` | ✅ | ❌ | Add manifest |
| `hr_time_off_request_submitted` | ✅ | ❌ | Add manifest |
| `hr_time_off_request_approved` | ✅ | ❌ | Add manifest |
| `hr_time_off_request_denied` | ✅ | ❌ | Add manifest |
| `hr_time_off_balance_low` | ✅ | ❌ | Add manifest |
| `hr_attendance_exception_created` | ❌ documented not sent | ❌ | WP-02.3 — emitter + manifest |
| `hr_attendance_policy_violation` | ❌ | ❌ | WP-02.3 |
| `hr_attendance_missing_punch` | ❌ | ❌ | WP-02.3 |

**FALSE POSITIVE check:** HR workflow notifications ≠ Workforce Communications.

### Workforce Communications (`workforce_*`) — future pattern

| Type (planned) | Stage | Notes |
|----------------|-------|-------|
| `workforce_announcement_published` | Stage 3 | After CO-11 |
| `workforce_campaign_requires_ack` | Stage 3 | Compliance ack |
| `workforce_emergency_alert` | Stage 3+ | Not Phase 1 `urgent` metadata |

**Stage 1 deliverable:** Naming convention + manifest slot template — not emitters.

---

## Emitter placement rules

| Rule | Detail |
|------|--------|
| After authorized success | PE/middleware pass → mutation success → `NotificationService.createNotification` |
| After CO-01 | Activity emit and notification emit on same success path |
| Tenant scoped | `userId` from EP/workflow context — never cross-tenant |
| No emit on failure | Same as activity — authorize → execute → notify |
| Grouping | Types registered in frontend grouping map |

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-02.1** | BO notification taxonomy document | Master type list + naming rules |
| **WP-02.2** | Scheduling manifest + emitter spec | `scheduling_*` types + placement map |
| **WP-02.3** | HR manifest completion spec | All `hr_*` in manifest + 3 attendance emitters |
| **WP-02.4** | WC manifest template | `workforce_*` placeholder for CO-11 |
| **WP-02.5** | Frontend alignment spec | `notifications/page.tsx` + `api/notifications.ts` updates |
| **WP-02.6** | FALSE POSITIVE type classification | Per-type: workflow vs broadcast label |
| **WP-02.7** | Verification checklist | Manifest↔emitter↔grouping map consistency |

---

## Entry criteria

| Criterion | Required |
|-----------|----------|
| CO-01 activity taxonomy in progress or complete | ✅ Emit-after-success contract |
| CO-06 governance adopted | ✅ Type classification |
| NOTIFICATION_METADATA_GUIDE reviewed | ✅ |

---

## Exit criteria (G04)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | BO notification taxonomy published (WP-02.1) | Document exists |
| 2 | Scheduling `scheduling_*` types defined + manifest spec (WP-02.2) | Types + placement map |
| 3 | HR manifest spec covers all documented `hr_*` (WP-02.3) | Manifest block complete on paper |
| 4 | `workforce_*` naming convention defined (WP-02.4) | Template ready for CO-11 |
| 5 | Frontend alignment spec (WP-02.5) | Grouping map plan |
| 6 | FALSE POSITIVE classification per type (WP-02.6) | No type labeled WC campaign incorrectly |
| 7 | Emitter placement follows CO-01 success-only rule | Cross-check WP-01.5 + WP-02.2/03 |

---

# Assumptions

- `NotificationService.createNotification` API remains stable
- Notification Center UX unchanged in Stage 1 — metadata only
- C2 Notifier role unchanged — delivery only
- HR 8 existing emitters remain — manifest catches up to runtime
- 3 attendance types are added in Stage 1 spec; full emitter implementation may complete in Stage 2 (G12) if scoped separately

---

# Risks

| Risk | Mitigation |
|------|------------|
| Taxonomy drift between manifest and emitters | WP-02.7 verification checklist |
| New types added without manifest | Manifest-first rule in implementation program |
| Scheduling types confused with WC broadcasts | WP-02.6 FALSE POSITIVE classification |
| Seed vs registerBuiltInModules drift | WP-02.2/03 explicit sync requirement |
| Grouping map incomplete — types invisible in UI | WP-02.5 frontend alignment |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-03.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| CO-01 (G03) | **Required** — emit after authorized success |
| CO-06 (G01) | **Required** — notifs ≠ WC content classification |
| CO-03 (G05) | Parallel — PE gates authorization before notify |
| CO-05 (G02) | `userId` addressing from stable EP |
| G09 (Stage 2) | Publish notifications depend on WP-02.2 |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Taxonomy review | Every BO type follows `[module]_[event]` |
| Manifest↔emitter matrix | WP-02.7 — each emitted type has manifest entry |
| FALSE POSITIVE audit | WP-02.6 — no workflow type labeled broadcast |
| Frontend map review | WP-02.5 — all types discoverable |
| CO-01 cross-check | Notification emit only on success paths in spec |
| Stage 1 exit gate | G04 row satisfied |

---

## Certification statement

**No certification awarded.** Notification standardization plan only.
