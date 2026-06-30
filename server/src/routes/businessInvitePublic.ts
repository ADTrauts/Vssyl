import express from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import { previewInvitation } from '../controllers/businessController';

const router: express.Router = express.Router();

const inviteTokenParam = validate([param('token').isString().notEmpty().isLength({ min: 8, max: 256 })]);

/** Public preview — invitation token is the credential */
router.get('/preview/:token', inviteTokenParam, previewInvitation);

export default router;
