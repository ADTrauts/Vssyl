/**
 * STARTUP MODULE REGISTRATION
 * 
 * This module runs automatically when the server starts.
 * It checks if the Module AI Context Registry is empty and registers
 * built-in modules if needed.
 * 
 * This is the PROPER way to handle registration because:
 * - Server has full database access
 * - Runs in production environment
 * - Non-blocking (doesn't prevent server startup)
 * - Can retry on server restart
 */

import { PrismaClient } from '@prisma/client';
import type { ModuleAIContext } from '../../../shared/src/types/module-ai-context';
import { prisma } from '../lib/prisma';

// ============================================================================
// BUILT-IN MODULE AI CONTEXTS
// ============================================================================

const BUILT_IN_MODULES: Array<{ moduleId: string; moduleName: string; aiContext: ModuleAIContext }> = [
  {
    moduleId: 'drive',
    moduleName: 'Drive',
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
      entities: [
        { name: 'File', pluralName: 'Files', description: 'A file stored in the drive' },
        { name: 'Folder', pluralName: 'Folders', description: 'A folder for organizing files' },
        { name: 'Drive', pluralName: 'Drives', description: 'Cloud storage space' },
      ],
      actions: [
        { name: 'create_folder', description: 'Create a new folder', permissions: ['drive:write'] },
        { name: 'upload_file', description: 'Upload a file to drive', permissions: ['drive:write'] },
        { name: 'download_file', description: 'Download a file from drive', permissions: ['drive:read'] },
        { name: 'share_file', description: 'Share a file with others', permissions: ['drive:write', 'drive:share'] },
        { name: 'delete_file', description: 'Delete a file or folder', permissions: ['drive:delete'] },
      ],
      contextProviders: [
        {
          name: 'recent_files',
          description: 'Get user\'s recently accessed or modified files',
          endpoint: '/api/drive/ai/context/recent',
          cacheDuration: 300000, // 5 minutes
        },
        {
          name: 'storage_overview',
          description: 'Get storage usage and quota information',
          endpoint: '/api/drive/ai/context/storage',
          cacheDuration: 900000, // 15 minutes
        },
        {
          name: 'file_count',
          description: 'Query file and folder counts',
          endpoint: '/api/drive/ai/query/count',
          cacheDuration: 600000, // 10 minutes
        },
      ],
    },
  },
  {
    moduleId: 'chat',
    moduleName: 'Chat',
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
      entities: [
        { name: 'Message', pluralName: 'Messages', description: 'A chat message' },
        { name: 'Conversation', pluralName: 'Conversations', description: 'A chat conversation thread' },
        { name: 'Chat', pluralName: 'Chats', description: 'Real-time messaging system' },
      ],
      actions: [
        { name: 'send_message', description: 'Send a message to a user', permissions: ['chat:write'] },
        { name: 'read_messages', description: 'Read chat messages', permissions: ['chat:read'] },
        { name: 'start_conversation', description: 'Start a new conversation', permissions: ['chat:write'] },
      ],
      contextProviders: [
        {
          name: 'recent_conversations',
          description: 'Get user\'s recent chat conversations',
          endpoint: '/api/chat/ai/context/recent',
          cacheDuration: 120000, // 2 minutes
        },
        {
          name: 'unread_messages',
          description: 'Get count and preview of unread messages',
          endpoint: '/api/chat/ai/context/unread',
          cacheDuration: 60000, // 1 minute
        },
        {
          name: 'conversation_history',
          description: 'Query conversation history with a specific user',
          endpoint: '/api/chat/ai/query/history',
          cacheDuration: 300000, // 5 minutes
        },
      ],
    },
  },
  {
    moduleId: 'calendar',
    moduleName: 'Calendar',
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
      entities: [
        { name: 'Event', pluralName: 'Events', description: 'A calendar event' },
        { name: 'Meeting', pluralName: 'Meetings', description: 'A scheduled meeting' },
        { name: 'Appointment', pluralName: 'Appointments', description: 'A scheduled appointment' },
      ],
      actions: [
        { name: 'create_event', description: 'Create a calendar event', permissions: ['calendar:write'] },
        { name: 'schedule_meeting', description: 'Schedule a meeting', permissions: ['calendar:write'] },
        { name: 'check_availability', description: 'Check user availability', permissions: ['calendar:read'] },
        { name: 'cancel_event', description: 'Cancel an event', permissions: ['calendar:write'] },
      ],
      contextProviders: [
        {
          name: 'upcoming_events',
          description: 'Get user\'s upcoming calendar events',
          endpoint: '/api/calendar/ai/context/upcoming',
          cacheDuration: 300000, // 5 minutes
        },
        {
          name: 'today_events',
          description: 'Get events scheduled for today',
          endpoint: '/api/calendar/ai/context/today',
          cacheDuration: 900000, // 15 minutes
        },
        {
          name: 'availability',
          description: 'Check user availability for a given time period',
          endpoint: '/api/calendar/ai/query/availability',
          cacheDuration: 600000, // 10 minutes
        },
      ],
    },
  },
];

// ============================================================================
// REGISTRATION LOGIC
// ============================================================================

/**
 * Register a single module's AI context
 */
async function registerModule(moduleId: string, moduleName: string, aiContext: ModuleAIContext): Promise<boolean> {
  try {
    console.log(`   📝 Registering: ${moduleName}...`);

    // Check if module exists in the modules table
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      console.log(`   ⚠️  Module '${moduleId}' not found in database, skipping...`);
      return false;
    }

    // Check if already registered
    const existing = await prisma.moduleAIContextRegistry.findUnique({
      where: { moduleId },
    });

    if (existing) {
      console.log(`   ✅ ${moduleName} already registered`);
      return true;
    }

    // Register the module
    await prisma.moduleAIContextRegistry.create({
      data: {
        moduleId,
        moduleName,
        purpose: aiContext.purpose,
        category: aiContext.category,
        keywords: aiContext.keywords,
        patterns: aiContext.patterns,
        concepts: aiContext.concepts,
        entities: aiContext.entities as any,
        actions: aiContext.actions as any,
        contextProviders: aiContext.contextProviders as any,
        relationships: (aiContext.relationships || []) as any,
        fullAIContext: aiContext as any,
        version: '1.0.0',
      },
    });

    console.log(`   ✅ ${moduleName} registered successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error registering ${moduleName}:`, error);
    return false;
  }
}

/**
 * Main function - checks and registers built-in modules
 * This is called during server startup
 */
export async function registerBuiltInModulesOnStartup(): Promise<void> {
  try {
    console.log('\n🤖 ============================================');
    console.log('🤖 Module AI Context Registry - Startup Check');
    console.log('🤖 ============================================\n');

    // Check if registry is empty
    const registryCount = await prisma.moduleAIContextRegistry.count();

    if (registryCount > 0) {
      console.log(`✅ Registry already populated (${registryCount} modules registered)`);
      console.log('   Skipping built-in module registration\n');
      return;
    }

    console.log('📦 Registry is empty, registering built-in modules...\n');

    // Register each built-in module
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const { moduleId, moduleName, aiContext } of BUILT_IN_MODULES) {
      const success = await registerModule(moduleId, moduleName, aiContext);
      if (success) {
        successCount++;
      } else {
        // Check if it was skipped (module doesn't exist) or error
        const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
        if (!moduleExists) {
          skipCount++;
        } else {
          errorCount++;
        }
      }
    }

    console.log('\n📊 Registration Summary:');
    console.log(`   ✅ Registered: ${successCount}`);
    if (skipCount > 0) console.log(`   ⚠️  Skipped: ${skipCount} (modules not found in database)`);
    if (errorCount > 0) console.log(`   ❌ Errors: ${errorCount}`);
    console.log('');

    if (successCount > 0) {
      console.log('✅ Built-in modules registered successfully!');
      console.log('   AI can now access Drive, Chat, and Calendar context.\n');
    } else {
      console.warn('⚠️  No modules were registered. Check database for module entries.\n');
    }
  } catch (error) {
    console.error('❌ Error during module registration startup:');
    console.error(error);
    console.error('\nServer will continue running, but AI may have limited context.');
    console.error('You can manually trigger registration via: POST /api/admin/modules/ai/register-built-ins\n');
  }
}

/**
 * Cleanup function (called when server shuts down)
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

