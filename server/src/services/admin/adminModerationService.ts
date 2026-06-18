import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AuditRequestContext } from './adminAuditService';
import { logContentModerationAudit, logBulkModerationAudit } from './adminAuditService';
import { logSecurityEvent } from './adminSecurityService';

export interface ContentReportFilters {
  status?: string;
  severity?: string;
  contentType?: string;
  page?: number;
  limit?: number;
}

export interface ListReportedContentPaginatedFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export async function listReportedContentPaginated(filters: ListReportedContentPaginatedFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.contentType = filters.type;

  const [reports, total] = await Promise.all([
    prisma.contentReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { email: true, name: true },
        },
      },
    }),
    prisma.contentReport.count({ where }),
  ]);

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function patchContentReport(params: {
  reportId: string;
  adminId: string;
  status: string;
  action?: string;
  reason?: string;
  adminNotes?: string;
  request?: AuditRequestContext;
}) {
  const data: Prisma.ContentReportUpdateInput = {
    status: params.status,
    reviewedBy: params.adminId,
    reviewedAt: new Date(),
  };

  if (params.action && params.action.length > 0) {
    data.action = params.action;
  }

  if (params.adminNotes && params.adminNotes.length > 0) {
    data.details = params.adminNotes;
  } else if (params.reason && params.reason.length > 0) {
    data.details = params.reason;
  }

  const report = await prisma.contentReport.update({
    where: { id: params.reportId },
    data,
  });

  await logger.info('Admin updated content report', {
    operation: 'admin_update_report',
    adminId: params.adminId,
    reportId: params.reportId,
    status: params.status,
    action: params.action,
    reason: params.reason || 'No reason provided',
  });

  await logContentModerationAudit({
    adminId: params.adminId,
    reportId: params.reportId,
    status: params.status,
    action: params.action,
    reason: params.reason ?? params.adminNotes,
    request: params.request,
  });

  return { success: true as const, data: { report } };
}

export async function getReportedContent(filters: ContentReportFilters) {
  const whereClause: Record<string, unknown> = {};

  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status;
  }
  if (filters.severity && filters.severity !== 'all') {
    whereClause.severity = filters.severity;
  }
  if (filters.contentType && filters.contentType !== 'all') {
    whereClause.contentType = filters.contentType;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const total = await prisma.contentReport.count({ where: whereClause });

  const reports = await prisma.contentReport.findMany({
    where: whereClause,
    include: {
      reporter: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const transformedReports = reports.map((report) => ({
    id: report.id,
    contentType: report.contentType,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    reviewedBy: report.reviewedBy,
    reviewedAt: report.reviewedAt?.toISOString(),
    action: report.action,
    reporter: {
      email: report.reporter.email,
      name: report.reporter.name || 'Unknown User',
    },
    content: {
      id: report.contentId,
      title: 'No title',
      description: 'No description',
      url: '#',
    },
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    autoModerated: false,
  }));

  return {
    reports: transformedReports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  action: string,
  reason: string,
  adminId: string,
) {
  const updatedReport = await prisma.contentReport.update({
    where: { id: reportId },
    data: {
      status,
      action,
      details: reason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  await logSecurityEvent({
    eventType: 'content_moderated',
    severity: 'medium',
    adminId,
    details: {
      reportId,
      status,
      action,
      reason,
      timestamp: new Date().toISOString(),
    },
  });

  await logContentModerationAudit({
    adminId,
    reportId,
    status,
    action,
    reason,
  });

  return {
    success: true,
    reportId,
    status,
    action,
    updatedAt: new Date().toISOString(),
    report: updatedReport,
  };
}

export async function createContentReport(data: {
  reporterId: string;
  contentId: string;
  contentType: string;
  reason: string;
  severity?: string;
  contentTitle?: string;
  contentDescription?: string;
  contentUrl?: string;
}) {
  return prisma.contentReport.create({
    data: {
      reporterId: data.reporterId,
      contentId: data.contentId,
      contentType: data.contentType,
      reason: data.reason,
      status: 'pending',
    },
    include: {
      reporter: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

export async function getModerationStats() {
  try {
    const [totalReports, pendingReports, autoModeratedReports, resolvedReports] = await Promise.all([
      prisma.contentReport.count().catch(() => 0),
      prisma.contentReport.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.contentReport.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.contentReport.count({ where: { status: 'resolved' } }).catch(() => 0),
    ]);

    return {
      totalReports,
      pendingReview: pendingReports,
      autoModerated: autoModeratedReports,
      resolved: resolvedReports,
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to get moderation statistics', {
      operation: 'admin_get_moderation_stats',
      error: { message: err.message, stack: err.stack },
    });
    return {
      totalReports: 0,
      pendingReview: 0,
      autoModerated: 0,
      resolved: 0,
    };
  }
}

export async function getModerationRules() {
  return [
    {
      id: '1',
      name: 'Spam Detection',
      description: 'Automatically flag content containing spam keywords',
      conditions: ['Contains spam keywords', 'Multiple links', 'Repetitive content'],
      actions: ['Flag for review', 'Send warning'],
      enabled: true,
      priority: 1,
    },
    {
      id: '2',
      name: 'Inappropriate Content',
      description: 'Detect and flag inappropriate or offensive content',
      conditions: ['Contains profanity', 'Hate speech', 'Violent content'],
      actions: ['Remove content', 'Ban user', 'Send warning'],
      enabled: true,
      priority: 2,
    },
  ];
}

export async function bulkModerationAction(reportIds: string[], action: string, adminId: string) {
  const results = [];
  for (const reportId of reportIds) {
    const result = await updateReportStatus(reportId, 'resolved', action, 'Bulk action', adminId);
    results.push(result);
  }

  await logSecurityEvent({
    eventType: 'bulk_moderation_action',
    severity: 'medium',
    adminId,
    details: { action, reportIds, count: reportIds.length },
  });

  await logBulkModerationAudit({ adminId, action, reportIds });

  return { success: true, processed: reportIds.length, results };
}
