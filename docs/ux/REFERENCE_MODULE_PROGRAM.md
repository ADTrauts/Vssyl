# Vssyl Reference Module Program

**Status:** Wave 5A foundation (2026-06-03)  
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
| **#5** | **Reference Calendar Module** | Scheduling/calendar UX + time-grid interaction patterns | Calendar UX certification (future) |

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

### Current holder

| Slot | Module | Status | Registration |
|------|--------|--------|--------------|
| **Reference UX #1** | Drive / File Hub | **Approved with Findings** | [`audits/REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md) |

### Vacant slots

Additional Reference UX modules (e.g. #2 Chat) require explicit registration — no automatic promotion from partial waves.

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

Platform shell + workspace runtime (Business Workspace hub) — **not** a product `moduleId`.

### Certification process

1. Boundary audit (not certifiable as Drive/Todo)
2. Hub standardization (`[Module]WorkspaceLanding` for each business module)
3. `PlatformShell` + `PlatformHeader` consistency
4. Registration when shell contract is stable

### Current status

Business Workspace: **Level 1–2 stabilizing** — see `BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md`. **Not** Reference Workspace yet.

---

## Reference AI Module

### Definition

Module demonstrating complete **ModuleAIContext**, context providers, optional action executors, and AI manifest alignment per `memory-bank/aiContextSystem.md`.

### Certification process

1. AI manifest + provider audit
2. Latency and bounded result sets verified
3. Constitutional alignment (G0 framework)
4. Registration when AI platform waves complete

### Current status

**Vacant** — AI Chat deduplication (3C-5) improved layout; full AI reference certification not awarded.

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

**Vacant** — Calendar modernization explicitly deferred; not certification-ready.

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

**Last updated:** 2026-06-03 (Wave 5A)
