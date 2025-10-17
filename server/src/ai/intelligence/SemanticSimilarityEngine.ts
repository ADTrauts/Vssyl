import { PrismaClient } from '@prisma/client';

// Interface for conversation data used in semantic analysis
interface ConversationData {
  userQuery: string;
  createdAt: Date | string;
  confidence?: number;
  timestamp?: Date;
  conversationId?: string;
  category?: string;
  [key: string]: unknown;
}

export interface QueryEmbedding {
  id: string;
  userId: string;
  query: string;
  embedding: number[];
  category: string;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface SimilarQuery {
  query: string;
  similarity: number;
  category: string;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface SemanticInsight {
  type: 'query_pattern' | 'category_preference' | 'temporal_similarity' | 'context_similarity';
  description: string;
  confidence: number;
  evidence: SimilarQuery[];
  recommendation?: string;
}

/**
 * Simple semantic similarity engine using basic text analysis
 * This is a lightweight implementation that doesn't require external APIs
 * In the future, this could be enhanced with actual embeddings
 */
export class SemanticSimilarityEngine {
  private prisma: PrismaClient;
  private embeddingCache: Map<string, number[]> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Find semantically similar queries for a given query
   */
  async findSimilarQueries(
    query: string, 
    userId: string, 
    limit: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SimilarQuery[]> {
    try {
      // Get user's conversation history
      const conversations = await this.prisma.aIConversationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200 // Analyze recent conversations for similarity
      });

      if (conversations.length === 0) {
        return [];
      }

      // Generate embedding for the input query
      const queryEmbedding = this.generateSimpleEmbedding(query);
      
      // Calculate similarities
      const similarities: SimilarQuery[] = [];
      
      for (const conversation of conversations) {
        const conversationEmbedding = this.generateSimpleEmbedding(conversation.userQuery);
        const similarity = this.calculateCosineSimilarity(queryEmbedding, conversationEmbedding);
        
        if (similarity >= minSimilarity && conversation.userQuery.toLowerCase() !== query.toLowerCase()) {
          similarities.push({
            query: conversation.userQuery,
            similarity,
            category: this.categorizeQuery(conversation.userQuery),
            confidence: conversation.confidence,
            timestamp: conversation.createdAt,
            metadata: {
              conversationId: conversation.id,
              aiResponse: conversation.aiResponse,
              interactionType: conversation.interactionType
            }
          });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar queries:', error);
      return [];
    }
  }

  /**
   * Generate semantic insights based on query patterns
   */
  async generateSemanticInsights(userId: string): Promise<SemanticInsight[]> {
    const insights: SemanticInsight[] = [];

    try {
      // Get user's recent queries
      const conversations = await this.prisma.aIConversationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      if (conversations.length < 5) {
        return insights; // Need more data for meaningful insights
      }

      // Analyze query patterns
      const categoryFrequency = this.analyzeQueryCategories(conversations);
      const temporalPatterns = this.analyzeTemporalPatterns(conversations);
      const contextPatterns = this.analyzeContextPatterns(conversations);

      // Generate category preference insights
      const dominantCategory = this.getDominantCategory(categoryFrequency);
      if (dominantCategory) {
        const categoryQueries = conversations
          .filter(c => this.categorizeQuery(c.userQuery) === dominantCategory.category)
          .map(c => ({
            query: c.userQuery,
            similarity: 1.0,
            category: dominantCategory.category,
            confidence: c.confidence,
            timestamp: c.createdAt,
            metadata: { conversationId: c.id }
          }))
          .slice(0, 3);

        insights.push({
          type: 'category_preference',
          description: `You frequently ask about ${dominantCategory.category} (${dominantCategory.percentage}% of queries)`,
          confidence: Math.min(0.95, dominantCategory.frequency / conversations.length * 2),
          evidence: categoryQueries,
          recommendation: this.getCategoryRecommendation(dominantCategory.category)
        });
      }

      // Generate temporal similarity insights
      const temporalInsight = this.generateTemporalInsight(temporalPatterns, conversations);
      if (temporalInsight) {
        insights.push(temporalInsight);
      }

      // Generate context similarity insights
      const contextInsight = this.generateContextInsight(contextPatterns, conversations);
      if (contextInsight) {
        insights.push(contextInsight);
      }

      return insights;

    } catch (error) {
      console.error('Error generating semantic insights:', error);
      return insights;
    }
  }

  /**
   * Enhance query understanding with semantic context
   */
  async enhanceQueryUnderstanding(query: string, userId: string): Promise<{
    originalQuery: string;
    enhancedContext: string;
    suggestedCategories: string[];
    relatedQueries: SimilarQuery[];
    confidenceBoost: number;
  }> {
    try {
      // Find similar queries
      const similarQueries = await this.findSimilarQueries(query, userId, 3);
      
      // Determine query category
      const category = this.categorizeQuery(query);
      const relatedCategories = this.getRelatedCategories(category);
      
      // Generate enhanced context
      const enhancedContext = this.buildEnhancedContext(query, similarQueries, category);
      
      // Calculate confidence boost based on similar queries
      const confidenceBoost = this.calculateConfidenceBoost(similarQueries);

      return {
        originalQuery: query,
        enhancedContext,
        suggestedCategories: [category, ...relatedCategories],
        relatedQueries: similarQueries,
        confidenceBoost
      };

    } catch (error) {
      console.error('Error enhancing query understanding:', error);
      return {
        originalQuery: query,
        enhancedContext: query,
        suggestedCategories: [this.categorizeQuery(query)],
        relatedQueries: [],
        confidenceBoost: 0
      };
    }
  }

  /**
   * Generate a simple embedding using TF-IDF-like approach
   * This is a basic implementation - in production, you'd use actual embeddings
   */
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Create a vocabulary of common terms
    const vocabulary = [
      'schedule', 'meeting', 'calendar', 'time', 'date',
      'message', 'email', 'send', 'communication', 'contact',
      'file', 'document', 'organize', 'folder', 'storage',
      'task', 'todo', 'remind', 'complete', 'deadline',
      'analyze', 'report', 'summary', 'data', 'insights',
      'create', 'update', 'delete', 'modify', 'change',
      'help', 'assist', 'support', 'guide', 'explain',
      'find', 'search', 'locate', 'discover', 'identify',
      'work', 'business', 'project', 'team', 'collaboration',
      'personal', 'private', 'individual', 'self', 'own'
    ];

    // Generate simple embedding vector
    const embedding = new Array(vocabulary.length).fill(0);
    
    words.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1) {
        embedding[index] += 1;
      }
    });

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Categorize a query into a general category
   */
  private categorizeQuery(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('schedule') || queryLower.includes('meeting') || queryLower.includes('calendar')) {
      return 'scheduling';
    }
    if (queryLower.includes('message') || queryLower.includes('email') || queryLower.includes('send')) {
      return 'communication';
    }
    if (queryLower.includes('file') || queryLower.includes('document') || queryLower.includes('organize')) {
      return 'organization';
    }
    if (queryLower.includes('task') || queryLower.includes('todo') || queryLower.includes('remind')) {
      return 'task_management';
    }
    if (queryLower.includes('analyze') || queryLower.includes('report') || queryLower.includes('summary')) {
      return 'analysis';
    }
    if (queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('make')) {
      return 'creation';
    }
    if (queryLower.includes('find') || queryLower.includes('search') || queryLower.includes('locate')) {
      return 'search';
    }

    return 'general';
  }

  /**
   * Helper methods for analysis
   */
  private analyzeQueryCategories(conversations: ConversationData[]): Map<string, number> {
    const categoryCount = new Map<string, number>();
    
    conversations.forEach(conversation => {
      const category = this.categorizeQuery(conversation.userQuery);
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    return categoryCount;
  }

  private analyzeTemporalPatterns(conversations: ConversationData[]): Map<number, number> {
    const hourCount = new Map<number, number>();
    
    conversations.forEach(conversation => {
      const hour = new Date(conversation.createdAt).getHours();
      hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
    });

    return hourCount;
  }

  private analyzeContextPatterns(conversations: ConversationData[]): Map<string, number> {
    const contextCount = new Map<string, number>();
    
    conversations.forEach(conversation => {
      // Simple context analysis based on query length and complexity
      const queryLength = conversation.userQuery.length;
      let context = 'simple';
      
      if (queryLength > 100) context = 'complex';
      else if (queryLength > 50) context = 'medium';
      
      contextCount.set(context, (contextCount.get(context) || 0) + 1);
    });

    return contextCount;
  }

  private getDominantCategory(categoryFrequency: Map<string, number>): {
    category: string;
    frequency: number;
    percentage: number;
  } | null {
    if (categoryFrequency.size === 0) return null;

    let maxCategory = '';
    let maxCount = 0;
    let totalCount = 0;

    categoryFrequency.forEach((count, category) => {
      totalCount += count;
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    });

    if (maxCount / totalCount < 0.2) return null; // Not dominant enough

    return {
      category: maxCategory,
      frequency: maxCount,
      percentage: Math.round((maxCount / totalCount) * 100)
    };
  }

  private generateTemporalInsight(temporalPatterns: Map<number, number>, conversations: ConversationData[]): SemanticInsight | null {
    if (temporalPatterns.size === 0) return null;

    let peakHour = 0;
    let peakCount = 0;

    temporalPatterns.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });

    if (peakCount / conversations.length < 0.15) return null; // Not significant enough

    const peakHourQueries = conversations
      .filter(c => {
        const date = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return date.getHours() === peakHour;
      })
      .slice(0, 3)
      .map(c => ({
        query: c.userQuery,
        similarity: 1.0,
        category: this.categorizeQuery(c.userQuery),
        confidence: c.confidence || 0.5,
        timestamp: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
        metadata: { conversationId: c.conversationId || c.id }
      }));

    return {
      type: 'temporal_similarity',
      description: `You're most active at ${peakHour}:00 (${Math.round(peakCount / conversations.length * 100)}% of queries)`,
      confidence: Math.min(0.95, peakCount / conversations.length * 2),
      evidence: peakHourQueries,
      recommendation: `Consider scheduling important AI tasks around ${peakHour}:00 for optimal productivity`
    };
  }

  private generateContextInsight(contextPatterns: Map<string, number>, conversations: ConversationData[]): SemanticInsight | null {
    const dominantContext = this.getDominantContext(contextPatterns, conversations.length);
    if (!dominantContext) return null;

    const contextQueries = conversations
      .filter(c => this.getQueryContext(c.userQuery) === dominantContext.context)
      .slice(0, 3)
      .map(c => ({
        query: c.userQuery,
        similarity: 1.0,
        category: this.categorizeQuery(c.userQuery),
        confidence: c.confidence || 0.5,
        timestamp: c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt),
        metadata: { conversationId: c.conversationId }
      }));

    return {
      type: 'context_similarity',
      description: `You typically use ${dominantContext.context} queries (${dominantContext.percentage}% of interactions)`,
      confidence: dominantContext.frequency / conversations.length,
      evidence: contextQueries,
      recommendation: this.getContextRecommendation(dominantContext.context)
    };
  }

  private getDominantContext(contextPatterns: Map<string, number>, totalCount: number): {
    context: string;
    frequency: number;
    percentage: number;
  } | null {
    let maxContext = '';
    let maxCount = 0;

    contextPatterns.forEach((count, context) => {
      if (count > maxCount) {
        maxCount = count;
        maxContext = context;
      }
    });

    if (maxCount / totalCount < 0.3) return null;

    return {
      context: maxContext,
      frequency: maxCount,
      percentage: Math.round((maxCount / totalCount) * 100)
    };
  }

  private getQueryContext(query: string): string {
    const queryLength = query.length;
    if (queryLength > 100) return 'complex';
    if (queryLength > 50) return 'medium';
    return 'simple';
  }

  private buildEnhancedContext(query: string, similarQueries: SimilarQuery[], category: string): string {
    let context = `Query: "${query}" (Category: ${category})`;
    
    if (similarQueries.length > 0) {
      context += `\n\nSimilar past queries:`;
      similarQueries.forEach((similar, index) => {
        context += `\n${index + 1}. "${similar.query}" (${Math.round(similar.similarity * 100)}% similar)`;
      });
    }

    return context;
  }

  private calculateConfidenceBoost(similarQueries: SimilarQuery[]): number {
    if (similarQueries.length === 0) return 0;
    
    const avgSimilarity = similarQueries.reduce((sum, q) => sum + q.similarity, 0) / similarQueries.length;
    const avgConfidence = similarQueries.reduce((sum, q) => sum + q.confidence, 0) / similarQueries.length;
    
    return (avgSimilarity * 0.6 + avgConfidence * 0.4) * 0.2; // Max boost of 20%
  }

  private getRelatedCategories(category: string): string[] {
    const relations: Record<string, string[]> = {
      scheduling: ['task_management', 'communication'],
      communication: ['scheduling', 'organization'],
      organization: ['task_management', 'search'],
      task_management: ['scheduling', 'organization'],
      analysis: ['search', 'organization'],
      creation: ['organization', 'task_management'],
      search: ['analysis', 'organization']
    };

    return relations[category] || [];
  }

  private getCategoryRecommendation(category: string): string {
    const recommendations: Record<string, string> = {
      scheduling: 'Consider setting up automated scheduling preferences or calendar integration',
      communication: 'You might benefit from message templates or communication automation',
      organization: 'Consider implementing automated file organization rules',
      task_management: 'You might benefit from advanced task automation and reminders',
      analysis: 'Consider setting up automated reports or data analysis workflows',
      creation: 'You might benefit from templates and creation shortcuts',
      search: 'Consider organizing your information better for faster retrieval'
    };

    return recommendations[category] || 'Continue using AI assistance for personalized recommendations';
  }

  private getContextRecommendation(context: string): string {
    const recommendations: Record<string, string> = {
      simple: 'You prefer concise interactions - AI responses can be more direct',
      medium: 'You use balanced queries - current AI response length is optimal',
      complex: 'You prefer detailed queries - AI can provide more comprehensive responses'
    };

    return recommendations[context] || 'AI will adapt to your preferred interaction style';
  }
}

export default SemanticSimilarityEngine;
