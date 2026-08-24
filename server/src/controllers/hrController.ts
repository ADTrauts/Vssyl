/**
 * HR MODULE CONTROLLERS
 * 
 * FRAMEWORK IMPLEMENTATION - Returns stub data
 * Actual feature logic will be implemented later
 */

import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import {
  EmployeeType as PrismaEmployeeType,
  AttendanceExceptionStatus,
  AttendanceMethod,
  AttendanceRecordStatus,
  OnboardingTaskOwnerType,
  OnboardingTaskStatus,
  OnboardingTaskType,
} from '@prisma/client';
import { logger } from '../lib/logger';
import { z } from 'zod';
import {
  getAttendanceOverview as getAttendanceOverviewService,
  listAttendancePolicies,
  listAttendanceExceptionsForManager,
  listEmployeeAttendanceRecords,
  recordPunchIn,
  recordPunchOut,
  ResolveAttendanceExceptionInput,
  resolveTeamAttendanceExceptionForManager,
  upsertAttendancePolicy,
} from '../services/hrAttendanceService';
import {
  archiveOnboardingTemplate,
  completeOnboardingTask as completeOnboardingTaskService,
  deliverDocumentsAfterJourneyStart,
  findEmployeeHrProfileByUser,
  findEmployeeOwnedOnboardingTask,
  findTeamOnboardingTaskForManager,
  getOnboardingDocumentLibrary as getOnboardingDocumentLibraryService,
  listEmployeeJourneysForUser,
  listEmployeeJourneys as listEmployeeJourneysService,
  listOnboardingTemplates as listOnboardingTemplatesService,
  listOnboardingTasksForEmployeePositions,
  startOnboardingJourney as startOnboardingJourneyService,
  upsertOnboardingTemplate as upsertOnboardingTemplateService,
} from '../services/hrOnboardingService';
import {
  getOnboardingAnalytics,
  getAttendanceAnalytics,
  getTimeOffAnalytics,
} from '../services/hrAnalyticsService';
import { getDashboardSummary as getDashboardSummaryService, generateTimeOffReports } from '../services/hrAnalyticsSupportService';
import {
  createEmployeeProfile,
  exportEmployeesToCsv,
  getAdminEmployee as getAdminEmployeeService,
  getDefaultOrganizationalTierId,
  getEmployeeAuditLogs as getEmployeeAuditLogsService,
  getEmployeeFilterOptions as getEmployeeFilterOptionsService,
  getOwnHrData as getOwnHrDataService,
  getTeamEmployees as getTeamEmployeesService,
  importEmployeesFromCsv,
  listAdminEmployees,
  terminateEmployee as terminateEmployeeService,
  updateEmployeeProfile,
} from '../services/hrEmployeeService';
import {
  approveTeamTimeOff as approveTeamTimeOffService,
  cancelTimeOffRequest as cancelTimeOffRequestService,
  getMyTimeOffRequests as getMyTimeOffRequestsService,
  getPendingTeamTimeOff as getPendingTeamTimeOffService,
  getTimeOffBalance as getTimeOffBalanceService,
  getTimeOffCalendar as getTimeOffCalendarService,
  InsufficientPtoBalanceError,
  requestTimeOff as requestTimeOffService,
  TimeOffConflictError,
} from '../services/hrPtoService';
import {
  getHRFeatureAvailability as getHRFeatureAvailabilityService,
  getHRSettings as getHRSettingsService,
  updateHRSettings as updateHRSettingsService,
} from '../services/hrSettingsService';
import { softTrashEmployeeProfile, HRTrashError } from '../services/hrTrashService';
import {
  FieldValidationError,
  findActiveEmployeePositionId,
  HRWorkflowError,
  normalizeWorkingDays,
  parseJsonField,
  resolveManagerContext,
} from '../services/hrServiceShared';

function logHrControllerError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY', 'SEASONAL']);

const jsonFieldInputSchema = z.union([z.record(z.unknown()), z.string(), z.null()]).optional();

const employeeUpdateSchema = z.object({
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format').optional(),
  employeeType: employeeTypeEnum.optional(),
  workLocation: z.string().max(255, 'Work location must be 255 characters or less').optional(),
  emergencyContact: jsonFieldInputSchema,
  personalInfo: jsonFieldInputSchema
}).refine((data) => {
  // At least one field must be provided
  return Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined);
}, { message: 'At least one field must be provided for update' });

const employeeCreateSchema = z.object({
  employeePositionId: z.string().uuid('Invalid employee position ID'),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format').optional(),
  employeeType: employeeTypeEnum.optional(),
  workLocation: z.string().max(255, 'Work location must be 255 characters or less').optional(),
  emergencyContact: jsonFieldInputSchema,
  personalInfo: jsonFieldInputSchema
});

const employeeTerminationSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
  reason: z.string().max(255, 'Reason must be 255 characters or less').optional(),
  notes: jsonFieldInputSchema
});

const attendancePolicySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
  roundingIncrementMinutes: z.number().int().positive().max(240).optional().nullable(),
  gracePeriodMinutes: z.number().int().nonnegative().max(120).optional().nullable(),
  autoClockOutAfterMinutes: z.number().int().positive().max(1440).optional().nullable(),
  requireGeolocation: z.boolean().optional(),
  geofenceRadiusMeters: z.number().int().positive().max(50000).optional().nullable(),
  workingDays: z.array(z.string().min(2).max(16)).optional(),
  metadata: jsonFieldInputSchema,
  isDefault: z.boolean().optional(),
  effectiveFrom: z.string().datetime({ offset: true }).optional().nullable(),
  effectiveTo: z.string().datetime({ offset: true }).optional().nullable(),
  active: z.boolean().optional()
});

const attendancePunchSchema = z.object({
  employeePositionId: z.string().uuid().optional(),
  method: z.nativeEnum(AttendanceMethod).default(AttendanceMethod.WEB),
  source: z.string().max(120).optional(),
  location: jsonFieldInputSchema,
  metadata: jsonFieldInputSchema,
  recordId: z.string().uuid().optional()
});

const attendanceExceptionStatusEnum = z.nativeEnum(AttendanceExceptionStatus);

const attendanceExceptionFilterSchema = z.object({
  statuses: z
    .union([
      attendanceExceptionStatusEnum,
      z.array(attendanceExceptionStatusEnum)
    ])
    .optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
});

const attendanceExceptionResolutionSchema = z.object({
  status: attendanceExceptionStatusEnum,
  resolutionNote: z.string().max(1000).optional().nullable(),
  managerNote: z.string().max(1000).optional().nullable(),
  adjustments: z
    .object({
      clockInTime: z.string().datetime({ offset: true }).nullable().optional(),
      clockOutTime: z.string().datetime({ offset: true }).nullable().optional(),
      status: z.nativeEnum(AttendanceRecordStatus).optional(),
      varianceMinutes: z.number().int().min(-1440).max(1440).optional()
    })
    .optional()
});

const onboardingTaskTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  orderIndex: z.number().int().min(0).optional().nullable(),
  taskType: z.nativeEnum(OnboardingTaskType).optional(),
  ownerType: z.nativeEnum(OnboardingTaskOwnerType).optional(),
  ownerReference: z.string().max(255).optional().nullable(),
  dueOffsetDays: z.number().int().min(-365).max(365).optional().nullable(),
  requiresApproval: z.boolean().optional(),
  requiresDocument: z.boolean().optional(),
  metadata: jsonFieldInputSchema,
  isActive: z.boolean().optional()
});

const onboardingTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  ownerUserId: z.string().uuid().optional().nullable(),
  applicabilityRules: jsonFieldInputSchema,
  automationSettings: jsonFieldInputSchema,
  tasks: z.array(onboardingTaskTemplateSchema).optional()
});

const onboardingJourneyStartSchema = z.object({
  employeeHrProfileId: z.string().uuid(),
  onboardingTemplateId: z.string().uuid().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  metadata: jsonFieldInputSchema
});

const onboardingTaskCompletionSchema = z.object({
  status: z.nativeEnum(OnboardingTaskStatus).optional(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: jsonFieldInputSchema,
  approved: z.boolean().optional(),
  approvedByUserId: z.string().uuid().optional()
});

const resolveBusinessId = (req: Request): string | null => {
  const queryId = req.query.businessId;
  if (typeof queryId === 'string' && queryId.length > 0) {
    return queryId;
  }
  const bodyId = (req.body as Record<string, unknown>)?.businessId;
  if (typeof bodyId === 'string' && bodyId.length > 0) {
    return bodyId;
  }
  return null;
};

/**
 * GET /api/hr/dashboard-summary?businessId=xxx
 * Returns counts for dashboard widget: employees, pending time-off, pending onboarding tasks.
 */
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      res.status(400).json({ error: 'businessId is required' });
      return;
    }

    const summary = await getDashboardSummaryService(businessId);
    res.json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load HR summary';
    logHrControllerError('Error fetching HR dashboard summary', 'hr_dashboard_summary', error);
    res.status(500).json({ error: message });
  }
};

// ============================================================================
// ADMIN CONTROLLERS (Business Admin Dashboard)
// ============================================================================

/**
 * Get all employees (Admin view)
 * Framework: Returns basic employee list
 */
export const getAdminEmployees = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const statusParam = req.query.status;
    const status = statusParam && typeof statusParam === 'string' ? statusParam : 'ACTIVE';
    const qParam = req.query.q;
    const q = qParam && typeof qParam === 'string' ? qParam : '';
    const departmentIdParam = req.query.departmentId;
    const departmentId =
      departmentIdParam && typeof departmentIdParam === 'string' ? departmentIdParam : undefined;
    const positionIdParam = req.query.positionId;
    const positionId =
      positionIdParam && typeof positionIdParam === 'string' ? positionIdParam : undefined;
    const sortByParam = req.query.sortBy;
    const sortBy = sortByParam && typeof sortByParam === 'string' ? sortByParam : 'createdAt';
    const sortOrderParam = req.query.sortOrder;
    const rawSortOrder = sortOrderParam && typeof sortOrderParam === 'string' ? sortOrderParam : 'desc';
    const sortOrder = rawSortOrder === 'asc' ? 'asc' : 'desc';
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    const result = await listAdminEmployees({
      businessId: businessIdParam,
      status,
      q,
      departmentId,
      positionId,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });

    return res.json({
      employees: result.employees,
      count: result.count,
      page: result.page,
      pageSize: result.pageSize,
      tier: req.hrTier,
      features: req.hrFeatures,
    });
  } catch (error) {
    logHrControllerError('Error fetching employees', 'hr_employees_list', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Get filter options (departments and positions) for employee directory
 */
export const getEmployeeFilterOptions = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const options = await getEmployeeFilterOptionsService(businessIdParam);
    return res.json(options);
  } catch (error) {
    logHrControllerError('Error fetching filter options', 'hr_filter_options', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch filter options';
    res.status(500).json({ error: errorMessage });
  }
};

export const getAdminEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const result = await getAdminEmployeeService(businessIdParam, id);
    res.json(result);
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error fetching employee', 'hr_employee_get', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

/**
 * Create new employee
 * Framework: Stub - returns success message
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = employeeCreateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { employeePositionId, hireDate, employeeType, workLocation, emergencyContact, personalInfo } =
      validationResult.data;

    let emergencyContactJson;
    let personalInfoJson;
    try {
      emergencyContactJson = parseJsonField(emergencyContact, 'emergencyContact');
      personalInfoJson = parseJsonField(personalInfo, 'personalInfo');
    } catch (fieldError) {
      if (fieldError instanceof FieldValidationError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: [{ path: [fieldError.field], message: fieldError.message }],
        });
      }
      throw fieldError;
    }

    const { hrProfile } = await createEmployeeProfile({
      businessId: businessIdParam,
      userId,
      employeePositionId,
      hireDate,
      employeeType: employeeType as PrismaEmployeeType | undefined,
      workLocation,
      emergencyContactJson,
      personalInfoJson,
    });

    return res.json({ message: 'Employee profile created', hrProfile });
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error creating employee', 'hr_employee_create', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create employee';
    res.status(500).json({ error: errorMessage });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const { id } = req.params;
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = employeeUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { hireDate, employeeType, workLocation, emergencyContact, personalInfo } = validationResult.data;

    let emergencyContactJson;
    let personalInfoJson;
    try {
      emergencyContactJson = parseJsonField(emergencyContact, 'emergencyContact');
      personalInfoJson = parseJsonField(personalInfo, 'personalInfo');
    } catch (fieldError) {
      if (fieldError instanceof FieldValidationError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: [{ path: [fieldError.field], message: fieldError.message }],
        });
      }
      throw fieldError;
    }

    const { hrProfile } = await updateEmployeeProfile({
      businessId: businessIdParam,
      userId,
      employeePositionId: id,
      hireDate,
      employeeType: employeeType as PrismaEmployeeType | undefined,
      workLocation,
      emergencyContactJson,
      personalInfoJson,
      fieldsProvided: {
        hireDate: hireDate !== undefined,
        employeeType: employeeType !== undefined,
        workLocation: workLocation !== undefined,
        emergencyContact: emergencyContact !== undefined,
        personalInfo: personalInfo !== undefined,
      },
    });

    return res.json({ message: 'Employee profile updated', hrProfile });
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error updating employee', 'hr_employee_update', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update employee';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Delete employee (soft delete)
 * Framework: Stub - returns success message
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const businessId = businessIdParam;
    const { id } = req.params; // employeePositionId
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await softTrashEmployeeProfile({
      userId,
      businessId,
      employeePositionId: id,
      deletedBy: userId,
      deletedReason: 'admin_deleted',
    });

    return res.json({ message: 'Employee HR profile moved to trash' });
  } catch (error: unknown) {
    if (error instanceof HRTrashError) {
      if (error.code === 'not_found') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      if (error.code === 'forbidden') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    logHrControllerError('Error deleting employee', 'hr_employee_delete', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

// ============================================================================
// ONBOARDING (Phase 1-2)
// ============================================================================

export const getOnboardingTemplates = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const templates = await listOnboardingTemplatesService(businessId);
    return res.json({ templates });
  } catch (error) {
    logHrControllerError('Error fetching onboarding templates', 'hr_onboarding_templates_list', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch onboarding templates';
    return res.status(500).json({ error: message });
  }
};

export const createOnboardingTemplate = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const payload = parseOnboardingTemplatePayload(req.body);
    const template = await upsertOnboardingTemplateService({
      ...payload,
      businessId
    });

    return res.status(201).json({ template });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details
      });
    }

    logHrControllerError('Error creating onboarding template', 'hr_onboarding_template_create', error);
    const message = error instanceof Error ? error.message : 'Failed to create onboarding template';
    return res.status(500).json({ error: message });
  }
};

export const updateOnboardingTemplate = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { templateId } = req.params;
    const payload = parseOnboardingTemplatePayload(req.body, templateId);
    const template = await upsertOnboardingTemplateService({
      ...payload,
      businessId
    });

    return res.json({ template });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details
      });
    }

    logHrControllerError('Error updating onboarding template', 'hr_onboarding_template_update', error);
    const message = error instanceof Error ? error.message : 'Failed to update onboarding template';
    return res.status(500).json({ error: message });
  }
};

export const deleteOnboardingTemplate = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { templateId } = req.params;
    await archiveOnboardingTemplate(businessId, templateId, req.user?.id ?? null);

    return res.json({ success: true });
  } catch (error) {
    logHrControllerError('Error archiving onboarding template', 'hr_onboarding_template_archive', error);
    const message = error instanceof Error ? error.message : 'Failed to archive onboarding template';
    return res.status(500).json({ error: message });
  }
};

export const getOnboardingDocumentLibrary = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User context required' });
    }

    const library = await getOnboardingDocumentLibraryService(userId, businessId);
    return res.json(library);
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to prepare business workspace') {
      return res.status(500).json({ error: error.message });
    }
    logHrControllerError('Error fetching onboarding document library', 'hr_onboarding_document_library', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch onboarding documents';
    return res.status(500).json({ error: message });
  }
};

export const startOnboardingJourney = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const payload = parseOnboardingJourneyStart(req.body);
    const journey = await startOnboardingJourneyService({
      ...payload,
      businessId,
      initiatedByUserId: req.user?.id ?? null,
    });

    let deliveredDocuments: Array<{ checklistId: string; fileId: string }> = [];
    try {
      deliveredDocuments = await deliverDocumentsAfterJourneyStart({
        businessId,
        employeeHrProfileId: payload.employeeHrProfileId,
        initiatedByUserId: req.user?.id ?? null,
      });
    } catch (deliveryError) {
      logHrControllerError('Error delivering onboarding documents', 'hr_onboarding_documents_deliver', deliveryError);
    }

    return res.status(201).json({ journey, deliveredDocuments });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details,
      });
    }

    logHrControllerError('Error starting onboarding journey', 'hr_onboarding_journey_start', error);
    const message = error instanceof Error ? error.message : 'Failed to start onboarding journey';
    return res.status(500).json({ error: message });
  }
};

export const getOnboardingJourneys = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const employeeHrProfileId = req.query.employeeHrProfileId as string | undefined;
    
    // If employeeHrProfileId is provided, return journeys for that employee
    if (employeeHrProfileId) {
      const journeys = await listEmployeeJourneysService(businessId, employeeHrProfileId);
      return res.json({ journeys });
    }

    // Otherwise, return all journeys for the business (admin view)
    const { listAllOnboardingJourneys } = await import('../services/hrOnboardingService');
    const journeys = await listAllOnboardingJourneys(businessId);
    return res.json({ journeys });
  } catch (error) {
    logHrControllerError('Error fetching onboarding journeys', 'hr_onboarding_journeys_list', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch onboarding journeys';
    return res.status(500).json({ error: message });
  }
};

export const completeOnboardingTask = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { taskId } = req.params;
    const completedByUserId = req.user?.id;
    if (!completedByUserId) {
      return res.status(401).json({ error: 'User context required to complete task' });
    }

    const payload = parseOnboardingTaskCompletion(req.body);

    const completedTask = await completeOnboardingTaskService({
      businessId,
      taskId,
      completedByUserId,
      status: payload.status,
      notes: payload.notes,
      metadata: payload.metadata,
      approved: payload.approved,
      approvedByUserId: payload.approvedByUserId ?? undefined
    });

    return res.json({ task: completedTask });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details
      });
    }

    logHrControllerError('Error completing onboarding task', 'hr_onboarding_task_complete', error);
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding task';
    return res.status(500).json({ error: message });
  }
};

// ============================================================================
// ONBOARDING - EMPLOYEE & MANAGER ROUTES
// ============================================================================

export const getMyOnboardingJourneys = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { profile, journeys } = await listEmployeeJourneysForUser(businessId, userId);
    return res.json({ profile, journeys });
  } catch (error) {
    logHrControllerError('Error fetching self onboarding journeys', 'hr_self_onboarding_journeys', error);
    return res.json({
      profile: null,
      journeys: [],
      message:
        error instanceof Error
          ? `Onboarding journeys unavailable: ${error.message}`
          : 'Onboarding journeys unavailable.'
    });
  }
};

export const completeMyOnboardingTask = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { taskId } = req.params;
    const profile = await findEmployeeHrProfileByUser(businessId, userId);
    if (!profile) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const task = await findEmployeeOwnedOnboardingTask(businessId, taskId, profile.id);

    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found' });
    }

    const payload = parseOnboardingTaskCompletion(req.body);

    const completedTask = await completeOnboardingTaskService({
      businessId,
      taskId,
      completedByUserId: userId,
      status: payload.status ?? OnboardingTaskStatus.COMPLETED,
      notes: payload.notes,
      metadata: payload.metadata,
      approved: payload.approved,
      approvedByUserId: payload.approvedByUserId ?? undefined
    });

    return res.json({ task: completedTask });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details
      });
    }

    logHrControllerError('Error completing self onboarding task', 'hr_self_onboarding_task_complete', error);
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding task';
    return res.status(500).json({ error: message });
  }
};

export const getTeamOnboardingTasks = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const managerContext = await resolveManagerContext(businessId, userId);
    if (
      !managerContext.managerPositionId ||
      managerContext.directReportEmployeePositionIds.length === 0
    ) {
      return res.json({ tasks: [] });
    }

    const tasks = await listOnboardingTasksForEmployeePositions(
      businessId,
      managerContext.directReportEmployeePositionIds
    );

    return res.json({ tasks });
  } catch (error) {
    logHrControllerError('Error fetching team onboarding tasks', 'hr_team_onboarding_tasks', error);
    const message = error instanceof Error ? error.message : 'Failed to load onboarding tasks';
    return res.status(500).json({ error: message });
  }
};

export const completeTeamOnboardingTask = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { taskId } = req.params;
    const managerContext = await resolveManagerContext(businessId, userId);
    if (
      !managerContext.managerPositionId ||
      managerContext.directReportEmployeePositionIds.length === 0
    ) {
      return res.status(403).json({ error: 'No onboarding tasks available for approval' });
    }

    const task = await findTeamOnboardingTaskForManager(
      businessId,
      taskId,
      managerContext.directReportEmployeePositionIds
    );

    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found' });
    }

    if (
      !task.onboardingJourney.employeeHrProfile ||
      !managerContext.directReportEmployeePositionIds.includes(
        task.onboardingJourney.employeeHrProfile.employeePositionId
      )
    ) {
      return res.status(403).json({ error: 'Not authorized to update this onboarding task' });
    }

    const payload = parseOnboardingTaskCompletion(req.body);

    const completedTask = await completeOnboardingTaskService({
      businessId,
      taskId,
      completedByUserId: userId,
      status: payload.status ?? OnboardingTaskStatus.COMPLETED,
      notes: payload.notes,
      metadata: payload.metadata,
      approved: payload.approved ?? true,
      approvedByUserId: payload.approvedByUserId ?? userId
    });

    return res.json({ task: completedTask });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field,
        details: error.details
      });
    }

    logHrControllerError('Error completing team onboarding task', 'hr_team_onboarding_task_complete', error);
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding task';
    return res.status(500).json({ error: message });
  }
};

// ============================================================================
// ATTENDANCE (Phase 3)
// ============================================================================

/**
 * Get high-level attendance overview for admin dashboard.
 */
export const getAttendanceOverview = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const overview = await getAttendanceOverviewService(businessId);
    return res.json({ overview });
  } catch (error) {
    logHrControllerError('Error fetching attendance overview', 'hr_attendance_overview', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch attendance overview';
    return res.status(500).json({ error: message });
  }
};

/**
 * List attendance policies for a business.
 */
export const getAttendancePolicies = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const policies = await listAttendancePolicies(businessId);
    return res.json({ policies });
  } catch (error) {
    logHrControllerError('Error listing attendance policies', 'hr_attendance_policies_list', error);
    const message = error instanceof Error ? error.message : 'Failed to list attendance policies';
    return res.status(500).json({ error: message });
  }
};

const parseAttendancePolicyBody = (body: unknown, id?: string) => {
  const result = attendancePolicySchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.flatten();
    const details = {
      fieldErrors: issues.fieldErrors,
      formErrors: issues.formErrors
    };
    throw new FieldValidationError('attendancePolicy', 'Invalid attendance policy payload', details);
  }

  const payload = result.data;
  const metadata = parseJsonField(payload.metadata, 'metadata');

  return {
    id,
    name: payload.name,
    description: payload.description ?? null,
    timezone: payload.timezone ?? null,
    roundingIncrementMinutes: payload.roundingIncrementMinutes ?? null,
    gracePeriodMinutes: payload.gracePeriodMinutes ?? null,
    autoClockOutAfterMinutes: payload.autoClockOutAfterMinutes ?? null,
    requireGeolocation: payload.requireGeolocation ?? false,
    geofenceRadiusMeters: payload.geofenceRadiusMeters ?? null,
    workingDays: normalizeWorkingDays(payload.workingDays),
    metadata,
    isDefault: payload.isDefault ?? false,
    effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
    effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
    active: payload.active ?? true
  };
};

const parseOnboardingTemplatePayload = (
  body: unknown,
  templateId?: string
) => {
  const result = onboardingTemplateSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.flatten();
    const details = {
      fieldErrors: issues.fieldErrors,
      formErrors: issues.formErrors
    };
    throw new FieldValidationError('onboardingTemplate', 'Invalid onboarding template payload', details);
  }

  const payload = result.data;
  const applicabilityRules = parseJsonField(payload.applicabilityRules, 'applicabilityRules');
  const automationSettings = parseJsonField(payload.automationSettings, 'automationSettings');

  const tasks = (payload.tasks ?? []).map((task) => {
    const metadata = parseJsonField(task.metadata, 'metadata');
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      orderIndex: task.orderIndex ?? null,
      taskType: task.taskType ?? OnboardingTaskType.CUSTOM,
      ownerType: task.ownerType ?? OnboardingTaskOwnerType.EMPLOYEE,
      ownerReference: task.ownerReference ?? null,
      dueOffsetDays: task.dueOffsetDays ?? null,
      requiresApproval: task.requiresApproval ?? false,
      requiresDocument: task.requiresDocument ?? false,
      metadata,
      isActive: task.isActive ?? true
    };
  });

  return {
    id: templateId ?? payload.id,
    name: payload.name,
    description: payload.description ?? null,
    isDefault: payload.isDefault ?? false,
    isActive: payload.isActive ?? true,
    ownerUserId: payload.ownerUserId ?? null,
    applicabilityRules,
    automationSettings,
    tasks
  };
};

const parseOnboardingJourneyStart = (body: unknown) => {
  const result = onboardingJourneyStartSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.flatten();
    const details = {
      fieldErrors: issues.fieldErrors,
      formErrors: issues.formErrors
    };
    throw new FieldValidationError('onboardingJourney', 'Invalid onboarding journey payload', details);
  }

  const payload = result.data;
  const metadata = parseJsonField(payload.metadata, 'metadata');

  return {
    employeeHrProfileId: payload.employeeHrProfileId,
    onboardingTemplateId: payload.onboardingTemplateId,
    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
    metadata
  };
};

const parseOnboardingTaskCompletion = (body: unknown) => {
  const result = onboardingTaskCompletionSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.flatten();
    const details = {
      fieldErrors: issues.fieldErrors,
      formErrors: issues.formErrors
    };
    throw new FieldValidationError('onboardingTask', 'Invalid onboarding task payload', details);
  }

  const payload = result.data;
  const metadata = parseJsonField(payload.metadata, 'metadata');

  return {
    status: payload.status,
    notes: payload.notes ?? null,
    metadata,
    approved: payload.approved ?? false,
    approvedByUserId: payload.approvedByUserId ?? null
  };
};

/**
 * Create a new attendance policy.
 */
export const createAttendancePolicy = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const payload = parseAttendancePolicyBody(req.body);

    const policy = await upsertAttendancePolicy({
      ...payload,
      businessId,
      metadata: payload.metadata === undefined ? undefined : payload.metadata
    });

    return res.status(201).json({ policy });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({ error: error.message, field: error.field, details: error.details });
    }

    logHrControllerError('Error creating attendance policy', 'hr_attendance_policy_create', error);
    const message = error instanceof Error ? error.message : 'Failed to create attendance policy';
    return res.status(500).json({ error: message });
  }
};

/**
 * Update an existing attendance policy.
 */
export const updateAttendancePolicy = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Policy ID is required' });
    }

    const payload = parseAttendancePolicyBody(req.body, id);

    const policy = await upsertAttendancePolicy({
      ...payload,
      businessId,
      metadata: payload.metadata === undefined ? undefined : payload.metadata
    });

    return res.json({ policy });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({ error: error.message, field: error.field, details: error.details });
    }

    logHrControllerError('Error updating attendance policy', 'hr_attendance_policy_update', error);
    const message = error instanceof Error ? error.message : 'Failed to update attendance policy';
    return res.status(500).json({ error: message });
  }
};

const parseAttendancePunchBody = (body: unknown) => {
  const result = attendancePunchSchema.safeParse(body);
  if (!result.success) {
    throw new FieldValidationError('attendancePunch', 'Invalid attendance punch payload');
  }

  const parsed = result.data;
  const location = parseJsonField(parsed.location, 'location');
  const metadata = parseJsonField(parsed.metadata, 'metadata');

  return {
    ...parsed,
    location,
    metadata
  };
};

/**
 * Employee self-service punch in.
 */
export const recordSelfAttendancePunchIn = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { employeePositionId, method, source, location, metadata } = parseAttendancePunchBody(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User session missing' });
    }

    const positionId =
      employeePositionId ??
      (await findActiveEmployeePositionId(businessId, userId));

    if (!positionId) {
      return res.status(404).json({ error: 'Active employee position not found for this user' });
    }

    const record = await recordPunchIn({
      businessId,
      employeePositionId: positionId,
      method,
      source: source ?? 'employee-self-service',
      location: location === undefined ? undefined : location,
      metadata: metadata === undefined ? undefined : metadata
    });

    return res.status(201).json({ record });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({ error: error.message, field: error.field });
    }

    if (error instanceof Error && error.message.includes('in-progress attendance record')) {
      return res.status(409).json({ error: error.message });
    }

    logHrControllerError('Error recording attendance punch-in', 'hr_attendance_punch_in', error);
    const message = error instanceof Error ? error.message : 'Failed to record attendance punch-in';
    return res.status(500).json({ error: message });
  }
};

/**
 * Employee self-service punch out.
 */
export const recordSelfAttendancePunchOut = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const { employeePositionId, recordId, method, source, location, metadata } = parseAttendancePunchBody(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User session missing' });
    }

    const positionId =
      employeePositionId ??
      (await findActiveEmployeePositionId(businessId, userId));

    if (!positionId) {
      return res.status(404).json({ error: 'Active employee position not found for this user' });
    }

    const record = await recordPunchOut({
      businessId,
      employeePositionId: positionId,
      recordId,
      method,
      source: source ?? 'employee-self-service',
      location: location === undefined ? undefined : location,
      metadata: metadata === undefined ? undefined : metadata
    });

    return res.json({ record });
  } catch (error) {
    if (error instanceof FieldValidationError) {
      return res.status(400).json({ error: error.message, field: error.field });
    }

    if (error instanceof Error && error.message.includes('No in-progress attendance record')) {
      return res.status(404).json({ error: error.message });
    }

    logHrControllerError('Error recording attendance punch-out', 'hr_attendance_punch_out', error);
    const message = error instanceof Error ? error.message : 'Failed to record attendance punch-out';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get attendance history for the authenticated employee.
 */
export const getMyAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User session missing' });
    }

    const { limit } = req.query;
    let take = 30;
    if (typeof limit === 'string') {
      const parsed = Number.parseInt(limit, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        take = Math.min(parsed, 100);
      }
    }

    const employeePositionId = await findActiveEmployeePositionId(businessId, userId);
    if (!employeePositionId) {
    return res.json({ records: [], message: 'No active employee position found; returning empty attendance history.' });
    }

    const records = await listEmployeeAttendanceRecords(businessId, employeePositionId, take);
    return res.json({ records });
  } catch (error) {
    logHrControllerError('Error fetching attendance records', 'hr_attendance_records', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch attendance records';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get audit logs for an employee
 */
export const getEmployeeAuditLogs = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const { id } = req.params;

    const result = await getEmployeeAuditLogsService(businessIdParam, id);
    return res.json(result);
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error fetching audit logs', 'hr_audit_logs_list', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    res.status(500).json({ error: errorMessage });
  }
};

export const terminateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const terminationValidation = employeeTerminationSchema.safeParse(req.body);
    if (!terminationValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: terminationValidation.error.errors,
      });
    }

    const { date, reason, notes } = terminationValidation.data;
    const terminationDate = date ? new Date(date) : new Date();

    let terminationNotes;
    try {
      terminationNotes = parseJsonField(notes ?? undefined, 'notes');
    } catch (fieldError) {
      if (fieldError instanceof FieldValidationError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: [{ path: [fieldError.field], message: fieldError.message }],
        });
      }
      throw fieldError;
    }

    const result = await terminateEmployeeService({
      businessId: businessIdParam,
      userId,
      employeePositionId: id,
      terminationDate,
      reason,
      terminationNotes,
      notesProvided: notes !== undefined,
    });

    return res.json({
      message: 'Employee terminated; position vacated',
      ...result,
    });
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error terminating employee', 'hr_employee_terminate', error);
    return res.status(500).json({ error: 'Failed to terminate employee' });
  }
};

export const getHRSettings = async (req: Request, res: Response) => {
  try {
    const result = await getHRSettingsService();
    res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching HR settings', 'hr_settings_get', error);
    res.status(500).json({ error: 'Failed to fetch HR settings' });
  }
};

export const updateHRSettings = async (req: Request, res: Response) => {
  try {
    const result = await updateHRSettingsService();
    res.json(result);
  } catch (error) {
    logHrControllerError('Error updating HR settings', 'hr_settings_update', error);
    res.status(500).json({ error: 'Failed to update HR settings' });
  }
};

export const getHRFeatureAvailability = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID required' });
    }

    const result = await getHRFeatureAvailabilityService(businessId);
    return res.status(200).json(result);
  } catch (error) {
    logHrControllerError('Error fetching HR feature availability', 'hr_features_availability', error);
    return res.status(500).json({ error: 'Failed to load HR feature availability' });
  }
};

// ============================================================================
// MANAGER CONTROLLERS (Team Management)
// ============================================================================

/**
 * Get team employees (Manager view)
 * Framework: Returns employees that report to this manager
 */
export const getTeamEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const result = await getTeamEmployeesService(businessIdParam, req.user.id);
    res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching team employees', 'hr_team_employees', error);
    res.status(500).json({ error: 'Failed to fetch team employees' });
  }
};

export const getTeamAttendanceExceptions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const managerContext = await resolveManagerContext(businessId, req.user.id);

    if (
      !managerContext.managerPositionId ||
      managerContext.directReportEmployeePositionIds.length === 0
    ) {
      return res.json({
        exceptions: [],
        total: 0,
        page: 1,
        pageSize: 20
      });
    }

    const normalizedStatuses = (() => {
      const raw = req.query.status;
      if (!raw) {
        return undefined;
      }
      const rawArray = Array.isArray(raw) ? raw : [raw];
      const validValues = new Set(Object.values(AttendanceExceptionStatus));
      const filtered = rawArray
        .map((value) => value?.toString().trim().toUpperCase())
        .filter(
          (value): value is AttendanceExceptionStatus =>
            !!value && validValues.has(value as AttendanceExceptionStatus)
        ) as AttendanceExceptionStatus[];
      return filtered.length > 0 ? filtered : undefined;
    })();

    const filterParse = attendanceExceptionFilterSchema.safeParse({
      statuses: normalizedStatuses,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: req.query.page,
      pageSize: req.query.pageSize
    });

    if (!filterParse.success) {
      return res.status(400).json({
        error: 'Invalid filter parameters',
        details: filterParse.error.flatten()
      });
    }

    const filterData = filterParse.data;

    const statusArray = Array.isArray(filterData.statuses)
      ? filterData.statuses.length > 0
        ? filterData.statuses
        : [AttendanceExceptionStatus.OPEN, AttendanceExceptionStatus.UNDER_REVIEW]
      : filterData.statuses
      ? [filterData.statuses]
      : [AttendanceExceptionStatus.OPEN, AttendanceExceptionStatus.UNDER_REVIEW];

    const startDate = filterData.startDate ? new Date(filterData.startDate) : undefined;
    const endDate = filterData.endDate ? new Date(filterData.endDate) : undefined;

    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      return res.status(400).json({ error: 'Invalid date range provided.' });
    }

    const result = await listAttendanceExceptionsForManager({
      businessId,
      employeePositionIds: managerContext.directReportEmployeePositionIds,
      statuses: statusArray,
      startDate,
      endDate,
      search: filterData.search,
      page: filterData.page,
      pageSize: filterData.pageSize
    });

    return res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching attendance exceptions', 'hr_attendance_exceptions', error);
    return res.status(500).json({ error: 'Failed to fetch attendance exceptions' });
  }
};

export const resolveTeamAttendanceException = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const exceptionId = req.params?.id;
    if (!exceptionId) {
      return res.status(400).json({ error: 'Exception ID is required' });
    }

    const managerContext = await resolveManagerContext(businessId, req.user.id);
    if (
      !managerContext.managerPositionId ||
      managerContext.directReportEmployeePositionIds.length === 0
    ) {
      return res.status(403).json({ error: 'Not authorized to resolve this exception' });
    }

    const payloadParse = attendanceExceptionResolutionSchema.safeParse(req.body);
    if (!payloadParse.success) {
      return res.status(400).json({
        error: 'Invalid resolution payload',
        details: payloadParse.error.flatten(),
      });
    }

    const payload = payloadParse.data;

    const allowedStatuses: AttendanceExceptionStatus[] = [
      AttendanceExceptionStatus.UNDER_REVIEW,
      AttendanceExceptionStatus.RESOLVED,
      AttendanceExceptionStatus.DISMISSED,
    ];

    if (!allowedStatuses.includes(payload.status)) {
      return res.status(400).json({
        error: 'Unsupported status. Use UNDER_REVIEW, RESOLVED, or DISMISSED.',
      });
    }

    let attendanceAdjustments: ResolveAttendanceExceptionInput['attendanceAdjustments'] | undefined;
    let resolutionPayload: Prisma.InputJsonValue | null = null;

    if (payload.adjustments) {
      const adjustmentsJson: Record<string, unknown> = {};
      const adjustments: ResolveAttendanceExceptionInput['attendanceAdjustments'] = {};

      if ('clockInTime' in payload.adjustments) {
        if (payload.adjustments.clockInTime === null || payload.adjustments.clockInTime === undefined) {
          adjustments.clockInTime = null;
        } else {
          const parsed = new Date(payload.adjustments.clockInTime);
          if (Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ error: 'Invalid clockInTime value' });
          }
          adjustments.clockInTime = parsed;
        }
        adjustmentsJson.clockInTime = payload.adjustments.clockInTime ?? null;
      }

      if ('clockOutTime' in payload.adjustments) {
        if (payload.adjustments.clockOutTime === null || payload.adjustments.clockOutTime === undefined) {
          adjustments.clockOutTime = null;
        } else {
          const parsed = new Date(payload.adjustments.clockOutTime);
          if (Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ error: 'Invalid clockOutTime value' });
          }
          adjustments.clockOutTime = parsed;
        }
        adjustmentsJson.clockOutTime = payload.adjustments.clockOutTime ?? null;
      }

      if (payload.adjustments.status) {
        adjustments.status = payload.adjustments.status;
        adjustmentsJson.status = payload.adjustments.status;
      }

      if ('varianceMinutes' in payload.adjustments) {
        adjustments.varianceMinutes = payload.adjustments.varianceMinutes ?? null;
        adjustmentsJson.varianceMinutes = payload.adjustments.varianceMinutes ?? null;
      }

      attendanceAdjustments = adjustments;
      resolutionPayload = adjustmentsJson as Prisma.InputJsonValue;
    }

    try {
      const refreshed = await resolveTeamAttendanceExceptionForManager({
        businessId,
        exceptionId,
        managerUserId: req.user.id,
        directReportEmployeePositionIds: managerContext.directReportEmployeePositionIds,
        status: payload.status,
        resolutionNote: payload.resolutionNote ?? null,
        managerNote: payload.managerNote ?? null,
        resolutionPayload,
        attendanceAdjustments,
      });

      return res.json({ exception: refreshed });
    } catch (resolveError) {
      if (resolveError instanceof Error) {
        if (resolveError.message === 'Attendance exception not found') {
          return res.status(404).json({ error: resolveError.message });
        }
        if (resolveError.message === 'Not authorized to resolve this exception') {
          return res.status(403).json({ error: resolveError.message });
        }
      }
      throw resolveError;
    }
  } catch (error) {
    logHrControllerError('Error resolving attendance exception', 'hr_attendance_exception_resolve', error);
    return res.status(500).json({ error: 'Failed to resolve attendance exception' });
  }
};

// ============================================================================
// EMPLOYEE CONTROLLERS (Self-Service)
// ============================================================================

/**
 * Get own HR data
 * Framework: Returns employee's own HR profile
 */
export const getOwnHRData = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    if (!user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await getOwnHrDataService(businessIdParam, user.id);
    if (result.message) {
      return res.json({ employee: result.employee, message: result.message });
    }
    res.json({ employee: result.employee });
  } catch (error) {
    logHrControllerError('Error fetching own HR data', 'hr_own_profile_get', error);
    res.status(500).json({ error: 'Failed to fetch your HR data' });
  }
};

/**
 * Update own HR data (limited fields)
 * Framework: Stub - returns success message
 */
export const updateOwnHRData = async (req: Request, res: Response) => {
  try {
    // TODO: Implement employee self-update (emergency contact, etc.)
    res.json({ 
      message: 'Self-service update - framework stub',
      note: 'Feature implementation pending'
    });
  } catch (error) {
    logHrControllerError('Error updating own HR data', 'hr_own_profile_update', error);
    res.status(500).json({ error: 'Failed to update your HR data' });
  }
};

// ============================================================================
// AI CONTEXT PROVIDERS (Required for AI integration)
// ============================================================================

/**
 * AI CONTEXT PROVIDERS
 * Delegate to dedicated AI context controller
 */
export {
  getHROverviewContext,
  getEmployeeHeadcountContext as getHeadcountContext,
  getTimeOffSummaryContext as getTimeOffContext,
  getSelfEmploymentContext,
} from './hrAIContextController';

// ============================================================================
// TIME-OFF IMPLEMENTATION (Phase 3)
// ==========================================================================

export const requestTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const { type, startDate, endDate, reason } = req.body as {
      type: string;
      startDate: string;
      endDate: string;
      reason?: string;
    };

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Type, start date, and end date are required' });
    }

    const { request } = await requestTimeOffService({
      businessId: businessIdParam,
      userId: user.id,
      userName: user.name ?? null,
      userEmail: user.email ?? null,
      type,
      startDate,
      endDate,
      reason,
    });

    return res.json({ message: 'Time-off request submitted', request });
  } catch (error) {
    if (error instanceof TimeOffConflictError) {
      return res.status(400).json({
        error: error.message,
        conflictingRequest: error.conflictingRequest,
      });
    }
    if (error instanceof InsufficientPtoBalanceError) {
      return res.status(400).json({
        error: error.message,
        balance: error.balance,
      });
    }
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error creating time-off request', 'hr_timeoff_request_create', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit time-off request';
    return res.status(500).json({ error: errorMessage });
  }
};

export const getPendingTeamTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const result = await getPendingTeamTimeOffService(businessIdParam, user.id);
    return res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching pending time-off', 'hr_timeoff_pending', error);
    return res.status(500).json({ error: 'Failed to fetch pending time-off' });
  }
};

export const approveTeamTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const { id } = req.params;
    const { decision, note } = req.body as { decision: 'APPROVE' | 'DENY'; note?: string };

    const { status } = await approveTeamTimeOffService({
      businessId: businessIdParam,
      managerUserId: user.id,
      managerName: user.name ?? null,
      managerEmail: user.email ?? null,
      requestId: id,
      decision,
      note,
    });

    return res.json({ message: `Request ${status.toLowerCase()}` });
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error approving time-off', 'hr_timeoff_approve', error);
    return res.status(500).json({ error: 'Failed to process approval' });
  }
};

export const getTimeOffBalance = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const result = await getTimeOffBalanceService(businessIdParam, user.id);
    return res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching time-off balance', 'hr_timeoff_balance', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch time-off balance';
    return res.status(500).json({ error: errorMessage });
  }
};

export const getMyTimeOffRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));

    const result = await getMyTimeOffRequestsService(businessIdParam, user.id, page, pageSize);
    return res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching my time-off requests', 'hr_timeoff_my_requests', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch your time-off requests';
    return res.status(500).json({ error: errorMessage });
  }
};

export const cancelTimeOffRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }
    const { id } = req.params;

    await cancelTimeOffRequestService(businessIdParam, user.id, id);
    return res.json({ message: 'Time-off request canceled' });
  } catch (error) {
    if (error instanceof HRWorkflowError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logHrControllerError('Error canceling time-off request', 'hr_timeoff_cancel', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel time-off request';
    return res.status(500).json({ error: errorMessage });
  }
};

export const getTimeOffCalendar = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const startDateParam = req.query.startDate;
    if (startDateParam && typeof startDateParam !== 'string') {
      return res.status(400).json({ error: 'startDate must be a string' });
    }
    const endDateParam = req.query.endDate;
    if (endDateParam && typeof endDateParam !== 'string') {
      return res.status(400).json({ error: 'endDate must be a string' });
    }
    const departmentIdParam = req.query.departmentId;
    const departmentId =
      departmentIdParam && typeof departmentIdParam === 'string' ? departmentIdParam : undefined;

    const result = await getTimeOffCalendarService({
      businessId: businessIdParam,
      startDate: startDateParam,
      endDate: endDateParam,
      departmentId,
    });

    return res.json(result);
  } catch (error) {
    logHrControllerError('Error fetching time-off calendar', 'hr_timeoff_calendar_get', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch time-off calendar';
    return res.status(500).json({ error: errorMessage });
  }
};

export const getTimeOffReports = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const startDateParam = req.query.startDate;
    if (startDateParam && typeof startDateParam !== 'string') {
      return res.status(400).json({ error: 'startDate must be a string' });
    }
    const endDateParam = req.query.endDate;
    if (endDateParam && typeof endDateParam !== 'string') {
      return res.status(400).json({ error: 'endDate must be a string' });
    }

    const report = await generateTimeOffReports({
      businessId: businessIdParam,
      startDate: startDateParam,
      endDate: endDateParam,
    });

    return res.json(report);
  } catch (error) {
    logHrControllerError('Error generating time-off reports', 'hr_timeoff_reports', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate reports';
    return res.status(500).json({ error: errorMessage });
  }
};

// ============================================================================
// CSV IMPORT/EXPORT CONTROLLERS
// ============================================================================

/**
 * Import employees from CSV
 * Expects CSV file with columns: name, email, title, department, managerEmail, employeeType, hireDate, workLocation
 */
export const importEmployeesCSV = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const userId = req.user?.id;

    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer?.toString('utf-8');
    if (!csvContent) {
      return res.status(400).json({ error: 'Unable to read CSV file contents' });
    }

    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header row and one data row' });
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const requiredFields = ['name', 'email'];
    const missingFields = requiredFields.filter((field: string) => !headers.includes(field));
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingFields.join(', ')}`,
      });
    }

    const defaultTierId = await getDefaultOrganizationalTierId(businessId);

    if (!defaultTierId) {
      return res.status(400).json({ error: 'Business must have at least one organizational tier' });
    }

    const validRows: Array<{
      row: number;
      name: string;
      email: string;
      title?: string;
      department?: string;
      hiredate?: string;
      employeetype?: string;
      worklocation?: string;
    }> = [];
    const validationResults: Array<{
      row: number;
      success: boolean;
      email: string;
      name: string;
      error?: string;
      action?: 'created' | 'updated' | 'skipped';
    }> = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map((v: string) => v.trim());

      if (values.length !== headers.length) {
        validationResults.push({
          row: i + 1,
          success: false,
          email: values[headers.indexOf('email')] || 'unknown',
          name: values[headers.indexOf('name')] || 'unknown',
          error: 'Column count mismatch',
        });
        skipped++;
        continue;
      }

      const rowData: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        rowData[header] = values[index] || '';
      });

      const email = rowData.email;
      const name = rowData.name;

      if (!email || !name) {
        validationResults.push({
          row: i + 1,
          success: false,
          email: email || 'unknown',
          name: name || 'unknown',
          error: 'Missing required fields (name or email)',
        });
        skipped++;
        continue;
      }

      validRows.push({
        row: i + 1,
        name,
        email,
        title: rowData.title,
        department: rowData.department,
        hiredate: rowData.hiredate,
        employeetype: rowData.employeetype,
        worklocation: rowData.worklocation,
      });
    }

    const assignedById = userId;
    if (!assignedById) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const importResult = await importEmployeesFromCsv({
      businessId,
      assignedById,
      defaultTierId,
      rows: validRows,
    });

    skipped += importResult.skipped;
    const results = [...validationResults, ...importResult.results].sort((a, b) => a.row - b.row);

    return res.json({
      success: true,
      summary: {
        total: lines.length - 1,
        created: importResult.created,
        updated: importResult.updated,
        skipped,
        errors: skipped,
      },
      results,
    });
  } catch (error) {
    logHrControllerError('Error importing employees', 'hr_employees_import', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import employees',
    });
  }
};

/**
 * Export employees to CSV
 * Supports filtering via query params (same as getAdminEmployees)
 */
export const exportEmployeesCSV = async (req: Request, res: Response) => {
  try {
    const businessIdParam = req.query.businessId;
    if (!businessIdParam || typeof businessIdParam !== 'string') {
      return res.status(400).json({ error: 'businessId is required and must be a string' });
    }

    const status = (req.query.status as string) || 'ACTIVE';
    const q = (req.query.q as string) || '';
    const departmentId = req.query.departmentId as string | undefined;
    const positionId = req.query.positionId as string | undefined;

    const csvContent = await exportEmployeesToCsv({
      businessId: businessIdParam,
      status,
      q,
      departmentId,
      positionId,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="employees-${status.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    logHrControllerError('Error exporting employees', 'hr_employees_export', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to export employees',
    });
  }
};

// ============================================================================
// ANALYTICS CONTROLLERS
// ============================================================================

/**
 * Get onboarding analytics
 * GET /api/hr/admin/analytics/onboarding
 */
export const getOnboardingAnalyticsController = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await getOnboardingAnalytics(businessId, startDate, endDate);
    return res.json(analytics);
  } catch (error) {
    logHrControllerError('Error fetching onboarding analytics', 'hr_analytics_onboarding', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch onboarding analytics';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get attendance analytics
 * GET /api/hr/admin/analytics/attendance
 */
export const getAttendanceAnalyticsController = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await getAttendanceAnalytics(businessId, startDate, endDate);
    return res.json(analytics);
  } catch (error) {
    logHrControllerError('Error fetching attendance analytics', 'hr_analytics_attendance', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch attendance analytics';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get time-off analytics
 * GET /api/hr/admin/analytics/time-off
 */
export const getTimeOffAnalyticsController = async (req: Request, res: Response) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await getTimeOffAnalytics(businessId, startDate, endDate);
    return res.json(analytics);
  } catch (error) {
    logHrControllerError('Error fetching time-off analytics', 'hr_analytics_timeoff', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch time-off analytics';
    return res.status(500).json({ error: message });
  }
};

