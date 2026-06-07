# ConfirmModal Batch 2 Rollout Plan (Wave 2C)

**Status:** **CLOSED** — [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md) (**PASS WITH FINDINGS**); 2A + 2B + 2C (core) complete; 2C.8 deferred  
**Date:** 2026-06-03 (Batch 2 closeout)  
**Prerequisite:** [`audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) (**PASS WITH FINDINGS**)  
**Baseline inventory:** **43** `web/` call sites after Batch 2 (grep 2026-06-03); **60** at Batch 2 start (post–Batch 1)  
**Master plan:** [`CONFIRMMODAL_STANDARDIZATION_PLAN.md`](./CONFIRMMODAL_STANDARDIZATION_PLAN.md)

---

## 1. Executive summary

Batch 2 continues **pattern A** (pending entity + sibling `ConfirmModal`). It does **not** use `useConfirm()` unless explicitly re-evaluated after TaskDetail + Drive soft-delete pilots.

**Recommended first ACT wave:** **Batch 2A — `TaskDetail.tsx` cluster** (4 sites, one file).  
**Recommended second ACT wave:** **Batch 2B — Drive soft-delete cluster** (4 sites; move-to-trash only).  
**Recommended third ACT wave:** **Batch 2C — mixed low-risk** (**10** sites / **8** files max — see §13).

**Permanent delete** (`drive/trash` empty-all, `GlobalTrashBin`) → **Batch 3 / separate UX certification** — not default Batch 2.

**Implementation gate:** Batch 1 manual QA sign-off **or** explicit acceptance of pending QA risk (per Batch 1 closeout).

---

## 2. Inventory snapshot

**Measurement:**

```bash
grep -rE 'confirm\(|window\.confirm' web --include='*.tsx' --include='*.ts' | wc -l
# → 52 (2026-06-03, post–2B)
```

**Files with confirms:** **38** files (some files have multiple call sites).

### 2.1 Risk breakdown (by category)

| Category | Call sites | % | Batch 2 eligible? |
|----------|----------:|---:|:-----------------|
| **Standard** | ~32 | 53% | **Yes** (primary pool) |
| **Destructive** (permanent / irreversible copy) | ~11 | 18% | **Partial** — soft trash yes; permanent purge **no** |
| **Informational** (apply preset, unsaved close, continue) | ~10 | 17% | **Partial** — use `variant="informational"` where applicable |
| **Binary choice** (calendar series / occurrence) | 6 | 10% | **No** — blocked until `binary-choice` design |
| **High risk** (admin, permissions, retention cleanup) | ~11 | 18% | **No** — future waves 2B-7 / 2B-8 |

*Categories overlap on some lines (e.g. admin delete alert = standard copy but high-risk surface).*

### 2.1 Category definitions

| Category | Definition | ConfirmModal today? |
|----------|------------|-------------------|
| **Standard** | Delete / remove / archive / move-to-trash with recoverable or routine data loss | `destructive` or `standard` |
| **Destructive** | Permanent delete, bulk purge, “cannot be undone” business structure | `destructive` + extra review |
| **High risk** | Admin grants, permission sets, HR terminate, retention cleanup **trigger**, seed-modules | Defer |
| **Binary choice** | OK/Cancel semantics inverted (occurrence vs series) | **Blocked** |

---

## 3. Full inventory table

Sorted by recommended migration priority. **Recommended** = include in Batch 2 ACT waves as scoped below.

| File | Count | Category | Risk | Complexity | Recommended |
|------|------:|----------|------|------------|-------------|
| `web/src/components/todo/TaskDetail.tsx` | 4 | Standard | Low | **High** (large file, 4 handlers) | **Yes — Batch 2A (whole file)** |
| `web/src/components/sidebar/SidebarCustomizationModal.tsx` | 2 | Informational + Destructive | Low | Medium (dirty close + reset) | **Yes — Batch 2C** |
| `web/src/components/modules/DriveModule.tsx` | 2 | Standard | Medium | Medium (single + bulk trash) | **Yes — Batch 2B** |
| `web/src/app/drive/starred/page.tsx` | 1 | Standard | Medium | Low | **Yes — Batch 2B** |
| `web/src/components/drive/enterprise/EnhancedDriveModule.tsx` | 1 | Standard | Medium | Medium | **Yes — Batch 2B** |
| `web/src/app/ai-chat/page.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/components/header/AIChatDropdown.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/components/org-chart/OrgChartBuilder.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/components/member/ConnectionList.tsx` | 2 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/components/member/PendingRequestsList.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/components/business/FrontPageContentEditor.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C** |
| `web/src/app/business/[id]/branding/page.tsx` | 1 | Standard | Low | Low | **Yes — Batch 2C (optional)** |
| `web/src/app/drive/trash/page.tsx` | 1 | Destructive | **High** | Medium | **No — Batch 3** |
| `web/src/components/GlobalTrashBin.tsx` | 1 | Destructive | **High** | Medium | **No — Batch 3** |
| `web/src/components/scheduling/SchedulingAdminContent.tsx` | 4 | Destructive | Medium | High | **No — Batch 4 (scheduling)** |
| `web/src/components/scheduling/ScheduleBuilderVisual.tsx` | 1 | Standard | Medium | Medium | **No — Batch 4** |
| `web/src/components/scheduling/ShiftBlock.tsx` | 1 | Standard | Medium | Low | **No — Batch 4** |
| `web/src/components/scheduling/TemplateBuilderVisual.tsx` | 1 | Standard | Medium | Medium | **No — Batch 4** |
| `web/src/components/scheduling/AvailabilityManagement.tsx` | 1 | Standard | Medium | Low | **No — Batch 4** |
| `web/src/components/scheduling/SchedulingEmployeeContent.tsx` | 1 | Standard | Low | Low | **No — Batch 4** |
| `web/src/components/business/StationsAndPositionsEditor.tsx` | 2 | Destructive | Medium | Medium | **No — Batch 5** |
| `web/src/app/business/[id]/modules/page.tsx` | 1 | Destructive | Medium | Medium | **No — Batch 5** |
| `web/src/components/business/FrontPageThemeCustomizer.tsx` | 2 | Informational | Low | Medium | **No — Batch 5** (informational) |
| `web/src/components/business/GlobalBrandingEditor.tsx` | 2 | Informational | Low | Medium | **No — Batch 5** |
| `web/src/components/PaymentMethodManager.tsx` | 1 | Destructive | Medium | Low | **No — Batch 5** (billing) |
| `web/src/components/household/HouseholdMemberManager.tsx` | 1 | Destructive | Medium | Low | **No — Batch 5** |
| `web/src/components/org-chart/EmployeeManager.tsx` | 1 | High risk | Medium | Medium | **No — HR/org wave** |
| `web/src/components/org-chart/PermissionManager.tsx` | 1 | High risk | **High** | Medium | **No — permissions wave** |
| `web/src/app/business/[id]/admin/hr/employees/page.tsx` | 1 | High risk | **High** | Low | **No — HR terminate** |
| `web/src/app/business/[id]/admin/hr/onboarding/templates/page.tsx` | 1 | Standard | Medium | Low | **No — HR wave** |
| `web/src/app/business/[id]/workspace/hr/me/page.tsx` | 1 | Standard | Low | Low | **No — HR wave** |
| `web/src/components/module-settings/hr/OnboardingModuleSettings.tsx` | 1 | Standard | Medium | Medium | **No — HR wave** |
| `web/src/app/calendar/day/page.tsx` | 1 | Binary choice | Medium | High | **No — 2B-9 spike** |
| `web/src/app/calendar/month/page.tsx` | 1 | Binary choice | Medium | High | **No — 2B-9 spike** |
| `web/src/app/calendar/week/page.tsx` | 1 | Binary choice | Medium | High | **No — 2B-9 spike** |
| `web/src/components/calendar/EventDrawer.tsx` | 3 | Binary + Informational | Medium | **High** | **No — 2B-9 spike** |
| `web/src/app/admin-portal/overrides/page.tsx` | 3 | High risk | **High** | Medium | **No — admin wave** |
| `web/src/app/admin-portal/seed-modules/page.tsx` | 1 | High risk | **High** | Low | **No — admin wave** |
| `web/src/app/admin-portal/system-logs/page.tsx` | 1 | Standard | **High** | Low | **No — admin wave** |
| `web/src/components/admin-portal/ai-pipeline/registry/PipelineIntentRegistrySection.tsx` | 1 | High risk | **High** | Low | **No — admin wave** |
| `web/src/components/GovernanceManagementDashboard.tsx` | 1 | High risk | **High** | Low | **No — admin wave** |
| `web/src/components/RetentionManagementDashboard.tsx` | 3 | High risk | **High** | Medium | **No — retention wave** |

**Batch 2 scoped call sites:** **15** (4 + 4 + 7) across **3 ACT sub-waves** below.  
**Remaining after Batch 2 (if all three ship):** **45** call sites.

---

## 4. Recommended Batch 2 scope

### 4.1 Batch 2A — TaskDetail cluster (ACT first)

| # | File | Sites | Workflow |
|---|------|------:|----------|
| 1 | `TaskDetail.tsx` | 4 | Remove dependency; delete comment; delete subtask; delete attachment |

**Rationale:** Explicit Batch 1 deferral; single module; eliminates duplicate attachment confirm vs `AttachmentViewer` (Batch 1). Migrate **all four in one PR** — shared patterns, one QA surface.

**Pending state names (proposed):**

| Workflow | Pending state |
|----------|----------------|
| Dependency | `pendingDependencyToRemove` |
| Comment | `pendingCommentToDelete` |
| Subtask | `pendingSubtaskToDelete` |
| Attachment | `pendingAttachmentToDelete` |

Four sibling `ConfirmModal` instances (or one modal with discriminated `pendingAction` — prefer **four pending states** for parity with Batch 1 unless file size forces union type).

---

### 4.2 Batch 2B — Drive soft-delete cluster (ACT second)

| # | File | Sites | Workflow |
|---|------|------:|----------|
| 1 | `DriveModule.tsx` | 2 | Single item → trash; bulk selection → trash |
| 2 | `drive/starred/page.tsx` | 1 | Move starred item to trash |
| 3 | `EnhancedDriveModule.tsx` | 1 | Bulk move to trash (enterprise) |

**Copy pattern:** Preserve dynamic item name / count strings.  
**Variant:** `destructive` (data leaves active view; recoverable via trash).  
**Not in 2B:** `drive/trash/page.tsx` permanent empty-trash; `GlobalTrashBin.tsx` permanent delete-all.

**Detailed plan:** See [§ Batch 2B — Drive Soft-Delete Plan](#batch-2b--drive-soft-delete-plan) below.

---

## Batch 2B — Drive Soft-Delete Plan

**Wave ID:** 2C-2B  
**Mode:** PLAN only (no code until ACT approved)  
**Confirm count:** **4** call sites across **3** files (verified 2026-06-03)  
**Post-2B inventory (expected):** **52** `web/` confirms (56 − 4)

Drive is a **Reference UX candidate** — treat this wave as a focused certification step for File Hub trash semantics, not a broad Drive redesign.

### 1. Exact confirm count and files

| File | Sites | Verified |
|------|------:|:--------:|
| `web/src/components/modules/DriveModule.tsx` | 2 | Yes |
| `web/src/app/drive/starred/page.tsx` | 1 | Yes |
| `web/src/components/drive/enterprise/EnhancedDriveModule.tsx` | 1 | Yes |
| **Total** | **4** | — |

No additional `confirm()` / `window.confirm()` in these three files beyond the four listed below.

### 2. Inventory table

| File | Purpose | Legacy copy | Confirm type | Risk | Recommended |
|------|---------|-------------|--------------|------|-------------|
| `DriveModule.tsx` | Single item move to trash (`handleDelete`) | ``Are you sure you want to move "${item.name}" to trash?`` | Standard (recoverable trash) | **Medium** — optimistic UI, `pendingOperationsRef`, context menu, keyboard/toolbar | **Yes — 2B.2** (both sites in one PR) |
| `DriveModule.tsx` | Bulk selection move to trash (`handleBulkDelete`) | ``Are you sure you want to move ${itemsToDelete.length} item(s) to trash?`` | Standard (bulk trash) | **Medium** — clears `selectedItems` on success; optimistic rollback | **Yes — same PR as single** |
| `drive/starred/page.tsx` | Starred/pinned item → trash (`handleDelete`) | ``Are you sure you want to move "${item.name}" to trash?`` | Standard | **Low** — no optimistic update; reload via `loadPinnedItems` | **Yes — 2B.1** (first ACT step) |
| `EnhancedDriveModule.tsx` | Enterprise bulk action `delete` in `handleBulkAction` | ``Move ${itemsToDelete.length} item(s) to trash?`` | Standard (bulk trash) | **Medium** — inside action switch; enterprise surface | **Yes — 2B.3** |

**File vs folder:** All four paths use the same `trashItem({ type: item.type, ... })` API — **one pending model per flow**, not separate file/folder state names. Display name comes from `item.name` (files and folders).

**UI label nuance:** Context menus may show **“Delete”** while confirm copy says **“move … to trash”** — preserve confirm **description** verbatim; `confirmLabel` should say **Move to trash** (see below), not “Delete”.

### 3. Migration strategy (pattern A)

**Do not use** `useConfirm()`. **Do not** use separate `pendingFileToTrash` / `pendingFolderToTrash` — item type is already on the Drive item model.

| File | Pending state (recommended) | Execute handler | Notes |
|------|----------------------------|-----------------|-------|
| `drive/starred/page.tsx` | `pendingItemToTrash: string \| null` (item id) | `executeMoveItemToTrash` | Resolve `item` from `items` for description |
| `DriveModule.tsx` (single) | `pendingItemToTrash: string \| null` | `executeMoveItemToTrash` | Same name as starred for mental model |
| `DriveModule.tsx` (bulk) | `pendingBulkItemsToTrash: string[] \| null` (selected ids) | `executeBulkMoveToTrash` | Snapshot ids at trigger; resolve `itemsToDelete` at confirm |
| `EnhancedDriveModule.tsx` | `pendingBulkItemsToTrash: string[] \| null` | `executeEnterpriseBulkTrash` | Set when `action === 'delete'`; run existing `Promise.all(trashItem…)` on confirm |

**Trigger pattern:**

```tsx
// Single
const requestMoveToTrash = (itemId: string) => {
  if (!session?.accessToken) { toast.error('...'); return; }
  setPendingItemToTrash(itemId);
  setContextMenu(null); // if invoked from menu — close menu before modal
};

// Bulk
const requestBulkMoveToTrash = () => {
  if (!session?.accessToken || selectedItems.size === 0) return;
  setPendingBulkItemsToTrash(Array.from(selectedItems));
};
```

**ConfirmModal configuration (copy-preserving):**

| Flow | `title` | `description` | `confirmLabel` | `variant` |
|------|---------|---------------|----------------|-----------|
| Single (DriveModule, starred) | `Move to trash?` | Legacy string exactly | **Move to trash** | `destructive` |
| Bulk (DriveModule) | `Move to trash?` | ``Are you sure you want to move ${n} item(s) to trash?`` | **Move to trash** | `destructive` |
| Bulk (Enhanced) | `Move to trash?` | ``Move ${n} item(s) to trash?`` (exact legacy; no “Are you sure”) | **Move to trash** | `destructive` |

```tsx
<ConfirmModal
  open={pendingItemToTrash !== null}
  onClose={() => setPendingItemToTrash(null)}
  onConfirm={executeMoveItemToTrash}
  title="Move to trash?"
  description={
    pendingItem
      ? `Are you sure you want to move "${pendingItem.name}" to trash?`
      : ''
  }
  variant="destructive"
  confirmLabel="Move to trash"
  loading={isMovingToTrash}
/>
```

Use `loading` during `trashItem` / `Promise.all` — **do not** run optimistic list mutation until **after** confirm (critical for DriveModule: today optimistic runs post-confirm inside try; keep that order).

### 4. Recommended migration order (ACT)

| Step | File | Sites | Rationale |
|------|------|------:|-----------|
| **2B.1** | `drive/starred/page.tsx` | 1 | **Done (2026-06-03)** — `pendingItemToTrash` + ConfirmModal |
| **2B.2** | `DriveModule.tsx` | 2 | **Done (2026-06-03)** — `pendingItemToTrash` + `pendingBulkItemsToTrash` |
| **2B.3** | `EnhancedDriveModule.tsx` | 1 | **Done (2026-06-03)** — `pendingBulkItemsToTrash` + ConfirmModal |

**One PR per step** (Batch 1 discipline). Do not combine 2B.1–2B.3 in one PR unless team explicitly accepts blast radius.

**Revised from §9 default order:** Starred **before** DriveModule reduces risk to the highest-traffic module.

### 5. Explicit exclusions (Batch 2B)

| Exclusion | File / flow | Future wave |
|-----------|-------------|-------------|
| Permanent empty trash | `web/src/app/drive/trash/page.tsx` | **Batch 3** |
| Global permanent delete-all | `web/src/components/GlobalTrashBin.tsx` | **Batch 3** |
| Hard purge / restore | Any restore or purge API | Out of scope |
| Admin Drive | Admin-portal Drive surfaces | Admin wave |
| Enterprise **purge** (non-trash) | Not present in scoped files | N/A |
| `ShareModal`, `ContextMenu` primitive | No changes in 2B | Later UX waves |
| Drag-only without confirm review | Starred drag-to-trash calls `handleDelete` — must route through **same** pending gate | Covered in 2B.1 QA |

### 6. Risk review

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Optimistic update before confirm** | **High** if regressed | Keep optimistic block inside `execute*` only, after modal confirm |
| **Context menu left open under modal** | Medium | `setContextMenu(null)` on trash request (DriveModule, starred) |
| **Bulk selection stale at confirm** | Medium | Store **ids** at trigger; re-resolve items at execute; abort if empty |
| **Drag-to-trash on starred** | Medium | `handleDelete` becomes request-only; drag path must open modal |
| **WebSocket + optimistic race** | Medium | Preserve `pendingOperationsRef` timing in DriveModule |
| **Copy drift** (menu “Delete” vs confirm “move to trash”) | Low | Description = legacy; label = “Move to trash” |
| **Reference UX regression** | Medium | Dedicated Drive QA checklist; dark mode |
| **Accidental Batch 3 scope** | **High** | PR title/body must list only 2B files |
| **Enhanced bulk other actions** | Low | Only touch `case 'delete'` branch |

**Recycle bin expectation:** Soft delete is **recoverable** via trash — `destructive` variant is appropriate (leaves active list) but copy must **not** imply permanent loss.

### 7. QA checklist (manual, per ACT step)

**Starred (2B.1)**

- [ ] Context menu / toolbar delete → confirm opens; menu not stuck
- [ ] Cancel / Escape / backdrop → item remains; starred list unchanged
- [ ] Confirm → item in trash; list refreshes
- [ ] Drag to global trash bin → confirm opens (not silent delete)
- [ ] Dark mode

**DriveModule (2B.2)**

- [ ] Single file delete (context menu + any other entry point to `handleDelete`)
- [ ] Single folder delete — same confirm copy with folder name
- [ ] Bulk select → Delete → confirm shows correct count
- [ ] Cancel → selection preserved; items remain
- [ ] Confirm → optimistic removal + toast; selection cleared on bulk
- [ ] Error path → rollback (disconnect/network mock if possible)
- [ ] Dark mode

**EnhancedDriveModule (2B.3)**

- [ ] Bulk delete action → confirm with count
- [ ] Cancel / confirm behavior
- [ ] Selection cleared only after success
- [ ] Dark mode

### 8. Batch 2B ACT readiness

```text
READY FOR ACT — with findings
```

| Gate | Status |
|------|--------|
| Inventory verified (4 sites / 3 files) | **Yes** |
| Exclusions documented | **Yes** |
| Pattern A defined | **Yes** |
| Batch 2A complete | **Yes** |
| Batch 1 / 2A manual QA | **Pending** — proceed with accepted risk or QA sign-off |
| Reference UX stakeholder review | **Advisory** — recommended before 2B.2 (DriveModule) |

**First ACT file:** `web/src/app/drive/starred/page.tsx` (2B.1).

---

### 4.3 Batch 2C — Mixed low-risk (ACT third)

**Full plan:** [§13 Batch 2C Plan](#13-batch-2c-plan-wave-2c).

| # | File | Sites | Notes |
|---|------|------:|-------|
| 1 | `SidebarCustomizationModal.tsx` | 2 | Unsaved close → `informational`; reset → `destructive` |
| 2 | `FrontPageContentEditor.tsx` | 1 | Delete announcement (local state) |
| 3 | `OrgChartBuilder.tsx` | 1 | Delete tier / department / position |
| 4 | `ConnectionList.tsx` | 2 | Single + bulk remove connection |
| 5 | `PendingRequestsList.tsx` | 1 | Bulk accept / decline / block |
| 6 | `ai-chat/page.tsx` | 1 | Conversation → trash |
| 7 | `AIChatDropdown.tsx` | 1 | Same trash pattern as ai-chat |
| 8 | `business/[id]/branding/page.tsx` | 1 | Delete widget (**optional** 2C.8) |

**Batch 2C scope:** **7** core files / **9** call sites; **+1** optional file → **8** files / **10** sites max.

---

## 5. Explicit exclusions (Batch 2)

Do **not** migrate in Batch 2 ACT waves:

| Exclusion | Files / sites | Future wave |
|-----------|---------------|-------------|
| Calendar binary-choice | `calendar/day`, `month`, `week`; `EventDrawer` (occurrence vs series + conflict/slot confirms) | **2B-9** design spike |
| Admin permission / tier changes | `admin-portal/overrides` (×3), `seed-modules`, `system-logs`, `PipelineIntentRegistry`, `GovernanceManagementDashboard` | **2B-8** |
| HR termination / sensitive HR | `hr/employees` terminate, `EmployeeManager`, `PermissionManager` | **2B-7** |
| Retention cleanup **trigger** | `RetentionManagementDashboard` (×3, especially cleanup trigger) | **2B-8** |
| Permanent purge | `drive/trash` empty-all, `GlobalTrashBin` bulk permanent | **Batch 3** + product copy review |
| Scheduling cluster | 9 sites across 6 files | **Batch 4** |
| Billing | `PaymentMethodManager` | **Batch 5** |
| Branding preset apply/reset | `FrontPageThemeCustomizer`, `GlobalBrandingEditor` | **Batch 5** (`informational` variant) |
| Business module uninstall | `business/[id]/modules` | **Batch 5** |

---

## 6. TaskDetail analysis

| Question | Answer |
|----------|--------|
| Do all four belong in Batch 2? | **Yes** — all are standard destructive confirms; same component and auth patterns. |
| Migrate together? | **Yes** — one PR, one manual QA pass on task detail panel. |
| Own rollout wave? | **Yes — Batch 2A** as dedicated first ACT sub-wave (not mixed with Drive). |

**Special notes:**

- **Attachment delete (line ~870):** Copy matches `AttachmentViewer` Batch 1 — align `description` string exactly; consider shared constant in todo module (optional refactor, not required for migration).
- **Inline subtask delete:** Confirm inside `onClick` — extract to pending state + `executeDeleteSubtask` like Batch 1.
- **File size / complexity:** High **file** complexity, low **per-site** complexity — still cheaper than splitting across releases.

---

## 7. Drive analysis

| Flow | File | Recoverable? | Batch |
|------|------|--------------|-------|
| Move to trash (single) | `DriveModule.tsx` | Yes | **2B** |
| Move to trash (bulk) | `DriveModule.tsx` | Yes | **2B** |
| Starred → trash | `drive/starred/page.tsx` | Yes | **2B** |
| Enterprise bulk trash | `EnhancedDriveModule.tsx` | Yes | **2B** |
| Empty trash (permanent) | `drive/trash/page.tsx` | **No** | **Batch 3** |
| Global trash permanent delete-all | `GlobalTrashBin.tsx` | **No** | **Batch 3** |

**Recommendation:** Treat **Drive as two waves**:

1. **Batch 2B** — soft delete / move-to-trash (4 sites) — standard ConfirmModal `destructive`.
2. **Batch 3 — Drive permanent certification** — 2 sites — requires explicit “permanent data loss” copy review, possible second confirm or stronger `reviewNote` on ConfirmModal; consider product/legal sign-off.

**Not** a single “Drive cluster” ACT wave without splitting soft vs permanent.

---

## 8. Sub-wave recommendation (choose one emphasis)

| Option | Scope | Verdict |
|--------|-------|---------|
| **Batch 2A — TaskDetail cluster** | 4 sites, 1 file | **Start here** |
| **Batch 2B — Drive cluster** | 4 soft-delete sites only | **Second** |
| **Batch 2C — Mixed low-risk** | ~10 sites, 7–8 files | **Third** |

### Justification

1. **TaskDetail** is the highest-value Batch 1 follow-up (deferred, duplicate attachment, dense todo UX).
2. **Drive soft-delete** is the next cohesive product surface but must **exclude** permanent purge until Batch 3.
3. **Mixed low-risk** spreads QA across surfaces — schedule after two focused clusters to avoid regressions.

**Do not** combine 2A + 2B + 2C in one ACT pass unless team explicitly accepts large blast radius.

---

## 9. Implementation order (ACT phases)

| Step | Wave ID | File(s) | Sites |
|------|---------|---------|------:|
| 1 | **2C-2A** | `TaskDetail.tsx` | 4 | **Done (2026-06-03)** |
| 2 | **2C-2B.1** | `drive/starred/page.tsx` | 1 | **Done (2026-06-03)** |
| 3 | **2C-2B.2** | `DriveModule.tsx` | 2 | **Done (2026-06-03)** |
| 4 | **2C-2B.3** | `EnhancedDriveModule.tsx` | 1 | **Done (2026-06-03)** |
| 5 | **2C-2C.1** | `SidebarCustomizationModal.tsx` | 2 | **Done (2026-06-03)** |
| 6 | **2C-2C.2** | `ai-chat/page.tsx` + `AIChatDropdown.tsx` | 2 |
| 7 | **2C-2C.3** | `OrgChartBuilder.tsx`, `ConnectionList.tsx`, `PendingRequestsList.tsx` | 4 |
| 8 | **2C-2C.4** | `FrontPageContentEditor.tsx` (+ optional branding widget) | 1–2 |

**Per-step gates:** `pnpm type-check`; zero `confirm()` in touched file; one manual QA checklist row.

**Pattern:** Same as Batch 1 — pending state + sibling `ConfirmModal`; **no** `useConfirm()` unless TaskDetail forces a follow-up spike (unlikely).

---

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Batch 1 manual QA still pending | Non-blocking | Sign-off or accept risk before 2A |
| TaskDetail regression (4 flows) | Medium | Single PR + focused QA |
| Drive bulk delete optimistic UI | Medium | Preserve `pendingOperationsRef` / optimistic paths |
| Permanent delete accidentally in 2B | **High** | Scope lock in PR review |
| Calendar migrated by mistake | **High** | PR checklist: no calendar files |
| `informational` variant for sidebar close | Low | Use `variant="informational"` for unsaved close |

---

## 11. Success criteria (Batch 2 complete)

- [x] Batch 2A migrated (4 call sites)
- [x] Batch 2B migrated (4 call sites)
- [x] Batch 2C migrated (9 call sites; core 2C.1–2C.7)
- [x] `grep` shows **43** remaining `web/` confirms after Batch 2 (60 − 17)
- [x] No new `confirm()` in touched Batch 2 files
- [x] Closeout doc: [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md)
- [ ] Permanent Drive + scheduling + admin remain deferred

---

## 12. Related artifacts

| Document | Role |
|----------|------|
| [`CONFIRMMODAL_BATCH1_PLAN.md`](./CONFIRMMODAL_BATCH1_PLAN.md) | Completed scope |
| [`audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) | Certification |
| [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md) | **Batch 2 certification (2A+2B+2C)** |
| [`audits/CONFIRMMODAL_BATCH2B_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2B_CLOSEOUT.md) | 2B sub-wave certification |
| [`CONFIRMMODAL_STANDARDIZATION_PLAN.md`](./CONFIRMMODAL_STANDARDIZATION_PLAN.md) | Phases 2B-4 through 2B-9 |
| [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md) | Wave status |

---

## 13. Batch 2C Plan (Wave 2C)

**Purpose:** Final **general-purpose** ConfirmModal rollout before specialized waves (calendar binary-choice, admin, HR terminate, retention, permanent purge, scheduling, billing).

**Prerequisite:** Batch 2B closed — [`audits/CONFIRMMODAL_BATCH2B_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2B_CLOSEOUT.md) (**PASS WITH FINDINGS**).

**Baseline (grep 2026-06-03):** **52** `web/` `confirm()` / `window.confirm()` call sites across **38** files.

**Pattern default:** **Pattern A** (`pendingEntity` + sibling `ConfirmModal`). **No `useConfirm()`**. Use **`variant="informational"`** for unsaved-close / preset-apply flows (Sidebar 2C.1 only in this batch).

---

### 13.1 Rollout groups (repository findings)

#### Group A — Sidebar

| File | Sites | In 2C? |
|------|------:|:------:|
| `web/src/components/sidebar/SidebarCustomizationModal.tsx` | 2 | **Yes** |
| `web/src/components/sidebar/LeftSidebarCustomizer.tsx` | 0 | Already migrated (Batch 1) |

#### Group B — AI chat

| File | Sites | In 2C? |
|------|------:|:------:|
| `web/src/app/ai-chat/page.tsx` | 1 | **Yes** |
| `web/src/components/header/AIChatDropdown.tsx` | 1 | **Yes** |
| `web/src/components/ai/*` (CustomContext, AIMemoriesView, etc.) | 0 | Already migrated (Batch 1) |

#### Group C — Organization / member

| File | Sites | In 2C? |
|------|------:|:------:|
| `web/src/components/org-chart/OrgChartBuilder.tsx` | 1 | **Yes** |
| `web/src/components/member/ConnectionList.tsx` | 2 | **Yes** |
| `web/src/components/member/PendingRequestsList.tsx` | 1 | **Yes** |
| `web/src/components/org-chart/EmployeeManager.tsx` | 1 | **Later** (HR/org wave) |
| `web/src/components/org-chart/PermissionManager.tsx` | 1 | **No** (permission grants — excluded) |
| `web/src/components/household/HouseholdMemberManager.tsx` | 1 | **Later** (household wave; similar to ConnectionList) |

#### Group D — Content / branding

| File | Sites | In 2C? |
|------|------:|:------:|
| `web/src/components/business/FrontPageContentEditor.tsx` | 1 | **Yes** |
| `web/src/app/business/[id]/branding/page.tsx` | 1 | **Optional** (2C.8) |
| `web/src/components/business/FrontPageThemeCustomizer.tsx` | 2 | **Later** (informational — Batch 5) |
| `web/src/components/business/GlobalBrandingEditor.tsx` | 2 | **Later** (informational — Batch 5) |

#### Group E — Newly reviewed, excluded from 2C

| File | Sites | Future wave |
|------|------:|-------------|
| Scheduling (6 files, 9 sites) | 9 | **Batch 4** |
| Calendar + `EventDrawer` | 6 | **2B-9** binary-choice spike |
| Admin portal (4 files, 6 sites) | 6 | **2B-8** admin wave |
| HR (employees terminate, onboarding, `hr/me`, `OnboardingModuleSettings`) | 4 | **2B-7** HR wave |
| `RetentionManagementDashboard.tsx` | 3 | **2B-8** retention wave |
| `GovernanceManagementDashboard.tsx` | 1 | **Governance wave** |
| `PaymentMethodManager.tsx` | 1 | **Batch 5** billing |
| `drive/trash/page.tsx`, `GlobalTrashBin.tsx` | 2 | **Batch 3** permanent purge |
| `business/[id]/modules/page.tsx` | 1 | **Batch 5** module uninstall |
| `StationsAndPositionsEditor.tsx` | 2 | **Batch 5** business structure |

---

### 13.2 Complete candidate inventory (all 52 remaining sites)

Sorted by Batch 2C relevance. **Recommended = Yes** only for scoped 2C ACT files.

| File | Purpose | Legacy copy | Category | Risk | Recommended |
|------|---------|-------------|----------|------|-------------|
| `SidebarCustomizationModal.tsx` | Unsaved close | `You have unsaved changes. Are you sure you want to close?` | Informational | Low | **Yes** |
| `SidebarCustomizationModal.tsx` | Reset sidebar config | ``Reset ${scopeLabel} to defaults? This cannot be undone.`` | Destructive | Medium | **Yes** |
| `FrontPageContentEditor.tsx` | Delete announcement | `Are you sure you want to delete this announcement?` | Standard | Low | **Yes** |
| `OrgChartBuilder.tsx` | Delete tier/dept/position | `Are you sure you want to delete this item?` | Destructive | Medium | **Yes** |
| `ConnectionList.tsx` | Remove single connection | ``Remove connection with ${userName}?`` | Standard | Low | **Yes** |
| `ConnectionList.tsx` | Bulk remove connections | ``Remove connection with ${name}?`` / ``Remove ${n} connections?`` | Standard | Low | **Yes** |
| `PendingRequestsList.tsx` | Bulk accept/decline/block | ``Accept/Decline/Block … request(s)?`` (dynamic) | Standard | Medium | **Yes** |
| `ai-chat/page.tsx` | Move conversation to trash | ``Are you sure you want to move "${title}" to trash?`` | Standard | Low | **Yes** |
| `AIChatDropdown.tsx` | Move conversation to trash | Same as ai-chat | Standard | Low | **Yes** |
| `branding/page.tsx` | Delete front-page widget | `Are you sure you want to delete this widget?` | Standard | Low | **Yes** (optional 2C.8) |
| `HouseholdMemberManager.tsx` | Leave / remove member | Dynamic leave vs remove copy | Destructive | Medium | **Later** |
| `EmployeeManager.tsx` | Remove employee from position | `Are you sure you want to remove this employee from this position?` | Destructive | Medium | **Later** (HR/org) |
| `FrontPageThemeCustomizer.tsx` | Apply theme preset | ``Apply the "${presetName}" theme preset?…`` | Informational | Low | **Later** |
| `FrontPageThemeCustomizer.tsx` | Reset theme | `Reset to default theme?…` | Informational | Low | **Later** |
| `GlobalBrandingEditor.tsx` | Apply color preset | ``Apply the "${presetName}" color preset?…`` | Informational | Low | **Later** |
| `GlobalBrandingEditor.tsx` | Reset branding | `Reset branding to defaults?…` | Informational | Low | **Later** |
| `modules/page.tsx` | Uninstall module | `Are you sure you want to uninstall this module?…` | Destructive | Medium | **Later** |
| `StationsAndPositionsEditor.tsx` | Delete station | `…delete this station? This action cannot be undone.` | Destructive | Medium | **Later** |
| `StationsAndPositionsEditor.tsx` | Delete position | `…delete this position? This action cannot be undone.` | Destructive | Medium | **Later** |
| `hr/me/page.tsx` | Cancel time-off request | `Are you sure you want to cancel this time-off request?` | Standard | Low | **Later** (HR) |
| `hr/onboarding/templates/page.tsx` | Archive template | `Are you sure you want to archive this template?…` | Standard | Medium | **Later** (HR) |
| `OnboardingModuleSettings.tsx` | Archive template | ``Archive onboarding template "${name}"?`` | Standard | Medium | **Later** (HR) |
| `SchedulingAdminContent.tsx` | Delete schedule (×2) | `…delete this schedule?…` / ``delete "${name}"?…`` | Destructive | Medium | **Later** |
| `SchedulingAdminContent.tsx` | Delete template | `…delete this template?` | Destructive | Medium | **Later** |
| `SchedulingAdminContent.tsx` | Delete shift | `…delete this shift?` | Standard | Medium | **Later** |
| `ScheduleBuilderVisual.tsx` | Delete shift | `Are you sure you want to delete this shift?` | Standard | Medium | **Later** |
| `ShiftBlock.tsx` | Delete shift | Same | Standard | Low | **Later** |
| `TemplateBuilderVisual.tsx` | Delete shift pattern | `…delete this shift pattern?` | Standard | Medium | **Later** |
| `AvailabilityManagement.tsx` | Delete availability | `…delete this availability?` | Standard | Low | **Later** |
| `SchedulingEmployeeContent.tsx` | Cancel swap request | `…cancel this swap request?` | Standard | Low | **Later** |
| `calendar/day/page.tsx` | Occurrence vs series update | `Update this occurrence only? Press Cancel…` | Binary choice | Medium | **No** |
| `calendar/week/page.tsx` | Occurrence vs series update | Same pattern | Binary choice | Medium | **No** |
| `calendar/month/page.tsx` | Occurrence vs series move | `Move this occurrence only? Press Cancel…` | Binary choice | Medium | **No** |
| `EventDrawer.tsx` | Conflict continue | ``This time conflicts with ${n} event(s). Continue?`` | Informational | Medium | **No** |
| `EventDrawer.tsx` | Use first open slot | ``Found ${n} open slots… Use the first…?`` | Informational | Medium | **No** |
| `EventDrawer.tsx` | Delete occurrence vs series | `Delete this occurrence only? Press Cancel…` | Binary choice | Medium | **No** |
| `admin-portal/overrides/page.tsx` | Grant admin (×3 flows) | Grant / revoke / tier copy | High risk | **High** | **No** |
| `admin-portal/seed-modules/page.tsx` | Seed modules | `This will create Module records… Continue?` | High risk | **High** | **No** |
| `admin-portal/system-logs/page.tsx` | Delete alert | `Are you sure you want to delete this alert?` | Standard | **High** | **No** |
| `PipelineIntentRegistrySection.tsx` | Archive intent | ``Archive intent "${id}"? Dependencies…`` | High risk | **High** | **No** |
| `GovernanceManagementDashboard.tsx` | Delete policy | `…delete this governance policy?` | High risk | **High** | **No** |
| `PermissionManager.tsx` | Delete permission set | `…delete this permission set?` | High risk | **High** | **No** |
| `hr/employees/page.tsx` | Terminate employee | `Terminate this employee… cannot be undone.` | High risk | **High** | **No** |
| `RetentionManagementDashboard.tsx` | Delete policy / trigger cleanup / delete rule | Three distinct confirms | High risk | **High** | **No** |
| `PaymentMethodManager.tsx` | Remove payment method | `…remove this payment method?` | Destructive | Medium | **No** |
| `drive/trash/page.tsx` | Empty trash permanently | `Permanently delete all File Hub items in trash?` | Destructive | **High** | **No** |
| `GlobalTrashBin.tsx` | Permanent delete-all | ``…permanently delete all ${n} items?`` | Destructive | **High** | **No** |

**Batch 2C “Yes” total:** **9–10** sites / **7–8** files.

---

### 13.3 Migration strategy (per candidate)

| File | Flow | Pattern | Pending state | Variant | `confirmLabel` | Notes |
|------|------|---------|---------------|---------|----------------|-------|
| `SidebarCustomizationModal` | Unsaved close | **B** | `pendingUnsavedClose: boolean` | `informational` | Close / Discard changes | `handleCancel` only; no API until user confirms discard |
| `SidebarCustomizationModal` | Reset config | **B** | `pendingResetScope: 'tab' \| 'sidebar' \| 'global' \| null` | `destructive` | Reset | Snapshot scope at open; `resetConfig` on confirm |
| `FrontPageContentEditor` | Delete announcement | **A** | `pendingAnnouncementToDelete: string \| null` | `destructive` | Delete | Local `onChange` only — no API |
| `OrgChartBuilder` | Delete org item | **A** | `pendingOrgItemToDelete: { mode: EditMode; id: string } \| null` | `destructive` | Delete | Resolve `mode` + `id` at execute |
| `ConnectionList` | Remove single | **A** | `pendingConnectionToRemove: { id: string; userName: string } \| null` | `destructive` | Remove | Preserve name in description |
| `ConnectionList` | Bulk remove | **A** | `pendingBulkConnectionsToRemove: string[] \| null` | `destructive` | Remove | Id snapshot; rebuild description from `connections` |
| `PendingRequestsList` | Bulk request action | **B** | `pendingBulkRequestAction: { action: 'accept' \| 'decline' \| 'block'; requestIds: string[] } \| null` | `destructive` or `standard` | Accept / Decline / Block (dynamic) | **Pattern C note:** dynamic label + description from `action`; not a single entity |
| `ai-chat/page.tsx` | Trash conversation | **A** | `pendingConversationToTrash: string \| null` | `destructive` | Move to trash | Align with Drive 2B; `trashItem` after confirm |
| `AIChatDropdown.tsx` | Trash conversation | **A** | `pendingConversationToTrash: string \| null` | `destructive` | Move to trash | Same as page; close menu on request |
| `branding/page.tsx` (optional) | Delete widget | **A** | `pendingWidgetToDelete: string \| null` | `destructive` | Delete | API `DELETE` on confirm |

**Pattern C (special handling):** None required beyond **PendingRequestsList** dynamic action label (still implemented as Pattern B + dynamic `confirmLabel` / `description` — no `useConfirm()`).

**Critical state rule (all flows):** No delete/trash/API mutation before confirm. Bulk flows snapshot **ids** (and action type for PendingRequests) at open.

---

### 13.4 Recommended Batch 2C scope

**Core (required):** 7 files / **9** sites.

**Optional:** `branding/page.tsx` (+1 site) — include only if product wants front-page widget delete in same QA train; otherwise defer to Batch 5.

**Do not expand** beyond 8 files in 2C — keeps blast radius smaller than TaskDetail + Drive combined.

| Metric | Value |
|--------|------:|
| Files | **7–8** |
| Call sites | **9–10** |
| Post-2C `web/` confirms (grep) | **42–43** |

---

### 13.5 Implementation order (ACT)

One file per PR (Batch 1 / 2B discipline). Combine ai-chat + dropdown only if team accepts 2-file PR.

| Step | File | Sites | Rationale |
|------|------|------:|-----------|
| **2C.1** | `SidebarCustomizationModal.tsx` | 2 | **Done (2026-06-03)** — `pendingCloseAction` + `pendingResetAction` |
| **2C.2** | `FrontPageContentEditor.tsx` | 1 | **Done (2026-06-03)** — `pendingAnnouncementToDelete` |
| **2C.3** | `OrgChartBuilder.tsx` | 1 | **Done (2026-06-03)** — `pendingOrgItemToDelete` |
| **2C.4** | `ConnectionList.tsx` | 2 | **Done (2026-06-03)** — `pendingConnectionToRemove` + `pendingBulkConnectionsToRemove` |
| **2C.5** | `PendingRequestsList.tsx` | 1 | **Done (2026-06-03)** — `pendingBulkRequestAction` |
| **2C.6** | `ai-chat/page.tsx` | 1 | **Done (2026-06-03)** — `pendingConversationToTrash` |
| **2C.7** | `AIChatDropdown.tsx` | 1 | **Done (2026-06-03)** — `pendingConversationToTrash` (`header/`) |
| **2C.8** *(optional)* | `branding/page.tsx` | 1 | Widget delete; defer if scope pressure |

**Per-step gates:** `pnpm type-check`; zero `confirm()` in touched file; one QA checklist row.

---

### 13.6 Explicit exclusions (Batch 2C)

Do **not** migrate in Batch 2C:

| Exclusion | Examples |
|-----------|----------|
| Calendar / EventDrawer | Occurrence vs series; conflict/slot informational |
| Admin portal | overrides, seed-modules, system-logs, pipeline registry |
| Permission grants / revokes | `PermissionManager`, admin overrides |
| HR termination / sensitive HR | `hr/employees` terminate, `EmployeeManager` |
| Retention cleanup triggers | `RetentionManagementDashboard` |
| Drive permanent delete | `drive/trash`, `GlobalTrashBin` |
| Empty trash / restore | Trash restore APIs |
| Billing / payment | `PaymentMethodManager` |
| Governance | `GovernanceManagementDashboard` |
| Scheduling cluster | 9 sites across 6 files |
| Branding preset apply/reset | `FrontPageThemeCustomizer`, `GlobalBrandingEditor` |
| Module uninstall | `modules/page.tsx` |
| Business structure delete | `StationsAndPositionsEditor` |
| `ConfirmModal` / `useConfirm` primitives | No changes during migration |

---

### 13.7 QA requirements (manual, per ACT step)

**Sidebar (2C.1)**

- [ ] Dirty close → informational confirm; clean close → no modal
- [ ] Reset tab / sidebar / global → correct `scopeLabel` in description
- [ ] Cancel / Escape / backdrop → no reset API
- [ ] Dark mode

**FrontPageContentEditor (2C.2)**

- [ ] Delete announcement → confirm; cancel preserves list
- [ ] Confirm → local list update only (no orphan API)

**OrgChartBuilder (2C.3)**

- [ ] Delete tier / department / position → same copy
- [ ] Confirm → API + refresh; cancel → item remains

**ConnectionList (2C.4)**

- [ ] Single remove → name in description
- [ ] Bulk remove → count / names copy
- [ ] Selection snapshot stable while modal open

**PendingRequestsList (2C.5)**

- [ ] Accept / decline / block each open correct dynamic copy
- [ ] Bulk count in description
- [ ] Confirm runs bulk API only after confirm

**AI chat (2C.6–2C.7)**

- [ ] Page + dropdown trash → `Move to trash` label; conversation title in description
- [ ] Menu closes before modal (dropdown)
- [ ] Confirm → `trashItem`; current conversation clears if deleted
- [ ] Dark mode

**Branding widget (2C.8, optional)**

- [ ] Widget delete confirm; API on confirm only

**Inherited:** Batch 1 / 2A / 2B manual QA still **pending** unless signed off.

---

### 13.8 Batch 2C ACT readiness

```text
READY FOR ACT — WITH FINDINGS
```

| Gate | Status |
|------|--------|
| Inventory verified (grep 52; 2C scope 9–10 sites) | **Yes** |
| Rollout groups documented | **Yes** |
| Pattern A/B defined per file | **Yes** |
| Exclusions locked | **Yes** |
| Batch 2B closed | **Yes** |
| Batch 1 / 2A / 2B manual QA | **Pending** — proceed with accepted risk or QA sign-off |
| `informational` variant for sidebar close | **Defined** — first production use in 2C.1 |

**Next ACT file:** `web/src/app/business/[id]/branding/page.tsx` (2C.8, optional). **2C.1–2C.7 done** (2026-06-03). Core Batch 2C complete (9 sites).

**After 2C ships:** Full Batch 2 closeout — `docs/ux/audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md` (2A + 2B + 2C).

---

**Last updated:** 2026-06-03 (Batch 2 **closed** — [`audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md))
