# Platform Controller Functional Gap Register

**Program:** Platform Controller Phase 1C  
**Date:** 2026-06-24  
**Purpose:** Ranked backlog of truth gaps, misleading UI, and weak backend paths

**Severity:** Critical · High · Medium · Low  
**Effort:** S · M · L

---

## Gap register

| ID | Area | Gap | Severity | Status class | Effort | Recommended action | Owner hint |
|----|------|-----|----------|--------------|--------|-------------------|------------|
| **G-001** | Billing | Subscription `amount` always 0 in PC UI — no column; Stripe amounts in `stripeMetadata` only | **Critical** | Partially Working | S | Map display amount from metadata or add `amount` field | Billing / platform |
| **G-002** | Billing | `getSubscriptions` summary uses `additionalEmployeeCost` not MRR | **High** | Partially Working | S | Sum from metadata items or Stripe sync field | Billing |
| **G-003** | Security | `getAdminSecurityModuleMetrics` uses `Math.random()` for violations, alerts, compliance, threat | **Critical** | Stub/UI Only | S | Remove widget or wire to `securityEvent` aggregates | Security / admin |
| **G-004** | Programs | Platform Kernel card green = host CPU/memory, not kernel SLO | **High** | Partially Working | S | Relabel healthSummary text (1D) | Platform Controller |
| **G-005** | Programs | Context Graph healthy = source count > 0 | **High** | Partially Working | M | Add probe failures to health; rename metric | AI platform |
| **G-006** | Programs | Marketplace runtime healthy = pending submissions ≤ 5 | **High** | Partially Working | S | Rename to queue depth; separate runtime probe | Marketplace |
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
| **G-019** | API | Hub does not surface `readinessRes.error` in error array | **Low** | Partially Working | S | Add to errors[] in hook | Frontend |
| **G-020** | Governance | Security events list depends on writers populating `securityEvent` | **Medium** | Partially Working | M | Audit event emission coverage | Security |

---

## Misleading UI register

| UI element | Location | What user may believe | Actual behavior |
|------------|----------|----------------------|-----------------|
| Subscription amount column | Billing | Stripe MRR | Always 0 unless metadata parsed client-side |
| Security compliance score | Security | Audited compliance | Random 80–100 |
| Threat level badge | Security | Live threat intel | Random low/medium/high |
| Platform Kernel green | Programs hub | Kernel certified + healthy | Host CPU/memory OK |
| Context Graph green | Programs hub | Graph engine healthy | ≥1 catalog source |
| Marketplace green | Programs hub | Partner runtime OK | ≤5 pending reviews |
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

1. **G-003** Remove or fix random security metrics  
2. **G-001** Subscription amount truth in billing UI  
3. **G-004–G-006** Programs card health label honesty (copy + tooltips)

### P1 — Financial truth

4. **G-002** Subscription summary aggregation  
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

These are **documentation-identified** fixes that meet Phase 1C "small fix for truthful display" bar:

| Fix | Type | Files (indicative) |
|-----|------|-------------------|
| Parse `stripeMetadata.items` for subscription amount in route mapper | Backend | `adminPortalRoutes.analyticsOps.ts` |
| Remove random metrics; return `status: 'unavailable'` | Backend | `adminSecurityService.ts` |
| Programs card health copy | Frontend | `usePlatformProgramsHubHealth.ts` |
| Dashboard label "Total users" not "Active" | Frontend | dashboard page |
| Add `readinessRes.error` to hub errors | Frontend | `usePlatformProgramsHubHealth.ts` |

**Not authorized in Phase 1C** — listed for Phase 1D planning.

---

**Last updated:** 2026-06-24
