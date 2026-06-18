# Business Administration UX Audit

**Program:** Business Administration Phase 0B — UX Planning  
**Date:** 2026-06-18  
**Framework:** [UX_CONSTITUTION.md](../ux/UX_CONSTITUTION.md), [UX_CERTIFICATION_SCORECARD.md](../ux/UX_CERTIFICATION_SCORECARD.md)  
**Reference:** [ADMIN_PORTAL_UX_SHELL_AUDIT.md](../architecture/audits/ADMIN_PORTAL_UX_SHELL_AUDIT.md) (post-1A bar)  
**Closes planning for:** BA-F-007, BA-F-013, BA-F-014

---

## 1. Scope

Business Administration configuration surfaces:

| Surface | Path / component |
|---------|------------------|
| Org chart | `org-chart/page.tsx`, `OrgChartBuilder`, `EmployeeManager`, `PermissionManager`, `OrgChartVisualView` |
| Branding | `branding/page.tsx`, `GlobalBrandingEditor` |
| Front page | `BusinessFrontPage`, `FrontPageLayoutDesigner`, `FrontPageThemeCustomizer`, `FrontPageWidgetEditor` |
| Settings hub | `workspace/settings/page.tsx`, `WebhookSubscriptionsShell` |
| Modules | `modules/page.tsx`, `workspace/modules/page.tsx` |
| Business AI | `BusinessAIControlCenter`, `workspace/ai` |
| Cross-domain widgets | `SchedulingConfiguration`, `StationsAndPositionsEditor` (BO overlap) |
| Context | `BusinessConfigurationContext.tsx` |

**Out of scope:** Module workspace interiors (HR, scheduling employee views) — BO UX program.

---

## 2. Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Meets UX Constitution |
| **PASS WITH FINDINGS** | Meets with documented exceptions |
| **FAIL** | Material violation |
| **UNKNOWN** | Requires manual QA |

---

## 3. Native confirm() / prompt() inventory

| # | File | Line pattern | Action | Severity |
|---|------|--------------|--------|----------|
| 1 | `org-chart/EmployeeManager.tsx` | `confirm` | Remove employee from position | **FAIL** |
| 2 | `org-chart/PermissionManager.tsx` | `confirm` | Delete permission set | **FAIL** |
| 3 | `org-chart/PermissionManager.tsx` | `prompt` | Copy permission set name | **FAIL** |
| 4 | `business/GlobalBrandingEditor.tsx` | `confirm` ×2 | Apply preset, reset | **FAIL** |
| 5 | `business/FrontPageThemeCustomizer.tsx` | `confirm` ×2 | Apply preset, reset | **FAIL** |
| 6 | `business/StationsAndPositionsEditor.tsx` | `confirm` ×2 | Delete station, position | **FAIL** (BO overlap) |
| 7 | `app/business/[id]/branding/page.tsx` | `confirm` | Delete widget | **FAIL** |
| 8 | `app/business/[id]/modules/page.tsx` | `confirm` | Uninstall module | **FAIL** |

**Partial compliance:** `OrgChartBuilder.tsx` imports `ConfirmModal` for one flow — inconsistent adoption.

**Count:** **8 files**, **11+ native dialog sites** (Admin Portal pre-1A had similar density).

**Admin Portal post-1A bar:** Zero native confirm — **BA fails UX-L1 blocker**.

---

## 4. Token drift inventory

| Component area | `gray-*` / `blue-*` approx. | v-* usage | Status |
|----------------|----------------------------|-----------|--------|
| `business/*` (18 files) | **~500** | Partial in newer widgets | **FAIL** |
| `org-chart/*` (5 files) | **~253** | Minimal | **FAIL** |
| `BusinessAIControlCenter.tsx` | **121** | Low | **FAIL** |
| `StationsAndPositionsEditor.tsx` | **93** | Low | **FAIL** |
| `SchedulingConfiguration.tsx` | **73** | Low | **FAIL** |

**Headline:** Widespread legacy Tailwind grays/blues — same class of debt Admin Portal 1A remediated.

---

## 5. EmptyState inventory

| Surface | EmptyState usage | Pattern today | Status |
|---------|------------------|---------------|--------|
| Org chart lists | `ConfirmModal` only | Hand-built empty paragraphs | **FAIL** |
| Permission manager | None | Inline "No permission sets" text | **FAIL** |
| Webhook subscriptions | None | Custom empty div | **FAIL** |
| Module list | None | Custom | **FAIL** |
| Front page widgets | None | Custom | **FAIL** |
| Business AI center | None | "No data" strings | **FAIL** |

**Admin Portal precedent:** `AdminPortalEmptyState` → shared `EmptyState` on 9+ surfaces.

**BA target:** `BusinessAdminEmptyState` wrapper (thin alias to shared `EmptyState`) — BA-1E.

---

## 6. Modal inconsistency

| Pattern | Where | Issue |
|---------|-------|-------|
| Native `confirm`/`prompt` | 8 files | UX-L1 violation |
| `ConfirmModal` (shared) | `OrgChartBuilder` only | Inconsistent |
| Custom modals | `CreateOrgChartModal`, onboarding-style modals | Acceptable if token-compliant |
| `Modal` + forms | Partial | No shared destructive confirm helper |

**Target:** `useConfirm` hook pattern from Admin Portal 1A — centralize destructive flows.

---

## 7. Settings hub coherence

`workspace/settings/page.tsx` aggregates:

| Tab | Backend | Owner |
|-----|---------|-------|
| Profile | `/api/business` | BA |
| Branding | `/api/business` | BA |
| Security | SSO partial | BA |
| Billing | Stripe/business billing | Platform commercial |
| Notifications | User prefs | Platform |
| Scheduling | `/api/business` + scheduling | BA + BO |

**Finding:** Single settings shell with **heterogeneous backends** — acceptable if tabs clearly labeled and errors isolated per tab. **FAIL risk** on error handling when one tab API fails silently.

**Remediation (BA-1E):** Per-tab error boundaries + loading skeletons; no unified mock fallback.

---

## 8. Mobile readiness

| Surface | Assessment |
|---------|------------|
| Org chart builder | **UNKNOWN** — dense canvas; desktop-first |
| Permission manager | **UNKNOWN** — wide tables |
| Settings tabs | **PASS WITH FINDINGS** — responsive flex |
| Branding editor | **UNKNOWN** |

**Not blocking L3 WITH FINDINGS** — document UNKNOWN for certification.

---

## 9. 11-category scorecard (adapted)

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 1 | Information architecture | PASS WITH FINDINGS | Settings hub coherent; `/admin/**` legacy split (BA-F-010) |
| 2 | Visual hierarchy / tokens | **FAIL** | Token drift |
| 3 | Layout consistency | PASS WITH FINDINGS | Business workspace shell OK |
| 4 | Navigation | PASS WITH FINDINGS | Org-chart entry clear |
| 5 | Workflow clarity | PASS WITH FINDINGS | Config flows work |
| 6 | Loading states | PASS WITH FINDINGS | `BusinessConfigurationContext` loading; uneven per component |
| 7 | Error handling | PASS WITH FINDINGS | API throws; tab isolation weak |
| 8 | Accessibility | UNKNOWN | No automated audit |
| 9 | Mobile | UNKNOWN | Desktop-first org chart |
| 10 | Enterprise density | PASS | Appropriate for admin |
| 11 | Reference UX compliance | **FAIL** | Native confirm/prompt; no EmptyState |

**Provisional G9 score:** **1/3** (matches Phase 0A).

---

## 10. Remediation matrix (BA-1E)

| ID | Finding | File(s) | Remediation | Effort |
|----|---------|---------|-------------|--------|
| UX-R-001 | Native confirm | EmployeeManager, PermissionManager, branding, theme, stations, modules page | `useConfirm` + `ConfirmModal` | M |
| UX-R-002 | Native prompt | PermissionManager copy flow | `Modal` + `Input` + confirm button | S |
| UX-R-003 | EmptyState | PermissionManager, Webhooks, modules, AI center | `BusinessAdminEmptyState` | M |
| UX-R-004 | Token drift wave 1 | org-chart components (5 files) | Replace `gray-*` → `v-*` | L |
| UX-R-005 | Token drift wave 2 | business config (8 files, exclude widgets) | v-* migration | L |
| UX-R-006 | Settings tab errors | `workspace/settings/page.tsx` | Per-tab error state | S |
| UX-R-007 | Stations editor ownership | `StationsAndPositionsEditor` | Defer to BO or move file — IA only | S |

**Effort:** S = small, M = medium, L = large.

---

## 11. Post-1E projected G9

| Dimension | Projected |
|-----------|-----------|
| Native confirm | **PASS** (0 sites) |
| EmptyState | **PASS** (6+ surfaces) |
| Tokens | **PASS WITH FINDINGS** (residual badge colors) |
| **G9 score** | **3/3** |

---

## Related documents

- [BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md](./BUSINESS_ADMINISTRATION_CERTIFICATION_FRAMEWORK.md)
- [BUSINESS_ADMINISTRATION_MODERNIZATION_ROADMAP.md](./BUSINESS_ADMINISTRATION_MODERNIZATION_ROADMAP.md)
