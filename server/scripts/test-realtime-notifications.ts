import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../src/services/notificationService';

const prisma = new PrismaClient();

async function testRealtimeNotifications() {
  try {
    console.log('🧪 Testing real-time notification system...');

    // Get test user
    const user = await prisma.user.findFirst({
      where: { email: 'alice@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please run seed scripts first.');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Test 1: Create a real-time notification
    console.log('\n📨 Creating test notification...');
    const testNotification = await NotificationService.createNotification({
      type: 'system',
      title: 'Real-time Test Notification',
      body: 'This notification should appear instantly via WebSocket',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      userId: user.id
    });

    console.log(`✅ Created notification: ${testNotification.id}`);

    // Test 2: Create multiple notifications
    console.log('\n📨 Creating multiple test notifications...');
    const notifications = [
      {
        type: 'chat' as const,
        title: 'Real-time Chat Message',
        body: 'New message from John Doe',
        data: { conversationId: 'test-conv-1' },
        userId: user.id
      },
      {
        type: 'drive' as const,
        title: 'Real-time File Share',
        body: 'Document.pdf has been shared with you',
        data: { fileId: 'test-file-1' },
        userId: user.id
      },
      {
        type: 'business' as const,
        title: 'Real-time Business Invitation',
        body: 'You have been invited to join TestCorp',
        data: { businessId: 'test-business-1' },
        userId: user.id
      }
    ];

    for (const notificationData of notifications) {
      await NotificationService.createNotification(notificationData);
      console.log(`✅ Created ${notificationData.type} notification`);
    }

    // Test 3: Check notification stats
    const stats = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _count: { type: true }
    });

    console.log('\n📊 Updated notification stats:');
    stats.forEach(stat => {
      console.log(`  ${stat.type}: ${stat._count.type}`);
    });

    // Test 4: Check unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
        deleted: false
      }
    });

    console.log(`\n📬 Unread notifications: ${unreadCount}`);

    // Test 5: Mark notifications as read
    console.log('\n✅ Marking notifications as read...');
    await NotificationService.markAsRead(user.id);

    const updatedUnreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
        deleted: false
      }
    });

    console.log(`📬 Updated unread count: ${updatedUnreadCount}`);

    console.log('\n✅ Real-time notification system test completed successfully!');
    console.log('\n💡 To test real-time functionality:');
    console.log('   1. Open the notification center in your browser');
    console.log('   2. Run this script again to create new notifications');
    console.log('   3. Watch for instant updates in the UI');

  } catch (error) {
    console.error('❌ Error testing real-time notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtimeNotifications(); 