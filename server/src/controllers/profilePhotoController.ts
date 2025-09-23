import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import { storageService } from '../services/storageService';

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Configure multer for profile photo uploads
const upload = multer({
  storage: storageService.getProvider() === 'gcs' ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads/profile-photos');
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
    const { photoType } = req.body; // 'personal' or 'business'

    if (!photoType || !['personal', 'business'].includes(photoType)) {
      return res.status(400).json({ error: 'Invalid photo type. Must be "personal" or "business"' });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `profile-photos/${userId}-${photoType}-${Date.now()}${fileExtension}`;

    // Upload file using storage service
    const uploadResult = await storageService.uploadFile(req.file, uniqueFilename, {
      makePublic: true,
      metadata: {
        userId,
        photoType,
        originalName: req.file.originalname,
      },
    });

    const photoUrl = uploadResult.url;

    // Update user record with the new photo URL
    const updateData: any = {};
    if (photoType === 'personal') {
      updateData.personalPhoto = photoUrl;
    } else {
      updateData.businessPhoto = photoUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        personalPhoto: true,
        businessPhoto: true,
        image: true,
      }
    });

    // Note: Activity creation removed to avoid Prisma schema issues
    // TODO: Add proper activity tracking when schema is updated

    res.json({
      success: true,
      message: `${photoType} photo uploaded successfully`,
      photoUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
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
        console.warn(`Failed to delete file from storage: ${deleteResult.error}`);
        // Continue with database update even if storage deletion fails
      }
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database update even if file deletion fails
    }

    // Update user record to remove the photo URL
    const updateData: any = {};
    if (photoType === 'personal') {
      updateData.personalPhoto = null;
    } else {
      updateData.businessPhoto = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        personalPhoto: true,
        businessPhoto: true,
        image: true,
      }
    });

    // Note: Activity creation removed to avoid Prisma schema issues
    // TODO: Add proper activity tracking when schema is updated

    res.json({
      success: true,
      message: `${photoType} photo removed successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error removing profile photo:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
}

export async function getProfilePhotos(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id || (req.user as any).sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        personalPhoto: true,
        businessPhoto: true,
        image: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      photos: {
        personal: user.personalPhoto,
        business: user.businessPhoto,
        default: user.image,
      },
      user
    });

  } catch (error) {
    console.error('Error getting profile photos:', error);
    res.status(500).json({ error: 'Failed to get profile photos' });
  }
}
