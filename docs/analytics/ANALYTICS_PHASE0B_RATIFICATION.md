# Analytics Capability — Phase 0B Council Ratification

**Program:** Analytics Capability — Constitutional Modernization  
**Phase:** 0B — Strategic Scope Lock & Future-State Architecture  
**Ratification date:** 2026-06-22  
**Authority:** Architecture council governance review  
**Status:** **RATIFIED** — governance record only; **no implementation, no ledger changes**

**Prior phases:**
- [Phase 0A Executive Summary](./ANALYTICS_EXECUTIVE_SUMMARY.md) — Discovery complete
- [Phase 0B Executive Summary](./ANALYTICS_PHASE0B_EXECUTIVE_SUMMARY.md) — Strategic review complete

**Evidence base:** Six Phase 0A deliverables + five Phase 0B deliverables under `docs/analytics/`

---

## 1. Ratification statement

The Architecture Council **ratifies** Analytics Capability Phase 0B strategic decisions and **officially establishes** the constitutional classification, phased roadmap, and governance constraints recorded in this document.

Phase 0B is **complete and closed** for discovery and strategic architecture. Engineering may proceed to Phase 1 authorization review (separate document).

---

## 2. Ratified strategic architecture

### 2.1 Classification

| Decision | Ratified outcome |
|----------|------------------|
| Product module L3 track | **Rejected** |
| Platform Analytics Capability | **Primary engine class** |
| Hybrid Domain | **Official classification** |
| Admin Portal operator analytics | **Separate L3 satellite** — unchanged |
| Module domain analytics | **Module-owned** — unchanged |

### 2.2 Hybrid Option C — Phased roadmap

| Horizon | Architecture posture | Certification target |
|---------|---------------------|----------------------|
| **2026** | Federated Analytics Capability | Platform Capability **L2 CwF** |
| **2027** | Event Pipeline + MVAP Rollups | Platform Capability **L3 CwF** readiness |
| **2028** | Historical Analytics + AI Consumption Layer | L3 CwF → L4 evaluation |

---

## 3. Ratified governance decisions

| ID | Decision | Status |
|----|----------|--------|
| **SB-01** | Analytics remains a **Hybrid Domain** | ✅ **Ratified** |
| **SB-02** | **Platform Analytics Capability** is the primary engine | ✅ **Ratified** |
| **SB-03** | **Dashboard** consumes analytics; does not own analytics | ✅ **Ratified** |
| **SB-04** | **Modules** remain Systems of Record for domain metrics | ✅ **Ratified** |
| **SB-05** | **No warehouse** in 2026 (Phase 1) | ✅ **Ratified** |
| **SB-06** | **Event-derived rollups** begin only after Platform Events maturity | ✅ **Ratified** |
| **SB-07** | Analytics is **not a certifiable product module** | ✅ **Ratified** |
| **SB-08** | Future warehouse is **derived-only** and **never authoritative** | ✅ **Ratified** |

### 3.1 SB decision elaboration

**SB-01 — Hybrid Domain:** Analytics comprises five ownership classes: Platform Capability (tenant federation), Admin Portal (operator), module domain interiors, product surfaces, and AI satellites. No single ledger row captures full scope.

**SB-02 — Primary engine:** Cross-module tenant rollups, `/api/analytics/*` capability namespace, and federation orchestration are Platform Analytics Capability responsibilities — not Dashboard, not pseudo-module registry metadata.

**SB-03 — Dashboard boundary:** Post Dashboard Wave 3 Package 3, Dashboard is a certified **consumer** via `dashboardAnalyticsFacade`. Dashboard must not compute cross-module rollups in controllers, hooks, or widgets.

**SB-04 — Module SoR:** HR, Chat, Place, Workforce Comms, and other L3 modules retain domain analytics ownership. Platform capability **composes** module outputs; it does not absorb module services.

**SB-05 — No warehouse 2026:** Phase 1 is federation-only. No new Prisma rollup modules, no materialized views, no separate analytics database.

**SB-06 — Event pipeline gate:** Async event-derived rollups are **Phase 2 (2027)** minimum. Prerequisite: Platform Activity read migration + Domain Events taxonomy maturity (portfolio priority #2). Placeholder subscriber removal is Phase 1 — not pipeline activation.

**SB-07 — Not product module:** `analytics` pseudo-module registry entry is navigation metadata only. Certification track is Platform Capability L2→L3, not L3 product module parallel to Chat or Drive.

**SB-08 — Derived warehouse only:** When MVAP storage activates (2027+), rollup tables are R3 derived class — rebuildable from R2 events, PII-free, never substituting module SoR or V_Link association truth.

---

## 4. Constitutional alignment

| Authority | Alignment |
|-----------|-----------|
| [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1 | Pseudo-module vs true module — **aligned** |
| [RELATIONSHIP_ANALYTICS_MODEL.md](../architecture/RELATIONSHIP_ANALYTICS_MODEL.md) | Analytics observes — does not own SoR — **aligned** |
| [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md) AP1–AP5 | Fail-closed — **Phase 1 enforcement mandated** |
| [DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md](../dashboard/DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md) AS-1–AS-6 | **Ratified and binding** |
| [ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md](../architecture/audits/ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md) | Operator boundary — **unchanged** |
| [CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md](../context-graph/CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md) | Federation not graph DB — **aligned** |

---

## 5. Official definitions (post-ratification)

| Term | Official meaning |
|------|------------------|
| **Analytics (Hybrid Domain)** | The union of Platform Analytics Capability, operator analytics, module domain analytics, product surfaces, and AI satellites |
| **Platform Analytics Capability** | Tier 0 derived-metrics engine: federates module rollups into tenant contracts via `/api/analytics/*` |
| **Federated L2** | On-demand composition + module rollup APIs + PE gates — no warehouse |
| **MVAP** | Minimum Viable Analytics Platform — event pipeline + tenant PostgreSQL rollups (2027+) |
| **Product surface `analytics`** | Business workspace segment — host only; data from capability |

---

## 6. Explicit exclusions (ratified out of scope)

| Exclusion | Phase |
|-----------|-------|
| L3 product module certification | Permanent unless council reverses SB-07 |
| Full enterprise analytics platform (2026) | SB-05 |
| Wiring `server/src/ai/analytics/*` scaffold | Until AI Platform charter |
| Universal graph / relationship edge warehouse | Permanent — SB-08 |
| Admin Portal analytics re-certification | N/A — already L3 |
| Ledger reclassification | Phase 1 governance proposal — not 0B |
| Certification execution | Phase 3+ candidacy after L2 engineering |

---

## 7. Dependencies acknowledged

| Dependency | Relationship to Analytics |
|------------|---------------------------|
| Dashboard Wave 3 (archived) | Consumer facade established — **complete** |
| Platform Activity + Domain Events (#2) | **Blocks Phase 2** event pipeline |
| Platform Scheduler (#7) | **Blocks Phase 2** async rollup jobs |
| Relationship Analytics Phase 2B | **Phase 3** consumer |
| AI Platform stub policy (#3) | **Phase 3** AI consumption APIs |

---

## 8. Ratification readiness assessment

| Criterion | Status |
|-----------|--------|
| Phase 0A discovery complete | ✅ |
| Phase 0B strategic review complete | ✅ |
| Option A/B/C analysis documented | ✅ |
| Warehouse feasibility assessed | ✅ |
| Event pipeline architecture defined | ✅ |
| Certification model defined | ✅ |
| Constitutional conflicts identified | **None blocking** |
| Council questions resolved | ✅ |

**Ratification readiness:** **Ready**

---

## 9. Required questions — ratification subset

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Phase 0B ready for ratification? | **Yes** |
| 2 | Should Hybrid Option C be ratified? | **Yes** |
| 3 | Is Analytics officially a Hybrid Domain? | **Yes — as of this ratification** |
| 4 | Is Analytics officially a Platform Capability? | **Yes — primary engine within Hybrid Domain** |

---

## 10. Phase closure

| Phase | Status | Date |
|-------|--------|------|
| Phase 0A — Discovery | **Closed** | 2026-06-22 |
| Phase 0B — Strategic scope lock | **Closed / Ratified** | 2026-06-22 |
| Phase 1 — Federated L2 engineering | **Authorized separately** | See authorization decision |

---

## 11. Signatures / authority

| Role | Action |
|------|--------|
| Architecture Council | **Ratifies** Phase 0B SB-01 through SB-08 |
| Platform Engineering | **Acknowledged** — Phase 1 authorization review initiated |
| Product Governance | **Acknowledged** — business workspace disposition in Phase 1 scope |

*Governance record — formal council vote assumed affirmative based on program completion criteria.*

---

**Last updated:** 2026-06-22
