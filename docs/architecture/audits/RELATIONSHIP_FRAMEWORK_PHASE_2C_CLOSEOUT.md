# Relationship Framework — Phase 2C Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2C — Automation Trigger Catalog  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D, 2A (tags), 2B (search)

> **Scope:** Constitutional automation boundary only. No workflow engine, APIs, services, jobs, UI, schema, or migrations.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Trigger catalog summary | §1 |
| 2 | Safety model summary | §2 |
| 3 | Consumer boundaries summary | §3 |
| 4 | AI automation boundaries summary | §4 |
| 5 | Unresolved risks | §5 |
| 6 | Recommended Phase 2D | §6 |

---

## Phase 2C deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2C-1 | Automation trigger catalog | [RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md](../RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md) | ✅ |
| 2C-2 | Trigger safety model | [AUTOMATION_TRIGGER_SAFETY_MODEL.md](../AUTOMATION_TRIGGER_SAFETY_MODEL.md) | ✅ |
| 2C-3 | Consumer boundary | [AUTOMATION_CONSUMER_BOUNDARY.md](../AUTOMATION_CONSUMER_BOUNDARY.md) | ✅ |
| 2C-4 | AI automation boundary | [AI_AUTOMATION_BOUNDARY.md](../AI_AUTOMATION_BOUNDARY.md) | ✅ |
| 2C-5 | Phase 2C closeout | This document | ✅ |

---

## 1. Trigger catalog summary

### Model

- **Framework concepts** (`relationship.created`, …) map to **concrete domain event types** — no universal `relationship.*` emitter  
- Triggers fire only after **`authorize → execute → emit`**  
- **13 framework concepts** documented including tag and V_Link attach/detach variants  
- **Trigger tiers T0–T5** from observability to destructive (confirmation required)

### Key mappings

| Concept | Example concrete types |
|---------|-------------------------|
| created | `file.shared`, `vlink.entity.linked`, `business.member.added` |
| access_revoked | `file.unshared`, `vlink.member.removed` |
| vlink_attached / detached | `vlink.entity.linked` / `vlink.entity.unlinked` |
| tag_added / removed | `*.updated` with tag diff (standardization gap) |

### Excluded

- `vlink.suggestion.created` (pending)  
- Inference / entityLinking  
- Chat hashtags as tag triggers  

---

## 2. Safety model summary

| Domain | Locked rule |
|--------|-------------|
| **Tenant isolation** | Absolute — no cross-tenant automation |
| **Permissions** | Re-check PE on every SoR mutation by consumer |
| **Destructive** | Tiers D0–D4; D3+ requires confirmation |
| **AI-initiated** | Observe/suggest/draft only — no silent exec |
| **Audit** | Log trigger + action + skip reason |
| **Replay** | Idempotency keys; revoke wins over stale create |
| **Soft delete** | No create-on-trashed; index purge allowed |
| **Rate limiting** | Loop depth cap; per-tenant webhook limits (documented) |

---

## 3. Consumer boundaries summary

| Class | Examples | Mutates SoR? |
|-------|----------|--------------|
| C0 Observer | Analytics | No |
| C1 Derived | Search/tag index invalidation | Derived only |
| C2 Notifier | Notifications, sockets | Notification rows |
| C3 Integrator | Webhooks | External |
| C4 Orchestrator | Workflows (future) | Module APIs only |
| C5 AI signal | Suggestions | Pending suggestions |

**Forbidden:** Direct permission mutation, silent destructive automation, cross-tenant propagation, AI auto-write, universal edge SoR writer.

---

## 4. AI automation boundaries summary

| Allowed | Forbidden |
|---------|-----------|
| Observe allowlisted events | Silent share/link/assign/delete |
| Learning stub + correlation | Event payload as grounding SoR |
| Suggest (pending accept) | Auto-accept V_Link suggestion |
| Draft actions for user | UserMemoryFact from trigger alone |
| Re-fetch after signal | V_Link membership as file access |

**Precedence:** Events at layer 5 — invalidate/suggest, not replace V_Link or providers.

---

## 5. Unresolved risks

| ID | Risk | Severity | Mitigation path |
|----|------|----------|-----------------|
| AC-R1 | Tag diff not in event metadata | Medium | Optional `tagsAdded`/`tagsRemoved` registry amendment |
| AC-R2 | AI allowlist smaller than catalog | Medium | Controlled expansion process in AI boundary doc |
| AC-R3 | Workflow engine scope creep | High | C4 registration model + safety tiers before build |
| AC-R4 | Dual emit duplicate processing | Medium | Subscribe domain not activity; idempotency keys |
| AC-R5 | Webhook partner stores PII from metadata | Medium | Contract disallowed fields + review |
| AC-R6 | Loop: share → webhook → share | High | Rate limit + max chain depth |
| AC-R7 | TaskFileLink / dependency no domain events | Low | Phase 2D read adapter / event gap closure |
| AC-R8 | Notification subscriber still placeholder | Low | Implementation track — boundaries ready |

---

## 6. Recommended Phase 2D

**Not executed.** Architecture documentation only.

Phase 2B closeout listed multiple 2C+ tracks. With 2C complete, **Phase 2D** should pick **one primary track** plus optional secondary:

| Rank | Track | Rationale | Proposed deliverables |
|------|-------|-----------|----------------------|
| **2D-1 (recommended)** | **Relationship Read Adapter Catalog** | Completes Relationship Search story from 2B; complements automation hydrate Pattern C | `RELATIONSHIP_READ_ADAPTER_CATALOG.md` |
| **2D-2** | **Graph Visualization Contract** | Derived graph only — events from 2C inform invalidation | `RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md` |
| **2D-3** | **Recommendation Architecture** | Depends on search + automation boundaries | `RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md` |
| **2D-4** | **Relationship Analytics Model** | Formalizes C0 consumer — event-derived metrics | `RELATIONSHIP_ANALYTICS_MODEL.md` |

**Recommendation:** Start **2D-1 Relationship Read Adapter Catalog** — bridges search federation (2B) and operational link hydrate without universal DB.

### Engineering (separate from doc track)

- Expand `AIEventConsumer` allowlist  
- Implement workflow engine  
- Wire `notificationDomainEventSubscriber`  
- Standardize tag diff metadata on emitters  

---

## Framework index update

Automation artifacts registered under **Phase 2C** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Trigger catalog with ownership and safety per concept | ✅ |
| Safety model (tenant, PE, destructive, replay, trash) | ✅ |
| Consumer allow/forbid matrix | ✅ |
| AI observe/suggest vs silent exec boundary | ✅ |
| No automation implementation | ✅ |
| Phase 2D recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2D scope (recommend **2D-1 Read Adapter Catalog**).

**Do not execute Phase 2D** until explicitly requested.

---

**Last updated:** 2026-06-14
