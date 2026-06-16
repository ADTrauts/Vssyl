import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { logger } from '../../lib/logger';
import { JobFunction, StationType } from '@prisma/client';
import {
  generateAIScheduleForBusiness,
  getSchedulingRecommendationsForBusiness,
  suggestShiftAssignmentsForBusiness,
} from '../../services/schedulingAdminToolsService';
import {
  createBusinessJobLocation as createBusinessJobLocationRecord,
  deleteBusinessJobLocation as deleteBusinessJobLocationRecord,
  listBusinessJobLocations,
  updateBusinessJobLocation as updateBusinessJobLocationRecord,
} from '../../services/schedulingJobLocationService';
import {
  createBusinessStation as createBusinessStationRecord,
  deleteBusinessStation as deleteBusinessStationRecord,
  getBusinessStationById as getBusinessStationRecord,
  listBusinessStations,
  updateBusinessStation as updateBusinessStationRecord,
} from '../../services/schedulingStationService';
import { mapSchedulingServiceError } from '../../services/schedulingControllerUtils';

export async function getSchedulingRecommendations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { businessId, industry } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const industryOverride =
      industry && typeof industry === 'string' ? industry : undefined;

    const result = await getSchedulingRecommendationsForBusiness({
      businessId,
      industryOverride,
    });

    res.json({
      success: true,
      recommendation: result.recommendation,
      currentConfig: result.currentConfig,
      businessIndustry: result.businessIndustry,
    });

    logger.info('Scheduling recommendations retrieved', {
      operation: 'get_scheduling_recommendations',
      userId: user.id,
      businessId,
      industry: result.industryUsed,
      recommendedMode: result.recommendation.mode,
    });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'get_scheduling_recommendations')) {
      return;
    }
  }
}

export async function generateAISchedule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { businessId, scheduleId, strategy, constraints } = req.body;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'Business ID is required' });
      return;
    }
    if (!scheduleId || typeof scheduleId !== 'string') {
      res.status(400).json({ success: false, error: 'Schedule ID is required' });
      return;
    }

    const result = await generateAIScheduleForBusiness({
      businessId,
      scheduleId,
      actorUserId: user.id,
      strategy: typeof strategy === 'string' ? strategy : undefined,
      constraints:
        constraints && typeof constraints === 'object'
          ? (constraints as Record<string, unknown>)
          : undefined,
    });

    res.json({
      success: true,
      message: `Generated ${result.createdCount} shifts using ${result.strategy} strategy`,
      shifts: result.shifts,
      recommendations: result.recommendationsCount,
      created: result.createdCount,
    });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'generate_ai_schedule')) {
      return;
    }
  }
}

export async function suggestShiftAssignments(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { businessId, scheduleId, shiftId } = req.body;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'Business ID is required' });
      return;
    }
    if (!shiftId || typeof shiftId !== 'string') {
      res.status(400).json({ success: false, error: 'Shift ID is required' });
      return;
    }

    const result = await suggestShiftAssignmentsForBusiness({
      businessId,
      shiftId,
      scheduleId: typeof scheduleId === 'string' ? scheduleId : undefined,
    });

    logger.info('Shift assignment suggestions generated', {
      operation: 'suggest_shift_assignments',
      userId: user.id,
      businessId,
      shiftId,
      scheduleId: result.scheduleId,
      strategy: result.strategy,
    });

    res.json({
      success: true,
      suggestions: result.suggestions,
      count: result.count,
      strategy: result.strategy,
    });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'suggest_shift_assignments')) {
      return;
    }
  }
}

export async function getBusinessStations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const stations = await listBusinessStations(businessId);
    res.json({ stations });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'list_stations')) {
      return;
    }
  }
}

export async function createBusinessStation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      businessId,
      name,
      stationType,
      jobFunction,
      description,
      color,
      isRequired,
      priority,
      defaultStartTime,
      defaultEndTime,
    } = req.body;

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Station name is required' });
      return;
    }
    if (!stationType || typeof stationType !== 'string') {
      res.status(400).json({ error: 'Station type is required' });
      return;
    }

    const station = await createBusinessStationRecord({
      businessId,
      name,
      stationType: stationType as StationType,
      jobFunction: jobFunction ? (jobFunction as JobFunction) : null,
      description: typeof description === 'string' ? description : null,
      color: typeof color === 'string' ? color : null,
      isRequired: isRequired === true,
      priority: priority ? parseInt(String(priority), 10) : null,
      defaultStartTime:
        typeof defaultStartTime === 'string' ? defaultStartTime : null,
      defaultEndTime: typeof defaultEndTime === 'string' ? defaultEndTime : null,
    });

    res.status(201).json({ station });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'create_station')) {
      return;
    }
  }
}

export async function getBusinessStationById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const station = await getBusinessStationRecord(businessId, id);
    res.json({ station });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'get_station')) {
      return;
    }
  }
}

export async function updateBusinessStation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const {
      businessId,
      name,
      stationType,
      jobFunction,
      description,
      color,
      isRequired,
      priority,
      isActive,
      defaultStartTime,
      defaultEndTime,
    } = req.body;

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const station = await updateBusinessStationRecord({
      businessId,
      stationId: id,
      name: typeof name === 'string' ? name : undefined,
      stationType:
        typeof stationType === 'string' ? (stationType as StationType) : undefined,
      jobFunction:
        jobFunction !== undefined
          ? jobFunction
            ? (jobFunction as JobFunction)
            : null
          : undefined,
      description: description !== undefined ? description || null : undefined,
      color: color !== undefined ? color || null : undefined,
      isRequired: isRequired !== undefined ? isRequired === true : undefined,
      priority:
        priority !== undefined
          ? priority
            ? parseInt(String(priority), 10)
            : null
          : undefined,
      isActive: isActive !== undefined ? isActive === true : undefined,
      defaultStartTime:
        defaultStartTime !== undefined ? defaultStartTime : undefined,
      defaultEndTime: defaultEndTime !== undefined ? defaultEndTime : undefined,
    });

    res.json({ station });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'update_station')) {
      return;
    }
  }
}

export async function deleteBusinessStation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    await deleteBusinessStationRecord(businessId, id);
    res.json({ success: true, message: 'Station deleted successfully' });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'delete_station')) {
      return;
    }
  }
}

export async function getBusinessJobLocations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    const locations = await listBusinessJobLocations(user.id, businessId);
    res.json({ jobLocations: locations });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'get_job_locations')) {
      return;
    }
  }
}

export async function createBusinessJobLocation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { businessId, name, address, description, phone, email, notes } = req.body;
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Location name is required' });
      return;
    }

    const location = await createBusinessJobLocationRecord({
      userId: user.id,
      businessId,
      name,
      address: typeof address === 'string' ? address : null,
      description: typeof description === 'string' ? description : null,
      phone: typeof phone === 'string' ? phone : null,
      email: typeof email === 'string' ? email : null,
      notes: typeof notes === 'string' ? notes : null,
    });

    res.status(201).json({ location });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'create_job_location')) {
      return;
    }
  }
}

export async function updateBusinessJobLocation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { name, address, description, phone, email, notes, isActive } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Location ID is required' });
      return;
    }

    const location = await updateBusinessJobLocationRecord({
      userId: user.id,
      locationId: id,
      name: typeof name === 'string' ? name : undefined,
      address: address !== undefined ? address || null : undefined,
      description: description !== undefined ? description || null : undefined,
      phone: phone !== undefined ? phone || null : undefined,
      email: email !== undefined ? email || null : undefined,
      notes: notes !== undefined ? notes || null : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });

    res.json({ location });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'update_job_location')) {
      return;
    }
  }
}

export async function deleteBusinessJobLocation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Location ID is required' });
      return;
    }

    await deleteBusinessJobLocationRecord(user.id, id);
    res.json({ success: true, message: 'Job location deleted successfully' });
  } catch (error: unknown) {
    if (mapSchedulingServiceError(error, res, 'delete_job_location')) {
      return;
    }
  }
}
