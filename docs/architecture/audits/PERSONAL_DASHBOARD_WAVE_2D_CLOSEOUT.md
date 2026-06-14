# Personal Dashboard Wave 2D — Registry Drift Enforcement Closeout

**Status:** **Complete** — implementation + governance  
**Date:** 2026-06-03  
**Wave:** Reference Workspace **2D**  
**Prior:** [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md)  
**Closes:** WS-L2 blocker **L2-B2** · WS-L1 finding **P-F1**

> **No certification. No registration. No Business Workspace changes.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Drift coverage inventory | §1 |
| 2 | Contract coverage inventory | §2 |
| 3 | CI enforcement status | §3 |
| 4 | Certified exceptions | §4 |
| 5 | Remaining Personal Dashboard blockers | §5 |
| 6 | Updated WS-L2 blocker count | §6 |
| 7 | WS-L2 readiness reassessment | §7 |

---

## 1. Drift coverage inventory

**File:** `web/src/lib/__tests__/personalDashboardRegistryDrift.test.ts` (**15 tests**)

Mirrors `businessWorkspaceRegistryDrift.test.ts` pattern — filesystem reads for consumer wiring; no runtime browser.

| Suite | Tests | Validates |
|-------|-------|-----------|
| Dashboard route contracts | 5 | `buildPersonalModuleHref` for all `personalModuleRouteIds()`; unique hrefs; unique `pathSegment`; alias normalization (`notes`→`notebook`, `connections`→`members`); `PERSONAL_DEFAULT_MODULE_PERMISSIONS` ⊆ contracts |
| Widget contract coverage | 2 | Contract `widgetType` ∈ `WIDGET_REGISTRY`; registry `moduleId` maps to personal contract (with certified utility/business exceptions) |
| Widget renderer coverage | 2 | `WidgetContentRenderer` switch cases cover all `WIDGET_REGISTRY` keys; `isRegisteredWidgetType` guard present |
| Navigation contract coverage | 2 | `DashboardContext` uses `buildPersonalModuleHref`, `buildPersonalDashboardSwitchHref`, `resolvePersonalDashboardModule`, `buildMembersNavigationHref`; `DashboardLayoutInner` uses resolver + cross-surface helpers |
| Dashboard type coverage | 2 | `PERSONAL_DASHBOARD_TYPES` accepted by `normalizePersonalDashboardType`; unknown defaults to `personal` |
| Escalation route coverage | 2 | `buildWidgetEscalationHref` for all registry types; contracted widgets match `buildPersonalModuleHref` |

**Result:** **15 PASS** (run with `pnpm --filter vssyl-web test`)

---

## 2. Contract coverage inventory

Audit alignment between contracts, navigation, and shell consumers (2026-06-03).

| Artifact | Role | Drift alignment |
|----------|------|-----------------|
| `personalDashboardContracts.ts` | Route contracts, dashboard types, default permissions | SSOT — drift tests read directly |
| `personalDashboardNavigation.ts` | Href builders, escalation, active module resolver | Covered by navigation + escalation suites |
| `DashboardContext.tsx` | `navigateToModule`, `navigateToDashboard`, `getCurrentModule` | ✅ Uses personal navigation helpers (drift test) |
| `DashboardLayoutInner.tsx` | Active module, AI rail, work-tab switch | ✅ Uses `resolvePersonalDashboardModule`, `buildPersonalAIQuickHref`, `buildPersonalToBusinessHref` |
| `DashboardClient.tsx` → `WidgetContentRenderer` | Registry guard + type→component map | ✅ All registry types have switch cases; `isRegisteredWidgetType` before render |

### Contract ↔ registry mapping (module-route widgets)

| `moduleId` | `widgetType` | `WIDGET_REGISTRY` | Renderer |
|------------|--------------|-------------------|----------|
| `drive` | `drive` | ✅ | ✅ |
| `chat` | `chat` | ✅ | ✅ |
| `calendar` | `calendar` | ✅ | ✅ |
| `todo` | `todo` | ✅ | ✅ |
| `notebook` | `notebook` | ✅ | ✅ (`notes` alias) |
| `notifications` | `notifications` | ✅ | ✅ |
| `ai` | `ai` | ✅ | ✅ |
| `vlink` | — | N/A (module-route only) | N/A — certified exception |

### Navigation test coverage (unchanged from 2C)

| Suite | Tests | Status |
|-------|-------|--------|
| `personalDashboardNavigation.test.ts` | 15 | **PASS** |
| `crossSurfaceNavigation.test.ts` | 6 | **PASS** |

**Total personal workspace contract tests:** **36 PASS** (15 navigation + 6 cross-surface + 15 drift)

---

## 3. CI enforcement status

| Pipeline | Command | Includes personal drift tests? |
|----------|---------|-------------------------------|
| **GitHub CI** (`.github/workflows/ci.yml`) | `pnpm --filter vssyl-web test` | ✅ **Yes** — runs all web vitest suites including `personalDashboardRegistryDrift.test.ts` |
| **Root `verify:ci`** (`package.json`) | `pnpm type-check && pnpm run build:web && pnpm test` | ❌ **No** — `pnpm test` maps to `test:server` only; web vitest not invoked |
| **Web package** | `pnpm --filter vssyl-web test` | ✅ **Yes** |

### Coverage determination

| Surface | Drift suite in GitHub CI | Drift suite in `verify:ci` |
|---------|---------------------------|----------------------------|
| Business | ✅ (`businessWorkspaceRegistryDrift.test.ts`) | ❌ |
| Personal | ✅ (`personalDashboardRegistryDrift.test.ts`) | ❌ |

**Recommendation (governance only — not implemented in 2D):** Extend root `verify:ci` to include `pnpm --filter vssyl-web test` for local/CI parity with GitHub workflow. Business and personal drift suites are enforced on **PR/push to main** via GitHub Actions.

---

## 4. Certified exceptions

Documented deviations allowed without drift failure:

| ID | Exception | Rationale |
|----|-----------|-----------|
| **CE-1** | `vlink` module-route contract **without** `widgetType` | Module has personal route; no grid projection today |
| **CE-2** | Utility widgets (`quickstats`, `quicknotes`, `bookmarks`, `activityfeed`) in `WIDGET_REGISTRY` **without** personal module-route contracts | Utility projections — escalation in-widget or utility routes only (widget contract §7) |
| **CE-3** | `hr`, `scheduling` registry entries with `contexts: ['business']` | Business-type dashboard widgets only; full routes remain business workspace |
| **CE-4** | `WidgetContentRenderer` component map separate from `WIDGET_REGISTRY` metadata | Certified in widget contract §8 — shell owns type→component mapping |
| **CE-5** | `notes` widget type alias normalized to `notebook` in renderer | Legacy alias; drift test accepts `case 'notes'` for `notebook` registry key |
| **CE-6** | Widget interior escalation still uses ad-hoc URLs in some widget components | Out of 2D scope — shell API (`buildWidgetEscalationHref`) ready; module interior deferred (P-F2) |
| **CE-7** | Residual ad-hoc hrefs in `DashboardClient` bootstrap paths | P-F3 — bootstrap/create flows not migrated to navigation helpers in 2D |

---

## 5. Remaining Personal Dashboard blockers

### WS-L2 blockers (Personal surface)

| ID | Blocker | Status after 2D |
|----|---------|-----------------|
| ~~P-B1~~ / **L2-B2** | Registry drift CI suite missing | ✅ **Closed** — `personalDashboardRegistryDrift.test.ts` |
| **P-B2** / **L2-B3** | Cross-surface transition QA not executed | ⏳ **Open** |

### Non-blocking findings (unchanged)

| ID | Finding | Severity |
|----|---------|----------|
| P-F2 | Widget interior escalation ad-hoc URLs | Low |
| P-F3 | Bootstrap ad-hoc hrefs in `DashboardClient` | Low |
| P-F4 | Tab embed (Work/Place) not URL-addressable | Low |
| P-F5 | Education context product WS-L0 | Medium (registration narrative) |

**Personal orchestration engineering blockers:** **0** (drift parity achieved with business).

---

## 6. Updated WS-L2 blocker count

| ID | Blocker | Pre-2D | Post-2D |
|----|---------|--------|---------|
| L2-B1 | Business orphan segment pages | ✅ Closed (1D) | ✅ Closed |
| **L2-B2** | Personal registry drift suite | ⏳ Open | ✅ **Closed (2D)** |
| L2-B3 | Cross-surface transition QA | ⏳ Open | ⏳ Open |
| L2-B4 | Operation matrix re-audit | ⏳ Open | ⏳ Open |

**WS-L2 blocker count:** **4** → **3** (1 P1 closed · 2 P2 remain)

---

## 7. WS-L2 readiness reassessment

### Dimension update (Personal D-6 drift prevention)

| Dimension | Business (post-1D) | Personal (pre-2D) | Personal (post-2D) |
|-----------|-------------------|-------------------|-------------------|
| D-6 Drift prevention | **94%** | **70%** | **94%** |

### Weighted readiness (recalculated)

| Surface | Pre-2D | Post-2D | Delta |
|---------|--------|---------|-------|
| Business Workspace | **88%** | **88%** | — |
| Personal Dashboard | **79%** | **86%** | **+7%** |
| **Combined co-surface** | **78%** | **85%** | **+7%** |

### WS-L2 certification eligibility

| Criterion | Status |
|-----------|--------|
| Combined readiness ≥ **85%** | ✅ **Met** (85%) |
| L2-B1 closed | ✅ |
| L2-B2 closed | ✅ |
| L2-B3 cross-surface QA documented | ⏳ |
| L2-B4 operation matrix re-audit | ⏳ |

**Verdict:** Personal Dashboard achieves **drift parity** with Business Workspace. Combined program reaches **85% WS-L2 readiness** — sufficient to **schedule WS-L2 certification review** after L2-B3 + L2-B4 governance waves. **No WS-L2 certification issued in Wave 2D.**

---

## Deliverables

| File | Action |
|------|--------|
| `web/src/lib/__tests__/personalDashboardRegistryDrift.test.ts` | Create (15 tests) |
| [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](../PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | Drift enforcement §12 |
| [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](../PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) | Drift enforcement §10 |
| [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md) | Wave 2D status |
| [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) | Post-2D update |
| [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) | Personal drift CI row |

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `personalDashboardNavigation.test.ts` | **15 PASS** |
| `personalDashboardRegistryDrift.test.ts` | **15 PASS** |

---

*Last updated: 2026-06-03 (Personal Dashboard Wave 2D)*
