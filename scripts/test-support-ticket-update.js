const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdateSupportTicket() {
  try {
    // Get a test ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: { status: 'OPEN' }
    });
    
    if (!ticket) {
      console.log('No open tickets found');
      return;
    }
    
    console.log('Testing update on ticket:', ticket.title, 'Status:', ticket.status);
    
    // Test updating the ticket status
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully updated ticket status to:', updatedTicket.status);
    
    // Test updating back to resolved
    const resolvedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully updated ticket status to:', resolvedTicket.status);
    
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateSupportTicket();
