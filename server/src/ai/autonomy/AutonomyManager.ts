import { PrismaClient } from '@prisma/client';

export interface AutonomyDecision {
  actionId: string;
  canExecute: boolean;
  requiresApproval: boolean;
  approvalReason?: string;
  autonomyLevel: number;
  confidence: number;
  riskAssessment: RiskAssessment;
  suggestedModifications?: any[];
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
  private async getUserAutonomySettings(userId: string) {
    const settings = await this.prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings
      return await this.prisma.aIAutonomySettings.create({
        data: { userId }
      });
    }

    return settings;
  }

  /**
   * Get autonomy level for specific action type
   */
  private getActionAutonomyLevel(actionType: string, settings: any): number {
    const actionTypeMap: Record<string, keyof typeof settings> = {
      'schedule_meeting': 'scheduling',
      'send_message': 'communication',
      'organize_files': 'fileManagement',
      'create_task': 'taskCreation',
      'analyze_data': 'dataAnalysis',
      'cross_module_action': 'crossModuleActions'
    };

    const settingKey = actionTypeMap[actionType] || 'crossModuleActions';
    return settings[settingKey] || 20;
  }

  /**
   * Assess risk factors for the action
   */
  private async assessRisk(context: AutonomyContext, settings: any): Promise<RiskAssessment> {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let impact = 'minimal';

    // Financial impact assessment
    if (context.financialImpact && context.financialImpact > settings.financialThreshold) {
      factors.push(`Financial impact exceeds threshold ($${context.financialImpact})`);
      riskLevel = this.elevateRisk(riskLevel, 'medium');
      impact = 'financial';
    }

    // Time commitment assessment
    if (context.timeCommitment && context.timeCommitment > settings.timeCommitmentThreshold) {
      factors.push(`Time commitment exceeds threshold (${context.timeCommitment} minutes)`);
      riskLevel = this.elevateRisk(riskLevel, 'medium');
      impact = 'time';
    }

    // People affected assessment
    if (context.affectedUsers.length > settings.peopleAffectedThreshold) {
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
  private requiresApproval(context: AutonomyContext, settings: any, riskAssessment: RiskAssessment): boolean {
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
    if (context.financialImpact && context.financialImpact > settings.financialThreshold) {
      return true;
    }

    if (context.timeCommitment && context.timeCommitment > settings.timeCommitmentThreshold) {
      return true;
    }

    if (context.affectedUsers.length > settings.peopleAffectedThreshold) {
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
  async updateAutonomySettings(userId: string, settings: Partial<any>): Promise<any> {
    return await this.prisma.aIAutonomySettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings }
    });
  }

  /**
   * Get autonomy recommendations based on user behavior
   */
  async getAutonomyRecommendations(userId: string): Promise<any[]> {
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
    const highRiskActions = recentActions.filter(action => 
      action.actions && Array.isArray(action.actions) && 
      action.actions.some((a: any) => a.riskLevel === 'high')
    );

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