# Place Commerce Boundary

**Module id:** `place`  
**Status:** Architecture law (Wave 4A — 2026-06-02)  
**Audience:** Council review, module developers, product  
**Related:** [PLACE_PRODUCT_ARCHITECTURE_REVIEW.md](./PLACE_PRODUCT_ARCHITECTURE_REVIEW.md), [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md), [PLACE_PATTERN_GUIDE.md](./PLACE_PATTERN_GUIDE.md)

---

## Purpose

Define **what Place owns** in commerce and marketplace-adjacent flows versus what belongs in Business, Analytics, HR/Vendor (future), or external systems. This boundary prevents Place from becoming an ERP, procurement suite, or payment processor while preserving its role as the **external market graph and routing layer**.

---

## Place owns

| Concern | Runtime artifacts | Rationale |
|---------|-------------------|-----------|
| **Discovery** | Explore, for-you, local discovery, categories, search provider | Users find verified businesses in the **external** graph — not internal workspace content |
| **Storefront presence** | `BusinessPlaceListing`, cover/avatar, tags, publish flags | Business **presentation** on Main Street; identity/EIN stays in Business domain |
| **Referrals & routing** | `BusinessInteractionLink`, upsert links, AI purchase/reservation help | Route users to **external** ordering/booking/reservation URLs — Place is a router, not a cart |
| **Interaction telemetry** | `PlaceInteractionClick`, optional `PlaceTransaction` records | Lightweight history of **clicks and declared off-platform purchases** — not ledger accounting |
| **Meeting coordination** | `PlaceMeetingPlace`, invites, RSVP, location privacy, Calendar link | Social coordination at a **location**; Calendar owns the event record |
| **Graph membership** | `PlaceNode`, `BusinessFollow`, connection mirror | User-curated relationship to external orgs/people |
| **Follower analytics (private)** | `PlaceAnalyticsSnapshot`, business-scoped insights | **Private** to listing owner — no public vanity metrics |

**Constitutional contract:** `authorize → execute → emit → notify/realtime` on listing/graph/meeting writes. Commerce **telemetry** rows use PE but intentionally omit activity/domain events today (documented **P** — punch-list PL-H2).

---

## Place does NOT own

| Concern | Owner | Why not Place |
|---------|-------|---------------|
| **Payment processing** | External PSP (Stripe fields exist for future integration) + future Payments module | PCI, settlement, refunds, chargebacks — platform payment domain |
| **Purchase orders** | ERP / future Procurement | PO numbering, approval chains, receiving — enterprise workflow |
| **Invoices & AP** | Finance / ERP | GL posting, tax lines, three-way match |
| **Procurement workflows** | HR / future **Vendor** module | RFP, vendor onboarding, contract lifecycle, scorecards |
| **Vendor master data** | Business + future Vendor module | Approved vendor lists, spend caps, compliance docs |
| **Contracts & legal PDFs** | **File Hub** + Notebook | Storage and collaboration on contract artifacts |
| **Work items (contact vendor, RFP tasks)** | **Todo** | Task assignment, due dates, completion |
| **Official scheduling of record** | **Calendar** | Place meetings **link** events; do not bypass `calendarEventService` |
| **Clinical / ops compliance logs** | **Notebook**, **Analytics** | Survey prep, infection trends — internal operations |
| **In-platform checkout / cart** | **Deferred** — not Place today | Full marketplace checkout is a future product decision, not current Place scope |

---

## Routing vs purchasing (decision rule)

```
User intent: "I want to order from this vendor"
  → Place: show listing + interaction link + optional AI help finding the link
  → External: user completes purchase on vendor site / DoorDash / OpenTable / etc.
  → Place (optional): user logs transaction or click is tracked automatically

User intent: "Approve PO #4421 and pay invoice"
  → NOT Place — Vendor/ERP/Finance modules
```

---

## Verification lifecycle (Place scope)

| Stage | Place role | Business domain role |
|-------|------------|---------------------|
| EIN / business verification | **Gate** explore/search via `einVerified` read | Business owns verification record |
| Listing publish | Admin writes listing; `isPublished` + enabled flags | Business membership for admin auth |
| Content moderation | `reportListing` → platform `ContentReport` | Moderator workflow outside Place module |
| Listing trash | `placeTrashService` + Global Trash | Same as other certified entities |

Place does **not** perform vendor **qualification** (insurance certs, SAM.gov, performance reviews).

---

## Search lifecycle (Place scope)

| Surface | Owner | Notes |
|---------|-------|-------|
| Federated listing search | `placeVisibilityService` + search provider | Published + verified listings only |
| Explore / profile reads | `placeVisibilityService` | Visibility-scoped; read PE partial (PL-H3) |
| Global platform search index | Platform search controller | Place registers provider — does not index Drive/Chat |

---

## Transaction model (intentional partial)

`PlaceTransaction` stores **user-declared or imported** purchase history for personal insights — not authoritative financial records.

| Property | Implication |
|----------|-------------|
| No payment webhook ingestion in Place core | Not a payment processor |
| PE on writes (`placeTransactionService`) | AuthZ present; activity/events deferred (PL-H2) |
| `/place/transactions` UX | Personal history — not AP clerk workflow |

**Council note:** Promoting Place to Reference #5 does **not** require Place to own payments. The teachable pattern is **commerce routing + telemetry boundary**, not ERP replacement.

---

## Anti-patterns (do not add to Place)

1. PO approval state machine in `placeListingService`
2. Invoice PDF generation in Place controllers
3. Vendor onboarding checklist persistence in Place schema
4. Direct `prisma.event` create bypassing Calendar (fixed in Wave 1D — do not regress)
5. Public follower counts on explore cards (violates product principle)

---

## Evidence links

- [PLACE_OPERATION_MATRIX.md](./audits/PLACE_OPERATION_MATRIX.md) — transaction rows **P**
- [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md) — PL-H2 punch-list
- [PLACE_DOMAIN_MODEL.md](./PLACE_DOMAIN_MODEL.md) — aggregate roots §2–3

---

*Wave 4A commerce boundary — governance only, 2026-06-02.*
