import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import * as adminSecurityService from '../admin/adminSecurityService';
import {
  bulkModerationAction,
  getModerationStats,
  listReportedContentPaginated,
  patchContentReport,
  updateReportStatus,
} from '../admin/adminModerationService';

describe('adminModerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listReportedContentPaginated scopes by status and type', async () => {
    vi.spyOn(prisma.contentReport, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.contentReport, 'count').mockResolvedValue(5);

    const result = await listReportedContentPaginated({
      page: 1,
      limit: 10,
      status: 'pending',
      type: 'message',
    });

    expect(prisma.contentReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'pending', contentType: 'message' },
        take: 10,
      }),
    );
    expect(result.total).toBe(5);
  });

  it('patchContentReport updates report and emits audit', async () => {
    vi.spyOn(prisma.contentReport, 'update').mockResolvedValue({ id: 'r-1', status: 'reviewed' } as never);
    vi.spyOn(adminAuditService, 'logContentModerationAudit').mockResolvedValue(undefined);

    const result = await patchContentReport({
      reportId: 'r-1',
      adminId: 'admin-1',
      status: 'reviewed',
      adminNotes: 'ok',
    });

    expect(result.success).toBe(true);
    expect(adminAuditService.logContentModerationAudit).toHaveBeenCalled();
  });

  it('updateReportStatus logs security event and moderation audit', async () => {
    vi.spyOn(prisma.contentReport, 'update').mockResolvedValue({ id: 'r-1' } as never);
    vi.spyOn(adminSecurityService, 'logSecurityEvent').mockResolvedValue({ id: 'se-1' } as never);
    vi.spyOn(adminAuditService, 'logContentModerationAudit').mockResolvedValue(undefined);

    await updateReportStatus('r-1', 'resolved', 'remove', 'spam', 'admin-1');

    expect(adminSecurityService.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'content_moderated', adminId: 'admin-1' }),
    );
    expect(adminAuditService.logContentModerationAudit).toHaveBeenCalled();
  });

  it('getModerationStats returns counts', async () => {
    vi.spyOn(prisma.contentReport, 'count').mockResolvedValue(3);

    const stats = await getModerationStats();

    expect(stats.totalReports).toBe(3);
    expect(stats.pendingReview).toBe(3);
  });

  it('bulkModerationAction processes reports and audits bulk action', async () => {
    vi.spyOn(prisma.contentReport, 'update').mockResolvedValue({ id: 'r-1' } as never);
    vi.spyOn(adminSecurityService, 'logSecurityEvent').mockResolvedValue({ id: 'se-1' } as never);
    vi.spyOn(adminAuditService, 'logContentModerationAudit').mockResolvedValue(undefined);
    vi.spyOn(adminAuditService, 'logBulkModerationAudit').mockResolvedValue(undefined);

    const result = await bulkModerationAction(['r-1'], 'dismiss', 'admin-1');

    expect(result.processed).toBe(1);
    expect(adminAuditService.logBulkModerationAudit).toHaveBeenCalled();
  });
});
