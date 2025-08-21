import express from 'express';
import { searchUsers, getUserPreferenceByKey, setUserPreferenceByKey } from '../controllers/userController';

const router = express.Router();

router.get('/search', searchUsers);

// User preferences
router.get('/preferences/:key', getUserPreferenceByKey);
router.put('/preferences/:key', setUserPreferenceByKey);

export default router; 