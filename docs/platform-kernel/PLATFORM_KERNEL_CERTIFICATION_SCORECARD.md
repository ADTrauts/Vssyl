# Platform Kernel — Certification Scorecard

**Program:** Platform Kernel — Formal L2 Certification Evaluation  
**Evaluation date:** 2026-06-23  
**Capability id:** `platform_kernel` (Platform Kernel — Activity + Domain Events)  
**Classification:** Platform Capability — composite infrastructure  
**Topology:** Option C — combined award + sub-scores  
**Status:** Evaluation record — **not** ledger entry

---

## 1. Final scores

| Metric | Value |
|--------|-------|
| **Combined G1–G9** | **21 / 27** |
| **Platform Activity sub-score** | **22 / 27** |
| **Domain Events sub-score** | **21 / 27** |
| **Percentage (combined)** | **~78%** |
| **Band** | **L2 WITH FINDINGS** |
| **Plain L2 (23–27)** | **Not met** |

---

## 2. Combined gate scorecard

| Gate | Name | Score | Max | Status | Primary evidence |
|------|------|------:|----:|--------|------------------|
| **G1** | Authorization | **2** | 3 | 🟡 PARTIAL | DE post-auth; PK-ACT-M9 feed PE gap |
| **G2** | Auditability | **3** | 3 | ✅ PASS | ACT-R1 closed; DE log mirror |
| **G3** | Service boundaries | **3** | 3 | ✅ PASS | Query service; DE matrix registration |
| **G4** | API / contract coherence | **2** | 3 | 🟡 PARTIAL | PK-ACT-M4; split contracts |
| **G5** | Ownership | **3** | 3 | ✅ PASS | Facades + kernel ownership docs |
| **G6** | Testing | **3** | 3 | ✅ PASS | IMP + DE test suites |
| **G7** | Documentation | **3** | 3 | ✅ PASS | Kernel + readiness + eval suite |
| **G8** | Production safety | **2** | 3 | 🟡 PARTIAL | Honest stubs; PK-DE-M3 in-process |
| **G9** | Platform trust | **2** | 3 | 🟡 PARTIAL | PK-ACT-M1; PK-DE-M6 |
| | **COMBINED** | **21** | **27** | **L2 CwF** | |

---

## 3. Platform Activity sub-scorecard

| Gate | Score | Max | Status | Primary evidence |
|------|------:|----:|--------|------------------|
| G1 | **2** | 3 | 🟡 | Feed auth; no PE reads |
| G2 | **3** | 3 | ✅ | `platformActivityQueryService` |
| G3 | **3** | 3 | ✅ | Canonical read federation |
| G4 | **2** | 3 | 🟡 | PK-ACT-M4 |
| G5 | **3** | 3 | ✅ | Adoption + ownership reports |
| G6 | **3** | 3 | ✅ | IMP test suites |
| G7 | **3** | 3 | ✅ | Query service docs |
| G8 | **3** | 3 | ✅ | Write path isolation |
| G9 | **2** | 3 | 🟡 | PK-ACT-M1 legacy table |
| **TOTAL** | **22** | **27** | **L2 CwF upper** | |

---

## 4. Domain Events sub-scorecard

| Gate | Score | Max | Status | Primary evidence |
|------|------:|----:|--------|------------------|
| G1 | **3** | 3 | ✅ | Post-auth emit |
| G2 | **2** | 3 | 🟡 | Log mirror; no read API |
| G3 | **3** | 3 | ✅ | DE-1 matrix + gating |
| G4 | **2** | 3 | 🟡 | No consume contract |
| G5 | **3** | 3 | ✅ | 192 types; HR facade |
| G6 | **3** | 3 | ✅ | Matrix + HR tests |
| G7 | **3** | 3 | ✅ | `DOMAIN_EVENTS.md` |
| G8 | **2** | 3 | 🟡 | PK-DE-M3 in-process |
| G9 | **2** | 3 | 🟡 | PK-DE-M6 partial fan-out |
| **TOTAL** | **21** | **27** | **L2 CwF** | |

---

## 5. Score progression

| Milestone | Combined | Activity | Domain Events |
|-----------|----------|----------|---------------|
| Wave 1 discovery | ~15/27 | ~16/27 | ~18/27 |
| Post-modernization (readiness) | 21/27 | 22/27 | 21/27 |
| **Formal evaluation** | **21/27** | **22/27** | **21/27** |

**Evaluation delta:** Readiness priors **confirmed** — no gate adjustment required.

---

## 6. Band thresholds (Platform Capability L2)

| Range | Level | Platform Kernel |
|-------|-------|-----------------|
| 23–27 | Plain L2 (minimal findings) | ❌ Not met |
| **20–22** | **L2 WITH FINDINGS** | **✅ 21** |
| 18–19 | L2 entry / borderline | Exceeded |
| ≤17 | L1 / not certifiable | Exceeded |

**L3 bands:** Not applicable — infrastructure capability; durability/replay required for L3 horizon.

---

## 7. Partial gates — uplift path

| Gate | Combined | Uplift requires |
|------|----------|-----------------|
| **G1** | 2 | PK-ACT-M9 PE on activity reads |
| **G4** | 2 | PK-ACT-M4 delegate Place/workforce |
| **G8** | 2 | L3 durability (PK-DE-M3) — out of plain-L2 path |
| **G9** | 2 | PK-ACT-M1 table retirement; PK-DE-M6 expansion |

**Plain L2 path:** Four partial gates → 3 (+4 min) = **25/27** — requires major burn-down (W4, delegate, operator guide, CI audit).

---

## 8. Constitutional compliance snapshot (L2 scope)

| Requirement | Status |
|-------------|--------|
| ACT-R1 read path closed | ✅ |
| Canonical activity query service | ✅ |
| DE subscriber honesty (no default stubs) | ✅ |
| HR domain event adoption | ✅ |
| DE operation matrix runtime validation | ✅ |
| Module dual-write on success paths (certified modules) | ✅ |
| Durability / replay | ⏸ L3 — excluded |
| Product module manifest / workspace hub | ⏸ N/A — Platform Capability |

---

## 9. Peer comparison

| Dimension | Analytics (L2 CwF) | Platform Kernel (evaluated) |
|-----------|-------------------|----------------------------|
| Combined score | 21/27 | **21/27** |
| Certificate class | Platform Capability | **Platform Capability** |
| Topology | Single capability | **Combined + sub-scores** |
| Blocking at eval | 0 | **0** |
| Open majors | 6 | **4** |
| Wave 1 critical debt | Mock surfaces, ACT-R1 coupling | **ACT-R1, stubs, HR — closed** |

---

**Last updated:** 2026-06-23
