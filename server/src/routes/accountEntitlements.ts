import express from 'express';
import { getEffectiveEntitlements, getEntitlements, getTier } from '../controllers/entitlementController';

const router: express.Router = express.Router();

router.get('/entitlements', getEntitlements);
router.get('/tier', getTier);
router.get('/effective', getEffectiveEntitlements);

export default router;
