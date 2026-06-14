# Reference Module Registration — Todo

**Registration type:** Reference UX Module **#3**  
**Status:** **Approved with Findings**  
**Date registered:** 2026-06-12  
**moduleId:** `todo`  
**User-facing name:** To-Do / Todo

> **Track clarification:** This is the **UX Reference Todo Module** (workspace-split task / multi-view work management UX) per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) slot **#3**. It is **independent** of **Architecture Reference Module #4** (Todo, Level 3 code). Architecture L3 does not imply UX registration — this document awards the **UX** copy target only.

---

## Registration summary

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **UX level** | **UX-L3 Certified** (11 PASS / 0 PWF / 0 FAIL) |
| **Architecture level** | Level 3 Certified — Reference Module #4 (unchanged) |
| **Benchmark role** | Primary copy target for workspace-split task modules, list/board/calendar multi-view UX, project sidebar management, and task detail secondary panels |
| **UX certification** | [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) |
| **L3 review** | [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](./TODO_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Why Todo qualified (program rules)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) Reference UX Module definition and certification process:

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Modernization waves (interaction + layout + menus) | ✅ 3A-4D + 5D.1 + 5D.3 + 5G |
| 2 | Module scorecard (11 categories) | ✅ [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) — **11 PASS / 0 PWF** |
| 3 | Interaction certification | ✅ 5D.1 task/sub-entity delete `ConfirmModal`; board dnd-kit trash gate |
| 4 | Manual QA matrix | ✅ T-11 resolved — [`TODO_QA_EXECUTION_REPORT_2026.md`](./TODO_QA_EXECUTION_REPORT_2026.md) |
| 5 | Registration decision | ✅ **Approved with Findings** (this document) |
| 6 | Register benchmark | ✅ This document |

**Prerequisite met:** UX-L3 Certified (strict) — **exceeds** UX-L3 Certified with Findings minimum.

**Approved with Findings (not strict Approved):** Carry-forward P3 product polish (T-6, T-10, T-12), BLOCKED verification rows (R-TOD-1, R-TOD-2), and QA-ENV-02 — mirror Calendar #5 and Notifications #2 registration precedent. Zero scorecard PWF; findings are **non-blocking** for reference designation.

---

## Registration review (8 criteria)

### 1. UX-L3 eligibility

| Rule | Result |
|------|--------|
| UX-L3 CwF minimum | ✅ **UX-L3 Certified** (strict) |
| No FAIL | ✅ 0 FAIL |
| Core quartet 1, 2, 4, 11 PASS | ✅ |
| ≥9 strict PASS | ✅ **11 PASS** |
| PWF ≤ 2 | ✅ **0 PWF** |
| Manual QA executed | ✅ T-11 closed (Part 2C) |

Todo meets the **strict** UX-L3 bar — same class as Calendar #5 at registration. Exceeds Notifications #2 (1 PWF at registration).

### 2. QA evidence completeness

| Metric | Value |
|--------|------:|
| PASS | **25** |
| FAIL | **0** |
| BLOCKED | **2** |
| N/A | **1** |
| KNOWN-PWF | **2** |
| P0 FAIL | **0** |

Evidence folder: [`qa-evidence/5G-QA/todo/`](./qa-evidence/5G-QA/todo/)

**Gaps (non-blocking):** TODO-02 business hub BLOCKED (R-TOD-1); TODO-22 attachment BLOCKED (R-TOD-2) — verification-only, same class as Calendar CAL-03/CAL-19.

### 3. Reusable architectural patterns (UX surfaces)

| Pattern | Implementation | Archetype |
|---------|----------------|-----------|
| **WorkspaceSplitLayout task workspace** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` in `TodoModule.tsx` | **Workspace split** (Drive/Calendar class) |
| **List / Board / Calendar multi-view** | View toggles with `aria-label`; `TaskList`, `TaskBoard`, calendar bridge view | Multi-view work module |
| **Shared EmptyState adoption** | `EmptyTaskState` → shared `EmptyState` primitive (T-8) | 5G polish |
| **ConfirmModal destructive workflow** | `requestDeleteTask` → `ConfirmModal` → `executeDeleteTask`; project/subtask paths (5D.1) | Interaction safety |
| **Project sidebar management** | `ProjectManager` — create/edit/delete with labeled controls | Secondary nav column |
| **Task detail panel pattern** | `TaskDetail` in `WorkspaceSecondary`; edit/complete/subtask flows | Split primary/secondary |
| **Mobile responsive secondary panel** | `shrink min-w-0`; `lg:w-96`; 375px list+detail usable (T-7 partial) | Mobile split workspace |
| **Cross-module calendar integration** | Calendar view in Todo; server calendar bridge; TODO-23 PASS | Cross-module read surface |

### 4. Cross-module teaching value

Todo is the platform **work-item workspace** archetype — complementary to:

| Peer UX reference | Todo differentiation |
|-------------------|---------------------|
| Drive #1 | File-centric split; Todo is **task-centric** split with project hierarchy |
| Notifications #2 | Inbox/feed management page; Todo is **authoring + completion** workspace |
| Calendar #5 | Time-grid scheduling; Todo adds **list/board/kanban** views on same work data |

Copy value for new modules:

- How to compose `WorkspaceSplitLayout` with a **mutable primary canvas** (list/board) and **persistent detail secondary**
- How to wire **view mode toggles** without route proliferation
- How to integrate **Calendar read surface** inside a non-calendar module
- How to adopt **shared EmptyState** after local inline empty UI
- How to gate **board drag-to-trash** through global trash confirm contract
- How to ship **`[Module]WorkspaceLanding`** hub entry (business workspace rule)

### 5. Remaining findings (carry-forward)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| **T-6** | Board compact view: overflow menu items `hidden` at narrow widths | P3 | No — TODO-28 KNOWN-PWF |
| **T-10** | Drive file unlink from task detail without `ConfirmModal` | P3 | No — non-destructive unlink; product polish |
| **T-12** | Limited keyboard shortcuts; no arrow-key list navigation | P3 | No — TODO-18 KNOWN-PWF |
| **R-TOD-1** | TODO-02 BLOCKED — business hub not QA-verified on test account | P2 (verification) | No |
| **R-TOD-2** | TODO-22 BLOCKED — no attachment seed for unlink QA | P2 (verification) | No |
| **R-TOD-3** | QA-ENV-02 — `JWT_SECRET` not in root `.env`; inline workaround | P1 (env) | No |

**No P0 or P1 product FAIL findings remain.**

### 6. Comparison against peer Reference UX holders

| Criterion | Drive #1 | Notifications #2 | Calendar #5 | **Todo #3** |
|-----------|----------|------------------|-------------|-------------|
| UX-L3 at registration | Pre-11-cat / interaction+L2 | CwF (1 PWF) | Certified (strict) | **Certified (strict)** |
| PASS categories | Pre-11-cat | 11 | 11 | **11** |
| PWF at registration | Multiple (documented) | 1 | 0 | **0** |
| Manual QA | F-1 historical | N-6 closed | E-14 closed | **T-11 closed** |
| Primary archetype | File workspace split | Management inbox | Time-grid split | **Task workspace split** |
| Architecture reference | File Hub #1 | Chat #2 (independent) | Calendar #3 | **Todo #4** (this module, code track) |

**Conclusion:** Todo is the **strongest strict UX-L3 registration** among workspace-split product modules (tied with Calendar on 11/0/0). Correct holder for UX **#3** — task/work-management copy target.

### 7. Long-term maintenance burden

| Factor | Assessment |
|--------|------------|
| Route surface | **Low** — primary `/todo` + business hub |
| Layout churn | **Low** — stable `WorkspaceSplitLayout` + toolbar pattern |
| Multi-view maintenance | **Medium** — three view implementations (list/board/calendar) |
| Cross-module bridges | **Medium** — Calendar/Drive link surfaces evolve with peer modules |
| Mobile secondary panel | **Low** — responsive width pattern shared with Calendar sheet idioms |
| Recertification triggers | Standard (see below) |

**Net:** Higher view-surface maintenance than Notifications #2 (single feed); comparable to Calendar #5 (multi-route) but confined to one module shell.

### 8. Consistency with existing Reference UX holders

| Holder | UX level at registration | PWF at registration | Decision |
|--------|--------------------------|---------------------|----------|
| Drive #1 | UX-L3 interaction + L2 layout (pre-11-cat) | Multiple | Approved with Findings |
| Notifications #2 | UX-L3 Certified with Findings | 1 | Approved with Findings |
| Calendar #5 | UX-L3 Certified (strict) | 0 | Approved with Findings |
| **Todo #3** | UX-L3 Certified (strict) | 0 | **Approved with Findings** |

Todo meets or exceeds the registration bar held by all prior UX reference modules.

---

## UX quality

### 11-category scorecard (5G-Todo-L3-D authoritative)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PASS** |
| 2 | Layout Consistency | **PASS** |
| 3 | Navigation | **PASS** |
| 4 | Accessibility | **PASS** |
| 5 | Mobile | **PASS** |
| 6 | Cross-Module Integration | **PASS** |
| 7 | Error Handling | **PASS** |
| 8 | Empty States | **PASS** |
| 9 | Loading States | **PASS** |
| 10 | Discoverability | **PASS** |
| 11 | Workflow Completion | **PASS** |

Full detail: [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)

### UX-L3 certification

| Level | Award |
|-------|-------|
| UX-L1 | **Certified** |
| UX-L2 | **Certified** |
| UX-L3 | **Certified** |

Evidence: [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](./TODO_UX_L3_CERTIFICATION_REVIEW.md)

### QA evidence (T-11)

| Metric | Value |
|--------|------:|
| PASS | **25** |
| FAIL | **0** |
| BLOCKED | **2** |
| N/A | **1** |
| KNOWN-PWF | **2** |

Key P0: TODO-09/10 delete confirms, TODO-14/15 mobile 375px, TODO-24/25 aria, TODO-19/20 empty states, TODO-23 calendar view.

---

## Exception documentation (certified)

| Surface | Classification | Rationale |
|---------|----------------|-----------|
| Board compact overflow hidden items | **Certified exception** | T-6 P3 — compact density trade-off; KNOWN-PWF documented |
| Drive file unlink without confirm | **Certified exception** | T-10 P3 — unlink ≠ delete; optional future confirm |
| Limited keyboard list navigation | **Certified exception** | T-12 P3 — TODO-18 KNOWN-PWF; shortcuts help deferred |
| Business hub QA BLOCKED | **Verification gap** | R-TOD-1 — hub pattern implemented; QA account lacked business context |
| Attachment unlink QA BLOCKED | **Verification gap** | R-TOD-2 — no seeded attachment in QA matrix |

---

## Platform integration

| System | Todo integration | Copy note |
|--------|------------------|-----------|
| **Calendar** | `todoCalendarBridgeService`; calendar view in `TodoModule`; due dates on cells | Copy **read-surface** bridge — server bridge authoritative |
| **Drive** | File attachments via `todoIntegrationLinkService`; visibility on links | Copy attachment link UX in detail panel |
| **Notifications** | `todo_assigned` / due types in manifest | Copy assignment notification metadata |
| **Global Trash** | `todoTrashService` + handler; board drag → bin confirm | Copy soft-delete + confirm pattern |
| **V_Link** | `todo:task` entity; access/lifecycle services | Copy conservative single-entity V_Link |
| **AI** | `todoAIActionService`; context providers in manifest | Copy AI action routing — not controller Prisma |
| **Business Workspace** | `TodoWorkspaceLanding` + `BusinessWorkspaceContent` `case 'todo'` | Copy hub-first module entry |
| **Realtime** | Task assignment/update socket events | Copy tenant-scoped emit |

Architecture detail: [`TODO_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md)

---

## Waves that contributed

| Wave | Contribution | Closeout |
|------|--------------|----------|
| **3A-4D** | `ContextMenu` / `DropdownMenu` on task surfaces | [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](./TODO_MENU_ROLLOUT_CLOSEOUT.md) |
| **5D.1** | Task delete `ConfirmModal`; board trash gate (T-1) | [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md) |
| **5D.3** | `WorkspaceSplitLayout` + hub + workflow (T-2–T-5) | [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md) |
| **5D.4** | UX-L1 CwF baseline | [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md) |
| **5G** | T-8 `EmptyState`; T-9 aria; T-7 partial width | [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md) |
| **5G-Todo-D** | UX-L2 CwF re-certification | [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) |
| **5G-QA-EXEC** | Part 2C manual QA (T-11) | [`TODO_QA_EXECUTION_REPORT_2026.md`](./TODO_QA_EXECUTION_REPORT_2026.md) |
| **5G-Todo-L3-D** | UX-L3 Certified | [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](./TODO_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Reusable patterns catalog

When building task, project, or work-management modules, copy Todo patterns for:

| Need | Todo reference | Key files |
|------|----------------|-----------|
| **Workspace split shell** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` | `TodoModule.tsx` |
| **List view** | Filterable `TaskList` + `TaskItem` row actions | `TaskList.tsx`, `TaskItem.tsx` |
| **Board view** | Column layout + dnd-kit; trash via global bin | `TaskBoard.tsx` |
| **Calendar view** | Embedded due-date calendar surface | `TodoModule.tsx` calendar mode |
| **View toggles** | Toolbar icons with `List view` / `Board view` / `Calendar view` labels | `TodoModule.tsx` toolbar |
| **Empty states** | `EmptyTaskState` wrapping shared `EmptyState` | `EmptyTaskState.tsx` |
| **Destructive delete** | `requestDeleteTask` → `ConfirmModal` → `executeDeleteTask` | `TodoModule.tsx` |
| **Project sidebar** | `ProjectManager` create/edit/delete + aria labels | `ProjectManager.tsx` |
| **Task detail panel** | `TaskDetail` in `WorkspaceSecondary`; edit/complete/subtasks | `TaskDetail.tsx` |
| **Mobile secondary panel** | Responsive `WorkspaceSecondary` — `shrink min-w-0`; `lg:w-96` | `TodoModule.tsx` layout |
| **Cross-module calendar** | Calendar view + server bridge for due dates | `todoCalendarBridgeService` (server); UI in `TodoModule` |
| **Business hub entry** | `TodoWorkspaceLanding` in `BusinessWorkspaceContent` | `TodoWorkspaceLanding.tsx` |
| **Overflow actions** | `DropdownMenu` with `aria-label="Task actions"` | `TaskItem.tsx` |

**Primary references by archetype:**

- **File / entity browser** → Drive #1
- **Inbox / notification feed** → Notifications #2
- **Scheduling / time-grid** → Calendar #5
- **Task / project / work-item workspace** → **Todo #3** (this document)
- **Realtime messaging code** → Chat Architecture #2 (not UX)

---

## Future obligations

### Recertification triggers

Re-register or re-audit when:

1. New destructive task flows ship without `ConfirmModal`
2. `WorkspaceSplitLayout` / `PageHeader` / `PageToolbar` removed from primary `/todo` route
3. Native `prompt()`/`confirm()`/`alert()` reintroduced on user paths
4. Board drag-to-trash bypasses `GlobalTrashBin` confirm contract
5. Major mobile redesign of list+detail split without 375px QA
6. New P0 FAIL in platform manual QA Part 2C
7. Calendar bridge contract breaking change (due-date surfacing)

**Recommended cadence:** Annual or after any interaction-class wave on Todo surfaces.

### Registration maintenance

| Obligation | Owner | Cadence |
|------------|-------|---------|
| Update scorecard on material UX wave | UX / product | Per wave closeout |
| Re-run Part 2C matrix after destructive-flow changes | QA | Per trigger above |
| Track T-10 Drive unlink confirm (optional) | Engineering | P3 backlog |
| Track T-12 keyboard shortcuts help | Engineering | P3 backlog |
| Re-verify R-TOD-1 business hub when QA account has business | QA | Next matrix run |
| Seed attachment for R-TOD-2 TODO-22 | QA | Next matrix run |

### Carry-forward remediation (optional, non-blocking)

| ID | Remediation | Impact |
|----|-------------|--------|
| T-6 | Expose compact board overflow items at narrow widths | Discoverability polish |
| T-10 | Add `ConfirmModal` on Drive file unlink | Interaction parity |
| T-12 | Add `?` shortcuts help + arrow-key list nav | Accessibility polish |
| R-TOD-1 | Execute TODO-02 with business-enabled QA account | Verification closure |
| R-TOD-2 | Seed task attachment for TODO-22 | Verification closure |

---

## Official holder determination

| Question | Answer |
|----------|--------|
| Does Todo become **Reference UX Module #3**? | **Yes** — effective upon publication of this document |
| Registration decision | **Approved with Findings** |
| UX certification level change? | **No** — remains UX-L3 Certified |
| Council action required? | **No** — registration review only per wave charter; mirrors Notifications #2 and Calendar #5 governance waves |
| Slot conflict? | **None** — UX #3 was vacant; Architecture #4 (Todo code) is independent |

---

## Related registrations

| Type | Todo status |
|------|-------------|
| **Reference UX #3** | **This document** — Approved with Findings |
| Reference UX #1 | Drive — file workspace |
| Reference UX #2 | Notifications — management inbox |
| Reference UX #5 | Calendar — scheduling/time-grid |
| Reference Architecture #4 | Level 3 Certified — [`TODO_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md) |
| Reference Workspace | N/A (product module with hub pattern) |

---

## Related

- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) — UX #1 precedent
- [`REFERENCE_MODULE_NOTIFICATIONS.md`](./REFERENCE_MODULE_NOTIFICATIONS.md) — UX #2 precedent
- [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md) — UX #5 precedent

**Last updated:** 2026-06-12 (Reference UX #3 registration)
