import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestDataAllModules() {
  try {
    console.log('🔧 Creating test data for all searchable modules...');

    // Get the first user
    let user = await prisma.user.findFirst();
    if (!user) {
      console.log('No users found, creating a test user...');
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test User',
        },
      });
      user = newUser;
    }

    console.log('Using user:', user.email);

    // 1. Create test dashboards
    console.log('\n📊 Creating test dashboards...');
    const dashboards = await Promise.all([
      prisma.dashboard.create({
        data: {
          name: 'My Work Dashboard',
          userId: user.id,
          layout: {},
          preferences: {},
        },
      }),
      prisma.dashboard.create({
        data: {
          name: 'Personal Projects',
          userId: user.id,
          layout: {},
          preferences: {},
        },
      }),
      prisma.dashboard.create({
        data: {
          name: 'Analytics Overview',
          userId: user.id,
          layout: {},
          preferences: {},
        },
      }),
    ]);

    console.log('Created dashboards:', dashboards.map(d => d.name));

    // 2. Create test conversations and messages
    console.log('\n💬 Creating test conversations and messages...');
    
    // Create a conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: 'Project Discussion',
        type: 'GROUP',
        participants: {
          create: {
            userId: user.id,
            role: 'MEMBER',
            isActive: true,
          },
        },
      },
    });

    console.log('Created conversation:', conversation.name);

    // Create messages in the conversation
    const messages = await Promise.all([
      prisma.message.create({
        data: {
          content: 'Hello everyone! How is the project going?',
          senderId: user.id,
          conversationId: conversation.id,
          type: 'TEXT',
        },
      }),
      prisma.message.create({
        data: {
          content: 'I think we should discuss the timeline for the next phase.',
          senderId: user.id,
          conversationId: conversation.id,
          type: 'TEXT',
        },
      }),
      prisma.message.create({
        data: {
          content: 'Can someone share the latest updates on the drive integration?',
          senderId: user.id,
          conversationId: conversation.id,
          type: 'TEXT',
        },
      }),
      prisma.message.create({
        data: {
          content: 'I found some interesting files in the shared drive folder.',
          senderId: user.id,
          conversationId: conversation.id,
          type: 'TEXT',
        },
      }),
    ]);

    console.log('Created messages:', messages.map(m => m.content.substring(0, 30) + '...'));

    // Create another conversation
    const conversation2 = await prisma.conversation.create({
      data: {
        name: 'Team Chat',
        type: 'GROUP',
        participants: {
          create: {
            userId: user.id,
            role: 'MEMBER',
            isActive: true,
          },
        },
      },
    });

    console.log('Created conversation:', conversation2.name);

    // Create messages in the second conversation
    const messages2 = await Promise.all([
      prisma.message.create({
        data: {
          content: 'Good morning team!',
          senderId: user.id,
          conversationId: conversation2.id,
          type: 'TEXT',
        },
      }),
      prisma.message.create({
        data: {
          content: 'I need help with the search functionality in our app.',
          senderId: user.id,
          conversationId: conversation2.id,
          type: 'TEXT',
        },
      }),
      prisma.message.create({
        data: {
          content: 'The global search feature is working great now!',
          senderId: user.id,
          conversationId: conversation2.id,
          type: 'TEXT',
        },
      }),
    ]);

    console.log('Created messages in Team Chat:', messages2.map(m => m.content.substring(0, 30) + '...'));

    // 3. Create more test files with searchable content
    console.log('\n📁 Creating additional test files...');
    
    const additionalFiles = await Promise.all([
      prisma.file.create({
        data: {
          name: 'search-test-document.txt',
          type: 'text/plain',
          size: 1024,
          url: '/uploads/search-test-document.txt',
          userId: user.id,
        },
      }),
      prisma.file.create({
        data: {
          name: 'chat-log-export.csv',
          type: 'text/csv',
          size: 2048,
          url: '/uploads/chat-log-export.csv',
          userId: user.id,
        },
      }),
      prisma.file.create({
        data: {
          name: 'dashboard-config.json',
          type: 'application/json',
          size: 512,
          url: '/uploads/dashboard-config.json',
          userId: user.id,
        },
      }),
    ]);

    console.log('Created additional files:', additionalFiles.map(f => f.name));

    console.log('\n✅ Test data created successfully for all modules!');
    console.log('📊 Dashboards:', dashboards.length);
    console.log('💬 Conversations:', 2);
    console.log('💬 Messages:', messages.length + messages2.length);
    console.log('📁 Additional files:', additionalFiles.length);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDataAllModules(); 