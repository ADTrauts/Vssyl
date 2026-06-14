# Reference Workspace Registration Review

**Status:** **Complete** — inaugural registration review (governance only)  
**Date:** 2026-06-14  
**Program:** [Reference Workspace Program](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)  
**Registration type:** Reference Workspace Module — program type **#3**  
**Prep package:** [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md)  
**Certification held:** WS-L1 + WS-L2 **Certified with Findings** (both co-surfaces)

> **This review awards inaugural Reference Workspace registration. No engineering. No certification changes. No WS-L3 assessment.**

---

## Required report

| # | Topic | Outcome |
|---|-------|---------|
| 1 | Registration decision | **Approved with Findings** — §1 |
| 2 | Official holder determination | **Hybrid model** — combined Platform Shell + dual co-surfaces — §2 |
| 3 | Findings list | **12 open findings** — §3 |
| 4 | Certified exceptions | **CE-1–CE-7 · CE-B1–B3 · CE-X1–X2** — §4 |
| 5 | Reusable workspace patterns | **9 pattern stubs** — §5 |
| 6 | Catalog updates | §6 |
| 7 | Future obligations | §7 |
| 8 | Official registered program asset? | **Yes** — §8 |

---

## 1. Registration decision

### Decision: **Approved with Findings**

The inaugural **Reference Workspace Platform Shell** program is **registered** effective **2026-06-14** under the Reference Module Program (type **#3 — Reference Workspace Module**).

| Outcome considered | Rationale |
|--------------------|-----------|
| **Approved** | Not selected — RWS-F1 (medium) + REG-B3 partial (pattern annex) prevent zero-finding bar |
| **Approved with Findings** | ✅ **Selected** — mirrors UX reference precedent (Drive, Calendar, Notifications); all mandatory gates met or waived with documentation |
| **Deferred** | Not warranted — REG-B1/B2 closed; evidence chain complete; prep package accepted |
| **Rejected** | Not warranted — charter scope satisfied; WS-L2 certified; operation matrices current |

### Registration gate disposition

| Gate | Requirement | Verdict | Evidence |
|------|-------------|---------|----------|
| **REG-B1** | Combined WS-L2 certification | ✅ **Met** | [WS-L2 Certification Review](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |
| **REG-B2** | Registration shell document | ✅ **Met** | [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) |
| **REG-B3** | WS-L3 reference-ready items | 🟡 **Partial — waived for CwF** | Matrices + QA met; pattern annex deferred to follow-on governance |

**REG-B3 waiver rationale:** Charter WS-L3 criteria list pattern annex as reference-ready enhancement, not a hard registration veto when contracts and QA evidence are authoritative. Annex extraction tracked as post-registration obligation (GOV-1), consistent with UX references that registered before full pattern catalog extraction (Wave 6A post-registration).

### RWS-F1 disposition

| Field | Registration treatment |
|-------|------------------------|
| Finding | Place publisher `/workspace/place` 404; `?module=place` works |
| Severity | Medium |
| Registration impact | **Carry-forward finding** — registered as **CE-B1** certified exception |
| Revokes registration? | **No** — switch mount functional; cross-surface narrative gap documented |
| Recommended remediation | Business Workspace **1E** hygiene (engineering — out of scope) |

### Evidence cited (not re-run)

| Evidence | Result |
|----------|--------|
| WS-L1 (Business + Personal) | Certified with Findings |
| WS-L2 (combined) | Certified with Findings · ~89% readiness |
| Business contract tests | 28 PASS |
| Personal + cross-surface tests | 36 PASS |
| Part 2H QA (adjudicated) | 23 PASS · 1 P0 (RWS-F1) · 3 KNOWN-PWF |
| Operation matrices | Current — [Re-Audit](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md) (2F) |

---

## 2. Official holder determination

### Model: **Hybrid registration** (one program · two archetype consumers)

Registration is **not** three separate designations. One registered program asset governs two co-surface consumers under a shared Platform Shell reference.

```
Reference Workspace Platform Shell  ← OFFICIAL REGISTERED HOLDER
├── Business Workspace              ← hub archetype consumer
└── Personal Dashboard shell        ← dashboard archetype consumer
```

| Holder layer | Registered identity | Role |
|--------------|---------------------|------|
| **Program (primary)** | `reference-workspace-platform-shell` | Official Reference Workspace Module — copy target for orchestration |
| **Co-surface A** | `business-workspace` | Hub archetype — segment switch, business-mode PlatformShell 3C-4F |
| **Co-surface B** | `personal-dashboard` | Dashboard archetype — widget grid, personal-mode PlatformShell 3C-4E |
| **Sub-tier prerequisite** | PlatformShell 3C-4E / 3C-4F | Chrome primitives — not independently registered |

### Why hybrid (not separate registrations)

| Alternative | Verdict |
|-------------|---------|
| Business Workspace only | ❌ Rejected — charter requires Personal co-surface parity (resolved WS-L1 F-2) |
| Personal Dashboard only | ❌ Rejected — Business is inaugural orchestrator per charter §7 |
| Three independent registrations | ❌ Rejected — fragments ownership; cross-surface transitions are the teachable unit |
| **Combined Platform Shell + dual consumers** | ✅ **Selected** — charter §7.2 co-surface model |

### Registration artifacts

| Artifact | Path | Authority |
|----------|------|-----------|
| Registration review (this doc) | `REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md` | **Registration decision** |
| Platform shell specification | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` | Scope, obligations, exceptions |
| Business routing contract | `WORKSPACE_ROUTING_CONTRACT.md` | Hub archetype invariants |
| Personal routing contract | `PERSONAL_DASHBOARD_ROUTING_CONTRACT.md` | Dashboard archetype invariants |
| Cross-surface map | `CROSS_SURFACE_TRANSITIONS.md` | Transition ownership |
| Business operation matrix | `audits/BUSINESS_WORKSPACE_OPERATION_MATRIX.md` | Hub ownership rows |
| Personal operation matrix | `audits/PERSONAL_DASHBOARD_OPERATION_MATRIX.md` | Grid ownership rows |

### Explicit non-holders

| Surface | Status | Track |
|---------|--------|-------|
| Admin Portal | Unregistered | Future portal annex |
| AI Identity Center | Unregistered | UX Reference #4 adjacent |
| Place Publisher Hub | Unregistered as workspace | UX #6 product track; mounts inside registered business switch |
| Architecture Reference #6 | **Rejected** for shell | Correct — use Reference Workspace track |

---

## 3. Findings list

**12 open findings** carry forward from WS-L2 certification. None revoke registration.

### Business findings

| ID | Finding | Severity | Blocks copy? |
|----|---------|----------|--------------|
| **RWS-F1** | Place segment `/workspace/place` 404; `?module=place` works | **Medium** | Document CE-B1 when copying publisher mounts |
| B-F2 | Legacy `?module=` resolve-only — no sunset policy | Low | No |
| B-F3 | Runtime scope bridge not contract-tested | Low | No |

### Personal findings

| ID | Finding | Severity | Blocks copy? |
|----|---------|----------|--------------|
| P-F2 | Widget interior ad-hoc escalation URLs | Low | No — use shell API for new work |
| P-F3 | `DashboardClient` bootstrap ad-hoc hrefs | Low | No |
| P-F4 | Tab embed not URL-addressable | Low | No — by design |
| P-F5 | Education context product WS-L0 | Medium | No — product track |

### Combined / QA findings

| ID | Finding | Severity | Blocks copy? |
|----|---------|----------|--------------|
| RWS-13 | Work-tab branded path without work-auth | Low | No (KNOWN-PWF) |
| RWS-14 | Place tab embed automation miss | Low | No (KNOWN-PWF) |
| RWS-27 | Notifications via sidebar not header bell | Low | No (KNOWN-PWF) |

### Closed findings (not carry-forward)

B-F1, B-F4, B-F5, P-F1, PD-1–PD-10, L2-B1–L2-B4, REG-B1, REG-B2.

---

## 4. Certified exceptions

Registered exceptions are **binding** for copy targets — new mounts must not violate without charter amendment and matrix update.

### Personal (CE-1–CE-7)

| ID | Exception |
|----|-----------|
| CE-1 | `vlink` module-route without grid widget |
| CE-2 | Utility widgets without module-route contracts |
| CE-3 | `hr`, `scheduling` business-context registry only |
| CE-4 | Renderer map separate from `WIDGET_REGISTRY` |
| CE-5 | `notes` → `notebook` widget alias |
| CE-6 | Widget interior ad-hoc escalation (shell API ready) |
| CE-7 | `DashboardClient` bootstrap ad-hoc hrefs |

### Business (CE-B1–CE-B3)

| ID | Exception |
|----|-----------|
| CE-B1 | Place segment 404 / legacy resolve (RWS-F1) |
| CE-B2 | Legacy `?module=` resolve-only |
| CE-B3 | `notes`/`connections` alias normalization |

### Combined (CE-X1–CE-X2)

| ID | Exception |
|----|-----------|
| CE-X1 | Tab embed not URL-addressable |
| CE-X2 | KNOWN-PWF QA automation gaps (RWS-13/14/27) |

**Authority:** [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md) §3 · operation matrices · widget contract.

---

## 5. Reusable workspace patterns

Pattern IDs are **registered stubs** — authoritative governance in contracts until `WORKSPACE_REFERENCE_PATTERNS.md` extraction (post-registration GOV-1). This section does **not** define WS-L3.

### Reference ownership patterns

| Pattern ID | Owner | Copy when… | Source |
|------------|-------|------------|--------|
| `WS-REF-OWN-001` | Reference Workspace | Mounting any module in business or personal shell | Operation matrix re-audit §3 |
| `WS-REF-NAV-001` | Workspace navigation SSOT | Adding sidebar, tab, or href builder | `businessWorkspaceNavigation.ts` · `personalDashboardNavigation.ts` |
| `WS-REF-SW-001` | Workspace switch authority | Business hub module mount | `BusinessWorkspaceContent.tsx` + routing contract |
| `WS-REF-HUB-001` | Workspace + module | New business switch module | `[Module]WorkspaceLanding.tsx` per `module-development.mdc` |
| `WS-REF-WIDGET-001` | Dashboard platform | New personal grid projection | Widget contract + `WidgetContentRenderer` |
| `WS-REF-XWS-001` | Workspace + helpers | Cross-surface link | `crossSurfaceNavigation.ts` + XWS map |
| `WS-REF-STATE-001` | Workspace runtime | Scope persistence across navigation | `WorkspaceRuntimeScopeBridge` · `DashboardContext` |
| `WS-REF-SCOPE-001` | Workspace | Tenant binding (`dashboardId`, `businessId`) | Routing contracts P-6 / R-1 |
| `WS-REF-FILTER-001` | Business workspace | Installed-module sidebar filter | `BusinessConfigurationContext` |

### Archetype copy targets

| Building… | Copy from registered holder |
|-----------|----------------------------|
| New business hub module | Business routing contract §4 onboarding + `WS-REF-HUB-001` |
| New personal widget | Personal widget contract + drift test |
| Partner iframe mount (future) | Business switch pattern + runtime bridge |
| Portal shell (future) | PlatformShell layering only — not full hub/grid clone |
| Cross-surface deep link | `CROSS_SURFACE_TRANSITIONS.md` + `WS-REF-XWS-001` |

### Recertification triggers (registered)

Re-open registration review when:

1. Stub product UI introduced in workspace switch or widget renderer
2. Navigation SSOT bypass (new ad-hoc workspace URLs without contract update)
3. Registry drift CI removed or failing without waiver
4. PlatformShell consumer regression (3C-4E/4F layering broken)
5. Cross-tenant scope leak across surfaces (P0)
6. Canonical href 404 for mounted switch module (RWS-F1-class)
7. Certified exception violated without documentation
8. Systematic obligation breach (§7)

**Cadence:** Annual or after workspace wave (1x/2x class).

---

## 6. Catalog updates

Applied in this wave:

| Catalog | Update |
|---------|--------|
| `REFERENCE_MODULE_CATALOG.md` | Combined program → **Registered — Approved with Findings**; evidence links |
| `REFERENCE_MODULE_PROGRAM.md` | Reference Workspace Module → **current holder** row |
| `REFERENCE_WORKSPACE_CHARTER_REVIEW.md` | Registration record added |
| `UX_MODERNIZATION_ROADMAP.md` | Registration review wave entry |

### Program roster entry

| Program type | Slot | Holder | Decision | Date |
|--------------|------|--------|----------|------|
| Reference Workspace Module | **Inaugural** | Platform Shell (hybrid) | **Approved with Findings** | 2026-06-14 |

### Relationship to other programs (unchanged)

| Program | Relationship |
|---------|--------------|
| UX References #1–#5 | Orthogonal — module interiors |
| UX Reference #6 Place | Orthogonal — product dual-surface UX |
| Architecture References #1–#5 | Orthogonal — product code L3 |
| PlatformShell 3C | Sub-tier prerequisite within this registration |

---

## 7. Future obligations

Obligations bind teams mounting modules or modifying shell orchestration after registration.

### Mount obligations

| Obligation | Business | Personal |
|------------|----------|----------|
| Registry + contract before mount | Required | Required |
| Navigation via SSOT helpers | Required | Required |
| Hub landing for switch modules | Required | N/A |
| Drift CI pass | Required | Required |
| Operation matrix row update | Required | Required |
| Cross-surface via XWS map | Required | Required |
| No stub product UI in shell | Required | Required |

### Documentation obligations

| Event | Required update |
|-------|-----------------|
| New mounted module | Routing contract canonical table + catalog |
| New certified exception | Platform shell doc §3 + matrix note |
| Cross-surface change | `CROSS_SURFACE_TRANSITIONS.md` + QA matrix row |
| Finding remediation | Registration review addendum or recertification |

### Post-registration follow-on (non-revoking)

| Priority | Item | Type |
|----------|------|------|
| P1 | Business 1E — RWS-F1 / ENG-1 | Engineering (optional) |
| P2 | `WS-REF-*` pattern annex extraction (GOV-1) | Governance |
| P2 | Legacy `?module=` sunset policy (B-F2) | Governance |
| P2 | Runtime scope contract tests (B-F3) | Engineering |
| P3 | Widget escalation adoption (P-F2) | Module scope |
| P3 | CERTIFICATION_LEDGER row update (GOV-3) | Governance |

---

## 8. Official registered program asset

### Decision: **Yes**

The **Reference Workspace Program** is now an **official registered program asset** under the Reference Module Program.

| Attribute | Value |
|-----------|-------|
| Program type | **#3 — Reference Workspace Module** |
| Registered name | **Reference Workspace Platform Shell** |
| Official holders | Business Workspace + Personal Dashboard shell (hybrid) |
| Registration level | WS-L2 Certified with Findings (orchestration bar) |
| Registration decision | **Approved with Findings** |
| Copy authority | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` + routing/XWS contracts |
| Pattern authority | Contract stubs (`WS-REF-*`) until annex extraction |

**What registration grants:**

- Teams may cite this holder as the **canonical orchestration copy target** for workspace mounting, navigation SSOT, cross-surface transitions, and PlatformShell consumer layering.
- Registration appears in `REFERENCE_MODULE_CATALOG.md` and `REFERENCE_MODULE_PROGRAM.md` roster.

**What registration does not grant:**

- WS-L3 certification (separate future review)
- UX or architecture reference slot numbers
- Immunity from recertification triggers
- Automatic pattern annex — extraction remains follow-on

---

## Registration record

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **Effective** | 2026-06-14 |
| **Holder** | Reference Workspace Platform Shell (hybrid: Business + Personal) |
| **Open findings** | 12 |
| **Certified exceptions** | 12 (CE-1–7, CE-B1–3, CE-X1–2) |
| **Next gate** | Optional 1E hygiene · pattern annex · WS-L3 readiness (separate waves) |

---

## Related

- [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](./REFERENCE_WORKSPACE_PLATFORM_SHELL.md)
- [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md)
- [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)
- [REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md](./audits/REFERENCE_WORKSPACE_OPERATION_MATRIX_REAUDIT.md)
- [REFERENCE_MODULE_CATALOG.md](./REFERENCE_MODULE_CATALOG.md)
- [REFERENCE_MODULE_PROGRAM.md](../ux/REFERENCE_MODULE_PROGRAM.md)

---

*Last updated: 2026-06-14 (Inaugural Reference Workspace Registration — Approved with Findings)*
