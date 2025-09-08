import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import * as widgetController from '../controllers/widgetController';
import { asyncHandler } from '../index';

const router: express.Router = express.Router();

// POST /dashboards/:dashboardId/widgets
router.post(
  '/:dashboardId/widgets',
  validate([
    param('dashboardId').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('config').optional(),
    body('position').optional(),
  ]),
  asyncHandler(widgetController.createWidget)
);

// PUT /widgets/:id
router.put(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
    body('type').optional().isString(),
    body('config').optional(),
    body('position').optional(),
  ]),
  asyncHandler(widgetController.updateWidget)
);

// DELETE /widgets/:id
router.delete(
  '/:id',
  validate([
    param('id').isString().notEmpty(),
  ]),
  asyncHandler(widgetController.deleteWidget)
);

export default router;
