# V_Link Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Product–platform relationship bridge  
**Architecture:** [`docs/architecture/V_LINK.md`](../docs/architecture/V_LINK.md)

---

## Purpose

**V_Link** is Vssyl’s **relationship bridge**: user-curated associations across applications while each app remains the system of record for its entities. Optional hub UX; **not** a Marketplace module and **not** file sharing/ACL.

## User Experience

- Link related items across apps into navigable relationships
- Optional **hub** to browse V_Links
- AI may **suggest** links; **user approval** required before AI-created links are durable (current product law)

## Core Product Model

- Cross-application associations; user-curated by default
- Navigable/contextual linking from apps and hub
- Apps remain SoR for linked content; V_Link organizes relationships only

## Critical Invariant

**Link membership does not automatically grant access** to linked content. Authorization stays with the linked product and **Policy Engine** / current auth architecture.

## Relationships

- Linkable apps own their entities; V_Link does not absorb SoR
- AI may ground on approved V_Links; suggestions need approval
- Global Trash ≠ V_Link archive UX
- People connections (Members) ≠ V_Link entity associations

## Product Invariants

- Membership on a V_Link ≠ content access
- Hub UX changes must not turn V_Link into a Marketplace module or ACL system
- No silent AI durable linking without approval (current law)

## Boundaries

Not file sharing/ACL, Global Trash, replacement SoR, app-local operational links, Drive/Calendar/Chat/To-Do/Place ownership, Platform Admin, or Marketplace install.

## Open Product Decisions

1. `/vlink` as **primary hub UX** vs mostly **contextual utility**
2. Secondary / multi-link depth beyond primary-link product law
3. Which additional entity types become first-class link targets over time

## Canonical References

- [`docs/architecture/V_LINK.md`](../docs/architecture/V_LINK.md)
- [`docs/architecture/PLATFORM_ENTITY_MODEL.md`](../docs/architecture/PLATFORM_ENTITY_MODEL.md)
- [`docs/architecture/RELATIONSHIP_FRAMEWORK_INDEX.md`](../docs/architecture/RELATIONSHIP_FRAMEWORK_INDEX.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
