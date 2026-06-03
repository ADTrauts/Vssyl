import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { POLICY_ACTIONS } from '../../../auth/policyActions';
import * as placeActivity from '../placeActivityService';
import * as placeDomain from '../placeDomainEventService';
import * as placePolicyDual from '../placePolicyDual';
import * as placePermission from '../placePermissionService';
import * as placeVlinkLifecycle from '../placeVlinkLifecycleService';
import { PlaceServiceError } from '../placeErrors';
import {
  permanentlyDeleteListing,
  permanentlyDeleteMeeting,
  PlaceTrashError,
  restoreListing,
  restoreMeeting,
  softTrashListing,
  softTrashMeeting,
} from '../placeTrashService';

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const trashedListing = {
  id: 'listing-1',
  businessId: 'biz-1',
  displayName: 'Acme',
  trashedAt: new Date(),
  business: { name: 'Acme Co' },
};

const trashedMeeting = {
  id: 'meeting-1',
  creatorId: 'u1',
  locationName: 'Park',
  trashedAt: new Date(),
};

describe('placeTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'evaluatePlacePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(placeActivity, 'recordListingTrashed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordListingRestored').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordListingPermanentlyDeleted').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingTrashed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingRestored').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordMeetingPermanentlyDeleted').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordListingTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordListingRestoredDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordListingPermanentlyDeletedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingRestoredDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordMeetingPermanentlyDeletedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeVlinkLifecycle, 'unlinkPlaceListingFromAllVLinks').mockResolvedValue(0);
    vi.spyOn(placeVlinkLifecycle, 'unlinkPlaceMeetingFromAllVLinks').mockResolvedValue(0);
    vi.spyOn(placePermission, 'assertCanReadListingAdmin').mockResolvedValue({
      businessId: 'biz-1',
      userId: 'u1',
      role: 'ADMIN',
      isActive: true,
    } as never);
  });

  it('soft-trashes listing and emits side effects without unlinking V_Links', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue({
      ...trashedListing,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessPlaceListing, 'updateMany').mockResolvedValue({ count: 1 });

    const result = await softTrashListing({ userId: 'u1', listingId: 'listing-1' });

    expect(result).toEqual({ success: true });
    expect(placeActivity.recordListingTrashed).toHaveBeenCalled();
    expect(placeDomain.recordListingTrashedDomainEvent).toHaveBeenCalled();
    expect(placeVlinkLifecycle.unlinkPlaceListingFromAllVLinks).not.toHaveBeenCalled();
  });

  it('throws not_found when listing missing on soft trash', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue(null);

    await expect(
      softTrashListing({ userId: 'u1', listingId: 'missing' })
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('throws forbidden when listing trash policy blocks', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue({
      ...trashedListing,
      trashedAt: null,
    } as never);
    vi.spyOn(placePolicyDual, 'evaluatePlacePolicyDual').mockResolvedValue({ blocked: true });

    await expect(
      softTrashListing({ userId: 'u1', listingId: 'listing-1' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('restores trashed listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue(trashedListing as never);
    vi.spyOn(prisma.businessPlaceListing, 'updateMany').mockResolvedValue({ count: 1 });

    await expect(
      restoreListing({ userId: 'u1', listingId: 'listing-1' })
    ).resolves.toBe(true);
    expect(placePolicyDual.evaluatePlacePolicyDual).toHaveBeenCalledWith(
      expect.objectContaining({ action: POLICY_ACTIONS.PLACE_LISTING_RESTORE })
    );
  });

  it('permanently deletes trashed listing after unlinking V_Links', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue(trashedListing as never);
    vi.spyOn(prisma.businessPlaceListing, 'deleteMany').mockResolvedValue({ count: 1 });

    await expect(
      permanentlyDeleteListing({ userId: 'u1', listingId: 'listing-1' })
    ).resolves.toBe(true);
    expect(placeVlinkLifecycle.unlinkPlaceListingFromAllVLinks).toHaveBeenCalledWith({
      actorUserId: 'u1',
      listingId: 'listing-1',
    });
  });

  it('returns false when permanently deleting non-trashed listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue(null);

    await expect(
      permanentlyDeleteListing({ userId: 'u1', listingId: 'listing-1' })
    ).resolves.toBe(false);
  });

  it('soft-trashes meeting for creator', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findFirst').mockResolvedValue({
      ...trashedMeeting,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      creatorId: 'u1',
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'updateMany').mockResolvedValue({ count: 1 });

    await expect(
      softTrashMeeting({ userId: 'u1', meetingId: 'meeting-1' })
    ).resolves.toEqual({ success: true });
    expect(placeVlinkLifecycle.unlinkPlaceMeetingFromAllVLinks).not.toHaveBeenCalled();
  });

  it('throws not_found when non-creator trashes meeting', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findFirst').mockResolvedValue({
      ...trashedMeeting,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      creatorId: 'other',
    } as never);

    await expect(
      softTrashMeeting({ userId: 'u1', meetingId: 'meeting-1' })
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('restores trashed meeting', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findFirst').mockResolvedValue(trashedMeeting as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      creatorId: 'u1',
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'updateMany').mockResolvedValue({ count: 1 });

    await expect(
      restoreMeeting({ userId: 'u1', meetingId: 'meeting-1' })
    ).resolves.toBe(true);
  });

  it('permanently deletes trashed meeting after unlinking V_Links', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findFirst').mockResolvedValue(trashedMeeting as never);
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      creatorId: 'u1',
    } as never);
    vi.spyOn(prisma.placeMeetingPlace, 'deleteMany').mockResolvedValue({ count: 1 });

    await expect(
      permanentlyDeleteMeeting({ userId: 'u1', meetingId: 'meeting-1' })
    ).resolves.toBe(true);
    expect(placeVlinkLifecycle.unlinkPlaceMeetingFromAllVLinks).toHaveBeenCalled();
  });

  it('maps PlaceServiceError forbidden to PlaceTrashError', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findFirst').mockResolvedValue({
      ...trashedListing,
      trashedAt: null,
    } as never);
    vi.spyOn(placePermission, 'assertCanReadListingAdmin').mockRejectedValue(
      new PlaceServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(
      softTrashListing({ userId: 'u1', listingId: 'listing-1' })
    ).rejects.toBeInstanceOf(PlaceTrashError);
  });
});
