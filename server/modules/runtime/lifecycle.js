import { EventEmitter } from 'events';
import ModuleCommunication from './communication.js';

class ModuleLifecycle extends EventEmitter {
  constructor() {
    super();
    this.states = new Map();
    this.instances = new Map();
    this.communication = new ModuleCommunication();
  }

  async initialize(module) {
    try {
      this.states.set(module.manifest.id, {
        status: 'initializing',
        lastError: null,
        startTime: Date.now()
      });

      this.emit('module:initializing', module.manifest.id);

      // Load module dependencies
      await this.loadDependencies(module);

      // Initialize module state
      this.states.set(module.manifest.id, {
        status: 'initialized',
        lastError: null,
        startTime: Date.now()
      });

      // Store module instance
      this.instances.set(module.manifest.id, module);

      // Initialize module communication
      if (typeof module.initializeCommunication === 'function') {
        await module.initializeCommunication(this.communication);
      }

      this.emit('module:initialized', module.manifest.id);
    } catch (error) {
      this.states.set(module.manifest.id, {
        status: 'error',
        lastError: error.message,
        startTime: Date.now()
      });

      this.emit('module:error', module.manifest.id, error);
      throw error;
    }
  }

  async start(moduleId) {
    const module = this.instances.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      this.states.set(moduleId, {
        status: 'starting',
        lastError: null,
        startTime: Date.now()
      });

      this.emit('module:starting', moduleId);

      // Start module
      const mainModule = await import(module.path + '/' + module.manifest.main);
      const instance = new mainModule.default(module);
      if (typeof instance.start === 'function') {
        await instance.start();
      }

      this.states.set(moduleId, {
        status: 'running',
        lastError: null,
        startTime: Date.now()
      });

      this.emit('module:started', moduleId);
    } catch (error) {
      this.states.set(moduleId, {
        status: 'error',
        lastError: error.message,
        startTime: Date.now()
      });

      this.emit('module:error', moduleId, error);
      throw error;
    }
  }

  async stop(moduleId) {
    const module = this.instances.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      this.states.set(moduleId, {
        status: 'stopping',
        lastError: null,
        startTime: Date.now()
      });

      this.emit('module:stopping', moduleId);

      // Clean up module communication
      this.communication.cleanupModule(moduleId);

      // Stop module
      const mainModule = await import(module.path + '/' + module.manifest.main);
      const instance = new mainModule.default(module);
      if (typeof instance.stop === 'function') {
        await instance.stop();
      }

      this.states.set(moduleId, {
        status: 'stopped',
        lastError: null,
        startTime: Date.now()
      });

      this.emit('module:stopped', moduleId);
    } catch (error) {
      this.states.set(moduleId, {
        status: 'error',
        lastError: error.message,
        startTime: Date.now()
      });

      this.emit('module:error', moduleId, error);
      throw error;
    }
  }

  async loadDependencies(module) {
    const dependencies = module.manifest.dependencies || {};
    for (const [depId, version] of Object.entries(dependencies)) {
      // Check if dependency is loaded
      if (!this.states.has(depId)) {
        throw new Error(`Dependency ${depId} not found`);
      }

      const depState = this.states.get(depId);
      if (depState.status !== 'running') {
        throw new Error(`Dependency ${depId} is not running`);
      }
    }
  }

  getState(moduleId) {
    return this.states.get(moduleId);
  }

  getAllStates() {
    return Object.fromEntries(this.states);
  }
}

export default ModuleLifecycle; 