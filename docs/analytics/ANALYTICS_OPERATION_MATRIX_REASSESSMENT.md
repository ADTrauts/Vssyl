# Analytics Capability — Operation Matrix Reassessment

**Program:** Analytics Capability — Certification Readiness Review  
**Review date:** 2026-06-22  
**Status:** Governance reassessment — **not** certification execution

**Baseline matrix:** [ANALYTICS_OPERATION_MATRIX.md](./ANALYTICS_OPERATION_MATRIX.md) (Phase 1 closeout)

---

## 1. Summary counts (post–Phase 1)

| Metric | Phase 0A (est.) | Post Phase 1 | Post readiness review |
|--------|----------------:|-------------:|----------------------:|
| **Operations inventoried** | ~12 (partial) | **16** | **16** |
| Canonical capability ops | 4 (1 PE) | **4** | **4** |
| PE required (canonical) | 4 | 4 | 4 |
| PE compliant (canonical) | **1** | **4** | **4** |
| Activity required (canonical) | 4 | 4 | 4 |
| Activity compliant (canonical) | **0** | **4** | **4** |
| Matrix rows **C** | ~2 | **10** | **10** |
| Matrix rows **P** | ~6 | **2** | **2** |
| Matrix rows **N** | ~4 | **0** | **0** |

**Matrix compliance score (Phase 1 inventory):** **10/12 chartered rows = C (83%)** on in-scope operations; **2 P** on satellites/deferred.

---

## 2. Section reassessment

### A. Platform Analytics Capability (canonical) — 4/4 **C**

| ID | PE R/T | Act R/T | Readiness verdict |
|----|--------|---------|-------------------|
| AC-01 | Yes / Yes | Yes / Yes | **C** — unchanged |
| AC-02 | Yes / Yes | Yes / Yes | **C** |
| AC-03 | Yes / Yes | Yes / Yes | **C** |
| AC-04 | Yes / Yes | Yes / Yes | **C** |

**PE parity:** 100% on canonical routes (closes AN-03).

### B. Federated rollup contracts — 2/2 **C**

| ID | Status | Notes |
|----|--------|-------|
| FR-01 Chat unread | **C** | Rollup API; no analytics-layer Prisma |
| FR-02 Todo pending | **C** | Rollup API; no analytics-layer Prisma |

**Partial federation note (AN-M6):** Calendar, Drive, Notifications use module services but lack named rollup contract IDs — matrix **C** for behavior, **P** for contract formalization.

### C. Consumers — 4/4 **C**

| ID | Mock removed | Readiness verdict |
|----|--------------|-------------------|
| CS-01 Dashboard facade | ✅ | **C** |
| CS-02 Executive panel | ✅ | **C** |
| CS-03 Cross-module panel | ✅ (empty honest) | **C** |
| CS-04 Business workspace | ✅ | **C** |

### D. Satellites — 4/4 **P** (out of L2 canonical certificate scope)

| ID | PE Phase 1 | Readiness verdict |
|----|------------|-------------------|
| SA-01 Admin Portal | Partial | **P** — separate program |
| SA-02 Chat module | Module-scoped | **P** |
| SA-03 HR admin | Module-scoped | **P** |
| SA-04 Business profile | Business auth | **P** |

Satellites are **documented**, not **N** — acceptable for L2 WITH FINDINGS on Platform Capability canonical scope only.

### E. Retired — 3/3 **C**

RT-01 through RT-03 closed in Phase 1.

### F. Deferred — documented, not scored as **N**

DF-01 through DF-04 explicitly excluded from L2 federated certification scope.

---

## 3. Compliance interpretation

| Scope | C | P | N |
|-------|--:|--:|--:|
| **L2 certificate scope** (A + B + C + E) | **10** | **0** | **0** |
| **Full inventory incl. satellites** | **10** | **2** | **0** |
| **Including deferred** | — | — | — (excluded) |

**Updated operation matrix score for readiness question #2:** **10 C / 2 P / 0 N** (16 inventoried); **100% C** on L2 canonical + consumer + federation rows.

---

## 4. Gaps not represented as matrix **N**

| Gap | Matrix treatment | Finding |
|-----|------------------|---------|
| No HTTP integration tests for AC-* | Test layer, not op row | AN-M4 |
| Personal DTO reads Activity model | AC-02 still **C** on PE/activity; derivation is finding | AN-M2 |
| Enterprise tab empties | CS-03 **C** (honest degraded) | AN-M5 |

---

## 5. Comparison to Dashboard matrix reassessment

| Dimension | Dashboard (L3 CwF) | Analytics (L2 CwF target) |
|-----------|-------------------|---------------------------|
| Core ops **C** | ~79% mutations | **100%** canonical reads |
| PE compliance | 100% mutations | **100%** canonical reads |
| Activity compliance | 100% mutations | **100%** canonical reads |
| Certificate class | Product module L3 | Platform Capability L2 |
| Deferred ops | Few | Pipeline, warehouse, historical explicit |

---

## 6. Readiness conclusion

The operation matrix supports **L2 WITH FINDINGS** candidacy on **canonical Platform Analytics Capability** operations. Satellite **P** rows and deferred items are **explicitly out of certificate scope** unless council expands charter.

---

**Last updated:** 2026-06-22
