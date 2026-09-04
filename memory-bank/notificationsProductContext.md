# Notifications Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Cross-cutting attention capability (+ persistent consumption surface)  
**Architecture:** Notification metadata guide, Platform Standards notify path, Policy Engine / tenancy for delivery scope

---

## Purpose

**Notifications** help people understand **what needs attention**, **why**, **how important it is**, **which context it belongs to**, and **whether action is required**.

Notifications is a **cross-cutting attention capability** with a **persistent inbox/center**. It is not a standalone domain application like Chat or File Hub, and it is not Settings.

## User Value

- One reliable place to review attention items across applications
- Timely notice without treating every event as an interruption
- Clear source/context so users know where to go next
- Control over what they receive and how (preferences)
- Actionable items when the originating product supports it

## Core Product Model

| Concept | Product meaning |
|--------|------------------|
| **Notification intention** | An emitting product/module decides something deserves user attention |
| **Notifications capability** | Turns that intention into user-facing attention state and experience |
| **Delivery** | Channels such as in-app, email, push (as supported) |
| **Persistent inbox / center** | History and consumption surface (read/unread, archive-style management where supported) |
| **Preferences** | What the user chooses to receive; often hosted in Settings |
| **Toast** | Ephemeral feedback — not a substitute for persistent attention |

### Ownership

| Owner | Responsibility |
|-------|----------------|
| **Emitting product/module** | The event/condition that deserves attention; declares notification types/metadata |
| **Notifications** | User-facing attention, inbox/history, notification state, delivery experience |
| **Settings** | Hosts or owns **preference controls** where appropriate — **not** delivery |
| **Activity / audit** | Historical system/domain record of what happened — **not** Notifications |

## Attention Philosophy

Notifications should not become an endless event dump.

Where the product supports it:

- Prefer **relevance over volume**
- Keep **interruption proportional to urgency**
- Show **clear context and source**
- Prefer **actionable** items when the originating product can supply actions
- Keep **persistent** items available after a toast is dismissed
- Honor **user preference and control** (including quiet / do-not-disturb style controls where supported)

Do not invent ranking or AI prioritization as product law unless separately established.

## Context Behavior

- Notifications carry **personal vs business (and other) context** so attention stays scoped.
- Unread state and badges communicate unfinished attention without replacing the originating application.
- Real-time delivery may refresh the center; delivery mechanics are implementation, not product ownership of emitting modules.

## Key Relationships

- **Modules / applications:** Emit notification intentions; remain systems of record for the underlying work.
- **Settings:** Preference UX for what/how the user receives attention.
- **Activity / domain events:** Historical “what happened”; may inform products but are not the notification inbox.
- **Chat / File Hub / HR / Calendar / etc.:** Common emitters; none absorb Notifications ownership.
- **Policy Engine / tenancy:** Delivery and visibility remain within authorized scope.

## Product Invariants

- Toast dismissal must not erase the product expectation of a **persistent** attention record for non-ephemeral items.
- Changing delivery plumbing must not merge Notifications into Settings or Activity.
- Emitting modules must not each invent a competing personal inbox as the primary attention model.
- Failed or unauthorized actions must not produce success-side user attention as if the action succeeded (aligns with module interoperability).

## Boundaries

Notifications does **not** own:

- Settings / account preference product as a whole
- Activity feeds, analytics, or security audit logs
- Chat conversations or File Hub files as systems of record
- Module business rules that create the underlying condition
- Platform Admin operator tooling

## Open Product Decisions

1. How much preference UX lives primarily in Settings vs Notifications surfaces.
2. Whether the inbox is primarily a global destination, an embedded shell surface, or both as first-class product.
3. Digests, SMS, or third-party channels as committed product vs future direction.

## Canonical References

- [`docs/guides/NOTIFICATION_METADATA_GUIDE.md`](../docs/guides/NOTIFICATION_METADATA_GUIDE.md)
- [`docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`](../docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md) — Notifications row
- [`memory-bank/settingsProductContext.md`](./settingsProductContext.md) — preference fence
- [`memory-bank/moduleSpecs.md`](./moduleSpecs.md) — notify after authorized success
- [`docs/architecture/DOMAIN_EVENTS.md`](../docs/architecture/DOMAIN_EVENTS.md) — activity/events ≠ inbox
