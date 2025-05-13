import EventEmitter from 'events';

class BaseModule extends EventEmitter {
  constructor(manifest) {
    super();
    this.manifest = manifest;
    this.status = 'stopped';
    this.registeredEvents = new Set();
    this.exposedMethods = new Set();
  }

  async initialize() {
    this.status = 'initializing';
    try {
      await this.onInitialize();
      this.status = 'initialized';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async start() {
    if (this.status === 'running') {
      throw new Error('Module is already running');
    }

    try {
      await this.onStart();
      this.status = 'running';
      this.emit('started');
    } catch (error) {
      console.error(`Error starting module ${this.manifest.id}:`, error);
      throw error;
    }
  }

  async stop() {
    if (this.status === 'stopped') {
      throw new Error('Module is already stopped');
    }

    try {
      await this.onStop();
      this.status = 'stopped';
      this.emit('stopped');
    } catch (error) {
      console.error(`Error stopping module ${this.manifest.id}:`, error);
      throw error;
    }
  }

  registerEvent(eventName) {
    this.registeredEvents.add(eventName);
  }

  registerMethod(methodName) {
    this.exposedMethods.add(methodName);
  }

  getRegisteredEvents() {
    return Array.from(this.registeredEvents);
  }

  getExposedMethods() {
    return Array.from(this.exposedMethods);
  }

  async handleEvent(eventName, data) {
    if (!this.registeredEvents.has(eventName)) {
      return;
    }

    try {
      await this.onEvent(eventName, data);
    } catch (error) {
      console.error(`Error handling event ${eventName} in module ${this.manifest.id}:`, error);
      throw error;
    }
  }

  async onEvent(eventName, data) {
    // To be implemented by derived classes
  }

  getStatus() {
    return {
      id: this.manifest.id,
      name: this.manifest.name,
      version: this.manifest.version,
      status: this.status,
      events: this.getRegisteredEvents(),
      methods: this.getExposedMethods()
    };
  }

  // Methods to be overridden by child classes
  async onInitialize() {}
  async onStart() {}
  async onStop() {}
}

export default BaseModule; 