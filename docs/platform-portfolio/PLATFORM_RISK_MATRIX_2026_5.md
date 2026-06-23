# Platform Risk Matrix 2026.5

**Program:** Platform Portfolio Refresh 2026.5  
**Date:** 2026-06-23  
**Status:** Post Platform Kernel L2 CwF execution — risk scoring refreshed  
**Supersedes for prioritization:** [`PLATFORM_RISK_MATRIX_2026.md`](./PLATFORM_RISK_MATRIX_2026.md)

---

## Scoring model

| Dimension | Weight | Scale |
|-----------|--------|-------|
| **User impact** | 25% | 1 (low) – 5 (daily critical path) |
| **Revenue / trust** | 20% | 1 – 5 |
| **Constitutional drift** | 25% | 1 – 5 (5 = violates §16/§4/§7) |
| **Integration blast radius** | 15% | 1 – 5 |
| **Remediation cost** | 15% | 1 (small) – 5 (multi-quarter) — inverted in score |

**Risk score** = weighted sum (max 25). **Tier:** Critical ≥20 · High 16–19 · Medium 12–15 · Low <12

---

## Risk matrix (refreshed post-Wave-3)

| ID | Area | User | Revenue | Drift | Blast | Cost | **Score** | **Tier** | Δ since 2026 |
|----|------|------|---------|-------|-------|------|-----------|----------|--------------|
| **R-01** | AI Platform stub executors (fake success) | 4 | 4 | 5 | 5 | 4 | **21.5** | **Critical** | — |
| **R-02** | Module Activity legacy read paths (ACT-R1) | 3 | 2 | 4 | 5 | 4 | **17.0** | **High** | **↓ Mitigated** — Platform Kernel L2 CwF; reads closed |
| **R-03** | Policy Engine read-path gaps | 3 | 3 | 4 | 4 | 3 | **16.5** | **High** | ↑ **#1 architectural debt** |
| **R-04** | Account Platform certificate majors | 5 | 4 | 3 | 4 | 3 | **18.5** | **High** | — |
| **R-05** | Dashboard L3 CwF majors (M1-R, M4, M5, M7) | 5 | 3 | 2 | 3 | 3 | **13.5** | **Medium** | ↓ post-cert |
| **R-06** | Domain Events thin taxonomy + stub subscribers | 2 | 2 | 4 | 4 | 3 | **15.5** | **Medium** | **↓ Mitigated** — Kernel L2 CwF; stubs gated |
| **R-07** | Analytics L2 CwF majors (AN-M2–M6) | 3 | 3 | 2 | 3 | 3 | **12.5** | **Medium** | ↓ post-cert |
| **R-08** | Search — no unified discovery audit | 4 | 2 | 3 | 4 | 4 | **15.0** | **Medium** | ↑ user impact (L3 density) |
| **R-09** | Manifest governance capability drift | 2 | 2 | 3 | 4 | 3 | **14.5** | **Medium** | — |
| **R-10** | Platform Scheduler §22 inventory incomplete | 2 | 2 | 3 | 3 | 3 | **13.0** | **Medium** | — |
| **R-11** | Realtime — no platform audit row | 3 | 2 | 2 | 3 | 3 | **13.5** | **Medium** | — |
| **R-12** | Reference Workspace 11 advisories | 4 | 2 | 2 | 3 | 3 | **14.5** | **Medium** | — |
| **R-13** | Search provider gaps (todo, calendar, notes missing) | 4 | 2 | 2 | 3 | 3 | **14.0** | **Medium** | **New** |
| **R-14** | Billing legacy `/payment` overlap | 2 | 4 | 2 | 3 | 2 | **14.0** | **Medium** | — |
| **R-15** | Member connections PE gaps | 3 | 3 | 3 | 3 | 2 | **15.0** | **Medium** | — |
| **R-16** | Marketplace pipeline unaudited | 2 | 3 | 2 | 3 | 4 | **14.0** | **Medium** | — |
| **R-17** | BO domain 17 advisories | 2 | 2 | 2 | 2 | 3 | **11.5** | **Low** | — |
| **R-18** | Context Graph 8 advisories | 2 | 2 | 2 | 3 | 2 | **11.5** | **Low** | — |
| **R-19** | Calendar / Place post-L3 hygiene | 2 | 1 | 2 | 2 | 2 | **10.5** | **Low** | — |
| **R-20** | V_Link resolver expansion partial | 2 | 2 | 2 | 3 | 2 | **11.5** | **Low** | — |

### Retired / resolved risks (2026 → 2026.5)

| Former area | Resolution |
|-------------|------------|
| Dashboard L1 uncertified critical path | **Closed** — L3 CwF 24/27 (2026-06-21) |
| Analytics L1 scope ambiguity | **Closed** — L2 CwF Hybrid Domain (2026-06-22) |
| ACT-R1 / Module Activity reads | **Closed** — Platform Kernel L2 CwF (2026-06-23) |
| DE stub subscribers | **Closed** — DE-1 gating; Kernel L2 CwF (2026-06-23) |
| Identity / Settings / Billing unaudited | **Closed** — Account Platform L3 CwF (2026-06-20) |
| Reference Workspace WS-L3 blocked | **Closed** — WS-L3 CwF (2026-06-19) |

---

## Risk tier summary

| Tier | Count | Areas |
|------|-------|-------|
| **Critical** | 1 | AI stub executors |
| **High** | 3 | PE read gaps, AP majors, ACT-R1 residual (certificate) |
| **Medium** | 10 | Search, Dashboard CwF, Analytics CwF, **Kernel CwF**, Scheduler, Manifest, Realtime, WS advisories, Search gaps, Billing, Member PE, Marketplace |
| **Low** | 4 | BO/CG advisories, Calendar/Place hygiene, V_Link |

---

## Required risk answers

### Highest platform risk

**AI stub executors (R-01)** — AI actions may report success without execution. Violates constitutional trust (§16). Affects UX Ref #4, all L3 module AI context providers, and Digital Life Twin governance.

### Highest architectural debt

**Policy Engine read-path gaps (R-03)** — Remaining authorization inconsistency on reads across modules. ACT-R1 **closed** at Platform Kernel L2 CwF (2026-06-23).

### Risk heatmap by portfolio layer

```
                    Low risk    Medium      High        Critical
Kernel/adjacent     BO/CG adv.  DomEvents   Activity    —
                    Cal/Place   Search      PE reads    AI stubs
                    V_Link      Scheduler   AP majors   —
                                Manifest    —           —
                                Realtime
User modules        Notes L2    Dashboard   —           —
                                Analytics
Platform AI         —           AP adv.     —           —
Commerce            —           Billing     —           —
Workspace           WS adv.     —           —           —
Discovery           —           Search gaps —           —
```

---

## Certified areas — residual risk (acceptable on certificate)

| Area | Open items | Treatment |
|------|------------|-----------|
| Dashboard | 4 majors, 7 advisories | Optional P4 remediation |
| Platform Kernel | 4 majors, 6 advisories | Certificate finding-track |
| Analytics Capability | 6 majors, 8 advisories | Advisory track; Phase 2 not authorized |
| Account Platform | 7 majors, 19 advisories | Post-ratification roadmap |
| Business Operations | 17 advisories | 90-day module backlog |
| Reference Workspace | 11 advisories | WORKSPACE_POST_RATIFICATION_ROADMAP |
| Context Graph | 8 advisories | Module-owner backlog |

---

## Related

- [PLATFORM_MODERNIZATION_PRIORITY_2026_5.md](./PLATFORM_MODERNIZATION_PRIORITY_2026_5.md)
- [PLATFORM_EXECUTIVE_SUMMARY_2026_5.md](./PLATFORM_EXECUTIVE_SUMMARY_2026_5.md)
- [PLATFORM_PORTFOLIO_REFRESH_2026_5.md](./PLATFORM_PORTFOLIO_REFRESH_2026_5.md)

**Last updated:** 2026-06-23
