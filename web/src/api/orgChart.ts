import { authenticatedApiCall } from '@/lib/apiUtils';

// Types for the org chart system

// Permission and module data structures
export interface PermissionData {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  category: 'basic' | 'advanced' | 'admin';
  action: string;
  resource: string;
  dependencies?: string[];
}

export interface ModuleData {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PermissionCheckDetails {
  source: 'position' | 'tier' | 'department' | 'custom' | 'inherited';
  level: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface OrganizationalTier {
  id: string;
  businessId: string;
  name: string;
  level: number;
  description?: string;
  defaultPermissions: PermissionData[];
  defaultModules: ModuleData[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  parentDepartment?: Department;
  childDepartments?: Department[];
  headPositionId?: string;
  headPosition?: Position;
  departmentModules: ModuleData[];
  departmentPermissions: PermissionData[];
  positions?: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  businessId: string;
  /** Canonical job title for the org seat */
  title: string;
  tierId: string;
  tier?: OrganizationalTier;
  departmentId?: string | null;
  department?: Department | null;
  reportsToId?: string | null;
  /** Max concurrent active occupants */
  maxOccupants: number;
  permissions?: PermissionData[] | unknown;
  permissionSets?: PermissionSet[];
  assignedModules?: unknown;
  employeePositions?: Array<{ id: string; active?: boolean; userId?: string }>;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  businessId: string;
  name: string;
  description: string;
  moduleId: string;
  category: 'basic' | 'advanced' | 'admin';
  action: string;
  resource: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionSet {
  id: string;
  businessId: string;
  name: string;
  description: string;
  permissions: PermissionData[];
  isTemplate: boolean;
  templateType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePosition {
  id: string;
  businessId: string;
  userId: string;
  /** Null on transitional synthetic member-* presentation rows */
  positionId: string | null;
  position?: Position | null;
  assignedById?: string | null;
  assignedBy?: UserData | null;
  /** Canonical assignment start (ISO) */
  startDate: string;
  endDate?: string | null;
  /** Canonical active flag */
  active: boolean;
  user?: UserData;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrgChartStructure {
  tiers: OrganizationalTier[];
  departments: Department[];
  positions: Position[];
  hierarchy: {
    departments: Department[];
    positions: Position[];
  };
}

export interface CreateOrganizationalTierData {
  businessId: string;
  name: string;
  level: number;
  description?: string;
  defaultPermissions: PermissionData[];
  defaultModules: ModuleData[];
}

export interface CreateDepartmentData {
  businessId: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  headPositionId?: string;
  departmentModules: ModuleData[];
  departmentPermissions: PermissionData[];
}

export interface CreatePositionData {
  businessId: string;
  title: string;
  tierId: string;
  departmentId?: string;
  reportsToId?: string | null;
  maxOccupants?: number;
  permissions?: PermissionData[];
  assignedModules?: unknown;
  customPermissions?: unknown;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export interface CreatePermissionData {
  businessId: string;
  name: string;
  description: string;
  moduleId: string;
  category: 'basic' | 'advanced' | 'admin';
  action: string;
  resource: string;
  dependencies?: string[];
}

export interface CreatePermissionSetData {
  businessId: string;
  name: string;
  description: string;
  permissions: PermissionData[];
  isTemplate?: boolean;
  templateType?: string;
}

export interface AssignEmployeeData {
  businessId: string;
  userId: string;
  positionId: string;
  assignedById: string;
  /** Canonical server field (ISO date or datetime string) */
  startDate: string;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  source: 'position' | 'tier' | 'department' | 'custom' | 'inherited';
  level: string;
  details: PermissionCheckDetails;
}

export interface UserPermissions {
  userId: string;
  businessId: string;
  permissions: PermissionData[];
  positionPermissions: PermissionData[];
  customPermissions: PermissionData[];
  inheritedPermissions: PermissionData[];
}

/** Transitional presentation id for members without EmployeePosition */
export function isSyntheticEmployeeRowId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('member-');
}

/** True when the row is a real active placement (not synthetic / not unplaced). */
export function isPlacedEmployeeAssignment(
  ep: Pick<EmployeePosition, 'id' | 'positionId' | 'active'>
): boolean {
  return (
    Boolean(ep.positionId) &&
    !isSyntheticEmployeeRowId(ep.id) &&
    ep.active === true
  );
}

/** Derive occupancy from nested relation or employee list. */
export function countActiveOccupants(
  positionId: string,
  employees: Array<Pick<EmployeePosition, 'id' | 'positionId' | 'active'>>,
  nestedEmployeePositions?: Array<{ active?: boolean }> | null
): number {
  if (nestedEmployeePositions) {
    return nestedEmployeePositions.filter((ep) => ep.active !== false).length;
  }
  return employees.filter(
    (ep) => ep.positionId === positionId && isPlacedEmployeeAssignment(ep)
  ).length;
}

export function assertRemovablePlacement(
  userId: string,
  positionId: string | null | undefined,
  rowId?: string | null
): asserts positionId is string {
  if (!userId || isSyntheticEmployeeRowId(userId)) {
    throw new Error('Invalid user identity for position removal');
  }
  if (!positionId || isSyntheticEmployeeRowId(positionId) || isSyntheticEmployeeRowId(rowId)) {
    throw new Error('Cannot remove a synthetic or unplaced member row as an EmployeePosition');
  }
}

// Helper function to make authenticated API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  const result = await authenticatedApiCall<T | undefined>(`/api/org-chart${endpoint}`, options, token);
  // Normalize 204 → success envelope for delete helpers typed as { success: boolean }
  if (result === undefined && options.method === 'DELETE') {
    return { success: true } as T;
  }
  return result as T;
}

// Organizational Tier API functions
export const createOrganizationalTier = async (
  data: CreateOrganizationalTierData,
  token: string
): Promise<{ success: boolean; data: OrganizationalTier }> => {
  return apiCall('/tiers', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const getOrganizationalTiers = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: OrganizationalTier[] }> => {
  return apiCall(`/tiers/${businessId}`, { method: 'GET' }, token);
};

export const updateOrganizationalTier = async (
  tierId: string,
  data: Partial<CreateOrganizationalTierData>,
  token: string
): Promise<{ success: boolean; data: OrganizationalTier }> => {
  return apiCall(`/tiers/${tierId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deleteOrganizationalTier = async (
  tierId: string,
  token: string
): Promise<{ success: boolean }> => {
  return apiCall(`/tiers/${tierId}`, { method: 'DELETE' }, token);
};

// Department API functions
export const createDepartment = async (
  data: CreateDepartmentData,
  token: string
): Promise<{ success: boolean; data: Department }> => {
  return apiCall('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const getDepartments = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: Department[] }> => {
  return apiCall(`/departments/${businessId}`, { method: 'GET' }, token);
};

export const getDepartmentHierarchy = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: Department[] }> => {
  return apiCall(`/departments/${businessId}/hierarchy`, { method: 'GET' }, token);
};

export const updateDepartment = async (
  departmentId: string,
  data: Partial<CreateDepartmentData>,
  token: string
): Promise<{ success: boolean; data: Department }> => {
  return apiCall(`/departments/${departmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deleteDepartment = async (
  departmentId: string,
  token: string
): Promise<{ success: boolean }> => {
  return apiCall(`/departments/${departmentId}`, { method: 'DELETE' }, token);
};

// Position API functions
export const createPosition = async (
  data: CreatePositionData,
  token: string
): Promise<{ success: boolean; data: Position }> => {
  return apiCall('/positions', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const getPositions = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: Position[] }> => {
  return apiCall(`/positions/${businessId}`, { method: 'GET' }, token);
};

export const updatePosition = async (
  positionId: string,
  data: Partial<CreatePositionData>,
  token: string
): Promise<{ success: boolean; data: Position }> => {
  return apiCall(`/positions/${positionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deletePosition = async (
  positionId: string,
  token: string
): Promise<{ success: boolean }> => {
  return apiCall(`/positions/${positionId}`, { method: 'DELETE' }, token);
};

// Permission API functions
export const createPermission = async (
  data: CreatePermissionData,
  token: string
): Promise<{ success: boolean; data: Permission }> => {
  return apiCall('/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const getPermissions = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: Permission[] }> => {
  return apiCall(`/permissions/${businessId}`, { method: 'GET' }, token);
};

export const getPermissionsByModule = async (
  businessId: string,
  moduleId: string,
  token: string
): Promise<{ success: boolean; data: Permission[] }> => {
  return apiCall(`/permissions/${businessId}/module/${moduleId}`, { method: 'GET' }, token);
};

export const getPermissionsByCategory = async (
  businessId: string,
  category: string,
  token: string
): Promise<{ success: boolean; data: Permission[] }> => {
  return apiCall(`/permissions/${businessId}/category/${category}`, { method: 'GET' }, token);
};

export const updatePermission = async (
  permissionId: string,
  data: Partial<CreatePermissionData>,
  token: string
): Promise<{ success: boolean; data: Permission }> => {
  return apiCall(`/permissions/${permissionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deletePermission = async (
  permissionId: string,
  token: string
): Promise<{ success: boolean }> => {
  return apiCall(`/permissions/${permissionId}`, { method: 'DELETE' }, token);
};

// Permission Set API functions
export const createPermissionSet = async (
  data: CreatePermissionSetData,
  token: string
): Promise<{ success: boolean; data: PermissionSet }> => {
  return apiCall('/permission-sets', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

export const getPermissionSets = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: PermissionSet[] }> => {
  return apiCall(`/permission-sets/${businessId}`, { method: 'GET' }, token);
};

export const getTemplatePermissionSets = async (
  token: string
): Promise<{ success: boolean; data: PermissionSet[] }> => {
  return apiCall('/permission-sets/templates', { method: 'GET' }, token);
};

export const copyPermissionSet = async (
  permissionSetId: string,
  newName: string,
  businessId: string,
  token: string
): Promise<{ success: boolean; data: PermissionSet }> => {
  return apiCall(`/permission-sets/${permissionSetId}/copy`, {
    method: 'POST',
    body: JSON.stringify({ newName, businessId }),
  }, token);
};

export const updatePermissionSet = async (
  permissionSetId: string,
  data: Partial<CreatePermissionSetData>,
  token: string
): Promise<{ success: boolean; data: PermissionSet }> => {
  return apiCall(`/permission-sets/${permissionSetId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

export const deletePermissionSet = async (
  permissionSetId: string,
  token: string
): Promise<{ success: boolean }> => {
  return apiCall(`/permission-sets/${permissionSetId}`, { method: 'DELETE' }, token);
};

// Employee Management API functions
export const assignEmployeeToPosition = async (
  data: AssignEmployeeData,
  token: string
): Promise<EmployeePosition> => {
  if (isSyntheticEmployeeRowId(data.userId) || isSyntheticEmployeeRowId(data.positionId)) {
    throw new Error('Cannot assign using a synthetic member-* identifier');
  }
  return apiCall('/employees/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

/**
 * DELETE remove — identifiers in query string so Next.js API proxy can forward them
 * (proxy does not forward DELETE bodies).
 */
export const removeEmployeeFromPosition = async (
  userId: string,
  positionId: string,
  businessId: string,
  token: string,
  rowId?: string | null
): Promise<{ success: boolean }> => {
  assertRemovablePlacement(userId, positionId, rowId);
  const params = new URLSearchParams({ userId, positionId, businessId });
  return apiCall(`/employees/remove?${params.toString()}`, {
    method: 'DELETE',
  }, token);
};

export const transferEmployee = async (
  userId: string,
  fromPositionId: string,
  toPositionId: string,
  businessId: string,
  transferredById: string,
  token: string,
  /** Server transfer route field name (maps to new assignment startDate) */
  effectiveDate?: string
): Promise<EmployeePosition> => {
  if (
    isSyntheticEmployeeRowId(userId) ||
    isSyntheticEmployeeRowId(fromPositionId) ||
    isSyntheticEmployeeRowId(toPositionId)
  ) {
    throw new Error('Cannot transfer using a synthetic member-* identifier');
  }
  if (!fromPositionId || !toPositionId) {
    throw new Error('fromPositionId and toPositionId are required');
  }
  return apiCall('/employees/transfer', {
    method: 'POST',
    body: JSON.stringify({ 
      userId, 
      fromPositionId, 
      toPositionId, 
      businessId, 
      transferredById, 
      effectiveDate 
    }),
  }, token);
};

export const getBusinessEmployees = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: EmployeePosition[] }> => {
  return apiCall(`/employees/${businessId}`, { method: 'GET' }, token);
};

export const getVacantPositions = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: Position[] }> => {
  return apiCall(`/employees/${businessId}/vacant`, { method: 'GET' }, token);
};

// Org Chart Structure API functions
export const getOrgChartStructure = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: OrgChartStructure }> => {
  return apiCall(`/structure/${businessId}`, { method: 'GET' }, token);
};

export const createDefaultOrgChart = async (
  businessId: string,
  token: string,
  industry?: string
): Promise<{ success: boolean }> => {
  return apiCall(`/structure/${businessId}/default`, {
    method: 'POST',
    body: JSON.stringify({ industry }),
  }, token);
};

export const validateOrgChartStructure = async (
  businessId: string,
  token: string
): Promise<{ success: boolean; data: { isValid: boolean; errors: string[]; warnings: string[] } }> => {
  return apiCall(`/structure/${businessId}/validate`, { method: 'GET' }, token);
};

// Permission Check API functions
export const checkUserPermission = async (
  userId: string,
  businessId: string,
  moduleId: string,
  featureId: string,
  action: string,
  token: string
): Promise<{ success: boolean; data: PermissionCheckResult }> => {
  return apiCall(`/permissions/check`, {
    method: 'POST',
    body: JSON.stringify({ userId, businessId, moduleId, featureId, action }),
  }, token);
};

export const getUserPermissions = async (
  userId: string,
  businessId: string,
  token: string
): Promise<{ success: boolean; data: UserPermissions }> => {
  return apiCall(`/permissions/user/${userId}/${businessId}`, { method: 'GET' }, token);
};
