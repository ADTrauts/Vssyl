'use client';

import { EventEmitter } from 'events';

export interface QueuedMessage {
  id: string;
  content: string;
  type: 'text' | 'file';
  conversationId: string;
  threadId?: string;
  file?: any;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  retryCount: number;
  timestamp: number;
  error?: string;
}

interface MessageQueueConfig {
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
  persistKey: string;
}

const DEFAULT_CONFIG: MessageQueueConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  maxQueueSize: 100,
  persistKey: 'message_queue',
};

export class MessageQueue extends EventEmitter {
  private config: MessageQueueConfig;
  private queue: Map<string, QueuedMessage>;
  private processingQueue: boolean;
  private retryTimeouts: Map<string, NodeJS.Timeout>;

  constructor(config: Partial<MessageQueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new Map();
    this.processingQueue = false;
    this.retryTimeouts = new Map();
    this.loadFromStorage();
  }

  async enqueue(message: Omit<QueuedMessage, 'status' | 'retryCount' | 'timestamp'>) {
    if (this.queue.size >= this.config.maxQueueSize) {
      throw new Error('Message queue is full');
    }

    const queuedMessage: QueuedMessage = {
      ...message,
      status: 'queued',
      retryCount: 0,
      timestamp: Date.now(),
    };

    this.queue.set(message.id, queuedMessage);
    this.saveToStorage();
    this.emit('message_queued', queuedMessage);

    if (!this.processingQueue) {
      this.processQueue();
    }

    return queuedMessage;
  }

  private async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    try {
      const messages = Array.from(this.queue.values())
        .filter((msg) => msg.status === 'queued' || msg.status === 'failed')
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const message of messages) {
        if (message.retryCount >= this.config.maxRetries) {
          this.handleMessageFailed(message.id, new Error('Max retries exceeded'));
          continue;
        }

        try {
          message.status = 'sending';
          this.emit('message_sending', message);
          
          // Attempt to send the message
          await this.sendMessage(message);
          
          this.handleMessageSent(message.id);
        } catch (error) {
          this.scheduleRetry(message);
        }
      }
    } finally {
      this.processingQueue = false;
      this.saveToStorage();
    }
  }

  private async sendMessage(message: QueuedMessage) {
    const endpoint = '/api/messages';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: message.id,
        content: message.content,
        type: message.type,
        conversationId: message.conversationId,
        threadId: message.threadId,
        file: message.file,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  private scheduleRetry(message: QueuedMessage) {
    const retryDelay = this.config.retryDelay * Math.pow(2, message.retryCount);
    message.retryCount++;
    message.status = 'failed';
    
    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(message.id);
      if (!this.processingQueue) {
        this.processQueue();
      }
    }, retryDelay);

    this.retryTimeouts.set(message.id, timeout);
    this.emit('message_retry_scheduled', { message, delay: retryDelay });
    this.saveToStorage();
  }

  private handleMessageSent(messageId: string) {
    const message = this.queue.get(messageId);
    if (message) {
      message.status = 'sent';
      this.emit('message_sent', message);
      this.queue.delete(messageId);
      this.saveToStorage();
    }
  }

  private handleMessageFailed(messageId: string, error: Error) {
    const message = this.queue.get(messageId);
    if (message) {
      message.status = 'failed';
      message.error = error.message;
      this.emit('message_failed', { message, error });
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.queue.values());
      localStorage.setItem(this.config.persistKey, JSON.stringify(data));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(this.config.persistKey);
        if (data) {
          const messages = JSON.parse(data) as QueuedMessage[];
          messages.forEach((msg) => this.queue.set(msg.id, msg));
        }
      } catch (error) {
        console.error('Failed to load message queue from storage:', error);
      }
    }
  }

  getQueuedMessages(): QueuedMessage[] {
    return Array.from(this.queue.values());
  }

  getMessageStatus(messageId: string): QueuedMessage['status'] | null {
    return this.queue.get(messageId)?.status || null;
  }

  clearQueue() {
    this.queue.clear();
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.saveToStorage();
    this.emit('queue_cleared');
  }

  cancelRetry(messageId: string) {
    const timeout = this.retryTimeouts.get(messageId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(messageId);
    }
  }
} 