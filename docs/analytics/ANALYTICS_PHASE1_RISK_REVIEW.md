# Analytics Capability — Phase 1 Risk Review

**Program:** Analytics Capability — Constitutional Modernization  
**Phase:** 1 — Federated L2 Engineering  
**Date:** 2026-06-22  
**Status:** Risk review — **governance only**

**Prior:** [ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md](./ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md) (Phase 0A)

---

## 1. Risk review summary

Phase 1 is **medium risk, high value** — primarily refactoring and boundary enforcement within an existing partial implementation. Highest risks are **ownership violations** (mock surfaces, placeholder subscriber) and **coupling violations** (Chat/Todo Prisma in capability layer). No schema or warehouse risk in Phase 1 scope.

**Overall risk posture:** **Acceptable** for conditional authorization.

---

## 2. Highest-risk ownership violations

| ID | Violation | Severity | Phase 1 remediation |
|----|-----------|----------|---------------------|
| **OV-01** | Business workspace analytics mock presented as product module | **Critical** | Wire or hide segment (K1-01) |
| **OV-02** | Placeholder event subscriber implies pipeline maturity | **High** | Remove subscriber |
| **OV-03** | `analytics` pseudo-module registry implies L3 product module | **High** | Registry doc + ownership registry; ledger proposal deferred |
| **OV-04** | Dashboard enterprise panels partially mock while capability data exists | **Medium** | Gate, wire, or honest degraded UI (K1-02) |
| **OV-05** | Orphan components (`BusinessAnalyticsDashboard`, `ChatAnalytics`) bypass ownership registry | **Medium** | Mount or delete (K1-04) |
| **OV-06** | Admin Portal vs tenant analytics boundary confusion | **Low** | Ownership registry clarifies |
| **OV-07** | Personal analytics page misnamed as privacy hub adjacent | **Low** | Document in registry — no Phase 1 UX change required |
| **OV-08** | HR/Scheduling widgets use module APIs while QuickStats uses capability — dual pattern | **Low** | Document as intentional (module interior vs cross-module) |

### 2.1 Ownership violation priority

**Must fix in Phase 1:** OV-01, OV-02  
**Should fix in Phase 1:** OV-03 (documentation), OV-04, OV-05  
**Document only:** OV-06, OV-07, OV-08

---

## 3. Highest-risk coupling violations

| ID | Violation | Severity | Phase 1 remediation |
|----|-----------|----------|---------------------|
| **CV-01** | `analyticsDashboardSummaryService` direct Prisma on Chat messages/conversations | **Critical** | Chat module rollup API |
| **CV-02** | Direct Prisma on Todo `task` table | **Critical** | Todo module rollup API |
| **CV-03** | `analyticsController` inline Prisma for personal/module/export | **High** | `analyticsCapabilityService` extraction |
| **CV-04** | Personal analytics reads Activity model — activity/analytics conflation | **High** | Service extraction + aggregate-only DTO |
| **CV-05** | Dual `PersonalAnalytics` types (platform vs Place) | **Medium** | Rename or namespace DTOs |
| **CV-06** | `businessAnalyticsService` duplicated logic vs admin aggregates | **Medium** | Document canonical source per metric — no merge in P1 |
| **CV-07** | Enterprise projection couples capability to business service | **Low** | Acceptable federation — document in operation matrix |
| **CV-08** | Calendar/Drive/Notification paths | **Low** | Already use module boundaries — retain |

### 3.1 Coupling remediation sequence

1. **CV-03** — service extraction (unblocks PE parity)
2. **CV-01, CV-02** — module rollup APIs (highest trust risk)
3. **CV-04** — activity separation in personal analytics
4. **CV-05** — DTO cleanup (can parallel)

---

## 4. Mock and placeholder systems — removal mandate

| System | Location | Risk if retained | Phase 1 action |
|--------|----------|------------------|----------------|
| **Placeholder analytics subscriber** | `analyticsDomainEventSubscriber.ts` | False L2/L3 signal; ops noise | **REMOVE** |
| **Business workspace mock page** | `workspace/analytics/page.tsx` | User trust erosion | **WIRE or HIDE** |
| **CrossModuleAnalyticsPanel mock cells** | Enterprise dashboard components | Misleading BI | Degraded honest empty OR gate |
| **CalendarAnalyticsPanel mock** | Calendar enterprise | Module scope | Defer to Calendar — document |
| **PersonalStatsWidget mock** | Business front-page | Lower traffic | Optional hygiene |
| **Unwired `ai/analytics/*` engines** | Server AI package | Schema drift pressure | **Do not wire** — document exclusion |

---

## 5. Security and trust risks

| Risk | Likelihood | Impact | Phase 1 mitigation |
|------|------------|--------|-------------------|
| AP1–AP5 not enforced on personal/module/export | High | High | PE parity workstream |
| Aggregate enumeration via module analytics | Medium | High | Tenant scope validation in service layer |
| Cross-tenant dashboard summary leak | Low | Critical | Retain `evaluateDashboardPolicyDual` |
| Export path over-disclosure | Medium | High | PE on export; audit log defer Phase 3 |
| Cache cross-tenant leak (if Redis) | Low | Critical | Tenant-keyed cache keys; K1-05 review |

---

## 6. Implementation risks

| Risk | Mitigation |
|------|------------|
| Module teams delay rollup APIs | Phase 1 can ship with temporary adapter if module exposes service method — not controller Prisma in analytics layer |
| Dashboard facade regression | Contract tests + existing facade tests |
| Breaking `/api/analytics/personal` consumers | Profile page only — contract test before merge |
| Scope creep into warehouse | SB-05 gate in authorization decision |
| Scope creep into event pipeline | SB-06 gate; subscriber removal only |

---

## 7. Findings blocking L2 readiness (pre-Phase 1)

| ID | Finding | Blocks L2? | Phase 1 closes? |
|----|---------|------------|-----------------|
| **AN-01** | No unified capability service | **Yes** | **Yes** |
| **AN-02** | Chat/Todo Prisma coupling | **Yes** | **Yes** |
| **AN-03** | PE gap on 3/4 capability routes | **Yes** | **Yes** |
| **AN-04** | Placeholder subscriber | **Yes** | **Yes** |
| **AN-05** | Mock business workspace | **Yes** | **Yes** |
| **AN-06** | No operation matrix | **Yes** | **Yes** |
| **AN-07** | No ownership registry | **Yes** | **Yes** |
| **AN-08** | Activity conflation in personal | **Partial** | **Yes** (service layer) |
| **AN-09** | No event pipeline | **No** — deferred Phase 2 | N/A |
| **AN-10** | No warehouse | **No** — deferred Phase 2 | N/A |
| **AN-11** | Enterprise panels unwired | **Partial** | Optional K1-02 |
| **AN-12** | Ledger misclassification | **Governance** | Proposal only — not L2 technical block |

**L2 blockers Phase 1 must close:** AN-01 through AN-08 (minimum).

---

## 8. Residual risks (post-Phase 1 expected)

| Risk | Expected residual |
|------|-------------------|
| Query fan-out at scale | Medium — cache optional |
| No historical trends | High — Phase 3 |
| Relationship analytics absent | High — Phase 2–3 |
| Enterprise panel product gap | Medium — K1-02 dependent |
| Operator vs tenant metric drift | Low — documented |

---

## 9. Risk acceptance

| Category | Accept for Phase 1 ACT? |
|----------|-------------------------|
| Ownership violations OV-01–02 | **No** — must remediate |
| Coupling CV-01–03 | **No** — must remediate |
| No warehouse | **Yes** — by design SB-05 |
| No event pipeline | **Yes** — by design SB-06 |
| Performance at scale | **Yes** — cache optional |
| L2 certification not in Phase 1 | **Yes** — separate candidacy |

---

## 10. Required questions — risk subset

| # | Question | Answer |
|---|----------|--------|
| 7 | Highest-risk ownership violations? | Mock business workspace (OV-01); placeholder subscriber (OV-02); pseudo-module pretense (OV-03) |
| 8 | Highest-risk coupling violations? | Chat/Todo direct Prisma (CV-01, CV-02); controller inline Prisma (CV-03); Activity conflation (CV-04) |
| 9 | Mock/placeholder systems to remove? | Analytics placeholder subscriber; business workspace mock; enterprise panel mock cells; orphan components (disposition) |

---

**Last updated:** 2026-06-22
