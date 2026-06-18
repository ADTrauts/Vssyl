# Admin Portal — Post-Ratification Roadmap

**Program:** Platform Control Plane Certification Council Ratification  
**Date:** 2026-06-18  
**Certification status (ratified):** **LEVEL 3 CERTIFIED WITH FINDINGS**  
**Constraint:** Roadmap only — no implementation authorized by this document

---

## 1. Ratification summary

| Item | Status |
|------|--------|
| Certification | **LEVEL 3 CERTIFIED WITH FINDINGS** (RD-AP-001) |
| Reference | **Reference Candidate (partial)** (RD-AP-004) |
| Ledger row | Recommended — PR authorized (RD-AP-005) |
| AP-F-007 | **Waiver acceptable** — track in 0C |
| G9 | **Non-blocking** — track in 1A |

**Modernization programs complete:** 0E, 0B, 0D, 1B, Certification Evaluation, Council Ratification.

---

## 2. Open findings tracking

| ID | Severity | Owner | Target | Blocks certified status? |
|----|----------|-------|--------|--------------------------|
| AP-F-007 | major | **0C Analytics** | 90 days | **No** (waived at ratification) |
| AP-F-023 | advisory | **1A UX Shell** | 90 days | No |
| AP-F-024 | advisory | **1A UX Shell** | 90 days | No |
| AP-F-025 | advisory | **1A UX Shell** | 90 days | No |
| AP-F-026 | advisory | **1A UX Shell** | 90 days | No |

**Maintaining ratified certification:** No action required beyond no G1–G8 regressions.

**Promoting to plain Level 3:** Close AP-F-007 (or council waiver revocation vote).

**Promoting reference tier:** Close AP-F-007 + G9 PASS (or Reference UX Approved w/ Findings).

---

## 3. Next initiatives (council sequencing)

### Council vote: **Both** — parallel with priorities

```
Ratification (complete)
    │
    ├──► 0C Analytics (priority 1 — major finding)
    │         └── Closes AP-F-007
    │         └── Enables plain L3 promotion
    │
    ├──► 1A UX Shell (priority 2 — G9 / advisory)
    │         └── Closes AP-F-023–026
    │         └── Enables G9 PASS + optional Reference UX
    │
    └──► Ledger PR (parallel governance)
              └── Apply ADMIN_PORTAL_LEDGER_RECOMMENDATION.md
```

### 0C Analytics (AP-F-007)

| Objective | Outcome |
|-----------|---------|
| Analytics ownership map | Single canonical operator analytics surface |
| De-duplicate | `analytics`, `business-intelligence`, `ai-system` chart overlap |
| Performance boundary | Clarify vs admin performance page |

**Not in scope:** Re-certification (already ratified); product `analytics` module L3.

### 1A UX Shell (AP-F-023–026)

| Objective | Outcome |
|-----------|---------|
| Token alignment | `v-*` design tokens |
| Shared components | EmptyState, ConfirmModal |
| Remove `window.confirm` | seed-modules |

**Not in scope:** Feature expansion; route changes.

---

## 4. Governance actions (ratified)

| ID | Action | Owner | When |
|----|--------|-------|------|
| G-AP-1 | Ledger PR | Platform Engineering | Next ledger maintenance PR |
| G-AP-2 | 0C charter for AP-F-007 | Program steward | 90 days |
| G-AP-3 | 1A charter for UX findings | Program steward | 90 days |
| G-AP-4 | Link ratification in ledger PR | Admin Portal steward | With G-AP-1 |

---

## 5. Explicitly not next

| Item | Rationale |
|------|-----------|
| New 1B governance work | Program complete |
| Re-evaluation / re-certification | Ratified unless regression |
| Automatic ledger update | Separate PR only |
| Certification award execution | Council record only |
| Reference Implementation (L4) | Denied |
| ai-context-debug merge | Optional hygiene backlog |

---

## 6. Promotion milestones

| Milestone | Trigger | Council action |
|-----------|---------|----------------|
| **Maintain L3 w/ Findings** | No G1–G8 regression | None |
| **Plain L3** | AP-F-007 closed | Optional notation update PR |
| **Reference With Findings** | AP-F-007 closed + G9 PARTIAL | Promotion vote |
| **Reference UX** (optional) | 1A complete + UX program | Separate UX council |
| **Ledger L4** | Not applicable | Denied |

---

## 7. Program closeout

| Program | Status |
|---------|--------|
| Admin Portal Modernization (0E–1B) | **Complete** |
| Certification Evaluation | **Complete** |
| Council Ratification | **Complete** |
| **Admin Portal governance architecture** | **CLOSED** |

**Next program class:** **Implementation** (0C, 1A) + **Governance** (ledger PR) — not certification.

---

## Cross-reference

- [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](./ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md)
- [ADMIN_PORTAL_LEDGER_RECOMMENDATION.md](./ADMIN_PORTAL_LEDGER_RECOMMENDATION.md)
- [ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md](./ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md)
- [ADMIN_PORTAL_COUNCIL_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_COUNCIL_EXECUTIVE_SUMMARY.md)
