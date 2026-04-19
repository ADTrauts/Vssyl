import type { Request, Response } from 'express';
import type express from 'express';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { authenticateJWT } from '../../middleware/auth';
import { AdminService } from '../../services/adminService';
import { logger } from '../../lib/logger';
import { requireAdmin, ALLOWED_CONTENT_REPORT_STATUSES } from './adminPortalShared';

export function registerAdminPortalCoreRoutes(router: express.Router): void {
router.get('/test', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    res.json({ 
      message: 'Admin authentication working!',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    await logger.error('Admin test endpoint failed', {
      operation: 'admin_test',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================

// Get dashboard overview statistics
router.get('/dashboard/stats', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersLast30Days,
      usersPrevious30Days,
      totalBusinesses,
      businessesLast30Days,
      businessesPrevious30Days,
      monthlyRevenue,
      revenueLast30Days,
      revenuePrevious30Days
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }).catch(() => 0),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }).catch(() => 0),
      prisma.business.count().catch(() => 0),
      prisma.business.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }).catch(() => 0),
      prisma.business.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }).catch(() => 0),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: { status: 'active' }
      }).catch(() => ({ _sum: { amount: null } })),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: {
          status: 'active',
          createdAt: { gte: thirtyDaysAgo }
        }
      }).catch(() => ({ _sum: { amount: null } })),
      prisma.moduleSubscription.aggregate({
        _sum: { amount: true },
        where: {
          status: 'active',
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }).catch(() => ({ _sum: { amount: null } }))
    ]);

    // Calculate growth trends (percentage change)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userGrowthTrend = calculateTrend(usersLast30Days, usersPrevious30Days);
    const businessGrowthTrend = calculateTrend(businessesLast30Days, businessesPrevious30Days);
    const revenueGrowthTrend = calculateTrend(
      revenueLast30Days._sum.amount || 0,
      revenuePrevious30Days._sum.amount || 0
    );

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        activeUsers: totalUsers, // Since we don't have status field, assume all are active
        totalBusinesses: totalBusinesses,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        systemHealth: 99.9, // Mock value for now
        userGrowthTrend: userGrowthTrend,
        businessGrowthTrend: businessGrowthTrend,
        revenueGrowthTrend: revenueGrowthTrend
      }
    });
  } catch (error) {
    await logger.error('Failed to fetch dashboard statistics', {
      operation: 'admin_dashboard_stats',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity
router.get('/dashboard/activity', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    await logger.error('Failed to fetch recent activity', {
      operation: 'admin_recent_activity',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ============================================================================
// USER IMPERSONATION
// ============================================================================

// Start impersonating a user
router.post('/users/:userId/impersonate', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, businessId, context, expiresInMinutes } = req.body as {
      reason?: string;
      businessId?: string | null;
      context?: string | null;
      expiresInMinutes?: number;
    };
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if admin is already impersonating someone
    const existingImpersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId: adminUser.id,
        endedAt: null
      }
    });

    if (existingImpersonation) {
      return res.status(400).json({ error: 'Admin is already impersonating a user' });
    }

    const impersonationToken = crypto.randomBytes(32).toString('hex');
    const impersonationTokenHash = crypto.createHash('sha256').update(impersonationToken).digest('hex');
    const expiresAt = typeof expiresInMinutes === 'number' && expiresInMinutes > 0
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000); // default 1 hour

    const { impersonation, targetUser: verifiedTarget } = await AdminService.startImpersonation(
      adminUser.id,
      userId,
      {
        reason,
        businessId: businessId ?? null,
        context: context ?? null,
        sessionTokenHash: impersonationTokenHash,
        expiresAt
      }
    );

    let businessSummary: { id: string; name: string } | null = null;
    if (impersonation.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: impersonation.businessId },
        select: { id: true, name: true }
      });
      if (business) {
        businessSummary = business;
      }
    }

    // Log the impersonation action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_IMPERSONATION_START',
        resourceType: 'user',
        resourceId: userId,
        details: JSON.stringify({
          adminEmail: adminUser.email,
          targetUserEmail: targetUser.email,
          reason: reason || 'Admin impersonation for debugging/support',
          businessId: businessId ?? null,
          context: context ?? null,
          expiresAt: expiresAt.toISOString()
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Impersonation started successfully',
      impersonation: {
        id: impersonation.id,
        targetUser: {
          id: verifiedTarget.id,
          email: verifiedTarget.email,
          name: verifiedTarget.name
        },
        startedAt: impersonation.startedAt,
        reason: impersonation.reason,
        businessId: impersonation.businessId,
        business: businessSummary,
        context: impersonation.context,
        expiresAt
      },
      token: impersonationToken
    });
  } catch (error) {
    await logger.error('Failed to start user impersonation', {
      operation: 'admin_impersonate_start',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

// End impersonation session
router.post('/impersonation/end', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find active impersonation session
    const impersonation = await prisma.adminImpersonation.findFirst({
      where: {
        adminId: adminUser.id,
        endedAt: null
      },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true }
        },
        business: {
          select: { id: true, name: true }
        }
      }
    });

    if (!impersonation) {
      return res.status(404).json({ error: 'No active impersonation session found' });
    }

    // End the impersonation session
    await prisma.adminImpersonation.update({
      where: { id: impersonation.id },
      data: { endedAt: new Date() }
    });

    // Log the end of impersonation
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_IMPERSONATION_END',
        resourceType: 'user',
        resourceId: impersonation.targetUserId,
        details: JSON.stringify({
          adminEmail: adminUser.email,
          targetUserEmail: impersonation.targetUser.email,
          duration: Date.now() - impersonation.startedAt.getTime()
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Impersonation ended successfully',
      impersonation: {
        id: impersonation.id,
        targetUser: impersonation.targetUser,
        startedAt: impersonation.startedAt,
        endedAt: new Date(),
        duration: Date.now() - impersonation.startedAt.getTime()
      }
    });
  } catch (error) {
    await logger.error('Failed to end user impersonation', {
      operation: 'admin_impersonate_end',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to end impersonation' });
  }
});

// Get current impersonation session
router.get('/impersonation/current', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use query timeout to prevent hanging requests (10 second timeout)
    const impersonation = await Promise.race([
      prisma.adminImpersonation.findFirst({
        where: {
          adminId: adminUser.id,
          endedAt: null
        },
        include: {
          targetUser: {
            select: { id: true, email: true, name: true }
          },
          business: {
            select: { id: true, name: true }
          }
        }
      }),
      new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Database query timeout after 10 seconds'));
        }, 10000);
      })
    ]);

    if (!impersonation) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      impersonation: {
        id: impersonation.id,
        targetUser: impersonation.targetUser,
        startedAt: impersonation.startedAt,
        reason: impersonation.reason,
        businessId: impersonation.businessId,
        business: impersonation.business,
        context: impersonation.context,
        expiresAt: impersonation.expiresAt,
        duration: Date.now() - impersonation.startedAt.getTime()
      }
    });
  } catch (error) {
    await logger.error('Failed to get current impersonation session', {
      operation: 'admin_impersonate_get_current',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get current impersonation' });
  }
});

router.get('/impersonation/businesses', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const take = Math.min(Number(limit) || 12, 50);
    const skip = (Number(page) - 1) * take;

    const where: Record<string, unknown> = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          tier: true,
          industry: true,
          size: true,
          createdAt: true,
          hrModuleSettings: {
            select: { enabledFeatures: true }
          },
          _count: {
            select: {
              members: true,
              employeePositions: true,
              businessModuleInstallations: true
            }
          }
        }
      }),
      prisma.business.count({ where })
    ]);

    const payload = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      tier: business.tier,
      industry: business.industry,
      size: business.size,
      createdAt: business.createdAt,
      memberCount: business._count.members,
      employeePositionCount: business._count.employeePositions,
      moduleCount: business._count.businessModuleInstallations,
      hrEnabledFeatures: business.hrModuleSettings?.enabledFeatures ?? null
    }));

    res.json({
      businesses: payload,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    await logger.error('Failed to fetch impersonation business list', {
      operation: 'admin_impersonate_list_businesses',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to load businesses' });
  }
});

router.get('/impersonation/businesses/:businessId/members', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        tier: true,
        industry: true,
        size: true,
        createdAt: true,
        hrModuleSettings: {
          select: { enabledFeatures: true }
        }
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const [members, moduleInstallations] = await Promise.all([
      prisma.businessMember.findMany({
        where: { businessId },
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.businessModuleInstallation.findMany({
        where: { businessId },
        orderBy: { installedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          moduleId: true,
          installedAt: true,
          enabled: true,
          module: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      })
    ]);

    const membersPayload = members.map((member) => ({
      id: member.id,
      role: member.role,
      title: member.title ?? member.job?.title ?? null,
      department: member.department,
      joinedAt: member.joinedAt,
      canManage: member.canManage,
      canInvite: member.canInvite,
      canBilling: member.canBilling,
      user: member.user
    }));

    const modulesPayload = moduleInstallations.map((installation) => ({
      id: installation.id,
      moduleId: installation.moduleId,
      moduleName: installation.module?.name ?? 'Unknown Module',
      category: installation.module?.category ?? null,
      installedAt: installation.installedAt,
      enabled: installation.enabled
    }));

    res.json({
      business,
      members: membersPayload,
      modules: modulesPayload,
      totalMembers: members.length
    });
  } catch (error) {
    await logger.error('Failed to fetch impersonation business members', {
      operation: 'admin_impersonate_business_members',
      businessId: req.params.businessId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to load business members' });
  }
});

router.post('/impersonation/businesses/:businessId/seed', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const IMPERSONATION_DEPARTMENT = 'Impersonation Lab Personas';
    const managerTier = await prisma.organizationalTier.upsert({
      where: {
        businessId_name: {
          businessId,
          name: 'Impersonation Lab - Management'
        }
      },
      update: {
        description: 'Management tier generated for Impersonation Lab personas',
        level: 2
      },
      create: {
        businessId,
        name: 'Impersonation Lab - Management',
        level: 2,
        description: 'Management tier generated for Impersonation Lab personas'
      }
    });

    const staffTier = await prisma.organizationalTier.upsert({
      where: {
        businessId_name: {
          businessId,
          name: 'Impersonation Lab - Staff'
        }
      },
      update: {
        description: 'Staff tier generated for Impersonation Lab personas',
        level: 3
      },
      create: {
        businessId,
        name: 'Impersonation Lab - Staff',
        level: 3,
        description: 'Staff tier generated for Impersonation Lab personas'
      }
    });

    const managerPosition = await prisma.position.upsert({
      where: {
        businessId_title: {
          businessId,
          title: 'Impersonation Lab - Manager'
        }
      },
      update: {
        tierId: managerTier.id,
        reportsToId: null,
        maxOccupants: 5
      },
      create: {
        businessId,
        title: 'Impersonation Lab - Manager',
        tierId: managerTier.id,
        reportsToId: null,
        maxOccupants: 5,
        departmentId: null
      }
    });

    const staffPosition = await prisma.position.upsert({
      where: {
        businessId_title: {
          businessId,
          title: 'Impersonation Lab - Specialist'
        }
      },
      update: {
        tierId: staffTier.id,
        reportsToId: managerPosition.id,
        maxOccupants: 10
      },
      create: {
        businessId,
        title: 'Impersonation Lab - Specialist',
        tierId: staffTier.id,
        reportsToId: managerPosition.id,
        maxOccupants: 10,
        departmentId: null
      }
    });

    const existingMembers = await prisma.businessMember.findMany({
      where: {
        businessId,
        department: IMPERSONATION_DEPARTMENT
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const ensureAssignment = async (userId: string, positionId: string) => {
      let assignment = await prisma.employeePosition.findFirst({
        where: {
          userId,
          positionId,
          businessId
        }
      });

      if (!assignment) {
        assignment = await prisma.employeePosition.create({
          data: {
            userId,
            positionId,
            businessId,
            assignedById: adminUser.id,
            startDate: new Date(),
            active: true
          }
        });
      } else if (!assignment.active) {
        assignment = await prisma.employeePosition.update({
          where: { id: assignment.id },
          data: {
            active: true,
            endDate: null
          }
        });
      }

      return assignment;
    };

    const ensureHrProfile = async (employeePositionId: string, employmentStatus: 'ACTIVE' | 'TERMINATED' = 'ACTIVE') => {
      return prisma.employeeHRProfile.upsert({
        where: { employeePositionId },
        create: {
          employeePositionId,
          businessId,
          hireDate: new Date(),
          employmentStatus,
          employeeType: 'FULL_TIME'
        },
        update: {
          employmentStatus,
          terminationDate: null,
          terminationReason: null,
          terminatedBy: null,
          deletedAt: null,
          deletedBy: null,
          deletedReason: null
        }
      });
    };

    const createPersonaUser = async (label: string, displayName: string) => {
      const email = `${label}-${businessId.slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}@impersonation.vssyl`;
      const temporaryPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          password: hashedPassword,
          role: 'USER'
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      return { user, temporaryPassword };
    };

    const personas: Array<{
      role: 'MANAGER' | 'EMPLOYEE';
      userId: string;
      email: string;
      name: string | null;
      businessMemberId: string;
      employeePositionId: string | null;
      hrProfileId: string | null;
      temporaryPassword?: string;
    }> = [];

    const managerMemberExisting = existingMembers.find((member) => member.role === 'MANAGER');

    let managerMember = managerMemberExisting ?? null;
    let managerUser = managerMemberExisting?.user ?? null;
    let managerTempPassword: string | undefined;

    if (!managerMember) {
      const managerDisplayName = `Impersonation Manager (${business.name})`;
      const { user, temporaryPassword } = await createPersonaUser('manager', managerDisplayName);
      managerTempPassword = temporaryPassword;
      managerUser = user;

      managerMember = await prisma.businessMember.create({
        data: {
          businessId,
          userId: user.id,
          role: 'MANAGER',
          title: 'Impersonation Lab Manager',
          department: IMPERSONATION_DEPARTMENT,
          canManage: true,
          canInvite: true,
          canBilling: false
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
    }

    const managerAssignment = await ensureAssignment(managerUser!.id, managerPosition.id);
    const managerHrProfile = await ensureHrProfile(managerAssignment.id);

    personas.push({
      role: 'MANAGER',
      userId: managerUser!.id,
      email: managerUser!.email,
      name: managerUser!.name,
      businessMemberId: managerMember!.id,
      employeePositionId: managerAssignment.id,
      hrProfileId: managerHrProfile.id,
      temporaryPassword: managerTempPassword
    });

    const employeeMemberExisting = existingMembers.find((member) => member.role === 'EMPLOYEE');

    let employeeMember = employeeMemberExisting ?? null;
    let employeeUser = employeeMemberExisting?.user ?? null;
    let employeeTempPassword: string | undefined;

    if (!employeeMember) {
      const employeeDisplayName = `Impersonation Specialist (${business.name})`;
      const { user, temporaryPassword } = await createPersonaUser('specialist', employeeDisplayName);
      employeeTempPassword = temporaryPassword;
      employeeUser = user;

      employeeMember = await prisma.businessMember.create({
        data: {
          businessId,
          userId: user.id,
          role: 'EMPLOYEE',
          title: 'Impersonation Lab Specialist',
          department: IMPERSONATION_DEPARTMENT,
          canManage: false,
          canInvite: false,
          canBilling: false
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
    }

    const employeeAssignment = await ensureAssignment(employeeUser!.id, staffPosition.id);
    const employeeHrProfile = await ensureHrProfile(employeeAssignment.id);

    const existingApproval = await prisma.managerApprovalHierarchy.findFirst({
      where: {
        businessId,
        employeePositionId: employeeAssignment.id,
        managerPositionId: managerAssignment.id
      }
    });

    if (!existingApproval) {
      await prisma.managerApprovalHierarchy.create({
        data: {
          businessId,
          employeePositionId: employeeAssignment.id,
          managerPositionId: managerAssignment.id,
          approvalTypes: ['time_off'],
          approvalLevel: 1,
          isPrimary: true
        }
      });
    } else if (!existingApproval.approvalTypes.includes('time_off')) {
      await prisma.managerApprovalHierarchy.update({
        where: { id: existingApproval.id },
        data: {
          approvalTypes: [...new Set([...existingApproval.approvalTypes, 'time_off'])]
        }
      });
    }

    personas.push({
      role: 'EMPLOYEE',
      userId: employeeUser!.id,
      email: employeeUser!.email,
      name: employeeUser!.name,
      businessMemberId: employeeMember!.id,
      employeePositionId: employeeAssignment.id,
      hrProfileId: employeeHrProfile.id,
      temporaryPassword: employeeTempPassword
    });

    res.json({
      message: 'Impersonation lab personas are ready.',
      personas
    });
  } catch (error) {
    await logger.error('Failed to seed impersonation personas', {
      operation: 'admin_impersonate_seed_personas',
      businessId: req.params.businessId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to seed impersonation personas' });
  }
});

// Get impersonation history for admin
router.get('/impersonation/history', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [impersonations, total] = await Promise.all([
      prisma.adminImpersonation.findMany({
        where: { adminId: adminUser.id },
        skip,
        take: Number(limit),
        orderBy: { startedAt: 'desc' },
        include: {
          targetUser: {
            select: { id: true, email: true, name: true }
          },
          business: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.adminImpersonation.count({ where: { adminId: adminUser.id } })
    ]);

    res.json({
      impersonations,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to get impersonation history', {
      operation: 'admin_impersonate_history',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to get impersonation history' });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users with pagination and filtering
router.get('/users', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { userNumber: { contains: search as string } }
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          userNumber: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          _count: {
            select: {
              businesses: true,
              files: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch users list', {
      operation: 'admin_get_users',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    await logger.error('Failed to fetch user details', {
      operation: 'admin_get_user_details',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user status (ban, suspend, activate)
router.patch('/users/:userId/status', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Note: User model doesn't have a status field, so we'll just log the action
    await logger.info('Admin attempted to update user status', {
      operation: 'admin_update_user_status',
      adminId: adminUser.id,
      userId,
      status,
      reason: reason || 'No reason provided'
    });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    await logger.error('Failed to update user status', {
      operation: 'admin_update_user_status',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password
router.post('/users/:userId/reset-password', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // In a real implementation, you would hash the password and send it via email
    // For now, we'll just log the action
    await logger.logSecurityEvent('password_reset_initiated', 'medium', {
      operation: 'admin_reset_user_password',
      adminId: adminUser.id,
      userId
    });

    res.json({ message: 'Password reset initiated' });
  } catch (error) {
    await logger.error('Failed to reset user password', {
      operation: 'admin_reset_user_password',
      userId: req.params.userId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// ============================================================================
// CONTENT MODERATION
// ============================================================================

// Get reported content
router.get('/moderation/reported', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.contentType = type;

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { email: true, name: true }
          }
        }
      }),
      prisma.contentReport.count({ where })
    ]);

    res.json({
      reports,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    await logger.error('Failed to fetch reported content', {
      operation: 'admin_get_reported_content_paginated',
      filters: req.query,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

// Update report status
router.patch('/moderation/reports/:reportId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, action, reason, adminNotes } = req.body as {
      status?: unknown;
      action?: unknown;
      reason?: unknown;
      adminNotes?: unknown;
    };
    const adminUser = req.user;

    if (!adminUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof status !== 'string' || !ALLOWED_CONTENT_REPORT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid or missing status' });
    }

    const data: Prisma.ContentReportUpdateInput = {
      status,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    };

    if (typeof action === 'string' && action.length > 0) {
      data.action = action;
    }

    if (typeof adminNotes === 'string' && adminNotes.length > 0) {
      data.details = adminNotes;
    } else if (typeof reason === 'string' && reason.length > 0) {
      data.details = reason;
    }

    const report = await prisma.contentReport.update({
      where: { id: reportId },
      data,
    });

    await logger.info('Admin updated content report', {
      operation: 'admin_update_report',
      adminId: adminUser.id,
      reportId,
      status,
      action,
      reason: reason || 'No reason provided'
    });

    res.json({ success: true, data: { report } });
  } catch (error) {
    await logger.error('Failed to update content report', {
      operation: 'admin_update_report',
      reportId: req.params.reportId,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ error: 'Failed to update report' });
  }
});

}
