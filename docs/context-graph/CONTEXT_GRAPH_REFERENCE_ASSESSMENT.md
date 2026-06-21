# Context Graph — Reference Assessment (CG-2)

**Program:** CG-2 — Certification Evaluation  
**Date:** 2026-06-19  
**Authority:** RD-CG-008 (CG-0C); runtime evidence CG-1A–1C  
**Prior decision:** [CONTEXT_GRAPH_REFERENCE_CANDIDATE_DECISION.md](./CONTEXT_GRAPH_REFERENCE_CANDIDATE_DECISION.md)

**Constraint:** Assessment and recommendation only — no catalog or ledger updates in CG-2.

---

## Assessment summary

| Capability | CG-0C status | CG-2 recommended status | Change |
|------------|--------------|-------------------------|--------|
| **#CG-1** Federated Context Graph Read Model | Candidate | **Reference Capability With Findings** | ⬆ Promote |
| **#CG-2** V_Link Cross-Module Association Substrate | Candidate | **Reference Capability With Findings** | ⬆ Promote |
| **#CG-3** Context Bundle Descriptor Pattern | Deferred | **Candidate** | ⬆ Promote |
| Reference Domain (whole) | Denied | **Denied** | — |
| Reference Implementation (L4) | Denied | **Denied** | — |

---

## #CG-1 — Federated Context Graph Read Model

### CG-0C baseline

- **Candidate** — constitutional docs only; no runtime

### CG-2 runtime evidence

| Criterion | Evidence |
|-----------|----------|
| Orchestrator | `contextGraphOrchestrator.ts`, `bundleResolver.ts` |
| Adapter registry | 8 adapters, 11 entity types |
| PE every hop | 13-scenario matrix PASS |
| No universal SoR | Constitutional audit PASS |
| Tests | 82 PASS; conformance 100% |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Rationale** | Copyable federation pattern proven in production code; 2 waivable open majors; not plain Reference Capability until CG-F-005/006 closed |
| **Teaching value** | `(moduleId, entityType, entityId)` descriptors; read-only compose; traversal caps |

### What prevents plain Reference Capability

- Open majors CG-F-005, CG-F-006
- Partial API contract (G4)
- No third-party adapter onboarding guide (G9)

---

## #CG-2 — V_Link Cross-Module Association Substrate

### CG-0C baseline

- **Candidate** — V_Link ships; federation layer not built

### CG-2 runtime evidence

| Criterion | Evidence |
|-----------|----------|
| V_Link authoritative | Attachment edges from V_Link SoR only |
| Federation extends V_Link | P1 types in `VLINK_ENTITY_TYPE_MAP` |
| No parallel edge store | Verified |
| Cross-module attachments | vlink → drive/calendar/todo/notes/chat/place validated |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Reference Capability With Findings** |
| **Rationale** | V_Link remains primary association substrate; Context Graph federation layer certified WITH FINDINGS; `*VlinkAccessService` pattern teachable |
| **Notation** | Cite WITH FINDINGS when copying federation layer until plain L3 |

### What prevents plain Reference Capability

- Same program-level findings as #CG-1 (federation is extension of V_Link teaching story)
- CHAT_THREAD deferred (CG-F-009)

---

## #CG-3 — Context Bundle Descriptor Pattern

### CG-0C baseline

- **Deferred** — spec only; runtime required

### CG-2 runtime evidence

| Criterion | Evidence |
|-----------|----------|
| `ContextBundleDescriptor` in runtime | ✅ Shipped CG-1A |
| Contract version 1.0 | ✅ HTTP header + type |
| Pipeline integration | ❌ CG-F-006 open |
| AI grounding endpoint | ❌ Not implemented |
| Provenance / permissionOutcome | ✅ In descriptor + tests |

### Recommended designation

| Field | Value |
|-------|-------|
| **Outcome** | **Candidate** (promoted from Deferred) |
| **Rationale** | Runtime bundle shape proven; AI consumer path not migrated — insufficient for Reference Capability With Findings |
| **Promotion path** | CG-1D pipeline migration → reassess at CG-5 promotion review |

### What prevents Reference Capability With Findings

- CG-F-006 — pipeline still uses implicit vlink context items
- No token estimate / AI suitability fields in production pipeline trace

---

## Reference outcome matrix (all options)

| Capability | Not Candidate | Candidate | Ref With Findings | Ref Capability |
|------------|:-------------:|:---------:|:-----------------:|:--------------:|
| #CG-1 | | | **✓ RECOMMENDED** | |
| #CG-2 | | | **✓ RECOMMENDED** | |
| #CG-3 | | **✓ RECOMMENDED** | | |

---

## Catalog and ledger (deferred)

| Action | CG-2 status |
|--------|-------------|
| Update REFERENCE_MODULE_CATALOG | **Not performed** |
| Update CERTIFICATION_LEDGER | **Not performed** (RD-CG-009) |
| Recommended timing | CG-3 upon L3 WITH FINDINGS award |

**Suggested catalog annex (future):**

```
#CG-1 Federated Context Graph Read Model — Reference Platform Capability With Findings
#CG-2 V_Link Cross-Module Association Substrate — Reference Platform Capability With Findings
#CG-3 Context Bundle Descriptor Pattern — Candidate
```

---

## Comparison to peer programs

| Program | At L3 WF | Reference at cert |
|---------|----------|-------------------|
| Business Administration | L3 WITH FINDINGS | #OC-1, #OC-2 With Findings |
| Admin Portal | L3 WITH FINDINGS | Control-plane candidates |
| **Context Graph (CG-2 rec)** | **L3 WITH FINDINGS** | **#CG-1, #CG-2 With Findings; #CG-3 Candidate** |

**Last updated:** 2026-06-19
