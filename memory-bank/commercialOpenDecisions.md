# Commercial Open Decisions

**Status:** Explicitly unresolved commercial-policy register — **not** pricing SoT, roadmap, GTM plan, sales strategy, or billing architecture.

## Purpose

Park durable commercial **constraints** and **open product decisions** so agents do not treat historical Memory Bank pricing plans as current policy.

- Unresolved unless marked as a settled constraint.
- Old MB prices, tiers, commissions, AI packs, and projections are **historical**.
- Billing/entitlement **capability** ≠ desired commercial policy.
- Does **not** override ProductContexts, architecture, or PP-3 implementation.
- Exact prices and packaging require **human product decisions**.

---

## Settled constraints

### One product family (no enterprise forks)

Enterprise needs should **enhance** the existing Vssyl application/module family (governance, permissions, integrations, support/service, configuration, compliance, entitlements, packaging) — **not** create separate “enterprise versions” of HR, Scheduling, Analytics, etc.

### Marketplace / Developer / Admin boundary

| Surface | Owns |
|---------|------|
| **Marketplace** | Discover / evaluate / install |
| **Developer** | Creator authoring / publishing / monetization **awareness** |
| **Platform Admin** | Approval / certification |
| **Module lifecycle** | Installed-state / lifecycle truth |

### Implementation ≠ commercial policy

Personal/business subscriptions, entitlements, module subscriptions, or an `enterprise` entitlement **token** prove capability — not prices, packaging, or sales model.

### Old pricing is historical

Literal historical prices, seats, packs, commissions, limits, add-ons, and projections from retired MB plans are **not** active product policy. Archives: `docs/archive/stripe-merged-2026/` + MB redirects.

---

## Open commercial decisions

| Topic | Status |
|-------|--------|
| Free / paid structure (permanent free? Personal/Business includes?) | **Open** |
| Primary pricing unit (person / business / hybrid / module components) | **Open** — no selection |
| Enterprise commercial meaning (sales, contract, governance, support, tier, combo) | **Open** — entitlement vocab ≠ doctrine |
| Per-module premium packaging | **Open** — capability ≠ policy; not every advanced feature is a SKU |
| Creator economics (eligibility, share, payouts, providers) | **Open direction** — monetization possible; Developer = creator surface; no historical % as policy |
| AI monetization (included / gated / metered / packs / hybrid) | **Open** — old query-pack mechanics ≠ policy |

---

## Capability vs policy

| Implementation capability | Product policy |
|---------------------------|----------------|
| Personal / business subs & entitlements | Open packaging & price |
| Module subscriptions | Open commercial use |
| `enterprise` entitlement vocabulary | Open commercial meaning |
| Creator revenue ledger / payout plumbing | Open creator economics |

---

## Canonical pointers

| Concern | Owner |
|---------|--------|
| Billing / entitlements impl | [`PP3_BILLING_SERVICE_MODEL.md`](../docs/account-platform/PP3_BILLING_SERVICE_MODEL.md), [`PP3_ENTITLEMENT_ARCHITECTURE.md`](../docs/account-platform/PP3_ENTITLEMENT_ARCHITECTURE.md) + code |
| Stripe ops | [`STRIPE_SETUP_GUIDE.md`](../docs/setup/STRIPE_SETUP_GUIDE.md) (config ≠ policy) |
| Marketplace / Developer | [`marketplaceProductContext.md`](./marketplaceProductContext.md), [`developerProductContext.md`](./developerProductContext.md) |
| Modules / authz | [`moduleSpecs.md`](./moduleSpecs.md), [`POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md) |
| Wishlist (non-authoritative) | [`futureIdeas.md`](./futureIdeas.md) |
| Root identity | Later — this register is **not** root identity |

Authorization remains **Policy Engine**. Commercial open decisions do not grant access.
