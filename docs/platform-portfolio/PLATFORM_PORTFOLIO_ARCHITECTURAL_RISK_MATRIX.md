# Platform Portfolio — Architectural Risk Matrix

**Program:** Vssyl Platform Portfolio Reality Assessment  
**Date:** 2026-06-19  
**Status:** Discovery only — risk scoring for portfolio prioritization

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

## Risk matrix

| ID | Area | User | Revenue | Drift | Blast | Cost | **Score** | **Tier** |
|----|------|------|---------|-------|-------|------|-----------|----------|
| **R-01** | Settings fragmentation + API drift (`/settings` vs preferences) | 5 | 3 | 4 | 5 | 3 | **21.0** | **Critical** |
| **R-02** | Identity & Profile — no service layer / minimal personal model | 5 | 4 | 4 | 4 | 3 | **20.5** | **Critical** |
| **R-03** | Business Workspace ENG-1 (Place segment 404) | 4 | 3 | 3 | 4 | 2 | **17.5** | **High** |
| **R-04** | Dashboard L1 — dual widget registry, weak activity | 5 | 3 | 4 | 4 | 4 | **19.5** | **High** |
| **R-05** | AI Platform stub executors (fake success) | 4 | 4 | 5 | 5 | 4 | **21.5** | **Critical** |
| **R-06** | Billing dual API (`/payment` + `/billing`) | 3 | 5 | 3 | 4 | 3 | **18.5** | **High** |
| **R-07** | Module Activity legacy read paths | 3 | 2 | 4 | 5 | 4 | **17.0** | **High** |
| **R-08** | Domain Events thin taxonomy + placeholder subscribers | 2 | 2 | 4 | 4 | 3 | **15.5** | **Medium** |
| **R-09** | Analytics L1 pseudo-module | 3 | 3 | 3 | 3 | 4 | **15.5** | **Medium** |
| **R-10** | Duplicate business settings surfaces | 4 | 2 | 3 | 3 | 2 | **15.0** | **Medium** |
| **R-11** | Reference Workspace 12 open findings (WS-L3 blocked) | 4 | 2 | 3 | 4 | 4 | **17.0** | **High** |
| **R-12** | Policy Engine read-path gaps (Place/Todo/Dashboard) | 3 | 3 | 4 | 4 | 3 | **16.5** | **High** |
| **R-13** | Search — no unified discovery / Phase 2B not started | 3 | 2 | 2 | 3 | 4 | **13.5** | **Medium** |
| **R-14** | Member connections — no PE on mutations | 3 | 3 | 4 | 3 | 2 | **15.5** | **Medium** |
| **R-15** | Platform Scheduler L1 (§22 inventory incomplete) | 2 | 2 | 3 | 3 | 3 | **13.0** | **Medium** |
| **R-16** | BO domain 17 advisories (certified, tracked) | 2 | 2 | 2 | 2 | 3 | **11.5** | **Low** |
| **R-17** | Calendar post-L3 hygiene (matrix stale, comments Prisma) | 2 | 1 | 2 | 2 | 2 | **10.5** | **Low** |
| **R-18** | Place PL-H1–H9 hygiene | 2 | 2 | 2 | 2 | 2 | **11.0** | **Low** |
| **R-19** | Context Graph 8 advisories (certified, tracked) | 2 | 2 | 2 | 3 | 2 | **11.5** | **Low** |
| **R-20** | Manifest governance reconcile incomplete | 2 | 2 | 3 | 4 | 3 | **14.5** | **Medium** |

---

## Risk tier summary

| Tier | Count | Areas |
|------|-------|-------|
| **Critical** | 3 | Settings, Identity, AI stub executors |
| **High** | 6 | Workspace ENG-1, Dashboard, Billing APIs, Activity reads, Reference Workspace, PE reads |
| **Medium** | 6 | Domain Events, Analytics, duplicate business settings, Search, Member PE, Manifest, Scheduler |
| **Low** | 5 | BO/CG advisories, Calendar/Place hygiene |

---

## Highest architectural risk (top 5)

| Rank | Area | Why |
|------|------|-----|
| 1 | **AI stub executors** | Constitutional violation risk — AI may report success without execution; affects trust across all L3 modules |
| 2 | **Settings fragmentation** | Every user touches settings; API drift causes production bugs; blocks coherent platform UX |
| 3 | **Identity & Profile** | Foundation for auth, avatars, contacts, personalization; no audit or service boundaries |
| 4 | **Dashboard L1** | Primary personal landing; dual registry; blocks Wave 3 and widget ecosystem |
| 5 | **Billing dual APIs** | Revenue correctness; entitlement drift between `/payment` and `/billing` |

---

## Certified areas — residual risk (acceptable on certificate)

| Area | Risk | Treatment |
|------|------|-----------|
| Business Operations | 17 advisories | 90-day module backlog — not portfolio modernization |
| Context Graph | 8 advisories | Module-owner backlog |
| Business Administration | 6 advisories | Tracked post-promotion |
| Calendar / Place | Hygiene items | P3 — no cert program |

---

## Risk heatmap by portfolio layer

```
                    Low risk    Medium      High        Critical
Kernel/adjacent     Scheduler   DomEvents   Activity    Settings
                    Manifest    Search      PE reads    Identity
User modules        BO adv.     Analytics   Dashboard   —
Platform AI         CG adv.     —           —           AI stubs
Commerce            —           —           Billing     —
Workspace           Cal/Place   —           Ref WS      ENG-1
```

---

## Related

- [PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md](./PLATFORM_PORTFOLIO_MODERNIZATION_PRIORITY.md)
- [PLATFORM_PORTFOLIO_EXECUTIVE_SUMMARY.md](./PLATFORM_PORTFOLIO_EXECUTIVE_SUMMARY.md)

**Last updated:** 2026-06-19
