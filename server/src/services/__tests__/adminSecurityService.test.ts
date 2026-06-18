import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { SecurityService } from '../securityService';
import {
  exportSecurityReport,
  getComplianceStatus,
  getSecurityMetrics,
  listAdminAuditLogsPaginated,
  listSecurityEventsPaginated,
  logSecurityEvent,
} from '../admin/adminSecurityService';

vi.mock('../securityService', () => ({
  SecurityService: {
    getSecurityMetrics: vi.fn().mockResolvedValue({ score: 90 }),
    getComplianceStatus: vi.fn().mockResolvedValue({ gdpr: true }),
    resolveSecurityEvent: vi.fn().mockResolvedValue({ success: true }),
    getSecurityEvents: vi.fn().mockResolvedValue({ events: [] }),
  },
}));

describe('adminSecurityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listSecurityEventsPaginated applies filters', async () => {
    vi.spyOn(prisma.securityEvent, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.securityEvent, 'count').mockResolvedValue(2);

    const result = await listSecurityEventsPaginated({
      page: 1,
      limit: 20,
      severity: 'high',
      type: 'login_failed',
    });

    expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { severity: 'high', eventType: 'login_failed' },
      }),
    );
    expect(result.total).toBe(2);
  });

  it('listAdminAuditLogsPaginated returns paginated logs', async () => {
    vi.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.auditLog, 'count').mockResolvedValue(4);

    const result = await listAdminAuditLogsPaginated({ page: 1, limit: 10, action: 'ADMIN_MODULE_APPROVE' });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { action: 'ADMIN_MODULE_APPROVE' } }),
    );
    expect(result.totalPages).toBe(1);
  });

  it('getSecurityMetrics delegates to SecurityService', async () => {
    const metrics = await getSecurityMetrics();
    expect(SecurityService.getSecurityMetrics).toHaveBeenCalled();
    expect(metrics).toEqual({ score: 90 });
  });

  it('getComplianceStatus delegates to SecurityService', async () => {
    const status = await getComplianceStatus();
    expect(SecurityService.getComplianceStatus).toHaveBeenCalled();
    expect(status).toEqual({ gdpr: true });
  });

  it('exportSecurityReport returns JSON by default', async () => {
    vi.spyOn(prisma.securityEvent, 'findMany').mockResolvedValue([
      { id: 'e1', eventType: 'test', severity: 'low', timestamp: new Date(), resolved: false },
    ] as never);

    const payload = await exportSecurityReport({}, 'json');
    expect(payload).toContain('e1');
  });

  it('logSecurityEvent writes security event row', async () => {
    vi.spyOn(prisma.securityEvent, 'create').mockResolvedValue({ id: 'se-1' } as never);

    await logSecurityEvent({
      eventType: 'content_moderated',
      severity: 'medium',
      adminId: 'admin-1',
      details: { reportId: 'r-1' },
    });

    expect(prisma.securityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'content_moderated', adminId: 'admin-1' }),
      }),
    );
  });
});
