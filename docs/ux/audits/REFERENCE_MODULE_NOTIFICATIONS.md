# Reference Module Registration — Notifications

**Registration type:** Reference UX Module **#2**  
**Status:** **Approved with Findings**  
**Date registered:** 2026-06-12  
**moduleId:** `notifications`  
**User-facing name:** Notifications

> **Track clarification:** This is the **UX Reference Notifications Module** (management-page / cross-module inbox UX) per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) slot **#2**. It is **independent** of **Architecture Reference Module #2** (Chat, Level 3 code). Chat **Reference UX #2 was Rejected** at Wave 5B.3 — Notifications succeeds Chat as the UX #2 holder.

---

## Registration summary

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **UX level** | **UX-L3 Certified with Findings** (11 PASS / 1 PWF / 0 FAIL) |
| **Benchmark role** | Primary copy target for management-page inbox, feed actions, and cross-module notification routing |
| **UX certification** | [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md) |
| **L3 review** | [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Why Notifications qualified (program rules)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) Reference UX Module definition and certification process:

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Modernization waves (interaction + layout + menus) | ✅ 3A-4B + 3C-6 + 5C.1 + 5G |
| 2 | Module scorecard (11 categories) | ✅ [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md) — **11 PASS / 1 PWF** |
| 3 | Interaction certification | ✅ 5C.1 bulk delete + per-row delete `ConfirmModal`; 5G error toasts |
| 4 | Manual QA matrix | ✅ N-6 resolved — [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](./NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md) |
| 5 | Registration decision | ✅ **Approved with Findings** (this document) |
| 6 | Register benchmark | ✅ This document |

**Prerequisite met:** UX-L3 Certified with Findings (exceeds UX-L3 CwF minimum per scorecard).

**Not strict Approved:** Cat 8 PWF (N-4 local `EmptyState`); settings chrome divergence (N-3); grouped-view affordance (N-8) — mirror Drive #1 and Calendar #5 **Approved with Findings** precedent.

---

## Registration review (8 criteria)

### 1. UX-L3 eligibility

| Rule | Result |
|------|--------|
| UX-L3 CwF minimum | ✅ **UX-L3 Certified with Findings** |
| No FAIL | ✅ 0 FAIL |
| Core quartet 1, 2, 4, 11 PASS | ✅ |
| ≥9 strict PASS | ✅ 11 PASS |
| PWF ≤ 2 | ✅ 1 PWF (cat 8 only) |

Strict UX-L3 Certified (11/11 PASS) not required for registration — Drive #1 and Calendar #5 both registered **with findings**.

### 2. QA evidence completeness

| Metric | Value |
|--------|------:|
| PASS | **18** |
| FAIL | **0** |
| BLOCKED | **0** |
| N/A | **2** (NTF-03 no create surface; NTF-08 no drag reorder) |
| P0 FAIL | **0** |

Evidence folder: [`qa-evidence/5G-QA/notifications/`](./qa-evidence/5G-QA/notifications/)

**Gap (non-blocking):** N-2 feed error toasts not matrix-tested; engineering closeout authoritative per Calendar/Todo precedent.

### 3. Reusable architectural patterns

| Pattern | Implementation | Archetype |
|---------|----------------|-----------|
| Management page shell | `PageHeader` + `PageToolbar` on `/notifications` | **Management** (not workspace split) |
| Row action menu | `NotificationActionsMenu` → `DropdownMenu` | 3A-4B |
| Destructive confirms | Per-row + bulk delete → `ConfirmModal` | 5C.1 |
| Mobile category nav | Collapsible sheet (Calendar 3C-7B pattern) | 5G N-5 |
| Selection mode | Toolbar Select → bulk action bar | Native to feed modules |
| Cross-module routing | Metadata-driven deep links (chat, drive, todo, calendar, place, business, AI) | Hub pattern |
| Quick actions | `NotificationQuickActions` (approve/reject/view/reply) | Metadata adapter |
| Grouped view | `viewMode === 'grouped'` + socket refresh | Optional feed layout |
| Keyboard shortcuts | `j`/`k`/`Space`/`Enter`/`Escape` | Feed accessibility |
| Error surfacing | `showNotificationActionError()` + `react-hot-toast` | 5G N-2 |
| Realtime | Socket membership before grouped refresh emit | Tenant-scoped |

### 4. Cross-module teaching value

Notifications is the platform **inbox router** — every module that emits `[module]_[event]` types surfaces here. Copy value:

- How to render heterogeneous module payloads in one feed
- How to deep-link without bypassing Next.js API proxy
- How to wire manifest `notifications[]` metadata to row quick actions
- How to implement category filters + counts in a management sidebar
- How to integrate global bell entry with full-page feed

**Secondary teaching:** Management-page archetype complements Drive #1 (workspace split) and Calendar #5 (time-grid split).

### 5. Remaining findings (N-3, N-4, N-8)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| **N-4** | Local inline `EmptyState` vs shared `shared/components` primitive | P3 | No — cat 8 PWF documented |
| **N-3** | `/notifications/settings` not on `PageHeader` (3C-6 deferred) | P3 | No — certified sub-route exception |
| **N-8** | Grouped view: limited per-row delete when collapsed | P3 | No — not a dead-end workflow |
| **R-NTF-1** | `data-notification-index` not on DOM rows — keyboard focus ring not visual | Observation | No — NTF-11 PASS |
| **R-NTF-2** | N-2 toast paths not re-validated in QA matrix | Verification | No — 5G closeout |
| **R-NTF-3** | QA-ENV-02 — inline `JWT_SECRET` for local backend | P1 (env) | No |

### 6. Comparison against Chat (prior UX #2 candidate)

| Criterion | Chat (5B.3) | Notifications (5G-D) |
|-----------|-------------|----------------------|
| UX-L1 | CwF | **Certified** |
| UX-L2 | Not certified | **Certified** |
| UX-L3 | Not certified | **Certified with Findings** |
| PASS categories | 6 | **11** |
| Reference UX #2 | **Rejected** | **Approved with Findings** |
| Manual QA | C-8 open | **N-6 closed** |
| Primary archetype | Workspace split (partial) | **Management page** (complete) |
| Cross-module hub | Messaging-centric | **Platform-wide inbox** |

**Conclusion:** Chat remains **Architecture Reference #2** (code/realtime). Notifications correctly holds **UX Reference #2** — different tracks, no slot conflict.

### 7. Long-term maintenance burden

| Factor | Assessment |
|--------|------------|
| Route surface | **Low** — 2 routes (feed + settings) |
| Layout churn | **Low** — stable `PageHeader`/`PageToolbar` management archetype |
| New module notification types | **Medium** — metadata/quick-action mapping grows with marketplace |
| Mobile pattern | **Low** — sheet pattern shared with Calendar; single implementation |
| Recertification triggers | Standard (see below) |

**Net:** Lower shell maintenance than Calendar #5 (four view routes); higher metadata adapter maintenance as module count grows — acceptable for an inbox hub reference.

### 8. Consistency with existing Reference UX holders

| Holder | UX level at registration | PWF at registration | Decision |
|--------|--------------------------|---------------------|----------|
| Drive #1 | UX-L3 interaction + L2 layout (pre-11-cat) | Multiple (F-1–F-8) | Approved with Findings |
| Calendar #5 | UX-L3 Certified (strict) | 0 | Approved with Findings |
| **Notifications #2** | UX-L3 Certified with Findings | 1 (cat 8) | **Approved with Findings** |

Notifications meets the same registration bar as Drive and Calendar: L3 CwF or better, manual QA executed, documented non-blocking findings, registration artifact published.

---

## UX quality

### 11-category scorecard (5G-Notifications-D authoritative)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PASS** |
| 2 | Layout Consistency | **PASS** |
| 3 | Navigation | **PASS** |
| 4 | Accessibility | **PASS** |
| 5 | Mobile | **PASS** |
| 6 | Cross-Module Integration | **PASS** |
| 7 | Error Handling | **PASS** |
| 8 | Empty States | **PASS WITH FINDINGS** |
| 9 | Loading States | **PASS** |
| 10 | Discoverability | **PASS** |
| 11 | Workflow Completion | **PASS** |

Full detail: [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md)

### UX-L3 certification

| Level | Award |
|-------|-------|
| UX-L1 | **Certified** |
| UX-L2 | **Certified** |
| UX-L3 | **Certified with Findings** |

Evidence: [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md)

### QA evidence (N-6)

| Metric | Value |
|--------|------:|
| PASS | **18** |
| FAIL | **0** |
| N/A | **2** |

Key P0: NTF-06/07 delete confirms, NTF-09 mobile sheet, NTF-11 keyboard, NTF-16/17 aria, NTF-19 `DropdownMenu`.

---

## Exception documentation (certified)

| Surface | Classification | Rationale |
|---------|----------------|-----------|
| `/notifications/settings` | **Certified exception** | Own header chrome — N-3 P3 deferred; settings route functional |
| Local `EmptyState` in `page.tsx` | **Certified exception** | N-4 P3 — behavior verified (NTF-13); primitive adoption deferred |
| Grouped view collapsed rows | **Certified exception** | N-8 P3 — group-level actions available; not blocking workflow |
| No user create surface | **Product scope** | NTF-03 N/A — notifications are system/module-generated |

---

## Platform integration

| System | Notifications integration | Copy note |
|--------|--------------------------|-----------|
| **All modules** | `[module]_[event]` types → feed rows | Copy manifest `notifications[]` + row renderer |
| **Chat** | `chat_*` deep links | Copy conversational notification routing |
| **Drive** | `drive_*` file/folder links | Copy file-hub notification adapter |
| **Calendar** | `calendar_reminder` inbound | Copy time-based reminder surfacing (inverse of Calendar doc) |
| **Todo** | Task due / assignment types | Copy work-item notification metadata |
| **Place** | Business/place event types | Copy external-graph notification routing |
| **AI** | AI action / insight types | Copy AI notification quick actions |
| **Realtime** | Socket grouped refresh | Copy tenant-scoped emit after membership proof |
| **Global bell** | Header entry → `/notifications` | Copy discoverability pattern |

---

## Waves that contributed

| Wave | Contribution | Closeout |
|------|--------------|----------|
| **3A-4B** | `DropdownMenu` row actions; per-delete `ConfirmModal` | [`NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md`](./NOTIFICATIONS_MENU_ROLLOUT_CLOSEOUT.md) |
| **3C-6** | `PageHeader` + `PageToolbar` management layout | [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](./NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md) |
| **5C** | Initial UX certification | [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md) |
| **5C.1** | Bulk delete `ConfirmModal` (N-1) | [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](./NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md) |
| **5C.2** | UX-L2 CwF re-certification | [`NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./NOTIFICATIONS_UX_RECERTIFICATION_2026.md) |
| **5G** | N-2/N-5/N-7 remediation | [`NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](./NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md) |
| **5G-QA-EXEC** | Part 2B manual QA (N-6) | [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](./NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md) |
| **5G-Notifications-D** | UX-L3 CwF awarded | [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Known findings (carry-forward)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| **N-4** | Local `EmptyState` vs shared primitive | P3 | No |
| **N-3** | Settings not on `PageHeader` | P3 | No |
| **N-8** | Grouped view limited delete affordance | P3 | No |
| **R-NTF-1** | `data-notification-index` not on list rows | Observation | No |
| **R-NTF-2** | Feed error toasts not matrix-tested | Verification | No |
| **R-NTF-3** | QA-ENV-02 — `JWT_SECRET` local workaround | P1 (env) | No |

---

## Copy targets for other modules

When building inbox, feed, or management-page modules, copy Notifications patterns for:

| Need | Notifications reference |
|------|------------------------|
| Management page chrome | `page.tsx` — `PageHeader` + `PageToolbar` slots |
| Feed row actions | `NotificationActionsMenu` + `DropdownMenu` |
| Bulk selection | Toolbar Select → checkbox mode → bulk bar |
| Destructive delete | `requestBulkDelete` / per-row → `ConfirmModal` |
| Mobile filter sidebar | Category sheet — `Open notification categories` / `Close categories panel` |
| Cross-module deep link | Metadata `actionUrl` / module-specific routing in row click |
| Quick actions strip | `NotificationQuickActions` — metadata-driven buttons |
| Filtered empty state | Category-specific copy + filter guidance (NTF-13) |
| API error feedback | `showNotificationActionError()` + `react-hot-toast` |
| Keyboard feed nav | `j`/`k`/`Space`/`Escape` handlers |
| View mode toggle | List / Grouped toolbar icons with `aria-label` |
| Settings sub-route | Functional own chrome until `PageHeader` migration (N-3) |

**Primary references by archetype:**

- **Workspace split modules** → Drive #1 or Calendar #5
- **Management / inbox modules** → **Notifications #2** (this document)
- **Realtime messaging code** → Chat Architecture #2 (not UX)

---

## Future obligations

### Recertification triggers

Re-register or re-audit when:

1. New destructive notification flows ship without `ConfirmModal`
2. `PageHeader` / `PageToolbar` removed from primary feed route
3. Native `prompt()`/`confirm()`/`alert()` reintroduced on user paths
4. Mobile category sheet pattern replaced without QA at 375px
5. New P0 FAIL in platform manual QA Part 2B
6. Cross-module routing contract breaking change (metadata schema)

**Recommended cadence:** Annual or after any interaction-class wave on Notifications surfaces.

### Registration maintenance

| Obligation | Owner | Cadence |
|------------|-------|---------|
| Update scorecard on material UX wave | UX / product | Per wave closeout |
| Re-run Part 2B matrix after destructive-flow changes | QA | Per trigger above |
| Sync `web/src/app/notifications/page.tsx` notification types with manifest | Engineering | Per new module notification ship |
| Track N-4 shared `EmptyState` adoption | Engineering | Optional — upgrades cat 8 to PASS |

---

## Related registrations

| Type | Notifications status |
|------|---------------------|
| **Reference UX #2** | **This document** — Approved with Findings |
| Reference UX #1 | N/A (Drive holds UX #1) |
| Reference UX #5 | Calendar — scheduling/time-grid |
| Reference Architecture #2 | **Chat** (independent — code/realtime) |
| Reference Workspace | N/A (product module) |

---

## Related

- [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md)
- [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md)
- [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) — UX #1 precedent
- [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md) — UX #5 precedent
- [`CHAT_UX_RECERTIFICATION_2026.md`](./CHAT_UX_RECERTIFICATION_2026.md) — prior UX #2 rejection

**Last updated:** 2026-06-12 (Reference UX #2 registration)
