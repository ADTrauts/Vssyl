import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as placePolicyDual from '../placePolicyDual';
import * as placePermission from '../placePermissionService';
import * as calendarVlink from '../../calendarVlinkAccessService';
import {
  resolvePlaceListingForVLink,
  resolvePlaceMeetingForVLink,
  assertNotebookListingTargetReadable,
} from '../placeVlinkAccessService';

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('placeVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'evaluatePlacePolicyDual').mockResolvedValue({ blocked: false });
  });

  it('allows published verified listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'listing-1',
      businessId: 'biz-1',
      displayName: 'Shop',
      trashedAt: null,
      isEnabled: true,
      isPublished: true,
      business: { name: 'Shop', einVerified: true },
    } as never);

    const result = await resolvePlaceListingForVLink('u1', 'listing-1');
    expect(result.allowed).toBe(true);
    expect(result.state).toBe('active');
  });

  it('denies trashed listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'listing-1',
      businessId: 'biz-1',
      displayName: 'Shop',
      trashedAt: new Date(),
      isEnabled: true,
      isPublished: true,
      business: { name: 'Shop', einVerified: true },
    } as never);

    const result = await resolvePlaceListingForVLink('u1', 'listing-1');
    expect(result.allowed).toBe(false);
    expect(result.state).toBe('trashed');
  });

  it('denies unpublished listing for non-admin', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'listing-1',
      businessId: 'biz-1',
      displayName: 'Draft',
      trashedAt: null,
      isEnabled: true,
      isPublished: false,
      business: { name: 'Draft', einVerified: true },
    } as never);
    vi.spyOn(placePermission, 'findListingAdminMember').mockResolvedValue(null);

    const result = await resolvePlaceListingForVLink('outsider', 'listing-1');
    expect(result.allowed).toBe(false);
  });

  it('allows business admin for unpublished listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'listing-1',
      businessId: 'biz-1',
      displayName: 'Draft',
      trashedAt: null,
      isEnabled: true,
      isPublished: false,
      business: { name: 'Draft', einVerified: false },
    } as never);
    vi.spyOn(placePermission, 'findListingAdminMember').mockResolvedValue({
      businessId: 'biz-1',
      userId: 'admin-1',
    } as never);

    const result = await resolvePlaceListingForVLink('admin-1', 'listing-1');
    expect(result.allowed).toBe(true);
  });

  it('denies trashed meeting', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      locationName: 'Park',
      trashedAt: new Date(),
      status: 'SCHEDULED',
      creatorId: 'u1',
    } as never);

    const result = await resolvePlaceMeetingForVLink('u1', 'm1');
    expect(result.allowed).toBe(false);
    expect(result.state).toBe('trashed');
  });

  it('allows meeting creator', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique')
      .mockResolvedValueOnce({
        id: 'm1',
        locationName: 'Park',
        trashedAt: null,
        status: 'SCHEDULED',
        creatorId: 'u1',
      } as never)
      .mockResolvedValueOnce({
        creatorId: 'u1',
        status: 'SCHEDULED',
        eventId: null,
        invites: [],
      } as never);

    const result = await resolvePlaceMeetingForVLink('u1', 'm1');
    expect(result.allowed).toBe(true);
  });

  it('denies cancelled meeting', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique').mockResolvedValue({
      id: 'm1',
      locationName: 'Park',
      trashedAt: null,
      status: 'CANCELLED',
      creatorId: 'u1',
    } as never);

    const result = await resolvePlaceMeetingForVLink('u1', 'm1');
    expect(result.allowed).toBe(false);
  });

  it('assertNotebookListingTargetReadable resolves businessId target', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'listing-1',
        businessId: 'biz-1',
        displayName: 'Shop',
        trashedAt: null,
        business: { name: 'Shop' },
      } as never);

    const visibility = await import('../placeVisibilityService');
    vi.spyOn(visibility, 'validateAccessibleListingIds').mockResolvedValue({
      allowed: ['biz-1'],
      denied: [],
    });

    const result = await assertNotebookListingTargetReadable('u1', 'biz-1');
    expect(result.listingId).toBe('listing-1');
  });

  it('assertNotebookListingTargetReadable rejects trashed listing', async () => {
    vi.spyOn(prisma.businessPlaceListing, 'findUnique').mockResolvedValue({
      id: 'listing-1',
      businessId: 'biz-1',
      displayName: 'Shop',
      trashedAt: new Date(),
      business: { name: 'Shop' },
    } as never);

    await expect(
      assertNotebookListingTargetReadable('u1', 'listing-1')
    ).rejects.toThrow('Listing not found');
  });

  it('allows calendar-linked participant via event visibility', async () => {
    vi.spyOn(prisma.placeMeetingPlace, 'findUnique')
      .mockResolvedValueOnce({
        id: 'm1',
        locationName: 'Park',
        trashedAt: null,
        status: 'SCHEDULED',
        creatorId: 'creator',
      } as never)
      .mockResolvedValueOnce({
        creatorId: 'creator',
        status: 'SCHEDULED',
        eventId: 'evt-1',
        invites: [],
      } as never);
    vi.spyOn(calendarVlink, 'resolveCalendarEventForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Meet',
    });

    const result = await resolvePlaceMeetingForVLink('guest', 'm1');
    expect(result.allowed).toBe(true);
  });
});
