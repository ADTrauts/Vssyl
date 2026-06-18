# Admin Portal Certification Readiness

**Program:** Admin Portal Reality, Architecture, and Certification Readiness  
**Date:** 2026-06-16  
**Authority:** Adapted Platform Control Plane framework (see §1) — **not** standard module L3 gate

**This document assesses readiness only. No certification level is awarded. No ledger updates.**

---

## Readiness outcome

# NOT READY

Admin Portal does not meet the minimum bar for a formal adapted control-plane Level 3 certification review. Five blocking findings (P0 security/ops, missing operation matrix, architectural monoliths) must be resolved first. Strong subsystems (AI Pipeline, user management, module certification gate) are insufficient without platform contract alignment and production safety gates.

---

## 1. Adapted certification framework

Admin Portal is **not** a `CERTIFICATION_LEDGER` module row. Evaluation uses **Platform Control Plane adaptation** — not the 15-item module L3 gate in [`CERTIFICATION_LEDGER.md`](../CERTIFICATION_LEDGER.md) §Certification requirements.

### 1.1 Gates that apply

| # | Requirement | Rationale |
|---|-------------|-----------|
| G1 | Authorization depth | All privileged routes consistently admin-gated |
| G2 | Audit trail | Immutable audit for privileged mutations |
| G3 | Service boundaries | Named domain services; no monolith |
| G4 | API coherence | Canonical mount strategy |
| G5 | Ownership clarity | Platform vs module-owned surfaces bounded |
| G6 | Test evidence | Integration tests for governance mutations |
| G7 | Documentation | Operation matrix + audit docs |
| G8 | Production safety | No mock fallbacks; no debug in prod nav |
| G9 | UX management shell | Consistent operator IA (advisory for L3) |

### 1.2 Gates marked N/A

| Module L3 gate | N/A rationale |
|----------------|---------------|
| `dashboardId` / business tenant scoping | Platform-global by design |
| `emitModuleActivityEvent` | Not a product module |
| Module manifest / workspace landing | Not a workspace module |
| Global Trash | Admin ops are operational, not user soft-delete |
| V-Link (portal-wide) | AI Pipeline instruments only |
| Policy Engine module duals | Admin uses role gate; PE adoption is roadmap |
| Realtime / notifications | Not required for control plane today |

---

## 2. Certification readiness table

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **G1 Authorization depth** | **FAIL** | `POST /support/tickets/customer` unauthenticated L653; 5 duplicate `requireAdmin` implementations |
| **G2 Audit trail** | **PARTIAL** | `AuditLog` for impersonation; not comprehensive admin event taxonomy |
| **G3 Service boundaries** | **FAIL** | `adminService.ts` 4,658 LOC; inline Prisma in routes |
| **G4 API coherence** | **FAIL** | 14 mount prefixes; no operation matrix |
| **G5 Ownership clarity** | **PARTIAL** | Boundary analysis complete (this program); duplicates remain in code |
| **G6 Test evidence** | **PARTIAL** | 7 backend test files; gaps on AI pipeline HTTP, billing, security; zero frontend tests |
| **G7 Documentation** | **Met (matrix)** | [`ADMIN_PORTAL_OPERATION_MATRIX.md`](./ADMIN_PORTAL_OPERATION_MATRIX.md) (0B-C); audit program docs complete |
| **G8 Production safety** | **FAIL** | Mock fallbacks support/modules; 7 debug pages; random health metrics |
| **G9 UX management shell** | **FAIL** | Custom shell; AI Pipeline sub-shell only; no shared EmptyState/ConfirmModal |

---

## 3. Readiness scoring

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Authorization | 1 | 3 | P0 unauth route |
| Architecture | 1 | 3 | Monolith + fat routes |
| Ownership | 2 | 3 | Documented; not enforced in code |
| Testing | 2 | 3 | Backend partial |
| Documentation | 2 | 3 | Audit program complete; operation matrix missing |
| Production safety | 0 | 3 | Mock fallbacks + debug leakage |
| UX (advisory) | 1 | 3 | Below reference baseline |
| **Total** | **9** | **21** | ~43% — below review threshold |

**Review threshold (planning):** ≥70% with zero blocking findings → CONDITIONALLY READY; ≥85% with zero blocking → READY FOR CERTIFICATION REVIEW.

---

## 4. Allowed outcomes reference

| Outcome | Applies? |
|---------|----------|
| **NOT READY** | **Yes** |
| CONDITIONALLY READY FOR CERTIFICATION REVIEW | No — blocking findings present |
| READY FOR CERTIFICATION REVIEW | No |
| Certified (any level) | **Not awarded** |

---

## 5. Blockers vs review findings

### Blocking (must resolve before review)

| ID | Finding | Status |
|----|---------|--------|
| AP-F-001 | Unauthenticated `POST /support/tickets/customer` | Resolved (0E-A) |
| AP-F-002 | Raw SQL migration delete/reset endpoints | Resolved (0E-B) |
| AP-F-004 | AdminService monolith + fat route files | Open |
| AP-F-005 | Production mock fallbacks masking API failures | Resolved (0E-C) |

### Would fail review if scheduled today (major)

1. API mount fragmentation (AP-F-006) — documented; consolidation deferred
2. Analytics triplication (AP-F-007)
3. AI learning / centralized-ai duplication (AP-F-008)
4. Phantom `admin` moduleId (AP-F-009) — resolved (0B-B)
5. No frontend admin tests (AP-F-027)
6. No AI pipeline HTTP integration tests (AP-F-030)
7. Duplicate `GET /security/events` (AP-F-015)

### Advisory (would not block review after majors cleared)

- Unused `AdminNavigation.tsx`
- Orphan governance/retention dashboards
- Debug pages in production tree
- UX token drift
- Stale Memory Bank / guide docs

---

## 6. Pre-review preparation checklist

Before scheduling a certification council session for adapted control-plane L3:

- [ ] Close all 5 blocking findings (AP-F-001 through AP-F-005 subset)
- [ ] Publish `ADMIN_PORTAL_OPERATION_MATRIX.md`
- [ ] Consolidate `requireAdmin` to single shared implementation
- [ ] Remove mock fallbacks from support, modules, `/modules/admin`
- [ ] Retire or ops-gate debug pages and `/api/admin-portal/testing`
- [ ] Decompose AdminService (or publish approved waiver with extraction plan)
- [ ] Add HTTP integration tests for AI pipeline admin routes
- [ ] Resolve analytics triplication (0C) and centralized-ai disposition (0D)
- [ ] Re-run readiness assessment targeting ≥70% score

---

## 7. Comparison to certified references

| Dimension | HR L3 | AI Platform L2 | Admin Portal |
|-----------|-------|----------------|--------------|
| Service extraction | 6A complete | Partial | **FAIL** — monolith |
| Constitutional audit doc | Yes | Yes | **This program** |
| Operation matrix | Yes | `AI_PLATFORM_OPERATION_MATRIX.md` | **Missing** |
| PE / authZ | Partial PE | Role + service gates | Role only |
| Test evidence | ~80 cases | Partial | Partial backend; no frontend |
| Ledger row | Yes | Yes | **No row** |

Admin Portal has **operational maturity** in subsystems but **lags** certified references on architecture discipline and documentation completeness.

---

## 8. Ledger and reference program status

| Program | Admin Portal status |
|---------|---------------------|
| CERTIFICATION_LEDGER module row | **Not applicable** — no row |
| CERTIFICATION_LEDGER platform system row | **Not present** — recommend future "Platform Admin / Control Plane" row after remediation |
| Reference Workspace Program | Unassessed — Portal annex deferred |
| Reference Module Program | **Not a candidate** as product module |
| AI Pipeline subdomain | **Potential** control-plane pattern reference post-1B |

---

## Cross-reference

- Findings: [`ADMIN_PORTAL_FINDINGS_REGISTER.md`](./ADMIN_PORTAL_FINDINGS_REGISTER.md)
- Architecture: [`ADMIN_PORTAL_ARCHITECTURE_AUDIT.md`](./ADMIN_PORTAL_ARCHITECTURE_AUDIT.md)
- Roadmap: [`ADMIN_PORTAL_REMEDIATION_ROADMAP.md`](./ADMIN_PORTAL_REMEDIATION_ROADMAP.md)

**Readiness assessment close:** NOT READY. No certification awarded.
