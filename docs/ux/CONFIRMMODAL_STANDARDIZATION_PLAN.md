# ConfirmModal Standardization Plan (Wave 2B)

**Status:** 2B-1 primitive + 2B-2 pilot + **2B-3 Batch 1 complete** (closeout **PASS WITH FINDINGS**); Batch 2+ planning only — [`audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH1_CLOSEOUT.md)  
**Date:** 2026-06-03  
**Prerequisite:** Wave 2A modal foundation — **PASS WITH FINDINGS** ([`audits/MODAL_STANDARDIZATION_CLOSEOUT.md`](./audits/MODAL_STANDARDIZATION_CLOSEOUT.md))  
**Foundation:** `shared/src/components/Modal.tsx`

---

## Executive summary

The platform has **~73 browser `confirm()` / `window.confirm()` call sites** across **57 web files**, plus **2** ad hoc React confirmation UIs that should converge later. There is **no** shared `ConfirmModal` today. Destructive billing/dashboard flows already use **`Modal`** (`CancelSubscriptionModal`, `DashboardDeletionModal`).

**Recommendation:** Introduce `ConfirmModal` composing certified `Modal`, with **mandatory focus trap** on the confirm surface only, then migrate in risk-ordered waves starting with a **ModuleManagementModal** pilot.

---

## 1. Confirmation inventory

### 1.1 Browser-native confirms (`web/` only)

| Metric | Count |
|--------|------:|
| **Total call sites** | **73** |
| **Files with ≥1 call** | **57** |
| `window.confirm(` explicit | 8 call sites (7 files) |
| `confirm(` (global) | 65 call sites (includes the 8 above) |

**Search method:** `confirm(` and `window.confirm(` across `web/**/*.{ts,tsx}` (2026-06-03).  
**Out of scope:** `server/` (no UI confirms), password-field `confirmPassword`, email copy “confirmation”.

### 1.2 Non-native confirmation UI (related)

| Location | Pattern | Notes |
|----------|---------|-------|
| `web/src/components/scheduling/OpenShiftsList.tsx` | `<Modal>` + “Are you sure…” + Confirm/Cancel buttons | **Positive** confirm (claim shift); model for API |
| `web/src/app/admin-portal/impersonate/page.tsx` | Custom `fixed inset-0` overlay | **Not** `confirm()`; high-risk; migrate to `Modal` later, not v1 `ConfirmModal` |
| `web/src/components/CancelSubscriptionModal.tsx` | `<Modal>` + retention + cancel | Domain flow; keep separate |
| `web/src/components/DashboardDeletionModal.tsx` | `<Modal>` + file-handling choices | Multi-step; not a simple confirm |

### 1.3 Inventory by domain (call sites)

| Domain | Files | Call sites (approx) | Examples |
|--------|------:|--------------------:|----------|
| **Scheduling** | 8 | 14 | Delete shift/schedule/template; cancel swap |
| **Todo / projects** | 5 | 11 | Delete comment, subtask, attachment, project, dependency |
| **Drive / trash** | 5 | 7 | Move to trash; permanent delete all |
| **Calendar** | 4 | 6 | Recurring “this occurrence vs series” (binary native) |
| **Business / org** | 8 | 12 | Station/position delete; branding preset; widget delete |
| **HR / onboarding** | 4 | 5 | Terminate employee; archive template |
| **Admin portal** | 4 | 6 | Grant/revoke admin; tier; seed modules; archive intent |
| **Members / social** | 3 | 4 | Remove connection; bulk remove; pending requests |
| **AI** | 3 | 3 | Trash conversation; forget memory; delete context |
| **Governance / retention** | 2 | 4 | Delete policy; trigger cleanup |
| **Dashboard / modules** | 2 | 2 | Remove dashboard widget module; uninstall business module |
| **Other** | 9 | 9 | Notifications, notes, payment method, household, sidebar, etc. |

### 1.4 `window.confirm` explicit sites

| File | Message pattern |
|------|-----------------|
| `ModuleManagementModal.tsx` | Remove module from dashboard |
| `ConnectionList.tsx` | Remove connection (×2 bulk/single) |
| `PendingRequestsList.tsx` | Bulk reject/remove (dynamic message) |
| `drive/trash/page.tsx` | Permanently delete all File Hub trash |
| `AIMemoriesView.tsx` | Forget AI memory |
| `PipelineIntentRegistrySection.tsx` | Archive intent |
| `OnboardingModuleSettings.tsx` | Archive onboarding template |

---

## 2. Risk categories

### 2.1 Classification rules

| Category | Criteria | Default UX |
|----------|----------|------------|
| **Informational** | Reversible preference, navigation, or “proceed?” without data loss | Cancel + **Continue** / **Apply** |
| **Standard confirmation** | Deletes soft/trash, removes non-critical links, cancels requests | Cancel + **Confirm** |
| **Destructive confirmation** | Hard delete, remove access, uninstall, cannot be undone (copy says so) | Cancel + **Delete** / **Remove** (danger styling) |
| **High-risk confirmation** | Admin powers, bulk permanent purge, cross-tenant impact | Destructive + **strong copy**; typed confirm **deferred** to v2 unless product requires |

### 2.2 Call-site classification (73 sites)

| Category | Count | % | Representative sites |
|----------|------:|---:|----------------------|
| **Informational** | **16** | 22% | Sidebar unsaved close; branding/theme preset apply+reset; calendar series choice (×4); EventDrawer conflict/slots (×3); seed-modules continue |
| **Standard** | **42** | 58% | Move to trash (Drive, chat, starred); delete notification/comment/shift/note; cancel time-off/swap; archive template; remove dependency |
| **Destructive** | **11** | 15% | Permanent delete all trash (×2); delete station/position/schedule (undone copy); terminate employee; uninstall module; reset sidebar defaults; remove payment method; household leave/remove |
| **High-risk** | **4** | 5% | Admin overrides grant/revoke/tier (×3); retention **trigger cleanup** |

**Calendar nuance (Informational, special):** Native `confirm('…occurrence only? Press Cancel for entire series')` uses **OK = this occurrence, Cancel = series** — inverted from typical Cancel/Confirm. **Do not** map 1:1 to default `ConfirmModal` without a `mode: 'binary-choice'` or keep native until designed.

**Positive confirm (not in 73 count):** `OpenShiftsList` “Claim shift” — use `variant: 'standard'` with `confirmLabel: 'Claim'`.

---

## 3. Proposed ConfirmModal API (design only)

### 3.1 Component

Location: `shared/src/components/ConfirmModal.tsx`  
Composes: `Modal` (certified shell).  
Export: `shared/src/components/index.ts` + `client.ts`.

```tsx
export type ConfirmVariant = 'standard' | 'destructive' | 'informational';

export interface ConfirmModalProps {
  /** Controlled open state */
  open: boolean;
  /** Cancel / backdrop / Escape (no side effects) */
  onClose: () => void;
  /** Primary action — caller runs async work; ConfirmModal sets loading from promise optional */
  onConfirm: () => void | Promise<void>;
  /** Required for a11y */
  title: string;
  /** Body copy — string or ReactNode for links */
  description?: React.ReactNode;
  /** Defaults by variant: Confirm | Delete | Continue */
  confirmLabel?: string;
  /** Default: Cancel */
  cancelLabel?: string;
  variant?: ConfirmVariant; // default 'standard'
  /** Disable buttons + optional spinner on confirm */
  loading?: boolean;
  /** Disable confirm (e.g. validation) */
  confirmDisabled?: boolean;
  /** Modal size — default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /**
   * When true, trap focus inside dialog while open.
   * Default true for ConfirmModal (unlike base Modal).
   */
  trapFocus?: boolean; // default true
}
```

**Explicitly not in v1 (avoid over-engineering):**

- `confirmText` / typed confirmation (high-risk v2)
- `mode: 'binary-choice'` for calendar (separate spike or `ChoiceModal`)
- Imperative global singleton (consider `useConfirm()` in v1b)

### 3.2 Recommended hook (migration ergonomics)

```tsx
// shared/src/hooks/useConfirm.ts (design)
type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
};

function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmModalPortal: React.FC; // renders single instance at root of subtree
};
```

Replaces `if (!confirm(...)) return` with:

```tsx
const ok = await confirm({ title: '...', description: '...', variant: 'destructive' });
if (!ok) return;
```

### 3.3 Variant → button mapping

| Variant | Primary button | Style |
|---------|----------------|-------|
| `informational` | Continue / Apply / Save | `Button` primary |
| `standard` | Confirm / OK | `Button` primary |
| `destructive` | Delete / Remove / Uninstall | `Button` primary + `bg-v-danger` / danger token when available |

Footer layout: **Cancel (secondary, left or right per platform pattern) + Primary** — match `DashboardBuildOutModal` / `CancelSubscriptionModal`: actions right-aligned, Cancel first.

**No duplicate header close for destructive?** Keep Modal X for consistency with 2A; document that Cancel === X === Escape === backdrop (all `onClose`).

---

## 4. Accessibility requirements

Derived from [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md) and [`MODAL_STANDARDIZATION_CLOSEOUT.md`](./audits/MODAL_STANDARDIZATION_CLOSEOUT.md).

### 4.1 Mandatory for ConfirmModal

| Requirement | Implementation direction |
|-------------|-------------------------|
| **Focus trap** | **Mandatory** — tab cycle contained in dialog; implement lightweight trap (no new dep if possible: focusable query + Tab handler) or add `focus-trap-react` with bundle review |
| **Initial focus** | **Mandatory** — focus **Cancel** for destructive/high-risk; focus **Confirm** for informational only (product default: **Cancel** for destructive) |
| **Focus return** | **Mandatory** — inherit from `Modal` (restore trigger) |
| **Escape** | **Mandatory** — `onClose`, no confirm |
| **Backdrop click** | **Mandatory** — `onClose`, no confirm |
| **`role="dialog"` / `aria-modal`** | **Mandatory** — via `Modal` |
| **`aria-labelledby`** | **Mandatory** — `title` required |
| **`aria-describedby`** | **Mandatory when `description` set** — link body paragraph id |
| **Keyboard** | Enter on focused button only; no implicit Enter-to-confirm on open |
| **Loading** | `aria-busy` on footer; disable both buttons |

### 4.2 Classifications for gaps

| Gap | Classification |
|-----|----------------|
| No focus trap on base `Modal` | **Non-Blocking** for platform; **Blocking for ConfirmModal v1** |
| Base Modal initial focus on X | **Advisory** for ConfirmModal — override in ConfirmModal only |
| Screen reader reads description | **Mandatory** via `aria-describedby` |
| Calendar inverted OK/Cancel semantics | **Blocking** for those 6 sites until `binary-choice` designed — **do not** migrate with default ConfirmModal |

---

## 5. UX standards (footer patterns)

| Pattern | When | Footer |
|---------|------|--------|
| **Standard** | Soft delete, trash move, cancel request | Cancel + Confirm |
| **Destructive** | Permanent delete, uninstall, remove access, “cannot be undone” | Cancel + Delete (danger) |
| **Informational** | Preset apply, unsaved leave, proceed despite conflict | Cancel + Continue |
| **High-risk (v1)** | Admin grant/revoke, empty all trash, cleanup job | Destructive footer + explicit description; typed confirm **deferred** |

**Evidence:** 42 standard / 11 destructive / 16 informational / 4 high-risk from §2.2. No repo evidence of typed “DELETE” confirmation today — **do not add** in v1.

---

## 6. Migration strategy

### 6.1 Principles

1. **One pattern:** `ConfirmModal` or `useConfirm()` — no new `confirm()` in new code (lint rule later).
2. **Shell reuse:** Never duplicate overlay; always compose `Modal`.
3. **Behavior parity:** Async handlers stay in caller; `onConfirm` runs existing logic after `open` → user confirms.
4. **Calendar / binary flows:** Exempt until API supports non-standard button semantics.
5. **Domain modals:** `CancelSubscriptionModal`, `DashboardDeletionModal`, `ShareModal` — out of ConfirmModal scope.

### 6.2 Phased rollout

| Phase | Scope | Call sites | Risk |
|-------|--------|----------:|------|
| **2B-1** | Implement `ConfirmModal` + `useConfirm` + Storybook | 0 | **Done** |
| **2B-2** | Pilot (1 site) — `ModuleManagementModal` remove module | 1 | **Done** |
| **2B-3** | **Batch 1** — 8 sites — [`CONFIRMMODAL_BATCH1_PLAN.md`](./CONFIRMMODAL_BATCH1_PLAN.md) | 8 | **Done** |
| **2B-4** | Drive trash + global trash (notifications Batch 1 done) | ~9 | Medium (permanent delete) |
| **2B-5** | Scheduling cluster | ~14 | Medium |
| **2B-6** | Todo cluster | ~11 | Low |
| **2B-7** | Business / HR / org | ~17 | Medium–high |
| **2B-8** | Admin + retention + governance | ~10 | High |
| **2B-9** | Calendar binary + EventDrawer specials | ~9 | Spike required |
| **2B-10** | Replace `impersonate` custom overlay with `Modal` | 0 confirm | Separate |

### 6.3 Lint / governance (post-pilot)

- ESLint: `no-restricted-globals` for `confirm` in `web/` (optional exception list until phase complete).
- Update [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) — ConfirmModal section.
- Update [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md) — destructive action pattern.

---

## 7. Pilot candidates

| Candidate | Pros | Cons | Score |
|-----------|------|------|-------|
| **`ModuleManagementModal` remove module** | Single `window.confirm`; file just on canonical `Modal`; clear copy; DashboardClient only | User already in modal (confirm-on-confirm UX) | **Best pilot** |
| `notes/NotesModule` delete note | Simple destructive copy | Less visible |
| `todo/AttachmentViewer` delete attachment | Isolated component | Smaller blast radius |
| `notifications/page` delete notification | Simple | Inline handler in large page |
| Drive move to trash | High traffic | 2 sites (DriveModule + starred); soft delete not permanent |

### 7.1 Recommended pilot

**`ModuleManagementModal.tsx` — `handleUninstallModule` / remove module confirm**

- **Current:** `window.confirm(\`Are you sure you want to remove the ${module.name} module...\`)`
- **Target:** `useConfirm({ title: 'Remove module?', description: '...', variant: 'destructive', confirmLabel: 'Remove' })`
- **Why safest:** One call site, same file as 2A-2.4 migration, no calendar semantics, no admin blast radius, easy manual QA on dashboard manage modules.

**Post-pilot smoke:** Remove module → cancel → remove → Done; focus trap Tab cycle; Escape/backdrop cancel.

---

## 8. Recommended implementation order

1. **Design review** — approve API §3 + a11y §4 (this document).  
2. **2B-1** — `ConfirmModal` + focus trap + `aria-describedby` + Storybook variants (standard / destructive / informational).  
3. **2B-1b** — `useConfirm()` hook for ergonomic migration.  
4. **2B-2** — Pilot `ModuleManagementModal`.  
5. **2B-3** — `NotesModule`, `AttachmentViewer`, `notifications`, `SidebarCustomization` (reset/close), `ProjectManager`.  
6. **2B-4** — Drive trash moves + `GlobalTrashBin` + `drive/trash` empty (destructive).  
7. **2B-5–7** — Scheduling, Todo, Business/HR batches.  
8. **2B-8** — Admin overrides, retention cleanup, seed-modules (high-risk copy review).  
9. **2B-9** — Calendar / EventDrawer binary-choice spike.  
10. **Defer** — `ShareModal`, base `Modal` global focus trap, typed high-risk confirm.

---

## 9. Open questions (for product/engineering sign-off)

1. **Destructive initial focus:** Cancel (recommended) vs Delete?  
2. **Confirm-on-confirm:** ModuleManagement opens confirm inside `Modal` — acceptable for pilot or extract uninstall to page level?  
3. **Focus-trap library:** lightweight in-house vs dependency?  
4. **High-risk v2:** Typed confirmation for admin purge / empty trash — yes/no?

---

## 10. Recommendation (next UX wave)

After this plan is approved, proceed with **Wave 2B-1 implementation** (`ConfirmModal` + focus trap), not ShareModal or ContextMenu.

**Single next wave:** **ConfirmModal implementation + ModuleManagement pilot** (Options A from 2A-3 closeout).

---

**Related:** [`MODAL_STANDARDIZATION_REVIEW.md`](./MODAL_STANDARDIZATION_REVIEW.md), [`WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md`](./WAVE2A2_CUSTOM_MODAL_MIGRATION_PLAN.md), [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md)

**Last updated:** 2026-06-03
