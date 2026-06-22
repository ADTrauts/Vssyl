# Analytics Capability — Status Record

**Capability id:** `analytics` (Platform Analytics Capability)  
**Last updated:** 2026-06-22  
**Authority:** RD-AN-001 + Final Governance Execution

---

## Current status

| Field | Value |
|-------|-------|
| **Certification level** | **LEVEL 2 CERTIFIED WITH FINDINGS** |
| **Classification** | **Platform Capability** — Hybrid Domain primary engine |
| **G1–G9 score** | **21/27 (~78%)** |
| **Ratification** | RD-AN-001 (2026-06-22) |
| **Execution** | 2026-06-22 |
| **Program** | **ARCHIVED** |
| **Blocking findings** | **0** |
| **Open majors** | **5** (AN-M2–M6; AN-M1 closed at ledger execution) |
| **Open advisories** | **8** (AN-A1–A8) |

---

## Capability scope (chartered)

| In scope | Out of scope (deferred) |
|----------|-------------------------|
| Canonical `/api/analytics/*` (AC-01–04) | Event pipeline (Phase 2) |
| `analyticsCapabilityService` | Warehouse (Phase 3) |
| Federated Chat/Todo rollups | Historical analytics (Phase 3) |
| Dashboard consumer facade | MVAP rollups |
| Business workspace real APIs | Reference producer designation |
| Policy Engine `analytics:read` | L3 product module track |

---

## Trust posture

| Surface | Class |
|---------|-------|
| Canonical capability API | **Trusted** |
| Dashboard facade / QuickStats | **Trusted** (consumer) |
| Business workspace analytics | **Trusted** (satellite) |
| Enterprise overview | **Trusted** |
| Enterprise journeys/compliance/insights | **Degraded honest** |
| Admin Portal operator analytics | **Separate program** (L3 CwF) |

---

## Engineering artifacts (Phase 1)

| Artifact | Location |
|----------|----------|
| Capability service | `server/src/services/analytics/analyticsCapabilityService.ts` |
| Activity service | `server/src/services/analytics/analyticsActivityService.ts` |
| Policy dual | `server/src/auth/analyticsPolicyDual.ts` |
| Ownership registry | `web/src/lib/analyticsCapabilityOwnership.ts` |
| Operation matrix | [ANALYTICS_OPERATION_MATRIX.md](./ANALYTICS_OPERATION_MATRIX.md) |

---

## Related records

- [ANALYTICS_CERTIFICATION_RECORD.md](./ANALYTICS_CERTIFICATION_RECORD.md)
- [ANALYTICS_PROGRAM_ARCHIVE.md](./ANALYTICS_PROGRAM_ARCHIVE.md)
- [ANALYTICS_GOVERNANCE_EXECUTION.md](./ANALYTICS_GOVERNANCE_EXECUTION.md)
- [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)

---

**Status:** **EXECUTED · ARCHIVED**
