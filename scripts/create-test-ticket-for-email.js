const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestTicketForEmail() {
  try {
    // Get or create a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        name: 'Test Customer',
        password: 'hashedpassword',
        role: 'USER'
      }
    });

    // Create a test support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title: 'Email Notification Test Ticket',
        description: 'This is a test ticket to verify email notifications are working correctly.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'Technical',
        tags: ['test', 'email', 'notifications'],
        customerId: testUser.id
      },
      include: {
        customer: true
      }
    });

    console.log('✅ Test ticket created successfully!');
    console.log(`📋 Ticket ID: ${ticket.id}`);
    console.log(`📝 Title: ${ticket.title}`);
    console.log(`👤 Customer: ${ticket.customer.name} (${ticket.customer.email})`);
    console.log(`📧 Email notifications will be sent to: ${ticket.customer.email}`);
    
  } catch (error) {
    console.error('❌ Error creating test ticket:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTicketForEmail();
