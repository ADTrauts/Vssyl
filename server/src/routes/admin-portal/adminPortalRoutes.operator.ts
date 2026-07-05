import type { Request, Response } from 'express';
import type express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { requireAdmin } from './adminPortalShared';
import * as adminBusinessOpsService from '../../services/admin/adminBusinessOpsService';
import * as adminEmailOpsService from '../../services/admin/adminEmailOpsService';
import * as adminOperatorSearchService from '../../services/admin/adminOperatorSearchService';
import * as adminOperatorTimelineService from '../../services/admin/adminOperatorTimelineService';

export function registerAdminPortalOperatorRoutes(router: express.Router): void {
  // ============================================================================
  // BUSINESSES OPERATOR HUB
  // ============================================================================

  router.get('/businesses', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : undefined;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const data = await adminBusinessOpsService.listBusinessesForOperator({ page, limit, search });
      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.error('Failed to list businesses for operator', {
        operation: 'admin_operator_businesses_list',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to list businesses' });
    }
  });

  router.get(
    '/businesses/:businessId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const businessId = req.params.businessId;
        if (typeof businessId !== 'string' || !businessId.trim()) {
          return res.status(400).json({ error: 'Invalid business id' });
        }

        const data = await adminBusinessOpsService.getBusinessOperatorDetail(businessId);
        if (!data) {
          return res.status(404).json({ error: 'Business not found' });
        }

        res.json({ success: true, data });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        await logger.error('Failed to get business operator detail', {
          operation: 'admin_operator_business_detail',
          error: { message: err.message, stack: err.stack },
        });
        res.status(500).json({ error: 'Failed to get business detail' });
      }
    },
  );

  // ============================================================================
  // EMAIL OPERATIONS
  // ============================================================================

  router.get('/email-operations', authenticateJWT, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const data = await adminEmailOpsService.getEmailOperationsStatus();
      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.error('Failed to get email operations status', {
        operation: 'admin_email_operations_status',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to get email operations status' });
    }
  });

  router.get(
    '/email-operations/templates/:templateId/preview',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const templateId = req.params.templateId;
        if (typeof templateId !== 'string' || !templateId.trim()) {
          return res.status(400).json({ error: 'Invalid template id' });
        }

        const data = adminEmailOpsService.getEmailTemplatePreview(templateId);
        if (!data) {
          return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ success: true, data });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        await logger.error('Failed to preview email template', {
          operation: 'admin_email_template_preview',
          error: { message: err.message, stack: err.stack },
        });
        res.status(500).json({ error: 'Failed to preview template' });
      }
    },
  );

  // ============================================================================
  // GLOBAL OPERATOR SEARCH
  // ============================================================================

  router.get('/operator/search', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const results = await adminOperatorSearchService.searchOperatorConsole(q);
      res.json({ success: true, data: { query: q, results } });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.error('Failed operator search', {
        operation: 'admin_operator_search',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // ============================================================================
  // SYSTEM TIMELINE
  // ============================================================================

  router.get('/operator/timeline', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 25;
      const entries = await adminOperatorTimelineService.getOperatorTimeline(limit);
      res.json({ success: true, data: entries });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.error('Failed to get operator timeline', {
        operation: 'admin_operator_timeline',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to load timeline' });
    }
  });
}
