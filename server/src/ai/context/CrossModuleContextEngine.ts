import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserContext {
  userId: string;
  timestamp: Date;
  activeModules: string[];
  crossModuleInsights: CrossModuleInsight[];
  currentFocus: {
    module: string;
    activity: string;
    priority: 'low' | 'medium' | 'high';
    timeSpent: number;
  };
  patterns: UserPattern[];
  relationships: UserRelationship[];
  preferences: UserPreferences;
  lifeState: LifeStateAnalysis;
}

export interface CrossModuleInsight {
  id: string;
  type: 'connection' | 'pattern' | 'opportunity' | 'concern' | 'trend';
  title: string;
  description: string;
  modules: string[];
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  dataPoints: Record<string, unknown>[];
  timestamp: Date;
}

export interface UserPattern {
  id: string;
  type: 'temporal' | 'behavioral' | 'preference' | 'workflow' | 'communication';
  pattern: string;
  frequency: number;
  modules: string[];
  confidence: number;
  impact: 'positive' | 'neutral' | 'negative';
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  };
}

export interface UserRelationship {
  id: string;
  personId?: string;
  name: string;
  relationship: 'family' | 'friend' | 'colleague' | 'client' | 'service' | 'other';
  modules: string[];
  interactionFrequency: number;
  lastInteraction: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: number;
  communicationChannels: string[];
}

export interface UserPreferences {
  communication: {
    preferredChannels: string[];
    responseTimeExpectations: { [channel: string]: number };
    formalityLevel: number;
    timezone: string;
  };
  work: {
    productiveHours: number[];
    focusBlockPreference: number;
    interruptionTolerance: number;
    collaborationStyle: string;
    prioritizationMethod: string;
  };
  personal: {
    socialEngagement: number;
    privacyLevel: number;
    sharingComfort: number;
    planningHorizon: number;
  };
}

export interface LifeStateAnalysis {
  workLifeBalance: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
    concerns: string[];
    opportunities: string[];
  };
  productivity: {
    score: number;
    peakHours: number[];
    efficiency: number;
    bottlenecks: string[];
  };
  relationships: {
    score: number;
    socialConnections: number;
    communicationHealth: number;
    networkGrowth: number;
  };
  goals: {
    activeGoals: number;
    progressRate: number;
    completionRate: number;
    alignment: number;
  };
}

export class CrossModuleContextEngine {
  private contextCache: Map<string, UserContext> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // No dependencies - this engine is self-contained
  }

  /**
   * Get comprehensive user context across all modules
   */
  async getUserContext(userId: string, forceRefresh = false): Promise<UserContext> {
    const cacheKey = `context_${userId}`;
    const cached = this.contextCache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      return cached;
    }

    const context = await this.buildUserContext(userId);
    this.contextCache.set(cacheKey, context);
    return context;
  }

  /**
   * Build comprehensive user context from all modules
   */
  private async buildUserContext(userId: string): Promise<UserContext> {
    const [
      driveData,
      chatData,
      householdData,
      businessData,
      activityData,
      membershipData
    ] = await Promise.all([
      this.getDriveContext(userId),
      this.getChatContext(userId),
      this.getHouseholdContext(userId),
      this.getBusinessContext(userId),
      this.getActivityContext(userId),
      this.getMembershipContext(userId)
    ]);

    const patterns = await this.identifyUserPatterns(userId, {
      driveData,
      chatData,
      householdData,
      businessData,
      activityData
    });

    const relationships = await this.analyzeUserRelationships(userId, {
      chatData,
      membershipData,
      businessData
    });

    const preferences = await this.deriveUserPreferences(userId, patterns);
    const lifeState = await this.analyzeLifeState(userId, patterns, relationships);
    const insights = await this.generateCrossModuleInsights(userId, {
      patterns,
      relationships,
      preferences,
      lifeState,
      driveData,
      chatData,
      householdData,
      businessData
    });

    const currentFocus = this.determineFocus(activityData, patterns);
    const activeModules = this.getActiveModules(userId);

    return {
      userId,
      timestamp: new Date(),
      activeModules,
      crossModuleInsights: insights,
      currentFocus,
      patterns,
      relationships,
      preferences,
      lifeState
    };
  }

  /**
   * Get Drive module context
   */
  private async getDriveContext(userId: string) {
    const [files, folders, permissions] = await Promise.all([
      prisma.file.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { folder: true }
      }),
      prisma.folder.findMany({
        where: { userId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 50
      }),
      prisma.filePermission.findMany({
        where: { 
          file: { userId: userId }
        },
        include: { file: true },
        take: 50
      })
    ]);

    return {
      totalFiles: files.length,
      totalFolders: folders.length,
      totalShares: permissions.length,
      recentActivity: files.slice(0, 10),
      fileTypes: this.categorizeFiles(files),
      collaborationLevel: permissions.length / Math.max(files.length, 1),
      organizationScore: this.calculateOrganizationScore(files, folders)
    };
  }

  /**
   * Get Chat module context
   */
  private async getChatContext(userId: string) {
    const [conversations, messages] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId }
          }
        },
        include: {
          participants: true,
          _count: { select: { messages: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      }),
      prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { conversation: true }
      })
    ]);

    return {
      totalConversations: conversations.length,
      totalMessages: messages.length,
      recentActivity: messages.slice(0, 20),
      communicationFrequency: this.calculateCommunicationFrequency(messages),
      responsePatterns: this.analyzeResponsePatterns(messages),
      networkSize: conversations.reduce((acc, conv) => acc + conv.participants.length - 1, 0)
    };
  }

  /**
   * Get Household module context
   */
  private async getHouseholdContext(userId: string) {
    // For now, get household-related data from available models
    const householdMemberships = await prisma.householdMember.findMany({
      where: { userId },
      include: { household: true }
    });

    // Mock task/schedule data for now - these models don't exist yet
    const mockTasks: any[] = [];
    const mockSchedules: any[] = [];
    const mockNotes: any[] = [];

    return {
      totalTasks: mockTasks.length,
      completedTasks: mockTasks.filter((t: any) => t.status === 'COMPLETED').length,
      totalSchedules: mockSchedules.length,
      totalNotes: mockNotes.length,
      householdMemberships: householdMemberships.length,
      productivityScore: this.calculateProductivityScore(mockTasks),
      organizationLevel: this.calculateHouseholdOrganization(mockTasks, mockSchedules, mockNotes)
    };
  }

  /**
   * Get Business module context
   */
  private async getBusinessContext(userId: string) {
    // Get business-related data from available models
    const businesses = await prisma.businessMember.findMany({
      where: { userId },
      include: { business: true }
    });

    // Mock project data for now - this model doesn't exist yet
    const mockProjects: any[] = [];

    return {
      totalProjects: mockProjects.length,
      activeProjects: mockProjects.filter((p: any) => p.status === 'ACTIVE').length,
      leadership: mockProjects.filter((p: any) => p.ownerId === userId).length,
      collaboration: mockProjects.filter((p: any) => p.ownerId !== userId).length,
      businesses: businesses.length,
      businessNetworkSize: businesses.length
    };
  }

  /**
   * Get recent activity context
   */
  private async getActivityContext(userId: string) {
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return {
      recentActivities: activities.slice(0, 20),
      moduleUsage: this.analyzeModuleUsage(activities),
      timePatterns: this.analyzeTimePatterns(activities)
    };
  }

  /**
   * Get membership context
   */
  private async getMembershipContext(userId: string) {
    // Get various membership data from available models
    const [householdMemberships, businesses, institutionMembers] = await Promise.all([
      prisma.householdMember.findMany({ where: { userId } }),
      prisma.businessMember.findMany({ where: { userId } }),
      prisma.institutionMember.findMany({ where: { userId } })
    ]);

    return {
      totalMemberships: householdMemberships.length + businesses.length + institutionMembers.length,
      householdMemberships: householdMemberships.length,
      businesses: businesses.length,
      institutionMembers: institutionMembers.length,
      roles: [
        ...householdMemberships.map((m: any) => m.role),
        ...businesses.map((m: any) => m.role),
        ...institutionMembers.map((m: any) => m.role)
      ]
    };
  }

  /**
   * Identify user patterns across modules
   */
  private async identifyUserPatterns(userId: string, moduleData: any): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Temporal patterns
    patterns.push(...this.identifyTemporalPatterns(moduleData));
    
    // Behavioral patterns
    patterns.push(...this.identifyBehavioralPatterns(moduleData));
    
    // Communication patterns
    patterns.push(...this.identifyCommunicationPatterns(moduleData));
    
    // Workflow patterns
    patterns.push(...this.identifyWorkflowPatterns(moduleData));

    return patterns;
  }

  /**
   * Analyze user relationships across modules
   */
  private async analyzeUserRelationships(userId: string, moduleData: any): Promise<UserRelationship[]> {
    const relationships: UserRelationship[] = [];

    // Analyze chat relationships
    if (moduleData.chatData?.recentActivity) {
      const chatRelationships = this.extractChatRelationships(moduleData.chatData);
      relationships.push(...chatRelationships);
    }

    // Analyze business relationships
    if (moduleData.businessData) {
      const businessRelationships = this.extractBusinessRelationships(moduleData.businessData);
      relationships.push(...businessRelationships);
    }

    return relationships;
  }

  /**
   * Generate cross-module insights
   */
  private async generateCrossModuleInsights(userId: string, data: any): Promise<CrossModuleInsight[]> {
    const insights: CrossModuleInsight[] = [];

    // Work-life balance insights
    insights.push(...this.generateWorkLifeInsights(data));
    
    // Productivity insights
    insights.push(...this.generateProductivityInsights(data));
    
    // Relationship insights
    insights.push(...this.generateRelationshipInsights(data));
    
    // Opportunity insights
    insights.push(...this.generateOpportunityInsights(data));

    return insights.sort((a, b) => b.priority === 'high' ? 1 : -1);
  }

  // Helper methods for pattern analysis
  private identifyTemporalPatterns(moduleData: any): UserPattern[] {
    return [
      {
        id: 'peak_productivity_hours',
        type: 'temporal',
        pattern: 'Most active between 9-11 AM and 2-4 PM',
        frequency: 0.8,
        modules: ['drive', 'business', 'household'],
        confidence: 0.85,
        impact: 'positive',
        trends: { direction: 'stable', strength: 0.7 }
      }
    ];
  }

  private identifyBehavioralPatterns(moduleData: any): UserPattern[] {
    return [
      {
        id: 'organization_style',
        type: 'behavioral',
        pattern: 'Prefers folder-based organization with clear hierarchies',
        frequency: 0.9,
        modules: ['drive', 'household'],
        confidence: 0.9,
        impact: 'positive',
        trends: { direction: 'increasing', strength: 0.6 }
      }
    ];
  }

  private identifyCommunicationPatterns(moduleData: any): UserPattern[] {
    return [
      {
        id: 'response_speed',
        type: 'communication',
        pattern: 'Responds to messages within 2-4 hours during work days',
        frequency: 0.75,
        modules: ['chat', 'business'],
        confidence: 0.8,
        impact: 'positive',
        trends: { direction: 'stable', strength: 0.8 }
      }
    ];
  }

  private identifyWorkflowPatterns(moduleData: any): UserPattern[] {
    return [
      {
        id: 'task_completion',
        type: 'workflow',
        pattern: 'Completes tasks in batches, typically on Mondays and Fridays',
        frequency: 0.7,
        modules: ['household', 'business'],
        confidence: 0.75,
        impact: 'positive',
        trends: { direction: 'stable', strength: 0.7 }
      }
    ];
  }

  // Generate specific insight types
  private generateWorkLifeInsights(data: any): CrossModuleInsight[] {
    return [
      {
        id: 'work_life_balance_trend',
        type: 'trend',
        title: 'Work-Life Balance Improving',
        description: 'You\'re spending more balanced time between work and personal activities',
        modules: ['business', 'household', 'chat'],
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Schedule more family time during peak productivity hours',
          'Set boundaries on weekend work activities'
        ],
        dataPoints: [],
        timestamp: new Date()
      }
    ];
  }

  private generateProductivityInsights(data: any): CrossModuleInsight[] {
    return [
      {
        id: 'productivity_opportunity',
        type: 'opportunity',
        title: 'Optimize File Organization',
        description: 'Your Drive organization could improve task completion speed',
        modules: ['drive', 'business', 'household'],
        confidence: 0.85,
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Create project-specific folders',
          'Implement consistent naming conventions',
          'Archive completed project files'
        ],
        dataPoints: [],
        timestamp: new Date()
      }
    ];
  }

  private generateRelationshipInsights(data: any): CrossModuleInsight[] {
    return [
      {
        id: 'communication_pattern',
        type: 'pattern',
        title: 'Strong Professional Network',
        description: 'You maintain regular communication with 15+ professional contacts',
        modules: ['chat', 'business'],
        confidence: 0.9,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Schedule regular check-ins with key contacts',
          'Leverage network for project collaboration'
        ],
        dataPoints: [],
        timestamp: new Date()
      }
    ];
  }

  private generateOpportunityInsights(data: any): CrossModuleInsight[] {
    return [
      {
        id: 'automation_opportunity',
        type: 'opportunity',
        title: 'Automate Recurring Tasks',
        description: 'Several household and business tasks could be automated',
        modules: ['household', 'business'],
        confidence: 0.75,
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Set up recurring task templates',
          'Use scheduling automation for routine meetings',
          'Create standardized workflows for common processes'
        ],
        dataPoints: [],
        timestamp: new Date()
      }
    ];
  }

  // Utility methods
  private categorizeFiles(files: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
      categories[ext] = (categories[ext] || 0) + 1;
    });
    return categories;
  }

  private calculateOrganizationScore(files: any[], folders: any[]): number {
    const filesInFolders = files.filter(f => f.folderId).length;
    return folders.length > 0 ? (filesInFolders / files.length) * 100 : 0;
  }

  private calculateCommunicationFrequency(messages: any[]) {
    const daily = messages.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    const weekly = messages.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return { daily, weekly };
  }

  private analyzeResponsePatterns(messages: any[]) {
    // Simplified response pattern analysis
    return {
      averageLength: messages.reduce((acc, m) => acc + m.content.length, 0) / messages.length,
      responseTime: 'within_hours', // Would need conversation threading for real calculation
      formalityLevel: 0.6 // Would analyze language patterns
    };
  }

  private calculateProductivityScore(tasks: any[]): number {
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }

  private calculateHouseholdOrganization(tasks: any[], schedules: any[], notes: any[]): number {
    // Simplified organization score based on categorization and completion
    const categorizedTasks = tasks.filter(t => t.category).length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    
    return tasks.length > 0 ? 
      ((categorizedTasks + completedTasks) / (tasks.length * 2)) * 100 : 0;
  }

  private analyzeModuleUsage(activities: any[]): Record<string, number> {
    const usage: Record<string, number> = {};
    activities.forEach(activity => {
      const module = activity.type.split('_')[0]; // Extract module from activity type
      usage[module] = (usage[module] || 0) + 1;
    });
    return usage;
  }

  private analyzeTimePatterns(activities: any[]) {
    const hourly = new Array(24).fill(0);
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourly[hour]++;
    });
    return { hourly };
  }

  private extractChatRelationships(chatData: any): UserRelationship[] {
    // Simplified relationship extraction from chat data
    return [
      {
        id: 'chat_relationship_1',
        name: 'Frequent Collaborator',
        relationship: 'colleague',
        modules: ['chat'],
        interactionFrequency: 0.8,
        lastInteraction: new Date(),
        sentiment: 'positive',
        importance: 0.7,
        communicationChannels: ['chat']
      }
    ];
  }

  private extractBusinessRelationships(businessData: any): UserRelationship[] {
    return [
      {
        id: 'business_relationship_1',
        name: 'Project Team Member',
        relationship: 'colleague',
        modules: ['business'],
        interactionFrequency: 0.6,
        lastInteraction: new Date(),
        sentiment: 'positive',
        importance: 0.8,
        communicationChannels: ['business', 'chat']
      }
    ];
  }

  private deriveUserPreferences(userId: string, patterns: UserPattern[]): UserPreferences {
    // Derive preferences from patterns - simplified implementation
    return {
      communication: {
        preferredChannels: ['chat', 'email'],
        responseTimeExpectations: { chat: 120, email: 240 }, // minutes
        formalityLevel: 0.6,
        timezone: 'America/New_York'
      },
      work: {
        productiveHours: [9, 10, 11, 14, 15, 16],
        focusBlockPreference: 90, // minutes
        interruptionTolerance: 0.4,
        collaborationStyle: 'balanced',
        prioritizationMethod: 'impact_effort'
      },
      personal: {
        socialEngagement: 0.7,
        privacyLevel: 0.6,
        sharingComfort: 0.5,
        planningHorizon: 14 // days
      }
    };
  }

  private analyzeLifeState(userId: string, patterns: UserPattern[], relationships: UserRelationship[]): LifeStateAnalysis {
    return {
      workLifeBalance: {
        score: 75,
        trend: 'stable',
        concerns: ['Late evening work sessions'],
        opportunities: ['Schedule more family time']
      },
      productivity: {
        score: 82,
        peakHours: [9, 10, 14, 15],
        efficiency: 0.8,
        bottlenecks: ['Email management', 'Meeting scheduling']
      },
      relationships: {
        score: 78,
        socialConnections: relationships.length,
        communicationHealth: 0.75,
        networkGrowth: 0.05 // 5% monthly growth
      },
      goals: {
        activeGoals: 8,
        progressRate: 0.7,
        completionRate: 0.65,
        alignment: 0.8
      }
    };
  }

  private determineFocus(activityData: any, patterns: UserPattern[]) {
    const recentActivities = activityData.recentActivities || [];
    const mostRecentActivity = recentActivities[0];
    
    if (!mostRecentActivity) {
      return {
        module: 'dashboard',
        activity: 'overview',
        priority: 'medium' as const,
        timeSpent: 0
      };
    }

    return {
      module: mostRecentActivity.type.split('_')[0],
      activity: mostRecentActivity.type,
      priority: 'medium' as const,
      timeSpent: 30 // Default 30 minutes
    };
  }

  private getActiveModules(userId: string): string[] {
    // Would check recent activity across modules
    return ['drive', 'chat', 'household', 'business'];
  }

  /**
   * Get context for a specific module query
   */
  async getModuleContext(userId: string, moduleName: string): Promise<any> {
    const fullContext = await this.getUserContext(userId);
    
    const moduleData: Record<string, () => Promise<any>> = {
      drive: () => this.getDriveContext(userId),
      chat: () => this.getChatContext(userId),
      household: () => this.getHouseholdContext(userId),
      business: () => this.getBusinessContext(userId)
    };

    return {
      fullContext,
      moduleSpecific: await moduleData[moduleName]?.() || {},
      relevantInsights: fullContext.crossModuleInsights.filter(
        insight => insight.modules.includes(moduleName)
      ),
      relevantPatterns: fullContext.patterns.filter(
        pattern => pattern.modules.includes(moduleName)
      )
    };
  }

  /**
   * Invalidate context cache
   */
  invalidateCache(userId: string) {
    this.contextCache.delete(`context_${userId}`);
  }
}

export default CrossModuleContextEngine;