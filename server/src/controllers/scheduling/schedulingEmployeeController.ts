import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { requireAuthorizedBusinessId } from './schedulingShared';
import { getOwnScheduleForEmployee } from '../../services/schedulingScheduleService';
import {
  createOwnAvailability,
  deleteOwnAvailability as deleteOwnAvailabilityRecord,
  listOwnAvailability,
  updateOwnAvailability as updateOwnAvailabilityRecord,
  AvailabilityOverlapError,
} from '../../services/schedulingAvailabilityService';
import {
  cancelShiftSwapRequest,
  listOwnShiftSwapRequests,
  requestShiftSwap as createShiftSwapRequest,
} from '../../services/schedulingSwapService';
import {
  claimOpenShiftForEmployee,
  listOwnOpenShifts,
} from '../../services/schedulingShiftService';
import { mapSchedulingServiceError } from '../../services/schedulingControllerUtils';
import { SchedulingWorkflowError } from '../../services/schedulingPublishService';

function resolveEmployeeBusinessId(
  req: AuthenticatedRequest,
  res: Response
): string | undefined {
  let businessId: string | undefined = req.businessId;
  if (!businessId) {
    const businessIdParam = req.query.businessId;
    if (businessIdParam && typeof businessIdParam === 'string') {
      businessId = businessIdParam;
    } else if (businessIdParam) {
      res.status(400).json({ error: 'businessId must be a string' });
      return undefined;
    }
  }
  return businessId;
}

export async function getOwnSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const schedules = await getOwnScheduleForEmployee({
      businessId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
    });

    res.json({ schedules });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_own_schedule');
  }
}

export async function setOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const {
      dayOfWeek,
      startTime,
      endTime,
      availabilityType,
      effectiveFrom,
      effectiveTo,
      recurring,
      notes,
    } = req.body;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!dayOfWeek || !startTime || !endTime || !availabilityType) {
      res.status(400).json({
        error: 'Missing required fields: dayOfWeek, startTime, endTime, availabilityType',
      });
      return;
    }

    const availability = await createOwnAvailability({
      businessId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
      dayOfWeek,
      startTime,
      endTime,
      availabilityType,
      effectiveFrom,
      effectiveTo,
      recurring,
      notes,
    });

    res.status(201).json(availability);
  } catch (error: unknown) {
    if (error instanceof SchedulingWorkflowError && error.statusCode === 404) {
      res.status(404).json({
        error: 'No active employee position found for this user',
        message:
          'You must be assigned to a position in the org chart for this business before setting availability. Please contact your administrator to add you to the org chart, or use the org chart UI to assign yourself to a position.',
        helpUrl: '/api/org-chart/employees/assign',
      });
      return;
    }
    if (error instanceof AvailabilityOverlapError) {
      res.status(409).json({
        error: error.message,
        conflictId: error.conflictId,
      });
      return;
    }
    mapSchedulingServiceError(error, res, 'set_own_availability');
  }
}

export async function updateOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const availabilityId = req.params.id;

    if (!user || !businessId || !availabilityId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const updatedAvailability = await updateOwnAvailabilityRecord({
      businessId,
      userId: user.id,
      availabilityId,
      body: req.body as Record<string, unknown>,
    });

    res.json(updatedAvailability);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'update_own_availability');
  }
}

export async function getOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const availability = await listOwnAvailability({
      businessId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
    });

    res.json({ availability });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_own_availability');
  }
}

export async function deleteOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const availabilityId = req.params.id;

    if (!user || !businessId || !availabilityId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    await deleteOwnAvailabilityRecord({ businessId, userId: user.id, availabilityId });
    res.json({ message: 'Availability deleted successfully' });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'delete_own_availability');
  }
}

export async function requestShiftSwap(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const shiftId = req.params.id;
    const { requestedToId, coveredShiftId, requestNotes } = req.body;

    if (!user || !businessId || !shiftId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const swapRequest = await createShiftSwapRequest({
      businessId,
      userId: user.id,
      userName: user.name,
      shiftId,
      requestedToId,
      coveredShiftId,
      requestNotes,
    });

    res.status(201).json(swapRequest);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'request_shift_swap');
  }
}

export async function getOwnShiftSwapRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const swaps = await listOwnShiftSwapRequests({
      businessId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
    });

    res.json({ swaps });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_own_swap_requests');
  }
}

export async function cancelSwapRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const swapId = req.params.id;

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const updatedSwap = await cancelShiftSwapRequest({
      businessId,
      userId: user.id,
      swapId,
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'cancel_swap_request');
  }
}

export async function claimOpenShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);
    const shiftId = req.params.id;

    if (!user || !businessId || !shiftId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    const updatedShift = await claimOpenShiftForEmployee({
      businessId,
      shiftId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
    });

    res.json(updatedShift);
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'claim_open_shift');
  }
}

export async function getOwnOpenShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = resolveEmployeeBusinessId(req, res);

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const positionId =
      typeof req.query.positionId === 'string' ? req.query.positionId : undefined;

    const openShifts = await listOwnOpenShifts({
      businessId,
      userId: user.id,
      employeePositionId: req.employeePositionId,
      startDate,
      endDate,
      positionId,
    });

    res.json({ shifts: openShifts });
  } catch (error: unknown) {
    mapSchedulingServiceError(error, res, 'get_own_open_shifts');
  }
}
