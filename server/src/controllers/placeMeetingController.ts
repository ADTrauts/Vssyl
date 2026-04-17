import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

/**
 * User must be allowed to see/use the event's calendar (member row, or owner of a personal calendar).
 */
async function assertUserCanAccessCalendarEvent(
  userId: string,
  eventId: string
): Promise<{ ok: true } | { ok: false; status: 404 | 403; message: string }> {
  const ev = await prisma.event.findFirst({
    where: { id: eventId, trashedAt: null },
    select: { calendarId: true },
  });
  if (!ev) {
    return { ok: false, status: 404, message: 'Event not found' };
  }

  const calendar = await prisma.calendar.findUnique({
    where: { id: ev.calendarId },
    select: { contextType: true, contextId: true },
  });
  if (!calendar) {
    return { ok: false, status: 404, message: 'Calendar not found' };
  }

  const personalOwner =
    calendar.contextType === 'PERSONAL' && calendar.contextId === userId;

  if (personalOwner) {
    return { ok: true };
  }

  const member = await prisma.calendarMember.findFirst({
    where: { calendarId: ev.calendarId, userId },
  });
  if (!member) {
    return { ok: false, status: 403, message: 'No access to this calendar event' };
  }

  return { ok: true };
}

// ============================================================================
// MEETING PLACES CRUD
// ============================================================================

/**
 * POST /api/place/meetings
 * Create a new meeting place and optionally invite connections
 */
export async function createMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, locationName, locationAddress, latitude, longitude, scheduledAt, duration, note, isPrivate, inviteeIds } = req.body;

    if (!locationName || typeof locationName !== 'string') {
      res.status(400).json({ success: false, error: 'locationName is required' });
      return;
    }

    const meeting = await prisma.placeMeetingPlace.create({
      data: {
        creatorId: userId,
        businessId: businessId || null,
        locationName,
        locationAddress: locationAddress || null,
        latitude: latitude || null,
        longitude: longitude || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration: duration || null,
        note: note || null,
        isPrivate: isPrivate ?? true,
      },
      include: { invites: { include: { invitee: { select: { id: true, name: true } } } } },
    });

    // Invite connections if provided
    if (Array.isArray(inviteeIds) && inviteeIds.length > 0) {
      const inviteData = inviteeIds
        .filter((id: string) => id !== userId)
        .map((inviteeId: string) => ({
          meetingPlaceId: meeting.id,
          inviteeId,
        }));

      if (inviteData.length > 0) {
        await prisma.placeMeetingInvite.createMany({ data: inviteData });

        // Notify each invitee via WebSocket
        try {
          const socketService = getChatSocketService();
          for (const invite of inviteData) {
            socketService.broadcastPlaceEvent(invite.inviteeId, 'place:connection:request', {
              type: 'meeting_invite',
              meetingId: meeting.id,
              locationName,
              creatorId: userId,
            });
          }
        } catch { /* socket not initialized */ }
      }
    }

    // Re-fetch with invites
    const full = await prisma.placeMeetingPlace.findUnique({
      where: { id: meeting.id },
      include: {
        invites: { include: { invitee: { select: { id: true, name: true, email: true } } } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: full });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating meeting:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create meeting' });
  }
}

/**
 * GET /api/place/meetings
 * Get all meetings the user created or was invited to
 */
export async function getMeetings(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { status } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { creatorId: userId },
        { invites: { some: { inviteeId: userId } } },
      ],
    };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const meetings = await prisma.placeMeetingPlace.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        invites: {
          include: { invitee: { select: { id: true, name: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ success: true, data: meetings });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching meetings:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch meetings' });
  }
}

/**
 * GET /api/place/meetings/:meetingId
 * Get single meeting detail
 */
export async function getMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;

    const meeting = await prisma.placeMeetingPlace.findUnique({
      where: { id: meetingId },
      include: {
        creator: { select: { id: true, name: true } },
        invites: {
          include: { invitee: { select: { id: true, name: true } } },
        },
      },
    });

    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    // Access check: creator or invitee
    const isParticipant = meeting.creatorId === userId || meeting.invites.some(i => i.inviteeId === userId);
    if (!isParticipant) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({ success: true, data: meeting });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching meeting:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch meeting' });
  }
}

/**
 * PUT /api/place/meetings/:meetingId
 * Update meeting details (creator only)
 */
export async function updateMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;
    const { locationName, locationAddress, scheduledAt, duration, note, status, isPrivate } = req.body;

    const meeting = await prisma.placeMeetingPlace.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.creatorId !== userId) {
      res.status(403).json({ success: false, error: 'Only the creator can update this meeting' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (locationName !== undefined) data.locationName = locationName;
    if (locationAddress !== undefined) data.locationAddress = locationAddress;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (duration !== undefined) data.duration = duration;
    if (note !== undefined) data.note = note;
    if (status !== undefined) data.status = status;
    if (isPrivate !== undefined) data.isPrivate = isPrivate;

    const updated = await prisma.placeMeetingPlace.update({
      where: { id: meetingId },
      data,
      include: {
        creator: { select: { id: true, name: true } },
        invites: { include: { invitee: { select: { id: true, name: true } } } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating meeting:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update meeting' });
  }
}

/**
 * DELETE /api/place/meetings/:meetingId
 * Cancel/delete a meeting (creator only)
 */
export async function deleteMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;

    const meeting = await prisma.placeMeetingPlace.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.creatorId !== userId) {
      res.status(403).json({ success: false, error: 'Only the creator can delete this meeting' });
      return;
    }

    await prisma.placeMeetingPlace.update({
      where: { id: meetingId },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, message: 'Meeting cancelled' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting meeting:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete meeting' });
  }
}

// ============================================================================
// RSVP
// ============================================================================

/**
 * PUT /api/place/meetings/:meetingId/rsvp
 * Accept or decline a meeting invite
 */
export async function rsvpMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;
    const { status } = req.body; // 'ACCEPTED' | 'DECLINED'

    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      res.status(400).json({ success: false, error: 'status must be ACCEPTED or DECLINED' });
      return;
    }

    const invite = await prisma.placeMeetingInvite.findUnique({
      where: { meetingPlaceId_inviteeId: { meetingPlaceId: meetingId, inviteeId: userId } },
    });

    if (!invite) {
      res.status(404).json({ success: false, error: 'Invite not found' });
      return;
    }

    const updated = await prisma.placeMeetingInvite.update({
      where: { id: invite.id },
      data: { status, respondedAt: new Date() },
    });

    // If all invites accepted/declined, potentially update meeting status
    const allInvites = await prisma.placeMeetingInvite.findMany({ where: { meetingPlaceId: meetingId } });
    const allResponded = allInvites.every(i => i.status !== 'PENDING');
    const anyAccepted = allInvites.some(i => i.status === 'ACCEPTED');

    if (allResponded && anyAccepted) {
      await prisma.placeMeetingPlace.update({
        where: { id: meetingId },
        data: { status: 'CONFIRMED' },
      });
    }

    // Notify creator
    try {
      const meeting = await prisma.placeMeetingPlace.findUnique({ where: { id: meetingId } });
      if (meeting) {
        getChatSocketService().broadcastPlaceEvent(meeting.creatorId, 'place:connection:accepted', {
          type: 'meeting_rsvp',
          meetingId,
          inviteeId: userId,
          rsvpStatus: status,
        });
      }
    } catch { /* socket not initialized */ }

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in RSVP:', err.message);
    res.status(500).json({ success: false, error: 'Failed to RSVP' });
  }
}

// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

/**
 * POST /api/place/meetings/:meetingId/calendar
 * Link a meeting place to a calendar event (creates one if needed)
 */
export async function linkToCalendar(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;
    const { calendarId, existingEventId } = req.body;

    if (existingEventId !== undefined && existingEventId !== null) {
      if (typeof existingEventId !== 'string' || existingEventId.trim() === '') {
        res.status(400).json({ success: false, error: 'existingEventId must be a non-empty string when provided' });
        return;
      }
    }

    const meeting = await prisma.placeMeetingPlace.findUnique({
      where: { id: meetingId },
      include: { invites: { include: { invitee: { select: { id: true, email: true } } } } },
    });

    if (!meeting) {
      res.status(404).json({ success: false, error: 'Meeting not found' });
      return;
    }

    const isParticipant = meeting.creatorId === userId || meeting.invites.some(i => i.inviteeId === userId);
    if (!isParticipant) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    let eventId: string | undefined =
      typeof existingEventId === 'string' && existingEventId.trim() !== '' ? existingEventId : undefined;

    // If linking to an existing event, require the same calendar access as for new-event creation
    if (eventId) {
      const access = await assertUserCanAccessCalendarEvent(userId, eventId);
      if (!access.ok) {
        res.status(access.status).json({ success: false, error: access.message });
        return;
      }
    }

    // If no existing event, create one
    if (!eventId) {
      if (!calendarId) {
        res.status(400).json({ success: false, error: 'calendarId is required to create a new event' });
        return;
      }

      // Verify calendar access
      const calendarMember = await prisma.calendarMember.findFirst({
        where: { calendarId, userId, role: { in: ['OWNER', 'ADMIN', 'EDITOR'] } },
      });
      if (!calendarMember) {
        res.status(403).json({ success: false, error: 'No write access to this calendar' });
        return;
      }

      const startAt = meeting.scheduledAt || new Date();
      const endAt = new Date(startAt.getTime() + (meeting.duration || 60) * 60 * 1000);

      const event = await prisma.event.create({
        data: {
          calendarId,
          title: `Meeting at ${meeting.locationName}`,
          description: meeting.note || undefined,
          location: meeting.locationAddress || meeting.locationName,
          startAt,
          endAt,
          timezone: 'UTC',
          createdById: userId,
        },
      });

      eventId = event.id;
    }

    // Link meeting to event
    const updated = await prisma.placeMeetingPlace.update({
      where: { id: meetingId },
      data: { eventId },
    });

    res.json({ success: true, data: { meetingId: updated.id, eventId } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error linking to calendar:', err.message);
    res.status(500).json({ success: false, error: 'Failed to link to calendar' });
  }
}

// ============================================================================
// LOCATION PRIVACY
// ============================================================================

/**
 * GET /api/place/location-privacy
 * Get user's location privacy preferences
 */
export async function getLocationPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    let privacy = await prisma.placeLocationPrivacy.findUnique({ where: { userId } });

    if (!privacy) {
      privacy = await prisma.placeLocationPrivacy.create({
        data: { userId },
      });
    }

    res.json({ success: true, data: privacy });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching location privacy:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch privacy settings' });
  }
}

/**
 * PUT /api/place/location-privacy
 * Update location privacy preferences
 */
export async function updateLocationPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { shareLocationWithConnections, showOnMeetingPlaces } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (typeof shareLocationWithConnections === 'boolean') data.shareLocationWithConnections = shareLocationWithConnections;
    if (typeof showOnMeetingPlaces === 'boolean') data.showOnMeetingPlaces = showOnMeetingPlaces;

    const privacy = await prisma.placeLocationPrivacy.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    res.json({ success: true, data: privacy });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating location privacy:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update privacy settings' });
  }
}
