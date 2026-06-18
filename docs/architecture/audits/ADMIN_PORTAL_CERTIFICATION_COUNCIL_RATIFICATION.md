# Admin Portal — Platform Control Plane Certification Council Ratification

**Program:** Platform Control Plane Certification Council Ratification  
**Ratification date:** 2026-06-18  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **ledger PR authorized separately**; **no automatic ledger update in this session**

**Scope:** Admin Portal adapted control-plane certification and reference designation

**Authoritative inputs:**

- [ADMIN_PORTAL_CERTIFICATION_EVALUATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION.md)
- [ADMIN_PORTAL_CERTIFICATION_SCORECARD.md](./ADMIN_PORTAL_CERTIFICATION_SCORECARD.md)
- [ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md](./ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md)
- [ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md](./ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md)
- [ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md)
- [ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md](./ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md)
- [ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md](./ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md)

**Precedent:** [BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md](../business-operations/BUSINESS_OPERATIONS_COUNCIL_RATIFICATION.md) (HR/Scheduling WITH FINDINGS; WC unconditional L3)

**Constraint:** No runtime changes. No `CERTIFICATION_LEDGER.md` modification in this program.

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Platform Control Plane Certification Council — Ratification |
| Surface under vote | Admin Portal (hybrid platform control plane) |
| Framework | Adapted G1–G9 (not module L3 15-item gate) |
| Weighted score at vote | **24/27 (~89%)** |
| Blocking findings | **0** |
| Level 4 denial | **Affirmed** — File Hub remains sole Reference Implementation (L4) |

---

## Ratification decisions

### RD-AP-001 — Admin Portal certification

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [ADMIN_PORTAL_CERTIFICATION_EVALUATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION.md) |
| **Blockers** | **0** |
| **Open major findings** | AP-F-007 |
| **Open advisory findings** | AP-F-023, AP-F-024, AP-F-025, AP-F-026 |

**Council rationale:** Admin Portal meets adapted control-plane Level 3 on G1–G8 with high-confidence repository evidence. Zero blocking findings. Open major AP-F-007 is **out of control-plane core scope** (analytics subdomain) and is **waivable** at certification — consistent with HR and Scheduling ratification WITH FINDINGS while majors remain open. G9 UX shell FAIL is **advisory for this framework** and does not block certification — consistent with Calendar (Architecture L3 ratified while UX reference pursued separately with findings). Unconditional Level 3 deferred until AP-F-007 closes or is promoted to plain L3 via 0C completion.

**Not ratified:** NOT CERTIFIED, plain LEVEL 3 CERTIFIED (open major + G9), REFERENCE IMPLEMENTATION (L4).

---

### RD-AP-002 — AP-F-007 waiver

| Field | Decision |
|-------|----------|
| **Closure required before certification?** | **No** |
| **Disposition** | **Waiver acceptable** for control-plane certification scope |
| **Tracking** | **Recommended** — 90-day 0C plan |

**Council rationale:** AP-F-007 concerns operator analytics surface overlap, not privileged-mutation safety, authorization, audit, or service-boundary integrity. HR ratification (RD-BO-001) accepted open majors F-HR-001..003 with WITH FINDINGS notation. Analytics triplication does not create certification blockers for a **platform control plane** row distinct from product module `analytics`.

---

### RD-AP-003 — G9 and certification

| Field | Decision |
|-------|----------|
| **Does G9 FAIL block certification?** | **NO** |
| **G9 tracking** | Close via **1A UX Shell**; optional Reference UX program later |

**Council rationale:** See §Consistency analysis below.

---

### RD-AP-004 — Reference designation

| Field | Decision |
|-------|----------|
| **Ratified designation** | **Reference Candidate** |
| **Sub-designation** | **Control Plane — partial** (AI Pipeline admin, audit taxonomy, route governance) |
| **Not approved** | Reference Implementation (L4); Reference With Findings as standalone promotion tier |

**Conditions:** 90-day tracking on AP-F-007; 1A UX Shell plan for G9; promotion to **Reference With Findings** requires AP-F-007 closure + G9 PASS or documented UX waiver council vote.

---

### RD-AP-005 — Ledger row

| Field | Decision |
|-------|----------|
| **Add to certification ledger?** | **YES** — recommended |
| **Row placement** | Platform systems (non-module) |
| **Ledger PR** | Authorized separately — see [ADMIN_PORTAL_LEDGER_RECOMMENDATION.md](./ADMIN_PORTAL_LEDGER_RECOMMENDATION.md) |
| **Executed in this program?** | **NO** |

---

## Council question answers

### Question 1 — Should Admin Portal receive certification?

**LEVEL 3 CERTIFIED WITH FINDINGS**

| Option | Council vote |
|--------|--------------|
| NOT CERTIFIED | Rejected — 0 blockers; G1–G8 PASS |
| LEVEL 3 CERTIFIED | Rejected — open major AP-F-007; G9 FAIL |
| **LEVEL 3 CERTIFIED WITH FINDINGS** | **Ratified** |
| REFERENCE IMPLEMENTATION | Rejected — L4 reserved; G9 FAIL; AP-F-007 open |

**Rationale:** Matches HR/Scheduling precedent (L3 WITH FINDINGS, majors open, zero blockers). Exceeds pre-remediation Scheduling bar. Control-plane score ~89% exceeds review threshold.

---

### Question 2 — Do remaining findings prevent certification?

| Finding | Original severity | Council classification | Prevents L3 w/ Findings? |
|---------|-------------------|------------------------|--------------------------|
| AP-F-007 | major | **Major — waivable** | **No** |
| AP-F-023 | advisory | **Advisory** | **No** |
| AP-F-024 | advisory | **Advisory** | **No** |
| AP-F-025 | advisory | **Advisory** | **No** |
| AP-F-026 | advisory | **Advisory** | **No** |

**None classified as blocking** at ratification.

---

### Question 3 — Should AP-F-007 require closure before certification?

**Waiver acceptable**

| Option | Council vote |
|--------|--------------|
| Required | Rejected for control-plane scope |
| Recommended | Accepted as tracking obligation |
| **Waiver acceptable** | **Ratified** |

**Rationale:** Analytics triplication is a **0C product-surface** issue, not a control-plane safety defect. Closing before certification is **recommended** for plain L3 promotion but **not required** for WITH FINDINGS ratification.

---

### Question 4 — Should G9 failure block certification?

**NO**

#### Consistency analysis vs prior council decisions

| Reference | Architecture / control certification | UX / shell at certification | G9 equivalent blocked L3? |
|-----------|-----------------------------------|----------------------------|---------------------------|
| **File Hub** | L4 Reference Implementation | High UX bar | N/A — UX passed |
| **Chat** | L3 Certified (2026-05-31) | No workspace landing — **accepted partial** | **No** — deferred partial |
| **Calendar** | L3 Certified (2026-06-01) | Reference UX #5 **Approved w/ Findings** (separate track, 2026-06-03) | **No** — Arch L3 before UX closure |
| **HR** | L3 **WITH FINDINGS** (2026-06-14) | Package 6B web consolidation outstanding | **No** — server constitutional bar sufficient |
| **Scheduling** | L3 **WITH FINDINGS** (2026-06-14) | Open majors on AI/PE/matrix — not UX gate | **No** |
| **Workforce Communications** | L3 Certified (2026-06-14) | Advisory findings F-WC-006..009 only | **No** |
| **Admin Portal** | Proposed L3 WITH FINDINGS | G9 FAIL; AP-F-023–026 | **No** — consistent with Calendar/HR split |

**Council rule affirmed:** For **architecture / control-plane** certification, UX shell gaps are tracked findings and **do not block** Level 3 (with or without findings notation) unless council explicitly elevates UX to blocking — not done for Calendar, HR, or Chat partials.

Admin Portal G9 FAIL is **stricter than WC** (which had cleaner UX) but **weaker blocking force than pre-remediation Scheduling FAIL** (which was architectural). G9 is **advisory under adapted control-plane framework §1.2**.

---

### Question 5 — Ledger row?

**YES** — proposed row in [ADMIN_PORTAL_LEDGER_RECOMMENDATION.md](./ADMIN_PORTAL_LEDGER_RECOMMENDATION.md). Not modified in this program.

---

### Question 6 — Reference designation?

**Reference Candidate** (Control Plane — partial)

| Option | Council vote |
|--------|--------------|
| No | Rejected — strong pattern value in AI Pipeline + audit |
| **Reference Candidate** | **Ratified** |
| Reference With Findings | Deferred — after AP-F-007 + G9 progress |
| Reference Implementation | Rejected — L4 denied |

---

### Question 7 — Next modernization initiative?

**Both** (parallel, sequenced priorities)

| Priority | Initiative | Closes |
|----------|------------|--------|
| 1 (major) | **0C Analytics** | AP-F-007 |
| 2 (advisory / G9) | **1A UX Shell** | AP-F-023–026; G9 |

**Rationale:** BO council (G-5) deferred Analytics until explicit charter — Admin Portal 0C is now chartered for AP-F-007 only. 1A can run parallel without blocking certified status. Neither is required to **maintain** ratified certification; both required for **plain L3** and **Reference With Findings** promotion.

---

## Certification consistency review

| Dimension | Chat L3 | HR L3 w/F | WC L3 | Admin Portal (ratified) |
|-----------|---------|-----------|-------|-------------------------|
| Zero blockers | Yes | Yes | Yes | **Yes** |
| Service boundaries | Pass | Pass | Pass | **Pass** |
| Test evidence | High | High | High | **High** |
| Open majors at cert | Partials only | Yes (3) | No | **Yes (1)** |
| Certificate notation | L3 | L3 w/ Findings | L3 | **L3 w/ Findings** |
| Reference at cert | Ref #2 | Ref Candidate #1 | Ref Candidate #7 | **Ref Candidate (CP)** |

**Verdict:** Ratified level is **consistent** with historical council decisions. Admin Portal is **not** inconsistent with WC (stricter notation due to open major). **Not** comparable to File Hub L4.

---

## Governance actions ratified

| # | Action | Owner | Deadline |
|---|--------|-------|----------|
| G-AP-1 | Apply ledger update per ledger recommendation doc | Platform Engineering | Next ledger PR |
| G-AP-2 | Track AP-F-007 under 0C charter | Admin / Analytics owner | 90 days |
| G-AP-3 | Track AP-F-023–026 under 1A charter | Admin UX owner | 90 days |
| G-AP-4 | Publish council minutes link in ledger PR | Admin Portal Program Steward | With G-AP-1 |
| G-AP-5 | **Do not** execute ledger update in ratification session | All | Immediate |
| G-AP-6 | **Do not** reopen 0E/0B/0D/1B closeouts without new blockers | All | Permanent |

---

## Cross-reference

- [ADMIN_PORTAL_LEDGER_RECOMMENDATION.md](./ADMIN_PORTAL_LEDGER_RECOMMENDATION.md)
- [ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md](./ADMIN_PORTAL_REFERENCE_DESIGNATION_DECISION.md)
- [ADMIN_PORTAL_POST_RATIFICATION_ROADMAP.md](./ADMIN_PORTAL_POST_RATIFICATION_ROADMAP.md)
- [ADMIN_PORTAL_COUNCIL_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_COUNCIL_EXECUTIVE_SUMMARY.md)

---

## Post-ratification promotion execution (2026-06-18)

**Note:** Ratification outcomes below remain the **historical council vote record**. Promotion execution superseded notation only — not the ratification event itself.

| Field | Ratified (2026-06-18) | Promoted (2026-06-18) |
|-------|----------------------|----------------------|
| Certification | LEVEL 3 CERTIFIED WITH FINDINGS | **LEVEL 3 CERTIFIED** |
| Reference | Reference Candidate (partial) | **Control Plane Reference With Findings** |
| Open findings | 5 (tracked) | **0** |
| G9 | FAIL (non-blocking) | **PASS** |
| Ledger | Recommended — not executed at ratification | **Executed** |

**Governance records:** [ADMIN_PORTAL_CERTIFICATION_PROMOTION_RECORD.md](./ADMIN_PORTAL_CERTIFICATION_PROMOTION_RECORD.md), [ADMIN_PORTAL_FINAL_GOVERNANCE_EXECUTION.md](./ADMIN_PORTAL_FINAL_GOVERNANCE_EXECUTION.md), [ADMIN_PORTAL_PROGRAM_ARCHIVE.md](./ADMIN_PORTAL_PROGRAM_ARCHIVE.md)

**Last updated:** 2026-06-18 (promotion execution footnote)
