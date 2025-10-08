import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

// JWT Authentication middleware
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user as any;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

// Admin role check middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

/**
 * GET /api/ai-context-debug/user/:userId
 * Get AI context for a specific user
 */
router.get('/user/:userId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent AI conversation history
    const recentConversations = await prisma.aIConversationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        sessionId: true,
        interactionType: true,
        userQuery: true,
        aiResponse: true,
        confidence: true,
        context: true,
        actions: true,
        createdAt: true
      }
    });

    // Get user's AI personality profile
    const personalityProfile = await prisma.aIPersonalityProfile.findUnique({
      where: { userId },
      select: {
        personalityData: true,
        learningHistory: true,
        lastUpdated: true
      }
    });

    // Get user's AI autonomy settings
    const autonomySettings = await prisma.aIAutonomySettings.findUnique({
      where: { userId },
      select: {
        scheduling: true,
        communication: true,
        fileManagement: true,
        taskCreation: true,
        dataAnalysis: true,
        crossModuleActions: true
      }
    });

    // Get user's recent activity across modules
    const recentActivity = await prisma.activity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        details: true,
        timestamp: true
      }
    });

    // Get user's business memberships
    const businessMemberships = await prisma.businessMember.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        }
      }
    });

    // Get user's module installations
    const moduleInstallations = await prisma.moduleInstallation.findMany({
      where: { userId },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    const context = {
      user,
      recentConversations,
      personalityProfile,
      autonomySettings,
      recentActivity,
      businessMemberships,
      moduleInstallations,
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, data: context });
  } catch (error) {
    console.error('Error fetching AI context:', error);
    res.status(500).json({ error: 'Failed to fetch AI context' });
  }
});

/**
 * GET /api/ai-context-debug/session/:sessionId
 * Get AI reasoning for a specific session
 */
router.get('/session/:sessionId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.aIConversationHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        userId: true,
        interactionType: true,
        userQuery: true,
        aiResponse: true,
        confidence: true,
        reasoning: true,
        context: true,
        actions: true,
        provider: true,
        model: true,
        tokensUsed: true,
        processingTime: true,
        userFeedback: true,
        feedbackRating: true,
        createdAt: true
      }
    });

    if (session.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { id: session[0].userId },
      select: {
        id: true,
        name: true,
        email: true,
        userNumber: true
      }
    });

    res.json({ 
      success: true, 
      data: {
        session,
        user,
        sessionId,
        totalInteractions: session.length
      }
    });
  } catch (error) {
    console.error('Error fetching AI session:', error);
    res.status(500).json({ error: 'Failed to fetch AI session' });
  }
});

/**
 * POST /api/ai-context-debug/validate
 * Validate AI context for a user
 */
router.post('/validate', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { userId, contextType = 'full' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const validationResults: any = {
      userId,
      timestamp: new Date().toISOString(),
      checks: []
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    validationResults.checks.push({
      name: 'User Exists',
      status: user ? 'PASS' : 'FAIL',
      message: user ? 'User found' : 'User not found'
    });

    if (!user) {
      return res.json({ success: true, data: validationResults });
    }

    // Check AI personality profile
    const personalityProfile = await prisma.aIPersonalityProfile.findUnique({
      where: { userId }
    });

    validationResults.checks.push({
      name: 'AI Personality Profile',
      status: personalityProfile ? 'PASS' : 'WARN',
      message: personalityProfile ? 'Profile exists' : 'No personality profile found'
    });

    // Check AI autonomy settings
    const autonomySettings = await prisma.aIAutonomySettings.findUnique({
      where: { userId }
    });

    validationResults.checks.push({
      name: 'AI Autonomy Settings',
      status: autonomySettings ? 'PASS' : 'WARN',
      message: autonomySettings ? 'Settings exist' : 'No autonomy settings found'
    });

    // Check recent AI activity
    const recentActivity = await prisma.aIConversationHistory.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    validationResults.checks.push({
      name: 'Recent AI Activity',
      status: recentActivity > 0 ? 'PASS' : 'WARN',
      message: `Found ${recentActivity} interactions in last 7 days`
    });

    // Check module installations
    const moduleCount = await prisma.moduleInstallation.count({
      where: { userId }
    });

    validationResults.checks.push({
      name: 'Module Installations',
      status: moduleCount > 0 ? 'PASS' : 'WARN',
      message: `User has ${moduleCount} modules installed`
    });

    // Check business memberships
    const businessCount = await prisma.businessMember.count({
      where: { userId }
    });

    validationResults.checks.push({
      name: 'Business Memberships',
      status: businessCount > 0 ? 'PASS' : 'INFO',
      message: `User is member of ${businessCount} businesses`
    });

    // Overall validation status
    const failedChecks = validationResults.checks.filter((check: any) => check.status === 'FAIL').length;
    const warningChecks = validationResults.checks.filter((check: any) => check.status === 'WARN').length;
    
    validationResults.overallStatus = failedChecks > 0 ? 'FAIL' : warningChecks > 0 ? 'WARN' : 'PASS';

    res.json({ success: true, data: validationResults });
  } catch (error) {
    console.error('Error validating AI context:', error);
    res.status(500).json({ error: 'Failed to validate AI context' });
  }
});

/**
 * GET /api/ai-context-debug/cross-module/:userId
 * Get cross-module context map for a user
 */
router.get('/cross-module/:userId', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get data from all modules
    const [driveData, chatData, businessData, calendarData, householdData] = await Promise.all([
      // Drive module data
      prisma.file.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          createdAt: true,
          folderId: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Chat module data
      prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
              createdAt: true
            }
          }
        },
        take: 10
      }),
      
      // Business module data
      prisma.businessMember.findMany({
        where: { userId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          }
        }
      }),
      
      // Calendar module data (if exists)
      prisma.calendarMember?.findMany({
        where: { userId },
        include: {
          calendar: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      }) || [],
      
      // Household module data
      prisma.householdMember?.findMany({
        where: { userId },
        include: {
          household: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }) || []
    ]);

    const crossModuleContext = {
      userId,
      modules: {
        drive: {
          fileCount: driveData.length,
          recentFiles: driveData,
          totalSize: driveData.reduce((sum, file) => sum + (file.size || 0), 0)
        },
        chat: {
          conversationCount: chatData.length,
          conversations: chatData
        },
        business: {
          businessCount: businessData.length,
          businesses: businessData
        },
        calendar: {
          calendarCount: calendarData.length,
          calendars: calendarData
        },
        household: {
          householdCount: householdData.length,
          households: householdData
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, data: crossModuleContext });
  } catch (error) {
    console.error('Error fetching cross-module context:', error);
    res.status(500).json({ error: 'Failed to fetch cross-module context' });
  }
});

/**
 * GET /api/ai-context-debug/stats
 * Get AI context debugging statistics
 */
router.get('/stats', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      usersWithAIProfile,
      usersWithAutonomySettings,
      totalConversations,
      recentConversations,
      averageConfidence,
      moduleUsage
    ] = await Promise.all([
      prisma.user.count(),
      prisma.aIPersonalityProfile.count(),
      prisma.aIAutonomySettings.count(),
      prisma.aIConversationHistory.count(),
      prisma.aIConversationHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.aIConversationHistory.aggregate({
        _avg: {
          confidence: true
        }
      }),
      prisma.moduleInstallation.groupBy({
        by: ['moduleId'],
        _count: {
          moduleId: true
        },
        orderBy: {
          _count: {
            moduleId: 'desc'
          }
        },
        take: 10
      })
    ]);

    const stats = {
      totalUsers,
      aiAdoption: {
        usersWithProfile: usersWithAIProfile,
        usersWithSettings: usersWithAutonomySettings,
        profilePercentage: totalUsers > 0 ? (usersWithAIProfile / totalUsers) * 100 : 0,
        settingsPercentage: totalUsers > 0 ? (usersWithAutonomySettings / totalUsers) * 100 : 0
      },
      conversations: {
        total: totalConversations,
        last24Hours: recentConversations,
        averageConfidence: averageConfidence._avg.confidence || 0
      },
      moduleUsage: moduleUsage.map(usage => ({
        moduleId: usage.moduleId,
        moduleName: 'Unknown',
        category: 'Unknown',
        installCount: usage._count.moduleId
      })),
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching AI context stats:', error);
    res.status(500).json({ error: 'Failed to fetch AI context stats' });
  }
});

export default router;
