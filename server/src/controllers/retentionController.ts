import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  return req.user;
};

// Get all retention policies
export const getRetentionPolicies = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view retention policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const policies = await prisma.systemRetentionPolicy.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error getting retention policies:', error);
    res.status(500).json({ success: false, error: 'Failed to get retention policies' });
  }
};

// Create a new retention policy
export const createRetentionPolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can create retention policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const {
      name,
      description,
      resourceType,
      retentionPeriod,
      archiveAfter,
      deleteAfter,
      isActive = true
    } = req.body;

    if (!name || !resourceType || !retentionPeriod) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, resourceType, and retentionPeriod are required' 
      });
    }

    const policy = await prisma.systemRetentionPolicy.create({
      data: {
        name,
        description,
        resourceType,
        retentionPeriod,
        archiveAfter,
        deleteAfter,
        isActive,
        createdBy: user.id
      }
    });

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error creating retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to create retention policy' });
  }
};

// Update a retention policy
export const updateRetentionPolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can update retention policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;
    const {
      name,
      description,
      resourceType,
      retentionPeriod,
      archiveAfter,
      deleteAfter,
      isActive
    } = req.body;

    const policy = await prisma.systemRetentionPolicy.update({
      where: { id },
      data: {
        name,
        description,
        resourceType,
        retentionPeriod,
        archiveAfter,
        deleteAfter,
        isActive
      }
    });

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error updating retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to update retention policy' });
  }
};

// Delete a retention policy
export const deleteRetentionPolicy = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can delete retention policies
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;

    await prisma.systemRetentionPolicy.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Retention policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to delete retention policy' });
  }
};

// Get retention status for different resource types
export const getRetentionStatus = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view retention status
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { resourceType } = req.query;

    // Get active policies for the resource type
    const policies = await prisma.systemRetentionPolicy.findMany({
      where: {
        resourceType: resourceType as string,
        isActive: true
      }
    });

    // Get counts of different resource types
    const counts = await Promise.all([
      prisma.file.count(),
      prisma.message.count(),
      prisma.conversation.count(),
      prisma.auditLog.count(),
      prisma.dataClassification.count()
    ]);

    const status = {
      policies,
      resourceCounts: {
        files: counts[0],
        messages: counts[1],
        conversations: counts[2],
        auditLogs: counts[3],
        classifications: counts[4]
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting retention status:', error);
    res.status(500).json({ success: false, error: 'Failed to get retention status' });
  }
};

// Trigger manual cleanup based on retention policies
export const triggerCleanup = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can trigger cleanup
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { resourceType } = req.body;

    // Get active policies for the resource type
    const policies = await prisma.systemRetentionPolicy.findMany({
      where: {
        resourceType,
        isActive: true
      }
    });

    let cleanupResults = [];

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

      let deletedCount = 0;

      // Clean up based on resource type
      switch (resourceType) {
        case 'file':
          const deletedFiles = await prisma.file.deleteMany({
            where: {
              createdAt: {
                lt: cutoffDate
              }
            }
          });
          deletedCount = deletedFiles.count;
          break;

        case 'message':
          const deletedMessages = await prisma.message.deleteMany({
            where: {
              createdAt: {
                lt: cutoffDate
              }
            }
          });
          deletedCount = deletedMessages.count;
          break;

        case 'auditLog':
          const deletedAuditLogs = await prisma.auditLog.deleteMany({
            where: {
              timestamp: {
                lt: cutoffDate
              }
            }
          });
          deletedCount = deletedAuditLogs.count;
          break;

        default:
          console.log(`No cleanup implemented for resource type: ${resourceType}`);
      }

      cleanupResults.push({
        policyId: policy.id,
        policyName: policy.name,
        resourceType: policy.resourceType,
        deletedCount,
        cutoffDate
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Cleanup completed',
        results: cleanupResults
      }
    });
  } catch (error) {
    console.error('Error triggering cleanup:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger cleanup' });
  }
};

// Get data classifications
export const getDataClassifications = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { resourceType, sensitivity, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (resourceType) where.resourceType = resourceType;
    if (sensitivity) where.sensitivity = sensitivity;

    const [classifications, total] = await Promise.all([
      prisma.dataClassification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dataClassification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        classifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting data classifications:', error);
    res.status(500).json({ success: false, error: 'Failed to get data classifications' });
  }
};

// Classify data
export const classifyData = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      resourceType,
      resourceId,
      sensitivity,
      expiresAt,
      notes
    } = req.body;

    if (!resourceType || !resourceId || !sensitivity) {
      return res.status(400).json({ 
        success: false, 
        error: 'ResourceType, resourceId, and sensitivity are required' 
      });
    }

    const classification = await prisma.dataClassification.upsert({
      where: {
        resourceType_resourceId: {
          resourceType,
          resourceId
        }
      },
      update: {
        sensitivity,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
        updatedAt: new Date()
      },
      create: {
        resourceType,
        resourceId,
        sensitivity,
        classifiedBy: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes
      }
    });

    res.json({
      success: true,
      data: classification
    });
  } catch (error) {
    console.error('Error classifying data:', error);
    res.status(500).json({ success: false, error: 'Failed to classify data' });
  }
};

// Get backup records
export const getBackupRecords = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view backup records
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { backupType, status, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (backupType) where.backupType = backupType;
    if (status) where.status = status;

    const [backups, total] = await Promise.all([
      prisma.backupRecord.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.backupRecord.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        backups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting backup records:', error);
    res.status(500).json({ success: false, error: 'Failed to get backup records' });
  }
};

// Create backup
export const createBackup = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can create backups
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { backupType, notes } = req.body;

    if (!backupType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Backup type is required' 
      });
    }

    // For now, create a mock backup record
    // In production, this would trigger actual backup creation
    const backup = await prisma.backupRecord.create({
      data: {
        backupType,
        backupPath: `/backups/${backupType}_${Date.now()}.backup`,
        backupSize: 0, // Will be updated when backup completes
        checksum: 'pending',
        status: 'completed',
        notes,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: user.id
      }
    });

    res.json({
      success: true,
      data: backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
}; 

// Get classification rules
export const getClassificationRules = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can view classification rules
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { resourceType, isActive } = req.query;

    const where: any = {};
    if (resourceType) where.resourceType = resourceType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await prisma.classificationRule.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting classification rules:', error);
    res.status(500).json({ success: false, error: 'Failed to get classification rules' });
  }
};

// Create classification rule
export const createClassificationRule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can create classification rules
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const {
      name,
      description,
      pattern,
      resourceType,
      sensitivity,
      priority = 0,
      isActive = true
    } = req.body;

    if (!name || !pattern || !resourceType || !sensitivity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, pattern, resourceType, and sensitivity are required' 
      });
    }

    const rule = await prisma.classificationRule.create({
      data: {
        name,
        description,
        pattern,
        resourceType,
        sensitivity,
        priority,
        isActive,
        createdBy: user.id
      }
    });

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating classification rule:', error);
    res.status(500).json({ success: false, error: 'Failed to create classification rule' });
  }
};

// Update classification rule
export const updateClassificationRule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can update classification rules
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;
    const {
      name,
      description,
      pattern,
      resourceType,
      sensitivity,
      priority,
      isActive
    } = req.body;

    const rule = await prisma.classificationRule.update({
      where: { id },
      data: {
        name,
        description,
        pattern,
        resourceType,
        sensitivity,
        priority,
        isActive
      }
    });

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error updating classification rule:', error);
    res.status(500).json({ success: false, error: 'Failed to update classification rule' });
  }
};

// Delete classification rule
export const deleteClassificationRule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Only admins can delete classification rules
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { id } = req.params;

    await prisma.classificationRule.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Classification rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting classification rule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete classification rule' });
  }
};

// Get classification templates
export const getClassificationTemplates = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const templates = await prisma.classificationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error getting classification templates:', error);
    res.status(500).json({ success: false, error: 'Failed to get classification templates' });
  }
};

// Create classification template
export const createClassificationTemplate = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      name,
      description,
      sensitivity,
      expiresIn,
      notes
    } = req.body;

    if (!name || !sensitivity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and sensitivity are required' 
      });
    }

    const template = await prisma.classificationTemplate.create({
      data: {
        name,
        description,
        sensitivity,
        expiresIn,
        notes,
        createdBy: user.id
      }
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating classification template:', error);
    res.status(500).json({ success: false, error: 'Failed to create classification template' });
  }
};

// Bulk classify data
export const bulkClassifyData = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { items, sensitivity, expiresAt, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Items array is required and must not be empty' 
      });
    }

    if (!sensitivity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sensitivity is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const classification = await prisma.dataClassification.upsert({
          where: {
            resourceType_resourceId: {
              resourceType: item.resourceType,
              resourceId: item.resourceId
            }
          },
          update: {
            sensitivity,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            notes,
            updatedAt: new Date()
          },
          create: {
            resourceType: item.resourceType,
            resourceId: item.resourceId,
            sensitivity,
            classifiedBy: user.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            notes
          }
        });
        results.push(classification);
      } catch (error) {
        errors.push({
          resourceType: item.resourceType,
          resourceId: item.resourceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        total: items.length,
        successfulCount: results.length,
        failedCount: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk classifying data:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk classify data' });
  }
};

// Get expiring classifications
export const getExpiringClassifications = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { days = 30, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + Number(days));

    const [classifications, total] = await Promise.all([
      prisma.dataClassification.findMany({
        where: {
          expiresAt: {
            not: null,
            lte: cutoffDate
          }
        },
        skip,
        take: Number(limit),
        orderBy: { expiresAt: 'asc' }
      }),
      prisma.dataClassification.count({
        where: {
          expiresAt: {
            not: null,
            lte: cutoffDate
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        classifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting expiring classifications:', error);
    res.status(500).json({ success: false, error: 'Failed to get expiring classifications' });
  }
};

// Auto-classify data based on rules
export const autoClassifyData = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { resourceType, resourceId, content } = req.body;

    if (!resourceType || !resourceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ResourceType and resourceId are required' 
      });
    }

    // Get active classification rules for this resource type
    const rules = await prisma.classificationRule.findMany({
      where: {
        resourceType,
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });

    let matchedRule = null;
    let matchedSensitivity = null;

    // Check each rule against the content
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (content && regex.test(content)) {
          matchedRule = rule;
          matchedSensitivity = rule.sensitivity;
          break;
        }
      } catch (error) {
        console.error(`Invalid regex pattern in rule ${rule.id}:`, rule.pattern);
        continue;
      }
    }

    if (matchedRule) {
      // Create or update classification
      const classification = await prisma.dataClassification.upsert({
        where: {
          resourceType_resourceId: {
            resourceType,
            resourceId
          }
        },
        update: {
          sensitivity: matchedSensitivity!,
          notes: `Auto-classified by rule: ${matchedRule.name}`,
          updatedAt: new Date()
        },
        create: {
          resourceType,
          resourceId,
          sensitivity: matchedSensitivity!,
          classifiedBy: user.id,
          notes: `Auto-classified by rule: ${matchedRule.name}`
        }
      });

      res.json({
        success: true,
        data: {
          classification,
          matchedRule,
          autoClassified: true
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          classification: null,
          matchedRule: null,
          autoClassified: false
        }
      });
    }
  } catch (error) {
    console.error('Error auto-classifying data:', error);
    res.status(500).json({ success: false, error: 'Failed to auto-classify data' });
  }
}; 