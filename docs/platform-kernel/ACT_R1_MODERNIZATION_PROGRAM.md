# ACT-R1 Modernization Program

**Program:** Platform Kernel Modernization — ACT-R1 Read Migration  
**Package:** Wave 2 Package 1 (Charter)  
**Date:** 2026-06-22  
**Status:** Program charter — **no implementation authorized**

**Parent:** [PLATFORM_KERNEL_REALITY_ASSESSMENT.md](./PLATFORM_KERNEL_REALITY_ASSESSMENT.md)  
**Sibling (future):** Wave 2 Package 2 — Domain Events Hardening

---

## 1. Program objective

Migrate all production Platform Activity **read paths** from fragmented legacy sources to a **single normalized query model**, closing **ACT-R1** and raising Platform Activity from **L1 → L2** read maturity.

---

## 2. Scope

### In scope

- `platformActivityQueryService` design and consumer migration plan
- Global activity feed SoT correction
- Analytics personal/module path (AN-M2)
- AI context activity reads
- Drive activity history APIs
- Place feed delegation (refactor, not rewrite)
- CI guardrails for legacy reads
- Operation matrix for kernel read operations

### Out of scope

- Domain Events work (PK-W2-P2)
- `Activity` table schema drop / backfill migration
- Search index implementation
- Notification fan-out changes
- New HTTP routes (reuse existing)
- Certification execution
- Scheduler / Manifest

---

## 3. Program structure

```
Platform Kernel Modernization
├── Wave 1 — Discovery (COMPLETE)
├── Wave 2
│   ├── Package 1 — ACT-R1 Charter (THIS — COMPLETE)
│   └── Package 2 — Domain Events Hardening (NOT STARTED)
├── Wave 3 — ACT-R1 Implementation (NOT AUTHORIZED)
│   ├── IMP-1 — Query service + feed migration (P0)
│   ├── IMP-2 — Analytics migration (P0)
│   ├── IMP-3 — AI migration (P1)
│   ├── IMP-4 — Drive APIs (P1)
│   └── IMP-5 — Place delegate + counts (P2)
└── Wave 4 — Legacy Activity table retirement (FUTURE)
```

---

## 4. Package sequencing

| Phase | Package | Deliverable type | Authorization |
|-------|---------|------------------|---------------|
| **W1** | Discovery | Audit suite | Complete |
| **W2-P1** | ACT-R1 Charter | Governance artifacts (6 docs) | **This package** |
| **W2-P2** | Domain Events | Charter + subscriber audit | Next governance |
| **W3** | Implementation | Code + tests | Requires council/engineering authorization |
| **W4** | Certification eval | Platform Activity L2 | Post-W3 + readiness review |

---

## 5. Implementation packages (planned — not authorized)

### PK-W3-IMP-1 — Query service foundation + global feed

| Field | Detail |
|-------|--------|
| **Goal** | Ship `platformActivityQueryService` + migrate C-01 |
| **Effort** | ~2 weeks |
| **Unlocks** | Dashboard feed honesty; all modules in timeline |
| **Exit** | No SoR queries in `activityFeedController`; integration tests green |

### PK-W3-IMP-2 — Analytics migration

| Field | Detail |
|-------|--------|
| **Goal** | Migrate C-02, C-03; close AN-M2 read path |
| **Effort** | ~1 week |
| **Depends** | IMP-1 query operations |
| **Exit** | No `prisma.activity` in `analyticsCapabilityService` |

### PK-W3-IMP-3 — AI context migration

| Field | Detail |
|-------|--------|
| **Goal** | Migrate C-04, C-05, C-08 |
| **Effort** | ~1 week |
| **Exit** | AI production paths use `queryRecentForContext` |

### PK-W3-IMP-4 — Drive activity APIs

| Field | Detail |
|-------|--------|
| **Goal** | Migrate C-06, C-07; API response cleanup |
| **Effort** | ~1 week |
| **Exit** | File Hub activity endpoints normalized-only |

### PK-W3-IMP-5 — Compliant consumer refactor

| Field | Detail |
|-------|--------|
| **Goal** | C-09, C-10, C-11 delegate to query service |
| **Effort** | ~3 days |
| **Exit** | No direct Log Prisma in module services for activity reads |

### PK-W4 — Legacy retirement

| Field | Detail |
|-------|--------|
| **Goal** | ESLint ban; remove `driveDeleteService` Activity delete; schema plan |
| **Effort** | TBD |
| **Depends** | All consumers migrated |

---

## 6. Risk register

| ID | Risk | Tier | Mitigation |
|----|------|------|------------|
| **P-R1** | Feed regression during C-01 cutover | High | Feature flag; parallel run optional 1 sprint |
| **P-R2** | Analytics metric semantics change | Medium | Release note; AN-M2 documented |
| **P-R3** | Drive API breaking change | Medium | Deprecation period for `activities` field |
| **P-R4** | Log query performance | Medium | Index charter; module pre-filter |
| **P-R5** | Incomplete Log history | Medium | Accept gap; no Activity backfill in v1 |
| **P-R6** | Scope creep into Domain Events | Medium | Program boundary enforced |
| **P-R7** | Implementation without charter | Low | W2P1 gate complete |

---

## 7. Success metrics

| Metric | Baseline | Target (post ACT-R1) |
|--------|----------|----------------------|
| Production `prisma.activity` readers | 8 | **0** |
| Feed data sources | 5 | **1** |
| Modules in global feed | ~2 (drive/chat normalized) | **All adapted modules** |
| Platform Activity read maturity | L1 | **L2** |
| ACT-R1 open | Yes | **Closed** |

---

## 8. Governance gates

| Gate | Requirement |
|------|-------------|
| **G-CHARTER** | W2P1 docs approved | This package |
| **G-IMPL** | Engineering authorization for W3 | Not met |
| **G-CI** | Legacy read ban in CI | W3 IMP-1 |
| **G-CERT** | Readiness review ≥75% G-score Activity | Post-W3 |

---

## 9. Architectural decisions (ratified in W2P1)

| Decision | Outcome |
|----------|---------|
| **A. Canonical query API** | `platformActivityQueryService` with 6 operations |
| **B. SoT rules** | Log `module_activity_event` only; per-consumer rules in query model doc |
| **C. Legacy retirement** | Phased C1–C6; no schema drop in ACT-R1 |
| **D. Read ownership** | Platform owns query; modules own specialized DTO mapping |
| **E. Consumer classes** | Platform, Module, Analytics, AI |
| **F. Notifications** | Domain events only — not activity direct |

---

## 10. Recommended next package

**After ACT-R1 charter (W2P1):**

1. **Authorize PK-W3-IMP-1** (implementation) — query service + global feed  
   **OR** (governance-only track)  
2. **PK-W2-P2** — Domain Events Hardening Charter (parallel governance)

**Portfolio alignment:** Implementation authorization for W3 follows engineering prioritization per [PLATFORM_KERNEL_EXECUTIVE_SUMMARY.md](../platform-kernel/PLATFORM_KERNEL_W2P1_EXECUTIVE_SUMMARY.md).

---

## Related deliverables (W2P1)

| Document |
|----------|
| [PLATFORM_ACTIVITY_QUERY_MODEL.md](./PLATFORM_ACTIVITY_QUERY_MODEL.md) |
| [ACT_R1_MIGRATION_MATRIX.md](./ACT_R1_MIGRATION_MATRIX.md) |
| [ACTIVITY_FEED_SOURCE_OF_TRUTH_REVIEW.md](./ACTIVITY_FEED_SOURCE_OF_TRUTH_REVIEW.md) |
| [ACTIVITY_CONSUMER_AUDIT.md](./ACTIVITY_CONSUMER_AUDIT.md) |
| [PLATFORM_KERNEL_W2P1_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_W2P1_EXECUTIVE_SUMMARY.md) |

**Last updated:** 2026-06-22
