import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import BaseModule from './base-module.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ModuleLoader {
  constructor() {
    this.modulesPath = path.join(__dirname, '..', 'modules');
    this.loadedModules = new Map();
  }

  async loadModules() {
    try {
      const moduleDirs = await fs.readdir(this.modulesPath, { withFileTypes: true });
      
      for (const dir of moduleDirs) {
        if (dir.isDirectory()) {
          await this.loadModule(dir.name);
        }
      }

      return this.loadedModules;
    } catch (error) {
      console.error('Error loading modules:', error);
      throw error;
    }
  }

  async loadModule(moduleName) {
    try {
      const modulePath = path.join(this.modulesPath, moduleName);
      const manifestPath = path.join(modulePath, 'manifest.json');
      const mainPath = path.join(modulePath, 'index.js');

      // Load manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Validate manifest
      this.validateManifest(manifest);

      // Load module
      const moduleClass = (await import(mainPath)).default;
      
      if (!(moduleClass.prototype instanceof BaseModule)) {
        throw new Error(`Module ${moduleName} does not extend BaseModule`);
      }

      // Create instance
      const moduleInstance = new moduleClass(manifest);
      this.loadedModules.set(manifest.id, moduleInstance);

      return moduleInstance;
    } catch (error) {
      console.error(`Error loading module ${moduleName}:`, error);
      throw error;
    }
  }

  validateManifest(manifest) {
    const requiredFields = ['id', 'name', 'version', 'description'];
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field in manifest: ${field}`);
      }
    }

    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Module ID must contain only lowercase letters, numbers, and hyphens');
    }

    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Version must be in semantic versioning format (e.g., 1.0.0)');
    }
  }

  getModule(moduleId) {
    return this.loadedModules.get(moduleId);
  }

  getAllModules() {
    return Array.from(this.loadedModules.values());
  }

  async reloadModule(moduleId) {
    const module = this.loadedModules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Stop the module if it's running
    if (module.status === 'running') {
      await module.stop();
    }

    // Remove from loaded modules
    this.loadedModules.delete(moduleId);

    // Reload the module
    return this.loadModule(module.manifest.id);
  }
}

export default ModuleLoader; 