# Platform Risk Matrix 2026

**Program:** Platform Portfolio Refresh 2026  
**Date:** 2026-06-21  
**Status:** Discovery only — risk scoring for portfolio prioritization  
**Supersedes:** [`PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md`](./PLATFORM_PORTFOLIO_ARCHITECTURAL_RISK_MATRIX.md) (2026-06-19)

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

## Risk matrix (refreshed)

| ID | Area | User | Revenue | Drift | Blast | Cost | **Score** | **Tier** | Δ since 2026-06-19 |
|----|------|------|---------|-------|-------|------|-----------|----------|---------------------|
| **R-01** | AI Platform stub executors (fake success) | 4 | 4 | 5 | 5 | 4 | **21.5** | **Critical** | — |
| **R-02** | Dashboard L3 CwF — 4 majors on certificate (M1-R, M4, M5, M7) | 5 | 3 | 2 | 3 | 3 | **13.5** | **Medium** | ↓ (was High L1; **certified 2026-06-21**) |
| **R-03** | Module Activity legacy read paths | 3 | 2 | 4 | 5 | 4 | **17.0** | **High** | — |
| **R-04** | Account Platform majors (MFA, modal billing, triplication) | 5 | 4 | 3 | 4 | 3 | **18.5** | **High** | **New** (replaces Settings/Identity critical) |
| **R-05** | Analytics L2 CwF — 6 majors on certificate (AN-M2–M6) | 3 | 3 | 2 | 3 | 3 | **12.5** | **Medium** | ↓ (was L1 scope ambiguity; **certified 2026-06-22**) |
| **R-06** | Domain Events thin taxonomy + placeholder subscribers | 2 | 2 | 4 | 4 | 3 | **15.5** | **Medium** | — |
| **R-07** | Policy Engine read-path gaps | 3 | 3 | 4 | 4 | 3 | **16.5** | **High** | — |
| **R-08** | Search — no unified discovery audit | 3 | 2 | 2 | 3 | 4 | **13.5** | **Medium** | — |
| **R-09** | Reference Workspace 11 advisories (WS-L3 on certificate) | 4 | 2 | 2 | 3 | 3 | **14.5** | **Medium** | ↓ (was High; WS-L3 achieved) |
| **R-10** | Platform Scheduler L1 (§22 inventory incomplete) | 2 | 2 | 3 | 3 | 3 | **13.0** | **Medium** | — |
| **R-11** | Manifest governance reconcile incomplete | 2 | 2 | 3 | 4 | 3 | **14.5** | **Medium** | — |
| **R-12** | Realtime — no platform audit row | 3 | 2 | 2 | 3 | 3 | **13.5** | **Medium** | **New** |
| **R-13** | BO domain 17 advisories (certified, tracked) | 2 | 2 | 2 | 2 | 3 | **11.5** | **Low** | — |
| **R-14** | Context Graph 8 advisories (certified, tracked) | 2 | 2 | 2 | 3 | 2 | **11.5** | **Low** | — |
| **R-15** | Calendar post-L3 hygiene | 2 | 1 | 2 | 2 | 2 | **10.5** | **Low** | — |
| **R-16** | Place PL-H1–H9 hygiene | 2 | 2 | 2 | 2 | 2 | **11.0** | **Low** | — |
| **R-17** | Account Platform 19 advisories (certified, tracked) | 3 | 3 | 2 | 2 | 3 | **13.5** | **Medium** | **New** |
| **R-18** | Billing legacy `/payment` overlap (PP-3 certified) | 2 | 4 | 2 | 3 | 2 | **14.0** | **Medium** | ↓ (was High R-06) |
| **R-19** | Member connections — PE gaps (PP-1 partial) | 3 | 3 | 3 | 3 | 2 | **15.0** | **Medium** | ↓ (was R-14) |
| **R-20** | Marketplace / partner pipeline unaudited | 2 | 3 | 2 | 3 | 4 | **14.0** | **Medium** | **New** |

### Retired / resolved risks (June 19 → June 21)

| Former ID | Area | Resolution |
|-----------|------|------------|
| R-01 (2026-06-19) | Settings fragmentation critical | **Mitigated** — PP-2 L3 CwF; residual = AP advisories (R-04, R-17) |
| R-02 (2026-06-19) | Identity unaudited critical | **Mitigated** — PP-1 L3 CwF; MFA major remains (R-04) |
| R-03 (2026-06-19) | ENG-1 Place segment 404 | **Closed** — RWS-F1 at WS-L3 award |
| R-11 (2026-06-19) | Reference Workspace WS-L3 blocked | **Closed** — WS-L3 CwF achieved; advisories remain (R-09) |

---

## Risk tier summary

| Tier | Count | Areas |
|------|-------|-------|
| **Critical** | 1 | AI stub executors |
| **High** | 4 | Dashboard, Activity reads, AP majors, PE read gaps |
| **Medium** | 10 | Domain Events, Search, WS advisories, Scheduler, Manifest, Realtime, AP advisories, Billing overlap, Member PE, **Analytics CwF majors** |
| **Low** | 5 | BO/CG advisories, Calendar/Place hygiene |

---

## Highest architectural risk (top 5)

| Rank | Area | Why |
|------|------|-----|
| 1 | **AI stub executors** | Constitutional violation risk — AI may report success without execution; affects trust across all L3 modules and UX Ref #4 |
| 2 | **Dashboard L3 CwF majors** | 4 certificate majors (M1-R, M4, M5, M7) on daily landing path |
| 3 | **Module Activity legacy reads** | Undermines auditability claims platform-wide |
| 4 | **Account Platform certificate majors** | MFA absent (AP-UMB-M01); modal-only billing (M02); business settings triplication (M03) — daily user + revenue trust |
| 5 | **Policy Engine read-path gaps** | Authorization inconsistency on reads; Place/Todo/Dashboard gaps |

---

## Highest business value opportunity

| Rank | Area | Value driver |
|------|------|--------------|
| 1 | **Dashboard Wave 3** | Every personal session; widget ecosystem; AI context stubs |
| 2 | **Account Platform advisory burn-down** | MFA, billing UX, settings dedup — post-cert user trust |
| 3 | **Analytics scope decision** | Business intelligence promise; BO Stage 4 deferred analytics |
| 4 | **Search / discovery** | Cross-module findability after L3 module density |
| 5 | **AI Platform L3** (deferred) | Strategic twin governance; partner readiness |

---

## Certified areas — residual risk (acceptable on certificate)

| Area | Open items | Treatment |
|------|------------|-----------|
| Business Operations | 17 advisories | 90-day module backlog |
| Account Platform | 7 majors + 19 advisories | Post-ratification roadmap |
| Reference Workspace | 11 advisories | WORKSPACE_POST_RATIFICATION_ROADMAP |
| Context Graph | 8 advisories | Module-owner backlog |
| Business Administration | 6 advisories | Tracked post-promotion |
| Calendar / Place / Notebook | Hygiene P3 | No cert program |

---

## Risk heatmap by portfolio layer

```
                    Low risk    Medium      High        Critical
Kernel/adjacent     BO/CG adv.  DomEvents   Activity    —
                    Cal/Place   Search      PE reads    AI stubs
                    hygiene     Scheduler   AP majors   —
                                Manifest    Dashboard   —
User modules        Notes L2    Analytics   —           —
Platform AI         —           AP adv.     —           —
Commerce            —           Billing     —           —
Workspace           WS adv.     Realtime    —           —
Account Platform    PP cert     Member PE   —           —
```

---

## Related

- [PLATFORM_MODERNIZATION_PRIORITY_2026.md](./PLATFORM_MODERNIZATION_PRIORITY_2026.md)
- [PLATFORM_EXECUTIVE_SUMMARY_2026.md](./PLATFORM_EXECUTIVE_SUMMARY_2026.md)
- [PLATFORM_PORTFOLIO_REFRESH_2026.md](./PLATFORM_PORTFOLIO_REFRESH_2026.md)

**Last updated:** 2026-06-22
