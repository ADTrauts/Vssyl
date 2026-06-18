# Admin Portal UX Audit

**Program:** Admin Portal Reality, Architecture, and Certification Readiness  
**Date:** 2026-06-16  
**Constraint:** Discovery only — **no UX certification awarded**

**Authority:** [`UX_CONSTITUTION.md`](../../ux/UX_CONSTITUTION.md), [`UX_REFERENCE_PATTERN_CATALOG.md`](../../ux/UX_REFERENCE_PATTERN_CATALOG.md)  
**Target pattern (future):** UX-PAT-WS-010 Management page shell (Notifications #2 primary owner)

**Reference modules (comparison only):** File Hub, Chat, Calendar, HR, Scheduling, Workforce Communications — not re-certified.

---

## Executive summary

Admin Portal uses a **custom dark admin shell** that is an intentional **PlatformShell exception** for operator isolation. UX consistency is **heterogeneous**: AI Pipeline sub-area is the most aligned (sub-shell, back links, structured hub); other pages use ad-hoc headers, `gray-*` tokens, and inline empty states. Admin Portal was **excluded** from PlatformShell and ConfirmModal modernization waves.

**Overall UX posture:** **Below UX Reference baseline** — functional but not pattern-certified.

---

## UX scorecard

| Category | Status | Evidence | Finding |
|----------|--------|----------|---------|
| Shell | **PASS WITH FINDINGS** | Custom `layout.tsx` dark sidebar + gray-900 header | Not PlatformShell; intentional operator chrome | AP-F-020 |
| Navigation | **FAIL** | Inline nav in layout (19 items, 6 sections); `AdminNavigation.tsx` unused | Duplicate nav definition; orphan pages hub-only | AP-F-021 |
| Admin IA | **PASS WITH FINDINGS** | 6 logical sections | AI sub-routes, debug pages not in nav; governance/retention orphaned | AP-F-022 |
| Page consistency | **FAIL** | AI Pipeline uses `PipelineSubpageShell`; other pages custom `<h1>` | No shared `PageHeader` / `PageToolbar` | AP-F-023 |
| Dashboard consistency | **FAIL** | Heterogeneous cards across dashboard, analytics, BI, ai-system | No unified stat card pattern beyond `AdminStatCard` in places | AP-F-024 |
| Empty/loading/error states | **PASS WITH FINDINGS** | `Spinner`, loading booleans common; inline empty divs | No shared `EmptyState` component | AP-F-025 |
| Modal usage | **FAIL** | Custom confirm modal in impersonate; `window.confirm` in seed-modules | No shared `ConfirmModal` | AP-F-026 |
| Token usage | **FAIL** | Widespread `gray-*`, `blue-*`; not `v-*` design tokens | UX Constitution token violation | AP-F-027 |
| Mobile behavior | **UNKNOWN** | Sidebar collapse exists | 375px behavior not tested in this audit |
| Accessibility | **UNKNOWN** | `PipelineSubpageShell` has `aria-label` on back link | Broader a11y not assessed |
| Debug/test page leakage | **FAIL** | 7 debug routes in prod tree; testing in sidebar nav | Dev surfaces reachable by URL | AP-F-028 |

---

## Shell analysis

### Active shell (`web/src/app/admin-portal/layout.tsx`)

| Attribute | Implementation | UX Constitution alignment |
|-----------|----------------|----------------------------|
| Layout pattern | Custom full-height sidebar + header | Not LAYOUT_PATTERNS management shell |
| Auth gate | Client-side `session.user.role !== 'ADMIN'` | Pass |
| Impersonation | `ImpersonationProvider` + `ImpersonationBanner` | Pass — clear operator context |
| Dark mode | `dark:` classes throughout | Pass WITH FINDINGS — gray palette not tokens |
| Section collapse | Chevron toggle per nav section | Pass — good IA affordance |

### Unused extracts

| File | Issue |
|------|-------|
| `AdminNavigation.tsx` | Duplicate nav; missing AI Pipeline item; has extra test-impersonation link; **zero imports** |
| `AdminHeader.tsx` | Extracted header never wired |

---

## Navigation and information architecture

### Sidebar structure (19 items)

| Section | Items |
|---------|-------|
| Operations | Overview, Users, Moderation, Support |
| Commercial | Financial Management, Pricing |
| AI | AI System, AI Pipeline, Business Intelligence |
| Platform | Platform Analytics, Performance, Security, System Logs, System Administration |
| Developer & Modules | Developer Management, Modules |
| Admin Labs | Admin Overrides, Testing & Debug, Impersonation Lab |

### Orphan surfaces (not in sidebar)

| Page | Discovery path | Risk |
|------|----------------|------|
| ai-context, ai-learning, business-ai | AI System hub cards | Acceptable hub pattern |
| 7 debug/test pages | Direct URL, testing page links | **Leakage risk** |
| seed-modules | Direct URL | Ops tool |

### Dead routes

| Page | Status |
|------|--------|
| `/admin/governance` | Component implemented; layout redirect blocks access |
| `/admin/retention` | Component implemented; layout redirect blocks access |

**Recommendation (planning):** Relocate governance/retention to `/admin-portal/*` or retire.

---

## Page-level UX patterns

### Best-aligned: AI Pipeline

| Pattern | File | Notes |
|---------|------|-------|
| Sub-page shell | `PipelineSubpageShell.tsx` | Back link, title, consistent padding |
| Operations hub | `PipelineOperationsHub.tsx` | Health cards, activity, tool grid |
| Tool sections | `PipelineHubToolSections.tsx` | Clear deep-link IA |

This is the **closest match** to UX-PAT-WS-010 and should be the template for shell modernization (phase 1A).

### Weakest-aligned pages

| Page | Issues |
|------|--------|
| support | 1,125 LOC; mock fallback shows fake tickets on error |
| modules | 2,243 LOC; mock fallback; dense tabs |
| impersonate | 1,324 LOC; custom modal not ConfirmModal |
| ai-learning | "Data coming soon" placeholder stat cards |

---

## State handling

| State type | Pattern | Consistency |
|------------|---------|-------------|
| Loading | `Spinner`, `loading` boolean | Common but inconsistent placement |
| Error | `Alert`, `setError` messages | Good on most pages |
| Empty | Inline `<div>` text | No `EmptyState` icon+title+action pattern |
| Mock on error | support, modules | **Anti-pattern** — shows misleading data | AP-F-006 |

---

## Destructive workflows

| Action | Confirm pattern | Status |
|--------|-----------------|--------|
| User ban/suspend | Page-level UI | **UNKNOWN** runtime |
| Migration delete | API exists | **UNKNOWN** UI confirm |
| Policy purge (AI Pipeline) | Pipeline UI | **UNKNOWN** |
| seed-modules | `window.confirm` | **FAIL** | AP-F-026 |
| Impersonation start | Custom modal | Partial — not shared ConfirmModal |

---

## Comparison to reference module UX

| Dimension | Notifications (UX #2) | Admin Portal |
|-----------|----------------------|--------------|
| Management shell | UX-PAT-WS-010 | Custom only |
| Design tokens | `v-*` tokens | `gray-*` legacy |
| ConfirmModal | Standardized | Custom / window.confirm |
| EmptyState | Standardized | Inline divs |
| Hub landing | Workspace landing | Dashboard only |
| Mobile | Assessed in UX program | **UNKNOWN** |

---

## PlatformShell exception context

Per `PLATFORMSHELL_STANDARDIZATION_PLAN.md` and Reference Workspace registration, Admin Portal is a **certified exception** — isolated dark chrome for operators, not a product workspace surface. This audit does **not** require PlatformShell adoption for operator isolation, but **does** require management-page pattern consistency within the admin shell.

---

## Cross-reference

- Surface inventory: [`ADMIN_PORTAL_SURFACE_INVENTORY.md`](./ADMIN_PORTAL_SURFACE_INVENTORY.md)
- Findings: [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)
- Remediation phase 1A: [`ADMIN_PORTAL_REMEDIATION_ROADMAP.md`](./ADMIN_PORTAL_REMEDIATION_ROADMAP.md)

**UX audit close:** Evaluated against UX Constitution and Reference patterns. No UX certification awarded.
