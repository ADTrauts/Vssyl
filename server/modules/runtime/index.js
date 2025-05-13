const { ModuleRuntime } = require('./module-runtime');
const { ModuleCommunication } = require('./module-communication');
const { ResourceManager } = require('./resource-manager');

class ModuleSystem {
  constructor(options = {}) {
    this.runtime = new ModuleRuntime(options.runtime);
    this.communication = new ModuleCommunication();
    this.resources = new ResourceManager(options.resources);

    // Set up event forwarding
    this.setupEventForwarding();
  }

  setupEventForwarding() {
    // Forward runtime events
    this.runtime.on('error', (error) => this.emit('error', { source: 'runtime', error }));
    this.runtime.on('moduleLoaded', (moduleId) => this.emit('moduleLoaded', moduleId));
    this.runtime.on('moduleUnloaded', (moduleId) => this.emit('moduleUnloaded', moduleId));

    // Forward communication events
    this.communication.on('error', (error) => this.emit('error', { source: 'communication', error }));
    this.communication.on('messagePublished', (message) => this.emit('messagePublished', message));

    // Forward resource events
    this.resources.on('error', (error) => this.emit('error', { source: 'resources', error }));
    this.resources.on('resourceLimitExceeded', (data) => this.emit('resourceLimitExceeded', data));
  }

  async initialize() {
    await this.runtime.initialize();
    this.emit('initialized');
  }

  async loadModule(moduleId) {
    const module = await this.runtime.loadModule(moduleId);
    this.communication.registerModule(moduleId, ['publish', 'subscribe']);
    this.resources.registerModule(moduleId);
    return module;
  }

  async unloadModule(moduleId) {
    await this.runtime.unloadModule(moduleId);
    this.communication.unregisterModule(moduleId);
    this.resources.unregisterModule(moduleId);
  }

  async reloadModule(moduleId) {
    await this.unloadModule(moduleId);
    await this.loadModule(moduleId);
  }

  getModuleStatus(moduleId) {
    return this.runtime.getModuleStatus(moduleId);
  }

  getAllModules() {
    return this.runtime.getAllModules();
  }

  async shutdown() {
    await this.runtime.shutdown();
    this.emit('shutdown');
  }
}

module.exports = {
  ModuleSystem,
  ModuleRuntime,
  ModuleCommunication,
  ResourceManager
}; 