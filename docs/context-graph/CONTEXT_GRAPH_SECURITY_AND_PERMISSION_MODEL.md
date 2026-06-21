# Context Graph — Security and Permission Model

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Constitutional proposal — no implementation

**Authority:** [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](../architecture/GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md), [V_LINK.md](../architecture/V_LINK.md)

---

## Core invariant

```
V_Link membership  →  see container + attachment LIST
Module Policy Engine  →  see entity CONTENT
```

**These paths are independent.** Graph traversal must enforce both at every hop.

---

## Permission layers

| Layer | Gate | Applies to |
|-------|------|------------|
| **L1 — Tenant** | `dashboardId`, `businessId`, `householdId` | All graph reads |
| **L2 — Container** | `vlinkPermissionService` | V_Link CRUD, members, attachments |
| **L3 — Entity** | Module `*VlinkAccessService` + PE | Attachment hydrate |
| **L4 — Edge** | Module junction rules | NotebookLink, TaskFileLink |
| **L5 — Consumer** | Pipeline catalog, admin role | AI source enablement |

---

## Scope matrix

| Scope | Container access | Entity hydrate | AI grounding |
|-------|------------------|----------------|--------------|
| **Personal** | V_Link member or owner | User's module PE | User memory + personal vlinks |
| **Business** | Member + business context | Business-scoped PE | Business catalog sources |
| **Household** | Household member | Household PE | Household-scoped |
| **Shared** | V_Link membership only | Each entity PE independently | Redact restricted attachments |
| **Public** | ❌ No anonymous vlink v1 | Module public rules (Place listings) | No public vlink grounding |

---

## V_Link member roles

| Role | Container | Attach entities | Manage members | Transfer ownership |
|------|-----------|-----------------|----------------|-------------------|
| **OWNER** | Full | Yes (if entity PE allows) | Yes | Yes |
| **EDITOR** | Edit metadata | Yes (if entity PE allows) | No | No |
| **VIEWER** | Read | No | No | No |

Enforced in: `vlinkPermissionService.ts`, controller handlers.

---

## Entity attachment permission flow

```
linkEntityToVLink(userId, vlinkId, entityType, entityId)
  1. assertVLinkAccess(userId, vlinkId, minRole: EDITOR)
  2. resolveEntity(entityType, entityId) via vlinkEntityResolverService
  3. module *VlinkAccessService.canLink(userId, entity)
  4. Policy Engine dual evaluation (drive, calendar, todo paths)
  5. Write VLinkEntity row
  6. emitVLinkEntityLinkedEvent
```

**Hydrate flow (read):**

```
resolveEntity(userId, entityType, entityId)
  1. Module visibility service
  2. Return full | restricted placeholder | omit
```

Restricted placeholders appear in hub UI and AI with `access: 'restricted'` — never leak titles from unauthorized entities.

---

## AI permission rules

| Rule | Statement |
|------|-----------|
| **AI-P1** | Pending `VLinkSuggestion` never grounds responses |
| **AI-P2** | Restricted attachments counted but content redacted |
| **AI-P3** | V_Link pipeline respects catalog source enablement |
| **AI-P4** | Query-time inference never bypasses PE |
| **AI-P5** | `persistedVLinks` preferred over inferred links |
| **AI-P6** | UserMemoryFact outranks V_Link for factual claims |

From [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md).

---

## Graph traversal security

| Threat | Mitigation |
|--------|------------|
| **Permission leak via 2-hop** | Max depth caps; no attach-of-attach |
| **Cross-tenant bleed** | Tenant scope on every adapter call |
| **Inference as fact** | Ephemeral flag; user disclosure |
| **Tag collision inference** | Forbidden — tags not edges |
| **Suggestion poisoning** | Approval gate before SoR write |
| **Admin overreach** | Admin sees diagnostics — not user graph without impersonation policy |

---

## Business Administration integration

| BA entity | Graph security model |
|-----------|---------------------|
| **Org Chart position** | Business member + org PE |
| **Permission set** | Admin/manager assignment — governs module access |
| **Approval hierarchy** | Manager chain — routing only; not content access |

Approval hierarchy does **not** grant V_Link or entity visibility — it routes workflow decisions.

---

## Redaction model

| State | Hub UI | AI pipeline | Graph projection |
|-------|--------|-------------|------------------|
| Full access | Title, url, metadata | Included in grounding | Full GraphNode |
| Restricted | "Restricted item" placeholder | Count only / redacted ref | Restricted node |
| Denied | Omitted | Omitted | Omitted |

---

## Audit and compliance

| Event | Trail |
|-------|-------|
| Link/unlink | `VLinkActivity` + domain events |
| Member changes | Domain events |
| AI suggestion review | `VLinkSuggestion` status + reviewer |
| Ownership transfer | `VLINK_OWNERSHIP_TRANSFERRED` event |

Aligns with [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](../architecture/RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md).

---

## Phase 0B security deliverables (recommended)

1. Graph read API threat model
2. Federation orchestrator PE checkpoint spec
3. Cross-consumer redaction parity tests (planning)
4. Impersonation policy for admin graph diagnostics

---

**Last updated:** 2026-06-18
