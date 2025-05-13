const EventEmitter = require('events');

class ModuleCommunication extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.permissions = new Map();
  }

  registerModule(moduleId, permissions = []) {
    this.permissions.set(moduleId, new Set(permissions));
    this.emit('moduleRegistered', moduleId);
  }

  unregisterModule(moduleId) {
    this.permissions.delete(moduleId);
    this.emit('moduleUnregistered', moduleId);
  }

  createChannel(channelName, creatorModuleId) {
    if (this.channels.has(channelName)) {
      throw new Error(`Channel ${channelName} already exists`);
    }

    this.channels.set(channelName, {
      creator: creatorModuleId,
      subscribers: new Set(),
      messages: []
    });

    this.emit('channelCreated', { channelName, creatorModuleId });
  }

  subscribeToChannel(moduleId, channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    channel.subscribers.add(moduleId);
    this.emit('moduleSubscribed', { moduleId, channelName });
  }

  unsubscribeFromChannel(moduleId, channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribers.delete(moduleId);
      this.emit('moduleUnsubscribed', { moduleId, channelName });
    }
  }

  publishMessage(moduleId, channelName, message) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    if (!channel.subscribers.has(moduleId) && channel.creator !== moduleId) {
      throw new Error(`Module ${moduleId} is not subscribed to channel ${channelName}`);
    }

    const permissions = this.permissions.get(moduleId);
    if (!permissions || !permissions.has('publish')) {
      throw new Error(`Module ${moduleId} does not have permission to publish`);
    }

    const messageData = {
      sender: moduleId,
      channel: channelName,
      content: message,
      timestamp: Date.now()
    };

    channel.messages.push(messageData);
    this.emit('messagePublished', messageData);

    // Notify subscribers
    for (const subscriber of channel.subscribers) {
      if (subscriber !== moduleId) {
        this.emit(`message:${subscriber}`, messageData);
      }
    }
  }

  getChannelMessages(channelName, moduleId) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    if (!channel.subscribers.has(moduleId) && channel.creator !== moduleId) {
      throw new Error(`Module ${moduleId} is not subscribed to channel ${channelName}`);
    }

    return channel.messages;
  }

  getModuleChannels(moduleId) {
    const channels = [];
    for (const [name, channel] of this.channels.entries()) {
      if (channel.subscribers.has(moduleId) || channel.creator === moduleId) {
        channels.push({
          name,
          creator: channel.creator,
          subscriberCount: channel.subscribers.size
        });
      }
    }
    return channels;
  }

  clearChannel(channelName, moduleId) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} does not exist`);
    }

    if (channel.creator !== moduleId) {
      throw new Error(`Only the channel creator can clear messages`);
    }

    channel.messages = [];
    this.emit('channelCleared', { channelName, moduleId });
  }
}

module.exports = { ModuleCommunication }; 