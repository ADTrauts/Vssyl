# Search Delegate Guide (Partners)

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Contract version:** `1`  
**JWT audience:** `vssyl:search-delegate:v1`

---

## 1. Purpose

Search Delegate lets your module return results in **Vssyl Unified Search**. The platform calls **your HTTPS endpoint** server-side with a short-lived JWT. You never call Vssyl search APIs directly.

---

## 2. Requirements

| Requirement | Detail |
|-------------|--------|
| HTTPS delegate URL | Fixed at publish in manifest; no `vssyl-internal://` for external partners |
| JWT verification | Verify `aud`, `iss`, expiry, `moduleId` on every request |
| Tenant scoping | Filter results to JWT `businessId` / user |
| Entity allowlist | Only return types declared in `searchDelegate.entityTypes` |
| Response shape | `PartnerSearchDelegateSuccessResponse` with `results[]` |

---

## 3. Manifest entries

```json
{
  "capabilities": { "search": true },
  "entities": [
    { "type": "asset", "displayName": "Asset", "supportsSearch": true }
  ],
  "searchDelegate": {
    "contractVersion": "1",
    "url": "https://api.your-domain.com/vssyl/search-delegate",
    "entityTypes": ["asset"],
    "supportedContexts": ["business"],
    "timeoutMs": 2500,
    "maxResults": 25
  }
}
```

When `capabilities.search` is true, a valid `searchDelegate` block is **required** for certification.

---

## 4. Platform → partner request

**Method:** `POST` to your manifest `url`  
**Header:** `Authorization: Bearer <SearchDelegateJwt>`

```json
{
  "contractVersion": "1",
  "query": "forklift",
  "userId": "<platform-user-id>",
  "context": { "scope": "business", "businessId": "<uuid>" },
  "moduleId": "<your-module-id>",
  "limit": 25,
  "requestId": "<uuid>"
}
```

---

## 5. Partner response

```json
{
  "success": true,
  "contractVersion": "1",
  "results": [
    {
      "id": "asset-001",
      "title": "Forklift A",
      "description": "Warehouse bay 3",
      "type": "asset",
      "url": "/asset-register/assets/asset-001",
      "relevanceScore": 0.92,
      "permissions": [{ "type": "read", "granted": true }]
    }
  ]
}
```

Platform **overwrites** `moduleId` / `moduleName` on results — do not rely on spoofing those fields.

---

## 6. Certification requirements

| Checklist id | Requirement |
|--------------|-------------|
| `search_delegate` | Valid URL, entityTypes, contexts when `capabilities.search` |

After publish, operators must enable `PARTNER_SEARCH_DELEGATE_ENABLED` and add your module id to `PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST`. See [PARTNER_OPERATOR_RUNBOOK.md](../marketplace/PARTNER_OPERATOR_RUNBOOK.md).

---

## 7. Common mistakes

| Mistake | Symptom |
|---------|---------|
| HTTP (not HTTPS) delegate URL | Certification or proxy rejection |
| Return entity type not in manifest | Normalizer drops or rejects rows |
| Ignore JWT tenant claims | Cross-tenant data leak (review failure) |
| Assume publish = search live | Empty search slice until ops enablement |
| Slow endpoint (>2.5s) | Timeout; empty partner results (silent) |
| Wrong JWT `aud` verification | 401 from your server; empty search |

---

## 8. Related docs

- [SEARCH_DELEGATE_RESULT_CONTRACT.md](../marketplace/SEARCH_DELEGATE_RESULT_CONTRACT.md) — full field rules
- [SEARCH_DELEGATE_SECURITY_MODEL.md](../marketplace/SEARCH_DELEGATE_SECURITY_MODEL.md) — JWT claims
- [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)

**Last updated:** 2026-06-24
