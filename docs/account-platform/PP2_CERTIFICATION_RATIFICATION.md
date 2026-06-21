# PP-2 — Certification Ratification

**Program:** Account Platform — PP-1 + PP-2 Certification Ratification Council  
**Sub-program:** PP-2 Settings Platform  
**Ratification date:** 2026-06-20  
**Authority:** Platform Architecture Governance  
**Status:** **RATIFIED** — governance record only; **ledger PR authorized separately**; **certification execution not performed in this session**

**Authoritative inputs:**

- [PP2_CERTIFICATION_EVALUATION.md](./PP2_CERTIFICATION_EVALUATION.md)
- [PP2_CERTIFICATION_SCORECARD.md](./PP2_CERTIFICATION_SCORECARD.md)
- [PP2_FINDINGS_REVIEW.md](./PP2_FINDINGS_REVIEW.md)
- [PP2_REFERENCE_REVIEW.md](./PP2_REFERENCE_REVIEW.md)
- [PP2_CERTIFICATION_EXECUTIVE_SUMMARY.md](./PP2_CERTIFICATION_EXECUTIVE_SUMMARY.md)

**Precedent:** [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](../architecture/audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md) · [WORKSPACE_CERTIFICATION_EXECUTIVE_SUMMARY.md](../workspace/WORKSPACE_CERTIFICATION_EXECUTIVE_SUMMARY.md)

---

## Council quorum and record

| Field | Value |
|-------|-------|
| Session | Account Platform Certification Council — PP-2 Ratification |
| Surface under vote | PP-2 Settings Platform (Account Platform sub-program) |
| Framework | Account Platform G1–G9 |
| Score at vote | **26/27 (~96%)** |
| Blocking findings | **0** |
| Evaluator recommendation | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **First Account Platform sub-domain ratified** | **Yes** (strongest score in trilogy) |

---

## A. Evaluation packet review

| Artifact | Council assessment |
|----------|-------------------|
| G1–G9 scorecard | ✅ Strong — 26/27 |
| Operation matrix (15C / 11P / 0N core) | ✅ 0N on personal critical path |
| Package 2 consolidation evidence | ✅ Hubs 6→2; adapter alignment |
| Test evidence (24 core tests) | ✅ Strong — exceeds PP-1 |
| Domain events + activity | ✅ Complete for orchestrated writes |

**Council finding:** Evaluation packet is **strong and complete**. Highest-confidence sub-domain in Account Platform trilogy.

---

## B. Findings review

### Open at ratification

| ID | Class | Disposition on certificate |
|----|-------|---------------------------|
| PP2-F05 | Major partial | Business settings triplication — BA-owned WITH FINDINGS |
| PP2-F12 | Advisory | HR settings 404 link — WITH FINDINGS |
| PP2-F13 | Advisory | Misleading business 2FA UI — WITH FINDINGS |
| PP2-EVAL-A01 | Advisory | Email notification PE gap |
| PP2-EVAL-A02 | Advisory | Email notification activity gap |
| PP2-EVAL-A03 | Advisory | Legacy API inventory (~22 families) |

### Closed (confirmed)

PP2-F01–F04, F06–F11 — no reopen. All three original blocking findings remain closed.

---

## C. Risk posture

| Risk | Severity | Council acceptance |
|------|----------|-------------------|
| Business dedup (F05) | Low | ✅ BA SoR documented |
| Email notification path | Low | ✅ Advisory — not personal slice |
| Legacy API inventory | Low | ✅ Reference scope |
| HR 404 / business 2FA UI | Low | ✅ Cross-domain advisories |

**Residual risk:** **LOW** — strongest risk posture in Account Platform trilogy.

---

## D. Council vote

| Field | Value |
|-------|-------|
| **Vote options** | APPROVE · REJECT · DEFER |
| **Council vote** | **APPROVE** |
| **Alternatives considered** | DEFER (rejected); REJECT (rejected — 0 blockers, 96% score) |

---

## Ratification decision — RD-AP2-001

| Field | Decision |
|-------|----------|
| **Ratified?** | **YES** |
| **Certification level** | **LEVEL 3 CERTIFIED WITH FINDINGS** |
| **Evaluation basis** | [PP2_CERTIFICATION_EVALUATION.md](./PP2_CERTIFICATION_EVALUATION.md) (2026-06-20) |
| **Blockers** | **0** |
| **Open major findings** | PP2-F05 (partial, BA-owned) |
| **Open advisory findings** | 5 |

**Council rationale:** PP-2 exceeds READY FOR REVIEW threshold with 96% G1–G9 score and zero non-compliant core matrix rows. Personal settings orchestration (`settingsService`, registry, adapter, hub IA) is production-grade. F05 is reference-scope business dedup — identical treatment to BA-owned surfaces in other domain certifications. Consistent with Business Operations ratification accepting 17 advisories at L3 WITH FINDINGS.

**Not ratified:** NOT CERTIFIED; plain **LEVEL 3 CERTIFIED** (F05 blocks plain L3).

---

## Reference status (PP-2)

| Field | Decision |
|-------|----------|
| **Reference Module #N** | **Not applicable** |
| **Settings pattern reference** | **Deferred** — per [PP2_REFERENCE_REVIEW.md](./PP2_REFERENCE_REVIEW.md) |
| **Reference council opened** | **No** |
| **Revisit trigger** | Umbrella Phase 3 or explicit settings-pattern council |

---

## Ledger recommendation (PP-2)

| Field | Recommendation |
|-------|----------------|
| **Ledger row authorized?** | **YES** — separate Platform Engineering PR |
| **Ledger updated in this session?** | **NO** |
| **Proposed level** | **3 — Certified** |
| **Proposed notation** | LEVEL 3 CERTIFIED WITH FINDINGS · PP-2 Settings Platform · G1–G9 26/27 · 6 tracked findings |

---

**Last updated:** 2026-06-20 (Certification Ratification Council)
