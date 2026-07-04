import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { isEmailConfigured, sendEmail as deliverEmail } from './email';
import { buildNotificationEmail } from './email/templates';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;

  private constructor() {
    if (isEmailConfigured()) {
      logSrvDebug('emailnotificationservice_initialized', 'Email notification service ready');
    } else {
      logSrvWarn('emailnotificationservice_missing_config', 'Email configuration not found. Email notifications will be disabled.');
    }
  }

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Send email notification
   */
  async sendEmail(data: EmailNotificationData): Promise<boolean> {
    if (!this.isAvailable()) {
      logSrvWarn('emailnotificationservice_not_initialized_send_email', 'Email service not initialized');
      return false;
    }

    const result = await deliverEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      from: data.from,
      replyTo: data.replyTo,
    });

    if (result.sent) {
      logSrvDebug('emailnotificationservice_email_sent', 'Email sent', {
        to: data.to,
        messageId: result.messageId,
      });
      return true;
    }

    logSrvErr(
      'emailnotificationservice_error_sending_email',
      'Error sending email:',
      new Error('Email delivery failed or SMTP not configured'),
      { to: data.to }
    );
    return false;
  }

  /**
   * Send email notification to user
   */
  async sendToUser(userId: string, template: EmailTemplate): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) {
        logSrvErr('emailnotificationservice_send_to_user_user_not_found', 'User not found', new Error('User not found'), { userId });
        return false;
      }

      return await this.sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      logSrvErr('emailnotificationservice_error_sending_email_to_user', 'Error sending email to user:', error);
      return false;
    }
  }

  /**
   * Send email notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], template: EmailTemplate): Promise<number> {
    if (!this.isAvailable()) {
      logSrvWarn('emailnotificationservice_not_initialized_send_multiple', 'Email service not initialized');
      return 0;
    }

    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, name: true },
      });

      const results = await Promise.allSettled(
        users.map((user) =>
          this.sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          })
        )
      );

      const successCount = results.filter((result) => result.status === 'fulfilled' && result.value === true).length;

      logSrvDebug('emailnotificationservice_bulk_sent', 'Email notification sent to users', {
        successCount,
        totalUsers: users.length,
      });
      return successCount;
    } catch (error) {
      logSrvErr('emailnotificationservice_error_sending_emails_to_multiple_users', 'Error sending emails to multiple users:', error);
      return 0;
    }
  }

  /**
   * Create email template from notification data
   */
  createTemplateFromNotification(notification: NotificationData, _user: UserData): EmailTemplate {
    const branded = buildNotificationEmail({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
    return {
      subject: branded.subject,
      html: branded.html,
      text: branded.text,
    };
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return isEmailConfigured();
  }

  /**
   * Test email service
   */
  async testEmail(to: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Test Email Notification',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Vssyl notification system.</p>
        <p>If you received this email, the email notification service is working correctly!</p>
      `,
      text: `
Test Email

This is a test email from the Vssyl notification system.

If you received this email, the email notification service is working correctly!
      `.trim(),
    };

    return await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
