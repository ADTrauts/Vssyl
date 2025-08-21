import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  try {
    console.log('🌱 Seeding notifications...');

    // Get a test user (assuming Alice exists from previous scripts)
    const user = await prisma.user.findFirst({
      where: { email: 'alice@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please run seed scripts first.');
      return;
    }

    // Create sample notifications
    const notifications = [
      {
        type: 'mentions',
        title: 'John Doe mentioned you in "Project Discussion"',
        body: 'Hey @alice, can you review the latest design files?',
        read: false,
        data: {
          conversationId: 'conv1',
          action: 'mention',
          senderId: 'user1'
        }
      },
      {
        type: 'drive',
        title: 'Sarah shared a file with you',
        body: 'Project_Design_v2.fig has been shared with you',
        read: false,
        data: {
          fileId: 'file1',
          action: 'shared',
          senderId: 'user2'
        }
      },
      {
        type: 'business',
        title: 'You\'ve been invited to join "TechCorp"',
        body: 'You have been invited to join TechCorp as a member',
        read: true,
        data: {
          businessId: 'business1',
          action: 'invitation',
          senderId: 'user3'
        }
      },
      {
        type: 'chat',
        title: 'New message in "Team Chat"',
        body: 'Mike: Great work on the latest update!',
        read: false,
        data: {
          conversationId: 'conv2',
          action: 'message',
          senderId: 'user4'
        }
      },
      {
        type: 'system',
        title: 'System maintenance scheduled',
        body: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM EST',
        read: true,
        data: {
          action: 'maintenance'
        }
      },
      {
        type: 'members',
        title: 'New connection request',
        body: 'David Wilson wants to connect with you',
        read: false,
        data: {
          senderId: 'user5',
          action: 'connection_request'
        }
      },
      {
        type: 'drive',
        title: 'File permission updated',
        body: 'You now have edit access to "Marketing_Plan.pdf"',
        read: true,
        data: {
          fileId: 'file2',
          action: 'permission_updated'
        }
      },
      {
        type: 'chat',
        title: 'Reaction to your message',
        body: 'Sarah reacted with 👍 to your message',
        read: false,
        data: {
          conversationId: 'conv1',
          action: 'reaction',
          senderId: 'user2'
        }
      }
    ];

    // Create notifications with different timestamps
    const now = new Date();
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const createdAt = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // 2 hours apart

      await prisma.notification.create({
        data: {
          ...notification,
          userId: user.id,
          createdAt,
          deliveredAt: notification.read ? createdAt : null
        }
      });
    }

    console.log(`✅ Created ${notifications.length} sample notifications for ${user.email}`);
    
    // Show notification stats
    const stats = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _count: { type: true }
    });

    console.log('📊 Notification stats:');
    stats.forEach(stat => {
      console.log(`  ${stat.type}: ${stat._count.type}`);
    });

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications(); 