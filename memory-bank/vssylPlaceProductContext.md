# Vssyl Place Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Place domain model, Place pattern guide, Place Level 3 / council reviews

---

## Purpose

**Vssyl Place** (`place`) is the **personal / external relationship and discovery** surface, often described through the **Main Street** metaphor: a user-curated neighborhood of physical and digital businesses—not a facilities map and not workforce Scheduling.

## User Value

- Curate the businesses and connections that matter instead of jumping across fragmented sites
- Discover verified listings with local-first suggestions and broader reach
- Follow and connect without vanity metrics culture
- Let businesses publish how they want to be found and interacted with
- Coordinate meetings socially while Calendar owns timed events when linked

## Core Product Model

### Main Street (personal graph)

- A person builds a **user-curated neighborhood** of places they care about.
- **Physical and digital** businesses coexist (corner store, remote shop, online-only service).
- Place is **not** a geographic distance map of facilities/rooms.
- **No vanity metrics** as product law: follower counts are not a public engagement scoreboard.
- **User control / privacy** over what appears and how discovery behaves.
- **Local-first discovery**, then global follow.

### Dual-surface model

| Surface | Product meaning |
|--------|------------------|
| **Consumer / personal Place** | Discovery and relationship view of someone’s neighborhood (explore, follow, meet, related feeds). |
| **Business publisher / listing** | How a business represents itself into that ecosystem (listing presence, interaction links, publish/unpublish). |

The publisher surface is **current product**, not a future-only idea.

### External graph / directory

Place is an:

- **external graph** of relationships to businesses/people in the neighborhood sense
- **directory / discovery** surface for verified listings
- **consumer ↔ business relationship** layer

It is not the internal business workspace, org chart, or File Hub folder tree.

### Meetings and communities

- **Meetings:** social coordination metadata (who/where/intent). When a Calendar **event** exists, **Calendar owns the Event**.
- **Communities:** bounded joinable groups where the product supports them.

### Commerce posture

Default product framing:

- interaction **links**
- **routing** to external experiences
- discovery and **telemetry / context**

Deeper in-graph purchase or reservation assistants are **not** established as shipped Place ownership of full checkout.

## Context Behavior

- **Personal:** Main Street / consumer Place.
- **Business:** Publisher listing and Place-related admin/workspace surfaces for how the business appears externally.
- Cross-surface: a person discovers/follows; a business publishes; transitions between consumer and publisher views are expected.

## Key Relationships

- **Business / Members:** Business identity and membership authority; Place mirrors into graph/listing—it does not fork ACL or membership.
- **Calendar:** Event SoR for linked meetings.
- **File Hub:** Listing imagery and related files via platform storage/File Hub patterns—not Place as a file product.
- **Chat / To-Do / Notebook:** Operational work “inside” a business remains those products; Place is not their system of record.
- **HR / Scheduling:** Do not own workforce org hierarchy, shifts, stations, or job locations.
- **AI:** May assist within Place authority; must not invent operational tasks outside Place.

## Product Invariants

- A Scheduling **work location / station** must not automatically become a Vssyl Place listing.
- Place must not become a facilities/rooms product merely because meetings have addresses.
- Changing commerce link/routing implementation must not silently claim Place owns full checkout.
- Dual-surface (consumer + publisher) remains part of the product model.
- Vanity-metric culture is out of product law for Place.

## Boundaries

Place does **not** own:

- Facilities, rooms, workstations
- Scheduling `BusinessStation` / `JobLocation` (or equivalent work resources)
- Workforce Scheduling or HR organizational hierarchy
- Business workspace tenancy / Application Lifecycle install
- Policy Engine
- Chat messaging
- To-Do work execution
- Calendar event SoR

## Open Product Decisions

1. Depth of **in-graph purchase / reservation** experiences vs outbound links + telemetry.
2. Long-term role of **map view** as primary discovery UX vs optional geographic aid.
3. Which community features are first-class invariants vs optional.
4. How strongly local-first discovery should bias ranking as permanent product law.

## Canonical References

- [`docs/architecture/PLACE_DOMAIN_MODEL.md`](../docs/architecture/PLACE_DOMAIN_MODEL.md)
- [`docs/architecture/PLACE_PATTERN_GUIDE.md`](../docs/architecture/PLACE_PATTERN_GUIDE.md)
- [`docs/architecture/audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md)
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — Reference Module #5
- Commerce boundary: [`docs/architecture/PLACE_COMMERCE_BOUNDARY.md`](../docs/architecture/PLACE_COMMERCE_BOUNDARY.md)
- [`memory-bank/schedulingProductContext.md`](./schedulingProductContext.md) — work locations ≠ Place
- [`memory-bank/calendarProductContext.md`](./calendarProductContext.md) — events
