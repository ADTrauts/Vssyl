import path from 'path';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { storageService } from '../storageService';
import { PlaceServiceError } from './placeErrors';
import {
  assertCanPublishListing,
  assertCanWriteListingAdmin,
} from './placePermissionService';
import { assertPlacePolicyAllowed } from './placePolicyDual';
import * as placeActivity from './placeActivityService';
import * as placeDomain from './placeDomainEventService';
import * as placeRealtime from './placeRealtimeService';

export const PLACE_CATEGORIES = [
  'RESTAURANT',
  'RETAIL',
  'GROCERY',
  'DIGITAL_SERVICE',
  'DELIVERY',
  'LOCAL_SERVICE',
  'HEALTH_WELLNESS',
  'ENTERTAINMENT',
  'OTHER',
] as const;

export const INTERACTION_LINK_TYPES = [
  'WEBSITE',
  'DOORDASH',
  'UBEREATS',
  'INSTACART',
  'OPENTABLE',
  'RESY',
  'FACEBOOK',
  'INSTAGRAM',
  'TWITTER',
  'TIKTOK',
  'YELP',
  'GOOGLE_MAPS',
  'CUSTOM',
] as const;

const AUTO_FLAG_PATTERNS = [
  /\b(scam|fraud|fake|spam)\b/i,
  /\b(xxx|porn|nsfw)\b/i,
  /\b(hack|phish|malware)\b/i,
];

export const upsertListingSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    shortDescription: z.string().max(500).optional().nullable(),
    coverImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    avatarImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
    category: z.enum(PLACE_CATEGORIES).optional(),
    tags: z.array(z.string().max(50)).optional(),
    nodeColor: z
      .union([z.string().regex(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/), z.literal(''), z.null()])
      .optional(),
    nodeShape: z.string().max(50).optional().nullable(),
    isEnabled: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  })
  .strict();

export const addLinkSchema = z
  .object({
    type: z.enum(INTERACTION_LINK_TYPES),
    label: z.string().min(1).max(100),
    url: z
      .string()
      .min(1)
      .transform((s) => (s.match(/^https?:\/\//i) ? s : `https://${s}`))
      .pipe(z.string().url()),
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict();

export const updateLinkSchema = z
  .object({
    type: z.enum(INTERACTION_LINK_TYPES).optional(),
    label: z.string().min(1).max(100).optional(),
    url: z
      .string()
      .min(1)
      .transform((s) => (s.match(/^https?:\/\//i) ? s : `https://${s}`))
      .pipe(z.string().url())
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

function checkAutoFlag(text: string): boolean {
  return AUTO_FLAG_PATTERNS.some((pattern) => pattern.test(text));
}

async function assertListingWritePolicy(userId: string, businessId: string) {
  await assertCanWriteListingAdmin(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_WRITE,
    resourceType: 'place_listing',
    resourceId: businessId,
  });
}

async function emitListingSideEffects(params: {
  userId: string;
  listingId: string;
  businessId: string;
  wasPublished?: boolean;
  isPublished?: boolean;
}) {
  await placeActivity.recordListingUpdated({
    actorUserId: params.userId,
    listingId: params.listingId,
    businessId: params.businessId,
  });
  placeDomain.recordListingUpdatedDomainEvent({
    actorUserId: params.userId,
    listingId: params.listingId,
    businessId: params.businessId,
  });
  placeRealtime.broadcastListingUpdated(params.businessId, {
    listingId: params.listingId,
    businessId: params.businessId,
  });

  if (params.isPublished && !params.wasPublished) {
    await placeActivity.recordListingPublished({
      actorUserId: params.userId,
      listingId: params.listingId,
      businessId: params.businessId,
    });
    placeDomain.recordListingPublishedDomainEvent({
      actorUserId: params.userId,
      listingId: params.listingId,
      businessId: params.businessId,
    });
  }
}

export async function upsertListing(params: {
  userId: string;
  businessId: string;
  body: unknown;
}) {
  const { userId, businessId } = params;
  await assertListingWritePolicy(userId, businessId);

  const parseResult = upsertListingSchema.safeParse(params.body);
  if (!parseResult.success) {
    throw new PlaceServiceError('Invalid input', 'invalid', 400);
  }

  const {
    displayName,
    shortDescription,
    coverImage,
    avatarImage,
    category,
    tags,
    nodeColor,
    nodeShape,
    isEnabled,
    isPublished,
  } = parseResult.data;

  if (isPublished === true) {
    await assertCanPublishListing(userId, businessId);
    await assertPlacePolicyAllowed({
      userId,
      action: POLICY_ACTIONS.PLACE_LISTING_PUBLISH,
      resourceType: 'place_listing',
      resourceId: businessId,
    });
  }

  if (isPublished === false) {
    await assertPlacePolicyAllowed({
      userId,
      action: POLICY_ACTIONS.PLACE_LISTING_UNPUBLISH,
      resourceType: 'place_listing',
      resourceId: businessId,
    });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new PlaceServiceError('Business not found', 'not_found', 404);
  }

  const existing = await prisma.businessPlaceListing.findUnique({
    where: { businessId },
    select: { id: true, isPublished: true },
  });

  const listing = await prisma.businessPlaceListing.upsert({
    where: { businessId },
    update: {
      ...(displayName !== undefined && { displayName }),
      ...(shortDescription !== undefined && { shortDescription }),
      ...(coverImage !== undefined && { coverImage: coverImage || null }),
      ...(avatarImage !== undefined && { avatarImage: avatarImage || null }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(nodeColor !== undefined && { nodeColor: nodeColor || null }),
      ...(nodeShape !== undefined && { nodeShape }),
      ...(isEnabled !== undefined && { isEnabled }),
      ...(isPublished !== undefined && { isPublished }),
    },
    create: {
      businessId,
      displayName: displayName ?? business.name,
      shortDescription: shortDescription ?? business.description ?? '',
      coverImage: coverImage && coverImage !== '' ? coverImage : null,
      avatarImage: avatarImage && avatarImage !== '' ? avatarImage : null,
      category: category ?? 'OTHER',
      tags: tags ?? [],
      nodeColor: nodeColor && nodeColor !== '' ? nodeColor : null,
      nodeShape: nodeShape ?? null,
      isEnabled: isEnabled ?? false,
      isPublished: isPublished ?? false,
    },
    include: { interactionLinks: { orderBy: { sortOrder: 'asc' } } },
  });

  let flagged = false;
  const textToCheck = [displayName, shortDescription, ...(tags || [])].filter(Boolean).join(' ');
  if (textToCheck && checkAutoFlag(textToCheck)) {
    await prisma.businessPlaceListing.update({
      where: { businessId },
      data: { isPublished: false },
    });
    flagged = true;
    await prisma.contentReport.create({
      data: {
        reporterId: userId,
        contentId: businessId,
        contentType: 'place_listing',
        reason: 'auto_flagged',
        details: 'Listing content matched auto-flag patterns',
        status: 'pending',
      },
    });
  } else {
    await emitListingSideEffects({
      userId,
      listingId: listing.id,
      businessId,
      wasPublished: existing?.isPublished,
      isPublished: listing.isPublished,
    });
  }

  return { listing, flagged };
}

export async function addInteractionLink(params: {
  userId: string;
  businessId: string;
  body: unknown;
}) {
  const { userId, businessId } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_INTERACTION_LINK_WRITE,
    resourceType: 'place_listing',
    resourceId: businessId,
  });

  const listing = await prisma.businessPlaceListing.findUnique({ where: { businessId } });
  if (!listing) {
    throw new PlaceServiceError('Create a Place listing first', 'listing_not_found', 404);
  }

  const parseResult = addLinkSchema.safeParse(params.body);
  if (!parseResult.success) {
    throw new PlaceServiceError('Invalid input', 'invalid', 400);
  }

  const { type, label, url, sortOrder } = parseResult.data;

  const link = await prisma.businessInteractionLink.create({
    data: {
      listingId: listing.id,
      type,
      label,
      url,
      sortOrder: sortOrder ?? 0,
    },
  });

  await emitListingSideEffects({
    userId,
    listingId: listing.id,
    businessId,
  });

  return link;
}

export async function updateInteractionLink(params: {
  userId: string;
  businessId: string;
  linkId: string;
  body: unknown;
}) {
  const { userId, businessId, linkId } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_INTERACTION_LINK_WRITE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { linkId },
  });

  const existingLink = await prisma.businessInteractionLink.findFirst({
    where: { id: linkId, listing: { businessId } },
    include: { listing: { select: { id: true } } },
  });
  if (!existingLink) {
    throw new PlaceServiceError('Link not found', 'not_found', 404);
  }

  const parseResult = updateLinkSchema.safeParse(params.body);
  if (!parseResult.success) {
    throw new PlaceServiceError('Invalid input', 'invalid', 400);
  }

  const { type, label, url, sortOrder, isActive } = parseResult.data;

  const link = await prisma.businessInteractionLink.update({
    where: { id: existingLink.id },
    data: {
      ...(type !== undefined && { type }),
      ...(label !== undefined && { label }),
      ...(url !== undefined && { url }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await emitListingSideEffects({
    userId,
    listingId: existingLink.listing.id,
    businessId,
  });

  return link;
}

export async function deleteInteractionLink(params: {
  userId: string;
  businessId: string;
  linkId: string;
}) {
  const { userId, businessId, linkId } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_INTERACTION_LINK_WRITE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { linkId },
  });

  const existingLink = await prisma.businessInteractionLink.findFirst({
    where: { id: linkId, listing: { businessId } },
    include: { listing: { select: { id: true } } },
  });
  if (!existingLink) {
    throw new PlaceServiceError('Link not found', 'not_found', 404);
  }

  await prisma.businessInteractionLink.delete({ where: { id: existingLink.id } });

  await emitListingSideEffects({
    userId,
    listingId: existingLink.listing.id,
    businessId,
  });
}

export async function uploadCoverImage(params: {
  userId: string;
  businessId: string;
  file: Express.Multer.File;
}) {
  const { userId, businessId, file } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { kind: 'cover' },
  });

  if (!file) {
    throw new PlaceServiceError('No cover image uploaded', 'invalid', 400);
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new PlaceServiceError('Business not found', 'not_found', 404);
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const destPath = `place-listings/${businessId}/cover-${Date.now()}${ext}`;

  const uploadResult = await storageService.uploadFile(file, destPath, {
    makePublic: true,
    metadata: { businessId, kind: 'place-cover' },
  });

  const listing = await prisma.businessPlaceListing.upsert({
    where: { businessId },
    update: { coverImage: uploadResult.url },
    create: {
      businessId,
      displayName: business.name,
      shortDescription: business.description || '',
      coverImage: uploadResult.url,
      category: 'OTHER',
      tags: [],
    },
  });

  await emitListingSideEffects({
    userId,
    listingId: listing.id,
    businessId,
  });

  return { coverImage: uploadResult.url, listingId: listing.id };
}

export async function deleteCoverImage(params: { userId: string; businessId: string }) {
  const { userId, businessId } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { kind: 'cover', delete: true },
  });

  const listing = await prisma.businessPlaceListing.update({
    where: { businessId },
    data: { coverImage: null },
  });

  await emitListingSideEffects({
    userId,
    listingId: listing.id,
    businessId,
  });

  return { coverImage: null as string | null };
}

export async function uploadAvatarImage(params: {
  userId: string;
  businessId: string;
  file: Express.Multer.File;
}) {
  const { userId, businessId, file } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { kind: 'avatar' },
  });

  if (!file) {
    throw new PlaceServiceError('No avatar image uploaded', 'invalid', 400);
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new PlaceServiceError('Business not found', 'not_found', 404);
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const destPath = `place-listings/${businessId}/avatar-${Date.now()}${ext}`;

  const uploadResult = await storageService.uploadFile(file, destPath, {
    makePublic: true,
    metadata: { businessId, kind: 'place-avatar' },
  });

  const listing = await prisma.businessPlaceListing.upsert({
    where: { businessId },
    update: { avatarImage: uploadResult.url },
    create: {
      businessId,
      displayName: business.name,
      shortDescription: business.description || '',
      avatarImage: uploadResult.url,
      category: 'OTHER',
      tags: [],
    },
  });

  await emitListingSideEffects({
    userId,
    listingId: listing.id,
    businessId,
  });

  return { avatarImage: uploadResult.url, listingId: listing.id };
}

export async function deleteAvatarImage(params: { userId: string; businessId: string }) {
  const { userId, businessId } = params;
  await assertListingWritePolicy(userId, businessId);
  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_IMAGE_UPDATE,
    resourceType: 'place_listing',
    resourceId: businessId,
    metadata: { kind: 'avatar', delete: true },
  });

  const listing = await prisma.businessPlaceListing.update({
    where: { businessId },
    data: { avatarImage: null },
  });

  await emitListingSideEffects({
    userId,
    listingId: listing.id,
    businessId,
  });

  return { avatarImage: null as string | null };
}

export async function reportListing(params: {
  userId: string;
  businessId: string;
  reason: string;
  details?: string | null;
}) {
  const { userId, businessId, reason, details } = params;

  if (!reason || typeof reason !== 'string') {
    throw new PlaceServiceError('reason is required', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_LISTING_REPORT,
    resourceType: 'place_listing',
    resourceId: businessId,
  });

  const report = await prisma.contentReport.create({
    data: {
      reporterId: userId,
      contentId: businessId,
      contentType: 'place_listing',
      reason,
      details: details || null,
      status: 'pending',
    },
  });

  const reportCount = await prisma.contentReport.count({
    where: { contentId: businessId, contentType: 'place_listing', status: 'pending' },
  });

  if (reportCount >= 3) {
    await prisma.businessPlaceListing.update({
      where: { businessId },
      data: { isPublished: false },
    });
  }

  await placeActivity.recordListingReported({
    actorUserId: userId,
    businessId,
    reason,
  });
  placeDomain.recordListingReportedDomainEvent({
    actorUserId: userId,
    businessId,
    reason,
  });

  return { reportId: report.id };
}
