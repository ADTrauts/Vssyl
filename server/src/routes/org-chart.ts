import express, { Request } from 'express';
import { authenticateJWT, requireRole, getUserFromRequest } from '../middleware/auth';
import orgChartService from '../services/orgChartService';
import permissionService from '../services/permissionService';
import employeeManagementService, {
  EmployeeAssignmentValidationError,
} from '../services/employeeManagementService';
import { prisma } from '../lib/prisma';
import {
  recordOrgChartDepartmentCreated,
  recordOrgChartDepartmentDeleted,
  recordOrgChartDepartmentUpdated,
  recordOrgChartEmployeeAssigned,
  recordOrgChartEmployeeRemoved,
  recordOrgChartEmployeeTransferred,
  recordOrgChartPermissionSetCopied,
  recordOrgChartPermissionSetCreated,
  recordOrgChartPermissionSetDeleted,
  recordOrgChartPermissionSetUpdated,
  recordOrgChartPositionCreated,
  recordOrgChartPositionDeleted,
  recordOrgChartPositionUpdated,
  recordOrgChartStructureInitialized,
  recordOrgChartTierCreated,
  recordOrgChartTierDeleted,
  recordOrgChartTierUpdated,
} from '../services/business/orgChartActivityService';
import {
  requireOrgChartAccess,
  requireManageForOrganizationalTier,
  requireManageForDepartment,
  requireManageForPosition,
  requirePermissionCheckAccess,
  requireEmployeeUserOrManager,
  requireManageForPermissionSetId,
  requireManageForApprovalHierarchyId,
  requireMemberForApprovalHierarchyId,
} from '../middleware/orgChartPermissions';
import { checkOrgChartPolicy } from '../auth/orgChartPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { logger } from '../lib/logger';
import approvalHierarchyService, {
  ApprovalHierarchyValidationError,
} from '../services/approvalHierarchyService';
import {
  recordApprovalHierarchyAssigned,
  recordApprovalHierarchyCreated,
  recordApprovalHierarchyDeleted,
  recordApprovalHierarchyUpdated,
  recordApprovalHierarchyValidated,
} from '../services/business/approvalHierarchyActivityService';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}

const router: express.Router = express.Router();

const fromParam =
  (key: string) =>
  (req: Request): string | undefined => {
    const v = req.params[key];
    return typeof v === 'string' ? v : undefined;
  };

const fromBody =
  (key: string) =>
  (req: Request): string | undefined => {
    const v = (req.body as Record<string, unknown>)?.[key];
    return typeof v === 'string' ? v : undefined;
  };

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// ============================================================================
// ORGANIZATIONAL TIERS
// ============================================================================

/**
 * GET /api/org-chart/tiers
 * Get all organizational tiers for a business
 */
router.get('/tiers/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const tiers = await orgChartService.getOrganizationalTiers(businessId);
    res.json(tiers);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_organizational_tiers', 'Error fetching organizational tiers:', error);
    res.status(500).json({ error: 'Failed to fetch organizational tiers' });
  }
});

/**
 * POST /api/org-chart/tiers
 * Create a new organizational tier
 */
router.post(
  '/tiers',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_TIER_WRITE),
  async (req, res) => {
  try {
    const tierData = req.body;
    const tier = await orgChartService.createOrganizationalTier(tierData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartTierCreated({
        actorUserId: authUser.id,
        businessId: tier.businessId,
        tierId: tier.id,
        name: tier.name,
      });
    }
    res.status(201).json(tier);
  } catch (error) {
    logSrvErr('org_chart_error_creating_organizational_tier', 'Error creating organizational tier:', error);
    res.status(500).json({ error: 'Failed to create organizational tier' });
  }
});

/**
 * PUT /api/org-chart/tiers/:id
 * Update an organizational tier
 */
router.put(
  '/tiers/:id',
  requireManageForOrganizationalTier(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_TIER_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const tier = await orgChartService.updateOrganizationalTier(id, updateData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartTierUpdated({
        actorUserId: authUser.id,
        businessId: tier.businessId,
        tierId: tier.id,
        changedFields: Object.keys(updateData as Record<string, unknown>),
      });
    }
    res.json(tier);
  } catch (error) {
    logSrvErr('org_chart_error_updating_organizational_tier', 'Error updating organizational tier:', error);
    res.status(500).json({ error: 'Failed to update organizational tier' });
  }
});

/**
 * DELETE /api/org-chart/tiers/:id
 * Delete an organizational tier
 */
router.delete(
  '/tiers/:id',
  requireManageForOrganizationalTier(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_TIER_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.organizationalTier.findUnique({
      where: { id },
      select: { businessId: true },
    });
    await orgChartService.deleteOrganizationalTier(id);
    const authUser = getUserFromRequest(req);
    if (authUser && existing) {
      void recordOrgChartTierDeleted({
        actorUserId: authUser.id,
        businessId: existing.businessId,
        tierId: id,
      });
    }
    res.status(204).send();
  } catch (error) {
    logSrvErr('org_chart_error_deleting_organizational_tier', 'Error deleting organizational tier:', error);
    res.status(500).json({ error: 'Failed to delete organizational tier' });
  }
});

// ============================================================================
// DEPARTMENTS
// ============================================================================

/**
 * GET /api/org-chart/departments
 * Get all departments for a business
 */
router.get('/departments/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { hierarchy } = req.query;
    
    if (hierarchy === 'true') {
      const departments = await orgChartService.getDepartmentHierarchy(businessId);
      res.json(departments);
    } else {
      const departments = await orgChartService.getDepartments(businessId);
      res.json(departments);
    }
  } catch (error) {
    logSrvErr('org_chart_error_fetching_departments', 'Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

/**
 * POST /api/org-chart/departments
 * Create a new department
 */
router.post(
  '/departments',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_DEPARTMENT_WRITE),
  async (req, res) => {
  try {
    const departmentData = req.body;
    const department = await orgChartService.createDepartment(departmentData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartDepartmentCreated({
        actorUserId: authUser.id,
        businessId: department.businessId,
        departmentId: department.id,
        name: department.name,
      });
    }
    res.status(201).json(department);
  } catch (error) {
    logSrvErr('org_chart_error_creating_department', 'Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

/**
 * PUT /api/org-chart/departments/:id
 * Update a department
 */
router.put(
  '/departments/:id',
  requireManageForDepartment(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_DEPARTMENT_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const department = await orgChartService.updateDepartment(id, updateData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartDepartmentUpdated({
        actorUserId: authUser.id,
        businessId: department.businessId,
        departmentId: department.id,
        changedFields: Object.keys(updateData as Record<string, unknown>),
      });
    }
    res.json(department);
  } catch (error) {
    logSrvErr('org_chart_error_updating_department', 'Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

/**
 * DELETE /api/org-chart/departments/:id
 * Delete a department
 */
router.delete(
  '/departments/:id',
  requireManageForDepartment(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_DEPARTMENT_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({
      where: { id },
      select: { businessId: true },
    });
    await orgChartService.deleteDepartment(id);
    const authUser = getUserFromRequest(req);
    if (authUser && existing) {
      void recordOrgChartDepartmentDeleted({
        actorUserId: authUser.id,
        businessId: existing.businessId,
        departmentId: id,
      });
    }
    res.status(204).send();
  } catch (error) {
    logSrvErr('org_chart_error_deleting_department', 'Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ============================================================================
// POSITIONS
// ============================================================================

/**
 * GET /api/org-chart/positions
 * Get all positions for a business
 */
router.get('/positions/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { hierarchy } = req.query;
    
    if (hierarchy === 'true') {
      const positions = await orgChartService.getPositionHierarchy(businessId);
      res.json(positions);
    } else {
      const positions = await orgChartService.getPositions(businessId);
      res.json(positions);
    }
  } catch (error) {
    logSrvErr('org_chart_error_fetching_positions', 'Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

/**
 * POST /api/org-chart/positions
 * Create a new position
 */
router.post(
  '/positions',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_POSITION_WRITE),
  async (req, res) => {
  try {
    const positionData = req.body;
    const position = await orgChartService.createPosition(positionData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartPositionCreated({
        actorUserId: authUser.id,
        businessId: position.businessId,
        positionId: position.id,
        title: position.title,
      });
    }
    res.status(201).json(position);
  } catch (error) {
    logSrvErr('org_chart_error_creating_position', 'Error creating position:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

/**
 * PUT /api/org-chart/positions/:id
 * Update a position
 */
router.put(
  '/positions/:id',
  requireManageForPosition(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_POSITION_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body as Record<string, unknown>;
    const position = await orgChartService.updatePosition(id, updateData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartPositionUpdated({
        actorUserId: authUser.id,
        businessId: position.businessId,
        positionId: position.id,
        changedFields: Object.keys(updateData),
        reportsToId:
          'reportsToId' in updateData
            ? (updateData.reportsToId as string | null | undefined) ?? null
            : undefined,
      });
    }
    res.json(position);
  } catch (error) {
    logSrvErr('org_chart_error_updating_position', 'Error updating position:', error);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

/**
 * DELETE /api/org-chart/positions/:id
 * Delete a position
 */
router.delete(
  '/positions/:id',
  requireManageForPosition(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_POSITION_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.position.findUnique({
      where: { id },
      select: { businessId: true },
    });
    await orgChartService.deletePosition(id);
    const authUser = getUserFromRequest(req);
    if (authUser && existing) {
      void recordOrgChartPositionDeleted({
        actorUserId: authUser.id,
        businessId: existing.businessId,
        positionId: id,
      });
    }
    res.status(204).send();
  } catch (error) {
    logSrvErr('org_chart_error_deleting_position', 'Error deleting position:', error);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

// ============================================================================
// COMPLETE ORG CHART STRUCTURE
// ============================================================================

/**
 * GET /api/org-chart/structure/:businessId
 * Get complete org chart structure for a business
 */
router.get('/structure/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    
    if (!businessId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business ID is required' 
      });
    }
    
    const structure = await orgChartService.getOrgChartStructure(businessId);
    
    // Transform the response to match frontend expectations
    const response = {
      success: true,
      data: {
        tiers: structure.tiers,
        departments: structure.departments,
        positions: structure.positions,
        hierarchy: {
          departments: structure.departments,
          positions: structure.positions
        }
      }
    };
    
    res.json(response);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logSrvErr('org_chart_structure_fetch', 'Error fetching org chart structure', error, {
      businessId: req.params.businessId,
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch org chart structure',
      message: err.message
    });
  }
});

/**
 * POST /api/org-chart/structure/:businessId/default
 * Create default org chart structure for a new business
 */
router.post(
  '/structure/:businessId/default',
  requireOrgChartAccess(fromParam('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_STRUCTURE_INITIALIZE),
  async (req, res) => {
  try {
    const { businessId } = req.params;
    const { industry } = req.body;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }
    
    await orgChartService.createDefaultOrgChart(businessId, industry);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartStructureInitialized({
        actorUserId: authUser.id,
        businessId,
        industry: typeof industry === 'string' ? industry : undefined,
      });
    }
    res.status(201).json({ 
      success: true,
      message: 'Default org chart structure created successfully' 
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logSrvErr('org_chart_structure_default_create', 'Error creating default org chart structure', error, {
      businessId: req.params.businessId,
    });

    // Provide more specific error messages
    if (err.message.includes('not found')) {
      return res.status(404).json({ 
        success: false,
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create default org chart structure',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/org-chart/validate/:businessId
 * Validate org chart structure
 */
router.get('/validate/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const validation = await orgChartService.validateOrgChartStructure(businessId);
    res.json(validation);
  } catch (error) {
    logSrvErr('org_chart_error_validating_org_chart_structure', 'Error validating org chart structure:', error);
    res.status(500).json({ error: 'Failed to validate org chart structure' });
  }
});

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * GET /api/org-chart/permissions
 * Get all permissions (global catalog; platform admin only)
 */
router.get('/permissions', requireRole('ADMIN'), async (req, res) => {
  try {
    const { moduleId, category } = req.query;
    
    let permissions;
    if (moduleId) {
      permissions = await permissionService.getPermissionsByModule(moduleId as string);
    } else if (category) {
      permissions = await permissionService.getPermissionsByCategory(category as string);
    } else {
      permissions = await permissionService.getAllPermissions();
    }
    
    res.json(permissions);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_permissions', 'Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

/**
 * GET /api/org-chart/permissions/check
 * Check if a user has a specific permission
 * NOTE: Must be registered before `/permissions/:businessId` (Express first match).
 */
router.get('/permissions/check', requirePermissionCheckAccess, async (req, res) => {
  try {
    const { userId, businessId, moduleId, featureId, action } = req.query;
    
    if (!userId || !businessId || !moduleId || !featureId || !action) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const result = await permissionService.checkUserPermission(
      userId as string,
      businessId as string,
      moduleId as string,
      featureId as string,
      action as string
    );
    
    res.json(result);
  } catch (error) {
    logSrvErr('org_chart_error_checking_permission', 'Error checking permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

/**
 * GET /api/org-chart/permissions/user/:userId/:businessId
 * Get all permissions for a user
 */
router.get(
  '/permissions/user/:userId/:businessId',
  requireEmployeeUserOrManager,
  async (req, res) => {
  try {
    const { userId, businessId } = req.params;
    const permissions = await permissionService.getUserPermissions(userId, businessId);
    res.json(permissions);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_user_permissions', 'Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

/**
 * GET /api/org-chart/permissions/:businessId
 * Get all permissions for a business (catalog scoped to caller membership)
 */
router.get('/permissions/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const permissions = await permissionService.getAllPermissions();
    res.json({ success: true, data: permissions });
  } catch (error) {
    logSrvErr('org_chart_error_fetching_permissions', 'Error fetching permissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
  }
});

// ============================================================================
// PERMISSION SETS
// ============================================================================

/**
 * GET /api/org-chart/permission-sets/templates
 * Get template permission sets
 * NOTE: Must be registered before `/permission-sets/:businessId` (Express first match).
 */
router.get('/permission-sets/templates', async (req, res) => {
  try {
    const templates = await permissionService.getTemplatePermissionSets();
    res.json(templates);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_template_permission_sets', 'Error fetching template permission sets:', error);
    res.status(500).json({ error: 'Failed to fetch template permission sets' });
  }
});

/**
 * GET /api/org-chart/permission-sets/:businessId
 * Get all permission sets for a business
 */
router.get('/permission-sets/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const permissionSets = await permissionService.getPermissionSets(businessId);
    res.json(permissionSets);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_permission_sets', 'Error fetching permission sets:', error);
    res.status(500).json({ error: 'Failed to fetch permission sets' });
  }
});

/**
 * POST /api/org-chart/permission-sets
 * Create a new permission set
 */
router.post(
  '/permission-sets',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE),
  async (req, res) => {
  try {
    const permissionSetData = req.body;
    const permissionSet = await permissionService.createPermissionSet(permissionSetData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartPermissionSetCreated({
        actorUserId: authUser.id,
        businessId: permissionSet.businessId,
        permissionSetId: permissionSet.id,
        name: permissionSet.name,
      });
    }
    res.status(201).json(permissionSet);
  } catch (error) {
    logSrvErr('org_chart_error_creating_permission_set', 'Error creating permission set:', error);
    res.status(500).json({ error: 'Failed to create permission set' });
  }
});

/**
 * PUT /api/org-chart/permission-sets/:id
 * Update a permission set
 */
router.put(
  '/permission-sets/:id',
  requireManageForPermissionSetId,
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const permissionSet = await permissionService.updatePermissionSet(id, updateData);
    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartPermissionSetUpdated({
        actorUserId: authUser.id,
        businessId: permissionSet.businessId,
        permissionSetId: permissionSet.id,
        changedFields: Object.keys(updateData as Record<string, unknown>),
      });
    }
    res.json(permissionSet);
  } catch (error) {
    logSrvErr('org_chart_error_updating_permission_set', 'Error updating permission set:', error);
    res.status(500).json({ error: 'Failed to update permission set' });
  }
});

/**
 * DELETE /api/org-chart/permission-sets/:id
 * Delete a permission set
 */
router.delete(
  '/permission-sets/:id',
  requireManageForPermissionSetId,
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.permissionSet.findUnique({
      where: { id },
      select: { businessId: true },
    });
    await permissionService.deletePermissionSet(id);
    const authUser = getUserFromRequest(req);
    if (authUser && existing) {
      void recordOrgChartPermissionSetDeleted({
        actorUserId: authUser.id,
        businessId: existing.businessId,
        permissionSetId: id,
      });
    }
    res.status(204).send();
  } catch (error) {
    logSrvErr('org_chart_error_deleting_permission_set', 'Error deleting permission set:', error);
    res.status(500).json({ error: 'Failed to delete permission set' });
  }
});

/**
 * POST /api/org-chart/permission-sets/:id/copy
 * Copy a permission set as a template
 */
router.post(
  '/permission-sets/:id/copy',
  requireManageForPermissionSetId,
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE),
  async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId, newName } = req.body;
    
    if (!businessId || !newName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const permissionSet = await permissionService.copyPermissionSetAsTemplate(
      id,
      businessId,
      newName
    );

    const authUser = getUserFromRequest(req);
    if (authUser) {
      void recordOrgChartPermissionSetCopied({
        actorUserId: authUser.id,
        businessId,
        sourcePermissionSetId: id,
        newPermissionSetId: permissionSet.id,
        newName,
      });
    }
    
    res.status(201).json(permissionSet);
  } catch (error) {
    logSrvErr('org_chart_error_copying_permission_set', 'Error copying permission set:', error);
    res.status(500).json({ error: 'Failed to copy permission set' });
  }
});

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

/**
 * POST /api/org-chart/employees/assign
 * Assign an employee to a position
 * NOTE: Static paths must be registered before `/employees/:businessId`.
 */
router.post(
  '/employees/assign',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN),
  async (req, res) => {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const assignmentData = { ...req.body, assignedById: authUser.id };
    const assignment = await employeeManagementService.assignEmployeeToPosition(assignmentData);
    void recordOrgChartEmployeeAssigned({
      actorUserId: authUser.id,
      businessId: assignmentData.businessId,
      assignmentId: assignment.id,
      userId: assignmentData.userId,
      positionId: assignmentData.positionId,
    });
    res.status(201).json(assignment);
  } catch (error: unknown) {
    if (error instanceof EmployeeAssignmentValidationError) {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    logSrvErr('org_chart_error_assigning_employee', 'Error assigning employee:', error);
    res.status(500).json({ error: 'Failed to assign employee' });
  }
});

/**
 * DELETE /api/org-chart/employees/remove
 * Remove an employee from a position
 */
router.delete(
  '/employees/remove',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN),
  async (req, res) => {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { userId, positionId, businessId } = req.body;
    await employeeManagementService.removeEmployeeFromPosition(userId, positionId, businessId);
    void recordOrgChartEmployeeRemoved({
      actorUserId: authUser.id,
      businessId,
      userId,
      positionId,
    });
    res.status(204).send();
  } catch (error) {
    logSrvErr('org_chart_error_removing_employee', 'Error removing employee:', error);
    res.status(500).json({ error: 'Failed to remove employee' });
  }
});

/**
 * POST /api/org-chart/employees/transfer
 * Transfer an employee to a different position
 */
router.post(
  '/employees/transfer',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN),
  async (req, res) => {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { userId, fromPositionId, toPositionId, businessId, effectiveDate } = req.body;
    const transfer = await employeeManagementService.transferEmployee(
      userId,
      fromPositionId,
      toPositionId,
      businessId,
      authUser.id,
      effectiveDate ? new Date(effectiveDate) : undefined
    );
    void recordOrgChartEmployeeTransferred({
      actorUserId: authUser.id,
      businessId,
      transferId: transfer.id,
      userId,
      fromPositionId,
      toPositionId,
    });
    res.status(201).json(transfer);
  } catch (error: unknown) {
    if (error instanceof EmployeeAssignmentValidationError) {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    logSrvErr('org_chart_error_transferring_employee', 'Error transferring employee:', error);
    res.status(500).json({ error: 'Failed to transfer employee' });
  }
});

/**
 * POST /api/org-chart/employees/validate
 * Validate employee assignment
 */
router.post(
  '/employees/validate',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN),
  async (req, res) => {
  try {
    const { userId, positionId, businessId } = req.body;
    const validation = await employeeManagementService.validateEmployeeAssignment(userId, positionId, businessId);
    res.json(validation);
  } catch (error) {
    logSrvErr('org_chart_error_validating_employee_assignment', 'Error validating employee assignment:', error);
    res.status(500).json({ error: 'Failed to validate employee assignment' });
  }
});

/**
 * GET /api/org-chart/employees/user/:userId/:businessId
 * Get employee's current positions
 */
router.get(
  '/employees/user/:userId/:businessId',
  requireEmployeeUserOrManager,
  async (req, res) => {
  try {
    const { userId, businessId } = req.params;
    const positions = await employeeManagementService.getEmployeePositions(userId, businessId);
    res.json(positions);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employee_positions', 'Error fetching employee positions:', error);
    res.status(500).json({ error: 'Failed to fetch employee positions' });
  }
});

/**
 * GET /api/org-chart/employees/history/:userId/:businessId
 * Get employee assignment history
 */
router.get(
  '/employees/history/:userId/:businessId',
  requireEmployeeUserOrManager,
  async (req, res) => {
  try {
    const { userId, businessId } = req.params;
    const history = await employeeManagementService.getEmployeeAssignmentHistory(userId, businessId);
    res.json(history);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employee_assignment_history', 'Error fetching employee assignment history:', error);
    res.status(500).json({ error: 'Failed to fetch employee assignment history' });
  }
});

/**
 * GET /api/org-chart/employees/department/:businessId/:departmentId
 * Get employees by department
 */
router.get(
  '/employees/department/:businessId/:departmentId',
  requireOrgChartAccess(fromParam('businessId'), 'member'),
  async (req, res) => {
  try {
    const { businessId, departmentId } = req.params;
    const employees = await employeeManagementService.getEmployeesByDepartment(businessId, departmentId);
    res.json(employees);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employees_by_department', 'Error fetching employees by department:', error);
    res.status(500).json({ error: 'Failed to fetch employees by department' });
  }
});

/**
 * GET /api/org-chart/employees/tier/:businessId/:tierId
 * Get employees by organizational tier
 */
router.get(
  '/employees/tier/:businessId/:tierId',
  requireOrgChartAccess(fromParam('businessId'), 'member'),
  async (req, res) => {
  try {
    const { businessId, tierId } = req.params;
    const employees = await employeeManagementService.getEmployeesByTier(businessId, tierId);
    res.json(employees);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employees_by_tier', 'Error fetching employees by tier:', error);
    res.status(500).json({ error: 'Failed to fetch employees by tier' });
  }
});

/**
 * GET /api/org-chart/employees/summary/:businessId
 * Get business employee summary
 */
router.get('/employees/summary/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const summary = await employeeManagementService.getBusinessEmployeeSummary(businessId);
    res.json(summary);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employee_summary', 'Error fetching employee summary:', error);
    res.status(500).json({ error: 'Failed to fetch employee summary' });
  }
});

/**
 * GET /api/org-chart/employees/capacity/:businessId
 * Get positions with available capacity
 */
router.get('/employees/capacity/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const positionsWithCapacity = await employeeManagementService.getPositionsWithCapacity(businessId);
    res.json(positionsWithCapacity);
  } catch (error) {
    logSrvErr('org_chart_error_fetching_positions_with_capacity', 'Error fetching positions with capacity:', error);
    res.status(500).json({ error: 'Failed to fetch positions with capacity' });
  }
});

/**
 * GET /api/org-chart/employees/:businessId/vacant
 * Get vacant positions for a business
 */
router.get('/employees/:businessId/vacant', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const vacantPositions = await employeeManagementService.getVacantPositions(businessId);
    res.json({ success: true, data: vacantPositions });
  } catch (error) {
    logSrvErr('org_chart_error_fetching_vacant_positions', 'Error fetching vacant positions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch vacant positions' });
  }
});

/**
 * GET /api/org-chart/employees/:businessId
 * Get all employees for a business
 * NOTE: Keep after more specific `/employees/...` paths.
 */
router.get('/employees/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const employees = await employeeManagementService.getBusinessEmployees(businessId);
    res.json({ success: true, data: employees });
  } catch (error) {
    logSrvErr('org_chart_error_fetching_employees', 'Error fetching employees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
});

// ============================================================================
// APPROVAL HIERARCHY (BA-F-005)
// ============================================================================

/**
 * GET /api/org-chart/approval-hierarchy/resolve/:businessId/:employeePositionId
 * Resolve approval chain for an employee position
 */
router.get(
  '/approval-hierarchy/resolve/:businessId/:employeePositionId',
  requireOrgChartAccess(fromParam('businessId'), 'member'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ),
  async (req, res) => {
    try {
      const { businessId, employeePositionId } = req.params;
      const approvalType =
        typeof req.query.approvalType === 'string' ? req.query.approvalType : undefined;
      const resolution = await approvalHierarchyService.resolveApprovalChain(
        businessId,
        employeePositionId,
        approvalType
      );
      res.json({ success: true, data: resolution });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_resolve', 'Error resolving approval chain:', error);
      res.status(500).json({ error: 'Failed to resolve approval chain' });
    }
  }
);

/**
 * GET /api/org-chart/approval-hierarchy/validate/:businessId
 * Validate approval hierarchy integrity for a business
 */
router.get(
  '/approval-hierarchy/validate/:businessId',
  requireOrgChartAccess(fromParam('businessId'), 'member'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const validation = await approvalHierarchyService.validateApprovalHierarchyIntegrity(businessId);
      const authUser = getUserFromRequest(req);
      if (authUser) {
        void recordApprovalHierarchyValidated({
          actorUserId: authUser.id,
          businessId,
          valid: validation.valid,
          issueCount: validation.issues.length,
        });
      }
      res.json({ success: true, data: validation });
    } catch (error) {
      logSrvErr('approval_hierarchy_validate', 'Error validating approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to validate approval hierarchy' });
    }
  }
);

/**
 * GET /api/org-chart/approval-hierarchy/entries/:id
 * Get approval hierarchy entry detail
 */
router.get(
  '/approval-hierarchy/entries/:id',
  requireMemberForApprovalHierarchyId(),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await approvalHierarchyService.getApprovalHierarchyById(id);
      if (!entry) {
        return res.status(404).json({ error: 'Approval hierarchy entry not found' });
      }
      res.json({ success: true, data: entry });
    } catch (error) {
      logSrvErr('approval_hierarchy_detail', 'Error fetching approval hierarchy entry:', error);
      res.status(500).json({ error: 'Failed to fetch approval hierarchy entry' });
    }
  }
);

/**
 * POST /api/org-chart/approval-hierarchy/assign/employee
 */
router.post(
  '/approval-hierarchy/assign/employee',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const authUser = getUserFromRequest(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await approvalHierarchyService.assignApprovalHierarchyToEmployee(req.body);
      void recordApprovalHierarchyAssigned({
        actorUserId: authUser.id,
        businessId: req.body.businessId,
        assignmentTarget: 'employee',
        targetId: req.body.employeePositionId,
        entriesCreated: result.entriesCreated,
        entriesUpdated: result.entriesUpdated,
      });
      res.status(result.entriesCreated > 0 ? 201 : 200).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_assign_employee', 'Error assigning approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to assign approval hierarchy to employee' });
    }
  }
);

/**
 * POST /api/org-chart/approval-hierarchy/assign/position
 */
router.post(
  '/approval-hierarchy/assign/position',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const authUser = getUserFromRequest(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await approvalHierarchyService.assignApprovalHierarchyToPosition(req.body);
      void recordApprovalHierarchyAssigned({
        actorUserId: authUser.id,
        businessId: req.body.businessId,
        assignmentTarget: 'position',
        targetId: req.body.positionId,
        entriesCreated: result.entriesCreated,
        entriesUpdated: result.entriesUpdated,
      });
      res.status(result.entriesCreated > 0 ? 201 : 200).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_assign_position', 'Error assigning approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to assign approval hierarchy to position' });
    }
  }
);

/**
 * POST /api/org-chart/approval-hierarchy/assign/department
 */
router.post(
  '/approval-hierarchy/assign/department',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const authUser = getUserFromRequest(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await approvalHierarchyService.assignApprovalHierarchyToDepartment(req.body);
      void recordApprovalHierarchyAssigned({
        actorUserId: authUser.id,
        businessId: req.body.businessId,
        assignmentTarget: 'department',
        targetId: req.body.departmentId,
        entriesCreated: result.entriesCreated,
        entriesUpdated: result.entriesUpdated,
      });
      res.status(result.entriesCreated > 0 ? 201 : 200).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_assign_department', 'Error assigning approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to assign approval hierarchy to department' });
    }
  }
);

/**
 * POST /api/org-chart/approval-hierarchy
 * Create approval hierarchy entry
 */
router.post(
  '/approval-hierarchy',
  requireOrgChartAccess(fromBody('businessId'), 'manage'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const authUser = getUserFromRequest(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const entry = await approvalHierarchyService.createApprovalHierarchy(req.body);
      void recordApprovalHierarchyCreated({
        actorUserId: authUser.id,
        businessId: entry.businessId,
        hierarchyId: entry.id,
        employeePositionId: entry.employeePositionId,
        managerPositionId: entry.managerPositionId,
      });
      res.status(201).json({ success: true, data: entry });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_create', 'Error creating approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to create approval hierarchy' });
    }
  }
);

/**
 * PATCH /api/org-chart/approval-hierarchy/:id
 */
router.patch(
  '/approval-hierarchy/:id',
  requireManageForApprovalHierarchyId,
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body as Record<string, unknown>;
      const entry = await approvalHierarchyService.updateApprovalHierarchy(id, req.body);
      const authUser = getUserFromRequest(req);
      if (authUser) {
        void recordApprovalHierarchyUpdated({
          actorUserId: authUser.id,
          businessId: entry.businessId,
          hierarchyId: entry.id,
          changedFields: Object.keys(updateData),
        });
      }
      res.json({ success: true, data: entry });
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_update', 'Error updating approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to update approval hierarchy' });
    }
  }
);

/**
 * DELETE /api/org-chart/approval-hierarchy/:id
 */
router.delete(
  '/approval-hierarchy/:id',
  requireManageForApprovalHierarchyId,
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await prisma.managerApprovalHierarchy.findUnique({
        where: { id },
        select: { businessId: true },
      });
      await approvalHierarchyService.deleteApprovalHierarchy(id);
      const authUser = getUserFromRequest(req);
      if (authUser && existing) {
        void recordApprovalHierarchyDeleted({
          actorUserId: authUser.id,
          businessId: existing.businessId,
          hierarchyId: id,
        });
      }
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof ApprovalHierarchyValidationError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      logSrvErr('approval_hierarchy_delete', 'Error deleting approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to delete approval hierarchy' });
    }
  }
);

/**
 * GET /api/org-chart/approval-hierarchy/:businessId
 * List approval hierarchy entries for a business
 */
router.get(
  '/approval-hierarchy/:businessId',
  requireOrgChartAccess(fromParam('businessId'), 'member'),
  checkOrgChartPolicy(POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ),
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const employeePositionId =
        typeof req.query.employeePositionId === 'string' ? req.query.employeePositionId : undefined;
      const activeOnly = req.query.activeOnly === 'true';
      const entries = await approvalHierarchyService.listApprovalHierarchies(businessId, {
        employeePositionId,
        activeOnly,
      });
      res.json({ success: true, data: entries });
    } catch (error) {
      logSrvErr('approval_hierarchy_list', 'Error listing approval hierarchy:', error);
      res.status(500).json({ error: 'Failed to list approval hierarchy' });
    }
  }
);

/**
 * GET /api/org-chart/:businessId
 * Get complete org chart structure for a business (alias for structure endpoint)
 * NOTE: This route must be placed at the end to avoid conflicts with more specific routes
 */
router.get('/:businessId', requireOrgChartAccess(fromParam('businessId'), 'member'), async (req, res) => {
  try {
    const { businessId } = req.params;
    
    if (!businessId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Business ID is required' 
      });
    }
    
    const structure = await orgChartService.getOrgChartStructure(businessId);
    
    // Transform the response to match frontend expectations
    const response = {
      success: true,
      tiers: structure.tiers,
      departments: structure.departments,
      positions: structure.positions,
      hierarchy: {
        departments: structure.departments,
        positions: structure.positions
      }
    };
    
    res.json(response);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logSrvErr('org_chart_fetch', 'Error fetching org chart', error, {
      businessId: req.params.businessId,
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch org chart',
      message: err.message
    });
  }
});

export default router;
