/**
 * To-Do Module Automatic Seeding
 * 
 * Runs on server startup to ensure To-Do module exists in database
 * Makes it available in the marketplace for users to install
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function seedTodoModuleOnStartup(): Promise<void> {
  try {
    void logger.debug('Checking To-Do module registration', { operation: 'seed_todo_module_start' });
    
    // Check if To-Do module already exists
    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'todo' }
      });
    } catch (dbError) {
      // Database might not be available during startup
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('To-Do module seed skipped because database is not available during startup', {
          operation: 'seed_todo_module_db_unavailable',
        });
        return;
      }
      // Re-throw if it's a different database error
      throw dbError;
    }
    
    if (existing) {
      void logger.debug('To-Do module already registered', { operation: 'seed_todo_module_exists' });
      return;
    }
    
    void logger.info('Creating To-Do module record', { operation: 'seed_todo_module_create' });
    
    // Get a user to be the developer (first admin, or first user if no admin)
    let systemUser;
    try {
      systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      if (!systemUser) {
        systemUser = await prisma.user.findFirst({
          orderBy: { createdAt: 'asc' }
        });
      }
    } catch (dbError) {
      // Database connection lost during seeding
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        void logger.warn('To-Do module seed skipped because database connection was lost during seeding', {
          operation: 'seed_todo_module_db_lost',
        });
        return;
      }
      throw dbError;
    }
    
    if (!systemUser) {
      void logger.warn('No user found. To-Do module seed will retry on next startup', {
        operation: 'seed_todo_module_no_user',
      });
      return;
    }
    
    // Create To-Do module
    await prisma.module.create({
      data: {
        id: 'todo',
        name: 'To-Do',
        description: 'AI-powered task and to-do management with prioritization, scheduling, and context-aware features. Works for both personal and business contexts.',
        version: '1.0.0',
        category: 'PRODUCTIVITY',
        tags: ['todo', 'tasks', 'productivity', 'ai', 'smart', 'personal', 'business'],
        icon: 'CheckSquare',
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
          name: 'To-Do',
          version: '1.0.0',
          description: 'AI-powered task and to-do management',
          author: 'Vssyl',
          license: 'proprietary',
          personalContext: true,
          businessContext: true,
          householdContext: true,
          requiresOrgChart: false,
          minimumTier: 'free',
          routes: {
            personal: '/todo',
            business: '/business/[id]/workspace/todo',
            household: '/household/[id]/todo'
          },
          permissions: [
            'todo:read',
            'todo:write',
            'todo:assign',
            'todo:delete'
          ],
          features: {
            personal: {
              tasks: true,
              subtasks: true,
              recurring: true,
              dependencies: true,
              attachments: true,
              comments: true
            },
            business: {
              tasks: true,
              subtasks: true,
              recurring: true,
              dependencies: true,
              attachments: true,
              comments: true,
              assignment: true,
              watchers: true,
              teamCollaboration: true
            },
            household: {
              tasks: true,
              subtasks: true,
              recurring: true,
              familySharing: true
            }
          },
          dependencies: [],
          runtime: {
            apiVersion: '1.0',
            endpoints: {
              tasks: '/api/todo/tasks',
              ai: '/api/todo/ai'
            }
          },
          frontend: {
            entryUrl: '/todo',
            personalUrl: '/todo',
            businessUrl: '/business/[id]/workspace/todo',
            householdUrl: '/household/[id]/todo'
          },
          settings: {
            defaultView: 'list',
            enableBoardView: true,
            enableCalendarView: true,
            enableAI: true
          }
        },
        dependencies: [],
        permissions: [
          'todo:read',
          'todo:write',
          'todo:assign',
          'todo:delete'
        ]
      }
    });
    
    void logger.info('To-Do module registered successfully', { operation: 'seed_todo_module_success' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('To-Do module seed failed; server will continue but To-Do module may not be available', {
      operation: 'seed_todo_module_failure',
      error: { message: err.message, stack: err.stack },
    });
  }
}

