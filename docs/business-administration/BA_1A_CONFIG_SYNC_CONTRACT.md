# BA-1A Configuration Sync Contract

**Phase:** BA-1A  
**Producer:** `businessConfigRealtimeService.ts`  
**Consumer:** `web/src/contexts/BusinessConfigurationContext.tsx`

## Problem

`BusinessConfigurationContext` previously relied on **30-second polling only** because business-specific socket events were not implemented. Structure and config changes were invisible to connected clients until the next poll.

## Contract

### Producer responsibilities

After successful Business Administration mutations, producers call:

```typescript
broadcastBusinessConfigUpdated({
  businessId,
  changeType,
  actorUserId?,
  metadata?,
});
```

**Change types:**

| changeType | Trigger |
|------------|---------|
| `business_created` | New business |
| `business_updated` | Profile update |
| `branding_updated` | Logo/branding |
| `configuration_updated` | Scheduling/AI settings |
| `member_invited` | Invitation sent |
| `member_joined` | Invitation accepted |
| `member_updated` | Member role/title change |
| `member_removed` | Member deactivated |
| `org_structure_updated` | Any org-chart write |

**Socket event:** `business:config:updated`  
**Room:** `business_{businessId}` (requires `join_business`)

**Payload shape:**

```json
{
  "businessId": "uuid",
  "changeType": "org_structure_updated",
  "actorUserId": "uuid",
  "timestamp": "ISO-8601",
  "...metadata": "optional"
}
```

### Consumer responsibilities

`BusinessConfigurationContext.subscribeToUpdates(businessId)`:

1. Acquires shared socket via `acquireRealtimeConnection` (holder: `business-config-ws`)
2. Emits `join_business` for the active business
3. Listens for `business:config:updated`
4. On matching `businessId`, calls `loadConfiguration(businessId)` to refresh state
5. Falls back to 30s polling if socket unavailable

### Cache invalidation expectations

| Consumer surface | Invalidation behavior |
|------------------|----------------------|
| `configuration` state | Full reload via `loadConfiguration` |
| `orgChart` embedded data | Reloaded as part of configuration fetch |
| Module enablement | Refreshed on config reload |
| Position permissions maps | Refreshed on config reload |

Consumers must **not** assume partial patch payloads in BA-1A; full reload is the safe contract.

### Realtime update expectations

- **Latency:** Near-real-time when socket connected; ≤30s when polling fallback active
- **Ordering:** Not guaranteed; consumers treat events as idempotent refresh triggers
- **Scope:** Business members in `business_{businessId}` room only
- **Failure mode:** Producer logs warning and continues; mutation success is never blocked by broadcast failure

## Out of scope

- Workspace architecture redesign
- Granular delta payloads per change type
- Cross-business broadcast
- New socket server (reuses `chatSocketService`)

## Future consumers (extension points)

- Business Operations module caches
- AI context providers (`business_admin` configuration grounding)
- V_Link entity graph refresh

## Verification

1. Mutate business profile → client receives `business:config:updated`
2. Mutate org chart → `changeType: org_structure_updated`
3. Socket unavailable → polling continues without error
