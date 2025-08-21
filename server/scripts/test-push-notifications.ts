import { PrismaClient } from '@prisma/client';
import { PushNotificationService } from '../src/services/pushNotificationService';

const prisma = new PrismaClient();

async function testPushNotifications() {
  try {
    console.log('🧪 Testing Push Notification System...\n');

    // Find test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please create a user with email test@example.com');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Check push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id }
    });

    console.log(`📱 Push subscriptions found: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      console.log('\n⚠️  No push subscriptions found for test user.');
      console.log('   To test push notifications:');
      console.log('   1. Open the notification settings page in your browser');
      console.log('   2. Enable push notifications');
      console.log('   3. Run this script again');
      return;
    }

    // Test push notification service
    const pushService = PushNotificationService.getInstance();
    
    console.log('\n📨 Testing push notification delivery...');
    
    const testPayload = {
      title: 'Test Push Notification',
      body: 'This is a test push notification from the server!',
      icon: process.env.NEXT_PUBLIC_APP_URL + '/favicon.ico',
      badge: process.env.NEXT_PUBLIC_APP_URL + '/notification-badge.png',
      tag: 'test',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        notificationId: 'test-' + Date.now()
      }
    };

    const success = await pushService.sendToUser(user.id, testPayload);

    if (success) {
      console.log('✅ Push notification sent successfully!');
      console.log('   Check your browser/device for the notification');
    } else {
      console.log('❌ Failed to send push notification');
      console.log('   This could be due to:');
      console.log('   - Invalid subscription data');
      console.log('   - Network issues');
      console.log('   - VAPID keys not configured');
    }

    // Test notification creation with push
    console.log('\n📨 Testing notification creation with push...');
    
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'System Test Notification',
        body: 'This notification should trigger both WebSocket and push delivery',
        data: { test: true, pushTest: true },
        read: false
      }
    });

    console.log(`✅ Created test notification: ${notification.id}`);
    console.log('   This should trigger both real-time WebSocket and push notification');

    // Check notification stats
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false, deleted: false }
    });

    console.log(`\n📊 Current unread notifications: ${unreadCount}`);

    console.log('\n💡 Push Notification Testing Complete!');
    console.log('   If you received notifications, the system is working correctly.');
    console.log('   If not, check:');
    console.log('   1. Browser notification permissions');
    console.log('   2. Service worker registration');
    console.log('   3. VAPID key configuration');
    console.log('   4. Network connectivity');

  } catch (error) {
    console.error('❌ Error testing push notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushNotifications(); 