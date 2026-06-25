import type { Request, Response } from 'express';
import type express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { logger } from '../../lib/logger';
import { requireAdmin } from './adminPortalShared';
import * as platformAdoptionService from '../../services/admin/platformAdoptionService.js';

export function registerAdminPortalAdoptionRoutes(router: express.Router): void {
  router.get('/platform-adoption', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const data = await platformAdoptionService.getPlatformAdoptionDashboard();

      await logger.info('Admin retrieved platform adoption dashboard', {
        operation: 'admin_get_platform_adoption',
        adminId: adminUser.id,
        moduleCount: data.modules.length,
      });

      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      await logger.error('Failed to get platform adoption dashboard', {
        operation: 'admin_get_platform_adoption',
        error: { message: err.message, stack: err.stack },
      });
      res.status(500).json({ error: 'Failed to get platform adoption dashboard' });
    }
  });

  router.get(
    '/platform-adoption/validation',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminUser = req.user;
        if (!adminUser) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const validation = platformAdoptionService.getPlatformAdoptionValidation();

        res.json({ success: true, data: validation });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        await logger.error('Failed to get platform adoption validation', {
          operation: 'admin_get_platform_adoption_validation',
          error: { message: err.message, stack: err.stack },
        });
        res.status(500).json({ error: 'Failed to get platform adoption validation' });
      }
    },
  );

  router.get(
    '/platform-adoption/:moduleId',
    authenticateJWT,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const adminUser = req.user;
        if (!adminUser) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const moduleId = req.params.moduleId;
        if (typeof moduleId !== 'string') {
          return res.status(400).json({ error: 'Invalid module id' });
        }

        const detail = platformAdoptionService.getPlatformAdoptionModuleDetail(moduleId);

        await logger.info('Admin retrieved platform adoption module detail', {
          operation: 'admin_get_platform_adoption_module',
          adminId: adminUser.id,
          moduleId,
        });

        res.json({ success: true, data: detail });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        if (err.message.startsWith('Unknown adoption module')) {
          return res.status(404).json({ error: err.message });
        }
        await logger.error('Failed to get platform adoption module detail', {
          operation: 'admin_get_platform_adoption_module',
          moduleId: req.params.moduleId,
          error: { message: err.message, stack: err.stack },
        });
        res.status(500).json({ error: 'Failed to get platform adoption module detail' });
      }
    },
  );
}
