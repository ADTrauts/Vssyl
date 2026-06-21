# Workspace Certification Scorecard (WS-L3-1)

**Program:** WS-L3-1 — Workspace Certification Evaluation  
**Evaluation date:** 2026-06-19  
**Scope:** Combined Reference Workspace (Business + Personal shells)  
**Framework:** Adapted G1–G9 (Admin Portal / Business Operations precedent)  
**Status:** Evaluation artifact — **not a certification award**

**Inputs:** ENG-1 closed · 64 contract tests PASS · WS-L2 CwF (2026-06-14)

---

## Final score

| Metric | Value |
|--------|-------|
| **Total** | **23 / 27** |
| **Percentage** | **~85%** |
| **PASS gates** | **6** |
| **PARTIAL gates** | **3** |
| **FAIL gates** | **0** |
| **Threshold (WITH FINDINGS)** | ≥85% · G9≥2 · 0 blocking · 0 major |
| **Threshold (plain WS-L3)** | ≥26/27 recommended · G6/G7 complete · ≤3 advisories |

**Evaluator determination:** Meets **WS-L3 WITH FINDINGS** bar · **Not** plain WS-L3 bar.

---

## Scorecard matrix

| Gate | Name | Score | Status | Primary evidence | Gap / note |
|------|------|------:|--------|------------------|------------|
| **G1** | Authorization | 2 | **PARTIAL** | JWT/session; business membership; installed-module filter; position-aware gating | Shell orchestration — no PE on shell writes (acceptable class) |
| **G2** | Auditability | 2 | **PARTIAL** | Operation matrices current (2F); module activity on interiors | No shell sidebar-customization activity taxonomy |
| **G3** | Service boundaries | 3 | **PASS** | `BusinessWorkspaceContent` orchestration-only; no Prisma in web shell | — |
| **G4** | API coherence | 3 | **PASS** | `businessWorkspaceNavigation` + `personalDashboardNavigation` SSOT; ENG-1 place segment | B-F2 legacy `?module=` advisory only |
| **G5** | Ownership | 3 | **PASS** | [WORKSPACE_OWNERSHIP_MODEL.md](./WORKSPACE_OWNERSHIP_MODEL.md); routing contracts; Dashboard boundary C | P-F5 education context — product advisory |
| **G6** | Test evidence | 2 | **PARTIAL** | 64 contract tests; Part 2H QA 23/27 adjudicated PASS | ENG-2 — runtime scope bridge untested |
| **G7** | Documentation | 3 | **PASS** | 14+ audits; platform shell doc; charter; registration review | REG-B3 pattern annex deferred |
| **G8** | Production safety | 3 | **PASS** | ENG-1 closed; stubs removed 1B; orphans removed 1D | — |
| **G9** | UX consistency | 3 | **PASS** | PlatformShell 3C-4E/4F; WS-L2 UX co-surface bar | RWS-13/14/27 KNOWN-PWF advisories |

---

## Gate narratives

### G1 — Authorization (PARTIAL)

Workspace shells enforce authentication and business-scoped module visibility through session, `BusinessConfigurationContext`, and `PositionAwareModuleProvider`. This is appropriate for an orchestration layer. Policy Engine is not applied to shell-level navigation mutations — configuration mutations live on separate settings surfaces. **Partial is acceptable** for workspace certification class (mirrors platform-shell N/A PE patterns in Admin Portal).

### G2 — Auditability (PARTIAL)

Module interiors on mounted L3 modules emit normalized activity. Shell-level navigation and sidebar customization are not yet in a workspace activity taxonomy. Operation matrix rows for shell operations are current. **Partial** — does not block WITH FINDINGS.

### G3 — Service boundaries (PASS)

Thin shell invariant upheld: switch/grid orchestrate; modules own services. `DashboardClient` widget logic explicitly scoped **out** of workspace shell certification (Dashboard module product).

### G4 — API coherence (PASS)

Canonical href builders enforced by CI. Segment-switch null deferral pattern complete including **place** post ENG-1. Cross-surface transitions documented and tested.

### G5 — Ownership (PASS)

Hybrid Reference Workspace model validated. Duplication risks documented (business settings/profile overlap deferred to portfolio Settings audit).

### G6 — Test evidence (PARTIAL)

Strong contract-test coverage (navigation, drift, hygiene, cross-surface). `WorkspaceRuntimeScopeBridge` lacks dedicated contract tests (B-F3 / ENG-2). **Primary plain-WS-L3 gap.**

### G7 — Documentation (PASS)

Full evidence chain WS-L0 → WS-L2 → ENG-1 → WS-L3-1. Pattern annex (`WS-REF-*`) tracked as REG-B3 advisory — does not deny WITH FINDINGS (registration precedent waived annex).

### G8 — Production safety (PASS)

No P0 segment 404s after ENG-1. No stub product UI in shell switch. Production QA gap RWS-16 remediated at route layer.

### G9 — UX consistency (PASS)

Shared PlatformShell geometry across business and personal modes. Co-surface WS-L2 UX bar met. Module-owned EmptyState/token patterns not shell-gated.

---

## Co-surface score proxy

| Surface | WS-L2 readiness | WS-L3 gate proxy |
|---------|-----------------|------------------|
| Business Workspace | ~90% | G4/G8 strongest |
| Personal Dashboard shell | ~88% | G9/G4 strongest |
| Combined | ~90% post ENG-1 | **23/27** |

---

## Comparison to prior certification programs

| Program | Score | G9 | WITH FINDINGS? |
|---------|------:|----|----------------|
| Admin Portal | 27/27 | PASS | Promoted plain (0 findings) |
| Business Administration | 23/27 | PASS | WITH FINDINGS → plain |
| Context Graph | 24/27 | PASS | WITH FINDINGS → plain |
| Business Operations | 24/27 | PASS | WITH FINDINGS (ratified) |
| **Reference Workspace** | **23/27** | **PASS** | **Recommended WITH FINDINGS** |

---

## Plain WS-L3 uplift requirements

| Gate / item | Current → target |
|-------------|------------------|
| G6 | 2 → 3 (ENG-2) |
| G1/G2 | 2 → 3 (optional shell audit taxonomy) |
| G7 annex | REG-B3 complete |
| Advisories | 11 → ≤3 or council acceptance |
| Score | 23 → ≥26/27 |

---

## Related

- [WORKSPACE_CERTIFICATION_EVALUATION.md](./WORKSPACE_CERTIFICATION_EVALUATION.md)
- [WORKSPACE_G1_G9_SCORECARD.md](./WORKSPACE_G1_G9_SCORECARD.md) (ENG-1 prep — superseded for certification by this scorecard)

**Last updated:** 2026-06-19 (WS-L3-1)
