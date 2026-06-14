# Reference Workspace Registration — Platform Shell (Preparation Package)

**Registration type:** Reference Workspace Module — **inaugural co-surface program**  
**Preparation status:** **Complete** — governance and documentation only  
**Date:** 2026-06-14  
**Program:** [Reference Workspace Program](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)  
**Surfaces:** Business Workspace · Personal Dashboard shell  
**Certification held:** **WS-L1 Certified with Findings** · **WS-L2 Certified with Findings** (2026-06-14)

> **This document is a registration preparation package. It does not award Reference Workspace designation. No council action. No engineering.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Registration readiness | **Prep complete — formal review may open with findings** — §1 |
| 2 | Workspace scope definition | Dual co-surface orchestration program — §2 |
| 3 | Certified exceptions | **CE-1–CE-7** + business exceptions — §3 |
| 4 | Remaining blockers | **REG-B3 partial · RWS-F1 · 11 carry-forward findings** — §4 |
| 5 | Registration recommendation | **Approved with Findings** (prep) — §5 |
| 6 | Future WS-L3 recommendations | §6 |
| 7 | Recommended next wave | §7 |

---

## 1. Registration readiness

### Registration gate assessment

| Gate | Requirement | Pre-prep (WS-L2 cert) | Post-prep (this document) |
|------|-------------|----------------------|---------------------------|
| **REG-B1** | Combined WS-L2 certification | ✅ **Closed** — [WS-L2 Certification Review](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) | ✅ Unchanged |
| **REG-B2** | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` drafted | ❌ Open | ✅ **Closed** — this document |
| **REG-B3** | WS-L3 reference-ready items | 🟡 Partial | 🟡 **Partial** — see below |

### REG-B3 item breakdown

| WS-L3 item | Status | Evidence |
|------------|--------|----------|
| Operation matrix green | ✅ **Met** | [Operation Matrix Re-Audit](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md) (2F) |
| Cross-workspace transition QA | ✅ **Met** | Part 2H — [QA Execution Report](./audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md) |
| Hub completeness gate | ✅ **Met** | WS-L2 charter criteria; stubs retired (1B) |
| `WS-REF-*` pattern annex | ⏳ **Open** | Stubs in contracts; not extracted to `WORKSPACE_REFERENCE_PATTERNS.md` |
| Runtime scope contract tests | ⏳ **Open** | B-F3 — WS-L3 path |
| HR/scheduling matrix P rows | 🟡 **Documented** | Business-context only; not blocking prep |

**REG-B3 verdict:** **Partially closed** — 3 of 4 governance items met; pattern annex extraction remains before plain **Approved** registration.

### RWS-F1 assessment

| Field | Value |
|-------|-------|
| **Finding** | Business Place publisher `/business/:id/workspace/place` returns **404** |
| **Workaround** | `?module=place` on hub resolves and mounts `PlaceWorkspaceLanding` |
| **QA** | RWS-16 P0 FAIL — [QA Execution Report](./audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md) |
| **Severity** | **Medium** — product/cross-surface narrative gap |
| **Blocks prep package?** | **No** — documented certified exception CE-B1 |
| **Blocks plain registration?** | **Yes** — council should require 1E hygiene or explicit waiver |
| **Blocks registration with findings?** | **No** — mirrors WS-L1/WS-L2 precedent |

### Carry-forward findings register (12 open)

| ID | Finding | Surface | Severity | Registration impact |
|----|---------|---------|----------|---------------------|
| **RWS-F1** | Place segment 404 | Business / combined | **Medium** | Narrative + cross-surface asymmetry |
| B-F2 | Legacy `?module=` resolve-only | Business | Low | Sunset policy in obligations §5 |
| B-F3 | Runtime scope not contract-tested | Both | Low | WS-L3 |
| P-F2 | Widget interior ad-hoc escalation URLs | Personal | Low | Module scope |
| P-F3 | `DashboardClient` bootstrap ad-hoc hrefs | Personal | Low | Personal hygiene |
| P-F4 | Tab embed not URL-addressable | Personal | Low | By design (CE-B2) |
| P-F5 | Education context WS-L0 | Personal | Medium | Product track |
| RWS-13 | Work-tab branded path without work-auth | Combined | Low | KNOWN-PWF |
| RWS-14 | Place tab embed automation miss | Combined | Low | KNOWN-PWF |
| RWS-27 | Notifications via sidebar not header bell | Combined | Low | KNOWN-PWF |

**Closed since WS-L1:** B-F1, B-F4, B-F5, P-F1, PD-1–PD-10, L2-B1–L2-B4.

### Evidence chain (cited, not re-run)

| Evidence | Result |
|----------|--------|
| WS-L1 certification (both surfaces) | ✅ Certified with Findings |
| WS-L2 certification (combined) | ✅ Certified with Findings |
| Business contract tests | 28 PASS |
| Personal + cross-surface tests | 36 PASS |
| Part 2H QA (adjudicated) | 23 PASS · 1 P0 · 3 KNOWN-PWF |
| Operation matrices | Current (2F) |

### Registration readiness summary

| Readiness tier | Verdict |
|----------------|---------|
| Registration **prep** | ✅ **Complete** — REG-B2 satisfied |
| Formal registration **review** | ✅ **May open** — with findings |
| Reference Workspace **designation award** | ❌ **Not ready** — REG-B3 partial + RWS-F1 |

---

## 2. Workspace scope definition

### 2.1 Reference Workspace program scope

The inaugural **Reference Workspace** registration covers **platform shell orchestration** for two co-surfaces — not a product `moduleId`, not UX slot #6, not architecture Reference #6.

| In scope | Out of scope |
|----------|--------------|
| Module mounting and switching | Module interior UX (UX references) |
| Tenant scope binding and runtime bridge | Product services, PE, manifests (architecture refs) |
| Global chrome consumption (`PlatformShell`) | AI twin pipeline certification |
| Hub/grid orchestration contracts | Admin Portal portal archetype (deferred annex) |
| Cross-surface transition governance | Individual module WS-L3 interiors |
| Navigation SSOT and drift CI | Reference Workspace **designation council vote** |

**Program identifier:** `reference-workspace-platform-shell`  
**Registration artifact:** This document (`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`)  
**Pattern family (deferred):** `WS-REF-*` — see §6

### 2.2 Business Workspace role

**Archetype:** Hub (`business-workspace`)  
**URL family:** `/business/:businessId/workspace/*`  
**Chrome owner:** `DashboardLayoutWrapper` → PlatformShell **3C-4F** (business mode)

| Responsibility | Owner artifact | Contract |
|----------------|----------------|----------|
| Module mount switch | `BusinessWorkspaceContent.tsx` | [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md) |
| Navigation SSOT | `businessWorkspaceNavigation.ts` | §1–3 routing invariants |
| Registry metadata | `businessWorkspaceContracts.ts` | Drift CI |
| Hub orchestration | `BusinessWorkspaceHubPanel` | No product CRUD |
| Segment vs page routing | `shouldRenderWorkspaceChildren` | Mount decision flow |
| Runtime scope | `BusinessLayoutRuntimeShell`, `WorkspaceRuntimeScopeBridge` | `contextType: business` |
| Installed-module filter | `BusinessConfigurationContext`, `PositionAwareModuleProvider` | REG-B3 partial |
| Cross-surface exit | `handleSwitchToPersonal` | [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) §4 |

**Mounted modules (switch):** dashboard, drive, chat, calendar, todo, place, ai, vlink  
**Mounted modules (segment-page):** notebook, hr, scheduling, members, analytics

**Teaching role:** Canonical **hub archetype** — segment URLs, hub landings, switch authority, business-mode PlatformShell.

### 2.3 Personal Dashboard role

**Archetype:** Dashboard (`personal-dashboard`)  
**URL family:** `/dashboard/*`, `/{module}?dashboard=`, tab embeds  
**Chrome owner:** `DashboardLayoutInner` → PlatformShell **3C-4E** (personal mode)

| Responsibility | Owner artifact | Contract |
|----------------|----------------|----------|
| Widget grid orchestration | `DashboardClient`, `DashboardContext` | [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) |
| Widget projections | `WidgetContentRenderer` | [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](./PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) |
| Navigation SSOT | `personalDashboardNavigation.ts` | P-1–P-7 invariants |
| Registry metadata | `personalDashboardContracts.ts` | Drift CI (2D) |
| Tab embeds | Work tab, Place tab in Inner | Tab-embed route kind |
| Module interiors | App Router `/{module}` pages | Module owns CRUD |
| Cross-surface entry | `crossSurfaceNavigation.ts` | XWS map |
| Runtime scope | `DashboardContext` + registry-aligned fallback | `dashboardId`, household/edu |

**Teaching role:** Canonical **dashboard archetype** — widget grid, query-scoped module routes, tab embeds, personal-mode PlatformShell.

### 2.4 PlatformShell ownership

| Layer | Owner | Business consumer | Personal consumer |
|-------|-------|-------------------|-------------------|
| Chrome primitives | Platform (3C sub-tier) | `DashboardLayoutWrapper` | `DashboardLayoutInner` |
| Header / sidebars / rails | `PlatformShell` components | Business sidebar module list | Personal sidebar + global tabs |
| Mode-specific chrome | Reference Workspace shell | Work auth, business branding | Dashboard tabs, Work/Place embeds |
| Product data | **Must not** appear in shell | Module switch entries only | Widget projections only |

**Prerequisite:** PlatformShell **3C-4E** (personal) and **3C-4F** (business) certified — [`PLATFORMSHELL_CERTIFICATION.md`](../ux/audits/PLATFORMSHELL_CERTIFICATION.md).

**Boundary rule:** Shell owns **orchestration and chrome**; modules own **interiors and authoritative CRUD**.

### 2.5 Runtime ownership

| Concern | Owner | Business | Personal |
|---------|-------|----------|----------|
| `contextType` binding | Workspace runtime | `business` via `BusinessLayoutRuntimeShell` | `personal` / `household` / `education` |
| `dashboardId` scope | Workspace + context | `businessDashboardId` | Active personal dashboard tab |
| `businessId` propagation | Workspace bridge | Required on all business paths | On cross-surface transitions only |
| Policy Engine calls | Product modules | Inside module interiors | Inside module interiors |
| Scope bridge component | Workspace | `WorkspaceRuntimeScopeBridge` | Registry-aligned `DashboardContext` fallback |

**Finding B-F3:** Bridge present on both surfaces; **no contract tests** — tracked for WS-L3, not revoking WS-L2 or prep.

### 2.6 Cross-surface ownership

Authoritative map: [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md) · validated Part 2H (2E).

| Transition | Orchestration owner | Canonical target | QA status |
|------------|---------------------|------------------|-----------|
| Personal → Business | Work tab / XWS | `/business/:id/workspace` | RWS-12 PASS |
| Business → Personal | `DashboardLayoutWrapper` | `/dashboard` | RWS-09 PASS |
| Personal → Place consumer | Place tab / `/place` | Tab embed or module route | RWS-14/15 PASS |
| Business → Place publisher | Business sidebar | `/workspace/place` **intended** | RWS-16 FAIL (RWS-F1) |
| Widget → module | Personal | `?dashboard=` module route | RWS-18 PASS |
| Module → dashboard | Personal | `/dashboard/:id` | RWS-20 PASS |

**Pattern stub:** `WS-REF-XWS-001` — extraction deferred to WS-L3 annex.

**Teaching rule:** Same `moduleId` may mount in **different archetypes** (Place consumer vs publisher) — workspace program owns *where*; UX #6 owns *how it looks*.

### 2.7 Combined ownership matrix

Authoritative layer map from [Operation Matrix Re-Audit](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md) §3:

```
Platform-global (search, trash, notifications, auth)
    └── PlatformShell chrome (3C-4E / 3C-4F)
            └── Reference Workspace orchestration
                    ├── Business: segment switch + hub
                    └── Personal: grid + tab embeds
                            └── Module interiors (product moduleId)
```

---

## 3. Certified exceptions

Exceptions are **intentional** deviations from strict registry symmetry. They do not revoke certification when documented here and in operation matrices.

### 3.1 Personal dashboard exceptions (CE-1–CE-7)

| ID | Exception | Rationale | Recertification trigger |
|----|-----------|-----------|-------------------------|
| **CE-1** | `vlink` module-route without grid `widgetType` | Module has personal route; no projection today | Adding `VLinkWidget` without contract update |
| **CE-2** | Utility widgets (`quickstats`, `quicknotes`, `bookmarks`, `activityfeed`) without module-route contracts | Utility projections only | Escalation to full module without contract |
| **CE-3** | `hr`, `scheduling` registry `contexts: ['business']` | Business dashboard widgets; full routes in business workspace | Personal full-route mount without audit |
| **CE-4** | `WidgetContentRenderer` map separate from `WIDGET_REGISTRY` | Shell owns type→component mapping | Unifying without drift test update |
| **CE-5** | `notes` widget alias → `notebook` in renderer | Legacy alias normalization | Removing alias without migration |
| **CE-6** | Widget interior ad-hoc escalation URLs | Shell API ready; module adoption deferred (P-F2) | New widgets without `buildWidgetEscalationHref` |
| **CE-7** | `DashboardClient` bootstrap ad-hoc hrefs | P-F3 — create flows not migrated | New bootstrap paths bypassing navigation SSOT |

### 3.2 Business workspace exceptions (CE-B1–CE-B3)

| ID | Exception | Rationale | Recertification trigger |
|----|-----------|-----------|-------------------------|
| **CE-B1** | Place segment `/workspace/place` 404 while `?module=place` works | Route hygiene gap (RWS-F1); switch mount works via legacy resolve | Segment page added without updating contracts |
| **CE-B2** | Legacy `?module=` resolve-only on hub (B-F2) | Backward compatibility; no sunset policy yet | New navigation using query param |
| **CE-B3** | `notes`/`connections` alias normalization in resolver | Canonical `notebook`/`members` segments | New alias without contract test |

### 3.3 Combined / QA exceptions

| ID | Exception | Rationale |
|----|-----------|-----------|
| **CE-X1** | Tab embed (Work/Place) not URL-addressable (P-F4) | By design — global tab state in Inner |
| **CE-X2** | RWS-13/14/27 KNOWN-PWF automation gaps | Manual/adjacent evidence corroborates PASS |

---

## 4. Remaining blockers

### 4.1 Registration blockers (formal designation)

| ID | Blocker | Status | Resolution wave |
|----|---------|--------|-----------------|
| REG-B1 | WS-L2 certification | ✅ **Closed** | WS-L2 cert review |
| REG-B2 | Registration shell doc | ✅ **Closed** | This wave |
| REG-B3 | WS-L3 items incomplete | 🟡 **Partial** | Pattern annex + runtime tests |
| REG-P1 | RWS-F1 Place segment | ⏳ **Open** | Business 1E hygiene (recommended) |

### 4.2 Engineering gaps (non-revoking)

| ID | Gap | Priority |
|----|-----|----------|
| ENG-1 | Business Place segment page | **P0** |
| ENG-2 | Runtime scope contract tests | P2 |
| ENG-3 | Widget interior escalation adoption | P2 |
| ENG-4 | DashboardClient bootstrap href migration | P3 |
| ENG-5 | Work-tab branded path work-auth | P2 |

### 4.3 Governance gaps

| ID | Gap | Priority |
|----|-----|----------|
| GOV-1 | `WS-REF-*` pattern annex not extracted | P2 |
| GOV-2 | Legacy `?module=` sunset policy | P2 |
| GOV-3 | CERTIFICATION_LEDGER Reference Workspace row update | P3 |

**WS-L2 process blockers:** **0**  
**Registration prep blockers:** **0** (REG-B2 closed)  
**Designation blockers:** **2** (REG-B3 partial, REG-P1)

---

## 5. Registration obligations

Obligations apply to teams mounting modules in business workspace or personal dashboard after registration (when awarded).

### 5.1 Mount obligations

| Obligation | Business | Personal |
|------------|----------|----------|
| Add registry entry before mount | `coreModuleRegistry` + `businessWorkspaceContracts` | `WIDGET_REGISTRY` + `personalDashboardContracts` |
| Add navigation href via SSOT | `buildBusinessWorkspaceModuleHref` | `personalDashboardNavigation` helpers |
| Hub landing for switch modules | `[Module]WorkspaceLanding.tsx` | N/A (grid archetype) |
| Update operation matrix row | Required | Required |
| Pass drift CI | `businessWorkspaceRegistryDrift.test.ts` | `personalDashboardRegistryDrift.test.ts` |
| No stub product UI in shell | Required | Required |
| Cross-surface links via XWS map | Required | Required |

### 5.2 Documentation obligations

| Event | Required update |
|-------|-----------------|
| New mounted module | Routing contract §5 canonical table + `REFERENCE_MODULE_CATALOG.md` |
| New certified exception | This doc §3 + operation matrix note |
| Cross-surface change | `CROSS_SURFACE_TRANSITIONS.md` + Part 2H QA row |
| Shell chrome change | PlatformShell recertification assessment |

### 5.3 Sunset obligations (pending B-F2 policy)

| Legacy path | Current rule | Future rule (recommended) |
|-------------|--------------|---------------------------|
| `?module=` on business hub | Resolve-only; no new links | Deprecate after 1 release with redirect |
| Bare `/{module}` without `?dashboard=` | Allowed legacy deep link | Document per-module policy |

---

## 6. Recertification triggers

Re-open WS-L2 assessment or registration review when:

1. **New stub product UI** introduced in `BusinessWorkspaceContent` or `WidgetContentRenderer`
2. **Navigation SSOT bypass** — ad-hoc `router.push` to workspace URLs outside helpers (net new paths)
3. **Registry drift** — CI drift tests removed or failing without waiver
4. **PlatformShell mode regression** — business/personal consumers stop using 3C-4E/4F primitives
5. **Cross-surface data leak** — tenant scope violation across surfaces (P0)
6. **RWS-F1-class gap** — canonical href 404 for mounted switch module
7. **Major archetype change** — e.g. personal grid replaced by hub switch without charter amendment
8. **Certified exception violated** — new mount contradicting CE-1–CE-7 without documentation

**Recommended cadence:** Annual or after any workspace wave (1x/2x class).

**WS-L1 recertification:** Required if shell ownership boundaries materially change.  
**WS-L2 recertification:** Required if routing contracts or drift enforcement regress.  
**Registration recertification:** Required if obligations §5 systematically violated.

---

## 7. Registration recommendation

### Preparation package recommendation: **Approved with Findings**

| Outcome considered | Rationale |
|--------------------|-----------|
| **Approved** | Not selected — RWS-F1 + REG-B3 pattern annex open |
| **Approved with Findings** | ✅ **Selected** — WS-L2 certified; prep package complete; findings documented and non-revoking |
| **Deferred** | Not warranted for prep — REG-B2 closed; evidence chain complete |
| **Rejected** | Not warranted — charter scope met; no material regressions |

### What this recommendation means

| Action | Status |
|--------|--------|
| Registration **prep package** accepted | ✅ |
| Formal registration **review** may be scheduled | ✅ — council wave |
| Reference Workspace **designation awarded** | ❌ — not this wave |
| Engineering required for prep | ❌ |
| Certification changes | ❌ |

### Conditions for upgrading to plain **Approved** at registration review

1. **ENG-1 / RWS-F1** resolved (Place segment page or documented redirect)
2. **REG-B3** pattern annex drafted (`WORKSPACE_REFERENCE_PATTERNS.md` or equivalent)
3. **B-F3** runtime scope contract tests (recommended, not strictly blocking plain Approved)
4. Council review of carry-forward findings register

---

## 8. Future WS-L3 recommendations

WS-L3 — **Reference-ready** — is the next certification tier. Not assessed in this wave.

| Priority | WS-L3 item | Owner | Wave |
|----------|------------|-------|------|
| **P1** | Extract `WS-REF-*` pattern annex | Governance | 6E / WS-L3 prep |
| **P1** | Runtime scope contract tests | Engineering | Shared workspace |
| **P2** | `?module=` sunset policy + redirect | Governance + engineering | Business hygiene |
| **P2** | Widget escalation href adoption | Module interiors | Per-module |
| **P2** | Education context boundary matrix | Product + governance | Personal annex |
| **P3** | Admin Portal portal archetype annex | Governance | Post-inaugural |
| **P3** | E2E browser transition suite | QA | Optional beyond Part 2H |

### Proposed `WS-REF-*` pattern catalog (extraction target)

| Pattern ID | Source | Topic |
|------------|--------|-------|
| `WS-REF-NAV-001` | Charter §5 | Workspace navigation SSOT |
| `WS-REF-SW-001` | Routing contract | Module switch authority |
| `WS-REF-HUB-001` | module-development.mdc | Hub landing mount |
| `WS-REF-XWS-001` | CROSS_SURFACE_TRANSITIONS | Cross-surface transitions |
| `WS-REF-STATE-001` | Runtime bridge | Scope persistence |
| `WS-REF-SCOPE-001` | Contracts | Tenant binding |
| `WS-REF-FILTER-001` | Business config | Installed-module filter |
| `WS-REF-PERM-001` | Business runtime | Permission snapshot |
| `WS-REF-WIDGET-001` | Widget contract | Dashboard projection |

---

## 9. Recommended next wave

| Order | Wave | Type | Objective |
|-------|------|------|-----------|
| **1** | **Reference Workspace registration review** | Governance (council) | Formal designation decision — uses this package |
| **2** | **Business Workspace 1E** | Engineering (optional) | Place segment null deferral — closes RWS-F1 / ENG-1 |
| **3** | **WS-L3 readiness review** | Governance | Pattern annex + runtime tests + matrix green |
| **4** | **WS-L3 certification review** | Governance | Reference-ready tier |
| **5** | **Pattern annex extraction (6E)** | Governance | `WORKSPACE_REFERENCE_PATTERNS.md` |

**Not recommended next:** Designation without registration review · module interior UX recertification · merging workspace into UX #6.

---

## 10. Certification record (cited)

| Surface | WS-L1 | WS-L2 | Registration prep |
|---------|-------|-------|-------------------|
| Business Workspace | Certified with Findings | Certified with Findings | ✅ This package |
| Personal Dashboard shell | Certified with Findings | Certified with Findings | ✅ This package |
| Combined program | Dual WS-L1 | Dual WS-L2 | ✅ **Approved with Findings** (prep) |

**Reviews:** [Business WS-L1](./audits/BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) · [Personal WS-L1](./audits/PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) · [WS-L2 Certification](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)

---

## 11. Copy targets for future workspace surfaces

When onboarding Admin Portal, partner iframe mounts, or new archetypes:

| Need | Reference |
|------|-----------|
| Hub module switch | Business `BusinessWorkspaceContent` + routing contract |
| Dashboard widget grid | Personal `DashboardContext` + widget contract |
| PlatformShell adoption | 3C-4E personal / 3C-4F business layering |
| Cross-surface links | `crossSurfaceNavigation.ts` + XWS map |
| Drift enforcement | Registry ↔ switch ↔ contract bidirectional tests |
| Operation matrix row | Business or personal matrix template (2F) |
| QA evidence | Part 2H rows in platform manual QA matrix |

---

## Related

- [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)
- [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)
- [REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md)
- [WORKSPACE_ROUTING_CONTRACT.md](./WORKSPACE_ROUTING_CONTRACT.md)
- [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](./PERSONAL_DASHBOARD_ROUTING_CONTRACT.md)
- [CROSS_SURFACE_TRANSITIONS.md](./CROSS_SURFACE_TRANSITIONS.md)
- [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md)
- [REFERENCE_MODULE_PROGRAM.md](../ux/REFERENCE_MODULE_PROGRAM.md)

---

*Last updated: 2026-06-14 (Reference Workspace registration preparation — Approved with Findings; no designation awarded)*
