# Vssyl UX Modernization Roadmap

**Status:** Wave 6C-Reference-Workspace-Charter complete (2026-06-14)  
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

### Wave 5H-AI-UX-A — AI Experience UX audit ✅

**Status:** **Done** (documentation-only audit)

| Deliverable | Path |
|-------------|------|
| Audit | [`audits/AI_EXPERIENCE_UX_AUDIT_2026.md`](./audits/AI_EXPERIENCE_UX_AUDIT_2026.md) |
| Scorecard | [`audits/AI_EXPERIENCE_UX_SCORECARD.md`](./audits/AI_EXPERIENCE_UX_SCORECARD.md) |
| Certification baseline | [`audits/AI_EXPERIENCE_UX_CERTIFICATION.md`](./audits/AI_EXPERIENCE_UX_CERTIFICATION.md) |

**Baseline:** **3 PASS / 6 PWF / 2 FAIL** — cats **2** Layout, **5** Mobile **FAIL**; embedded delete/menu gaps (**AI-1**, **AI-2**). **No certification awarded.** Reference UX **#4 Deferred** (conditional reserve).

**Readiness:** L1 **42%** · L2 **28%** · L3 **15%**.

**Next:** **5H-AI-UX-D** (Part 2F QA + cert review).

### Wave 5H-AI-Ref4-Registration — Reference UX #4 designation ✅

**Status:** **Done** (governance only — no engineering; no certification change)

| Deliverable | Path |
|-------------|------|
| Registration artifact | [`audits/REFERENCE_MODULE_AI.md`](./audits/REFERENCE_MODULE_AI.md) |

**Decision:** **Approved with Findings** — AI Experience is **Reference UX Module #4**.

**UX level (unchanged):** UX-L1 · UX-L2 · **UX-L3 Certified with Findings**.

**Roster:** UX slots **#1–#5** fully registered.

### Wave 5H-AI-Ref4-Prep — Reference UX #4 readiness review ✅

**Status:** **Done** (governance only — no registration; no council)

| Deliverable | Path |
|-------------|------|
| Readiness review | [`audits/AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md`](./audits/AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md) |

**Recommendation:** **Approved with Findings** (readiness) — UX-L3 CwF + Part 2F QA + portfolio fit satisfied.

**Slot:** **Vacant — reserved**; AI Experience recommended official holder at council.

**Next:** **5H-AI-Ref4-Registration** — draft `REFERENCE_MODULE_AI.md` + council sign-off.

### Wave 5H-AI-L1L2-D — AI Experience certification review ✅

**Status:** **Done** (governance only — no engineering; no UX #4 registration)

| Deliverable | Path |
|-------------|------|
| Certification review | [`audits/AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md`](./audits/AI_EXPERIENCE_UX_CERTIFICATION_REVIEW_2026.md) |
| Scorecard | [`audits/AI_EXPERIENCE_UX_SCORECARD.md`](./audits/AI_EXPERIENCE_UX_SCORECARD.md) |
| Certification | [`audits/AI_EXPERIENCE_UX_CERTIFICATION.md`](./audits/AI_EXPERIENCE_UX_CERTIFICATION.md) |

**Award:** **UX-L1 Certified** · **UX-L2 Certified** · **UX-L3 Certified with Findings**.

**Scorecard:** **11 PASS / 0 PWF / 0 FAIL** — **AI-9** non-scorecard debt; cat 2 **PASS**.

**UX #4:** **Eligible With Findings** — slot **still reserved**.

**Next:** **5H-AI-Ref4-Registration** when council ready.

### Wave 5H-AI-UX-D — AI Experience QA execution ✅

**Status:** **Done** (QA evidence only — no certification award)

| Deliverable | Path |
|-------------|------|
| Execution report | [`audits/AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](./audits/AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md) |
| Evidence inventory | [`audits/qa-evidence/5G-QA/ai/EVIDENCE_INVENTORY.md`](./audits/qa-evidence/5G-QA/ai/EVIDENCE_INVENTORY.md) |
| Matrix results | [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md) Part 2F |

**Outcome:** **20 PASS / 0 FAIL / 2 BLOCKED** — **0 P0 FAIL** on exercisable rows. **AI-10**, **AI-11**, **AI-15** closable.

**Post-QA scorecard:** **11 PASS / 1 PWF / 0 FAIL** — L1 **~95%** · L2 **~92%**.

**Readiness:** **UX-L1 review ready** · **UX-L2 review ready** — no award in this wave.

**Next:** Formal UX-L1/L2 review wave (when prioritized).

### Wave 5H-AI-UX-C — AI Experience navigation & parity ✅

**Status:** **Done** (engineering + QA prep only)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md`](./audits/AI_EXPERIENCE_UX_BATCH5H_C_CLOSEOUT.md) |
| Navigation model | `web/src/lib/aiExperienceNavigation.ts` |
| Nav links | `web/src/components/ai/AIExperienceNavLinks.tsx` |
| Workspace landing | `web/src/components/ai/AIWorkspaceLanding.tsx` |
| Part 2F QA prep | [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md) Part 2F (22 cases) |

**Resolved:** **AI-12**, **AI-13**, **AI-14**, **AI-15** (prep). **Deferred:** **AI-9** (architectural debt). **Prepared:** **AI-10**, **AI-11**.

**Projected:** **8 PASS / 3 PWF / 0 FAIL** — L1 **~88%** · L2 **~78%**.

**Validation:** `pnpm type-check` ✅ (2026-06-03).

**Next:** **5H-AI-UX-D**.

### Wave 5H-AI-UX-B — AI Experience UX remediation ✅

**Status:** **Done** (engineering only — no certification award)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md`](./audits/AI_EXPERIENCE_UX_BATCH5H_B_CLOSEOUT.md) |
| Scorecard (projected) | [`audits/AI_EXPERIENCE_UX_SCORECARD.md`](./audits/AI_EXPERIENCE_UX_SCORECARD.md) |
| Shell | `web/src/components/ai/AIChatPageShell.tsx` |
| Empty state | `web/src/components/ai/AIChatEmptyState.tsx` |

**Resolved:** **AI-1–AI-8** — unified delete confirm, functional menus, `WorkspaceSplitLayout` + `PageHeader`/`PageToolbar`, mobile sheet, `EmptyState`, `aria-label` pass.

**Projected:** **7 PASS / 4 PWF / 0 FAIL** — L1 CwF **~72%** · L2 **~58%**.

**Validation:** `pnpm type-check` ✅ (2026-06-03).

**Next:** **5H-AI-UX-C** → **5H-AI-UX-D**.

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

### Wave 5G-Notifications — UX-L3 remediation ✅

**Status:** **Done** (engineering only)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](./audits/NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md) |

**Resolved:** **N-2** (feed `toast.error`), **N-5** (mobile category sheet), **N-7** (aria on action menus/toolbar). **Projected:** 10 PASS / 3 PWF. **Certification unchanged** — await Part 2B QA + **5G-Notifications-D**.

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
| 1 | **Chat** | `chat` | **Medium** (post-reassess) | **UX-L1 CwF**; **52%** L2-ready — 3 PASS short; **5H-Chat-L2** + Part 2E QA — see [`CHAT_UX_MODERNIZATION_REASSESSMENT.md`](./audits/CHAT_UX_MODERNIZATION_REASSESSMENT.md) |
| 2 | **Notifications** | `notifications` | **Complete** (post-5G-D) | **UX-L3 Certified with Findings** (11 PASS / 1 PWF); Reference UX **#2 Eligible With Findings** — see [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./audits/NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md) |
| 3 | **Todo** | `todo` | **Complete** (registered) | **UX-L3 Certified** (11 PASS / 0 PWF); Reference UX **#3 Approved with Findings** — [`REFERENCE_MODULE_TODO.md`](./audits/REFERENCE_MODULE_TODO.md) |
| 4 | **Calendar** | `calendar` | **Complete** (post-5G-D) | **UX-L3 Certified** (11 PASS / 0 PWF); Reference UX #5 **Eligible With Findings** — see [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./audits/CALENDAR_UX_L3_CERTIFICATION_REVIEW.md) |
| 5 | **AI** | `ai` | **Complete** (registered) | **Reference UX #4 Approved with Findings** — [`REFERENCE_MODULE_AI.md`](./audits/REFERENCE_MODULE_AI.md) |
| 6 | **Place** | `place` | **Done** (6B cert review) | Arch #5 + **UX-L3 Certified**; **11/0/0** — [`PLACE_UX_CERTIFICATION_REVIEW.md`](./audits/PLACE_UX_CERTIFICATION_REVIEW.md) |
| 7 | **Scheduling** | `scheduling` | **Low** | Tied to Calendar; HTML5 trash exceptions; limited UX wave investment |
| 8 | **HR** | `hr` | **Low** | Enterprise forms/workflows; high custom UI; no modernization waves complete |

**Wave 5D.3 (Todo layout/workflow):** **done** — [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./audits/TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md): T-2–T-5 resolved.

**Wave 5D.4 (Todo re-certification):** **done** — [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./audits/TODO_UX_RECERTIFICATION_2026_5D4.md): **8 PASS / 3 PWF**; UX-L1 CwF; UX-L2 not met (one category short).

**Wave 5G (Todo L2 polish):** **done** — [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./audits/TODO_L2_POLISH_BATCH5G_CLOSEOUT.md): T-8, T-9 resolved; T-7 partial; `pnpm type-check` PASS.

**Wave 5G-Todo-D (Todo re-certification):** **done** — [`TODO_UX_RECERTIFICATION_2026_5G.md`](./audits/TODO_UX_RECERTIFICATION_2026_5G.md): **9 PASS / 2 PWF**; **UX-L1 Certified**; **UX-L2 CwF**.

**Wave 5G-QA (Platform manual QA plan):** **done** — [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md) + [`PLATFORM_MANUAL_QA_RUNBOOK.md`](./PLATFORM_MANUAL_QA_RUNBOOK.md): unified matrix for Drive, Notifications, Todo, Calendar, Chat; maps F-1, N-6, T-11, E-14, C-8.

**Wave 5G-QA-D (Platform QA certification addenda):** **done** — [`PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md`](./audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md) + per-module `*_QA_ADDENDUM_2026.md`: QA **not executed** (no matrix sign-off, no evidence); **certification levels unchanged**; F-1, N-6, T-11, E-14, C-8 remain open.

**Wave 5G-Calendar-L3-Prep (Calendar UX-L3 readiness):** **done** — [`CALENDAR_UX_L3_READINESS_REVIEW.md`](./audits/CALENDAR_UX_L3_READINESS_REVIEW.md): **78%** L3-ready; engineering complete; **E-14** QA is sole blocker; next **5G-QA-EXEC** → **5G-Calendar-D**.

**Wave 5G-QA-EXEC (Calendar QA execution):** **complete** — R1/R2/R3: **19 PASS / 0 FAIL / 4 BLOCKED / 1 N/A**; **E-14 resolved**; evidence in [`qa-evidence/5G-QA/calendar/`](./audits/qa-evidence/5G-QA/calendar/). Reports: [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./audits/CALENDAR_QA_EXEC_R3_REPORT_2026.md).

**Wave 5G-Calendar-D (Calendar L3 certification review):** **done** — [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./audits/CALENDAR_UX_L3_CERTIFICATION_REVIEW.md): **11 PASS / 0 PWF / 0 FAIL**; **UX-L1/L2/L3 Certified**; Reference UX #5 **Eligible With Findings** (no designation).

**Recommended next (platform):** Draft `REFERENCE_MODULE_CALENDAR.md` → council review for Reference UX #5; parallel Chat L2 / Notifications L3 QA.

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

**Snapshot:** Calendar + Todo **UX-L3 Certified** (strict); Notifications **UX-L3 CwF**; Chat **three PASS short** of L2; Drive Reference #1 without formal 11-cat scorecard.

**Wave 5G-Todo / 5G-Todo-D:** **done** — Todo at **UX-L2 CwF** (9 PASS / 2 PWF).  
**Wave 5G-Todo-L3-Prep:** **done** — [`TODO_UX_L3_READINESS_REVIEW.md`](./audits/TODO_UX_L3_READINESS_REVIEW.md): **74%** L3-ready; **T-11** sole critical gate; optional **5H-Todo** if TODO-15 FAIL.  
**Wave 5G-Calendar-D:** **done** — Calendar **UX-L3 Certified**; Reference UX #5 **Approved with Findings**.  
**Wave 5G-Notifications-L3-Prep:** **done** — [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](./audits/NOTIFICATIONS_UX_L3_READINESS_REVIEW.md): **65%** L3-ready; N-6 QA + N-7 + PWF reduction; Reference UX **#2 strong candidate**.

**Wave 5G-Notifications (L3 remediation):** **done** — [`NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](./audits/NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md): N-2/N-5/N-7 **resolved**.

**Wave 5G-QA-EXEC Notifications (Part 2B):** **done** — [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](./audits/NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md): **18 PASS / 0 FAIL / 2 N/A**; **N-6 resolved**.

**Wave 5G-Notifications-D (Notifications L3 certification review):** **done** — [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./audits/NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md): **11 PASS / 1 PWF / 0 FAIL**; **UX-L1/L2 Certified** (upgraded from CwF); **UX-L3 Certified with Findings**.

**Reference UX #2 Notifications registration:** **done** — [`REFERENCE_MODULE_NOTIFICATIONS.md`](./audits/REFERENCE_MODULE_NOTIFICATIONS.md): **Approved with Findings**.

**Wave 5G-QA-EXEC Todo (Part 2C):** **done** — [`TODO_QA_EXECUTION_REPORT_2026.md`](./audits/TODO_QA_EXECUTION_REPORT_2026.md): **25 PASS / 0 FAIL**; **T-11 resolved**.

**Wave 5G-Todo-L3-D (Todo L3 certification review):** **done** — [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](./audits/TODO_UX_L3_CERTIFICATION_REVIEW.md): **11 PASS / 0 PWF / 0 FAIL**; **UX-L1/L2/L3 Certified**; Reference UX #3 **Eligible With Findings** (no designation).

**Snapshot:** Calendar + Todo **UX-L3 Certified** (strict); Notifications **UX-L3 CwF**; Chat **three PASS short** of L2.

**Wave 5H-Chat-Reassess (Chat UX modernization reassessment):** **done** — [`CHAT_UX_MODERNIZATION_REASSESSMENT.md`](./audits/CHAT_UX_MODERNIZATION_REASSESSMENT.md): **52%** L2-ready · **28%** L3-ready; **6 PASS / 5 PWF / 0 FAIL** (5B.3 authoritative, unchanged); **C-8** open; Architecture Reference **#2** retain; UX Reference path **not viable** near-term.

**Chat L2 shortest path:** **5H-Chat-L2** (EmptyState + a11y) → **5G-QA-EXEC** Part 2E → **5H-Chat-L2-D**.  
**Chat L3 shortest path:** L2 CwF → **5H-Chat-L3-Prep** → **5H-Chat-L3** (core quartet + PWF ≤2 + C-5/C-6) → **5H-Chat-L3-D**.

**Reference UX #3 Todo registration:** **done** — [`REFERENCE_MODULE_TODO.md`](./audits/REFERENCE_MODULE_TODO.md): **Approved with Findings**; UX-L3 Certified (unchanged).

**Reference UX #4 strategic review:** **done** — [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./audits/REFERENCE_UX_4_STRATEGIC_REVIEW.md): **Reserve for AI Experience**; slot **remains vacant**; no designation. Place = alternate (future slot); Business Workspace / Dashboard ineligible.

**Recommended next:** **5H-Chat-L2** (Chat UX-L2 path) or **5H-AI-L3-Polish** (optional R-AI-3 keyboard help). Defer AI Platform L3 architecture.  
**Reference path:** Drive **#1**, Notifications **#2**, Todo **#3**, AI **#4**, Calendar **#5** registered; Chat UX **#2 rejected** — Arch **#2** only.

### Wave 6A — UX Reference Pattern Extraction ✅

**Status:** **Done** (documentation only — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Master catalog (56 patterns) | [`UX_REFERENCE_PATTERN_CATALOG.md`](./UX_REFERENCE_PATTERN_CATALOG.md) |
| Program closeout | [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](./UX_REFERENCE_PROGRAM_CLOSEOUT.md) |
| Pattern standards (9 docs) | [`patterns/`](./patterns/) |

**Outcome:** Canonical UX patterns from all five registered references converted to platform standards with primary/secondary ownership resolution. No engineering, certification level changes, or new reference designations.

**Program status:** UX Reference Module Program (registration + extraction) **complete**. Remaining gaps: Chat UX reference, Place UX reference, partner enforcement automation — see closeout §6.

### Wave 6B — Place UX Reference Assessment ✅

**Status:** **Done** (assessment only — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Baseline audit | [`audits/PLACE_UX_BASELINE_AUDIT.md`](./audits/PLACE_UX_BASELINE_AUDIT.md) |
| Scorecard | [`audits/PLACE_UX_SCORECARD.md`](./audits/PLACE_UX_SCORECARD.md) |
| Certification record | [`audits/PLACE_UX_CERTIFICATION.md`](./audits/PLACE_UX_CERTIFICATION.md) |

**Outcome:** **1 PASS / 7 PWF / 3 FAIL** — **not certified**. L1 **38%** · L2 **22%** · L3 **12%** readiness. Pattern reuse **32%**. Reference UX **#6 Deferred** (conditional); Reference Workspace **ineligible**.

**Next:** **6B-Place-UX-B** (interaction safety) when prioritized.

### Wave 6B-Place-UX-B — Place interaction safety ✅

**Status:** **Done** (engineering — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/PLACE_UX_BATCH_B_CLOSEOUT.md`](./audits/PLACE_UX_BATCH_B_CLOSEOUT.md) |

**Outcome:** **P-1**, **P-2**, **P-4** resolved; **P-3** partial (`PlacePageShell`). Projected **3 PASS / 7 PWF / 1 FAIL**. Native dialogs **0**. `pnpm type-check` **PASS**.

**Next:** **6B-Place-UX-C** (layout + mobile).

### Wave 6B-Place-UX-C — Place consumer shell + mobile ✅

**Status:** **Done** (engineering — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/PLACE_UX_BATCH_C_CLOSEOUT.md`](./audits/PLACE_UX_BATCH_C_CLOSEOUT.md) |

**Outcome:** **P-3**, **P-7** (engineering), **P-10**, **P-5** resolved; **P-11**, **P-12** partial. Projected **5 PASS / 6 PWF / 0 FAIL**. `PlacePageShell` + `PlaceConsumerExperience` + MOB-001 sheets + `PlaceEmptyStates`. `pnpm type-check` **PASS**.

**Next:** **6B-Place-QA** (matrix execution).

### Wave 6B-Place-UX-D — Place trash + errors + QA prep ✅

**Status:** **Done** (engineering — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Closeout | [`audits/PLACE_UX_BATCH_D_CLOSEOUT.md`](./audits/PLACE_UX_BATCH_D_CLOSEOUT.md) |
| QA matrix Part 2G | [`PLATFORM_MANUAL_QA_MATRIX.md`](./PLATFORM_MANUAL_QA_MATRIX.md) — **27** rows |

**Outcome:** **P-6**, **P-9** resolved; **P-11**, **P-12** partial; **P-13** prepared. Projected **7 PASS / 4 PWF / 0 FAIL**. `pnpm type-check` **PASS**.

**Next:** **6B-Place-QA** → first certification review gate.

### Wave 6B-Place-QA + R2 — Place manual QA ✅

**Status:** **Done** (2026-06-14)

| Deliverable | Path |
|-------------|------|
| Execution report | [`audits/PLACE_QA_EXECUTION_REPORT_2026.md`](./audits/PLACE_QA_EXECUTION_REPORT_2026.md) |
| Addendum | [`audits/PLACE_QA_ADDENDUM_2026.md`](./audits/PLACE_QA_ADDENDUM_2026.md) |
| Evidence | [`audits/qa-evidence/5G-QA/place/`](./audits/qa-evidence/5G-QA/place/) |

**Outcome:** Part 2G **27 PASS / 0 FAIL / 0 BLOCKED**. **PLC-QA-ENV-01** resolved. **P-13** closed.

**Next:** **6B-Place-Certification-Review**.

### Wave 6B-Place-Certification-Review — Place UX certification ✅

**Status:** **Done** (2026-06-14)

| Deliverable | Path |
|-------------|------|
| Certification review | [`audits/PLACE_UX_CERTIFICATION_REVIEW.md`](./audits/PLACE_UX_CERTIFICATION_REVIEW.md) |
| Scorecard (authoritative) | [`audits/PLACE_UX_SCORECARD.md`](./audits/PLACE_UX_SCORECARD.md) |
| Certification awards | [`audits/PLACE_UX_CERTIFICATION.md`](./audits/PLACE_UX_CERTIFICATION.md) |

**Outcome:** **11 PASS / 0 PWF / 0 FAIL**. **UX-L1 / L2 / L3 Certified** (first Place UX awards). Reference UX #6 **Eligible With Findings** — not registered.

**Next:** **6B-Place-Ref6-Prep** (registration artifact + human sign-off).

### Wave 6C — UX Reference Program Expansion Review ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Expansion review | [`audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](./audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Outcome:**

| Question | Verdict |
|----------|---------|
| Original UX program (#1–#5 + 6A) complete? | **Yes** — baseline tier frozen |
| UX #6 should exist? | **Yes** — governed expansion tier |
| Place as UX #6? | **Recommended** — Eligible CwF; not registered |
| Reference Workspace track? | **Yes — parallel** |
| Domain numbered slots (HR, etc.)? | **No** — pattern annexes |

**Governance model:** Baseline #1–#5 frozen · expansion #6+ governed · Reference Workspace parallel · domain annexes.

**Next:** **6B-Place-Ref6-Prep** · **6D-Place-Pattern-Extraction** · ~~**6C-Reference-Workspace-Charter**~~ **Done**.

**Constraints honored:** No registration · no certification changes · no council action.

### Wave 6C-Reference-Workspace-Charter — Reference Workspace Program ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Charter review | [`../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md) |

**Outcome:** **Reference Workspace Program chartered** — WS-L1/L2/L3 maturity model; inaugural candidate **Business Workspace** + Personal Dashboard shell; Place Publisher Hub remains **UX #6** track.

**Next:** Business Workspace Wave **1B** · parallel **6B-Place-Ref6-Prep**.

**Constraints honored:** No designation · no certifications · no council action.

### Business Workspace Wave 1A — Boundary and Ownership Audit ✅

**Status:** **Done** (audit only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Boundary audit | [`../architecture/audits/BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md`](../architecture/audits/BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md) |

**Outcome:** Workspace contract v0.1 drafted. **9 WS-L1 blockers** (3 stub widgets, 4 dead landings, Drive leak in shell, dual mount paths). **4 active** landings (Place, Todo, Calendar, AI). WS-L1 **stabilizing — blockers documented**.

**Next:** Wave **1B** hub standardization · Wave **1C** navigation contract tests.

**Constraints honored:** No code · no certifications · no registrations.

### Business Workspace Wave 1B — Hub Standardization ✅

**Status:** **Done** (implementation — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Closeout | [`../architecture/audits/BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md`](../architecture/audits/BUSINESS_WORKSPACE_WAVE_1B_CLOSEOUT.md) |

**Outcome:** Stubs removed · 4 dead landings deleted · `DriveWorkspaceLanding` · `ensureBusinessDashboard` consolidated · **6/9 WS-L1 blockers resolved**. `pnpm type-check` **PASS**.

**Next:** ~~Wave **1C** navigation contract tests.~~ **1C Done** · WS-L1 certification review.

**Constraints honored:** No certification · no registration · no UX changes.

### Business Workspace Wave 1C — Navigation Contracts ✅

**Status:** **Done** (implementation — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Closeout | [`../architecture/audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md`](../architecture/audits/BUSINESS_WORKSPACE_WAVE_1C_CLOSEOUT.md) |
| Routing contract | [`../architecture/WORKSPACE_ROUTING_CONTRACT.md`](../architecture/WORKSPACE_ROUTING_CONTRACT.md) |

**Outcome:** Segment URL navigation · `businessWorkspaceContracts.ts` · CI drift tests · **9/9 WS-L1 blockers resolved**. Navigation **15 PASS** · Drift **9 PASS**.

**Constraints honored:** No certification · no registration · no UX changes.

### Business Workspace WS-L1 Certification Review ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Certification review | [`../architecture/audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md`](../architecture/audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) |

**Outcome:** **WS-L1 Certified with Findings** — Business Workspace shell only. **Eligible for Reference Workspace prep** — not registration-ready (WS-L2 + Personal Dashboard co-surface required).

**Findings:** Orphan segment pages (F-1) · Personal Dashboard parity (F-2) · legacy query deprecation (F-3) · runtime scope maturity (F-4).

**Next:** Wave **1D** hygiene · ~~**2A**~~ ~~**2B**~~ **Done** · **Wave 2C** · **WS-L2** assessment.

**Constraints honored:** No designation · no registration · no engineering · no UX certification changes.

### Personal Dashboard Wave 2A — Co-Surface Audit ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Co-surface audit | [`../architecture/audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md`](../architecture/audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md) |

**Outcome:** Personal Dashboard boundary audit complete. **0 P0** · **4 P1** (PD-1–PD-4) · **6 P2** (PD-5–PD-10) blockers. Co-surface readiness: **Yes with findings** — dual registration feasible after Personal WS-L1 path.

**Next:** **Wave 2C** engineering · Business **1D** hygiene · **WS-L2** assessment.

**Constraints honored:** No engineering · no certification · no registration.

### Personal Dashboard Wave 2B — Contract Package ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Closeout | [`../architecture/audits/PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md`](../architecture/audits/PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md) |
| Routing contract | [`../architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md`](../architecture/PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) |
| Widget contract | [`../architecture/PERSONAL_DASHBOARD_WIDGET_CONTRACT.md`](../architecture/PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) |
| Cross-surface map | [`../architecture/CROSS_SURFACE_TRANSITIONS.md`](../architecture/CROSS_SURFACE_TRANSITIONS.md) |
| Context variants | [`../architecture/PERSONAL_CONTEXT_VARIANTS.md`](../architecture/PERSONAL_CONTEXT_VARIANTS.md) |

**Outcome:** Personal governance package complete. **PD-2, PD-5, PD-8 closed (governance).** **7 governance / 6 engineering / 3 certification** WS-L2 blockers remain.

**Next:** **Wave 2C** implementation handoff.

**Constraints honored:** No engineering · no certification · no registration.

### Personal Dashboard Wave 2C — Standardization ✅

**Status:** **Done** (implementation — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Closeout | [`../architecture/audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md`](../architecture/audits/PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md) |

**Outcome:** Navigation SSOT · cross-surface helpers · 21 unit tests · shell wiring · chat layout normalized. **PD-1–PD-10 closed.** `pnpm type-check` **PASS**.

**Next:** Personal **WS-L1 certification review**.

### Personal Dashboard WS-L1 Certification Review ✅

**Status:** **Done** (governance only — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Certification review | [`../architecture/audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md`](../architecture/audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) |

**Outcome:** **WS-L1 Certified with Findings** — Personal Dashboard shell. Resolves Business WS-L1 **F-2** (co-surface parity). **Eligible for combined Reference Workspace prep** — not registration-ready (WS-L2 required).

**Findings:** Registry drift test gap (F-1) · widget interior escalation (F-2) · residual ad-hoc hrefs (F-3) · tab embed URL model (F-4) · education context maturity (F-5).

**Next:** ~~**Combined WS-L2 assessment**~~ **Done** · Wave **1D** · registration doc draft.

**Constraints honored:** No designation · no registration · no engineering · no WS-L2 certification.

### Reference Workspace WS-L2 Assessment ✅

**Status:** **Done** (governance only — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| WS-L2 assessment | [`../architecture/audits/REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md`](../architecture/audits/REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) |

**Outcome:** Combined WS-L2 readiness **74%** (Business **82%** · Personal **79%**). **No WS-L2 certification awarded.** Certification review **deferred** until Wave 1D + personal drift test. **Registration prep may begin** (governance drafting).

**Blockers:** ~~L2-B1 orphan pages~~ **closed (1D)** · L2-B2 personal drift suite · L2-B3 cross-surface QA · L2-B4 operation matrix re-audit.

**Next:** ~~Wave **1D**~~ **Done** · Personal **2D** drift prep · `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` draft.

### Business Workspace Wave 1D — Hygiene ✅

**Status:** **Done** (implementation — 2026-06-03)

| Deliverable | Path |
|-------------|------|
| Closeout | [`../architecture/audits/BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md`](../architecture/audits/BUSINESS_WORKSPACE_WAVE_1D_CLOSEOUT.md) |
| Route inventory | [`../architecture/BUSINESS_WORKSPACE_ROUTE_INVENTORY.md`](../architecture/BUSINESS_WORKSPACE_ROUTE_INVENTORY.md) |

**Outcome:** Orphan pages → null deferrals. **L2-B1 closed.** Combined WS-L2 **74% → 78%**. Hygiene tests **4 PASS**.

**Next:** Personal **2D** · ~~WS-L2 certification review~~ **Done**.

### Reference Workspace WS-L2 Certification Review ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| WS-L2 certification review | [`../architecture/audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |

**Outcome:** **WS-L2 Certified with Findings** — combined Reference Workspace Program (Business Workspace + Personal Dashboard shell). **~89%** readiness at certification. **0** process blockers. **12** open findings (RWS-F1 primary).

**Surfaces:** Business **90%** · Personal **88%** · Combined **~89%**

**Registration:** Prep eligible — **not registration-ready**. `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` **may be drafted**.

**Next:** Registration review (council) · optional Business 1E (RWS-F1) · WS-L3 readiness review.

**Constraints honored:** No designation · no registration award · no engineering · no certification changes.

### Reference Workspace Registration Prep ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Registration prep package | [`../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md) |

**Outcome:** **Approved with Findings** (prep). REG-B2 **closed**. REG-B3 **partial**. RWS-F1 remains. Formal registration review may open; designation not awarded.

**Next:** Council registration review · Business 1E · WS-L3 prep.

### Reference Workspace Registration Review ✅

**Status:** **Done** (governance only — 2026-06-14)

| Deliverable | Path |
|-------------|------|
| Registration review | [`../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) |

**Outcome:** **Approved with Findings** — inaugural Reference Workspace Platform Shell registered (hybrid: Business + Personal). **12** open findings. REG-B3 partial waived for CwF.

**Holder:** Combined Platform Shell · Business Workspace (hub) · Personal Dashboard shell (dashboard)

**Next:** Optional Business 1E (RWS-F1) · pattern annex · WS-L3 readiness (separate wave).

**Constraints honored:** No engineering · no certification changes · no WS-L3 definition.

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

**Last updated:** 2026-06-14 (Inaugural Reference Workspace Registration — Approved with Findings)
