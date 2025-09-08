const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMoreTestSupportData() {
  try {
    // Get or create test users
    const testUser1 = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    const testUser2 = await prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        password: 'hashedpassword',
        role: 'USER'
      }
    });

    const testUser3 = await prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        password: 'hashedpassword',
        role: 'USER'
      }
    });

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@blockonblock.com' },
      update: {},
      create: {
        email: 'admin@blockonblock.com',
        name: 'Admin User',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    // Create more test support tickets
    const tickets = [
      {
        title: 'Cannot access premium features',
        description: 'I upgraded to premium but still cannot access advanced features. Please help.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Billing',
        tags: ['billing', 'premium', 'urgent'],
        customerId: testUser2.id,
        responseTime: 2.5,
        satisfaction: 4
      },
      {
        title: 'Module installation failed',
        description: 'Trying to install the calendar module but getting an error message.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Technical',
        tags: ['modules', 'installation'],
        customerId: testUser3.id,
        assignedToId: adminUser.id,
        responseTime: 1.2
      },
      {
        title: 'Account verification issue',
        description: 'My email verification link is not working. I clicked it but nothing happens.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'Account',
        tags: ['account', 'verification'],
        customerId: testUser1.id,
        responseTime: 3.1
      },
      {
        title: 'File upload not working',
        description: 'When I try to upload files larger than 10MB, the upload fails.',
        status: 'RESOLVED',
        priority: 'LOW',
        category: 'Technical',
        tags: ['files', 'upload', 'resolved'],
        customerId: testUser2.id,
        responseTime: 4.2,
        satisfaction: 5,
        resolvedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        title: 'Payment method declined',
        description: 'My credit card is being declined even though it works elsewhere.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Billing',
        tags: ['billing', 'payment', 'urgent'],
        customerId: testUser3.id,
        responseTime: 1.8
      }
    ];

    for (const ticketData of tickets) {
      await prisma.supportTicket.create({
        data: ticketData
      });
    }

    // Create more knowledge base articles
    const articles = [
      {
        title: 'How to upgrade to premium',
        content: 'Step-by-step guide to upgrade your account to premium. First, go to your account settings...',
        excerpt: 'Learn how to upgrade your account to access premium features.',
        category: 'Account',
        tags: ['upgrade', 'premium', 'billing'],
        status: 'PUBLISHED',
        slug: 'how-to-upgrade-to-premium',
        authorId: adminUser.id,
        views: 1250,
        helpful: 89,
        notHelpful: 12,
        publishedAt: new Date(Date.now() - 86400000)
      },
      {
        title: 'Troubleshooting module installation',
        content: 'Common issues and solutions for module installation problems. If you encounter errors...',
        excerpt: 'Solve common module installation issues.',
        category: 'Technical',
        tags: ['modules', 'installation', 'troubleshooting'],
        status: 'PUBLISHED',
        slug: 'troubleshooting-module-installation',
        authorId: adminUser.id,
        views: 890,
        helpful: 67,
        notHelpful: 8,
        publishedAt: new Date(Date.now() - 172800000)
      },
      {
        title: 'Managing file permissions',
        content: 'Learn how to set up and manage file permissions for your team...',
        excerpt: 'Complete guide to file permission management.',
        category: 'Technical',
        tags: ['files', 'permissions', 'security'],
        status: 'PUBLISHED',
        slug: 'managing-file-permissions',
        authorId: adminUser.id,
        views: 650,
        helpful: 45,
        notHelpful: 5,
        publishedAt: new Date(Date.now() - 259200000)
      }
    ];

    for (const articleData of articles) {
      await prisma.knowledgeBaseArticle.create({
        data: articleData
      });
    }

    // Create live chat sessions
    const chatSessions = [
      {
        customerId: testUser1.id,
        agentId: adminUser.id,
        status: 'ACTIVE',
        subject: 'Need help with billing',
        messageCount: 12,
        duration: 30,
        startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        lastMessageAt: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        customerId: testUser2.id,
        status: 'WAITING',
        subject: 'Technical support needed',
        messageCount: 1,
        duration: 5,
        startedAt: new Date(Date.now() - 600000), // 10 minutes ago
        lastMessageAt: new Date(Date.now() - 600000) // 10 minutes ago
      }
    ];

    for (const chatData of chatSessions) {
      await prisma.liveChatSession.create({
        data: chatData
      });
    }

    console.log('✅ More test support data created successfully!');
    console.log(`📊 Created ${tickets.length} tickets, ${articles.length} articles, and ${chatSessions.length} chat sessions`);

  } catch (error) {
    console.error('❌ Error creating test support data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMoreTestSupportData();
