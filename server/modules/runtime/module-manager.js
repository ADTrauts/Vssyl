import EventEmitter from 'events';
import ModuleLoader from './module-loader.js';

class ModuleManager extends EventEmitter {
  constructor() {
    super();
    this.loader = new ModuleLoader();
    this.modules = new Map();
  }

  async initialize() {
    try {
      // Load all modules
      const loadedModules = await this.loader.loadModules();
      
      // Initialize each module
      for (const [id, module] of loadedModules) {
        this.modules.set(id, module);
        
        // Set up event listeners
        module.on('started', () => this.emit('moduleStarted', id));
        module.on('stopped', () => this.emit('moduleStopped', id));
        module.on('error', (error) => this.emit('moduleError', id, error));
      }

      this.emit('initialized');
    } catch (error) {
      console.error('Error initializing module manager:', error);
      throw error;
    }
  }

  async startModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      await module.start();
      return module;
    } catch (error) {
      console.error(`Error starting module ${moduleId}:`, error);
      throw error;
    }
  }

  async stopModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      await module.stop();
      return module;
    } catch (error) {
      console.error(`Error stopping module ${moduleId}:`, error);
      throw error;
    }
  }

  async reloadModule(moduleId) {
    try {
      const newModule = await this.loader.reloadModule(moduleId);
      this.modules.set(moduleId, newModule);
      
      // Set up event listeners for the new module
      newModule.on('started', () => this.emit('moduleStarted', moduleId));
      newModule.on('stopped', () => this.emit('moduleStopped', moduleId));
      newModule.on('error', (error) => this.emit('moduleError', moduleId, error));
      
      return newModule;
    } catch (error) {
      console.error(`Error reloading module ${moduleId}:`, error);
      throw error;
    }
  }

  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  getAllModules() {
    return Array.from(this.modules.values());
  }

  getModuleStatus(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    return module.getStatus();
  }

  async broadcastEvent(eventName, data) {
    for (const module of this.modules.values()) {
      if (module.status === 'running') {
        try {
          await module.handleEvent(eventName, data);
        } catch (error) {
          console.error(`Error broadcasting event ${eventName} to module ${module.manifest.id}:`, error);
        }
      }
    }
  }

  async shutdown() {
    for (const [id, module] of this.modules) {
      if (module.status === 'running') {
        try {
          await module.stop();
        } catch (error) {
          console.error(`Error stopping module ${id} during shutdown:`, error);
        }
      }
    }
    this.emit('shutdown');
  }
}

export default ModuleManager; 