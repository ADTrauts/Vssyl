import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ModuleManifest from '../types/manifest.js';
import { ModuleSandbox } from './sandbox.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ModuleLoader {
  constructor(options = {}) {
    this.modules = new Map();
    this.basePath = options.basePath || path.join(process.cwd(), 'modules');
  }

  async loadModule(modulePath) {
    try {
      // Read and parse manifest
      const manifestPath = path.join(this.basePath, modulePath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = new ModuleManifest(JSON.parse(manifestContent));

      // Check dependencies
      await this.checkDependencies(manifest);

      // Create module instance
      const moduleInstance = {
        manifest,
        path: path.join(this.basePath, modulePath),
        state: {},
        sandbox: new ModuleSandbox(manifest.permissions)
      };

      // Load main module file
      const mainPath = path.join(this.basePath, modulePath, manifest.main);
      const mainModule = await import(mainPath);

      // Initialize module
      if (typeof mainModule.default.initialize === 'function') {
        await mainModule.default.initialize(moduleInstance);
      }

      // Store module instance
      this.modules.set(manifest.id, moduleInstance);

      return moduleInstance;
    } catch (error) {
      throw new Error(`Failed to load module: ${error.message}`);
    }
  }

  async unloadModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      // Call cleanup if available
      const mainPath = path.join(module.path, module.manifest.main);
      const mainModule = await import(mainPath);
      if (typeof mainModule.default.cleanup === 'function') {
        await mainModule.default.cleanup(module);
      }

      // Remove module instance
      this.modules.delete(moduleId);
    } catch (error) {
      throw new Error(`Failed to unload module: ${error.message}`);
    }
  }

  async checkDependencies(manifest) {
    for (const [depId, version] of Object.entries(manifest.dependencies)) {
      const depModule = this.modules.get(depId);
      if (!depModule) {
        throw new Error(`Dependency ${depId} not found`);
      }
      if (depModule.manifest.version !== version) {
        throw new Error(`Dependency ${depId} version mismatch: expected ${version}, got ${depModule.manifest.version}`);
      }
    }
  }

  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  listModules() {
    return Array.from(this.modules.values()).map(module => module.manifest);
  }
}

export default ModuleLoader; 