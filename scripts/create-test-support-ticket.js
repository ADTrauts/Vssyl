const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSupportTicket() {
  try {
    // First, get a user to create the ticket for
    const user = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    });

    if (!user) {
      console.log('Test user not found, creating one...');
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashedpassword',
          role: 'USER'
        }
      });
      console.log('Created test user:', newUser.id);
    }

    // Create a test support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title: 'Test Support Ticket',
        description: 'This is a test support ticket to verify the system is working.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'Technical',
        tags: ['test', 'verification'],
        customerId: user ? user.id : 'unknown'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Test support ticket created successfully!');
    console.log('Ticket ID:', ticket.id);
    console.log('Title:', ticket.title);
    console.log('Customer:', ticket.customer.name);
    console.log('Status:', ticket.status);

    // Create a test knowledge base article
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title: 'How to Get Help',
        content: 'This is a test knowledge base article explaining how to get help.',
        excerpt: 'Learn how to get help when you need it.',
        category: 'General',
        tags: ['help', 'support'],
        status: 'PUBLISHED',
        slug: 'how-to-get-help',
        authorId: user ? user.id : 'unknown'
      }
    });

    console.log('\n✅ Test knowledge base article created successfully!');
    console.log('Article ID:', article.id);
    console.log('Title:', article.title);
    console.log('Status:', article.status);

  } catch (error) {
    console.error('❌ Error creating test support data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSupportTicket();
