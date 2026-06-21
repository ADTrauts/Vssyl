# Workspace — Post-Ratification Roadmap (WS-L3-2)

**Program:** WS-L3-2 — Council Ratification  
**Date:** 2026-06-19  
**Authority:** RD-WS3-001, RD-WS3-002  
**Status:** **Phase 0 complete** — program **ARCHIVED** (WS-L3-3 2026-06-19)

---

## 1. Current ratified state

| Field | Value |
|-------|-------|
| Certification | **WS-L3 CERTIFIED WITH FINDINGS** (executed WS-L3-3) |
| Score | **23/27 (~85%)** |
| Blocking | **0** |
| Major | **0** |
| Advisory | **11** |
| Reference | **Reference Workspace With Findings** |
| Registration | Approved w/ Findings (2026-06-14) |
| Ledger | **Updated** — WS-L3-3 executed |
| Dashboard module | **Out of scope** — L1 unchanged |
| Program | **ARCHIVED** |

---

## 2. Plain WS-L3 promotion path

### Requirements (all must be met)

| # | Requirement | Current | Target |
|---|-------------|---------|--------|
| P1 | Open advisories | 11 | **0** or council-accepted closure report |
| P2 | G6 Test evidence | PARTIAL (2) | **PASS (3)** — ENG-2 runtime scope contract tests |
| P3 | G7 pattern annex | REG-B3 open | **Published** `WS-REF-*` catalog |
| P4 | G1/G2 (optional uplift) | PARTIAL | PASS recommended for plain bar |
| P5 | Score | 23/27 | **≥26/27** recommended |
| P6 | Council vote | — | Plain WS-L3 promotion session |
| P7 | Reference upgrade | With Findings | Plain **Reference Workspace** vote (optional paired) |

### Advisory closure groups (90-day target from ratification)

| Theme | Finding IDs | Owner | Plain WS-L3 impact |
|-------|-------------|-------|---------------------|
| **Runtime & tests** | B-F3, ENG-2 | Platform Engineering | **G6** — primary |
| **Pattern catalog** | REG-B3 | Architecture Governance | **G7** |
| **URL hygiene** | B-F2, P-F2, P-F3 | Web platform | Advisory count |
| **KNOWN-PWF** | RWS-13, RWS-14, RWS-27 | Product / QA | Accept or close |
| **Product adjacent** | P-F4, P-F5 | Product | Out of shell scope — may remain |

---

## 3. Phase plan

### Phase 0 — Governance execution (0–30 days) — **COMPLETE (WS-L3-3)**

| # | Action | Exit criteria | Status |
|---|--------|---------------|--------|
| 0.1 | Ledger PR per [LEDGER_RECOMMENDATION](./WORKSPACE_LEDGER_RECOMMENDATION.md) | Reference Workspace row + Business Workspace cross-link | **Done** |
| 0.2 | Reference catalog annex | `REFERENCE_MODULE_CATALOG.md` | **Done** |
| 0.3 | Advisory tracking tickets (11) | Linked in findings register | **Done** |
| 0.4 | Certification record published | `WORKSPACE_CERTIFICATION_RECORD.md` | **Done** |
| 0.5 | Program archive | `WORKSPACE_PROGRAM_ARCHIVE.md` | **Done** |

**No runtime required** for Phase 0.

---

### Phase 1 — Advisory remediation (0–90 days) — **optional engineering**

| Priority | Item | IDs |
|----------|------|-----|
| P1 | Runtime scope contract tests | ENG-2, B-F3 |
| P1 | `WS-REF-*` pattern annex | REG-B3 |
| P2 | Legacy `?module=` sunset policy | B-F2 |
| P2 | Widget escalation href adoption | P-F2, ENG-3 |
| P3 | DashboardClient bootstrap hrefs | P-F3, ENG-4 |
| P3 | Work-auth branded path | ENG-5, RWS-13 |
| Deferred | Tab embed URL model | P-F4 — by design |
| Deferred | Education context | P-F5 — product |

---

### Phase 2 — Plain WS-L3 promotion review (90+ days)

| Trigger | Action |
|---------|--------|
| ENG-2 + REG-B3 complete; advisories ≤3 | Schedule plain WS-L3 council vote |
| Reference upgrade desired | Paired Reference Workspace plain vote |

---

## 4. Dashboard Wave 3 relationship

| Question | Answer |
|----------|--------|
| Required for plain WS-L3 shell? | **No** |
| Required for Reference Workspace? | **No** |
| May run in parallel? | **Yes** |
| Affects ledger `dashboard` row? | **Separately** — module L3 is independent product certification |

**Council rule:** Dashboard module modernization does **not** revoke or upgrade WS-L3 shell certificate.

---

## 5. Explicitly out of scope (post-archive)

- ~~Program archive~~ — **executed WS-L3-3**
- Module interior L3 re-certification
- UX Reference #6 registration
- Merging workspace into Admin Portal control plane row

---

## 6. Post-archive initiatives

Remediation and plain WS-L3 promotion follow **module-owner backlog** and separate council charters — not this archived program. See Phase 1–2 above.

**Do not reopen** the Reference Workspace certification modernization program without a new council charter.

---

## Related

- [WORKSPACE_COUNCIL_RATIFICATION.md](./WORKSPACE_COUNCIL_RATIFICATION.md)
- [WORKSPACE_FINDINGS_REGISTER.md](./WORKSPACE_FINDINGS_REGISTER.md)

**Last updated:** 2026-06-19 (WS-L3-3; program ARCHIVED)
