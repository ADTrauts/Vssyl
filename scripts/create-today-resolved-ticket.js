const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTodayResolvedTicket() {
  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      console.log('No test user found');
      return;
    }

    // Create a ticket that was resolved today
    const ticket = await prisma.supportTicket.create({
      data: {
        title: 'Password reset issue resolved',
        description: 'User was unable to reset password but issue has been resolved.',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        category: 'Account',
        tags: ['password', 'resolved', 'today'],
        customerId: testUser.id,
        responseTime: 1.5,
        satisfaction: 5,
        resolvedAt: new Date() // Today
      }
    });

    console.log('✅ Created today resolved ticket:', ticket.title);
    
    // Check the stats now
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const resolvedToday = await prisma.supportTicket.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          gte: today
        }
      }
    });
    
    console.log(`📊 Resolved today count: ${resolvedToday}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTodayResolvedTicket();
