import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import businessFrontPageService from '../services/businessFrontPageService';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// ============================================================================
// CONFIGURATION MANAGEMENT (Admin Only)
// ============================================================================

/**
 * GET /api/business-front/:businessId/config
 * Get front page configuration for a business
 */
router.get('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }
    
    const config = await businessFrontPageService.getOrCreateConfig(businessId);
    res.json(config);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logSrvErr('businessfrontpage_fetch_config', 'Error fetching front page config', error, {
      businessId: req.params.businessId,
    });
    res.status(500).json({
      error: 'Failed to fetch front page configuration',
      message: err.message,
    });
  }
});

/**
 * POST /api/business-front/:businessId/config
 * Create or initialize front page configuration
 */
router.post('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;
    const config = await businessFrontPageService.createDefaultConfig(businessId);
    res.status(201).json(config);
  } catch (error: unknown) {
    logSrvErr('businessfrontpage_error_creating_front_page_config', 'Error creating front page config', error);
    res.status(500).json({ error: 'Failed to create front page configuration' });
  }
});

/**
 * PUT /api/business-front/:businessId/config
 * Update front page configuration
 */
router.put('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;
    const configData = req.body;
    const userId = req.user?.id;

    const config = await businessFrontPageService.updateConfig(
      businessId,
      configData,
      userId
    );

    res.json(config);
  } catch (error) {
    logSrvErr('businessfrontpage_error_updating_front_page_config', 'Error updating front page config:', error);
    res.status(500).json({ error: 'Failed to update front page configuration' });
  }
});

/**
 * DELETE /api/business-front/:businessId/config
 * Delete front page configuration (reset to default)
 */
router.delete('/:businessId/config', async (req, res) => {
  try {
    const { businessId } = req.params;
    await businessFrontPageService.deleteConfig(businessId);
    res.status(204).send();
  } catch (error) {
    logSrvErr('businessfrontpage_error_deleting_front_page_config', 'Error deleting front page config:', error);
    res.status(500).json({ error: 'Failed to delete front page configuration' });
  }
});

// ============================================================================
// WIDGET MANAGEMENT (Admin Only)
// ============================================================================

/**
 * POST /api/business-front/:businessId/widgets
 * Add a new widget to the front page
 */
router.post('/:businessId/widgets', async (req, res) => {
  try {
    const { businessId } = req.params;
    const widgetData = req.body;

    const widget = await businessFrontPageService.addWidget(businessId, widgetData);
    res.status(201).json(widget);
  } catch (error) {
    logSrvErr('businessfrontpage_error_adding_widget', 'Error adding widget:', error);
    res.status(500).json({ error: 'Failed to add widget' });
  }
});

/**
 * PUT /api/business-front/:businessId/widgets/:widgetId
 * Update an existing widget
 */
router.put('/:businessId/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const widgetData = req.body;

    const widget = await businessFrontPageService.updateWidget(widgetId, widgetData);
    res.json(widget);
  } catch (error) {
    logSrvErr('businessfrontpage_error_updating_widget', 'Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

/**
 * DELETE /api/business-front/:businessId/widgets/:widgetId
 * Remove a widget from the front page
 */
router.delete('/:businessId/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    await businessFrontPageService.deleteWidget(widgetId);
    res.status(204).send();
  } catch (error) {
    logSrvErr('businessfrontpage_error_deleting_widget', 'Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

/**
 * POST /api/business-front/:businessId/widgets/reorder
 * Reorder widgets
 */
router.post('/:businessId/widgets/reorder', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { widgetOrders } = req.body; // Array of { id, order }

    const config = await businessFrontPageService.reorderWidgets(businessId, widgetOrders);
    res.json(config);
  } catch (error) {
    logSrvErr('businessfrontpage_error_reordering_widgets', 'Error reordering widgets:', error);
    res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

// ============================================================================
// USER VIEW (All Authenticated Users)
// ============================================================================

/**
 * GET /api/business-front/:businessId/view
 * Get personalized front page view for current user
 */
router.get('/:businessId/view', async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const view = await businessFrontPageService.getUserView(businessId, userId);
    res.json(view);
  } catch (error) {
    logSrvErr('businessfrontpage_error_fetching_user_view', 'Error fetching user view:', error);
    res.status(500).json({ error: 'Failed to fetch personalized view' });
  }
});

/**
 * GET /api/business-front/:businessId/widgets/visible
 * Get widgets visible to current user
 */
router.get('/:businessId/widgets/visible', async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const widgets = await businessFrontPageService.getVisibleWidgets(businessId, userId);
    res.json(widgets);
  } catch (error) {
    logSrvErr('businessfrontpage_error_fetching_visible_widgets', 'Error fetching visible widgets:', error);
    res.status(500).json({ error: 'Failed to fetch visible widgets' });
  }
});

// ============================================================================
// USER CUSTOMIZATION
// ============================================================================

/**
 * GET /api/business-front/:businessId/my-customization
 * Get current user's front page customizations
 */
router.get('/:businessId/my-customization', async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const view = await businessFrontPageService.getUserView(businessId, userId);
    res.json(view.userCustomization);
  } catch (error) {
    logSrvErr('businessfrontpage_error_fetching_user_customization', 'Error fetching user customization:', error);
    res.status(500).json({ error: 'Failed to fetch customization' });
  }
});

/**
 * PUT /api/business-front/:businessId/my-customization
 * Update current user's front page customizations
 */
router.put('/:businessId/my-customization', async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;
    const customizationData = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const customization = await businessFrontPageService.saveUserCustomization(
      businessId,
      userId,
      customizationData
    );

    res.json(customization);
  } catch (error) {
    logSrvErr('businessfrontpage_error_saving_user_customization', 'Error saving user customization:', error);
    if (error instanceof Error && error.message.includes('not enabled')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to save customization' });
    }
  }
});

/**
 * DELETE /api/business-front/:businessId/my-customization
 * Reset current user's front page customizations
 */
router.delete('/:businessId/my-customization', async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await businessFrontPageService.resetUserCustomization(businessId, userId);
    res.status(204).send();
  } catch (error) {
    logSrvErr('businessfrontpage_error_resetting_user_customization', 'Error resetting user customization:', error);
    res.status(500).json({ error: 'Failed to reset customization' });
  }
});

// ============================================================================
// PREVIEW (Admin Only)
// ============================================================================

/**
 * POST /api/business-front/:businessId/preview
 * Preview front page with temporary configuration (doesn't save)
 */
router.post('/:businessId/preview', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { config, widgets } = req.body;

    // Return preview data without saving
    res.json({
      config: config || await businessFrontPageService.getOrCreateConfig(businessId),
      widgets: widgets || [],
      preview: true
    });
  } catch (error) {
    logSrvErr('businessfrontpage_error_generating_preview', 'Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;

