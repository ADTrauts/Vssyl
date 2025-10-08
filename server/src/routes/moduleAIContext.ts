/**
 * MODULE AI CONTEXT API ROUTES
 * 
 * Endpoints for:
 * - Module developers to register/update their AI context
 * - AI system to query module contexts
 * - Admin portal to view module analytics
 * 
 * NOTE: TypeScript errors for Prisma models will be resolved after running:
 * npx prisma migrate dev --name add_module_ai_context_registry
 */

import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { moduleAIContextService } from '../ai/services/ModuleAIContextService';
import type { ModuleAIContext } from '../../../shared/src/types/module-ai-context';
import { prisma } from '../lib/prisma';

const router: Router = Router();

// ============================================================================
// MODULE DEVELOPER ENDPOINTS
// ============================================================================

/**
 * Register or update a module's AI context
 * POST /api/modules/:moduleId/ai/context
 */
router.post(
  '/modules/:moduleId/ai/context',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const aiContext: ModuleAIContext = req.body;
      const userId = (req as any).user.id;

      // Verify user owns this module or is admin
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }

      if (module.developerId !== userId && (req as any).user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only module owner can update AI context' });
      }

      // Validate AI context structure
      if (!aiContext.purpose || !aiContext.category || !aiContext.keywords) {
        return res.status(400).json({
          error: 'Invalid AI context: must include purpose, category, and keywords',
        });
      }

      // Register/update in registry
      const registered = await moduleAIContextService.registerModuleContext(
        moduleId,
        module.name,
        aiContext
      );

      res.json({
        success: true,
        message: 'Module AI context registered successfully',
        registry: registered,
      });
    } catch (error: any) {
      console.error('Error registering module AI context:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get a module's AI context registry entry
 * GET /api/modules/:moduleId/ai/context
 */
router.get(
  '/modules/:moduleId/ai/context',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;

      const registry = await prisma.moduleAIContextRegistry.findUnique({
        where: { moduleId },
      });

      if (!registry) {
        return res.status(404).json({ error: 'Module AI context not found' });
      }

      res.json(registry);
    } catch (error: any) {
      console.error('Error getting module AI context:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// AI SYSTEM ENDPOINTS (Internal use)
// ============================================================================

/**
 * Analyze a query to find relevant modules
 * POST /api/ai/analyze-query
 */
router.post(
  '/ai/analyze-query',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      const userId = (req as any).user.id;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const analysis = await moduleAIContextService.analyzeQuery(query, userId);

      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing query:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Fetch context from a specific module context provider
 * GET /api/modules/:moduleId/ai/fetch-context/:providerName
 */
router.get(
  '/modules/:moduleId/ai/fetch-context/:providerName',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { moduleId, providerName } = req.params;
      const userId = (req as any).user.id;
      const parameters = req.query;

      const context = await moduleAIContextService.fetchModuleContext(
        moduleId,
        providerName,
        userId,
        parameters as Record<string, any>
      );

      res.json(context);
    } catch (error: any) {
      console.error('Error fetching module context:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Clear user's AI context cache
 * DELETE /api/ai/context-cache
 */
router.delete(
  '/ai/context-cache',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      await moduleAIContextService.clearUserContextCache(userId);

      res.json({
        success: true,
        message: 'AI context cache cleared successfully',
      });
    } catch (error: any) {
      console.error('Error clearing context cache:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Invalidate cache for a specific module
 * DELETE /api/modules/:moduleId/ai/cache
 */
router.delete(
  '/modules/:moduleId/ai/cache',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;

      await moduleAIContextService.invalidateModuleCache(moduleId);

      res.json({
        success: true,
        message: `Cache invalidated for module: ${moduleId}`,
      });
    } catch (error: any) {
      console.error('Error invalidating module cache:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// ADMIN PORTAL ENDPOINTS
// ============================================================================

/**
 * Get all module AI context registries (admin only)
 * GET /api/admin/modules/ai/registry
 */
router.get(
  '/admin/modules/ai/registry',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const registries = await prisma.moduleAIContextRegistry.findMany({
        include: {
          module: {
            select: {
              id: true,
              name: true,
              category: true,
              status: true,
              downloads: true,
            },
          },
        },
        orderBy: { lastUpdated: 'desc' },
      });

      res.json(registries);
    } catch (error: any) {
      console.error('Error getting module registries:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get module analytics (admin only)
 * GET /api/admin/modules/:moduleId/ai/analytics
 */
router.get(
  '/admin/modules/:moduleId/ai/analytics',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const analytics = await moduleAIContextService.getModuleAnalytics(moduleId, days);

      res.json(analytics);
    } catch (error: any) {
      console.error('Error getting module analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get all module performance metrics (admin only)
 * GET /api/admin/modules/ai/performance
 */
router.get(
  '/admin/modules/ai/performance',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await prisma.moduleAIPerformanceMetric.findMany({
        where: {
          date: { gte: startDate },
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [
          { moduleId: 'asc' },
          { date: 'desc' },
        ],
      });

      // Group by module and calculate aggregates
      const modulePerformance = metrics.reduce((acc: any, metric: any) => {
        const moduleId = metric.moduleId;
        if (!acc[moduleId]) {
          acc[moduleId] = {
            moduleId,
            moduleName: metric.module.name,
            moduleCategory: metric.module.category,
            metrics: [],
            totals: {
              queries: 0,
              successfulQueries: 0,
              failedQueries: 0,
              totalLatency: 0,
              queryCount: 0,
            },
          };
        }

        acc[moduleId].metrics.push(metric);
        acc[moduleId].totals.queries += metric.totalQueries;
        acc[moduleId].totals.successfulQueries += metric.successfulQueries;
        acc[moduleId].totals.failedQueries += metric.failedQueries;
        acc[moduleId].totals.totalLatency += metric.averageLatency * metric.totalQueries;
        acc[moduleId].totals.queryCount += metric.totalQueries;

        return acc;
      }, {});

      // Calculate averages
      Object.values(modulePerformance).forEach((module: any) => {
        module.averageLatency =
          module.totals.queryCount > 0
            ? module.totals.totalLatency / module.totals.queryCount
            : 0;
        module.successRate =
          module.totals.queries > 0
            ? (module.totals.successfulQueries / module.totals.queries) * 100
            : 0;
      });

      res.json({
        startDate,
        endDate: new Date(),
        modules: Object.values(modulePerformance),
      });
    } catch (error: any) {
      console.error('Error getting module performance:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Search modules by category (admin only)
 * GET /api/admin/modules/ai/category/:category
 */
router.get(
  '/admin/modules/ai/category/:category',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;

      const modules = await moduleAIContextService.getModulesByCategory(category);

      res.json(modules);
    } catch (error: any) {
      console.error('Error getting modules by category:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Search modules by keywords (admin only)
 * POST /api/admin/modules/ai/search-keywords
 */
router.post(
  '/admin/modules/ai/search-keywords',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { keywords } = req.body;

      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({ error: 'Keywords array is required' });
      }

      const modules = await moduleAIContextService.searchByKeywords(keywords);

      res.json(modules);
    } catch (error: any) {
      console.error('Error searching modules by keywords:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Manually trigger built-in module registration (admin only)
 * POST /api/admin/modules/ai/register-built-ins
 * 
 * This endpoint allows admins to manually register the built-in modules
 * (Drive, Chat, Calendar) if the automatic registration during deployment failed.
 */
router.post(
  '/admin/modules/ai/register-built-ins',
  authenticateJWT,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      console.log('🤖 Admin-triggered manual module registration starting...');

      const modulesToRegister = [
        {
          moduleId: 'drive',
          aiContext: {
            purpose: 'File and folder storage with organization, sharing, and versioning capabilities',
            category: 'PRODUCTIVITY',
            keywords: ['file', 'folder', 'document', 'storage', 'drive', 'upload', 'download', 'share', 'organize'],
            patterns: [
              'files? (in|from|on) (my )?drive',
              'folders? (in|from|on) (my )?drive',
              'upload (a |the )?file',
              'create (a )?folder',
              'share (this |the )?file',
              'storage space',
              'recent (files?|documents?)',
            ],
            concepts: ['file management', 'cloud storage', 'document organization', 'sharing', 'collaboration'],
            entities: ['File', 'Folder', 'Drive', 'Storage'],
            actions: ['create folder', 'upload file', 'download file', 'share file', 'move file', 'delete file', 'rename', 'organize'],
            contextProviders: [
              {
                name: 'recent_files',
                description: 'Get user\'s recently accessed or modified files',
                endpoint: '/api/drive/ai/context/recent',
                cacheMinutes: 5,
              },
              {
                name: 'storage_overview',
                description: 'Get storage usage and quota information',
                endpoint: '/api/drive/ai/context/storage',
                cacheMinutes: 15,
              },
              {
                name: 'file_count',
                description: 'Query file and folder counts',
                endpoint: '/api/drive/ai/query/count',
                cacheMinutes: 10,
              },
            ],
          }
        },
        {
          moduleId: 'chat',
          aiContext: {
            purpose: 'Real-time messaging and communication between users',
            category: 'COMMUNICATION',
            keywords: ['message', 'chat', 'conversation', 'talk', 'send', 'reply', 'unread'],
            patterns: [
              'messages?',
              'chats?',
              'conversations?',
              'unread messages?',
              'send (a )?message',
              'talk to',
              'contact',
            ],
            concepts: ['messaging', 'communication', 'conversations', 'real-time chat'],
            entities: ['Message', 'Conversation', 'Chat'],
            actions: ['send message', 'read messages', 'start conversation', 'reply'],
            contextProviders: [
              {
                name: 'recent_conversations',
                description: 'Get user\'s recent chat conversations',
                endpoint: '/api/chat/ai/context/recent',
                cacheMinutes: 2,
              },
              {
                name: 'unread_messages',
                description: 'Get count and preview of unread messages',
                endpoint: '/api/chat/ai/context/unread',
                cacheMinutes: 1,
              },
              {
                name: 'conversation_history',
                description: 'Query conversation history with a specific user',
                endpoint: '/api/chat/ai/query/history',
                cacheMinutes: 5,
              },
            ],
          }
        },
        {
          moduleId: 'calendar',
          aiContext: {
            purpose: 'Event scheduling and calendar management',
            category: 'PRODUCTIVITY',
            keywords: ['event', 'calendar', 'meeting', 'appointment', 'schedule', 'availability', 'busy', 'free'],
            patterns: [
              'events?',
              'meetings?',
              'appointments?',
              'calendar',
              'schedule',
              'availability',
              'free time',
              'busy',
              'today',
              'tomorrow',
              'this week',
            ],
            concepts: ['time management', 'scheduling', 'event planning', 'availability'],
            entities: ['Event', 'Calendar', 'Meeting', 'Appointment'],
            actions: ['create event', 'schedule meeting', 'check availability', 'cancel event', 'update event'],
            contextProviders: [
              {
                name: 'upcoming_events',
                description: 'Get user\'s upcoming calendar events',
                endpoint: '/api/calendar/ai/context/upcoming',
                cacheMinutes: 5,
              },
              {
                name: 'today_events',
                description: 'Get events scheduled for today',
                endpoint: '/api/calendar/ai/context/today',
                cacheMinutes: 15,
              },
              {
                name: 'availability',
                description: 'Check user availability for a given time period',
                endpoint: '/api/calendar/ai/query/availability',
                cacheMinutes: 10,
              },
            ],
          }
        },
      ];

      const results = [];

      for (const { moduleId, aiContext } of modulesToRegister) {
        try {
          console.log(`📝 Registering: ${moduleId}...`);
          
          const result = await moduleAIContextService.registerModuleContext(
            moduleId,
            aiContext as ModuleAIContext
          );

          results.push({
            moduleId,
            success: true,
            result,
          });

          console.log(`✅ Registered: ${moduleId}`);
        } catch (error: any) {
          console.error(`❌ Error registering ${moduleId}:`, error.message);
          results.push({
            moduleId,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`\n✅ Registration complete: ${successCount} succeeded, ${failCount} failed\n`);

      res.json({
        success: successCount > 0,
        message: `Registered ${successCount} of ${modulesToRegister.length} modules`,
        results,
      });

    } catch (error: any) {
      console.error('Error in manual module registration:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

