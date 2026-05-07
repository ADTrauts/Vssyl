/**
 * Notes Module Automatic Seeding
 *
 * Runs on server startup to ensure Notes module exists in database
 * Makes it available in the marketplace for users to install
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedNotesModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking Notes module registration', { operation: 'seed_notes_module_start' });

    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'notes' },
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('Notes module seed skipped because database is not available during startup', {
          operation: 'seed_notes_module_db_unavailable',
        });
        return;
      }
      throw dbError;
    }

    if (existing) {
      void logger.debug('Notes module already registered', { operation: 'seed_notes_module_exists' });
      return;
    }

    void logger.info('Creating Notes module record', { operation: 'seed_notes_module_create' });

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
        void logger.warn('Notes module seed skipped because database connection was lost during seeding', {
          operation: 'seed_notes_module_db_lost',
        });
        return;
      }
      throw dbError;
    }

    if (!systemUser) {
      void logger.warn('No user found. Notes module seed will retry on next startup', {
        operation: 'seed_notes_module_no_user',
      });
      return;
    }

    await prisma.module.create({
      data: {
        id: 'notes',
        name: 'Notes',
        description:
          'Rich text notes with tags, search, and organization. Works for both personal and business contexts.',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['notes', 'journal', 'ideas', 'writing', 'personal', 'business'],
        icon: 'file-text',
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
          name: 'Notes',
          version: '1.0.0',
          description: 'Rich text notes with tags, search, and organization',
          author: 'Vssyl',
          license: 'proprietary',
          personalContext: true,
          businessContext: true,
          householdContext: false,
          requiresOrgChart: false,
          minimumTier: 'free',
          routes: {
            personal: '/notes',
            business: '/business/[id]/workspace/notes',
          },
          permissions: ['notes:read', 'notes:write', 'notes:delete'],
          features: {
            personal: {
              notes: true,
              tags: true,
              search: true,
              pinned: true,
            },
            business: {
              notes: true,
              tags: true,
              search: true,
              pinned: true,
            },
          },
          dependencies: [],
          runtime: {
            apiVersion: '1.0',
            endpoints: {
              notes: '/api/notes',
              ai: '/api/notes/ai/context',
            },
          },
          frontend: {
            entryUrl: '/notes',
            personalUrl: '/notes',
            businessUrl: '/business/[id]/workspace/notes',
          },
          settings: {
            defaultView: 'list',
            enableTags: true,
            enablePinned: true,
          },
          notifications: [
            { type: 'notes_shared', title: 'Note shared', description: 'A note was shared with you', category: 'notes' },
          ],
        },
        dependencies: [],
        permissions: ['notes:read', 'notes:write', 'notes:delete'],
      },
    });

    void logger.info('Notes module registered successfully', { operation: 'seed_notes_module_success' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Notes module seed failed; server will continue but Notes module may not be available', {
      operation: 'seed_notes_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}
