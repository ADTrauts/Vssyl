import { PrismaClient } from '@prisma/client';
import { NotificationGroupingService } from '../src/services/notificationGroupingService';

const prisma = new PrismaClient();

async function testAdvancedNotifications() {
  try {
    console.log('🧪 Testing Advanced Notification Features...\n');

    // Find test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please create a user with email test@example.com');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Test grouping service
    const groupingService = NotificationGroupingService.getInstance();
    
    console.log('\n📊 Testing notification grouping...');
    
    // Create test notifications for grouping
    const testNotifications = [
      // Chat messages from same conversation (should group)
      {
        userId: user.id,
        type: 'chat',
        title: 'New message from Alice',
        body: 'Hey, how are you doing?',
        data: { conversationId: 'conv-1', senderName: 'Alice' },
        read: false
      },
      {
        userId: user.id,
        type: 'chat',
        title: 'New message from Alice',
        body: 'Can you check the latest updates?',
        data: { conversationId: 'conv-1', senderName: 'Alice' },
        read: false
      },
      {
        userId: user.id,
        type: 'chat',
        title: 'New message from Alice',
        body: 'Thanks for your help!',
        data: { conversationId: 'conv-1', senderName: 'Alice' },
        read: false
      },
      // Mentions from same conversation (should group)
      {
        userId: user.id,
        type: 'mentions',
        title: 'Alice mentioned you',
        body: '@testuser can you help with this?',
        data: { conversationId: 'conv-1', senderName: 'Alice' },
        read: false
      },
      {
        userId: user.id,
        type: 'mentions',
        title: 'Alice mentioned you',
        body: '@testuser what do you think?',
        data: { conversationId: 'conv-1', senderName: 'Alice' },
        read: false
      },
      // File sharing from same sender (should group)
      {
        userId: user.id,
        type: 'drive',
        title: 'Bob shared a file with you',
        body: 'project-document.pdf',
        data: { senderId: 'bob-123', senderName: 'Bob' },
        read: false
      },
      {
        userId: user.id,
        type: 'drive',
        title: 'Bob shared a file with you',
        body: 'presentation.pptx',
        data: { senderId: 'bob-123', senderName: 'Bob' },
        read: false
      },
      // Individual invitations (should not group)
      {
        userId: user.id,
        type: 'invitations',
        title: 'Invitation to join Business A',
        body: 'You\'ve been invited to join Business A as a member',
        data: { businessId: 'business-a', businessName: 'Business A' },
        read: false
      },
      {
        userId: user.id,
        type: 'invitations',
        title: 'Invitation to join Business B',
        body: 'You\'ve been invited to join Business B as an admin',
        data: { businessId: 'business-b', businessName: 'Business B' },
        read: false
      },
      // System notifications (should group)
      {
        userId: user.id,
        type: 'system',
        title: 'System maintenance scheduled',
        body: 'Scheduled maintenance on Sunday at 2 AM',
        data: { category: 'maintenance' },
        read: false
      },
      {
        userId: user.id,
        type: 'system',
        title: 'System maintenance completed',
        body: 'All systems are now operational',
        data: { category: 'maintenance' },
        read: false
      }
    ];

    console.log('📝 Creating test notifications...');
    
    for (const notificationData of testNotifications) {
      await prisma.notification.create({
        data: notificationData
      });
    }

    console.log(`✅ Created ${testNotifications.length} test notifications`);

    // Test grouping
    console.log('\n📊 Testing notification grouping...');
    const groups = await groupingService.getGroupedNotifications(user.id);
    
    console.log(`📦 Created ${groups.length} notification groups:`);
    
    groups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.title} (${group.count} notifications, ${group.priority} priority)`);
    });

    // Test statistics
    console.log('\n📈 Testing notification statistics...');
    const stats = await groupingService.getNotificationStats(user.id);
    
    console.log('📊 Notification Statistics:');
    console.log(`   Total notifications: ${stats.total}`);
    console.log(`   Unread notifications: ${stats.unread}`);
    console.log(`   Grouped notifications: ${stats.grouped}`);
    console.log(`   By type:`, stats.byType);
    console.log(`   By priority:`, stats.byPriority);

    // Test marking group as read
    if (groups.length > 0) {
      console.log('\n✅ Testing mark group as read...');
      const firstGroup = groups[0];
      const success = await groupingService.markGroupAsRead(firstGroup.id, user.id);
      
      if (success) {
        console.log(`✅ Successfully marked group "${firstGroup.title}" as read`);
      } else {
        console.log('❌ Failed to mark group as read');
      }
    }

    // Test individual group retrieval
    if (groups.length > 0) {
      console.log('\n🔍 Testing individual group retrieval...');
      const firstGroup = groups[0];
      const retrievedGroup = await groupingService.getGroupById(firstGroup.id, user.id);
      
      if (retrievedGroup) {
        console.log(`✅ Successfully retrieved group: ${retrievedGroup.title}`);
        console.log(`   Contains ${retrievedGroup.notifications.length} notifications`);
      } else {
        console.log('❌ Failed to retrieve group');
      }
    }

    console.log('\n💡 Advanced Notification Testing Complete!');
    console.log('   Features tested:');
    console.log('   ✅ Smart notification grouping');
    console.log('   ✅ Priority-based organization');
    console.log('   ✅ Group statistics');
    console.log('   ✅ Mark group as read');
    console.log('   ✅ Individual group retrieval');

  } catch (error) {
    console.error('❌ Error testing advanced notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdvancedNotifications(); 