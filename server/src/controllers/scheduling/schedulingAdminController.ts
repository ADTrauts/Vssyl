import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { logger } from '../../lib/logger';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId } from './schedulingShared';
import { SchedulingTrashError } from '../../services/schedulingTrashService';
import {
  publishBusinessSchedule,
  SchedulingWorkflowError,
} from '../../services/schedulingPublishService';
import {
  cloneScheduleForBusiness,
  createScheduleForBusiness,
  getScheduleByIdForBusiness,
  listSchedulesForBusiness,
  listShiftsForSchedule,
  trashScheduleForBusiness,
  updateScheduleForBusiness,
} from '../../services/schedulingScheduleService';
import {
  assignShiftForAdmin,
  createShiftForBusiness,
  getShiftByIdForBusiness,
  listShiftsForBusiness,
  trashShiftForBusiness,
  updateShiftForBusiness,
} from '../../services/schedulingShiftService';
import {
  assertAdminAvailabilityAccess,
  listAllAvailabilityForBusiness,
  updateEmployeeAvailabilityByAdmin,
} from '../../services/schedulingAvailabilityService';
import {
  approveShiftSwap,
  denyShiftSwap,
  listBusinessShiftSwapRequests,
} from '../../services/schedulingSwapService';
import {
  archiveShiftTemplate,
  assertScheduleTemplateAccess,
  createScheduleTemplate as createScheduleTemplateRecord,
  createShiftTemplate as createShiftTemplateRecord,
  getScheduleTemplateById as getScheduleTemplateRecord,
  getShiftTemplateById as getShiftTemplateRecord,
  listScheduleTemplates,
  listShiftTemplates,
  trashScheduleTemplate,
  updateScheduleTemplate as updateScheduleTemplateRecord,
  updateShiftTemplate as updateShiftTemplateRecord,
} from '../../services/schedulingTemplateService';
import { mapSchedulingServiceError } from '../../services/schedulingControllerUtils';

// ============================================================================
// ADMIN - Schedule Management
// ============================================================================

export async function getSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const schedules = await listSchedulesForBusiness({
      businessId,
      status,
      startDate,
      endDate,
      actorUserId: user.id,
    });

    res.json({ schedules });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'list_schedules');
  }
}

export async function getScheduleById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const schedule = await getScheduleByIdForBusiness(authorizedBusinessId, req.params.id);
    res.json({ schedule });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_schedule');
  }
}

export async function createSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const { name, description, startDate, endDate, timezone, templateId } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields: name, startDate, endDate' });
      return;
    }

    const schedule = await createScheduleForBusiness({
      businessId: authorizedBusinessId,
      actorUserId: user.id,
      name,
      description,
      startDate,
      endDate,
      timezone,
      templateId,
    });

    res.status(201).json({ schedule });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'create_schedule');
  }
}

export async function updateSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const { name, description, startDate, endDate, timezone } = req.body;

    const schedule = await updateScheduleForBusiness({
      businessId: authorizedBusinessId,
      scheduleId: req.params.id,
      actorUserId: user.id,
      name,
      description,
      startDate,
      endDate,
      timezone,
    });

    res.json({ schedule });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_schedule');
  }
}

export async function deleteSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    await trashScheduleForBusiness({
      businessId: authorizedBusinessId,
      scheduleId: req.params.id,
      actorUserId: user.id,
    });

    res.json({ message: 'Schedule moved to trash successfully' });
  } catch (error: unknown) {
    if (error instanceof SchedulingTrashError) {
      if (error.code === 'not_found') {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }
      if (error.code === 'forbidden') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }
    mapSchedulingServiceError(error, res, 'delete_schedule');
  }
}

export async function publishSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const result = await publishBusinessSchedule({
      scheduleId: req.params.id,
      businessId: authorizedBusinessId,
      actorUserId: user.id,
    });

    res.json({ schedule: result.schedule, message: 'Schedule published successfully' });
  } catch (error: unknown) {
    if (error instanceof SchedulingWorkflowError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    mapSchedulingServiceError(error, res, 'publish_schedule');
  }
}

export async function cloneSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields: name, startDate, endDate' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const newSchedule = await cloneScheduleForBusiness({
      businessId: authorizedBusinessId,
      sourceScheduleId: req.params.id,
      actorUserId: user.id,
      name,
      startDate,
      endDate,
    });

    res.status(201).json({ schedule: newSchedule, message: 'Schedule cloned successfully' });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'clone_schedule');
  }
}

// ============================================================================
// ADMIN - Shift Management
// ============================================================================

export async function getScheduleShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const shifts = await listShiftsForSchedule(authorizedBusinessId, req.params.id);
    res.json({ shifts });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_schedule_shifts');
  }
}

export async function createShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      scheduleId,
      businessId: bodyBusinessId,
      employeePositionId,
      positionId,
      title,
      startTime,
      endTime,
      breakMinutes,
      notes,
      color,
      isOpenShift,
      stationName,
      locationId,
    } = req.body;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    if (bodyBusinessId && bodyBusinessId !== authorizedBusinessId) {
      res.status(400).json({ error: 'businessId does not match authorized context' });
      return;
    }

    if (!scheduleId || !title || !startTime || !endTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const shift = await createShiftForBusiness({
      scheduleId,
      businessId: authorizedBusinessId,
      actorUserId: user.id,
      title,
      startTime,
      endTime,
      employeePositionId,
      positionId,
      breakMinutes,
      notes,
      color,
      isOpenShift,
      stationName,
      locationId,
    });

    try {
      const socketService = getChatSocketService();
      socketService.broadcastShiftCreated(
        authorizedBusinessId,
        scheduleId,
        shift as unknown as Record<string, unknown>
      );
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error('Unknown error');
      logger.warn('Failed to broadcast shift created event', {
        operation: 'create_shift_broadcast',
        error: { message: err.message, stack: err.stack },
      });
    }

    res.status(201).json({ shift });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'create_shift')) return;
    const err = error instanceof Error ? error : new Error('Unknown error');
    res.status(500).json({ error: 'Failed to create shift', message: err.message });
  }
}

export async function updateShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const {
      title,
      startTime,
      endTime,
      breakMinutes,
      notes,
      color,
      positionId,
      employeePositionId,
      stationName,
      locationId,
    } = req.body;

    const shift = await updateShiftForBusiness({
      shiftId: req.params.id,
      businessId: authorizedBusinessId,
      actorUserId: user.id,
      title,
      startTime,
      endTime,
      breakMinutes,
      notes,
      color,
      positionId,
      employeePositionId,
      stationName,
      locationId,
    });

    try {
      const socketService = getChatSocketService();
      socketService.broadcastShiftUpdated(
        authorizedBusinessId,
        shift.scheduleId,
        shift as unknown as Record<string, unknown>
      );

      if (shift.schedule?.status === 'PUBLISHED') {
        const { syncSingleShiftToCalendar } = await import('../../services/hrScheduleService');
        await syncSingleShiftToCalendar(req.params.id, authorizedBusinessId);
      }
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error('Unknown error');
      logger.warn('Failed to broadcast/sync shift updated event', {
        operation: 'update_shift_broadcast',
        error: { message: err.message, stack: err.stack },
      });
    }

    res.json({ shift });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_shift');
  }
}

export async function deleteShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    await trashShiftForBusiness({
      businessId: authorizedBusinessId,
      shiftId: req.params.id,
      actorUserId: user.id,
    });

    res.json({ message: 'Shift moved to trash successfully' });
  } catch (error: unknown) {
    if (error instanceof SchedulingTrashError) {
      if (error.code === 'not_found') {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }
      if (error.code === 'forbidden') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }
    mapSchedulingServiceError(error, res, 'delete_shift');
  }
}

export async function assignShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { employeePositionId } = req.body;
    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    if (!employeePositionId) {
      res.status(400).json({ error: 'Employee position ID is required' });
      return;
    }

    const shift = await assignShiftForAdmin({
      businessId: authorizedBusinessId,
      shiftId: req.params.id,
      employeePositionId,
      actorUserId: user.id,
    });

    res.json({ shift, message: 'Shift assigned successfully' });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'assign_shift');
  }
}

export async function getShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const scheduleId =
      typeof req.query.scheduleId === 'string' ? req.query.scheduleId : undefined;

    const shifts = await listShiftsForBusiness({ businessId, scheduleId });
    res.json({ shifts });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_shifts');
  }
}

export async function getShiftById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const shift = await getShiftByIdForBusiness(businessId, req.params.id);
    res.json({ shift });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_shift');
  }
}

// ============================================================================
// Shift templates & schedule templates
// ============================================================================

export async function getShiftTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const templates = await listShiftTemplates(businessId);
    res.json({ templates });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_shift_templates');
  }
}

export async function getShiftTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const template = await getShiftTemplateRecord(businessId, req.params.id);
    res.json(template);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_shift_template_by_id');
  }
}

export async function createShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const template = await createShiftTemplateRecord(
      businessId,
      req.body as Record<string, unknown>,
      user?.id
    );
    res.status(201).json(template);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'create_shift_template');
  }
}

export async function updateShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const template = await updateShiftTemplateRecord(
      businessId,
      req.params.id,
      req.body as Record<string, unknown>,
      user?.id
    );
    res.json(template);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_shift_template');
  }
}

export async function deleteShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    await archiveShiftTemplate(businessId, req.params.id, user?.id);
    res.json({ message: 'Shift template archived successfully' });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'delete_shift_template');
  }
}

export async function getScheduleTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    await assertScheduleTemplateAccess(businessId, user.id);
    const templates = await listScheduleTemplates(businessId);
    res.json({ templates });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_schedule_templates');
  }
}

export async function getScheduleTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const template = await getScheduleTemplateRecord(authorizedBusinessId, req.params.id);
    await assertScheduleTemplateAccess(template.businessId, user.id);
    res.json({ template });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_schedule_template');
  }
}

export async function createScheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const { name, description, scheduleType, templateData, sourceScheduleId } = req.body;

    if (!name || !scheduleType) {
      res.status(400).json({ error: 'Missing required fields: name, scheduleType' });
      return;
    }

    await assertScheduleTemplateAccess(authorizedBusinessId, user.id);

    const template = await createScheduleTemplateRecord({
      businessId: authorizedBusinessId,
      actorUserId: user.id,
      name,
      description,
      scheduleType,
      templateData,
      sourceScheduleId,
    });

    res.status(201).json({ template });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'create_schedule_template');
  }
}

export async function updateScheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const { name, description, scheduleType, templateData, isActive } = req.body;

    await assertScheduleTemplateAccess(authorizedBusinessId, user.id);

    const updatedTemplate = await updateScheduleTemplateRecord({
      businessId: authorizedBusinessId,
      templateId: req.params.id,
      actorUserId: user.id,
      name,
      description,
      scheduleType,
      templateData,
      isActive,
    });

    res.json({ template: updatedTemplate });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_schedule_template');
  }
}

export async function deleteScheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    await assertScheduleTemplateAccess(authorizedBusinessId, user.id);

    await trashScheduleTemplate({
      businessId: authorizedBusinessId,
      templateId: req.params.id,
      actorUserId: user.id,
    });

    res.json({ success: true, message: 'Template moved to trash successfully' });
  } catch (error: unknown) {
    if (error instanceof SchedulingTrashError) {
      if (error.code === 'not_found') {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      if (error.code === 'forbidden') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }
    mapSchedulingServiceError(error, res, 'delete_schedule_template');
  }
}

// Analytics (G18 — out of 5C scope)
export async function getLaborCostAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Analytics coming in Phase 3' });
}

export async function getCoverageAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Analytics coming in Phase 3' });
}

export async function getComplianceReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Compliance reports coming in Phase 3' });
}

export async function getAllEmployeeAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    let businessId: string | undefined = req.businessId;
    if (!businessId) {
      const businessIdParam = req.query.businessId;
      if (businessIdParam && typeof businessIdParam === 'string') {
        businessId = businessIdParam;
      } else if (businessIdParam) {
        res.status(400).json({ error: 'businessId must be a string' });
        return;
      }
    }

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await assertAdminAvailabilityAccess(businessId, user.id);
    const availability = await listAllAvailabilityForBusiness(businessId);
    res.json({ availability });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_all_employee_availability');
  }
}

export async function updateEmployeeAvailabilityAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const availability = await updateEmployeeAvailabilityByAdmin({
      businessId,
      availabilityId: req.params.id,
      body: req.body as Record<string, unknown>,
    });

    res.json({ availability });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_employee_availability_admin');
  }
}

export async function getAllShiftSwapRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const swaps = await listBusinessShiftSwapRequests({ businessId, status });
    res.json({ swaps });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_all_shift_swap_requests');
  }
}

export async function approveShiftSwapAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    let businessId: string | undefined = req.businessId;
    if (!businessId) {
      const businessIdParam = req.query.businessId;
      if (businessIdParam && typeof businessIdParam === 'string') {
        businessId = businessIdParam;
      } else if (businessIdParam) {
        res.status(400).json({ error: 'businessId must be a string' });
        return;
      }
    }
    const swapId = req.params.id;
    const { managerNotes } = req.body as { managerNotes?: string };

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const updatedSwap = await approveShiftSwap({
      businessId,
      swapId,
      actorUserId: user.id,
      notes: managerNotes,
      notesLabel: 'Admin notes',
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'approve_shift_swap_admin');
  }
}

export async function denyShiftSwapAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    let businessId: string | undefined = req.businessId;
    if (!businessId) {
      const businessIdParam = req.query.businessId;
      if (businessIdParam && typeof businessIdParam === 'string') {
        businessId = businessIdParam;
      } else if (businessIdParam) {
        res.status(400).json({ error: 'businessId must be a string' });
        return;
      }
    }
    const swapId = req.params.id;
    const { managerNotes } = req.body as { managerNotes?: string };

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const updatedSwap = await denyShiftSwap({
      businessId,
      swapId,
      actorUserId: user.id,
      notes: managerNotes,
      notesLabel: 'Admin notes',
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'deny_shift_swap_admin');
  }
}
