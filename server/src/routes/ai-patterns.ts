import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { SmartPatternEngine } from '../ai/intelligence/SmartPatternEngine';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();
const smartPatternEngine = new SmartPatternEngine(prisma);

/**
 * Get user's smart pattern analysis and predictions
 */
router.get('/analysis', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current context from query parameters
    const currentContext = {
      currentModule: req.query.module as string,
      currentActivity: req.query.activity as string,
      urgency: req.query.urgency as string
    };

    // Get smart pattern analysis
    const analysis = await smartPatternEngine.analyzeAndPredict(userId, currentContext);

    res.json({
      success: true,
      analysis: {
        patterns: analysis.patterns.map(pattern => ({
          id: pattern.id,
          type: pattern.type,
          pattern: pattern.pattern,
          confidence: Math.round(pattern.confidence * 100),
          frequency: pattern.frequency,
          metadata: pattern.metadata
        })),
        predictions: analysis.predictions.map(prediction => ({
          type: prediction.type,
          description: prediction.description,
          confidence: Math.round(prediction.confidence * 100),
          suggestedAction: prediction.suggestedAction,
          reasoning: prediction.reasoning
        })),
        suggestions: analysis.suggestions.map(suggestion => ({
          id: suggestion.id,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          confidence: Math.round(suggestion.confidence * 100),
          priority: suggestion.priority,
          actionable: suggestion.actionable,
          suggestedActions: suggestion.suggestedActions
        }))
      },
      metadata: {
        totalPatterns: analysis.patterns.length,
        highConfidencePatterns: analysis.patterns.filter(p => p.confidence > 0.7).length,
        actionableSuggestions: analysis.suggestions.filter(s => s.actionable).length
      }
    });

  } catch (error) {
    console.error('Error getting pattern analysis:', error);
    res.status(500).json({ 
      error: 'Failed to get pattern analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Force rediscovery of user patterns
 */
router.post('/rediscover', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Force pattern rediscovery
    const patterns = await smartPatternEngine.discoverUserPatterns(userId);

    res.json({
      success: true,
      message: 'Pattern rediscovery completed',
      patternsDiscovered: patterns.length,
      patterns: patterns.map(pattern => ({
        type: pattern.type,
        pattern: pattern.pattern,
        confidence: Math.round(pattern.confidence * 100),
        frequency: pattern.frequency
      }))
    });

  } catch (error) {
    console.error('Error rediscovering patterns:', error);
    res.status(500).json({ 
      error: 'Failed to rediscover patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pattern insights for specific time period
 */
router.get('/insights/:timeframe', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeframe } = req.params; // 'day', 'week', 'month'
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
    }

    // Get interactions for the time period
    const interactions = await prisma.aIConversationHistory.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate insights for this period
    const insights = {
      totalInteractions: interactions.length,
      averageConfidence: interactions.length > 0 
        ? Math.round(interactions.reduce((sum, i) => sum + i.confidence, 0) / interactions.length * 100)
        : 0,
      mostActiveHour: getMostActiveHour(interactions),
      mostCommonQueryType: getMostCommonQueryType(interactions),
      productivityScore: calculateProductivityScore(interactions),
      trends: {
        interactionTrend: calculateInteractionTrend(interactions),
        confidenceTrend: calculateConfidenceTrend(interactions)
      }
    };

    res.json({
      success: true,
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      insights
    });

  } catch (error) {
    console.error('Error getting pattern insights:', error);
    res.status(500).json({ 
      error: 'Failed to get pattern insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper functions for insights
 */
function getMostActiveHour(interactions: any[]): number {
  const hourCounts = new Array(24).fill(0);
  interactions.forEach(interaction => {
    const hour = new Date(interaction.createdAt).getHours();
    hourCounts[hour]++;
  });
  return hourCounts.indexOf(Math.max(...hourCounts));
}

function getMostCommonQueryType(interactions: any[]): string {
  const typeCounts = new Map<string, number>();
  
  interactions.forEach(interaction => {
    const query = interaction.userQuery.toLowerCase();
    let type = 'general';
    
    if (query.includes('schedule') || query.includes('meeting')) type = 'scheduling';
    else if (query.includes('message') || query.includes('email')) type = 'communication';
    else if (query.includes('file') || query.includes('organize')) type = 'organization';
    else if (query.includes('task') || query.includes('todo')) type = 'task_management';
    else if (query.includes('analyze') || query.includes('report')) type = 'analysis';
    
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });
  
  let maxType = 'general';
  let maxCount = 0;
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  });
  
  return maxType;
}

function calculateProductivityScore(interactions: any[]): number {
  if (interactions.length === 0) return 0;
  
  // Simple productivity score based on:
  // - Number of interactions (engagement)
  // - Average confidence (effectiveness)
  // - Query diversity (breadth of usage)
  
  const avgConfidence = interactions.reduce((sum, i) => sum + i.confidence, 0) / interactions.length;
  const engagementScore = Math.min(interactions.length / 10, 1); // Max score at 10+ interactions
  const uniqueQueryTypes = new Set(interactions.map(i => getMostCommonQueryType([i]))).size;
  const diversityScore = Math.min(uniqueQueryTypes / 5, 1); // Max score at 5+ types
  
  return Math.round((avgConfidence * 0.5 + engagementScore * 0.3 + diversityScore * 0.2) * 100);
}

function calculateInteractionTrend(interactions: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (interactions.length < 4) return 'stable';
  
  const midpoint = Math.floor(interactions.length / 2);
  const firstHalf = interactions.slice(0, midpoint);
  const secondHalf = interactions.slice(midpoint);
  
  const firstHalfAvg = firstHalf.length;
  const secondHalfAvg = secondHalf.length;
  
  if (secondHalfAvg > firstHalfAvg * 1.2) return 'increasing';
  if (secondHalfAvg < firstHalfAvg * 0.8) return 'decreasing';
  return 'stable';
}

function calculateConfidenceTrend(interactions: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (interactions.length < 4) return 'stable';
  
  const midpoint = Math.floor(interactions.length / 2);
  const firstHalf = interactions.slice(0, midpoint);
  const secondHalf = interactions.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, i) => sum + i.confidence, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, i) => sum + i.confidence, 0) / secondHalf.length;
  
  if (secondHalfAvg > firstHalfAvg + 0.1) return 'increasing';
  if (secondHalfAvg < firstHalfAvg - 0.1) return 'decreasing';
  return 'stable';
}

export default router;
