# Admin Portal — Certification Evaluation Recommendation

**Package:** 1B-E — Certification Readiness Gate  
**Date:** 2026-06-18  
**Constraint:** Recommendation only — **do not certify**; **do not update** `CERTIFICATION_LEDGER.md`

---

## Recommendation

# Schedule the Admin Portal Certification Evaluation Program

Admin Portal has completed the Governance Architecture Blueprint (0E, 0B, 0D, 1B) and passed the adapted control-plane readiness gate. The platform should proceed to a **formal certification evaluation** — a review program, not an implementation package.

---

## Rationale

| Factor | Assessment |
|--------|------------|
| Blocking findings | **0** — all five original blockers closed |
| Major 1B findings | **All closed** (AP-F-004, 013, 014, 016, 027, 030) |
| Gate score | **~89% (24/27)** — exceeds ≥85% review threshold |
| Test evidence | Control-plane domains have HTTP integration + governance static enforcement |
| Audit trail | Taxonomy live; single write path; P0 mutation samples |
| Production safety | P0 compliance closed; debug surfaces gated |
| AI administration | Pipeline canonical; 45/45 HTTP coverage |

---

## Evaluation program scope (proposed)

The evaluation program should assess Admin Portal against the **adapted Platform Control Plane framework** (G1–G9), not the standard module L3 gate.

### In scope

1. **Authorization model** — role gate, impersonation policy, dangerous-op gates  
2. **Audit completeness** — taxonomy coverage vs operation matrix mutations  
3. **Service boundary conformance** — route thinness, domain service ownership  
4. **API coherence** — canonical mounts, satellite documentation  
5. **Test evidence review** — spot-check integration suites; CI stability  
6. **AI control plane** — pipeline policies, diagnostics, retention/compliance  
7. **Production safety** — no mock fallbacks; gated debug surfaces  

### Out of scope (unless council expands)

- Module L3 gates (`dashboardId`, workspace landing, global trash) — N/A per framework  
- Full analytics consolidation (AP-F-007) — unless waiver rejected  
- UX shell consistency (G9) — advisory; 1A track  

### Known review discussion items

| Item | Proposed disposition |
|------|---------------------|
| AP-F-007 Analytics triplication | **Waive** for control-plane certification with documented 0C roadmap, OR require 0C completion before evaluation |
| Fat route LOC files | **Advisory** — services extracted; LOC is maintainability not safety |
| ai-context-debug API tail | **Advisory** — transitional retain documented |
| Web UI render tests | **Advisory** — server contracts provide control-plane evidence |

---

## Evaluation packet checklist

| Artifact | Status |
|----------|--------|
| Operation matrix | ✅ Current |
| Audit taxonomy | ✅ Live |
| Service decomposition evidence | ✅ Code + assessments |
| Test coverage reports | ✅ 1B-D |
| Policy Engine position / waiver | ✅ 1B-C |
| Impersonation policy | ✅ 0E-D |
| AI admin closeout (0D) | ✅ Complete |
| Gate scorecard (1B-E) | ✅ This program |
| Post-1B findings register | ✅ 25 closed / 5 open |

---

## What the evaluation program is NOT

- **Not** a new implementation sprint  
- **Not** an automatic certification award  
- **Not** a ledger update (separate council action after evaluation)  
- **Not** 1A UX Shell or 0C Analytics work  

---

## Sequencing recommendation

| Priority | Program | Rationale |
|----------|---------|-----------|
| **1** | **Certification Evaluation Program** | Gate passed; blocking work complete |
| 2 (parallel OK) | 0C Analytics | Closes AP-F-007 before or during evaluation |
| 3 (parallel OK) | 1A UX Shell | Closes G9 advisory; improves operator UX |
| 4 (post-evaluation) | Ledger row recommendation | Only after evaluation outcome |

---

## Decision matrix

| If council prioritizes… | Recommendation |
|-------------------------|----------------|
| Fastest path to control-plane certification | Proceed to evaluation with AP-F-007 waiver |
| Zero known majors at evaluation | Complete **0C** first, then evaluation |
| Operator UX parity with certified modules | Complete **1A** in parallel; G9 advisory at evaluation |

---

## References

- [ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md](./ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md)
- [ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md](./ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md)
- [ADMIN_PORTAL_1B_CLOSEOUT_REPORT.md](./ADMIN_PORTAL_1B_CLOSEOUT_REPORT.md)
- [ADMIN_PORTAL_CERTIFICATION_READINESS.md](./ADMIN_PORTAL_CERTIFICATION_READINESS.md)
