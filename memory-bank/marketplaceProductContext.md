# Marketplace Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Application / discovery–install surface  
**Architecture:** Application Lifecycle, Marketplace partner pipeline / cert records, Policy Engine

---

## Purpose

**Marketplace** is the user- and business-facing place to:

- **discover** applications and capabilities
- **evaluate** them
- understand **trust / approval** expectations
- **initiate installation** into supported personal or business contexts

It fosters a first-party and third-party extensibility ecosystem without owning the entire application lifecycle or the developer authoring console.

## User Value

- Find apps that extend Vssyl without leaving the platform
- See what is available for personal vs business use where supported
- Install with clear expectations that untrusted apps are not silently activated
- Keep discovery separate from day-to-day “manage my installed apps” work

## Core Product Model

Durable concepts:

- **Catalog / discovery** — browse and search installable applications
- **Evaluation** — enough product information to decide (description, trust posture, suitability)
- **Trust / governance expectations** — apps are expected to pass approval/certification before they are trusted for activation
- **Install initiation** — start install into a supported context
- **Ecosystem** — first-party and third-party applications that integrate into Vssyl workflows rather than reinventing the platform

Marketplace is not the system of record for every module’s internal data.

## Context Behavior

- Available where the product exposes Marketplace for personal and/or business scopes.
- After install initiation, users manage installed applications through **Application Manager / Application Lifecycle** surfaces — not by treating Marketplace as the permanent home for every lifecycle action.
- Installed apps appear or are assigned via **Dashboard / application assignment** UX — Marketplace does not own tab/home assignment.

## Key Relationships

| Surface | Product meaning |
|--------|------------------|
| **Marketplace** | Discover, evaluate, initiate install |
| **Application Manager / Lifecycle** | Installed state and lifecycle management |
| **Dashboard / application assignment** | Where installed apps are presented or assigned |
| **Developer Portal** | Author, submit, publish, monetize (creator side) |
| **Platform Admin Portal** | Approve, certify, govern (operator side) |

**Developer boundary:** Marketplace and Developer experience are **adjacent but distinct current surfaces**.

- Marketplace = **consumer / buyer** side  
- Developer = **creator / publisher** side  

Long-term consolidation remains an open product decision. This batch does not merge them.

**Admin boundary:** Platform Admin may certify/approve; Marketplace owns catalog/discovery UX.

## Product Invariants

- Changing install plumbing must not make Marketplace own Dashboard application assignment.
- Trust expectations remain part of the product story even when certification UI lives partly in Platform Admin.
- First-party and third-party apps share the same discovery/install product contract at the experience level.
- Developer publishing is not redefined as Marketplace ownership merely because both touch modules.

## Boundaries

Marketplace does **not** own:

- Full submit → review → monitor pipeline as a single Marketplace product
- Developer authoring, submission console, or monetization
- Platform Admin certification/governance operations
- Application Lifecycle state machine / enable-disable mechanics (architecture)
- Dashboard tab / widget **application assignment**
- Module-local configuration after install (module / Application Manager configure)
- Personal Settings or Business Administration

## Open Product Decisions

1. Whether Developer Portal remains permanently separate or eventually integrates more tightly with Marketplace.
2. Depth of evaluation UX (screenshots, permissions summaries, recommendations) as durable product law vs progressive enhancement.
3. How strongly personal vs business availability is presented as first-class product structure.
4. Licensing / purchase experiences before install (product vs commercial track).

## Canonical References

- [`docs/architecture/APPLICATION_LIFECYCLE.md`](../docs/architecture/APPLICATION_LIFECYCLE.md)
- [`docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)
- [`docs/marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md`](../docs/marketplace/MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md)
- [`memory-bank/adminProductContext.md`](./adminProductContext.md) — operator certification
- [`memory-bank/developerProductContext.md`](./developerProductContext.md) — creator side (do not treat as merged)
- [`memory-bank/dashboardProductContext.md`](./dashboardProductContext.md) — application assignment
