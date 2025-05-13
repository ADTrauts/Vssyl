import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ModuleSandbox {
  constructor(permissions = {}) {
    this.permissions = permissions;
    this.context = this.createContext();
  }

  createContext() {
    const context = {
      // Basic utilities
      console: {
        log: (...args) => console.log(`[Module]`, ...args),
        error: (...args) => console.error(`[Module]`, ...args),
        warn: (...args) => console.warn(`[Module]`, ...args),
        info: (...args) => console.info(`[Module]`, ...args)
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      process: {
        env: {},
        platform: process.platform,
        arch: process.arch,
        cwd: () => process.cwd()
      },
      Buffer,
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
    };

    // Add permission-based APIs
    if (this.permissions.files) {
      context.fs = {
        readFile: async (filePath) => {
          const safePath = path.resolve(process.cwd(), filePath);
          return fs.readFile(safePath, 'utf8');
        },
        writeFile: async (filePath, content) => {
          const safePath = path.resolve(process.cwd(), filePath);
          return fs.writeFile(safePath, content);
        }
      };
    }

    if (this.permissions.network) {
      context.fetch = async (url, options) => {
        return fetch(url, options);
      };
    }

    return vm.createContext(context);
  }

  run(code) {
    try {
      return vm.runInContext(code, this.context);
    } catch (error) {
      throw new Error(`Sandbox execution error: ${error.message}`);
    }
  }

  evaluate(expression) {
    try {
      return vm.runInContext(expression, this.context);
    } catch (error) {
      throw new Error(`Sandbox evaluation error: ${error.message}`);
    }
  }
} 