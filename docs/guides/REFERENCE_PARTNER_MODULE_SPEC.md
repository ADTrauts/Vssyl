# Reference Partner Module — Asset Register

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Status:** Specification only — **no code in Vssyl repo**  
**Manifest:** [full-capability-partner-module.json](./full-capability-partner-module.json)

---

## 1. Overview

**Asset Register** is the canonical reference for a **full-capability business partner module**. Build this on **your infrastructure**; use the manifest and this spec as the contract checklist.

| Property | Value |
|----------|-------|
| Module name | Asset Register |
| Suggested module id | `asset-register` (slug at submit time) |
| `moduleScope` | `business` |
| `pricingTier` | `free` (pilot) |
| Primary entity | `asset` |
| Secondary entity | `location` (search only) |

---

## 2. Searchable entities

### Asset

| Field | Role |
|-------|------|
| `id` | Stable partner SoR id (e.g. `asset-001`) |
| `title` | Display name (search title) |
| `tag` | Asset tag / barcode |
| `status` | `active`, `retired`, `maintenance` |
| `locationId` | Optional link to location |
| `custodianUserId` | Current assignee |

**Search delegate:** Return assets matching query on title, tag, description. Filter by JWT `businessId`.

### Location

| Field | Role |
|-------|------|
| `id` | Stable id |
| `name` | Warehouse, bay, site name |

Searchable for "bay 3" style queries; no activity ingest required for location in minimal pilot.

---

## 3. Workspace embedding

| Aspect | Spec |
|--------|------|
| UI | Single-page app at `frontend.entryUrl` |
| Routes | List view, asset detail, checkout flow |
| Init | Listen for workspace bridge init; read `businessId` from JWT |
| Theme | Honor `theme.mode` from host init |
| Lifecycle | On `deactivate`, cancel polling / websockets |

**User stories:**

- Business member opens **Asset Register** tab in business workspace
- Sees assets scoped to their business
- Checks out asset → triggers activity ingest

---

## 4. Activity events

| Action | Trigger | Target | Sample metadata |
|--------|---------|--------|-----------------|
| `create` | New asset | `asset/{id}` | `{ "label", "tag" }` |
| `update` | Field edit | `asset/{id}` | `{ "fields": ["status"] }` |
| `assign` | Custody change | `asset/{id}` | `{ "custodianId" }` |
| `checked_out` | Checkout | `asset/{id}` | `{ "dueAt" }` |
| `maintenance_scheduled` | Maintenance booked | `asset/{id}` | `{ "scheduledAt" }` |
| `retire` | Decommission | `asset/{id}` | `{ "reason" }` |

All events: business scope, unique `idempotencyKey` per logical event.

---

## 5. Business billing

| Tier | Pilot behavior |
|------|----------------|
| **Free** | `pricingTier: free` — auto `BusinessModuleSubscription` on install |
| **Premium** (future) | Requires Stripe price id + subscribe before install |

Pilot validates **free path** only unless operator configures paid test.

---

## 6. Scope configuration

```json
{
  "moduleScope": "business",
  "supportedContexts": ["business"],
  "searchDelegate": { "supportedContexts": ["business"] },
  "workspaceParticipation": { "supportedContexts": ["business"] },
  "activityIngest": { "supportedContexts": ["business"] }
}
```

**Not supported in reference:** personal dashboard install, household context.

---

## 7. Partner-hosted endpoints

Replace example URLs in manifest with your production HTTPS endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `.../vssyl/search-delegate` | POST | Search Delegate |
| `.../vssyl/ai/context/asset-summary` | GET | AI context provider (optional but recommended) |
| iframe `index.html` | GET | Workspace UI |

Activity ingest and workspace bridge use **Vssyl platform APIs** — you implement the **client** side only.

---

## 8. Minimum viable vs full reference

| Feature | MVP external pilot | Full reference |
|---------|-------------------|----------------|
| iframe runtime | Required | Required |
| Workspace bridge | Required | Required |
| Search delegate | Required | Required |
| Activity ingest | Required (≥2 actions) | All 6 actions |
| AI context | Recommended | Full provider |
| Paid billing | Optional | Documented |

---

## 9. Validation checklist

Before submit, complete [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md) sections 1–6.

---

## 10. Related docs

- [PARTNER_DEVELOPER_GUIDE.md](./PARTNER_DEVELOPER_GUIDE.md)
- Capability guides: Search, Workspace, Activity, Billing, Scope
- [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)

**Last updated:** 2026-06-24
