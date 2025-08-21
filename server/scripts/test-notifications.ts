import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('🧪 Testing notification system...');

    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'alice@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please run seed scripts first.');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Test 1: Check notification stats
    const stats = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _count: { type: true }
    });

    console.log('\n📊 Current notification stats:');
    stats.forEach(stat => {
      console.log(`  ${stat.type}: ${stat._count.type}`);
    });

    // Test 2: Check unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
        deleted: false
      }
    });

    console.log(`\n📬 Unread notifications: ${unreadCount}`);

    // Test 3: Check notification data structure
    const sampleNotification = await prisma.notification.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (sampleNotification) {
      console.log('\n📋 Sample notification structure:');
      console.log(`  ID: ${sampleNotification.id}`);
      console.log(`  Type: ${sampleNotification.type}`);
      console.log(`  Title: ${sampleNotification.title}`);
      console.log(`  Read: ${sampleNotification.read}`);
      console.log(`  Created: ${sampleNotification.createdAt}`);
      console.log(`  Data: ${JSON.stringify(sampleNotification.data, null, 2)}`);
    }

    // Test 4: Check notification types
    const notificationTypes = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _count: { type: true }
    });

    console.log('\n🎯 Notification types available:');
    notificationTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type} notifications`);
    });

    console.log('\n✅ Notification system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications(); 