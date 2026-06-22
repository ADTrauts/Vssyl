# Dashboard Module — Package 1 Risk Review

**Program:** Dashboard Module Wave 3 — Package 1 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

---

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation (P1 charter) | Owner |
|----|------|------------|--------|-------------------------|-------|
| **P1-R01** | PE write/delete handlers incorrect — authorization bypass | Medium | **Critical** | `dashboardPolicyDual.ts` + integration tests mirroring read tests | Platform + Dashboard |
| **P1-R02** | Activity missed on one of 16 mutation paths | Medium | High | Operation matrix checklist; CI test per op ID | Dashboard |
| **P1-R03** | Double activity emit (batch layout + dashboard.update) | Medium | Medium | Charter rule: one path per user action — lock in kickoff doc | Dashboard |
| **P1-R04** | D-02 silent create on GET remains without PE/activity | Low | High | Explicit kickoff choice: move create or full envelope | Dashboard |
| **P1-R05** | Trash ops (D-10–12) PE deferred — B2 incomplete | Medium | Medium | Include trash adapter in P1 OR accept B2-CwF until P2 | Governance |
| **P1-R06** | D-07 delete+migration cross-domain PE ordering wrong | Medium | High | Authorize dashboard delete then file actions sequentially; fail-closed | Dashboard + Drive |
| **P1-R07** | D-09 activity from foreign module callers skipped | Medium | Medium | Audit all `ensureBusinessDashboardForUser` call sites | Cross-module |
| **P1-R08** | Enterprise feature gate wrong — mocks still visible | Low | High | Default **off**; explicit demo label if showcase | Product |
| **P1-R09** | A-02 stub still returns misleading aggregates | Low | Medium | Metadata-only or 501 until P3; document in manifest | Dashboard |
| **P1-R10** | G3 remains PARTIAL — score below 21/27 | Medium | Low | Expected; not P1 goal to PASS G3 | Accepted |
| **P1-R11** | Regression in widget grid UX from empty states | Low | Low | UX empty states per platform patterns | Frontend |
| **P1-R12** | Scope creep into Package 2 (calendar decouple, domain events) | Medium | Medium | Non-scope list in program doc — review gate on PRs | Engineering lead |

---

## Implementation risks (answer Q10)

### High

1. **PE handler correctness** (P1-R01) — new actions fail-closed until implemented; wrong handler = false confidence or lockout.
2. **Cross-domain delete** (P1-R06) — D-07 touches Dashboard + Drive; partial PE = data loss risk.
3. **Mutation coverage** (P1-R02) — 16 paths across 4 controllers + trashController touchpoints.

### Medium

4. **Charter inconsistency trash PE** (P1-R05) — teams may ship P1 claiming B2 closed while trash remains JWT-only.
5. **Silent create** (P1-R04) — GET side effect anti-pattern persists if not explicitly removed.
6. **Scope creep** (P1-R12) — Trust Foundation tempts service extraction early.

### Low

7. **UX empty states** (P1-R11), **enterprise gating** (P1-R08).

---

## Dependency risks

| Dependency | Risk if unavailable |
|------------|-------------------|
| `policyEngine.ts` change approval | Blocks all write PE |
| `moduleActivityService` stable envelope | Activity non-compliant |
| `useFeature` flags for enterprise | B5 closure ambiguous |
| HR/scheduling unchanged | D-09 call-site audit only |

---

## Score risk

| Scenario | Estimated G1–G9 |
|----------|-----------------|
| P1 success (full scope) | **21/27** |
| P1 success minus trash PE | **20/27** — G1 partial |
| P1 activity miss on 2+ ops | **19/27** — G2 fails |
| P1 trust incomplete (placeholder remains) | **18/27** — G8 fails |

---

## Risk acceptance (governance)

| Risk | Accept for P1 ACT? |
|------|-------------------|
| G3 stays at 2 | **Yes** — Package 2 |
| quickstats stays partial-trust | **Yes** — Package 3 |
| DASH-B3 partial | **Yes** — documented |
| Trash PE deferred | **Conditional** — must document B2 posture |

---

**Last updated:** 2026-06-21
