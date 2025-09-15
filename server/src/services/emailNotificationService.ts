import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

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
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  private initialize() {
    if (this.isInitialized) return;

    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Check if email configuration is available
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️ Email configuration not found. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isInitialized = true;
      console.log('✅ Email notification service initialized');
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(data: EmailNotificationData): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.warn('Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: data.from || process.env.EMAIL_FROM || 'notifications@blockonblock.com',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
        replyTo: data.replyTo
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${data.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send email notification to user
   */
  async sendToUser(userId: string, template: EmailTemplate): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        console.error(`User not found: ${userId}`);
        return false;
      }

      const emailData: EmailNotificationData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending email to user:', error);
      return false;
    }
  }

  /**
   * Send email notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], template: EmailTemplate): Promise<number> {
    if (!this.isInitialized) {
      console.warn('Email service not initialized');
      return 0;
    }

    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, name: true }
      });

      const results = await Promise.allSettled(
        users.map(user => 
          this.sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          })
        )
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      console.log(`📧 Email notification sent to ${successCount}/${users.length} users`);
      return successCount;
    } catch (error) {
      console.error('Error sending emails to multiple users:', error);
      return 0;
    }
  }

  /**
   * Create email template from notification data
   */
  createTemplateFromNotification(notification: NotificationData, user: UserData): EmailTemplate {
    const appName = 'Vssyl';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'chat':
        case 'mentions':
          return '💬';
        case 'drive':
          return '📁';
        case 'business':
          return '🏢';
        case 'system':
          return '🔔';
        default:
          return '📧';
      }
    };

    const getActionUrl = (type: string, data: Record<string, unknown>) => {
      switch (type) {
        case 'chat':
        case 'mentions':
          return data?.conversationId ? `${appUrl}/chat/${data.conversationId}` : `${appUrl}/notifications`;
        case 'drive':
          return data?.fileId ? `${appUrl}/drive/file/${data.fileId}` : `${appUrl}/drive`;
        case 'business':
          return data?.businessId ? `${appUrl}/business/${data.businessId}` : `${appUrl}/business`;
        default:
          return `${appUrl}/notifications`;
      }
    };

    const icon = getNotificationIcon(notification.type);
    const actionUrl = getActionUrl(notification.type, notification.data || {});

    const subject = `${icon} ${notification.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
            .notification-icon { font-size: 24px; margin-right: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #495057;">
                <span class="notification-icon">${icon}</span>
                ${appName}
              </h1>
            </div>
            
            <div class="content">
              <h2 style="margin-top: 0; color: #212529;">${notification.title}</h2>
              ${notification.body ? `<p style="color: #6c757d; font-size: 16px;">${notification.body}</p>` : ''}
              
              <a href="${actionUrl}" class="button">View Details</a>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                You're receiving this email because you have email notifications enabled for ${notification.type} events.
              </p>
            </div>
            
            <div class="footer">
              <p>
                <a href="${appUrl}/notifications/settings" style="color: #007bff;">Manage notification preferences</a> |
                <a href="${appUrl}/notifications" style="color: #007bff;">View all notifications</a>
              </p>
              <p style="margin: 0;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${appName} - ${notification.title}

${notification.body || ''}

View Details: ${actionUrl}

Manage notification preferences: ${appUrl}/notifications/settings
View all notifications: ${appUrl}/notifications

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim();

    return { subject, html, text };
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.transporter !== null;
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
      `.trim()
    };

    return await this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }
} 