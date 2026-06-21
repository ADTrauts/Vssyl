# Context Graph — Ownership Model

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Constitutional proposal — no implementation

**Authority:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](../architecture/RELATIONSHIP_OWNERSHIP_MATRIX.md), [BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md](../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md)

---

## Principle

**The Context Graph has no single system of record.** It is a **federation view** over multiple authoritative stores. Each relationship class has exactly one write owner.

---

## Ownership matrix

| Artifact | Write owner | Read consumers | Tenant scope |
|----------|-------------|----------------|--------------|
| Module entities | Owning module | Graph, AI, search | `dashboardId` + context ids |
| `VLink` container | Platform (vlink) | Hub, AI, graph | `dashboardId` + `businessId`/`householdId` |
| `VLinkEntity` edges | Platform (vlink) | AI, graph | Inherited from container |
| `VLinkMember` | Platform (vlink) | Hub, AI (membership filter) | Container scope |
| `VLinkSuggestion` | Platform (vlink) | Hub — excluded from AI until accepted | User + scope |
| `VLinkActivity` | Platform (vlink) | Hub activity tab | Container scope |
| `NotebookLink` | Notebook module | Graph, AI (intent-gated) | Page scope |
| Module operational links | Owning module | Graph adapters | Module scope |
| Org chart entities | Business module | Graph hierarchy adapter | `businessId` |
| Approval hierarchy | Business Administration | Workflow consumers | `businessId` |
| `UserMemoryFact` | AI module | Twin — precedence layer 1 | User scope |
| Module tags | Owning module | Hydrate with entity | Host scope |
| Graph projection DTOs | **None (derived)** | UI, AI | Request scope |
| Future tag index | Platform search (derived) | Search facets | Mirror only |

---

## Write authority rules

| Rule | Statement |
|------|-----------|
| **W1** | Federation orchestrator is **read-only** — never mutates foreign SoR |
| **W2** | V_Link writes go through `vlinkService` + `vlinkPermissionService` |
| **W3** | Module relationship writes stay in module services |
| **W4** | AI may **suggest** V_Link attachments — user accept required |
| **W5** | Graph cache/index (future) is **derived** — invalidatable from domain events |
| **W6** | Cross-module reads always through visibility services — never raw Prisma joins |

---

## V_Link ownership (detailed)

| Field | Owner | Transfer |
|-------|-------|----------|
| `ownerUserId` | User | `POST /:id/ownership/transfer` |
| `createdById` | Immutable audit | — |
| `scope` | Set at create | PERSONAL / BUSINESS / HOUSEHOLD |
| `parentVLinkId` | Owner/editor | Nesting hierarchy |
| Entity attachments | Linker + PE on target | `linkEntityToVLink` |

**Membership ≠ entity ownership.** A V_Link editor can add a file attachment only if they pass `driveVlinkAccessService` link permission — not merely V_Link EDITOR role.

---

## Business Administration boundaries

| BA capability | Graph ownership | Boundary |
|---------------|-----------------|----------|
| **Org Chart (#OC-1)** | Business module owns hierarchy nodes | V_Link may **reference** positions — not replace org SoR |
| **Permission Sets (#OC-2)** | Business module owns PE assignments | Governs **access** to nodes — not association |
| **Approval Hierarchy (#OC-3)** | BA platform owns approval edges | Workflow routing — orthogonal to V_Link associations |

---

## Personal vs business vs shared

```
PERSONAL scope
  └── dashboardId = personal dashboard
  └── businessId = null
  └── V_Link visible to members only

BUSINESS scope
  └── dashboardId = business dashboard
  └── businessId required
  └── Business member check on create/list
  └── Entity resolver enforces module PE in business context

HOUSEHOLD scope
  └── dashboardId = household dashboard
  └── householdId required

SHARED (conceptual)
  └── V_Link membership shares container — NOT entity content
  └── File share = FilePermission (separate SoR)
```

---

## Third-party module contract

Marketplace modules opting into Context Graph must:

1. Declare `entities[]` in manifest
2. Implement `*VlinkAccessService` + resolver case
3. Implement lifecycle unlink on permanent delete
4. Register in `registerPlatformEntities.ts` (first-party) or platform entity registry API (future)

**Partner code never writes to `VLinkEntity` directly** — uses platform link API.

---

## Governance ownership

| Role | Responsibility |
|------|----------------|
| **Platform Architecture** | Context Graph constitutional docs, federation contract |
| **V_Link squad / platform** | V_Link schema, API, resolver registry |
| **Module owners** | Entity SoR, operational links, module tags |
| **AI platform** | Pipeline consumption, memory precedence |
| **Business Administration** | Org + approval hierarchy nodes (business scope) |

---

**Last updated:** 2026-06-18
