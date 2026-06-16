# Stage 2 Execution Readiness

**Program:** Business Operations Stage 2 Readiness Assessment  
**Status:** Readiness verdict — repository analysis only (no implementation)  
**Last updated:** 2026-06-15  
**Stage 1 verdict:** G01–G07 PASS; Stage 2 UNBLOCKED  
**Primary question:** Do sufficient Stage 2 implementation artifacts already exist?

---

## Executive summary

| Question | Answer |
|----------|--------|
| **Sufficient artifacts for package-level planning?** | **Yes** — domain modernization plans, alignment requirements, convergence program CO definitions, and 501 stub inventory exist |
| **Sufficient artifacts for code implementation at Stage 1 fidelity?** | **No** — missing `STAGE_2_ENGINEERING_BLUEPRINT.md` and `STAGE_2_FILE_TARGET_MATRIX.md` (and per-initiative engineering blueprints) |
| **Readiness verdict** | **B — One small blueprint required** |
| **Can package planning begin immediately?** | **Yes** |
| **First package to execute** | **Package 5A — CO-08 / G08 Shift-template collision resolution** (decision record; no code dependency on file matrix) |

Stage 2 does **not** need another constitutional, architecture, discovery, or modernization planning program. It needs a **minimum execution blueprint** mirroring Stage 1's implementation layer (`STAGE_1_ENGINEERING_BLUEPRINT.md` + `STAGE_1_FILE_TARGET_MATRIX.md`).

---

## 1. Existing Stage 2 artifacts

### Domain modernization plans (strategy)

| File | Purpose | Completeness | Implementation-ready? |
|------|---------|--------------|----------------------|
| [SCHEDULING_MODERNIZATION_PLAN.md](./SCHEDULING_MODERNIZATION_PLAN.md) | Scheduling Stage 2 themes: constitutional adoption (done in S1), G09 manager APIs, CO-10 extraction, CO-09 V-Link, CO-08 templates, WC hooks | **High** — themes, dependency order, exclusions | **No** — explicitly "no implementation detail" |
| [HR_MODERNIZATION_PLAN.md](./HR_MODERNIZATION_PLAN.md) | HR Stage 2 themes: CO-10 decomposition, G12 notifications, CO-09 V-Link, API consolidation | **High** — themes, dependency order | **No** — strategy only; posture table partially stale post–Stage 1 |

### Sequence and gap registry (program)

| File | Purpose | Completeness | Implementation-ready? |
|------|---------|--------------|----------------------|
| [BUSINESS_OPERATIONS_MODERNIZATION_SEQUENCE.md](./BUSINESS_OPERATIONS_MODERNIZATION_SEQUENCE.md) | Stage 2 entry/exit gates; CO-08, CO-09, CO-10, G09; parallelization rules | **High** | **No** — gates only |
| [BUSINESS_OPERATIONS_MODERNIZATION_MASTER_PLAN.md](./BUSINESS_OPERATIONS_MODERNIZATION_MASTER_PLAN.md) | Master plan; Stage 2 scope summary | **Medium** | **No** |
| [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) | G08–G13 gap definitions; CO-08, CO-09, CO-10 initiative specs | **High** — initiative fields per CO | **Partial** — enough to scope packages, not to assign files |
| [BUSINESS_OPERATIONS_CONVERGENCE_PROGRAM.md](./BUSINESS_OPERATIONS_CONVERGENCE_PROGRAM.md) | CO-08, CO-09, CO-10, G09 purpose, outcomes, exclusions, stage assignment | **High** | **Partial** — package scoping yes; file-level no |

### Domain alignment and audit (scope inventory)

| File | Purpose | Completeness | Implementation-ready? |
|------|---------|--------------|----------------------|
| [SCHEDULING_ALIGNMENT_REQUIREMENTS.md](./SCHEDULING_ALIGNMENT_REQUIREMENTS.md) | G09 501 stub inventory; constitutional gaps (many resolved in S1) | **High** for G09 endpoint list | **Partial** — endpoint targets yes; file matrix no |
| [HR_ALIGNMENT_REQUIREMENTS.md](./HR_ALIGNMENT_REQUIREMENTS.md) | HR gaps; G12 notification notes; controller decomposition scope | **Medium** — some items resolved in S1 | **Partial** |
| [HR_SCHEDULING_BOUNDARY_REVIEW.md](./HR_SCHEDULING_BOUNDARY_REVIEW.md) | COL-4 `AttendanceShiftTemplate` vs `ShiftTemplate` collision analysis | **High** for CO-08 decision input | **Yes** for CO-08 decision record only |
| [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md) | Operation inventory | **Medium** | **No** |
| [HR_OPERATION_MATRIX.md](./HR_OPERATION_MATRIX.md) | Operation inventory; attendance template routes missing | **Medium** | **No** |
| [SCHEDULING_UX_AUDIT.md](./SCHEDULING_UX_AUDIT.md) | UX audit | **Low** for implementation | **No** |
| [HR_ARCHITECTURE_AUDIT.md](./HR_ARCHITECTURE_AUDIT.md) | Architecture audit | **Medium** | **No** |

### Phase 0 closeouts (historical discovery)

| File | Purpose | Completeness | Implementation-ready? |
|------|---------|--------------|----------------------|
| [BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md) | Scheduling 501 stubs; shift-template collision flagged | **Historical** | **No** — superseded by alignment reqs |
| [BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0B_CLOSEOUT.md) | HR monolithic controller; notification gaps | **Historical** | **No** |

### V-Link reference patterns (platform, not BO-specific)

| File | Purpose | Completeness | Implementation-ready? |
|------|---------|--------------|----------------------|
| [docs/architecture/audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md](../architecture/audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md) | Todo V-Link + trash + platform entity pattern | **Complete** for Todo | **Yes** as CO-09 pattern reference |
| [docs/architecture/audits/CALENDAR_VLINK_PHASE2B.md](../architecture/audits/CALENDAR_VLINK_PHASE2B.md) | Calendar V-Link pattern | **Complete** for Calendar | **Yes** as pattern reference |
| `server/src/platform/platformEntityRegistry.ts` | Platform entity + `vlinkEntityType` registration | **Exists** — no scheduling/hr entries | **No** — CO-09 not started |

### Stage 1 artifacts (prerequisite — complete)

| File | Purpose | Stage 2 relevance |
|------|---------|-------------------|
| [STAGE_1_ENGINEERING_BLUEPRINT.md](./STAGE_1_ENGINEERING_BLUEPRINT.md) | Stage 1 file/service scope model | **Template** for missing Stage 2 blueprint |
| [STAGE_1_FILE_TARGET_MATRIX.md](./STAGE_1_FILE_TARGET_MATRIX.md) | 62-row file-level scope | **Template** for missing Stage 2 matrix |
| CO01–CO07 engineering blueprints | Per-initiative implementation scope | **No Stage 2 equivalents** |

### Repository code evidence (current state)

| Finding | Location | Stage 2 implication |
|---------|----------|-------------------|
| G09 manager endpoints still **501** | `schedulingTeamController.ts` (`publishTeamSchedule`, `getOpenShiftsForTeam`, `assignEmployeeToShift`, `getTeamAvailability`) | G09 not started |
| Shift template admin CRUD still **501** | `schedulingAdminController.ts` (~L1663–1675) | G09 dependency; CO-08 should precede |
| Analytics trio still **501** (Stage 4/G18) | `schedulingAdminController.ts` (~L2039–2047) | **Out of Stage 2 scope** |
| No `schedulingService` | Controllers use direct Prisma (~6 files) | CO-10 not started |
| `hrController.ts` monolithic | ~50 handlers | CO-10 not started |
| No scheduling/hr V-Link services | No matches under `server/src` for scheduling vlink | CO-09 not started |
| Stage 1 platform patterns in place | Activity, notifications, PE dual, trash services/handlers | Stage 2 **consumes** — does not reinvent |

---

## 2. Missing artifacts (genuinely required for implementation)

Only items **not** adequately covered by existing docs:

| Missing artifact | Why required | Minimum content |
|----------------|--------------|-----------------|
| **`STAGE_2_ENGINEERING_BLUEPRINT.md`** | Stage 1 had this; Stage 2 has strategy only | Work packages, file areas, migrations (if any), test scope, entry/exit per package |
| **`STAGE_2_FILE_TARGET_MATRIX.md`** | Stage 1 had 62 rows; Stage 2 has zero file-level rows | Per-file CREATE/MODIFY/TEST rows for CO-08, G09, CO-10, CO-09, G12 (if any remainder) |
| **`CO08_*` engineering blueprint** (or section in Stage 2 blueprint) | CO-08 is decision + UX naming; needs explicit deliverable list | Decision record path, optional schema rename scope, UX copy targets |
| **`G09_*` engineering blueprint** (or section) | 501 inventory exists but not wired to files/tests | Per-endpoint implementation notes, notification/activity/PE/trash/calendar hooks |
| **`CO10_*` engineering blueprint** (or section) | "~144 Prisma calls" cited but not enumerated by file | Service file list, extraction order, controller thin targets |
| **`CO09_*` engineering blueprint** (or section) | V-Link pattern exists for Todo/Calendar only | Entity types, registry keys, resolver services, lifecycle + trash integration |
| **`STAGE_2_IMPLEMENTATION_SEQUENCE.md`** (optional but recommended) | Stage 1 had explicit package order | Package 5A→5D, 6A→6C sequencing with dependencies |

**Explicitly NOT missing (do not recreate):**

- Domain modernization plans
- Alignment priority matrix / convergence program
- Constitutional / FALSE POSITIVE governance (Stage 1 complete)
- New architecture or discovery programs

---

## 3. Stage 2 package structure (from repository findings)

Recommended executable packages aligned with [BUSINESS_OPERATIONS_MODERNIZATION_SEQUENCE.md](./BUSINESS_OPERATIONS_MODERNIZATION_SEQUENCE.md) and [SCHEDULING_MODERNIZATION_PLAN.md](./SCHEDULING_MODERNIZATION_PLAN.md) dependency order.

### Scheduling track (Package 5x)

| Package | Initiative | Scope (from existing docs) | Depends on | Can start after |
|---------|------------|----------------------------|------------|-----------------|
| **5A** | **CO-08 / G08** | Shift-template collision decision record; naming/UX boundaries (`AttendanceShiftTemplate` vs `ShiftTemplate`); no schema merge | None | **Immediately** (decision record) |
| **5B** | **G09** | Implement 501 manager/admin stubs per [SCHEDULING_ALIGNMENT_REQUIREMENTS.md](./SCHEDULING_ALIGNMENT_REQUIREMENTS.md): `publishTeamSchedule`, `getOpenShiftsForTeam`, `assignEmployeeToShift`, `getTeamAvailability`, shift template CRUD, `getAllShiftSwapRequests`, `updateEmployeeAvailabilityAdmin` | CO-08, Stage 1 (CO-02, CO-03, CO-07) | 5A + Stage 2 file matrix |
| **5C** | **CO-10 / G10** | Extract scheduling domain services from 6 controllers; thin controllers; ~144 Prisma calls per convergence program | CO-01, CO-03 (Stage 1) | 5B recommended first (smaller blast radius if G09 done in controllers) **or** parallel per sequence doc |
| **5D** | **CO-09 / G13** | Register scheduling entity types in platform entity registry + V-Link resolver/lifecycle (pattern: Todo Phase 2 audit) | CO-04 (Stage 1) | Trash services stable |

**Out of Stage 2 scheduling scope (per plans):** Analytics 501 trio (G18 / Stage 4); labor forecasting; WC module build.

### HR track (Package 6x)

| Package | Initiative | Scope (from existing docs) | Depends on | Can start after |
|---------|------------|----------------------------|------------|-----------------|
| **6A** | **CO-10 / G11** | Decompose `hrController.ts` into domain services (PTO, attendance, onboarding, profiles) | CO-01, CO-03 (Stage 1) | Stage 2 file matrix |
| **6B** | **G12** (remainder) | Manifest/grouping largely done in Stage 1; verify attendance emitters; API client consolidation (Theme 6) | CO-02 (Stage 1) | **Low priority** — much resolved; confirm in matrix |
| **6C** | **CO-09 / G13** | HR entity V-Link registration (profiles, PTO, attendance) | CO-04 (Stage 1) | Parallel with 5D after matrix |

### Parallelization (from sequence doc)

- **5A** early and independent  
- **5B** after 5A  
- **5C ∥ 6A** after Stage 1 patterns consumed  
- **5D ∥ 6C** after trash lifecycle (Stage 1)  
- **6B** hygiene — can trail 6A  

---

## 4. Readiness verdict

### **B — One small blueprint required**

**Evidence:**

| Criterion | Status |
|-----------|--------|
| Stage 1 exit (G01–G07) | **Met** — implementation verified in prior closeout |
| Stage 2 **strategy** artifacts | **Present** — modernization plans, sequence, CO definitions, stub inventory |
| Stage 2 **engineering** artifacts | **Absent** — no `STAGE_2_ENGINEERING_BLUEPRINT`, no `STAGE_2_FILE_TARGET_MATRIX`, no CO08/09/10/G09 engineering blueprints |
| Stage 2 **code** work | **Not started** — 501 stubs remain; no scheduling/hr V-Link; no service extraction |
| Risk of "significant missing planning" | **Low** — discovery and constitutional work complete; gap is **execution translation** only |

**Not C (significant missing planning)** because:

- G08–G13 and CO-08–CO-10 are defined in [BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md](./BUSINESS_OPERATIONS_ALIGNMENT_PRIORITY_MATRIX.md) and [BUSINESS_OPERATIONS_CONVERGENCE_PROGRAM.md](./BUSINESS_OPERATIONS_CONVERGENCE_PROGRAM.md)
- G09 endpoint inventory is authoritative in [SCHEDULING_ALIGNMENT_REQUIREMENTS.md](./SCHEDULING_ALIGNMENT_REQUIREMENTS.md)
- CO-08 analysis is authoritative in [HR_SCHEDULING_BOUNDARY_REVIEW.md](./HR_SCHEDULING_BOUNDARY_REVIEW.md) COL-4
- V-Link implementation pattern exists in Todo/Calendar audit docs

**Not A (immediate full implementation)** because:

- Stage 1 implementation used a 62-row file matrix and per-CO engineering blueprints; Stage 2 has no equivalent
- CO-10 without file targets risks unbounded controller refactors
- CO-09 without entity type enumeration risks inconsistent platform registry

---

## 5. Recommended next steps

### Immediate (no new planning program)

1. **Begin Package 5A (CO-08)** — Author shift-template decision record using COL-4 in [HR_SCHEDULING_BOUNDARY_REVIEW.md](./HR_SCHEDULING_BOUNDARY_REVIEW.md). Deliverable is documentation + UX naming guidance; enables G09.

### Before Package 5B+ code implementation

2. **Create minimum execution blueprint** (single doc set, not a new program):
   - `STAGE_2_ENGINEERING_BLUEPRINT.md`
   - `STAGE_2_FILE_TARGET_MATRIX.md`
   - Optional: `STAGE_2_IMPLEMENTATION_SEQUENCE.md` with package 5A–6C ordering

3. **First code package after blueprint:** **Package 5B (G09)** — highest product impact; unblocks WC hooks in Stage 3.

### Stage 2 exit criteria (from sequence doc)

Stage 2 complete when: G08–G13 addressed; G09 manager paths complete; CO-10 service extraction done; G12 HR notifications complete (verify remainder only).

---

## 6. Test and migration notes (planning only)

| Area | Note |
|------|------|
| **Migrations** | CO-08 may be doc-only; G09/CO-10/CO-09 may require none or minimal schema (V-Link enum extensions) — to be specified in file matrix |
| **Tests** | Follow Stage 1 pattern: per-service tests + controller contract tests + integration tests for G09 publish path |
| **Stage 1 regression** | Run Stage 1 test battery before each Stage 2 package merge |

---

## 7. Certification statement

**No certification awarded.** This document is execution readiness assessment only. Stage 2 implementation authorization is **package planning now**, **code implementation after minimum blueprint**.
