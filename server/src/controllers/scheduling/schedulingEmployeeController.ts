import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma, BusinessRole, SchedulingStrategy, JobFunction, StationType, ScheduleStatus, AttendanceRecordStatus } from '@prisma/client';
import { getRecommendedSchedulingConfig } from '../../services/schedulingRecommendationService';
import { SchedulingPhilosophyService } from '../../services/schedulingPhilosophyService';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId, TIME_FIELD_REGEX } from './schedulingShared';

// Employee Functions
/**
 * GET /api/scheduling/me/schedule
 * Get the current user's own schedule
 * 
 * NOTE: Employee data comes from HR module's EmployeePosition when available.
 * If employeePositionId is not set, we query by userId directly.
 */
export async function getOwnSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const employeePositionId = req.employeePositionId;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Query shifts assigned to this employee
    // IMPORTANT: Only return shifts from PUBLISHED schedules
    // If employeePositionId exists, use it; otherwise query by userId via employeePosition relation
    const where: Prisma.ScheduleShiftWhereInput = {
      businessId,
      schedule: {
        status: 'PUBLISHED' // Only show shifts from published schedules
      },
      OR: employeePositionId
        ? [{ employeePositionId }]
        : [
            {
              employeePosition: {
                userId: user.id,
                active: true
              }
            }
          ]
    };

    const shifts = await prisma.scheduleShift.findMany({
      where,
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            timezone: true
          }
        },
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            position: {
              select: {
                title: true
              }
            }
          }
        },
        position: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Group shifts by schedule to return in the expected format
    const scheduleMap = new Map<string, {
      id: string;
      businessId: string;
      name: string;
      startDate: Date;
      endDate: Date;
      timezone: string;
      status: string;
      shifts: typeof shifts;
    }>();

    for (const shift of shifts) {
      if (!shift.schedule) continue;
      
      const scheduleId = shift.schedule.id;
      if (!scheduleMap.has(scheduleId)) {
        scheduleMap.set(scheduleId, {
          id: scheduleId,
          businessId,
          name: shift.schedule.name,
          startDate: shift.schedule.startDate,
          endDate: shift.schedule.endDate,
          timezone: shift.schedule.timezone,
          status: shift.schedule.status,
          shifts: []
        });
      }
      scheduleMap.get(scheduleId)!.shifts.push(shift);
    }

    const schedules = Array.from(scheduleMap.values());

    logger.info('Own schedule retrieved', {
      operation: 'get_own_schedule',
      userId: user.id,
      businessId,
      scheduleCount: schedules.length,
      shiftCount: shifts.length
    });

    // Return in format expected by frontend (schedules array with shifts)
    res.json({ schedules });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get own schedule', {
      operation: 'get_own_schedule',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve schedule' });
  }
}

/**
 * POST /api/scheduling/me/availability
 * Set employee availability
 */
export async function setOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  void logger.debug('setOwnAvailability invoked', {
    operation: 'set_own_availability',
    context: {
      method: req.method,
      path: req.path,
      hasUser: !!req.user,
      userId: req.user?.id,
      businessId: req.businessId,
      bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body as object) : [],
    },
  });
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const employeePositionId = req.employeePositionId;
    const { dayOfWeek, startTime, endTime, availabilityType, effectiveFrom, effectiveTo, recurring, notes } = req.body;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Validate required fields
    if (!dayOfWeek || !startTime || !endTime || !availabilityType) {
      res.status(400).json({ error: 'Missing required fields: dayOfWeek, startTime, endTime, availabilityType' });
      return;
    }

    // Validate day of week
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!validDays.includes(dayOfWeek.toUpperCase())) {
      res.status(400).json({ error: 'Invalid day of week. Must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY' });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({ error: 'Invalid time format. Use HH:MM (24-hour format)' });
      return;
    }

    // Validate end time is after start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    // Validate availability type
    const validTypes = ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED'];
    if (!validTypes.includes(availabilityType.toUpperCase())) {
      res.status(400).json({ error: 'Invalid availability type. Must be one of: AVAILABLE, UNAVAILABLE, PREFERRED' });
      return;
    }

    // Find employee position if not provided
    // REQUIREMENT: User must have at least one active EmployeePosition record for this business
    // to set availability. This links the user to a Position in the org chart, which is required
    // for scheduling functionality. The EmployeePosition must have:
    // - userId: matches the authenticated user
    // - businessId: matches the request businessId  
    // - active: true
    // - positionId: references a Position record in the org chart
    // - assignedById: the user who assigned this position
    // - startDate: when the position assignment started
    // To create an EmployeePosition, use the org chart API: POST /api/org-chart/employees/assign
    let finalEmployeePositionId = employeePositionId;
    if (!finalEmployeePositionId) {
      const position = await prisma.employeePosition.findFirst({
        where: {
          businessId,
          userId: user.id,
          active: true
        },
        select: { id: true }
      });

      if (!position) {
        res.status(404).json({ 
          error: 'No active employee position found for this user',
          message: 'You must be assigned to a position in the org chart for this business before setting availability. Please contact your administrator to add you to the org chart, or use the org chart UI to assign yourself to a position.',
          helpUrl: '/api/org-chart/employees/assign'
        });
        return;
      }
      finalEmployeePositionId = position.id;
    } else {
      // Verify the position belongs to the user
      const position = await prisma.employeePosition.findFirst({
        where: {
          id: finalEmployeePositionId,
          businessId,
          userId: user.id,
          active: true
        }
      });

      if (!position) {
        res.status(403).json({ error: 'You can only set availability for your own position' });
        return;
      }
    }

    // Check for overlapping availability on the same day
    const overlapping = await prisma.employeeAvailability.findFirst({
      where: {
        businessId,
        employeePositionId: finalEmployeePositionId,
        dayOfWeek: dayOfWeek.toUpperCase(),
        OR: [
          {
            AND: [
              { effectiveFrom: { lte: effectiveTo ? new Date(effectiveTo) : new Date('2099-12-31') } },
              { effectiveTo: { gte: effectiveFrom ? new Date(effectiveFrom) : new Date('1970-01-01') } }
            ]
          },
          {
            AND: [
              { recurring: true },
              { effectiveTo: null }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      res.status(409).json({ 
        error: 'Overlapping availability already exists for this day and time period',
        conflictId: overlapping.id
      });
      return;
    }

    // Create availability record
    const availability = await prisma.employeeAvailability.create({
      data: {
        businessId,
        employeePositionId: finalEmployeePositionId,
        dayOfWeek: dayOfWeek.toUpperCase(),
        startTime,
        endTime,
        availabilityType: availabilityType.toUpperCase() as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        recurring: recurring !== undefined ? recurring : true,
        notes: notes || null
      },
      include: {
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    logger.info('Availability created', {
      operation: 'set_own_availability',
      userId: user.id,
      businessId,
      employeePositionId: finalEmployeePositionId,
      availabilityId: availability.id
    });

    res.status(201).json(availability);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to set availability', {
      operation: 'set_own_availability',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to set availability' });
  }
}

/**
 * PUT /api/scheduling/me/availability/:id
 * Update employee availability
 */
export async function updateOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const availabilityId = req.params.id;
    const { dayOfWeek, startTime, endTime, availabilityType, effectiveFrom, effectiveTo, recurring, notes } = req.body;

    if (!user || !businessId || !availabilityId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Find the availability record and verify ownership
    const existingAvailability = await prisma.employeeAvailability.findUnique({
      where: { id: availabilityId },
      include: {
        employeePosition: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingAvailability || existingAvailability.businessId !== businessId) {
      res.status(404).json({ error: 'Availability record not found' });
      return;
    }

    // Verify the availability belongs to the user
    if (existingAvailability.employeePosition.userId !== user.id) {
      res.status(403).json({ error: 'You can only update your own availability' });
      return;
    }

    // Build update data
    const updateData: Prisma.EmployeeAvailabilityUpdateInput = {};

    if (dayOfWeek) {
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (!validDays.includes(dayOfWeek.toUpperCase())) {
        res.status(400).json({ error: 'Invalid day of week' });
        return;
      }
      updateData.dayOfWeek = dayOfWeek.toUpperCase();
    }

    if (startTime !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
        return;
      }
      updateData.startTime = startTime;
    }

    if (endTime !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(endTime)) {
        res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
        return;
      }
      updateData.endTime = endTime;
    }

    // Validate end time is after start time if both are provided
    if ((startTime !== undefined || endTime !== undefined) && updateData.startTime && updateData.endTime) {
      const finalStartTime = (updateData.startTime as string) || existingAvailability.startTime;
      const finalEndTime = (updateData.endTime as string) || existingAvailability.endTime;
      
      const [startHour, startMin] = finalStartTime.split(':').map(Number);
      const [endHour, endMin] = finalEndTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        res.status(400).json({ error: 'End time must be after start time' });
        return;
      }
    }

    if (availabilityType) {
      const validTypes = ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED'];
      if (!validTypes.includes(availabilityType.toUpperCase())) {
        res.status(400).json({ error: 'Invalid availability type' });
        return;
      }
      updateData.availabilityType = availabilityType.toUpperCase() as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';
    }

    if (effectiveFrom !== undefined) {
      updateData.effectiveFrom = new Date(effectiveFrom);
    }

    if (effectiveTo !== undefined) {
      updateData.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    }

    if (recurring !== undefined) {
      updateData.recurring = recurring;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update the availability record
    const updatedAvailability = await prisma.employeeAvailability.update({
      where: { id: availabilityId },
      data: updateData,
      include: {
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    logger.info('Availability updated', {
      operation: 'update_own_availability',
      userId: user.id,
      businessId,
      availabilityId
    });

    res.json(updatedAvailability);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to update availability', {
      operation: 'update_own_availability',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to update availability' });
  }
}

/**
 * GET /api/scheduling/me/availability
 * Get employee's own availability
 */
export async function getOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const employeePositionId = req.employeePositionId;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find employee position if not provided
    let finalEmployeePositionId = employeePositionId;
    if (!finalEmployeePositionId) {
      const position = await prisma.employeePosition.findFirst({
        where: {
          businessId,
          userId: user.id,
          active: true
        },
        select: { id: true }
      });

      if (!position) {
        // Return empty array if no position found (user might be a member without position)
        res.json({ availability: [] });
        return;
      }
      finalEmployeePositionId = position.id;
    } else {
      // Verify the position belongs to the user
      const position = await prisma.employeePosition.findFirst({
        where: {
          id: finalEmployeePositionId,
          businessId,
          userId: user.id,
          active: true
        }
      });

      if (!position) {
        res.status(403).json({ error: 'You can only view availability for your own position' });
        return;
      }
    }

    // Query availability records
    const availability = await prisma.employeeAvailability.findMany({
      where: {
        businessId,
        employeePositionId: finalEmployeePositionId
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ],
      include: {
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    logger.info('Own availability retrieved', {
      operation: 'get_own_availability',
      userId: user.id,
      businessId,
      availabilityCount: availability.length
    });

    res.json({ availability });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get own availability', {
      operation: 'get_own_availability',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve availability' });
  }
}

/**
 * DELETE /api/scheduling/me/availability/:id
 * Delete employee availability
 */
export async function deleteOwnAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const availabilityId = req.params.id;

    if (!user || !businessId || !availabilityId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Find the availability record and verify ownership
    const existingAvailability = await prisma.employeeAvailability.findUnique({
      where: { id: availabilityId },
      include: {
        employeePosition: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingAvailability || existingAvailability.businessId !== businessId) {
      res.status(404).json({ error: 'Availability record not found' });
      return;
    }

    // Verify the availability belongs to the user
    if (existingAvailability.employeePosition.userId !== user.id) {
      res.status(403).json({ error: 'You can only delete your own availability' });
      return;
    }

    // Delete the availability record
    await prisma.employeeAvailability.delete({
      where: { id: availabilityId }
    });

    logger.info('Availability deleted', {
      operation: 'delete_own_availability',
      userId: user.id,
      businessId,
      availabilityId
    });

    res.json({ message: 'Availability deleted successfully' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to delete availability', {
      operation: 'delete_own_availability',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to delete availability' });
  }
}

/**
 * POST /api/scheduling/me/shifts/:id/swap/request
 * Request a shift swap
 */
export async function requestShiftSwap(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const shiftId = req.params.id;
    const { requestedToId, coveredShiftId, requestNotes } = req.body;

    if (!user || !businessId || !shiftId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Verify the shift exists and belongs to the user
    const shift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        employeePosition: {
          include: {
            user: true
          }
        }
      }
    });

    if (!shift || shift.businessId !== businessId) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    // Verify the shift is assigned to the requesting user
    if (!shift.employeePosition || shift.employeePosition.userId !== user.id) {
      res.status(403).json({ error: 'You can only request swaps for your own shifts' });
      return;
    }

    // Check if shift is in the future
    if (new Date(shift.startTime) < new Date()) {
      res.status(400).json({ error: 'Cannot swap shifts that have already started' });
      return;
    }

    // Create the swap request
    const swapReason = requestNotes || (coveredShiftId ? `Willing to cover shift ${coveredShiftId}` : null);

    const swapRequest = await prisma.shiftSwapRequest.create({
      data: {
        businessId,
        originalShiftId: shiftId,
        requestedById: user.id,
        requestedToId: requestedToId || null,
        reason: swapReason,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        originalShift: {
          include: {
            schedule: {
              select: {
                id: true,
                name: true
              }
            },
            employeePosition: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        requestedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Shift swap request created', {
      operation: 'request_shift_swap',
      userId: user.id,
      businessId,
      shiftId,
      swapRequestId: swapRequest.id
    });

    res.status(201).json(swapRequest);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to request shift swap', {
      operation: 'request_shift_swap',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to request shift swap' });
  }
}

/**
 * GET /api/scheduling/me/swaps
 * Get the current user's own shift swap requests
 * 
 * NOTE: Time-off requests should use HR module's TimeOffRequest model.
 * This endpoint is for shift swaps only (different from time-off).
 */
export async function getOwnShiftSwapRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const employeePositionId = req.employeePositionId;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Query swap requests for this employee
    // ShiftSwapRequest uses requestedById (userId) not employeePositionId
    const orConditions: Prisma.ShiftSwapRequestWhereInput[] = [
      { requestedById: user.id },
      { requestedToId: user.id }
    ];

    if (employeePositionId) {
      orConditions.push({
        originalShift: {
          employeePositionId
        }
      });
    }

    const where: Prisma.ShiftSwapRequestWhereInput = {
      businessId,
      OR: orConditions
    };

    const swaps = await prisma.shiftSwapRequest.findMany({
      where,
      include: {
        originalShift: {
          include: {
            schedule: {
              select: {
                id: true,
                name: true
              }
            },
            employeePosition: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        requestedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Own swap requests retrieved', {
      operation: 'get_own_swap_requests',
      userId: user.id,
      businessId,
      swapCount: swaps.length
    });

    res.json({ swaps });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get own swap requests', {
      operation: 'get_own_swap_requests',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve swap requests' });
  }
}

/**
 * POST /api/scheduling/me/swap-requests/:id/cancel
 * Cancel a pending shift swap request
 */
export async function cancelSwapRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Find the swap request
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
      include: {
        originalShift: {
          include: {
            employeePosition: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!swapRequest || swapRequest.businessId !== businessId) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    // Verify the swap request belongs to the user
    if (swapRequest.requestedById !== user.id) {
      res.status(403).json({ error: 'You can only cancel your own swap requests' });
      return;
    }

    // Only allow cancellation of pending requests
    if (swapRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Can only cancel pending swap requests' });
      return;
    }

    // Update status to CANCELLED
    const updatedSwap = await prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: {
        status: 'CANCELLED'
      },
      include: {
        originalShift: {
          include: {
            schedule: {
              select: {
                id: true,
                name: true
              }
            },
            employeePosition: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        requestedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Swap request cancelled', {
      operation: 'cancel_swap_request',
      userId: user.id,
      businessId,
      swapRequestId: swapId
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to cancel swap request', {
      operation: 'cancel_swap_request',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to cancel swap request' });
  }
}

/**
 * POST /api/scheduling/me/shifts/:id/claim
 * Claim an open shift
 */
export async function claimOpenShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const shiftId = req.params.id;
    const employeePositionId = req.employeePositionId;

    if (!user || !businessId || !shiftId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Find the shift
    const shift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        position: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!shift || shift.businessId !== businessId) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    // Verify the shift is open
    if (!shift.isOpenShift || shift.status !== 'OPEN') {
      res.status(400).json({ error: 'Shift is not available for claiming. It may already be assigned or not marked as open.' });
      return;
    }

    // Check if shift is in the future
    if (new Date(shift.startTime) < new Date()) {
      res.status(400).json({ error: 'Cannot claim shifts that have already started' });
      return;
    }

    // Find employee position if not provided
    let finalEmployeePositionId = employeePositionId;
    if (!finalEmployeePositionId) {
      const position = await prisma.employeePosition.findFirst({
        where: {
          businessId,
          userId: user.id,
          active: true
        },
        select: { id: true }
      });

      if (!position) {
        res.status(404).json({ error: 'No active employee position found for this user' });
        return;
      }
      finalEmployeePositionId = position.id;
    } else {
      // Verify the position belongs to the user
      const position = await prisma.employeePosition.findFirst({
        where: {
          id: finalEmployeePositionId,
          businessId,
          userId: user.id,
          active: true
        }
      });

      if (!position) {
        res.status(403).json({ error: 'You can only claim shifts for your own position' });
        return;
      }
    }

    // Check if position matches shift requirements (if specified)
    if (shift.positionId && shift.positionId !== shift.employeePosition?.positionId) {
      // Verify the employee position matches the required position
      const employeePosition = await prisma.employeePosition.findUnique({
        where: { id: finalEmployeePositionId },
        select: { positionId: true }
      });

      if (employeePosition?.positionId !== shift.positionId) {
        res.status(403).json({ 
          error: 'You do not have the required position to claim this shift',
          requiredPositionId: shift.positionId
        });
        return;
      }
    }

    // Check for overlapping shifts (employee already scheduled during this time)
    const overlappingShift = await prisma.scheduleShift.findFirst({
      where: {
        businessId,
        employeePositionId: finalEmployeePositionId,
        id: { not: shiftId },
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { startTime: { lte: shift.startTime } },
              { endTime: { gt: shift.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: shift.endTime } },
              { endTime: { gte: shift.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: shift.startTime } },
              { endTime: { lte: shift.endTime } }
            ]
          }
        ]
      }
    });

    if (overlappingShift) {
      res.status(409).json({ 
        error: 'You are already scheduled for a shift during this time period',
        conflictingShiftId: overlappingShift.id
      });
      return;
    }

    // Assign the shift to the employee
    const updatedShift = await prisma.scheduleShift.update({
      where: { id: shiftId },
      data: {
        employeePosition: { connect: { id: finalEmployeePositionId } },
        isOpenShift: false,
        status: 'SCHEDULED'
      },
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        employeePosition: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            position: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        position: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    logger.info('Open shift claimed', {
      operation: 'claim_open_shift',
      userId: user.id,
      businessId,
      shiftId,
      employeePositionId: finalEmployeePositionId
    });

    // Sync to calendar if schedule is published
    if (updatedShift.schedule.status === 'PUBLISHED') {
      try {
        const { syncSingleShiftToCalendar } = await import('../../services/hrScheduleService');
        await syncSingleShiftToCalendar(shiftId, businessId);
        logger.info('Open shift claim synced to calendar', {
          operation: 'claim_open_shift_calendar_sync',
          shiftId,
          businessId
        });
      } catch (calendarError) {
        // Log but don't fail the request if calendar sync fails
        logger.warn('Failed to sync open shift claim to calendar', {
          operation: 'claim_open_shift_calendar_sync',
          shiftId,
          businessId,
          error: {
            message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
            stack: calendarError instanceof Error ? calendarError.stack : undefined
          }
        });
      }
    }

    res.json(updatedShift);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to claim open shift', {
      operation: 'claim_open_shift',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to claim shift' });
  }
}

/**
 * GET /api/scheduling/me/open-shifts
 * Get available open shifts for the current user
 */
export async function getOwnOpenShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    // Get businessId from middleware or validate from query
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
    const employeePositionId = req.employeePositionId;
    const { startDate, endDate, positionId } = req.query;

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find employee position to check position requirements
    let finalEmployeePositionId = employeePositionId;
    let userPositionId: string | null = null;

    if (!finalEmployeePositionId) {
      const position = await prisma.employeePosition.findFirst({
        where: {
          businessId,
          userId: user.id,
          active: true
        },
        include: {
          position: {
            select: { id: true }
          }
        }
      });

      if (position) {
        finalEmployeePositionId = position.id;
        userPositionId = position.positionId;
      }
    } else {
      const position = await prisma.employeePosition.findUnique({
        where: { id: finalEmployeePositionId },
        include: {
          position: {
            select: { id: true }
          }
        }
      });

      if (position && position.businessId === businessId && position.userId === user.id) {
        userPositionId = position.positionId;
      }
    }

    // Build query for open shifts
    // Only show open shifts from PUBLISHED schedules (employees shouldn't see draft schedules)
    const where: Prisma.ScheduleShiftWhereInput = {
      businessId,
      isOpenShift: true,
      status: 'OPEN',
      startTime: { gte: new Date() }, // Only future shifts
      schedule: {
        status: 'PUBLISHED' // Only show shifts from published schedules
      }
    };

    // Filter by date range if provided
    if (startDate && typeof startDate === 'string') {
      where.startTime = { ...where.startTime as Prisma.DateTimeFilter, gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      where.endTime = { lte: new Date(endDate) };
    }

    // Filter by position if specified or match user's position
    if (positionId && typeof positionId === 'string') {
      where.positionId = positionId;
    } else if (userPositionId) {
      // Show shifts that match user's position OR shifts with no position requirement
      where.OR = [
        { positionId: userPositionId },
        { positionId: null }
      ];
    } else {
      // If user has no position, only show shifts with no position requirement
      where.positionId = null;
    }

    // Exclude shifts the user is already assigned to or has conflicts with
    if (finalEmployeePositionId) {
      const conflictingShifts = await prisma.scheduleShift.findMany({
        where: {
          businessId,
          employeePositionId: finalEmployeePositionId,
          status: { not: 'CANCELLED' },
          startTime: { gte: new Date() }
        },
        select: {
          startTime: true,
          endTime: true
        }
      });

      // Build OR condition to exclude overlapping times
      if (conflictingShifts.length > 0) {
        where.NOT = conflictingShifts.map(conflict => ({
          OR: [
            {
              AND: [
                { startTime: { lte: conflict.startTime } },
                { endTime: { gt: conflict.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: conflict.endTime } },
                { endTime: { gte: conflict.endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: conflict.startTime } },
                { endTime: { lte: conflict.endTime } }
              ]
            }
          ]
        }));
      }
    }

    const openShifts = await prisma.scheduleShift.findMany({
      where,
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        position: {
          select: {
            id: true,
            title: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    logger.info('Open shifts retrieved', {
      operation: 'get_own_open_shifts',
      userId: user.id,
      businessId,
      shiftCount: openShifts.length
    });

    res.json({ shifts: openShifts });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get open shifts', {
      operation: 'get_own_open_shifts',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve open shifts' });
  }
}

