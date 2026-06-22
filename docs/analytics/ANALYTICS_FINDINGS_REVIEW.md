# Analytics Capability — Findings Review

**Program:** Analytics Capability — Formal L2 Certification Evaluation  
**Evaluation date:** 2026-06-22  
**Status:** Evaluation findings disposition — **not** certificate issuance

**Prior:** Readiness review disposition (2026-06-22) — superseded for certificate treatment by this evaluation record

---

## 1. Blocking findings (AN-B*)

| ID | Finding | Phase 1 status | Evaluation treatment |
|----|---------|----------------|------------------------|
| **AN-B01** (AN-01) | No unified capability service | ✅ Closed | **N/A — not on certificate** |
| **AN-B02** (AN-02) | Chat/Todo Prisma coupling | ✅ Closed | **N/A** |
| **AN-B03** (AN-03) | PE gap on capability routes | ✅ Closed | **N/A** |
| **AN-B04** (AN-04) | Placeholder event subscriber | ✅ Closed | **N/A** |
| **AN-B05** (AN-05) | Mock business workspace | ✅ Closed | **N/A** |
| **AN-B06** (AN-06) | No operation matrix | ✅ Closed | **N/A** |
| **AN-B07** (AN-07) | No ownership registry | ✅ Closed | **N/A** |
| **AN-B08** (AN-08) | Activity conflation (no read events) | ✅ Closed (service layer) | **N/A** |

**Blocking count: 0**

---

## 2. Major findings — evaluation disposition

| ID | Finding | Class | Blocks certification? | Evaluation verdict | Certificate treatment (if ratified) |
|----|---------|-------|:---------------------:|--------------------|-------------------------------------|
| **AN-M1** | Ledger classifies `analytics` as pseudo/product module | **Major (governance)** | No | **Confirmed** | **OPEN FINDING** — ledger reclassification on ratification |
| **AN-M2** | Personal analytics DTO derives from `activity` table | **Major** | No | **Confirmed** | **OPEN FINDING** — Phase 2+ rollup / aggregate store |
| **AN-M3** | `analytics:admin` not enforced on live satellite routes | **Major** | No | **Confirmed** | **OPEN FINDING** — satellite PE audit |
| **AN-M4** | No HTTP / operation-matrix integration suite | **Major** | No | **Confirmed** | **OPEN FINDING** — G6 remediation |
| **AN-M5** | Enterprise tabs (journeys, compliance, insights) product-incomplete | **Major** | No | **Confirmed** | **OPEN FINDING** — Phase 3 historical / domain analytics |
| **AN-M6** | Calendar/Drive/Notification federation not formalized as rollup contracts | **Major (partial)** | No | **Confirmed** | **OPEN FINDING** — Phase 2 prep |

### Closed majors (not on certificate)

| ID | Closed in |
|----|-----------|
| AN-01 through AN-08 | Phase 1 engineering |
| OV-01, OV-02, OV-05 | Phase 1 (mock workspace, placeholder, orphans) |
| CV-01, CV-02, CV-03 | Phase 1 (rollup APIs, capability service) |

---

## 3. Advisory findings — evaluation disposition

| ID | Finding | Class | Evaluation verdict | Certificate treatment (if ratified) |
|----|---------|-------|-------------------|-------------------------------------|
| **AN-A1** | Dual `PersonalAnalytics` DTO namespace (platform vs Place) | Advisory | **Confirmed** | **TRACK** |
| **AN-A2** | `businessAnalyticsService` vs admin aggregate duplication | Advisory | **Confirmed** | **TRACK** |
| **AN-A3** | Memory Bank `analyticsProductContext.md` stale | Advisory | **Confirmed** | **TRACK** |
| **AN-A4** | No authoritative cache layer (K1-05 optional) | Advisory | **Confirmed** | **TRACK** |
| **AN-A5** | Unwired AI analytics Prisma scaffold | Advisory | **Confirmed** | **TRACK** |
| **AN-A6** | Calendar enterprise mock panels (module scope) | Advisory | **Confirmed** | **TRACK** |
| **AN-A7** | Vitest worker timeout flake (web full suite) | Advisory | **Confirmed** | **TRACK** |
| **AN-A8** | Scale query fan-out on dashboard summary | Advisory | **Confirmed** | **TRACK** |

### Excluded from certificate (by charter)

| ID | Item | Evaluation treatment |
|----|------|---------------------|
| AN-09 | No event pipeline | **Excluded** — Phase 2 |
| AN-10 | No warehouse | **Excluded** — Phase 3 |

---

## 4. Certificate finding summary (evaluation draft)

If council ratifies **L2 WITH FINDINGS**, the certificate shall list:

### Major (6)

1. **AN-M1** — Ledger / classification misalignment  
2. **AN-M2** — Personal analytics activity-table derivation  
3. **AN-M3** — Satellite `analytics:admin` enforcement gap  
4. **AN-M4** — No operation-matrix HTTP integration suite  
5. **AN-M5** — Enterprise analytics tabs product-incomplete  
6. **AN-M6** — Partial federation contract formalization  

### Advisory (8)

AN-A1, AN-A2, AN-A3, AN-A4, AN-A5, AN-A6, AN-A7, AN-A8

### Remediation horizon

| Finding | Target | Pre-ratification required? |
|---------|--------|:--------------------------:|
| M1 | Ledger proposal at ratification | No |
| M2, M5 | Phase 2–3 | No |
| M3, M6 | Phase 2 prep | No |
| M4 | Post-cert or parallel test harness | No |
| A-series | Burn-down or waivers | No |

---

## 5. Classification summary

| Class | Open on certificate | Closed |
|-------|--------------------:|-------:|
| **Blocking** | **0** | 8 |
| **Major** | **6** | 8+ |
| **Advisory** | **8** | 0 |

---

## 6. Risk reassessment (evaluation)

| Risk | Severity | Mitigation on certificate |
|------|----------|---------------------------|
| Scale fan-out on live summary reads | Medium | AN-A8 track; Phase 2 MVAP |
| No historical / trend analytics | High | AN-M5; Phase 3 — charter excluded |
| Satellite PE drift from capability | Medium | AN-M3 track |
| Ledger misclassification confuses teams | Medium | AN-M1 — ratification fix |
| Personal Activity derivation audit ambiguity | Medium | AN-M2 track |
| Test evidence gap (no HTTP CI) | Medium | AN-M4 track |

---

## 7. Trust / production posture (evaluation)

| Surface | Trust class | Finding link |
|---------|-------------|--------------|
| Canonical `/api/analytics/*` (AC-01–04) | **Trusted** | — |
| Dashboard facade / QuickStats | **Trusted** | Consumer pattern |
| Business workspace analytics | **Trusted** | — |
| Enterprise overview metrics | **Trusted** | — |
| Enterprise journeys/compliance/insights | **Degraded honest** | AN-M5 |
| Admin Portal operator analytics | **Trusted** (separate program) | Out of scope |
| Module satellites (Chat, HR) | **Module-scoped** | AN-M3 partial |

---

**Last updated:** 2026-06-22 — formal evaluation disposition
