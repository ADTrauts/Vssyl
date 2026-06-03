/**
 * Notebook Module Automatic Seeding
 *
 * Facade product over Notes + Todo — no separate Notebook storage.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedNotebookModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking Notebook module registration', { operation: 'seed_notebook_module_start' });

    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'notebook' },
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Notebook module seed skipped because database is not available during startup', {
          operation: 'seed_notebook_module_db_unavailable',
        });
        return;
      }
      throw dbError;
    }

    if (existing) {
      void logger.debug('Notebook module already registered', { operation: 'seed_notebook_module_exists' });
      return;
    }

    void logger.info('Creating Notebook module record', { operation: 'seed_notebook_module_create' });

    let systemUser;
    try {
      systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!systemUser) {
        systemUser = await prisma.user.findFirst({
          orderBy: { createdAt: 'asc' },
        });
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Notebook module seed skipped because database connection was lost during seeding', {
          operation: 'seed_notebook_module_db_lost',
        });
        return;
      }
      throw dbError;
    }

    if (!systemUser) {
      void logger.warn('No user found. Notebook module seed will retry on next startup', {
        operation: 'seed_notebook_module_no_user',
      });
      return;
    }

    await prisma.module.create({
      data: {
        id: 'notebook',
        name: 'Notebook',
        description:
          'Meeting pages, project notes, and tasks in one workspace — built on Notes and To-Do (no duplicate storage).',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['notebook', 'pages', 'meeting notes', 'tasks', 'productivity', 'personal', 'business'],
        icon: 'book-open',
        screenshots: [],
        developerId: systemUser.id,
        status: 'APPROVED',
        downloads: 0,
        rating: 0,
        reviewCount: 0,
        pricingTier: 'free',
        basePrice: 0,
        enterprisePrice: 0,
        isProprietary: true,
        revenueSplit: 0,
        manifest: {
          name: 'Notebook',
          version: '1.0.0',
          description: 'Unified pages and tasks facade over Notes and To-Do',
          author: 'Vssyl',
          license: 'proprietary',
          personalContext: true,
          businessContext: true,
          householdContext: false,
          requiresOrgChart: false,
          minimumTier: 'free',
          routes: {
            personal: '/notebook',
            business: '/business/[id]/workspace/notebook',
          },
          permissions: ['notes:read', 'notes:write', 'todo:read', 'todo:write'],
          features: {
            personal: { pages: true, tasks: true, templates: true },
            business: { pages: true, tasks: true, templates: true },
          },
          dependencies: ['notes', 'todo'],
          runtime: {
            apiVersion: '1.0',
            endpoints: {
              notes: '/api/notes',
              todo: '/api/todo',
            },
          },
          frontend: {
            entryUrl: '/notebook',
            personalUrl: '/notebook',
            businessUrl: '/business/[id]/workspace/notebook',
          },
          settings: {
            defaultView: 'home',
          },
          notifications: [],
        },
        dependencies: ['notes', 'todo'],
        permissions: ['notes:read', 'notes:write', 'todo:read', 'todo:write'],
      },
    });

    void logger.info('Notebook module registered successfully', { operation: 'seed_notebook_module_success' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Notebook module seed failed; server will continue but Notebook may not be available', {
      operation: 'seed_notebook_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}
