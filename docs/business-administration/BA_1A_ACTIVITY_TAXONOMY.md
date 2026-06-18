# BA-1A Activity Taxonomy

**Phase:** BA-1A  
**Source of truth:** `server/src/services/business/businessActivityTaxonomy.ts`  
**Style:** Admin Portal audit taxonomy (category + canonical action string)

## Categories (9)

| Category | Scope |
|----------|-------|
| `BUSINESS_PROFILE` | Business entity CRUD |
| `DEPARTMENT` | Department lifecycle |
| `POSITION` | Position lifecycle |
| `ORG_CHART` | Structure initialization |
| `PERMISSION` | Permission set lifecycle |
| `BRANDING` | Logo and brand fields |
| `CONFIGURATION` | Scheduling/AI workspace config |
| `MEMBER` | Business membership |
| `TIER` | Organizational tier lifecycle |

## Business Admin actions (8)

| Action constant | Activity action string | Category |
|-----------------|------------------------|----------|
| `BUSINESS_CREATED` | `business_admin_business_created` | BUSINESS_PROFILE |
| `BUSINESS_UPDATED` | `business_admin_business_updated` | BUSINESS_PROFILE |
| `BRANDING_UPDATED` | `business_admin_branding_updated` | BRANDING |
| `CONFIGURATION_UPDATED` | `business_admin_configuration_updated` | CONFIGURATION |
| `MEMBER_INVITED` | `business_admin_member_invited` | MEMBER |
| `MEMBER_JOINED` | `business_admin_member_joined` | MEMBER |
| `MEMBER_UPDATED` | `business_admin_member_updated` | MEMBER |
| `MEMBER_REMOVED` | `business_admin_member_removed` | MEMBER |

## Org chart actions (19)

| Action constant | Activity action string | Category |
|-----------------|------------------------|----------|
| `TIER_CREATED` | `org_chart_tier_created` | TIER |
| `TIER_UPDATED` | `org_chart_tier_updated` | TIER |
| `TIER_DELETED` | `org_chart_tier_deleted` | TIER |
| `DEPARTMENT_CREATED` | `org_chart_department_created` | DEPARTMENT |
| `DEPARTMENT_UPDATED` | `org_chart_department_updated` | DEPARTMENT |
| `DEPARTMENT_DELETED` | `org_chart_department_deleted` | DEPARTMENT |
| `POSITION_CREATED` | `org_chart_position_created` | POSITION |
| `POSITION_UPDATED` | `org_chart_position_updated` | POSITION |
| `POSITION_DELETED` | `org_chart_position_deleted` | POSITION |
| `EMPLOYEE_ASSIGNED` | `org_chart_employee_assigned` | ORG_CHART |
| `EMPLOYEE_REMOVED` | `org_chart_employee_removed` | ORG_CHART |
| `EMPLOYEE_TRANSFERRED` | `org_chart_employee_transferred` | ORG_CHART |
| `PERMISSION_SET_CREATED` | `org_chart_permission_set_created` | PERMISSION |
| `PERMISSION_SET_UPDATED` | `org_chart_permission_set_updated` | PERMISSION |
| `PERMISSION_SET_DELETED` | `org_chart_permission_set_deleted` | PERMISSION |
| `PERMISSION_SET_COPIED` | `org_chart_permission_set_copied` | PERMISSION |
| `STRUCTURE_INITIALIZED` | `org_chart_structure_initialized` | ORG_CHART |
| `MANAGER_ASSIGNED` | `org_chart_manager_assigned` | POSITION |
| `MANAGER_REMOVED` | `org_chart_manager_removed` | POSITION |

**Activity taxonomy count:** 27 canonical action strings (8 business_admin + 19 org_chart).

## Target types

| Module | targetType values |
|--------|-------------------|
| `business_admin` | `business`, `business_member`, `business_invitation` |
| `org_chart` | `organizational_tier`, `department`, `position`, `employee_position`, `permission_set`, `org_chart` |

## Audit grouping

Activities group under module ID for feed filtering:

- `business_admin` — profile, members, branding, configuration
- `org_chart` — structure, permissions, assignments

No parallel audit system was introduced. Activities persist to `prisma.log` via `emitModuleActivityEvent` and trigger `activity:feed:refresh`.

## Classification rules

`recordBusinessUpdated` classifies updates:

1. **Branding** — `branding` field or `updateKind: branding`
2. **Configuration** — `schedulingMode`, `schedulingStrategy`, `schedulingConfig`, `aiSettings`
3. **Profile** — all other business fields
