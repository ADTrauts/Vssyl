# Activity Ingest Guide (Partners)

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Contract version:** `1`  
**JWT audience:** `vssyl:activity-ingest:v1`

---

## 1. Purpose

Activity Ingest publishes user-visible events into the **Vssyl platform activity feed**. Partners call a platform HTTP API with a short-lived JWT. You **never** write to Vssyl activity tables directly.

---

## 2. Requirements

| Requirement | Detail |
|-------------|--------|
| Declared actions | Every `action` must be in manifest `activityIngest.actionTypes` |
| Declared entities | Every `target.type` in `activityIngest.entityTypes` |
| Idempotency key | Required when `idempotencyRequired: true` (recommended always) |
| Actor binding | `actor.userRef` must match token subject (user id or agreed hash) |
| Tenant match | `context.scope` / `businessId` must match JWT |
| Metadata | No secrets; max `maxMetadataBytes` (default 4096) |

---

## 3. Manifest entries

```json
{
  "capabilities": { "activity": true },
  "entities": [
    { "type": "asset", "displayName": "Asset", "supportsActivity": true }
  ],
  "activityIngest": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "entityTypes": ["asset"],
    "actionTypes": ["create", "update", "assign", "retire"],
    "maxMetadataBytes": 4096,
    "idempotencyRequired": true
  }
}
```

---

## 4. Two-step JWT flow

### Step 1 — Issue token (from your iframe/backend with user session)

User must be authenticated to Vssyl. Your client calls:

```
POST /api/modules/:moduleId/activity-ingest-token
Authorization: Bearer <vssyl-user-session>
Body: { "scope": "business", "businessId": "<uuid>" }
```

Response includes short-lived `token` (~90s), `jti`, `expiresAt`.

### Step 2 — Ingest event

```
POST /api/modules/:moduleId/activity-ingest
Authorization: Bearer <ActivityIngestJwt>
Content-Type: application/json
```

```json
{
  "contractVersion": "1",
  "idempotencyKey": "asset-001-create-20260624",
  "occurredAt": "2026-06-24T15:00:00.000Z",
  "action": "create",
  "actor": { "userRef": "<same-user-id-as-token-sub>" },
  "target": { "type": "asset", "id": "asset-001" },
  "context": { "scope": "business", "businessId": "<uuid>" },
  "metadata": { "label": "Forklift A", "location": "Bay 3" }
}
```

Success response: `{ "success": true, "eventId": "evt_...", "accepted": true }`  
Duplicate key: `{ "success": true, "duplicate": true, "eventId": "..." }`

---

## 5. Certification requirements

| Checklist id | Requirement |
|--------------|-------------|
| `activity_ingest` | Valid block when `capabilities.activity` |

Enablement: `PARTNER_ACTIVITY_INGEST_ENABLED` + allowlist.

---

## 6. Common mistakes

| Mistake | Error |
|---------|-------|
| Undeclared action | `UNKNOWN_ACTION` |
| Wrong `actor.userRef` | `FORBIDDEN` |
| `businessId` mismatch vs JWT | `TENANT_MISMATCH` |
| Reuse idempotency key with different body | `IDEMPOTENCY_CONFLICT` |
| Secrets in metadata (`apiKey`, `password`) | Stripped silently |
| Call ingest without token step | `UNAUTHORIZED` |
| Replay same JWT (`jti`) | Token rejected after first use |

---

## 7. Action taxonomy (Asset Register example)

| Action | When to emit |
|--------|--------------|
| `create` | New asset record |
| `update` | Field changes |
| `assign` | Custody assigned |
| `retire` | Asset decommissioned |
| `checked_out` | Temporary checkout |
| `maintenance_scheduled` | Maintenance booked |

Use verb-style actions; avoid analytics heartbeats.

---

## 8. Related docs

- [PARTNER_ACTIVITY_EVENT_CONTRACT.md](../marketplace/PARTNER_ACTIVITY_EVENT_CONTRACT.md)
- [PARTNER_ACTIVITY_SECURITY_MODEL.md](../marketplace/PARTNER_ACTIVITY_SECURITY_MODEL.md)
- [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)

**Last updated:** 2026-06-24
