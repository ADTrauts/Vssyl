import os from 'os';
import { logger } from '../../lib/logger';
import type {
  AdminOptimizationRecommendationMutation,
  AdminPerformanceAlertConfigureResult,
  AdminPerformanceAlertMutation,
  AdminPerformanceAnalyticsPayload,
  AdminPerformanceMetricsPayload,
  AdminScalabilityMetricsPayload,
} from './adminServiceContracts';
import { logPerformanceAudit } from './adminAuditService';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from './adminAuditTaxonomy';
import { getSystemHealth } from './adminSystemOpsService';

export interface PerformanceAlertFilters {
  severity?: string;
  status?: string;
  type?: string;
}

export interface PerformanceAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  severity: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface OptimizationRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  estimatedSavings: number;
  priority: number;
  status: string;
}

function isAvailableMetrics(
  metrics: AdminPerformanceMetricsPayload,
): metrics is AdminPerformanceMetricsPayload & {
  status: 'available';
  cpu?: { usage?: number | null };
  memory?: { used?: number; total?: number };
  application?: { responseTime?: number | null; throughput?: number | null; errorRate?: number | null; activeUsers?: number | null };
  database?: { connections?: number | null; cacheHitRate?: number | null };
} {
  return metrics.status === 'available';
}

export async function getPerformanceMetrics(
  filters: Record<string, unknown> = {},
): Promise<AdminPerformanceMetricsPayload> {
  try {
    void filters;
    const health = await getSystemHealth();
    if (health.status === 'unavailable') {
      return {
        status: 'unavailable',
        message: 'Performance metrics are not available',
      };
    }

    const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
    const usedMemMb = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);

    return {
      status: 'available',
      collectedAt: health.timestamp,
      cpu: {
        usage: health.cpu,
        cores: os.cpus().length,
        temperature: null,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemMb,
        used: usedMemMb,
        available: Math.max(0, totalMemMb - usedMemMb),
        swapUsed: null,
        swapTotal: null,
      },
      disk: {
        total: null,
        used: null,
        available: null,
        usagePercent: health.disk,
        iops: null,
        latency: null,
      },
      network: {
        bytesIn: null,
        bytesOut: null,
        packetsIn: null,
        packetsOut: null,
        connections: health.activeConnections,
        usage: health.network,
      },
      database: {
        status: 'unavailable',
        connections: null,
        queries: null,
        slowQueries: null,
        cacheHitRate: null,
        avgResponseTime: null,
      },
      application: {
        responseTime: health.responseTime,
        throughput: null,
        errorRate: health.errorRate,
        activeUsers: null,
        requestsPerSecond: null,
      },
    };
  } catch (error: unknown) {
    await logger.error('Failed to get performance metrics', {
      operation: 'admin_get_performance_metrics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return {
      status: 'unavailable',
      message: 'Performance metrics are not available',
    };
  }
}

export async function getScalabilityMetrics(): Promise<AdminScalabilityMetricsPayload> {
  return {
    status: 'unavailable',
    message: 'Scalability metrics are not configured for this environment',
  };
}

export async function getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
  return [
    {
      id: '1',
      type: 'performance',
      title: 'Optimize Database Queries',
      description: 'Implement query optimization and indexing to reduce database response time by 40%',
      impact: 'high',
      effort: 'medium',
      estimatedSavings: 25000,
      priority: 1,
      status: 'pending',
    },
    {
      id: '2',
      type: 'scalability',
      title: 'Enable Redis Caching',
      description: 'Implement Redis caching layer to improve response times and reduce database load',
      impact: 'high',
      effort: 'low',
      estimatedSavings: 15000,
      priority: 2,
      status: 'in_progress',
    },
    {
      id: '3',
      type: 'cost',
      title: 'Optimize Auto-scaling Configuration',
      description: 'Adjust auto-scaling thresholds to reduce unnecessary instance scaling',
      impact: 'medium',
      effort: 'low',
      estimatedSavings: 8000,
      priority: 3,
      status: 'pending',
    },
    {
      id: '4',
      type: 'performance',
      title: 'Implement CDN',
      description: 'Deploy CDN to reduce latency and improve global performance',
      impact: 'high',
      effort: 'medium',
      estimatedSavings: 12000,
      priority: 4,
      status: 'pending',
    },
    {
      id: '5',
      type: 'security',
      title: 'Enable Rate Limiting',
      description: 'Implement rate limiting to prevent abuse and improve stability',
      impact: 'medium',
      effort: 'low',
      estimatedSavings: 5000,
      priority: 5,
      status: 'completed',
    },
  ];
}

export async function updateOptimizationRecommendation(
  recommendationId: string,
  action: string,
  adminId?: string,
): Promise<AdminOptimizationRecommendationMutation> {
  const recommendation = {
    id: recommendationId,
    action,
    updatedBy: adminId,
    updatedAt: new Date(),
  };

  await logPerformanceAudit({
    adminId: adminId || 'system',
    action: ADMIN_AUDIT_ACTIONS.OPTIMIZATION_RECOMMENDATION_UPDATE,
    resourceId: recommendationId,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.OPTIMIZATION_RECOMMENDATION,
    details: { recommendationId, action },
  });

  return recommendation;
}

export async function getPerformanceAlerts(
  filters: PerformanceAlertFilters = {},
): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'High CPU Usage',
      description: 'CPU usage has exceeded 80% for the last 5 minutes',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'medium',
      acknowledged: false,
      resolved: false,
    },
    {
      id: '2',
      type: 'error',
      title: 'Database Connection Pool Exhausted',
      description: 'Database connection pool is at 95% capacity',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: 'high',
      acknowledged: true,
      resolved: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Memory Usage High',
      description: 'Memory usage has reached 85% of available capacity',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      severity: 'medium',
      acknowledged: false,
      resolved: false,
    },
    {
      id: '4',
      type: 'info',
      title: 'Auto-scaling Triggered',
      description: 'Auto-scaling has added 2 new instances due to high load',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      severity: 'low',
      acknowledged: true,
      resolved: true,
    },
  ];

  let filteredAlerts = alerts;

  if (filters.severity && filters.severity !== 'all') {
    filteredAlerts = filteredAlerts.filter((alert) => alert.severity === filters.severity);
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'resolved') {
      filteredAlerts = filteredAlerts.filter((alert) => alert.resolved);
    } else if (filters.status === 'active') {
      filteredAlerts = filteredAlerts.filter((alert) => !alert.resolved);
    }
  }

  return filteredAlerts;
}

export async function updatePerformanceAlert(
  alertId: string,
  action: string,
  adminId?: string,
): Promise<AdminPerformanceAlertMutation> {
  const alert = {
    id: alertId,
    action,
    updatedBy: adminId,
    updatedAt: new Date(),
  };

  await logPerformanceAudit({
    adminId: adminId || 'system',
    action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_UPDATE,
    resourceId: alertId,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.PERFORMANCE_ALERT,
    details: { alertId, action },
  });

  return alert;
}

export async function getPerformanceAnalytics(): Promise<AdminPerformanceAnalyticsPayload> {
  return {
    trends: {
      cpu: [45, 52, 48, 55, 42, 58, 51, 47, 53, 49],
      memory: [65, 72, 68, 75, 62, 78, 71, 67, 73, 69],
      responseTime: [125, 118, 132, 115, 128, 110, 135, 120, 125, 118],
      throughput: [850, 920, 780, 950, 820, 980, 760, 890, 840, 910],
    },
    bottlenecks: [
      { type: 'database', description: 'Slow query execution', impact: 'high', frequency: 15 },
      { type: 'network', description: 'High latency connections', impact: 'medium', frequency: 8 },
      { type: 'memory', description: 'Memory leaks in application', impact: 'low', frequency: 3 },
    ],
    recommendations: [
      { type: 'immediate', title: 'Add database indexes', impact: 'high', effort: 'low' },
      { type: 'short-term', title: 'Implement connection pooling', impact: 'medium', effort: 'medium' },
      { type: 'long-term', title: 'Migrate to microservices', impact: 'high', effort: 'high' },
    ],
  };
}

export async function configurePerformanceAlert(
  alertConfig: Record<string, unknown>,
  adminId?: string,
): Promise<AdminPerformanceAlertConfigureResult> {
  const config = {
    id: `config_${Date.now()}`,
    ...alertConfig,
    createdBy: adminId,
    createdAt: new Date(),
  };

  await logPerformanceAudit({
    adminId: adminId || 'system',
    action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_CONFIGURE,
    resourceId: String(config.id),
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.PERFORMANCE_ALERT,
    details: {
      configId: config.id,
      alertType: alertConfig.type,
      thresholds: alertConfig.thresholds,
    },
  });

  return config;
}

export async function exportPerformanceData(filters: Record<string, unknown> = {}): Promise<string> {
  const metrics = await getPerformanceMetrics(filters);
  const alerts = await getPerformanceAlerts(filters);

  const csvHeaders = ['Metric', 'Value', 'Unit', 'Timestamp'];
  const csvRows: Array<Array<string | number>> = [];

  if (isAvailableMetrics(metrics)) {
    const memPct =
      metrics.memory?.total && metrics.memory?.used
        ? ((metrics.memory.used / metrics.memory.total) * 100).toFixed(2)
        : '0';
    csvRows.push(
      ['CPU Usage', metrics.cpu?.usage ?? 0, '%', new Date().toISOString()],
      ['Memory Usage', memPct, '%', new Date().toISOString()],
      ['Response Time', metrics.application?.responseTime ?? 0, 'ms', new Date().toISOString()],
      ['Throughput', metrics.application?.throughput ?? 0, 'req/s', new Date().toISOString()],
      ['Error Rate', metrics.application?.errorRate ?? 0, '%', new Date().toISOString()],
      ['Active Users', metrics.application?.activeUsers ?? 0, 'users', new Date().toISOString()],
      ['Database Connections', metrics.database?.connections ?? 0, 'connections', new Date().toISOString()],
      ['Cache Hit Rate', metrics.database?.cacheHitRate ?? 0, '%', new Date().toISOString()],
    );
  }

  void alerts;

  return [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}
