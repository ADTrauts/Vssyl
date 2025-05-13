const EventEmitter = require('events');
const { PrismaClient } = require('@prisma/client');
const { ModuleSystem } = require('../runtime');
const { SecurityPolicyManager } = require('../security/policy-manager');
const { ModuleMonitor } = require('../monitoring/monitor');

class MarketplaceService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.prisma = new PrismaClient();
    this.moduleSystem = new ModuleSystem(options.moduleSystem);
    this.securityManager = new SecurityPolicyManager();
    this.monitor = new ModuleMonitor(options.monitoring);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Forward module system events
    this.moduleSystem.on('error', (error) => this.emit('error', { source: 'moduleSystem', error }));
    this.moduleSystem.on('moduleLoaded', (moduleId) => this.emit('moduleLoaded', moduleId));
    this.moduleSystem.on('moduleUnloaded', (moduleId) => this.emit('moduleUnloaded', moduleId));

    // Forward security events
    this.securityManager.on('policyUpdated', (data) => this.emit('policyUpdated', data));
    this.securityManager.on('policyRemoved', (moduleId) => this.emit('policyRemoved', moduleId));

    // Forward monitoring events
    this.monitor.on('moduleError', (data) => this.emit('moduleError', data));
    this.monitor.on('moduleWarning', (data) => this.emit('moduleWarning', data));
  }

  async initialize() {
    await this.moduleSystem.initialize();
    this.emit('initialized');
  }

  async submitModule(moduleData, developerId) {
    try {
      // Validate module data
      const validationResult = await this.validateModuleSubmission(moduleData);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      // Create module submission
      const submission = await this.prisma.moduleSubmission.create({
        data: {
          ...moduleData,
          developerId,
          status: 'PENDING',
          submittedAt: new Date()
        }
      });

      this.emit('moduleSubmitted', { submissionId: submission.id, moduleId: moduleData.moduleId });
      return submission;
    } catch (error) {
      this.emit('error', { source: 'submitModule', error });
      throw error;
    }
  }

  async validateModuleSubmission(moduleData) {
    // Check for required fields
    const requiredFields = ['moduleId', 'name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!moduleData[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate moduleId format
    if (!/^[a-z0-9-]+$/.test(moduleData.moduleId)) {
      return { valid: false, error: 'Invalid moduleId format' };
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(moduleData.version)) {
      return { valid: false, error: 'Invalid version format' };
    }

    // Check for duplicate moduleId
    const existingModule = await this.prisma.moduleSubmission.findFirst({
      where: { moduleId: moduleData.moduleId }
    });

    if (existingModule) {
      return { valid: false, error: 'Module with this ID already exists' };
    }

    return { valid: true };
  }

  async approveModule(submissionId, reviewerId) {
    try {
      const submission = await this.prisma.moduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerId
        }
      });

      // Set up security policy
      this.securityManager.setPolicy(submission.moduleId, {
        allowFileSystem: false,
        allowNetwork: false,
        allowProcess: false,
        allowEnv: false
      });

      // Start monitoring
      this.monitor.monitorModule(submission.moduleId);

      this.emit('moduleApproved', { submissionId, moduleId: submission.moduleId });
      return submission;
    } catch (error) {
      this.emit('error', { source: 'approveModule', error });
      throw error;
    }
  }

  async rejectModule(submissionId, reviewerId, reason) {
    try {
      const submission = await this.prisma.moduleSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewerId,
          rejectionReason: reason
        }
      });

      this.emit('moduleRejected', { submissionId, moduleId: submission.moduleId, reason });
      return submission;
    } catch (error) {
      this.emit('error', { source: 'rejectModule', error });
      throw error;
    }
  }

  async getModuleDetails(moduleId) {
    try {
      const module = await this.prisma.moduleSubmission.findFirst({
        where: { moduleId, status: 'APPROVED' },
        include: {
          developer: true,
          reviewer: true
        }
      });

      if (!module) {
        throw new Error('Module not found');
      }

      const metrics = this.monitor.getModuleMetrics(moduleId);
      const health = this.monitor.getModuleHealth(moduleId);
      const policy = this.securityManager.getPolicy(moduleId);

      return {
        ...module,
        metrics,
        health,
        policy
      };
    } catch (error) {
      this.emit('error', { source: 'getModuleDetails', error });
      throw error;
    }
  }

  async searchModules(query) {
    try {
      const modules = await this.prisma.moduleSubmission.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { moduleId: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          developer: true
        }
      });

      return modules.map(module => ({
        ...module,
        health: this.monitor.getModuleHealth(module.moduleId)
      }));
    } catch (error) {
      this.emit('error', { source: 'searchModules', error });
      throw error;
    }
  }

  async getDeveloperModules(developerId) {
    try {
      return await this.prisma.moduleSubmission.findMany({
        where: { developerId },
        orderBy: { submittedAt: 'desc' }
      });
    } catch (error) {
      this.emit('error', { source: 'getDeveloperModules', error });
      throw error;
    }
  }

  async updateModule(moduleId, updateData) {
    try {
      const module = await this.prisma.moduleSubmission.update({
        where: { moduleId },
        data: updateData
      });

      this.emit('moduleUpdated', { moduleId, updateData });
      return module;
    } catch (error) {
      this.emit('error', { source: 'updateModule', error });
      throw error;
    }
  }

  async deleteModule(moduleId) {
    try {
      await this.prisma.moduleSubmission.delete({
        where: { moduleId }
      });

      this.securityManager.removePolicy(moduleId);
      this.monitor.stopMonitoring(moduleId);

      this.emit('moduleDeleted', moduleId);
    } catch (error) {
      this.emit('error', { source: 'deleteModule', error });
      throw error;
    }
  }
}

module.exports = { MarketplaceService }; 