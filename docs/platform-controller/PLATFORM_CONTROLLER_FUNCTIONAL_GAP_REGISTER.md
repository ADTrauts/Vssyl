# Platform Controller Functional Gap Register

**Program:** Platform Controller Phase 1C → updated Phase 1D  
**Date:** 2026-06-24 (register) · **1D closeout:** 2026-06-25  
**Purpose:** Ranked backlog of truth gaps, misleading UI, and weak backend paths

**Phase 1D resolved:** G-001, G-002 (summary), G-003, G-004, G-005 (copy), G-006 (copy), G-019 — see [Phase 1D truth fixes](./PLATFORM_CONTROLLER_PHASE_1D_TRUTH_FIXES.md)

**Severity:** Critical · High · Medium · Low  
**Effort:** S · M · L

---

## Gap register

| ID | Area | Gap | Severity | Status class | Effort | Recommended action | Owner hint |
|----|------|-----|----------|--------------|--------|-------------------|------------|
| **G-001** | Billing | Subscription `amount` always 0 in PC UI — no column; Stripe amounts in `stripeMetadata` only | **Critical** | **Resolved (1D)** | S | ~~Map display amount from metadata~~ | Billing / platform |
| **G-002** | Billing | `getSubscriptions` summary uses `additionalEmployeeCost` not MRR | **High** | **Resolved (1D)** | S | ~~Sum from metadata items~~ | Billing |
| **G-003** | Security | `getAdminSecurityModuleMetrics` uses `Math.random()` for violations, alerts, compliance, threat | **Critical** | **Resolved (1D)** | S | ~~Remove widget or wire to securityEvent~~ | Security / admin |
| **G-004** | Programs | Platform Kernel card green = host CPU/memory, not kernel SLO | **High** | **Resolved (1D copy)** | S | ~~Relabel healthSummary text~~ | Platform Controller |
| **G-005** | Programs | Context Graph healthy = source count > 0 | **High** | **Resolved (1D copy)** | M | Probe failures still future; copy honest | AI platform |
| **G-006** | Programs | Marketplace runtime healthy = pending submissions ≤ 5 | **High** | **Resolved (1D copy)** | S | Runtime probe still future; copy honest | Marketplace |
| **G-007** | Dashboard | `activeUsers` === `totalUsers` (no inactive distinction) | **Medium** | Partially Working | S | Use last-login or session metric | Analytics |
| **G-008** | Dashboard | `monthlyRevenue` excludes tier `Subscription` revenue | **High** | Partially Working | S | Combine tier + module subscription sums | Billing / analytics |
| **G-009** | Billing | Developer `financialValidation` deltas may be non-zero | **High** | Partially Working | M | Reconciliation job + admin alert | Marketplace / billing |
| **G-010** | Billing | Provider expenses return $0 on API failure (silent catch) | **Medium** | Needs Manual Verification | S | Propagate provider errors to UI | AI ops |
| **G-011** | AI | Business AI `averageConfidence` placeholder in global metrics | **Medium** | Partially Working | S | Compute from real data or hide field | Business AI |
| **G-012** | AI | AI System launcher implies unified health without SoT | **Low** | Partially Working | S | Deprecate; point to Programs + Pipeline | Platform Controller |
| **G-013** | AI | Legacy `ai-learning` / `ai-context` duplicate surfaces | **Low** | Partially Working | M | Retire routes per Phase 1A plan | Platform Controller |
| **G-014** | Ops | Stripe webhook correctness not verified in this audit | **High** | Needs Manual Verification | S | Prod webhook checklist | DevOps |
| **G-015** | Ops | Invoice rows depend on webhook population — may lag Stripe | **High** | Partially Working | M | Scheduled `syncAll` + monitoring | Billing |
| **G-016** | Programs | Static certification badges on cards not tied to live validation | **Medium** | Stub/UI Only | M | Link to certification API or remove badge from health row | Governance |
| **G-017** | Modules | Business-billing-probe is DB truth not Stripe truth | **Medium** | Partially Working | S | Document in UI tooltip | Marketplace |
| **G-018** | Performance | Single-host metrics presented as platform performance | **Medium** | Partially Working | M | Label as node-local or aggregate cluster | Infra |
| **G-019** | API | Hub does not surface `readinessRes.error` in error array | **Low** | **Resolved (1D)** | S | ~~Add to errors[] in hook~~ | Frontend |
| **G-020** | Governance | Security events list depends on writers populating `securityEvent` | **Medium** | Partially Working | M | Audit event emission coverage | Security |

---

## Misleading UI register

| UI element | Location | What user may believe | Actual behavior |
|------------|----------|----------------------|-----------------|
| Subscription amount column | Billing | Stripe MRR | **Unavailable** / **Free** / known amount from metadata |
| Security compliance score | Security (module dashboard) | Audited compliance | **Requires instrumentation** |
| Threat level badge | Security (module dashboard) | Live threat intel | From unresolved events or unavailable |
| Platform Kernel badge | Programs hub | Kernel certified + healthy | **Within threshold** + infrastructure pressure copy |
| Context Graph badge | Programs hub | Graph engine healthy | **Registered sources** copy |
| Marketplace badge | Programs hub | Partner runtime OK | **Review queue** copy |
| Active users stat | Dashboard | Recently active users | Total user count |
| Monthly revenue | Dashboard | All platform revenue | Module subs only |

---

## Admin API weak paths

| Section | Frontend | API | Service | DB / external | Weakness |
|---------|----------|-----|---------|---------------|----------|
| Security metrics | security page | security module metrics route | `adminSecurityService` | **Random** | **Fake data** |
| Billing subscriptions | billing | `/billing/subscriptions` | `adminBillingService` | `subscription` | Amount mapping |
| Dashboard stats | dashboard | `/dashboard/stats` | `adminAnalyticsService` | mixed | activeUsers, revenue scope |
| Programs hub | platform-programs | 5 probes | client heuristics | proxies | Semantic mismatch |
| Provider expenses | billing expenses | `/admin/ai-providers/expenses/*` | OpenAI/Anthropic services | external | Silent null |
| Business AI confidence | business-ai | `/admin/business-ai/global` | `adminBusinessAI` | placeholder field | Not real |

---

## Test coverage gaps

| Gap | Priority |
|-----|----------|
| No test asserts security metrics are non-random | P1 |
| No integration test admin billing amounts | P1 |
| Programs health heuristics untested | P2 |
| No E2E PC billing Stripe sync | P2 |
| Provider expense error paths untested | P3 |

---

## Ranked implementation priorities (cross-area)

### P0 — Stop misleading operators

1. ~~**G-003** Remove or fix random security metrics~~ ✅ Phase 1D  
2. ~~**G-001** Subscription amount truth in billing UI~~ ✅ Phase 1D  
3. ~~**G-004–G-006** Programs card health label honesty~~ ✅ Phase 1D (copy)

### P1 — Financial truth

4. ~~**G-002** Subscription summary aggregation~~ ✅ Phase 1D  
5. **G-008** Dashboard revenue scope  
6. **G-009** Developer revenue reconciliation  
7. **G-014–G-015** Stripe webhook + invoice sync verification (ops)

### P2 — Operator clarity

8. **G-007** Active users metric  
9. **G-010** Provider expense errors  
10. **G-011** Business AI confidence  
11. **G-017** Billing probe labeling

### P3 — Consolidation / debt

12. **G-012–G-013** Legacy AI surface retirement  
13. **G-016** Certification badge sourcing  
14. **G-018** Performance metrics scope labeling

---

## Small fixes eligible without redesign (1D candidates)

**Completed in Phase 1D** — see [PLATFORM_CONTROLLER_PHASE_1D_TRUTH_FIXES.md](./PLATFORM_CONTROLLER_PHASE_1D_TRUTH_FIXES.md).

Remaining candidates for a future pass:

| Fix | Type | Files (indicative) |
|-----|------|-------------------|
| Dashboard label "Total users" not "Active" | Frontend | dashboard page |
| Provider expense error surfacing | Backend + Frontend | `ai-provider-usage.ts`, `ProviderExpensesView` |

---

**Last updated:** 2026-06-25
