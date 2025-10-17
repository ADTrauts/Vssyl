import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helper function to get user from request (same pattern as other controllers)
const getUserFromRequest = (req: Request) => {
  return req.user;
};

// Types for governance policies
export interface GovernancePolicyRule {
  type: 'classification' | 'retention' | 'access' | 'encryption';
  conditions: {
    resourceType?: string;
    sensitivity?: string;
    age?: number;
    userRole?: string;
  };
  actions: {
    type: 'block' | 'warn' | 'log' | 'auto_classify' | 'auto_delete';
    message?: string;
    classification?: string;
    retentionDays?: number;
  };
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description?: string;
  policyType: string;
  rules: GovernancePolicyRule[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  resourceType: string;
  resourceId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Get all governance policies
export const getGovernancePolicies = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view governance policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { policyType, isActive } = req.query;

    const where: any = {};
    if (policyType) where.policyType = policyType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const policies = await prisma.governancePolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error getting governance policies:', error);
    res.status(500).json({ success: false, error: 'Failed to get governance policies' });
  }
};

// Create a new governance policy
export const createGovernancePolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can create governance policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const {
      name,
      description,
      policyType,
      rules,
      isActive = true
    } = req.body;

    if (!name || !policyType || !rules) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, policyType, and rules are required' 
      });
    }

    const policy = await prisma.governancePolicy.create({
      data: {
        name,
        description,
        policyType,
        rules,
        isActive,
        createdBy: user.id
      }
    });

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error creating governance policy:', error);
    res.status(500).json({ success: false, error: 'Failed to create governance policy' });
  }
};

// Update a governance policy
export const updateGovernancePolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can update governance policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;
    const {
      name,
      description,
      policyType,
      rules,
      isActive
    } = req.body;

    const policy = await prisma.governancePolicy.update({
      where: { id },
      data: {
        name,
        description,
        policyType,
        rules,
        isActive
      }
    });

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error updating governance policy:', error);
    res.status(500).json({ success: false, error: 'Failed to update governance policy' });
  }
};

// Delete a governance policy
export const deleteGovernancePolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can delete governance policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;

    await prisma.governancePolicy.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Governance policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting governance policy:', error);
    res.status(500).json({ success: false, error: 'Failed to delete governance policy' });
  }
};

// Enforce governance policies on a resource
export const enforceGovernancePolicies = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      resourceType,
      resourceId,
      content,
      metadata
    } = req.body;

    if (!resourceType || !resourceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ResourceType and resourceId are required' 
      });
    }

    // Get active governance policies
    const activePolicies = await prisma.governancePolicy.findMany({
      where: { isActive: true }
    });

    const violations: any[] = [];
    const actions: any[] = [];

    // Check each policy against the resource
    for (const policy of activePolicies) {
      const rules = policy.rules as unknown as GovernancePolicyRule[];
      
      for (const rule of rules) {
        const isViolation = await checkPolicyRule(rule, {
          resourceType,
          resourceId,
          content,
          metadata,
          user
        });

        if (isViolation) {
          violations.push({
            policyId: policy.id,
            policyName: policy.name,
            rule,
            resourceType,
            resourceId,
            severity: rule.actions.type === 'block' ? 'high' : 'medium',
            message: rule.actions.message || `Policy violation: ${policy.name}`
          });

          actions.push({
            type: rule.actions.type,
            policyId: policy.id,
            rule,
            resourceType,
            resourceId
          });
        }
      }
    }

    // Execute actions
    const executedActions = await executePolicyActions(actions, user.id);

    res.json({
      success: true,
      data: {
        violations,
        actions: executedActions,
        totalPolicies: activePolicies.length,
        totalViolations: violations.length
      }
    });
  } catch (error) {
    console.error('Error enforcing governance policies:', error);
    res.status(500).json({ success: false, error: 'Failed to enforce governance policies' });
  }
};

// Get policy violations
export const getPolicyViolations = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view policy violations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { 
      policyId, 
      resourceType, 
      severity, 
      resolved,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};
    if (policyId) where.policyId = policyId;
    if (resourceType) where.resourceType = resourceType;
    if (severity) where.severity = severity;
    if (resolved !== undefined) {
      if (resolved === 'true') {
        where.resolvedAt = { not: null };
      } else {
        where.resolvedAt = null;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Note: PolicyViolation model doesn't exist yet, so we'll return empty data
    // This will be implemented when the model is added to the schema
    const violations: any[] = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        violations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting policy violations:', error);
    res.status(500).json({ success: false, error: 'Failed to get policy violations' });
  }
};

// Resolve a policy violation
export const resolvePolicyViolation = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can resolve policy violations
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;
    const { resolutionNotes } = req.body;

    // Note: PolicyViolation model doesn't exist yet, so we'll return a mock response
    // This will be implemented when the model is added to the schema
    const violation = {
      id,
      resolvedAt: new Date(),
      resolvedBy: user.id,
      resolutionNotes
    };

    res.json({
      success: true,
      data: violation
    });
  } catch (error) {
    console.error('Error resolving policy violation:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve policy violation' });
  }
};

// Helper function to check if a policy rule is violated
async function checkPolicyRule(rule: GovernancePolicyRule, context: any): Promise<boolean> {
  const { resourceType, content, metadata, user } = context;

  // Check conditions
  if (rule.conditions.resourceType && rule.conditions.resourceType !== resourceType) {
    return false;
  }

  if (rule.conditions.userRole && rule.conditions.userRole !== user.role) {
    return false;
  }

  // Check content-based conditions
  if (rule.conditions.sensitivity && content) {
    // This would need to be implemented based on your classification logic
    // For now, we'll skip this check
  }

  // Check age-based conditions
  if (rule.conditions.age && metadata?.createdAt) {
    const ageInDays = (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < rule.conditions.age) {
      return false;
    }
  }

  return true;
}

// Interface for policy action rules
interface PolicyActionRule {
  actions: {
    type: string;
    message: string;
    classification?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Interface for policy actions
interface PolicyAction {
  type: string;
  policyId?: string;
  resourceType?: string;
  resourceId?: string;
  rule?: PolicyActionRule;
  [key: string]: unknown;
}

// Helper function to execute policy actions
async function executePolicyActions(actions: PolicyAction[], userId: string): Promise<PolicyAction[]> {
  const executedActions = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'log':
          // Log the action
          await prisma.auditLog.create({
            data: {
              action: 'POLICY_VIOLATION',
              details: JSON.stringify({
                policyId: action.policyId,
                resourceType: action.resourceType,
                resourceId: action.resourceId,
                rule: action.rule
              }),
              userId,
              ipAddress: 'system',
              userAgent: 'governance-system'
            }
          });
          break;

        case 'auto_classify':
          // Auto-classify the resource
          if (action.rule && action.rule.actions.classification) {
            const resourceType = action.resourceType || 'unknown';
            const resourceId = action.resourceId || 'unknown';
            await prisma.dataClassification.create({
              data: {
                resourceType,
                resourceId,
                sensitivity: action.rule.actions.classification,
                classifiedBy: userId,
                notes: `Auto-classified by governance policy: ${action.rule.actions.message}`
              }
            });
          }
          break;

        case 'auto_delete':
          // Auto-delete the resource (implement based on resource type)
          // This would need to be implemented based on your resource types
          break;

        case 'block':
        case 'warn':
          // These are handled by the violation tracking
          break;
      }

      executedActions.push({
        ...action,
        executed: true,
        executedAt: new Date()
      });
    } catch (error) {
      console.error('Error executing policy action:', error);
      executedActions.push({
        ...action,
        executed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return executedActions;
} 