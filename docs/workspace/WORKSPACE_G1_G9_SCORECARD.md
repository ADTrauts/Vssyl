# Workspace — G1–G9 Scorecard (WS-L3 Prep)

**Program:** ENG-1 / WS-L3 Readiness Assessment  
**Assessment date:** 2026-06-19  
**Scope:** Combined Reference Workspace (Business Workspace + Personal Dashboard shell)  
**Framework:** Adapted domain gates (Admin Portal / Business Operations precedent)  
**Status:** Assessment only — **not a certification award**

**Posture:** ENG-1 closed 2026-06-19.

---

## Score summary

| Gate | Score | Status | Weight |
|------|------:|--------|--------|
| G1 Authorization | 2 | PARTIAL | Shell session + business membership; no PE on shell mutations |
| G2 Auditability | 2 | PARTIAL | Limited shell-level activity; modules own audit |
| G3 Service boundaries | 3 | PASS | Thin shell; contracts enforce switch authority |
| G4 API coherence | 3 | PASS | Navigation SSOT; segment policy; ENG-1 closed |
| G5 Ownership | 3 | PASS | Platform shell doc + routing contracts + this model |
| G6 Test evidence | 2 | PARTIAL | 64+ contract tests; ENG-2 runtime scope gap |
| G7 Documentation | 3 | PASS | 14+ audit docs; operation matrices current (2F) |
| G8 Production safety | 3 | PASS | ENG-1 closed; no P0 segment 404; stubs removed 1B |
| G9 UX consistency | 3 | PASS | PlatformShell 3C-4E/4F; UX co-surface certified |
| **Total** | **23/27** | **~85%** | |

---

## Gate detail

### G1 — Authorization — PARTIAL (2)

| Evidence | Verdict |
|----------|---------|
| JWT/session on all workspace routes | ✅ |
| Business membership check in layout/API | ✅ |
| Installed-module filter in sidebar | ✅ |
| Policy Engine on shell-level writes | ❌ N/A — shell is read/orchestration heavy |
| Position-aware module gating | ✅ |

**Gap:** Shell does not use PE for configuration mutations (business settings are separate surface). Acceptable for workspace class — partial not fail.

---

### G2 — Auditability — PARTIAL (2)

| Evidence | Verdict |
|----------|---------|
| Module interiors emit activity | ✅ (L3 modules) |
| Shell navigation mutations audited | ❌ Not required today |
| Workspace operation matrix rows | ✅ Current post 2F |
| Admin audit for workspace config | Partial — business settings only |

**Gap:** No workspace-specific activity taxonomy for sidebar customization events.

---

### G3 — Service boundaries — PASS (3)

| Evidence | Verdict |
|----------|---------|
| `BusinessWorkspaceContent` orchestration-only | ✅ |
| `DashboardClient` grid vs shell split documented | ✅ |
| No Prisma in workspace web layer | ✅ |
| Module services own mutations | ✅ |

---

### G4 — API coherence — PASS (3)

| Evidence | Verdict |
|----------|---------|
| `buildBusinessWorkspaceModuleHref` canonical | ✅ |
| `buildPersonalModuleHref` / widget helpers | ✅ |
| Segment-switch null deferral pattern | ✅ incl. **place** post ENG-1 |
| Legacy `?module=` documented (B-F2) | ⚠️ Advisory only |
| Cross-surface map | ✅ `crossSurfaceNavigation.ts` |

**ENG-1 impact:** G4 strengthened — segment URL matches contract for Place.

---

### G5 — Ownership — PASS (3)

| Evidence | Verdict |
|----------|---------|
| `WORKSPACE_OWNERSHIP_MODEL.md` | ✅ This assessment |
| `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` | ✅ |
| Routing contracts authoritative | ✅ |
| Dashboard hybrid boundary documented | ✅ |

---

### G6 — Test evidence — PARTIAL (2)

| Suite | Tests | Status |
|-------|------:|--------|
| `businessWorkspaceNavigation` | 15 | PASS |
| `businessWorkspaceRegistryDrift` | 9 | PASS |
| `businessWorkspaceRouteHygiene` | 4 | PASS |
| `personalDashboardNavigation` | 15 | PASS |
| `personalDashboardRegistryDrift` | 15 | PASS |
| `crossSurfaceNavigation` | 6 | PASS |
| Part 2H manual QA | 27 rows | 23 PASS adjudicated |
| Runtime scope contract tests | 0 | **ENG-2 open** |

**Gap:** B-F3 / ENG-2 — `WorkspaceRuntimeScopeBridge` not contract-tested.

---

### G7 — Documentation — PASS (3)

| Artifact | Status |
|----------|--------|
| Business operation matrix | ✅ Re-audited 2F |
| Personal operation matrix | ✅ Created 2F |
| Charter + WS-L2 review | ✅ |
| Registration + platform shell | ✅ |
| WS-REF pattern annex | ⏳ REG-B3 advisory |

---

### G8 — Production safety — PASS (3)

| Evidence | Verdict |
|----------|---------|
| ENG-1 Place 404 | ✅ **Closed** |
| Stub product UI removed (1B) | ✅ |
| Orphan routes removed (1D) | ✅ |
| HR/scheduling matrix P-rows | ⚠️ Module debt — not shell P0 |

**Pre-ENG-1:** G8 was PARTIAL (2). Post-remediation: PASS.

---

### G9 — UX consistency — PASS (3)

| Evidence | Verdict |
|----------|---------|
| PlatformShell shared geometry | ✅ |
| Business 3C-4F / Personal 3C-4E | ✅ |
| EmptyState / token patterns in modules | Module-owned |
| KNOWN-PWF UX items (RWS-13/14/27) | Advisory — not shell FAIL |

---

## Comparison to WS-L2 readiness dimensions

| WS-L2 dimension (2026-06-14) | Combined % | G gate proxy |
|-------------------------------|------------|--------------|
| D-4 Runtime scope | 66% | G6 partial |
| D-7 Cross-surface | 82% → **~90%** post ENG-1 | G4/G8 pass |
| Combined weighted | ~89% | G1–G9 **23/27 ~85%** |

---

## Plain WS-L3 gate deltas

| Requirement | Current | Needed for plain WS-L3 |
|-------------|---------|------------------------|
| G6 runtime scope tests | PARTIAL | ENG-2 PASS |
| REG-B3 pattern annex | Open | G7 complete annex |
| Open advisories | 11 | ≤3 or council acceptance |
| Score | 23/27 | ≥26/27 recommended |

---

## Related

- [WORKSPACE_CERTIFICATION_READINESS.md](./WORKSPACE_CERTIFICATION_READINESS.md)
- [REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md](../architecture/audits/REFERENCE_WORKSPACE_WS_L2_CERTIFICATION_REVIEW.md)

**Last updated:** 2026-06-19
