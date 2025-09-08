// Simple logging utility to manage debug logs
const isDevelopment = process.env.NODE_ENV === 'development';

// Log argument types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogArgument = string | number | boolean | object | null | undefined;

export const logger = {
  debug: (...args: LogArgument[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args: LogArgument[]) => {
    console.log(...args);
  },
  
  warn: (...args: LogArgument[]) => {
    console.warn(...args);
  },
  
  error: (...args: LogArgument[]) => {
    console.error(...args);
  }
}; 