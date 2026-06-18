# Admin Portal — Governance Architecture Executive Summary

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Status:** Blueprint complete — **no implementation authorized**  
**Readiness baseline:** CONDITIONALLY READY (~74%); AI Administration 89.6%

**Artifact set:**

1. [Governance Reality Assessment](./ADMIN_PORTAL_GOVERNANCE_ARCHITECTURE_REALITY_ASSESSMENT.md)
2. [Service Decomposition Blueprint](./ADMIN_PORTAL_SERVICE_DECOMPOSITION_BLUEPRINT.md)
3. [Audit Architecture](./ADMIN_PORTAL_AUDIT_ARCHITECTURE.md)
4. [Controller Governance Standard](./ADMIN_PORTAL_CONTROLLER_GOVERNANCE_STANDARD.md)
5. [Test Architecture](./ADMIN_PORTAL_TEST_ARCHITECTURE.md)
6. [Governance Implementation Plan](./ADMIN_PORTAL_GOVERNANCE_IMPLEMENTATION_PLAN.md)
7. [Post-1B Certification Path](./ADMIN_PORTAL_POST_1B_CERTIFICATION_PATH.md)
8. This document

---

## 1. What is blocking certification?

**One blocking finding:** **AP-F-004** — the **4,691 LOC** `AdminService` monolith and **~6,900 LOC** fat admin route files with **73 inline Prisma calls** and **66** direct `AdminService` delegations.

All other original blocking findings (AP-F-001, 002, 003, 005) are **closed** from Stages 0E/0B. AI Administration (0D) is complete but **does not** close AP-F-004.

**Five major findings** assigned to 1B also block architecture certification gates: AP-F-013 (audit), AP-F-014 (backend tests), AP-F-016 (policy), AP-F-027 (frontend tests), AP-F-030 (pipeline HTTP coverage).

---

## 2. How should AdminService be decomposed?

Split into **10–12 domain services** under `server/src/services/admin/`, following the **AI Pipeline reference pattern**:

| Service | Priority |
|---------|----------|
| `adminImpersonationService` | P0 — fat inline route logic today |
| `adminUserService` | P0 |
| `adminAuditService` | P0 — cross-cutting |
| `adminModerationService`, `adminModuleGovernanceService`, `adminSecurityService` | P1 |
| `adminSupportService`, `adminBillingService`, `adminSystemOpsService` | P1 |
| `adminAnalyticsService`, `adminPerformanceService` | P2 — coordinate with 0C |
| `server/src/ai/pipeline/*` | **Preserve** — already correct |

**Phased extraction** over 3–4 sprints; delete `adminService.ts`; split route files to **<500 LOC** each.

---

## 3. What audit architecture should exist?

A platform **`adminAuditService`** with:

- **`ADMIN_*` taxonomy** (identity, moderation, module, security, system, dangerous ops)
- Normalized envelope (actor, resource, before/after, outcome)
- Single emission path — **no route-level `auditLog`**
- Query API for operators
- Retention tiers (security 7y, governance 3y, ops 1y)
- Bridge to existing **AI Pipeline policy audit** table

Adapt HR `logEmployeeAudit` structure; do **not** force module activity events on control-plane reads.

---

## 4. What testing architecture should exist?

**Three-layer pyramid:**

1. **Hygiene guards** (existing ~32 web static tests) — keep
2. **HTTP integration** per domain — expand from ~35% to **≥90%** mutation coverage
3. **Minimal frontend smoke** — **5+** pages (closes AP-F-027)

**AI Pipeline:** expand from **8/45** to **≥40/45** handler tests (closes AP-F-030).

**~130+** new integration cases projected; audit assertions on P0 mutations.

---

## 5. What packages should be implemented?

| Package | Purpose | Findings |
|---------|---------|----------|
| **1B-A** | Service boundary extraction | AP-F-004 |
| **1B-B** | Audit architecture | AP-F-013 |
| **1B-C** | Controller governance + PE decision | AP-F-014, AP-F-016 |
| **1B-D** | Test architecture | AP-F-027, AP-F-030 |
| **1B-E** | Certification readiness gate | All 1B |

**Duration:** 4–6 sprints. **Critical path:** 1B-A → 1B-B → 1B-D → 1B-E.

---

## 6. What findings close after 1B?

| Finding | Verdict |
|---------|---------|
| AP-F-004 | **CLOSED** |
| AP-F-013 | **CLOSED** |
| AP-F-014 | **CLOSED** |
| AP-F-016 | **CLOSED** (PE or waiver) |
| AP-F-027 | **CLOSED** |
| AP-F-030 | **CLOSED** |

**Remains open:** AP-F-007 (0C), AP-F-023–026 (1A advisory/major UX).

---

## 7. Can Admin Portal reach certification review after 1B?

**Yes — projected.**

| Metric | Current | Post-1B |
|--------|---------|---------|
| Blocking findings | 1 | **0** |
| G1–G9 weighted score | ~74% | **~89%** |
| Category | CONDITIONALLY READY | **READY FOR CERTIFICATION REVIEW** |

**Conditions:** Full 1B implementation; no regression on 0E safety gates; AP-F-007 documented as known major (recommend 0C parallel or waiver).

**Not awarded:** Certification level, ledger row, council approval.

---

## Recommended next implementation program

# **1B-A — Service Boundary Extraction (Phase 1: Impersonation + Users + Audit emit v1)**

Start with highest-privilege, highest-risk code: `adminPortalRoutes.core.ts` impersonation inline Prisma and user mutations. Anchor with existing impersonation integration tests. Establish `adminAuditService` emit path before extracting remaining domains.

**Do not start** certification review or ledger updates until **1B-E** exit criteria pass.

---

## Scorecard summary

| Dimension | Pre-1B | Post-1B (target) |
|-----------|--------|------------------|
| Architecture (G3) | FAIL | PASS |
| Audit (G2) | PARTIAL | PASS |
| Testing (G6) | PARTIAL | PASS |
| **Overall** | **~74%** | **~89%** |

---

**Blueprint program status:** **COMPLETE**  
**Next action:** User approval to begin **1B-A** implementation
