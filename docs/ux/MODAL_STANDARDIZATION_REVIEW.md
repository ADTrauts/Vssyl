# Modal Standardization Review (Wave 2A Planning)

**Status:** Wave 2A-1 shell + Wave 2A-2 custom-shell migrations complete (2026-06-03); 2A-3+ deferred  
**Date:** 2026-06-03  
**Prerequisite:** Wave 1 / 1.5 closed — [`audits/WAVE1_QA_CLOSEOUT.md`](./audits/WAVE1_QA_CLOSEOUT.md)  
**Inventory reference:** [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md)

---

## Executive summary

### Does Vssyl have a single canonical modal system today?

**No.**

Vssyl has **one primary shared primitive** (`shared/src/components/Modal.tsx`) used by **~55+ files**, but it coexists with:

- **Custom full-screen overlays** in shared (`ShareModal`, `ShareLinkModal`) and web (`ModuleManagementModal`, `DashboardBuildOutModal`, `VLinkShareModal`)
- **Inline custom dialogs** (e.g. Drive keyboard shortcuts in `DriveModule.tsx`)
- **Drawer-style panels** (`EventDrawer`, `WorkspaceAIDrawer`, `AIResponseExplainDrawer`) that use `role="dialog"` but are not centered modals
- **Shared `Drawer` / `BottomSheet`** (not imported from `web/` at inventory time)
- **Browser `confirm()` / `window.confirm()`** for destructive actions (no shared ConfirmModal)

**Target state (Wave 2A+):** `Modal.tsx` as the **canonical centered overlay shell**; domain content composes inside it; `ShareModal` refactored to compose `Modal`; drawers documented as a **separate archetype** (side panel, not modal).

---

## Canonical primitive: `shared/src/components/Modal.tsx`

| Attribute | Finding |
|-----------|---------|
| **Portal** | Yes — `ReactDOM.createPortal(..., document.body)` |
| **Z-index** | `9999` / `10000` (inline styles + classes) |
| **Sizes** | `small` \| `medium` \| `large` \| `xlarge` |
| **Props** | `open`, `onClose`, `title`, `closeOnEscape`, `closeOnOverlayClick`, `headerActions` |
| **Token usage** | **2A-1:** `bg-v-surface`, `border-v-border`, `text-v-text-*`, `rounded-v-modal`, `shadow-v-modal`, `p-v-*`, `v-focus-ring` |
| **Dark mode** | Via `--v-color-surface` / text tokens (no forced inline white) |
| **Storybook** | `shared/stories/Modal.stories.tsx` |

---

## Accessibility review (`Modal.tsx` only)

Documented for planning — **not fixed in this pass**.

| Criterion | Status | Notes |
|-----------|--------|-------|
| **Focus trap** | **Deferred (2A-1b+)** | No tab cycle containment; focus can escape to page behind |
| **Escape key** | **Pass** | `closeOnEscape` default true; document listener |
| **Backdrop click** | **Pass** | `closeOnOverlayClick` default true; target check on overlay |
| **Initial focus** | **Pass (2A-1)** | Close button focused on open via `requestAnimationFrame` |
| **Focus return** | **Pass (2A-1)** | Prior `document.activeElement` restored on close if still in DOM |
| **ARIA labeling** | **Partial** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` when `title` set |
| **Close button** | **Partial** | `aria-label="Close modal"`; close button lacks `v-focus-ring` |
| **Keyboard nav inside** | **Pass** | Native tab order within panel only (not trapped) |
| **Scroll lock** | **Pass** | `document.body.style.overflow = 'hidden'` while open |
| **Inner panel role** | **Review** | Inner `role="document"` is non-standard for dialogs |

**Custom overlays (ShareModal, ShareLinkModal, etc.):** Generally have Escape/backdrop on some; **inconsistent** ARIA and no focus trap across the board.

---

## Token review (`Modal.tsx`)

| Token family | Used? | Gap |
|--------------|-------|-----|
| `--v-color-*` / `bg-v-*` | No | Scrim `rgba(0,0,0,0.5)` — acceptable; could document as overlay token later |
| `--v-radius-modal` / `rounded-v-modal` | No | Uses `rounded-lg` + inline `8px` |
| `--v-shadow-modal` / `shadow-v-modal` | No | Uses `shadow-2xl` + inline box-shadow |
| `--v-space-*` | No | `p-6`, `mb-4`, `my-8` hardcoded |
| `--v-surface` | No | `bg-white` + inline white |
| `--v-text-primary` | Partial | Title has Tailwind + inline `#111827` override |
| `v-focus-ring` | No | Close button: `focus:outline-none` only |

**Wave 2A token target (shell only):** `bg-v-surface`, `rounded-v-modal`, `shadow-v-modal`, `p-v-6`, `text-v-text-primary`, scrim unchanged or `bg-black/50`.

---

## Modal inventory

### A. Files named `*Modal.tsx` (27 files)

| File | Uses shared `Modal`? | Custom shell? | Purpose | Reusable? | A11y (summary) | Migrate? |
|------|---------------------|---------------|---------|-----------|----------------|----------|
| `shared/.../Modal.tsx` | **Canonical** | — | Generic dialog shell | Yes | Partial (see above) | **Tokenize shell (2A-1)** |
| `shared/.../ShareModal.tsx` | **N** | **Y** | Drive share people/business/link | Domain | Partial; custom overlay | **2A-3** compose `Modal` |
| `shared/.../ShareLinkModal.tsx` | **Y** | **N** | Share link copy for non-users | Domain | Canonical shell (2A-2.1) | — |
| `web/.../LoginModal.tsx` | **Y** | N | Auth sign-in | Yes | Inherits Modal gaps | **2A-4** retest after shell |
| `web/.../BusinessCreationModal.tsx` | **Y** | N | Create business | Yes | Inherits | Retest |
| `web/.../BillingModal.tsx` | **Y** | N | Billing / subscriptions | Yes | `xlarge` | Retest |
| `web/.../PaymentModal.tsx` | **Y** | N | Module subscribe | Yes | | Retest |
| `web/.../CancelSubscriptionModal.tsx` | **Y** | N | Destructive billing | Yes | Confirm pattern | **+ Confirm variant** |
| `web/.../AddPaymentMethodModal.tsx` | **Y** | N | Stripe payment method | Yes | | Retest |
| `web/.../DashboardDeletionModal.tsx` | **Y** | N | Delete dashboard | Yes | Destructive | Confirm variant |
| `web/.../ShareFileModal.tsx` | **Y** | N | File share (simpler) | Partial | Overlaps ShareModal | Review merge |
| `web/.../ClassificationModal.tsx` | **Y** | N | Data classification | Domain | | Retest |
| `web/.../AdvancedSharingModal.tsx` | **Y** | N | Enterprise sharing | Domain | | Retest |
| `web/.../DataClassificationModal.tsx` | **Y** | N | Enterprise classification | Domain | | Retest |
| `web/.../VLinkConnectModal.tsx` | **Y** | N | V_Link connect | Yes | | Retest |
| `web/.../VLinkShareModal.tsx` | **Y** | **N** | V_Link share | Domain | Canonical shell (2A-2.2) | — |
| `web/.../SidebarCustomizationModal.tsx` | **Y** | N | Sidebar config | Yes | Tabs inside | Retest |
| `web/.../PhotoCropModal.tsx` | **Y** | N | Image crop | Yes | `large` | Retest |
| `web/.../AISpendingLimitModal.tsx` | **Y** | N | AI spend limit | Yes | | Retest |
| `web/.../BulkInviteModal.tsx` | **Y** | N | Member bulk invite | Yes | `large` | Retest |
| `web/.../CreateOrgChartModal.tsx` | **Y** | N | Org chart create | Yes | | Retest |
| `web/.../OnboardingTaskApprovalModal.tsx` | **Y** | N | HR approval | Domain | | Retest |
| `web/.../OnboardingTaskCompletionModal.tsx` | **Y** | N | HR complete task | Domain | | Retest |
| `web/.../StartOnboardingJourneyModal.tsx` | **Y** | N | HR start journey | Domain | | Retest |
| `web/.../UpgradeFlow.tsx` | **Y** | N | Tier upgrade wizard | Yes | Multi-step | **Wizard variant** |
| `web/.../ModuleManagementModal.tsx` | **Y** | **N** | Dashboard widget install | Yes | Canonical shell (2A-2.4) | — |
| `web/.../DashboardBuildOutModal.tsx` | **Y** | **N** | Dashboard build-out | Yes | Canonical shell (2A-2.5) | — |
| `shared/stories/Modal.stories.tsx` | **Y** | N | Storybook | Dev | | Update after 2A-1 |

### B. Components using shared `Modal` (not `*Modal.tsx` filename)

**~40+ additional files** import `Modal` from `shared/components` for inline dialogs. High-density areas:

| Area | Example files | `<Modal` usage (approx) |
|------|---------------|-------------------------|
| Admin portal | `admin-portal/modules/page.tsx` (7), `support/page.tsx` (4), `performance/page.tsx`, `security/page.tsx` | Many |
| Scheduling | `SchedulingAdminContent.tsx` (5), `ScheduleBuilderSidebar.tsx` (3) | Many |
| HR / household | `HouseholdMemberManager.tsx`, `ConnectionList.tsx` | Several |
| Dashboard | `DashboardLayoutInner.tsx`, `DashboardClient.tsx` | Few |
| Notes / notebook | `NotesModule.tsx`, `NotebookPromoteToTask.tsx` | Few |
| Governance / retention | `RetentionManagementDashboard.tsx` (6), `GovernanceManagementDashboard.tsx` | Several |
| Chat | `ChatLeftPanel.tsx`, `ChatMainPanel.tsx` | Few |

**Migration:** These inherit shell changes automatically once `Modal.tsx` is tokenized (2A-1). No per-file migration unless custom markup duplicates overlay.

### C. Custom dialog implementations (no shared `Modal`)

| File | Pattern | Purpose | Migrate? |
|------|---------|---------|----------|
| `web/.../modules/DriveModule.tsx` | `fixed inset-0` + `role="dialog"` | Keyboard shortcuts help | **2A-3** → `Modal` or `Modal` + `title` |
| `web/.../admin-portal/impersonate/page.tsx` | Inline JSX confirm block | Impersonation confirm | **2A-4** → `ConfirmModal` |
| `web/.../calendar/EventDrawer.tsx` | Side overlay `z-40` | Event create/edit | **Drawer track** — not centered modal |
| `web/.../ai/WorkspaceAIDrawer.tsx` | `role="dialog"` panel | AI workspace | Drawer track |
| `web/.../ai/AIResponseExplainDrawer.tsx` | `role="dialog"` panel | AI explain | Drawer track |
| `web/.../ai/AIIdentityTour.tsx` | `role="dialog"` | Onboarding tour | Tour overlay — separate pattern |

### D. Portal overlays (related, not modals)

| File | Pattern | Modal? |
|------|---------|--------|
| `GlobalSearchBar.tsx`, `CompactSearchButton.tsx` | `createPortal` dropdown | **N** — popover |
| `AIChatDropdown.tsx` | Large portal panel | **N** — dropdown/panel |
| `GlobalTrashBin.tsx` | Portal trash panel | **N** — utility panel |
| `calendar/month/page.tsx` | Portal popover | **N** |

Do not conflate with Wave 2A modal work; track under Popover/dropdown (Tier 1).

### E. Shared slide-over primitives (modal-adjacent)

| File | Exported | Used in `web/`? | Notes |
|------|----------|-----------------|-------|
| `shared/.../Drawer.tsx` | Default export | **No imports found** | Escape + backdrop; no portal; no focus trap |
| `shared/.../BottomSheet.tsx` | Default export | **No imports found** | Mobile-style sheet |

**Recommendation:** Document in `LAYOUT_PATTERNS.md` / modal doc: **centered = `Modal`**, **edge-attached = `Drawer`**. Do not merge Drawer into Modal in 2A.

### F. Confirmation dialogs (non-modal primitive)

| Pattern | Occurrences | Examples |
|---------|-------------|----------|
| `window.confirm` / `confirm()` | **25+** | `ConnectionList`, `SchedulingAdminContent`, `GlobalTrashBin`, HR terminate, notes delete |
| Custom inline confirm UI | 1 | `admin-portal/impersonate/page.tsx` |

**Recommendation:** Wave 2A planning includes **`ConfirmModal`** variant (composes `Modal`); **replacing** `confirm()` is Wave 2B+.

---

## Duplicate patterns

| Pattern | Instances | Canonical target |
|---------|-----------|----------------|
| Centered overlay + scrim | `Modal`, `ShareLinkModal`, `ModuleManagementModal`, `DashboardBuildOutModal`, `VLinkShareModal`, Drive shortcuts | **`Modal`** |
| Share UX | `ShareModal`, `ShareFileModal`, `ShareLinkModal`, `AdvancedSharingModal` | **`ShareModal` on `Modal` shell** + thin wrappers |
| Upgrade / billing | `UpgradeFlow`, `BillingModal`, `PaymentModal`, `CancelSubscriptionModal` | **`Modal`** + **`ConfirmModal`** for destructive |
| HR onboarding modals | 3 dedicated `*Modal.tsx` | Keep files; ensure all use shared `Modal` (already do) |
| Confirm destructive | `confirm()` vs future `ConfirmModal` | **`ConfirmModal`** |
| Drawer vs modal naming | `*Drawer.tsx` using dialog role | Clarify naming; optional `Drawer` export later |

---

## Canonical variant recommendations

Based on repository usage — implement as **compositions** on `Modal`, not separate overlay systems.

| Variant | Description | Evidence | Wave 2A priority |
|---------|-------------|----------|------------------|
| **Standard Modal** | Title, close, body, sizes sm–xl | Default `Modal.tsx`; 55+ usages | **P0** — tokenize shell |
| **Confirmation Modal** | Title, message, Cancel + primary action | `CancelSubscriptionModal`, `DashboardDeletionModal`, many `confirm()` | **P1** — new `ConfirmModal.tsx` composing `Modal` |
| **Destructive Confirmation** | Confirm variant + `v-danger` primary | Subscription cancel, dashboard delete, trash purge | **P1** — props on `ConfirmModal` |
| **Full-screen / xlarge** | `size="xlarge"` | `BillingModal`, admin BI | **P0** — already supported |
| **Wizard Modal** | Multi-step footer (Back / Next) | `UpgradeFlow` (`step` state) | **P2** — `WizardModal` footer slot or doc pattern |
| **Share Modal** | Tabs + domain API props | `ShareModal.tsx` (~668 lines) | **P2** — refactor onto `Modal` shell |
| **Side Panel / Drawer** | Right-edge panel | `EventDrawer`, `Drawer.tsx` | **Separate wave** — not 2A centered modal |
| **Share Link Modal** | Small confirm + copy link | `ShareLinkModal` | **P1** — migrate to `Modal` `small` |

**Not recommended as new primitives:** keyboard-help modal (use Standard), impersonate confirm (use ConfirmModal).

---

## Migration candidates (prioritized)

### Tier A — Wave 2A implementation (shell + low-risk composes)

1. **`Modal.tsx`** — tokens + documented a11y gaps (focus trap optional 2A-1b if scoped)  
2. **`ShareLinkModal.tsx`** — small; custom → `Modal`  
3. **`VLinkShareModal.tsx`** — custom → `Modal`  
4. **`ModuleManagementModal.tsx`** — custom → `Modal` `large`/`xlarge`  
5. **`DashboardBuildOutModal.tsx`** — custom → `Modal`  
6. **`DriveModule.tsx`** keyboard shortcuts block → `Modal` `medium`  

### Tier B — After shell stable (still Wave 2 family, may be 2B)

7. **`ShareModal.tsx`** — large domain surface; compose `Modal` + keep tabs  
8. **`ConfirmModal`** + gradual `confirm()` replacement in admin/scheduling  
9. **`UpgradeFlow`** — document wizard footer pattern on `Modal`  
10. **Storybook** — light/dark stories for sizes + ConfirmModal  

### Tier C — Out of Wave 2A scope

- All files already using `<Modal>` (inherit shell)  
- `EventDrawer` / AI drawers → Drawer standardization wave  
- `window.confirm` bulk replacement  
- Portal search/chat panels  

---

## Proposed Wave 2A implementation order

Planning only — **do not implement** until ACT approval.

| Step | Work | Risk | Validation |
|------|------|------|------------|
| **2A-1** | Tokenize `Modal.tsx` shell (`v-surface`, `v-modal` radius/shadow/spacing, dark mode fix inline white) | Medium (55+ consumers) | Storybook + LoginModal + BillingModal light/dark |
| **2A-1b** | A11y hardening on `Modal` only: focus trap, initial focus, focus return, `v-focus-ring` on close | Medium–High | Tab cycle test on LoginModal |
| **2A-2** | Migrate **custom shell** modals: `ShareLinkModal`, `VLinkShareModal`, `ModuleManagementModal`, `DashboardBuildOutModal` | Low–medium | Per-feature smoke |
| **2A-3** | Migrate **DriveModule** inline keyboard dialog → `Modal` | Low | Drive shortcuts open/close |
| **2A-4** | Add **`ConfirmModal`** (composes `Modal`); migrate **one** pilot (`CancelSubscriptionModal` or impersonate block) | Medium | Destructive + cancel paths |
| **2A-5** | Document variants in `COMPONENT_STANDARDS.md` + update `MODAL_STANDARDIZATION_REVIEW` status | None | — |
| **2A-6** | Plan **ShareModal** refactor (design review only or start compose) | High | Drive share regression |

**Explicitly deferred from 2A-1:** `ShareModal` full refactor, `confirm()` repo-wide replacement, `Drawer` tokenization.

---

## Single canonical system — target definition

After Wave 2A, “canonical modal” means:

1. **Shell:** `import { Modal } from 'shared/components'`  
2. **Confirm:** `import { ConfirmModal } from 'shared/components'` (to be added)  
3. **No new** `fixed inset-0 bg-black/50` overlays in feature code (except documented exceptions)  
4. **Domain modals** (`ShareModal`) implement **content only**, not overlay mechanics  
5. **Drawers** use `Drawer` (future wave), not copied modal markup  

---

## Related

- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md) — Modal section  
- [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md) — Confirmation patterns  
- [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md) — Focus trap, Escape  
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md) — Wave 2 Tier 1  

**Last updated:** 2026-06-03
