import { toast } from 'sonner';
import { 
  ApiError, 
  NetworkError, 
  AuthenticationError, 
  ValidationError, 
  RateLimitError,
  getErrorMessage,
  getErrorDetails
} from './errors';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  fallbackMessage?: string;
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  fallbackMessage: 'An unexpected error occurred'
};

export function handleApiError(error: unknown, options: ErrorHandlerOptions = DEFAULT_OPTIONS) {
  const { showToast, logToConsole, fallbackMessage } = { ...DEFAULT_OPTIONS, ...options };
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);

  // Log to console in development
  if (logToConsole && process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      message,
      details,
      error
    });
  }

  // Show toast for user-facing errors
  if (showToast) {
    if (error instanceof ValidationError) {
      // Show validation errors in a more user-friendly way
      const validationMessage = Object.entries(details.details || {})
        .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
        .join('\n');
      toast.error(validationMessage || message);
    } else if (error instanceof RateLimitError) {
      // Show rate limit errors with retry information
      toast.error(`${message}. Please try again in ${details.retryAfter} seconds.`);
    } else if (error instanceof AuthenticationError) {
      // Show auth errors and redirect to login
      toast.error(message);
      // You might want to redirect to login here
    } else if (error instanceof NetworkError) {
      // Show network errors with retry suggestion
      toast.error(`${message}. Please check your connection and try again.`);
    } else {
      // Show generic error message
      toast.error(message || fallbackMessage);
    }
  }

  return {
    message,
    details,
    error
  };
}

// Specialized error handlers for different contexts
export const errorHandlers = {
  // For form submissions
  form: (error: unknown) => {
    return handleApiError(error, {
      showToast: true,
      logToConsole: true,
      fallbackMessage: 'Failed to submit form'
    });
  },

  // For file operations
  file: (error: unknown) => {
    return handleApiError(error, {
      showToast: true,
      logToConsole: true,
      fallbackMessage: 'File operation failed'
    });
  },

  // For chat operations
  chat: (error: unknown) => {
    return handleApiError(error, {
      showToast: true,
      logToConsole: true,
      fallbackMessage: 'Chat operation failed'
    });
  },

  // For background operations
  background: (error: unknown) => {
    return handleApiError(error, {
      showToast: false, // Don't show toast for background operations
      logToConsole: true,
      fallbackMessage: 'Background operation failed'
    });
  },

  // For critical operations
  critical: (error: unknown) => {
    return handleApiError(error, {
      showToast: true,
      logToConsole: true,
      fallbackMessage: 'A critical error occurred'
    });
  }
}; 