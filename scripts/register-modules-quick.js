#!/usr/bin/env node

/**
 * QUICK FIX: Register built-in modules
 * This is a simplified Node.js version (no TypeScript) that can run immediately
 * 
 * Usage: node scripts/register-modules-quick.js
 */

const https = require('https');

const API_BASE = 'vssyl-server-235369681725.us-central1.run.app';

// Module definitions (simplified from register-built-in-modules.ts)
const MODULES = {
  'drive': {
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
  },
  'chat': {
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
  },
  'calendar': {
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
  },
};

async function registerModule(moduleKey, token) {
  const moduleData = MODULES[moduleKey];
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      aiContext: {
        purpose: moduleData.purpose,
        category: moduleData.category,
        keywords: moduleData.keywords,
        patterns: moduleData.patterns,
        concepts: moduleData.concepts,
        entities: moduleData.entities,
        actions: moduleData.actions,
        contextProviders: moduleData.contextProviders,
      }
    });

    const options = {
      hostname: API_BASE,
      path: `/api/modules/${moduleKey}/ai/context`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Registered: ${moduleKey}`);
          resolve({ module: moduleKey, success: true });
        } else {
          console.error(`❌ Failed to register ${moduleKey}: ${res.statusCode}`);
          console.error(`   Response: ${data}`);
          resolve({ module: moduleKey, success: false, error: data });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error registering ${moduleKey}:`, e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n🤖 ============================================');
  console.log('🤖 QUICK MODULE REGISTRATION');
  console.log('🤖 ============================================\n');

  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: AUTH TOKEN required');
    console.log('\nUsage: node scripts/register-modules-quick.js YOUR_AUTH_TOKEN');
    console.log('\nTo get your token:');
    console.log('1. Open https://vssyl.com in browser');
    console.log('2. Open DevTools (F12)');
    console.log('3. Go to Application > Local Storage > https://vssyl.com');
    console.log('4. Find and copy the value of your auth token\n');
    process.exit(1);
  }

  console.log(`📦 Registering ${Object.keys(MODULES).length} modules...\n`);

  try {
    for (const moduleKey of Object.keys(MODULES)) {
      await registerModule(moduleKey, token);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ All modules registered successfully!');
    console.log('\n🧪 Test the AI now by asking:');
    console.log('   - "What files are in my drive?"');
    console.log('   - "Show me my recent messages"');
    console.log('   - "What\'s on my calendar today?"\n');

  } catch (error) {
    console.error('\n❌ Registration failed:', error.message);
    process.exit(1);
  }
}

main();

