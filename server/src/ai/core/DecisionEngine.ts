import { PrismaClient } from '@prisma/client';
import { AIAction, UserContext } from './DigitalLifeTwinService';

export interface DecisionContext {
  userId: string;
  situation: string;
  availableActions: PossibleAction[];
  constraints: DecisionConstraint[];
  stakeholders: Stakeholder[];
  timeframe: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface PossibleAction {
  id: string;
  type: string;
  module: string;
  operation: string;
  parameters: Record<string, unknown>;
  impact: ActionImpact;
  cost: ActionCost;
  risks: Risk[];
  benefits: Benefit[];
  prerequisites: string[];
}

export interface ActionImpact {
  scope: 'personal' | 'interpersonal' | 'team' | 'organization';
  affectedUsers: string[];
  timeCommitment: number; // minutes
  financialImpact: number; // dollars
  emotionalImpact: 'positive' | 'neutral' | 'negative';
  productivityImpact: number; // -10 to +10 scale
}

export interface ActionCost {
  timeRequired: number; // minutes
  effort: 'low' | 'medium' | 'high';
  resources: string[];
  opportunityCost: string;
}

export interface Risk {
  type: string;
  probability: number; // 0-1
  severity: number; // 1-10
  mitigation: string;
}

export interface Benefit {
  type: string;
  likelihood: number; // 0-1
  value: number; // 1-10
  description: string;
}

export interface DecisionConstraint {
  type: 'time' | 'budget' | 'permission' | 'resource' | 'ethical' | 'policy';
  description: string;
  isHard: boolean; // Hard constraint (must comply) vs soft constraint (prefer to comply)
  value?: unknown;
}

export interface Stakeholder {
  userId?: string;
  role: string;
  influence: number; // 1-10
  impact: number; // 1-10  
  relationship: 'family' | 'friend' | 'colleague' | 'manager' | 'direct_report' | 'customer' | 'vendor';
  mustApprove: boolean;
}

export interface DecisionRecommendation {
  recommendedAction: PossibleAction;
  alternativeActions: PossibleAction[];
  reasoning: string;
  confidence: number;
  riskAssessment: RiskAssessment;
  approvalRequired: boolean;
  stakeholderAnalysis: StakeholderAnalysis;
  implementationPlan: ImplementationStep[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: Risk[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
}

export interface StakeholderAnalysis {
  primaryStakeholders: Stakeholder[];
  impactedParties: Stakeholder[];
  approvalRequired: Stakeholder[];
  communicationPlan: CommunicationStep[];
}

export interface CommunicationStep {
  stakeholder: Stakeholder;
  method: 'email' | 'chat' | 'meeting' | 'notification';
  timing: 'before' | 'during' | 'after';
  message: string;
}

export interface ImplementationStep {
  order: number;
  action: string;
  module: string;
  timing: string;
  dependencies: string[];
  rollbackPlan?: string;
}

export class DecisionEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Analyze a decision context and provide recommendations
   */
  async analyzeDecision(context: DecisionContext, userContext: UserContext): Promise<DecisionRecommendation> {
    // Get user's decision patterns and preferences
    const decisionHistory = await this.getUserDecisionHistory(context.userId);
    const personality = userContext.personality;
    const autonomySettings = userContext.autonomySettings;

    // Score all possible actions
    const scoredActions = await this.scoreActions(context.availableActions, context, userContext);

    // Apply constraints and filters
    const viableActions = this.filterViableActions(scoredActions, context.constraints);

    // Select best action based on user preferences and context
    const recommendedAction = this.selectBestAction(viableActions, context, personality);

    // Assess risks
    const riskAssessment = this.assessRisks(recommendedAction, context);

    // Analyze stakeholder impact
    const stakeholderAnalysis = this.analyzeStakeholders(recommendedAction, context);

    // Determine if approval is required
    const approvalRequired = this.requiresApproval(recommendedAction, context, autonomySettings);

    // Generate implementation plan
    const implementationPlan = await this.generateImplementationPlan(recommendedAction, context);

    return {
      recommendedAction,
      alternativeActions: viableActions.slice(1, 4), // Top 3 alternatives
      reasoning: this.generateReasoning(recommendedAction, context, personality),
      confidence: this.calculateConfidence(recommendedAction, context, decisionHistory),
      riskAssessment,
      approvalRequired,
      stakeholderAnalysis,
      implementationPlan
    };
  }

  /**
   * Score actions based on user preferences and context
   */
  private async scoreActions(actions: PossibleAction[], context: DecisionContext, userContext: UserContext): Promise<PossibleAction[]> {
    const personality = userContext.personality;
    const preferences = userContext.preferences;

    return actions.map(action => {
      let score = 0;

      // Score based on personality traits
      score += this.scoreByPersonality(action, personality);

      // Score based on user preferences
      score += this.scoreByPreferences(action, preferences);

      // Score based on historical success
      score += this.scoreByHistory(action, userContext);

      // Score based on context fit
      score += this.scoreByContext(action, context);

      // Score based on risk tolerance
      score += this.scoreByRiskTolerance(action, personality);

      return { ...action, score };
    }).sort((a, b) => (b as any).score - (a as any).score);
  }

  /**
   * Score action based on user's personality
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scoreByPersonality(action: PossibleAction, personality: any): number {
    let score = 0;

    // High conscientiousness prefers structured, planned actions
    if (personality.traits?.conscientiousness > 70) {
      if (action.type.includes('plan') || action.type.includes('schedule')) {
        score += 20;
      }
    }

    // High openness prefers creative, exploratory actions
    if (personality.traits?.openness > 70) {
      if (action.type.includes('creative') || action.type.includes('explore')) {
        score += 15;
      }
    }

    // High extraversion prefers collaborative actions
    if (personality.traits?.extraversion > 70) {
      if (action.impact.scope === 'interpersonal' || action.impact.scope === 'team') {
        score += 10;
      }
    }

    // High agreeableness avoids conflict
    if (personality.traits?.agreeableness > 70) {
      if (action.risks.some(risk => risk.type === 'conflict')) {
        score -= 15;
      }
    }

    return score;
  }

  /**
   * Score action based on user preferences
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scoreByPreferences(action: PossibleAction, preferences: any): number {
    let score = 0;

    // Work preferences
    if (preferences.work?.meetingTolerance === 'minimal' && action.type.includes('meeting')) {
      score -= 10;
    }

    // Communication preferences
    if (preferences.communication?.responseSpeed === 'immediate' && action.cost.timeRequired > 30) {
      score -= 5;
    }

    // Decision preferences
    if (preferences.decision?.consultationStyle === 'independent' && action.impact.scope === 'interpersonal') {
      score -= 5;
    }

    return score;
  }

  /**
   * Score based on historical success
   */
  private scoreByHistory(action: PossibleAction, userContext: UserContext): number {
    // TODO: Implement based on user's decision history
    return 0;
  }

  /**
   * Score based on context fit
   */
  private scoreByContext(action: PossibleAction, context: DecisionContext): number {
    let score = 0;

    // Priority matching
    if (context.priority === 'urgent' && action.cost.timeRequired > 60) {
      score -= 20;
    }

    // Timeframe matching
    if (context.timeframe === 'immediate' && action.cost.effort === 'high') {
      score -= 15;
    }

    return score;
  }

  /**
   * Score based on risk tolerance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scoreByRiskTolerance(action: PossibleAction, personality: any): number {
    const riskTolerance = personality.traits?.riskTolerance || 50;
    const actionRisk = action.risks.reduce((acc, risk) => acc + (risk.probability * risk.severity), 0);

    if (riskTolerance < 30 && actionRisk > 5) {
      return -20; // Low risk tolerance, high risk action
    }

    if (riskTolerance > 70 && actionRisk < 2) {
      return -5; // High risk tolerance, overly safe action
    }

    return 0;
  }

  /**
   * Filter actions based on constraints
   */
  private filterViableActions(actions: PossibleAction[], constraints: DecisionConstraint[]): PossibleAction[] {
    return actions.filter(action => {
      return constraints.every(constraint => {
        if (!constraint.isHard) return true; // Soft constraints don't filter

        switch (constraint.type) {
          case 'time':
            return action.cost.timeRequired <= (typeof constraint.value === 'number' ? constraint.value : Infinity);
          case 'budget':
            return action.impact.financialImpact <= (typeof constraint.value === 'number' ? constraint.value : Infinity);
          case 'permission':
            return this.hasRequiredPermissions(action, constraint);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Select the best action from viable options
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private selectBestAction(actions: PossibleAction[], context: DecisionContext, personality: any): PossibleAction {
    if (actions.length === 0) {
      throw new Error('No viable actions available');
    }

    // For now, return the highest scored action
    // TODO: Implement more sophisticated selection logic
    return actions[0];
  }

  /**
   * Assess risks for the recommended action
   */
  private assessRisks(action: PossibleAction, context: DecisionContext): RiskAssessment {
    const riskFactors = action.risks;
    const overallRisk = this.calculateOverallRisk(riskFactors);

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: riskFactors.map(risk => risk.mitigation),
      contingencyPlans: this.generateContingencyPlans(action, riskFactors)
    };
  }

  /**
   * Analyze stakeholder impact
   */
  private analyzeStakeholders(action: PossibleAction, context: DecisionContext): StakeholderAnalysis {
    const stakeholders = context.stakeholders;
    const impactedParties = stakeholders.filter(s => 
      action.impact.affectedUsers.includes(s.userId || '')
    );
    const approvalRequired = stakeholders.filter(s => s.mustApprove);

    return {
      primaryStakeholders: stakeholders.filter(s => s.influence >= 7),
      impactedParties,
      approvalRequired,
      communicationPlan: this.generateCommunicationPlan(action, stakeholders)
    };
  }

  /**
   * Determine if approval is required based on autonomy settings
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private requiresApproval(action: PossibleAction, context: DecisionContext, autonomySettings: any): boolean {
    if (!autonomySettings) return true;

    // Check time commitment threshold
    if (action.impact.timeCommitment > (autonomySettings.timeCommitmentThreshold || 60)) {
      return true;
    }

    // Check financial threshold
    if (Math.abs(action.impact.financialImpact) > (autonomySettings.financialThreshold || 0)) {
      return true;
    }

    // Check people affected threshold
    if (action.impact.affectedUsers.length > (autonomySettings.peopleAffectedThreshold || 1)) {
      return true;
    }

    // Check module-specific autonomy levels
    const moduleAutonomy = autonomySettings[action.module] || 0;
    if (moduleAutonomy < 70) { // Less than 70% autonomy requires approval
      return true;
    }

    return false;
  }

  /**
   * Generate implementation plan
   */
  private async generateImplementationPlan(action: PossibleAction, context: DecisionContext): Promise<ImplementationStep[]> {
    // TODO: Implement sophisticated planning logic
    return [
      {
        order: 1,
        action: action.operation,
        module: action.module,
        timing: 'immediate',
        dependencies: action.prerequisites
      }
    ];
  }

  /**
   * Generate reasoning for the decision
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateReasoning(action: PossibleAction, context: DecisionContext, personality: any): string {
    const reasons = [];

    reasons.push(`Selected ${action.type} because it best fits your ${context.priority} priority situation.`);

    if (personality.traits?.conscientiousness > 70 && action.type.includes('plan')) {
      reasons.push('This structured approach aligns with your preference for organization and planning.');
    }

    if (action.impact.productivityImpact > 5) {
      reasons.push('This action is expected to significantly improve your productivity.');
    }

    return reasons.join(' ');
  }

  /**
   * Calculate confidence in the decision
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculateConfidence(action: PossibleAction, context: DecisionContext, history: any[]): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on clear preferences
    if (context.priority === 'urgent' && action.cost.timeRequired < 30) {
      confidence += 0.1;
    }

    // Decrease confidence if many viable alternatives
    if (context.availableActions.length > 10) {
      confidence -= 0.1;
    }

    // Adjust based on historical success
    // TODO: Implement based on actual history

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Helper methods
   */
  private async getUserDecisionHistory(userId: string): Promise<any[]> {
    // TODO: Implement decision history retrieval
    return [];
  }

  private hasRequiredPermissions(action: PossibleAction, constraint: DecisionConstraint): boolean {
    // TODO: Implement permission checking
    return true;
  }

  private calculateOverallRisk(risks: Risk[]): 'low' | 'medium' | 'high' {
    const totalRisk = risks.reduce((acc, risk) => acc + (risk.probability * risk.severity), 0);
    
    if (totalRisk < 3) return 'low';
    if (totalRisk < 7) return 'medium';
    return 'high';
  }

  private generateContingencyPlans(action: PossibleAction, risks: Risk[]): string[] {
    return risks.map(risk => `If ${risk.type} occurs: ${risk.mitigation}`);
  }

  private generateCommunicationPlan(action: PossibleAction, stakeholders: Stakeholder[]): CommunicationStep[] {
    return stakeholders.map(stakeholder => ({
      stakeholder,
      method: 'notification',
      timing: 'before',
      message: `AI is planning to ${action.operation}. Your input is valued.`
    }));
  }
}