# Relationship Framework — Canonical Index

**Program:** Vssyl Relationship Framework  
**Status:** Entry point for all Relationship Framework work  
**Date:** 2026-06-14  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §5, §18, §21

> Use this index before adding relationship mechanisms, V_Link entity types, cross-module links, or AI grounding sources.

---

## Program summary

The Relationship Framework defines **what relationship classes exist**, **who owns them**, **how they live and die**, **how systems read them**, and **what events mean** — without a universal relationship database or god object.

**Core distinctions (locked):**

| Layer | Document | Is |
|-------|----------|-----|
| V_Link | [V_LINK.md](./V_LINK.md) | User-curated **Association** container + AI grounding |
| Module links | [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) | Operational SoR (share, assign, TaskFileLink, …) |
| NotebookLink | [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | Work-execution links — not V_Link |
| Tags | [TAG_STRATEGY.md](./TAG_STRATEGY.md) | Module-local labels — not platform graph |

---

## Artifact map

### Discovery (Phase 1A)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md) | Inventory of all relationship mechanisms in repo | Full platform audit evidence | Platform architecture | V_LINK, module schemas, AI pipeline |
| [audits/RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md](./audits/RELATIONSHIP_DOCUMENTATION_RECONCILIATION.md) | Doc vs implementation drift analysis (Phase 1B) | Pre-P0 wave findings | Platform architecture | Baseline audit |
| [audits/RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md](./audits/RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md) | P0 correction inventory + applied updates | Phase 1D doc wave | Platform architecture | Reconciliation doc |

### Governance (Phase 1B)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) | **Constitutional** relationship class definitions | 18 classes + anti-patterns | Platform architecture | Platform standards §5 |
| [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) | System of record per relationship | Duplication prevention | Platform architecture | Taxonomy |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | How AI/search/analytics **read** without universal DB | Federation patterns A–E | Platform architecture | Ownership matrix |
| [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | NotebookLink vs V_Link split (reference pattern) | Notebook composition | Notebook + platform | Taxonomy Association class |

### Lifecycle (Phase 1C)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md) | Create/update/archive/trash/restore/delete per class | All taxonomy classes | Platform architecture | Taxonomy, GLOBAL_TRASH, V_LINK archive rules |
| [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md) | Entity-delete cascade playbooks | File, task, event, vlink, business, … | Platform architecture | Lifecycle matrix |
| [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](./RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) | Audit channels, retention tiers, AI visibility after delete | Compliance expectations | Platform architecture + compliance | DOMAIN_EVENTS, lifecycle |
| [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md) | Conceptual event vocabulary + ownership | Not implementation registry | Platform architecture | DOMAIN_EVENTS |

### Platform integration (maintained)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [V_LINK.md](./V_LINK.md) | V_Link layer summary + non-negotiables | Tier 0 platform primitive | Platform architecture | vlinkProductContext, PLATFORM_ENTITY_MODEL |
| [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) | **Integration truth table** (resolver/manifest/UI) | Entity registry contract | Platform architecture | registerPlatformEntities.ts |
| [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) | Trash vs V_Link archive | Entity lifecycle | Platform architecture | Lifecycle matrix |
| [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | Event bus implementation | Cross-cutting fan-out | Platform architecture | Event model (conceptual) |
| [memory-bank/vlinkProductContext.md](../../memory-bank/vlinkProductContext.md) | Product status + AI pipeline | V_Link product truth | Product / Memory Bank | V_LINK.md |

### Tag strategy (Phase 2A)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [TAG_STRATEGY.md](./TAG_STRATEGY.md) | **Constitutional** tag definition, lifecycle, permissions, anti-patterns | Platform-wide tag philosophy | Platform architecture | Taxonomy §Tag |
| [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](./TAG_OWNERSHIP_AND_SCOPE_MATRIX.md) | Per-module allowed / recommended / forbidden | Drive, Chat, Calendar, Todo, Notes, Place, AI, Business, HR, Scheduling | Platform architecture | Tag strategy, ownership matrix |
| [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md) | Future search, AI retrieval, recommendations | Read federation only — no engine | Platform architecture | Tag strategy, federation contract |
| [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](./TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) | Tag vs Relationship vs V_Link vs operational link | Semantic collapse prevention | Platform architecture | Taxonomy, V_LINK, tag strategy |

### Search architecture (Phase 2B)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) | **Constitutional** federated search — four concepts | Entity, tag, relationship, V_Link search | Platform architecture | Federation contract, tag strategy |
| [SEARCH_PROVIDER_MODEL.md](./SEARCH_PROVIDER_MODEL.md) | SearchProvider types and authority split | Drive, Chat, Calendar, Todo, Notes, Place, Business, V_Link | Platform architecture | Ownership matrix, search architecture |
| [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md) | Derived tag index — read-only mirror rules | Future Tag Index | Platform architecture | TAG_STRATEGY, search architecture |
| [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) | Fail-closed visibility, facets, counts, AI | Search + grounding gates | Platform architecture | PE, visibility services |
| [SEARCH_ARCHITECTURE_DECISION_RECORD.md](./SEARCH_ARCHITECTURE_DECISION_RECORD.md) | Why federation vs universal DB / graph / global tags | ADR | Platform architecture | Baseline audit, 1B–2A |

### Automation triggers (Phase 2C)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md](./RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md) | **Trigger-eligible** relationship lifecycle events | Framework concepts → concrete domain types | Platform architecture | Event model, lifecycle matrix |
| [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md) | Tenant, PE, destructive, replay, rate limits | Future automation safety | Platform architecture | Trigger catalog |
| [AUTOMATION_CONSUMER_BOUNDARY.md](./AUTOMATION_CONSUMER_BOUNDARY.md) | Allowed/forbidden future consumers | Notifications, AI, analytics, workflows, … | Platform architecture | Safety model, federation Pattern D |
| [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) | AI observe/suggest vs silent exec | C5 consumer rules | Platform architecture + AI | Trigger catalog, V_LINK, TAG_STRATEGY |

### Read adapters (Phase 2D-1)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md) | **Read adapters** per taxonomy class | SoR, payload, AI/search/analytics eligibility | Platform architecture | Ownership matrix, federation contract |
| [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md) | Patterns A–E formalized | Direct read, search, hydrate, index, events | Platform architecture | Federation contract, search architecture |
| [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md) | Future registry model — prevent drift | Provider kinds K1–K7, capabilities | Platform architecture | Catalog, PLATFORM_ENTITY_MODEL |
| [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) | AI federation ordering + V_Link/tags/search | Twin retrieval rules | Platform architecture + AI | 2B, 2C, AI_CONTEXT_ASSEMBLY |
| [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md) | Certification, deprecation, testing | Merge gates | Platform architecture | Registry model |

### Graph visualization (Phase 2D-2)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](./RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md) | **Graph as read projection** — not SoR | Purpose, boundaries, node/edge/container | Platform architecture | Read adapters, federation contract |
| [GRAPH_NODE_AND_EDGE_MODEL.md](./GRAPH_NODE_AND_EDGE_MODEL.md) | Canonical projection node/edge categories | Visual meaning, adapters, AI eligibility | Platform architecture | Taxonomy, adapter catalog |
| [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) | Fail-closed graph visibility | Redaction, V_Link resolver, counts | Platform architecture | Search permission model |
| [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](./GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) | Depth limits, hydration flow | 1-hop/2-hop/N-hop caps | Platform architecture | Hydration patterns |
| [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) | AI summarize/suggest — not auto-write | Layer 4 graph context | Platform architecture + AI | AI retrieval, automation boundary |
| [GRAPH_GOVERNANCE_AND_CERTIFICATION.md](./GRAPH_GOVERNANCE_AND_CERTIFICATION.md) | K7 graph provider certification | Drift prevention | Platform architecture | Read adapter governance |

### Recommendations (Phase 2D-3)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](./RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md) | **Suggestions vs facts** — approval-driven | Sources, consumers, ownership | Platform architecture | Federation contract, ownership matrix |
| [RECOMMENDATION_SIGNAL_MODEL.md](./RECOMMENDATION_SIGNAL_MODEL.md) | Signal families + confidence + explainability | 14+ signal types | Platform architecture | Adapters, tags, graph |
| [RECOMMENDATION_PERMISSION_MODEL.md](./RECOMMENDATION_PERMISSION_MODEL.md) | Fail-closed recommendation visibility | Cross-tenant, redaction | Platform architecture | Search/graph permission |
| [AI_RECOMMENDATION_BOUNDARY.md](./AI_RECOMMENDATION_BOUNDARY.md) | AI surface/explain — not auto-create | VLinkSuggestion, AISuggestion | Platform architecture + AI | AI retrieval, automation, graph |
| [RECOMMENDATION_LIFECYCLE_MODEL.md](./RECOMMENDATION_LIFECYCLE_MODEL.md) | Suggested/Accepted/Rejected/Dismissed/Expired | Proposal ≠ relationship state | Platform architecture | Lifecycle matrix, events |
| [RECOMMENDATION_GOVERNANCE.md](./RECOMMENDATION_GOVERNANCE.md) | Certification RG1–RG17 | No hidden rankers | Platform architecture | Signal model |

### Analytics (Phase 2D-4)

| Document | Purpose | Scope | Owner | Dependencies |
|----------|---------|-------|-------|--------------|
| [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md) | **Observations vs facts** — consumer C0 | Event/adapter/graph/recommendation derivation | Platform architecture | Federation contract, audit policy |
| [RELATIONSHIP_METRICS_CATALOG.md](./RELATIONSHIP_METRICS_CATALOG.md) | Metric definitions + confidence + retention | 15+ core metrics | Platform architecture | Event model, lifecycle |
| [RELATIONSHIP_HEALTH_MODEL.md](./RELATIONSHIP_HEALTH_MODEL.md) | Health as interpretation — not SoR | Healthy/inactive/orphaned/… | Platform architecture | Lifecycle matrix |
| [ANALYTICS_PERMISSION_MODEL.md](./ANALYTICS_PERMISSION_MODEL.md) | Fail-closed analytics visibility | Aggregates, k-anonymity | Platform architecture | Search/graph permission |
| [AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md](./AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md) | AI trends — not grounding SoR | Layer 8 in stack | Platform architecture + AI | AI retrieval, recommend, graph |
| [RELATIONSHIP_ANALYTICS_GOVERNANCE.md](./RELATIONSHIP_ANALYTICS_GOVERNANCE.md) | Certification AG1–AG15 | No analytics-derived truth | Platform architecture | Metrics catalog |

### Phase closeouts

| Document | Phase |
|----------|-------|
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_1B_CLOSEOUT.md) | 1B |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_1C_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_1C_CLOSEOUT.md) | 1C |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_1D_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_1D_CLOSEOUT.md) | 1D |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2A_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2A_CLOSEOUT.md) | 2A |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2B_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2B_CLOSEOUT.md) | 2B |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2C_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2C_CLOSEOUT.md) | 2C |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2D1_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2D1_CLOSEOUT.md) | 2D-1 |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2D2_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2D2_CLOSEOUT.md) | 2D-2 |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2D3_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2D3_CLOSEOUT.md) | 2D-3 |
| [audits/RELATIONSHIP_FRAMEWORK_PHASE_2D4_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2D4_CLOSEOUT.md) | 2D-4 |

---

## Reading order

### New engineer / agent

1. [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) — what classes exist  
2. [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) — who owns what  
3. [V_LINK.md](./V_LINK.md) + [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) — V_Link integration truth  
4. [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) — how to read safely  

### Adding V_Link entity type

1. [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) — gap checklist  
2. [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md) — Association lifecycle  
3. [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md) — permanent delete unlink  
4. [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md) — emit concepts  
5. Module audit template (File Hub FH-3A pattern)

### AI / grounding work

1. [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) § AI  
2. [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](./RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) § AI  
3. [AI_PLATFORM_OVERVIEW.md](./AI_PLATFORM_OVERVIEW.md) § V_Link  
4. [audits/AI_CONTEXT_PROVIDER_MATRIX.md](./audits/AI_CONTEXT_PROVIDER_MATRIX.md)

### Tagging / faceting work

1. [TAG_STRATEGY.md](./TAG_STRATEGY.md) — definition and anti-patterns  
2. [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](./TAG_OWNERSHIP_AND_SCOPE_MATRIX.md) — module gate  
3. [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](./TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) — tag vs link decision tree  
4. [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md) — future search/AI (no impl)

### Search / discovery work

1. [RELATIONSHIP_SEARCH_ARCHITECTURE.md](./RELATIONSHIP_SEARCH_ARCHITECTURE.md) — four search concepts  
2. [SEARCH_PROVIDER_MODEL.md](./SEARCH_PROVIDER_MODEL.md) — provider authority  
3. [SEARCH_PERMISSION_MODEL.md](./SEARCH_PERMISSION_MODEL.md) — fail-closed visibility  
4. [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md) — derived tag mirror  
5. [SEARCH_ARCHITECTURE_DECISION_RECORD.md](./SEARCH_ARCHITECTURE_DECISION_RECORD.md) — federation ADR

### Automation / trigger work

1. [RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md](./RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md) — trigger-eligible events  
2. [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md) — safety tiers  
3. [AUTOMATION_CONSUMER_BOUNDARY.md](./AUTOMATION_CONSUMER_BOUNDARY.md) — who may consume  
4. [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) — AI observe/suggest rules

### Read adapter / hydration work

1. [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md) — per-class readers  
2. [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md) — patterns A–E  
3. [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md) — registry model  
4. [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) — AI precedence  
5. [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md) — certification

### Graph visualization work

1. [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](./RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md) — projection contract  
2. [GRAPH_NODE_AND_EDGE_MODEL.md](./GRAPH_NODE_AND_EDGE_MODEL.md) — nodes and edges  
3. [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) — fail-closed  
4. [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](./GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) — depth caps  
5. [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) — AI rules  
6. [GRAPH_GOVERNANCE_AND_CERTIFICATION.md](./GRAPH_GOVERNANCE_AND_CERTIFICATION.md) — K7 certification

### Recommendation work

1. [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](./RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md) — suggestions vs facts  
2. [RECOMMENDATION_SIGNAL_MODEL.md](./RECOMMENDATION_SIGNAL_MODEL.md) — signal families  
3. [RECOMMENDATION_PERMISSION_MODEL.md](./RECOMMENDATION_PERMISSION_MODEL.md) — fail-closed  
4. [RECOMMENDATION_LIFECYCLE_MODEL.md](./RECOMMENDATION_LIFECYCLE_MODEL.md) — proposal states  
5. [AI_RECOMMENDATION_BOUNDARY.md](./AI_RECOMMENDATION_BOUNDARY.md) — AI rules  
6. [RECOMMENDATION_GOVERNANCE.md](./RECOMMENDATION_GOVERNANCE.md) — certification

### Analytics work

1. [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md) — observations vs facts  
2. [RELATIONSHIP_METRICS_CATALOG.md](./RELATIONSHIP_METRICS_CATALOG.md) — metric catalog  
3. [RELATIONSHIP_HEALTH_MODEL.md](./RELATIONSHIP_HEALTH_MODEL.md) — interpretation layer  
4. [ANALYTICS_PERMISSION_MODEL.md](./ANALYTICS_PERMISSION_MODEL.md) — fail-closed  
5. [AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md](./AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md) — AI rules  
6. [RELATIONSHIP_ANALYTICS_GOVERNANCE.md](./RELATIONSHIP_ANALYTICS_GOVERNANCE.md) — certification

---

## Module-specific relationship references

| Module | V_Link / relationships doc | Operation matrix |
|--------|---------------------------|------------------|
| File Hub | [FILE_HUB_VLINK_COMPLIANCE.md](./audits/FILE_HUB_VLINK_COMPLIANCE.md) | [FILE_HUB_OPERATION_MATRIX.md](./audits/FILE_HUB_OPERATION_MATRIX.md) |
| Calendar | [CALENDAR_VLINK_PHASE2B.md](./audits/CALENDAR_VLINK_PHASE2B.md) | [CALENDAR_OPERATION_MATRIX.md](./audits/CALENDAR_OPERATION_MATRIX.md) |
| Chat | [CHAT_OPERATION_MATRIX.md](./audits/CHAT_OPERATION_MATRIX.md) § V_Link | Same |
| Todo | [TODO_PHASE2_TRASH_ENTITY_VLINK.md](./audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md) | [TODO_OPERATION_MATRIX.md](./audits/TODO_OPERATION_MATRIX.md) |
| Place | [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) §6 | [PLACE_OPERATION_MATRIX.md](./audits/PLACE_OPERATION_MATRIX.md) |
| Notebook | [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | [NOTEBOOK_OPERATION_MATRIX.md](./audits/NOTEBOOK_OPERATION_MATRIX.md) |

---

## Phase roadmap (documentation)

| Phase | Status | Theme |
|-------|--------|-------|
| 1A | ✅ | Baseline audit |
| 1B | ✅ | Taxonomy, ownership, federation |
| 1C | ✅ | Lifecycle, cascades, audit, events |
| 1D | ✅ | P0 doc reconciliation + this index |
| 2A | ✅ | Tag strategy (constitutional) |
| 2B | ✅ | Relationship search architecture |
| 2C | ✅ | Automation trigger catalog |
| 2D-1 | ✅ | Relationship read adapter catalog |
| 2D-2 | ✅ | Graph visualization contract |
| 2D-3 | ✅ | Recommendation architecture |
| 2D-4 | ✅ | Relationship analytics model |
| **Phase 2** | **✅ Complete** | Consumer architecture (constitutional) |
| **Phase 3** | Separate program | Intelligence & implementation — see [audits/RELATIONSHIP_FRAMEWORK_PHASE_2D4_CLOSEOUT.md](./audits/RELATIONSHIP_FRAMEWORK_PHASE_2D4_CLOSEOUT.md) |

**Program status:** Relationship Framework Phases 1–2 are **substantially complete** for constitutional documentation. Phase 3 recommended as **Relationship Intelligence & Implementation Program** (engineering + product — not doc-only).

---

## Governance gates

| Action | Required reads |
|--------|----------------|
| New relationship class | Taxonomy charter amendment |
| New cross-module link table | Ownership matrix + taxonomy mapping |
| New VLinkEntityType enum value | PLATFORM_ENTITY_MODEL checklist + resolver |
| AI new grounding source | Federation contract + audit policy |
| Doc status change for V_Link module | Update PLATFORM_ENTITY_MODEL first |
| New module tag field or tag UX | Tag strategy + ownership matrix + boundary review |
| Global / cross-module tag search | Tag search guidelines + TAG_INDEX_CONTRACT — derived index only |
| New global SearchProvider | SEARCH_PROVIDER_MODEL + RELATIONSHIP_SEARCH_ARCHITECTURE |
| Derived search or tag index | TAG_INDEX_CONTRACT + SEARCH_PERMISSION_MODEL + SEARCH_ARCHITECTURE_DECISION_RECORD |
| Relationship hits in global UI | SEARCH_PERMISSION_MODEL + ownership matrix |
| New automation consumer on domain events | Trigger catalog + consumer boundary + safety model |
| AI subscribes to new relationship trigger | AI_AUTOMATION_BOUNDARY + trigger catalog tier ≤ T2 |
| User workflow / destructive automation rule | Safety model D2+ confirmation + consumer C4 registration |
| New relationship read adapter | Read adapter catalog + provider registry + governance G1–G10 |
| Cross-module hydrate path | RELATIONSHIP_HYDRATION_PATTERNS Pattern C + target module gate |
| AI new relationship retrieval source | AI_RELATIONSHIP_RETRIEVAL_MODEL + read adapter catalog |
| New graph surface or K7 provider | Graph visualization contract + governance GV1–GV12 |
| Federated graph explorer | Traversal model + permission model + distinct surface legend |
| New recommendation type or signal family | Recommendation architecture + signal model + governance RG1–RG14 |
| AI-generated recommendation | AI_RECOMMENDATION_BOUNDARY + permission model |
| New relationship metric or health label | Analytics model + metrics catalog + governance AG1–AG15 |
| AI uses analytics in twin | AI_RELATIONSHIP_ANALYTICS_BOUNDARY + permission model |

---

**Last updated:** 2026-06-14
