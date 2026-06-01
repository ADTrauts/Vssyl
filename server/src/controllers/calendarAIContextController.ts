/**
 * Calendar AI Context Provider Controller
 *
 * Thin HTTP adapter — context data is loaded via calendarVisibilityService.
 */

import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { CalendarServiceError } from '../services/calendar/calendarErrors';
import {
  getAvailabilityForAI,
  getTodayScheduleForAI,
  getUpcomingEventsForAI,
} from '../services/calendarVisibilityService';

function logCalendarAiCtxError(message: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

export async function getUpcomingEventsContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const context = await getUpcomingEventsForAI(userId);

    return res.json({
      success: true,
      context,
      metadata: {
        provider: 'calendar',
        endpoint: 'upcomingEvents',
        timestamp: new Date().toISOString(),
        dateRange: {
          from: now.toISOString(),
          to: sevenDaysFromNow.toISOString(),
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof CalendarServiceError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    logCalendarAiCtxError('Error in getUpcomingEventsContext', 'ai_ctx_calendar_upcoming', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events context',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getTodayScheduleContext(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const context = await getTodayScheduleForAI(userId);
    const now = new Date();

    return res.json({
      success: true,
      context,
      metadata: {
        provider: 'calendar',
        endpoint: 'todaySchedule',
        timestamp: now.toISOString(),
      },
    });
  } catch (error: unknown) {
    if (error instanceof CalendarServiceError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    logCalendarAiCtxError('Error in getTodayScheduleContext', 'ai_ctx_calendar_today', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today schedule context',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function checkAvailability(req: Request, res: Response) {
  try {
    const userId = getUserFromRequest(req)?.id;
    const { startTime, endTime } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime are required (ISO8601 format)',
      });
    }

    const availability = await getAvailabilityForAI(
      userId,
      String(startTime),
      String(endTime)
    );

    return res.json({
      success: true,
      ...availability,
      metadata: {
        provider: 'calendar',
        endpoint: 'availability',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    if (error instanceof CalendarServiceError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    logCalendarAiCtxError('Error in checkAvailability', 'ai_ctx_calendar_availability', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
