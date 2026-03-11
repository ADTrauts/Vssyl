/**
 * Notes Module Automatic Seeding
 *
 * Runs on server startup to ensure Notes module exists in database
 * Makes it available in the marketplace for users to install
 */

import { prisma } from '../lib/prisma';

export async function seedNotesModuleOnStartup(): Promise<void> {
  try {
    console.log('📦 Checking Notes module registration...');

    let existing;
    try {
      existing = await prisma.module.findUnique({
        where: { id: 'notes' },
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      if (errorMessage.includes("Can't reach database") || errorMessage.includes('localhost:5432')) {
        console.log('   ⚠️  Database not available during startup');
        console.log('   Notes module seed will be skipped');
        console.log('   Server will continue, but Notes module may not be available.\n');
        return;
      }
      throw dbError;
    }

    if (existing) {
      console.log('   ✅ Notes module already registered');
      return;
    }

    console.log('   📝 Creating Notes module record...');

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
        console.log('   ⚠️  Database connection lost during seeding');
        console.log('   Notes module seed will be skipped');
        console.log('   Server will continue, but Notes module may not be available.\n');
        return;
      }
      throw dbError;
    }

    if (!systemUser) {
      console.warn('   ⚠️  No user found. Notes module seed will retry on next startup.');
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

    console.log('   ✅ Notes module registered successfully');
  } catch (error) {
    console.error('   ❌ Notes module seed failed:', error);
    console.error('   Server will continue, but Notes module may not be available.');
  }
}
