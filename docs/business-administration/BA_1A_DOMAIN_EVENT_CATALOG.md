# BA-1A Domain Event Catalog

**Phase:** BA-1A  
**Registry:** `server/src/events/domainEventRegistry.ts`  
**Emitters:** `domainEventEmitters.ts`, `orgChartDomainEventService.ts`

## Business Administration events

| Event type | Producer | Entity | Default action | Wired mutation |
|------------|----------|--------|----------------|----------------|
| `business.created` | `businessActivityService` | Business | create | `createBusiness` |
| `business.updated` | `businessActivityService` | Business | update | `updateBusiness`, branding |
| `business.member.added` | `businessActivityService` | BusinessMember | add | `acceptInvitation` |
| `business.member.removed` | `businessActivityService` | BusinessMember | remove | `removeBusinessMember` |

### Payload shape (business.updated)

```json
{
  "changedFields": ["name", "industry"],
  "updateKind": "profile"
}
```

Disallowed metadata: `ein`, `logo`, `logoUrl`, `settings`, `configuration`, `configured`.

## Org chart events

| Event type | Producer | Entity | Wired mutation |
|------------|----------|--------|----------------|
| `orgchart.tier.created` | `orgChartActivityService` | OrganizationalTier | POST `/tiers` |
| `orgchart.tier.updated` | `orgChartActivityService` | OrganizationalTier | PUT `/tiers/:id` |
| `orgchart.tier.deleted` | `orgChartActivityService` | OrganizationalTier | DELETE `/tiers/:id` |
| `orgchart.department.created` | `orgChartActivityService` | Department | POST `/departments` |
| `orgchart.department.updated` | `orgChartActivityService` | Department | PUT `/departments/:id` |
| `orgchart.department.deleted` | `orgChartActivityService` | Department | DELETE `/departments/:id` |
| `orgchart.position.created` | `orgChartActivityService` | Position | POST `/positions` |
| `orgchart.position.updated` | `orgChartActivityService` | Position | PUT `/positions/:id` |
| `orgchart.position.deleted` | `orgChartActivityService` | Position | DELETE `/positions/:id` |
| `orgchart.employee.assigned` | `orgChartActivityService` | EmployeePosition | POST `/employees/assign` |
| `orgchart.employee.removed` | `orgChartActivityService` | EmployeePosition | DELETE `/employees/remove` |
| `orgchart.employee.transferred` | `orgChartActivityService` | EmployeePosition | POST `/employees/transfer` |
| `orgchart.permission_set.created` | `orgChartActivityService` | PermissionSet | POST `/permission-sets` |
| `orgchart.permission.updated` | `orgChartActivityService` | PermissionSet | PUT `/permission-sets/:id` |
| `orgchart.permission_set.deleted` | `orgChartActivityService` | PermissionSet | DELETE `/permission-sets/:id` |
| `orgchart.permission_set.copied` | `orgChartActivityService` | PermissionSet | POST `/permission-sets/:id/copy` |
| `orgchart.structure.initialized` | `orgChartActivityService` | OrgChart | POST `/structure/:businessId/default` |
| `orgchart.manager.assigned` | `orgChartActivityService` | Position | PUT `/positions/:id` (`reportsToId` set) |
| `orgchart.manager.removed` | `orgChartActivityService` | Position | PUT `/positions/:id` (`reportsToId` cleared) |

**Domain event count (BA-1A catalog):** 23 registered types (4 business + 19 org chart).

## Consumers

| Consumer | BA-1A status | Integration |
|----------|--------------|-------------|
| Business Operations | Extension point | Subscribe via domain event bus; consume `orgchart.employee.*` |
| Notifications | Extension point | Future `business_admin_*` / `org_chart_*` notification types |
| Realtime | Partial | `business:config:updated` socket broadcast |
| AI Context | Extension point | Activity log + domain events; no new providers in BA-1A |
| V_Link | Extension point | Entity linkage on structure events (future) |
| Audit systems | Active | Normalized `prisma.log` activity + Admin Portal audit patterns |

## Subscription pattern

```typescript
import { subscribeDomainEvents } from '../events/domainEventBus';

const unsub = subscribeDomainEvents((event) => {
  if (event.type.startsWith('orgchart.')) {
    // Business Operations fan-out
  }
});
```

## Deferred events

| Requested event | Status | Reason |
|-----------------|--------|--------|
| `LOCATION_*` | Not implemented | Physical locations are Scheduling/BO scope |
| `CONFIGURATION_UPDATED` (standalone domain) | Covered by `business.updated` + activity `business_admin_configuration_updated` | No separate domain type required in BA-1A |
| Approval hierarchy mutations | Deferred | `ManagerApprovalHierarchy` has no server runtime (BA-F-005) |
