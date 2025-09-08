import { PrismaClient } from '@prisma/client';

export interface AutonomyDecision {
  actionId: string;
  canExecute: boolean;
  requiresApproval: boolean;
  approvalReason?: string;
  autonomyLevel: number;
  confidence: number;
  riskAssessment: RiskAssessment;
  suggestedModifications?: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  impact: string;
  mitigation?: string;
}

export interface AutonomyContext {
  userId: string;
  actionType: string;
  module: string;
  affectedUsers: string[];
  financialImpact?: number;
  timeCommitment?: number;
  dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Define proper interface for autonomy settings
export interface AutonomySettings {
  userId: string;
  scheduling?: number;
  communication?: number;
  fileManagement?: number;
  taskCreation?: number;
  dataAnalysis?: number;
  crossModuleActions?: number;
  financialThreshold?: number;
  timeCommitmentThreshold?: number;
  peopleAffectedThreshold?: number;
  [key: string]: unknown;
}

export class AutonomyManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Determine if an action can be executed autonomously
   */
  async evaluateAutonomy(context: AutonomyContext): Promise<AutonomyDecision> {
    const settings = await this.getUserAutonomySettings(context.userId);
    const decision: AutonomyDecision = {
      actionId: `action_${Date.now()}`,
      canExecute: false,
      requiresApproval: false,
      autonomyLevel: 0,
      confidence: 0,
      riskAssessment: {
        level: 'low',
        factors: [],
        impact: 'minimal'
      }
    };

    // Get autonomy level for this action type
    const actionAutonomy = this.getActionAutonomyLevel(context.actionType, settings);
    decision.autonomyLevel = actionAutonomy;

    // Assess risk factors
    const riskAssessment = await this.assessRisk(context, settings);
    decision.riskAssessment = riskAssessment;

    // Determine if approval is required
    const approvalRequired = this.requiresApproval(context, settings, riskAssessment);
    decision.requiresApproval = approvalRequired;

    // Calculate confidence based on risk and autonomy
    decision.confidence = this.calculateConfidence(actionAutonomy, riskAssessment);

    // Determine if action can execute
    decision.canExecute = this.canExecuteAction(actionAutonomy, riskAssessment, approvalRequired);

    // Generate approval reason if needed
    if (approvalRequired) {
      decision.approvalReason = this.generateApprovalReason(context, riskAssessment);
    }

    return decision;
  }

  /**
   * Get user's autonomy settings
   */
  private async getUserAutonomySettings(userId: string): Promise<AutonomySettings> {
    const settings = await this.prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings
      return await this.prisma.aIAutonomySettings.create({
        data: { userId }
      }) as AutonomySettings;
    }

    return settings as AutonomySettings;
  }

  /**
   * Get autonomy level for specific action type
   */
  private getActionAutonomyLevel(actionType: string, settings: AutonomySettings): number {
    const actionTypeMap: Record<string, keyof AutonomySettings> = {
      'schedule_meeting': 'scheduling',
      'send_message': 'communication',
      'organize_files': 'fileManagement',
      'create_task': 'taskCreation',
      'analyze_data': 'dataAnalysis',
      'cross_module_action': 'crossModuleActions'
    };

    const settingKey = actionTypeMap[actionType] || 'crossModuleActions';
    const value = settings[settingKey];
    return typeof value === 'number' ? value : 20;
  }

  /**
   * Assess risk factors for the action
   */
  private async assessRisk(context: AutonomyContext, settings: AutonomySettings): Promise<RiskAssessment> {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let impact = 'minimal';

    // Financial impact assessment
    const financialThreshold = typeof settings.financialThreshold === 'number' ? settings.financialThreshold : 100;
    if (context.financialImpact && context.financialImpact > financialThreshold) {
      factors.push(`Financial impact exceeds threshold ($${context.financialImpact})`);
      riskLevel = this.elevateRisk(riskLevel, 'medium');
      impact = 'financial';
    }

    // Time commitment assessment
    const timeCommitmentThreshold = typeof settings.timeCommitmentThreshold === 'number' ? settings.timeCommitmentThreshold : 60;
    if (context.timeCommitment && context.timeCommitment > timeCommitmentThreshold) {
      factors.push(`Time commitment exceeds threshold (${context.timeCommitment} minutes)`);
      riskLevel = this.elevateRisk(riskLevel, 'medium');
      impact = 'time';
    }

    // People affected assessment
    const peopleAffectedThreshold = typeof settings.peopleAffectedThreshold === 'number' ? settings.peopleAffectedThreshold : 5;
    if (context.affectedUsers.length > peopleAffectedThreshold) {
      factors.push(`${context.affectedUsers.length} people will be affected`);
      riskLevel = this.elevateRisk(riskLevel, 'high');
      impact = 'social';
    }

    // Data sensitivity assessment
    if (context.dataSensitivity === 'confidential' || context.dataSensitivity === 'restricted') {
      factors.push(`Sensitive data involved (${context.dataSensitivity})`);
      riskLevel = this.elevateRisk(riskLevel, 'high');
      impact = 'data';
    }

    // Urgency assessment
    if (context.urgency === 'critical') {
      factors.push('Critical urgency requires human oversight');
      riskLevel = this.elevateRisk(riskLevel, 'critical');
      impact = 'urgent';
    }

    // Cross-module actions are inherently higher risk
    if (context.module === 'cross_module') {
      factors.push('Cross-module action requires coordination');
      riskLevel = this.elevateRisk(riskLevel, 'medium');
    }

    return {
      level: riskLevel,
      factors,
      impact,
      mitigation: this.generateMitigation(riskLevel, factors)
    };
  }

  /**
   * Elevate risk level based on new factors
   */
  private elevateRisk(current: string, newLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(newLevel);
    return levels[Math.max(currentIndex, newIndex)] as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Determine if approval is required
   */
  private requiresApproval(context: AutonomyContext, settings: AutonomySettings, riskAssessment: RiskAssessment): boolean {
    // Always require approval for critical risk
    if (riskAssessment.level === 'critical') {
      return true;
    }

    // Require approval for high risk unless autonomy is very high
    if (riskAssessment.level === 'high') {
      const actionAutonomy = this.getActionAutonomyLevel(context.actionType, settings);
      return actionAutonomy < 80;
    }

    // Check specific thresholds
    const financialThreshold = typeof settings.financialThreshold === 'number' ? settings.financialThreshold : 100;
    if (context.financialImpact && context.financialImpact > financialThreshold) {
      return true;
    }

    const timeCommitmentThreshold = typeof settings.timeCommitmentThreshold === 'number' ? settings.timeCommitmentThreshold : 60;
    if (context.timeCommitment && context.timeCommitment > timeCommitmentThreshold) {
      return true;
    }

    const peopleAffectedThreshold = typeof settings.peopleAffectedThreshold === 'number' ? settings.peopleAffectedThreshold : 5;
    if (context.affectedUsers.length > peopleAffectedThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(autonomyLevel: number, riskAssessment: RiskAssessment): number {
    let confidence = autonomyLevel / 100;

    // Reduce confidence based on risk level
    const riskPenalty = {
      'low': 0,
      'medium': 0.1,
      'high': 0.3,
      'critical': 0.5
    };

    confidence -= riskPenalty[riskAssessment.level];
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine if action can execute
   */
  private canExecuteAction(autonomyLevel: number, riskAssessment: RiskAssessment, requiresApproval: boolean): boolean {
    if (requiresApproval) {
      return false;
    }

    if (riskAssessment.level === 'critical') {
      return false;
    }

    return autonomyLevel >= 50;
  }

  /**
   * Generate approval reason
   */
  private generateApprovalReason(context: AutonomyContext, riskAssessment: RiskAssessment): string {
    const reasons = [];

    if (riskAssessment.factors.length > 0) {
      reasons.push(...riskAssessment.factors);
    }

    if (context.affectedUsers.length > 0) {
      reasons.push(`This action will affect ${context.affectedUsers.length} other people`);
    }

    if (context.financialImpact && context.financialImpact > 0) {
      reasons.push(`Financial impact: $${context.financialImpact}`);
    }

    return reasons.join('. ');
  }

  /**
   * Generate mitigation strategies
   */
  private generateMitigation(riskLevel: string, factors: string[]): string {
    const mitigations = [];

    if (factors.includes('Financial impact')) {
      mitigations.push('Consider reducing scope or breaking into smaller actions');
    }

    if (factors.includes('people will be affected')) {
      mitigations.push('Notify affected users before execution');
    }

    if (factors.includes('Sensitive data')) {
      mitigations.push('Ensure proper data handling and access controls');
    }

    if (factors.includes('Critical urgency')) {
      mitigations.push('Execute with immediate oversight and monitoring');
    }

    return mitigations.join('; ');
  }

  /**
   * Update user autonomy settings
   */
  async updateAutonomySettings(userId: string, settings: Partial<AutonomySettings>): Promise<AutonomySettings> {
    return await this.prisma.aIAutonomySettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings }
    }) as AutonomySettings;
  }

  /**
   * Get autonomy recommendations based on user behavior
   */
  async getAutonomyRecommendations(userId: string): Promise<Record<string, unknown>[]> {
    // Analyze user's past actions and success rates
    const recentActions = await this.prisma.aIConversationHistory.findMany({
      where: { 
        userId,
        interactionType: 'ACTION_REQUEST'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const recommendations = [];

    // Analyze success patterns
    const successfulActions = recentActions.filter(action => 
      action.confidence && action.confidence > 0.8
    );

    if (successfulActions.length > recentActions.length * 0.8) {
      recommendations.push({
        type: 'increase_autonomy',
        module: 'general',
        reason: 'High success rate suggests readiness for increased autonomy',
        suggestedLevel: 75
      });
    }

    // Analyze risk patterns
    const highRiskActions = recentActions.filter(action => {
      if (!action.actions || !Array.isArray(action.actions)) {
        return false;
      }
      
      return action.actions.some((a: unknown) => {
        if (typeof a === 'object' && a !== null && 'riskLevel' in a) {
          return (a as Record<string, unknown>).riskLevel === 'high';
        }
        return false;
      });
    });

    if (highRiskActions.length > recentActions.length * 0.3) {
      recommendations.push({
        type: 'decrease_autonomy',
        module: 'risk_management',
        reason: 'Frequent high-risk actions detected',
        suggestedLevel: 30
      });
    }

    return recommendations;
  }
}

export default AutonomyManager; 