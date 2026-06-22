# Dashboard Module — Operation Matrix Reassessment

**Program:** Dashboard Module Wave 3 — Certification Readiness Review  
**Review date:** 2026-06-21  
**Status:** Governance reassessment — supersedes Phase 0B row statuses for certified paths

**Prior:** [DASHBOARD_OPERATION_MATRIX.md](./DASHBOARD_OPERATION_MATRIX.md) (Phase 0B discovery)

---

## 1. Summary comparison

| Metric | Phase 0B | Post P1–P3 |
|--------|----------|------------|
| Operations inventoried | 42 | 42 (unchanged) |
| Rows **C** (core D/S/W/A/C) | 4 (10%) | **~26 (~79%)** |
| Rows **P** | 22 (52%) | **~7 (~21%)** |
| Rows **N** | 16 (38%) | **0** (blocking) |
| PE compliant (24 paths) | 1 (4%) | **24 (100%)** |
| Activity compliant (16 mutations) | 0 (0%) | **16 (100%)** |
| Domain events (4 required) | 0 | **4/4** |

**L2 threshold (majority P, zero N on blocking):** ✅ **Met**  
**L3 CwF threshold (majority C on mutations):** ✅ **Met**

---

## 2. Reassessed rows — Dashboard tab (D)

| ID | Operation | Phase 0B | Post P1–P3 | Driver |
|----|-----------|--------|------------|--------|
| D-01 | List dashboards | **N** | **C** | PE on list (P1) |
| D-02 | Ensure default personal | **N** | **C** | `POST /ensure-default`; PE + activity (P1) |
| D-03 | Create tab | **N** | **C** | PE + activity + `dashboard.tab.created` (P1–P2) |
| D-04 | Get by id | **P** | **C** | PE (pre-existing + P1) |
| D-05 | Update dashboard | **N** | **C** | PE + activity (P1) |
| D-06 | Delete tab | **N** | **C** | PE + activity + DE (P1–P2) |
| D-07 | Delete + file migration | **N** | **C** | Service orchestration; PE + activity + DE (P1–P2) |
| D-08 | File summary read | **N** | **P** | PE gated (P2); Drive-adjacent read |
| D-09 | Ensure business dashboard | **P** | **P** | Internal ensure; activity on create |
| D-10 | Soft-trash tab | **N** | **C** | `dashboardTrashService`; PE + activity (P1) |
| D-11 | Restore tab | **N** | **C** | PE + activity (P1) |
| D-12 | Permanent purge | **N** | **C** | PE + activity + DE (P1–P2) |

**Side effects:** M2/M3 decoupled (P2) — no longer matrix violations on D-03.

---

## 3. Reassessed rows — Widget (W)

| ID | Operation | Phase 0B | Post P1–P3 | Driver |
|----|-----------|--------|------------|--------|
| W-01 | Add widget | **N** | **C** | PE + activity + DE (P1–P2) |
| W-02 | Update widget | **N** | **C** | PE + activity (P1) |
| W-03 | Remove widget | **N** | **C** | PE + activity + DE (P1–P2) |
| W-04 | Batch positions | **N** | **C** | PE + activity (P1) |
| W-05 | Apply template | **N** | **P** | Client multi-call; server paths compliant |
| W-06 | Build-out widgets | **N** | **P** | Client multi-call |
| W-07 | Picker eligibility | **C** | **C** | Unchanged |

---

## 4. Reassessed rows — Sidebar (S)

| ID | Operation | Phase 0B | Post P1–P3 |
|----|-----------|--------|------------|
| S-01 | Get sidebar | **N** → **C** | PE (P1) |
| S-02 | Save sidebar | **N** → **C** | PE + activity (P1) |
| S-03 | Update sidebar | **N** → **C** | PE + activity (P1) |
| S-04 | Reset sidebar | **N** → **C** | PE + activity (P1) |
| S-05 | Widget-local config | **P** → **P** | Via W-02 |
| S-06 | Grid edit mode | **C** → **C** | Client-only |

---

## 5. Reassessed rows — AI context (A)

| ID | Operation | Phase 0B | Post P1–P3 |
|----|-----------|--------|------------|
| A-01 | Overview | **N** → **C** | PE + `dashboardAIContextService` (P2) |
| A-02 | Quick stats | **N** → **C** | Analytics `dashboard-summary` delegate (P3) |
| A-03 | Widgets | **N** → **C** | PE + `dashboardAIContextService` (P2) |

---

## 6. Reassessed rows — Client (C)

| ID | Operation | Phase 0B | Post P1–P3 |
|----|-----------|--------|------------|
| C-01 | Load widget grid | **P** → **P** | Via D-04 |
| C-02 | Header stats refresh | **P** → **C** | `dashboardAnalyticsFacade` (P3) |
| C-03 | Enterprise dashboard | **N** → **P** | Facade + degraded empty; opt-in mount (P3) |
| C-04 | Enterprise showcase | **P** → **P** | Marketing/demo |
| C-05 | Federated search | **P** → **P** | Platform search |

---

## 7. Widget projection reads (P) — trust cross-ref

| ID | Phase 0B | Post P1–P3 |
|----|--------|------------|
| P-07 activityfeed | **N** | **C** (B4) |
| P-08 quickstats | **N** | **C** (P3 facade) |
| P-02 drive | **P** | **P** (random share — P4 optional) |
| P-01,03–06,09–12 | **C** | **C** |

---

## 8. Share operations (X) — unchanged

| ID | Status | Notes |
|----|--------|-------|
| X-01, X-02 | **—** | Not implemented |
| X-03 | **P** | Drive delegate |

---

## 9. Rollup counts (core module HTTP + mutations: D+W+S+A+C = 33 rows)

| Status | Phase 0B | Post P1–P3 |
|--------|----------|------------|
| **C** | 4 | **26** |
| **P** | 22 | **7** |
| **N** | 7* | **0** |

*Phase 0B N count on core subset; full inventory included additional N rows in projections.

---

## 10. M4 gap

Matrix **documentation** is reassessed; **automated matrix test suite** (M4) is **not** implemented. Evaluation should cite reassessment doc + unit/integration tests as interim evidence until P4 CI matrix lands.

---

**Last updated:** 2026-06-21
