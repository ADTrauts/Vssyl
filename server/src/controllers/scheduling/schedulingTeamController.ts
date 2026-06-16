import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { requireAuthorizedBusinessId } from './schedulingShared';
import {
  publishBusinessSchedule,
  SchedulingWorkflowError,
} from '../../services/schedulingPublishService';
import {
  assignShiftToEmployeeByManager,
  listOpenShiftsForManager,
  listTeamAvailability,
  resolveManagerScopeFromRequest,
} from '../../services/schedulingManagerService';
import { listTeamSchedulesForManager } from '../../services/schedulingScheduleService';
import {
  approveShiftSwap,
  denyShiftSwap,
  listPendingSwapRequestsForTeam,
} from '../../services/schedulingSwapService';
import { mapSchedulingServiceError } from '../../services/schedulingControllerUtils';

export async function getTeamSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const schedules = await listTeamSchedulesForManager({
      businessId,
      scope,
      status,
      startDate,
      endDate,
    });

    res.json({ schedules });
  } catch (error: unknown) {
    if (!mapSchedulingServiceError(error, res, 'get_team_schedules')) {
      res.status(500).json({ error: 'Failed to retrieve team schedules' });
    }
  }
}

export async function publishTeamSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const scheduleId = req.params.id;
    if (!scheduleId) {
      res.status(400).json({ error: 'Schedule id is required' });
      return;
    }

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const result = await publishBusinessSchedule({
      scheduleId,
      businessId,
      actorUserId: user.id,
      managerScope: scope,
    });

    res.json({
      schedule: result.schedule,
      message: 'Schedule published successfully',
      shiftCount: result.shiftCount,
    });
  } catch (error: unknown) {
    if (error instanceof SchedulingWorkflowError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    mapSchedulingServiceError(error, res, 'publish_team_schedule');
  }
}

export async function getOpenShiftsForTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const shifts = await listOpenShiftsForManager({
      businessId,
      scope,
      startDate,
      endDate,
    });

    res.json({ shifts });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_open_shifts_team');
  }
}

export async function assignEmployeeToShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const shiftId = req.params.id;
    const { employeePositionId } = req.body as { employeePositionId?: string };

    if (!shiftId || !employeePositionId || typeof employeePositionId !== 'string') {
      res.status(400).json({ error: 'Shift id and employeePositionId are required' });
      return;
    }

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const shift = await assignShiftToEmployeeByManager({
      businessId,
      shiftId,
      employeePositionId,
      actorUserId: user.id,
      scope,
    });

    res.json(shift);
  } catch (error: unknown) {
    if (error instanceof SchedulingWorkflowError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    mapSchedulingServiceError(error, res, 'assign_employee_to_shift');
  }
}

export async function getTeamAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const availability = await listTeamAvailability({ businessId, scope });
    res.json({ availability });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_team_availability');
  }
}

export async function getPendingShiftSwapRequestsForTeam(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId || !user) return;

    const scope = await resolveManagerScopeFromRequest(
      businessId,
      user.id,
      req.directReportIds
    );

    const swaps = await listPendingSwapRequestsForTeam({ businessId, scope });
    res.json({ swaps });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_pending_swap_requests_team');
  }
}

export async function approveShiftSwapManager(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
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
      notesLabel: 'Manager notes',
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'approve_shift_swap_manager');
  }
}

export async function denyShiftSwapManager(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
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
      notesLabel: 'Manager notes',
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'deny_shift_swap_manager');
  }
}
