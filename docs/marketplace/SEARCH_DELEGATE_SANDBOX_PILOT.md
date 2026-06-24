# Search Delegate — Sandbox Pilot (`vssyl-pilot-assets`)

**Program:** Marketplace & Module Ecosystem — Phase 1B-B  
**Date:** 2026-06-24  
**Status:** **Active sandbox pilot** (internal delegate, feature-flagged)

---

## 1. Purpose

Prove the Search Delegate runtime path end-to-end without a live partner HTTPS endpoint. The pilot simulates an **Asset Management** partner module with business-scoped searchable assets.

---

## 2. Pilot identity

| Field | Value |
|-------|-------|
| Module ID | `vssyl-pilot-assets` |
| Context | Business only |
| Delegate URL | `vssyl-internal://sandbox/vssyl-pilot-assets/search` |
| Entity type | `asset` |
| Tier | Free (sandbox) |

Internal URLs are handled in-process by `executeSandboxPilotAssetsSearch()` — no outbound HTTP.

---

## 3. Sandbox data

In-memory assets in `server/src/marketplace/sandboxPilotAssetsSearch.ts`:

| Business ID | Sample assets |
|-------------|---------------|
| `sandbox-business-a` | Forklift #12, Pallet Jack #3 |
| `sandbox-business-b` | Laptop #44 |

Cross-tenant isolation: queries scoped to `filters.context.businessId` return only that business's assets.

---

## 4. Enabling locally

```bash
# .env
PARTNER_SEARCH_DELEGATE_ENABLED=true
PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST=vssyl-pilot-assets
JWT_SECRET=<32+ char secret>
```

Restart the server. Search example:

```json
POST /api/search
{
  "query": "forklift",
  "filters": {
    "context": { "businessId": "sandbox-business-a" }
  }
}
```

Or filter by module:

```json
{
  "query": "forklift",
  "filters": {
    "moduleId": "vssyl-pilot-assets",
    "context": { "businessId": "sandbox-business-a" }
  }
}
```

---

## 5. Admin probe

```
GET /api/admin-portal/modules/vssyl-pilot-assets/search-delegate-probe?live=true&businessId=sandbox-business-a
```

Returns manifest validation, registration state, and optional live probe result. Requires admin role.

---

## 6. Validation checklist

- [x] Delegate registers when feature flag + allowlist enabled
- [x] Results appear in Unified Search with `moduleId: vssyl-pilot-assets`
- [x] `searchMethod: partner_http_delegate` on provider metadata
- [x] No cross-tenant leakage between sandbox businesses
- [x] Fail-open when delegate disabled or errors
- [x] JWT issued only for HTTPS delegates (not internal sandbox)

---

## 7. Out of scope (this pilot)

- Production partner HTTPS endpoint
- Marketplace UI changes
- AI Retrieval / Context Graph-specific adapters (inherit via search)
- V_Link, Activity, billing

---

**Last updated:** 2026-06-24
