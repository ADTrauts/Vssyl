import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { SecurityService } from '../securityService';
import { logger } from '../../lib/logger';

export interface SecurityEventData {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  adminId: string;
  adminEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export interface SecurityReportFilters {
  severity?: string;
  status?: string;
  timeRange?: string;
}

export interface ListSecurityEventsFilters {
  page?: number;
  limit?: number;
  severity?: string;
  type?: string;
}

export interface ListAuditLogsFilters {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
}

function getTimeRangeInMs(timeRange: string): number {
  switch (timeRange) {
    case '1h':
      return 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function convertSecurityEventsToCSV(events: Record<string, unknown>[]): string {
  const csvRows = ['Event ID,Event Type,Severity,User Email,IP Address,Timestamp,Resolved'];
  events.forEach((event) => {
    csvRows.push(
      `${event.id},${event.eventType},${event.severity},${event.userEmail || ''},${event.ipAddress || ''},${event.timestamp},${event.resolved}`,
    );
  });
  return csvRows.join('\n');
}

export async function listSecurityEventsPaginated(filters: ListSecurityEventsFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.severity) where.severity = filters.severity;
  if (filters.type) where.eventType = filters.type;

  const [events, total] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
    }),
    prisma.securityEvent.count({ where }),
  ]);

  return { events, total, page, totalPages: Math.ceil(total / limit) };
}

export async function listAdminAuditLogsPaginated(filters: ListAuditLogsFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.adminId) where.adminId = filters.adminId;
  if (filters.action) where.action = filters.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getSecurityEvents(params: {
  page?: number;
  limit?: number;
  severity?: string;
  type?: string;
  resolved?: boolean;
  timeRange?: string;
}) {
  return SecurityService.getSecurityEvents(params);
}

export async function getAuditLogs(params: ListAuditLogsFilters) {
  return listAdminAuditLogsPaginated(params);
}

export async function getSecurityMetrics() {
  return SecurityService.getSecurityMetrics();
}

export async function getComplianceStatus() {
  return SecurityService.getComplianceStatus();
}

export async function resolveSecurityEvent(eventId: string, adminId: string) {
  return SecurityService.resolveSecurityEvent(eventId, adminId);
}

export async function exportSecurityReport(filters: SecurityReportFilters, format: string) {
  const events = await prisma.securityEvent.findMany({
    where: {
      ...(filters.severity && filters.severity !== 'all' ? { severity: filters.severity } : {}),
      ...(filters.status && filters.status !== 'all'
        ? { resolved: filters.status === 'resolved' }
        : {}),
      ...(filters.timeRange
        ? {
            timestamp: {
              gte: new Date(Date.now() - getTimeRangeInMs(filters.timeRange)),
            },
          }
        : {}),
    },
    orderBy: { timestamp: 'desc' },
  });

  if (format === 'csv') {
    return convertSecurityEventsToCSV(events as Record<string, unknown>[]);
  }
  return JSON.stringify(events, null, 2);
}

export async function logSecurityEvent(eventData: SecurityEventData) {
  return prisma.securityEvent.create({
    data: {
      eventType: eventData.eventType,
      severity: eventData.severity,
      userId: eventData.userId,
      userEmail: eventData.userEmail,
      adminId: eventData.adminId,
      adminEmail: eventData.adminEmail,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      details: eventData.details as Prisma.InputJsonValue,
    },
  });
}

export async function getAdminSecurityModuleMetrics() {
  const totalModules = await prisma.module.count();
  const approvedModules = await prisma.module.count({
    where: { status: 'APPROVED' },
  });

  return {
    totalModules,
    monitoredModules: approvedModules,
    securityViolations: Math.floor(Math.random() * 10),
    criticalAlerts: Math.floor(Math.random() * 3),
    complianceScore: Math.floor(Math.random() * 20) + 80,
    threatLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
  };
}

export async function listApprovedModulesForMonitoring() {
  return prisma.module.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function getModuleForSecurityOperation(moduleId: string) {
  return prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      developer: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
