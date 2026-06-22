# Analytics Capability — Reference Review

**Program:** Analytics Capability — Formal L2 Certification Evaluation  
**Evaluation date:** 2026-06-22  
**Status:** Evaluation disposition — **no REFERENCE_MODULE_CATALOG update**

**Cross-reference:** [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md), [ANALYTICS_CAPABILITY_CLASSIFICATION.md](./ANALYTICS_CAPABILITY_CLASSIFICATION.md)

---

## 1. Evaluation determination

| Role | Eligible? | Evaluation verdict |
|------|-----------|-------------------|
| **Reference producer** (Platform Capability exemplar) | **No** | **Deferred** — AN-M4, AN-M6; no pipeline exemplar |
| **Reference consumer** (Dashboard → Analytics facade) | **Yes** | **Affirmed** — documented consumer pattern |
| **Module interior reference** (Chat/Todo rollup export) | **Yes** | **Informal exemplar** — not catalog-listed |
| **Operator reference** (Admin Portal analytics) | **Yes** | **Separate program** — L3 CwF via Admin Portal |

---

## 2. Reference producer — evaluation rejection rationale

| Criterion | Evidence | Verdict |
|-----------|----------|---------|
| Canonical contract stable | AC-01–04 + shared types | ✅ Met |
| Operation matrix + CI at reference quality | No HTTP matrix CI (AN-M4) | ❌ Fail |
| Federation contracts complete | Chat/Todo only; AN-M6 | ❌ Partial |
| Event pipeline / MVAP exemplar | Phase 2 deferred | ❌ Absent |
| Reproducible third-party pattern | Docs improving; majors open | 🟡 Partial |

**Evaluation verdict:** **Not a reference producer.** Revisit after Phase 2 pipeline delivers invalidation + MVAP pattern.

---

## 3. Consumer pattern — evaluation affirmation

| Pattern | Producer | Consumer | Evaluation status |
|---------|----------|----------|-------------------|
| Cross-module tenant rollup | Platform Analytics Capability | Dashboard (`dashboardAnalyticsFacade`) | **✅ Affirmed reference consumer** |
| AI quick-stats context | Analytics summary (AI path) | Dashboard AI context route | **✅ Consumer** |
| Enterprise KPI projection | Business analytics via summary | Enterprise panels | **✅ Consumer** |

This is the **primary reference artifact** for Platform Capability consumption — modules and surfaces must not aggregate cross-module metrics outside the capability contract.

---

## 4. Federation exemplars (module-local)

| Module | Pattern | Evaluation use |
|--------|---------|----------------|
| **Chat** | `countUnreadMessagesForDashboardRollup` | Rollup export template — informal |
| **Todo** | `countPendingTasksForDashboardRollup` | Phase 1 federation template — informal |
| **HR / Admin Portal** | Domain / operator analytics | Separate ownership classes |

Chat/Todo contracts may be cited in architecture guides but are **not** elevated to Reference Module catalog entries at L2 evaluation.

---

## 5. Post-ratification reference posture

| Event | Reference action |
|-------|------------------|
| **L2 CwF ratified** | Reaffirm Dashboard consumer pattern in architecture docs |
| **Ledger reclassified (AN-M1)** | Update reference narrative to Platform Capability class |
| **Phase 2 pipeline live** | Re-evaluate **producer** candidacy |
| **Phase 3 historical rollups** | Re-evaluate Platform Capability L3 + reference producer |

---

## 6. Evaluation options disposition

| Option | Verdict |
|--------|---------|
| Reference producer candidate | ❌ **Rejected at evaluation** |
| **Consumer pattern affirmed** | ✅ **Selected** |
| **Producer deferred** | ✅ **Selected** — Phase 2 gate |
| Reference rejected entirely | ❌ — consumer pattern has value |

---

## 7. Required question — reference status

| # | Question | Answer |
|---|----------|--------|
| 8 | Reference candidate status? | **Consumer affirmed; producer deferred** — Dashboard facade is the documented reference; Analytics Capability is **not** Reference Module #N at L2 |

---

**Last updated:** 2026-06-22 — formal evaluation disposition
