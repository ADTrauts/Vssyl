# Personal Dashboard Operation Matrix

**Surface id:** `personal-dashboard` (platform shell / dashboard archetype)  
**Status:** Wave 2F re-audit (2026-06-14) — **aligned with WS-L2 prep**  
**Related:** [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./audits/PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md) · [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) · [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — correct owner and layer |
| **P** | Partial — works; deferred interior, legacy path, or incomplete enforcement |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Owner:** `PD` = Personal Dashboard shell · `Dash` = Dashboard platform · `Mod` = product module · `Plat` = platform-global · `XWS` = cross-surface helper

---

## Master operation matrix

| Operation | Owner | Service / artifact | PE | Activity | RT | Trash | Notes | Status |
| --------- | ----- | ------------------ | -- | -------- | -- | ----- | ----- | ------ |
| **Open personal grid** | PD + Dash | `DashboardClient` | — | — | P | — | `/dashboard/:id` | **C** |
| **Dashboard hub bootstrap** | PD | `DashboardContext` + client redirect | — | — | — | — | `/dashboard` → active id | **C** |
| **Resolve active module** | PD | `resolvePersonalDashboardModule` | — | — | — | — | 2C SSOT | **C** |
| **Build module href** | PD | `buildPersonalModuleHref` | — | — | — | — | `?dashboard=` scope | **C** |
| **Build widget escalation href** | PD | `buildWidgetEscalationHref` | — | — | — | — | Registry-driven | **C** |
| **Widget registry guard** | Dash | `isRegisteredWidgetType` in renderer | — | — | — | — | 2C/2D drift | **C** |
| **Widget type → component map** | Dash | `WidgetContentRenderer` switch | — | — | — | — | Certified exception CE-4 | **C** |
| **Widget interior escalation** | Mod | Widget components | — | — | — | — | Ad-hoc URLs in some widgets | **P** (P-F2) |
| **Dashboard tab switch** | PD | `buildPersonalDashboardSwitchHref` | — | — | — | — | Preserves module | **C** |
| **Navigate to module** | PD | `DashboardContext.navigateToModule` | — | — | — | — | Wired 2C | **C** |
| **Mount Drive (personal)** | Mod | `DrivePageContent` via `/drive` layout | C | C | C | C | Shell wraps only | **C** |
| **Mount Chat (personal)** | Mod | Chat pages via `chat/layout.tsx` | C | C | C | — | Layout always wraps 2C | **C** |
| **Mount Calendar / Todo / Notebook** | Mod | Module routes + layouts | C | C | — | C | Query-scoped | **C** |
| **Mount Place (consumer)** | Mod | `/place` + `PlaceContent` tab | C | C | P | C | Tab-embed + route | **C** |
| **Mount V_Link** | Plat | `/vlink` module route | P | — | — | — | No grid widget (CE-1) | **P** |
| **Mount Members** | Mod | `/member` | C | C | — | — | `buildMembersNavigationHref` | **C** |
| **AI quick rail** | PD + UX#4 | `buildPersonalAIQuickHref` → `/ai-chat` | — | — | — | — | UX #4 SSOT | **C** |
| **AI identity center** | Mod | `/ai` | — | — | — | — | Not default widget path | **C** |
| **Work tab embed** | PD (XWS) | `WorkTab` / `BrandedWorkDashboard` | P | — | P | — | Work-auth path | **P** |
| **Place tab embed** | PD (XWS) | `PlaceContent` | C | C | P | — | PLC-03 QA PASS | **C** |
| **Personal → Business transition** | XWS | `buildPersonalToBusinessHref` | — | — | — | — | 6 cross-surface tests | **C** |
| **Business → Personal transition** | XWS | `buildBusinessToPersonalHref` / wrapper | — | — | — | — | RWS-09 QA PASS | **C** |
| **Personal → Place consumer** | XWS | `buildPersonalToPlaceHref` | — | — | — | — | RWS-15 PASS | **C** |
| **Runtime scope bridge** | PD | `WorkspaceRuntimeScopeBridge` | — | — | P | — | Registry-aligned fallback 2C | **P** |
| **Dashboard types** | Dash | `normalizePersonalDashboardType` | — | — | — | — | personal/household/educational | **C** |
| **Registry drift CI** | PD | `personalDashboardRegistryDrift.test.ts` | — | — | — | — | 15 tests 2D | **C** |
| **Navigation drift CI** | PD | `personalDashboardNavigation.test.ts` | — | — | — | — | 15 tests | **C** |
| **Bootstrap ad-hoc hrefs** | Dash | `DashboardClient` create flows | — | — | — | — | Partial helper adoption | **P** (P-F3) |
| **Tab embed URL model** | PD | Work/Place tabs | — | — | — | — | Not URL-addressable | **P** (P-F4) |
| **Education context product** | Product | Institution modules TBD | — | — | — | — | WS-L0 narrative | **P** (P-F5) |
| **Global search** | Plat | Header search | — | — | — | — | Platform-global | **C** |
| **Global trash** | Plat | `GlobalTrashBin` right rail | — | — | — | C | RWS-27 trash PASS | **C** |
| **Notifications utility** | Plat + Mod | `/notifications` + sidebar | C | C | — | — | Sidebar module path | **C** |

---

## Wave 2A–2D finding disposition

| ID | 2A issue | Final status (2F) |
|----|----------|-------------------|
| PD-1 | Fragmented navigation | ✅ **Closed** — `personalDashboardNavigation.ts` |
| PD-2 | No routing contract | ✅ **Closed** — routing contract |
| PD-3 | No navigation tests | ✅ **Closed** — 15 tests |
| PD-4 | No cross-surface helpers | ✅ **Closed** — `crossSurfaceNavigation.ts` |
| PD-5 | Widget boundary undocumented | ✅ **Closed** — widget contract |
| PD-6 | Chat layout inconsistent | ✅ **Closed** — always `DashboardLayout` |
| PD-7 | No active module resolver | ✅ **Closed** — `resolvePersonalDashboardModule` |
| PD-8 | Context variants undocumented | ✅ **Closed** — `PERSONAL_CONTEXT_VARIANTS.md` |
| PD-9 | Runtime fallback drift | ✅ **Closed** — registry-aligned bridge |
| PD-10 | AI rail duplication | ✅ **Closed** — `aiExperienceNavigation.ts` |
| P-F1 | No drift suite | ✅ **Closed** (2D) |
| P-F2 | Widget interior URLs | ⏳ **Deferred** — module scope |
| P-F3 | Bootstrap ad-hoc hrefs | ⏳ **Deferred** — low severity |
| P-F4 | Tab embed URLs | ⏳ **Deferred** — by design |
| P-F5 | Education WS-L0 | ⏳ **Product track** |

---

## Summary counts (Wave 2F)

| Metric | C | P | N |
|--------|---|---|---|
| Shell orchestration rows | 18 | 6 | 0 |
| Cross-surface rows | 4 | 0 | 0 |
| CI enforcement rows | 2 | 0 | 0 |

**P0 modernization targets (remaining):** widget interior escalation (**P**), runtime scope contract tests (**P**).

---

*Last updated: 2026-06-14 (Wave 2F re-audit)*
