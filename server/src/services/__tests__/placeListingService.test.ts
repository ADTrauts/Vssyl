import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import * as placePermission from '../place/placePermissionService';
import * as placeActivity from '../place/placeActivityService';
import * as placeDomain from '../place/placeDomainEventService';
import { storageService } from '../storageService';
import {
  addInteractionLink,
  deleteInteractionLink,
  reportListing,
  upsertListing,
  uploadCoverImage,
} from '../place/placeListingService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placeListingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordListingUpdated').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordListingPublished').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordListingReported').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordListingUpdatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordListingPublishedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordListingReportedDomainEvent').mockImplementation(() => undefined);
  });

  it('admin can upsert listing', async () => {
    vi.spyOn(placePermission, 'assertCanWriteListingAdmin').mockResolvedValue({} as never);
    vi.spyOn(prisma.business, 'findUnique').mockResolvedValue({ id: 'biz-1', name: 'Biz' } as never);
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue(null as never);
    vi.spyOn(prisma.businessPlaceListing, 'upsert').mockResolvedValue({
      id: 'l1',
      businessId: 'biz-1',
      isPublished: false,
      interactionLinks: [],
    } as never);

    const result = await upsertListing({
      userId: 'u1',
      businessId: 'biz-1',
      body: { displayName: 'Shop' },
    });

    expect(result.listing.id).toBe('l1');
    expect(placeActivity.recordListingUpdated).toHaveBeenCalled();
  });

  it('non-admin denied on upsert', async () => {
    vi.spyOn(placePermission, 'assertCanWriteListingAdmin').mockRejectedValue(
      new PlaceServiceError('Admin access required', 'forbidden', 403)
    );

    await expect(
      upsertListing({ userId: 'u2', businessId: 'biz-1', body: {} })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('publish path uses publish policy', async () => {
    vi.spyOn(placePermission, 'assertCanWriteListingAdmin').mockResolvedValue({} as never);
    vi.spyOn(placePermission, 'assertCanPublishListing').mockResolvedValue(undefined);
    vi.spyOn(prisma.business, 'findUnique').mockResolvedValue({ id: 'biz-1', name: 'Biz' } as never);
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'l1',
      isPublished: false,
    } as never);
    vi.spyOn(prisma.businessPlaceListing, 'upsert').mockResolvedValue({
      id: 'l1',
      businessId: 'biz-1',
      isPublished: true,
      interactionLinks: [],
    } as never);

    await upsertListing({
      userId: 'u1',
      businessId: 'biz-1',
      body: { isPublished: true },
    });

    expect(placePermission.assertCanPublishListing).toHaveBeenCalledWith('u1', 'biz-1');
    expect(placePolicyDual.assertPlacePolicyAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'place:listing.publish' })
    );
    expect(placeActivity.recordListingPublished).toHaveBeenCalled();
  });

  it('interaction link create/update/delete', async () => {
    vi.spyOn(placePermission, 'assertCanWriteListingAdmin').mockResolvedValue({} as never);
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({ id: 'l1' } as never);
    vi.spyOn(prisma.businessInteractionLink, 'create').mockResolvedValue({ id: 'link-1' } as never);
    vi.spyOn(prisma.businessInteractionLink, 'findFirst').mockResolvedValue({
      id: 'link-1',
      listing: { id: 'l1' },
    } as never);
    vi.spyOn(prisma.businessInteractionLink, 'delete').mockResolvedValue({ id: 'link-1' } as never);

    await addInteractionLink({
      userId: 'u1',
      businessId: 'biz-1',
      body: { type: 'WEBSITE', label: 'Site', url: 'https://example.com' },
    });

    await deleteInteractionLink({ userId: 'u1', businessId: 'biz-1', linkId: 'link-1' });

    expect(prisma.businessInteractionLink.create).toHaveBeenCalled();
    expect(prisma.businessInteractionLink.delete).toHaveBeenCalled();
  });

  it('image update calls storageService', async () => {
    vi.spyOn(placePermission, 'assertCanWriteListingAdmin').mockResolvedValue({} as never);
    vi.spyOn(prisma.business, 'findUnique').mockResolvedValue({ id: 'biz-1', name: 'Biz' } as never);
    vi.spyOn(storageService, 'uploadFile').mockResolvedValue({ url: 'https://cdn/cover.jpg' } as never);
    vi.spyOn(prisma.businessPlaceListing, 'upsert').mockResolvedValue({ id: 'l1' } as never);

    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const result = await uploadCoverImage({ userId: 'u1', businessId: 'biz-1', file });

    expect(storageService.uploadFile).toHaveBeenCalled();
    expect(result.coverImage).toBe('https://cdn/cover.jpg');
  });

  it('report listing emits event/activity', async () => {
    vi.spyOn(prisma.contentReport, 'create').mockResolvedValue({ id: 'r1' } as never);
    vi.spyOn(prisma.contentReport, 'count').mockResolvedValue(1 as never);

    const result = await reportListing({
      userId: 'u1',
      businessId: 'biz-1',
      reason: 'spam',
    });

    expect(result.reportId).toBe('r1');
    expect(placeActivity.recordListingReported).toHaveBeenCalled();
    expect(placeDomain.recordListingReportedDomainEvent).toHaveBeenCalled();
  });
});
