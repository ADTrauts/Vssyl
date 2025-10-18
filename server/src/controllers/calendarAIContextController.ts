/**
 * Calendar AI Context Provider Controller
 * 
 * Provides context data about a user's Calendar/Events to the AI system.
 * These endpoints are called by the CrossModuleContextEngine when processing AI queries.
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/calendar/ai/context/upcoming
 * 
 * Returns upcoming events for AI context
 * Used by AI to understand what's on the user's schedule
 */
export async function getUpcomingEventsContext(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user's calendars first
    const userCalendars = await prisma.calendar.findMany({
      where: { 
        contextType: 'PERSONAL',
        contextId: userId 
      },
      select: { id: true }
    });
    
    const calendarIds = userCalendars.map((c: Record<string, any>) => c.id);
    
    // Get events for the next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingEvents = await prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        startAt: {
          gte: now,
          lte: sevenDaysFromNow
        },
        status: { not: 'CANCELED' }
      },
      orderBy: {
        startAt: 'asc'
      },
      take: 20
    });
    
    // Group events by day
    const eventsByDay = new Map<string, any[]>();
    upcomingEvents.forEach((event: Record<string, any>) => {
      const dayKey = event.startAt.toISOString().split('T')[0];
      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, []);
      }
      eventsByDay.get(dayKey)!.push(event);
    });
    
    // Format for AI consumption
    const context = {
      upcomingEvents: upcomingEvents.map((event: Record<string, any>) => ({
        id: event.id,
        title: event.title,
        description: event.description || null,
        startTime: event.startAt.toISOString(),
        endTime: event.endAt.toISOString(),
        location: event.location || null,
        isAllDay: event.allDay,
        daysUntil: Math.floor((event.startAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      })),
      summary: {
        totalUpcomingEvents: upcomingEvents.length,
        nextEventTitle: upcomingEvents[0]?.title,
        nextEventTime: upcomingEvents[0]?.startAt.toISOString(),
        busyDays: eventsByDay.size,
        hasEventsToday: Array.from(eventsByDay.keys()).includes(now.toISOString().split('T')[0]),
        weekSummary: Array.from(eventsByDay.entries()).map(([date, events]) => ({
          date,
          eventCount: events.length,
          summary: `${events.length} event${events.length > 1 ? 's' : ''}`
        }))
      }
    };
    
    res.json({
      success: true,
      context,
      metadata: {
        provider: 'calendar',
        endpoint: 'upcomingEvents',
        timestamp: new Date().toISOString(),
        dateRange: {
          from: now.toISOString(),
          to: sevenDaysFromNow.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getUpcomingEventsContext:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch upcoming events context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/calendar/ai/context/today
 * 
 * Returns today's complete schedule for AI context
 * Used by AI to answer "what's on my schedule today"
 */
export async function getTodayScheduleContext(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user's calendars first
    const userCalendars = await prisma.calendar.findMany({
      where: { 
        contextType: 'PERSONAL',
        contextId: userId 
      },
      select: { id: true }
    });
    
    const calendarIds = userCalendars.map((c: Record<string, any>) => c.id);
    
    // Get today's date range (midnight to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysEvents = await prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        OR: [
          {
            // Regular timed events
            startAt: {
              gte: today,
              lt: tomorrow
            }
          },
          {
            // All-day events
            allDay: true,
            startAt: {
              gte: today,
              lt: tomorrow
            }
          }
        ],
        status: { not: 'CANCELED' }
      },
      orderBy: [
        { allDay: 'desc' }, // All-day events first
        { startAt: 'asc' }
      ]
    });
    
    // Calculate free time blocks
    const timedEvents = todaysEvents
      .filter((e: Record<string, any>) => !e.allDay)
      .sort((a: Record<string, any>, b: Record<string, any>) => (a.startAt as Date).getTime() - (b.startAt as Date).getTime());
    
    const now = new Date();
    const currentOrNextEvent = timedEvents.find((e: Record<string, any>) => (e.endAt as Date) > now);
    
    // Format for AI consumption
    const context = {
      todaySchedule: {
        date: today.toISOString().split('T')[0],
        events: todaysEvents.map((event: Record<string, any>) => ({
          id: event.id,
          title: event.title,
          startTime: event.startAt.toISOString(),
          endTime: event.endAt.toISOString(),
          duration: Math.round((event.endAt.getTime() - event.startAt.getTime()) / (1000 * 60)), // minutes
          location: event.location || null,
          isAllDay: event.allDay,
          status: event.endAt < now ? 'completed' : 
                  event.startAt <= now && event.endAt > now ? 'in-progress' : 
                  'upcoming'
        })),
        allDayEvents: todaysEvents.filter((e: Record<string, any>) => e.allDay).map((e: Record<string, any>) => e.title)
      },
      summary: {
        totalEvents: todaysEvents.length,
        timedEvents: timedEvents.length,
        allDayEvents: todaysEvents.filter((e: Record<string, any>) => e.allDay).length,
        currentEvent: currentOrNextEvent && currentOrNextEvent.startAt <= now ? {
          title: currentOrNextEvent.title,
          endsAt: currentOrNextEvent.endAt.toISOString()
        } : null,
        nextEvent: currentOrNextEvent && currentOrNextEvent.startAt > now ? {
          title: currentOrNextEvent.title,
          startsAt: currentOrNextEvent.startAt.toISOString(),
          minutesUntil: Math.round((currentOrNextEvent.startAt.getTime() - now.getTime()) / (1000 * 60))
        } : null,
        dayStatus: todaysEvents.length === 0 ? 'free' : 
                   todaysEvents.length > 5 ? 'very-busy' :
                   todaysEvents.length > 2 ? 'busy' : 'light'
      }
    };
    
    res.json({
      success: true,
      context,
      metadata: {
        provider: 'calendar',
        endpoint: 'todaySchedule',
        timestamp: now.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in getTodayScheduleContext:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch today schedule context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/calendar/ai/query/availability
 * 
 * Queryable endpoint for checking availability
 * Supports dynamic queries from the AI system
 */
export async function checkAvailability(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { startTime, endTime } = req.query;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'startTime and endTime are required (ISO8601 format)' 
      });
    }
    
    const start = new Date(startTime as string);
    const end = new Date(endTime as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Use ISO8601 format' 
      });
    }
    
    // Get user's calendars first
    const userCalendars = await prisma.calendar.findMany({
      where: { 
        contextType: 'PERSONAL',
        contextId: userId 
      },
      select: { id: true }
    });
    
    const calendarIds = userCalendars.map((c: Record<string, any>) => c.id);
    
    // Check for conflicting events
    const conflictingEvents = await prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        status: { not: 'CANCELED' },
        OR: [
          {
            // Event starts during the requested time
            startAt: {
              gte: start,
              lt: end
            }
          },
          {
            // Event ends during the requested time
            endAt: {
              gt: start,
              lte: end
            }
          },
          {
            // Event spans the entire requested time
            AND: [
              { startAt: { lte: start } },
              { endAt: { gte: end } }
            ]
          }
        ]
      },
      orderBy: {
        startAt: 'asc'
      }
    });
    
    const isAvailable = conflictingEvents.length === 0;
    
    res.json({
      success: true,
      available: isAvailable,
      conflicts: conflictingEvents.map((event: Record<string, any>) => ({
        id: event.id,
        title: event.title,
        startTime: event.startAt.toISOString(),
        endTime: event.endAt.toISOString()
      })),
      requestedTimeSlot: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
      },
      metadata: {
        provider: 'calendar',
        endpoint: 'availability',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in checkAvailability:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

