# Account Platform — Executive Summary (Phase 0C)

**Program:** Account Platform Phase 0C — Trilogy Governance & Modernization Sequencing  
**Date:** 2026-06-19  
**Audience:** Product, engineering leadership, architecture council  
**Status:** **Governance complete** — implementation requires separate charters

---

## Bottom line

Account Platform Phase 0B trilogy audits are **complete**. Council **ratifies Option C** modernization sequence:

**PP-1 phases 1–3 + PP-3 Package 1 (parallel) → PP-2 → PP-3 Remainder → phased L3 WITH FINDINGS evaluations → umbrella row.**

**Entitlement SoR:** Active **`Subscription.tier`** via mandatory **`entitlementService`** — deprecate independent **`Business.tier`** writes.

**Account Platform should begin before Dashboard Wave 3 remainder** — revenue/tier risk and identity foundation outweigh layout shell extraction. Wave 3A menus are done; parallel execution on 3C remains allowed.

**First authorized work:** PP-1 Implementation Charter + PP-3 Package 1 Charter (pending council approval of charter documents).

---

## Trilogy at a glance

| Sub-domain | Maturity | G1–G9 | Risk tier | Value rank |
|------------|----------|-------|-----------|------------|
| **PP-1 Identity & Profile** | L1 backend / L2 UX | ~44% | Critical (foundation) | 3 |
| **PP-2 Settings** | L0–L1 | ~37% | Critical (blast radius) | 2 |
| **PP-3 Billing & Entitlements** | L2 backend / L1 UX | ~56% | **Critical (correctness)** | **1** |

---

## Required questions (10)

| # | Question | Answer |
|---|----------|--------|
| 1 | **Recommended modernization order?** | **Option C:** PP-1 phases 1–3 **parallel** PP-3 Package 1 → PP-2 → PP-3 Remainder → phased certifications |
| 2 | **Can PP-3 Package 1 overlap PP-1?** | **Yes.** Tier SoR + `entitlementService` has **no hard PP-1 dependency** — parallel with PP-1 phases 1–3 is **ratified** |
| 3 | **What is the entitlement SoR?** | Active **`Subscription.tier`** resolved through **`entitlementService`** — **`Business.tier` deprecated** as independent write SoR |
| 4 | **Highest-risk domain?** | **PP-3 Entitlements** (tier enum drift — revenue leakage, wrong gating) — tied with PP-2 fragmentation (session blast radius) and PP-1 foundation gap |
| 5 | **Highest-value domain?** | **PP-3 Billing & Entitlements** — revenue, module gating, AI query packs |
| 6 | **What should be modernized first?** | **PP-1 auth/profile extraction** (phases 1–3) **and** **PP-3 Package 1 entitlement SoR** — **in parallel** |
| 7 | **What should not be modernized first?** | PP-2 implementation · PP-3 Remainder UX · Dashboard Wave 3C settings grids · umbrella certification · BA business profile merge |
| 8 | **Dashboard before Account Platform?** | **No** — Account Platform **prioritized** over Wave 3 remainder; **parallel allowed** on separate workstreams |
| 9 | **Certification roadmap?** | PP-3 full L3 WITH FINDINGS (after Remainder) · PP-1 L3 WITH FINDINGS (after remainder) · PP-2 L3 WITH FINDINGS · **umbrella Q2 2027 draft** |
| 10 | **First implementation charter?** | **PP-1 Implementation Charter** + **PP-3 Package 1 Charter** (dual authorization — parallel start) |

---

## Council decisions ratified (Phase 0C)

| Decision | Outcome |
|----------|---------|
| Modernization sequence | **Option C** |
| Entitlement SoR | `Subscription.tier` + `entitlementService` |
| `Business.tier` | Deprecate independent writes |
| PP-2 implementation gate | After PP-1 phases 1–3 + Package 1 |
| Portfolio priority | Account Platform before Dashboard Wave 3 remainder |
| Certification execution | **Not authorized** by Phase 0C |
| Ledger updates | **Not performed** |

---

## Phase 0 program status

| Phase | Status |
|-------|--------|
| **0A** Reality assessment | ✅ Complete |
| **0B-1** PP-1 audit | ✅ Complete |
| **0B-2** PP-2 audit | ✅ Complete |
| **0B-3** PP-3 audit | ✅ Complete |
| **0C** Council review & sequencing | ✅ **Complete** |
| **1A** Implementation charters | ⏳ **Next — requires council charter votes** |

---

## Deliverables index

### Phase 0C (this package)

| Document | Purpose |
|----------|---------|
| [ACCOUNT_PLATFORM_COUNCIL_REVIEW.md](./ACCOUNT_PLATFORM_COUNCIL_REVIEW.md) | Full council review A–F |
| [ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md](./ACCOUNT_PLATFORM_DEPENDENCY_MODEL.md) | Authoritative dependency graph |
| [ACCOUNT_PLATFORM_MODERNIZATION_SEQUENCE.md](./ACCOUNT_PLATFORM_MODERNIZATION_SEQUENCE.md) | Option C detail + entitlement governance |
| [ACCOUNT_PLATFORM_CERTIFICATION_ROADMAP.md](./ACCOUNT_PLATFORM_CERTIFICATION_ROADMAP.md) | Sub-domain + umbrella cert paths |
| This summary | Executive brief |

### Phase 0A

| Document | Purpose |
|----------|---------|
| [ACCOUNT_PLATFORM_EXECUTIVE_SUMMARY.md](./ACCOUNT_PLATFORM_EXECUTIVE_SUMMARY.md) | Domain discovery brief |
| [ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md](./ACCOUNT_PLATFORM_REALITY_ASSESSMENT.md) | Full inventory |
| [ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md](./ACCOUNT_PLATFORM_OWNERSHIP_MODEL.md) | Phase 0A ownership (superseded per-sub-domain by PP docs) |

### Phase 0B trilogy

| Program | Executive summary |
|---------|-------------------|
| PP-1 | [PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md](./PP1_IDENTITY_PROFILE_EXECUTIVE_SUMMARY.md) |
| PP-2 | [PP2_SETTINGS_EXECUTIVE_SUMMARY.md](./PP2_SETTINGS_EXECUTIVE_SUMMARY.md) |
| PP-3 | [PP3_BILLING_ENTITLEMENTS_EXECUTIVE_SUMMARY.md](./PP3_BILLING_ENTITLEMENTS_EXECUTIVE_SUMMARY.md) |

---

## Stop condition confirmation

| Constraint | Status |
|------------|--------|
| Governance only | ✅ |
| No runtime code changes | ✅ |
| No services created | ✅ |
| No certification execution | ✅ |
| No ledger updates | ✅ |
| No implementation packages | ✅ |

---

## Recommended next step

Council session to approve:

1. **PP-1 Implementation Charter** (auth + profile + photo phases 1–3)
2. **PP-3 Package 1 Charter** (entitlement SoR + `entitlementService`)

Defer PP-2 charter until Phase 1 gate.

---

**Last updated:** 2026-06-19 (Phase 0C)
