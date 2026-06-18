import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from '../admin/adminAuditTaxonomy';
import {
  createAdminAuditEntry,
  logImpersonationDeniedAudit,
  logImpersonationEndAudit,
  logImpersonationStartAudit,
  logDangerousMigrationOpDenied,
} from '../admin/adminAuditService';

describe('adminAuditService (canonical taxonomy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAdminAuditEntry writes auditLog with stringified object details', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-1' } as never);

    await createAdminAuditEntry({
      userId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
      resourceId: 'imp-1',
      details: { reason: 'support' },
      request: { ipAddress: '127.0.0.1', userAgent: 'vitest' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
        resourceId: 'imp-1',
        details: JSON.stringify({ reason: 'support' }),
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      }),
    });
  });

  it('createAdminAuditEntry logs failure without throwing', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockRejectedValue(new Error('db down'));
    vi.spyOn(logger, 'error').mockResolvedValue(undefined as never);

    await expect(
      createAdminAuditEntry({
        userId: 'admin-1',
        action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
        details: 'raw',
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to write admin audit entry',
      expect.objectContaining({ operation: 'admin_audit_create_failed' }),
    );
  });

  it('logImpersonationDeniedAudit emits ADMIN_IMPERSONATION_DENIED', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-2' } as never);
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);

    await logImpersonationDeniedAudit(
      { id: 'admin-1', email: 'admin@test.com' },
      'user-2',
      'self',
      { ipAddress: '10.0.0.1' },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_DENIED,
        resourceId: 'user-2',
        details: expect.stringContaining('self'),
      }),
    });
  });

  it('logImpersonationStartAudit includes impersonation session id', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-3' } as never);

    await logImpersonationStartAudit({
      adminUser: { id: 'admin-1', email: 'admin@test.com' },
      targetUserId: 'user-2',
      targetUserEmail: 'user@test.com',
      impersonationId: 'imp-1',
      expiresAt: new Date('2026-06-16T12:00:00Z'),
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
        adminImpersonationId: 'imp-1',
      }),
    });
  });

  it('logImpersonationEndAudit records duration', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-4' } as never);

    await logImpersonationEndAudit({
      adminUser: { id: 'admin-1', email: 'admin@test.com' },
      targetUserId: 'user-2',
      targetUserEmail: 'user@test.com',
      impersonationId: 'imp-1',
      startedAt: new Date(Date.now() - 60_000),
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_END,
        adminImpersonationId: 'imp-1',
      }),
    });
  });

  it('logDangerousMigrationOpDenied writes denied audit entry', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-5' } as never);
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);

    await logDangerousMigrationOpDenied(
      { id: 'admin-1', email: 'admin@test.com' },
      'delete_migration',
      'environment_disabled',
      ADMIN_AUDIT_ACTIONS.DANGEROUS_MIGRATION_DELETE_DENIED,
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.DANGEROUS_MIGRATION_DELETE_DENIED,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.DATABASE_MIGRATION,
      }),
    });
  });

  it('logContentModerationAudit writes ADMIN_CONTENT_MODERATION_UPDATE', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-6' } as never);
    const { logContentModerationAudit } = await import('../admin/adminAuditService');

    await logContentModerationAudit({
      adminId: 'admin-1',
      reportId: 'r-1',
      status: 'reviewed',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.CONTENT_MODERATION_UPDATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.CONTENT_REPORT,
      }),
    });
  });

  it('logModuleGovernanceAudit writes canonical module governance action', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-7' } as never);
    const { logModuleGovernanceAudit } = await import('../admin/adminAuditService');

    await logModuleGovernanceAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.MODULE_APPROVE,
      resourceId: 'sub-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE_SUBMISSION,
      details: { moduleId: 'mod-1' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.MODULE_APPROVE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE_SUBMISSION,
      }),
    });
  });

  it('logAnalyticsAudit writes ab_test resource type', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-8' } as never);
    const { logAnalyticsAudit } = await import('../admin/adminAuditService');

    await logAnalyticsAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
      resourceId: 't-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.AB_TEST,
      details: { testId: 't-1' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.AB_TEST,
      }),
    });
  });

  it('logSupportTicketAudit writes support_ticket resource type', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-9' } as never);
    const { logSupportTicketAudit } = await import('../admin/adminAuditService');

    await logSupportTicketAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
      ticketId: 'ticket-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SUPPORT_TICKET,
      details: { action: 'resolve' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SUPPORT_TICKET,
        resourceId: 'ticket-1',
      }),
    });
  });

  it('logSystemOpsAudit writes system_config resource type', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-10' } as never);
    const { logSystemOpsAudit } = await import('../admin/adminAuditService');

    await logSystemOpsAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
      resourceId: 'rate_limit',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
      details: { configKey: 'rate_limit' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
      }),
    });
  });

  it('logPerformanceAudit writes performance_alert resource type', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-11' } as never);
    const { logPerformanceAudit } = await import('../admin/adminAuditService');

    await logPerformanceAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_UPDATE,
      resourceId: 'alert-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.PERFORMANCE_ALERT,
      details: { action: 'acknowledge' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_UPDATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.PERFORMANCE_ALERT,
      }),
    });
  });
});
