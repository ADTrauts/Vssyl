import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import { AutonomousActionExecutor } from '../../ai/actions/AutonomousActionExecutor';
import { AutonomyManager } from '../../ai/autonomy/AutonomyManager';
import { ActionTemplates } from '../../ai/actions/ActionTemplates';
import { DigitalLifeTwinCore } from '../../ai/core/DigitalLifeTwinCore';
import { CrossModuleContextEngine } from '../../ai/context/CrossModuleContextEngine';
import { prisma } from '../../lib/prisma';

const router: express.Router = express.Router();

// Initialize AI components
const contextEngine = new CrossModuleContextEngine();
const digitalTwin = new DigitalLifeTwinCore(contextEngine, prisma);
const autonomyManager = new AutonomyManager(prisma);
const actionTemplates = new ActionTemplates(prisma);
const actionExecutor = new AutonomousActionExecutor(prisma, autonomyManager, actionTemplates, digitalTwin);

/**
 * Execute an autonomous action
 */
router.post('/execute', authenticateJWT, async (req, res) => {
  try {
    const { actionType, parameters, context } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!actionType || !parameters || !context) {
      return res.status(400).json({ 
        error: 'Missing required fields: actionType, parameters, context' 
      });
    }

    // Execute the autonomous action
    const result = await actionExecutor.executeAutonomousAction(
      userId,
      actionType,
      parameters,
      context
    );

    res.json({
      success: result.success,
      actionId: result.actionId,
      result: result.result,
      error: result.error,
      needsApproval: result.needsApproval,
      approvalReason: result.approvalReason,
      autonomyDecision: {
        canExecute: result.autonomyDecision.canExecute,
        autonomyLevel: result.autonomyDecision.autonomyLevel,
        confidence: result.autonomyDecision.confidence,
        riskLevel: result.autonomyDecision.riskAssessment.level
      },
      executionTime: result.executionTime
    });

  } catch (error) {
    console.error('Error executing autonomous action:', error);
    res.status(500).json({ 
      error: 'Failed to execute autonomous action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pending actions that require user approval
 */
router.get('/pending-approvals', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pendingActions = await actionExecutor.getPendingApprovals(userId);

    res.json({
      success: true,
      pendingActions,
      count: pendingActions.length
    });

  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ 
      error: 'Failed to get pending approvals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Approve or reject a pending action
 */
router.post('/approval/:actionId', authenticateJWT, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { approved } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ 
        error: 'Missing required field: approved (boolean)' 
      });
    }

    const result = await actionExecutor.handleApproval(userId, actionId, approved);

    res.json({
      success: result.success,
      actionId: result.actionId,
      result: result.result,
      error: result.error,
      approved,
      message: approved ? 'Action approved and executed' : 'Action rejected'
    });

  } catch (error) {
    console.error('Error handling approval:', error);
    res.status(500).json({ 
      error: 'Failed to handle approval',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Suggest autonomous actions based on user context
 */
router.post('/suggest', authenticateJWT, async (req, res) => {
  try {
    const { context, currentActivity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's autonomy settings  
    const autonomySettings = await prisma.aIAutonomySettings.findUnique({
      where: { userId }
    }) || {
      scheduling: 50,
      communication: 30,
      taskCreation: 50,
      dataAnalysis: 80
    };
    
    // Generate suggestions based on context and patterns
    const suggestions = await generateActionSuggestions(userId, context, currentActivity, autonomySettings);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      autonomySettings: {
        scheduling: autonomySettings.scheduling || 50,
        communication: autonomySettings.communication || 30,
        taskCreation: autonomySettings.taskCreation || 50,
        dataAnalysis: autonomySettings.dataAnalysis || 80
      }
    });

  } catch (error) {
    console.error('Error generating action suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get autonomous action history
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const history = await prisma.aIConversationHistory.findMany({
      where: {
        userId,
        userQuery: {
          contains: 'Action:'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const formattedHistory = history.map(item => {
      const data = typeof item.aiResponse === 'string' 
        ? JSON.parse(item.aiResponse) 
        : item.aiResponse;

      return {
        id: item.id,
        type: item.interactionType,
        actionType: data.action?.actionType,
        parameters: data.action?.parameters,
        status: data.action?.status,
        success: data.success,
        confidence: item.confidence,
        createdAt: item.createdAt,
        result: data.result,
        error: data.error
      };
    });

    res.json({
      success: true,
      history: formattedHistory,
      count: formattedHistory.length
    });

  } catch (error) {
    console.error('Error getting action history:', error);
    res.status(500).json({ 
      error: 'Failed to get action history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate action suggestions based on user context
 */
async function generateActionSuggestions(
  userId: string, 
  context: any, 
  currentActivity: string,
  autonomySettings: any
): Promise<any[]> {
  const suggestions = [];

  // Example suggestions based on context
  if (context.module === 'chat' && context.hasUnrespondedMessages) {
    if (autonomySettings.communication >= 60) {
      suggestions.push({
        actionType: 'send_message',
        title: 'Send Follow-up Message',
        description: 'Send a follow-up message to recent conversations',
        confidence: 0.7,
        riskLevel: 'low',
        estimatedTime: '2 minutes',
        parameters: {
          recipient: context.lastMessageSender,
          message: 'Following up on our previous conversation...',
          channel: 'email'
        }
      });
    }
  }

  if (context.module === 'calendar' && context.hasUnscheduledTasks) {
    if (autonomySettings.scheduling >= 70) {
      suggestions.push({
        actionType: 'schedule_event',
        title: 'Schedule Pending Tasks',
        description: 'Automatically schedule time for pending tasks',
        confidence: 0.8,
        riskLevel: 'low',
        estimatedTime: '1 minute',
        parameters: {
          tasks: context.pendingTasks,
          preferredTimeSlots: context.availableSlots
        }
      });
    }
  }

  if (context.module === 'files' && context.hasDisorganizedFiles) {
    if (autonomySettings.fileManagement >= 50) {
      suggestions.push({
        actionType: 'organize_files',
        title: 'Organize Recent Downloads',
        description: 'Organize files in your downloads folder',
        confidence: 0.6,
        riskLevel: 'low',
        estimatedTime: '5 minutes',
        parameters: {
          source: 'downloads',
          organizationType: 'by_type_and_date',
          rules: { keepRecent: true, archiveOlder: 30 }
        }
      });
    }
  }

  return suggestions;
}

export default router;
