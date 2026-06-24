import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as emitters from '../../events/domainEventEmitters';
import * as moduleActivity from '../moduleActivityService';
import { NotificationService } from '../notificationService';
import * as chatSocket from '../chatSocketService';
import { recordListingUpdated, recordMeetingCreated } from '../place/placeActivityService';
import {
  recordListingUpdatedDomainEvent,
  recordMeetingCreatedDomainEvent,
} from '../place/placeDomainEventService';
import { notifyMeetingInvite } from '../place/placeNotificationService';
import { broadcastMeetingCreated } from '../place/placeRealtimeService';

describe('place adapters (Phase 1D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('activity emits on listing/meeting success', async () => {
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');

    await recordListingUpdated({
      actorUserId: 'u1',
      listingId: 'l1',
      businessId: 'biz-1',
    });
    await recordMeetingCreated({
      actorUserId: 'u1',
      meetingId: 'm1',
      locationName: 'Cafe',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledTimes(2);
  });

  it('domain events emitted on success', () => {
    const listingSpy = vi
      .spyOn(emitters, 'emitPlaceListingUpdatedEvent')
      .mockReturnValue({ id: 'e1' } as never);
    const meetingSpy = vi
      .spyOn(emitters, 'emitPlaceMeetingCreatedEvent')
      .mockReturnValue({ id: 'e2' } as never);

    recordListingUpdatedDomainEvent({
      actorUserId: 'u1',
      listingId: 'l1',
      businessId: 'biz-1',
    });
    recordMeetingCreatedDomainEvent({
      actorUserId: 'u1',
      meetingId: 'm1',
      locationName: 'Cafe',
    });

    expect(listingSpy).toHaveBeenCalled();
    expect(meetingSpy).toHaveBeenCalled();
  });

  it('notification self-suppression skips actor', async () => {
    const createSpy = vi
      .spyOn(NotificationService, 'createNotification')
      .mockResolvedValue(undefined as never);

    await notifyMeetingInvite({
      actorUserId: 'u1',
      inviteeId: 'u1',
      meetingId: 'm1',
      locationName: 'Cafe',
    });

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('realtime adapter called after meeting writes', () => {
    const broadcast = vi.fn();
    vi.spyOn(chatSocket, 'getChatSocketService').mockReturnValue({
      broadcastPlaceEvent: broadcast,
    } as never);

    broadcastMeetingCreated(['u1', 'u2'], {
      meetingId: 'm1',
      locationName: 'Cafe',
      creatorId: 'u1',
    });

    expect(broadcast).toHaveBeenCalledTimes(2);
  });
});
