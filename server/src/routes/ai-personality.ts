import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

/**
 * Get user's personality profile
 */
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await prisma.aIPersonalityProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        personalityData: true,
        lastUpdated: true,
        createdAt: true
      }
    });

    if (!profile) {
      return res.json({
        success: false,
        profile: null,
        message: 'No personality profile found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: profile.id,
        data: profile.personalityData,
        lastUpdated: profile.lastUpdated,
        createdAt: profile.createdAt
      }
    });

  } catch (error) {
    logSrvErr('ai_personality_error_fetching_personality_profile', 'Error fetching personality profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch personality profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create or update personality profile
 */
router.post('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { personalityData } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!personalityData) {
      return res.status(400).json({ error: 'Personality data is required' });
    }

    const profile = await prisma.aIPersonalityProfile.upsert({
      where: { userId },
      update: {
        personalityData,
        lastUpdated: new Date()
      },
      create: {
        userId,
        personalityData,
        learningHistory: []
      },
      select: {
        id: true,
        personalityData: true,
        lastUpdated: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      profile: {
        id: profile.id,
        data: profile.personalityData,
        lastUpdated: profile.lastUpdated,
        createdAt: profile.createdAt
      }
    });

  } catch (error) {
    logSrvErr('ai_personality_error_saving_personality_profile', 'Error saving personality profile:', error);
    res.status(500).json({ 
      error: 'Failed to save personality profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete personality profile
 */
router.delete('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await prisma.aIPersonalityProfile.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'Personality profile deleted successfully'
    });

  } catch (error) {
    logSrvErr('ai_personality_error_deleting_personality_profile', 'Error deleting personality profile:', error);
    res.status(500).json({ 
      error: 'Failed to delete personality profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
