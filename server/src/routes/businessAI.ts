import express from 'express';
import { BusinessAIDigitalTwinService } from '../ai/enterprise/BusinessAIDigitalTwinService';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
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
const businessAIService = new BusinessAIDigitalTwinService(prisma);

logSrvDebug('businessai_businessai_routes_loaded', 'BusinessAI routes loaded');

router.use(authenticateJWT);

// Debug middleware to log all requests
router.use((req, res, next) => {
  logSrvDebug('businessai_request', 'BusinessAI - Request received', {
    method: req.method,
    path: req.path,
    url: req.url,
    params: req.params as Record<string, unknown>,
    query: req.query as Record<string, unknown>,
  });
  next();
});

/**
 * Initialize Business AI Digital Twin
 * POST /api/business-ai/:businessId/initialize
 */
router.post('/:businessId/initialize', async (req: express.Request, res: express.Response) => {
  logSrvDebug('businessai_initialize_hit', 'BusinessAI - Initialize route hit', {
    businessId: req.params.businessId,
  });
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const config = req.body;

    logSrvDebug('businessai_initializing', 'BusinessAI - Initializing with', {
      businessId,
      userId,
      config: config as Record<string, unknown>,
    });

    const businessAI = await businessAIService.initializeBusinessAI(businessId, userId, config);

    res.json({
      success: true,
      message: 'Business AI Digital Twin initialized successfully',
      data: businessAI
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_initialize_business_ai', 'Failed to initialize business AI:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initialize business AI'
    });
  }
});

/**
 * Get Business AI Configuration
 * GET /api/business-ai/:businessId/config
 */
router.get('/:businessId/config', async (req: express.Request, res: express.Response) => {
  logSrvDebug('businessai_config_hit', 'BusinessAI - Config route hit', {
    businessId: req.params.businessId,
  });
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;

    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId },
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

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    // Check if user has access (admin or employee)
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Return appropriate data based on user role
    const isAdmin = businessAI.adminUsers.includes(userId) || member.role === 'ADMIN';
    
    if (isAdmin) {
      // Full configuration for admins
      res.json({
        success: true,
        data: businessAI
      });
    } else {
      // Limited data for employees
      res.json({
        success: true,
        data: {
          id: businessAI.id,
          name: businessAI.name,
          description: businessAI.description,
          capabilities: businessAI.capabilities,
          status: businessAI.status,
          allowEmployeeInteraction: businessAI.allowEmployeeInteraction
        }
      });
    }
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_get_business_ai_config', 'Failed to get business AI config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business AI configuration'
    });
  }
});

/**
 * Update Business AI Configuration (Admin only)
 * PUT /api/business-ai/:businessId/config
 */
router.put('/:businessId/config', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const settings = req.body;

    await businessAIService.updateBusinessAIControls(businessId, userId, settings);

    res.json({
      success: true,
      message: 'Business AI configuration updated successfully'
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_update_business_ai_config', 'Failed to update business AI config:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update business AI configuration'
    });
  }
});

/**
 * Employee AI Interaction
 * POST /api/business-ai/:businessId/interact
 */
router.post('/:businessId/interact', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const { query, context } = req.body;

    if (!query || !context) {
      return res.status(400).json({
        success: false,
        message: 'Query and context are required'
      });
    }

    const response = await businessAIService.processEmployeeInteraction(
      businessId,
      userId,
      query,
      context
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error: unknown) {
    logSrvErr('businessai_business_ai_interaction_failed', 'Business AI interaction failed:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'AI interaction failed'
    });
  }
});

/**
 * Get Employee AI Access Information
 * GET /api/business-ai/:businessId/employee-access
 */
router.get('/:businessId/employee-access', async (req: express.Request, res: express.Response) => {
  logSrvDebug('businessai_employee_access_hit', 'BusinessAI - Employee access route hit', {
    businessId: req.params.businessId,
    method: req.method,
    path: req.path,
    url: req.url,
  });

  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;

    logSrvDebug('businessai_employee_access_request', 'BusinessAI - Employee access request', {
      businessId,
      userId,
      hasUserId: !!userId,
    });

    // Check if user is business member
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true },
      include: {
        job: {
          include: {
            department: true
          }
        }
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get business AI
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    // Get allowed capabilities based on role
    const allowedCapabilities = await getEmployeeAICapabilities(member, businessAI);

    res.json({
      success: true,
      data: {
        businessAI: {
          id: businessAI.id,
          name: businessAI.name,
          description: businessAI.description,
          securityLevel: businessAI.securityLevel,
          allowEmployeeInteraction: businessAI.allowEmployeeInteraction
        },
        allowedCapabilities,
        userContext: {
          role: member.role,
          title: member.title,
          department: member.job?.department?.name,
          permissions: member.job?.permissions || {}
        }
      }
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_get_employee_ai_access', 'Failed to get employee AI access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI access information'
    });
  }
});

/**
 * Get Business AI Analytics (Admin only)
 * GET /api/business-ai/:businessId/analytics
 */
router.get('/:businessId/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const { period = 'daily' } = req.query;

    // Validate admin access
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    const isAdmin = businessAI.adminUsers.includes(userId);
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true, role: 'ADMIN' }
    });

    if (!isAdmin && !member) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const analytics = await businessAIService.getBusinessAIAnalytics(
      businessId, 
      period as 'daily' | 'weekly' | 'monthly'
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_get_business_ai_analytics', 'Failed to get business AI analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
});

/**
 * Get Business AI Learning Events (Admin only)
 * GET /api/business-ai/:businessId/learning-events
 */
router.get('/:businessId/learning-events', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const { status, limit = 50 } = req.query;

    // Validate admin access
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    const isAdmin = businessAI.adminUsers.includes(userId);
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true, role: 'ADMIN' }
    });

    if (!isAdmin && !member) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Build query filters
    const where: any = { businessAIId: businessAI.id };
    if (status === 'pending') {
      where.requiresApproval = true;
      where.approved = false;
    } else if (status === 'approved') {
      where.approved = true;
    }

    const learningEvents = await prisma.businessAILearningEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        businessAI: {
          select: { name: true }
        }
      }
    });

    res.json({
      success: true,
      data: learningEvents
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_get_learning_events', 'Failed to get learning events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get learning events'
    });
  }
});

/**
 * Get Centralized Learning Insights (Admin only)
 * GET /api/business-ai/:businessId/centralized-insights
 */
router.get('/:businessId/centralized-insights', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;

    // Validate admin access
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    const isAdmin = businessAI.adminUsers.includes(userId);
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true, role: 'ADMIN' }
    });

    if (!isAdmin && !member) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const insights = await businessAIService.getCentralizedInsights(businessId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_get_centralized_insights', 'Failed to get centralized insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get centralized insights'
    });
  }
});

/**
 * Approve/Reject Learning Event (Admin only)
 * PUT /api/business-ai/:businessId/learning-events/:eventId/review
 */
router.put('/:businessId/learning-events/:eventId/review', async (req: express.Request, res: express.Response) => {
  try {
    const { businessId, eventId } = req.params;
    const userId = (req as AuthenticatedRequest).user!.id;
    const { approved, rejectionReason } = req.body;

    // Validate admin access
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });

    if (!businessAI) {
      return res.status(404).json({
        success: false,
        message: 'Business AI not found'
      });
    }

    const isAdmin = businessAI.adminUsers.includes(userId);
    const member = await prisma.businessMember.findFirst({
      where: { businessId, userId, isActive: true, role: 'ADMIN' }
    });

    if (!isAdmin && !member) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Update learning event
    const updatedEvent = await prisma.businessAILearningEvent.update({
      where: { id: eventId },
      data: {
        approved: approved === true,
        approvedBy: approved === true ? userId : null,
        approvedAt: approved === true ? new Date() : null,
        rejectionReason: approved === false ? rejectionReason : null,
        updatedAt: new Date()
      }
    });

    // Log the review action
    await prisma.auditLog.create({
      data: {
        action: `BUSINESS_AI_LEARNING_EVENT_${approved ? 'APPROVED' : 'REJECTED'}`,
        userId,
        resourceType: 'BUSINESS_AI_LEARNING',
        resourceId: eventId,
        details: JSON.stringify({
          businessId,
          eventId,
          approved,
          rejectionReason,
          timestamp: new Date()
        })
      }
    });

    res.json({
      success: true,
      message: `Learning event ${approved ? 'approved' : 'rejected'} successfully`,
      data: updatedEvent
    });
  } catch (error: unknown) {
    logSrvErr('businessai_failed_to_review_learning_event', 'Failed to review learning event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review learning event'
    });
  }
});

// Capability definitions with metadata for UI
interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  iconName: string;
  roles: ('EMPLOYEE' | 'MANAGER' | 'ADMIN')[];
}

const CAPABILITY_DEFINITIONS: Record<string, CapabilityDefinition> = {
  employeeAssistance: {
    id: 'employeeAssistance',
    name: 'Employee Assistance',
    description: 'General employee support and guidance',
    iconName: 'brain',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN']
  },
  documentAnalysis: {
    id: 'documentAnalysis',
    name: 'Document Analysis',
    description: 'Analyze and summarize documents',
    iconName: 'file-text',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN']
  },
  emailDrafting: {
    id: 'emailDrafting',
    name: 'Email Drafting',
    description: 'Help draft professional emails',
    iconName: 'mail',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN']
  },
  workflowOptimization: {
    id: 'workflowOptimization',
    name: 'Workflow Optimization',
    description: 'Suggest process improvements',
    iconName: 'trending-up',
    roles: ['MANAGER', 'ADMIN']
  },
  dataAnalysis: {
    id: 'dataAnalysis',
    name: 'Data Analysis',
    description: 'Analyze business data and trends',
    iconName: 'bar-chart-3',
    roles: ['MANAGER', 'ADMIN']
  },
  projectManagement: {
    id: 'projectManagement',
    name: 'Project Management',
    description: 'Assist with project planning and tracking',
    iconName: 'calendar',
    roles: ['MANAGER', 'ADMIN']
  },
  complianceMonitoring: {
    id: 'complianceMonitoring',
    name: 'Compliance Monitoring',
    description: 'Monitor for compliance issues',
    iconName: 'shield',
    roles: ['ADMIN']
  },
  predictiveAnalytics: {
    id: 'predictiveAnalytics',
    name: 'Predictive Analytics',
    description: 'Advanced analytics and predictions',
    iconName: 'trending-up',
    roles: ['ADMIN']
  }
};

// Helper function to determine employee AI capabilities
// Returns array format for frontend consumption
async function getEmployeeAICapabilities(member: any, businessAI: any): Promise<Array<{
  id: string;
  name: string;
  description: string;
  iconName: string;
  enabled: boolean;
}>> {
  const baseCapabilities = businessAI.capabilities || {};
  const memberRole = member.role || 'EMPLOYEE';
  
  // Map role string to enum
  const roleEnum = memberRole === 'ADMIN' ? 'ADMIN' : 
                   memberRole === 'MANAGER' ? 'MANAGER' : 
                   'EMPLOYEE';
  
  // Build array of allowed capabilities
  const allowedCapabilities: Array<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    enabled: boolean;
  }> = [];
  
  // Iterate through all capability definitions
  for (const [key, definition] of Object.entries(CAPABILITY_DEFINITIONS)) {
    // Check if user's role has access to this capability
    const hasRoleAccess = definition.roles.includes(roleEnum);
    
    // Check if capability is enabled in business AI config
    const isEnabled = baseCapabilities[key] === true;
    
    // Only include if both role has access AND capability is enabled
    if (hasRoleAccess && isEnabled) {
      allowedCapabilities.push({
        id: definition.id,
        name: definition.name,
        description: definition.description,
        iconName: definition.iconName,
        enabled: true
      });
    }
  }
  
  return allowedCapabilities;
}

export default router;
