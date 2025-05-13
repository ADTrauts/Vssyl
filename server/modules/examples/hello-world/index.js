class HelloWorldModule {
  constructor(moduleInstance) {
    this.moduleInstance = moduleInstance;
    this.config = moduleInstance.manifest.config;
  }

  async initialize() {
    console.log('HelloWorldModule: Initializing...');
    return true;
  }

  async start() {
    console.log('HelloWorldModule: Starting...');
    console.log(`Message: ${this.config.message}`);
    return true;
  }

  async stop() {
    console.log('HelloWorldModule: Stopping...');
    return true;
  }

  async cleanup() {
    console.log('HelloWorldModule: Cleaning up...');
    return true;
  }

  // Example method that can be called by other modules
  async getMessage() {
    return this.config.message;
  }
}

export default HelloWorldModule; 