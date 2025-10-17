import { PrismaClient } from '@prisma/client';

export interface PersonalityProfile {
  userId: string;
  traits: PersonalityTraits;
  preferences: UserPreferences;
  decisionPatterns: DecisionPattern[];
  communicationStyle: CommunicationStyle;
  workPatterns: WorkPattern[];
  socialBehavior: SocialBehavior;
  learningHistory: LearningEvent[];
  lastUpdated: Date;
  confidence: number;
}

export interface PersonalityTraits {
  // Big Five personality traits (0-100 scale)
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  
  // Additional traits for Digital Life Twin
  autonomyPreference: number; // How much user likes AI to act independently
  riskTolerance: number;
  detailOrientation: number;
  planningHorizon: number; // Short vs long-term thinking
  collaborationStyle: number; // Individual vs collaborative
}

export interface UserPreferences {
  communication: {
    formality: 'casual' | 'professional' | 'context-dependent';
    responseSpeed: 'immediate' | 'thoughtful' | 'varies';
    conflictStyle: 'direct' | 'diplomatic' | 'avoidant';
    notificationLevel: 'minimal' | 'moderate' | 'high';
  };
  
  work: {
    preferredHours: { start: number; end: number; };
    focusBlockDuration: number; // Minutes of deep work preferred
    meetingTolerance: 'minimal' | 'moderate' | 'high';
    interruptionHandling: 'immediate' | 'batched' | 'scheduled';
  };
  
  life: {
    familyPriority: number; // 1-10 scale
    careerFocus: number;
    healthWellness: number;
    socialConnections: number;
    personalGrowth: number;
    financialSecurity: number;
  };
  
  decision: {
    informationNeeds: 'minimal' | 'moderate' | 'comprehensive';
    consultationStyle: 'independent' | 'collaborative' | 'delegative';
    timeframePreference: 'immediate' | 'planned' | 'flexible';
  };
}

export interface DecisionPattern {
  context: string;
  situation: string;
  factors: string[];
  decision: string;
  outcome: string;
  satisfaction: number; // 1-10
  timestamp: Date;
  reasoning: string;
}

export interface CommunicationStyle {
  tonality: 'formal' | 'casual' | 'friendly' | 'professional' | 'adaptive';
  directness: number; // 1-10 scale
  emotionalExpression: number; // 1-10 scale
  responseLength: 'brief' | 'moderate' | 'detailed';
  questioningStyle: 'analytical' | 'supportive' | 'challenging';
}

export interface WorkPattern {
  type: 'focus_time' | 'meeting' | 'communication' | 'break';
  timeOfDay: number; // Hour of day (0-23)
  duration: number; // Minutes
  frequency: number; // Times per week
  context: string;
  effectiveness: number; // 1-10 user rating
}

export interface SocialBehavior {
  relationshipMaintenance: number; // How actively user maintains relationships
  groupDynamics: 'leader' | 'contributor' | 'observer' | 'adapter';
  conflictApproach: 'confrontational' | 'mediating' | 'avoidant';
  supportStyle: 'practical' | 'emotional' | 'analytical';
  boundaryManagement: number; // How well user manages work/life boundaries
}

export interface LearningEvent {
  id: string;
  timestamp: Date;
  eventType: 'correction' | 'reinforcement' | 'pattern_recognition' | 'preference_update';
  context: string;
  oldBehavior?: string;
  newBehavior: string;
  userFeedback?: string;
  confidence: number;
}

export class PersonalityEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create personality profile for user
   */
  async getPersonalityProfile(userId: string): Promise<PersonalityProfile> {
    const existingProfile = await this.prisma.aIPersonalityProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      return this.parseStoredProfile(existingProfile);
    }

    // Create default profile for new user
    return this.createDefaultProfile(userId);
  }

  /**
   * Create default personality profile
   */
  private async createDefaultProfile(userId: string): Promise<PersonalityProfile> {
    const defaultProfile: PersonalityProfile = {
      userId,
      traits: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
        autonomyPreference: 30, // Start conservative
        riskTolerance: 40,
        detailOrientation: 50,
        planningHorizon: 50,
        collaborationStyle: 50
      },
      preferences: {
        communication: {
          formality: 'context-dependent',
          responseSpeed: 'thoughtful',
          conflictStyle: 'diplomatic',
          notificationLevel: 'moderate'
        },
        work: {
          preferredHours: { start: 9, end: 17 },
          focusBlockDuration: 60,
          meetingTolerance: 'moderate',
          interruptionHandling: 'batched'
        },
        life: {
          familyPriority: 8,
          careerFocus: 7,
          healthWellness: 6,
          socialConnections: 6,
          personalGrowth: 5,
          financialSecurity: 7
        },
        decision: {
          informationNeeds: 'moderate',
          consultationStyle: 'collaborative',
          timeframePreference: 'planned'
        }
      },
      decisionPatterns: [],
      communicationStyle: {
        tonality: 'adaptive',
        directness: 5,
        emotionalExpression: 5,
        responseLength: 'moderate',
        questioningStyle: 'supportive'
      },
      workPatterns: [],
      socialBehavior: {
        relationshipMaintenance: 5,
        groupDynamics: 'contributor',
        conflictApproach: 'mediating',
        supportStyle: 'practical',
        boundaryManagement: 5
      },
      learningHistory: [],
      lastUpdated: new Date(),
      confidence: 0.3 // Low confidence for default profile
    };

    // Save to database
    await this.savePersonalityProfile(defaultProfile);
    return defaultProfile;
  }

  /**
   * Update personality profile based on user interactions
   */
  async updatePersonalityFromInteraction(
    userId: string, 
    interaction: any, 
    userFeedback?: string
  ): Promise<PersonalityProfile> {
    const profile = await this.getPersonalityProfile(userId);
    
    // Analyze interaction for personality insights
    const insights = this.analyzeInteractionForInsights(interaction, userFeedback);
    
    // Update traits based on insights
    if (insights.traits) {
      profile.traits = this.updateTraits(profile.traits, insights.traits);
    }
    
    // Update preferences based on behavior
    if (insights.preferences) {
      profile.preferences = this.updatePreferences(profile.preferences, insights.preferences);
    }
    
    // Add decision pattern if applicable
    if (insights.decisionPattern && typeof insights.decisionPattern === 'object') {
      profile.decisionPatterns.push(insights.decisionPattern as DecisionPattern);
      
      // Keep only last 100 decisions
      if (profile.decisionPatterns.length > 100) {
        profile.decisionPatterns = profile.decisionPatterns.slice(-100);
      }
    }
    
    // Update communication style
    if (insights.communicationUpdate) {
      profile.communicationStyle = this.updateCommunicationStyle(
        profile.communicationStyle, 
        insights.communicationUpdate
      );
    }
    
    // Add learning event
    const learningEvent: LearningEvent = {
      id: `learning_${Date.now()}`,
      timestamp: new Date(),
      eventType: userFeedback ? 'correction' : 'pattern_recognition',
      context: typeof interaction.context === 'string' ? interaction.context : 'general',
      newBehavior: typeof insights.behaviorUpdate === 'string' ? insights.behaviorUpdate : 'interaction_processed',
      userFeedback,
      confidence: typeof insights.confidence === 'number' ? insights.confidence : 0.7
    };
    
    profile.learningHistory.push(learningEvent);
    
    // Keep only last 500 learning events
    if (profile.learningHistory.length > 500) {
      profile.learningHistory = profile.learningHistory.slice(-500);
    }
    
    // Update confidence based on learning
    profile.confidence = this.calculateConfidence(profile);
    profile.lastUpdated = new Date();
    
    // Save updated profile
    await this.savePersonalityProfile(profile);
    
    return profile;
  }

  /**
   * Analyze interaction for personality insights
   */
  private analyzeInteractionForInsights(interaction: any, userFeedback?: string): Record<string, unknown> {
    const insights: Record<string, unknown> = {};
    
    // Analyze response time preferences
    if (interaction.responseTime) {
      if (interaction.responseTime < 30000) { // Under 30 seconds
        insights.preferences = {
          communication: { responseSpeed: 'immediate' }
        };
      } else if (interaction.responseTime > 300000) { // Over 5 minutes
        insights.preferences = {
          communication: { responseSpeed: 'thoughtful' }
        };
      }
    }
    
    // Analyze communication style from query
    if (interaction.query) {
      const query = interaction.query.toLowerCase();
      
      if (query.includes('please') || query.includes('thank')) {
        insights.traits = { agreeableness: 2 }; // Increase politeness
      }
      
      if (query.length > 200) {
        insights.communicationUpdate = { responseLength: 'detailed' };
      } else if (query.length < 50) {
        insights.communicationUpdate = { responseLength: 'brief' };
      }
      
      if (query.includes('urgent') || query.includes('asap') || query.includes('immediately')) {
        insights.traits = { conscientiousness: 2 }; // Increase urgency awareness
      }
    }
    
    // Analyze feedback for corrections
    if (userFeedback) {
      if (userFeedback.includes('wrong') || userFeedback.includes('incorrect')) {
        insights.behaviorUpdate = 'correction_applied';
        insights.confidence = 0.5;
      } else if (userFeedback.includes('good') || userFeedback.includes('right') || userFeedback.includes('perfect')) {
        insights.behaviorUpdate = 'positive_reinforcement';
        insights.confidence = 0.8;
      }
    }
    
    // Analyze decision patterns
    if (interaction.decisionMade) {
      insights.decisionPattern = {
        context: interaction.context || 'general',
        situation: interaction.situation || 'interaction',
        factors: interaction.factors || [],
        decision: interaction.decision,
        outcome: interaction.outcome || 'pending',
        satisfaction: interaction.satisfaction || 5,
        timestamp: new Date(),
        reasoning: interaction.reasoning || 'user_interaction'
      };
    }
    
    return insights;
  }

  /**
   * Update personality traits with gradual learning
   */
  private updateTraits(currentTraits: PersonalityTraits, updates: Partial<PersonalityTraits>): PersonalityTraits {
    const learningRate = 0.1; // Gradual adjustment
    const updatedTraits = { ...currentTraits };
    
    Object.keys(updates).forEach(key => {
      const traitKey = key as keyof PersonalityTraits;
      const currentValue = updatedTraits[traitKey];
      const updateValue = updates[traitKey];
      
      if (updateValue !== undefined) {
        // Gradual adjustment towards new value
        updatedTraits[traitKey] = Math.max(0, Math.min(100, 
          currentValue + (updateValue * learningRate)
        ));
      }
    });
    
    return updatedTraits;
  }

  /**
   * Update user preferences
   */
  private updatePreferences(currentPrefs: UserPreferences, updates: any): UserPreferences {
    return {
      ...currentPrefs,
      ...updates,
      communication: { ...currentPrefs.communication, ...updates.communication },
      work: { ...currentPrefs.work, ...updates.work },
      life: { ...currentPrefs.life, ...updates.life },
      decision: { ...currentPrefs.decision, ...updates.decision }
    };
  }

  /**
   * Update communication style
   */
  private updateCommunicationStyle(
    currentStyle: CommunicationStyle, 
    updates: Partial<CommunicationStyle>
  ): CommunicationStyle {
    return { ...currentStyle, ...updates };
  }

  /**
   * Calculate confidence based on interaction history and consistency
   */
  private calculateConfidence(profile: PersonalityProfile): number {
    const baseConfidence = 0.3;
    const learningEvents = profile.learningHistory.length;
    const decisionPatterns = profile.decisionPatterns.length;
    
    // Confidence increases with more data
    const dataConfidence = Math.min(0.7, (learningEvents + decisionPatterns) * 0.01);
    
    // Recent positive feedback increases confidence
    const recentFeedback = profile.learningHistory
      .slice(-10)
      .filter(event => event.userFeedback?.includes('good') || event.userFeedback?.includes('right'));
    
    const feedbackConfidence = Math.min(0.3, recentFeedback.length * 0.03);
    
    return Math.min(1.0, baseConfidence + dataConfidence + feedbackConfidence);
  }

  /**
   * Save personality profile to database
   */
  private async savePersonalityProfile(profile: PersonalityProfile): Promise<void> {
    const profileData = {
      userId: profile.userId,
      personalityData: JSON.parse(JSON.stringify({
        traits: profile.traits,
        preferences: profile.preferences,
        decisionPatterns: profile.decisionPatterns,
        communicationStyle: profile.communicationStyle,
        workPatterns: profile.workPatterns,
        socialBehavior: profile.socialBehavior,
        confidence: profile.confidence
      })),
      learningHistory: JSON.parse(JSON.stringify(profile.learningHistory)),
      lastUpdated: profile.lastUpdated
    };

    await this.prisma.aIPersonalityProfile.upsert({
      where: { userId: profile.userId },
      update: profileData,
      create: profileData
    });
  }

  /**
   * Parse stored profile from database
   */
  private parseStoredProfile(stored: any): PersonalityProfile {
    return {
      userId: stored.userId,
      traits: stored.personalityData.traits,
      preferences: stored.personalityData.preferences,
      decisionPatterns: stored.personalityData.decisionPatterns || [],
      communicationStyle: stored.personalityData.communicationStyle,
      workPatterns: stored.personalityData.workPatterns || [],
      socialBehavior: stored.personalityData.socialBehavior,
      learningHistory: stored.learningHistory || [],
      lastUpdated: stored.lastUpdated,
      confidence: stored.personalityData.confidence || 0.3
    };
  }

  /**
   * Get personality insights for AI decision making
   */
  async getPersonalityInsights(userId: string): Promise<{
    shouldAct: boolean;
    suggestedApproach: string;
    riskLevel: 'low' | 'medium' | 'high';
    communicationTone: string;
    decisionStyle: string;
  }> {
    const profile = await this.getPersonalityProfile(userId);
    
    return {
      shouldAct: profile.traits.autonomyPreference > 60,
      suggestedApproach: this.getSuggestedApproach(profile),
      riskLevel: this.getRiskLevel(profile.traits.riskTolerance),
      communicationTone: profile.communicationStyle.tonality,
      decisionStyle: profile.preferences.decision.consultationStyle
    };
  }

  /**
   * Get suggested approach based on personality
   */
  private getSuggestedApproach(profile: PersonalityProfile): string {
    if (profile.traits.conscientiousness > 70) {
      return 'structured_and_detailed';
    } else if (profile.traits.openness > 70) {
      return 'creative_and_exploratory';
    } else if (profile.traits.extraversion > 70) {
      return 'collaborative_and_social';
    } else {
      return 'careful_and_thoughtful';
    }
  }

  /**
   * Get risk level from risk tolerance trait
   */
  private getRiskLevel(riskTolerance: number): 'low' | 'medium' | 'high' {
    if (riskTolerance < 30) return 'low';
    if (riskTolerance > 70) return 'high';
    return 'medium';
  }
}