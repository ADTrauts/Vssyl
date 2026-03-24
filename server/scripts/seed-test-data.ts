import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...');

    // 1. Create test users
    console.log('\n👥 Creating test users...');
    
    const testUserPassword = await bcrypt.hash('test123', 10);
    
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: testUserPassword,
        name: 'Test User',
        role: 'USER',
        emailVerified: new Date(),
      },
    });

    const businessUserPassword = await bcrypt.hash('business123', 10);
    
    const businessUser = await prisma.user.upsert({
      where: { email: 'business@example.com' },
      update: {},
      create: {
        email: 'business@example.com',
        password: businessUserPassword,
        name: 'Business User',
        role: 'USER',
        emailVerified: new Date(),
      },
    });

    console.log('✅ Test users created/updated');

    // 2. Create test business
    console.log('\n🏢 Creating test business...');
    
    const testBusiness = await prisma.business.upsert({
      where: { id: '8360c889-4839-4e90-ab34-f0a986177965' },
      update: {},
      create: {
        id: '8360c889-4839-4e90-ab34-f0a986177965',
        name: 'Test Business',
        ein: '12-3456789',
        description: 'A test business for development',
        industry: 'Technology',
        size: '1-10',
        website: 'https://testbusiness.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zip: '12345',
          country: 'US'
        },
        email: 'contact@testbusiness.com',
        tier: 'free',
      },
    });

    console.log('✅ Test business created/updated');

    // 3. Create business member relationship
    console.log('\n🔗 Creating business membership...');
    
    const businessMember = await prisma.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: testBusiness.id,
          userId: businessUser.id,
        },
      },
      update: {},
      create: {
        userId: businessUser.id,
        businessId: testBusiness.id,
        role: 'ADMIN',
        title: 'Business Owner',
        department: 'Management',
        isActive: true,
        canInvite: true,
        canManage: true,
        canBilling: true,
      },
    });

    /** Canonical local tester (same email/password as `server/src/scripts/seedPlaceDemoData.ts`). */
    const placeTesterPassword = await bcrypt.hash('password123', 10);
    const placeTester = await prisma.user.upsert({
      where: { email: 'place.tester@vssyl.local' },
      /** Platform ADMIN so local QA can use `/admin-portal` (module review, etc.). */
      update: { role: 'ADMIN' },
      create: {
        email: 'place.tester@vssyl.local',
        password: placeTesterPassword,
        name: 'Vssyl Place Tester',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    await prisma.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: testBusiness.id,
          userId: placeTester.id,
        },
      },
      update: {},
      create: {
        userId: placeTester.id,
        businessId: testBusiness.id,
        role: 'ADMIN',
        title: 'Place Tester',
        department: 'QA',
        isActive: true,
        canInvite: true,
        canManage: true,
        canBilling: true,
      },
    });

    // Also add admin user as a member of the business
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@blockonblock.com' },
      select: { id: true }
    });

    if (adminUser) {
      const adminBusinessMember = await prisma.businessMember.upsert({
        where: {
          businessId_userId: {
            businessId: testBusiness.id,
            userId: adminUser.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          businessId: testBusiness.id,
          role: 'ADMIN',
          title: 'System Administrator',
          department: 'IT',
          isActive: true,
          canInvite: true,
          canManage: true,
          canBilling: true,
        },
      });
      console.log('✅ Admin user added to business');
    }

    console.log('✅ Business membership created/updated');

    // 4. Create dashboard for the business user
    console.log('\n📊 Creating business dashboard...');
    
    const businessDashboard = await prisma.dashboard.upsert({
      where: {
        id: 'business-dashboard-001',
      },
      update: {},
      create: {
        id: 'business-dashboard-001',
        userId: businessUser.id,
        name: 'Business Dashboard',
        layout: {
          widgets: [
            { id: 'chat-widget', x: 0, y: 0, w: 6, h: 4 },
            { id: 'drive-widget', x: 6, y: 0, w: 6, h: 4 },
          ],
        },
        preferences: {
          theme: 'light',
          compactMode: false,
        },
        businessId: testBusiness.id,
      },
    });

    console.log('✅ Business dashboard created/updated');

    // 5. Create widgets for the dashboard
    console.log('\n🧩 Creating dashboard widgets...');
    
    const chatWidget = await prisma.widget.upsert({
      where: {
        id: 'chat-widget-001',
      },
      update: {},
      create: {
        id: 'chat-widget-001',
        dashboardId: businessDashboard.id,
        type: 'chat',
        config: {
          showTimestamps: true,
          maxMessages: 100,
        },
      },
    });

    const driveWidget = await prisma.widget.upsert({
      where: {
        id: 'drive-widget-001',
      },
      update: {},
      create: {
        id: 'drive-widget-001',
        dashboardId: businessDashboard.id,
        type: 'drive',
        config: {
          viewMode: 'grid',
          sortBy: 'name',
        },
      },
    });

    console.log('✅ Dashboard widgets created/updated');

    // 6. Create personal dashboard for test user
    console.log('\n🏠 Creating personal dashboard...');
    
    const personalDashboard = await prisma.dashboard.upsert({
      where: {
        id: 'personal-dashboard-001',
      },
      update: {},
      create: {
        id: 'personal-dashboard-001',
        userId: testUser.id,
        name: 'Personal Dashboard',
        layout: {
          widgets: [
            { id: 'personal-chat', x: 0, y: 0, w: 12, h: 6 },
          ],
        },
        preferences: {
          theme: 'dark',
          compactMode: true,
        },
      },
    });

    console.log('✅ Personal dashboard created/updated');

    // 7. Create personal dashboard widgets
    const personalChatWidget = await prisma.widget.upsert({
      where: {
        id: 'personal-chat-widget-001',
      },
      update: {},
      create: {
        id: 'personal-chat-widget-001',
        dashboardId: personalDashboard.id,
        type: 'chat',
        config: {
          showTimestamps: false,
          maxMessages: 50,
        },
      },
    });

    console.log('✅ Personal dashboard widgets created/updated');

    // 8. Create a test conversation
    console.log('\n💬 Creating test conversation...');
    
    const testConversation = await prisma.conversation.upsert({
      where: {
        id: 'test-conversation-001',
      },
      update: {},
      create: {
        id: 'test-conversation-001',
        dashboardId: businessDashboard.id,
        name: 'Welcome to Test Business',
        type: 'GROUP',
        lastMessageAt: new Date(),
      },
    });

    console.log('✅ Test conversation created/updated');

    // 9. Create conversation participant
    const conversationParticipant = await prisma.conversationParticipant.upsert({
      where: {
        id: 'participant-001',
      },
      update: {},
      create: {
        id: 'participant-001',
        userId: businessUser.id,
        conversationId: testConversation.id,
        role: 'OWNER',
        isActive: true,
        joinedAt: new Date(),
      },
    });

    console.log('✅ Conversation participant created/updated');

    // 10. Create a welcome message
    const welcomeMessage = await prisma.message.upsert({
      where: {
        id: 'welcome-message-001',
      },
      update: {},
      create: {
        id: 'welcome-message-001',
        conversationId: testConversation.id,
        senderId: businessUser.id,
        content: 'Welcome to your new business workspace! This is where you can collaborate with your team.',
        type: 'TEXT',
      },
    });

    console.log('✅ Welcome message created/updated');

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📋 Summary of created data:');
    console.log(`  - Users: ${placeTester.email} (recommended), ${testUser.email}, ${businessUser.email}`);
    console.log(`  - Business: ${testBusiness.name} (${testBusiness.id})`);
    console.log(`  - Dashboards: Business Dashboard, Personal Dashboard`);
    console.log(`  - Widgets: Chat, Drive, Personal Chat`);
    console.log(`  - Conversation: Welcome to Test Business`);
    console.log('\n🔐 Test credentials:');
    console.log(`  Primary local tester: ${placeTester.email} / password123`);
    console.log(`  Business User: ${businessUser.email} / business123`);
    console.log(`  Test User: ${testUser.email} / test123`);
    console.log(`  Admin: admin@blockonblock.com / admin123`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
