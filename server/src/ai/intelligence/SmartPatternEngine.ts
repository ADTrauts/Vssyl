import { PrismaClient, Prisma } from '@prisma/client';
import { SemanticSimilarityEngine, SimilarQuery, SemanticInsight } from './SemanticSimilarityEngine';

// Interface for interaction data used in pattern analysis
interface InteractionData {
  createdAt: Date;
  userQuery: string;
  confidence: number;
  response?: string;
  module?: string;
  [key: string]: unknown;
}

export interface UserPattern {
  id: string;
  userId: string;
  type: 'temporal' | 'behavioral' | 'communication' | 'decision' | 'cross_module';
  pattern: string;
  confidence: number;
  frequency: number;
  lastSeen: Date;
  metadata: Record<string, unknown>;
}

export interface PatternPrediction {
  type: string;
  description: string;
  confidence: number;
  suggestedAction?: string;
  reasoning: string;
  metadata: Record<string, unknown>;
}

export interface SmartSuggestion {
  id: string;
  type: 'action' | 'optimization' | 'reminder' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  basedOnPatterns: string[];
}

export class SmartPatternEngine {
  private prisma: PrismaClient;
  private semanticEngine: SemanticSimilarityEngine;
  private patternCache: Map<string, UserPattern[]> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.semanticEngine = new SemanticSimilarityEngine(prisma);
  }

  /**
   * Main entry point: Analyze user patterns and generate intelligent suggestions
   */
  async analyzeAndPredict(userId: string, currentContext?: any): Promise<{
    patterns: UserPattern[];
    predictions: PatternPrediction[];
    suggestions: SmartSuggestion[];
  }> {
    try {
      // Get or discover user patterns
      const patterns = await this.getUserPatterns(userId);
      
      // Generate predictions based on current context
      const predictions = await this.generatePredictions(userId, patterns, currentContext);
      
      // Create smart suggestions
      const suggestions = await this.generateSmartSuggestions(userId, patterns, predictions);

      return { patterns, predictions, suggestions };
    } catch (error) {
      console.error('Error in SmartPatternEngine:', error);
      return { patterns: [], predictions: [], suggestions: [] };
    }
  }

  /**
   * Discover and analyze user behavioral patterns from historical data
   */
  async discoverUserPatterns(userId: string): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    try {
      // Get user's interaction history
      const interactions = await this.prisma.aIConversationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500 // Analyze last 500 interactions
      });

      if (interactions.length < 10) {
        return patterns; // Not enough data for pattern analysis
      }

      // Analyze temporal patterns
      const temporalPatterns = await this.findTemporalPatterns(userId, interactions);
      patterns.push(...temporalPatterns);

      // Analyze behavioral patterns
      const behavioralPatterns = await this.findBehavioralPatterns(userId, interactions);
      patterns.push(...behavioralPatterns);

      // Analyze communication patterns
      const communicationPatterns = await this.findCommunicationPatterns(userId, interactions);
      patterns.push(...communicationPatterns);

      // Analyze decision patterns
      const decisionPatterns = await this.findDecisionPatterns(userId, interactions);
      patterns.push(...decisionPatterns);

      // Analyze semantic patterns using similarity engine
      const semanticInsights = await this.semanticEngine.generateSemanticInsights(userId);
      const semanticPatterns = await this.convertSemanticInsightsToPatterns(userId, semanticInsights);
      patterns.push(...semanticPatterns);

      // Store discovered patterns
      await this.storePatterns(userId, patterns);

      return patterns;
    } catch (error) {
      console.error('Error discovering user patterns:', error);
      return patterns;
    }
  }

  /**
   * Find temporal patterns in user behavior
   */
  private async findTemporalPatterns(userId: string, interactions: InteractionData[]): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Analyze interaction times
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    interactions.forEach(interaction => {
      const date = new Date(interaction.createdAt);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
    });

    // Find peak activity hours
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const peakHourCount = hourlyActivity[peakHour];
    const totalInteractions = interactions.length;

    if (peakHourCount / totalInteractions > 0.2) { // 20% of activity in one hour
      patterns.push({
        id: `temporal_peak_${userId}_${peakHour}`,
        userId,
        type: 'temporal',
        pattern: `Most active at ${peakHour}:00`,
        confidence: Math.min(0.95, (peakHourCount / totalInteractions) * 2),
        frequency: peakHourCount,
        lastSeen: new Date(),
        metadata: {
          peakHour,
          activityCount: peakHourCount,
          percentage: Math.round((peakHourCount / totalInteractions) * 100)
        }
      });
    }

    // Find peak activity days
    const peakDay = dailyActivity.indexOf(Math.max(...dailyActivity));
    const peakDayCount = dailyActivity[peakDay];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (peakDayCount / totalInteractions > 0.2) {
      patterns.push({
        id: `temporal_day_${userId}_${peakDay}`,
        userId,
        type: 'temporal',
        pattern: `Most active on ${dayNames[peakDay]}s`,
        confidence: Math.min(0.95, (peakDayCount / totalInteractions) * 2),
        frequency: peakDayCount,
        lastSeen: new Date(),
        metadata: {
          peakDay,
          dayName: dayNames[peakDay],
          activityCount: peakDayCount,
          percentage: Math.round((peakDayCount / totalInteractions) * 100)
        }
      });
    }

    return patterns;
  }

  /**
   * Find behavioral patterns in user interactions
   */
  private async findBehavioralPatterns(userId: string, interactions: InteractionData[]): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Analyze query types and frequencies
    const queryTypes = new Map<string, number>();
    const queryKeywords = new Map<string, number>();

    interactions.forEach(interaction => {
      const query = interaction.userQuery.toLowerCase();
      
      // Categorize queries
      let category = 'general';
      if (query.includes('schedule') || query.includes('meeting') || query.includes('calendar')) {
        category = 'scheduling';
      } else if (query.includes('message') || query.includes('send') || query.includes('email')) {
        category = 'communication';
      } else if (query.includes('file') || query.includes('document') || query.includes('organize')) {
        category = 'organization';
      } else if (query.includes('task') || query.includes('todo') || query.includes('remind')) {
        category = 'task_management';
      } else if (query.includes('analyze') || query.includes('report') || query.includes('summary')) {
        category = 'analysis';
      }

      queryTypes.set(category, (queryTypes.get(category) || 0) + 1);

      // Extract keywords
      const words = query.split(' ').filter((word: string) => word.length > 3);
      words.forEach((word: string) => {
        queryKeywords.set(word, (queryKeywords.get(word) || 0) + 1);
      });
    });

    // Find dominant behavioral patterns
    const totalQueries = interactions.length;
    queryTypes.forEach((count, category) => {
      const frequency = count / totalQueries;
      if (frequency > 0.15) { // 15% or more of queries
        patterns.push({
          id: `behavioral_${category}_${userId}`,
          userId,
          type: 'behavioral',
          pattern: `Frequently uses AI for ${category}`,
          confidence: Math.min(0.95, frequency * 2),
          frequency: count,
          lastSeen: new Date(),
          metadata: {
            category,
            queryCount: count,
            percentage: Math.round(frequency * 100),
            dominantKeywords: Array.from(queryKeywords.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([word]) => word)
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Find communication patterns
   */
  private async findCommunicationPatterns(userId: string, interactions: InteractionData[]): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Analyze response lengths and formality
    const responseLengths: number[] = [];
    let formalResponses = 0;
    let casualResponses = 0;

    interactions.forEach(interaction => {
      const query = interaction.userQuery;
      responseLengths.push(query.length);

      // Simple formality detection
      const formalIndicators = ['please', 'thank you', 'could you', 'would you'];
      const casualIndicators = ['hey', 'yo', 'cool', 'awesome', 'thanks'];

      const formalCount = formalIndicators.reduce((count, indicator) => 
        count + (query.toLowerCase().includes(indicator) ? 1 : 0), 0);
      const casualCount = casualIndicators.reduce((count, indicator) => 
        count + (query.toLowerCase().includes(indicator) ? 1 : 0), 0);

      if (formalCount > casualCount) formalResponses++;
      else if (casualCount > formalCount) casualResponses++;
    });

    // Determine communication style
    const totalStyled = formalResponses + casualResponses;
    if (totalStyled > interactions.length * 0.3) { // At least 30% have clear style
      const isFormal = formalResponses > casualResponses;
      const confidence = Math.max(formalResponses, casualResponses) / totalStyled;

      patterns.push({
        id: `communication_style_${userId}`,
        userId,
        type: 'communication',
        pattern: `Prefers ${isFormal ? 'formal' : 'casual'} communication`,
        confidence: Math.min(0.95, confidence),
        frequency: Math.max(formalResponses, casualResponses),
        lastSeen: new Date(),
        metadata: {
          style: isFormal ? 'formal' : 'casual',
          formalResponses,
          casualResponses,
          averageQueryLength: Math.round(responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length)
        }
      });
    }

    return patterns;
  }

  /**
   * Find decision-making patterns
   */
  private async findDecisionPatterns(userId: string, interactions: InteractionData[]): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Analyze decision-related queries
    let quickDecisions = 0;
    let deliberateDecisions = 0;
    let seekingApproval = 0;

    interactions.forEach(interaction => {
      const query = interaction.userQuery.toLowerCase();

      if (query.includes('quick') || query.includes('fast') || query.includes('now')) {
        quickDecisions++;
      }
      if (query.includes('think') || query.includes('consider') || query.includes('analyze')) {
        deliberateDecisions++;
      }
      if (query.includes('should i') || query.includes('approve') || query.includes('permission')) {
        seekingApproval++;
      }
    });

    const totalDecisionQueries = quickDecisions + deliberateDecisions + seekingApproval;
    if (totalDecisionQueries > interactions.length * 0.1) { // At least 10% are decision-related
      const dominantStyle = Math.max(quickDecisions, deliberateDecisions, seekingApproval);
      let style = 'balanced';
      
      if (dominantStyle === quickDecisions) style = 'quick_decision_maker';
      else if (dominantStyle === deliberateDecisions) style = 'deliberate_decision_maker';
      else if (dominantStyle === seekingApproval) style = 'approval_seeking';

      patterns.push({
        id: `decision_style_${userId}`,
        userId,
        type: 'decision',
        pattern: `Decision style: ${style.replace('_', ' ')}`,
        confidence: Math.min(0.95, dominantStyle / totalDecisionQueries),
        frequency: dominantStyle,
        lastSeen: new Date(),
        metadata: {
          decisionStyle: style,
          quickDecisions,
          deliberateDecisions,
          seekingApproval,
          totalDecisionQueries
        }
      });
    }

    return patterns;
  }

  /**
   * Generate predictions based on patterns and current context
   */
  private async generatePredictions(
    userId: string, 
    patterns: UserPattern[], 
    currentContext?: any
  ): Promise<PatternPrediction[]> {
    const predictions: PatternPrediction[] = [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Temporal predictions
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    temporalPatterns.forEach(pattern => {
      const peakHour = typeof pattern.metadata.peakHour === 'number' ? pattern.metadata.peakHour : null;
      if (peakHour !== null && peakHour !== undefined) {
        const timeDiff = Math.abs(currentHour - peakHour);
        if (timeDiff <= 1) { // Within 1 hour of peak
          predictions.push({
            type: 'temporal_activity',
            description: `Based on your patterns, you're typically most active around this time`,
            confidence: pattern.confidence * 0.8,
            suggestedAction: 'This might be a good time for focused AI assistance',
            reasoning: `You usually interact most at ${peakHour}:00`,
            metadata: { peakHour, currentHour }
          });
        }
      }
    });

    // Behavioral predictions
    const behavioralPatterns = patterns.filter(p => p.type === 'behavioral');
    const dominantBehavior = behavioralPatterns.sort((a, b) => b.confidence - a.confidence)[0];
    
    if (dominantBehavior && dominantBehavior.confidence > 0.6) {
      const category = typeof dominantBehavior.metadata.category === 'string' ? dominantBehavior.metadata.category : 'general';
      predictions.push({
        type: 'behavioral_suggestion',
        description: `You often use AI for ${category}`,
        confidence: dominantBehavior.confidence,
        suggestedAction: this.getSuggestedActionForCategory(category),
        reasoning: `${dominantBehavior.metadata.percentage}% of your queries are about ${category}`,
        metadata: dominantBehavior.metadata
      });
    }

    return predictions;
  }

  /**
   * Generate smart suggestions based on patterns and predictions
   */
  private async generateSmartSuggestions(
    userId: string,
    patterns: UserPattern[],
    predictions: PatternPrediction[]
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Generate suggestions based on behavioral patterns
    const behavioralPatterns = patterns.filter(p => p.type === 'behavioral');
    behavioralPatterns.forEach((pattern, index) => {
      if (pattern.confidence > 0.5) {
        const category = typeof pattern.metadata.category === 'string' ? pattern.metadata.category : 'general';
        const suggestion = this.createSuggestionForCategory(category, pattern);
        if (suggestion) {
        suggestions.push({
          id: `behavioral_suggestion_${index}`,
          type: suggestion.type || 'action',
          title: suggestion.title || 'Behavioral Suggestion',
          description: suggestion.description || 'Based on your usage patterns',
          confidence: suggestion.confidence || pattern.confidence,
          priority: suggestion.priority || 'medium',
          actionable: suggestion.actionable || false,
          suggestedActions: suggestion.suggestedActions || [],
          basedOnPatterns: [pattern.id]
        });
        }
      }
    });

    // Generate suggestions based on temporal patterns
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    if (temporalPatterns.length > 0) {
      const peakHourPattern = temporalPatterns.find(p => p.metadata.peakHour !== undefined);
      if (peakHourPattern) {
        suggestions.push({
          id: 'temporal_optimization',
          type: 'optimization',
          title: 'Optimize Your AI Usage',
          description: `You're most active at ${peakHourPattern.metadata.peakHour}:00. Consider scheduling important AI tasks around this time.`,
          confidence: peakHourPattern.confidence,
          priority: 'medium',
          actionable: true,
          suggestedActions: [
            'Schedule complex AI tasks for your peak hours',
            'Set reminders for optimal interaction times'
          ],
          basedOnPatterns: [peakHourPattern.id]
        });
      }
    }

    return suggestions;
  }

  /**
   * Helper methods
   */
  private getSuggestedActionForCategory(category: string): string {
    const actions: Record<string, string> = {
      scheduling: 'Try asking me to help schedule your next meeting or event',
      communication: 'I can help draft messages or emails for you',
      organization: 'Let me help organize your files or create a system',
      task_management: 'I can create and manage tasks for you',
      analysis: 'Ask me to analyze data or generate reports'
    };
    return actions[category] || 'Let me know how I can help you today';
  }

  private createSuggestionForCategory(category: string, pattern: UserPattern): Partial<SmartSuggestion> | null {
    const suggestions: Record<string, Partial<SmartSuggestion>> = {
      scheduling: {
        type: 'action',
        title: 'Schedule Management',
        description: 'You frequently use AI for scheduling. Would you like me to set up automated scheduling preferences?',
        priority: 'high',
        actionable: true,
        suggestedActions: [
          'Set up default meeting durations',
          'Configure availability preferences',
          'Enable automatic scheduling suggestions'
        ]
      },
      communication: {
        type: 'action',
        title: 'Communication Assistant',
        description: 'You often ask for help with communication. I can create message templates for you.',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Create email templates',
          'Set up communication preferences',
          'Enable smart message suggestions'
        ]
      },
      organization: {
        type: 'optimization',
        title: 'Organization System',
        description: 'You frequently ask about organization. Let me help create a systematic approach.',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Create file organization rules',
          'Set up automated organization',
          'Define organization preferences'
        ]
      }
    };

    const suggestion = suggestions[category];
    if (suggestion) {
      return {
        ...suggestion,
        confidence: pattern.confidence
      };
    }
    return null;
  }

  /**
   * Cache and storage methods
   */
  private async getUserPatterns(userId: string): Promise<UserPattern[]> {
    const cacheKey = `patterns_${userId}`;
    const cached = this.patternCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Try to load from database first, then discover if not found
    let patterns = await this.loadStoredPatterns(userId);
    
    if (patterns.length === 0) {
      patterns = await this.discoverUserPatterns(userId);
    }

    // Cache the results
    this.patternCache.set(cacheKey, patterns);
    
    // Clear cache after duration
    setTimeout(() => {
      this.patternCache.delete(cacheKey);
    }, this.CACHE_DURATION);

    return patterns;
  }

  private async loadStoredPatterns(userId: string): Promise<UserPattern[]> {
    try {
      // For now, we'll store patterns in AILearningEvent
      // In the future, we might want a dedicated patterns table
      const storedPatterns = await this.prisma.aILearningEvent.findMany({
        where: {
          userId,
          eventType: 'pattern_discovery'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return storedPatterns.map(event => {
        const context = typeof event.context === 'string' 
          ? JSON.parse(event.context) 
          : event.context;
        
        return {
          id: event.id,
          userId: event.userId,
          type: context.type || 'behavioral',
          pattern: context.pattern || 'Unknown pattern',
          confidence: event.confidence,
          frequency: context.frequency || 1,
          lastSeen: event.createdAt,
          metadata: context.metadata || {}
        };
      });
    } catch (error) {
      console.error('Error loading stored patterns:', error);
      return [];
    }
  }

  private async storePatterns(userId: string, patterns: UserPattern[]): Promise<void> {
    try {
      // Store patterns as learning events
      for (const pattern of patterns) {
        await this.prisma.aILearningEvent.create({
          data: {
            userId,
            eventType: 'pattern_discovery',
            context: JSON.stringify({
              type: pattern.type,
              pattern: pattern.pattern,
              frequency: pattern.frequency,
              metadata: pattern.metadata
            }),
            newBehavior: `Pattern discovered: ${pattern.pattern}`,
            confidence: pattern.confidence,
            patternData: pattern.metadata as unknown as Prisma.InputJsonValue,
            frequency: pattern.frequency
          }
        });
      }
    } catch (error) {
      console.error('Error storing patterns:', error);
    }
  }

  /**
   * Convert semantic insights to pattern format
   */
  private async convertSemanticInsightsToPatterns(userId: string, insights: SemanticInsight[]): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    insights.forEach((insight, index) => {
      patterns.push({
        id: `semantic_${insight.type}_${userId}_${index}`,
        userId,
        type: 'behavioral', // Map semantic insights to behavioral patterns
        pattern: insight.description,
        confidence: insight.confidence,
        frequency: insight.evidence.length,
        lastSeen: new Date(),
        metadata: {
          semanticType: insight.type,
          recommendation: insight.recommendation,
          evidence: insight.evidence.slice(0, 3), // Store top 3 evidence items
          evidenceCount: insight.evidence.length
        }
      });
    });

    return patterns;
  }

  /**
   * Enhanced query analysis using semantic similarity
   */
  async enhanceQueryWithSemantics(query: string, userId: string): Promise<{
    originalQuery: string;
    enhancedContext: string;
    relatedQueries: SimilarQuery[];
    confidenceBoost: number;
    suggestedCategories: string[];
  }> {
    try {
      return await this.semanticEngine.enhanceQueryUnderstanding(query, userId);
    } catch (error) {
      console.error('Error enhancing query with semantics:', error);
      return {
        originalQuery: query,
        enhancedContext: query,
        relatedQueries: [],
        confidenceBoost: 0,
        suggestedCategories: ['general']
      };
    }
  }

  /**
   * Find queries similar to the current one for pattern matching
   */
  async findSimilarQueries(query: string, userId: string, limit: number = 5): Promise<SimilarQuery[]> {
    try {
      return await this.semanticEngine.findSimilarQueries(query, userId, limit);
    } catch (error) {
      console.error('Error finding similar queries:', error);
      return [];
    }
  }
}

export default SmartPatternEngine;
