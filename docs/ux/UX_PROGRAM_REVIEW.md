# Vssyl UX Program Review

**Status:** Program review — Wave 2 complete; Wave 3 planning input  
**Date:** 2026-06-03  
**Mode:** PLAN (no code changes)  
**Authoritative inventory:** **43** `web/` `confirm()` / `window.confirm()` sites (grep 2026-06-03)

**Related:** [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md), [`CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md), [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md)

---

## 1. Executive summary

The UX modernization program has **strong governance and foundational delivery** (Wave 0–2) but **limited module-level certification**. Wave 2 closed the **general-purpose confirmation** track; **specialized categories**, **Tier 1 components**, **layout shells**, and **product UX audits** remain largely untouched.

| Program phase | Status |
|---------------|--------|
| Wave 0 — Governance & token scaffolding | **Certified** (docs + `tokens.css`) |
| Wave 1 / 1.5 — Core primitives | **Certified** (QA closeout PASS) |
| Wave 2A — Modal shell | **Certified** (PASS WITH FINDINGS) |
| Wave 2B — ConfirmModal rollout | **Certified** (Batch 1 + 2 PASS WITH FINDINGS) |
| Wave 2 — Remaining shared components | **Partial** (Tier 1 not started) |
| Roadmap Wave 3 — Layout shells | **Not started** |
| Roadmap Wave 4 — Module audits | **Not audited** |
| Roadmap Wave 5 — UX certification ledger | **Not started** |

**ConfirmModal adoption:** **25** call sites removed across Batch 1 (8) + Batch 2 (17); **43** remain, mostly **specialized** (calendar, admin, HR, scheduling, purge, governance, branding presets).

**Recommendation:** Wave 3 should **not** be a single track. Split into **3A (Tier 1 components)**, **3B (Drive interaction completion)**, **3C (layout shell pilot)** — ranked below.

---

## 2. Certified UX systems

Systems with formal closeout or QA sign-off in-repo.

| System | Waves | Certification | Evidence |
|--------|-------|---------------|----------|
| **UX governance** | 0 | **Certified** | `UX_CONSTITUTION.md`, standards docs, `ux-standards.mdc` |
| **Design tokens (scaffold)** | 0, 1, 1.5 | **Certified** | `tokens.css`, `DESIGN_TOKENS.md`, Families 1–6 |
| **Button, Input, Card, EmptyState, Spinner, LoadingOverlay** | 1 | **Certified** | [`audits/WAVE1_QA_CLOSEOUT.md`](./audits/WAVE1_QA_CLOSEOUT.md) — **PASS** |
| **LoadingSkeleton + skeleton tokens** | 1.5 | **Certified** | Same closeout; zero production consumers at ship |
| **Modal shell** | 2A | **Certified** | [`audits/MODAL_STANDARDIZATION_CLOSEOUT.md`](./audits/MODAL_STANDARDIZATION_CLOSEOUT.md) — **PASS WITH FINDINGS** |
| **ConfirmModal primitive** | 2B-1 | **Certified** | `ConfirmModal.tsx`, focus trap; pilot closeout |
| **General-purpose confirmations** | 2B Batch 1 + 2 | **Certified** | Batch 1 + [`CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md) — **PASS WITH FINDINGS** |

**Interpretation:** Certification means **engineering closeout with evidence**, not full product QA sign-off for every surface (manual QA largely **PENDING** on ConfirmModal waves).

---

## 3. Partially complete UX systems

| System | Progress | Gap | Priority |
|--------|----------|-----|----------|
| **Colors / typography / spacing / radius / shadows** | Families 1–6 defined; 7 primitives on `v.*` | ~40+ shared components still raw `blue-600` / gray Tailwind | High |
| **Modal ecosystem** | Shell tokenized; 5 custom shells migrated | `ShareModal` custom overlay; unmigrated domain modals | Medium |
| **Confirmations** | 25/68-ish general sites done | 43 specialized sites; drag-to-trash without modal | High (Drive) |
| **Loading states** | Spinner, overlay, skeleton canonical | Skeleton **unused** in `web/`; inconsistent module loading | Medium |
| **Empty states** | Shared `EmptyState` canonical | Local duplicates (notifications, widgets) | Low–Medium |
| **Toasts** | `Toast` + `react-hot-toast` dual stack | No platform policy enforcement | Medium |
| **Forms / validation** | `Input` tokenized | `Textarea`, `Checkbox`, `Switch`, `Radio` not tokenized | Medium |
| **Tables** | `Table.tsx` exists | Not tokenized; no audit | Low |
| **Search** | Multiple app implementations | No canonical `SearchBox` | Medium |
| **Drawers** | `Drawer`, `BottomSheet`, app drawers | No standard; Calendar `EventDrawer` heavy | Medium |
| **Context menus / popovers** | Shared primitives exist | Not tokenized; minimal Popover a11y | **Very high** |
| **Layout shells** | Patterns documented | No extracted shell components; per-module drift | High |
| **Accessibility** | Standards documented | No program-wide audit or CI gates | High |
| **Dark mode** | Token aliases in `.dark` | Module inventory: partial on most modules | Medium |

---

## 4. Not yet audited

No filled [`UX_AUDIT_TEMPLATE.md`](./UX_AUDIT_TEMPLATE.md) or scorecard for any product module.

| Area | Audit status | Notes |
|------|--------------|-------|
| **Layout — page / dashboard / module / responsive** | **Not audited** | Archetypes in `LAYOUT_PATTERNS.md` only |
| **Product UX — Drive** | **Not UX-certified** | Architecture L3 reference; UX-L3 TBD |
| **Product UX — Dashboard** | **Not audited** | High widget token debt |
| **Product UX — AI** | **Not audited** | Chat page + dropdown partially ConfirmModal |
| **Product UX — Calendar** | **Not audited** | 6 binary-choice confirms blocked |
| **Product UX — Chat** | **Not audited** | — |
| **Product UX — Business Workspace** | **Not audited** | Hub landings vary by module |
| **Product UX — Place / Admin / Analytics / Settings** | **Not audited** | Inventory checklist empty |
| **Keyboard / focus / contrast / reduced motion** | **Not audited** | Standards only; Modal/ConfirmModal partial |
| **Notifications (in-app)** | **Not audited** | Page migrated; metadata patterns separate |
| **DnD / activity / permissions UI** | **Not audited** | Drive-heavy patterns undocumented at UX cert level |

**Wave 0 inventory appendix** in roadmap remains **Pending**.

---

## 5. Domain review matrix

### 5.1 Design

| Family | Maturity | Evidence |
|--------|----------|----------|
| Tokens (colors, type, spacing, radius, shadow) | **Partial** | `DESIGN_TOKENS.md` + `tokens.css`; legacy `globals.css` / `brand.*` coexist |
| Skeleton tokens | **Certified** | Family 6; `.v-skeleton` |
| Module adoption | **Low** | Most module UI still Tailwind literals |

### 5.2 Layout

| Surface | Maturity | Evidence |
|---------|----------|----------|
| Dashboard shell | **Partial** | `DashboardLayout`; widget grid ad hoc |
| Workspace shell | **Partial** | `BusinessWorkspaceContent` switch; no shared WorkspaceShell |
| Management shell | **Partial** | Admin/settings vary |
| Detail shell | **Partial** | Drive preview, EventDrawer, thread detail — inconsistent |
| Responsive | **Not audited** | Documented expectations only |

### 5.3 Components

| Primitive | Maturity | Wave 2 tier |
|-----------|----------|-------------|
| Button, Input, Card | **Certified** | Wave 1 |
| Modal, ConfirmModal | **Certified** | 2A / 2B |
| ContextMenu | **Candidate** | **Tier 1** |
| Popover | **Candidate** | **Tier 1** |
| Switch, Tabs, Textarea, Checkbox/Radio | **Candidate** | Tier 2 |
| Toast | **Needs review** | Tier 2 + policy |
| Table, Search, Drawer | **Candidate / duplicate** | Tier 3 |
| ShareModal | **Outlier** | Custom shell — later |

### 5.4 Interaction

| Pattern | Maturity | Evidence |
|---------|----------|----------|
| Confirmations (general) | **Certified** | Batch 1 + 2 closeouts |
| Confirmations (specialized) | **Not started** | 43 sites |
| Notifications / toast | **Partial** | Dual providers |
| Loading | **Partial** | Skeleton unused |
| Empty | **Partial** | Shared + locals |
| Validation | **Not audited** | `INTERACTION_STANDARDS.md` only |

### 5.5 Accessibility

| Topic | Maturity |
|-------|----------|
| Keyboard navigation | **Standards only** |
| Focus management | **Partial** (Modal, ConfirmModal, focus trap util) |
| Color contrast | **Standards + ui-standards.mdc** |
| Reduced motion | **Documented**; not verified program-wide |

### 5.6 Product UX (snapshot)

| Product | UX value as reference | Current state |
|---------|----------------------|---------------|
| **Drive / File Hub** | **Highest** (roadmap candidate) | Soft-delete ConfirmModal done; purge + context menu + drag parity open |
| **Dashboard** | High (daily entry) | Token debt; widgets |
| **AI** | High (growth surface) | Trash confirm done; drawer/stream UX unaudited |
| **Calendar** | High (binary UX blocker) | Native confirms; no ConfirmModal path |
| **Chat** | Medium–High | Not in Batch 2 |
| **Business Workspace** | High (multi-module) | Architecture audit only; UX audit missing |

---

## 6. ConfirmModal program state (post–Wave 2)

| Metric | Value |
|--------|------:|
| Removed (Batch 1 + 2) | **25** |
| Remaining `web/` | **43** |
| Specialized deferred | **~40** (calendar, admin, HR, scheduling, etc.) |
| Optional 2C.8 branding widget | **1** |

**Ready for specialized categories?** **Yes — PLAN mode**, with category-specific design spikes (calendar binary-choice, purge copy review).

---

## 7. Wave 3 recommendations (ranked)

Ranking uses **UX value** (user impact × surface area × reference leverage) vs **implementation effort** (files, risk, design blockers).

### Recommended Wave 3A — Tier 1 components: ContextMenu + Popover

| Dimension | Assessment |
|-----------|------------|
| **UX value** | **Very high** — Drive/File Hub, Chat, Calendar, and module toolbars depend on context menus and dropdowns; reference UX candidate blocked without this |
| **Effort** | **Medium–high** — token pass + keyboard/roving tabindex + portal z-index; bounded to `shared/` + targeted consumers |
| **Scope** | Tokenize `ContextMenu.tsx` and `Popover.tsx`; document as canonical dropdown; audit Drive `FileContextMenu` alignment; a11y pass per `ACCESSIBILITY_STANDARDS.md` |
| **Out of scope** | Full ShareModal rewrite; app-wide menu migration in one PR |

**Why first:** Highest **leverage per shared primitive**; unblocks consistent interaction patterns before layout or module audits.

---

### Recommended Wave 3B — Drive interaction completion (ConfirmModal specialized entry)

| Dimension | Assessment |
|-----------|------------|
| **UX value** | **High** — completes Drive trash story (soft + permanent); data-loss safety; closes gap vs GlobalTrashBin |
| **Effort** | **Low** — **2** confirm sites (`drive/trash/page.tsx`, `GlobalTrashBin.tsx`) + optional drag-to-trash parity (behavior, not `confirm()` count) |
| **Scope** | PLAN + ACT for Batch 3A ConfirmModal purge; permanent-loss copy review; manual QA matrix for irreversible delete |
| **Dependencies** | None on 3A; can run **parallel** after PLAN approval |

**Why second:** Low effort, high trust impact; natural extension of certified Batch 2B patterns.

---

### Recommended Wave 3C — Layout shell pilot (Workspace archetype)

| Dimension | Assessment |
|-----------|------------|
| **UX value** | **High** — Business Workspace + module hub consistency; reduces per-module chrome drift |
| **Effort** | **High** — touches dashboard shell, `BusinessWorkspaceContent`, multiple module landings; mobile behavior |
| **Scope** | Extract or formalize **Workspace shell** per `LAYOUT_PATTERNS.md`; pilot on **one** module (Drive or Business hub); no feature redesign |
| **Dependencies** | Easier after 3A menus; can start PLAN in parallel |

**Why third:** Large blast radius; best pursued after interaction primitives stabilize. Original roadmap Wave 3 — still valid, but **after** Tier 1 components and Drive trust paths.

---

### Alternatives considered (not recommended as Wave 3 primary)

| Option | Why deferred |
|--------|----------------|
| **Calendar binary-choice (ConfirmModal 3B)** | Blocked on UX/API spike; inverted OK/Cancel semantics |
| **Admin / governance confirms** | High risk; low daily user volume |
| **Toast unification** | Medium value; can ship as 3B parallel hygiene |
| **Module UX audits (Wave 4)** | Valuable but needs shells + primitives first for consistent scoring |
| **Full token pass on all shared components** | Broad; Tier 1 menus give clearer ROI |

---

## 8. Wave 3 summary table

| Wave | Focus | UX value | Effort | Rank |
|------|-------|----------|--------|------|
| **3A** | ContextMenu + Popover modernization | ★★★★★ | ★★★☆☆ | **1** |
| **3B** | Drive permanent purge + interaction parity | ★★★★☆ | ★★☆☆☆ | **2** |
| **3C** | Workspace layout shell pilot | ★★★★☆ | ★★★★☆ | **3** |

**Suggested sequencing:** **3A PLAN → 3B PLAN (ConfirmModal specialized) → 3C PLAN**; ACT waves one primitive family or one purge cluster at a time (same discipline as Batch 2).

---

## 9. Program gates before Wave 5 certification

1. Complete **Tier 1** components (3A) with closeout doc.  
2. Complete **Drive interaction** certification path (3B + drag parity advisory).  
3. Run **first module UX audit** (Drive) using `UX_AUDIT_TEMPLATE.md` — target UX-L2.  
4. Resolve **manual QA backlog** for Waves 1–2 or accept documented risk.  
5. Publish **UX certification ledger** (parallel to architecture `CERTIFICATION_LEDGER.md`).

---

## 10. Related artifacts

| Document | Role |
|----------|------|
| [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md) | Original wave sequence (update after Wave 3 PLAN approval) |
| [`COMPONENT_INVENTORY.md`](./COMPONENT_INVENTORY.md) | Tier 1–3 component backlog |
| [`CONFIRMMODAL_BATCH2_CLOSEOUT.md`](./audits/CONFIRMMODAL_BATCH2_CLOSEOUT.md) | Wave 2 interaction certification |
| [`INTERACTION_STANDARDS.md`](./INTERACTION_STANDARDS.md) | Target behaviors |
| [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md) | Shell archetypes for 3C |

---

**Last updated:** 2026-06-03
