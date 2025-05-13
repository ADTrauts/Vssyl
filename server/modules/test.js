import ModuleLoader from './runtime/loader.js';
import ModuleLifecycle from './runtime/lifecycle.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testModuleSystem() {
  try {
    // Create module loader and lifecycle manager
    const loader = new ModuleLoader({
      basePath: path.join(__dirname, 'examples')
    });
    const lifecycle = new ModuleLifecycle();

    // Load the hello-world module
    console.log('Loading hello-world module...');
    const module = await loader.loadModule('hello-world');

    // Initialize the module
    console.log('Initializing module...');
    await lifecycle.initialize(module);

    // Start the module
    console.log('Starting module...');
    await lifecycle.start(module.manifest.id);

    // Get module state
    console.log('Module state:', lifecycle.getState(module.manifest.id));

    // Stop the module
    console.log('Stopping module...');
    await lifecycle.stop(module.manifest.id);

    // Unload the module
    console.log('Unloading module...');
    await loader.unloadModule(module.manifest.id);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testModuleSystem(); 