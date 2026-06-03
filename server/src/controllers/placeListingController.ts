import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { logger } from '../lib/logger';
import { storageService } from '../services/storageService';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeVisibilityService from '../services/place/placeVisibilityService';
import * as placeListingService from '../services/place/placeListingService';

function logPlaceListingError(desc: string, operation: string, err: unknown): void {
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

// ============================================================================
// BUSINESS ADMIN - LISTING MANAGEMENT
// ============================================================================

/**
 * GET /api/place/listing/:businessId
 * Get the Place listing for a business (admin view, includes drafts)
 */
/* <place-visibility-read-handlers> */
export async function getListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const listing = await placeVisibilityService.getListingForAdmin(userId, businessId);
    res.json({ success: true, data: listing });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error fetching listing', 'place_listing_get', err);
    res.status(500).json({ success: false, error: 'Failed to fetch listing' });
  }
}
/* </place-visibility-read-handlers> */

/* <place-listing-write-handlers> */

/**
 * POST /api/place/listing/:businessId
 * Create or update a business Place listing
 */
export async function upsertListing(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const result = await placeListingService.upsertListing({
      userId,
      businessId,
      body: req.body,
    });

    res.json({ success: true, data: result.listing, flagged: result.flagged });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error upserting listing', 'place_listing_upsert', err);
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
    const link = await placeListingService.addInteractionLink({
      userId,
      businessId,
      body: req.body,
    });

    res.status(201).json({ success: true, data: link });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error adding interaction link', 'place_listing_link_add', err);
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
    const link = await placeListingService.updateInteractionLink({
      userId,
      businessId,
      linkId,
      body: req.body,
    });

    res.json({ success: true, data: link });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error updating link', 'place_listing_link_update', err);
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
    await placeListingService.deleteInteractionLink({ userId, businessId, linkId });

    res.json({ success: true, message: 'Link deleted' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error deleting link', 'place_listing_link_delete', err);
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
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, error: 'No cover image uploaded' }); return; }

    const result = await placeListingService.uploadCoverImage({ userId, businessId, file });

    res.json({ success: true, data: { coverImage: result.coverImage } });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error uploading cover', 'place_listing_cover_upload', err);
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
    const result = await placeListingService.deleteCoverImage({ userId, businessId });

    res.json({ success: true, message: 'Cover image removed', data: result });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error deleting cover', 'place_listing_cover_delete', err);
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
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, error: 'No avatar image uploaded' }); return; }

    const result = await placeListingService.uploadAvatarImage({ userId, businessId, file });

    res.json({ success: true, data: { avatarImage: result.avatarImage } });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error uploading avatar', 'place_listing_avatar_upload', err);
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
    const result = await placeListingService.deleteAvatarImage({ userId, businessId });

    res.json({ success: true, message: 'Avatar image removed', data: result });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error deleting avatar', 'place_listing_avatar_delete', err);
    res.status(500).json({ success: false, error: 'Failed to remove avatar image' });
  }
}

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

    const result = await placeListingService.reportListing({
      userId,
      businessId,
      reason,
      details,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error reporting listing', 'place_listing_report', err);
    res.status(500).json({ success: false, error: 'Failed to submit report' });
  }
}

/* </place-listing-write-handlers> */

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
    const result = await placeVisibilityService.exploreListings(userId, {
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search : undefined,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' ? parseInt(offset, 10) : undefined,
    });

    res.json({ success: true, data: result.listings, pagination: result.pagination });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error exploring places', 'place_listing_explore', err);
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
    const listing = await placeVisibilityService.getBusinessProfile(userId, businessId);

    res.json({ success: true, data: listing });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceListingError('Error fetching business profile', 'place_listing_business_profile', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
}

/**
 * GET /api/place/categories
 * Get all available Place categories
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: placeVisibilityService.getPlaceCategories() });
}
