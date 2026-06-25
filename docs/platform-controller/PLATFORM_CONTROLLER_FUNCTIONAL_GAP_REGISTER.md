# Platform Controller Functional Gap Register

**Program:** Platform Controller Phase 1C → 1D → **1E**  
**Date:** 2026-06-24 (register) · **1D closeout:** 2026-06-25 · **1E operational validation:** 2026-06-25  
**Purpose:** Ranked backlog of truth gaps, misleading UI, and weak backend paths

**Phase 1D resolved:** G-001, G-002 (summary), G-003, G-004, G-005 (copy), G-006 (copy), G-019 — see [Phase 1D truth fixes](./PLATFORM_CONTROLLER_PHASE_1D_TRUTH_FIXES.md)

**Phase 1E validated:** GCP live probes, Stripe route/secrets, marketplace billing chain, Programs card sources — see [Phase 1E executive summary](./PLATFORM_CONTROLLER_PHASE_1E_EXECUTIVE_SUMMARY.md). New operational gaps **E-001–E-013** below.

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
| **G-014** | Ops | Stripe webhook correctness not verified in this audit | **High** | **Validated 1E (route only)** | S | Dashboard delivery checklist — see **E-001** | DevOps |
| **G-015** | Ops | Invoice rows depend on webhook population — may lag Stripe | **High** | Partially Working | M | Scheduled `syncAll` + monitoring — see **E-002** | Billing |
| **G-016** | Programs | Static certification badges on cards not tied to live validation | **Medium** | Stub/UI Only | M | Link to certification API or remove badge from health row | Governance |
| **G-017** | Modules | Business-billing-probe is DB truth not Stripe truth | **Medium** | Partially Working | S | Document in UI tooltip | Marketplace |
| **G-018** | Performance | Single-host metrics presented as platform performance | **Medium** | Partially Working | M | Label as node-local or aggregate cluster | Infra |
| **G-019** | API | Hub does not surface `readinessRes.error` in error array | **Low** | **Resolved (1D)** | S | ~~Add to errors[] in hook~~ | Frontend |
| **G-020** | Governance | Security events list depends on writers populating `securityEvent` | **Medium** | Partially Working | M | Audit event emission coverage | Security |

---

## Phase 1E operational gap register (E-series)

Ranked by production impact. Full evidence in [GCP + Stripe validation](./PLATFORM_CONTROLLER_GCP_STRIPE_VALIDATION.md).

| ID | Priority | Area | Gap | Status | Effort | Action |
|----|----------|------|-----|--------|--------|--------|
| **E-001** | **P0** | Stripe | Webhook **delivery** not confirmed in Stripe Dashboard — tier/module state may drift | Needs Manual Verification | S | Operator: verify endpoint URL, events, signing secret, recent deliveries |
| **E-002** | **P0** | Billing | Historical tier subs may show **Unavailable** until `StripeSyncService` populates `stripeMetadata` | Partially Working | S | Run admin sync-all; spot-check metadata in prod DB |
| **E-003** | **P1** | Marketplace | **Dual subscription tables** (`moduleSubscription` + `businessModuleSubscription`) — no automated reconciliation | Partially Working | M | Reconciliation job or unified ops view |
| **E-004** | **P1** | Billing | PC billing list surfaces tier `Subscription` only — not `business_module_subscriptions` | Partially Working | M | Extend PC billing or document business-billing-probe as SoT |
| **E-005** | **P1** | Marketplace | Paid business module **live E2E** not executed in 1E | Needs Manual Verification | M | Staging: free install + paid subscribe + entitlement check |
| **E-006** | **P1** | GCP | `/api/health` validates DB only — not Stripe or GCS | Partially Working | S | Add optional deep readiness or ops runbook |
| **E-007** | **P2** | Billing | Developer revenue vs `moduleSubscription` deltas (G-009) | Partially Working | M | Reconciliation + alert |
| **E-008** | **P2** | Dashboard | `monthlyRevenue` scope module-centric (G-008) | Partially Working | S | Combine tier + module revenue |
| **E-009** | **P2** | Billing | AI provider expenses silent on API failure (G-010) | Partially Working | S | Surface errors in UI |
| **E-010** | **P2** | Programs | Pipeline / retrieval metrics empty if no prod traces | Data-dependent | S | Interpret zeros as low activity; confirm trace writers |
| **E-011** | **P3** | Programs | Fleet-wide Unified Search readiness beyond pilot module | Future | M | Expand readiness probes |
| **E-012** | **P3** | Programs | No dedicated Marketplace runtime health endpoint | Future | M | Runtime probe API |
| **E-013** | **P3** | GCP | GCS signed URL path not smoke-tested in prod | Code only | S | One artifact upload + signed read |

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

| Section | Frontend | API | Service | DB / external | Weakness (post-1D/1E) |
|---------|----------|-----|---------|---------------|----------------------|
| Security metrics | security page | `/security/module-metrics` | `adminSecurityService` | `securityEvent` | Coverage depends on writers (G-020) |
| Billing subscriptions | billing | `/billing/subscriptions` | `adminBillingService` | `subscription` | Unknown amount until sync (E-002); no business module rows (E-004) |
| Dashboard stats | dashboard | `/dashboard/stats` | `adminAnalyticsService` | mixed | activeUsers, revenue scope (G-007, G-008) |
| Programs hub | platform-programs | 5 probes | client heuristics | proxies | Honest copy (1D); data volume varies (E-010) |
| Provider expenses | billing expenses | `/admin/ai-providers/expenses/*` | OpenAI/Anthropic services | external | Silent null (G-010, E-009) |
| Business AI confidence | business-ai | `/admin/business-ai/global` | `adminBusinessAI` | placeholder field | Not real (G-011) |
| Business module billing | modules probe | business-billing-probe | `businessBillingProbe` | `businessModuleSubscription` | DB truth not Stripe truth (G-017) |

---

## Test coverage gaps

| Gap | Priority | Notes |
|-----|----------|-------|
| ~~No test asserts security metrics are non-random~~ | — | Addressed in 1D (`platformControllerPhase1D.test.ts`) |
| ~~No unit test admin billing amounts~~ | — | Addressed in 1D (`subscriptionDisplayAmount.test.ts`) |
| Programs health heuristics untested | P2 | Copy honest; thresholds untested |
| No E2E PC billing Stripe sync against prod | P1 | **E-001, E-002** — ops checklist |
| No live marketplace paid module E2E | P1 | **E-005** |
| Provider expense error paths untested | P3 | **E-009** |

---

## Ranked implementation priorities (cross-area)

### P0 — Stop misleading operators

1. ~~**G-003** Remove or fix random security metrics~~ ✅ Phase 1D  
2. ~~**G-001** Subscription amount truth in billing UI~~ ✅ Phase 1D  
3. ~~**G-004–G-006** Programs card health label honesty~~ ✅ Phase 1D (copy)

### P1 — Financial truth

4. ~~**G-002** Subscription summary aggregation~~ ✅ Phase 1D  
5. **E-001** Stripe webhook Dashboard delivery (P0 ops)  
6. **E-002** Sync metadata for historical tier amounts (P0 ops)  
7. **E-003–E-005** Marketplace dual-table + PC billing scope + live E2E  
8. **G-008** / **E-008** Dashboard revenue scope  
9. **G-009** / **E-007** Developer revenue reconciliation  
10. **G-014–G-015** Stripe webhook + invoice sync (route verified 1E; delivery open)

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

## Phase 1E deliverables

| Document |
|----------|
| [PLATFORM_CONTROLLER_GCP_STRIPE_VALIDATION.md](./PLATFORM_CONTROLLER_GCP_STRIPE_VALIDATION.md) |
| [STRIPE_OPERATIONAL_VALIDATION.md](./STRIPE_OPERATIONAL_VALIDATION.md) |
| [MARKETPLACE_BILLING_E2E_VALIDATION.md](./MARKETPLACE_BILLING_E2E_VALIDATION.md) |
| [GCP_RUNTIME_VALIDATION.md](./GCP_RUNTIME_VALIDATION.md) |
| [PLATFORM_PROGRAMS_OPERATIONAL_DATA_VALIDATION.md](./PLATFORM_PROGRAMS_OPERATIONAL_DATA_VALIDATION.md) |
| [PLATFORM_CONTROLLER_PHASE_1E_EXECUTIVE_SUMMARY.md](./PLATFORM_CONTROLLER_PHASE_1E_EXECUTIVE_SUMMARY.md) |

---

**Last updated:** 2026-06-25 (Phase 1E)
