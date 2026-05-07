/**
 * DEBUG MODULE ENDPOINT
 * 
 * Simple endpoint to check if modules exist in database
 * Useful for troubleshooting module registration
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
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

/**
 * List all modules in database (no auth required for debugging)
 * GET /api/debug/modules
 */
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const modules = await prisma.module.findMany({
      select: {
        id: true,
        name: true,
        version: true,
        category: true,
        status: true,
        pricingTier: true,
        isProprietary: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const aiContexts = await prisma.moduleAIContextRegistry.count();
    
    res.json({
      success: true,
      count: modules.length,
      aiContextsRegistered: aiContexts,
      modules: modules.map(m => ({
        id: m.id,
        name: m.name,
        version: m.version,
        category: m.category,
        status: m.status,
        tier: m.pricingTier,
        proprietary: m.isProprietary,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    logSrvErr('debug_modules_error_fetching_modules', 'Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check specific module by ID
 * GET /api/debug/modules/:id
 */
router.get('/modules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        aiContextRegistry: true
      }
    });
    
    if (!module) {
      return res.status(404).json({
        success: false,
        error: `Module '${id}' not found in database`
      });
    }
    
    res.json({
      success: true,
      module: {
        id: module.id,
        name: module.name,
        version: module.version,
        category: module.category,
        status: module.status,
        pricingTier: module.pricingTier,
        aiContextRegistered: !!module.aiContextRegistry,
        manifest: module.manifest
      }
    });
  } catch (error) {
    logSrvErr('debug_modules_error_fetching_module', 'Error fetching module:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check AI context registration
 * GET /api/debug/ai-contexts
 */
router.get('/ai-contexts', async (req: Request, res: Response) => {
  try {
    const contexts = await prisma.moduleAIContextRegistry.findMany({
      select: {
        moduleId: true,
        moduleName: true,
        category: true,
        version: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      count: contexts.length,
      contexts
    });
  } catch (error) {
    logSrvErr('debug_modules_error_fetching_ai_contexts', 'Error fetching AI contexts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI contexts'
    });
  }
});

export default router;

