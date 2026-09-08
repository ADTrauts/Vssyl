# External-System Interoperability

**Program:** Platform Participation Reconciliation — Phase 3B  
**Date:** 2026-09-08  
**Status:** Active — minimal canonical architecture contract  
**Owner:** Platform architecture  
**Source of Truth for:** How **external authoritative systems** connect to Vssyl without transferring SoR ownership; distinction from partner Vssyl modules  
**Not Source of Truth for:** Partner/marketplace module runtime; domain-specific adapter implementations; OAuth/protocol details unless another SoT already governs them

> **Architecture only.** This document does **not** create connectors, sync engines, webhook infrastructure, ETL, an integration marketplace, or MuleSoft-like runtime. It defines the minimum conceptual contract so future implementation has clear boundaries.

**Product principle:** *Vssyl connects before it replaces.* ([Product Definition](../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md))  
**Composition:** [`APPLICATION_PARTICIPATION_COMPOSITION.md`](./APPLICATION_PARTICIPATION_COMPOSITION.md)  
**Internal app interop (separate):** [`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md)  
**Partner Vssyl modules (separate):** [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)

---

## Purpose

Define how Vssyl treats **external systems** (accounting, payroll, POS, ecommerce, productivity suites, industry operational systems, and other non-Vssyl software) as optional, governed participants that may remain systems of record.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Minimal conceptual contract | Vendor-specific requirements |
| External SoR preservation | Building connector code or schemas |
| Read/action/provenance/failure/disconnect semantics | Choosing sync intervals or protocols |
| Distinction from partner applications | Replacing domain-local adapters overnight |

---

## Architecture

### A. External system identity

Every connection must be conceptually identifiable as:

- **what** external system/connection it is (logical identity / type),
- **which** Vssyl user, business, or other authorized context **owns** the connection,
- **what scope** the connection applies to (personal vs business; narrower scopes as product defines).

Schema and storage are **not** prescribed here.

### B. Domain authority

Every integration must identify:

- which domain/data the **external system remains authoritative** for,
- what Vssyl is permitted to **consume** (reads/projections),
- what Vssyl is permitted to **act upon** (writes through the external system).

Connecting a system **must not** silently transfer SoR ownership to Vssyl. Shared capabilities that consume external contributions must not become shadow SoRs.

### C. Connection authority

Conceptually define:

- who may connect / configure / revoke the connection,
- whose credentials or delegated authorization are used,
- business vs personal scope of the connection,
- that disconnection/revocation stops further authorized use of those credentials.

Do not design OAuth or secret storage here unless an existing canonical auth/integration SoT already applies; reuse those owners when present.

### D. Read participation

An external system may contribute authorized:

- entities, signals, metrics, status, events, documents/data, relationships

Shared platform capabilities may consume those contributions **only under their own contracts** (Search, AI, Dashboard, Analytics, Notifications, V_Link, activity, workflows, etc.).

Examples (conceptual):

| External contribution | May feed | SoR remains |
|-----------------------|----------|-------------|
| Accounting balances | Analytics / Dashboard projection | External accounting |
| POS signal | Dashboard / notifications | External POS |
| External document | Unified Search **if** Search contract is satisfied | External document store |

There is **no** “everything automatically participates” rule.

### E. Action participation

Where supported, Vssyl may perform permitted actions **through** the authoritative external system:

- action authority must be **explicit** (not inferred from connection alone),
- Vssyl cannot grant the actor more authority than the actor/connection possesses,
- success/failure must reflect the **source system**,
- Vssyl must not pretend an external mutation succeeded without source confirmation.

### F. Freshness / provenance

External contributions must preserve enough metadata to understand:

- **source / provenance**,
- **freshness or observation time**,
- synchronization / retrieval mode where relevant (live fetch vs last known snapshot).

Do **not** mandate one universal sync interval.

### G. Failure / degraded state

If the external system is unavailable:

- Vssyl must distinguish **stale/cached** information from **confirmed live** truth where both exist,
- Vssyl must **not manufacture** current state,
- actions that require the source may be **unavailable**,
- domain ownership **remains external**.

### H. Disconnect behavior

When disconnected:

- future access stops,
- authorization/token usage for that connection stops,
- cached/derived information follows retention/lifecycle policy (not designed here),
- Vssyl must **not** silently become the new SoR for that domain.

### I. Tenant / context isolation

External contributions remain subject to:

- Personal / Business (and other) context boundaries,
- tenant scope,
- Policy Engine / authorization,
- owning capability contracts.

Connecting an integration is **not** authorization for every participant in the tenant.

### J. Platform capability participation

External systems may participate through existing Vssyl capabilities **where eligible and contracted**:

| Capability | Owner |
|------------|-------|
| Unified Search | Search Constitution + SearchProvider model |
| AI context / actions | AI context assembly + execution architecture |
| Dashboard projections | Personal Dashboard widget contract (bespoke; no DashboardProvider) |
| Analytics | Analytics status / ownership |
| Notifications | Notification metadata guide |
| V_Link | V_Link architecture |
| Events / activity | Domain events + module activity |
| Realtime | [`REALTIME.md`](./REALTIME.md) |

Each capability’s own contract governs inclusion, AuthZ, and projection rules.

### K. External system vs partner Vssyl application

| | Partner Vssyl application | External system |
|--|---------------------------|-----------------|
| Where it lives | Inside Vssyl application ecosystem / partner runtime | Independently outside Vssyl |
| Completeness bar | Lifecycle, sandbox, security, certification, truthful capabilities | Connection authority + domain authority + this contract |
| SoR | May be SoR **inside** Vssyl for its domain | Often remains **external** SoR |
| Contract owner | Third-party module pipeline + moduleSpecs | **This document** |

A single vendor could theoretically provide both a partner module and an external system; the **architectural roles remain distinct**.

### L. Complexity rule

End-user configuration should expose **business meaning**: source choice, permissions, connection status, and relevant options — not raw integration architecture. Platform complexity belongs to Vssyl, not the customer.

---

## Responsibilities

| Layer | Owner | Must / must not |
|-------|-------|-----------------|
| External interop contract | This document | Must preserve external SoR; must not invent runtime |
| Connection UX / product | Product + guides (future) | Must hide unnecessary complexity |
| Capability consumers | Per-capability SoTs | Must AuthZ and not shadow SoR |
| Domain-local adapters (today) | Owning domains | May exist; must align toward this contract over time |

---

## Reference Implementation

**None platform-wide** as of Phase 3B. Domain-local integrations (e.g. storage, HR sync) may exist and are **not** proof of a complete platform connector subsystem.

---

## Source of Truth

This document is SoT for **external-system interoperability architecture**. Partner modules and internal module interop remain under their existing owners.

---

## Certification Status

N/A (architecture contract). Future connector implementations must be certified against this contract plus the capability contracts they claim.

**Last updated:** 2026-09-08
