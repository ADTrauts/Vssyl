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
// AI CONTEXT PROVIDERS
// ============================================================================

/**
 * GET /api/scheduling/ai/context/overview
 * 
 * Returns scheduling system overview and statistics
 * Used by AI to understand overall scheduling metrics and status
 */
export async function getSchedulingOverviewForAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }

    // Verify access
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Get schedule stats
    const [
      totalSchedules,
      publishedSchedules,
      draftSchedules,
      upcomingSchedules,
      totalShifts,
      openShifts,
      pendingSwaps
    ] = await Promise.all([
      prisma.schedule.count({
        where: { businessId }
      }),
      prisma.schedule.count({
        where: { 
          businessId,
          status: 'PUBLISHED'
        }
      }),
      prisma.schedule.count({
        where: { 
          businessId,
          status: 'DRAFT'
        }
      }),
      prisma.schedule.findMany({
        where: {
          businessId,
          status: 'PUBLISHED',
          startDate: { lte: sevenDaysFromNow },
          endDate: { gte: today }
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          _count: {
            select: {
              shifts: true
            }
          }
        },
        take: 5
      }),
      prisma.scheduleShift.count({
        where: {
          businessId,
          startTime: { gte: today }
        }
      }),
      prisma.scheduleShift.count({
        where: {
          businessId,
          status: 'OPEN',
          startTime: { gte: today }
        }
      }),
      prisma.shiftSwapRequest.count({
        where: {
          businessId,
          status: 'PENDING'
        }
      })
    ]);

    const context = {
      schedules: {
        total: totalSchedules,
        published: publishedSchedules,
        draft: draftSchedules,
        upcoming: upcomingSchedules.map(s => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate.toISOString().split('T')[0],
          endDate: s.endDate.toISOString().split('T')[0],
          shiftCount: s._count.shifts
        }))
      },
      shifts: {
        totalUpcoming: totalShifts,
        open: openShifts,
        assigned: totalShifts - openShifts,
        fillRate: totalShifts > 0 ? Math.round((totalShifts - openShifts) / totalShifts * 100) : 100
      },
      swaps: {
        pending: pendingSwaps
      },
      summary: {
        activeSchedules: publishedSchedules,
        needsAttention: draftSchedules > 0 || openShifts > 0 || pendingSwaps > 0,
        status: openShifts === 0 && pendingSwaps === 0 ? 'good' : 
                openShifts > 10 || pendingSwaps > 5 ? 'needs-attention' : 'normal'
      }
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'scheduling',
        endpoint: 'overview',
        businessId,
        timestamp: now.toISOString()
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to get scheduling overview for AI', {
      operation: 'get_scheduling_overview_ai',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch scheduling overview',
      error: err.message
    });
  }
}

/**
 * GET /api/scheduling/ai/context/coverage
 * 
 * Returns current and upcoming coverage status
 * Used by AI to answer "coverage" and "who's working" questions
 */
export async function getCoverageStatusForAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }

    // Verify access
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Get shifts for today and upcoming week
    const [
      todayShifts,
      tomorrowShifts,
      weekShifts
    ] = await Promise.all([
      prisma.scheduleShift.findMany({
        where: {
          businessId,
          startTime: { gte: today, lt: tomorrow }
        },
        include: {
          employeePosition: {
            include: {
              user: {
                select: {
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
        }
      }),
      prisma.scheduleShift.findMany({
        where: {
          businessId,
          startTime: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 86400000) }
        },
        include: {
          employeePosition: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.scheduleShift.findMany({
        where: {
          businessId,
          startTime: { gte: today, lt: nextWeek }
        },
        select: {
          startTime: true,
          status: true
        }
      })
    ]);

    // Group week shifts by day
    const shiftsByDay = new Map<string, { total: number; open: number }>();
    weekShifts.forEach(shift => {
      const dateStr = shift.startTime.toISOString().split('T')[0];
      if (!shiftsByDay.has(dateStr)) {
        shiftsByDay.set(dateStr, { total: 0, open: 0 });
      }
      const day = shiftsByDay.get(dateStr)!;
      day.total++;
      if (shift.status === 'OPEN') day.open++;
    });

    const context = {
      today: {
        date: today.toISOString().split('T')[0],
        totalShifts: todayShifts.length,
        openShifts: todayShifts.filter(s => s.status === 'OPEN').length,
        assignedShifts: todayShifts.filter(s => s.status !== 'OPEN').length,
        workingEmployees: todayShifts
          .filter(s => s.employeePosition)
          .map(s => ({
            name: s.employeePosition?.user?.name || 'Unknown',
            position: s.employeePosition?.position?.title || 'Unknown',
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString()
          })),
        coverageRate: todayShifts.length > 0 ? 
          Math.round((todayShifts.filter(s => s.status !== 'OPEN').length / todayShifts.length) * 100) : 100
      },
      tomorrow: {
        date: tomorrow.toISOString().split('T')[0],
        totalShifts: tomorrowShifts.length,
        openShifts: tomorrowShifts.filter(s => s.status === 'OPEN').length,
        assignedShifts: tomorrowShifts.filter(s => s.status !== 'OPEN').length,
        coverageRate: tomorrowShifts.length > 0 ? 
          Math.round((tomorrowShifts.filter(s => s.status !== 'OPEN').length / tomorrowShifts.length) * 100) : 100
      },
      thisWeek: {
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        totalShifts: weekShifts.length,
        openShifts: weekShifts.filter(s => s.status === 'OPEN').length,
        byDay: Array.from(shiftsByDay.entries()).map(([date, stats]) => ({
          date,
          totalShifts: stats.total,
          openShifts: stats.open,
          coverageRate: stats.total > 0 ? Math.round(((stats.total - stats.open) / stats.total) * 100) : 100
        }))
      },
      summary: {
        currentCoverage: todayShifts.length > 0 ? 
          Math.round((todayShifts.filter(s => s.status !== 'OPEN').length / todayShifts.length) * 100) : 100,
        status: todayShifts.filter(s => s.status === 'OPEN').length === 0 ? 'fully-covered' : 
                todayShifts.filter(s => s.status === 'OPEN').length > 5 ? 'critical' : 'some-gaps'
      }
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'scheduling',
        endpoint: 'coverage',
        businessId,
        timestamp: now.toISOString()
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to get coverage status for AI', {
      operation: 'get_coverage_status_ai',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch coverage status',
      error: err.message
    });
  }
}

/**
 * GET /api/scheduling/ai/context/conflicts
 * 
 * Returns scheduling conflicts and gaps
 * Used by AI to identify problems and suggest solutions
 */
export async function getSchedulingConflictsForAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { businessId } = req.query;
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }

    // Verify access
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Get upcoming shifts (next 14 days)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const [
      openShifts,
      pendingSwaps,
      upcomingShifts
    ] = await Promise.all([
      prisma.scheduleShift.findMany({
        where: {
          businessId,
          status: 'OPEN',
          startTime: { gte: today, lt: twoWeeksFromNow }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          schedule: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        take: 20
      }),
      prisma.shiftSwapRequest.findMany({
        where: {
          businessId,
          status: 'PENDING'
        },
        include: {
          originalShift: {
            select: {
              startTime: true,
              endTime: true
            }
          },
          requestedBy: {
            select: {
              name: true
            }
          }
        },
        take: 10
      }),
      prisma.scheduleShift.findMany({
        where: {
          businessId,
          startTime: { gte: today, lt: twoWeeksFromNow }
        },
        select: {
          employeePositionId: true,
          startTime: true,
          endTime: true
        }
      })
    ]);

    // Detect overlapping shifts (same employee, overlapping times)
    const shiftsByEmployee = new Map<string, typeof upcomingShifts>();
    upcomingShifts.forEach(shift => {
      if (shift.employeePositionId) {
        if (!shiftsByEmployee.has(shift.employeePositionId)) {
          shiftsByEmployee.set(shift.employeePositionId, []);
        }
        shiftsByEmployee.get(shift.employeePositionId)!.push(shift);
      }
    });

    interface OverlappingShift {
      employeePositionId: string;
      shift1: { startTime: string; endTime: string };
      shift2: { startTime: string; endTime: string };
    }

    const overlappingShifts: OverlappingShift[] = [];
    shiftsByEmployee.forEach((shifts, employeeId) => {
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1 = shifts[i];
          const shift2 = shifts[j];
          
          if (shift1.startTime < shift2.endTime && shift2.startTime < shift1.endTime) {
            overlappingShifts.push({
              employeePositionId: employeeId,
              shift1: {
                startTime: shift1.startTime.toISOString(),
                endTime: shift1.endTime.toISOString()
              },
              shift2: {
                startTime: shift2.startTime.toISOString(),
                endTime: shift2.endTime.toISOString()
              }
            });
          }
        }
      }
    });

    const context = {
      openShifts: {
        count: openShifts.length,
        shifts: openShifts.map(shift => ({
          id: shift.id,
          scheduleName: shift.schedule?.name || 'Unknown',
          startTime: shift.startTime.toISOString(),
          endTime: shift.endTime.toISOString(),
          daysUntil: Math.floor((shift.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }))
      },
      pendingSwaps: {
        count: pendingSwaps.length,
        requests: pendingSwaps.map(swap => ({
          requestedBy: swap.requestedBy?.name || 'Unknown',
          shiftDate: swap.originalShift.startTime.toISOString().split('T')[0],
          shiftTime: `${swap.originalShift.startTime.toISOString().split('T')[1].substring(0, 5)} - ${swap.originalShift.endTime.toISOString().split('T')[1].substring(0, 5)}`,
          status: swap.status
        }))
      },
      conflicts: {
        overlappingShifts: {
          count: overlappingShifts.length,
          details: overlappingShifts.slice(0, 5) // Top 5 conflicts
        }
      },
      summary: {
        totalIssues: openShifts.length + pendingSwaps.length + overlappingShifts.length,
        criticalIssues: overlappingShifts.length,
        requiresAction: openShifts.length > 0 || pendingSwaps.length > 0,
        status: overlappingShifts.length > 0 ? 'has-conflicts' : 
                openShifts.length > 10 ? 'many-gaps' :
                openShifts.length > 0 ? 'some-gaps' : 'all-good'
      }
    };

    res.json({
      success: true,
      context,
      metadata: {
        provider: 'scheduling',
        endpoint: 'conflicts',
        businessId,
        timestamp: now.toISOString()
      }
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to get scheduling conflicts for AI', {
      operation: 'get_scheduling_conflicts_ai',
      error: { message: err.message, stack: err.stack }
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch scheduling conflicts',
      error: err.message
    });
  }
}

