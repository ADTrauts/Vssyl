# ConfirmModal Batch 1 Rollout Plan (Wave 2B-3)

**Status:** **Complete** — closeout [`audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md) (**PASS WITH FINDINGS**, 2026-06-03)  
**Date:** 2026-06-03  
**Prerequisite:** Pilot closeout — [`audits/CONFIRMMODAL_PILOT_CLOSEOUT.md`](./audits/CONFIRMMODAL_PILOT_CLOSEOUT.md) (**PASS WITH FINDINGS**, approved for rollout)  
**Inventory:** [`CONFIRMMODAL_STANDARDIZATION_PLAN.md`](./CONFIRMMODAL_STANDARDIZATION_PLAN.md) (~73 `confirm()` sites)

---

## 1. Batch 1 objective

Replace **8** low-risk, isolated `confirm()` / `window.confirm()` call sites across **8 files** — no admin, no calendar binary-choice, no HR termination, no bulk permanent purge.

**Remaining after Batch 1:** **60** `web/` call sites (closeout grep, 2026-06-03); deferred to Batch 2+ planning.

---

## 2. Candidate scoring (Batch 1 shortlist + near-misses)

| Component | Confirm type | Risk | Complexity | Recommended | Notes |
|-----------|--------------|------|------------|-------------|-------|
| **NotesModule.tsx** | Delete note | Low | Low | **Yes** | 1 site; may have share/template `Modal` open — use pilot pattern |
| **AttachmentViewer.tsx** | Delete attachment | Low | Low | **Yes** | 1 site; task context |
| **todo/TimeHistory.tsx** | Delete time log | Low | Low | **Yes** | 1 site |
| **ai/CustomContext.tsx** | Delete context entry | Low | Low | **Yes** | 1 site |
| **ai/AIMemoriesView.tsx** | Forget memory (`window.confirm`) | Low | Low | **Yes** | 1 site; destructive copy |
| **todo/ProjectManager.tsx** | Delete project | Low | Medium | **Yes** | 1 site; named entity in message |
| **sidebar/LeftSidebarCustomizer.tsx** | Delete folder | Low | Medium | **Yes** | 1 site; local config mutation |
| **notifications/page.tsx** | Delete notification (menu) | Low | **Medium** | **Yes** | 1 site; inside `NotificationActionsMenu` dropdown — close menu then open confirm |
| PaymentMethodManager.tsx | Remove payment method | Medium | Low | **Later** | Billing — Batch 2 |
| todo/TaskDetail.tsx | 4× delete/remove | Low | **High** | **Later** | Batch 2 — multi-site file |
| ModuleManagementModal.tsx | — | — | — | **Done** | Pilot complete |
| DriveModule / trash / GlobalTrashBin | Trash / permanent | Medium–High | Medium | **Later** | Batch 2–4 per master plan |
| Calendar * / EventDrawer | Binary OK/Cancel | Medium | High | **No** | Blocked — inverted semantics |
| admin-portal/* | Grant/revoke/seed | High | Medium | **No** | Batch 8 |
| hr/employees terminate | Terminate employee | High | Low | **No** | Batch 7 |

---

## 3. Selected Batch 1 scope

### 3.1 Components (8 files, 8 call sites)

| # | File | Call site | Variant | Primary label |
|---|------|-----------|---------|---------------|
| 1 | `web/src/components/notes/NotesModule.tsx` | `handleDelete` | `destructive` | Delete |
| 2 | `web/src/components/todo/AttachmentViewer.tsx` | `handleDelete` | `destructive` | Delete |
| 3 | `web/src/components/todo/TimeHistory.tsx` | delete time log | `destructive` | Delete |
| 4 | `web/src/components/ai/CustomContext.tsx` | `handleDelete` | `destructive` | Delete |
| 5 | `web/src/components/ai/AIMemoriesView.tsx` | forget memory | `destructive` | Forget (or Remove) |
| 6 | `web/src/components/todo/ProjectManager.tsx` | delete project | `destructive` | Delete |
| 7 | `web/src/components/sidebar/LeftSidebarCustomizer.tsx` | `handleDeleteFolder` | `destructive` | Delete |
| 8 | `web/src/app/notifications/page.tsx` | notification menu delete | `destructive` | Delete |

### 3.2 Explicitly excluded from Batch 1

- Admin, HR terminate, permissions, retention cleanup trigger  
- Drive trash / `GlobalTrashBin` permanent delete  
- Calendar / EventDrawer binary-choice confirms  
- `TaskDetail.tsx` (4 sites — Batch 2)  
- `PaymentMethodManager` (billing sensitivity)

---

## 4. Migration order

| Step | File | Rationale |
|------|------|-----------|
| **1** | `NotesModule.tsx` | **Done (2B-3.1)** — delete note → `ConfirmModal` |
| **2** | `AttachmentViewer.tsx` | **Done (2B-3.2)** — delete attachment → `ConfirmModal` |
| **3** | `TimeHistory.tsx` | **Done (2B-3.3)** — delete time log → `ConfirmModal` |
| **4** | `CustomContext.tsx` | **Done (2B-3.4)** — delete context entry → `ConfirmModal` |
| **5** | `AIMemoriesView.tsx` | **Done (2B-3.5)** — forget memory → `ConfirmModal` |
| **6** | `ProjectManager.tsx` | **Done (2B-3.6)** — delete project → `ConfirmModal` |
| **7** | `LeftSidebarCustomizer.tsx` | **Done (2B-3.7)** — delete folder → `ConfirmModal` |
| **8** | `notifications/page.tsx` | **Done (2B-3.8)** — menu delete notification → `ConfirmModal` |

**One PR per file** recommended (easy rollback), or **single PR with 8 commits** if team prefers one review.

---

## 5. Implementation strategy

### Recommendation: **Option C — Mixed, Batch 1 biased to Option A**

| Option | Use when | Batch 1 |
|--------|----------|---------|
| **A — Direct `ConfirmModal`** | Pending entity state + sibling confirm; parent `Modal` may be open | **All 8 files** (consistent with pilot) |
| **B — `useConfirm()` hook** | Many handlers, single mount, no nested modal | **Defer** to Batch 2 evaluation |
| **C — Mixed** | A for nested/modal contexts; B for simple pages | **Batch 1 = 100% pattern A** for uniformity |

**Evidence:**

- Pilot proved **pattern A** for `ModuleManagementModal` (nested modal + async API).
- `NotesModule` already uses `Modal` — pattern A avoids hook mount ordering issues.
- `notifications/page.tsx` confirm lives in subcomponent — local `useState` + `ConfirmModal` in same component (still A).
- `useConfirm` adds global dialog mount requirement — not needed until broader refactors.

### Per-file pattern (template)

```tsx
const [pendingDelete, setPendingDelete] = useState<...>(null);

// trigger
const handleDelete = () => setPendingDelete(entity);

// execute (existing logic)
const executeDelete = async () => { ...; setPendingDelete(null); };

<ConfirmModal
  open={pendingDelete !== null}
  onClose={() => setPendingDelete(null)}
  onConfirm={executeDelete}
  title="..."
  description="..." // preserve legacy confirm string
  variant="destructive"
  confirmLabel="Delete"
  loading={...}
/>
```

**notifications/page.tsx:** On Delete click → `setPendingDeleteNotification(id)` + `setIsOpen(false)` → render `ConfirmModal` at menu component root.

---

## 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Nested modal (Notes) | Advisory | Same as pilot; QA notes + Drive |
| Menu closes before confirm (notifications) | Low | Set pending state before closing menu |
| Copy drift | Low | Copy legacy strings into `description` verbatim |
| Double-submit | Low | `loading` on ConfirmModal during async |
| Regression in delete API paths | Medium | No logic changes inside try/catch — only gate |

---

## 7. QA requirements

### Per migration (minimum)

- [ ] Trigger delete/remove → ConfirmModal opens  
- [ ] Cancel / Escape / backdrop → no delete  
- [ ] Confirm → same outcome as before (toast, list update)  
- [ ] Focus starts on **Cancel** (destructive)  
- [ ] Tab trapped between Cancel / Confirm / X  
- [ ] Focus returns to trigger after close  
- [ ] Dark mode readable  

### Batch 1 smoke (representative)

| Area | Path |
|------|------|
| Notes | Delete open note |
| Todo | Delete attachment + time log + project |
| AI | Delete custom context entry; forget memory |
| Sidebar | Delete folder in customizer |
| Notifications | Notification menu → Delete |

### Automated

- [ ] `pnpm type-check` after each file or once per batch PR  
- [ ] Grep: no `confirm(` in touched files  

---

## 8. Rollback plan

| Level | Action |
|-------|--------|
| **Single file** | Revert commit for that file; restore one `confirm()` line |
| **Full batch** | Revert Batch 1 PR (8 files) |
| **Primitive** | Do **not** roll back `ConfirmModal` — pilot depends on it |

No feature flags required for Batch 1 (small blast radius).

---

## 9. Post–Batch 1

| Phase | Scope |
|-------|--------|
| **Batch 2** | `TaskDetail.tsx` (4), `PaymentMethodManager`, `FrontPage*` editors, branding presets (informational) |
| **Batch 3** | Drive trash moves, `GlobalTrashBin`, `ai-chat` / `AIChatDropdown` |
| **Batch 4+** | Scheduling cluster, org-chart, household, business modules |

Update [`CONFIRMMODAL_STANDARDIZATION_PLAN.md`](./CONFIRMMODAL_STANDARDIZATION_PLAN.md) §6.2 when Batch 1 starts.

---

## 10. Rollout decision

```text
Proceed with Batch 1 implementation (Wave 2B-3)
```

**Strategy:** Option A (`ConfirmModal` + pending state) for all eight files.  
**Gate:** Complete pilot manual QA or accept NB-1 from pilot closeout.

---

**Last updated:** 2026-06-03
