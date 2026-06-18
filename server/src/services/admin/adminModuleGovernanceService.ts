import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AdminJsonObject, AdminModuleStatsPayload, AdminModuleAnalyticsPayload, AdminDeveloperStatsPayload, AdminModuleRevenuePayload } from './adminServiceContracts';
import { logModuleGovernanceAudit } from './adminAuditService';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from './adminAuditTaxonomy';

function toSafeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : 0;
}

interface FinancialValidationSummary {
  moduleSubscriptionRevenue: number;
  moduleSubscriptionDeveloperRevenue: number;
  moduleSubscriptionPlatformRevenue: number;
  recordedDeveloperRevenue: number;
  recordedPlatformRevenue: number;
  pendingPayoutAmount: number;
  paidPayoutAmount: number;
  developerRevenueDelta: number;
  platformRevenueDelta: number;
}

export interface ModuleDataFilters {
  status?: string;
  category?: string;
  dateRange?: string;
  developerId?: string;
}

export interface ModuleSubmission {
  id: string;
  status: string;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewNotes?: string | null;
  module: Record<string, unknown>;
  submitter?: Record<string, unknown>;
  reviewer?: Record<string, unknown>;
}

export async function getModuleSubmissions(filters: ModuleDataFilters = {}): Promise<ModuleSubmission[]> {
    try {
      const whereClause: Record<string, unknown> = {};
      
      if (filters.status && filters.status !== 'all') {
        whereClause.status = filters.status;
      }
      
      if (filters.category && filters.category !== 'all') {
        whereClause.module = {
          category: filters.category
        };
      }

      // Add pagination to prevent loading too many records at once
      const limit = 100; // Limit to 100 most recent submissions
      
      const submissions = await prisma.moduleSubmission.findMany({
        where: whereClause,
        take: limit, // Limit results
        include: {
          module: {
            include: {
              versions: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  version: true,
                  status: true,
                  isCurrent: true,
                  certificationStatus: true,
                  certificationErrors: true,
                  certificationWarnings: true,
                  certificationChecklist: true,
                  certificationValidatedAt: true,
                  certificationValidatorVersion: true,
                  artifact: {
                    select: {
                      scanStatus: true,
                      scanSummary: true,
                      sha256: true,
                      sizeBytes: true,
                    },
                  },
                },
              },
              business: {
                select: {
                  id: true,
                  name: true,
                  isDeveloperBusiness: true,
                  developerBusinessLinkedAt: true,
                  developerBusinessLinkedBy: true,
                }
              },
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

      const { serializeCertificationFromVersion } = await import('../moduleCertificationPersistence.js');

      return submissions.map((submission: Record<string, unknown>) => {
        const module = submission.module as Record<string, unknown> & {
          versions?: Array<Record<string, unknown>>;
        };
        const latestVersion = module.versions?.[0];
        return {
          ...submission,
          module: {
            ...module,
            certification: latestVersion
              ? serializeCertificationFromVersion(latestVersion)
              : {
                  status: 'not_run',
                  errors: [],
                  warnings: [],
                  checklist: [],
                  validatedAt: null,
                  validatorVersion: null,
                },
          },
        };
      }) as unknown as ModuleSubmission[];
    } catch (error) {
      await logger.error('Failed to get module submissions', {
        operation: 'admin_get_module_submissions',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get module submissions');
    }
  }

  export async function getModuleStats(): Promise<AdminModuleStatsPayload> {
    try {
      const [
        totalSubmissions,
        pendingReviews,
        approvedToday,
        rejectedToday,
        totalRevenue,
        modulesWithDevelopers,
        averageRating,
        topCategory
      ] = await Promise.all([
        prisma.moduleSubmission.count(),
        prisma.moduleSubmission.count({
          where: { status: 'PENDING' }
        }),
        prisma.moduleSubmission.count({
          where: {
            status: 'APPROVED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.moduleSubmission.count({
          where: {
            status: 'REJECTED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.moduleSubscription.aggregate({
          _sum: {
            amount: true
          },
          where: {
            status: 'active'
          }
        }),
        // Optimize: Count distinct developers (more efficient than checking all users)
        prisma.module.findMany({
          select: { developerId: true },
          distinct: ['developerId']
        }),
        prisma.module.aggregate({
          _avg: {
            rating: true
          },
          where: {
            status: 'APPROVED'
          }
        }),
        prisma.module.groupBy({
          by: ['category'],
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 1
        })
      ]);

      // Count distinct developers
      const activeDevelopers = modulesWithDevelopers.length;

      return {
        totalSubmissions,
        pendingReviews,
        approvedToday,
        rejectedToday,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeDevelopers, // Now calculated from distinct developers
        averageRating: averageRating._avg.rating || 0,
        topCategory: topCategory[0]?.category || 'N/A'
      };
    } catch (error) {
      await logger.error('Failed to get module statistics', {
        operation: 'admin_get_module_stats',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get module stats');
    }
  }

  export async function reviewModuleSubmission(
    submissionId: string,
    action: 'approve' | 'reject',
    reviewNotes?: string,
    adminId?: string
  ): Promise<AdminJsonObject> {
    try {
      const submission = await prisma.moduleSubmission.findUnique({
        where: { id: submissionId },
        include: {
          module: true
        }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status !== 'PENDING') {
        throw new Error('Submission has already been reviewed');
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      const latestVersion = await prisma.moduleVersion.findFirst({
        where: { moduleId: submission.moduleId },
        orderBy: { createdAt: 'desc' },
      });

      let approvalCertification:
        | { certification: import('../moduleCertificationPersistence.js').ModuleCertificationApiShape; revalidated: boolean }
        | undefined;

      if (action === 'approve') {
        if (latestVersion) {
          const artifact = await prisma.moduleArtifact.findUnique({
            where: { moduleVersionId: latestVersion.id },
            select: { scanStatus: true },
          });
          if (!artifact || artifact.scanStatus !== 'PASSED') {
            throw new Error('Module artifact scan must pass before approval');
          }
        }

        if (latestVersion) {
          const { ensureModuleVersionCertificationForActivation } = await import(
            '../moduleVersionCertificationGate.js'
          );
          approvalCertification = await ensureModuleVersionCertificationForActivation({
            moduleId: submission.moduleId,
            moduleVersion: latestVersion,
            modulePermissions: submission.module.permissions,
          });
          if (approvalCertification.certification.warnings.length > 0) {
            await logger.warn('Module approved with certification warnings', {
              operation: 'module_certification_review',
              moduleId: submission.moduleId,
              submissionId,
              warnings: approvalCertification.certification.warnings,
            });
          }
        }
      } else if (latestVersion) {
        const { buildCertificationInputFromModule, validateModuleCertification } = await import(
          '../moduleCertificationValidator.js'
        );
        const { persistModuleVersionCertification } = await import('../moduleCertificationPersistence.js');
        const rejectCertification = validateModuleCertification(
          buildCertificationInputFromModule(submission.module, latestVersion.manifestSnapshot)
        );
        await persistModuleVersionCertification(latestVersion.id, rejectCertification);
      }

      const updatedSubmission = await prisma.moduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          reviewNotes,
          reviewerId: adminId,
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

      // If approved, publish latest scanned version
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
              approvedBy: adminId,
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

        try {
          const { moduleRegistrySyncService } = await import('../ModuleRegistrySyncService.js');
          await moduleRegistrySyncService.syncModule(submission.moduleId);
        } catch (syncError: unknown) {
          const se = syncError instanceof Error ? syncError : new Error(String(syncError));
          await logger.error('Failed to sync AI context for approved module', {
            operation: 'module_approve_sync_ai',
            context: { moduleId: submission.moduleId, moduleName: submission.module.name },
            error: { message: se.message, stack: se.stack },
          });
        }
      } else if (latestVersion) {
        await prisma.moduleVersion.update({
          where: { id: latestVersion.id },
          data: {
            status: 'REJECTED',
            rejectedBy: adminId || null,
            rejectedAt: new Date(),
            reviewNotes: reviewNotes || undefined,
          },
        });
      }

      // Log the action
      await logModuleGovernanceAudit({
        adminId: adminId || 'system',
        action:
          action === 'approve'
            ? ADMIN_AUDIT_ACTIONS.MODULE_APPROVE
            : ADMIN_AUDIT_ACTIONS.MODULE_REJECT,
        resourceId: submissionId,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE_SUBMISSION,
        details: {
          submissionId,
          moduleId: submission.moduleId,
          moduleName: submission.module.name,
          action,
          reviewNotes,
        },
      });

      return {
        ...(updatedSubmission as unknown as AdminJsonObject),
        ...(approvalCertification && {
          certification: {
            ...approvalCertification.certification,
            revalidated: approvalCertification.revalidated,
          },
        }),
      };
    } catch (error) {
      const { ModuleVersionCertificationBlockedError } = await import(
        '../moduleVersionCertificationGate.js'
      );
      if (error instanceof ModuleVersionCertificationBlockedError) {
        throw error;
      }
      if (
        error instanceof Error &&
        (error.message === 'Submission not found' ||
          error.message === 'Submission has already been reviewed' ||
          error.message === 'Module artifact scan must pass before approval')
      ) {
        throw error;
      }
      await logger.error('Failed to review module submission', {
        operation: 'admin_review_module_submission',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to review module submission');
    }
  }

  export async function bulkModuleAction(
    submissionIds: string[],
    action: 'approve' | 'reject',
    adminId?: string
  ): Promise<AdminJsonObject> {
    try {
      const results = await Promise.all(
        submissionIds.map(submissionId =>
          reviewModuleSubmission(submissionId, action, undefined, adminId)
        )
      );

      return {
        message: `Successfully ${action}ed ${submissionIds.length} submissions`,
        results
      };
    } catch (error) {
      await logger.error('Failed to perform bulk module action', {
        operation: 'admin_bulk_module_action',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to perform bulk module action');
    }
  }

  export async function promoteModuleVersion(
    moduleId: string,
    version: string,
    adminId: string
  ): Promise<{
    moduleId: string;
    version: string;
    previousCurrentVersion: string;
    certification: {
      status: string;
      errors: string[];
      warnings: string[];
      checklist: unknown[];
      validatedAt: string | null;
      validatorVersion: string | null;
      revalidated: boolean;
    };
  }> {
    try {
      const { ensureModuleVersionCertificationForActivation } = await import(
        '../moduleVersionCertificationGate.js'
      );

      const moduleRecord = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true, name: true, version: true, permissions: true },
      });
      if (!moduleRecord) {
        throw new Error('Module not found');
      }

      const targetVersion = await prisma.moduleVersion.findUnique({
        where: { moduleId_version: { moduleId, version } },
        select: {
          id: true,
          version: true,
          isCurrent: true,
          manifestSnapshot: true,
          certificationStatus: true,
          certificationErrors: true,
          certificationWarnings: true,
          certificationChecklist: true,
          certificationValidatedAt: true,
          certificationValidatorVersion: true,
        },
      });
      if (!targetVersion) {
        throw new Error('Target version not found for this module');
      }

      const targetArtifact = await prisma.moduleArtifact.findUnique({
        where: { moduleVersionId: targetVersion.id },
        select: { scanStatus: true },
      });
      if (!targetArtifact || targetArtifact.scanStatus !== 'PASSED') {
        throw new Error('Target version artifact scan must pass before promotion');
      }

      const { certification, revalidated } = await ensureModuleVersionCertificationForActivation({
        moduleId,
        moduleVersion: targetVersion,
        modulePermissions: moduleRecord.permissions,
      });

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
            approvedBy: adminId,
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

        await logModuleGovernanceAudit({
          adminId,
          action: ADMIN_AUDIT_ACTIONS.MODULE_VERSION_PROMOTE,
          resourceId: moduleId,
          resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE_VERSION,
          details: {
            moduleId,
            moduleName: moduleRecord.name,
            promotedVersion: targetVersion.version,
            previousCurrentVersion: moduleRecord.version,
          },
        });
      });

      return {
        moduleId,
        version: targetVersion.version,
        previousCurrentVersion: moduleRecord.version,
        certification: { ...certification, revalidated },
      };
    } catch (error) {
      const { ModuleVersionCertificationBlockedError } = await import(
        '../moduleVersionCertificationGate.js'
      );
      if (error instanceof ModuleVersionCertificationBlockedError) {
        throw error;
      }
      await logger.error('Failed to promote module version', {
        operation: 'admin_promote_module_version',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      throw new Error(error instanceof Error ? error.message : 'Failed to promote module version');
    }
  }

  export async function getModuleVersions(moduleId: string): Promise<
    Array<{
      id: string;
      version: string;
      status: string;
      isCurrent: boolean;
      createdAt: string;
      certification: {
        status: string;
        errors: string[];
        warnings: string[];
        checklist: unknown[];
        validatedAt: string | null;
        validatorVersion: string | null;
      };
      artifact: {
        scanStatus: string;
        scanSummary?: Record<string, unknown> | null;
        sha256: string;
        sizeBytes: number;
      } | null;
    }>
  > {
    try {
      const moduleExists = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { id: true },
      });
      if (!moduleExists) {
        throw new Error('Module not found');
      }

      const rows = await prisma.moduleVersion.findMany({
        where: { moduleId },
        orderBy: { createdAt: 'desc' },
        include: {
          artifact: {
            select: { scanStatus: true, scanSummary: true, sha256: true, sizeBytes: true },
          },
        },
      });

      const { serializeCertificationFromVersion } = await import('../moduleCertificationPersistence.js');

      return rows.map(r => ({
        id: r.id,
        version: r.version,
        status: r.status,
        isCurrent: r.isCurrent,
        createdAt: r.createdAt.toISOString(),
        certification: serializeCertificationFromVersion(r),
        artifact: r.artifact
          ? {
              scanStatus: r.artifact.scanStatus,
              scanSummary: (r.artifact.scanSummary as Record<string, unknown> | null) ?? null,
              sha256: r.artifact.sha256,
              sizeBytes: r.artifact.sizeBytes,
            }
          : null,
      }));
    } catch (error) {
      await logger.error('Failed to get module versions', {
        operation: 'admin_get_module_versions',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      throw new Error(error instanceof Error ? error.message : 'Failed to get module versions');
    }
  }

  export async function promotePreviousModuleVersion(
    moduleId: string,
    adminId: string
  ): Promise<Awaited<ReturnType<typeof promoteModuleVersion>>> {
    try {
      const versions = await prisma.moduleVersion.findMany({
        where: { moduleId },
        orderBy: { createdAt: 'desc' },
        include: {
          artifact: { select: { scanStatus: true } },
        },
      });

      if (versions.length < 2) {
        throw new Error('No previous version available to promote');
      }

      const currentIdx = versions.findIndex(v => v.isCurrent);
      if (currentIdx === -1) {
        throw new Error('No current version is set for this module');
      }

      const previous = versions[currentIdx + 1];
      if (!previous) {
        throw new Error('No previous version available to promote');
      }

      if (!previous.artifact || previous.artifact.scanStatus !== 'PASSED') {
        throw new Error('Previous version artifact scan must pass before promotion');
      }

      return promoteModuleVersion(moduleId, previous.version, adminId);
    } catch (error) {
      await logger.error('Failed to promote previous module version', {
        operation: 'admin_promote_previous_module_version',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
      throw new Error(error instanceof Error ? error.message : 'Failed to promote previous module version');
    }
  }

export async function getModuleAnalytics(): Promise<AdminModuleAnalyticsPayload> {
  try {
    const [categoryStats, revenueStats, developerStats, ratingStats] = await Promise.all([
      prisma.module.groupBy({
        by: ['category'],
        _count: { id: true },
        _avg: { rating: true },
      }),
      prisma.moduleSubscription.groupBy({
        by: ['moduleId'],
        _sum: { amount: true },
        where: { status: 'active' },
      }),
      prisma.user.groupBy({
        by: ['id'],
        _count: { id: true },
        where: { modules: { some: {} } },
      }),
      prisma.module.aggregate({
        _avg: { rating: true },
        _count: { id: true },
        where: { status: 'APPROVED' },
      }),
    ]);

    return { categoryStats, revenueStats, developerStats, ratingStats };
  } catch (error: unknown) {
    await logger.error('Failed to get module analytics', {
      operation: 'admin_get_module_analytics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw new Error('Failed to get module analytics');
  }
}

export async function getDeveloperStats(): Promise<AdminDeveloperStatsPayload> {
  try {
    const [
      totalDevelopers,
      activeDeveloperGroups,
      totalModules,
      pendingSubmissions,
      approvedRating,
      topCategoryGroup,
      moduleSubscriptionRevenue,
      developerRevenueRecords,
      pendingPayout,
      paidPayout,
    ] = await Promise.all([
      prisma.user.count({ where: { modules: { some: {} } } }),
      prisma.module.groupBy({ by: ['developerId'], where: { status: 'APPROVED' } }),
      prisma.module.count(),
      prisma.moduleSubmission.count({ where: { status: 'PENDING' } }),
      prisma.module.aggregate({ where: { status: 'APPROVED' }, _avg: { rating: true } }),
      prisma.module.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true, developerRevenue: true, platformRevenue: true },
      }),
      prisma.developerRevenue.aggregate({
        _sum: { totalRevenue: true, developerRevenue: true, platformRevenue: true },
      }),
      prisma.developerRevenue.aggregate({
        where: { payoutStatus: 'pending' },
        _sum: { developerRevenue: true },
      }),
      prisma.developerRevenue.aggregate({
        where: { payoutStatus: 'paid' },
        _sum: { developerRevenue: true },
      }),
    ]);

    const validation: FinancialValidationSummary = {
      moduleSubscriptionRevenue: toSafeNumber(moduleSubscriptionRevenue._sum.amount),
      moduleSubscriptionDeveloperRevenue: toSafeNumber(moduleSubscriptionRevenue._sum.developerRevenue),
      moduleSubscriptionPlatformRevenue: toSafeNumber(moduleSubscriptionRevenue._sum.platformRevenue),
      recordedDeveloperRevenue: toSafeNumber(developerRevenueRecords._sum.developerRevenue),
      recordedPlatformRevenue: toSafeNumber(developerRevenueRecords._sum.platformRevenue),
      pendingPayoutAmount: toSafeNumber(pendingPayout._sum.developerRevenue),
      paidPayoutAmount: toSafeNumber(paidPayout._sum.developerRevenue),
      developerRevenueDelta:
        toSafeNumber(moduleSubscriptionRevenue._sum.developerRevenue) -
        toSafeNumber(developerRevenueRecords._sum.developerRevenue),
      platformRevenueDelta:
        toSafeNumber(moduleSubscriptionRevenue._sum.platformRevenue) -
        toSafeNumber(developerRevenueRecords._sum.platformRevenue),
    };

    return {
      totalDevelopers,
      activeDevelopers: activeDeveloperGroups.length,
      totalModules,
      pendingSubmissions,
      totalRevenue: toSafeNumber(moduleSubscriptionRevenue._sum.amount),
      pendingPayouts: toSafeNumber(pendingPayout._sum.developerRevenue),
      averageRating: toSafeNumber(approvedRating._avg.rating),
      topCategory: topCategoryGroup[0]?.category || 'N/A',
      financialValidation: validation,
    };
  } catch (error: unknown) {
    await logger.error('Failed to get developer statistics', {
      operation: 'admin_get_developer_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw new Error('Failed to get developer stats');
  }
}

export async function updateModuleStatus(
  moduleId: string,
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
  adminId?: string,
) {
  try {
    const module = await prisma.module.update({
      where: { id: moduleId },
      data: { status },
      include: {
        developer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logModuleGovernanceAudit({
      adminId: adminId || 'system',
      action: ADMIN_AUDIT_ACTIONS.MODULE_STATUS_UPDATE,
      resourceId: moduleId,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE,
      details: {
        moduleId,
        moduleName: module.name,
        before: { status: 'UNKNOWN' },
        after: { status },
      },
    });

    return module;
  } catch (error: unknown) {
    await logger.error('Failed to update module status', {
      operation: 'admin_update_module_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw new Error('Failed to update module status');
  }
}

export async function getModuleRevenue(moduleId: string): Promise<AdminModuleRevenuePayload> {
  try {
    const revenue = await prisma.moduleSubscription.aggregate({
      where: { moduleId, status: 'active' },
      _sum: { amount: true, platformRevenue: true, developerRevenue: true },
      _count: { id: true },
    });

    return {
      totalRevenue: revenue._sum.amount || 0,
      platformRevenue: revenue._sum.platformRevenue || 0,
      developerRevenue: revenue._sum.developerRevenue || 0,
      activeSubscriptions: revenue._count.id,
    };
  } catch (error: unknown) {
    await logger.error('Failed to get module revenue', {
      operation: 'admin_get_module_revenue',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw new Error('Failed to get module revenue');
  }
}

export async function exportModuleData(filters: ModuleDataFilters = {}): Promise<string> {
  try {
    const submissions = await getModuleSubmissions(filters);

    const csvHeaders = [
      'ID',
      'Module Name',
      'Developer',
      'Category',
      'Status',
      'Submitted At',
      'Reviewed At',
      'Review Notes',
      'Downloads',
      'Rating',
      'Pricing Tier',
    ];

    const csvRows = submissions.map((submission) => {
      const mod = submission.module as Record<string, unknown>;
      const submitter = submission.submitter as Record<string, unknown> | undefined;
      return [
        submission.id,
        mod.name ?? '',
        submitter?.name ?? '',
        mod.category ?? '',
        submission.status,
        submission.submittedAt,
        submission.reviewedAt || '',
        submission.reviewNotes || '',
        mod.downloads || 0,
        mod.rating || 0,
        mod.pricingTier || 'free',
      ];
    });

    return [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  } catch (error: unknown) {
    await logger.error('Failed to export module data', {
      operation: 'admin_export_module_data',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw new Error('Failed to export module data');
  }
}
