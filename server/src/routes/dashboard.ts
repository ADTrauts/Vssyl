import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import * as dashboardController from '../controllers/dashboardController';
import { asyncHandler } from '../index';

const router: express.Router = express.Router();

// GET /dashboards
router.get('/', async (req, res, next) => {
  try {
    await dashboardController.getDashboards(req, res, next);
  } catch (err) {
    next(err);
  }
});

// POST /dashboards
router.post(
  '/',
  validate([
    body('name').isString().notEmpty(),
    body('layout').optional(),
    body('preferences').optional(),
  ]),
  asyncHandler(dashboardController.createDashboard)
);

// GET /dashboards/:id
router.get(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
  ]),
  asyncHandler(dashboardController.getDashboardById)
);

// GET /dashboards/:id/file-summary
router.get(
  '/:id/file-summary',
  validate([
    param('id').isString().notEmpty(),
  ]),
  asyncHandler(dashboardController.getDashboardFileSummary)
);

// PUT /dashboards/:id
router.put(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
    body('name').optional(),
    body('layout').optional(),
    body('preferences').optional(),
  ]),
  asyncHandler(dashboardController.updateDashboard)
);

// DELETE /dashboards/:id
router.delete(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
  ]),
  asyncHandler(dashboardController.deleteDashboard)
);

export default router;
