# Admin Portal — Post-1B Certification Path

**Program:** Stage 1B — Governance Architecture Blueprint  
**Date:** 2026-06-17  
**Constraint:** Projection only — no certification awarded; no ledger updates

---

## 1. Assumption

Successful completion of packages **1B-A through 1B-E** per [`ADMIN_PORTAL_GOVERNANCE_IMPLEMENTATION_PLAN.md`](./ADMIN_PORTAL_GOVERNANCE_IMPLEMENTATION_PLAN.md).

Stages **0E, 0B, 0D** accepted complete. Closed findings per program brief remain closed.

---

## 2. Findings disposition after 1B

### 2.1 Closes in 1B

| Finding | Severity | Close condition |
|---------|----------|-----------------|
| **AP-F-004** | blocking | AdminService deleted; routes <500 LOC; services extracted |
| **AP-F-013** | major | Admin audit taxonomy live; ≥95% mutation coverage |
| **AP-F-014** | major | Per-domain HTTP integration suites complete |
| **AP-F-016** | major | PE adopted OR documented waiver + compensating controls |
| **AP-F-027** | major | ≥5 frontend admin smoke tests |
| **AP-F-030** | major | ≥40/45 pipeline HTTP tests |

**Blocking count after 1B:** **0** (if AP-F-004 closes).

### 2.2 Remains open (not 1B scope)

| Finding | Severity | Owner |
|---------|----------|-------|
| **AP-F-007** | major | 0C Analytics ownership |
| **AP-F-023** | advisory | 1A UX Shell — token drift |
| **AP-F-024** | advisory | 1A UX Shell |
| **AP-F-025** | advisory | 1A UX Shell |
| **AP-F-026** | advisory | 1A UX Shell |

### 2.3 Becomes advisory only (post-1B)

| Item | Rationale |
|------|-----------|
| ai-context-debug API merge | Transitional; documented; zero UI consumers |
| `/api/centralized-ai` 410 stub mount | Compatibility; no logic |
| Satellite mount fragmentation | Documented in mount map; merge optional |
| `adminApiService.ts` client monolith | Decomposition optional post-1B |

### 2.4 ai-context-debug API tail

| Status | Phase |
|--------|-------|
| Advisory — merge/410 | Post-1B hygiene or 1B+ optional package |

Not blocking certification if UX + pipeline diagnostics canonical (0D closed AP-F-029).

---

## 3. Adapted gate projection (G1–G9)

| Gate | Post-0B (current) | Post-1B (projected) |
|------|-------------------|---------------------|
| G1 Authorization | PASS | PASS |
| G2 Audit trail | PARTIAL | **PASS** |
| G3 Service boundaries | FAIL | **PASS** |
| G4 API coherence | PARTIAL | PASS |
| G5 Ownership | PASS | PASS |
| G6 Test evidence | PARTIAL | **PASS** |
| G7 Documentation | PASS | PASS |
| G8 Production safety | PASS | PASS |
| G9 UX shell | FAIL | FAIL (1A) |

### Weighted score projection

| Milestone | Score |
|-----------|------:|
| Pre-0E/0B | ~33% (9/27) |
| Post-0E/0B | ~74% (20/27) |
| Post-0D (AI only) | 89.6% (AI subdomain) |
| **Post-1B (projected)** | **~89% (24/27)** |

**Calculation:** G2, G3, G6 upgrade FAIL/PARTIAL → PASS (+3 gates × ~3 points).

---

## 4. Certification readiness category

| Category | Threshold | Post-1B |
|----------|-----------|---------|
| NOT READY | <70% or any blocking | — |
| CONDITIONALLY READY | ≥70%, zero blocking | Current (~74%) |
| **READY FOR CERTIFICATION REVIEW** | **≥85%, zero blocking** | **Yes (projected)** |

### Explicit answer: Can Admin Portal enter certification review?

**Yes — after successful 1B implementation**, assuming:

1. AP-F-004 closes (AdminService decomposed).
2. All six 1B-owned major findings close.
3. No new blocking findings introduced.
4. AP-F-007 (analytics triplication) documented as **known major** — recommend **waive for control-plane certification** or complete 0C first (program choice).

**G9 UX shell FAIL** does not block adapted control-plane certification per framework N/A notes — advisory for L3 promotion.

---

## 5. Certification review packet (required artifacts)

| Artifact | Status after 1B |
|----------|-----------------|
| Operation matrix | Update post-decomposition |
| Audit taxonomy | Live |
| Service decomposition evidence | Code + blueprint |
| Test matrix | PASS all 1B domains |
| Policy Engine waiver or adoption doc | Complete |
| Impersonation policy | Existing 0E |
| AI Administration closeout | 0D complete |

---

## 6. Risks to certification eligibility

| Risk | Impact |
|------|--------|
| 1B incomplete — AP-F-004 open | **Blocks review** |
| AP-F-007 escalated to blocking | May delay council review |
| Test suite flaky | Review deferral |
| Audit coverage <95% | G2 stays PARTIAL — blocks ≥85% |

---

## 7. Recommended sequencing with other stages

| Order | Stage | Rationale |
|-------|-------|-----------|
| **1** | **1B Governance** | Unblocks certification |
| 2 | 0C Analytics (parallel OK) | Closes AP-F-007 |
| 3 | 1A UX Shell | Closes G9 advisory |
| 4 | Certification council review | After 1B-E |

---

## References

- [`ADMIN_PORTAL_CERTIFICATION_READINESS.md`](./ADMIN_PORTAL_CERTIFICATION_READINESS.md)
- [`ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md`](./ADMIN_PORTAL_POST_0B_READINESS_UPDATE.md)
