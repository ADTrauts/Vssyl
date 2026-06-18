import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESOURCE_TYPES,
  isCanonicalAdminAuditAction,
  isCanonicalAdminAuditResourceType,
} from '../admin/adminAuditTaxonomy';
import {
  logAnalyticsAudit,
  logBulkModerationAudit,
  logContentModerationAudit,
  logDangerousMigrationOpDenied,
  logDangerousMigrationOpExecutedAudit,
  logImpersonationDeniedAudit,
  logImpersonationEndAudit,
  logImpersonationStartAudit,
  logModuleGovernanceAudit,
  logPerformanceAudit,
  logSecurityEventResolvedAudit,
  logSupportTicketAudit,
  logSystemOpsAudit,
} from '../admin/adminAuditService';

const ADMIN_SERVICES_DIR = join(process.cwd(), 'src/services/admin');

function listAdminServiceFiles(): string[] {
  return readdirSync(ADMIN_SERVICES_DIR)
    .filter((name) => name.endsWith('.ts') && name !== 'adminAuditService.ts')
    .map((name) => join(ADMIN_SERVICES_DIR, name));
}

describe('adminAuditTaxonomy (1B-B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-1' } as never);
  });

  it('exports canonical ADMIN_* actions and lower_snake_case resource types', () => {
    for (const action of Object.values(ADMIN_AUDIT_ACTIONS)) {
      expect(action.startsWith('ADMIN_')).toBe(true);
      expect(isCanonicalAdminAuditAction(action)).toBe(true);
    }

    for (const resourceType of Object.values(ADMIN_AUDIT_RESOURCE_TYPES)) {
      expect(resourceType).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(isCanonicalAdminAuditResourceType(resourceType)).toBe(true);
    }
  });

  it('impersonation helpers emit ADMIN_IMPERSONATION_* with expected resource types', async () => {
    await logImpersonationDeniedAudit({ id: 'admin-1', email: 'a@test.com' }, 'user-2', 'self');
    await logImpersonationStartAudit({
      adminUser: { id: 'admin-1', email: 'a@test.com' },
      targetUserId: 'user-2',
      targetUserEmail: 'u@test.com',
      impersonationId: 'imp-1',
      expiresAt: new Date(),
    });
    await logImpersonationEndAudit({
      adminUser: { id: 'admin-1', email: 'a@test.com' },
      targetUserId: 'user-2',
      targetUserEmail: 'u@test.com',
      impersonationId: 'imp-1',
      startedAt: new Date(Date.now() - 1000),
    });

    const calls = vi.mocked(prisma.auditLog.create).mock.calls.map((c) => c[0].data);
    expect(calls[0]).toMatchObject({
      action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_DENIED,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.USER,
      resourceId: 'user-2',
    });
    expect(calls[1]).toMatchObject({
      action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
      resourceId: 'imp-1',
    });
    expect(calls[2]).toMatchObject({
      action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_END,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
    });
    expect(JSON.stringify(calls)).not.toContain('USER_IMPERSONATION_');
  });

  it('domain helpers emit canonical actions and resource types', async () => {
    await logContentModerationAudit({ adminId: 'admin-1', reportId: 'r-1', status: 'reviewed' });
    await logBulkModerationAudit({ adminId: 'admin-1', action: 'dismiss', reportIds: ['r-1'] });
    await logModuleGovernanceAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.MODULE_APPROVE,
      resourceId: 'sub-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MODULE_SUBMISSION,
      details: { moduleId: 'mod-1' },
    });
    await logSecurityEventResolvedAudit({ adminId: 'admin-1', eventId: 'se-1' });
    await logAnalyticsAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
      resourceId: 't-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.AB_TEST,
      details: { testId: 't-1' },
    });
    await logSupportTicketAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
      ticketId: 'ticket-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SUPPORT_TICKET,
      details: { action: 'resolve' },
    });
    await logSystemOpsAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
      resourceId: 'rate_limit',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
      details: { configKey: 'rate_limit' },
    });
    await logPerformanceAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_CONFIGURE,
      resourceId: 'cfg-1',
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.PERFORMANCE_ALERT,
      details: { alertType: 'cpu' },
    });

    const actions = vi.mocked(prisma.auditLog.create).mock.calls.map((c) => c[0].data.action);
    expect(actions).toEqual([
      ADMIN_AUDIT_ACTIONS.CONTENT_MODERATION_UPDATE,
      ADMIN_AUDIT_ACTIONS.CONTENT_MODERATION_BULK,
      ADMIN_AUDIT_ACTIONS.MODULE_APPROVE,
      ADMIN_AUDIT_ACTIONS.SECURITY_EVENT_RESOLVE,
      ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
      ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
      ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
      ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_CONFIGURE,
    ]);
  });

  it('dangerous migration audits omit raw SQL and secrets', async () => {
    await logDangerousMigrationOpDenied(
      { id: 'admin-1', email: 'a@test.com' },
      'delete_migration',
      'environment_disabled',
      ADMIN_AUDIT_ACTIONS.DANGEROUS_MIGRATION_DELETE_DENIED,
    );
    await logDangerousMigrationOpExecutedAudit(
      { id: 'admin-1', email: 'a@test.com' },
      'delete_migration',
      ADMIN_AUDIT_ACTIONS.DANGEROUS_MIGRATION_DELETE_EXECUTED,
      { migrationName: '20260101_init', deletedCount: 1 },
    );

    const serialized = JSON.stringify(vi.mocked(prisma.auditLog.create).mock.calls);
    expect(serialized).not.toContain('DELETE FROM');
    expect(serialized).not.toContain('_prisma_migrations');
    expect(serialized).not.toContain('DATABASE_URL');
  });

  it('admin/*Service files do not call prisma.auditLog.create directly', () => {
    for (const filePath of listAdminServiceFiles()) {
      const source = readFileSync(filePath, 'utf8');
      expect(source.includes('auditLog.create')).toBe(false);
    }
  });

  it('metadata includes target identifiers where applicable', async () => {
    await logImpersonationStartAudit({
      adminUser: { id: 'admin-1', email: 'a@test.com' },
      targetUserId: 'user-2',
      targetUserEmail: 'u@test.com',
      impersonationId: 'imp-1',
      businessId: 'biz-1',
      expiresAt: new Date(),
    });

    const details = vi.mocked(prisma.auditLog.create).mock.calls[0][0].data.details as string;
    expect(details).toContain('targetUserId');
    expect(details).toContain('user-2');
    expect(details).toContain('businessId');
  });
});
