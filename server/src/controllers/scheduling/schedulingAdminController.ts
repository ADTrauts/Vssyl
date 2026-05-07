import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma, BusinessRole, SchedulingStrategy, JobFunction, StationType, ScheduleStatus, AttendanceRecordStatus } from '@prisma/client';
import { getRecommendedSchedulingConfig } from '../../services/schedulingRecommendationService';
import { SchedulingPhilosophyService } from '../../services/schedulingPhilosophyService';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId, TIME_FIELD_REGEX } from './schedulingShared';

// ============================================================================
// ADMIN - Schedule Management
// ============================================================================

export async function getSchedules(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const { status, startDate, endDate } = req.query;

    const where: Prisma.ScheduleWhereInput = {
      businessId
    };

    if (
      status &&
      typeof status === 'string' &&
      ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())
    ) {
      where.status = status.toUpperCase() as ScheduleStatus;
    }

    if (startDate || endDate) {
      const dateFilters: Prisma.ScheduleWhereInput[] = [];
      if (startDate && typeof startDate === 'string') {
        dateFilters.push({ startDate: { gte: new Date(startDate) } });
      }
      if (endDate && typeof endDate === 'string') {
        dateFilters.push({ endDate: { lte: new Date(endDate) } });
      }
      if (dateFilters.length > 0) {
        where.AND = dateFilters;
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        shifts: {
          include: {
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
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Return schedules with shifts included
    const schedulesWithShifts = schedules.map(schedule => ({
      id: schedule.id,
      businessId: schedule.businessId,
      name: schedule.name,
      description: schedule.description,
      locationId: schedule.locationId,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      timezone: schedule.timezone,
      status: schedule.status,
      publishedAt: schedule.publishedAt,
      publishedById: schedule.publishedById,
      templateId: schedule.templateId,
      metadata: schedule.metadata,
      createdById: schedule.createdById,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      shifts: schedule.shifts || []
    }));

    // Debug: Log shift counts
    const totalShifts = schedulesWithShifts.reduce((sum, s) => sum + (s.shifts?.length || 0), 0);
    logger.info('Schedules retrieved', {
      operation: 'list_schedules',
      userId: user.id,
      businessId,
      scheduleCount: schedulesWithShifts.length,
      totalShiftCount: totalShifts,
      schedulesWithShifts: schedulesWithShifts.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        shiftCount: s.shifts?.length || 0,
        firstShiftDate: s.shifts?.[0]?.startTime || null
      }))
    });

    res.json({ schedules: schedulesWithShifts });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    const businessIdParam = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;
    
    logger.error('Failed to list schedules', {
      operation: 'list_schedules',
      userId: req.user?.id,
      businessId: businessIdParam,
      error: { 
        message: err.message, 
        stack: err.stack
      }
    });
    res.status(500).json({ 
      error: 'Failed to retrieve schedules',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export async function getScheduleById(
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

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const schedule = await prisma.schedule.findFirst({
      where: { id, businessId: authorizedBusinessId },
      include: {
        shifts: {
          include: {
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
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        publishedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    logger.info('Schedule retrieved', {
      operation: 'get_schedule',
      userId: user.id,
      scheduleId: id
    });

    res.json({ schedule });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get schedule', {
      operation: 'get_schedule',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve schedule' });
  }
}

export async function createSchedule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
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

    const schedule = await prisma.schedule.create({
      data: {
        businessId: authorizedBusinessId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timezone: timezone || 'America/New_York',
        templateId,
        createdById: user.id,
        status: 'DRAFT'
      }
    });

    logger.info('Schedule created', {
      operation: 'create_schedule',
      userId: user.id,
      scheduleId: schedule.id,
      businessId: authorizedBusinessId
    });

    res.status(201).json({ schedule });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to create schedule', {
      operation: 'create_schedule',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to create schedule' });
  }
}

export async function updateSchedule(
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
    const { name, description, startDate, endDate, timezone } = req.body;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const existingSchedule = await prisma.schedule.findFirst({
      where: { id, businessId: authorizedBusinessId }
    });

    if (!existingSchedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    // Allow admins/managers to edit published schedules (they can republish after making changes)
    // No restriction on editing published schedules

    const data: Prisma.ScheduleUpdateInput = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (timezone) data.timezone = timezone;

    const schedule = await prisma.schedule.update({
      where: { id },
      data
    });

    logger.info('Schedule updated', {
      operation: 'update_schedule',
      userId: user.id,
      scheduleId: id
    });

    res.json({ schedule });
  } catch (error) {
    logger.error('Failed to update schedule', {
      operation: 'update_schedule',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to update schedule' });
  }
}

export async function deleteSchedule(
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

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const schedule = await prisma.schedule.findFirst({
      where: { id, businessId: authorizedBusinessId },
      include: {
        shifts: {
          select: { id: true, metadata: true }
        }
      }
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    // Clean up calendar events if schedule was published
    if (schedule.status === 'PUBLISHED' && schedule.shifts.length > 0) {
      try {
        const eventIdsToDelete = new Set<string>();
        
        // Collect all calendar event IDs from shift metadata
        for (const shift of schedule.shifts) {
          if (shift.metadata && typeof shift.metadata === 'object') {
            const meta = shift.metadata as Record<string, unknown>;
            const calendarEvents = meta.calendarEvents;
            if (calendarEvents && typeof calendarEvents === 'object') {
              const events = calendarEvents as Record<string, unknown>;
              if (events.scheduleEventId && typeof events.scheduleEventId === 'string') {
                eventIdsToDelete.add(events.scheduleEventId);
              }
              // Note: personalEventId is null now (we removed that), but handle if any exist
              if (events.personalEventId && typeof events.personalEventId === 'string') {
                eventIdsToDelete.add(events.personalEventId);
              }
            }
          }
        }

        // Delete calendar events
        if (eventIdsToDelete.size > 0) {
          await prisma.event.deleteMany({
            where: { id: { in: Array.from(eventIdsToDelete) } }
          });
          
          logger.info('Calendar events cleaned up for schedule deletion', {
            operation: 'delete_schedule',
            scheduleId: id,
            eventCount: eventIdsToDelete.size
          });
        }
      } catch (calendarError) {
        // Log but don't fail schedule deletion if calendar cleanup fails
        logger.warn('Failed to clean up calendar events during schedule deletion', {
          operation: 'delete_schedule_calendar_cleanup',
          scheduleId: id,
          error: {
            message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
            stack: calendarError instanceof Error ? calendarError.stack : undefined
          }
        });
      }
    }

    // Delete the schedule (shifts will cascade delete)
    await prisma.schedule.delete({
      where: { id }
    });

    logger.info('Schedule deleted', {
      operation: 'delete_schedule',
      userId: user.id,
      scheduleId: id,
      wasPublished: schedule.status === 'PUBLISHED'
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Failed to delete schedule', {
      operation: 'delete_schedule',
      error: { message: errorMessage, stack: errorStack }
    });
    
    // Provide more detailed error message to client
    res.status(500).json({ 
      error: 'Failed to delete schedule',
      message: errorMessage
    });
  }
}

export async function publishSchedule(
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

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const schedule = await prisma.schedule.findFirst({
      where: { id, businessId: authorizedBusinessId },
      include: {
        shifts: {
          include: {
            employeePosition: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                position: { select: { id: true, title: true } }
              }
            },
            position: { select: { id: true, title: true } },
            location: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    if (schedule.shifts.length === 0) {
      res.status(400).json({ error: 'Cannot publish empty schedule' });
      return;
    }

    // Allow republishing - update publishedAt timestamp and publishedById
    // This enables admins/managers to make edits and republish
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: user.id
      }
    });

    // Check if HR module is installed and create expected attendance records
    try {
      const hrInstallation = await prisma.businessModuleInstallation.findFirst({
        where: {
          businessId: schedule.businessId,
          moduleId: 'hr',
          enabled: true
        }
      });

      if (hrInstallation) {
        // Create expected attendance records for assigned shifts
        const assignedShifts = schedule.shifts.filter(s => s.employeePositionId);
        
        for (const shift of assignedShifts) {
          if (!shift.employeePositionId) continue;
          
          const shiftStart = new Date(shift.startTime);
          const shiftEnd = new Date(shift.endTime);
          const workDate = new Date(shiftStart);
          workDate.setHours(0, 0, 0, 0);
          
          // Check if attendance record already exists for this shift
          // Query records for this employee/date and check metadata in code
          const existingRecords = await prisma.attendanceRecord.findMany({
            where: {
              businessId: schedule.businessId,
              employeePositionId: shift.employeePositionId,
              workDate: workDate
            }
          });

          // Check if any record has this shift ID in metadata
          const existingRecord = existingRecords.find(record => {
            if (!record.metadata || typeof record.metadata !== 'object') return false;
            const meta = record.metadata as Record<string, unknown>;
            return meta.scheduleShiftId === shift.id;
          });

          if (!existingRecord) {
            // Create expected attendance record (status = MISSED until employee clocks in)
            await prisma.attendanceRecord.create({
              data: {
                businessId: schedule.businessId,
                employeePositionId: shift.employeePositionId,
                workDate: workDate,
                status: AttendanceRecordStatus.MISSED, // Will be updated to IN_PROGRESS when employee clocks in
                metadata: {
                  scheduleShiftId: shift.id,
                  scheduleId: schedule.id,
                  expectedStartTime: shiftStart.toISOString(),
                  expectedEndTime: shiftEnd.toISOString(),
                  source: 'scheduling_module'
                }
              }
            });
          }
        }

        logger.info('Expected attendance records created', {
          operation: 'publish_schedule',
          scheduleId: id,
          recordsCreated: assignedShifts.length
        });

        // Sync shifts to calendar
        try {
          const { syncScheduleShiftsToCalendar } = await import('../../services/hrScheduleService');
          await syncScheduleShiftsToCalendar(id, schedule.businessId);
          logger.info('Schedule shifts synced to calendar', {
            operation: 'publish_schedule',
            scheduleId: id,
            shiftCount: schedule.shifts.length
          });
        } catch (calendarError) {
          // Log but don't fail schedule publication if calendar sync fails
          logger.warn('Failed to sync schedule to calendar', {
            operation: 'publish_schedule',
            scheduleId: id,
            error: {
              message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
              stack: calendarError instanceof Error ? calendarError.stack : undefined
            }
          });
        }
      }
    } catch (hrError) {
      // Log but don't fail schedule publication if HR sync fails
      logger.warn('Failed to sync expected attendance records', {
        operation: 'publish_schedule',
        scheduleId: id,
        error: {
          message: hrError instanceof Error ? hrError.message : 'Unknown error',
          stack: hrError instanceof Error ? hrError.stack : undefined
        }
      });
    }

    // TODO: Send notifications to employees about published schedule

    logger.info('Schedule published', {
      operation: 'publish_schedule',
      userId: user.id,
      scheduleId: id,
      shiftCount: schedule.shifts.length
    });

    // Broadcast schedule published event via WebSocket
    try {
      const socketService = getChatSocketService();
      socketService.broadcastSchedulePublished(
        schedule.businessId,
        id,
        updatedSchedule as unknown as Record<string, unknown>
      );
    } catch (socketError) {
      // Don't fail the request if WebSocket broadcast fails
      logger.warn('Failed to broadcast schedule published event', {
        operation: 'publish_schedule_broadcast',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
    }

    res.json({ schedule: updatedSchedule, message: 'Schedule published successfully' });
  } catch (error) {
    logger.error('Failed to publish schedule', {
      operation: 'publish_schedule',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to publish schedule' });
  }
}

export async function cloneSchedule(
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
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields: name, startDate, endDate' });
      return;
    }

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const originalSchedule = await prisma.schedule.findFirst({
      where: { id, businessId: authorizedBusinessId },
      include: {
        shifts: true
      }
    });

    if (!originalSchedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    // Create new schedule with cloned data
    const newSchedule = await prisma.schedule.create({
      data: {
        businessId: originalSchedule.businessId,
        name,
        description: originalSchedule.description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timezone: originalSchedule.timezone,
        createdById: user.id,
        status: 'DRAFT'
      }
    });

    // Clone shifts with adjusted dates
    const dateDiff = new Date(startDate).getTime() - originalSchedule.startDate.getTime();
    
    const shiftPromises = originalSchedule.shifts.map(shift => {
      const newStartTime = new Date(shift.startTime.getTime() + dateDiff);
      const newEndTime = new Date(shift.endTime.getTime() + dateDiff);

      return prisma.scheduleShift.create({
        data: {
          scheduleId: newSchedule.id,
          businessId: originalSchedule.businessId,
          employeePositionId: shift.employeePositionId,
          title: shift.title,
          startTime: newStartTime,
          endTime: newEndTime,
          breakMinutes: shift.breakMinutes,
          notes: shift.notes,
          color: shift.color,
          isOpenShift: shift.isOpenShift,
          requiresApproval: shift.requiresApproval,
          status: 'SCHEDULED'
        }
      });
    });

    await Promise.all(shiftPromises);

    logger.info('Schedule cloned', {
      operation: 'clone_schedule',
      userId: user.id,
      originalScheduleId: id,
      newScheduleId: newSchedule.id
    });

    res.status(201).json({ schedule: newSchedule, message: 'Schedule cloned successfully' });
  } catch (error) {
    logger.error('Failed to clone schedule', {
      operation: 'clone_schedule',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to clone schedule' });
  }
}

// ============================================================================
// ADMIN - Shift Management
// ============================================================================

export async function getScheduleShifts(
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

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const shifts = await prisma.scheduleShift.findMany({
      where: {
        scheduleId: id,
        businessId: authorizedBusinessId
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
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            description: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({ shifts });
  } catch (error) {
    logger.error('Failed to get schedule shifts', {
      operation: 'get_schedule_shifts',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to retrieve shifts' });
  }
}

export async function createShift(
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
      locationId
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

    const scheduleForShift = await prisma.schedule.findFirst({
      where: { id: scheduleId, businessId: authorizedBusinessId },
      select: { id: true },
    });

    if (!scheduleForShift) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    // Check for time-off conflicts if employee is assigned
    if (employeePositionId) {
      const shiftStart = new Date(startTime);
      const shiftEnd = new Date(endTime);
      
      // Check if employee has approved or pending time-off that overlaps with this shift
      const timeOffConflict = await prisma.timeOffRequest.findFirst({
        where: {
          businessId: authorizedBusinessId,
          employeePositionId,
          status: { in: ['APPROVED', 'PENDING'] },
          OR: [
            {
              AND: [
                { startDate: { lte: shiftEnd } },
                { endDate: { gte: shiftStart } }
              ]
            }
          ]
        },
        include: {
          employeePosition: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (timeOffConflict) {
        const employeeName = timeOffConflict.employeePosition?.user?.name || 'Employee';
        const conflictType = timeOffConflict.type;
        const conflictStart = timeOffConflict.startDate.toISOString().split('T')[0];
        const conflictEnd = timeOffConflict.endDate.toISOString().split('T')[0];
        
        logger.warn('Shift creation blocked by time-off', {
          operation: 'create_shift',
          userId: user.id,
          employeePositionId,
          shiftStart: shiftStart.toISOString(),
          shiftEnd: shiftEnd.toISOString(),
          timeOffId: timeOffConflict.id,
          timeOffType: conflictType,
          timeOffDates: `${conflictStart} to ${conflictEnd}`
        });

        res.status(409).json({ 
          error: 'Cannot schedule shift during employee time-off',
          message: `${employeeName} has ${conflictType} time-off from ${conflictStart} to ${conflictEnd}`,
          conflict: {
            type: conflictType,
            startDate: conflictStart,
            endDate: conflictEnd,
            employeeName
          }
        });
        return;
      }
    }

    const shift = await prisma.scheduleShift.create({
      data: {
        scheduleId,
        businessId: authorizedBusinessId,
        employeePositionId,
        positionId,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        breakMinutes,
        notes,
        color,
        // Set isOpenShift to true if no employee is assigned, or if explicitly provided
        isOpenShift: isOpenShift !== undefined ? isOpenShift : (!employeePositionId),
        status: employeePositionId ? 'SCHEDULED' : 'OPEN',
        stationName: stationName || undefined,
        locationId: locationId || undefined
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
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            description: true
          }
        }
      }
    });

    logger.info('Shift created', {
      operation: 'create_shift',
      userId: user.id,
      shiftId: shift.id,
      scheduleId
    });

    // Broadcast shift created event via WebSocket
    try {
      const socketService = getChatSocketService();
      socketService.broadcastShiftCreated(
        authorizedBusinessId,
        scheduleId,
        shift as unknown as Record<string, unknown>
      );
    } catch (socketError) {
      // Don't fail the request if WebSocket broadcast fails
      logger.warn('Failed to broadcast shift created event', {
        operation: 'create_shift_broadcast',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
    }

    res.status(201).json({ shift });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Failed to create shift', {
      operation: 'create_shift',
      error: { message: errorMessage, stack: errorStack },
      requestBody: req.body
    });

    res.status(500).json({ 
      error: 'Failed to create shift',
      message: errorMessage
    });
  }
}

export async function updateShift(
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
      locationId
    } = req.body;

    const data: Prisma.ScheduleShiftUpdateInput = {};
    if (title) data.title = title;
    if (startTime) data.startTime = new Date(startTime);
    if (endTime) data.endTime = new Date(endTime);
    if (breakMinutes !== undefined) data.breakMinutes = breakMinutes;
    if (notes !== undefined) data.notes = notes;
    if (color) data.color = color;
    if (positionId !== undefined) {
      data.position =
        positionId === ''
          ? { disconnect: true }
          : { connect: { id: positionId } };
    }
    // Handle employeePositionId (can be set to null/undefined to unassign)
    if (employeePositionId !== undefined) {
      if (employeePositionId === null || employeePositionId === '' || typeof employeePositionId === 'string' && employeePositionId.startsWith('member-')) {
        // Disconnect employee position (set to null) - for unassigned or member employees without formal positions
        data.employeePosition = { disconnect: true };
        data.isOpenShift = true;
        data.status = 'OPEN'; // Set status to OPEN when unassigning
      } else {
        // Validate UUID format before connecting
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(employeePositionId)) {
          logger.error('Invalid employeePositionId format', {
            operation: 'update_shift',
            shiftId: id,
            employeePositionId
          });
          res.status(400).json({ error: 'Invalid employee position ID format' });
          return;
        }
        data.employeePosition = { connect: { id: employeePositionId } };
        data.isOpenShift = false;
        data.status = 'SCHEDULED'; // Set status to SCHEDULED when assigning
      }
    }
    // Handle stationName
    if (stationName !== undefined) {
      data.stationName = stationName === '' ? null : stationName;
    }
    // Handle locationId (can be set to null/undefined to remove location)
    if (locationId !== undefined) {
      if (locationId === null || locationId === '') {
        data.location = { disconnect: true };
      } else {
        data.location = { connect: { id: locationId } };
      }
    }

    // Get current shift to check for time-off conflicts
    const currentShift = await prisma.scheduleShift.findFirst({
      where: { id, businessId: authorizedBusinessId },
      select: { employeePositionId: true, startTime: true, endTime: true }
    });

    if (!currentShift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    // Determine final employeePositionId and shift dates for conflict check
    const finalEmployeePositionId = employeePositionId !== undefined 
      ? (employeePositionId === null || employeePositionId === '' || (typeof employeePositionId === 'string' && employeePositionId.startsWith('member-')) ? null : employeePositionId)
      : currentShift.employeePositionId;
    
    const finalStartTime = startTime ? new Date(startTime) : currentShift.startTime;
    const finalEndTime = endTime ? new Date(endTime) : currentShift.endTime;

    // Check for time-off conflicts if employee is assigned (or being assigned)
    if (finalEmployeePositionId) {
      const timeOffConflict = await prisma.timeOffRequest.findFirst({
        where: {
          businessId: authorizedBusinessId,
          employeePositionId: finalEmployeePositionId,
          status: { in: ['APPROVED', 'PENDING'] },
          OR: [
            {
              AND: [
                { startDate: { lte: finalEndTime } },
                { endDate: { gte: finalStartTime } }
              ]
            }
          ]
        },
        include: {
          employeePosition: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (timeOffConflict) {
        const employeeName = timeOffConflict.employeePosition?.user?.name || 'Employee';
        const conflictType = timeOffConflict.type;
        const conflictStart = timeOffConflict.startDate.toISOString().split('T')[0];
        const conflictEnd = timeOffConflict.endDate.toISOString().split('T')[0];
        
        logger.warn('Shift update blocked by time-off', {
          operation: 'update_shift',
          userId: user.id,
          shiftId: id,
          employeePositionId: finalEmployeePositionId,
          shiftStart: finalStartTime.toISOString(),
          shiftEnd: finalEndTime.toISOString(),
          timeOffId: timeOffConflict.id,
          timeOffType: conflictType,
          timeOffDates: `${conflictStart} to ${conflictEnd}`
        });

        res.status(409).json({ 
          error: 'Cannot schedule shift during employee time-off',
          message: `${employeeName} has ${conflictType} time-off from ${conflictStart} to ${conflictEnd}`,
          conflict: {
            type: conflictType,
            startDate: conflictStart,
            endDate: conflictEnd,
            employeeName
          }
        });
        return;
      }
    }

    const shift = await prisma.scheduleShift.update({
      where: { id },
      data,
      include: {
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
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            description: true
          }
        }
      }
    });

    logger.info('Shift updated', {
      operation: 'update_shift',
      userId: user.id,
      shiftId: id
    });

    // Broadcast shift updated event via WebSocket
    try {
      const socketService = getChatSocketService();
      const schedule = await prisma.schedule.findFirst({
        where: { id: shift.scheduleId, businessId: authorizedBusinessId },
        select: { businessId: true, status: true }
      });
      if (schedule) {
        socketService.broadcastShiftUpdated(
          schedule.businessId,
          shift.scheduleId,
          shift as unknown as Record<string, unknown>
        );

        // Sync to calendar if schedule is published
        if (schedule.status === 'PUBLISHED') {
          try {
            const { syncSingleShiftToCalendar } = await import('../../services/hrScheduleService');
            await syncSingleShiftToCalendar(id, schedule.businessId);
          } catch (calendarError) {
            // Log but don't fail the request if calendar sync fails
            logger.warn('Failed to sync shift update to calendar', {
              operation: 'update_shift_calendar_sync',
              shiftId: id,
              error: {
                message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
                stack: calendarError instanceof Error ? calendarError.stack : undefined
              }
            });
          }
        }
      }
    } catch (socketError) {
      // Don't fail the request if WebSocket broadcast fails
      logger.warn('Failed to broadcast shift updated event', {
        operation: 'update_shift_broadcast',
        error: {
          message: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined
        }
      });
    }

    res.json({ shift });
  } catch (error) {
    logger.error('Failed to update shift', {
      operation: 'update_shift',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to update shift' });
  }
}

export async function deleteShift(
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

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    // Get shift info before deleting for broadcast
    const shift = await prisma.scheduleShift.findFirst({
      where: { id, businessId: authorizedBusinessId },
      select: { scheduleId: true, businessId: true }
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    const schedule = await prisma.schedule.findFirst({
      where: { id: shift.scheduleId, businessId: authorizedBusinessId },
      select: { businessId: true }
    });

    await prisma.scheduleShift.delete({
      where: { id }
    });

    logger.info('Shift deleted', {
      operation: 'delete_shift',
      userId: user.id,
      shiftId: id
    });

    // Broadcast shift deleted event via WebSocket
    if (schedule) {
      try {
        const socketService = getChatSocketService();
        socketService.broadcastShiftDeleted(
          schedule.businessId,
          shift.scheduleId,
          id
        );
      } catch (socketError) {
        // Don't fail the request if WebSocket broadcast fails
        logger.warn('Failed to broadcast shift deleted event', {
          operation: 'delete_shift_broadcast',
          error: {
            message: socketError instanceof Error ? socketError.message : 'Unknown error',
            stack: socketError instanceof Error ? socketError.stack : undefined
          }
        });
      }
    }

    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete shift', {
      operation: 'delete_shift',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to delete shift' });
  }
}

export async function assignShift(
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
    const { employeePositionId } = req.body;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    if (!employeePositionId) {
      res.status(400).json({ error: 'Employee position ID is required' });
      return;
    }

    const existingShift = await prisma.scheduleShift.findFirst({
      where: { id, businessId: authorizedBusinessId },
      select: { id: true },
    });

    if (!existingShift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    // TODO: Check for scheduling conflicts
    // TODO: Check employee availability

    const shift = await prisma.scheduleShift.update({
      where: { id },
      data: {
        employeePositionId,
        status: 'SCHEDULED',
        isOpenShift: false
      },
      include: {
        schedule: {
          select: { businessId: true, status: true }
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
    });

    logger.info('Shift assigned', {
      operation: 'assign_shift',
      userId: user.id,
      shiftId: id,
      assignedToPositionId: employeePositionId
    });

    // Sync to calendar if schedule is published
    if (shift.schedule?.status === 'PUBLISHED' && shift.schedule.businessId) {
      try {
        const { syncSingleShiftToCalendar } = await import('../../services/hrScheduleService');
        await syncSingleShiftToCalendar(id, shift.schedule.businessId);
      } catch (calendarError) {
        // Log but don't fail the request if calendar sync fails
        logger.warn('Failed to sync shift assignment to calendar', {
          operation: 'assign_shift_calendar_sync',
          shiftId: id,
          error: {
            message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
            stack: calendarError instanceof Error ? calendarError.stack : undefined
          }
        });
      }
    }

    res.json({ shift, message: 'Shift assigned successfully' });
  } catch (error) {
    logger.error('Failed to assign shift', {
      operation: 'assign_shift',
      error: { message: (error as Error).message, stack: (error as Error).stack }
    });
    res.status(500).json({ error: 'Failed to assign shift' });
  }
}

// ============================================================================
// ADMIN - Additional Shift Management
// ============================================================================

export async function getShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const { scheduleId } = req.query;

    const where: Prisma.ScheduleShiftWhereInput = {
      businessId: businessId
    };

    if (scheduleId && typeof scheduleId === 'string') {
      where.scheduleId = scheduleId;
    }

    // Query shifts - start simple and add includes incrementally
    let shifts;
    try {
      // First try without nested includes to isolate the issue
      shifts = await prisma.scheduleShift.findMany({
        where,
        include: {
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
          schedule: {
            select: {
              id: true,
              name: true,
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
              name: true,
              address: true,
              description: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });
    } catch (prismaError: unknown) {
      const prismaErr = prismaError as Error & { code?: string; meta?: Record<string, unknown> };
      logger.error('Prisma query error in getShifts', {
        operation: 'get_shifts',
        error: {
          message: prismaErr.message,
          stack: prismaErr.stack,
          code: prismaErr.code
        },
        query: { businessId, scheduleId },
        prismaMeta: prismaErr.meta // Log meta separately to avoid type error
      });
      throw prismaError;
    }

    logger.info('Shifts retrieved', {
      operation: 'get_shifts',
      userId: user.id,
      businessId,
      scheduleId: scheduleId || 'all',
      shiftCount: shifts.length
    });

    res.json({ shifts });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get shifts', {
      operation: 'get_shifts',
      userId: req.user?.id,
      businessId: typeof req.query.businessId === 'string' ? req.query.businessId : undefined,
      scheduleId: typeof req.query.scheduleId === 'string' ? req.query.scheduleId : undefined,
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      error: 'Failed to retrieve shifts',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export async function getShiftById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const shift = await prisma.scheduleShift.findFirst({
      where: { id, businessId: authorizedBusinessId },
      include: {
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
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            description: true
          }
        }
      }
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    res.json({ shift });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to get shift', {
      operation: 'get_shift',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve shift' });
  }
}

// ============================================================================
// STUB IMPLEMENTATIONS - To be completed in future phases
// ============================================================================

// Templates
export async function getShiftTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ templates: [] });
}

export async function getShiftTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Shift templates coming in Phase 2' });
}

export async function createShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Shift templates coming in Phase 2' });
}

export async function updateShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Shift templates coming in Phase 2' });
}

export async function deleteShiftTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Shift templates coming in Phase 2' });
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

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const templates = await prisma.scheduleTemplate.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Schedule templates retrieved', {
      operation: 'get_schedule_templates',
      userId: user.id,
      businessId,
      count: templates.length,
    });

    res.json({ templates });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get schedule templates', {
      operation: 'get_schedule_templates',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to retrieve schedule templates' });
  }
}

export async function getScheduleTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const template = await prisma.scheduleTemplate.findFirst({
      where: { id, businessId: authorizedBusinessId },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: template.businessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    logger.info('Schedule template retrieved', {
      operation: 'get_schedule_template',
      userId: user.id,
      templateId: id,
    });

    res.json({ template });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get schedule template', {
      operation: 'get_schedule_template',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to retrieve schedule template' });
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

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: authorizedBusinessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    let finalTemplateData: Prisma.InputJsonValue = templateData || {};

    // If creating from an existing schedule, extract the pattern
    if (sourceScheduleId) {
      const schedule = await prisma.schedule.findFirst({
        where: { id: sourceScheduleId, businessId: authorizedBusinessId },
        include: {
          shifts: {
            include: {
              position: {
                select: { id: true, title: true },
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          },
        },
      });

      if (!schedule) {
        res.status(404).json({ error: 'Source schedule not found' });
        return;
      }

      // Extract shift patterns from the schedule
      // Convert shifts to template patterns (day of week, time, position, station, etc.)
      const shiftPatterns = schedule.shifts.map((shift) => {
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();

        return {
          dayOfWeek,
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          positionId: shift.positionId || null,
          positionTitle: shift.position?.title || null,
          stationName: shift.stationName || null,
          breakMinutes: shift.breakMinutes || 0,
          notes: shift.notes || null,
          color: shift.color || null,
          minStaffing: shift.minStaffing || 1,
          maxStaffing: shift.maxStaffing || 1,
          isOpenShift: shift.isOpenShift || false,
        };
      });

      finalTemplateData = {
        shiftPatterns,
        sourceScheduleId,
        sourceScheduleName: schedule.name,
      };
    }

    // Check for duplicate name
    const existing = await prisma.scheduleTemplate.findUnique({
      where: { businessId_name: { businessId: authorizedBusinessId, name } },
    });

    if (existing) {
      res.status(409).json({ error: 'Template with this name already exists' });
      return;
    }

    const template = await prisma.scheduleTemplate.create({
      data: {
        businessId: authorizedBusinessId,
        name,
        description: description || null,
        scheduleType,
        templateData: finalTemplateData as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    logger.info('Schedule template created', {
      operation: 'create_schedule_template',
      userId: user.id,
      templateId: template.id,
      businessId: authorizedBusinessId,
      sourceScheduleId: sourceScheduleId || null,
    });

    res.status(201).json({ template });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to create schedule template', {
      operation: 'create_schedule_template',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create schedule template' });
  }
}

export async function updateScheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    const { name, description, scheduleType, templateData, isActive } = req.body;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const template = await prisma.scheduleTemplate.findFirst({
      where: { id, businessId: authorizedBusinessId },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: template.businessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check for duplicate name if name is being changed
    if (name && name !== template.name) {
      const existing = await prisma.scheduleTemplate.findUnique({
        where: { businessId_name: { businessId: authorizedBusinessId, name } },
      });

      if (existing) {
        res.status(409).json({ error: 'Template with this name already exists' });
        return;
      }
    }

    const updatedTemplate = await prisma.scheduleTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(scheduleType && { scheduleType }),
        ...(templateData && { templateData: templateData as Prisma.InputJsonValue }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    logger.info('Schedule template updated', {
      operation: 'update_schedule_template',
      userId: user.id,
      templateId: id,
    });

    res.json({ template: updatedTemplate });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to update schedule template', {
      operation: 'update_schedule_template',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update schedule template' });
  }
}

export async function deleteScheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    const authorizedBusinessId = requireAuthorizedBusinessId(req, res);
    if (!authorizedBusinessId) return;

    const template = await prisma.scheduleTemplate.findFirst({
      where: { id, businessId: authorizedBusinessId },
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: template.businessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.scheduleTemplate.delete({
      where: { id },
    });

    logger.info('Schedule template deleted', {
      operation: 'delete_schedule_template',
      userId: user.id,
      templateId: id,
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to delete schedule template', {
      operation: 'delete_schedule_template',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete schedule template' });
  }
}

// Analytics
export async function getLaborCostAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Analytics coming in Phase 3' });
}

export async function getCoverageAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Analytics coming in Phase 3' });
}

export async function getComplianceReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Compliance reports coming in Phase 3' });
}

/**
 * GET /api/scheduling/admin/availability
 * Get all employee availability for a business (Admin)
 */
export async function getAllEmployeeAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    if (!user || !businessId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Verify user has access to this business
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Query all availability records for this business
    const availability = await prisma.employeeAvailability.findMany({
      where: {
        businessId
      },
      orderBy: [
        { employeePositionId: 'asc' },
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
            },
            position: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    logger.info('Admin fetched all employee availability', {
      businessId,
      userId: user.id,
      count: availability.length
    });

    res.json({ availability });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to fetch all employee availability', {
      operation: 'get_all_employee_availability',
      error: { message: err.message, stack: err.stack },
      businessId: req.businessId || (typeof req.query.businessId === 'string' ? req.query.businessId : undefined)
    });
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}

export async function updateEmployeeAvailabilityAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Availability management coming in Phase 2' });
}

export async function getAllShiftSwapRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ swaps: [] });
}

/**
 * PUT /api/scheduling/admin/swaps/:id/approve
 * Approve a shift swap request (Admin)
 */
export async function approveShiftSwapAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const { managerNotes } = req.body;

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Get the swap request
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
      include: {
        originalShift: {
          include: {
            employeePosition: true
          }
        }
      }
    });

    if (!swapRequest || swapRequest.businessId !== businessId) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    if (swapRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Swap request is not pending' });
      return;
    }

    // Update swap request status
    const updatedSwap = await prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
        approvedAt: new Date(),
        reason: managerNotes ? `${swapRequest.reason || ''}\n\nAdmin notes: ${managerNotes}` : swapRequest.reason
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

    // If a specific employee was requested, assign them to the shift
    if (swapRequest.requestedToId && swapRequest.originalShift.employeePositionId) {
      // Find the employee position for the requested user
      const requestedEmployeePosition = await prisma.employeePosition.findFirst({
        where: {
          userId: swapRequest.requestedToId,
          businessId,
          active: true
        }
      });

      if (requestedEmployeePosition) {
        // Get schedule status before updating shift
        const schedule = await prisma.schedule.findUnique({
          where: { id: swapRequest.originalShift.scheduleId },
          select: { status: true }
        });

                                                                                                                                                                            await prisma.scheduleShift.update({
          where: { id: swapRequest.originalShiftId },
          data: {
            employeePositionId: requestedEmployeePosition.id,
            status: 'FILLED'
          }
        });

        // Sync to calendar if schedule is published
        if (schedule?.status === 'PUBLISHED') {
          try {
            const { syncSingleShiftToCalendar } = await import('../../services/hrScheduleService');
            await syncSingleShiftToCalendar(swapRequest.originalShiftId, businessId);
          } catch (calendarError) {
            // Log but don't fail swap approval if calendar sync fails
            logger.warn('Failed to sync shift swap to calendar', {
              operation: 'approve_shift_swap_admin_calendar_sync',
              shiftId: swapRequest.originalShiftId,
              swapId,
              error: {
                message: calendarError instanceof Error ? calendarError.message : 'Unknown error',
                stack: calendarError instanceof Error ? calendarError.stack : undefined
              }
            });
          }
        }
      }
    }

    logger.info('Shift swap approved by admin', {
      operation: 'approve_shift_swap_admin',
      userId: user.id,
      businessId,
      swapId
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to approve shift swap', {
      operation: 'approve_shift_swap_admin',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to approve shift swap' });
  }
}

/**
 * PUT /api/scheduling/admin/swaps/:id/deny
 * Deny a shift swap request (Admin)
 */
export async function denyShiftSwapAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const { managerNotes } = req.body;

    if (!user || !businessId || !swapId) {
      res.status(401).json({ error: 'User not authenticated or missing required parameters' });
      return;
    }

    // Get the swap request
    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId }
    });

    if (!swapRequest || swapRequest.businessId !== businessId) {
      res.status(404).json({ error: 'Swap request not found' });
      return;
    }

    if (swapRequest.status !== 'PENDING') {
      res.status(400).json({ error: 'Swap request is not pending' });
      return;
    }

    // Update swap request status
    const updatedSwap = await prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: {
        status: 'DENIED',
        approvedById: user.id,
        approvedAt: new Date(),
        reason: managerNotes ? `${swapRequest.reason || ''}\n\nAdmin notes: ${managerNotes}` : swapRequest.reason
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

    logger.info('Shift swap denied by admin', {
      operation: 'deny_shift_swap_admin',
      userId: user.id,
      businessId,
      swapId
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to deny shift swap', {
      operation: 'deny_shift_swap_admin',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to deny shift swap' });
  }
}

