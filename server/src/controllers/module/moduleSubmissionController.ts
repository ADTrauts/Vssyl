import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, ModuleCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../middleware/auth';
import { ModuleSecurityService } from '../../services/moduleSecurityService';
import { initializeHrScheduleForBusiness } from '../../services/hrScheduleService';
import { storageService } from '../../services/storageService';
import { runBaselineZipScan } from '../../services/moduleArtifactBaselineScan';
import { runSmartModuleScan } from '../../services/moduleArtifactSmartScan';
import {
  asRecordJson,
  getManifestEntryUrl,
  isValidHttpsEntryUrl,
  VALID_MODULE_CATEGORIES,
  classifyArtifactUploadInitError,
} from './moduleShared';


export const submitModule = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      name,
      description,
      version,
      category,
      tags,
      manifest,
      dependencies,
      permissions,
      readme,
      license,
      screenshots: screenshotsBody,
    } = req.body;

    // Validate required fields
    if (!name || !description || !version || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, description, version, category' 
      });
    }

    if (typeof category !== 'string' || !VALID_MODULE_CATEGORIES.has(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Use one of: ${[...VALID_MODULE_CATEGORIES].join(', ')}`,
      });
    }

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      return res.status(400).json({
        success: false,
        error: 'Manifest is required and must be a JSON object',
      });
    }

    // Enhanced security validation
    const securityService = new ModuleSecurityService(prisma);
    const securityValidation = await securityService.validateModuleSubmission(req.body);
    
    if (!securityValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Module failed security validation',
        details: {
          errors: securityValidation.errors,
          warnings: securityValidation.warnings,
          securityScore: securityValidation.securityScore,
          recommendations: securityValidation.recommendations
        }
      });
    }

    // Log security warnings if any
    if (securityValidation.warnings.length > 0) {
      console.warn('⚠️ Module submission has security warnings:', securityValidation.warnings);
    }

    // Create the module
    const screenshots =
      Array.isArray(screenshotsBody) && screenshotsBody.every((s: unknown) => typeof s === 'string')
        ? (screenshotsBody as string[])
        : [];

    const module = await prisma.module.create({
      data: {
        name,
        description,
        version,
        category: category as ModuleCategory,
        tags: tags || [],
        screenshots,
        manifest,
        dependencies: dependencies || [],
        permissions: permissions || [],
        developerId: user.id,
        status: 'PENDING'
      }
    });

    // Create the submission record
    const submission = await prisma.moduleSubmission.create({
      data: {
        moduleId: module.id,
        submitterId: user.id,
        status: 'PENDING'
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Module submitted successfully for review',
        submission,
        securityValidation: {
          securityScore: securityValidation.securityScore,
          status: securityValidation.validationDetails.securityStatus,
          warnings: securityValidation.warnings,
          recommendations: securityValidation.recommendations,
        },
        /** Phase 4 Day 0 — soft deprecation (see THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md). */
        submissionPolicy: {
          hostedUrlOnlyDeprecation: 'soft' as const,
          message:
            'Hosted-URL-only module delivery is deprecated. Prefer uploading a zip artifact after submit (GCS pipeline). Mandatory artifact cutoff per platform policy.',
          mandatoryArtifactCutoffDays: 90,
        },
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error submitting module:', err);
    void logger.error('Error submitting module', {
      operation: 'submit_module',
      error: { message: err.message, stack: err.stack },
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        return res.status(503).json({
          success: false,
          error:
            'Database is missing required tables or columns. Deploy the latest migrations, then retry.',
          code: error.code,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to submit module',
        code: error.code,
      });
    }

    const exposeMessage = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: exposeMessage ? err.message : 'Failed to submit module',
      ...(exposeMessage && { stack: err.stack }),
    });
  }
};

// Get all module submissions (admin only)
export const getModuleSubmissions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const submissions = await prisma.moduleSubmission.findMany({
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting module submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get module submissions' });
  }
};

// Review a module submission (admin only)
export const reviewModuleSubmission = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { submissionId } = req.params;
    const { action, reviewNotes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action. Must be "approve" or "reject"' 
      });
    }

    const submission = await prisma.moduleSubmission.findUnique({
      where: { id: submissionId },
      include: {
        module: true
      }
    });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    if (submission.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        error: 'Submission has already been reviewed' 
      });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // If approved/rejected, update module version status when available
    const latestVersion = await prisma.moduleVersion.findFirst({
      where: {
        moduleId: submission.moduleId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (action === 'approve') {
      if (latestVersion) {
        const artifact = await prisma.moduleArtifact.findUnique({
          where: { moduleVersionId: latestVersion.id },
          select: { scanStatus: true },
        });
        if (!artifact || artifact.scanStatus !== 'PASSED') {
          return res.status(400).json({
            success: false,
            error: 'Module artifact scan must pass before approval',
          });
        }
      }
    }

    // Update submission only after pre-approval guards pass.
    const updatedSubmission = await prisma.moduleSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        reviewNotes,
        reviewerId: user.id,
        reviewedAt: new Date()
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (action === 'approve') {
      if (latestVersion) {

        await prisma.moduleVersion.updateMany({
          where: { moduleId: submission.moduleId, isCurrent: true },
          data: { isCurrent: false, status: 'ARCHIVED' },
        });

        await prisma.moduleVersion.update({
          where: { id: latestVersion.id },
          data: {
            status: 'PUBLISHED',
            isCurrent: true,
            approvedBy: user.id,
            approvedAt: new Date(),
            reviewNotes: reviewNotes || undefined,
          },
        });
      }

      await prisma.module.update({
        where: { id: submission.moduleId },
        data: {
          status: 'APPROVED',
          version: latestVersion?.version || submission.module.version,
        },
      });

      // Sync module AI context to registry (non-blocking)
      try {
        const { moduleRegistrySyncService } = await import('../../services/ModuleRegistrySyncService');
        await moduleRegistrySyncService.syncModule(submission.moduleId);
        console.log(`✅ Module AI context synced for: ${submission.module.name}`);
      } catch (syncError) {
        // Log error but don't fail the approval
        console.error(`⚠️  Failed to sync AI context for module ${submission.module.name}:`, syncError);
        console.error('   Module is approved, but AI context may need manual sync');
      }
    } else if (latestVersion) {
      await prisma.moduleVersion.update({
        where: { id: latestVersion.id },
        data: {
          status: 'REJECTED',
          rejectedBy: user.id,
          rejectedAt: new Date(),
          reviewNotes: reviewNotes || undefined,
        },
      });
    }

    res.json({ 
      success: true, 
      data: { 
        message: `Module ${action}d successfully`,
        submission: updatedSubmission 
      } 
    });
  } catch (error) {
    console.error('Error reviewing module submission:', error);
    res.status(500).json({ success: false, error: 'Failed to review module submission' });
  }
};

// Promote a previous module version to current (admin only)
export const promoteModuleVersion = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { moduleId, version } = req.params;
    if (!moduleId || !version) {
      return res.status(400).json({ success: false, error: 'moduleId and version are required' });
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true, version: true },
    });
    if (!moduleRecord) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const targetVersion = await prisma.moduleVersion.findUnique({
      where: { moduleId_version: { moduleId, version } },
      select: { id: true, version: true, isCurrent: true },
    });
    if (!targetVersion) {
      return res.status(404).json({ success: false, error: 'Target version not found for this module' });
    }

    const targetArtifact = await prisma.moduleArtifact.findUnique({
      where: { moduleVersionId: targetVersion.id },
      select: { scanStatus: true },
    });
    if (!targetArtifact || targetArtifact.scanStatus !== 'PASSED') {
      return res.status(400).json({ success: false, error: 'Target version artifact scan must pass before promotion' });
    }

    if (targetVersion.isCurrent) {
      return res.status(200).json({
        success: true,
        data: {
          message: `Version ${version} is already the current published version`,
          moduleId,
          version,
        },
      });
    }

    await prisma.$transaction(async tx => {
      await tx.moduleVersion.updateMany({
        where: { moduleId, isCurrent: true },
        data: { isCurrent: false, status: 'ARCHIVED' },
      });

      await tx.moduleVersion.update({
        where: { id: targetVersion.id },
        data: {
          isCurrent: true,
          status: 'PUBLISHED',
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      });

      await tx.module.update({
        where: { id: moduleId },
        data: {
          status: 'APPROVED',
          version: targetVersion.version,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'MODULE_PROMOTE_PREVIOUS_VERSION',
          details: JSON.stringify({
            moduleId,
            moduleName: moduleRecord.name,
            promotedVersion: targetVersion.version,
            previousCurrentVersion: moduleRecord.version,
          }),
          timestamp: new Date(),
        },
      });
    });

    return res.json({
      success: true,
      data: {
        message: `Promoted version ${version} successfully`,
        moduleId,
        version,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to promote module version', {
      operation: 'module_promote_previous_version',
      error: { message: err.message, stack: err.stack },
    });
    return res.status(500).json({ success: false, error: 'Failed to promote module version' });
  }
};

// Get user's submitted modules
export const getUserSubmissions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const submissions = await prisma.moduleSubmission.findMany({
      where: {
        submitterId: user.id
      },
      include: {
        module: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting user submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get user submissions' });
  }
};

// Link a module to a business
export const linkModuleToBusiness = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const moduleId =
      typeof req.body?.moduleId === 'string' ? req.body.moduleId.trim() : '';
    const businessId =
      typeof req.body?.businessId === 'string' ? req.body.businessId.trim() : '';

    if (!moduleId || !businessId) {
      return res.status(400).json({ success: false, error: 'Module ID and Business ID are required' });
    }

    // Verify the module exists, then enforce developer ownership
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true, developerId: true, businessId: true },
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (module.developerId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied for this module' });
    }

    // Upload/link policy: any active business member (including employees) can link modules.
    const businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: user.id,
        isActive: true,
      },
      include: {
        business: true,
      },
    });

    if (!businessMember) {
      return res.status(403).json({ success: false, error: 'Access denied for this business' });
    }

    // Ensure linked business is designated for developer module workflows.
    const markDeveloperBusiness = async () => {
      await (prisma as any).business.update({
        where: { id: businessId },
        data: {
          isDeveloperBusiness: true,
          developerBusinessLinkedAt: new Date(),
          developerBusinessLinkedBy: user.id,
        },
      });
    };

    // Idempotent behavior: if already linked to this business, return success without changing state.
    if (module.businessId === businessId) {
      const currentBusiness = await (prisma as any).business.findUnique({
        where: { id: businessId },
        select: { isDeveloperBusiness: true },
      });
      if (!currentBusiness?.isDeveloperBusiness) {
        await markDeveloperBusiness();
      }

      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'MODULE_LINK_BUSINESS_NOOP',
            details: JSON.stringify({
              moduleId,
              moduleName: module.name,
              businessId,
              businessName: businessMember.business.name,
              reason: 'already_linked',
            }),
            timestamp: new Date(),
          },
        });
      } catch (auditError: unknown) {
        const err = auditError instanceof Error ? auditError : new Error(String(auditError));
        await logger.warn('Audit logging failed for module business link noop', {
          operation: 'module_link_business',
          moduleId,
          businessId,
          error: { message: err.message, stack: err.stack },
        });
      }

      return res.json({
        success: true,
        data: {
          message: 'Module is already linked to this business',
          module: {
            id: module.id,
            businessId,
            business: {
              id: businessMember.business.id,
              name: businessMember.business.name,
              isDeveloperBusiness: true,
            },
          },
        },
      });
    }

    const previousBusinessId = module.businessId ?? null;

    // Update module linkage and business designation in one transaction.
    const [, updatedModule] = await (prisma as any).$transaction([
      (prisma as any).business.update({
        where: { id: businessId },
        data: {
          isDeveloperBusiness: true,
          developerBusinessLinkedAt: new Date(),
          developerBusinessLinkedBy: user.id,
        },
      }),
      prisma.module.update({
        where: {
          id: moduleId,
        },
        data: {
          businessId,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'MODULE_LINK_BUSINESS',
          details: JSON.stringify({
            moduleId,
            moduleName: module.name,
            previousBusinessId,
            linkedBusinessId: businessId,
            linkedBusinessName: businessMember.business.name,
            developerBusinessDesignated: true,
          }),
          timestamp: new Date(),
        },
      });
    } catch (auditError: unknown) {
      const err = auditError instanceof Error ? auditError : new Error(String(auditError));
      await logger.warn('Audit logging failed for module business link', {
        operation: 'module_link_business',
        moduleId,
        businessId,
        error: { message: err.message, stack: err.stack },
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Module linked to business successfully',
        module: updatedModule,
      },
    });
  } catch (error) {
    console.error('Error linking module to business:', error);
    res.status(500).json({ success: false, error: 'Failed to link module to business' });
  }
};

// Get modules for a specific business
export const getBusinessModules = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { businessId } = req.params;

    // Verify the business exists and user has access
    const businessMember = await prisma.businessMember.findFirst({
      where: {
        businessId: businessId,
        userId: user.id,
        isActive: true
      },
      include: {
        business: true
      }
    });

    if (!businessMember) {
      return res.status(404).json({ success: false, error: 'Business not found or access denied' });
    }

    // Get all modules linked to this business
    const modules = await prisma.module.findMany({
      where: {
        businessId: businessId
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: modules });
  } catch (error) {
    console.error('Error getting business modules:', error);
    res.status(500).json({ success: false, error: 'Failed to get business modules' });
  }
}; 
