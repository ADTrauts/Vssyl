# HR Certification Readiness

**Program:** Business Operations Stage 2 Closeout  
**Module:** HR (`hr`)  
**Assessment date:** 2026-06-16  
**Authority:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) Level 3 gate, [MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

**This document assesses readiness only. No certification level is awarded.**

---

## Readiness outcome

# CONDITIONALLY READY FOR CERTIFICATION REVIEW

HR has sufficient constitutional evidence to enter a formal Level 3 certification evaluation. Package 6B web consolidation is outstanding but does not block server-side constitutional review. Expected findings: P1 Policy Dual coverage, P2 AI controller decomposition.

---

## Certification framework evaluation

| Criterion | Weight | Status | Evidence |
|-----------|--------|--------|----------|
| Workspace ownership | Required | **PASS** | `BusinessWorkspaceContent` case `hr`; `/workspace/hr`, `/team`, `/me` |
| Tenant isolation | Required | **PASS** | `businessId` in all domain services; trash/V-Link scoped |
| Service architecture | Required | **PASS** | 6A decomposition complete; 0 Prisma in main controller |
| Activity | Required | **PASS** | `hrActivityService` — 14 emitters; contract test |
| Notifications | Required | **PASS** | 12 manifest types; completeness test |
| Policy Engine | Required | **PARTIAL** | ~42% route coverage |
| Trash | Required | **PASS** (scoped) | `employee_profile`; global handler; V-Link purge |
| V-Link | Required | **PASS** | 4 entities; access + lifecycle + tests |
| Tests | Required | **PASS** | ~80 cases across 21 files |
| Platform registration | Required | **PASS** | `registerHRPlatformEntities`; manifest post-6C |
| Identity / org-chart symmetry | Required | **PASS** | Import/terminate/delete vacate paths tested |
| Constitutional compliance | Required | **PASS** (substantial) | See [HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md) |

---

## Level 3 gate checklist (CERTIFICATION_LEDGER)

| Gate item | HR status |
|-----------|-----------|
| Thin controllers | **Partial** — main controller Prisma-free but 2,242 LOC; AI controller fat |
| Service-owned side effects | **Pass** |
| PE on privileged mutations | **Partial** |
| Global Trash handler | **Pass** (employee_profile) |
| Manifest truthfulness | **Pass** |
| Module audit / operation matrix | **Not present** |
| Test evidence | **Pass** |
| Consolidated web API | **Fail** — 6B not done |
| Legacy paths retired | **Pass** — no controller Prisma |

---

## Blockers vs review findings

### Would block certification review (P0)

**None identified** for server-side constitutional evaluation.

### Likely certification failures if reviewed today (P1)

1. Policy Dual on ~58% of routes without `checkHRPolicy`
2. No formal `HR_OPERATION_MATRIX.md` / Level 3 audit document
3. `web/src/api/hr.ts` absent — inline fetch pattern (6B)
4. `hrAIContextController` — 15 Prisma calls bypass service boundary

### Architectural debt (P2)

1. `hrController.ts` size (2,242 LOC) — orchestration not fully thin
2. `hrControllerUtils.ts` unused
3. Settings endpoints are framework stubs
4. Search not registered
5. Global trash limited to `employee_profile` (by design)
6. Employee audit only — not full module audit

### Enhancements (P3)

1. `HRWorkspaceLanding` naming alignment with module-development template
2. Realtime (not required for HR today)
3. HR analytics controllers still in main `hrController.ts`

---

## Pre-review preparation checklist

Before scheduling a certification council session:

- [ ] Complete or explicitly waive 6B (`web/src/api/hr.ts`)
- [ ] Create `HR_OPERATION_MATRIX.md` (per Chat/Calendar/Todo pattern)
- [ ] Publish PE coverage matrix for `hr.ts`
- [ ] Extract or document waiver for `hrAIContextController` Prisma
- [ ] Wire or remove `hrControllerUtils.mapHrServiceError`
- [ ] Attach test run artifacts (~80 cases)

---

## Comparison to certified reference modules

| Dimension | Chat L3 | Todo L3 | HR (now) |
|-----------|---------|---------|----------|
| Controller Prisma-free | Yes | Yes | Yes (main) |
| V-Link | Yes | Yes | Yes |
| Trash | Yes | Yes | Yes (scoped) |
| PE coverage | High | High | Partial |
| Web API client | Yes | Yes | **No** |
| Certification audit doc | Yes | Yes | **No** |

HR server architecture is **ahead of ledger status** (not yet listed) but **behind** reference modules on PE completeness and web client consolidation.

---

## Allowed outcomes reference

| Outcome | Applies? |
|---------|----------|
| NOT READY | No |
| **CONDITIONALLY READY FOR CERTIFICATION REVIEW** | **Yes** |
| READY FOR CERTIFICATION REVIEW (unconditional) | No |
| Certified (Level 3) | **Not awarded** |

---

## Related documents

- [HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md](./HR_CONSTITUTIONAL_COMPLIANCE_ASSESSMENT.md)
- [STAGE_2_GAP_REGISTER.md](./STAGE_2_GAP_REGISTER.md)
- [STAGE_2_CLOSEOUT_REPORT.md](./STAGE_2_CLOSEOUT_REPORT.md)
