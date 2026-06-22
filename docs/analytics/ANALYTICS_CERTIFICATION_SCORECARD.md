# Analytics Capability — Certification Scorecard

**Program:** Analytics Capability — Formal L2 Certification Evaluation  
**Evaluation date:** 2026-06-22  
**Capability id:** `analytics` (Platform Analytics Capability)  
**Classification:** Platform Capability — Hybrid Domain primary engine  
**Status:** Evaluation record — **not** ledger entry

---

## 1. Final score

| Metric | Value |
|--------|-------|
| **G1–G9 total** | **21 / 27** |
| **Percentage** | **~78%** |
| **Band** | **L2 WITH FINDINGS** |
| **Plain L2 (24–27, minimal findings)** | **Not met** |

---

## 2. Gate scorecard

| Gate | Name | Score | Max | Status | Primary evidence |
|------|------|------:|----:|--------|------------------|
| **G1** | Authorization | **3** | 3 | ✅ PASS | `analytics:read` 4/4; `analyticsPolicyDual` |
| **G2** | Auditability | **2** | 3 | 🟡 PARTIAL | Read events 4/4; AN-M2 Activity derivation |
| **G3** | Service boundaries | **2** | 3 | 🟡 PARTIAL | Capability service; Chat/Todo rollups; AN-M6 informal contracts |
| **G4** | API coherence | **3** | 3 | ✅ PASS | Canonical `/api/analytics/*`; shared summary types |
| **G5** | Ownership | **2** | 3 | 🟡 PARTIAL | Registry + hybrid model; AN-M1 ledger |
| **G6** | Testing | **2** | 3 | 🟡 PARTIAL | Unit tests; AN-M4 no HTTP matrix CI |
| **G7** | Documentation | **3** | 3 | ✅ PASS | 0A/0B/Phase 1/readiness/evaluation suite |
| **G8** | Production safety | **3** | 3 | ✅ PASS | No mocks; placeholder removed; honest degraded |
| **G9** | User trust | **2** | 3 | 🟡 PARTIAL | Real chartered data; AN-M5 enterprise tab gaps |
| | **TOTAL** | **21** | **27** | **L2 CwF** | |

---

## 3. Score progression

| Milestone | Score | Δ |
|-----------|------:|--:|
| Phase 0A (discovery) | ~12–15/27 | — |
| Phase 0B (ratification) | ~15/27 | +3 |
| Post Phase 1 (engineering) | ~21/27 | +6 |
| **Formal evaluation** | **21/27** | — (confirmed) |

---

## 4. Band thresholds (Platform Capability L2)

| Range | Level | Analytics |
|-------|-------|-----------|
| 24–27 | Plain L2 (minimal findings) | ❌ Not met |
| **20–22** | **L2 WITH FINDINGS** | **✅ 21** |
| 18–19 | L2 entry / borderline | Exceeded |
| ≤17 | L1 / not certifiable | Exceeded |

**L3 bands (23–27):** Not applicable — wrong certification class for this evaluation.

---

## 5. Partial gates — uplift path

| Gate | Current | Uplift requires |
|------|---------|-----------------|
| **G2** | 2 | Personal metrics rollup store; reduce Activity-table derivation (AN-M2) |
| **G3** | 2 | Formal Calendar/Drive/Notification rollup contracts (AN-M6) |
| **G5** | 2 | Ledger reclassification; satellite charter enforcement (AN-M1, M3) |
| **G6** | 2 | HTTP operation-matrix integration suite (AN-M4) |
| **G9** | 2 | Enterprise tab data (Phase 3) or permanent feature gates (AN-M5) |

**Plain L2 path:** Five partial gates → 3 (+5 points) = **26/27** — requires major burn-down beyond federated L2 charter scope.

---

## 6. Constitutional compliance snapshot (L2 scope)

| Requirement | Status |
|-------------|--------|
| PE all canonical capability reads | ✅ 4/4 |
| Activity all canonical capability reads | ✅ 4/4 |
| Chat/Todo federation (no analytics-layer Prisma) | ✅ |
| Matrix **C** on canonical + consumer rows | ✅ 10/10 |
| No mock product surfaces | ✅ |
| No false event pipeline signal | ✅ |
| Event pipeline / warehouse | ⏸ Excluded by charter |
| Product module SoR / manifest | ⏸ N/A — Platform Capability |

---

## 7. Comparison to Dashboard (peer program)

| Dimension | Dashboard (L3 CwF) | Analytics (L2 CwF) |
|-----------|-------------------|---------------------|
| Final score | 24/27 | **21/27** |
| Certificate class | Product module L3 | **Platform Capability L2** |
| Blocking at eval | 0 | **0** |
| Open majors | 4 | **6** |
| PE on chartered ops | 100% mutations | **100% canonical reads** |

---

**Last updated:** 2026-06-22
