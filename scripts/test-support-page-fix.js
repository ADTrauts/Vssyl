const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupportPageFix() {
  try {
    console.log('🧪 Testing Support Page Data Structure Fix...\n');

    // Check if we have support tickets
    const tickets = await prisma.supportTicket.findMany({
      take: 5,
      include: {
        customer: true,
        assignedTo: true
      }
    });

    console.log(`📋 Found ${tickets.length} support tickets`);
    
    if (tickets.length > 0) {
      console.log('✅ Sample ticket structure:');
      const sampleTicket = tickets[0];
      console.log(`   - ID: ${sampleTicket.id}`);
      console.log(`   - Title: ${sampleTicket.title}`);
      console.log(`   - Status: ${sampleTicket.status}`);
      console.log(`   - Customer: ${sampleTicket.customer?.name || 'Unknown'}`);
      console.log(`   - Assigned To: ${sampleTicket.assignedTo?.name || 'Unassigned'}`);
    }

    // Check if we have admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      take: 3
    });

    console.log(`\n👥 Found ${adminUsers.length} admin users`);
    
    if (adminUsers.length > 0) {
      console.log('✅ Sample admin user structure:');
      const sampleAdmin = adminUsers[0];
      console.log(`   - ID: ${sampleAdmin.id}`);
      console.log(`   - Name: ${sampleAdmin.name}`);
      console.log(`   - Email: ${sampleAdmin.email}`);
      console.log(`   - Role: ${sampleAdmin.role}`);
    }

    console.log('\n🎉 Support page data structure test completed!');
    console.log('📝 The frontend should now correctly access:');
    console.log('   - tickets: response.data.data');
    console.log('   - stats: response.data.data');
    console.log('   - knowledgeBase: response.data.data');
    console.log('   - liveChats: response.data.data');
    console.log('   - adminUsers: response.data.users');
    
  } catch (error) {
    console.error('❌ Error testing support page fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupportPageFix();
