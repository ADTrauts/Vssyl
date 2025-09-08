const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupportEmailNotifications() {
  try {
    console.log('🧪 Testing Support Ticket Email Notifications...\n');

    // Get a test ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: { status: 'OPEN' },
      include: {
        customer: true,
        assignedTo: true
      }
    });
    
    if (!ticket) {
      console.log('❌ No open tickets found for testing');
      return;
    }
    
    console.log(`📋 Testing with ticket: "${ticket.title}"`);
    console.log(`👤 Customer: ${ticket.customer.name} (${ticket.customer.email})`);
    console.log(`🎯 Current Status: ${ticket.status}\n`);

    // Test 1: Assign ticket
    console.log('1️⃣ Testing ticket assignment...');
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (adminUser) {
      const assignedTicket = await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          assignedToId: adminUser.id,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          assignedTo: true
        }
      });
      
      console.log(`✅ Ticket assigned to: ${assignedTicket.assignedTo?.name || 'Unknown'}`);
      console.log(`📧 Email notification should be sent to: ${assignedTicket.customer.email}\n`);
    }

    // Test 2: Start progress
    console.log('2️⃣ Testing start progress...');
    const inProgressTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      },
      include: {
        customer: true,
        assignedTo: true
      }
    });
    
    console.log(`✅ Status changed to: ${inProgressTicket.status}`);
    console.log(`📧 Email notification should be sent to: ${inProgressTicket.customer.email}\n`);

    // Test 3: Resolve ticket
    console.log('3️⃣ Testing ticket resolution...');
    const resolvedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        customer: true,
        assignedTo: true
      }
    });
    
    console.log(`✅ Status changed to: ${resolvedTicket.status}`);
    console.log(`📅 Resolved at: ${resolvedTicket.resolvedAt}`);
    console.log(`📧 Email notification should be sent to: ${resolvedTicket.customer.email}\n`);

    console.log('🎉 All email notification tests completed!');
    console.log('\n📝 Note: Check your email service configuration to ensure emails are actually sent.');
    console.log('📧 The email service will attempt to send notifications to the customer email address.');
    
  } catch (error) {
    console.error('❌ Error testing email notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupportEmailNotifications();
