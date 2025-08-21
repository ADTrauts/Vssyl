import { PrismaClient } from '@prisma/client';
import { DigitalLifeTwinService } from '../core/DigitalLifeTwinService';
import { CentralizedLearningEngine } from '../learning/CentralizedLearningEngine';

// Types and Interfaces
export interface BusinessAIConfig {
  businessId: string;
  name: string;
  description?: string;
  aiPersonality: BusinessAIPersonality;
  capabilities: BusinessAICapabilities;
  restrictions: BusinessAIRestrictions;
  securityLevel: 'standard' | 'high' | 'maximum';
  complianceMode: boolean;
}

export interface BusinessAIPersonality {
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  expertise: string[]; // Areas of business expertise
  communicationStyle: 'direct' | 'detailed' | 'concise' | 'collaborative';
  decisionMaking: 'conservative' | 'balanced' | 'aggressive';
  industryFocus: string;
  companyValues: string[];
}

export interface BusinessAICapabilities {
  documentAnalysis: boolean;
  emailDrafting: boolean;
  meetingSummarization: boolean;
  workflowOptimization: boolean;
  dataAnalysis: boolean;
  projectManagement: boolean;
  employeeAssistance: boolean;
  complianceMonitoring: boolean;
  crossModuleIntegration: boolean;
  predictiveAnalytics: boolean;
}

export interface BusinessAIRestrictions {
  maxInteractionsPerDay: number;
  maxResponseLength: number;
  sensitiveDataAccess: boolean;
  externalAPIAccess: boolean;
  employeeDataAccess: 'none' | 'limited' | 'full';
  clientDataAccess: 'none' | 'limited' | 'full';
  financialDataAccess: boolean;
  crossDepartmentAccess: boolean;
}

export interface EmployeeWorkContext {
  currentModule: string;
  recentActivity: any[];
  userRole: string;
  departmentId?: string;
  activeProjects: string[];
  permissions: string[];
}

export interface BusinessAIResponse {
  message: string;
  confidence: number;
  reasoning?: string;
  suggestedActions?: string[];
  complianceNotes?: string[];
  sources?: string[];
  processingTime: number;
}

export interface BusinessAILearningSettings {
  autoLearning: boolean;
  requireApproval: boolean;
  learningFromEmployees: boolean;
  crossDepartmentLearning: boolean;
  industryPatternLearning: boolean;
  allowCentralizedLearning: boolean;
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  dataRetentionDays: number;
}

/**
 * Business AI Digital Twin Service
 * 
 * Manages AI digital twins for businesses, providing enterprise-level
 * AI assistance while maintaining strict security and privacy controls.
 */
export class BusinessAIDigitalTwinService {
  private prisma: PrismaClient;
  private personalAIService: DigitalLifeTwinService;
  private centralizedLearning: CentralizedLearningEngine;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.personalAIService = new DigitalLifeTwinService(prisma);
    this.centralizedLearning = new CentralizedLearningEngine(prisma);
  }

  /**
   * Initialize AI Digital Twin for a business
   */
  async initializeBusinessAI(
    businessId: string, 
    adminUserId: string,
    config?: Partial<BusinessAIConfig>
  ): Promise<any> {
    try {
      // Check if business already has AI twin
      const existing = await this.prisma.businessAIDigitalTwin.findUnique({
        where: { businessId }
      });

      if (existing) {
        throw new Error('Business AI Digital Twin already exists');
      }

      // Get business details for personalization
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        include: {
          departments: true,
          members: true
        }
      });

      if (!business) {
        throw new Error('Business not found');
      }

      // Create default configuration based on business
      const defaultConfig = this.generateDefaultConfig(business);
      const finalConfig = { ...defaultConfig, ...config };

      // Create business AI digital twin
      const businessAI = await this.prisma.businessAIDigitalTwin.create({
        data: {
          businessId,
          name: finalConfig.name || `${business.name} AI Assistant`,
          description: finalConfig.description,
          aiPersonality: finalConfig.aiPersonality as any,
          capabilities: finalConfig.capabilities as any,
          restrictions: finalConfig.restrictions as any,
          securityLevel: finalConfig.securityLevel || 'standard',
          complianceMode: finalConfig.complianceMode || false,
          adminUsers: [adminUserId],
          learningSettings: this.getDefaultLearningSettings() as any,
          auditSettings: this.getDefaultAuditSettings() as any,
          status: 'active'
        }
      });

      // Log the initialization
      await this.auditBusinessAIAction(
        businessId,
        adminUserId,
        'ai_twin_initialized',
        { businessAIId: businessAI.id, config: finalConfig }
      );

      return businessAI;
    } catch (error) {
      console.error('Failed to initialize business AI:', error);
      throw error;
    }
  }

  /**
   * Process employee AI interaction with business context
   */
  async processEmployeeInteraction(
    businessId: string,
    userId: string,
    query: string,
    context: EmployeeWorkContext
  ): Promise<BusinessAIResponse> {
    const startTime = Date.now();

    try {
      // Get business AI configuration
      const businessAI = await this.getBusinessAI(businessId);
      if (!businessAI) {
        throw new Error('Business AI not found');
      }

      // Validate user access
      await this.validateEmployeeAccess(businessId, userId, businessAI);

      // Get employee context within business
      const employeeContext = await this.getEmployeeBusinessContext(businessId, userId);

      // Process with business AI intelligence
      const response = await this.processWithBusinessIntelligence(
        businessAI,
        query,
        employeeContext,
        context
      );

      const processingTime = Date.now() - startTime;
      response.processingTime = processingTime;

      // Log the interaction
      await this.logBusinessAIInteraction(businessAI.id, userId, query, response, context);

      // Update usage metrics
      await this.updateUsageMetrics(businessAI.id, response);

      // Generate learning events if applicable
      await this.generateLearningEvents(businessAI, userId, query, response, context);

      return response;
    } catch (error) {
      console.error('Employee AI interaction failed:', error);
      throw error;
    }
  }

  /**
   * Update business AI controls (admin only)
   */
  async updateBusinessAIControls(
    businessId: string,
    adminUserId: string,
    settings: Partial<BusinessAIConfig>
  ): Promise<void> {
    try {
      // Validate admin access
      await this.validateAdminAccess(businessId, adminUserId);

      // Get current business AI
      const businessAI = await this.getBusinessAI(businessId);
      if (!businessAI) {
        throw new Error('Business AI not found');
      }

      // Update business AI settings
      const updatedAI = await this.prisma.businessAIDigitalTwin.update({
        where: { businessId },
        data: {
          name: settings.name || businessAI.name,
          description: settings.description,
          aiPersonality: settings.aiPersonality ? (settings.aiPersonality as any) : businessAI.aiPersonality,
          capabilities: settings.capabilities ? (settings.capabilities as any) : businessAI.capabilities,
          restrictions: settings.restrictions ? (settings.restrictions as any) : businessAI.restrictions,
          securityLevel: settings.securityLevel || businessAI.securityLevel,
          complianceMode: settings.complianceMode ?? businessAI.complianceMode,
          updatedAt: new Date()
        }
      });

      // Log admin action
      await this.auditBusinessAIAction(
        businessId,
        adminUserId,
        'ai_settings_updated',
        { changes: settings, previousVersion: businessAI }
      );

    } catch (error) {
      console.error('Failed to update business AI controls:', error);
      throw error;
    }
  }

  /**
   * Get business AI analytics and metrics
   */
  async getBusinessAIAnalytics(businessId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    try {
      const businessAI = await this.getBusinessAI(businessId);
      if (!businessAI) {
        throw new Error('Business AI not found');
      }

      // Get usage metrics for the specified period
      const metrics = await this.prisma.businessAIUsageMetric.findMany({
        where: {
          businessAIId: businessAI.id,
          period
        },
        orderBy: { date: 'desc' },
        take: 30 // Last 30 periods
      });

      // Get recent interactions summary
      const recentInteractions = await this.prisma.businessAIInteraction.findMany({
        where: { businessAIId: businessAI.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          interactionType: true,
          confidence: true,
          processingTime: true,
          feedbackRating: true,
          wasHelpful: true,
          moduleContext: true,
          userRole: true,
          createdAt: true
        }
      });

      // Get learning events summary
      const learningEvents = await this.prisma.businessAILearningEvent.findMany({
        where: { businessAIId: businessAI.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          eventType: true,
          approved: true,
          impact: true,
          confidence: true,
          effectiveness: true,
          createdAt: true
        }
      });

      return {
        businessAI: {
          id: businessAI.id,
          name: businessAI.name,
          status: businessAI.status,
          totalInteractions: businessAI.totalInteractions,
          lastInteractionAt: businessAI.lastInteractionAt
        },
        metrics,
        recentInteractions,
        learningEvents,
        summary: this.calculateAnalyticsSummary(metrics, recentInteractions, learningEvents)
      };
    } catch (error) {
      console.error('Failed to get business AI analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getBusinessAI(businessId: string) {
    return await this.prisma.businessAIDigitalTwin.findUnique({
      where: { businessId },
      include: {
        business: true
      }
    });
  }

  private async validateEmployeeAccess(businessId: string, userId: string, businessAI: any): Promise<void> {
    // Check if user is active business member
    const member = await this.prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true }
    });

    if (!member) {
      throw new Error('User is not an active member of this business');
    }

    // Check if business AI allows employee interaction
    if (!businessAI.allowEmployeeInteraction) {
      throw new Error('Employee AI interactions are disabled for this business');
    }

    // Additional role-based validation could be added here
  }

  private async validateAdminAccess(businessId: string, userId: string): Promise<void> {
    const businessAI = await this.getBusinessAI(businessId);
    if (!businessAI) {
      throw new Error('Business AI not found');
    }

    // Check if user is in admin users list
    if (!businessAI.adminUsers.includes(userId)) {
      // Check if user has business admin role
      const member = await this.prisma.businessMember.findFirst({
        where: { 
          businessId, 
          userId, 
          isActive: true,
          role: 'ADMIN'
        }
      });

      if (!member) {
        throw new Error('Insufficient permissions to manage business AI');
      }
    }
  }

  private async getEmployeeBusinessContext(businessId: string, userId: string) {
    // Get employee's business context
    const member = await this.prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true },
      include: {
        job: {
          include: {
            department: true
          }
        }
      }
    });

    return {
      role: member?.role,
      title: member?.title,
      department: member?.job?.department?.name,
      departmentId: member?.job?.departmentId,
      permissions: member?.job?.permissions || {},
      joinedAt: member?.joinedAt
    };
  }

  private async processWithBusinessIntelligence(
    businessAI: any,
    query: string,
    employeeContext: any,
    workContext: EmployeeWorkContext
  ): Promise<BusinessAIResponse> {
    // This would integrate with the existing AI providers
    // For now, returning a mock response structure
    
    const response: BusinessAIResponse = {
      message: `Based on your role as ${employeeContext.title} in ${employeeContext.department}, I can help you with that request. Here's my analysis: ${query}`,
      confidence: 0.85,
      reasoning: `Analyzed request in context of ${workContext.currentModule} module and your department responsibilities.`,
      suggestedActions: [
        'Review the relevant documentation',
        'Consult with your team lead',
        'Consider the business impact'
      ],
      processingTime: 0 // Will be set by caller
    };

    return response;
  }

  private async logBusinessAIInteraction(
    businessAIId: string,
    userId: string,
    query: string,
    response: BusinessAIResponse,
    context: EmployeeWorkContext
  ): Promise<void> {
    await this.prisma.businessAIInteraction.create({
      data: {
        businessAIId,
        userId,
        interactionType: 'query',
        userInput: query,
        aiResponse: response.message,
        confidence: response.confidence,
        processingTime: response.processingTime,
        contextData: context as any,
        moduleContext: context.currentModule,
        userRole: context.userRole,
        securityLevel: 'standard',
        dataClassification: 'internal'
      }
    });
  }

  private async updateUsageMetrics(businessAIId: string, response: BusinessAIResponse): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update or create daily metrics
    await this.prisma.businessAIUsageMetric.upsert({
      where: {
        businessAIId_date_period: {
          businessAIId,
          date: today,
          period: 'daily'
        }
      },
      update: {
        totalInteractions: { increment: 1 },
        queryInteractions: { increment: 1 },
        averageResponseTime: response.processingTime,
        averageConfidence: response.confidence,
        successfulResponses: { increment: 1 }
      },
      create: {
        businessAIId,
        date: today,
        period: 'daily',
        totalInteractions: 1,
        queryInteractions: 1,
        averageResponseTime: response.processingTime,
        averageConfidence: response.confidence,
        successfulResponses: 1
      }
    });
  }

  private async generateLearningEvents(
    businessAI: any,
    userId: string,
    query: string,
    response: BusinessAIResponse,
    context: EmployeeWorkContext
  ): Promise<void> {
    // Generate learning events based on interaction patterns
    // This is a simplified version - more sophisticated logic would be added
    
    if (businessAI.learningSettings.autoLearning) {
      await this.prisma.businessAILearningEvent.create({
        data: {
          businessAIId: businessAI.id,
          eventType: 'pattern_discovery',
          sourceUserId: userId,
          sourceType: 'user_interaction',
          learningData: {
            query,
            response: response.message,
            context: context as any,
            patterns: ['user_query_pattern', 'module_usage_pattern']
          },
          previousBehavior: 'Standard response pattern',
          newBehavior: 'Enhanced response with context awareness',
          confidence: 0.7,
          impact: 'low',
          privacyLevel: 'internal',
          requiresApproval: businessAI.learningSettings.requireApproval
        }
      });
    }
  }

  private async auditBusinessAIAction(
    businessId: string,
    userId: string,
    action: string,
    details: any
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: `BUSINESS_AI_${action.toUpperCase()}`,
        userId,
        resourceType: 'BUSINESS_AI',
        resourceId: businessId,
        details: JSON.stringify({
          ...details,
          timestamp: new Date(),
          securityLevel: 'enterprise'
        })
      }
    });
  }

  private generateDefaultConfig(business: any): BusinessAIConfig {
    return {
      businessId: business.id,
      name: `${business.name} AI Assistant`,
      description: `AI Digital Twin for ${business.name}`,
      aiPersonality: {
        tone: 'professional',
        expertise: [business.industry || 'general'],
        communicationStyle: 'detailed',
        decisionMaking: 'balanced',
        industryFocus: business.industry || 'technology',
        companyValues: ['efficiency', 'collaboration', 'innovation']
      },
      capabilities: {
        documentAnalysis: true,
        emailDrafting: true,
        meetingSummarization: true,
        workflowOptimization: true,
        dataAnalysis: true,
        projectManagement: true,
        employeeAssistance: true,
        complianceMonitoring: false,
        crossModuleIntegration: true,
        predictiveAnalytics: false
      },
      restrictions: {
        maxInteractionsPerDay: 1000,
        maxResponseLength: 2000,
        sensitiveDataAccess: false,
        externalAPIAccess: false,
        employeeDataAccess: 'limited',
        clientDataAccess: 'none',
        financialDataAccess: false,
        crossDepartmentAccess: false
      },
      securityLevel: 'standard',
      complianceMode: false
    };
  }

  private getDefaultLearningSettings(): BusinessAILearningSettings {
    return {
      autoLearning: true,
      requireApproval: true,
      learningFromEmployees: true,
      crossDepartmentLearning: false,
      industryPatternLearning: false,
      allowCentralizedLearning: false,
      privacyLevel: 'internal',
      dataRetentionDays: 365
    };
  }

  private getDefaultAuditSettings() {
    return {
      logAllInteractions: true,
      logLearningEvents: true,
      logConfigChanges: true,
      retentionDays: 2555, // 7 years
      complianceLevel: 'standard'
    };
  }

  private calculateAnalyticsSummary(metrics: any[], interactions: any[], learningEvents: any[]) {
    // Calculate summary statistics
    const totalInteractions = metrics.reduce((sum, m) => sum + m.totalInteractions, 0);
    const avgConfidence = interactions.reduce((sum, i) => sum + i.confidence, 0) / interactions.length || 0;
    const approvedLearningEvents = learningEvents.filter(e => e.approved).length;
    
    return {
      totalInteractions,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      approvedLearningEvents,
      totalLearningEvents: learningEvents.length,
      helpfulnessRating: interactions.filter(i => i.wasHelpful).length / interactions.length * 100 || 0
    };
  }
}
