# Unified Search — Capability Certification Review

**Program:** Unified Search Capability — Phase 1B  
**Review date:** 2026-06-23  
**Capability id:** `unified_search`  
**Classification:** Platform Capability — federated discovery infrastructure  
**Architecture:** Option C Hybrid (authoritative providers + optional derived indexes later)  
**Status:** Formal certification review — governance only

**Evidence baseline:** [UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md](./UNIFIED_SEARCH_PHASE_1A_CLOSEOUT.md), [UNIFIED_SEARCH_OPERATION_MATRIX.md](./UNIFIED_SEARCH_OPERATION_MATRIX.md), [SEARCH_ARCHITECTURE_DECISION_RECORD.md](../architecture/SEARCH_ARCHITECTURE_DECISION_RECORD.md)

---

## 1. Executive recommendation

| Question | Answer |
|----------|--------|
| **Current maturity (0–5 scale)** | **Level 3 — Platform Capability** |
| **Recommended maturity** | **Level 4 — Certified Platform Capability** (L2 CwF award) |
| **Certification recommendation** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Blocking issues** | **0** |
| **Plain L2 (23–27)** | **Not met** (21/27) |
| **Foundational (Level 5)** | **Not ready** — AI, marketplace, derived index, activity integration deferred |

**Rationale:** Phase 1A delivered honest federation, PE gate, service extraction, and manifest parity. Remaining gaps are **infrastructure evolution** (dynamic registry, AI adapter, index acceleration), not honesty or security blockers. Award **L2 CwF** now; defer plain L2 and Level 5 until Phase 2+ programs close documented majors.

---

## 2. Architecture evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Service extraction complete | ✅ **PASS** | `searchCapabilityService.ts` owns orchestration |
| Controller thinness | ✅ **PASS** | `searchController.ts` — HTTP only |
| Capability ownership | ✅ **PASS** | Platform capability; not a product module |
| Dependency boundaries | 🟡 **PARTIAL** | Providers call module visibility services; registry static |
| Registry design | 🟡 **PARTIAL** | `RegisteredSearchProvider` contract; 9 providers; not manifest-driven |

**Architecture score:** **Strong** for L2 CwF; **not** reference-implementation grade.

---

## 3. Security evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Policy Engine enforcement | ✅ **PASS** | `search:read` at orchestrator; `searchPolicyDual` |
| Permission inheritance | ✅ **PASS** | Entity-level PE via visibility services per provider |
| Tenant isolation | ✅ **PASS** | `filters.context` + PE membership; notes/dashboard mismatch tests |
| Context isolation | 🟡 **PARTIAL** | Business search requires clients to pass `dashboardId` for full task scoping |
| Data leakage risks | 🟡 **LOW–MEDIUM** | Federated model correct; dashboard owner-only; admin operator search separate |

**Security score:** **Adequate for certification** with documented SC-M4 context scoping advisory.

---

## 4. Extensibility evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Future first-party modules | ✅ **PASS** | `RegisteredSearchProvider` + visibility delegate pattern |
| Third-party modules | 🟡 **PARTIAL** | Contract in `shared/types/search.ts`; no marketplace loader |
| Provider registration quality | ✅ **PASS** | Metadata: entity types, contexts, PE action, readiness |
| Registry maintainability | 🟡 **PARTIAL** | Static array + parity test; manual registration |

---

## 5. Platform alignment

| Integration | Readiness | Notes |
|-------------|-----------|-------|
| **Identity** | ✅ | JWT + `search:read`; user-scoped orchestration |
| **Permissions** | ✅ | Orchestrator + per-entity PE |
| **Activity** | ❌ | No search audit/activity emission |
| **Platform Entities** | 🟡 | `SearchResult.type` ad hoc; not registry-aligned |
| **V_Link** | ✅ | Dedicated provider; membership-scoped |
| **Domain Events** | 🟡 | `searchIndexDomainEventSubscriber` stub only |
| **AI** | 🟡 | Parallel retrieval paths; not unified delegate |
| **Marketplace** | 🟡 | Contract exists; loader not implemented |

---

## 6. Search capability scorecard (0–5 maturity)

| Level | Definition | Met? |
|-------|------------|:----:|
| **0 — Ad Hoc Search** | Per-route Prisma filters, no contract | Superseded |
| **1 — Module Search** | Module-local search only | Superseded |
| **2 — Shared Search** | Global API without PE/providers | Superseded |
| **3 — Platform Capability** | Service + registry + PE + federation | ✅ **Current** |
| **4 — Certified Platform Capability** | L2 CwF governance + constitutional standard | ✅ **Target (this phase)** |
| **5 — Foundational Platform Service** | AI retrieval, marketplace, index, activity | ❌ Future |

---

## 7. G1–G9 certification scorecard

| Gate | Name | Score | Max | Status | Primary evidence |
|------|------|------:|----:|--------|------------------|
| **G1** | Authorization | **3** | 3 | ✅ PASS | `search:read`; entity PE per provider |
| **G2** | Auditability | **1** | 3 | 🔴 WEAK | No search activity/audit events |
| **G3** | Service boundaries | **3** | 3 | ✅ PASS | `searchCapabilityService`; thin controller |
| **G4** | API / contract coherence | **2** | 3 | 🟡 PARTIAL | Stable `POST /api/search`; no response meta exposed |
| **G5** | Ownership | **3** | 3 | ✅ PASS | Platform capability class documented |
| **G6** | Testing | **2** | 3 | 🟡 PARTIAL | Unit tests; no full integration matrix CI |
| **G7** | Documentation | **3** | 3 | ✅ PASS | Phase 0A/1A/1B suite |
| **G8** | Production safety | **2** | 3 | 🟡 PARTIAL | Sequential fan-out; substring scale |
| **G9** | Platform trust | **2** | 3 | 🟡 PARTIAL | Honest federation; AI/marketplace gaps |
| | **TOTAL** | **21** | **27** | **L2 CwF** | ~78% |

**Band:** **LEVEL 2 CERTIFIED WITH FINDINGS** (same band as Platform Analytics, Platform Kernel).

---

## 8. Findings register

### Major findings (on certificate)

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **SC-M1** | Static provider registry — not manifest-driven | Major | 2 |
| **SC-M2** | Operation matrix not enforced in CI | Major | 2 |
| **SC-M3** | No activity/audit emission for global search | Major | 2 |
| **SC-M4** | AI retrieval uses parallel paths, not search delegates | Major | 2 |
| **SC-M5** | Sequential provider fan-out; no per-provider timeout | Major | 2 |
| **SC-M6** | Prisma `contains` substring ceiling at scale | Major | 3+ |

### Advisory findings

| ID | Finding | Phase |
|----|---------|-------|
| **SC-A1** | Suggestions are module hints, not history-backed | 2 |
| **SC-A2** | Tag index facet not wired to orchestrator | 2+ |
| **SC-A3** | HR / Scheduling / Workforce not federated | 3 |
| **SC-A4** | Dashboard provider owner-scoped only | 2 |
| **SC-A5** | No marketplace provider loader | 2 |
| **SC-A6** | `searchIndexDomainEventSubscriber` stub only | 3+ |

### Blocking issues

**None.** All majors are evolution or observability gaps, not security or honesty blockers.

---

## 9. Certification decision

| Decision | Value |
|----------|-------|
| **Award** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Capability id** | `unified_search` |
| **Record id** | RD-US-001 |
| **Program status** | Phase 1B governance complete; implementation Phase 2 authorized separately |
| **Reference designation** | **Not** Reference Implementation — federation consumer pattern only |
| **Peer capabilities** | Platform Analytics (L2 CwF), Platform Kernel (L2 CwF), Context Graph (L3) |

---

## 10. Conditions for plain L2 / Level 5

| Milestone | Closes |
|-----------|--------|
| Manifest-driven provider registry | SC-M1, SC-A5 |
| Operation matrix CI gate | SC-M2 |
| Search activity/audit policy decision | SC-M3 |
| AI retrieval adapter on search delegates | SC-M4 |
| Parallel fan-out + timeouts | SC-M5 |
| Derived index charter (optional) | SC-M6, SC-A2 |
| HR/Scheduling federation (if manifest claims) | SC-A3 |

---

**Last updated:** 2026-06-23
