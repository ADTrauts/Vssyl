# Partner Workspace Contract

**Program:** Marketplace & Module Ecosystem — Phase 1B-C  
**Date:** 2026-06-24  
**Status:** **Contract v1 — implemented**

---

## 1. Parties

| Party | Responsibility |
|-------|----------------|
| **Vssyl Workspace Host** | Embed iframe, issue bridge JWT, enforce install/tenant gates |
| **Partner Module (iframe)** | Consume init payload, honor tenant scope, emit lifecycle ack |

---

## 2. Manifest declaration

```json
{
  "capabilities": {
    "workspace": true
  },
  "workspaceParticipation": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "embedMode": "iframe",
    "lifecycleEvents": ["activate", "deactivate", "themeChange"]
  }
}
```

**Certification:** `capabilities.workspace` requires valid `workspaceParticipation` block (validator v1.2.0).

---

## 3. Initialization contract

On embed, the host delivers `WorkspaceBridgeInitPayload`:

| Field | Required | Description |
|-------|----------|-------------|
| `contractVersion` | Yes | `"1"` |
| `lifecycleId` | Yes | UUID for lifecycle correlation |
| `issuedAt` / `expiresAt` | Yes | ISO timestamps |
| `bridgeToken` | Yes | Platform-signed JWT (not session token) |
| `context.moduleId` | Yes | Certified module id |
| `context.moduleVersionId` | Yes | Published version id |
| `context.moduleName` | Yes | Display name |
| `context.tenant` | Yes | scope + businessId/dashboardId |
| `context.userRef` | Yes | Hashed user reference |
| `theme` | Yes | `mode: light \| dark \| system` |
| `capabilities` | Yes | Declared host capabilities array |

---

## 4. Lifecycle events

| Event | Host behavior | Partner expectation |
|-------|---------------|---------------------|
| `activate` | Sent after module ready | Initialize UI for tenant context |
| `deactivate` | Sent on unmount | Tear down listeners / timers |
| `themeChange` | Future: branding updates | Restyle if supported |
| `contextChange` | Future: tenant switch | Reload scoped state |

---

## 5. Tenant rules

- Business embed requires active `businessMember` + `businessModuleInstallation`
- Bridge JWT `businessId` must match workspace route business
- Partner must not trust client-supplied tenant ids over JWT claims

---

## 6. Security boundaries

| Allowed in iframe | Forbidden |
|-------------------|-----------|
| `bridgeToken` (short-lived) | Platform session / refresh tokens |
| `userRef` hash | Raw `userId` |
| Tenant ids from signed payload | Arbitrary cross-tenant ids from URL alone |

---

## 7. Types

Authoritative: `shared/src/types/workspace-bridge.ts`

---

**Last updated:** 2026-06-24
