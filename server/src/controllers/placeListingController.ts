import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { storageService } from '../services/storageService';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

async function verifyBusinessAdmin(userId: string, businessId: string) {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });
  if (!member || !member.isActive) return null;
  if (member.role !== 'ADMIN' && member.role !== 'MANAGER') return null;
  return member;
}

// Multer for cover image uploads
const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const coverUpload = multer({
  storage: storageService.getProvider() === 'gcs' ? multer.memoryStorage() : multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, `place-cover-${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  },
});

const multerCover = coverUpload.single('cover');

export function multerCoverUpload(req: Request, res: Response, next: () => void): void {
  multerCover(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Cover image upload failed';
      res.status(400).json({ success: false, error: message });
      return;
    }
    next();
  });
}

const avatarUpload = multer({
  storage: storageService.getProvider() === 'gcs' ? multer.memoryStorage() : multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => cb(null, `place-avatar-${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  },
});

const multerAvatar = avatarUpload.single('avatar');

export function multerAvatarUpload(req: Request, res: Response, next: () => void): void {
  multerAvatar(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Avatar image upload failed';
      res.status(400).json({ success: false, error: message });
      return;
    }
    next();
  });
}

// Validation schemas
const PLACE_CATEGORIES = ['RESTAURANT', 'RETAIL', 'GROCERY', 'DIGITAL_SERVICE', 'DELIVERY', 'LOCAL_SERVICE', 'HEALTH_WELLNESS', 'ENTERTAINMENT', 'OTHER'] as const;
const INTERACTION_LINK_TYPES = ['WEBSITE', 'DOORDASH', 'UBEREATS', 'INSTACART', 'OPENTABLE', 'RESY', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'YELP', 'GOOGLE_MAPS', 'CUSTOM'] as const;

const upsertListingSchema = z.object({
  displayName: z.string().max(200).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  coverImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  avatarImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  category: z.enum(PLACE_CATEGORIES).optional(),
  tags: z.array(z.string().max(50)).optional(),
  nodeColor: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/), z.literal(''), z.null()]).optional(),
  nodeShape: z.string().max(50).optional().nullable(),
  isEnabled: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).strict();

const addLinkSchema = z.object({
  type: z.enum(INTERACTION_LINK_TYPES),
  label: z.string().min(1).max(100),
  url: z.string().min(1).transform(s => (s.match(/^https?:\/\//i) ? s : `https://${s}`)).pipe(z.string().url()),
  sortOrder: z.number().int().min(0).optional(),
}).strict();

// ============================================================================
// BUSINESS ADMIN - LISTING MANAGEMENT
// ============================================================================

/**
 * GET /api/place/listing/:businessId
 * Get the Place listing for a business (admin view, includes drafts)
 */
export async function getListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    const listing = await prisma.businessPlaceListing.findUnique({
      where: { businessId },
      include: { interactionLinks: { orderBy: { sortOrder: 'asc' } } },
    });

    res.json({ success: true, data: listing });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching listing:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
}

/**
 * POST /api/place/listing/:businessId
 * Create or update a business Place listing
 */
export async function upsertListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }

    const parseResult = upsertListingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parseResult.error.flatten().fieldErrors });
      return;
    }
    const { displayName, shortDescription, coverImage, avatarImage, category, tags, nodeColor, nodeShape, isEnabled, isPublished } = parseResult.data;

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
        coverImage: (coverImage && coverImage !== '') ? coverImage : null,
        avatarImage: (avatarImage && avatarImage !== '') ? avatarImage : null,
        category: category ?? 'OTHER',
        tags: tags ?? [],
        nodeColor: (nodeColor && nodeColor !== '') ? nodeColor : null,
        nodeShape: nodeShape ?? null,
        isEnabled: isEnabled ?? false,
        isPublished: isPublished ?? false,
      },
      include: { interactionLinks: { orderBy: { sortOrder: 'asc' } } },
    });

    // Auto-flag suspicious content
    const textToCheck = [displayName, shortDescription, ...(tags || [])].filter(Boolean).join(' ');
    let flagged = false;
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
    }

    res.json({ success: true, data: listing, flagged });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error upserting listing:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save listing' });
  }
}

/**
 * POST /api/place/listing/:businessId/links
 * Add an interaction link to a business listing
 */
export async function addInteractionLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    const listing = await prisma.businessPlaceListing.findUnique({ where: { businessId } });
    if (!listing) { res.status(404).json({ success: false, error: 'Create a Place listing first' }); return; }

    const parseResult = addLinkSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parseResult.error.flatten().fieldErrors });
      return;
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

    res.status(201).json({ success: true, data: link });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error adding interaction link:', err.message);
    res.status(500).json({ success: false, error: 'Failed to add link' });
  }
}

/**
 * PUT /api/place/listing/:businessId/links/:linkId
 * Update an interaction link
 */
export async function updateInteractionLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, linkId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    const existingLink = await prisma.businessInteractionLink.findFirst({
      where: {
        id: linkId,
        listing: { businessId },
      },
    });
    if (!existingLink) {
      res.status(404).json({ success: false, error: 'Link not found' });
      return;
    }

    const { type, label, url, sortOrder, isActive } = req.body;

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

    res.json({ success: true, data: link });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating link:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update link' });
  }
}

/**
 * DELETE /api/place/listing/:businessId/links/:linkId
 * Remove an interaction link
 */
export async function deleteInteractionLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId, linkId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    const existingLink = await prisma.businessInteractionLink.findFirst({
      where: {
        id: linkId,
        listing: { businessId },
      },
    });
    if (!existingLink) {
      res.status(404).json({ success: false, error: 'Link not found' });
      return;
    }

    await prisma.businessInteractionLink.delete({ where: { id: existingLink.id } });

    res.json({ success: true, message: 'Link deleted' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting link:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete link' });
  }
}

/**
 * POST /api/place/listing/:businessId/cover
 * Upload cover image for a business Place listing
 */
export async function uploadCoverImage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file;
    if (!file) { res.status(400).json({ success: false, error: 'No cover image uploaded' }); return; }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }

    const ext = path.extname(file.originalname) || '.jpg';
    const destPath = `place-listings/${businessId}/cover-${Date.now()}${ext}`;

    const uploadResult = await storageService.uploadFile(file, destPath, {
      makePublic: true,
      metadata: { businessId, kind: 'place-cover' },
    });

    await prisma.businessPlaceListing.upsert({
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

    res.json({ success: true, data: { coverImage: uploadResult.url } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error uploading cover:', err.message);
    res.status(500).json({ success: false, error: 'Failed to upload cover image' });
  }
}

/**
 * DELETE /api/place/listing/:businessId/cover
 * Remove cover image from a business Place listing
 */
export async function deleteCoverImage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    await prisma.businessPlaceListing.update({
      where: { businessId },
      data: { coverImage: null },
    });

    res.json({ success: true, message: 'Cover image removed', data: { coverImage: null } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting cover:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove cover image' });
  }
}

/**
 * POST /api/place/listing/:businessId/avatar
 * Upload avatar/thumbnail image for card and map node
 */
export async function uploadAvatarImage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file;
    if (!file) { res.status(400).json({ success: false, error: 'No avatar image uploaded' }); return; }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) { res.status(404).json({ success: false, error: 'Business not found' }); return; }

    const ext = path.extname(file.originalname) || '.jpg';
    const destPath = `place-listings/${businessId}/avatar-${Date.now()}${ext}`;

    const uploadResult = await storageService.uploadFile(file, destPath, {
      makePublic: true,
      metadata: { businessId, kind: 'place-avatar' },
    });

    await prisma.businessPlaceListing.upsert({
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

    res.json({ success: true, data: { avatarImage: uploadResult.url } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error uploading avatar:', err.message);
    res.status(500).json({ success: false, error: 'Failed to upload avatar image' });
  }
}

/**
 * DELETE /api/place/listing/:businessId/avatar
 * Remove avatar image from a business Place listing
 */
export async function deleteAvatarImage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const member = await verifyBusinessAdmin(userId, businessId);
    if (!member) { res.status(403).json({ success: false, error: 'Admin access required' }); return; }

    await prisma.businessPlaceListing.update({
      where: { businessId },
      data: { avatarImage: null },
    });

    res.json({ success: true, message: 'Avatar image removed', data: { avatarImage: null } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting avatar:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove avatar image' });
  }
}

// ============================================================================
// PUBLIC ENDPOINTS - Browse / Explore / Profile
// ============================================================================

/**
 * GET /api/place/explore
 * Browse published, verified business listings (for the Explore tab)
 */
export async function explorePlaces(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { category, search, limit, offset } = req.query;
    const take = Math.min(parseInt(limit as string) || 30, 100);
    const skip = parseInt(offset as string) || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isEnabled: true,
      isPublished: true,
      business: { einVerified: true },
    };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.businessPlaceListing.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, logo: true, einVerified: true, industry: true } },
          interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.businessPlaceListing.count({ where }),
    ]);

    res.json({ success: true, data: listings, pagination: { total, limit: take, offset: skip } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error exploring places:', err.message);
    res.status(500).json({ success: false, error: 'Failed to explore places' });
  }
}

/**
 * GET /api/place/business/:businessId/profile
 * Get the public Place profile for a business (user clicks a node)
 * Only returns data for published, verified businesses
 */
export async function getBusinessProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;

    const listing = await prisma.businessPlaceListing.findUnique({
      where: { businessId },
      include: {
        business: { select: { id: true, name: true, logo: true, einVerified: true, industry: true, website: true, description: true } },
        interactionLinks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!listing || !listing.isEnabled || !listing.isPublished) {
      res.status(404).json({ success: false, error: 'Business listing not found' });
      return;
    }

    if (!listing.business.einVerified) {
      res.status(403).json({ success: false, error: 'Business not yet verified' });
      return;
    }

    // Follower count (visible to the business, but we return it for the profile too)
    const followerCount = await prisma.placeNode.count({
      where: { nodeType: 'BUSINESS', entityId: businessId },
    });

    res.json({
      success: true,
      data: {
        ...listing,
        followerCount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching business profile:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
}

// ============================================================================
// CONTENT MODERATION
// ============================================================================

const AUTO_FLAG_PATTERNS = [
  /\b(scam|fraud|fake|spam)\b/i,
  /\b(xxx|porn|nsfw)\b/i,
  /\b(hack|phish|malware)\b/i,
];

/**
 * POST /api/place/report/:businessId
 * Report a business listing for review
 */
export async function reportListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const { reason, details } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ success: false, error: 'reason is required' });
      return;
    }

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

    // Auto-flag: if multiple reports, auto-hide the listing
    const reportCount = await prisma.contentReport.count({
      where: { contentId: businessId, contentType: 'place_listing', status: 'pending' },
    });

    if (reportCount >= 3) {
      await prisma.businessPlaceListing.update({
        where: { businessId },
        data: { isPublished: false },
      });
    }

    res.status(201).json({ success: true, data: { reportId: report.id } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error reporting listing:', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
}

/**
 * Auto-flag check for listing content (called from upsertListing)
 * Returns true if content appears suspicious
 */
function checkAutoFlag(text: string): boolean {
  return AUTO_FLAG_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * GET /api/place/categories
 * Get all available Place categories
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = [
    { value: 'RESTAURANT', label: 'Restaurants & Dining' },
    { value: 'RETAIL', label: 'Retail & Shopping' },
    { value: 'GROCERY', label: 'Grocery & Markets' },
    { value: 'DIGITAL_SERVICE', label: 'Digital Services' },
    { value: 'DELIVERY', label: 'Delivery Services' },
    { value: 'LOCAL_SERVICE', label: 'Local Services' },
    { value: 'HEALTH_WELLNESS', label: 'Health & Wellness' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'OTHER', label: 'Other' },
  ];
  res.json({ success: true, data: categories });
}
