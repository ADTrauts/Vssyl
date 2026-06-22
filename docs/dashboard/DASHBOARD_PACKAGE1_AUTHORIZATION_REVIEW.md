# Dashboard Module — Package 1 Authorization Review

**Program:** Dashboard Module Wave 3 — Package 1 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance review only — **no implementation**

**Inputs:** Phase 0A/0B, Phase 1 Charter, [DASHBOARD_MODERNIZATION_PROGRAM.md](./DASHBOARD_MODERNIZATION_PROGRAM.md)

---

## 1. Review purpose

Determine whether **Package 1 — Trust Foundation** is sufficiently defined to authorize engineering ACT, and validate closure scope for DASH-B1, B2, B4, B5.

---

## 2. Findings review (Area A)

### DASH-B1 — No module activity

| Dimension | Assessment |
|-----------|------------|
| **Scope completeness** | **Strong** — 16 mutation ops mapped to 10 activity actions in [DASHBOARD_ACTIVITY_MODEL.md](./DASHBOARD_ACTIVITY_MODEL.md) |
| **Emitter** | `dashboardActivityService` specified; controllers must not emit |
| **Gaps** | (1) D-09 `ensureBusinessDashboardForUser` invoked from HR/other modules — charter assigns activity but **call-site ownership** not explicit; (2) W-05/W-06 per-widget vs batch emit rule needs single implementation choice locked at kickoff |
| **Hidden dependencies** | `emitModuleActivityEvent` envelope must include tenant scope from dashboard row |
| **Implementation risk** | **Medium** — high touch count (16 paths) but pattern exists (calendarActivityService) |

**Verdict:** **Closable in Package 1** with call-site checklist for D-09.

---

### DASH-B2 — Missing Policy Engine on writes

| Dimension | Assessment |
|-----------|------------|
| **Scope completeness** | **Strong** for dashboard/widget/sidebar routes; **split** on trash + file-summary |
| **Actions defined** | `dashboard:read` (exists), `dashboard:write`, `dashboard:delete` (charter) |
| **Gaps** | (1) **D-10–D-12** trash ops assigned to Package 2 in program doc but Phase 1 claims **24/24 PE** — **charter inconsistency**; (2) **D-07** requires Drive `FILE_*` actions in same request flow; (3) **D-01, D-08, A-01, A-03, S-01** read paths need PE beyond D-04; (4) `policyEngine.ts` has no write/delete handlers today |
| **Hidden dependencies** | `dashboardPolicyDual.ts` pattern; PE tests in `policyEngine.test.ts`; manifest permissions already list `dashboard:read`/`dashboard:write` |
| **Implementation risk** | **Medium-High** — new PE handlers + 14+ route wiring; trash cross-controller |

**Verdict:** **Closable in Package 1** for **module HTTP surface** (D/W/S/A read paths except A-02 stub); **trash (D-10–12) and D-08** require explicit disposition — recommend **P1.0 include trash adapter** or **document B2 partial until P2** (see Scope Validation).

---

### DASH-B4 — ActivityFeedWidget fabricated data

| Dimension | Assessment |
|-----------|------------|
| **Scope completeness** | **Complete** — remove `generatePlaceholderActivities()`; empty/error state only |
| **Gaps** | None material — single file, clear acceptance |
| **Hidden dependencies** | `/api/activity-feed` availability — widget becomes empty if API down (acceptable per T4) |
| **Implementation risk** | **Low** |

**Verdict:** **Fully closable in Package 1.**

---

### DASH-B5 — Enterprise mock metrics

| Dimension | Assessment |
|-----------|------------|
| **Scope completeness** | **Adequate with ambiguity** — "feature-gate OR demo-label" |
| **Gaps** | (1) **Which feature flag(s)?** — existing `dashboard_advanced_analytics` etc. vs new flag; (2) **DashboardEnterpriseShowcase** — marketing upsell may remain partial-trust by design; (3) **C-03** default path when feature enabled but no real data — must not show mocks |
| **Hidden dependencies** | `useFeature` / `FeatureGate` infrastructure; `DashboardModuleWrapper` routing |
| **Implementation risk** | **Low-Medium** — product decision on gate vs hide vs demo banner |

**Verdict:** **Closable for default product path** when enterprise panels gated off or demo-labeled; **full B5** (enabled enterprise with real metrics) deferred to Package 3.

---

### DASH-B3 (out of P1 scope — reference)

Partial stub on A-02 only — **not blocking Package 1 authorization**.

---

## 3. Policy Engine review (Area B)

| Action | Manifest alignment | Handler status | P1 coverage target |
|--------|-------------------|----------------|-------------------|
| `dashboard:read` | ✅ `view_dashboard` | ✅ `authorizeDashboardRead` | D-01, D-04, D-08, S-01, A-01, A-03, C-01 |
| `dashboard:write` | ✅ add/remove/customize | ❌ Not implemented | W-01–06, D-03, D-05, S-02–05, D-09, D-11 |
| `dashboard:delete` | 🟡 Implicit in write | ❌ Not implemented | D-06, D-07, D-12 |

**Ownership:** Dashboard module owns PE handlers for `dashboard` resource type; **Drive** owns file migration PE on D-07; **Platform trash** owns adapter pattern for D-10–12 (dashboard module provides policy hook).

**Coverage requirement:** Minimum **20/24** PE paths in P1 for B2 "closed with findings"; **24/24** if trash/file-summary included in P1 scope.

---

## 4. Activity review (Area C)

| Catalog area | Coverage | Missing? |
|--------------|----------|----------|
| Dashboard lifecycle | 5 actions | None |
| Widget lifecycle | 4 actions | None |
| Personalization | 1 action | None |
| Sharing | 2 future slots | Correctly deferred |

**Lifecycle gap:** D-02 silent create must emit `dashboard.create` **or** be removed from GET — charter allows either; **must pick one at kickoff**.

**Missing action:** None for P1 mutations. Optional: `dashboard.update` on layout-only via D-05 vs solely `widget.layout.batch_update` — anti-double-emit rule documented.

---

## 5. Widget trust review (Area D)

| Class (0B) | Count | P1 disposition |
|------------|------:|----------------|
| **Untrusted** | 4 | activityfeed → **Trusted/empty**; enterprise ×3 → **gated or demo-labeled off default path** |
| **Partially trusted** | 4 | quickstats, useDashboardStats, drive, showcase — **remain partial** (empty/hide/stale OK); **not P1 blockers** |
| **Trusted** | 9 | Unchanged |

**Package 1 resolves all untrusted in default personal grid path:** **Yes**, if enterprise route gated and activityfeed placeholder removed.

**Does not resolve:** Drive random share (P3), quickstats analytics delegation (P3), AI quick-stats stub honesty (P1 stub = partial).

---

## 6. Overall definition assessment

| Criterion | Score |
|-----------|------:|
| Workstreams defined | 7/7 |
| Finding → work mapping | 4/4 targeted |
| Acceptance tests specified | 3/5 (PE, activity, trust — missing trash/file-summary acceptance split) |
| Cross-package boundaries | 1 inconsistency (trash PE) |

**Package 1 definition completeness:** **~88%** — sufficient for conditional authorization.

---

## 7. Cross-reference

| Document | Role |
|----------|------|
| [DASHBOARD_PACKAGE1_SCOPE_VALIDATION.md](./DASHBOARD_PACKAGE1_SCOPE_VALIDATION.md) | Scope boundary checklist |
| [DASHBOARD_PACKAGE1_RISK_REVIEW.md](./DASHBOARD_PACKAGE1_RISK_REVIEW.md) | Risk register |
| [DASHBOARD_PACKAGE1_AUTHORIZATION_DECISION.md](./DASHBOARD_PACKAGE1_AUTHORIZATION_DECISION.md) | Formal decision |

---

**Last updated:** 2026-06-21
