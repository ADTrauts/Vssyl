# Settings Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Cross-cutting personal preference capability  
**Architecture:** Account / profile surfaces; notification preference patterns where applicable

---

## Purpose

**Settings** is the individual’s place for **personal and account preferences** — how *I* configure my experience — not how a business or the platform is administered.

## User Value

- Control account and profile details in one coherent preference experience
- Adjust appearance and personal configuration without entering Business Administration
- Manage photos/avatars and related profile representations safely across contexts
- Choose notification preferences for what *I* receive (delivery infrastructure stays elsewhere)

## Core Product Model

Settings primarily owns:

- **Individual / account preferences**
- **Profile preferences** and personal profile configuration
- **Appearance / personal configuration**
- **Photos / avatar preferences**
- **Personal location / profile settings** where the product supports them
- **Preference extensibility** — durable pattern for user-scoped preference keys
- **Notification preference controls** — what the user chooses to receive (not how notifications are delivered)

## Where It Appears

- Personal profile / settings surfaces in the user’s shell (e.g. profile settings sections for account, photos, location, preferences)
- Links from Settings to module-local configuration are allowed; Settings does not absorb those modules’ config ownership

## Key Relationships

- **Business Administration:** Business/org configuration — **not** Settings.
- **Platform Admin Portal:** Operator control plane — **not** Settings.
- **Members:** Business participation — **not** personal preference ownership.
- **Marketplace / Application Manager:** Install and module configure — **not** Settings.
- **Notifications:** Delivery and typing infrastructure are platform/module-owned; Settings may host **receive preferences**.
- **Modules:** Module-local settings remain module-owned; Settings may deep-link.

## Product Invariants

- Personal preference ownership must not silently expand into business configuration.
- Where personal and business **avatar / profile representation slots** both exist, assigning one must not destructively clear the other.
- Changing preference storage implementation must not redefine Settings as Platform Admin or Business Administration.

## Boundaries

Settings does **not** own:

- Business Administration / organization configuration
- Platform Admin operator settings
- Module-local configuration (beyond linking)
- Notification infrastructure / delivery mechanics
- Application installation or application configuration
- Membership invites, org hierarchy, or employment data

## Open Product Decisions

1. Whether Settings remains **personal-only** or later gains explicit business-scoped preference surfaces (without absorbing Business Administration).
2. Product name emphasis: Settings vs Profile vs Preferences.
3. How much notification preference UX lives in Settings vs Notifications product surfaces.
4. Privacy/security preference depth as first-class Settings sections.

## Canonical References

- Account / profile routing and UX patterns in current product surfaces
- [`memory-bank/adminProductContext.md`](./adminProductContext.md) — Platform Admin fence
- [`memory-bank/memberManagementProductContext.md`](./memberManagementProductContext.md) — membership fence
- Notifications guides / ProductContext when notification preference ownership is refined
