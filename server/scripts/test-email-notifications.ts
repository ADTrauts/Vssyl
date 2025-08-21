import { PrismaClient } from '@prisma/client';
import { EmailNotificationService } from '../src/services/emailNotificationService';

const prisma = new PrismaClient();

async function testEmailNotifications() {
  try {
    console.log('🧪 Testing Email Notification System...\n');

    // Find test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ No test user found. Please create a user with email test@example.com');
      return;
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`);

    // Test email service
    const emailService = EmailNotificationService.getInstance();
    
    console.log('\n📧 Testing email service availability...');
    const isAvailable = emailService.isAvailable();
    console.log(`Email service available: ${isAvailable ? '✅ Yes' : '❌ No'}`);

    if (!isAvailable) {
      console.log('\n⚠️  Email service not configured.');
      console.log('   To test email notifications:');
      console.log('   1. Add SMTP configuration to your environment variables');
      console.log('   2. Restart the server');
      console.log('   3. Run this script again');
      return;
    }

    // Test email template creation
    console.log('\n📧 Testing email template creation...');
    
    const testNotification = {
      id: 'test-email-notification',
      type: 'system',
      title: 'Test Email Notification',
      body: 'This is a test email notification from the Block on Block system.',
      data: { test: true },
      createdAt: new Date()
    };

    const template = emailService.createTemplateFromNotification(testNotification, user);
    console.log('✅ Email template created successfully');
    console.log(`   Subject: ${template.subject}`);
    console.log(`   HTML length: ${template.html.length} characters`);
    console.log(`   Text length: ${template.text.length} characters`);

    // Test email sending
    console.log('\n📧 Testing email delivery...');
    
    const success = await emailService.sendToUser(user.id, template);

    if (success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Check ${user.email} for the test email`);
    } else {
      console.log('❌ Failed to send test email');
      console.log('   This could be due to:');
      console.log('   - Invalid SMTP configuration');
      console.log('   - Network issues');
      console.log('   - Email provider restrictions');
    }

    // Test notification creation with email
    console.log('\n📧 Testing notification creation with email...');
    
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'System Test Notification',
        body: 'This notification should trigger both WebSocket and email delivery',
        data: { test: true, emailTest: true },
        read: false
      }
    });

    console.log(`✅ Created test notification: ${notification.id}`);
    console.log('   This should trigger both real-time WebSocket and email notification');

    // Check notification stats
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false, deleted: false }
    });

    console.log(`\n📊 Current unread notifications: ${unreadCount}`);

    console.log('\n💡 Email Notification Testing Complete!');
    console.log('   If you received emails, the system is working correctly.');
    console.log('   If not, check:');
    console.log('   1. SMTP configuration in environment variables');
    console.log('   2. Email provider settings');
    console.log('   3. Network connectivity');
    console.log('   4. Spam/junk folder');

  } catch (error) {
    console.error('❌ Error testing email notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailNotifications(); 