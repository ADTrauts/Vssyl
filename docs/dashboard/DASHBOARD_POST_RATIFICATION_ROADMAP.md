# Dashboard Module — Post-Ratification Roadmap

**Program:** Dashboard Module Wave 3  
**Ratification:** RD-DASH-001 (2026-06-21)  
**Certification level:** **LEVEL 3 CERTIFIED WITH FINDINGS @ 24/27**  
**Status:** Authoritative post-ratification roadmap — **program NOT archived**

---

## Ratification posture

| Field | Value |
|-------|-------|
| Council decision | **APPROVE — RATIFIED** |
| Ledger | **Authorized — not executed** |
| Certification execution | **Authorized — not performed** |
| Reference | **Deferred** |
| Wave 3 packages complete | P1, P2, P3 |
| Wave 3 packages remaining | **Package 4** |

---

## Phase map

```
Phase 0A/0B     ✅ Discovery + constitutional audit
Package 1       ✅ Trust foundation (B1–B5 closed)
Package 2       ✅ Service boundaries (M2, M3, M8)
Package 3       ✅ Analytics decoupling (B3, M6, A6)
Evaluation      ✅ L3 CwF eligible @ 24/27
Ratification    ✅ RD-DASH-001 APPROVE
Execution       ⏳ Ledger PR + certificate issuance (separate ACT)
Package 4       ⏳ Finding remediation + optional plain L3 path
Archive         ❌ Not authorized
```

---

## Immediate next gates (priority order)

| # | Initiative | Type | Priority | Notes |
|---|------------|------|----------|-------|
| 1 | **Certification execution** — ledger PR | Certification ops | **High** | Authorized by RD-DASH-001; update `CERTIFICATION_LEDGER.md` |
| 2 | **Certificate issuance** — 11 tracked findings | Certification ops | **High** | 4 major + 7 advisory on certificate |
| 3 | **Package 4 authorization review** | Governance | **Medium** | Charter M1-R, M4, M5, M7 closure |
| 4 | **Platform portfolio refresh** | Documentation | **Medium** | Dashboard L1 → L3 CwF in portfolio docs |
| 5 | **Reference review** | Governance | **Low** | Deferred — revisit post-P4 M4/M7 |

---

## Package 4 — finding remediation (chartered, not started)

**Objective:** Close certificate majors; burn down advisories; optional plain L3 uplift path.

| Workstream | Findings | Target outcome |
|------------|----------|----------------|
| **Matrix CI** | M4 | HTTP integration suite; G6 → 3 |
| **Tenancy charter** | M5 | Entity split or documented exception; G5 uplift |
| **Business hub** | M7, A3 | `DashboardWorkspaceLanding` + `BusinessWorkspaceContent` switch |
| **Registry unification** | M1-R | Align `widgetRegistry` / `coreModuleRegistry` |
| **API namespace** | A1 | Router consolidation or documented exception; G4 uplift |
| **Advisory burn-down** | A2, A4, A5, A7, A8 | Docs, manifest, trash parity, widget cleanup |
| **Drive widget** | P-02 (partial) | Real storage quota from Drive |

### Expected score impact (post-P4)

| Gate | Current | Target |
|------|---------|--------|
| G4 | 2 | 3 (if A1 resolved) |
| G5 | 2 | 3 (if M5, M7, M1-R closed) |
| G6 | 2 | 3 (if M4 closed) |
| **Total** | 24/27 | **25–27/27** |

**Plain L3 path:** 27/27 + zero open majors — requires full P4 + council plain-L3 vote (not authorized today).

---

## Certificate finding remediation themes

### Theme 1 — Test evidence (M4)

- Operation matrix HTTP integration suite
- CI gate on core mutation rows
- Align with Workspace / BO matrix CI precedent

### Theme 2 — Ownership & hub (M5, M7, M1-R)

- Tenancy model charter or split
- `DashboardWorkspaceLanding.tsx` per `module-development.mdc`
- Registry ownership unification

### Theme 3 — API & manifest hygiene (A1, A2, A4, A8)

- API namespace documentation or consolidation
- Sidebar JSON contract
- Manifest completeness on fresh deploy
- Notification metadata if product notifications added

### Theme 4 — Widget & trash parity (A5, A7, P-02)

- Widget hard delete vs global trash alignment
- Orphaned `NotesWidget` disposition
- Drive widget real quota fields

---

## Cross-program dependencies

| Dependency | Relationship |
|------------|--------------|
| **Workspace shell** (WS-L3 CwF) | Certified separately; M7 is module hub gap only |
| **Analytics capability** | Separate program — Dashboard consumes via facade |
| **Platform portfolio docs** | Still list Dashboard L1 until ledger execution |
| **Business Operations** | No reopen — hub alignment is Dashboard-owned |

---

## Out of scope (unchanged)

| Item | Status |
|------|--------|
| Plain L3 promotion | Not authorized — requires 27/27 + zero majors |
| Reference designation | Deferred |
| Analytics Capability certification | Separate program |
| Program archive | Not authorized |
| Package 4 implementation | Requires separate ACT authorization |

---

## Success criteria — post-execution

| Milestone | Criterion |
|-----------|-----------|
| Ledger updated | `dashboard` row reflects L3 CwF @ 24/27 |
| Certificate issued | 11 findings listed |
| Portfolio aligned | `PLATFORM_CERTIFICATION_STATUS_2026.md` updated |
| P4 complete | M1-R, M4, M5, M7 closed or waived |
| Plain L3 candidate | 27/27 + zero majors + council vote |

---

## Required questions — roadmap answers

| # | Question | Answer |
|---|----------|--------|
| 9 | Modernization complete? | **P1–P3 yes**; Wave 3 **not fully complete** until P4 |
| 10 | Next initiative? | **Certification execution + ledger PR** |
| 11 | Ratification outcome? | **RATIFIED** — execution pending |

---

**Last updated:** 2026-06-21
