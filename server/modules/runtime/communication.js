import { EventEmitter } from 'events';

class ModuleCommunication extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.methods = new Map();
    this.subscriptions = new Map();
  }

  // Register a method that can be called by other modules
  registerMethod(moduleId, methodName, method) {
    const moduleMethods = this.methods.get(moduleId) || new Map();
    moduleMethods.set(methodName, method);
    this.methods.set(moduleId, moduleMethods);
  }

  // Call a method on another module
  async callMethod(moduleId, methodName, ...args) {
    const moduleMethods = this.methods.get(moduleId);
    if (!moduleMethods) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const method = moduleMethods.get(methodName);
    if (!method) {
      throw new Error(`Method ${methodName} not found in module ${moduleId}`);
    }

    return method(...args);
  }

  // Subscribe to events from another module
  subscribe(moduleId, eventName, callback) {
    const moduleSubscriptions = this.subscriptions.get(moduleId) || new Map();
    const eventSubscriptions = moduleSubscriptions.get(eventName) || new Set();
    eventSubscriptions.add(callback);
    moduleSubscriptions.set(eventName, eventSubscriptions);
    this.subscriptions.set(moduleId, moduleSubscriptions);
  }

  // Unsubscribe from events
  unsubscribe(moduleId, eventName, callback) {
    const moduleSubscriptions = this.subscriptions.get(moduleId);
    if (!moduleSubscriptions) return;

    const eventSubscriptions = moduleSubscriptions.get(eventName);
    if (!eventSubscriptions) return;

    eventSubscriptions.delete(callback);
  }

  // Publish an event to subscribers
  publish(moduleId, eventName, ...args) {
    const moduleSubscriptions = this.subscriptions.get(moduleId);
    if (!moduleSubscriptions) return;

    const eventSubscriptions = moduleSubscriptions.get(eventName);
    if (!eventSubscriptions) return;

    for (const callback of eventSubscriptions) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${moduleId}.${eventName}:`, error);
      }
    }
  }

  // Create a communication channel between modules
  createChannel(channelId) {
    if (this.channels.has(channelId)) {
      throw new Error(`Channel ${channelId} already exists`);
    }

    const channel = new EventEmitter();
    this.channels.set(channelId, channel);
    return channel;
  }

  // Get a communication channel
  getChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    return channel;
  }

  // Remove a communication channel
  removeChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.removeAllListeners();
      this.channels.delete(channelId);
    }
  }

  // Clean up all communication resources for a module
  cleanupModule(moduleId) {
    // Remove all methods
    this.methods.delete(moduleId);

    // Remove all subscriptions
    this.subscriptions.delete(moduleId);

    // Remove all channel subscriptions
    for (const channel of this.channels.values()) {
      channel.removeAllListeners(moduleId);
    }
  }
}

export default ModuleCommunication; 