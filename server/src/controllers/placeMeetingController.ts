import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeVisibilityService from '../services/place/placeVisibilityService';
import * as placeMeetingService from '../services/place/placeMeetingService';

function logPlaceMeetingError(desc: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(desc, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}
function getUserId(req: Request): string | null {
  const user = getUserFromRequest(req);
  return user?.id ?? null;
}

// ============================================================================
// MEETING PLACES CRUD
// ============================================================================

/* <place-meeting-write-handlers> */

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

    const full = await placeMeetingService.createMeeting({
      userId,
      businessId,
      locationName,
      locationAddress,
      latitude,
      longitude,
      scheduledAt,
      duration,
      note,
      isPrivate,
      inviteeIds,
    });

    res.status(201).json({ success: true, data: full });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error creating meeting', 'place_meeting_create', err);
    res.status(500).json({ success: false, error: 'Failed to create meeting' });
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

    const updated = await placeMeetingService.updateMeeting({
      userId,
      meetingId,
      locationName,
      locationAddress,
      scheduledAt,
      duration,
      note,
      status,
      isPrivate,
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error updating meeting', 'place_meeting_update', err);
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
    await placeMeetingService.cancelMeeting({ userId, meetingId });

    res.json({ success: true, message: 'Meeting cancelled' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error deleting meeting', 'place_meeting_delete', err);
    res.status(500).json({ success: false, error: 'Failed to delete meeting' });
  }
}

/**
 * PUT /api/place/meetings/:meetingId/rsvp
 * Accept or decline a meeting invite
 */
export async function rsvpMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;
    const { status } = req.body;

    const updated = await placeMeetingService.rsvpMeeting({
      userId,
      meetingId,
      status,
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error in RSVP', 'place_meeting_rsvp', err);
    res.status(500).json({ success: false, error: 'Failed to RSVP' });
  }
}

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

    const result = await placeMeetingService.linkToCalendar({
      userId,
      meetingId,
      calendarId,
      existingEventId,
    });

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error linking to calendar', 'place_meeting_calendar_link', err);
    res.status(500).json({ success: false, error: 'Failed to link to calendar' });
  }
}

/* </place-meeting-write-handlers> */

/* <place-visibility-read-handlers> */

export async function getMeetings(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { status } = req.query;
    const meetings = await placeVisibilityService.listMeetingsForUser(
      userId,
      typeof status === 'string' ? status : undefined
    );

    res.json({ success: true, data: meetings });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error fetching meetings', 'place_meeting_list', err);
    res.status(500).json({ success: false, error: 'Failed to fetch meetings' });
  }
}

export async function getMeeting(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { meetingId } = req.params;
    const meeting = await placeVisibilityService.getMeetingIfAccessible(userId, meetingId);

    res.json({ success: true, data: meeting });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error fetching meeting', 'place_meeting_get', err);
    res.status(500).json({ success: false, error: 'Failed to fetch meeting' });
  }
}

/* </place-visibility-read-handlers> */

// ============================================================================
// LOCATION PRIVACY (Place-owned user settings — Phase 1E)
// ============================================================================

/* <place-meeting-privacy-handlers> */

export async function getLocationPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const privacy = await placeMeetingService.getLocationPrivacy(userId);
    res.json({ success: true, data: privacy });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error fetching location privacy', 'place_meeting_location_privacy_get', err);
    res.status(500).json({ success: false, error: 'Failed to fetch privacy settings' });
  }
}

export async function updateLocationPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { shareLocationWithConnections, showOnMeetingPlaces } = req.body;
    const privacy = await placeMeetingService.updateLocationPrivacy({
      userId,
      shareLocationWithConnections,
      showOnMeetingPlaces,
    });

    res.json({ success: true, data: privacy });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceMeetingError('Error updating location privacy', 'place_meeting_location_privacy_update', err);
    res.status(500).json({ success: false, error: 'Failed to update privacy settings' });
  }
}

/* </place-meeting-privacy-handlers> */
