# Context Graph — Council Packet

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** **RATIFICATION REQUEST** — decision packet for Phase 1 authorization  
**Audience:** Platform Architecture Governance Council

---

## 1. Decision requested

Authorize **Phase 1 implementation** of the Vssyl Context Graph as a **Tier 0 platform capability**, evolving V_Link into a federated read orchestration layer per Phase 0A/0B architecture.

| Decision | Recommendation |
|----------|----------------|
| Ratify Context Graph Charter | **Approve** |
| Ratify Federation Contract | **Approve** |
| Ratify Bundle Descriptor Spec | **Approve** |
| Approve Read API Contract (spec) | **Approve** |
| Authorize Phase 1A implementation | **Approve with findings** |

---

## 2. Architecture recommendation

### Accepted model (Phase 0A — reaffirmed)

| Element | Decision |
|---------|----------|
| **Graph model** | Federated — Conceptual Option C |
| **Nodes** | `(moduleId, entityType, entityId)` descriptors |
| **Container nodes** | Optional `vlink:{id}` projections |
| **Edges** | `VLinkEntity` + module operational links |
| **Tags** | Metadata on nodes — not graph entities |
| **AI** | Consumer — not owner |
| **Universal table** | **Prohibited** |
| **Graph database** | **Prohibited** |

### V_Link disposition

**V_Link remains the primary association substrate.** Context Graph adds federation orchestrator + bundle APIs **around** existing V_Link SoR — no replacement, no schema migration.

---

## 3. Required questions — explicit answers

### Q1. Is Context Graph now a formal Tier 0 platform capability?

**Yes.** Ratification of [CONTEXT_GRAPH_CHARTER.md](./CONTEXT_GRAPH_CHARTER.md) formally charters Context Graph as **Tier 0 Platform Capability** — core platform layer, not a marketplace module. Ledger entry deferred until Phase 3 certification.

### Q2. Does V_Link remain the primary association substrate?

**Yes.** V_Link is the association SoR. Context Graph federates reads across V_Link and module adapters. User-facing brand remains **V_Link**.

### Q3. Are tags metadata or entities?

**Metadata.** Tags are module-local labels on host entity nodes. Future Tag Index is a **read-only derived mirror** — not a graph node type. Tag collision must not imply relationships.

### Q4. Should implementation proceed?

**Yes — phased.** Proceed to **Phase 1A** upon council approval. Do not skip 0B ratification. Current readiness: **NOT READY** (2 blockers — orchestrator + read API).

### Q5. What is the first implementation package?

**Phase 1A — Federation Read Foundation** (4–6 weeks estimated):

| Deliverable | Description |
|-------------|-------------|
| `contextGraphOrchestratorService` | Read-only federation composer |
| `ContextGraphModuleAdapter` interface | Formal adapter contract |
| Adapter registry | Wire P0: vlink, drive, calendar, todo |
| `POST /api/context-graph/bundle/resolve` | First read API |
| `GET /api/context-graph/vlinks/:id/bundle` | V_Link bundle endpoint |
| Integration tests | Multi-module hydrate + PE redaction |

**Parallel (recommended):** Phase 1D NOTE resolver — closes CG-F-004.

### Q6. Which modules should receive adapters first?

| Priority | Modules | Rationale |
|----------|---------|-----------|
| **P0** | V_Link (wrapper), drive, calendar, todo | Highest traffic; AI pipeline core |
| **P1** | notes (remediate), notebook, chat, AI provenance | Resolver debt + operational edges |
| **P2** | place, HR, scheduling, workforce, BA | Business completeness |
| **P3** | Tags index, admin diagnostic | Derived / admin |

### Q7. What are the permission risks?

| Risk | Severity | Mitigation |
|------|----------|------------|
| Traversal permission leak | **High** | PE every hop; depth caps; omit on deny |
| V_Link membership confused with file share | **High** | Charter P5; UX copy; redaction placeholders |
| Tag ↔ V_Link semantic collapse | **High** | TAG_RELATIONSHIP_BOUNDARY_REVIEW |
| Cross-tenant graph bleed | **High** | Tenant scope on every adapter call |
| Admin projection overreach | **Medium** | Impersonation policy (CG-F-015) |
| Inference persisted as fact | **Medium** | Ephemeral flag; precedence rules |

### Q8. What is the AI integration boundary?

| In boundary | Out of boundary |
|-------------|-----------------|
| Consume `ContextBundleDescriptor` | Own graph SoR |
| `vlink` + future `graph_bundle` catalog sources | Write UserMemoryFact from graph |
| Precedence: memory > vlink > providers | Pending suggestions as grounding |
| Pipeline trace provenance | Raw cross-module Prisma |
| Token-budgeted bundle slice | Unbounded graph crawl |

AI memory (`UserMemoryFact`) remains **adjacent** — precedence layer 1, not a graph edge.

### Q9. Is this certifiable as a platform capability?

**Yes.** G1–G9 framework defined in [CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md](./CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md).

| Milestone | Projected score |
|-----------|-----------------|
| Today (0B) | **12/27 (~44%)** — NOT READY |
| Post Phase 1A–1C | **~22/27 (~81%)** — L3 WITH FINDINGS candidate |
| Post Phase 2 + advisories | **~24/27 (~89%)** — L3 CERTIFIED candidate |

Certification evaluation (**CG-2**) recommended after Phase 1C complete.

### Q10. What should not be built yet?

| Do not build (yet) | Phase |
|--------------------|-------|
| Universal `ContextNode` / `graph_edges` table | **Never** (constitutional ban) |
| Graph database (Neo4j, etc.) | **Never** |
| Tag Index | 2A |
| Graph visualization UI | 2B |
| N-hop social graph | **Never** (without explicit privacy phase) |
| V_Link replacement | **Never** |
| AI memory graph | **Never** — memory stays separate SoR |
| Realtime graph sync | 2+ optional |
| `GET /api/context-graph/tags/search` | 2A |
| Admin graph diagnostic | 1B (after core bundle) |

---

## 4. Risks summary

| Risk | Severity | Phase mitigation |
|------|----------|------------------|
| Universal table pressure | High | Charter non-negotiable |
| Permission leak | High | G1 test matrix Phase 1B |
| Scope creep to graph DB | Medium | Federation contract |
| NOTE resolver debt | Medium | Phase 1D parallel |
| Documentation drift | Low | CG-F-014 sync in 1D |

---

## 5. Migration complexity

| Area | Complexity |
|------|------------|
| V_Link schema | **None** |
| Module SoR | **Low** — adapter additions |
| AI pipeline | **Low** — extend catalog |
| Tag index | **Moderate** — derived store |
| Data migration | **None** |
| **Overall** | **Low–Moderate** |

---

## 6. Non-goals (council acknowledgment)

Council acknowledges and accepts non-goals in [CONTEXT_GRAPH_CHARTER.md](./CONTEXT_GRAPH_CHARTER.md) §3 — including no universal table, no graph DB, no V_Link replacement, no tags-as-entities.

---

## 7. Phase 0B deliverables checklist

| # | Document | Status |
|---|----------|--------|
| 1 | CONTEXT_GRAPH_CHARTER.md | ✅ |
| 2 | CONTEXT_GRAPH_FEDERATION_CONTRACT.md | ✅ |
| 3 | CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md | ✅ |
| 4 | CONTEXT_GRAPH_READ_API_CONTRACT.md | ✅ |
| 5 | CONTEXT_GRAPH_ADAPTER_INVENTORY.md | ✅ |
| 6 | CONTEXT_GRAPH_OPERATION_MATRIX.md | ✅ |
| 7 | CONTEXT_GRAPH_FINDINGS_REGISTER.md | ✅ |
| 8 | CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md | ✅ |
| 9 | CONTEXT_GRAPH_COUNCIL_PACKET.md | ✅ (this document) |

---

## 8. Recommended council vote

| Motion | Recommendation |
|--------|----------------|
| Ratify Tier 0 Context Graph Charter | **Aye** |
| Ratify federated architecture (Option C) | **Aye** |
| Ratify tag metadata model (Option B) | **Aye** |
| Authorize Phase 1A implementation | **Aye with findings** (2 blockers expected to close in 1A) |
| Defer ledger entry | **Aye** — until CG-3 certification |

---

## 9. Expected certification path

```
0A Discovery ✅ → 0B Constitutional ✅ → 1A–1C Implementation → CG-2 Evaluation
  → L3 WITH FINDINGS → 1D/2A/2B advisories → CG-5 Promotion → L3 CERTIFIED
  → CERTIFICATION_LEDGER entry
```

---

## 10. Related prior work

| Program | Relevance |
|---------|-----------|
| Relationship Framework Phase 2D | Federation + traversal constitutional docs |
| V_Link platform layer (May 2026) | Association SoR shipped |
| Admin Portal L3 | Pipeline source governance |
| Business Administration L3 | Org + approval adapters (future) |

---

## 11. Stop condition

**Met upon council receipt.** Phase 0B produces documents only — no runtime changes authorized by this packet alone. Phase 1 requires separate implementation authorization vote (recommended: approve with this packet).

---

**Last updated:** 2026-06-18
