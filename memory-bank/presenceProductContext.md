# Presence Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Cross-cutting real-time awareness capability

---

## Purpose

**Presence** is a **cross-cutting real-time awareness capability**: online / away / offline (and last seen where supported). Collaborative products **project** it; users do not primarily “open Presence” as an app.

## User Experience / Where It Appears

- Awareness indicators in **Chat**, threads, and other people-aware surfaces
- Not a required standalone navigation destination

## Relationships

- **Chat** projects presence; displaying it does not transfer conceptual ownership to Chat alone.
- **Notifications**, **activity/audit**, **Scheduling workforce availability**, and **Vssyl Place** are separate products/concepts.

## Product Invariants

- **Presence availability ≠ workforce (Scheduling) availability.**
- **Presence status ≠ Vssyl Place location or listing.**
- Presence remains a projected capability, not a content system of record.

## Boundaries

Presence does **not** own Chat messaging, Scheduling shifts/work availability, Place graph/geography, notification delivery, activity/audit history, or engagement analytics.

## Open Product Decisions

1. Keep a separate Presence ProductContext vs fold documentation into another capability (e.g. Chat).
2. Privacy / who can see whose online status.
3. Custom semantic states (e.g. “In a meeting”) — not current product law.
4. Global presence depth vs Chat-centric presence.

## Canonical References

- [`memory-bank/chatProductContext.md`](./chatProductContext.md)
- [`memory-bank/schedulingProductContext.md`](./schedulingProductContext.md)
- [`memory-bank/vssylPlaceProductContext.md`](./vssylPlaceProductContext.md)
