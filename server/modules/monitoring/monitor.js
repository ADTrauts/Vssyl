const EventEmitter = require('events');
const { createLogger, format, transports } = require('winston');

class ModuleMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      logLevel: 'info',
      metricsInterval: 60000, // 1 minute
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };

    this.logger = createLogger({
      level: this.options.logLevel,
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/module-error.log', level: 'error' }),
        new transports.File({ filename: 'logs/module-combined.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });

    this.metrics = new Map();
    this.setupMetricsCollection();
  }

  setupMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, this.options.metricsInterval);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
    this.emit('log', { level, message, meta });
  }

  recordMetric(moduleId, metricName, value) {
    if (!this.metrics.has(moduleId)) {
      this.metrics.set(moduleId, new Map());
    }

    const moduleMetrics = this.metrics.get(moduleId);
    if (!moduleMetrics.has(metricName)) {
      moduleMetrics.set(metricName, []);
    }

    const timestamp = Date.now();
    moduleMetrics.get(metricName).push({ value, timestamp });

    // Clean up old metrics
    this.cleanupOldMetrics(moduleId, metricName);
  }

  cleanupOldMetrics(moduleId, metricName) {
    const cutoff = Date.now() - this.options.retentionPeriod;
    const metrics = this.metrics.get(moduleId)?.get(metricName) || [];
    const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
    this.metrics.get(moduleId)?.set(metricName, filteredMetrics);
  }

  getMetrics(moduleId, metricName, timeRange = this.options.retentionPeriod) {
    const cutoff = Date.now() - timeRange;
    const metrics = this.metrics.get(moduleId)?.get(metricName) || [];
    return metrics.filter(m => m.timestamp > cutoff);
  }

  getModuleMetrics(moduleId) {
    const moduleMetrics = this.metrics.get(moduleId);
    if (!moduleMetrics) {
      return null;
    }

    const result = {};
    for (const [metricName, values] of moduleMetrics.entries()) {
      result[metricName] = values;
    }
    return result;
  }

  collectMetrics() {
    // Collect system-wide metrics
    const systemMetrics = {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime()
    };

    this.emit('systemMetrics', systemMetrics);
    this.log('info', 'System metrics collected', { metrics: systemMetrics });
  }

  monitorModule(moduleId) {
    this.log('info', `Started monitoring module ${moduleId}`);
    this.emit('moduleMonitoringStarted', moduleId);
  }

  stopMonitoring(moduleId) {
    this.log('info', `Stopped monitoring module ${moduleId}`);
    this.emit('moduleMonitoringStopped', moduleId);
  }

  recordError(moduleId, error) {
    this.log('error', `Module ${moduleId} error`, { error });
    this.emit('moduleError', { moduleId, error });
  }

  recordWarning(moduleId, warning) {
    this.log('warn', `Module ${moduleId} warning`, { warning });
    this.emit('moduleWarning', { moduleId, warning });
  }

  getModuleHealth(moduleId) {
    const metrics = this.getModuleMetrics(moduleId);
    if (!metrics) {
      return { status: 'unknown' };
    }

    // Calculate health based on metrics
    const errorCount = metrics.errors?.length || 0;
    const warningCount = metrics.warnings?.length || 0;
    const memoryUsage = metrics.memory?.slice(-1)[0]?.value || 0;

    let status = 'healthy';
    if (errorCount > 0) {
      status = 'error';
    } else if (warningCount > 0) {
      status = 'warning';
    } else if (memoryUsage > 80) { // 80% memory usage threshold
      status = 'warning';
    }

    return {
      status,
      metrics: {
        errorCount,
        warningCount,
        memoryUsage
      }
    };
  }
}

module.exports = { ModuleMonitor }; 