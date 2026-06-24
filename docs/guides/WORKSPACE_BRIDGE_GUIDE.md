# Workspace Bridge Guide (Partners)

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Contract version:** `1`  
**JWT audience:** `vssyl:workspace-bridge:v1`

---

## 1. Purpose

Workspace Bridge embeds your module in the **business workspace** (and personal, when scope allows) via iframe + **postMessage**. The host sends a **bridge JWT** — never the user's Vssyl session token.

---

## 2. Requirements

| Requirement | Detail |
|-------------|--------|
| Hosted HTTPS UI or approved bundle | `frontend.entryUrl` or GCS artifact with HTML entry |
| postMessage listener | Handle `vssyl:workspace:v1:host:init` |
| JWT use | Verify `bridgeToken` for API calls; trust tenant from JWT |
| Lifecycle | Respond to `activate` / `deactivate` |
| Business install | Active `businessModuleInstallation` + membership |

---

## 3. Manifest entries

```json
{
  "capabilities": { "workspace": true },
  "workspaceParticipation": {
    "contractVersion": "1",
    "supportedContexts": ["business"],
    "embedMode": "iframe",
    "lifecycleEvents": ["activate", "deactivate", "themeChange"]
  }
}
```

When `capabilities.workspace` is true, valid `workspaceParticipation` is **required**.

---

## 4. Initialization flow

```
1. Vssyl loads your iframe (entryUrl or bundle)
2. Host fetches GET /api/modules/:moduleId/workspace-bridge-init (server-side)
3. Host postMessage → iframe: type "vssyl:workspace:v1:host:init"
4. Payload includes bridgeToken, context.moduleId, context.tenant, userRef, theme
5. Your app postMessage → "vssyl:workspace:v1:module:ready"
```

Optional: iframe sends `vssyl:workspace:v1:module:request-init` if it loads before host init.

---

## 5. Init payload (simplified)

```json
{
  "contractVersion": "1",
  "lifecycleId": "<uuid>",
  "bridgeToken": "<jwt>",
  "context": {
    "moduleId": "your-module-id",
    "moduleVersionId": "<version-id>",
    "moduleName": "Asset Register",
    "tenant": { "scope": "business", "businessId": "<uuid>" },
    "userRef": "<16-char-hash>"
  },
  "theme": { "mode": "light" },
  "capabilities": ["workspace:v1"]
}
```

Verify JWT: `aud: vssyl:workspace-bridge:v1`, `iss: vssyl-platform`, `moduleId` matches yours, `businessId` matches tenant.

---

## 6. Certification requirements

| Checklist id | Requirement |
|--------------|-------------|
| `workspace_participation` | Block valid; contexts ⊆ manifest |

Enablement: `PARTNER_WORKSPACE_BRIDGE_ENABLED` + allowlist. See operator runbook.

---

## 7. Common mistakes

| Mistake | Symptom |
|---------|---------|
| Expect session cookie in iframe | Security reject; use bridge JWT only |
| Trust URL query params for tenant | Wrong business data — use JWT |
| No `module:ready` message | Host may not treat embed as loaded |
| personal scope module in business route | Install/scope gate failure |
| Missing lifecycle cleanup on deactivate | Memory leaks, stale listeners |

---

## 8. Minimal iframe listener (concept)

```javascript
window.addEventListener('message', (event) => {
  if (event.data?.type !== 'vssyl:workspace:v1:host:init') return;
  const { bridgeToken, context } = event.data.payload;
  // Verify bridgeToken server-side or with published platform JWT secret workflow
  initApp(context.tenant, bridgeToken);
  window.parent.postMessage({ type: 'vssyl:workspace:v1:module:ready' }, event.origin);
});
```

Use your platform's documented JWT verification approach; never embed Vssyl session tokens.

---

## 9. Related docs

- [POSTMESSAGE_AUTH_BRIDGE.md](../marketplace/POSTMESSAGE_AUTH_BRIDGE.md)
- [PARTNER_WORKSPACE_CONTRACT.md](../marketplace/PARTNER_WORKSPACE_CONTRACT.md)
- [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)

**Last updated:** 2026-06-24
