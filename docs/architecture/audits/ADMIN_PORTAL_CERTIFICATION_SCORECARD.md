# Admin Portal — Certification Scorecard

**Program:** Admin Portal Certification Evaluation  
**Date:** 2026-06-18  
**Framework:** Adapted Platform Control Plane G1–G9

---

## Summary

| Metric | Value |
|--------|------:|
| Gates PASS | **8 / 9** |
| Gates PARTIAL | **0** |
| Gates FAIL | **1** (G9 — advisory) |
| Weighted score | **24 / 27 (~89%)** |
| Blocking findings | **0** |
| Open findings | **5** |
| **Recommended certification** | **LEVEL 3 CERTIFIED WITH FINDINGS** |

---

## Gate scorecard

| Gate | Status | Evidence | Finding impact |
|------|--------|----------|----------------|
| **G1 Authorization** | **PASS** | Support routes admin-gated; `enforceDangerousMigrationOpGate`; canonical `requireAdmin`; auth matrix + tests | AP-F-001, 002, 011 closed |
| **G2 Audit trail** | **PASS** | 30 actions / 20 resource types; single `auditLog.create` path; taxonomy + service tests | AP-F-013 closed |
| **G3 Service boundaries** | **PASS** | 0 route `prisma.`; facade-only `adminService`; domain service delegation; governance tests | AP-F-004 closed |
| **G4 API coherence** | **PASS** | Operation matrix; mount map; duplicate route cleanup; satellite inventory | AP-F-003, 006, 015 closed |
| **G5 Ownership** | **PASS** | Ownership model; AI Pipeline canonical; diagnostics service; centralized-ai retired | AP-F-008, 029, 010 closed |
| **G6 Test evidence** | **PASS** | 18 route suites; 45/45 AI Pipeline HTTP; domain contracts; governance + service tests | AP-F-014, 027, 030 closed |
| **G7 Documentation** | **PASS** | Full audit program artifacts; readiness gate; closeout reports | AP-F-003, 028 closed |
| **G8 Production safety** | **PASS** | No mock fallbacks; dangerous-op gate; debug gating; impersonation controls | AP-F-005, 012, 020, 021 closed |
| **G9 UX shell** | **FAIL** | `gray-*` drift; no shared EmptyState; inconsistent ConfirmModal; `window.confirm` | AP-F-023–026 open |

---

## Scoring detail

### Per-gate points (3-point scale)

| Gate | Authorization | Architecture | Ownership | Testing | Docs | Safety | UX | Gate total |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| G1 | 3 | — | — | 1 | 1 | 1 | — | **3** |
| G2 | — | 3 | — | 1 | 1 | — | — | **3** |
| G3 | — | 3 | 1 | 1 | — | — | — | **3** |
| G4 | — | 2 | 1 | — | 1 | — | — | **3** |
| G5 | — | 2 | 3 | — | 1 | — | — | **3** |
| G6 | — | — | — | 3 | — | — | — | **3** |
| G7 | — | — | — | — | 3 | — | — | **3** |
| G8 | 1 | — | — | 1 | — | 3 | — | **3** |
| G9 | — | — | — | — | — | — | 0 | **0** |

*Simplified rollup: each gate PASS = 3, FAIL = 0.*

---

## Findings score impact

| Severity | Closed | Open | Certification impact |
|----------|--------|------|----------------------|
| Blocking | 5 | 0 | None — all resolved |
| Major | 11 | 1 | AP-F-007 → **finding**, not blocker |
| Advisory | 9 | 4 | AP-F-023–026 → **finding**, G9 |

---

## Certification level matrix

| Level | Criteria | Admin Portal |
|-------|----------|--------------|
| Not certified | Any blocking open OR G1–G8 FAIL | **No** |
| Certified with findings | Partial gates / open non-blocking majors | Superseded by L3 label |
| Level 3 certified | G1–G8 PASS; G9 advisory acceptable | **Close** — open major + G9 FAIL |
| **Level 3 certified with findings** | L3 bar met; documented open findings | **Yes** |

---

## Repository verification snapshot

| Check | Result |
|-------|--------|
| Route `prisma.` | 0 |
| `adminService` `prisma.` | 0 |
| `auditLog.create` in admin services | 1 file |
| Admin-portal route test files | 18 |
| AI Pipeline HTTP handlers covered | 45/45 |
| Mock markers in admin-portal pages | 0 |

---

## Cross-reference

- Full evaluation: [ADMIN_PORTAL_CERTIFICATION_EVALUATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION.md)
- Findings review: [ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md](./ADMIN_PORTAL_CERTIFICATION_FINDINGS_REVIEW.md)
- Executive summary: [ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md](./ADMIN_PORTAL_CERTIFICATION_EXECUTIVE_SUMMARY.md)
