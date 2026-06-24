# AI Retrieval — Capability Certification Review

**Program:** AI Retrieval Adapter — Phase 2A  
**Review date:** 2026-06-23  
**Capability id:** `ai_retrieval`  
**Classification:** Platform Capability — AI discovery orchestration infrastructure  
**Architecture:** Option B Hybrid (Search for discovery + providers for summaries + independent memory)  
**Status:** Formal certification review — governance only

**Evidence baseline:** [AI_RETRIEVAL_PHASE_1A_CLOSEOUT.md](./AI_RETRIEVAL_PHASE_1A_CLOSEOUT.md), [AI_RETRIEVAL_PHASE_1B_CLOSEOUT.md](./AI_RETRIEVAL_PHASE_1B_CLOSEOUT.md), [AI_RETRIEVAL_CONSUMER_STANDARD.md](./AI_RETRIEVAL_CONSUMER_STANDARD.md), [AI_RETRIEVAL_READINESS_MATRIX.md](./AI_RETRIEVAL_READINESS_MATRIX.md)

---

## 1. Executive recommendation

| Question | Answer |
|----------|--------|
| **Current maturity (0–5 scale)** | **Level 3 — Platform Retrieval** |
| **Recommended maturity** | **Level 4 — Certified Retrieval Capability** (L2 CwF award) |
| **Certification recommendation** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Blocking issues** | **0** |
| **Plain L2 (23–27)** | **Not met** (20/27) |
| **Foundational (Level 5)** | **Not ready** — adoption, audit persistence, semantic layer, marketplace deferred |

**Rationale:** Phases 1A–1B delivered an honest adapter that consumes Unified Search without duplicating search logic, enforces `search:read`, produces standardized evidence and diagnostics, and wires two production consumers. Remaining gaps are **adoption breadth** (parallel AI paths), **audit persistence**, and **marketplace enforcement** — not security or architectural honesty blockers. Award **L2 CwF** now; defer plain L2 and Level 5 until Phase 2B+ adoption programs close documented majors.

**Recognition class:** **Platform Capability** — certified infrastructure, not foundational AI layer yet.

---

## 2. Architecture evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Capability ownership | ✅ **PASS** | `aiRetrievalCapabilityService` — platform capability; not a product module |
| Service boundaries | ✅ **PASS** | Adapter → Search only; no direct visibility bypass |
| Search integration quality | ✅ **PASS** | `discover()` → `executeGlobalSearch()`; no duplicate provider logic |
| Adapter design | ✅ **PASS** | Evidence mapper, diagnostics, consumer contract, pipeline hook |
| Dependency structure | 🟡 **PARTIAL** | Depends on `unified_search` (certified); inherits SC-M4 partial state |
| Consumer wiring | 🟡 **PARTIAL** | 2 of ~35+ AI retrieval paths (`planning`, `workflow_action`) |

**Architecture score:** **Strong** for L2 CwF; not reference-implementation or foundational grade.

---

## 3. Security evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| `search:read` enforcement | ✅ **PASS** | Inherited via `executeGlobalSearch` / `evaluateSearchPolicyDual` |
| Tenant isolation | ✅ **PASS** | `filters.context` — `dashboardId`, `businessId`, `householdId` |
| Permission inheritance | ✅ **PASS** | Entity permissions mapped to `permissionsVerified` on evidence |
| Evidence safety | ✅ **PASS** | Only Search-normalized hits; denied → empty evidence |
| Retrieval leakage risks | 🟡 **LOW** | Parallel non-adapter paths remain outside certified boundary |
| Shadow retrieval | 🟡 **ADVISORY** | Tools (`search_places`, `list_drive_files`) still parallel |

**Security score:** **Adequate for certification** within adapter boundary. Parallel paths are an adoption gap, not an adapter bypass.

---

## 4. Extensibility evaluation

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| Additional first-party AI consumers | ✅ **PASS** | Consumer contract + readiness matrix + hook pattern |
| Marketplace AI consumers | 🟡 **PARTIAL** | Contract defined; no marketplace enforcement gate |
| Third-party retrieval consumers | 🟡 **PARTIAL** | Internal `discover()` only; iframe modules cannot call directly |
| Context Graph integration | 🟡 **PLANNED** | Composes with graph bundle; not unified in adapter yet |
| Semantic / vector future | 🟡 **DEFERRED** | Explicitly out of scope; pathway field reserved |

---

## 5. Platform alignment

| Integration | Readiness | Notes |
|-------------|-----------|-------|
| **Unified Search** | ✅ | Authoritative discovery substrate; adapter consumes only |
| **Platform Entities** | 🟡 | Evidence uses `entityId` + `entityType`; not registry-validated |
| **Activity** | ❌ | No retrieval activity emission |
| **V_Link** | 🟡 | Independent pipeline path; composes, not replaced |
| **Domain Events** | ❌ | No retrieval event type |
| **Identity** | ✅ | `userId` required; JWT-scoped twin paths |
| **Permissions** | ✅ | `search:read` + per-hit `permissionsVerified` |
| **AI Platform** | 🟡 | 2 consumers wired; orchestrator/providers parallel |

---

## 6. Retrieval capability scorecard (0–5 maturity)

| Level | Definition | Met? |
|-------|------------|:----:|
| **0 — Ad Hoc Retrieval** | Per-module Prisma in twin, no contract | Superseded |
| **1 — Context Assembly** | Provider fan-out only; no unified discovery | Superseded |
| **2 — Shared Retrieval** | Multi-source orchestration without Search bridge | Superseded (pre-1A) |
| **3 — Platform Retrieval** | Adapter service + Search integration + evidence/diagnostics | ✅ **Current** |
| **4 — Certified Retrieval Capability** | L2 CwF governance + constitutional standard | ✅ **Target (this phase)** |
| **5 — Foundational AI Infrastructure** | All query-discovery via adapter; semantic layer; marketplace | ❌ Future |

---

## 7. G1–G9 certification scorecard

| Gate | Name | Score | Max | Status | Primary evidence |
|------|------|------:|----:|--------|------------------|
| **G1** | Authorization | **3** | 3 | ✅ PASS | `search:read` via Search; `permissionsVerified` on evidence |
| **G2** | Auditability | **1** | 3 | 🔴 WEAK | Diagnostics in context only; no activity/audit persistence |
| **G3** | Service boundaries | **3** | 3 | ✅ PASS | `aiRetrievalCapabilityService`; pipeline hook; no Search bypass |
| **G4** | API / contract coherence | **2** | 3 | 🟡 PARTIAL | Internal `discover()` contract; intentionally no public HTTP |
| **G5** | Ownership | **3** | 3 | ✅ PASS | Platform capability class; consumer standard |
| **G6** | Testing | **2** | 3 | 🟡 PARTIAL | 24 unit tests; no full integration CI matrix |
| **G7** | Documentation | **3** | 3 | ✅ PASS | Phase 0A–2A governance suite |
| **G8** | Production safety | **2** | 3 | 🟡 PARTIAL | Feature flags; graceful deny; 2 consumers only |
| **G9** | Platform trust | **1** | 3 | 🔴 WEAK | Honest adapter; ~90% AI paths still parallel |
| | **TOTAL** | **20** | **27** | **L2 CwF** | ~74% |

**Band:** **LEVEL 2 CERTIFIED WITH FINDINGS** (peer: Unified Search 21/27, Platform Analytics 21/27).

---

## 8. Findings register

### Major findings (on certificate)

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **AR-M1** | Low consumer adoption — 2 intents wired of ~35+ retrieval paths | Major | 2B+ |
| **AR-M2** | No retrieval activity/audit persistence | Major | 2B |
| **AR-M3** | SC-M4 only partially advanced — Search cert dependency | Major | 2B+ |
| **AR-M4** | No evidence token budget for prompt assembly | Major | 2B |
| **AR-M5** | No marketplace consumer enforcement gate | Major | 3 |
| **AR-M6** | Operation matrix not enforced in CI | Major | 2B |

### Advisory findings

| ID | Finding | Phase |
|----|---------|-------|
| **AR-A1** | No admin diagnostics UI for `aiRetrievalDiscovery` | 2B |
| **AR-A2** | Context Graph composition not formalized in adapter | 2B+ |
| **AR-A3** | Semantic/vector retrieval charter not defined | 3+ |
| **AR-A4** | Per-intent flags env-only; no runtime admin toggle | 2B |
| **AR-A5** | HR Prisma paths block `business_operations` consumer | 2B |
| **AR-A6** | Orchestrator + adapter double-fetch latency | 2B |

### Blocking issues

**None.** Majors are adoption, observability, and breadth — not permission bypass or fabricated evidence.

---

## 9. Certification decision

| Decision | Value |
|----------|-------|
| **Award** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Capability id** | `ai_retrieval` |
| **Record id** | RD-AR-001 |
| **Recognition** | **Platform Capability** (certified) — not Foundational AI Infrastructure |
| **Program status** | Phase 2A governance complete; adoption Phase 2B+ authorized separately |
| **Reference designation** | **Not** Reference Implementation — consumer-orchestration pattern only |
| **Peer capabilities** | Unified Search (L2 CwF), Platform Analytics (L2 CwF), AI Platform (L2) |

---

## 10. Conditions for plain L2 / Level 5

| Milestone | Closes |
|-----------|--------|
| Tier A consumer wiring (`business_operations`, `local_discovery`) | AR-M1 |
| Retrieval audit/activity policy decision | AR-M2 |
| Material SC-M4 progress (tool + Tier B migration) | AR-M3 |
| Evidence token budget standard | AR-M4 |
| Marketplace consumer compliance gate | AR-M5 |
| Operation matrix CI gate | AR-M6 |
| Semantic retrieval charter (when authorized) | AR-A3 |
| Admin retrieval diagnostics | AR-A1 |

---

## 11. SC-M4 cross-capability assessment (Search — assessment only)

**Search finding SC-M4:** AI retrieval uses parallel paths, not search delegates.

| Question | Assessment |
|----------|------------|
| Has Retrieval materially advanced SC-M4? | **Yes — partial.** Adapter proves Search-as-discovery for 2 intents. |
| Is SC-M4 closed? | **No.** ~30+ paths (providers, tools, memory) remain outside adapter. |
| How much adoption before Search closure? | **Recommend:** Tier A complete (4+ consumers) + Place tool migration + documented parallel-path register with sunset dates. |
| Self-certify Search? | **No.** Council re-evaluation of Unified Search SC-M4 when adoption milestones met. |

---

## 12. Strategic analysis

| Question | Recommendation |
|----------|----------------|
| **1. Required for all new AI consumers?** | **Conditional yes** — query-driven discovery must use adapter; summaries/memory/tools exempt per Readiness Matrix Tier C |
| **2. Required for Marketplace AI modules?** | **Yes (when discovery)** — same consumer contract; enforcement gate deferred AR-M5 |
| **3. Required for Context Graph integration?** | **Compose, not replace** — graph signals stay independent; entity discovery via adapter when query-shaped |
| **4. Required for future semantic retrieval?** | **Yes** — semantic layer must sit behind adapter, not parallel shadow path |
| **5. Required for AI certification?** | **Conditional** — new L3 AI paths with query-discovery must demonstrate adapter compliance or formal Tier C exemption |

---

## 13. Final recommendation

| Classification | Award? | Justification |
|----------------|:------:|---------------|
| **Platform Capability** | ✅ | Federated discovery orchestration without SoR ownership |
| **Certified Capability (L2 CwF)** | ✅ | G1–G9 20/27; 0 blocking; constitutional standard ratified |
| **Foundational Capability (L5)** | ❌ | Adoption <10%; no audit persistence; semantic layer absent |

**Council action:** Ratify **RD-AR-001** — AI Retrieval Adapter as **LEVEL 2 CERTIFIED WITH FINDINGS** Platform Capability.

---

**Last updated:** 2026-06-23
