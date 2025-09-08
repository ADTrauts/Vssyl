import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * Get global business AI metrics and overview
 * GET /api/admin/business-ai/global
 */
router.get('/global', async (req: express.Request, res: express.Response) => {
  try {
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get all business AIs with business information
    const businessAIs = await prisma.businessAIDigitalTwin.findMany({
      include: {
        business: {
          select: {
            name: true,
            industry: true,
            size: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate global metrics
    const totalBusinessAIs = businessAIs.length;
    const activeBusinessAIs = businessAIs.filter(ai => ai.status === 'active').length;
    const totalInteractions = businessAIs.reduce((sum, ai) => sum + ai.totalInteractions, 0);
    const centralizedLearningEnabled = businessAIs.filter(ai => ai.allowCentralizedLearning).length;

    // Calculate industry breakdown
    const industryBreakdown: Record<string, number> = {};
    businessAIs.forEach(ai => {
      const industry = ai.business.industry || 'Unknown';
      industryBreakdown[industry] = (industryBreakdown[industry] || 0) + 1;
    });

    // Calculate average confidence (placeholder - would need actual confidence data)
    const averageConfidence = 0.85; // This would be calculated from actual interaction data

    const globalMetrics = {
      totalBusinessAIs,
      activeBusinessAIs,
      totalInteractions,
      averageConfidence,
      centralizedLearningEnabled,
      industryBreakdown
    };

    res.json({
      success: true,
      data: {
        businessAIs,
        globalMetrics
      }
    });

  } catch (error: unknown) {
    console.error('Failed to get global business AI data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global business AI data'
    });
  }
});

/**
 * Get cross-business patterns and insights
 * GET /api/admin/business-ai/patterns
 */
router.get('/patterns', async (req: express.Request, res: express.Response) => {
  try {
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get global patterns
    const globalPatterns = await prisma.globalPattern.findMany({
      where: {
        userSegment: 'business',
        confidence: { gte: 0.7 }
      },
      orderBy: { confidence: 'desc' },
      take: 10
    });

    // Get collective insights
    const collectiveInsights = await prisma.collectiveInsight.findMany({
      where: {
        affectedUserSegments: { has: 'business' },
        actionable: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Generate cross-business recommendations
    const recommendations = generateCrossBusinessRecommendations(globalPatterns, collectiveInsights);

    res.json({
      success: true,
      data: {
        patterns: globalPatterns,
        insights: collectiveInsights,
        recommendations
      }
    });

  } catch (error: unknown) {
    console.error('Failed to get cross-business patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cross-business patterns'
    });
  }
});

/**
 * Enable centralized learning for a business AI
 * POST /api/admin/business-ai/:businessAIId/enable-centralized-learning
 */
router.post('/:businessAIId/enable-centralized-learning', async (req: express.Request, res: express.Response) => {
  try {
    const { businessAIId } = req.params;
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Update business AI to enable centralized learning
    await prisma.businessAIDigitalTwin.update({
      where: { id: businessAIId },
      data: {
        allowCentralizedLearning: true,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Centralized learning enabled successfully'
    });

  } catch (error: unknown) {
    console.error('Failed to enable centralized learning:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable centralized learning'
    });
  }
});

/**
 * Disable centralized learning for a business AI
 * POST /api/admin/business-ai/:businessAIId/disable-centralized-learning
 */
router.post('/:businessAIId/disable-centralized-learning', async (req: express.Request, res: express.Response) => {
  try {
    const { businessAIId } = req.params;
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Update business AI to disable centralized learning
    await prisma.businessAIDigitalTwin.update({
      where: { id: businessAIId },
      data: {
        allowCentralizedLearning: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Centralized learning disabled successfully'
    });

  } catch (error: unknown) {
    console.error('Failed to disable centralized learning:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable centralized learning'
    });
  }
});

/**
 * Get business AI performance analytics
 * GET /api/admin/business-ai/:businessAIId/analytics
 */
router.get('/:businessAIId/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const { businessAIId } = req.params;
    // Check if user is admin
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get business AI analytics
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { id: businessAIId },
      include: {
        business: {
          select: {
            name: true,
            industry: true,
            size: true
          }
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        learningEvents: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    // Calculate performance metrics
    const totalInteractions = businessAI.totalInteractions;
    const recentInteractions = businessAI.interactions.length;
    const learningEvents = businessAI.learningEvents.length;
    const centralizedLearningEnabled = businessAI.allowCentralizedLearning;

    // Calculate average confidence from interactions (placeholder)
    const averageConfidence = businessAI.interactions.length > 0 
      ? businessAI.interactions.reduce((sum, interaction) => sum + (interaction.confidence || 0), 0) / businessAI.interactions.length
      : 0;

    const analytics = {
      businessAI: {
        id: businessAI.id,
        name: businessAI.name,
        status: businessAI.status,
        securityLevel: businessAI.securityLevel
      },
      business: businessAI.business,
      metrics: {
        totalInteractions,
        recentInteractions,
        learningEvents,
        centralizedLearningEnabled,
        averageConfidence
      },
      recentActivity: {
        interactions: businessAI.interactions.slice(0, 10),
        learningEvents: businessAI.learningEvents.slice(0, 10)
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error: unknown) {
    console.error('Failed to get business AI analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business AI analytics'
    });
  }
});

/**
 * Generate cross-business recommendations based on patterns and insights
 */
function generateCrossBusinessRecommendations(patterns: any[], insights: any[]): any[] {
  const recommendations = [];

  // Pattern-based recommendations
  for (const pattern of patterns.slice(0, 3)) {
    recommendations.push({
      type: 'pattern',
      priority: 'medium',
      title: `Adopt Cross-Business Pattern: ${pattern.description.substring(0, 50)}...`,
      description: `This pattern has been observed across ${pattern.frequency} businesses with ${(pattern.confidence * 100).toFixed(0)}% confidence.`,
      action: `Consider implementing this pattern in your business AI configuration.`,
      impact: pattern.impact,
      confidence: pattern.confidence
    });
  }

  // Insight-based recommendations
  for (const insight of insights.slice(0, 2)) {
    recommendations.push({
      type: 'insight',
      priority: insight.impact === 'high' ? 'high' : 'medium',
      title: `Business Insight: ${insight.title}`,
      description: insight.description,
      action: insight.recommendations.length > 0 ? insight.recommendations[0] : 'Review and consider implementing this insight.',
      impact: insight.impact,
      complexity: insight.implementationComplexity
    });
  }

  // General recommendations
  recommendations.push({
    type: 'general',
    priority: 'low',
    title: 'Enable Cross-Business Learning',
    description: 'Consider enabling centralized learning to contribute to and benefit from collective business intelligence.',
    action: 'Review centralized learning settings in your business AI configuration.',
    impact: 'medium',
    benefit: 'Access to industry best practices and cross-business insights'
  });

  return recommendations;
}

export default router;
