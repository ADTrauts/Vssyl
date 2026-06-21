# Workspace — Consolidated Findings Register

**Program:** ENG-1 / WS-L3 Readiness Assessment  
**Register date:** 2026-06-19  
**Authority:** Consolidates Business, Personal, Combined, and QA findings from Reference Workspace program  
**Supersedes:** Open-count snapshots in prior audits (findings IDs unchanged)

**Source registers:**

- [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](../architecture/audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md) §5–6
- [REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md](../architecture/audits/REFERENCE_WORKSPACE_REGISTRATION_REVIEW.md)
- [REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md](../architecture/audits/REFERENCE_WORKSPACE_QA_EXECUTION_REPORT.md)
- [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](../architecture/audits/BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md)
- [REFERENCE_WORKSPACE_PLATFORM_SHELL.md](../architecture/REFERENCE_WORKSPACE_PLATFORM_SHELL.md)

---

## Summary

| Severity | Business | Personal | Combined/QA | **Total open** |
|----------|----------|----------|-------------|----------------|
| **Blocking** | 0 | 0 | 0 | **0** |
| **Major** | 0 | 0 | 0 | **0** |
| **Advisory** | 2 | 4 | 5 | **11** |
| **Closed (ENG-1)** | 1 | 0 | 0 | **1** |

**Workspace certification posture:** **WS-L3 CERTIFIED WITH FINDINGS** (executed WS-L3-3, 2026-06-19). G1–G9 23/27 (~85%). 11 advisories on 90-day plan. Program **ARCHIVED**.

---

## Severity definitions (workspace program)

| Severity | Definition |
|----------|------------|
| **Blocking** | Prevents WS-L3 review opening — constitutional shell violation or production P0 without workaround |
| **Major** | WS-L3 plain certification blocker — must close or accept on certificate with council vote |
| **Advisory** | Hygiene, deferred design, or documentation — track on certificate for WITH FINDINGS |

---

## Closed findings

| ID | Severity | Finding | Closed |
|----|----------|---------|--------|
| **RWS-F1** | Advisory (was Medium/P0 QA) | Place publisher `/workspace/place` 404; `?module=place` worked | **Closed ENG-1** (2026-06-19) — `workspace/place/page.tsx` null deferral |
| B-F1 | — | Orphan segment pages | Closed 1D |
| B-F4 | — | Stale operation matrix | Closed 2F |
| B-F5 | — | Cross-surface QA | Closed 2E |
| PD-1..PD-10 | — | Personal wave findings | Closed 2A–2D |
| P-F1 | — | Drift suite | Closed 2D |

---

## Business Workspace — open

| ID | Severity | Finding | Gate | Remediation |
|----|----------|---------|------|-------------|
| **B-F2** | Advisory | Legacy `?module=` resolve-only — no sunset policy | G4 | Document redirect policy; optional engineering |
| **B-F3** | Advisory | Runtime scope bridge not contract-tested | G6 | ENG-2 — runtime scope contract tests |

---

## Personal Dashboard — open

| ID | Severity | Finding | Gate | Remediation |
|----|----------|---------|------|-------------|
| **P-F2** | Advisory | Widget interior escalation ad-hoc URLs | G4 | Module-scope `buildWidgetEscalationHref` adoption |
| **P-F3** | Advisory | Bootstrap ad-hoc hrefs in `DashboardClient` | G4 | Personal hygiene wave |
| **P-F4** | Advisory | Tab embed (Work/Place) not URL-addressable | G9 | By design — document CE |
| **P-F5** | Advisory | Education context product WS-L0 | G5 | Product track — out of shell scope |

---

## Combined / QA — open

| ID | Severity | Finding | Gate | Remediation |
|----|----------|---------|------|-------------|
| **RWS-13** | Advisory | Work-tab branded path without work-auth | G4 | ENG-5 — KNOWN-PWF |
| **RWS-14** | Advisory | Place tab embed automation miss | G9 | KNOWN-PWF — manual corroborated |
| **RWS-27** | Advisory | Notifications via sidebar module, not header bell | G9 | KNOWN-PWF — product choice |
| **REG-B3** | Advisory | `WS-REF-*` pattern annex not extracted | G7 | Governance — pattern catalog |
| **CE-B1** | Advisory | Place segment class gap (contract vs route) | G4 | **Closed** via ENG-1 — monitor drift CI |

---

## Engineering gap register

| ID | Priority | Finding | Status | Blocks WS-L3 plain? |
|----|----------|---------|--------|---------------------|
| **ENG-1** | P0 | Place segment page | **Closed** 2026-06-19 | Was registration narrative — **resolved** |
| **ENG-2** | P2 | Runtime scope contract tests | Open | **Yes** (plain WS-L3) |
| **ENG-3** | P2 | Widget escalation href adoption | Open | No |
| **ENG-4** | P3 | DashboardClient bootstrap href migration | Open | No |
| **ENG-5** | P2 | Work-auth branded dashboard path | Open | No |

---

## UX / modernization carry-forward (informational)

| Source | Count | Treatment |
|--------|-------|-------------|
| WS-L2 certification review | 12 → **11** after ENG-1 | Advisory track |
| Registration review REG-B3 | Pattern annex partial | WS-L3 prep |
| Platform portfolio R-11 | Reference Workspace findings | This register |

---

## Related

- [ENG_1_VALIDATION_REPORT.md](./ENG_1_VALIDATION_REPORT.md)
- [WORKSPACE_CERTIFICATION_READINESS.md](./WORKSPACE_CERTIFICATION_READINESS.md)

**Last updated:** 2026-06-19 (WS-L3-3 execution; program ARCHIVED)
