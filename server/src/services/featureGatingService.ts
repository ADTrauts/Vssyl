import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FeatureConfig {
  name: string;
  requiredTier: 'free' | 'standard' | 'enterprise';
  module: string;
  category: 'core' | 'premium' | 'enterprise';
  description: string;
  usageLimit?: number;
  usageMetric?: string;
}

export interface UsageLimit {
  metric: string;
  limit: number;
  currentUsage: number;
  remaining: number;
}

export class FeatureGatingService {
  // Feature configurations
  private static readonly FEATURES: Record<string, FeatureConfig> = {
    // ===== AI FEATURES =====
    'ai_chat': {
      name: 'AI Chat',
      requiredTier: 'free',
      module: 'ai',
      category: 'core',
      description: 'Basic AI chat interactions',
      usageLimit: 100,
      usageMetric: 'ai_messages',
    },
    'ai_autonomy': {
      name: 'AI Autonomy',
      requiredTier: 'standard',
      module: 'ai',
      category: 'premium',
      description: 'AI autonomous actions and decision making',
      usageLimit: 50,
      usageMetric: 'ai_autonomy_actions',
    },
    'ai_intelligence': {
      name: 'AI Intelligence',
      requiredTier: 'enterprise',
      module: 'ai',
      category: 'enterprise',
      description: 'Advanced AI analytics and insights',
      usageLimit: 200,
      usageMetric: 'ai_intelligence_queries',
    },

    // ===== DRIVE MODULE FEATURES =====
    // Core Drive Features (Free Tier)
    'drive_view': {
      name: 'View Files',
      requiredTier: 'free',
      module: 'drive',
      category: 'core',
      description: 'View files and folders',
    },
    'drive_upload': {
      name: 'Upload Files',
      requiredTier: 'free',
      module: 'drive',
      category: 'core',
      description: 'Upload files and create folders',
      usageLimit: 1000,
      usageMetric: 'file_uploads',
    },
    'drive_download': {
      name: 'Download Files',
      requiredTier: 'free',
      module: 'drive',
      category: 'core',
      description: 'Download files and folders',
    },

    // Premium Drive Features (Standard Tier)
    'drive_basic_sharing': {
      name: 'Basic File Sharing',
      requiredTier: 'standard',
      module: 'drive',
      category: 'premium',
      description: 'Share files with basic permissions',
      usageLimit: 500,
      usageMetric: 'file_shares',
    },
    'drive_search': {
      name: 'File Search',
      requiredTier: 'standard',
      module: 'drive',
      category: 'premium',
      description: 'Search files by name and metadata',
    },
    'drive_version_history': {
      name: 'Version History',
      requiredTier: 'standard',
      module: 'drive',
      category: 'premium',
      description: 'Basic version history and restore',
    },

    // Enterprise Drive Features
    'drive_advanced_sharing': {
      name: 'Advanced File Sharing',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Granular permissions, expiration dates, password protection',
      usageLimit: 1000,
      usageMetric: 'advanced_shares',
    },
    'drive_audit_logs': {
      name: 'File Audit Logs',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Complete file access tracking and compliance reporting',
    },
    'drive_dlp': {
      name: 'Data Loss Prevention',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Sensitive data detection and policy enforcement',
    },
    'drive_advanced_search': {
      name: 'Advanced Search',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Full-text search across documents with AI-powered insights',
    },
    'drive_retention_policies': {
      name: 'Data Retention Policies',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Automated data retention and compliance management',
    },
    'drive_advanced_versioning': {
      name: 'Advanced Version Control',
      requiredTier: 'enterprise',
      module: 'drive',
      category: 'enterprise',
      description: 'Branching, merging, and collaborative editing',
    },

    // ===== CHAT MODULE FEATURES =====
    // Core Chat Features (Free Tier)
    'chat_view': {
      name: 'View Messages',
      requiredTier: 'free',
      module: 'chat',
      category: 'core',
      description: 'View chat messages and conversations',
    },
    'chat_send': {
      name: 'Send Messages',
      requiredTier: 'free',
      module: 'chat',
      category: 'core',
      description: 'Send messages and basic attachments',
      usageLimit: 1000,
      usageMetric: 'messages_sent',
    },

    // Premium Chat Features (Standard Tier)
    'chat_file_sharing': {
      name: 'File Sharing in Chat',
      requiredTier: 'standard',
      module: 'chat',
      category: 'premium',
      description: 'Share files and documents in conversations',
    },
    'chat_reactions': {
      name: 'Message Reactions',
      requiredTier: 'standard',
      module: 'chat',
      category: 'premium',
      description: 'React to messages with emojis',
    },
    'chat_search': {
      name: 'Message Search',
      requiredTier: 'standard',
      module: 'chat',
      category: 'premium',
      description: 'Search messages and conversation history',
    },

    // Enterprise Chat Features
    'chat_message_retention': {
      name: 'Message Retention Policies',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'Configurable retention policies and archiving',
    },
    'chat_compliance_mode': {
      name: 'Compliance & Legal Hold',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'Legal hold, eDiscovery, and compliance features',
    },
    'chat_advanced_moderation': {
      name: 'Advanced Moderation',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'AI-powered content filtering and approval workflows',
    },
    'chat_encryption': {
      name: 'End-to-End Encryption',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'End-to-end encryption for sensitive conversations',
    },
    'chat_analytics': {
      name: 'Communication Analytics',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'Team collaboration insights and productivity metrics',
    },
    'chat_external_integrations': {
      name: 'External Integrations',
      requiredTier: 'enterprise',
      module: 'chat',
      category: 'enterprise',
      description: 'Connect with Slack, Teams, and other communication tools',
    },

    // ===== CALENDAR MODULE FEATURES =====
    // Core Calendar Features (Free Tier)
    'calendar_view': {
      name: 'View Events',
      requiredTier: 'free',
      module: 'calendar',
      category: 'core',
      description: 'View calendar events and schedules',
    },
    'calendar_create': {
      name: 'Create Events',
      requiredTier: 'free',
      module: 'calendar',
      category: 'core',
      description: 'Create basic calendar events',
      usageLimit: 100,
      usageMetric: 'events_created',
    },

    // Premium Calendar Features (Standard Tier)
    'calendar_attendees': {
      name: 'Event Attendees',
      requiredTier: 'standard',
      module: 'calendar',
      category: 'premium',
      description: 'Invite attendees and manage RSVPs',
    },
    'calendar_reminders': {
      name: 'Smart Reminders',
      requiredTier: 'standard',
      module: 'calendar',
      category: 'premium',
      description: 'Customizable reminders and notifications',
    },
    'calendar_recurring': {
      name: 'Recurring Events',
      requiredTier: 'standard',
      module: 'calendar',
      category: 'premium',
      description: 'Create recurring events with flexible patterns',
    },

    // Enterprise Calendar Features
    'calendar_resource_booking': {
      name: 'Resource Booking',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'Book conference rooms, equipment, and shared resources',
    },
    'calendar_approval_workflows': {
      name: 'Event Approval Workflows',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'Approval workflows for sensitive meetings and resources',
    },
    'calendar_ai_scheduling': {
      name: 'AI-Powered Scheduling',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'AI suggestions for optimal meeting times and scheduling',
    },
    'calendar_external_sync': {
      name: 'External Calendar Sync',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'Deep integration with Google Calendar, Outlook, and other systems',
    },
    'calendar_compliance': {
      name: 'Meeting Compliance',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'Meeting audit trails, recording policies, and compliance features',
    },
    'calendar_analytics': {
      name: 'Meeting Analytics',
      requiredTier: 'enterprise',
      module: 'calendar',
      category: 'enterprise',
      description: 'Meeting effectiveness insights and time optimization analytics',
    },

    // ===== DASHBOARD MODULE FEATURES =====
    // Core Dashboard Features (Free Tier)
    'dashboard_view': {
      name: 'View Dashboard',
      requiredTier: 'free',
      module: 'dashboard',
      category: 'core',
      description: 'View basic dashboard and widgets',
    },
    'dashboard_basic_widgets': {
      name: 'Basic Widgets',
      requiredTier: 'free',
      module: 'dashboard',
      category: 'core',
      description: 'Access to basic dashboard widgets',
    },

    // Premium Dashboard Features (Standard Tier)
    'dashboard_customization': {
      name: 'Dashboard Customization',
      requiredTier: 'standard',
      module: 'dashboard',
      category: 'premium',
      description: 'Customize dashboard layout and widget preferences',
    },
    'dashboard_basic_analytics': {
      name: 'Basic Analytics',
      requiredTier: 'standard',
      module: 'dashboard',
      category: 'premium',
      description: 'Basic usage analytics and reporting',
    },

    // Enterprise Dashboard Features
    'dashboard_custom_widgets': {
      name: 'Custom Widget Builder',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Drag-and-drop custom widget builder with data connections',
    },
    'dashboard_advanced_analytics': {
      name: 'Advanced Business Intelligence',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Real-time business intelligence with predictive analytics',
      usageLimit: 1000,
      usageMetric: 'analytics_queries',
    },
    'dashboard_ai_insights': {
      name: 'AI-Powered Insights',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Cross-module AI insights and automated recommendations',
    },
    'dashboard_executive_reporting': {
      name: 'Executive Reporting',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Automated executive summary generation and reporting',
    },
    'dashboard_compliance_monitoring': {
      name: 'Compliance Monitoring',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Real-time compliance monitoring and risk assessment',
    },
    'dashboard_custom_data_sources': {
      name: 'Custom Data Sources',
      requiredTier: 'enterprise',
      module: 'dashboard',
      category: 'enterprise',
      description: 'Connect external data sources and APIs',
    },

    // ===== BUSINESS FEATURES =====
    'business_workspace': {
      name: 'Business Workspace',
      requiredTier: 'standard',
      module: 'business',
      category: 'premium',
      description: 'Create and manage business workspaces',
      usageLimit: 10,
      usageMetric: 'business_workspaces',
    },
    'team_collaboration': {
      name: 'Team Collaboration',
      requiredTier: 'enterprise',
      module: 'business',
      category: 'enterprise',
      description: 'Advanced team collaboration and workflow features',
      usageLimit: 100,
      usageMetric: 'team_members',
    },
    'custom_modules': {
      name: 'Custom Modules',
      requiredTier: 'enterprise',
      module: 'business',
      category: 'enterprise',
      description: 'Install and manage custom enterprise modules',
      usageLimit: 50,
      usageMetric: 'custom_modules',
    },
  };

  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(
    userId: string,
    featureName: string,
    businessId?: string
  ): Promise<{ hasAccess: boolean; reason?: string; usageInfo?: UsageLimit }> {
    const feature = this.FEATURES[featureName];
    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' };
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: businessId
        ? { businessId, status: 'active' }
        : { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    const userTier = subscription?.tier || 'free';
    const hasTierAccess = this.compareTiers(userTier, feature.requiredTier);

    if (!hasTierAccess) {
      return {
        hasAccess: false,
        reason: `Requires ${feature.requiredTier} tier, current tier: ${userTier}`,
      };
    }

    // Check usage limits if applicable
    if (feature.usageLimit && feature.usageMetric) {
      const usageInfo = await this.getUsageInfo(userId, feature.usageMetric, feature.usageLimit, businessId);
      
      if (usageInfo.currentUsage >= usageInfo.limit) {
        return {
          hasAccess: false,
          reason: `Usage limit exceeded for ${feature.name}`,
          usageInfo,
        };
      }

      return { hasAccess: true, usageInfo };
    }

    return { hasAccess: true };
  }

  /**
   * Record usage for a specific metric
   */
  static async recordUsage(
    userId: string,
    metric: string,
    quantity: number = 1,
    cost: number = 0,
    businessId?: string
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: businessId ? { businessId, status: 'active' } : { userId, status: 'active' },
    });

    await prisma.usageRecord.create({
      data: {
        userId,
        subscriptionId: subscription?.id,
        metric,
        quantity,
        cost,
        periodStart,
        periodEnd,
        businessId: businessId || null,
      },
    });
  }

  /**
   * Get usage information for a specific metric
   */
  static async getUsageInfo(
    userId: string,
    metric: string,
    limit: number,
    businessId?: string
  ): Promise<UsageLimit> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await prisma.usageRecord.aggregate({
      where: businessId
        ? { businessId, metric, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
        : { userId, metric, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
      _sum: {
        quantity: true,
      },
    });

    const currentUsage = usage._sum.quantity || 0;

    return {
      metric,
      limit,
      currentUsage,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  /**
   * Get all usage information for a user
   */
  static async getUserUsage(userId: string, businessId?: string): Promise<UsageLimit[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageRecords = await prisma.usageRecord.groupBy({
      by: ['metric'],
      where: businessId
        ? { businessId, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
        : { userId, periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
      _sum: { quantity: true },
    });

    return usageRecords.map(record => {
      const feature = Object.values(this.FEATURES).find(f => f.usageMetric === record.metric);
      const limit = feature?.usageLimit || 0;
      
      return {
        metric: record.metric,
        limit,
        currentUsage: record._sum.quantity || 0,
        remaining: Math.max(0, limit - (record._sum.quantity || 0)),
      };
    });
  }

  /**
   * Get all available features for a user
   */
  static async getUserFeatures(userId: string, businessId?: string): Promise<Array<FeatureConfig & { hasAccess: boolean; usageInfo?: UsageLimit }>> {
    const results = [];

    for (const [featureName, feature] of Object.entries(this.FEATURES)) {
      const access = await this.checkFeatureAccess(userId, featureName, businessId);
      results.push({
        ...feature,
        hasAccess: access.hasAccess,
        usageInfo: access.usageInfo,
      });
    }

    return results;
  }

  /**
   * Compare subscription tiers
   */
  private static compareTiers(userTier: string, requiredTier: string): boolean {
    const tierHierarchy = {
      free: 0,
      standard: 1,
      enterprise: 2,
    };

    const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Get feature configuration
   */
  static getFeatureConfig(featureName: string): FeatureConfig | null {
    return this.FEATURES[featureName] || null;
  }

  /**
   * Get all feature configurations
   */
  static getAllFeatures(): Record<string, FeatureConfig> {
    return { ...this.FEATURES };
  }

  /**
   * Get features by module
   */
  static getModuleFeatures(module: string): Record<string, FeatureConfig> {
    const moduleFeatures: Record<string, FeatureConfig> = {};
    
    for (const [featureName, feature] of Object.entries(this.FEATURES)) {
      if (feature.module === module) {
        moduleFeatures[featureName] = feature;
      }
    }
    
    return moduleFeatures;
  }

  /**
   * Get features by category
   */
  static getFeaturesByCategory(category: 'core' | 'premium' | 'enterprise'): Record<string, FeatureConfig> {
    const categoryFeatures: Record<string, FeatureConfig> = {};
    
    for (const [featureName, feature] of Object.entries(this.FEATURES)) {
      if (feature.category === category) {
        categoryFeatures[featureName] = feature;
      }
    }
    
    return categoryFeatures;
  }

  /**
   * Get features by tier
   */
  static getFeaturesByTier(tier: 'free' | 'standard' | 'enterprise'): Record<string, FeatureConfig> {
    const tierFeatures: Record<string, FeatureConfig> = {};
    
    for (const [featureName, feature] of Object.entries(this.FEATURES)) {
      if (feature.requiredTier === tier) {
        tierFeatures[featureName] = feature;
      }
    }
    
    return tierFeatures;
  }

  /**
   * Check if user has access to all core features of a module
   */
  static async checkModuleAccess(
    userId: string,
    module: string,
    businessId?: string
  ): Promise<{ hasAccess: boolean; missingFeatures: string[]; availableFeatures: string[] }> {
    const moduleFeatures = this.getModuleFeatures(module);
    const coreFeatures = Object.entries(moduleFeatures).filter(([_, feature]) => feature.category === 'core');
    
    const missingFeatures: string[] = [];
    const availableFeatures: string[] = [];
    
    for (const [featureName, _] of coreFeatures) {
      const access = await this.checkFeatureAccess(userId, featureName, businessId);
      if (access.hasAccess) {
        availableFeatures.push(featureName);
      } else {
        missingFeatures.push(featureName);
      }
    }
    
    return {
      hasAccess: missingFeatures.length === 0,
      missingFeatures,
      availableFeatures
    };
  }

  /**
   * Get user's feature access summary for a module
   */
  static async getModuleFeatureAccess(
    userId: string,
    module: string,
    businessId?: string
  ): Promise<{
    core: { available: string[]; locked: string[] };
    premium: { available: string[]; locked: string[] };
    enterprise: { available: string[]; locked: string[] };
  }> {
    const moduleFeatures = this.getModuleFeatures(module);
    
    const result = {
      core: { available: [] as string[], locked: [] as string[] },
      premium: { available: [] as string[], locked: [] as string[] },
      enterprise: { available: [] as string[], locked: [] as string[] }
    };
    
    for (const [featureName, feature] of Object.entries(moduleFeatures)) {
      const access = await this.checkFeatureAccess(userId, featureName, businessId);
      const category = feature.category;
      
      if (access.hasAccess) {
        result[category].available.push(featureName);
      } else {
        result[category].locked.push(featureName);
      }
    }
    
    return result;
  }

  /**
   * Check if feature requires business context
   */
  static requiresBusinessContext(featureName: string): boolean {
    const feature = this.FEATURES[featureName];
    if (!feature) return false;
    
    // Business workspace and team collaboration features require business context
    return feature.module === 'business' || 
           featureName.includes('team_') || 
           featureName.includes('business_');
  }
} 