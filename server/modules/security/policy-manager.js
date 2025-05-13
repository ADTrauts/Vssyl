const EventEmitter = require('events');

class SecurityPolicyManager extends EventEmitter {
  constructor() {
    super();
    this.policies = new Map();
    this.defaultPolicy = {
      allowFileSystem: false,
      allowNetwork: false,
      allowProcess: false,
      allowEnv: false,
      maxMemory: 64, // MB
      maxCpuTime: 30, // seconds
      allowedModules: ['events', 'util', 'path'],
      allowedAPIs: []
    };
  }

  setPolicy(moduleId, policy) {
    // Validate policy
    this.validatePolicy(policy);

    // Merge with default policy
    const mergedPolicy = {
      ...this.defaultPolicy,
      ...policy
    };

    this.policies.set(moduleId, mergedPolicy);
    this.emit('policyUpdated', { moduleId, policy: mergedPolicy });
  }

  getPolicy(moduleId) {
    return this.policies.get(moduleId) || this.defaultPolicy;
  }

  removePolicy(moduleId) {
    this.policies.delete(moduleId);
    this.emit('policyRemoved', moduleId);
  }

  validatePolicy(policy) {
    const validKeys = Object.keys(this.defaultPolicy);
    const invalidKeys = Object.keys(policy).filter(key => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid policy keys: ${invalidKeys.join(', ')}`);
    }

    // Validate memory limit
    if (policy.maxMemory !== undefined && (typeof policy.maxMemory !== 'number' || policy.maxMemory <= 0)) {
      throw new Error('maxMemory must be a positive number');
    }

    // Validate CPU time limit
    if (policy.maxCpuTime !== undefined && (typeof policy.maxCpuTime !== 'number' || policy.maxCpuTime <= 0)) {
      throw new Error('maxCpuTime must be a positive number');
    }

    // Validate allowed modules
    if (policy.allowedModules !== undefined && !Array.isArray(policy.allowedModules)) {
      throw new Error('allowedModules must be an array');
    }

    // Validate allowed APIs
    if (policy.allowedAPIs !== undefined && !Array.isArray(policy.allowedAPIs)) {
      throw new Error('allowedAPIs must be an array');
    }

    // Validate boolean flags
    const booleanFlags = ['allowFileSystem', 'allowNetwork', 'allowProcess', 'allowEnv'];
    for (const flag of booleanFlags) {
      if (policy[flag] !== undefined && typeof policy[flag] !== 'boolean') {
        throw new Error(`${flag} must be a boolean`);
      }
    }
  }

  checkPermission(moduleId, permission) {
    const policy = this.getPolicy(moduleId);
    
    switch (permission) {
      case 'fileSystem':
        return policy.allowFileSystem;
      case 'network':
        return policy.allowNetwork;
      case 'process':
        return policy.allowProcess;
      case 'env':
        return policy.allowEnv;
      default:
        return false;
    }
  }

  isModuleAllowed(moduleId, moduleName) {
    const policy = this.getPolicy(moduleId);
    return policy.allowedModules.includes(moduleName);
  }

  isAPIAllowed(moduleId, apiName) {
    const policy = this.getPolicy(moduleId);
    return policy.allowedAPIs.includes(apiName);
  }

  getResourceLimits(moduleId) {
    const policy = this.getPolicy(moduleId);
    return {
      maxMemory: policy.maxMemory,
      maxCpuTime: policy.maxCpuTime
    };
  }
}

module.exports = { SecurityPolicyManager }; 