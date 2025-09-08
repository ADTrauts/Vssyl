import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

// Define proper types for notification data
export interface NotificationData {
  patternType?: string;
  affectedUsers?: number;
  module?: string;
  patternId?: string;
  insightType?: string;
  confidence?: number;
  insightId?: string;
  anomalyId?: string;
  metric?: string;
  value?: number;
  threshold?: number;
  checkType?: string;
  status?: string;
  details?: string;
  checkId?: string;
  [key: string]: unknown; // Allow additional properties
}

// Define WebSocket connection interface
export interface WebSocketConnection {
  on(event: string, listener: (...args: unknown[]) => void): void;
  send(data: string): void;
  close(): void;
}

export interface Notification {
  id: string;
  type: 'pattern_discovery' | 'insight_generated' | 'anomaly_detected' | 'trend_alert' | 'compliance_warning' | 'performance_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'ai_learning' | 'system' | 'security' | 'compliance' | 'performance';
  recipients: string[]; // User IDs or 'all' for broadcast
  data: NotificationData; // Use proper type instead of any
  read: boolean;
  acknowledged: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'dismiss';
  url?: string;
  callback?: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  actions: NotificationAction[];
  variables: string[]; // Template variables like {userName}, {patternType}
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    ai_learning: boolean;
    system: boolean;
    security: boolean;
    compliance: boolean;
    performance: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
}

export class RealTimeNotificationService extends EventEmitter {
  private prisma: PrismaClient;
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private activeConnections: Map<string, WebSocketConnection> = new Map(); // Use proper type

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initializeTemplates();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    // Pattern discovery template
    this.templates.set('pattern_discovery', {
      id: 'pattern_discovery',
      type: 'pattern_discovery',
      title: 'New Pattern Discovered',
      message: 'AI has discovered a new {patternType} pattern affecting {affectedUsers} users in the {module} module.',
      priority: 'medium',
      category: 'ai_learning',
      actions: [
        { id: 'view', label: 'View Pattern', type: 'button', url: '/admin/ai-learning/patterns/{patternId}' },
        { id: 'dismiss', label: 'Dismiss', type: 'dismiss' }
      ],
      variables: ['patternType', 'affectedUsers', 'module', 'patternId']
    });

    // Insight generated template
    this.templates.set('insight_generated', {
      id: 'insight_generated',
      type: 'insight_generated',
      title: 'New AI Insight Available',
      message: 'A new {insightType} insight has been generated with {confidence}% confidence.',
      priority: 'high',
      category: 'ai_learning',
      actions: [
        { id: 'view', label: 'View Insight', type: 'button', url: '/admin/ai-learning/insights/{insightId}' },
        { id: 'implement', label: 'Implement', type: 'button', url: '/admin/ai-learning/insights/{insightId}/implement' }
      ],
      variables: ['insightType', 'confidence', 'insightId']
    });

    // Anomaly detection template
    this.templates.set('anomaly_detected', {
      id: 'anomaly_detected',
      type: 'anomaly_detected',
      title: 'Anomaly Detected',
      message: 'AI has detected an unusual pattern in {module} that may require attention.',
      priority: 'high',
      category: 'ai_learning',
      actions: [
        { id: 'investigate', label: 'Investigate', type: 'button', url: '/admin/ai-learning/anomalies/{anomalyId}' },
        { id: 'dismiss', label: 'Dismiss', type: 'dismiss' }
      ],
      variables: ['module', 'anomalyId']
    });

    // Performance alert template
    this.templates.set('performance_alert', {
      id: 'performance_alert',
      type: 'performance_alert',
      title: 'Performance Alert',
      message: 'System performance has degraded: {metric} is {value} (threshold: {threshold}).',
      priority: 'critical',
      category: 'performance',
      actions: [
        { id: 'view', label: 'View Metrics', type: 'button', url: '/admin/performance' },
        { id: 'optimize', label: 'Optimize', type: 'button', url: '/admin/performance/optimize' }
      ],
      variables: ['metric', 'value', 'threshold']
    });

    // Compliance warning template
    this.templates.set('compliance_warning', {
      id: 'compliance_warning',
      type: 'compliance_warning',
      title: 'Compliance Warning',
      message: 'Compliance check {checkType} has {status} status. {details}',
      priority: 'high',
      category: 'compliance',
      actions: [
        { id: 'review', label: 'Review', type: 'button', url: '/admin/compliance/{checkId}' },
        { id: 'fix', label: 'Fix Issues', type: 'button', url: '/admin/compliance/{checkId}/fix' }
      ],
      variables: ['checkType', 'status', 'details', 'checkId']
    });
  }

  /**
   * Send notification using template
   */
  async sendNotification(
    templateId: string,
    recipients: string[] | 'all',
    variables: Record<string, string | number>, // Use proper type instead of any
    customData?: NotificationData // Use proper type instead of any
  ): Promise<Notification[]> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Process template with variables
      const title = this.processTemplate(template.title, variables);
      const message = this.processTemplate(template.message, variables);
      
      // Process actions with variables
      const actions = template.actions.map(action => ({
        ...action,
        url: action.url ? this.processTemplate(action.url, variables) : undefined
      }));

      // Determine actual recipients
      const actualRecipients = recipients === 'all' ? 
        await this.getAllUserIds() : 
        recipients;

      const notifications: Notification[] = [];

      for (const userId of actualRecipients) {
        // Check user preferences
        const preferences = await this.getUserPreferences(userId);
        if (!this.shouldSendNotification(preferences, template.category)) {
          continue;
        }

        const notification: Notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: template.type as Notification['type'], // Use proper type casting
          title,
          message,
          priority: template.priority,
          category: template.category as Notification['category'], // Use proper type casting
          recipients: [userId],
          data: { ...variables, ...customData },
          read: false,
          acknowledged: false,
          createdAt: new Date(),
          expiresAt: this.calculateExpirationDate(template.priority),
          actions
        };

        // Store notification
        this.notifications.set(notification.id, notification);
        notifications.push(notification);

        // Emit real-time event
        this.emit('notification_created', notification);

        // Send via different channels based on preferences
        await this.sendNotificationChannels(notification, preferences);
      }

      console.log(`📢 Sent ${notifications.length} notifications using template: ${templateId}`);
      return notifications;

    } catch (error) {
      console.error('Error sending notification:', error);
      return [];
    }
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
    category: string,
    recipients: string[] | 'all',
    data?: NotificationData, // Use proper type instead of any
    actions?: NotificationAction[]
  ): Promise<Notification[]> {
    try {
      const actualRecipients = recipients === 'all' ? 
        await this.getAllUserIds() : 
        recipients;

      const notifications: Notification[] = [];

      for (const userId of actualRecipients) {
        const preferences = await this.getUserPreferences(userId);
        if (!this.shouldSendNotification(preferences, category)) {
          continue;
        }

        const notification: Notification = {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: type as Notification['type'], // Use proper type casting
          title,
          message,
          priority,
          category: category as Notification['category'], // Use proper type casting
          recipients: [userId],
          data: data || {}, // Use proper type
          read: false,
          acknowledged: false,
          createdAt: new Date(),
          expiresAt: this.calculateExpirationDate(priority),
          actions: actions || []
        };

        // Store notification
        this.notifications.set(notification.id, notification);
        notifications.push(notification);

        // Emit real-time event
        this.emit('notification_created', notification);

        // Send via different channels based on preferences
        await this.sendNotificationChannels(notification, preferences);
      }

      console.log(`📢 Sent ${notifications.length} custom notifications`);
      return notifications;

    } catch (error) {
      console.error('Error sending custom notification:', error);
      return [];
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters: {
      read?: boolean;
      acknowledged?: boolean;
      category?: string;
      priority?: string;
      limit?: number;
    } = {}
  ): Promise<Notification[]> {
    try {
      let notifications = Array.from(this.notifications.values())
        .filter(n => n.recipients.includes(userId))
        .filter(n => !n.expiresAt || n.expiresAt > new Date());

      // Apply filters
      if (filters.read !== undefined) {
        notifications = notifications.filter(n => n.read === filters.read);
      }
      if (filters.acknowledged !== undefined) {
        notifications = notifications.filter(n => n.acknowledged === filters.acknowledged);
      }
      if (filters.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }
      if (filters.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }

      // Sort by priority and creation date
      notifications.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Apply limit
      if (filters.limit) {
        notifications = notifications.slice(0, filters.limit);
      }

      return notifications;

    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification || !notification.recipients.includes(userId)) {
        return false;
      }

      notification.read = true;
      this.emit('notification_read', { notificationId, userId });
      return true;

    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = this.notifications.get(notificationId);
      if (!notification || !notification.recipients.includes(userId)) {
        return false;
      }

      notification.acknowledged = true;
      this.emit('notification_acknowledged', { notificationId, userId });
      return true;

    } catch (error) {
      console.error('Error acknowledging notification:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    total: number;
    unread: number;
    unacknowledged: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const notifications = Array.from(this.notifications.values());
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      unacknowledged: notifications.filter(n => !n.acknowledged).length,
      byPriority: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const now = new Date();
      const expiredIds: string[] = [];

      for (const [id, notification] of this.notifications.entries()) {
        if (notification.expiresAt && notification.expiresAt < now) {
          expiredIds.push(id);
        }
      }

      expiredIds.forEach(id => this.notifications.delete(id));

      console.log(`🧹 Cleaned up ${expiredIds.length} expired notifications`);
      return expiredIds.length;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Set up WebSocket connection for real-time notifications
   */
  setupWebSocketConnection(userId: string, connection: WebSocketConnection): void { // Use proper type
    this.activeConnections.set(userId, connection);
    
    connection.on('close', () => {
      this.activeConnections.delete(userId);
    });

    // Send existing unread notifications
    this.getUserNotifications(userId, { read: false, limit: 10 })
      .then(notifications => {
        if (notifications.length > 0) {
          connection.send(JSON.stringify({
            type: 'notifications_loaded',
            data: notifications
          }));
        }
      });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(notification: Notification): void {
    this.activeConnections.forEach((connection, userId) => {
      if (notification.recipients.includes(userId) || notification.recipients.includes('all')) {
        try {
          connection.send(JSON.stringify({
            type: 'notification_received',
            data: notification
          }));
        } catch (error) {
          console.error(`Error broadcasting to user ${userId}:`, error);
          this.activeConnections.delete(userId);
        }
      }
    });
  }

  // Private helper methods
  private processTemplate(template: string, variables: Record<string, string | number>): string { // Use proper type instead of any
    return template.replace(/\{(\w+)\}/g, (match, variable) => {
      return String(variables[variable] || match);
    });
  }

  private async getAllUserIds(): Promise<string[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: { id: true }
      });
      return users.map(u => u.id);
    } catch (error) {
      console.error('Error getting all user IDs:', error);
      return [];
    }
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Check cache first
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      userId,
      email: true,
      push: true,
      inApp: true,
      categories: {
        ai_learning: true,
        system: true,
        security: true,
        compliance: true,
        performance: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };

    // Cache preferences
    this.userPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  private shouldSendNotification(preferences: NotificationPreferences, category: string): boolean {
    // Check if category is enabled
    if (!preferences.categories[category as keyof typeof preferences.categories]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const start = preferences.quietHours.start;
      const end = preferences.quietHours.end;
      
      if (start <= end) {
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      } else {
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      }
    }

    return true;
  }

  private calculateExpirationDate(priority: string): Date {
    const now = new Date();
    const expirationDays = {
      critical: 7,
      high: 14,
      medium: 30,
      low: 60
    };
    
    const days = expirationDays[priority as keyof typeof expirationDays] || 30;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private async sendNotificationChannels(notification: Notification, preferences: NotificationPreferences): Promise<void> {
    try {
      // In-app notification (always sent)
      this.broadcastNotification(notification);

      // Email notification
      if (preferences.email) {
        await this.sendEmailNotification(notification);
      }

      // Push notification
      if (preferences.push) {
        await this.sendPushNotification(notification);
      }

    } catch (error) {
      console.error('Error sending notification channels:', error);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Mock email sending - in real implementation, this would use a service like SendGrid
    console.log(`📧 Email notification sent: ${notification.title}`);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Mock push notification - in real implementation, this would use FCM or similar
    console.log(`📱 Push notification sent: ${notification.title}`);
  }
}
