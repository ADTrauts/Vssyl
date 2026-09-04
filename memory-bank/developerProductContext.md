# Developer Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Creator / publisher surface  
**Architecture:** Third-party module pipeline, Application Lifecycle, Platform Admin certification, Policy Engine

---

## Purpose

**Developer** is the **creator/publisher side** of the Vssyl application ecosystem: where people and businesses **author, submit, publish, and understand creator-side outcomes** for applications that extend Vssyl.

It is adjacent to Marketplace (discover/install) and Platform Admin (approve/certify), not a substitute for either.

## User Value

- A coherent place to bring an application into the Vssyl ecosystem
- Clear expectation that publishing is business-scoped where the product requires a business publisher
- Visibility into submission and certification **status** without owning approval authority
- Awareness of creator-side monetization where the product supports it
- Secure creator access — publisher tools are not a general-user surface

## Core Product Model

Durable creator concepts:

- **Authoring / packaging** an application for Vssyl (product-level: prepare something installable)
- **Submission** into the platform review path
- **Publishing** — making an approved application available to the ecosystem (catalog eligibility), not silent activation of untrusted code
- **Creator dashboard** — status, listings, and creator-facing outcomes for the publisher’s applications
- **Monetization awareness** — pricing/revenue visibility where product-supported (economics boundaries may still be open)
- **Trust experience** — creators see certification/approval state; they do not perform platform certification

### Publish (product meaning)

**Publish** means the creator’s application is advanced into the ecosystem as an available offering after platform trust gates — not “install for myself,” and not “approve as Platform Admin.”

## Product Fence

| Surface | Product meaning |
|--------|------------------|
| **Marketplace** | Discover / evaluate / initiate install (consumer / buyer side) |
| **Developer** | Author / submit / publish / creator-side monetization |
| **Platform Admin** | Approve / certify / govern |
| **Application Lifecycle / Manager** | Installed state and lifecycle after install initiation |

Developer may **surface** certification status. Developer does **not** own approval authority.

## Context Behavior

- Creator work is typically **business-scoped** (publisher business) where the product requires linking submissions to a business.
- Global or personal entry points may exist as navigation convenience; they do not redefine Marketplace ownership.
- After install initiation by users, day-to-day installed lifecycle lives in Application Manager / Lifecycle — not Developer.

## Key Relationships

- **Marketplace:** Adjacent consumer surface; do not merge product ownership.
- **Platform Admin:** Certification and governance; creators consume status, admins decide trust.
- **Application Lifecycle:** Installed state after Marketplace install initiation.
- **Policy Engine:** Access to creator surfaces and protected publisher actions.
- **Business Administration:** Publisher business identity/context — not the developer console itself.

## Product Invariants

- Marketplace discovery/install must not absorb creator authoring/publishing ownership.
- Certification status visibility must not imply that Developer owns approval.
- Creator access remains restricted; publisher tools are not general Settings or Member admin.
- Changing pipeline implementation must not erase the buyer vs creator product fence.

## Boundaries

Developer does **not** own:

- Marketplace catalog / discovery / install initiation UX
- Platform Admin approve/certify operations
- Application Lifecycle install/enable/disable state machine
- Policy Engine / authorization architecture
- Module runtime, manifests, sandbox, or API schemas as product philosophy
- End-user application configuration after install

## Open Product Decisions

1. Long-term consolidation of Developer ↔ Marketplace surfaces (default today: **keep separate**).
2. Exact creator persona mix (individual developers vs business publishers vs partners) as permanent product framing.
3. Monetization / product-economics boundaries that remain unresolved commercially.

## Canonical References

- [`memory-bank/marketplaceProductContext.md`](./marketplaceProductContext.md) — discover / install
- [`memory-bank/adminProductContext.md`](./adminProductContext.md) — Platform Admin
- [`docs/architecture/APPLICATION_LIFECYCLE.md`](../docs/architecture/APPLICATION_LIFECYCLE.md)
- [`docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
