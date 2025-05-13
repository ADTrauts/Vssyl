const { VM } = require('vm2');
const EventEmitter = require('events');
const { BaseModule } = require('./base-module');
const { ModuleLoader } = require('./module-loader');

class ModuleRuntime extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      timeout: 5000,
      memoryLimit: 128,
      ...options
    };
    this.modules = new Map();
    this.moduleLoader = new ModuleLoader();
    this.vm = new VM({
      timeout: this.options.timeout,
      memoryLimit: this.options.memoryLimit,
      sandbox: {
        console: {
          log: (...args) => this.emit('log', 'info', args),
          error: (...args) => this.emit('log', 'error', args),
          warn: (...args) => this.emit('log', 'warn', args)
        }
      }
    });
  }

  async initialize() {
    try {
      await this.moduleLoader.loadModules();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async loadModule(moduleId) {
    try {
      const module = await this.moduleLoader.loadModule(moduleId);
      if (!(module instanceof BaseModule)) {
        throw new Error(`Module ${moduleId} must extend BaseModule`);
      }

      // Create sandboxed context for the module
      const sandbox = {
        module,
        require: this.createSandboxedRequire(),
        process: {
          env: { ...process.env },
          cwd: () => process.cwd()
        }
      };

      // Initialize module in sandbox
      await this.vm.runInNewContext(`
        module.initialize();
      `, sandbox);

      this.modules.set(moduleId, {
        instance: module,
        sandbox,
        status: 'running'
      });

      this.emit('moduleLoaded', moduleId);
      return module;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  createSandboxedRequire() {
    return (moduleName) => {
      // Only allow access to approved modules
      const allowedModules = ['events', 'util', 'path'];
      if (!allowedModules.includes(moduleName)) {
        throw new Error(`Access to module ${moduleName} is not allowed`);
      }
      return require(moduleName);
    };
  }

  async unloadModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      await this.vm.runInNewContext(`
        module.shutdown();
      `, module.sandbox);

      this.modules.delete(moduleId);
      this.emit('moduleUnloaded', moduleId);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async reloadModule(moduleId) {
    await this.unloadModule(moduleId);
    await this.loadModule(moduleId);
  }

  getModuleStatus(moduleId) {
    const module = this.modules.get(moduleId);
    return module ? module.status : 'not_loaded';
  }

  getAllModules() {
    return Array.from(this.modules.entries()).map(([id, { instance, status }]) => ({
      id,
      name: instance.name,
      version: instance.version,
      status
    }));
  }

  async shutdown() {
    for (const [moduleId] of this.modules) {
      await this.unloadModule(moduleId);
    }
    this.emit('shutdown');
  }
}

module.exports = { ModuleRuntime }; 