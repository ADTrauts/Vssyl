# Marketplace Phase 1B-E.5 — Executive Summary

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1B-E.5 — Module Scope Classification & Admin Portal Alignment  
**Date:** 2026-06-24  
**Status:** ✅ Audit complete — **enforcement implemented in Phase 1B-E.5-F**  
**Closeout:** [MARKETPLACE_PHASE_1B_E5F_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_E5F_CLOSEOUT.md)  
**Prior phase:** 1B-E Partner Activity Ingest Architecture

---

## 1. Objective

Determine whether Vssyl can classify modules as **personal**, **business**, **both**, or **internal/admin** — and whether **Admin Portal** reflects marketplace capability status end-to-end.

---

## 2. Most important question — answer

> Can Vssyl correctly distinguish personal, business, shared, and internal/admin modules throughout the entire marketplace lifecycle?

### **No — not today.**

| Classification | Lifecycle support |
|----------------|-------------------|
| **Personal** | Install/runtime paths exist; **not validated** against module declaration |
| **Business** | Install/runtime paths exist; **not validated** against module declaration |
| **Shared (both)** | Manifest can declare; **not enforced** on browse/install/runtime |
| **Internal/admin** | **No module classification** — admin tools are routes, not scoped modules |
| **Household** | Sub-contracts only; **no** install scope |

**What works:** Search delegate and workspace bridge enforce `supportedContexts` at **participation/query** time — the best reference patterns in the codebase.

**What fails:** Marketplace browse, install, runtime, built-in personal install blanket, and Admin Portal scope visibility.

**Detail:** [MODULE_SCOPE_CLASSIFICATION_REVIEW.md](./MODULE_SCOPE_CLASSIFICATION_REVIEW.md), [MODULE_SCOPE_ENFORCEMENT_AUDIT.md](./MODULE_SCOPE_ENFORCEMENT_AUDIT.md)

---

## 3. Module scope status

### Exists today (fragmented)

| Mechanism | Location |
|-----------|----------|
| Install context param | `scope=personal\|business` on marketplace/install/runtime APIs |
| `manifest.supportedContexts` | Certification structural requirement |
| Inference fallback | `features`, `routes`, `frontend.*Url` keys |
| Built-in list | `BUILT_IN_MODULE_IDS` — implicit platform modules |
| Sub-capability scopes | `searchDelegate`, `workspaceParticipation` |
| Built-in `businessWorkspace` flag | `builtInModuleManifests.ts` |

### Does not exist

| Missing item |
|--------------|
| `Module.moduleScope` DB field |
| Enum-validated `supportedContexts` |
| Marketplace filter by scope |
| Install rejection for wrong scope |
| Internal/admin module flag |
| Household install scope |
| Unified scope registry |

---

## 4. Scope enforcement gaps (top 5)

| ID | Gap |
|----|-----|
| G-01 | Install does not check manifest `supportedContexts` |
| G-02 | Marketplace returns all approved modules regardless of browse scope |
| G-03 | All built-ins marked personal-installed (`hr`, `scheduling`, etc.) |
| G-04 | Certification does not validate context enum values |
| G-05 | Sub-capability scopes can contradict top-level manifest |

**Detail:** [MODULE_SCOPE_ENFORCEMENT_AUDIT.md](./MODULE_SCOPE_ENFORCEMENT_AUDIT.md)

---

## 5. Admin Portal alignment

### Visible today ✅

- Submission status, certification panel, artifact scan, publish readiness
- Version promote/rollback, AI Context registry tab
- Structural checklist items for search delegate and workspace participation (when declared)

### Missing ❌

- UI for search delegate, workspace bridge, business billing **probes** (APIs exist)
- Module scope badge (Personal / Business / Both)
- Activity ingest readiness
- Unified marketplace capability dashboard
- Allowlist / feature-flag visibility for partner pilots

**Detail:** [ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md](./ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md)

---

## 6. Recommendation — module scope model

> Should module scope become (A) required manifest field, (B) certification requirement, (C) installation-time constraint, or (D) all of the above?

### **Recommendation: D — All of the above**

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **A. Required manifest field** | ✅ Required | `supportedContexts` becomes canonical enum array — replace inference-only |
| **B. Certification requirement** | ✅ Required | Validate non-empty, allowed values, sub-capability ⊆ superset |
| **C. Installation-time constraint** | ✅ Required | `assertModuleSupportsInstallScope()` — fail closed on mismatch |
| **D. All of the above** | ✅ **Adopt** | Defense in depth; matches search delegate enforcement pattern |

### Canonical manifest shape (proposed)

```json
{
  "supportedContexts": ["business"],
  "moduleScope": "business"
}
```

| `moduleScope` | `supportedContexts` |
|---------------|---------------------|
| `personal` | `["personal"]` |
| `business` | `["business"]` |
| `both` | `["personal", "business"]` |
| `household` (optional product) | includes `household` |
| `internal` | Not marketplace-listed; `status` + flag — **separate track** |

`moduleScope` is a **denormalized summary** for Admin UI and marketplace filters; `supportedContexts` remains authoritative for subsystems.

---

## 7. Implementation roadmap (post-audit)

| Phase | Scope work | Admin Portal work |
|-------|------------|-------------------|
| **1B-E.5-F** | Enum validation in certification; install + marketplace filter | Scope badge on submissions |
| **1B-E.5-G** | Built-in per-module scope map; runtime guard | Marketplace capabilities card + probe buttons |
| **1B-E.5-H** | Sub-capability ⊆ validation; household decision | Capability chips on list view |
| **2** | `internal` platform module flag | Hide internal from marketplace browse |

**Out of scope for this audit:** migrations (optional denormalized column), marketplace redesign, runtime code.

---

## 8. Deliverables

| Document | Status |
|----------|--------|
| [MODULE_SCOPE_CLASSIFICATION_REVIEW.md](./MODULE_SCOPE_CLASSIFICATION_REVIEW.md) | ✅ |
| [MODULE_SCOPE_ENFORCEMENT_AUDIT.md](./MODULE_SCOPE_ENFORCEMENT_AUDIT.md) | ✅ |
| [ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md](./ADMIN_PORTAL_MARKETPLACE_ALIGNMENT_REVIEW.md) | ✅ |
| [MARKETPLACE_PHASE_1B_E5_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1B_E5_EXECUTIVE_SUMMARY.md) | ✅ |

---

## 9. Acceptance criteria

| Criterion | Met |
|-----------|-----|
| Module scope status is known | ✅ |
| Scope enforcement gaps identified | ✅ |
| Admin Portal alignment reviewed | ✅ |
| Recommendation documented | ✅ D — all of the above |
| No runtime code changes | ✅ |

---

## 10. Strategic takeaway

Module scope is currently **install-context**, not **module identity**. Until `supportedContexts` is enum-validated and enforced at browse, install, and runtime, partners and admins cannot trust that a module belongs in personal vs business workspaces. Admin Portal has strong **submission/certification** coverage but **incomplete capability operations** visibility — probes exist on the server but not in the UI.

Search delegate scope filtering is the **template** to generalize platform-wide.

---

**Last updated:** 2026-06-24
