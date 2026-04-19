import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma, BusinessRole, SchedulingStrategy, JobFunction, StationType, ScheduleStatus, AttendanceRecordStatus } from '@prisma/client';
import { getRecommendedSchedulingConfig } from '../../services/schedulingRecommendationService';
import { SchedulingPhilosophyService } from '../../services/schedulingPhilosophyService';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId, TIME_FIELD_REGEX } from './schedulingShared';

/**
 * GET /api/scheduling/recommendations
 * Get scheduling recommendations based on business industry
 */
export async function getSchedulingRecommendations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId, industry } = req.query;

    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    // Get business to check industry
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { industry: true, schedulingMode: true, schedulingStrategy: true }
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // Use provided industry or business industry
    const industryToUse = (industry && typeof industry === 'string') 
      ? industry 
      : business.industry || null;

    // Get recommended configuration
    const recommendation = getRecommendedSchedulingConfig(industryToUse);

    // Include current configuration if set
    const currentConfig = business.schedulingMode 
      ? {
          mode: business.schedulingMode,
          strategy: business.schedulingStrategy,
        }
      : null;

    res.json({
      success: true,
      recommendation,
      currentConfig,
      businessIndustry: business.industry,
    });

    logger.info('Scheduling recommendations retrieved', {
      operation: 'get_scheduling_recommendations',
      userId: user.id,
      businessId,
      industry: industryToUse,
      recommendedMode: recommendation.mode,
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to get scheduling recommendations', {
      operation: 'get_scheduling_recommendations',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch scheduling recommendations',
      error: err.message
    });
  }
}

/**
 * POST /api/scheduling/ai/generate-schedule
 * Generate a schedule using AI/philosophy engine
 */
export async function generateAISchedule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId, scheduleId, strategy, constraints } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'Business ID is required' });
      return;
    }

    if (!scheduleId || typeof scheduleId !== 'string') {
      res.status(400).json({ success: false, error: 'Schedule ID is required' });
      return;
    }

    // Get business configuration
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { schedulingMode: true, schedulingStrategy: true }
    });

    if (!business) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }

    // Get schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        shifts: {
          include: {
            employeePosition: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                },
                position: {
                  select: { 
                    title: true,
                    jobFunction: true,
                    stationName: true,
                    stationType: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      res.status(404).json({ success: false, error: 'Schedule not found' });
      return;
    }

    // Get employees with availability
    const employeePositions = await prisma.employeePosition.findMany({
      where: { businessId, active: true },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        position: {
          select: {
            title: true,
            jobFunction: true,
            stationName: true,
            stationType: true
          }
        },
        availability: {
          where: {
            effectiveFrom: { lte: new Date(schedule.endDate) },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date(schedule.startDate) } }
            ]
          }
        }
      }
    });

    // Prepare philosophy context
    const selectedStrategy = strategy || business.schedulingStrategy || 'AVAILABILITY_FIRST';
    const selectedMode = business.schedulingMode || 'OTHER';

    // Convert to philosophy service format
    const employees = employeePositions.map(ep => {
      const availability = ep.availability.map((av: { dayOfWeek: string; startTime: string; endTime: string; availabilityType: string }) => {
        // Convert time strings to minutes
        const startMinutes = av.startTime ? (parseInt(av.startTime.split(':')[0]) * 60 + parseInt(av.startTime.split(':')[1])) : undefined;
        const endMinutes = av.endTime ? (parseInt(av.endTime.split(':')[0]) * 60 + parseInt(av.endTime.split(':')[1])) : undefined;
        
        return {
          day: av.dayOfWeek,
          startTime: startMinutes,
          endTime: endMinutes,
          isAvailable: av.availabilityType === 'AVAILABLE',
        };
      });

      // Calculate current hours for the week
      const weekShifts = schedule.shifts.filter(s => 
        s.employeePositionId === ep.id
      );
      const currentHours = weekShifts.reduce((total, shift) => {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

      return {
        employeePositionId: ep.id,
        userId: ep.user.id,
        userName: ep.user.name || 'Unknown',
        positionTitle: ep.position.title,
        jobFunction: ep.position.jobFunction || undefined,
        stationName: ep.position.stationName || undefined,
        availability,
        currentHoursThisWeek: currentHours,
      };
    });

    // Generate shift requirements from existing shifts or create default
    const requirements = schedule.shifts.map(shift => {
      const startDate = new Date(shift.startTime);
      const endDate = new Date(shift.endTime);
      const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

      return {
        day: dayOfWeek,
        startTime: startMinutes,
        endTime: endMinutes,
        requiredRole: undefined, // ScheduleShift doesn't have role field directly
        requiredJobFunction: shift.jobFunction as JobFunction | undefined,
        requiredStation: shift.stationName || undefined,
        minStaffing: shift.minStaffing || 1,
        maxStaffing: shift.maxStaffing || 1,
        priority: shift.priority || 5,
      };
    });

    // Generate recommendations
    const recommendations = await SchedulingPhilosophyService.generateRecommendations({
      businessId,
      mode: selectedMode,
      strategy: selectedStrategy as SchedulingStrategy,
      employees,
      requirements,
      constraints: constraints || {},
    });

    // Create shifts from recommendations
    const createdShifts = [];
    for (const rec of recommendations) {
      // Find day date within schedule range
      const scheduleStart = new Date(schedule.startDate);
      const scheduleEnd = new Date(schedule.endDate);
      const targetDate = new Date(scheduleStart);

      // Find the matching day of week
      const targetDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(rec.day);
      const startDayIndex = scheduleStart.getDay();
      const daysOffset = (targetDayIndex - startDayIndex + 7) % 7;
      targetDate.setDate(scheduleStart.getDate() + daysOffset);

      // Ensure date is within schedule range
      if (targetDate < scheduleStart || targetDate > scheduleEnd) {
        continue; // Skip if outside range
      }

      const startTime = new Date(targetDate);
      startTime.setHours(Math.floor(rec.startTime / 60), rec.startTime % 60, 0, 0);

      const endTime = new Date(targetDate);
      endTime.setHours(Math.floor(rec.endTime / 60), rec.endTime % 60, 0, 0);

      try {
        const shift = await prisma.scheduleShift.create({
          data: {
            businessId,
            scheduleId: schedule.id,
            employeePositionId: rec.employeePositionId,
            startTime,
            endTime,
            breakMinutes: 0,
            title: 'AI Generated Shift',
            status: 'SCHEDULED',
            priority: Math.round(rec.confidence * 10),
          },
          include: {
            employeePosition: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                },
                position: {
                  select: { title: true }
                }
              }
            }
          }
        });

        createdShifts.push(shift);
      } catch (err) {
        logger.error('Failed to create shift from recommendation', {
          operation: 'generate_ai_schedule',
          error: { 
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
          },
          recommendation: rec,
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${createdShifts.length} shifts using ${selectedStrategy} strategy`,
      shifts: createdShifts,
      recommendations: recommendations.length,
      created: createdShifts.length,
    });

    logger.info('AI schedule generated', {
      operation: 'generate_ai_schedule',
      userId: user.id,
      businessId,
      scheduleId,
      strategy: selectedStrategy,
      shiftsCreated: createdShifts.length,
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to generate AI schedule', {
      operation: 'generate_ai_schedule',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate schedule',
      error: err.message
    });
  }
}

/**
 * POST /api/scheduling/ai/suggest-assignments
 * Get AI suggestions for shift assignments
 */
export async function suggestShiftAssignments(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const { businessId, scheduleId, shiftId } = req.body;

    if (!user) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, error: 'Business ID is required' });
      return;
    }

    // Get shift to suggest for
    const shift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        schedule: true,
        employeePosition: {
          include: {
            user: true,
            position: true
          }
        }
      }
    });

    if (!shift) {
      res.status(404).json({ success: false, error: 'Shift not found' });
      return;
    }

    if (scheduleId && typeof scheduleId === 'string' && shift.scheduleId !== scheduleId) {
      res.status(400).json({ success: false, error: 'Shift does not belong to the specified schedule' });
      return;
    }

    // Get business configuration
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { schedulingStrategy: true }
    });

    const strategy = business?.schedulingStrategy || 'AVAILABILITY_FIRST';

    // Get available employees
    const startDate = new Date(shift.startTime);
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = new Date(shift.endTime).getHours() * 60 + new Date(shift.endTime).getMinutes();

    const employeePositions = await prisma.employeePosition.findMany({
      where: { businessId, active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        position: {
          select: {
            title: true,
            jobFunction: true,
            stationName: true
          }
        },
        availability: {
          where: {
            dayOfWeek,
            availabilityType: 'AVAILABLE',
            effectiveFrom: { lte: startDate },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: startDate } }
            ]
          }
        }
      }
    });

    // Filter employees who are available
    const availableEmployees = employeePositions.filter(ep => {
      const dayAvail = ep.availability.find((a: { dayOfWeek: string; startTime: string; endTime: string; availabilityType: string }) => a.dayOfWeek === dayOfWeek);
      if (!dayAvail || dayAvail.availabilityType !== 'AVAILABLE') return false;

      // Check time slot availability - convert time strings to minutes
      if (dayAvail.startTime && dayAvail.endTime) {
        const availStartMinutes = parseInt(dayAvail.startTime.split(':')[0]) * 60 + parseInt(dayAvail.startTime.split(':')[1]);
        const availEndMinutes = parseInt(dayAvail.endTime.split(':')[0]) * 60 + parseInt(dayAvail.endTime.split(':')[1]);
        if (startMinutes < availStartMinutes || endMinutes > availEndMinutes) {
          return false;
        }
      }

      // Check role/function match if specified
      if (shift.jobFunction && ep.position.jobFunction !== shift.jobFunction) return false;
      if (shift.stationName && ep.position.stationName !== shift.stationName) return false;

      return true;
    });

    // Sort by strategy
    const suggestions = availableEmployees.map(ep => ({
      employeePositionId: ep.id,
      employee: {
        id: ep.user.id,
        name: ep.user.name,
        position: ep.position.title,
      },
      confidence: 0.8, // Default confidence
      reason: 'Available for this shift',
    }));

    logger.info('Shift assignment suggestions generated', {
      operation: 'suggest_shift_assignments',
      userId: user.id,
      businessId,
      shiftId,
      scheduleId: shift.scheduleId,
      strategy
    });

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      strategy
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to suggest shift assignments', {
      operation: 'suggest_shift_assignments',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get suggestions',
      error: err.message
    });
  }
}

// ============================================================================
// BUSINESS STATIONS MANAGEMENT
// ============================================================================

/**
 * GET /api/scheduling/admin/stations
 * Get all stations for a business
 */
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

    const stations = await prisma.businessStation.findMany({
      where: {
        businessId: businessId
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    });

    logger.info('Business stations retrieved', {
      operation: 'list_stations',
      userId: user.id,
      businessId,
      count: stations.length
    });

    res.json({ stations });
  } catch (error: unknown) {
    const err = error as Error;
    const businessIdParam = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;
    
    logger.error('Failed to list stations', {
      operation: 'list_stations',
      userId: req.user?.id,
      businessId: businessIdParam,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to retrieve stations',
      message: err.message
    });
  }
}

/**
 * POST /api/scheduling/admin/stations
 * Create a new business station
 */
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

    const { businessId, name, stationType, jobFunction, description, color, isRequired, priority, defaultStartTime, defaultEndTime } = req.body;

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

    // Check if station name already exists for this business
    const existing = await prisma.businessStation.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: name.trim()
        }
      }
    });

    if (existing) {
      res.status(409).json({ error: 'Station with this name already exists' });
      return;
    }

    const normalizedStartTime =
      typeof defaultStartTime === 'string' && defaultStartTime.trim() !== ''
        ? defaultStartTime.trim()
        : null;
    if (normalizedStartTime && !TIME_FIELD_REGEX.test(normalizedStartTime)) {
      res.status(400).json({ error: 'Invalid default start time. Use HH:mm (24-hour format).' });
      return;
    }

    const normalizedEndTime =
      typeof defaultEndTime === 'string' && defaultEndTime.trim() !== ''
        ? defaultEndTime.trim()
        : null;
    if (normalizedEndTime && !TIME_FIELD_REGEX.test(normalizedEndTime)) {
      res.status(400).json({ error: 'Invalid default end time. Use HH:mm (24-hour format).' });
      return;
    }

    const station = await prisma.businessStation.create({
      data: {
        businessId,
        name: name.trim(),
        stationType: stationType as StationType,
        jobFunction: jobFunction ? (jobFunction as JobFunction) : null,
        description: description || null,
        color: color || null,
        isRequired: isRequired === true,
        priority: priority ? parseInt(String(priority), 10) : null,
        isActive: true,
        defaultStartTime: normalizedStartTime ?? undefined,
        defaultEndTime: normalizedEndTime ?? undefined
      } as Prisma.BusinessStationUncheckedCreateInput
    });

    logger.info('Business station created', {
      operation: 'create_station',
      userId: user.id,
      businessId,
      stationId: station.id
    });

    res.status(201).json({ station });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to create station', {
      operation: 'create_station',
      userId: req.user?.id,
      businessId: req.body.businessId,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to create station',
      message: err.message
    });
  }
}

/**
 * GET /api/scheduling/admin/stations/:id
 * Get a specific station by ID
 */
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

    const station = await prisma.businessStation.findUnique({
      where: { id }
    });

    if (!station) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    if (station.businessId !== businessId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ station });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to get station', {
      operation: 'get_station',
      userId: req.user?.id,
      stationId: req.params.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to retrieve station',
      message: err.message
    });
  }
}

/**
 * PUT /api/scheduling/admin/stations/:id
 * Update a business station
 */
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
    const { businessId, name, stationType, jobFunction, description, color, isRequired, priority, isActive, defaultStartTime, defaultEndTime } = req.body;

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'Business ID is required' });
      return;
    }

    // Verify station exists and belongs to business
    const existing = await prisma.businessStation.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    if (existing.businessId !== businessId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // If name is changing, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.businessStation.findUnique({
        where: {
          businessId_name: {
            businessId,
            name: name.trim()
          }
        }
      });

      if (duplicate) {
        res.status(409).json({ error: 'Station with this name already exists' });
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (stationType !== undefined) updateData.stationType = stationType as StationType;
    if (jobFunction !== undefined) updateData.jobFunction = jobFunction ? (jobFunction as JobFunction) : null;
    if (description !== undefined) updateData.description = description || null;
    if (color !== undefined) updateData.color = color || null;
    if (isRequired !== undefined) updateData.isRequired = isRequired === true;
    if (priority !== undefined) updateData.priority = priority ? parseInt(String(priority), 10) : null;
    if (isActive !== undefined) updateData.isActive = isActive === true;

    if (defaultStartTime !== undefined) {
      if (defaultStartTime === null || (typeof defaultStartTime === 'string' && defaultStartTime.trim() === '')) {
        updateData.defaultStartTime = null;
      } else if (typeof defaultStartTime === 'string' && TIME_FIELD_REGEX.test(defaultStartTime.trim())) {
        updateData.defaultStartTime = defaultStartTime.trim();
      } else {
        res.status(400).json({ error: 'Invalid default start time. Use HH:mm (24-hour format).' });
        return;
      }
    }

    if (defaultEndTime !== undefined) {
      if (defaultEndTime === null || (typeof defaultEndTime === 'string' && defaultEndTime.trim() === '')) {
        updateData.defaultEndTime = null;
      } else if (typeof defaultEndTime === 'string' && TIME_FIELD_REGEX.test(defaultEndTime.trim())) {
        updateData.defaultEndTime = defaultEndTime.trim();
      } else {
        res.status(400).json({ error: 'Invalid default end time. Use HH:mm (24-hour format).' });
        return;
      }
    }

    const station = await prisma.businessStation.update({
      where: { id },
      data: updateData
    });

    logger.info('Business station updated', {
      operation: 'update_station',
      userId: user.id,
      businessId,
      stationId: station.id
    });

    res.json({ station });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to update station', {
      operation: 'update_station',
      userId: req.user?.id,
      stationId: req.params.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to update station',
      message: err.message
    });
  }
}

/**
 * DELETE /api/scheduling/admin/stations/:id
 * Delete a business station
 */
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

    // Verify station exists and belongs to business
    const existing = await prisma.businessStation.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    if (existing.businessId !== businessId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if station is being used in any shifts
    const shiftsUsingStation = await prisma.scheduleShift.count({
      where: {
        businessId,
        stationName: existing.name
      }
    });

    if (shiftsUsingStation > 0) {
      res.status(409).json({ 
        error: 'Cannot delete station that is assigned to shifts',
        message: `This station is currently assigned to ${shiftsUsingStation} shift(s). Please remove assignments before deleting.`
      });
      return;
    }

    await prisma.businessStation.delete({
      where: { id }
    });

    logger.info('Business station deleted', {
      operation: 'delete_station',
      userId: user.id,
      businessId,
      stationId: id
    });

    res.json({ success: true, message: 'Station deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to delete station', {
      operation: 'delete_station',
      userId: req.user?.id,
      stationId: req.params.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to delete station',
      message: err.message
    });
  }
}

// ============================================================================
// JOB LOCATIONS
// ============================================================================

/**
 * GET /api/scheduling/admin/job-locations
 * Get all job locations for a business
 */
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

    // Verify user has access to business
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: { businessId, userId: user.id }
      }
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const locations = await prisma.jobLocation.findMany({
      where: {
        businessId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ jobLocations: locations });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to get job locations', {
      operation: 'get_job_locations',
      userId: req.user?.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to fetch job locations',
      message: err.message
    });
  }
}

/**
 * POST /api/scheduling/admin/job-locations
 * Create a new job location
 */
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

    // Verify user has admin access
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: { businessId, userId: user.id }
      }
    });

    if (!member || !member.isActive || member.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Check if location name already exists for this business
    const existing = await prisma.jobLocation.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: name.trim()
        }
      }
    });

    if (existing) {
      res.status(409).json({ error: 'Job location with this name already exists' });
      return;
    }

    const location = await prisma.jobLocation.create({
      data: {
        businessId,
        name: name.trim(),
        address: address || null,
        description: description || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        isActive: true
      }
    });

    logger.info('Job location created', {
      operation: 'create_job_location',
      userId: user.id,
      businessId,
      locationId: location.id
    });

    res.status(201).json({ location });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to create job location', {
      operation: 'create_job_location',
      userId: req.user?.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to create job location',
      message: err.message
    });
  }
}

/**
 * PUT /api/scheduling/admin/job-locations/:id
 * Update a job location
 */
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

    // Get existing location
    const existing = await prisma.jobLocation.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Job location not found' });
      return;
    }

    // Verify user has admin access to business
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: { businessId: existing.businessId, userId: user.id }
      }
    });

    if (!member || !member.isActive || member.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.jobLocation.findUnique({
        where: {
          businessId_name: {
            businessId: existing.businessId,
            name: name.trim()
          }
        }
      });

      if (duplicate) {
        res.status(409).json({ error: 'Job location with this name already exists' });
        return;
      }
    }

    const location = await prisma.jobLocation.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address: address || null }),
        ...(description !== undefined && { description: description || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    logger.info('Job location updated', {
      operation: 'update_job_location',
      userId: user.id,
      businessId: existing.businessId,
      locationId: id
    });

    res.json({ location });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to update job location', {
      operation: 'update_job_location',
      userId: req.user?.id,
      locationId: req.params.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to update job location',
      message: err.message
    });
  }
}

/**
 * DELETE /api/scheduling/admin/job-locations/:id
 * Delete a job location
 */
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

    // Get existing location
    const existing = await prisma.jobLocation.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ error: 'Job location not found' });
      return;
    }

    // Verify user has admin access
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: { businessId: existing.businessId, userId: user.id }
      }
    });

    if (!member || !member.isActive || member.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Check if location is used in schedules or shifts
    const schedulesUsingLocation = await prisma.schedule.count({
      where: { locationId: id }
    });

    const shiftsUsingLocation = await prisma.scheduleShift.count({
      where: { locationId: id }
    });

    if (schedulesUsingLocation > 0 || shiftsUsingLocation > 0) {
      res.status(409).json({ 
        error: 'Cannot delete job location that is assigned to schedules or shifts',
        message: `This location is currently assigned to ${schedulesUsingLocation} schedule(s) and ${shiftsUsingLocation} shift(s). Please remove assignments before deleting.`
      });
      return;
    }

    await prisma.jobLocation.delete({
      where: { id }
    });

    logger.info('Job location deleted', {
      operation: 'delete_job_location',
      userId: user.id,
      businessId: existing.businessId,
      locationId: id
    });

    res.json({ success: true, message: 'Job location deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    
    logger.error('Failed to delete job location', {
      operation: 'delete_job_location',
      userId: req.user?.id,
      locationId: req.params.id,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });

    res.status(500).json({ 
      error: 'Failed to delete job location',
      message: err.message
    });
  }
}

