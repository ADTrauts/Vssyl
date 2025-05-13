const EventEmitter = require('events');

class ResourceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxMemoryPerModule: 64, // MB
      maxCpuTimePerModule: 30, // seconds
      maxDiskSpacePerModule: 100, // MB
      ...options
    };
    this.resources = new Map();
    this.metrics = new Map();
  }

  registerModule(moduleId) {
    this.resources.set(moduleId, {
      memory: 0,
      cpuTime: 0,
      diskSpace: 0,
      lastUpdate: Date.now()
    });

    this.metrics.set(moduleId, {
      memoryHistory: [],
      cpuHistory: [],
      diskHistory: [],
      errors: 0,
      warnings: 0
    });

    this.emit('moduleRegistered', moduleId);
  }

  unregisterModule(moduleId) {
    this.resources.delete(moduleId);
    this.metrics.delete(moduleId);
    this.emit('moduleUnregistered', moduleId);
  }

  updateResourceUsage(moduleId, resourceType, amount) {
    const moduleResources = this.resources.get(moduleId);
    if (!moduleResources) {
      throw new Error(`Module ${moduleId} not registered`);
    }

    const limit = this.options[`max${resourceType}PerModule`];
    if (amount > limit) {
      this.emit('resourceLimitExceeded', {
        moduleId,
        resourceType,
        current: amount,
        limit
      });
      throw new Error(`${resourceType} limit exceeded for module ${moduleId}`);
    }

    moduleResources[resourceType.toLowerCase()] = amount;
    moduleResources.lastUpdate = Date.now();

    // Update metrics
    const metrics = this.metrics.get(moduleId);
    metrics[`${resourceType.toLowerCase()}History`].push({
      value: amount,
      timestamp: Date.now()
    });

    this.emit('resourceUpdated', {
      moduleId,
      resourceType,
      amount
    });
  }

  getResourceUsage(moduleId) {
    const resources = this.resources.get(moduleId);
    if (!resources) {
      throw new Error(`Module ${moduleId} not registered`);
    }

    return {
      ...resources,
      limits: {
        memory: this.options.maxMemoryPerModule,
        cpuTime: this.options.maxCpuTimePerModule,
        diskSpace: this.options.maxDiskSpacePerModule
      }
    };
  }

  getModuleMetrics(moduleId) {
    const metrics = this.metrics.get(moduleId);
    if (!metrics) {
      throw new Error(`Module ${moduleId} not registered`);
    }

    return {
      ...metrics,
      lastUpdate: this.resources.get(moduleId).lastUpdate
    };
  }

  recordError(moduleId) {
    const metrics = this.metrics.get(moduleId);
    if (metrics) {
      metrics.errors++;
      this.emit('errorRecorded', { moduleId, errorCount: metrics.errors });
    }
  }

  recordWarning(moduleId) {
    const metrics = this.metrics.get(moduleId);
    if (metrics) {
      metrics.warnings++;
      this.emit('warningRecorded', { moduleId, warningCount: metrics.warnings });
    }
  }

  cleanupOldMetrics(age = 24 * 60 * 60 * 1000) { // Default: 24 hours
    const cutoff = Date.now() - age;
    for (const [moduleId, metrics] of this.metrics.entries()) {
      metrics.memoryHistory = metrics.memoryHistory.filter(m => m.timestamp > cutoff);
      metrics.cpuHistory = metrics.cpuHistory.filter(m => m.timestamp > cutoff);
      metrics.diskHistory = metrics.diskHistory.filter(m => m.timestamp > cutoff);
    }
    this.emit('metricsCleaned', { cutoff });
  }

  getSystemMetrics() {
    const metrics = {
      totalModules: this.resources.size,
      totalMemory: 0,
      totalCpuTime: 0,
      totalDiskSpace: 0,
      errorCount: 0,
      warningCount: 0
    };

    for (const [moduleId, resources] of this.resources.entries()) {
      metrics.totalMemory += resources.memory;
      metrics.totalCpuTime += resources.cpuTime;
      metrics.totalDiskSpace += resources.diskSpace;
    }

    for (const moduleMetrics of this.metrics.values()) {
      metrics.errorCount += moduleMetrics.errors;
      metrics.warningCount += moduleMetrics.warnings;
    }

    return metrics;
  }
}

module.exports = { ResourceManager }; 