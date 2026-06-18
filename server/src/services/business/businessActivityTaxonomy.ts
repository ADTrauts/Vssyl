/**
 * Canonical Business Administration activity actions and target types.
 * @see docs/business-administration/BA_1A_ACTIVITY_TAXONOMY.md
 */

export const BUSINESS_ADMIN_MODULE_ID = 'business_admin' as const;
export const ORG_CHART_MODULE_ID = 'org_chart' as const;

/** Activity category labels for audit grouping */
export const BA_ACTIVITY_CATEGORIES = {
  BUSINESS_PROFILE: 'BUSINESS_PROFILE',
  DEPARTMENT: 'DEPARTMENT',
  POSITION: 'POSITION',
  ORG_CHART: 'ORG_CHART',
  PERMISSION: 'PERMISSION',
  BRANDING: 'BRANDING',
  CONFIGURATION: 'CONFIGURATION',
  MEMBER: 'MEMBER',
  TIER: 'TIER',
} as const;

export const BUSINESS_ADMIN_ACTIVITY_ACTIONS = {
  BUSINESS_CREATED: 'business_admin_business_created',
  BUSINESS_UPDATED: 'business_admin_business_updated',
  BRANDING_UPDATED: 'business_admin_branding_updated',
  CONFIGURATION_UPDATED: 'business_admin_configuration_updated',
  MEMBER_INVITED: 'business_admin_member_invited',
  MEMBER_JOINED: 'business_admin_member_joined',
  MEMBER_UPDATED: 'business_admin_member_updated',
  MEMBER_REMOVED: 'business_admin_member_removed',
} as const;

export const ORG_CHART_ACTIVITY_ACTIONS = {
  TIER_CREATED: 'org_chart_tier_created',
  TIER_UPDATED: 'org_chart_tier_updated',
  TIER_DELETED: 'org_chart_tier_deleted',
  DEPARTMENT_CREATED: 'org_chart_department_created',
  DEPARTMENT_UPDATED: 'org_chart_department_updated',
  DEPARTMENT_DELETED: 'org_chart_department_deleted',
  POSITION_CREATED: 'org_chart_position_created',
  POSITION_UPDATED: 'org_chart_position_updated',
  POSITION_DELETED: 'org_chart_position_deleted',
  EMPLOYEE_ASSIGNED: 'org_chart_employee_assigned',
  EMPLOYEE_REMOVED: 'org_chart_employee_removed',
  EMPLOYEE_TRANSFERRED: 'org_chart_employee_transferred',
  PERMISSION_SET_CREATED: 'org_chart_permission_set_created',
  PERMISSION_SET_UPDATED: 'org_chart_permission_set_updated',
  PERMISSION_SET_DELETED: 'org_chart_permission_set_deleted',
  PERMISSION_SET_COPIED: 'org_chart_permission_set_copied',
  STRUCTURE_INITIALIZED: 'org_chart_structure_initialized',
  MANAGER_ASSIGNED: 'org_chart_manager_assigned',
  MANAGER_REMOVED: 'org_chart_manager_removed',
} as const;

export const APPROVAL_HIERARCHY_ACTIVITY_ACTIONS = {
  CREATED: 'approval_hierarchy_created',
  UPDATED: 'approval_hierarchy_updated',
  DELETED: 'approval_hierarchy_deleted',
  ASSIGNED: 'approval_hierarchy_assigned',
  VALIDATED: 'approval_hierarchy_validated',
} as const;

export type BusinessAdminActivityAction =
  (typeof BUSINESS_ADMIN_ACTIVITY_ACTIONS)[keyof typeof BUSINESS_ADMIN_ACTIVITY_ACTIONS];

export type OrgChartActivityAction =
  (typeof ORG_CHART_ACTIVITY_ACTIONS)[keyof typeof ORG_CHART_ACTIVITY_ACTIONS];
