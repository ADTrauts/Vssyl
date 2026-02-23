import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import * as placeController from '../controllers/placeController.js';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Place CRUD
router.get('/', placeController.getPlace);
router.put('/settings', placeController.updatePlaceSettings);
router.post('/complete-setup', placeController.completeSetup);

// Node management
router.post('/nodes', placeController.addNode);
router.put('/nodes/:nodeId', placeController.updateNode);
router.delete('/nodes/:nodeId', placeController.removeNode);

// Interests
router.post('/interests', placeController.setInterests);

// Follow visibility
router.put('/follow-visibility/:businessId', placeController.updateFollowVisibility);

// AI context providers
router.get('/ai/context/overview', placeController.getPlaceContextOverview);

export default router;
