import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import * as placePermission from '../place/placePermissionService';
import * as placeActivity from '../place/placeActivityService';
import * as placeDomain from '../place/placeDomainEventService';
import * as placeNotification from '../place/placeNotificationService';
import * as placeRealtime from '../place/placeRealtimeService';
import * as calendarEventService from '../calendarEventService';
import * as calendarVlinkAccess from '../calendarVlinkAccessService';
import {
  createMeeting,
  getLocationPrivacy,
  linkToCalendar,
  rsvpMeeting,
  updateLocationPrivacy,
  updateMeeting,
} from '../place/placeMeetingService';
import { PlaceServiceError } from '../place/placeErrors';
import { POLICY_ACTIONS } from '../../auth/policyActions';

describe('placeMeetingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingCreated').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingUpdated').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingRsvpUpdated').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingLinkedToCalendar').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordMeetingCreatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingUpdatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingRsvpUpdatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingLinkedToCalendarDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeNotification, 'notifyMeetingInvite').mockResolvedValue(undefined);
    vi.spyOn(placeNotification, 'notifyMeetingRsvp').mockResolvedValue(undefined);
    vi.spyOn(placeRealtime, 'broadcastMeetingInvite').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastMeetingRsvp').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastMeetingCreated').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastMeetingUpdated').mockImplementation(() => undefined);
  });

  it('creator can create meeting', async () => {
    vi.spyOn(placePermission, 'assertCanCreateMeeting').mockResolvedValue(undefined);
    vi.spyOn(prisma.placeMeetingPlace, 'create').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      locationName: 'Cafe',
      invites: [],
      creator: { id: 'u1', name: 'Alice' },
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      locationName: 'Cafe',
      invites: [],
      creator: { id: 'u1', name: 'Alice' },
    } as never);

    const meeting = await createMeeting({
      userId: 'u1',
      locationName: 'Cafe',
    });

    expect(meeting?.id).toBe('m1');
    expect(placeActivity.recordMeetingCreated).toHaveBeenCalled();
    expect(placeRealtime.broadcastMeetingCreated).toHaveBeenCalled();
  });

  it('non-participant denied update', async () => {
    vi.spyOn(placePermission, 'assertCanUpdateMeeting').mockRejectedValue(
      new PlaceServiceError('Only the creator can update this meeting', 'forbidden', 403)
    );

    await expect(
      updateMeeting({ userId: 'u2', meetingId: 'm1', locationName: 'New' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('invitees receive notification when implemented', async () => {
    vi.spyOn(placePermission, 'assertCanCreateMeeting').mockResolvedValue(undefined);
    vi.spyOn(prisma.placeMeetingPlace, 'create').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      locationName: 'Park',
      invites: [],
      creator: { id: 'u1', name: 'Alice' },
    } as never);
    vi.spyOn(prisma.placeMeetingInvite, 'createMany').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      locationName: 'Park',
      invites: [{ inviteeId: 'u2' }],
      creator: { id: 'u1', name: 'Alice' },
    } as never);

    await createMeeting({
      userId: 'u1',
      locationName: 'Park',
      inviteeIds: ['u2'],
    });

    expect(placeNotification.notifyMeetingInvite).toHaveBeenCalledWith(
      expect.objectContaining({ inviteeId: 'u2' })
    );
  });

  it('RSVP updates status', async () => {
    vi.spyOn(placePermission, 'assertCanRsvpMeeting').mockResolvedValue({ id: 'inv1' } as never);
    vi.spyOn(prisma.placeMeetingInvite, 'findUnique').mockResolvedValue({ id: 'inv1' } as never);
    vi.spyOn(prisma.placeMeetingInvite, 'update').mockResolvedValue({
      id: 'inv1',
      status: 'ACCEPTED',
    } as never);
    vi.spyOn(prisma.placeMeetingInvite, 'findMany').mockResolvedValue([
      { status: 'ACCEPTED' },
    ] as never);
    vi.spyOn(prisma.placeMeetingPlace, 'update').mockResolvedValue({ id: 'm1' } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      invites: [{ inviteeId: 'u2' }],
    } as never);

    const updated = await rsvpMeeting({
      userId: 'u2',
      meetingId: 'm1',
      status: 'ACCEPTED',
    });

    expect(updated.status).toBe('ACCEPTED');
    expect(placeActivity.recordMeetingRsvpUpdated).toHaveBeenCalled();
  });

  it('linkToCalendar calls calendarEventService, not prisma.event.create', async () => {
    vi.spyOn(placePermission, 'assertCanLinkMeetingToCalendar').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      invites: [],
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      locationName: 'Cafe',
      scheduledAt: new Date(),
      duration: 60,
      invites: [],
    } as never);
    vi.spyOn(calendarEventService, 'createEvent').mockResolvedValue({
      event: { id: 'evt-1' },
      calendar: { id: 'cal-1' },
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'update').mockResolvedValue({
      id: 'm1',
      eventId: 'evt-1',
      status: 'PROPOSED',
    } as never);

    const createSpy = vi.spyOn(prisma.event, 'create');

    const result = await linkToCalendar({
      userId: 'u1',
      meetingId: 'm1',
      calendarId: 'cal-1',
    });

    expect(calendarEventService.createEvent).toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
    expect(result.eventId).toBe('evt-1');
    expect(placeDomain.recordMeetingLinkedToCalendarDomainEvent).toHaveBeenCalled();
  });

  it('linkToCalendar existing event uses calendar access helper', async () => {
    vi.spyOn(placePermission, 'assertCanLinkMeetingToCalendar').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      invites: [],
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      creatorId: 'u1',
      invites: [],
    } as never);
    vi.spyOn(calendarVlinkAccess, 'userCanLinkCalendarEvent').mockResolvedValue(true);
    vi.spyOn(prisma.placeMeetingPlace, 'update').mockResolvedValue({
      id: 'm1',
      eventId: 'evt-existing',
      status: 'PROPOSED',
    } as never);

    const result = await linkToCalendar({
      userId: 'u1',
      meetingId: 'm1',
      existingEventId: 'evt-existing',
    });

    expect(calendarVlinkAccess.userCanLinkCalendarEvent).toHaveBeenCalledWith('u1', 'evt-existing');
    expect(result.eventId).toBe('evt-existing');
  });

  it('getLocationPrivacy enforces location privacy read policy', async () => {
    vi.spyOn(prisma.placeLocationPrivacy, 'findUnique').mockResolvedValue({
      userId: 'u1',
      shareLocationWithConnections: true,
      showOnMeetingPlaces: true,
    } as never);

    await getLocationPrivacy('u1');

    expect(placePolicyDual.assertPlacePolicyAllowed).toHaveBeenCalledWith({
      userId: 'u1',
      action: POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_READ,
      resourceType: 'place',
      resourceId: 'u1',
    });
  });

  it('updateLocationPrivacy enforces location privacy update policy', async () => {
    vi.spyOn(prisma.placeLocationPrivacy, 'upsert').mockResolvedValue({
      userId: 'u1',
      shareLocationWithConnections: false,
      showOnMeetingPlaces: true,
    } as never);

    await updateLocationPrivacy({
      userId: 'u1',
      shareLocationWithConnections: false,
    });

    expect(placePolicyDual.assertPlacePolicyAllowed).toHaveBeenCalledWith({
      userId: 'u1',
      action: POLICY_ACTIONS.PLACE_LOCATION_PRIVACY_UPDATE,
      resourceType: 'place',
      resourceId: 'u1',
    });
  });

  it('updateLocationPrivacy denies when policy blocks', async () => {
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockRejectedValue(
      new PlaceServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(
      updateLocationPrivacy({ userId: 'u1', showOnMeetingPlaces: false })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
