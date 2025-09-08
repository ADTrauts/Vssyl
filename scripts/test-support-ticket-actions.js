const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupportTicketActions() {
  try {
    // Get a test ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: { status: 'OPEN' }
    });
    
    if (!ticket) {
      console.log('No open tickets found');
      return;
    }
    
    console.log('Testing actions on ticket:', ticket.title, 'Status:', ticket.status);
    
    // Test 1: Start Progress
    console.log('\n1. Testing "Start Progress" action...');
    const inProgressTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      }
    });
    console.log('✅ Status changed to:', inProgressTicket.status);
    
    // Test 2: Assign to admin
    console.log('\n2. Testing "Assign" action...');
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      console.log('✅ Ticket assigned to:', assignedTicket.assignedTo?.name || 'Unknown');
    }
    
    // Test 3: Resolve
    console.log('\n3. Testing "Resolve" action...');
    const resolvedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Status changed to:', resolvedTicket.status);
    console.log('✅ Resolved at:', resolvedTicket.resolvedAt);
    
    console.log('\n🎉 All actions tested successfully!');
    
  } catch (error) {
    console.error('❌ Error testing actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupportTicketActions();
