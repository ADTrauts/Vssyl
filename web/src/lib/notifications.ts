import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
}

export async function sendAdminNotification(notification: NotificationData) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });

    // Create notification for each admin
    await Promise.all(admins.map(admin => 
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false
        }
      })
    ));

    // TODO: Implement real-time notifications using WebSocket
    // This would notify admins immediately when they're online

  } catch (error) {
    console.error('Error sending admin notification:', error);
    // Don't throw the error as this is a non-critical operation
  }
} 