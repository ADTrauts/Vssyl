# Business Administration — Post-Ratification Roadmap

**Program:** BA-3 — Certification Council Ratification — **SUPERSEDED**  
**Date:** 2026-06-18  
**Final status:** **COMPLETE** — BA-4 closed BA-F-005; BA-6 executed promotion  
**Authority:** [BUSINESS_ADMINISTRATION_FINAL_GOVERNANCE_EXECUTION.md](./BUSINESS_ADMINISTRATION_FINAL_GOVERNANCE_EXECUTION.md)

---

## 1. Final state (BA-6)

| Field | Value |
|-------|-------|
| Certification | **LEVEL 3 CERTIFIED** (promoted 2026-06-18) |
| Prior notation | LEVEL 3 CERTIFIED WITH FINDINGS — **removed** |
| Score | **23/27 (~85%)** |
| Open major | **0** |
| Open advisory | **6** (+ BA-F-013 hygiene) |
| Reference | **#OC-1, #OC-2, #OC-3** — Reference Platform Capabilities With Findings |
| Ledger | **Executed** — [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) |
| Program | **ARCHIVED** |

---

## 2. Completed initiatives (was P0–P1)

| Initiative | Status |
|------------|--------|
| BA-F-005 approval hierarchy (BA-4) | **Complete** |
| Ledger execution (BA-6) | **Complete** |
| Promotion to plain L3 (BA-6) | **Complete** |
| Reference designation execution (BA-6) | **Complete** |

---

## 3. Optional follow-on (not required — program archived)

| Initiative | Finding | Owner |
|------------|---------|-------|
| Operation matrix to `docs/architecture/audits/` | BA-F-011 | BA Program Steward |
| Integration-mount PE | BA-F-003-R1 | Platform Engineering |
| Advisory cleanup bundle | BA-F-008..012, BA-F-013 | Optional hygiene |

**No BA remediation charter authorized post archive.**

---

## 3. Phase plan

### Phase 0 — Governance closeout (0–30 days)

| # | Action | Finding / gate | Owner | Exit criteria |
|---|--------|----------------|-------|---------------|
| 0.1 | Ledger PR per [LEDGER_RECOMMENDATION](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md) | G-BA-1 | Platform Engineering | Row in `CERTIFICATION_LEDGER.md` |
| 0.2 | Copy operation matrix to `docs/architecture/audits/BUSINESS_ADMINISTRATION_OPERATION_MATRIX.md` | BA-F-011 / G7 | BA Program Steward | File exists; linked in ledger |
| 0.3 | Add #OC-1/#OC-2 annex to `REFERENCE_MODULE_CATALOG.md` | G-BA-5 | Architecture Governance | Catalog updated in ledger PR |
| 0.4 | Publish marketing guardrail: no "approval chains shipped" | G-BA-6 | Product | Internal comms + docs note |
| 0.5 | Open findings tracking tickets for advisories | BA-F-008..012, 003-R1, 013 | BA Program Steward | Tickets linked in register |

**No code required** for Phase 0 except optional doc copies.

---

### Phase 1 — BA-F-005 approval hierarchy (0–90 days) — **P1 ratified next initiative**

**Objective:** Close BA-F-005; unlock plain L3 promotion and #OC-3 candidacy.

| # | Deliverable | Scope note |
|---|-------------|------------|
| 1.1 | `BusinessApprovalService` (or equivalent) | Server service — no controller Prisma |
| 1.2 | PE dual on approval hierarchy mutations | Extend `businessAdminPolicyDual` / HR policy |
| 1.3 | Activity + domain events on hierarchy writes | BA-1A pattern reuse |
| 1.4 | API routes under `/api/business` or `/api/org-chart` | Thin controllers |
| 1.5 | Admin UI for hierarchy management | Replace ad-hoc HR manager-only interim |
| 1.6 | Integration tests | PE deny + activity + tenant scope |
| 1.7 | BA-F-005 closure report | Council promotion input |

**Out of scope for planning doc:** Implementation detail deferred to BA-F-005 program charter.

**Joint ownership:** BA subdomain + HR module (schema in `hr/core.prisma`).

**90-day checkpoint:** Council review — extend waiver or escalate if no MVP.

---

### Phase 2 — Advisory cleanup (30–180 days) — **P2**

| Finding | Target | Gate uplift |
|---------|--------|-------------|
| BA-F-003-R1 | PE on integration mounts (~14 writes) | G1 → 3 |
| BA-F-008 | API cluster facade or documented gateway map | G4 |
| BA-F-009 | Boundary doc: `StationsAndPositionsEditor` → BO | G5 |
| BA-F-010 | IA redirect map `/admin/hr` → workspace | G5 |
| BA-F-012 | Global Trash for org entities (or documented exception) | G8 |
| BA-F-013 | Remaining 97 `gray-*` → `v-*` | G9 hygiene |

**Optional bundle:** "BA-3A Advisory Cleanup" — does not block plain L3 if BA-F-005 closes first.

---

### Phase 3 — Promotion (post BA-F-005)

| Milestone | Trigger | Action |
|-----------|---------|--------|
| Plain L3 promotion vote | BA-F-005 closed; 0 open majors | Update ledger status string |
| #OC-3 candidacy vote | BA-F-005 runtime + tests | Add Approval Boundaries candidate |
| Capability reference promotion | Plain L3 + council | Promote #OC-1/#OC-2 from candidate to cited reference in pattern guides |

---

## 4. Parallel programs (not BA-blocking)

| Program | Relationship to BA |
|---------|-------------------|
| **Business Operations BO-1A** | Domain operations; may consume #OC-1 identity patterns |
| **Context Graph Platform** | Cross-cutting AI/context; no cert dependency |
| **Admin Portal** | Integration mounts (BA-F-003-R1) may overlap AP surfaces |
| **Business Workspace** | Configuration shell annex (WS-L1) |

---

## 5. Findings tracking matrix

| ID | Severity | Status post-ratification | Target phase | Blocks plain L3? |
|----|----------|--------------------------|--------------|------------------|
| BA-F-005 | Major | Open (waiver) | Phase 1 | **Yes** |
| BA-F-003-R1 | Advisory | Open | Phase 2 | No |
| BA-F-008 | Advisory | Open | Phase 2 | No |
| BA-F-009 | Advisory | Open | Phase 2 | No |
| BA-F-010 | Advisory | Open | Phase 2 | No |
| BA-F-011 | Advisory | Open | Phase 0 | No |
| BA-F-012 | Advisory | Open | Phase 2 | No |
| BA-F-013 | Downgraded | Open | Phase 2 | No |

---

## 6. Score projection (if phases complete)

| Phase | Projected G1–G9 | Projected certification |
|-------|-----------------|-------------------------|
| Ratified (now) | 22/27 (~81%) | L3 WITH FINDINGS |
| Phase 0 only | 22/27 | L3 WITH FINDINGS (G7 uplift possible) |
| Phase 1 (BA-F-005) | ~24/27 (~89%) | **Plain L3 eligible** |
| Phase 1 + 2 full | ~26/27 (~96%) | Plain L3 + reference promotion |

Projections are planning estimates — require BA-3+ evaluation evidence.

---

## 7. What BA-3 did not authorize

- BA-F-005 implementation (charter separate — P1 next)
- Ledger file edit (G-BA-1 PR only)
- Certification award execution
- #OC-3 designation
- Reference Domain designation

---

## Related

- [BUSINESS_ADMINISTRATION_COUNCIL_RATIFICATION.md](./BUSINESS_ADMINISTRATION_COUNCIL_RATIFICATION.md)
- [BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md](./BUSINESS_ADMINISTRATION_FINDINGS_REVIEW.md)
- [BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md](./BUSINESS_ADMINISTRATION_LEDGER_RECOMMENDATION.md)
- [BUSINESS_OPERATIONS_FINDINGS_TRACKING_PLAN.md](../business-operations/BUSINESS_OPERATIONS_FINDINGS_TRACKING_PLAN.md) — tracking template precedent
