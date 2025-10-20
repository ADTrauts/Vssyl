// Enhanced structured logging utility for frontend
// Integrates with backend logging system for centralized monitoring

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  userId?: string;
  operation?: string;
  context?: Record<string, unknown>;
  component?: string;
  page?: string;
  action?: string;
  businessId?: string;
  dashboardId?: string;
  module?: string;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  userAgent?: string;
  url?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  timestamp: string;
  service: 'vssyl-web';
  environment: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata): LogEntry {
    return {
      level,
      message,
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      timestamp: new Date().toISOString(),
      service: 'vssyl-web',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, metadata, timestamp } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        prefix, message, metadata
      );
    } else {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        prefix, message
      );
    }
  }

  private async sendToBackend(entry: LogEntry): Promise<void> {
    if (!this.isProduction) return;

    try {
      // Send structured logs to backend for centralized collection
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fallback to console if backend logging fails
      console.error('Failed to send log to backend:', error);
      this.logToConsole(entry);
    }
  }

  private async log(level: LogLevel, message: string, metadata?: LogMetadata): Promise<void> {
    const entry = this.formatLog(level, message, metadata);

    // Always log to console in development
    if (this.isDevelopment) {
      this.logToConsole(entry);
      return;
    }

    // In production, send to backend and also log to console
    await this.sendToBackend(entry);
    this.logToConsole(entry);
  }

  // Public logging methods
  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    if (this.isDevelopment) {
      await this.log('debug', message, metadata);
    }
  }

  async info(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('info', message, metadata);
  }

  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('warn', message, metadata);
  }

  async error(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('error', message, metadata);
  }

  // Convenience methods for common frontend operations
  async logUserAction(action: string, component?: string, metadata?: Omit<LogMetadata, 'operation'>): Promise<void> {
    await this.info(`User action: ${action}`, {
      operation: action,
      component,
      ...metadata
    });
  }

  async logPageView(page: string, userId?: string, metadata?: LogMetadata): Promise<void> {
    await this.info(`Page view: ${page}`, {
      operation: 'page_view',
      page,
      userId,
      ...metadata
    });
  }

  async logComponentError(component: string, error: Error, metadata?: LogMetadata): Promise<void> {
    await this.error(`Component error in ${component}`, {
      operation: 'component_error',
      component,
      error: {
        message: error.message,
        stack: error.stack
      },
      ...metadata
    });
  }

  async logApiCall(method: string, endpoint: string, duration?: number, statusCode?: number, metadata?: LogMetadata): Promise<void> {
    const level = statusCode && statusCode >= 400 ? 'warn' : 'info';
    await this.log(level, `API ${method} ${endpoint}`, {
      operation: 'api_call',
      method,
      endpoint,
      duration,
      statusCode,
      ...metadata
    });
  }

  async logBusinessAction(businessId: string, action: string, userId?: string, metadata?: LogMetadata): Promise<void> {
    await this.info(`Business action: ${action}`, {
      operation: 'business_action',
      businessId,
      action,
      userId,
      ...metadata
    });
  }

  async logModuleInteraction(module: string, action: string, dashboardId?: string, metadata?: LogMetadata): Promise<void> {
    await this.info(`Module interaction: ${module} - ${action}`, {
      operation: 'module_interaction',
      module,
      action,
      dashboardId,
      ...metadata
    });
  }

  async logPerformance(operation: string, duration: number, metadata?: LogMetadata): Promise<void> {
    await this.info(`Performance: ${operation} took ${duration}ms`, {
      operation: 'performance',
      duration,
      ...metadata
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogEntry }; 