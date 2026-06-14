# Reference Workspace Program Charter Review (Wave 6C)

**Status:** **Complete** — governance and architecture review; **WS-L1 issued** · **WS-L2 Certified with Findings** · **Registered Approved with Findings** (2026-06-14)  
**Date:** 2026-06-14  
**Wave:** 6C-Reference-Workspace-Charter  
**Program:** [`REFERENCE_MODULE_PROGRAM.md`](../../ux/REFERENCE_MODULE_PROGRAM.md)  
**Prior expansion review:** [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)

> **Reference Workspace registered (Approved with Findings). No engineering in this review.**

---

## Required report

| # | Question | Answer |
|---|----------|--------|
| 1 | Should a Workspace reference track exist? | **Yes** — as a **first-class parallel program** alongside Architecture, UX, and AI certifications |
| 2 | What workspace archetypes exist? | **Six** — hub, split, portal, control-center, publisher, dashboard (see §3) |
| 3 | Certification model recommendation | **Workspace maturity levels WS-L1 / WS-L2 / WS-L3** under Reference Workspace governance — **not** UX scorecard reuse |
| 4 | Candidate ranking and rationale | **1)** Business Workspace · **2)** Personal Dashboard shell · **3)** Admin Portal · **4)** AI Identity Center · **5)** Place Publisher Hub (see §7) |
| 5 | Recommended inaugural Reference Workspace | **Business Workspace** (platform shell orchestrator) with **Personal Dashboard shell** as co-surface in one registration |
| 6 | Recommended next implementation initiative | **Business Workspace Wave 1B** — hub standardization (1A boundary audit **complete** 2026-06-14) |

---

## 1. Executive summary

Vssyl has **mature module-level UX references** (Wave 6A, 56 patterns) and **architecture references** (File Hub, Chat, Calendar, Todo, Place), but **no formal reference for platform workspace orchestration** — how tenants mount modules, switch contexts, persist scope, and render global chrome.

The platform already operates six distinguishable workspace archetypes. **`WorkspaceSplitLayout`** and **`PageHeader`** patterns belong to **UX references** (module interiors). **`PlatformShell`** belongs to a **platform chrome sub-tier** within the Reference Workspace Program. **Business Workspace** (`/business/:id/workspace/*`) is the highest-value inaugural holder: it owns module switching, runtime scope bridging, and business-mode `PlatformShell` — documented at **WS-L1 Stabilizing** in the Wave 0 constitutional audit.

**Strategic recommendation:** Charter the **Reference Workspace Program** as program type **#3** in [`REFERENCE_MODULE_PROGRAM.md`](../../ux/REFERENCE_MODULE_PROGRAM.md), separate from UX numbered slots and architecture module slots. Adopt **WS-L1/L2/L3** maturity levels focused on orchestration, boundary clarity, and hub completeness — not the 11-category UX scorecard. Register **Business Workspace + Personal Dashboard shell** as the inaugural reference after Wave 1A–1C modernization (separate registration wave).

**Place Publisher Hub** is a **publisher sub-archetype** mounted inside Business Workspace; it is the right teachable surface for **UX Reference #6** (dual-surface product UX), not the inaugural workspace reference.

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md`](./BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md) | Wave 0 inventory; WS-L1; Reference #6 rejected for architecture slot |
| [`BUSINESS_WORKSPACE_OPERATION_MATRIX.md`](./BUSINESS_WORKSPACE_OPERATION_MATRIX.md) | Operation ownership |
| [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md) | Runtime kernel, module vs widget |
| [`PLATFORMSHELL_CERTIFICATION.md`](../../ux/audits/PLATFORMSHELL_CERTIFICATION.md) | Platform chrome certified (3C-4F); separate tier |
| [`UX_REFERENCE_PATTERN_CATALOG.md`](../../ux/UX_REFERENCE_PATTERN_CATALOG.md) | Module interior patterns (WS-001–010) |
| [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) | Parallel Reference Workspace track approved |
| [`PLACE_UX_CERTIFICATION_REVIEW.md`](../../ux/audits/PLACE_UX_CERTIFICATION_REVIEW.md) | Dual-surface consumer vs publisher |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | Authoritative module switch |
| `web/src/components/business/DashboardLayoutWrapper.tsx` | Business `PlatformShell` consumer |
| `web/src/app/dashboard/DashboardLayoutInner.tsx` | Personal `PlatformShell` consumer |
| `web/src/app/admin-portal/layout.tsx` | Portal archetype (bespoke) |
| `web/src/app/ai/page.tsx` | Control-center archetype |
| `web/src/components/place/PlaceWorkspaceLanding.tsx` | Publisher hub (mounted in business switch) |
| [`BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md`](./BUSINESS_WORKSPACE_WAVE_1A_BOUNDARY_AUDIT.md) | Wave 1A boundary + ownership (2026-06-14) |
| [`BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md`](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) | Business WS-L1 Certified with Findings (2026-06-14) |
| [`PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md`](./PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md) | Personal Dashboard co-surface boundary audit (2026-06-14) |
| [`PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md`](./PERSONAL_DASHBOARD_WAVE_2B_CLOSEOUT.md) | Personal contract package — routing, widget, XWS, contexts (2026-06-14) |
| [`PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md`](./PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md) | Personal standardization — navigation SSOT, tests, shell wiring (2026-06-03) |
| [`PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md`](./PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) | Personal WS-L1 Certified with Findings (2026-06-03) |
| [`REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md`](./REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) | Combined WS-L2 assessment — **74% → 89%** (2026-06-03) |
| [`REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md`](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) | Combined WS-L2 certification — **Certified with Findings** (2026-06-14) |
| [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../REFERENCE_WORKSPACE_PLATFORM_SHELL.md) | Registration prep package — **Approved with Findings** (2026-06-14) |
| [`REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](./REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) | Inaugural registration — **Approved with Findings** (2026-06-14) |
| [`PERSONAL_DASHBOARD_ROUTING_CONTRACT.md`](../PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | Personal routing SSOT (Wave 2B, enforced 2C) |

---

## 3. Workspace inventory

### 3.1 Surfaces catalog

| Surface | Route / entry | `moduleId`? | Shell class | PlatformShell? | Maturity |
|---------|---------------|-------------|-------------|----------------|----------|
| **Business Workspace** | `/business/:id/workspace/*` | **No** — platform shell | Hub + mount switch | ✅ `DashboardLayoutWrapper` | **WS-L1 Certified with Findings** |
| **Personal Dashboard** | `/dashboard/*`, global tabs | **No** — platform shell | Dashboard + module tabs | ✅ `DashboardLayoutInner` | **WS-L1 Certified with Findings** |
| **Admin Portal** | `/admin-portal/*` | **No** — ops surface | Portal (admin-only) | ❌ Bespoke layout | Unassessed |
| **AI Identity Center** | `/ai?tab=*` | **No** — platform AI surface | Control-center tabs | ❌ `PageHeader` only | UX #4 adjacent |
| **Place consumer** | `/place` | **Yes** (`place`) | Dual-surface consumer | ❌ `PlacePageShell` | UX-L3 Certified |
| **Place Publisher Hub** | `?module=place` in business WS | **Yes** (mounted) | Publisher workspace | ❌ `PageHeader`+`PageToolbar` | UX-L3; hub wired ✅ |
| **Household context** | Dashboard type `household` | **No** | Dashboard variant | ✅ Same as personal | **WS-L0** — no dedicated shell |
| **Business Front Page** | `/business/:id` (employee) | **No** | Adjacent CMS | ❌ Separate registry | Not workspace |
| **Branded Work Tab** | Work tab in personal shell | **No** | Employee parallel entry | Partial | Shares config context |
| **Future Marketplace** | Partner iframe / bundle | TBD | Partner portal | TBD | Not built |
| **Future Partner portals** | Developer / vendor | TBD | Portal | TBD | Pipeline docs only |

### 3.2 Layering model

```
┌─────────────────────────────────────────────────────────────┐
│  Reference Workspace Program (orchestration)                │
│  PlatformShell · module switch · runtime scope · hub mount  │
├─────────────────────────────────────────────────────────────┤
│  UX Reference Program (module interiors)                    │
│  WorkspaceSplitLayout · PageHeader · ConfirmModal · hubs    │
├─────────────────────────────────────────────────────────────┤
│  Architecture Reference Program (module code)               │
│  Services · PE · domain events · tests · manifest           │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** Workspace reference governs **how modules are mounted**; UX reference governs **how module pages look and behave** once mounted.

---

## 4. Workspace archetypes

| Archetype | Definition | Canonical example | Pattern tier |
|-----------|------------|-------------------|--------------|
| **Hub workspace** | Sidebar module list + `switch(currentModule)` mount | Business Workspace | Reference Workspace |
| **Split workspace** | Sidebar \| main \| optional detail | Drive, Todo, Chat, Calendar | UX-PAT-WS-001 (#1 Drive) |
| **Portal workspace** | Role-gated admin nav + sectioned sidebar | Admin Portal | Portal annex (future) |
| **Control-center workspace** | Tabbed settings / identity / intelligence hub | AI Identity Center (`/ai`) | UX #4 + portal-like annex |
| **Publisher workspace** | Business-scoped edit/publish surface for consumer module | Place `PlaceWorkspaceLanding` | UX #6 candidate (product) |
| **Dashboard workspace** | Widget grid + context tabs (personal/business/household) | `DashboardLayoutInner` + `DashboardClient` | Reference Workspace (personal half) |

### Archetype overlap notes

- **Hub ⊃ Publisher:** Publisher hubs mount **inside** hub workspace (`case 'place'`).
- **Split ≠ Hub:** `WorkspaceSplitLayout` is **module interior** — certified under UX refs, not workspace reference.
- **Dashboard ⊃ Household:** Household uses dashboard type + widget grid — no separate household shell file.
- **PlatformShell spans Hub + Dashboard:** One chrome primitive; two mode consumers (`personal` | `business`).

---

## 5. Pattern ownership

### 5.1 Orchestration patterns (Reference Workspace Program)

| Concern | Canonical owner | Key artifacts | Standard (proposed) |
|---------|-----------------|---------------|---------------------|
| **Workspace navigation** | Reference Workspace → Business WS | `businessWorkspaceNavigation.ts`, `DashboardLayoutWrapper` sidebar | `WS-REF-NAV-001` |
| **Workspace switching** | Reference Workspace | `BusinessWorkspaceContent` switch, `resolveBusinessWorkspaceModule` | `WS-REF-SW-001` |
| **Global workspace headers** | Platform Shell sub-tier | `PlatformHeader`, `GlobalHeaderTabs` | 3C-4F certified |
| **Global sidebars / rails** | Platform Shell sub-tier | `PlatformLeftSidebar`, `PlatformRightRail` | 3C-4F certified |
| **Module hub landing mount** | Reference Workspace + UX NAV-001 | `[Module]WorkspaceLanding` in switch | UX-PAT-NAV-001 + `WS-REF-HUB-001` |
| **Workspace permissions** | Reference Workspace runtime | `BusinessConfigurationContext`, `permissionSnapshot` | `WS-REF-PERM-001` |
| **Workspace state persistence** | Reference Workspace runtime | `DashboardContext`, URL params, `WorkspaceRuntimeScopeBridge` | `WS-REF-STATE-001` |
| **Cross-workspace transitions** | Reference Workspace | Global dashboard tabs, `router.push` href builders | `WS-REF-XWS-001` |
| **Installed-module filtering** | Reference Workspace | `PositionAwareModuleProvider`, `displayModules` | `WS-REF-FILTER-001` |
| **Tenant scope binding** | Reference Workspace | `businessId` + `businessDashboardId` propagation | `WS-REF-SCOPE-001` |

### 5.2 Module interior patterns (UX Reference Program — unchanged)

| Concern | Owner | Pattern |
|---------|-------|---------|
| Split columns inside a module | UX #1 Drive | UX-PAT-WS-001 |
| PageHeader + PageToolbar inside module | UX #3 Todo | UX-PAT-WS-002 |
| Management feed (no split) | UX #2 Notifications | UX-PAT-WS-010 |
| Business hub landing **content** | UX #3 Todo | UX-PAT-NAV-001 |
| Time-grid shell | UX #5 Calendar | UX-PAT-WS-004 |
| Twin workspace | UX #4 AI | UX-PAT-WS-009 |
| Graph / dual-surface consumer | Place UX #6 (future) | UX-PAT-PLC-* / GRPH-* |

### 5.3 Explicit non-ownership

| Surface | Must NOT own |
|---------|--------------|
| Business Workspace shell | File mutations, chat messages, HR records, analytics metrics, business CRUD |
| Personal Dashboard shell | Module business logic, widget implementations |
| Admin Portal | Product module mounts, tenant module switch |
| Place Publisher Hub | Platform navigation, cross-module install list |

---

## 6. Certification model

### 6.1 Options evaluated

| Model | Pros | Cons | Verdict |
|-------|------|------|---------|
| **A — Reference-only governance** (no levels) | Lightweight | No progression signal; audit already uses "L1 Stabilizing" informally | ⚠️ Too thin |
| **B — Reuse UX-L1/L2/L3 scorecard** | Single certification language | Wrong categories (ConfirmModal, trash) for shell; conflates orchestration with interaction | ❌ Reject |
| **C — Workspace WS-L1/L2/L3** | Matches platform standards tier language; orchestration-focused | New scorecard needed | ✅ **Recommended** |
| **D — Architecture L3 for shell** | Existing ledger | Shell has no services/manifest/PE like product modules | ❌ Reject |

### 6.2 Recommended: Workspace maturity levels (WS-L1 / WS-L2 / WS-L3)

| Level | Name | Criteria (summary) |
|-------|------|-------------------|
| **WS-L1** | **Stabilizing** | Boundary audit complete; single navigation source; `PlatformShell` adopted; module switch authoritative; runtime bridge present |
| **WS-L2** | **Consistent** | All business modules use hub pattern (Landing or documented Layout); no stub product UI in shell switch; segment URL policy; contract tests on navigation |
| **WS-L3** | **Reference-ready** | Registration doc; operation matrix green; hub completeness gate; cross-workspace transition QA; pattern annex in workspace standards doc |

**Relationship to other programs:**

| Program | Levels | Scope |
|---------|--------|-------|
| Architecture Reference | L1–L3 (code) | `moduleId` services, PE, tests |
| UX Reference | UX-L1–L3 (interaction) | Scorecard 11 categories |
| **Reference Workspace** | **WS-L1–L3 (orchestration)** | Shell, mount, runtime, hub contract |
| AI Platform | G0–G4 | Twin pipeline, providers |
| PlatformShell (sub-tier) | 3C certification | Chrome primitives — prerequisite for WS-L2 |

**Registration:** Reference Workspace uses `REFERENCE_WORKSPACE_[SURFACE].md` — not numbered architecture slots, not UX #6.

---

## 7. Candidate evaluation

### 7.1 Scoring matrix

| Candidate | Archetype fit | Platform importance | Uniqueness | Boundary clarity | Hub completeness | Readiness | Rank |
|-----------|---------------|----------------------|------------|------------------|------------------|-----------|------|
| **Business Workspace** | Hub ✅ | **Critical** | High (orchestrator) | 🟡 Improving (Wave 0) | 🔴 Stubs (dashboard/analytics/members) | **WS-L1** | **#1** |
| **Personal Dashboard shell** | Dashboard ✅ | **Critical** | Medium (pairs with business) | 🟢 | 🟡 Widget grid mature; Work/Place tabs | **WS-L1** partial | **#2** |
| **Admin Portal** | Portal ✅ | High (ops) | High (admin-only) | 🟢 Isolated | N/A (not module hub) | Unassessed | **#3** |
| **AI Identity Center** | Control-center ✅ | High | Medium | 🟢 | N/A | UX #4 CwF adjacent | **#4** |
| **Place Publisher Hub** | Publisher ✅ | High for Place | Low as workspace ref (subset of hub) | 🟢 | ✅ Wired | UX-L3 | **#5** |

### 7.2 Per-candidate rationale

**Business Workspace (#1 — inaugural)**

- Owns **16-case module switch**, `businessWorkspaceNavigation`, `BusinessLayoutRuntimeShell`, business-mode `PlatformShell`.
- Wave 0 audit complete; operation matrix exists.
- Gaps are **orchestration gaps** (dead landings, stub widgets, dual URL model) — exactly what Reference Workspace program should drive.
- **Not** architecture Reference #6 (audit §8) — correct; different program.

**Personal Dashboard shell (#2 — co-surface)**

- `DashboardLayoutInner` is the **personal-mode** `PlatformShell` consumer (3C-4E certified).
- Household/education contexts reuse this shell.
- Should register **together** with Business Workspace as **"Platform Shell Workspace Reference"** — one program, two mode consumers.

**Admin Portal (#3 — future portal annex)**

- Bespoke sidebar; does not use `PlatformShell`.
- Teachable for **portal archetype** but ops-specific; defer inaugural registration.
- Proposed: **Portal pattern annex** after WS-L3 platform shell reference.

**AI Identity Center (#4 — not workspace inaugural)**

- `/ai` is tabbed control-center; overlaps **UX Reference #4** (AI Experience).
- Already has UX-PAT-NAV-004, WS-009 patterns extracted.
- Workspace program should **reference** UX #4, not duplicate.

**Place Publisher Hub (#5 — UX track, not workspace inaugural)**

- `PlaceWorkspaceLanding` is **mounted inside** Business Workspace — correct integration ✅.
- Dual-surface teaching belongs to **UX Reference #6** (consumer `PlacePageShell` + publisher hub).
- Wave 6C expansion review already ranked Place as UX #6, not workspace reference.

---

## 8. Relationship to other reference programs

| Question | Answer |
|----------|--------|
| Separate from UX References? | **Yes** — UX refs are `moduleId` interaction copy targets; workspace ref is platform orchestration |
| Separate from Architecture References? | **Yes** — arch refs are code L3 for product modules; shell has no manifest/entities |
| Separate from AI Certifications? | **Yes** — AI platform has G0 constitution; workspace mounts AI widgets but does not certify twin pipeline |
| Compete with UX #6 Place? | **No** — orthogonal; Place #6 = product dual-surface UX; Workspace = mount + chrome |
| Replace PlatformShell certification? | **No** — PlatformShell is **sub-tier prerequisite** within Reference Workspace |

### Program hierarchy (recommended)

```
Reference Module Program
├── Reference UX Module (#1–#5 baseline, #6+ expansion)
├── Reference Architecture Module (#1–#5 ledger)
├── Reference Workspace Module ← NEW FORMAL CHARTER (this wave)
├── Reference AI Module (platform layer)
└── Reference Calendar Module (program type legacy slot — UX #5 holds scheduling UX)
```

---

## 9. Gap analysis vs Wave 6A patterns

| Wave 6A pattern | Workspace program gap |
|-----------------|----------------------|
| UX-PAT-NAV-001 Hub landing | **Mount contract** undefined — HR/Scheduling landings dead on disk |
| UX-PAT-WS-001 Split layout | ✅ Module-owned — no workspace gap |
| PlatformShell 3C-4F | ✅ Adopted both modes — workspace gap is **consumer consistency** not primitive absence |
| UX-PAT-WS-010 Management shell | N/A for hub shell |
| Cross-module deep linking | **WS-REF-XWS-001** needed for business ↔ personal ↔ place transitions |

**New workspace pattern family (proposed Wave 6E extraction):** `WS-REF-*` patterns in future `WORKSPACE_REFERENCE_PATTERNS.md` — mirror Wave 6A but orchestration-only. **Not in scope this wave.**

---

## 10. Strategic roadmap (12–24 months)

| Window | Initiative | Outcome |
|--------|------------|---------|
| **Q2 2026** | **Business Workspace Wave 1A** ✅ | Boundary + ownership audit |
| **Q2 2026** | **Business Workspace Wave 1B** ✅ | Hub standardization; retire stubs |
| **Q2 2026** | **Business Workspace Wave 1C** ✅ | Navigation contracts + CI drift tests |
| **Q2 2026** | **WS-L1 certification** ✅ | **Certified with Findings** — [`BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md`](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) |
| **Q2 2026** | **Personal Dashboard Wave 2A** ✅ | Co-surface boundary audit — [PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md](./PERSONAL_DASHBOARD_WAVE_2A_AUDIT.md) |
| **Q2–Q3 2026** | **Wave 2C** ✅ | Personal navigation enforcement + shell wiring — [PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md](./PERSONAL_DASHBOARD_WAVE_2C_CLOSEOUT.md) |
| **Q2–Q3 2026** | **Personal WS-L1** ✅ | **Certified with Findings** — [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) |
| **Q2–Q3 2026** | **WS-L2 assessment** ✅ | **74% combined readiness** — [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) |
| **Q3 2026** | **WS-L2 prerequisites** | Wave **1D** · Personal drift test · cross-surface QA |
| **Q2 2026** | **WS-L2 certification** ✅ | **Certified with Findings** — [`REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md`](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |
| **Q3–Q4 2026** | **Reference Workspace registration** | `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` draft · WS-L3 prep |
| **Parallel** | **6B-Place-Ref6-Prep** | UX #6 — publisher/consumers patterns |
| **2027** | **Portal annex** | Admin Portal pattern guide (if ops shell stabilizes) |

---

## 11. Recommended next implementation initiative

**Primary:** **Business Workspace Wave 1D** — orphan segment page hygiene per [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) §7.

**Completed:**

1. ~~**1A**~~ — Boundary audit — **Done** (2026-06-14)
2. ~~**1B**~~ — Hub pattern standard — **Done** (2026-06-14)
3. ~~**1C**~~ — Navigation contract tests — **Done** (2026-06-14)
4. ~~**WS-L1**~~ — Certification review — **Certified with Findings** (2026-06-14)

**Follow-on:** ~~registration review~~ **Done** · optional Business 1E (RWS-F1) · pattern annex (GOV-1) · WS-L3 readiness (separate wave)

**Not next:** WS-L3 certification in same wave · merging workspace into UX #6 · Admin Portal inaugural registration.

---

## 12. Constraints honored

- ✅ Governance and architecture review only  
- ✅ No designation awards (registration not performed)  
- ✅ WS-L1 certification issued for **Business Workspace** and **Personal Dashboard shell** (2026-06-03)  
- ✅ No council action  
- ✅ No engineering  

---

## WS-L1 certification record (2026-06-03)

| Surface | Level | Decision | Review |
|---------|-------|----------|--------|
| **Business Workspace** | **WS-L1** | **Certified with Findings** | [BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md](./BUSINESS_WORKSPACE_WS_L1_CERTIFICATION_REVIEW.md) |
| **Personal Dashboard shell** | **WS-L1** | **Certified with Findings** | [PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md](./PERSONAL_DASHBOARD_WS_L1_CERTIFICATION_REVIEW.md) |

**Registration readiness:** Eligible for Reference Workspace **prep** — both co-surfaces WS-L1 certified; WS-L2 **Certified with Findings** (2026-06-14); registration doc drafting **may proceed**; designation review blocked.

---

## WS-L2 certification record (2026-06-14)

| Surface | Level | Decision | Review |
|---------|-------|----------|--------|
| **Business Workspace** | **WS-L2** | **Certified with Findings** | [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) §1 |
| **Personal Dashboard shell** | **WS-L2** | **Certified with Findings** | [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) §2 |
| **Combined Reference Workspace Program** | **WS-L2** | **Certified with Findings** | [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) §3–4 |

**Readiness at certification:** Combined **~89%** · Business **90%** · Personal **88%**

**Open findings:** RWS-F1 (Place segment 404) · B-F2/B-F3 · P-F2–P-F5 · 3 KNOWN-PWF QA items

**Registration readiness:** Prep **complete** — REG-B2 closed (2026-06-14). Formal registration review may open **Approved with Findings**. Designation award blocked on REG-B3 partial + RWS-F1.

**`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`:** ✅ **Drafted** — [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](../REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

---

## Registration record (2026-06-14)

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **Holder** | Reference Workspace Platform Shell — **hybrid** (Business Workspace + Personal Dashboard shell) |
| **Program type** | Reference Workspace Module #3 (inaugural) |
| **Open findings** | 12 (RWS-F1 primary) |
| **REG-B1** | ✅ Closed |
| **REG-B2** | ✅ Closed |
| **REG-B3** | 🟡 Partial — waived for CwF registration |

**Review:** [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](./REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md)  
**Specification:** [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](../REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

---

## Registration prep record (2026-06-14)

| Gate | Status |
|------|--------|
| REG-B1 WS-L2 certified | ✅ Closed |
| REG-B2 Registration shell doc | ✅ **Closed** — platform shell prep package |
| REG-B3 WS-L3 items | 🟡 Partial — pattern annex open |
| Prep recommendation | **Approved with Findings** |
| Designation award | ❌ Not this wave |

**Review:** [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](../REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

---

## WS-L2 assessment record (2026-06-03)

| Metric | Value |
|--------|-------|
| Combined WS-L2 readiness | **74%** |
| Business Workspace | **82%** |
| Personal Dashboard | **79%** |
| WS-L2 certification | ✅ **Certified with Findings** (2026-06-14) |
| WS-L2 certification review | ✅ **Complete** — [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](./REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) |
| Registration prep | **May begin** (governance drafting only) |

**Review:** [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md)

**WS-L2 blockers:** ~~L2-B1~~ **1D** · ~~L2-B2~~ **2D** · ~~L2-B3~~ **2E** · ~~L2-B4~~ **2F closed**

**Post-2E combined WS-L2 readiness:** **~87%** · **RWS-F1** Place segment gap

**Post-2F combined WS-L2 readiness:** **~89%** · **0 WS-L2 process blockers** · WS-L2 certification review **may proceed**

---

## Personal Dashboard governance status (Wave 2C — 2026-06-03)

| Deliverable | Status |
|-------------|--------|
| [PERSONAL_DASHBOARD_ROUTING_CONTRACT.md](../PERSONAL_DASHBOARD_ROUTING_CONTRACT.md) | ✅ |
| [PERSONAL_DASHBOARD_WIDGET_CONTRACT.md](../PERSONAL_DASHBOARD_WIDGET_CONTRACT.md) | ✅ |
| [CROSS_SURFACE_TRANSITIONS.md](../CROSS_SURFACE_TRANSITIONS.md) | ✅ |
| [PERSONAL_CONTEXT_VARIANTS.md](../PERSONAL_CONTEXT_VARIANTS.md) | ✅ |
| `personalDashboardNavigation.ts` + tests | ✅ (2C) |
| `crossSurfaceNavigation.ts` + tests | ✅ (2C) |
| Personal WS-L1 certification | ✅ **Certified with Findings** |

### PD-1 through PD-10 disposition (final)

| ID | Final disposition |
|----|-------------------|
| **PD-1** | ✅ Closed — `personalDashboardNavigation.ts` |
| **PD-2** | ✅ Closed — routing contract |
| **PD-3** | ✅ Closed — navigation tests |
| **PD-4** | ✅ Closed — `crossSurfaceNavigation.ts` |
| **PD-5** | ✅ Closed — widget contract |
| **PD-6** | ✅ Closed — chat layout normalized |
| **PD-7** | ✅ Closed — `resolvePersonalDashboardModule` |
| **PD-8** | ✅ Closed — context variants annex |
| **PD-9** | ✅ Closed — registry-aligned runtime fallback |
| **PD-10** | ✅ Closed — AI rail + UX #4 SSOT |

### WS-L2 readiness assessment (2026-06-03)

| Gate | Status |
|------|--------|
| Personal governance package | ✅ **Complete** (2B) |
| Personal navigation enforcement | ✅ **Complete** (2C) |
| Personal WS-L1 certification | ✅ **Certified with Findings** |
| Business WS-L1 certification | ✅ **Certified with Findings** |
| Combined WS-L2 assessment | ✅ **Complete — 85%** (post-2D) |
| Combined WS-L2 certification | ✅ **Certified with Findings** (2026-06-14) |
| Registration doc | ⏳ Drafting **may proceed** |
| Business orphan route hygiene | ✅ **1D complete** |
| Personal registry drift enforcement | ✅ **2D complete** |

**WS-L2 verdict:** ✅ **Certified with Findings** (2026-06-14) — **~89%** combined readiness at certification. Registration prep (governance drafting) may proceed; designation review blocked.

Detail: [REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md](./REFERENCE_WORKSPACE_WS_L2_ASSESSMENT.md) · [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md)

---

## Personal Dashboard governance status (Wave 2D — 2026-06-03)

| Deliverable | Status |
|-------------|--------|
| `personalDashboardRegistryDrift.test.ts` | ✅ **15 tests PASS** |
| Drift parity with Business Workspace | ✅ |
| L2-B2 | ✅ **Closed** |

Detail: [PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md](./PERSONAL_DASHBOARD_WAVE_2D_CLOSEOUT.md)

---

## Related

- [`UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](../../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)
- [`REFERENCE_MODULE_CATALOG.md`](../REFERENCE_MODULE_CATALOG.md)
- [`WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md`](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)
- [`PLATFORMSHELL_CERTIFICATION.md`](../../ux/audits/PLATFORMSHELL_CERTIFICATION.md)

---

**Last updated:** 2026-06-14 (Inaugural Reference Workspace Registration — Approved with Findings)
