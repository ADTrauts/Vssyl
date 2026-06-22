# Dashboard Module — Package 1 Scope Validation

**Program:** Dashboard Module Wave 3 — Package 1 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance validation checklist

---

## 1. Package 1 stated objectives

| Objective | Finding | Validation |
|-----------|---------|------------|
| Close DASH-B1 | No module activity | ✅ Scoped — activity service + 16 ops |
| Close DASH-B2 | Missing PE | 🟡 Scoped — **clarify trash/file-summary** |
| Close DASH-B4 | ActivityFeed placeholder | ✅ Scoped — single remediation |
| Close DASH-B5 | Enterprise mock metrics | 🟡 Scoped — gate/demo; P3 for real data |
| Target ~21/27 | L2 band | ✅ Realistic if B1+B4+B5+PE core succeed |

---

## 2. In-scope workstreams (validated)

| # | Workstream | Defined? | Acceptance criterion |
|---|------------|----------|----------------------|
| 1 | `DASHBOARD_WRITE` / `DELETE` in PE | ✅ | Handlers + tests pass |
| 2 | Dual-enforcement dashboard routes | ✅ | 14 write paths + 7 read paths (excl. A-02) |
| 3 | `dashboardActivityService` | ✅ | 16/16 mutations emit |
| 4 | ActivityFeed placeholder removal | ✅ | No fake activities on failure |
| 5 | Enterprise mock removal/gate | 🟡 | **Need flag decision** |
| 6 | A-02 stub (no cross-module Prisma) | ✅ | Metadata-only or disabled |
| 7 | D-02 silent create fix | ✅ | Move or envelope |
| 8 | PE + activity integration tests | ✅ | Core CRUD minimum |
| 9 | Operation matrix doc update | ✅ | Post-implementation |

---

## 3. Out-of-scope (validated — must not enter P1)

| Item | Deferred to |
|------|-------------|
| Domain events (4 required) | Package 2 |
| `dashboardAIContextService` extraction | Package 2 |
| Calendar provision decouple | Package 2 |
| Workspace seeder decouple | Package 2 |
| Analytics facade | Package 3 |
| Registry unification | Package 3 |
| DriveWidget random share fix | Package 3 |
| Certification / ledger | Never in P1 |
| Reference Workspace | Archived |

---

## 4. Scope gap — charter inconsistency (requires resolution)

| Gap | Phase 1 claim | Program doc | **Recommended disposition** |
|-----|---------------|-------------|----------------------------|
| Trash PE D-10–D-12 | 24/24 PE in P1 | Trash PE in **Package 2** | **P1-A:** Add minimal `trashController` dashboard_tab PE hook **OR** **P1-B:** Close B2 as "module routes only" with D-10–12 on certificate as P2 advisory |
| D-08 file-summary PE | In 24 PE count | Listed in Package 2 | Include in P1 if B2 full closure required — low effort via existing read handler pattern |
| `dashboardPolicyDual.ts` | Package 1 deliverable | Package 2 mentions tests | **P1** — required for B2 evidence |

**Governance recommendation:** Adopt **P1-A lite** — trash restore/purge/soft-delete call shared dashboard PE helper; satisfies B2 without full Package 2.

---

## 5. Pre-implementation clarifications (kickoff checklist)

| # | Clarification | Blocking ACT? |
|---|---------------|---------------|
| K-01 | D-02: move auto-create vs emit on GET | **Yes** |
| K-02 | Enterprise: feature flag name + default off | **Yes** for B5 |
| K-03 | Trash PE: P1-A vs P1-B | **Yes** for B2 wording |
| K-04 | W-05/W-06: per-widget activity emit | No — default per charter |
| K-05 | A-02: disable endpoint vs empty stub | No — default metadata-only |
| K-06 | quickstats: hide widget vs empty state | No — default empty |

---

## 6. Operation coverage matrix (P1 target)

| Op group | Count | P1 PE | P1 Activity | P1 Trust |
|----------|------:|-------|-------------|----------|
| D dashboard tab | 12 | 10–12* | 9 | — |
| W widget | 7 | 6 | 6 | — |
| S sidebar | 6 | 4 | 3 | — |
| A AI context | 3 | 2 (+ stub) | — | A-02 stub |
| C client | 5 | 1–2 | — | C-03 gate |
| P projections | 12 | — | — | P-07 fix |

*D-10–12 per gap resolution

---

## 7. Definition completeness (answer Q1)

| Lens | Verdict |
|------|---------|
| Objectives | ✅ Clear |
| Workstreams | ✅ Listed |
| Acceptance | 🟡 Trash split unresolved |
| Non-scope | ✅ Clear |
| Dependencies | 🟡 Documented in risk review |

**Fully defined:** **Conditional YES** — resolve K-01, K-02, K-03 before first merge.

---

## 8. Hidden dependencies (answer Q2)

| Dependency | Hidden? | Notes |
|------------|---------|-------|
| `policyEngine.ts` write handlers | Known | Documented |
| `trashController` cross-cutting | **Yes** | Easy to miss in module-only PR |
| `ensureBusinessDashboardForUser` callers | **Yes** | HR activity service uses it |
| D-07 `fileMigrationService` | Known | Drive PE chain |
| Feature gating infra | Known | Must pick flags |
| Manifest permissions | No code change needed | Already aligned |

---

## 9. Blocking findings for authorization (answer Q3)

| Finding | Blocks P1 authorization? |
|---------|--------------------------|
| DASH-B1 | No — in scope |
| DASH-B2 | **Conditional** — trash disposition |
| DASH-B3 | No — partial OK |
| DASH-B4 | No — in scope |
| DASH-B5 | **Conditional** — K-02 |
| Unresolved K-01–K-03 | **Soft block** on ACT kickoff, not on authorization review |

**No finding blocks this governance review.** Implementation ACT requires K-01–K-03 recorded.

---

## 10. Unresolved constitutional questions (answer Q4)

| # | Question | Status |
|---|----------|--------|
| Q1 | Is `dashboard:delete` separate permission or write+guard? | **Open** — recommend separate action matching charter |
| Q2 | Trash: platform vs module PE ownership | **Open** — recommend module helper invoked from trashController |
| Q3 | Activity on D-09 when HR module triggers ensure | **Open** — recommend dashboard service emits |
| Q4 | Enterprise showcase partial-trust acceptable? | **Resolved** — yes, if labeled marketing |
| Q5 | quickstats in P1: hide vs empty | **Open** — product; not constitutional blocker |

---

**Last updated:** 2026-06-21
