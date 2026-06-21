import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storageService } from '../services/storageService';
import sharp from 'sharp';
import { logger } from '../lib/logger';
import {
  ProfilePhotoServiceError,
  assertPhotoWrite,
  createProfilePhotoRecord,
  assignPhotoToSlot,
  findOwnedPhoto,
  findOwnedPhotoWithOriginal,
  updatePhotoAvatarRecord,
  clearPhotoSlot,
  getProfilePhotosBundle,
  getPhotoForServe,
  syncUserAfterPhotoUpload,
} from '../services/account/profilePhotoService';

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

type CropParams = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zoom?: number;
};

function parseCropParams(raw: unknown): CropParams | null {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parseCropParams(parsed);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const x = obj.x;
  const y = obj.y;
  const width = obj.width;
  const height = obj.height;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
    return null;
  }
  const rotation = typeof obj.rotation === 'number' ? obj.rotation : undefined;
  const zoom = typeof obj.zoom === 'number' ? obj.zoom : undefined;
  return { x, y, width, height, rotation, zoom };
}

async function generateAvatarRendition(buffer: Buffer, crop: CropParams | null): Promise<Buffer> {
  // Produce a 512x512 square JPEG avatar rendition.
  // If crop is missing, do a center crop.
  let image = sharp(buffer).rotate(); // auto-orient by EXIF
  if (crop) {
    // Note: crop values are expected to be pixels in the preview image coordinate space.
    // For now, apply them directly; client should send pixelCrop from react-easy-crop.
    image = image.extract({
      left: Math.max(0, Math.round(crop.x)),
      top: Math.max(0, Math.round(crop.y)),
      width: Math.max(1, Math.round(crop.width)),
      height: Math.max(1, Math.round(crop.height)),
    });
    if (typeof crop.rotation === 'number' && crop.rotation !== 0) {
      image = image.rotate(crop.rotation);
    }
  } else {
    image = image.resize(512, 512, { fit: 'cover', position: 'centre' });
  }

  return await image
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 92 })
    .toBuffer();
}

// Configure multer for profile photo uploads
const upload = multer({
  storage: storageService.getProvider() === 'gcs' ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads/profile-photos');
      
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const multerUpload = upload.single('photo') as any;

export async function uploadProfilePhoto(req: RequestWithFile, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;
    const { photoType, crop } = req.body as { photoType?: string; crop?: unknown }; // photoType optional; crop optional

    if (photoType && !['personal', 'business'].includes(photoType)) {
      return res.status(400).json({ error: 'Invalid photo type. Must be "personal" or "business"' });
    }

    const cropParams = parseCropParams(crop);

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const uniqueOriginalFilename = `profile-photos/${userId}-original-${timestamp}${fileExtension}`;
    const uniqueAvatarFilename = `profile-photos/${userId}-avatar-${timestamp}.jpg`;

    // Read original file buffer BEFORE uploading (important for disk storage)
    // For GCS, file is in memory (buffer). For local, file is on disk (path).
    let originalBuffer: Buffer | null = null;
    const provider = storageService.getProvider();
    
    if (provider === 'gcs') {
      if (req.file.buffer) {
        originalBuffer = req.file.buffer as Buffer;
      } else {
        void logger.error('GCS storage but req.file.buffer is missing', {
          operation: 'profile_photo_upload',
        });
        return res.status(400).json({ error: 'Failed to process uploaded file: buffer missing' });
      }
    } else {
      // Local storage: read file from disk
      if (!req.file.path) {
        void logger.error('Local storage but req.file.path is missing', {
          operation: 'profile_photo_upload',
          context: {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
        });
        return res.status(400).json({ error: 'Failed to process uploaded file: file path missing' });
      }
      
      try {
        // Check if file exists
        if (!fs.existsSync(req.file.path)) {
          void logger.error('Profile photo file does not exist at path', {
            operation: 'profile_photo_upload',
            context: { path: req.file.path },
          });
          return res.status(400).json({ error: 'Failed to process uploaded file: file not found on disk' });
        }
        originalBuffer = await fs.promises.readFile(req.file.path);
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        void logger.error('Error reading profile photo file from disk', {
          operation: 'profile_photo_upload',
          error: { message: e.message, stack: e.stack },
        });
        return res.status(400).json({ error: 'Failed to read uploaded file from disk' });
      }
    }

    if (!originalBuffer) {
      void logger.error('originalBuffer is null after profile photo processing', {
        operation: 'profile_photo_upload',
        context: { provider },
      });
      return res.status(400).json({ error: 'Failed to process uploaded file' });
    }

    await assertPhotoWrite(userId);

    // Upload original file using storage service
    const uploadOriginalResult = await storageService.uploadFile(req.file, uniqueOriginalFilename, {
      makePublic: true,
      metadata: {
        userId,
        kind: 'profile-photo-original',
        originalName: req.file.originalname,
      },
    });

    const originalUrl = uploadOriginalResult.url;

    const avatarBuffer = await generateAvatarRendition(originalBuffer, cropParams);
    const avatarFile: Express.Multer.File = {
      fieldname: 'photo',
      originalname: `avatar-${timestamp}.jpg`,
      encoding: req.file.encoding,
      mimetype: 'image/jpeg',
      size: avatarBuffer.length,
      buffer: avatarBuffer,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as any,
    };

    const uploadAvatarResult = await storageService.uploadFile(avatarFile, uniqueAvatarFilename, {
      makePublic: true,
      metadata: {
        userId,
        kind: 'profile-photo-avatar',
        originalName: req.file.originalname,
      },
    });

    const avatarUrl = uploadAvatarResult.url;

    const created = await createProfilePhotoRecord({
      userId,
      originalUrl,
      avatarUrl,
      crop: cropParams ? (cropParams as object) : undefined,
      rotation: typeof cropParams?.rotation === 'number' ? Math.round(cropParams.rotation) : undefined,
    });

    const updatedUser = await syncUserAfterPhotoUpload(userId, created.id, avatarUrl, photoType);

    res.json({
      success: true,
      message: `Profile photo uploaded successfully`,
      photo: created,
      user: updatedUser,
      photos: {
        personal: updatedUser?.personalPhoto,
        business: updatedUser?.businessPhoto,
        default: updatedUser?.image,
      }
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user
      ? String((req.user as { id?: string; sub?: string }).id ?? (req.user as { sub?: string }).sub)
      : undefined;
    logger.error('Profile photo upload failed', {
      operation: 'upload_profile_photo',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
}

export async function assignProfilePhoto(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;
    const { photoId, target } = req.body as { photoId?: string; target?: 'personal' | 'business' };
    if (!photoId || (target !== 'personal' && target !== 'business')) {
      return res.status(400).json({ error: 'photoId and target ("personal" | "business") are required' });
    }

    const photo = await findOwnedPhoto(userId, photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const user = await assignPhotoToSlot({
      userId,
      photoId,
      target,
      avatarUrl: photo.avatarUrl,
    });

    res.json({
      success: true,
      user,
      photos: {
        personal: user.personalPhoto,
        business: user.businessPhoto,
        default: user.image,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user ? String((req.user as { id?: string }).id) : undefined;
    logger.error('Profile photo assign failed', {
      operation: 'assign_profile_photo',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to assign profile photo' });
  }
}

export async function updateProfilePhotoAvatar(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params as { id: string };
    const cropParams = parseCropParams((req.body as any)?.crop);
    if (!cropParams) {
      return res.status(400).json({ error: 'Valid crop params are required' });
    }

    const photo = await findOwnedPhotoWithOriginal(userId, id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const originalPath = storageService.extractPathFromUrl(photo.originalUrl);
    if (!originalPath) {
      return res.status(400).json({ error: 'Could not resolve original storage path' });
    }

    const originalBuffer = await storageService.getFileBuffer(originalPath);
    const avatarBuffer = await generateAvatarRendition(originalBuffer, cropParams);

    const timestamp = Date.now();
    const uniqueAvatarFilename = `profile-photos/${userId}-avatar-${id}-${timestamp}.jpg`;

    const avatarFile: Express.Multer.File = {
      fieldname: 'photo',
      originalname: `avatar-${id}-${timestamp}.jpg`,
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: avatarBuffer.length,
      buffer: avatarBuffer,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as any,
    };

    const uploadAvatarResult = await storageService.uploadFile(avatarFile, uniqueAvatarFilename, {
      makePublic: true,
      metadata: {
        userId,
        kind: 'profile-photo-avatar',
        originalName: avatarFile.originalname,
      },
    });

    const updatedPhoto = await updatePhotoAvatarRecord({
      userId,
      photoId: id,
      avatarUrl: uploadAvatarResult.url,
      crop: cropParams as object,
      rotation: typeof cropParams.rotation === 'number' ? Math.round(cropParams.rotation) : undefined,
    });

    res.json({ success: true, photo: updatedPhoto });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user ? String((req.user as { id?: string }).id) : undefined;
    logger.error('Profile photo avatar update failed', {
      operation: 'update_profile_photo_avatar',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update profile photo avatar' });
  }
}

export async function removeProfilePhoto(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;
    const { photoType } = req.body; // 'personal' or 'business'

    if (!photoType || !['personal', 'business'].includes(photoType)) {
      return res.status(400).json({ error: 'Invalid photo type. Must be "personal" or "business"' });
    }

    // Get current user to find the photo URL
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        personalPhoto: true,
        businessPhoto: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPhotoUrl = photoType === 'personal' ? user.personalPhoto : user.businessPhoto;

    if (!currentPhotoUrl) {
      return res.status(400).json({ error: 'No photo to remove' });
    }

    // Remove file from storage
    try {
      // Extract the file path from the URL
      const url = new URL(currentPhotoUrl);
      const filePath = url.pathname.substring(1); // Remove leading slash
      
      const deleteResult = await storageService.deleteFile(filePath);
      if (!deleteResult.success) {
        void logger.warn('Failed to delete profile photo file from storage', {
          operation: 'profile_photo_delete',
          context: { error: deleteResult.error },
        });
        // Continue with database update even if storage deletion fails
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Error deleting profile photo file from storage', {
        operation: 'profile_photo_delete',
        error: { message: err.message, stack: err.stack },
      });
      // Continue with database update even if file deletion fails
    }

    const updatedUser = await clearPhotoSlot({ userId, photoType: photoType as 'personal' | 'business' });

    res.json({
      success: true,
      message: `${photoType} photo removed successfully`,
      user: updatedUser
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user ? String((req.user as { id?: string }).id) : undefined;
    logger.error('Profile photo remove failed', {
      operation: 'remove_profile_photo',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
}

export async function getProfilePhotos(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;

    const bundle = await getProfilePhotosBundle(userId);

    res.json({
      success: true,
      ...bundle,
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = req.user && typeof req.user === 'object' && 'id' in req.user ? String((req.user as { id?: string }).id) : undefined;
    logger.error('Profile photos fetch failed', {
      operation: 'get_profile_photos',
      userId,
      error: { message: err.message, stack: err.stack },
    });
    // Include error message in response for debugging (only in development)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Failed to get profile photos';
    res.status(500).json({ 
      error: errorMessage,
      message: 'Failed to get profile photos',
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
  }
}

/**
 * Serve a profile photo image file
 * This endpoint allows serving images even when GCS bucket has public access prevention
 */
export async function serveProfilePhoto(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;
    const { photoId } = req.params;
    const { type = 'avatar' } = req.query; // 'avatar' or 'original'

    if (!photoId) {
      return res.status(400).json({ error: 'Photo ID is required' });
    }

    const photo = await getPhotoForServe(userId, photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Get the file path from the URL
    const photoUrl = type === 'original' ? photo.originalUrl : photo.avatarUrl;
    if (!photoUrl) {
      return res.status(404).json({ error: 'Photo URL not found' });
    }

    // Extract storage path in a provider-safe way.
    const filePath = storageService.extractPathFromUrl(photoUrl);
    if (!filePath) {
      return res.status(400).json({ error: 'Unsupported URL format' });
    }

    // Get file buffer from storage
    const fileBuffer = await storageService.getFileBuffer(filePath);

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png'
      ? 'image/png'
      : ext === '.webp'
      ? 'image/webp'
      : 'image/jpeg';

    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.send(fileBuffer);

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Profile photo serve failed', {
      operation: 'serve_profile_photo',
      photoId: req.params.photoId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ 
      error: 'Failed to serve profile photo',
      message: err.message 
    });
  }
}
