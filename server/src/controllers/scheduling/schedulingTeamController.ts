import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma, BusinessRole, SchedulingStrategy, JobFunction, StationType, ScheduleStatus, AttendanceRecordStatus } from '@prisma/client';
import { getRecommendedSchedulingConfig } from '../../services/schedulingRecommendationService';
import { SchedulingPhilosophyService } from '../../services/schedulingPhilosophyService';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId, TIME_FIELD_REGEX } from './schedulingShared';

// Manager Functions
/**
 * GET /api/scheduling/team/schedules
 * Returns schedules for the manager's team
 * For ADMIN users: returns all schedules (same as admin endpoint)
 * For MANAGER users: returns schedules with shifts assigned to their direct reports
 */
export async function getTeamSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const directReportIds = req.directReportIds || [];

    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is ADMIN or has canManage permission
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
      select: { role: true, canManage: true },
    });

    const isAdmin = member?.role === BusinessRole.ADMIN || member?.canManage === true;

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

    // For ADMIN users: return all schedules (same as admin endpoint)
    // For MANAGER users: filter schedules that have shifts assigned to their direct reports
    if (!isAdmin && directReportIds.length > 0) {
      // Filter schedules that have at least one shift assigned to a direct report
      where.shifts = {
        some: {
          employeePositionId: {
            in: directReportIds
          }
        }
      };
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
    logger.info('Team schedules retrieved', {
      operation: 'get_team_schedules',
      userId: user.id,
      businessId,
      directReportCount: directReportIds.length,
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
    logger.error('Failed to get team schedules', {
      operation: 'get_team_schedules',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve team schedules' });
  }
}

export async function publishTeamSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Manager features coming in Phase 2' });
}

export async function getOpenShiftsForTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Open shifts coming in Phase 2' });
}

export async function assignEmployeeToShift(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Manager features coming in Phase 2' });
}

export async function getTeamAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(501).json({ error: 'Not yet implemented - Manager features coming in Phase 2' });
}

/**
 * GET /api/scheduling/team/swaps/pending
 * Get pending shift swap requests for manager's team
 */
export async function getPendingShiftSwapRequestsForTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const directReportIds = req.directReportIds || [];

    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user is ADMIN or has canManage permission
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
      select: { role: true, canManage: true },
    });

    const isAdmin = member?.role === BusinessRole.ADMIN || member?.canManage === true;

    // Build where clause
    const where: Prisma.ShiftSwapRequestWhereInput = {
      businessId,
      status: 'PENDING'
    };

    // If not admin, filter by direct reports
    if (!isAdmin && directReportIds.length > 0) {
      where.OR = [
        {
          originalShift: {
            employeePositionId: {
              in: directReportIds
            }
          }
        },
        {
          requestedToId: {
            in: directReportIds
          }
        }
      ];
    }

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

    logger.info('Pending swap requests retrieved for team', {
      operation: 'get_pending_swap_requests_team',
      userId: user.id,
      businessId,
      swapCount: swaps.length
    });

    res.json({ swaps });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get pending swap requests for team', {
      operation: 'get_pending_swap_requests_team',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to retrieve pending swap requests' });
  }
}

/**
 * PUT /api/scheduling/team/swaps/:id/approve
 * Approve a shift swap request (Manager)
 */
export async function approveShiftSwapManager(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        reason: managerNotes ? `${swapRequest.reason || ''}\n\nManager notes: ${managerNotes}` : swapRequest.reason
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
              operation: 'approve_shift_swap_manager_calendar_sync',
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

    logger.info('Shift swap approved by manager', {
      operation: 'approve_shift_swap_manager',
      userId: user.id,
      businessId,
      swapId
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to approve shift swap', {
      operation: 'approve_shift_swap_manager',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to approve shift swap' });
  }
}

/**
 * PUT /api/scheduling/team/swaps/:id/deny
 * Deny a shift swap request (Manager)
 */
export async function denyShiftSwapManager(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        reason: managerNotes ? `${swapRequest.reason || ''}\n\nManager notes: ${managerNotes}` : swapRequest.reason
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

    logger.info('Shift swap denied by manager', {
      operation: 'deny_shift_swap_manager',
      userId: user.id,
      businessId,
      swapId
    });

    res.json(updatedSwap);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to deny shift swap', {
      operation: 'deny_shift_swap_manager',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ error: 'Failed to deny shift swap' });
  }
}

