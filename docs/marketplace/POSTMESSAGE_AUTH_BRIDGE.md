# postMessage Auth Bridge

**Program:** Marketplace & Module Ecosystem — Phase 1B-C  
**Date:** 2026-06-24  
**Status:** **Implemented**

---

## 1. Threat model

| Risk | Mitigation |
|------|------------|
| Session token leakage | Bridge uses dedicated JWT (`aud: vssyl:workspace-bridge:v1`); platform session never in postMessage |
| Cross-origin spoofing | Host validates `event.origin` against iframe origin (hosted URL or same-origin blob) |
| Token replay | `jti` claim + server-side consume cache on verify |
| Wrong module | JWT pins `moduleId` + `moduleVersionId` |
| Cross-tenant access | JWT pins `businessId` / `dashboardId`; install + membership gates before issue |

---

## 2. Message flow

```
Workspace Host (ModuleHost)
    │
    ├─ GET /api/modules/:id/workspace-bridge-init  (authenticated, server-side)
    │       └─ returns WorkspaceBridgeInitPayload + bridgeToken
    │
    ├─ postMessage vssyl:workspace:v1:host:init  → iframe
    ├─ postMessage vssyl:workspace:v1:host:lifecycle (activate)
    │
    ← postMessage vssyl:workspace:v1:module:ready
    ← postMessage vssyl:workspace:v1:module:request-init (optional)
```

---

## 3. Bridge JWT claims

| Claim | Purpose |
|-------|---------|
| `aud` | `vssyl:workspace-bridge:v1` |
| `iss` | `vssyl-platform` |
| `sub` | Platform user id (server-side only; iframe gets `userRef` hash in public context) |
| `jti` | Replay protection |
| `moduleId` | Module pinning |
| `moduleVersionId` | Version pinning |
| `lifecycleId` | Correlate lifecycle events |
| `scope` | `personal` \| `business` |
| `businessId` / `dashboardId` | Tenant pinning |
| `userRef` | 16-char SHA-256 prefix for partner correlation |

**TTL:** 120 seconds default.

---

## 4. postMessage types

| Type | Direction | Purpose |
|------|-----------|---------|
| `vssyl:workspace:v1:host:init` | Host → Module | Signed init payload |
| `vssyl:workspace:v1:host:lifecycle` | Host → Module | activate / deactivate / themeChange |
| `vssyl:workspace:v1:host:settings` | Host → Module | Module settings (non-secret) |
| `vssyl:workspace:v1:module:ready` | Module → Host | Request init |
| `vssyl:workspace:v1:module:request-init` | Module → Host | Re-request init |

Legacy types (`module:ready`, `host:init`) remain supported for non-workspace run mode.

---

## 5. Partner verification

Partners may validate `bridgeToken` via:

```
POST /api/modules/workspace-bridge/verify
Authorization: Bearer <platform session>
{ "bridgeToken": "..." }
```

Successful verify consumes `jti` (one-time introspection per token).

---

## 6. Implementation references

- `server/src/marketplace/workspaceBridgeJwt.ts`
- `server/src/controllers/module/moduleWorkspaceBridgeController.ts`
- `web/src/components/ModuleHost.tsx`

---

**Last updated:** 2026-06-24
