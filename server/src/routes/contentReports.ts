import express from 'express';
import { body, query } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { createContentReport, getMyContentReports } from '../controllers/contentReportController';

const router: express.Router = express.Router();

router.post(
  '/',
  authenticateJWT,
  validate([
    body('contentId').isString().notEmpty().trim(),
    body('contentType').isString().notEmpty().trim(),
    body('reason').isString().notEmpty().trim(),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('contentTitle').optional({ values: 'null' }).isString(),
    body('contentDescription').optional({ values: 'null' }).isString(),
    body('contentUrl').optional({ values: 'null' }).isString(),
  ]),
  createContentReport
);

router.get(
  '/my-reports',
  authenticateJWT,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
  ]),
  getMyContentReports
);

export default router;
