# Personal Dashboard Wave 2B — Contract Package Closeout

**Status:** **Complete** — governance and documentation only  
**Date:** 2026-06-14  
**Wave:** Reference Workspace **2B**  
**Prior:** [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md)

> **No engineering. No certification. No registration.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Personal routing model | §1 — query-scoped module routes + grid + tab embeds |
| 2 | Widget ownership matrix | §2 — six classified widgets + utility rules |
| 3 | Cross-surface transition model | §3 — five transition families documented |
| 4 | Household/education model | §4 — shared shell/runtime; context-specific content |
| 5 | Updated WS-L2 blocker count | §5 — **4 governance closed** · **6 engineering** · **3 certification** |
| 6 | Recommended Wave 2C scope | §6 |

---

## 1. Personal routing model

**Authoritative doc:** [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](../PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)

| Route kind | Pattern | Example |
|------------|---------|---------|
| Grid hub | `/dashboard` | Bootstrap redirect |
| Grid | `/dashboard/:dashboardId` | Widget grid |
| Module (scoped) | `/{module}?dashboard=:id` | `/drive?dashboard=abc` |
| Tab embed | In-tab | Work, Place |
| Utility | Standalone | `/notifications`, `/ai-chat` |

**Invariants:** Shell owns routing; widgets are not authorities; modules own interiors; PlatformShell owns chrome.

**PD-2 disposition:** ✅ **Governance complete**

---

## 2. Widget ownership matrix

**Authoritative doc:** [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](../PERSONAL_DASHBOARD_WIDGET_CONTRACT.md)

| Widget | Authority | Escalation |
|--------|-----------|------------|
| ChatWidget | Projection | `/chat?dashboard=:id` |
| DriveWidget | Projection | `/drive?dashboard=:id` |
| CalendarWidget | Projection | `/calendar?dashboard=:id` |
| TodoWidget | Projection | `/todo?dashboard=:id` |
| AIWidget | Projection | `/ai-chat` |
| PlaceWidget | **Not implemented** | `/place` / Place tab when added |

**PD-5 disposition:** ✅ **Governance complete**

---

## 3. Cross-surface transition model

**Authoritative doc:** [CROSS_SURFACE_TRANSITIONS.md](../CROSS_SURFACE_TRANSITIONS.md)

| Family | Canonical pattern |
|--------|-------------------|
| Personal → Business | `/business/:id/workspace` (+ segment modules) |
| Business → Personal | `/dashboard` / `/dashboard/:id` |
| Personal ↔ Place | Tab embed + `/place` vs publisher segment |
| Widget → module | `/{module}?dashboard=:id` |
| Module → grid | `/dashboard/:id` |

**PD-4 disposition:** 🟡 **Governance complete** (asymmetry documented) · **Engineering required** (href builder unification)

**PD-7 disposition:** 🟡 **Governance complete** (tab embeds in transition map) · **Engineering required** (unified active resolver)

---

## 4. Household/education model

**Authoritative doc:** [PERSONAL_CONTEXT_VARIANTS.md](../PERSONAL_CONTEXT_VARIANTS.md)

| Variant | Shell | Runtime | Content maturity |
|---------|-------|---------|------------------|
| Personal | Shared | `contextType: personal` | WS-L1 target |
| Household | Shared | `householdId` bound | WS-L0 product |
| Education | Shared | `contextType: education` | WS-L0 product |

**PD-8 disposition:** ✅ **Governance complete**

---

## 5. WS-L2 remaining blockers

### PD blocker disposition (2A → 2B)

| ID | Priority | 2A status | 2B disposition | Class |
|----|----------|-----------|----------------|-------|
| PD-1 | P1 | Open | Contract defines SSOT **target**; code still fragmented | **Engineering required** (2C) |
| PD-2 | P1 | Open | ✅ Routing contract published | **Governance complete** |
| PD-3 | P1 | Open | Contract defines test **requirements** | **Engineering required** (2C) |
| PD-4 | P1 | Open | Cross-surface map documents asymmetry | **Governance complete** + **Engineering required** |
| PD-5 | P2 | Open | ✅ Widget contract published | **Governance complete** |
| PD-6 | P2 | Open | Documented exception in routing §9 | **Engineering required** (2C) |
| PD-7 | P2 | Open | Tab embeds in cross-surface map | **Governance complete** + **Engineering required** |
| PD-8 | P2 | Open | ✅ Context variants annex | **Governance complete** |
| PD-9 | P2 | Open | Documented in context variants §3 | **Engineering required** (2C) |
| PD-10 | P2 | Open | AI canonical entry in routing + widget contracts | **Governance complete** + **Engineering required** (rail alignment) |

### Summary counts

| Class | Count | Items |
|-------|-------|-------|
| **Governance complete** | **7** | PD-2, PD-5, PD-8, PD-4 (doc), PD-7 (doc), PD-10 (doc), PD-1 (spec) |
| **Engineering required** | **6** | PD-1, PD-3, PD-4 (code), PD-6, PD-9, PD-10 (code) |
| **Certification required** | **3** | Personal WS-L1 review · Combined WS-L2 assessment · `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` draft |

**Open P1 for registration:** **2** (PD-1 implementation, PD-3 tests) — PD-2 and PD-4 governance closed.

### WS-L2 readiness assessment

| Criterion | Status |
|-----------|--------|
| Personal routing contract | ✅ |
| Widget boundary contract | ✅ |
| Cross-surface map | ✅ |
| Context variants annex | ✅ |
| Personal navigation code + tests | ⏳ 2C |
| Business 1D orphan hygiene | ⏳ Parallel |
| Personal WS-L1 certification | ⏳ Post-2C |
| Registration doc | ⏳ WS-L3 prep |

**Verdict:** **WS-L2 governance package complete** — platform **not** WS-L2 certified. Eligible for **2C engineering** and subsequent **WS-L2 assessment**.

---

## 6. Recommended Wave 2C engineering scope

| # | Task | Closes |
|---|------|--------|
| 2C-1 | `personalDashboardContracts.ts` + `personalDashboardNavigation.ts` | PD-1 |
| 2C-2 | `personalDashboardNavigation.test.ts` + registry drift test | PD-3 |
| 2C-3 | `buildCrossSurfaceModuleHref` helper | PD-4 (code) |
| 2C-4 | Normalize `chat/layout.tsx` to always use `DashboardLayout` | PD-6 |
| 2C-5 | Remove / registry-align `PERSONAL_DEFAULT_MODULES` fallback | PD-9 |
| 2C-6 | Align AI right-rail + widget to routing contract | PD-10 (code) |
| 2C-7 | `resolvePersonalDashboardModule` + tab active state | PD-7 (code) |
| 2C-8 | Personal WS-L1 certification review (governance) | Certification |

**Parallel:** Business Workspace **1D** orphan segment page deletion.

---

## 7. Deliverables

| File | Action |
|------|--------|
| [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](../PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | **Create** |
| [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](../PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) | **Create** |
| [CROSS_SURFACE_TRANSITIONS.md](../CROSS_SURFACE_TRANSITIONS.md) | **Create** |
| [PERSONAL_CONTEXT_VARIANTS.md](../PERSONAL_CONTEXT_VARIANTS.md) | **Create** |
| [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md) | **Update** |
| [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) | **Update** |
| [UX_MODERNIZATION_ROADMAP.md](../../ux/UX_MODERNIZATION_ROADMAP.md) | **Update** |
| `memory-bank/activeContext.md` | **Update** |
| `memory-bank/progress.md` | **Update** |

---

*Last updated: 2026-06-14*
