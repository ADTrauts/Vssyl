# Account Platform — Foundation Executive Summary

**Program:** Account Platform — PP-1 / PP-3 Foundation Checkpoint  
**Date:** 2026-06-20  
**Audience:** Council / program stakeholders  
**Status:** Governance only

---

## Headline

**PP-2 Settings Platform implementation is authorized to begin.**

PP-1 Phase 1 and PP-3 Package 1 have delivered the constitutional substrates required by ratified **Option C**. No additional foundation gate blocks PP-2.

---

## What completed

### PP-1 Identity Foundation
- Extracted auth, profile, photo, privacy, and connection services
- Policy Engine + normalized activity on identity mutations
- Expanded `userPreferenceService` (validation, PE, domain events, prefix registry substrate)

### PP-3 Entitlement Foundation
- `entitlementService` as single tier resolver
- `Subscription.tier` authoritative; `Business.tier` derived cache
- Read APIs at `/api/account/entitlements` and `/api/account/tier`
- Gating alignment on primary consumer paths

---

## What remains (by design)

| Area | Status | Blocks PP-2? |
|------|--------|--------------|
| PP-2 Settings Platform | Not built | N/A — **next authorized work** |
| PP-3 billing remainder | Deferred | No |
| MFA (PP-1) | Open major | No |
| PP-3 dual billing/payment APIs | Open blocking (cert) | No |
| Certification / ledger | Not started | No |

---

## Findings at a glance

| Program | Closed | Partial | Open blockers | Open majors |
|---------|--------|---------|---------------|-------------|
| **PP-1** | 4 majors | 1 major | 0 for PP-2 | 1 (MFA) |
| **PP-3** | F01, F04 | F02, F05, F07 | F03 (cert only) | F06, F08 |
| **PP-2** | — | — | F01–F03 (to implement) | F04–F09 |

---

## Authorization

| Decision | Value |
|----------|-------|
| **Recommended sequencing** | **A — Start PP-2 now** |
| PP-3 Package 2 | **Wait** until after PP-2 |
| PP-1 cleanup (1B) | Optional parallel — not a gate |
| Next package | **PP-2 Settings Platform** |

---

## Readiness estimate (updated)

| Sub-domain | Phase 0 estimate | Post-foundation estimate | Notes |
|------------|------------------|--------------------------|-------|
| Identity & Profile | ~44% (12/27) | **~78% (21/27)** | L3 WITH FINDINGS path; MFA remains |
| Entitlements | ~44% (12/27) | **~81% (22/27)** | Package 2 needed for full billing alignment |
| Settings | ~37% (10/27) | **~37%** | Unchanged until PP-2 ships |
| Billing (commerce) | ~63% (17/27) | **~68%** | SoR improved; dual APIs remain |
| **Program implementation readiness** | **~45%** | **~58%** | Weighted toward completed foundations |

*Certification readiness remains **NOT CERTIFIABLE** at umbrella level — intentional; certification deferred per program charter.*

---

## Ten-question summary

1. **PP-1 sufficient for PP-2?** Yes.  
2. **PP-3 entitlement sufficient for PP-2?** Yes.  
3. **Open blockers for PP-2 start?** None.  
4. **Open majors?** Yes — MFA, partial tier drift, billing controller fatness — none gate PP-2.  
5. **PP-1 gaps?** MFA, photo hygiene, tests, matrix re-audit.  
6. **PP-3 gaps?** Payment API retirement, billing service, webhook PE/events, remaining tier consumers.  
7. **Can PP-2 start?** **Yes.**  
8. **PP-3 Package 2 wait?** **Yes.**  
9. **Next package?** **PP-2 Settings Platform.**  
10. **Readiness?** **~58%** program implementation; Settings still ~37% until PP-2 delivers.

---

## Next step

Approve and execute **PP-2 Settings Platform Implementation Charter** with scope: `settingsService`, `/api/settings`, preference registry completion, hub IA consolidation, theme server persistence, notification pref adapter.

---

**Related:** [ACCOUNT_PLATFORM_FOUNDATION_CHECKPOINT.md](./ACCOUNT_PLATFORM_FOUNDATION_CHECKPOINT.md) · [PP2_AUTHORIZATION_RECOMMENDATION.md](./PP2_AUTHORIZATION_RECOMMENDATION.md)

**Last updated:** 2026-06-20
