# Partner Activity — Sandbox Pilot

**Program:** Marketplace & Module Ecosystem — Phase 1B-F  
**Date:** 2026-06-24  
**Status:** ✅ Implemented  
**Pilot module:** `vssyl-pilot-assets`

---

## 1. Purpose

End-to-end validation of partner activity ingest without an external partner dependency. Reuses the same sandbox module as Search Delegate and Workspace Bridge pilots.

---

## 2. Pilot actions

| Action | Maps to user-visible concept |
|--------|------------------------------|
| `create` | `asset.created` |
| `update` | `asset.updated` |
| `checked_out` | `asset.checked_out` |
| `maintenance_scheduled` | `asset.maintenance_scheduled` |

Entity type: **`asset`** (business scope only).

---

## 3. Registration

**`registerSandboxPilotActivityIngestOnStartup()`** runs when:

- `PARTNER_ACTIVITY_INGEST_ENABLED=true`
- `PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST` includes `vssyl-pilot-assets`

Manifest snapshot: **`getSandboxPilotActivityManifestSnapshot()`**  
Sample events: **`getSandboxPilotActivitySampleEvents()`**

---

## 4. Admin probe

```
GET /api/admin-portal/modules/vssyl-pilot-assets/activity-ingest-probe?live=true
```

Admin probe merges search + activity manifest snapshots for sandbox module id.

Live probe issues JWT, posts synthetic `create` on `probe-asset-1`, and returns `probeOutcome`, `eventId`, and diagnostics.

**UI:** Marketplace Readiness Card → **Activity probe** button.

---

## 5. Partner flow (sandbox)

1. User session in business workspace with pilot module entitled.
2. `POST /api/modules/vssyl-pilot-assets/activity-ingest-token` with `businessId`.
3. Partner iframe/server calls `POST /api/modules/vssyl-pilot-assets/activity-ingest` with JWT + body per contract.
4. Activity appears in platform feed via standard `emitModuleActivityEvent` path.

---

## 6. Sample ingest body

```json
{
  "contractVersion": "1",
  "idempotencyKey": "asset-sandbox-1-create",
  "occurredAt": "2026-06-24T12:00:00.000Z",
  "action": "create",
  "actor": { "userRef": "<platform-user-id>" },
  "target": { "type": "asset", "id": "asset-sandbox-1" },
  "context": { "scope": "business", "businessId": "<business-id>" },
  "metadata": { "label": "Forklift A" }
}
```

---

## 7. Out of scope

- Partner notifications from activity
- AI context providers for partner activity
- Context Graph adapters
- External partner certification (Phase 1C)

---

**Last updated:** 2026-06-24
