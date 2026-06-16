# Business Operations Certification Evaluation

**Program:** Business Operations Certification Evaluation  
**Status:** Master evaluation — certification review only  
**Evaluation date:** 2026-06-16  
**Modules evaluated:** Scheduling (`scheduling`), HR (`hr`)  
**Authority:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) Level 3 gate, [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

**No certifications awarded automatically. This evaluation applies the same framework used for File Hub, Chat, and Calendar.**

---

## Executive summary

| Module | Evaluation outcome | Certification recommendation |
|--------|-------------------|------------------------------|
| **Scheduling** | **FAIL** | **NOT CERTIFIED** |
| **HR** | **PASS WITH FINDINGS** | **LEVEL 3 CERTIFIED WITH FINDINGS** |

Scheduling fails Level 3 due to **hard constitutional violations**: direct Prisma mutations in `schedulingAdminToolsController` and **manifest capability falsehood** (`realtime: true` with no realtime adapter). HR passes with documented findings comparable to Calendar's accepted partials (AI context Prisma, incomplete PE on reads, no domain event bus).

Neither module is designated **Reference Implementation** (Level 4). HR is a **REFERENCE CANDIDATE** for workforce-lifecycle patterns after findings remediation. Scheduling is **not a reference candidate** until AdminTools extraction and manifest correction.

---

## Primary questions answered

| # | Question | Answer |
|---|----------|--------|
| 1 | Does Scheduling satisfy Level 3? | **No** — FAIL |
| 2 | Does HR satisfy Level 3? | **Yes, with findings** — PASS WITH FINDINGS |
| 3 | What prevents certification? | Scheduling: AdminTools Prisma, realtime manifest lie. HR: no blockers; findings are advisory/remediation |
| 4 | What remediation is required? | See findings registers; Scheduling requires service extraction before re-evaluation |
| 5 | Reference implementation candidacy? | HR: **REFERENCE CANDIDATE** (conditional). Scheduling: **Not qualified** |

---

## Evaluation methodology

1. **Level 3 gate** — 15 criteria from [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) § Certification requirements
2. **File Hub patterns** — [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)
3. **Benchmark modules** — Chat (L3 Reference #2), Calendar (L3 Reference #3), File Hub (L4)
4. **Repository evidence** — controllers, services, routes, manifests, registry, tests (no code changes)
5. **Stage 2 closeout** — [STAGE_2_CLOSEOUT_REPORT.md](./STAGE_2_CLOSEOUT_REPORT.md), [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md)

---

## Level 3 gate scorecard — Scheduling

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | Canonical service boundaries | 🟡 | Primary domain services exist; AdminTools bypasses |
| 2 | Thin controllers | 🔴 | **51 Prisma calls** in 3 controllers; AdminTools performs `scheduleShift.create`, station/location CRUD |
| 3 | Policy Engine | 🟡 | Destructive schedule/shift paths gated; schedule-template delete, some admin tools ungated |
| 4 | Global Trash | 🟢 | Handler registered; `trashedAt`; lifecycle tested |
| 5 | V_Link | 🟢 | Access + lifecycle + resolver + tests |
| 6 | Platform entities | 🟢 | Registry + manifest `entities[]` |
| 7 | Domain events | 🔴 | No `scheduling.*` types in domain event registry; activity only |
| 8 | Module activity | 🟢 | `schedulingActivityService` — 20 emitters; contract test |
| 9 | Notifications | 🟢 | 6 types manifest-complete |
| 10 | Realtime | 🔴 | Manifest `realtime: true`; **no** `schedulingRealtimeService` |
| 11 | AI compliance | 🔴 | `schedulingAiContextController` — 16 direct Prisma |
| 12 | Capability truthfulness | 🔴 | **realtime** declared but not implemented |
| 13 | Tests | 🟡 | ~74 cases; gaps on controller G09 HTTP layer |
| 14 | Documentation | 🟡 | Closeout assessments exist; no operation matrix (this audit satisfies review doc) |
| 15 | Legacy retirement | 🟡 | G18 analytics 501 trio (Stage 4 scope; documented) |

**Scheduling gate score:** 5 🟢 · 4 🟡 · **6 🔴** → **FAIL**

---

## Level 3 gate scorecard — HR

| # | Gate | Status | Notes |
|---|------|--------|-------|
| 1 | Canonical service boundaries | 🟢 | `hrEmployeeService`, `hrPtoService`, extended attendance/onboarding |
| 2 | Thin controllers | 🟡 | Main `hrController` 0 Prisma; 2,242 LOC; `hrAIContextController` 15 Prisma |
| 3 | Policy Engine | 🟡 | All **destructive** admin paths gated; ~58% routes without PE (mostly reads) |
| 4 | Global Trash | 🟢 | `employee_profile` handler; purge V-Link unlink |
| 5 | V_Link | 🟢 | 4 entities; full stack + tests |
| 6 | Platform entities | 🟢 | Registry + manifest |
| 7 | Domain events | 🟡 | Activity only; V-Link unlink uses platform emitter; no `hr.*` taxonomy |
| 8 | Module activity | 🟢 | 14 emitters; contract test |
| 9 | Notifications | 🟢 | 12 types manifest-complete |
| 10 | Realtime | 🟢 | Not declared — truthful omission |
| 11 | AI compliance | 🟡 | Context providers work; 15 Prisma in AI controller (Calendar-accepted class) |
| 12 | Capability truthfulness | 🟢 | Manifest matches runtime |
| 13 | Tests | 🟢 | ~80 cases across 21 files |
| 14 | Documentation | 🟡 | Closeout + this audit; operation matrix still recommended |
| 15 | Legacy retirement | 🟢 | Import symmetry; no controller Prisma |

**HR gate score:** 9 🟢 · 6 🟡 · **0 🔴** → **PASS WITH FINDINGS**

---

## Findings summary

| Module | Blocking | Major | Advisory | Total |
|--------|----------|-------|----------|-------|
| Scheduling | 3 | 4 | 5 | **12** |
| HR | 0 | 3 | 6 | **9** |

Detail: [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md), [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md)

---

## Certification decisions

Formal recommendations: [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md)

| Module | Verdict | Recommendation |
|--------|---------|----------------|
| Scheduling | FAIL | **NOT CERTIFIED** |
| HR | PASS WITH FINDINGS | **LEVEL 3 CERTIFIED WITH FINDINGS** |

**CERTIFICATION_LEDGER update required:** Add `scheduling` and `hr` rows upon governance approval of decisions document.

---

## Reference candidacy

| Module | Candidacy | Rationale |
|--------|-----------|-----------|
| Scheduling | **Not qualified** | Planning-domain patterns undermined by AdminTools fat controller and manifest falsehood |
| HR | **REFERENCE CANDIDATE** | Workforce-lifecycle service decomposition, org-chart symmetry, V-Link/trash adoption — pending PE completion and AI extraction |

Full analysis: [BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md](./BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md)

---

## Comparison to certified references

| Dimension | File Hub L4 | Chat L3 | Calendar L3 | Scheduling | HR |
|-----------|-------------|---------|-------------|------------|-----|
| Controller Prisma | 0 | 0 | 0 | **51** | 0 (main) |
| PE on destructive writes | High | High | High | High (core) | High |
| Domain events | Yes | Yes | Yes | No | Partial |
| V_Link | Yes | Yes | Yes | Yes | Yes |
| Trash | Yes | Yes | Yes | Yes | Yes (scoped) |
| Manifest truth | Yes | Yes | Yes | **No** (realtime) | Yes |
| Operation matrix | Yes | Yes | Yes | No | No |
| L3 audit doc | Yes | Yes | Yes | **This program** | **This program** |

---

## Child documents

| # | Document |
|---|----------|
| 2 | [SCHEDULING_CERTIFICATION_AUDIT.md](./SCHEDULING_CERTIFICATION_AUDIT.md) |
| 3 | [HR_CERTIFICATION_AUDIT.md](./HR_CERTIFICATION_AUDIT.md) |
| 4 | [SCHEDULING_FINDINGS_REGISTER.md](./SCHEDULING_FINDINGS_REGISTER.md) |
| 5 | [HR_FINDINGS_REGISTER.md](./HR_FINDINGS_REGISTER.md) |
| 6 | [BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md](./BUSINESS_OPERATIONS_REFERENCE_CANDIDATE_ANALYSIS.md) |
| 7 | [BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md](./BUSINESS_OPERATIONS_CERTIFICATION_DECISIONS.md) |
| 8 | [BUSINESS_OPERATIONS_CERTIFICATION_EXECUTIVE_SUMMARY.md](./BUSINESS_OPERATIONS_CERTIFICATION_EXECUTIVE_SUMMARY.md) |

---

**Evaluation constraints honored:** Repository assessment only; no code, schema, migrations, or implementation.
