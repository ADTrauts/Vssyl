'use client';

interface ErrorLogEntry {
  id: string;
  error: Error;
  context?: Record<string, any>;
  timestamp: number;
  handled: boolean;
}

interface ErrorLoggerConfig {
  maxEntries: number;
  persistKey: string;
  onError?: (entry: ErrorLogEntry) => void;
}

const DEFAULT_CONFIG: ErrorLoggerConfig = {
  maxEntries: 100,
  persistKey: 'error_log',
};

class ErrorLogger {
  private static instance: ErrorLogger;
  private config: ErrorLoggerConfig;
  private errors: Map<string, ErrorLogEntry>;

  private constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errors = new Map();
    this.loadFromStorage();
  }

  static getInstance(config?: Partial<ErrorLoggerConfig>): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(config);
    }
    return ErrorLogger.instance;
  }

  log(error: Error, context?: Record<string, any>): string {
    const id = crypto.randomUUID();
    const entry: ErrorLogEntry = {
      id,
      error,
      context,
      timestamp: Date.now(),
      handled: false,
    };

    if (this.errors.size >= this.config.maxEntries) {
      // Remove oldest entry
      const oldestKey = Array.from(this.errors.keys())[0];
      this.errors.delete(oldestKey);
    }

    this.errors.set(id, entry);
    this.saveToStorage();
    this.config.onError?.(entry);

    console.error('Error logged:', {
      message: error.message,
      stack: error.stack,
      context,
    });

    return id;
  }

  markAsHandled(id: string) {
    const entry = this.errors.get(id);
    if (entry) {
      entry.handled = true;
      this.errors.set(id, entry);
      this.saveToStorage();
    }
  }

  getError(id: string): ErrorLogEntry | undefined {
    return this.errors.get(id);
  }

  getAllErrors(): ErrorLogEntry[] {
    return Array.from(this.errors.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  getUnhandledErrors(): ErrorLogEntry[] {
    return this.getAllErrors().filter((entry) => !entry.handled);
  }

  clear() {
    this.errors.clear();
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.errors.entries());
      localStorage.setItem(this.config.persistKey, JSON.stringify(data));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(this.config.persistKey);
        if (data) {
          const entries = JSON.parse(data) as [string, ErrorLogEntry][];
          this.errors = new Map(entries);
        }
      } catch (error) {
        console.error('Failed to load error log from storage:', error);
      }
    }
  }
}

export const errorLogger = ErrorLogger.getInstance(); 