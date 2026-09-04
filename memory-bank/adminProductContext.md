# Admin Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Platform operator admin surface  
**Architecture:** Admin Portal reference/status records, Policy Engine, Marketplace partner pipeline

---

## Purpose

**Admin** in this ProductContext means the **Vssyl Platform Admin Portal** — the operator control plane used by authorized **Vssyl platform operators**.

It is **not** an installable application, **not** Business Administration, and **not** how business owners run their companies.

## User Value

- Govern the platform: users, moderation, and operational health
- Oversee application/module certification and trust decisions
- Intervene safely when support, security, or compliance require operator action
- Rely on live operational data and gated dangerous actions

## Core Product Model

Durable operator concerns:

- **Platform governance** — how the platform is overseen as a whole
- **Platform-user / operator oversight** — accounts and operator-visible user state
- **Moderation** — reports, takedowns, and related review queues
- **Application / module certification oversight** — approve or reject trust for apps entering the ecosystem
- **Security and operational gates** — safeguards around high-risk operator actions
- **Operator audit / history** — who did what in the control plane
- **Trustworthy live operational data** — no mock-fallback posture for operator decisions

## Context Behavior

- Experienced as a dedicated **Platform Admin Portal** surface (not a Marketplace module and not a business workspace app).
- Access is limited to authorized platform operators under platform auth / current authorization architecture.
- Module-specific administration stays inside the owning module; tenant business configuration stays in Business Administration / business-admin surfaces.

## Key Relationships

- **Marketplace:** Admin may **approve/certify** applications. Admin does **not** own buyer discovery/catalog UX.
- **Developer Portal:** Adjacent creator/publisher surface; Admin does not own authoring or monetization.
- **Analytics (product capability):** Distinct from **operator metrics** shown in the Portal. Operator telemetry is not product Analytics.
- **Policy Engine / platform auth:** Canonical authority for protected actions. This ProductContext does not invent Admin-specific authorization law.
- **Members / Business Administration / Settings:** Separate products/surfaces — see Boundaries.

## Product Invariants

- Platform Admin Portal is **not** an installable Marketplace / Application Manager module.
- Business owners must not depend on the Platform Admin Portal to configure or run their business.
- Changing operator UI layout must not collapse Admin into Business Administration or personal Settings.
- Dangerous operator actions remain gated and auditable as product posture.

## Boundaries

Platform Admin Portal does **not** own:

- **Business Administration** (org chart, business configuration, tenant governance)
- Business-owner configuration of a tenant
- Organizational hierarchy management
- Tenant **member management** (Members)
- Module-local administration inside applications
- Personal **Settings** / preferences
- Marketplace catalog / discovery / install initiation UX
- Product Analytics capability (Dashboard-facing reporting/insight)
- Application Lifecycle install state as Application Manager

## Open Product Decisions

1. How far operator “business intelligence” style views should go inside the Portal versus remaining out of scope.
2. Residual product-level questions about Admin vs Business Administration surfaces (hosting vs ownership) as business-admin UX evolves.
3. Exact long-term split of certification UX between Portal and Marketplace (approval ownership stays Admin; catalog stays Marketplace).

## Canonical References

- [`docs/architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md`](../docs/architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md)
- [`docs/guides/ADMIN_PORTAL.md`](../docs/guides/ADMIN_PORTAL.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
- [`docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)
- Marketplace / Developer / Analytics ProductContexts (adjacent fences)
