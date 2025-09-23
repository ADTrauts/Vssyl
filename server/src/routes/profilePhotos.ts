import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { 
  uploadProfilePhoto, 
  removeProfilePhoto, 
  getProfilePhotos,
  multerUpload 
} from '../controllers/profilePhotoController';

const router: express.Router = express.Router();

// Get user's profile photos
router.get('/', authenticateJWT, getProfilePhotos);

// Upload a profile photo
router.post('/upload', authenticateJWT, multerUpload, uploadProfilePhoto);

// Remove a profile photo
router.delete('/remove', authenticateJWT, removeProfilePhoto);

export default router;
