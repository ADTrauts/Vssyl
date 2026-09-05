# Vssyl Reference Module Program

**Status:** Wave 6C-Reference-Workspace-Charter complete (2026-06-14)  
**Authority:** Formal registration of platform reference modules across UX and architecture tracks  
**Certification standard:** [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md)  
**Scorecard:** [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)

---

## Purpose

Reference modules are **canonical examples** other teams copy. Registration is explicit — not implied by partial modernization waves.

Each reference type has a **slot** (numbered), a **certification process**, and a **registration artifact** in `docs/ux/audits/` or `docs/architecture/audits/`.

---

## Reference types

| Slot | Type | What it benchmarks | Primary evidence |
|------|------|-------------------|------------------|
| **#1** | **Reference UX Module** | Visual/interaction/layout patterns for product modules | UX scorecard + interaction certification |
| **#2** | **Reference Architecture Module** | Code structure, services, tests, module contract (L3 code) | Architecture certification ledger |
| **#3** | **Reference Workspace Module** | Business/personal workspace hub + shell integration | Platform shell + hub audits |
| **#4** | **Reference AI Module** | AI context, providers, action executors, twin integration | AI platform constitution + module AI manifest |
| **#5** | **Reference Calendar Module** | Scheduling/calendar UX + time-grid interaction patterns | [`audits/REFERENCE_MODULE_CALENDAR.md`](./audits/REFERENCE_MODULE_CALENDAR.md) |

**Note:** Architecture Reference Module slots (e.g. Place #5 architecture) are tracked separately in [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md). UX and architecture reference designations are **independent**.

---

## Reference UX Module

### Definition

A product `moduleId` whose user-facing surfaces demonstrate **UX-L3 Certified with Findings** or better and are registered as the copy target for:

- ConfirmModal / trash contracts
- Layout shells (`WorkspaceSplitLayout`, management primitives)
- Menu primitives (`ContextMenu`, `DropdownMenu`, `Popover`)
- Module hub landing pattern
- Empty/loading/error states

### Certification process

| Step | Action | Output |
|------|--------|--------|
| 1 | Complete modernization waves for interaction + layout + menus | Wave closeouts in `docs/ux/audits/` |
| 2 | Run module scorecard (11 categories) | `[MODULE]_UX_SCORECARD.md` |
| 3 | Publish interaction certification | `[MODULE]_INTERACTION_CERTIFICATION.md` |
| 4 | Execute manual QA matrix (or document waiver) | Signed matrix or waiver note |
| 5 | Council decision: Approved / Approved with Findings / Rejected | Registration doc |
| 6 | Register benchmark | `REFERENCE_MODULE_[MODULE].md` |

### Current holders

| Slot | Module | Status | Registration |
|------|--------|--------|--------------|
| **Reference UX #1** | Drive / File Hub | **Approved with Findings** | [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md) |
| **Reference UX #2** | Notifications | **Approved with Findings** | [`audits/REFERENCE_MODULE_NOTIFICATIONS.md`](./audits/REFERENCE_MODULE_NOTIFICATIONS.md) |
| **Reference UX #3** | Todo | **Approved with Findings** | [`audits/REFERENCE_MODULE_TODO.md`](./audits/REFERENCE_MODULE_TODO.md) |
| **Reference UX #4** | AI Experience | **Approved with Findings** | [`audits/REFERENCE_MODULE_AI.md`](./audits/REFERENCE_MODULE_AI.md) |
| **Reference UX #5** | Calendar | **Approved with Findings** | [`audits/REFERENCE_MODULE_CALENDAR.md`](./audits/REFERENCE_MODULE_CALENDAR.md) |

> **Note:** UX Reference #5 (Calendar scheduling UX) is **independent** of Architecture Reference Module #5 (Place). UX Reference #2 (Notifications inbox UX) is **independent** of Architecture Reference Module #2 (Chat). UX Reference #3 (Todo task workspace UX) is **independent** of Architecture Reference Module #4 (Todo code). UX Reference #4 (AI Experience twin/chat UX) is **independent** of program type #4 Reference AI Module (platform layer). See [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).

### Vacant slots (expansion tier)

| Slot | Designated purpose | Status |
|------|-------------------|--------|
| **Reference UX #6** | Graph + dual-surface consumer/publisher (Place primary candidate) | **Vacant** — Place **Eligible With Findings**; registration deferred |

**Baseline tier (frozen):** UX slots **#1–#5** registered and pattern-extracted (Wave 6A). Maintain via recertification only.

**Clarification:** UX **#4** (product AI chat surfaces) is **independent** of program type **#4 Reference AI Module** (platform layer — [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)).

**Expansion tier (governed):** UX **#6+** requires council + registration doc + pattern annex (Wave 6D extraction). **Chat UX Reference #2 was Rejected** at Wave 5B.3 — superseded by Notifications registration. Domain modules (HR, Scheduling, Marketplace, Analytics) use **pattern annexes** — not numbered UX slots — per Wave 6C review.

---

## Reference Architecture Module

### Definition

Code-level L3 certification per platform standards: service extraction, policy engine, domain events, tests, manifest completeness.

### Certification process

1. Constitutional audit + operation matrix
2. Implementation waves per architecture roadmap
3. Entry in [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md)
4. Reference Module Catalog update

### Relationship to UX

Architecture L3 **does not imply** UX-L3. Drive holds both strong architecture reference status and UX Reference #1.

---

## Reference Workspace Module

### Definition

Platform shell + workspace runtime — **not** a product `moduleId`. Governs **orchestration**: module mounting, tenant scope, global chrome, hub contracts, and cross-workspace transitions.

**Orthogonal to:**

- **UX references** — module interior interaction (`WorkspaceSplitLayout`, ConfirmModal, hub landing *content*)
- **Architecture references** — module code L3 (services, PE, manifest)
- **UX Reference #6 Place** — dual-surface *product* UX; publisher hub mounts inside business workspace switch

### Certification process (Workspace maturity — WS-L1 / WS-L2 / WS-L3)

| Level | Name | Gate |
|-------|------|------|
| **WS-L1** | Stabilizing | Boundary audit; single navigation source; `PlatformShell` adopted; module switch authoritative; runtime bridge present |
| **WS-L2** | Consistent | Hub pattern complete (no dead landings); no stub product UI in shell; segment URL policy; navigation contract tests |
| **WS-L3** | Reference-ready | Registration doc; operation matrix green; cross-workspace QA; `WS-REF-*` pattern annex |

**Not** the UX 11-category scorecard. **Not** architecture L3.

### Platform Shell sub-tier

`PlatformShell`, `PlatformHeader`, `PlatformLeftSidebar`, `PlatformRightRail` are **chrome primitives** — certified Wave 3C-4F ([`PLATFORMSHELL_CERTIFICATION.md`](./audits/PLATFORMSHELL_CERTIFICATION.md)). Prerequisite for WS-L2; owned under Reference Workspace Program, not UX references.

### Current holder

| Slot | Surface | Status | Registration |
|------|---------|--------|--------------|
| **Reference Workspace (inaugural)** | Platform Shell — hybrid (Business + Personal) | **Approved with Findings** | [`REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) |

**Co-surface consumers:**

| Consumer | Archetype | Chrome |
|----------|-----------|--------|
| **Business Workspace** | Hub | `DashboardLayoutWrapper` → PlatformShell 3C-4F |
| **Personal Dashboard shell** | Dashboard | `DashboardLayoutInner` → PlatformShell 3C-4E |

### Current status (surfaces)

| Surface | WS level | Registration |
|---------|----------|--------------|
| **Business Workspace** | **WS-L2** Certified with Findings | ✅ **Registered** (hub co-surface) |
| **Personal Dashboard shell** | **WS-L2** Certified with Findings | ✅ **Registered** (dashboard co-surface) |
| Admin Portal | Unassessed | Portal annex (deferred) |
| AI Identity Center | UX #4 adjacent | Not workspace inaugural |
| Place Publisher Hub | Mounted in business switch | UX #6 track — not workspace reference |

**Charter:** [`../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md) (Wave 6C, 2026-06-14).

**Registration:** [`REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md) — **Approved with Findings** (2026-06-14).  
**Specification:** [`REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md).

**Next:** Optional Business 1E (RWS-F1) · pattern annex (GOV-1) · WS-L3 readiness (separate wave).

---

## Reference AI Module

### Definition

Module demonstrating complete **ModuleAIContext**, context providers, optional action executors, and AI manifest alignment per `docs/guides/AI_CONTEXT_PROVIDER_API.md` and `memory-bank/moduleSpecs.md` (AI if AI-exposed).

### Certification process

1. AI manifest + provider audit
2. Latency and bounded result sets verified
3. Constitutional alignment (G0 framework)
4. Registration when AI platform waves complete

### Current status

**Vacant** — AI Chat deduplication (3C-5) improved layout; full AI **platform** reference certification not awarded. **Reference UX #4** registered for AI Experience — [`audits/REFERENCE_MODULE_AI.md`](./audits/REFERENCE_MODULE_AI.md) — **Approved with Findings** (2026-06-03).

---

## Reference Calendar Module

### Definition

Calendar + scheduling UX: time grid, event CRUD confirms, drag-drop policy, mobile agenda — platform calendar copy target.

### Certification process

1. Calendar UX inventory (deferred from 3C-7)
2. ConfirmModal parity for destructive calendar actions
3. Layout shell adoption
4. Scorecard + registration

### Current status

**Registered** — **Reference UX #5 Approved with Findings** (2026-06-03). UX-L3 Certified; architecture Reference #3 unchanged. Registration: [`audits/REFERENCE_MODULE_CALENDAR.md`](./audits/REFERENCE_MODULE_CALENDAR.md).

---

## Wave 6A — UX Reference Pattern Extraction ✅

**Status:** **Complete** (documentation only — 2026-06-03)

All five registered UX references (#1–#5) contributed **56 canonical patterns** extracted into platform UX standards.

| Deliverable | Path |
|-------------|------|
| Master pattern catalog | [`UX_REFERENCE_PATTERN_CATALOG.md`](./UX_REFERENCE_PATTERN_CATALOG.md) |
| Program closeout | [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](./UX_REFERENCE_PROGRAM_CLOSEOUT.md) |
| Workspace patterns | [`patterns/WORKSPACE_PATTERNS.md`](./patterns/WORKSPACE_PATTERNS.md) |
| Navigation patterns | [`patterns/NAVIGATION_PATTERNS.md`](./patterns/NAVIGATION_PATTERNS.md) |
| Mobile patterns | [`patterns/MOBILE_PATTERNS.md`](./patterns/MOBILE_PATTERNS.md) |
| Empty state patterns | [`patterns/EMPTY_STATE_PATTERNS.md`](./patterns/EMPTY_STATE_PATTERNS.md) |
| Confirmation & destructive patterns | [`patterns/CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./patterns/CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md) |
| AI experience patterns | [`patterns/AI_EXPERIENCE_PATTERNS.md`](./patterns/AI_EXPERIENCE_PATTERNS.md) |
| Cross-module integration patterns | [`patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md`](./patterns/CROSS_MODULE_INTEGRATION_PATTERNS.md) |
| Accessibility patterns | [`patterns/ACCESSIBILITY_PATTERNS.md`](./patterns/ACCESSIBILITY_PATTERNS.md) |

**Program verdict:** Registration roster + pattern extraction **complete**. Follow-on gaps (Chat UX, Place UX, partner enforcement) are documented in the closeout — not blockers for Wave 6A.

**Future modules:** Use the [future-module inheritance matrix](./UX_REFERENCE_PATTERN_CATALOG.md#future-module-inheritance-matrix) when selecting copy targets.

---

## Wave 6C — UX Reference Program Expansion Review ✅

**Status:** **Complete** (governance only — 2026-06-14)

Post-completion review after original portfolio (#1–#5) + Wave 6A pattern extraction.

| Question | Verdict |
|----------|---------|
| Original program complete? | **Yes** — baseline tier frozen |
| UX #6 should exist? | **Yes** — governed expansion tier |
| Place as UX #6? | **Recommended primary candidate** — not registered this wave |
| Reference Workspace track? | **Yes — parallel** — not substitute for UX #6 |
| Domain-specific numbered slots? | **No** — pattern annexes only |

| Deliverable | Path |
|-------------|------|
| Expansion review | [`audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](./audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

**Governance model (12–24 months):**

1. **Baseline tier** — UX #1–#5 frozen; Wave 6A catalog authoritative
2. **Expansion tier** — UX #6+ with council + `REFERENCE_MODULE_[MODULE].md` + pattern extraction wave
3. **Reference Workspace** — parallel platform shell track (charter wave)
4. **Pattern annexes** — HR, Scheduling, Marketplace, Analytics inherit nearest archetype

**Next initiatives:** **6B-Place-Ref6-Prep** · **6D-Place-Pattern-Extraction** · **6C-Reference-Workspace-Charter** (parallel)

**Constraints honored:** No registration · no certification changes · no council action.

---

## Wave 6C-Reference-Workspace-Charter ✅

**Status:** **Complete** (governance only — 2026-06-14)

First formal **Reference Workspace Program** charter — parallel track alongside UX and Architecture references.

| Question | Verdict |
|----------|---------|
| Workspace reference track should exist? | **Yes** — first-class program type #3 |
| Separate from UX References? | **Yes** — orchestration vs module interaction |
| Certification model | **WS-L1 / WS-L2 / WS-L3** (orchestration-focused) |
| Inaugural candidate | **Business Workspace** + Personal Dashboard shell (co-surface) |
| Place Publisher Hub? | **UX #6 track** — not workspace inaugural |

| Deliverable | Path |
|-------------|------|
| Charter review | [`../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_CHARTER_REVIEW.md) |

**Next:** Business Workspace Wave **1A+** · parallel **6B-Place-Ref6-Prep** (UX #6).

**Constraints honored:** No designation · no certifications · no council action.

---

## Recertification triggers

Re-audit required when:

- New destructive flows without ConfirmModal
- Layout shell replaced with ad-hoc chrome
- Major mobile redesign
- Native `prompt()`/`confirm()` reintroduced
- Breaking change to global trash or notification contracts

**Minor findings** from prior certification carry forward until remediated or waived.

---

## Registration file template

New registrations should include:

1. Module identity (`moduleId`, display name)
2. Certification decision and date
3. Level awarded (L1/L2/L3)
4. Waves completed
5. Scorecard summary table
6. Open findings
7. Copy targets for other modules (“when building X, copy Y from this module”)
8. Recertification requirements

---

## Related

- [`UX_CERTIFICATION_STANDARD.md`](./UX_CERTIFICATION_STANDARD.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)
- [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md)
- [`audits/REFERENCE_MODULE_NOTIFICATIONS.md`](./audits/REFERENCE_MODULE_NOTIFICATIONS.md)
- [`audits/REFERENCE_MODULE_CALENDAR.md`](./audits/REFERENCE_MODULE_CALENDAR.md)
- [`audits/REFERENCE_MODULE_TODO.md`](./audits/REFERENCE_MODULE_TODO.md)
- [`audits/REFERENCE_MODULE_AI.md`](./audits/REFERENCE_MODULE_AI.md)
- [`audits/AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md`](./audits/AI_EXPERIENCE_REFERENCE_UX4_READINESS_REVIEW.md)
- [`UX_REFERENCE_PATTERN_CATALOG.md`](./UX_REFERENCE_PATTERN_CATALOG.md)
- [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](./UX_REFERENCE_PROGRAM_CLOSEOUT.md)
- [`audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md`](./audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md)
- [`../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md`](../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md)
- [`../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md`](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

**Last updated:** 2026-06-14 (Inaugural Reference Workspace Registration — Approved with Findings)
