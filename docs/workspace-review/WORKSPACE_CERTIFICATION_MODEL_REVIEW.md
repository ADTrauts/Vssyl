# Workspace Certification Model Review

**Program:** Workspace & Dashboard Constitutional Review  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — no certification execution, no ledger changes, no council activity

**Authority:** [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md), [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md), [moduleSpecs.md](../../memory-bank/moduleSpecs.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §13

---

## Purpose

Evaluate whether Dashboard, Personal Workspace, Business Workspace, and Analytics use the correct certification tracks. Recommend governance model for post-WS-L3 portfolio state.

---

## 1. Certification taxonomy (platform)

| Track | Levels | Applies to | Examples |
|-------|--------|------------|----------|
| **Module L1–L4** | Stabilizing → Reference Implementation | Registered product modules with manifest | File Hub L4, Chat L3, Dashboard L1 |
| **WS-L1–WS-L3** | Workspace shell maturity | Platform shell programs (orchestration) | Reference Workspace WS-L3 CwF |
| **Platform domain L3** | Control plane / capability domains | Non-module platform programs | Admin Portal, Context Graph, Account Platform |
| **UX Reference** | Independent UX program | Module interior UX | Drive UX #1, Todo UX #3 |
| **BO subdomain L3 CwF** | Domain program under Business Operations | BO modules | HR, Scheduling, Workforce Comms |

**Rule:** Tracks are **orthogonal**. A WS-L3 certificate does not imply module L3 for any mounted module or for the Dashboard widget product.

---

## 2. Current certification state

| Domain | Track | Level | Designation | Program status |
|--------|-------|-------|-------------|----------------|
| **Reference Workspace (combined)** | WS | **WS-L3 CwF** | Reference Workspace With Findings | **ARCHIVED** |
| **Business Workspace co-surface** | WS | WS-L3 CwF (co-surface) | Same program row | ARCHIVED |
| **Personal Dashboard shell co-surface** | WS | WS-L3 CwF (co-surface) | Same program row | ARCHIVED |
| **Dashboard module** | Module | **L1 Stabilizing** | None | Wave 3 not started |
| **Analytics** | **Ambiguous** | **L1 (ledger)** | Pseudo-module | Scope undecided |
| **Admin Portal analytics** | Platform domain | **L3 CwF** | Control plane | ARCHIVED |

### WS-L3 explicit exclusions (WORKSPACE_CERTIFICATION_RECORD)

The WS-L3 award **is NOT**:

- Dashboard **module** L3 (`DashboardClient` widget grid)
- Plain WS-L3 promotion path (deferred — ENG-2, REG-B3, 11 advisories)
- WS-L4 / Architecture Reference Module
- Authorization for new workspace modernization program waves

---

## 3. Per-domain certification model

### 3.1 Business Workspace shell

| Dimension | Model |
|-----------|-------|
| **Class** | Platform shell co-surface |
| **Correct track** | WS (Reference Workspace program) — **complete** |
| **Module L3?** | **No** — no manifest, no moduleId, hybrid D identity |
| **Next governance** | Advisory burn-down (B-F2, B-F3); plain WS-L3 deferred |
| **Incorrect model today?** | Ledger co-surface row is correct; stub product UI in switch is **not** certifiable as module |

### 3.2 Personal Dashboard shell (Personal Workspace)

| Dimension | Model |
|-----------|-------|
| **Class** | Platform shell co-surface (dashboard archetype) |
| **Correct track** | WS — **complete** at WS-L3 CwF |
| **Module L3?** | **No** for shell — `DashboardLayoutInner` is orchestration |
| **Next governance** | Advisory burn-down (P-F2–P-F5); ENG-2 runtime scope tests for plain WS-L3 path |
| **Incorrect model today?** | WS-L1 cert scope included `DashboardClient` in component table — creates naming confusion; product interior is **module scope** per WS-L3 award clarification |

### 3.3 Dashboard module

| Dimension | Model |
|-----------|-------|
| **Class** | True product module (widget/grid) |
| **Correct track** | **Independent Module L1 → L3** |
| **WS track?** | **No** — explicitly out of WS-L3 scope |
| **Target designation** | L3 module certification (highest remaining product priority per portfolio refresh) |
| **Incorrect model today?** | Portfolio treats "Dashboard" as single L1 gap without shell/module split; ledger row does not note hybrid |

**Recommended ledger annotation (future governance):** `Dashboard module · L1 · shell certified under WS-L3 program · independent L3 track`

### 3.4 Analytics

| Dimension | Model |
|-----------|-------|
| **Class** | Platform capability (+ optional business product surface) |
| **Correct track** | **Platform capability L2 → L3 charter** — not default module L3 |
| **Module L3?** | **Only if scope lock adds manifest, services, owned metrics schema** |
| **Admin Portal?** | Operator slice **already L3** — separate row |
| **Incorrect model today?** | Ledger lists as product module peer to Dashboard; runtime pseudo-module without registration |

**Recommended ledger reclassification (future governance):** Split into `Platform Analytics Capability (L1)` + note `Business tenant analytics surface (unbuilt)` — remove false parity with Dashboard module row.

---

## 4. Certification track decision matrix

| If the work is… | Use track | Example |
|-----------------|-----------|---------|
| Shell routing, switch, PlatformShell, navigation SSOT | WS advisories / plain WS-L3 path | B-F2 sunset, ENG-2 tests |
| Widget registry, grid CRUD, dashboard API | **Module L3** | Dashboard Wave 3 |
| Operator MRR/growth/BI | **Admin Portal** (done) | Platform Analytics |
| Cross-tenant rollups, event subscribers | **Platform capability L2+** | Analytics pipeline |
| HR attendance/time-off charts | **Module L3 interior** | HR analytics pages |
| Module page UX polish | **UX Reference** | Separate from architecture L3 |

---

## 5. Required questions — certification model

| # | Question | Answer |
|---|----------|--------|
| 3 | Dashboard independent certification track? | **Yes** — Module L3, separate from archived WS-L3 |
| 4 | Dashboard governed by Workspace? | **Shell layers only** — already certified; module product is not |
| 5–8 | Analytics tracks | **Platform capability** (+ Admin Portal for operator); **not** Dashboard-owned |
| 9 | Incorrect modeling? | Ledger pairs Dashboard + Analytics as product modules; WS-L3 scope conflated in portfolio priority naming |
| 10 | Long-term architecture | Three-track coexistence: WS (shell, archived), Module L3 (Dashboard product), Platform capability (Analytics) |

---

## 6. Dashboard Wave 3 vs Workspace Experience

| Program option | Certification impact | Verdict |
|----------------|------------------------|---------|
| **Dashboard Module Wave 3** | Advances module L1 → L2/L3; does not touch WS ledger | **Authorize (qualified)** |
| **Workspace Experience modernization** | Would reopen archived WS-L3 program | **Reject as replacement** |
| **WS advisory burn-down** | 90-day plan under existing certificate | **Continue in parallel** — not a portfolio initiative |

**Qualified authorization means:**

- Charter title: **Dashboard Module Wave 3**
- Explicit out-of-scope: Personal/Business shell (WS-L3 archived), PlatformShell, navigation SSOT
- In-scope: widget registry, `dashboardService`, activity, PE, business hub delegation, tenancy boundary analysis

---

## 7. Analytics certification path options

| Option | Description | When to choose |
|--------|-------------|--------------|
| **A. Platform capability L2 charter** | Service layer, subscriber activation, operation matrix | **Recommended default** |
| **B. Product module L3** | Full manifest, WorkspaceLanding, domain services, entities | Only after scope lock defines owned metrics SoR |
| **C. No certification** | Defer until Domain Events + Activity L2 | If platform kernel prioritized first |

**Do not** run Analytics module L3 in parallel with Dashboard Module Wave 3 without scope lock — dependency on event taxonomy and activity read honesty.

---

## 8. G1–G9 applicability

| Domain | G1–G9 workspace gates | G1–G9 module gates |
|--------|----------------------|-------------------|
| Business Workspace shell | ✅ Scored 23/27 at WS-L3 | ❌ N/A |
| Personal Dashboard shell | ✅ Same program | ❌ N/A |
| Dashboard module | ❌ Not scored under WS | 🟡 Would score ~L1 partial if audited today |
| Analytics | ❌ N/A | ❌ Fails module checklist — capability audit needed |

---

## 9. Governance recommendations (no execution)

1. **Portfolio docs:** Split "Dashboard" references into **Dashboard module** vs **Personal Dashboard shell**.
2. **Ledger (future council):** Annotate Dashboard hybrid; reclassify Analytics from product module to platform capability.
3. **Wave 3 charter:** Module-only scope with tenancy boundary workstream.
4. **Analytics:** Scope lock before any certification program registration.
5. **Do not reopen** Reference Workspace certification program for Dashboard work.

---

## 10. Related records

| Document | Role |
|----------|------|
| [WORKSPACE_PROGRAM_ARCHIVE.md](../workspace/WORKSPACE_PROGRAM_ARCHIVE.md) | WS program closed |
| [WORKSPACE_POST_RATIFICATION_ROADMAP.md](../workspace/WORKSPACE_POST_RATIFICATION_ROADMAP.md) | Advisory themes |
| [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) §5.6–5.8 | Wave definitions |
| [WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md](./WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md) | Implementation inventory |

---

**Last updated:** 2026-06-21
