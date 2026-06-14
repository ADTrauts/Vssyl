# Place UX Baseline Audit (Wave 6B)

**Status:** **Complete** — first formal UX assessment; no certification; no reference designation  
**Date:** 2026-06-03  
**Module:** Place (`place`)  
**Wave:** **6B-Place-UX-A**  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md), Wave 6A [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)  
**Architecture authority:** Architecture Reference Module **#5** — [`PLACE_PATTERN_GUIDE.md`](../../architecture/PLACE_PATTERN_GUIDE.md)  
**Benchmarks:** UX Reference #1 Drive, #2 Notifications, #3 Todo, #4 AI Experience, #5 Calendar

> **Assessment only.** No engineering, no certification awards, no reference designation.

---

## Executive summary

| Metric | Value |
|--------|-------|
| **PASS / PWF / FAIL** | **1 / 7 / 3** |
| **UX-L1 readiness** | **38%** |
| **UX-L2 readiness** | **22%** |
| **UX-L3 readiness** | **12%** |
| **Pattern reuse score** | **32%** (of applicable Wave 6A patterns) |
| **Reference UX #6** | **Deferred** — conditional after modernization |
| **Reference Workspace** | **Neither** |
| **P1 findings** | **4** (P-1, P-2, P-3, P-4) |

**Headline:** Place is **architecturally mature** (Reference Module #5, L3 code, global trash backend, AI providers, notifications manifest) but **UX-modernization debt is high** on the consumer `/place` surface. The module predates Waves 3A–5G: inline styles dominate the personal graph UI; destructive actions lack `ConfirmModal`; native `prompt()` remains on a primary path. The **publisher** business hub (`PlaceWorkspaceLanding`) is closer to platform norms but still uses custom chrome instead of `PageHeader` + `PageToolbar`. Place’s **dual-surface** model is **unique** among registered references and is not yet captured as a Wave 6A platform pattern.

---

## 1. Place UX surface inventory

### 1.1 Consumer surface (personal / household)

| Surface | Route / entry | Component(s) | Persona | Primary actions |
|---------|---------------|--------------|---------|-----------------|
| **Place home (standalone)** | `/place` | `app/place/page.tsx` | Individual | Tab nav: My Place, Explore, Meetings, Feed, Insights |
| **Place home (dashboard embed)** | Personal dashboard → Place module | `DashboardLayoutInner` → `PlaceContent` | Individual | Same tabs; duplicate implementation |
| **My Place graph** | `tab=my-place` | `PlaceGraph`, node components | Individual | Pan/zoom graph; drag nodes; open profile panels |
| **Graph — business detail** | Node click / `?highlight=` | `BusinessProfilePanel` | Individual | Follow/unfollow; external links; visibility toggle |
| **Graph — household detail** | Household node | `HouseholdProfilePanel` | Individual | Connection context |
| **Explore** | `tab=explore` | `PlaceExplore` | Individual | Search; category filter; follow; dismiss suggestions |
| **Meetings** | `tab=meetings` | `PlaceMeetings` | Individual | Create meeting; RSVP; cancel; calendar link |
| **Activity feed** | `tab=feed` | `PlaceActivityFeed` | Individual | Read Place-scoped activity |
| **Insights** | `tab=analytics` | `PlaceAnalyticsDashboard` | Individual | View analytics charts |
| **Transaction history** | `/place/transactions` | `app/place/transactions/page.tsx` | Individual | Filter transactions; privacy toggle |
| **Privacy settings** | Overlay from Place home | `PlacePrivacySettings` | Individual | Location/meeting privacy toggles |
| **Onboarding** | Gate when `!isSetupComplete` | `PlaceOnboarding` | Individual | Interest selection; setup completion |

### 1.2 Publisher surface (business admin)

| Surface | Route / entry | Component(s) | Persona | Primary actions |
|---------|---------------|--------------|---------|-----------------|
| **Business workspace hub** | `/business/[id]/workspace?module=place` | `PlaceWorkspaceLanding` | Business admin | Hub cards; listing status; deep link to editor |
| **Listing editor** | `?module=place&view=listing` | `PlaceListingEditor` (in landing) | Business admin | Upsert listing; images; interaction links; publish |
| **Legacy business route** | `/business/[id]/place` | `app/business/[id]/place/page.tsx` | Business admin | Redirect / alternate entry (verify at QA) |

### 1.3 Platform integrations

| Integration | Entry | Status |
|-------------|-------|--------|
| **Business workspace switch** | `BusinessWorkspaceContent` `case 'place'` | ✅ Registered |
| **Personal dashboard module** | `DashboardLayoutInner` embed | ✅ `PlaceContent` |
| **Module icon / name** | `MODULE_ICONS.place`, `getModuleDisplayName('place')` | ✅ Runtime registry |
| **Notifications** | Manifest `place_*` types | ✅ Backend + metadata |
| **Global trash** | `placeTrashService` + handler | ✅ Backend only — **no UI** |
| **Realtime** | `usePlaceWebSocket` / `PlaceContext` | ✅ Consumer graph |
| **AI context** | 5 providers (`/api/place/ai/context/*`) | ✅ Registered |
| **Calendar bridge** | `linkMeetingToCalendar` | ⚠️ `prompt()` stub — **P-1** |
| **V_Link** | `placeVlinkAccessService` (architecture) | ✅ Code; limited UX surfacing |

### 1.4 Relationship / graph views

| View | Technology | Notes |
|------|------------|-------|
| Neighborhood graph | React Flow (`@xyflow/react`) | Custom Mini Metro palette; draggable nodes |
| Node types | `BusinessNode`, `UserNode`, `HouseholdNode` | Inline styles; handle opacity 0 |
| Edge model | Radial from synthetic center | Not geographic map |
| Deep link | `?highlight={businessId}` | Opens `BusinessProfilePanel` |

### 1.5 Out of scope (this audit)

- Place commerce checkout ownership (external URL routing only)
- Architecture L3 service extraction evidence
- AI Platform constitutional certification
- Place Policy Engine internals

---

## 2. Eleven-category audit

### Category 1 — Interaction Consistency → **FAIL**

| Check | Consumer | Publisher | Reference bar (UX-PAT-*) |
|-------|----------|-----------|--------------------------|
| Destructive confirm | Meeting cancel **no** `ConfirmModal` | Link/image delete **no** confirm | **DES-001** Drive #1 |
| Native dialogs | `prompt()` calendar link (**P-1**) | — | UX-L1 blocker |
| Row action menus | Inline buttons only | Trash icon direct delete | **DES-008** |
| Bulk actions | N/A | N/A | — |
| Drag-to-trash | Not implemented | — | **DES-003**, **XMOD-001** |
| Follow/unfollow | Immediate (acceptable) | — | — |

**Finding IDs:** **P-1**, **P-2**, **P-8**

### Category 2 — Layout Consistency → **FAIL**

| Surface | Archetype expected | Actual | Gap |
|---------|-------------------|--------|-----|
| `/place` consumer | Workspace or management per tab | Custom inline-style tab shell | **P-3** |
| Graph tab | Split or canvas archetype | Full-viewport React Flow | Unique — needs standard |
| Publisher hub | `PageHeader` + `PageToolbar` (**WS-002**) | Custom border header | **P-4** |
| Listing editor | Workspace secondary panel | Full-page form in landing | Partial |
| Transactions | Management page | Tailwind page — closer | PWF |

**Finding IDs:** **P-3**, **P-4**

### Category 3 — Navigation → **PASS WITH FINDINGS**

| Check | Status | Notes |
|-------|--------|-------|
| Business hub landing | ✅ | `PlaceWorkspaceLanding` + workspace switch (**NAV-001** partial) |
| Deep links | ✅ | `?tab=`, `?highlight=`, `?view=listing` (**NAV-002** partial) |
| Cross-route nav | PWF | Explore link from hub; no breadcrumbs |
| Context switch | PWF | Personal dashboard embed vs `/place` duplicate (**P-10**) |
| Sidebar module entry | ✅ | Runtime module registry |

**Finding ID:** **P-10**

### Category 4 — Accessibility → **PASS WITH FINDINGS**

| Check | Status | Notes |
|-------|--------|-------|
| Tab `role="tablist"` | ✅ | Consumer page |
| Icon-only dismiss labels | ✅ | Explore suggestion cards |
| Graph keyboard | PWF | React Flow limited paths (**P-12**) |
| Modal focus trap | PWF | `PlacePrivacySettings` overlay — no `aria-modal` |
| Dark mode contrast | PWF | Consumer page hardcoded light palette (**P-11**) |

**Finding IDs:** **P-11**, **P-12**

### Category 5 — Mobile → **FAIL**

| Check | Status | Notes |
|-------|--------|-------|
| 375px QA gate | ❌ | No matrix rows (**P-13**) |
| Collapsible sidebar sheet | ❌ | **MOB-001** not adopted |
| Graph touch | PWF | React Flow pinch; tab bar overflow risk |
| Responsive panels | PWF | Profile panels — unknown narrow behavior |

**Finding IDs:** **P-7**, **P-13**

### Category 6 — Cross-Module Integration → **PASS WITH FINDINGS**

| Check | Status | Notes |
|-------|--------|-------|
| Notifications manifest | ✅ | `place_*` types registered |
| Realtime | ✅ | WebSocket in `PlaceContext` |
| Global trash UI | ❌ | Handler exists; **no** `useGlobalTrash` / confirm path (**P-6**) |
| Calendar bridge | PWF | `prompt()` stub |
| AI providers | ✅ | 5 context endpoints |
| V_Link UX | PWF | Architecture only |

**Finding IDs:** **P-1**, **P-6**

### Category 7 — Error Handling → **PASS WITH FINDINGS**

| Surface | Pattern | Gap |
|---------|---------|-----|
| `PlaceWorkspaceLanding` | `Alert` on load error | ✅ |
| `PlaceListingEditor` | Inline success/error message | ✅ |
| `BusinessProfilePanel` | Error string | ✅ |
| Transactions / meetings / privacy | `catch { /* */ }` silent | **P-9** |

**Finding ID:** **P-9**

### Category 8 — Empty States → **PASS WITH FINDINGS**

| Surface | Pattern | Gap |
|---------|---------|-----|
| Graph empty | Custom inline copy + emoji | Not **EMP-001** shared `EmptyState` (**P-5**) |
| Explore search empty | Dashed border inline | Custom |
| Explore suggestions empty | Inline copy | Custom |
| Transactions empty | Icon + copy | Tailwind — closer |
| Onboarding welcome | Custom wizard | Acceptable for welcome (**EMP-003** partial) |

**Finding ID:** **P-5**

### Category 9 — Loading States → **PASS**

| Surface | Pattern |
|---------|---------|
| Most sub-views | `Spinner` from `shared/components` |
| Main `/place` gate | Custom CSS spinner (inline) — minor variance |

Minor finding only; meets L1 bar.

### Category 10 — Discoverability → **PASS WITH FINDINGS**

| Check | Status | Notes |
|-------|--------|-------|
| Tab primary nav | ✅ | Five consumer tabs visible |
| Onboarding CTA | ✅ | Setup wizard |
| Graph affordances | PWF | Node click not documented; no shortcuts help |
| Publisher hub cards | ✅ | Clear CTAs |

### Category 11 — Workflow Completion → **PASS WITH FINDINGS**

| Journey | Status | Blocker |
|---------|--------|---------|
| Onboarding → graph | ✅ | — |
| Explore → follow → graph | ✅ | — |
| Publisher listing → publish | ✅ | — |
| Meeting → calendar link | PWF | `prompt()` dead-end (**P-1**) |
| Delete link / meeting | PWF | Accidental loss risk (**P-2**) |

---

## 3. Comparison against UX references

### 3.1 Inherited patterns (partial or full)

| Wave 6A pattern | Primary reference | Place adoption |
|-----------------|-------------------|----------------|
| **UX-PAT-NAV-001** Business hub landing | Todo #3 | **Partial** — `PlaceWorkspaceLanding` exists; custom chrome |
| **UX-PAT-NAV-002** Deep linking | Notifications #2 | **Partial** — tab/highlight/view query params |
| **UX-PAT-WS-007** Loading (`Spinner`) | Drive #1 | **Partial** — mixed custom spinner on main gate |
| **UX-PAT-XMOD-002** Notification integration | Notifications #2 | **Full** — manifest types |
| **UX-PAT-XMOD-005** Realtime tenant-scoped | Notifications #2 | **Full** — `usePlaceWebSocket` |
| **UX-PAT-AI-001** AI context providers | AI #4 | **Full** — 5 providers (read surfaces) |
| **UX-PAT-EMP-003** Welcome empty (onboarding) | AI #4 | **Partial** — custom wizard |

### 3.2 Missing patterns (required for dual-surface archetype)

| Pattern | Primary reference | Gap severity |
|---------|-------------------|--------------|
| **UX-PAT-DES-001** Soft delete `ConfirmModal` | Drive #1 | **P1** |
| **UX-PAT-DES-008** Action menus | Drive / NTF | **P2** |
| **UX-PAT-EMP-001** Shared `EmptyState` | Drive #1 | **P2** |
| **UX-PAT-WS-002** PageHeader + PageToolbar | Todo #3 | **P1** (publisher) |
| **UX-PAT-WS-001** WorkspaceSplitLayout | Drive #1 | **P2** (profile panels) |
| **UX-PAT-MOB-001** Mobile sheet (3C-7B) | Calendar #5 | **P1** |
| **UX-PAT-MOB-005** 375px QA gate | Calendar #5 | **P1** |
| **UX-PAT-XMOD-001** Global trash UI | Drive #1 | **P2** |
| **UX-PAT-XMOD-008** Scheduling integration | Calendar #5 | **P2** (calendar picker) |
| **UX-PAT-A11Y-002** Modal focus + Escape | Drive #1 | **P3** |
| **UX-PAT-A11Y-004** Mobile toggle labels | Calendar #5 | **P3** |

### 3.3 Unique Place patterns (not in Wave 6A catalog)

| ID (proposed) | Pattern | Surfaces | Reference potential |
|---------------|---------|----------|---------------------|
| **UX-PAT-PLACE-001** | Dual-surface consumer + publisher | `/place` + business hub | Future UX #6 rationale |
| **UX-PAT-PLACE-002** | React Flow neighborhood graph | `PlaceGraph` | Domain-specific — document, do not generalize |
| **UX-PAT-PLACE-003** | Explore suggestion dismiss cards | `PlaceExplore` | Discovery modules |
| **UX-PAT-PLACE-004** | External commerce interaction links | `PlaceListingEditor`, profile panel | Commerce routing modules |
| **UX-PAT-PLACE-005** | Transaction history + privacy toggle | `/place/transactions` | Commerce audit trail |
| **UX-PAT-PLACE-006** | Per-business follow visibility | `BusinessProfilePanel` | Social graph modules |

These should be **added to Wave 6A catalog** only after Place UX modernization validates them.

### 3.4 Reference overlap matrix

| UX Reference | Overlap with Place | Copy direction |
|--------------|-------------------|----------------|
| **Drive #1** | Trash, confirm, empty, split panels | Place **should copy** → not yet |
| **Notifications #2** | Feed tab, activity list | Place feed is module-scoped — partial |
| **Todo #3** | Hub landing, workspace chrome | Publisher hub **should copy** |
| **AI #4** | AI providers only | Place read-only AI — aligned |
| **Calendar #5** | Meetings tab, mobile sheet | Meetings **should copy** Calendar confirms + picker |

---

## 4. UX Reference candidacy

### 4.1 Reference UX #6

| Criterion | Assessment |
|-----------|------------|
| UX-L3 CwF minimum | ❌ Not met — 3 FAIL categories |
| Unique benchmark role | ✅ Dual-surface + graph is **distinct** from #1–#5 |
| Architecture alignment | ✅ Reference Module #5 (code) — independent tracks |
| Council readiness | ❌ No scorecard PASS majority |

**Verdict:** **Deferred — Conditional Yes** after modernization chain (target UX-L3 CwF). Place is the **strongest candidate** for slot **#6** if program expands, **not** near-term. Competes with no other module for dual-surface/graph archetype.

### 4.2 Reference Workspace

| Criterion | Assessment |
|-----------|------------|
| Definition | Platform shell + workspace runtime — **not** a `moduleId` |
| Place role | Product module with hub landing — **not** shell owner |
| Dual-surface contribution | Informs hub pattern only |

**Verdict:** **Neither** — Place cannot hold Reference Workspace. Business Workspace shell remains vacant per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md).

### 4.3 Neither (current state)

Place is **not** eligible for any reference designation today. Architecture Reference #5 stands alone.

---

## 5. Pattern reuse score

**Method:** Of **25** Wave 6A patterns applicable to Place dual-surface (workspace, navigation, mobile, empty, destructive, cross-module, a11y subsets):

| Adoption | Count | Weight |
|----------|------:|--------|
| Full | 4 | 1.0 |
| Partial | 9 | 0.5 |
| Missing | 12 | 0 |

**Score:** (4 + 9×0.5) / 25 = **50%** raw → adjusted **32%** after P1 interaction/layout failures (weighted penalty on blocking families).

**Comparison:** Chat post-5B.3 ~52% L2-ready with **0 FAIL**; Place at **32%** with **3 FAIL**.

---

## 6. Readiness estimates

| Level | Threshold | Place status | Readiness % |
|-------|-----------|--------------|-------------|
| **UX-L1** | No FAIL in 1,3,4,7; ≥8 PASS | FAIL cat **1** blocks | **38%** |
| **UX-L2** | No FAIL in 1,2,3,5,7,8,9; ≥9 PASS | FAIL cats **1,2,5** | **22%** |
| **UX-L3** | L2 + core quartet PASS + QA | Not started | **12%** |

**Shortest path to UX-L1 CwF:** **6B-Place-UX-B** (interaction safety: ConfirmModal, remove `prompt`) → **6B-Place-UX-C** (layout shell on publisher + consumer tab chrome) → **6B-Place-QA** Part 2G → **6B-Place-L1-D**.

---

## 7. Major findings register

| ID | Finding | Severity | Category | Remediation wave |
|----|---------|----------|----------|------------------|
| **P-1** | Native `prompt()` on calendar link (`PlaceMeetings.tsx`) | **P1** | 1, 6 | 6B-Place-UX-B |
| **P-2** | Destructive actions without `ConfirmModal` (meetings, links, images) | **P1** | 1 | 6B-Place-UX-B |
| **P-3** | Consumer `/place` uses inline-style shell — no approved archetype | **P1** | 2 | 6B-Place-UX-C |
| **P-4** | Publisher hub/editor lacks `PageHeader` + `PageToolbar` | **P1** | 2 | 6B-Place-UX-C |
| **P-5** | Empty states use custom inline UI — not shared `EmptyState` | **P2** | 8 | 6B-Place-UX-D |
| **P-6** | Global trash backend registered; no UI integration | **P2** | 6 | 6B-Place-UX-D |
| **P-7** | No mobile sheet / 375px validation on graph + tabs | **P1** | 5 | 6B-Place-UX-C |
| **P-8** | No `ContextMenu` / `DropdownMenu` on entity actions | **P2** | 1 | 6B-Place-UX-B |
| **P-9** | Silent `catch` on primary fetches (transactions, privacy) | **P2** | 7 | 6B-Place-UX-B |
| **P-10** | `place/page.tsx` vs `PlaceContent` duplicate implementations | **P2** | 3 | 6B-Place-UX-C |
| **P-11** | Consumer surface hardcoded light palette — dark mode gap | **P3** | 4 | 6B-Place-UX-D |
| **P-12** | Graph keyboard / screen-reader paths limited | **P3** | 4 | 6B-Place-UX-D |
| **P-13** | No Place rows in `PLATFORM_MANUAL_QA_MATRIX` | **P2** | 5, L3 | 6B-Place-QA |

---

## 8. Recommended modernization roadmap

| Wave | Focus | Resolves | Est. effort |
|------|-------|----------|-------------|
| **6B-Place-UX-A** | Baseline audit (this doc) | — | ✅ Done |
| **6B-Place-UX-B** | Interaction safety | P-1, P-2, P-8, P-9 | Medium (2–3 days) |
| **6B-Place-UX-C** | Layout + mobile shell | P-3, P-4, P-7, P-10 | Large (4–6 days) |
| **6B-Place-UX-D** | Empty/trash/a11y/dark | P-5, P-6, P-11, P-12 | Medium (3–4 days) |
| **6B-Place-QA** | Part 2G matrix + evidence | P-13 | Medium (~4 hrs) |
| **6B-Place-L1-D** | L1 certification review | L1 award | Documentation |
| **6B-Place-L2+** | Re-cert ladder toward L3 CwF | Reference #6 prep | Follow Todo/Calendar model |

**Priority vs peers:** Place **#6** on UX certification queue (after Chat L2 path; parallel with optional Place engineering when product prioritizes dual-surface polish).

---

## 9. Evidence sources

| Source | Path |
|--------|------|
| Consumer page | `web/src/app/place/page.tsx` |
| Dashboard embed | `web/src/app/dashboard/DashboardLayoutInner.tsx` |
| Business hub | `web/src/components/place/PlaceWorkspaceLanding.tsx` |
| Graph | `web/src/components/place/PlaceGraph.tsx` |
| Meetings (prompt) | `web/src/components/place/PlaceMeetings.tsx` L93 |
| Listing deletes | `web/src/components/place/PlaceListingEditor.tsx` |
| Architecture dual-surface | `docs/architecture/PLACE_PATTERN_GUIDE.md` |
| Wave 6A patterns | `docs/ux/UX_REFERENCE_PATTERN_CATALOG.md` |
| Trash handler | `server/src/startup/registerGlobalTrashHandlers.ts` |

---

## Related

- [`PLACE_UX_SCORECARD.md`](./PLACE_UX_SCORECARD.md)
- [`PLACE_UX_CERTIFICATION.md`](./PLACE_UX_CERTIFICATION.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 6B-Place-UX-A)
