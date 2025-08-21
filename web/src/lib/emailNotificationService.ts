import { authenticatedApiCall } from './apiUtils';

export interface EmailPreferences {
  chat?: boolean;
  drive?: boolean;
  business?: boolean;
  system?: boolean;
  mentions?: boolean;
  invitations?: boolean;
}

export interface EmailServiceStatus {
  available: boolean;
  configured: boolean;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;

  private constructor() {}

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Get email service status
   */
  async getServiceStatus(): Promise<EmailServiceStatus> {
    try {
      const response = await authenticatedApiCall('/api/email-notifications/status', {
        method: 'GET'
      }) as EmailServiceStatus;

      return response;
    } catch (error) {
      console.error('Error getting email service status:', error);
      return { available: false, configured: false };
    }
  }

  /**
   * Get user email preferences
   */
  async getEmailPreferences(): Promise<EmailPreferences> {
    try {
      const response = await authenticatedApiCall('/api/email-notifications/preferences', {
        method: 'GET'
      }) as { preferences: EmailPreferences };

      return response.preferences || {};
    } catch (error) {
      console.error('Error getting email preferences:', error);
      return {};
    }
  }

  /**
   * Update user email preferences
   */
  async updateEmailPreferences(preferences: EmailPreferences): Promise<boolean> {
    try {
      const response = await authenticatedApiCall('/api/email-notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences })
      }) as { success: boolean };

      return response.success;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      return false;
    }
  }

  /**
   * Test email service (admin only)
   */
  async testEmailService(email?: string): Promise<boolean> {
    try {
      const response = await authenticatedApiCall('/api/email-notifications/test', {
        method: 'POST',
        body: JSON.stringify({ email })
      }) as { success: boolean };

      return response.success;
    } catch (error) {
      console.error('Error testing email service:', error);
      return false;
    }
  }

  /**
   * Send email notification (admin only)
   */
  async sendEmailNotification(targetUserId: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const response = await authenticatedApiCall('/api/email-notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          subject,
          html,
          text
        })
      }) as { success: boolean };

      return response.success;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Get default email preferences
   */
  getDefaultPreferences(): EmailPreferences {
    return {
      chat: false,
      drive: true,
      business: true,
      system: true,
      mentions: true,
      invitations: true
    };
  }

  /**
   * Check if email notifications are enabled for a specific type
   */
  async isEmailEnabledForType(type: string): Promise<boolean> {
    try {
      const preferences = await this.getEmailPreferences();
      
      switch (type) {
        case 'chat':
        case 'mentions':
          return preferences.chat || preferences.mentions || false;
        case 'drive':
          return preferences.drive || false;
        case 'business':
        case 'invitations':
          return preferences.business || preferences.invitations || false;
        case 'system':
          return preferences.system || false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return false;
    }
  }
} 