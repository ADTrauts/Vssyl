import { PrismaClient } from '@prisma/client';

export interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  responseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  memoryUsage: number; // MB
  cpuUsage: number; // percentage
  databaseQueries: number;
  cacheHitRate: number; // percentage
  activeConnections: number;
  queueLength: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  metrics: {
    responseTime: 'good' | 'warning' | 'critical';
    throughput: 'good' | 'warning' | 'critical';
    errorRate: 'good' | 'warning' | 'critical';
    memoryUsage: 'good' | 'warning' | 'critical';
    cpuUsage: 'good' | 'warning' | 'critical';
  };
  recommendations: string[];
  lastUpdated: Date;
}

export class PerformanceMonitor {
  private prisma: PrismaClient;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    responseTime: { warning: 1000, critical: 3000 }, // ms
    throughput: { warning: 10, critical: 5 }, // req/s
    errorRate: { warning: 5, critical: 10 }, // %
    memoryUsage: { warning: 512, critical: 1024 }, // MB
    cpuUsage: { warning: 70, critical: 90 }, // %
    databaseQueries: { warning: 100, critical: 200 }, // per minute
    cacheHitRate: { warning: 80, critical: 60 }, // %
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetrics, 'id' | 'timestamp'>): void {
    const metric: PerformanceMetrics = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...metrics
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Get performance metrics for a time range
   */
  getMetricsForRange(startTime: Date, endTime: Date): PerformanceMetrics[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(): {
    responseTime: 'improving' | 'degrading' | 'stable';
    throughput: 'improving' | 'degrading' | 'stable';
    errorRate: 'improving' | 'degrading' | 'stable';
  } {
    if (this.metrics.length < 10) {
      return {
        responseTime: 'stable',
        throughput: 'stable',
        errorRate: 'stable'
      };
    }

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);

    const avgRecent = {
      responseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      throughput: recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length
    };

    const avgOlder = {
      responseTime: older.reduce((sum, m) => sum + m.responseTime, 0) / older.length,
      throughput: older.reduce((sum, m) => sum + m.throughput, 0) / older.length,
      errorRate: older.reduce((sum, m) => sum + m.errorRate, 0) / older.length
    };

    return {
      responseTime: this.getTrend(avgRecent.responseTime, avgOlder.responseTime, 0.1),
      throughput: this.getTrend(avgRecent.throughput, avgOlder.throughput, 0.1),
      errorRate: this.getTrend(avgOlder.errorRate, avgRecent.errorRate, 0.1) // Lower is better
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        overall: 'healthy',
        metrics: {
          responseTime: 'good',
          throughput: 'good',
          errorRate: 'good',
          memoryUsage: 'good',
          cpuUsage: 'good'
        },
        recommendations: ['System monitoring is starting up'],
        lastUpdated: new Date()
      };
    }

    const metrics = {
      responseTime: this.getMetricStatus(current.responseTime, this.thresholds.responseTime),
      throughput: this.getMetricStatus(current.throughput, this.thresholds.throughput),
      errorRate: this.getMetricStatus(current.errorRate, this.thresholds.errorRate),
      memoryUsage: this.getMetricStatus(current.memoryUsage, this.thresholds.memoryUsage),
      cpuUsage: this.getMetricStatus(current.cpuUsage, this.thresholds.cpuUsage)
    };

    const overall = this.calculateOverallHealth(metrics);
    const recommendations = this.generateRecommendations(metrics, current);

    return {
      overall,
      metrics,
      recommendations,
      lastUpdated: new Date()
    };
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve a performance alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get performance summary for admin dashboard
   */
  getPerformanceSummary(): {
    currentMetrics: PerformanceMetrics | null;
    trends: any;
    health: SystemHealth;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const currentMetrics = this.getCurrentMetrics();
    const trends = this.getPerformanceTrends();
    const health = this.getSystemHealth();
    const alerts = this.getActiveAlerts();
    const recommendations = this.generateOverallRecommendations(health, trends);

    return {
      currentMetrics,
      trends,
      health,
      alerts,
      recommendations
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(startTime: Date, endTime: Date): PerformanceMetrics[] {
    return this.getMetricsForRange(startTime, endTime);
  }

  /**
   * Clear old performance data
   */
  clearOldData(olderThanDays: number): void {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  // Private helper methods
  private checkPerformanceAlerts(metric: PerformanceMetrics): void {
    // Check response time
    if (metric.responseTime > this.thresholds.responseTime.critical) {
      this.createAlert('critical', 'responseTime', metric.responseTime, this.thresholds.responseTime.critical, 
        `Response time is critically high: ${metric.responseTime}ms`);
    } else if (metric.responseTime > this.thresholds.responseTime.warning) {
      this.createAlert('warning', 'responseTime', metric.responseTime, this.thresholds.responseTime.warning,
        `Response time is above warning threshold: ${metric.responseTime}ms`);
    }

    // Check error rate
    if (metric.errorRate > this.thresholds.errorRate.critical) {
      this.createAlert('critical', 'errorRate', metric.errorRate, this.thresholds.errorRate.critical,
        `Error rate is critically high: ${metric.errorRate}%`);
    } else if (metric.errorRate > this.thresholds.errorRate.warning) {
      this.createAlert('warning', 'errorRate', metric.errorRate, this.thresholds.errorRate.warning,
        `Error rate is above warning threshold: ${metric.errorRate}%`);
    }

    // Check memory usage
    if (metric.memoryUsage > this.thresholds.memoryUsage.critical) {
      this.createAlert('critical', 'memoryUsage', metric.memoryUsage, this.thresholds.memoryUsage.critical,
        `Memory usage is critically high: ${metric.memoryUsage}MB`);
    } else if (metric.memoryUsage > this.thresholds.memoryUsage.warning) {
      this.createAlert('warning', 'memoryUsage', metric.memoryUsage, this.thresholds.memoryUsage.warning,
        `Memory usage is above warning threshold: ${metric.memoryUsage}MB`);
    }

    // Check CPU usage
    if (metric.cpuUsage > this.thresholds.cpuUsage.critical) {
      this.createAlert('critical', 'cpuUsage', metric.cpuUsage, this.thresholds.cpuUsage.critical,
        `CPU usage is critically high: ${metric.cpuUsage}%`);
    } else if (metric.cpuUsage > this.thresholds.cpuUsage.warning) {
      this.createAlert('warning', 'cpuUsage', metric.cpuUsage, this.thresholds.cpuUsage.warning,
        `CPU usage is above warning threshold: ${metric.cpuUsage}%`);
    }
  }

  private createAlert(type: 'warning' | 'critical' | 'info', metric: string, currentValue: number, threshold: number, message: string): void {
    // Check if we already have an active alert for this metric
    const existingAlert = this.alerts.find(a => a.metric === metric && !a.resolved);
    if (existingAlert) {
      // Update existing alert if it's more severe
      if (type === 'critical' && existingAlert.type !== 'critical') {
        existingAlert.type = 'critical';
        existingAlert.message = message;
        existingAlert.timestamp = new Date();
      }
      return;
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    
    // Log critical alerts immediately
    if (type === 'critical') {
      console.error(`🚨 CRITICAL PERFORMANCE ALERT: ${message}`);
    } else if (type === 'warning') {
      console.warn(`⚠️ PERFORMANCE WARNING: ${message}`);
    }
  }

  private getTrend(current: number, previous: number, threshold: number): 'improving' | 'degrading' | 'stable' {
    const change = Math.abs(current - previous) / previous;
    if (change < threshold) return 'stable';
    return current > previous ? 'degrading' : 'improving';
  }

  private getMetricStatus(value: number, threshold: { warning: number; critical: number }): 'good' | 'warning' | 'critical' {
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'good';
  }

  private calculateOverallHealth(metrics: any): 'healthy' | 'degraded' | 'critical' {
    const criticalCount = Object.values(metrics).filter(status => status === 'critical').length;
    const warningCount = Object.values(metrics).filter(status => status === 'warning').length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'degraded';
    return 'healthy';
  }

  private generateRecommendations(metrics: any, current: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.responseTime === 'critical') {
      recommendations.push('Optimize database queries and implement caching');
      recommendations.push('Consider scaling up server resources');
    } else if (metrics.responseTime === 'warning') {
      recommendations.push('Monitor response time trends and optimize slow endpoints');
    }

    if (metrics.errorRate === 'critical') {
      recommendations.push('Investigate error sources and implement error handling');
      recommendations.push('Check system logs for root causes');
    } else if (metrics.errorRate === 'warning') {
      recommendations.push('Review error patterns and improve error handling');
    }

    if (metrics.memoryUsage === 'critical') {
      recommendations.push('Investigate memory leaks and optimize memory usage');
      recommendations.push('Consider increasing server memory or implementing garbage collection');
    } else if (metrics.memoryUsage === 'warning') {
      recommendations.push('Monitor memory usage patterns and optimize resource allocation');
    }

    if (metrics.cpuUsage === 'critical') {
      recommendations.push('Identify CPU-intensive operations and optimize them');
      recommendations.push('Consider load balancing or scaling horizontally');
    } else if (metrics.cpuUsage === 'warning') {
      recommendations.push('Monitor CPU usage patterns and optimize resource-intensive tasks');
    }

    return recommendations;
  }

  private generateOverallRecommendations(health: SystemHealth, trends: any): string[] {
    const recommendations: string[] = [];

    if (health.overall === 'critical') {
      recommendations.push('Immediate action required: System performance is critically degraded');
      recommendations.push('Review all active alerts and implement emergency optimizations');
    } else if (health.overall === 'degraded') {
      recommendations.push('System performance needs attention: Review warnings and implement optimizations');
    }

    if (trends.responseTime === 'degrading') {
      recommendations.push('Response time is trending upward - investigate performance bottlenecks');
    }

    if (trends.errorRate === 'degrading') {
      recommendations.push('Error rate is increasing - review error handling and system stability');
    }

    if (trends.throughput === 'degrading') {
      recommendations.push('System throughput is decreasing - check for resource constraints');
    }

    return recommendations;
  }
}
