# Business Operations — Post-Ratification Roadmap (BO-3)

**Program:** BO-3 — Council Ratification  
**Date:** 2026-06-19  
**Authority:** RD-BO3-001, RD-BO3-002  
**Status:** Planning + **Phase 0 complete (BO-4)** — program **ARCHIVED**; advisory remediation is module-owner backlog

---

## 1. Current ratified state

| Field | Value |
|-------|-------|
| Certification | **LEVEL 3 CERTIFIED WITH FINDINGS** (executed BO-4) |
| Domain score | **24/27 (~89%)** |
| Blocking | **0** |
| Major | **0** |
| Advisory | **17** |
| Reference | #1 HR · #6 Scheduling (WITH FINDINGS) · #7 WC |
| Ledger | **Updated** — BO-4 executed |
| Program | **ARCHIVED** |

---

## 2. Plain L3 promotion path (domain)

### Requirements (all must be met)

| # | Requirement | Current | Target |
|---|-------------|---------|--------|
| P1 | Open advisories | 17 | **0** or council-accepted closure report |
| P2 | G1 Authorization | PARTIAL (2) | **PASS (3)** — scheduling PE on team/employee reads |
| P3 | G6 Test evidence | PARTIAL (2) | **PASS (3)** — cross-module HTTP integration suite |
| P4 | G8 Production safety | PARTIAL (2) | **PASS (3)** or formal analytics deferral register (Stage 4) |
| P5 | Domain score | 24/27 | **≥26/27** recommended |
| P6 | Council vote | — | Plain L3 promotion session |

### Advisory closure groups (90-day target from ratification)

| Theme | Finding IDs | Owner | Plain L3 impact |
|-------|-------------|-------|-----------------|
| **Integration docs** | BO-F-D04, BO-F-D06 | Architecture | G5/G7 hygiene |
| **Analytics deferral** | BO-F-D07, F-SCH-009 | Product + Scheduling | G8 — document Stage 4; close or formal N/A |
| **HR client hygiene** | F-HR-004..006 | HR / Web | Advisory count |
| **Audit/event parity** | F-SCH-011, F-HR-007, F-HR-008, F-WC-007 | Module owners | G2 uplift |
| **WC notification parity** | F-WC-006, F-WC-008 | WC | Advisory count; WC fast-track |
| **Scheduling PE + dashboard** | F-SCH-008, F-SCH-010..012, PE advisory | Scheduling | G1/G3 uplift |

### Fast-track — Workforce Communications module plain L3

WC may promote to **plain L3 module row** when **only** F-WC-006..008 close (3 advisories), even if domain remains WITH FINDINGS — **separate council vote** authorized by RD-BO3-005.

---

## 3. Phase plan

### Phase 0 — Governance execution (0–30 days) — **BO-4** ✅ **COMPLETE**

| # | Action | Exit criteria | Status |
|---|--------|---------------|--------|
| 0.1 | Ledger PR per [LEDGER_RECOMMENDATION](./BUSINESS_OPERATIONS_LEDGER_RECOMMENDATION.md) | Domain + module rows updated | **Done** |
| 0.2 | Reference catalog annex (#1, #6, #7) | REFERENCE_MODULE_CATALOG.md | **Done** |
| 0.3 | Open advisory tracking tickets (17) | Linked in findings register | **Backlog** |
| 0.4 | 90-day remediation charter published | Module owners assigned | **Backlog** |
| 0.5 | Marketing guardrail: analytics 501 not product-ready | Product comms | **Backlog** |

**BO-4 executed 2026-06-19** — see [BUSINESS_OPERATIONS_FINAL_GOVERNANCE_EXECUTION.md](./BUSINESS_OPERATIONS_FINAL_GOVERNANCE_EXECUTION.md). Certification program **ARCHIVED**.

---

### Phase 1 — Advisory remediation (0–90 days) — **optional engineering**

| Priority | Theme | Findings |
|----------|-------|----------|
| P0 | WC notification grouping | F-WC-006 |
| P1 | HR API client consolidation | F-HR-004 |
| P1 | Scheduling dashboard service extraction | F-SCH-008 |
| P2 | HR domain event taxonomy | F-HR-007 |
| P2 | Scheduling module audit trail | F-SCH-011 |
| P3 | Doc consolidation | BO-F-D06, F-SCH-012 |
| Deferred | Analytics | BO-F-D07, F-SCH-009 — Stage 4 |
| Deferred | Search | F-SCH-010 |
| Deferred | Ack reminder job | F-WC-008 — manifest planned |

**Authorization:** Remediation charters are **separate** from BO-3 — not opened by this ratification.

---

### Phase 2 — Plain L3 promotion review (90+ days)

| Trigger | Action |
|---------|--------|
| Advisory count ≤3 and G1/G6/G8 PASS | Schedule domain plain L3 council vote |
| WC advisories = 0 | Schedule WC module plain L3 fast-track vote |
| All advisories closed | Domain plain L3 + Reference Domain discussion |

---

### Phase 3 — Reference promotion (post plain L3 or parallel)

| Step | Requirement |
|------|-------------|
| Reference Candidate → Reference Module | Ledger row stable ≥90 days; advisories trending closed |
| Reference Domain | Domain plain L3 or council charter |
| Reference Capability catalog | Ongoing — no vote required |

---

## 4. Explicitly out of scope (post-archive)

- Reopening certification modernization program without new council charter
- BO analytics module (Stage 4)
- Business Administration merge
- UX modernization (BO-1B complete — frozen)
- Plain L3 promotion without advisory closure + council vote

---

## 5. Post-archive initiatives (module-owner backlog)

Certification modernization program **ARCHIVED** (BO-4, 2026-06-19). No authorized next program package.

| Track | Owner | Trigger |
|-------|-------|---------|
| Advisory remediation (17) | Module owners | 90-day plan — not program-gated |
| WC fast-track plain L3 | WC + Council | F-WC-006..008 closed |
| Domain plain L3 | Council | Advisories + G1/G6/G8 PASS |

See [BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md](./BUSINESS_OPERATIONS_PROGRAM_ARCHIVE.md).

---

## 6. Success metrics (90-day checkpoint)

| Metric | Target |
|--------|--------|
| Advisories closed | ≥8 of 17 |
| G1 scheduling PE coverage | ≥75% routes |
| Cross-module integration test | ≥1 HR↔WC bridge E2E |
| Ledger row | **Published** (BO-4) |
| WC advisories | 0–1 (fast-track eligible) |
