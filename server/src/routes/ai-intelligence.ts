import express from 'express';
import { PrismaClient } from '@prisma/client';
import AdvancedLearningEngine from '../ai/learning/AdvancedLearningEngine';
import PredictiveIntelligenceEngine from '../ai/intelligence/PredictiveIntelligenceEngine';
import IntelligentRecommendationsEngine from '../ai/intelligence/IntelligentRecommendationsEngine';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();
const learningEngine = new AdvancedLearningEngine(prisma);
const predictiveEngine = new PredictiveIntelligenceEngine(prisma);
const recommendationsEngine = new IntelligentRecommendationsEngine(prisma);

import { authenticateJWT } from '../middleware/auth';

// Learning Engine Endpoints

/**
 * POST /api/ai/intelligence/learning/event
 * Process a learning event
 */
router.post('/learning/event', authenticateJWT, async (req, res) => {
  try {
    const { eventType, module, data, confidence, impact } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const learningEvent = {
      userId,
      eventType,
      module,
      data,
      confidence,
      impact
    };

    const response = await learningEngine.processLearningEvent(learningEvent);

    res.json({
      success: true,
      data: response,
      message: 'Learning event processed successfully'
    });
  } catch (error) {
    console.error('Error processing learning event:', error);
    res.status(500).json({ 
      error: 'Failed to process learning event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/intelligence/learning/analytics
 * Get learning analytics for a user
 */
router.get('/learning/analytics', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const analytics = await learningEngine.getLearningAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
      message: 'Learning analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting learning analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get learning analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/intelligence/learning/patterns
 * Get user learning patterns
 */
router.get('/learning/patterns', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const patterns = await learningEngine.getUserPatterns(userId);

    res.json({
      success: true,
      data: patterns,
      message: 'Learning patterns retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting learning patterns:', error);
    res.status(500).json({ 
      error: 'Failed to get learning patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Predictive Intelligence Endpoints

/**
 * POST /api/ai/intelligence/predictive/analyze
 * Generate predictive analysis
 */
router.post('/predictive/analyze', authenticateJWT, async (req, res) => {
  try {
    const { context } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const analyses = await predictiveEngine.generatePredictiveAnalysis(userId, context);

    res.json({
      success: true,
      data: analyses,
      message: 'Predictive analysis generated successfully'
    });
  } catch (error) {
    console.error('Error generating predictive analysis:', error);
    res.status(500).json({ 
      error: 'Failed to generate predictive analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/intelligence/predictive/analytics
 * Get predictive analytics
 */
router.get('/predictive/analytics', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const analytics = await predictiveEngine.getPredictiveAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
      message: 'Predictive analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting predictive analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get predictive analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Intelligent Recommendations Endpoints

/**
 * POST /api/ai/intelligence/recommendations/generate
 * Generate intelligent recommendations
 */
router.post('/recommendations/generate', authenticateJWT, async (req, res) => {
  try {
    const { context } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const recommendations = await recommendationsEngine.generateIntelligentRecommendations(userId, context);

    res.json({
      success: true,
      data: recommendations,
      message: 'Intelligent recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai/intelligence/recommendations/analytics
 * Get recommendation analytics
 */
router.get('/recommendations/analytics', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const analytics = await recommendationsEngine.getRecommendationAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
      message: 'Recommendation analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting recommendation analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendation analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/ai/intelligence/recommendations/:recommendationId/status
 * Update recommendation status
 */
router.put('/recommendations/:recommendationId/status', authenticateJWT, async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { status } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!['pending', 'accepted', 'rejected', 'implemented', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update recommendation status in database
    await prisma.aILearningEvent.updateMany({
      where: {
        userId,
        eventType: 'recommendation',
        // schema uses newBehavior JSON string; match by substring as a pragmatic approach
        newBehavior: { contains: recommendationId }
      },
      data: {
        // store status update inside patternData for audit
        patternData: {
          set: { status }
        }
      }
    });

    res.json({
      success: true,
      data: { recommendationId, status },
      message: 'Recommendation status updated successfully'
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({ 
      error: 'Failed to update recommendation status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Combined Intelligence Endpoints

/**
 * GET /api/ai/intelligence/dashboard
 * Get comprehensive intelligence dashboard data
 */
router.get('/dashboard', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get all intelligence data
    const [learningAnalytics, predictiveAnalytics, recommendationAnalytics] = await Promise.all([
      learningEngine.getLearningAnalytics(userId),
      predictiveEngine.getPredictiveAnalytics(userId),
      recommendationsEngine.getRecommendationAnalytics(userId)
    ]);

    // Get recent patterns and predictions
    const patterns = await learningEngine.getUserPatterns(userId);
    const predictions = await predictiveEngine.generatePredictiveAnalysis(userId);
    const recommendations = await recommendationsEngine.generateIntelligentRecommendations(userId);

    const dashboardData = {
      learning: {
        analytics: learningAnalytics,
        patterns: patterns.slice(0, 5),
        recentEvents: [] // Would get from database
      },
      predictive: {
        analytics: predictiveAnalytics,
        recentPredictions: predictions.slice(0, 3),
        trends: [] // Would analyze trends
      },
      recommendations: {
        analytics: recommendationAnalytics,
        recentRecommendations: recommendations.slice(0, 5),
        pendingActions: recommendations.filter(r => r.status === 'pending').length
      },
      insights: {
        totalInsights: patterns.length + predictions.length + recommendations.length,
        confidence: (
          (typeof learningAnalytics.confidence === 'number' ? learningAnalytics.confidence : 0) +
          (typeof predictiveAnalytics.averageConfidence === 'number' ? predictiveAnalytics.averageConfidence : 0)
        ) / 2,
        learningProgress: typeof learningAnalytics.learningProgress === 'number' ? learningAnalytics.learningProgress : 0.5
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Intelligence dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting intelligence dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to get intelligence dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ai/intelligence/insights/generate
 * Generate comprehensive insights
 */
router.post('/insights/generate', authenticateJWT, async (req, res) => {
  try {
    const { context } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Generate insights from all engines
    const [learningInsights, predictiveInsights, recommendationInsights] = await Promise.all([
      learningEngine.processLearningEvent({
        userId,
        eventType: 'interaction',
        module: 'intelligence',
        data: context || {},
        confidence: 0.8,
        impact: 'high'
      }),
      predictiveEngine.generatePredictiveAnalysis(userId, context),
      recommendationsEngine.generateIntelligentRecommendations(userId, context)
    ]);

    const comprehensiveInsights = {
      learning: learningInsights.insights || [],
      predictive: predictiveInsights.map(a => a.recommendations).flat() || [],
      recommendations: recommendationInsights || [],
      summary: {
        totalInsights: (learningInsights.insights?.length || 0) + 
                      (predictiveInsights.reduce((sum, a) => sum + (a.recommendations?.length || 0), 0)) +
                      (recommendationInsights?.length || 0),
        highPriorityInsights: 0, // Would calculate based on priority
        actionableInsights: 0 // Would calculate based on actionability
      }
    };

    res.json({
      success: true,
      data: comprehensiveInsights,
      message: 'Comprehensive insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 