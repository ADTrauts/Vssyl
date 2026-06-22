# Analytics Capability — Post-Ratification Roadmap

**Program:** Analytics Capability Modernization  
**Ratification:** RD-AN-001 (2026-06-22)  
**Certification level:** **LEVEL 2 CERTIFIED WITH FINDINGS @ 21/27**  
**Classification:** Platform Capability — Hybrid Domain primary engine  
**Status:** Authoritative post-ratification roadmap — **program NOT archived**

---

## Ratification posture

| Field | Value |
|-------|-------|
| Council decision | **APPROVE — RATIFIED** |
| Ledger | **Authorized — not executed** |
| Certification execution | **Authorized — not performed** |
| Reference producer | **Deferred** |
| Phase 1 complete | ✅ Federated L2 Trust & Service Boundary |
| Phase 2 (Event Pipeline) | **Not authorized** — separate council gate |
| Phase 3 (Historical) | **Not authorized** — future |

---

## Phase map

```
Phase 0A        ✅ Constitutional discovery
Phase 0B        ✅ Strategic architecture ratified (Hybrid Option C)
Phase 1         ✅ Federated L2 trust & service boundary
Readiness       ✅ L2 CwF candidate @ 21/27
Evaluation      ✅ L2 CwF eligible @ 21/27
Ratification    ✅ RD-AN-001 APPROVE
Execution       ⏳ Ledger PR + certificate issuance (separate ACT)
Finding burn-down ⏳ Per certificate (no new package authorized today)
Phase 2         ❌ Not authorized — 2027 program gate
Phase 3         ❌ Not authorized — 2028 program gate
Archive         ❌ Not authorized
```

---

## Immediate next gates (priority order)

| # | Initiative | Type | Priority | Notes |
|---|------------|------|----------|-------|
| 1 | **Certification execution** — ledger PR | Certification ops | **High** | Authorized by RD-AN-001; update `CERTIFICATION_LEDGER.md` |
| 2 | **Certificate issuance** — 14 tracked findings | Certification ops | **High** | 6 major + 8 advisory on certificate |
| 3 | **Ledger reclassification (AN-M1)** | Governance | **High** | Pseudo-module L1 → Platform Capability L2 CwF |
| 4 | **Memory Bank refresh (AN-A3)** | Documentation | **Medium** | `analyticsProductContext.md` |
| 5 | **Platform portfolio refresh** | Documentation | **Medium** | Analytics L1 → L2 CwF in portfolio docs |
| 6 | **Phase 2 authorization review** | Governance | **Low** | Separate program — blocked on Platform Events maturity |

**Phase 2 engineering is explicitly NOT authorized by this ratification.**

---

## Certificate finding remediation themes (no package charter today)

Remediation may proceed opportunistically or via future authorized packages. No engineering package is chartered in this roadmap.

### Theme 1 — Test evidence (AN-M4)

- Operation matrix HTTP integration suite for AC-01–AC-04
- CI gate on canonical capability rows
- Target: G6 → 3

### Theme 2 — Governance & ownership (AN-M1, AN-M3)

- Ledger execution with Platform Capability class
- Satellite PE audit for `analytics:admin` on operator paths
- Target: G5 uplift

### Theme 3 — Service boundary hardening (AN-M2, AN-M6)

- Personal metrics rollup abstraction
- Formal Calendar/Drive/Notification rollup contract IDs
- Target: G2, G3 uplift

### Theme 4 — Product completeness (AN-M5)

- Enterprise journeys/compliance/insights — Phase 3 historical analytics
- Or permanent feature gates with product sign-off
- Target: G9 uplift

### Theme 5 — Advisory burn-down (AN-A1–A8)

- DTO namespace, metric map, cache posture, AI scaffold, CI flake, scale planning

### Expected score impact (if all themes closed)

| Gate | Current | Potential |
|------|---------|-----------|
| G2 | 2 | 3 |
| G3 | 2 | 3 |
| G5 | 2 | 3 |
| G6 | 2 | 3 |
| G9 | 2 | 3 |
| **Total** | 21/27 | **24–26/27** |

**Plain L2 path:** Requires major burn-down + council plain-L2 vote — not authorized today.

---

## Future program gates (not authorized)

| Phase | Scope | Authorization required |
|-------|-------|------------------------|
| **Phase 2** | Event pipeline + MVAP rollups (2027) | Separate Phase 2 authorization council |
| **Phase 3** | Warehouse + historical analytics (2028) | Separate Phase 3 authorization council |
| **Platform Capability L3** | Materialized rollups at scale | Post Phase 2–3 |
| **Reference producer** | Capability exemplar designation | Post Phase 2 pipeline |

---

## Relationship to peer programs

| Program | Relationship | Post-ratification action |
|---------|--------------|--------------------------|
| **Dashboard (L3 CwF)** | Primary consumer via facade | Maintain consumer contract; no regression |
| **Admin Portal** | Operator analytics satellite | No merge into capability certificate |
| **Chat / Todo** | Rollup federation exemplars | Extend contract pattern (AN-M6) |
| **Platform Events** | Phase 2 dependency | Maturity gate before Phase 2 ACT |

---

## Program status

| Field | Value |
|-------|-------|
| **Certification** | Ratified L2 CwF — execution pending |
| **Modernization (2026 federated L2)** | **Complete** |
| **Full Analytics program** | **In progress** — Phase 2–3 future |
| **Archive** | **Not authorized** |

---

**Last updated:** 2026-06-22
