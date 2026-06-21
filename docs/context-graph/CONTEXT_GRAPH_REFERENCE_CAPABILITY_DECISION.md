# Context Graph — Reference Capability Decision

**Program:** CG-3 — Council Ratification · **Superseded by CG-6 execution**  
**Date:** 2026-06-19  
**Authority:** RD-CG-013 (ratified) → CG-6 (executed)  
**Status:** **EXECUTED** — final designations applied CG-6

**Inputs:**

- [CONTEXT_GRAPH_REFERENCE_ASSESSMENT.md](./CONTEXT_GRAPH_REFERENCE_ASSESSMENT.md) (CG-2 recommendation)
- [CONTEXT_GRAPH_REFERENCE_CANDIDATE_DECISION.md](./CONTEXT_GRAPH_REFERENCE_CANDIDATE_DECISION.md) (CG-0C baseline)
- CG-1A through CG-2A runtime and test evidence
- [CONTEXT_GRAPH_REFERENCE_STATUS_RECORD.md](./CONTEXT_GRAPH_REFERENCE_STATUS_RECORD.md) (CG-6 execution)

---

## Final designation summary (CG-6 executed)

| Capability | CG-3 ratified | **CG-6 executed** |
|------------|---------------|-------------------|
| **#CG-1** Federated Context Graph Read Model | Reference Capability With Findings | **Reference Capability** |
| **#CG-2** V_Link Cross-Module Association Substrate | Reference Capability With Findings | **Reference Capability** |
| **#CG-3** Context Bundle Descriptor Pattern | Candidate | **Reference Capability With Findings** |
| Reference Domain (whole) | Denied | **Denied** |
| Reference Implementation (L4) | Denied | **Denied** |

---

## Historical — CG-3 ratification record

| Capability | CG-0C | CG-2 recommendation | **CG-3 council decision** |
|------------|-------|----------------------|---------------------------|
| **#CG-1** Federated Context Graph Read Model | Candidate | Reference Capability With Findings | **Reference Capability With Findings** — **RATIFIED** |
| **#CG-2** V_Link Cross-Module Association Substrate | Candidate | Reference Capability With Findings | **Reference Capability With Findings** — **RATIFIED** |
| **#CG-3** Context Bundle Descriptor Pattern | Deferred | Candidate | **Candidate** — **RATIFIED** |
| Reference Domain (whole) | Denied | Denied | **Denied** — affirmed |
| Reference Implementation (L4) | Denied | Denied | **Denied** — affirmed (File Hub sole L4) |

---

## #CG-1 — Federated Context Graph Read Model

### Council designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Ratified** | **YES** (RD-CG-013) |
| **Teaching scope** | `(moduleId, entityType, entityId)` descriptors; read-only orchestrator; adapter registry; PE every hop; traversal caps |
| **Citation requirement** | Copying teams must cite **WITH FINDINGS** until CG-F-005 and CG-F-006 close |

### Evidence basis

| Criterion | Status |
|-----------|--------|
| Orchestrator + bundle resolver | ✅ Shipped CG-1A |
| 8 adapters, 11 entity types | ✅ CG-1B |
| 82 tests, 13-scenario permission matrix | ✅ CG-1C |
| No universal SoR / no graph DB | ✅ Constitutional PASS |
| Tag index | ❌ CG-F-005 open |
| Full read API contract | ❌ Partial (~40%) |

### What prevents plain Reference Capability

- Open waivable majors CG-F-005, CG-F-006
- Partial G4 (projection/neighborhood routes deferred)
- No third-party adapter onboarding guide (G9 advisory)

### Promotion path

**Reference Capability With Findings** → **Reference Capability** when CG-5 approves plain L3 and majors closed.

---

## #CG-2 — V_Link Cross-Module Association Substrate

### Council designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Ratified** | **YES** (RD-CG-013) |
| **Teaching scope** | V_Link as primary association substrate; `VLinkEntity` edges; `*VlinkAccessService` PE pattern; federation extends without parallel edge store |
| **Pairs with** | #CG-1 — federation layer is extension of V_Link substrate story |

### Evidence basis

| Criterion | Status |
|-----------|--------|
| V_Link authoritative for attachment edges | ✅ |
| P1 types in federation (`NOTE`, `CHAT`, `PLACE`, etc.) | ✅ CG-1B |
| Cross-module hydrate validated | ✅ Tests |
| CHAT_THREAD message-level | ❌ Deferred (CG-F-009 advisory) |

### What prevents plain Reference Capability

- Same program-level findings as #CG-1 (shared federation certification)
- Residual CHAT_THREAD scope decision (advisory)

### Promotion path

Promote with #CG-1 at CG-5 — not independently.

---

## #CG-3 — Context Bundle Descriptor Pattern

### Council designation

| Field | Value |
|-------|-------|
| **Outcome** | **Candidate** |
| **Ratified** | **YES** (RD-CG-013) |
| **Prior status** | Deferred (CG-0C — spec only) |
| **Upgrade trigger** | CG-1D closes CG-F-006 → eligible for **Reference Capability With Findings** at CG-5 |

### Evidence basis

| Criterion | Status |
|-----------|--------|
| `ContextBundleDescriptor` in runtime | ✅ CG-1A |
| Contract version 1.0 + HTTP header | ✅ |
| Provenance, permissionOutcome, truncation | ✅ Tests |
| AI pipeline consumption | ❌ CG-F-006 open |
| `graph_bundle` catalog / grounding endpoint | ❌ Not implemented |

### Why Candidate, not Reference Capability With Findings

Runtime descriptor is **proven** — sufficient to exit Deferred. Pipeline integration gap prevents teaching-grade reference designation: consumers cannot yet copy an end-to-end AI grounding pattern from production.

### Promotion path

```
Candidate (CG-3)
    ↓ CG-1D — AI pipeline bundle
Reference Capability With Findings (CG-5 target)
    ↓ advisories + plain L3
Reference Capability (future)
```

---

## Explicitly not ratified

| Designation | Council vote |
|-------------|--------------|
| **NOT CERTIFIED** (Context Graph platform capability) | Rejected — L3 WITH FINDINGS ratified |
| **REFERENCE IMPLEMENTATION** (L4) | Rejected — File Hub remains sole L4 |
| **Reference Domain** | Rejected — platform capability, not product domain |
| **Plain Reference Capability** (#CG-1, #CG-2 without findings) | Rejected — 2 open majors |
| **Reference Capability With Findings** (#CG-3 today) | Rejected — pipeline gap; Candidate sufficient |

---

## Catalog and ledger guidance (deferred execution)

| Action | CG-3 status |
|--------|-------------|
| `REFERENCE_MODULE_CATALOG.md` annex for #CG-1/#CG-2 | **Optional** at ledger PR — recommended at Reference Capability With Findings tier |
| `CERTIFICATION_LEDGER.md` reference notation | **Recommended** — see [CONTEXT_GRAPH_LEDGER_RECOMMENDATION.md](./CONTEXT_GRAPH_LEDGER_RECOMMENDATION.md) |
| Reference promotion without CG-5 | **Prohibited** for plain Reference Capability |

---

## Related

- [CONTEXT_GRAPH_COUNCIL_RATIFICATION.md](./CONTEXT_GRAPH_COUNCIL_RATIFICATION.md) — RD-CG-013
- [CONTEXT_GRAPH_FINDINGS_REGISTER.md](./CONTEXT_GRAPH_FINDINGS_REGISTER.md)
- [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](./CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)

**Last updated:** 2026-06-19
