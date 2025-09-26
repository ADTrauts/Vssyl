import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const router: express.Router = express.Router();
const prisma = new PrismaClient();

/**
 * Get AI system statistics
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get conversation statistics
    const totalConversations = await prisma.aIConversationHistory.count({
      where: { userId }
    });

    // Get recent conversations
    const recentConversations = await prisma.aIConversationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        userQuery: true,
        confidence: true,
        createdAt: true,
        interactionType: true
      }
    });

    // Calculate average confidence
    const avgConfidenceResult = await prisma.aIConversationHistory.aggregate({
      where: { userId },
      _avg: {
        confidence: true
      }
    });

    // Get autonomy settings
    const autonomySettings = await prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });

    // Get learning events count
    const learningEventsCount = await prisma.aILearningEvent.count({
      where: { userId }
    });

    // Calculate learning progress (percentage of validated learning events)
    const validatedLearningEvents = await prisma.aILearningEvent.count({
      where: { 
        userId,
        validated: true
      }
    });

    const learningProgress = learningEventsCount > 0 
      ? Math.round((validatedLearningEvents / learningEventsCount) * 100)
      : 0;

    // Calculate overall autonomy level
    const autonomyLevel = autonomySettings 
      ? Math.round((
          (autonomySettings.scheduling || 0) +
          (autonomySettings.communication || 0) +
          (autonomySettings.fileManagement || 0) +
          (autonomySettings.taskCreation || 0) +
          (autonomySettings.dataAnalysis || 0) +
          (autonomySettings.crossModuleActions || 0)
        ) / 6)
      : 0;

    // Format recent conversations
    const formattedConversations = recentConversations.map(conv => ({
      id: conv.id,
      type: conv.userQuery.length > 50 
        ? conv.userQuery.substring(0, 50) + '...' 
        : conv.userQuery,
      confidence: Math.round(conv.confidence * 100),
      timestamp: getRelativeTime(conv.createdAt)
    }));

    res.json({
      success: true,
      stats: {
        totalConversations,
        totalActions: learningEventsCount,
        averageConfidence: Math.round((avgConfidenceResult._avg.confidence || 0) * 100),
        autonomyLevel,
        learningProgress,
        recentConversations: formattedConversations
      }
    });

  } catch (error) {
    console.error('Error fetching AI stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AI statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get AI system health status
 */
router.get('/health', authenticateJWT, async (req, res) => {
  try {
    const health = {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        status: 'unknown'
      },
      anthropic: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        status: 'unknown'
      },
      database: {
        status: 'unknown'
      }
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database.status = 'healthy';
    } catch (error) {
      health.database.status = 'error';
    }

    // Test OpenAI if configured
    if (health.openai.configured) {
      try {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await client.models.list();
        health.openai.status = 'healthy';
      } catch (error) {
        health.openai.status = 'error';
      }
    }

    // Test Anthropic if configured
    if (health.anthropic.configured) {
      health.anthropic.status = 'configured'; // Can't easily test without making a request
    }

    const overallHealth = Object.values(health).every(service => 
      service.status === 'healthy' || service.status === 'configured'
    ) ? 'healthy' : 'degraded';

    res.json({
      success: true,
      health: {
        overall: overallHealth,
        services: health
      }
    });

  } catch (error) {
    console.error('Error checking AI health:', error);
    res.status(500).json({ 
      error: 'Failed to check AI health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to get relative time
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default router;
