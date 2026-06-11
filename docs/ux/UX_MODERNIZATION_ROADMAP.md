# Vssyl UX Modernization Roadmap

**Status:** Wave 5A framework complete (2026-06-03)  
**Scope:** Governance and incremental waves — not a feature redesign sprint.

---

## Objective

Build and enforce a unified UX system (tokens, layouts, components, interactions, accessibility) across Dashboard, Drive/File Hub, Chat, Calendar, Place, Admin, Business Workspace, Analytics, Settings, and future modules.

Parallel to platform **architecture** modernization — same rigor, separate certification track.

---

## Reference UX Module #1

**Registered:** Drive / File Hub — **Approved with Findings** (3B-6 + 5A)

| Doc | Purpose |
|-----|---------|
| [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md) | Benchmark registration |
| [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md) | L1/L2/L3 definitions |
| [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md) | 11-category PASS/FAIL scorecard |
| [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md) | Reference slot program |

**Architecture alignment:** File Hub is also Reference Implementation #1 for code — see [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](../architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md).

---

## Wave 0 — Inventory & foundation (current)

| Task | Status |
|------|--------|
| UX constitution + standards docs | Done (2026-06-03) |
| Five-family token scaffolding (`tokens.css`) | Done (2026-06-03) |
| Agent rule `ux-standards.mdc` | Done (2026-06-03) |
| Audit template + scorecard | Done (2026-06-03) |
| Module-by-module inventory appendix | **Pending** (fill during audits) |

### Wave 0 inventory checklist (to complete in Wave 4 prep)

| Module | Layout archetype | Token debt | Component gaps | Dark mode | Notes |
|--------|------------------|------------|----------------|-----------|-------|
| Dashboard | Dashboard | High (widgets) | Mixed | Partial | |
| Drive / File Hub | Workspace | Medium | Low | Good | Reference candidate |
| Chat | Workspace | Medium | Medium | Good | |
| Calendar | Workspace | Medium | Medium | Partial | |
| Place | Workspace | Medium | Medium | Partial | |
| Admin Portal | Management | High | Medium | Partial | |
| Business Workspace | Workspace | Medium | Hub landing | Partial | |
| Analytics | Management | High | Charts | Partial | |
| Settings | Management | Medium | Forms | Partial | |
| Notebook | Workspace | Medium | MLVP | Partial | |

---

## Wave 1 — Token foundation (2026-06-03) ✅

- **Done:** `Spinner`, `EmptyState`, `Card`, `Input`, `Button`, `LoadingOverlay` → `v.*` tokens
- **Deferred:** `LoadingSkeleton` → Wave 1.5
- **No** module page migrations

## Wave 1.5 — Skeleton tokens (2026-06-03) ✅

- **Done:** `--v-skeleton-*` in `tokens.css`; `@keyframes skeleton-loading` + `.v-skeleton` in `ux.css`
- **Done:** `LoadingSkeleton.tsx` uses `.v-skeleton` (API unchanged)
- **Done:** Family 6 documented in `DESIGN_TOKENS.md`
- **No** module page changes

---

## Wave 2A — Modal (2026-06-03) ✅

- **2A-1:** `Modal.tsx` tokenized shell  
- **2A-2:** Five custom-shell migrations (`ShareLinkModal`, `VLinkShareModal`, Drive shortcuts, `ModuleManagementModal`, `DashboardBuildOutModal`)  
- **2A-3:** Certification **PASS WITH FINDINGS** — [`audits/MODAL_STANDARDIZATION_CLOSEOUT.md`](./audits/MODAL_STANDARDIZATION_CLOSEOUT.md)

## Wave 2B — ConfirmModal

| Phase | Status |
|-------|--------|
| **2B plan** | Done — [`CONFIRMMODAL_STANDARDIZATION_PLAN.md`](./CONFIRMMODAL_STANDARDIZATION_PLAN.md) |
| **2B-1 primitive** | Done — `ConfirmModal.tsx`, `useConfirm.ts`, focus trap utility |
| **2B-2 pilot** | Done — `ModuleManagementModal` — [`audits/CONFIRMMODAL_PILOT_CLOSEOUT.md`](./audits/CONFIRMMODAL_PILOT_CLOSEOUT.md) |
| **2B-3 Batch 1** | **Done** — 8 sites — [`audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) (**PASS WITH FINDINGS**) |
| **2B-4 Batch 2** | **Closed** — 2A + 2B + 2C (17 sites, 11 files) — [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md) (**PASS WITH FINDINGS**) |
| **2B-5 Batch 3** | **PLAN pending** — recommend **3A Drive permanent purge** (2 sites); **43** `web/` confirms remaining |
| **2B-6+ rollout** | Deferred — calendar binary, admin/governance, scheduling, HR, retention, billing |

## Wave 2 — Shared components (remaining)

**Planning:** [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md)

### Tier 1 (remaining) — Wave 3A

| Phase | Status |
|-------|--------|
| **3A-0 Inventory** | **Done** — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) |
| **3A-1 Shell + tokens** | **Done** — `ContextMenu` + `Popover` tokenized; `destructive` / `heading` item flags; Storybook |
| **3A-2 Primitive hardening** | **Done** — `menuShared`; `DropdownMenu` scaffold; Popover portal/dismiss; baseline a11y |
| **3A-3 Drive reference rollout** | **Done** — [`DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md`](./DRIVE_MENU_REFERENCE_ROLLOUT_PLAN.md); closeout [`audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md`](./audits/DRIVE_MENU_REFERENCE_CLOSEOUT.md) (**PASS WITH FINDINGS**) |
| **3A-4 Platform rollout** | **Done** — Drive reference + **3A-4A AI** + **3A-4B Notifications** + **3A-4C Chat** + **3A-4D Todo** — [`audits/TODO_MENU_ROLLOUT_CLOSEOUT.md`](./audits/TODO_MENU_ROLLOUT_CLOSEOUT.md) |
| **3A-5 Certification** | **Done** — **PASS WITH FINDINGS** — [`audits/PLATFORM_MENU_CERTIFICATION.md`](./audits/PLATFORM_MENU_CERTIFICATION.md); manual QA gate pending |

1. ContextMenu (retain; pointer-position menus)  
2. Popover (low-level floating shell; 3A-2 portal/placement)  
3. DropdownMenu (trigger-anchored action menus; **Option A** — see [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) §11)

### Tier 2

Switch, Tabs, Textarea, Checkbox/Radio, Toast (+ `react-hot-toast` policy)

### Tier 3 (architectural review)

BrandButton, ErrorState, Drawer/BottomSheet, SearchBox consolidation

### Hygiene (parallel doc-only / small PR)

- Deprecate `Checkbox 2.tsx`, `index 2.ts`, `index.d 2.ts`  
- EmptyState optional `action` prop  
- Export `LoadingOverlay` / `LoadingSkeleton` from `index.ts` (additive)

Wave 1 primitives (Button, Input, Card, etc.) **already migrated** — not repeated in Wave 2 scope.

---

## Wave 3 — Split tracks (per [`UX_PROGRAM_REVIEW.md`](./UX_PROGRAM_REVIEW.md))

### Wave 3A — ContextMenu + Popover / DropdownMenu

- **3A-0:** Inventory — [`CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md`](./CONTEXTMENU_POPOVER_STANDARDIZATION_REVIEW.md) (**done**)
- **3A-1:** Shared shell tokenization (`ContextMenu`, `Popover`) — **done**
- **3A-2:** Primitive hardening (`menuShared`, `DropdownMenu` scaffold, Popover portal/dismiss) — **done**
- **3A-3:** Drive / File Hub reference rollout
- **3A-4:** AI, Chat, Notifications, Todo migrations — **done** (Scheduling deferred)
- **3A-5:** Certification closeout — **done** — [`audits/PLATFORM_MENU_CERTIFICATION.md`](./audits/PLATFORM_MENU_CERTIFICATION.md) (**PASS WITH FINDINGS**)

**Findings (3A-3 closeout):** Drive reference complete — 2 `ContextMenu`, 1 `DropdownMenu`, 1 `Popover` consumers in Drive; `FileContextMenu` deleted; `DriveSearch` orphan documented.

### Wave 3B — Drive interaction completion

**Status:** **3B-0 PLAN complete** — [`DRIVE_INTERACTION_COMPLETION_REVIEW.md`](./DRIVE_INTERACTION_COMPLETION_REVIEW.md). **Wave 3C paused** until 3B interaction certification or explicit reprioritization.

| Phase | Scope | Status |
|-------|-------|--------|
| **3B-0** | Interaction inventory + certification gap analysis | **Done (PLAN)** |
| **3B-1** | ConfirmModal Batch 3A — permanent purge (`drive/trash`, `GlobalTrashBin`) | **Done** — [`audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_PURGE_BATCH3A_CLOSEOUT.md) |
| **3B-2** | Drag-to-trash parity (`DriveModule` → `requestMoveToTrash`) | **Done** — [`audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md`](./audits/DRIVE_DRAG_TO_TRASH_PARITY_BATCH3B2_CLOSEOUT.md) |
| **3B-3** | Per-item permanent delete confirms (trash page + GlobalTrashBin) | **Done** — [`audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md`](./audits/DRIVE_PERMANENT_DELETE_PER_ITEM_BATCH3B3_CLOSEOUT.md) |
| **3B-4** | Folder create modal (replace 7× `prompt()`) | **Done** — [`audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md`](./audits/DRIVE_FOLDER_CREATE_MODAL_BATCH3B4_CLOSEOUT.md) |
| **3B-4b** | Business workspace folder create parity (`BusinessWorkspaceContent`) | **Done** — [`audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md`](./audits/DRIVE_FOLDER_CREATE_BUSINESS_PARITY_BATCH3B4B_CLOSEOUT.md) |
| **3B-5** | Keyboard Delete + trash a11y pass | **Done** — [`audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md`](./audits/DRIVE_KEYBOARD_A11Y_BATCH3B5_CLOSEOUT.md) |
| **3B-6** | Drive interaction certification closeout + manual QA | **Done** — [`audits/DRIVE_INTERACTION_CERTIFICATION.md`](./audits/DRIVE_INTERACTION_CERTIFICATION.md); **Reference UX Module #1 (Approved with Findings)** |

**Reference UX gate:** Drive is **Reference UX Module #1** for interaction + menus + layout (3B-6). Wave 5 numeric UX-L3 scorecard recommended as follow-up.

### Wave 3C — Layout shells

| Phase | Status |
|-------|--------|
| **3C-0 Inventory** | **Done** — [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](./LAYOUT_SHELL_STANDARDIZATION_REVIEW.md) |
| **3C-1 WorkspaceSplitLayout** | **Done** — primitive + Drive pilot (`DrivePageContent`, `DriveModule`) |
| **3C-2 Drive rollout** | **Done** — all active Drive routes + business `case 'drive'` |
| **3C-3 Chat rollout** | **Done** — `ChatContent` (3-col) + `EnhancedChatModule` (2/3-col); exceptions: `MobileChat`, `UnifiedGlobalChat` |
| **3C-4 PlatformShell planning** | **Done** — [`PLATFORMSHELL_STANDARDIZATION_PLAN.md`](./PLATFORMSHELL_STANDARDIZATION_PLAN.md) (PLAN only) |
| **3C-4A PlatformShell foundation** | **Done** — `PlatformShell.tsx` + slot subcomponents; no consumers |
| **3C-4B Shared shell content** | **Done** — `PlatformLeftSidebar` + `PlatformRightRail`; Inner + Wrapper wired |
| **3C-4C Business PlatformShell** | **Done** — `DashboardLayoutWrapper` → `PlatformShell` |
| **3C-4D Header unification planning** | **Done** — [`PLATFORM_HEADER_STANDARDIZATION_PLAN.md`](./PLATFORM_HEADER_STANDARDIZATION_PLAN.md) (PLAN only) |
| **3C-4D.1 PlatformHeader foundation** | **Done** — `PlatformHeader` + tab utilities + `useNativeHeader` |
| **3C-4D.2 GlobalHeaderTabs refactor** | **Done** — first `PlatformHeader` consumer; `useNativeHeader` on Wrapper |
| **3C-4D.3 Personal header refactor** | **Done** — `DashboardLayoutInner` on `PlatformHeader`; tab logic in Inner |
| **3C-4D.4 Shared header actions** | **Done** — `PlatformHeaderActionRow`; AI polling business-only (Option A) |
| **3C-4E Personal PlatformShell** | **Done** — `DashboardLayoutInner` → `PlatformShell` |
| **3C-4F PlatformShell certification** | **Done** — [`PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md) PASS WITH FINDINGS |
| **3C-5 AI Chat deduplication** | **Done** — [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./audits/AI_CHAT_DEDUPLICATION_CLOSEOUT.md); `AIChatWorkspace` + thin `page` / `AIChatModule` |
| **3C-6 Notifications layout** | **Done** — [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](./audits/NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md); `PageHeader` + `PageToolbar` |
| **3C-7–3C-9 Rollout + certification** | Pending |

- Standardize Dashboard, Workspace, Management, Detail shells
- Extract repeated workspace chrome where safe
- Mobile behavior per [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md)
- **Reference:** Workspace → Drive (`DrivePageContent`); Global → `DashboardLayoutInner` (extract `PlatformShell`)

---

## Wave 4 — Module audits

For each module in inventory table:

1. Copy [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md)
2. Score with [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)
3. File remediation PRs by wave

Order suggestion: Drive (baseline) → Chat → Calendar → Dashboard → Place → Business → Admin → Analytics → Settings.

---

## Wave 5 — UX certification

### Wave 5A — Platform UX-L3 scorecard framework ✅

**Status:** **Done** (documentation-only)

| Deliverable | Path |
|-------------|------|
| Certification standard (L1/L2/L3) | [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md) |
| Scorecard (11 categories, PASS/FAIL) | [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md) |
| Reference module program | [`REFERENCE_MODULE_PROGRAM.md`](./REFERENCE_MODULE_PROGRAM.md) |
| Drive benchmark registration | [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md) |

### Wave 5B — Chat UX certification ✅

**Status:** **Done** (documentation-only audit)

| Deliverable | Path |
|-------------|------|
| Chat scorecard (11 categories) | [`audits/CHAT_UX_SCORECARD.md`](./audits/CHAT_UX_SCORECARD.md) |
| Chat certification | [`audits/CHAT_UX_CERTIFICATION.md`](./audits/CHAT_UX_CERTIFICATION.md) |

**Award:** **UX-L1 Certified with Findings** (3 PASS / 8 PASS WITH FINDINGS / 0 FAIL).  
**Reference UX Module #2:** **Rejected** — pending re-certification after interaction remediation.

### Wave 5B.1 — Chat interaction safety ✅

**Status:** **Done** (implementation)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md`](./audits/CHAT_INTERACTION_SAFETY_BATCH5B1_CLOSEOUT.md) |

**Resolved:** C-1 message delete `ConfirmModal`; C-2 conversation drag bypass; C-3 global/stackable delete stubs.  
**Remaining:** C-8 manual QA — formal Chat re-cert for L2.

### Wave 5B.2 — Chat mobile parity ✅

**Status:** **Done** (implementation)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md`](./audits/CHAT_MOBILE_PARITY_BATCH5B2_CLOSEOUT.md) |

**Resolved:** C-4 mobile delete / overflow stubs — `MobileChat` reply/delete/react + `ConfirmModal`; dead header/input stubs removed.

### Wave 5B.3 — Chat UX re-certification ✅

**Status:** **Done** (documentation-only)

| Deliverable | Path |
|-------------|------|
| Re-certification | [`audits/CHAT_UX_RECERTIFICATION_2026.md`](./audits/CHAT_UX_RECERTIFICATION_2026.md) |

**Award:** **UX-L1 Certified with Findings** (6 PASS / 5 PWF / 0 FAIL). **UX-L2/L3:** Not certified. **Reference UX #2:** Rejected.

### Wave 5C — Notifications UX certification ✅

**Status:** **Done** (documentation-only audit)

| Deliverable | Path |
|-------------|------|
| Scorecard | [`audits/NOTIFICATIONS_UX_SCORECARD.md`](./audits/NOTIFICATIONS_UX_SCORECARD.md) |
| Certification | [`audits/NOTIFICATIONS_UX_CERTIFICATION.md`](./audits/NOTIFICATIONS_UX_CERTIFICATION.md) |

**Award:** **UX-L1 Certified with Findings** (7 PASS / 4 PWF / 0 FAIL). **UX-L2/L3:** Not certified. **Reference slot:** Not assigned (N-1 bulk delete confirm gap at audit time).

### Wave 5C.1 — Notifications interaction safety ✅

**Status:** **Done** (implementation)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](./audits/NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md) |

**Resolved:** **N-1** — bulk delete gated on `ConfirmModal` (`requestBulkDelete` → `executeBulkDelete`). Per-item delete unchanged.

**Projected post-fix:** 9 PASS / 4 PWF — **UX-L2 likely** on re-cert; not re-certified in 5C.1.

### Wave 5C.2 — Notifications UX re-certification ✅

**Status:** **Done** (documentation-only)

| Deliverable | Path |
|-------------|------|
| Re-certification | [`audits/NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./audits/NOTIFICATIONS_UX_RECERTIFICATION_2026.md) |

**Award:** **UX-L2 Certified with Findings** (9 PASS / 4 PWF / 0 FAIL). Categories 1 + 11 upgraded post N-1. **UX-L3:** Not certified. **Reference slot:** Not eligible.

### Wave 5D — Todo UX certification ✅

**Status:** **Done** (documentation-only audit)

| Deliverable | Path |
|-------------|------|
| Scorecard | [`audits/TODO_UX_SCORECARD.md`](./audits/TODO_UX_SCORECARD.md) |
| Certification | [`audits/TODO_UX_CERTIFICATION.md`](./audits/TODO_UX_CERTIFICATION.md) |

**Award:** **UX-L1 Certified with Findings** (4 PASS / 7 PWF / 0 FAIL). **UX-L2/L3:** Not certified. **Reference slot:** Not eligible. **Primary gap at audit:** T-1 task delete confirm.

### Wave 5D.1 — Todo interaction safety ✅

**Status:** **Done** (implementation)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./audits/TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md) |

**Resolved:** **T-1** — `requestDeleteTask` → `ConfirmModal` → `executeDeleteTask` in `TodoModule`; board dnd-kit trash no longer immediate.

**Projected post-fix:** 6 PASS / 5 PWF — L2 still requires layout + additional PASS (≥9). Not re-certified in 5D.1.

### Wave 5D.2 — Todo UX re-certification ✅

**Status:** **Done** (documentation-only)

| Deliverable | Path |
|-------------|------|
| Re-certification | [`audits/TODO_UX_RECERTIFICATION_2026.md`](./audits/TODO_UX_RECERTIFICATION_2026.md) |

**Award:** **UX-L1 Certified with Findings** (6 PASS / 5 PWF / 0 FAIL). Categories 1 + 11 upgraded post T-1. **UX-L2/L3:** Not certified. **Reference slot:** Not eligible.

### Wave 5D+ — Per-module certification (pending)

- Score remaining candidate modules against 5A framework
- Award UX-L1 / L2 / L3 per module
- Register additional Reference UX modules when qualified
- Publish UX certification ledger (parallel to `CERTIFICATION_LEDGER.md`)

### Module certification readiness (estimate)

Readiness = estimated effort to reach **UX-L2 Certified** using Drive as benchmark. Not a formal scorecard award.

| Priority | Module | `moduleId` | Readiness | Rationale |
|----------|--------|------------|-----------|-----------|
| 1 | **Chat** | `chat` | **Medium** (post-5B.3) | **UX-L1 CwF** awarded; L2 needs 3 more PASS cats + C-8 QA |
| 2 | **Notifications** | `notifications` | **Low** (post-5C.2) | **UX-L2 CwF** awarded (9 PASS); L3 needs N-6 QA + cat 4 PASS |
| 3 | **Todo** | `todo` | **Low** (post-5G-Todo-D) | **UX-L2 CwF** (9 PASS); L3 needs T-11 QA + cat 4 PASS |
| 4 | **Calendar** | `calendar` | **Low** (post-3C-7D) | **UX-L2 CwF** (9 PASS / 2 PWF); L3 blocked on **E-14** QA only — see [`CALENDAR_UX_L3_READINESS_REVIEW.md`](./audits/CALENDAR_UX_L3_READINESS_REVIEW.md) |
| 5 | **AI** | `ai` | **Medium** | 3C-5 workspace dedup; 3A-4A menus; complex surfaces — needs L2 layout pass + interaction scorecard |
| 6 | **Place** | `place` | **Medium** | Architecture Reference #5; UX hub exists (`PlaceWorkspaceLanding`) — menus/layout/interaction not Drive-parity |
| 7 | **Scheduling** | `scheduling` | **Low** | Tied to Calendar; HTML5 trash exceptions; limited UX wave investment |
| 8 | **HR** | `hr` | **Low** | Enterprise forms/workflows; high custom UI; no modernization waves complete |

**Wave 5D.3 (Todo layout/workflow):** **done** — [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./audits/TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md): T-2–T-5 resolved.

**Wave 5D.4 (Todo re-certification):** **done** — [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./audits/TODO_UX_RECERTIFICATION_2026_5D4.md): **8 PASS / 3 PWF**; UX-L1 CwF; UX-L2 not met (one category short).

**Wave 5G (Todo L2 polish):** **done** — [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./audits/TODO_L2_POLISH_BATCH5G_CLOSEOUT.md): T-8, T-9 resolved; T-7 partial; `pnpm type-check` PASS.

**Wave 5G-Todo-D (Todo re-certification):** **done** — [`TODO_UX_RECERTIFICATION_2026_5G.md`](./audits/TODO_UX_RECERTIFICATION_2026_5G.md): **9 PASS / 2 PWF**; **UX-L1 Certified**; **UX-L2 CwF**.

**Wave 5G-QA (Platform manual QA plan):** **done** — [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md) + [`PLATFORM_MANUAL_QA_RUNBOOK.md`](./PLATFORM_MANUAL_QA_RUNBOOK.md): unified matrix for Drive, Notifications, Todo, Calendar, Chat; maps F-1, N-6, T-11, E-14, C-8.

**Wave 5G-QA-D (Platform QA certification addenda):** **done** — [`PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md`](./audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md) + per-module `*_QA_ADDENDUM_2026.md`: QA **not executed** (no matrix sign-off, no evidence); **certification levels unchanged**; F-1, N-6, T-11, E-14, C-8 remain open.

**Wave 5G-Calendar-L3-Prep (Calendar UX-L3 readiness):** **done** — [`CALENDAR_UX_L3_READINESS_REVIEW.md`](./audits/CALENDAR_UX_L3_READINESS_REVIEW.md): **78%** L3-ready; engineering complete; **E-14** QA is sole blocker; next **5G-QA-EXEC** → **5G-Calendar-D**.

**Wave 5G-QA-EXEC (Calendar QA execution):** **attempted 2026-06-03** — [`CALENDAR_QA_EXECUTION_REPORT_2026.md`](./audits/CALENDAR_QA_EXECUTION_REPORT_2026.md): **0 PASS / 24 BLOCKED**; **QA-ENV-01** (`menuShared.js` compile); **E-14 open**; evidence in [`qa-evidence/5G-QA/calendar/`](./audits/qa-evidence/5G-QA/calendar/).

**Recommended next (platform):** **Unblock QA-ENV-01** → **re-run 5G-QA-EXEC** on staging or fixed local → **5G-Calendar-D** L3 CwF → Reference UX #5 prep.

**Wave 5E (Calendar UX certification):** **done** — initial audit: UX-L1 not certified (2 PASS / 2 FAIL).

**Wave 5E.1 (Calendar interaction safety):** **done** — [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](./audits/CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md): E-1–E-3, E-9 resolved; 0 native dialogs; `pnpm type-check` PASS.

**Wave 5E.2 (Calendar month workflow parity):** **done** — [`CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md`](./audits/CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md): E-4, E-5 resolved; `EventDrawer` on month route.

**Wave 5E.3 (Calendar UX re-certification):** **done** — [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./audits/CALENDAR_UX_RECERTIFICATION_2026_5E3.md): **6 PASS / 5 PWF / 0 FAIL**; **UX-L1 Certified with Findings**.

**Wave 3C-7A (Calendar layout shell + hub):** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md): `CalendarPageShell`, `CalendarWorkspaceLanding`, month route + business hub migrated; E-6, E-7 resolved; partial E-8; `pnpm type-check` PASS.

**Wave 3C-7B (Calendar consolidation + mobile):** **done** — [`CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md): day/week/year routes on `CalendarPageShell`; mobile sidebar sheet; E-8, E-10, E-16 resolved; `BusinessCalendarWidget` removed; `pnpm type-check` PASS.

**Wave 3C-7C (Calendar polish):** **done** — [`CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md): shared `EmptyState`; `ContextMenu` on event chips; shortcuts help (`?`); E-11, E-12, E-13 resolved; `pnpm type-check` PASS.

**Wave 3C-7D (Calendar UX re-certification):** **done** — [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md): **9 PASS / 2 PWF / 0 FAIL**; **UX-L1 Certified**; **UX-L2 Certified with Findings**; UX-L3 not certified.

**3C-7 program:** **complete.**

### Wave 5F — Platform certification gap analysis ✅

**Status:** **done** — analysis only (no source changes).

| Deliverable | Path |
|-------------|------|
| Gap report | [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](./PLATFORM_CERTIFICATION_GAP_ANALYSIS.md) |

**Snapshot:** **3** modules at UX-L2 CwF (Notifications, Calendar, Todo); Chat **three PASS short** of L2; Drive Reference #1 without formal 11-cat scorecard.

**Wave 5G-Todo / 5G-Todo-D:** **done** — Todo at **UX-L2 CwF**.  
**Wave 5G-Calendar-L3-Prep:** **done** — Calendar **78%** L3-ready; no engineering wave before QA.  
**5G-QA-EXEC:** **attempted** — live execution blocked (QA-ENV-01).  
**Recommended next:** Unblock environment → **re-run 5G-QA-EXEC** → **5G-Calendar-D**.  
**Recommended Reference path:** Calendar → **Reference UX #5** after L3 CwF; Notifications → **#2** candidate.

---

## Explicitly out of scope (all waves until approved)

- Full visual rebrand
- Third-party design system adoption
- Module feature redesign
- Breaking layout refactors without migration plan

---

## Related

- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)
- [`docs/plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) (architecture track)

**Last updated:** 2026-06-03 (Wave 5F platform certification gap analysis complete)
