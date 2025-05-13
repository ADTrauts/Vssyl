export * from './error';
export * from './validate';
export * from './sanitize';
export * from './csrf';
export * from './cors';
export * from './rateLimit';
export * from './logger';
export * from './requestId';

// Re-export specific middleware for convenience
import { validate, validateBody, validateQuery, validateParams } from './validate';
import { sanitize, csp, xssProtection, noSniff, frameGuard } from './sanitize';
import { csrfToken, setCsrfToken } from './csrf';
import { corsMiddleware as corsHandler, corsErrorHandler } from './cors';
import { rateLimit, cleanupRateLimit } from './rateLimit';
import { requestLogger, responseLogger, errorLogger, performanceLogger } from './logger';
import { requestId } from './requestId';
import { errorHandler } from './error';

export const securityMiddleware = [
  sanitize,
  csp,
  xssProtection,
  noSniff,
  frameGuard,
  csrfToken,
  corsHandler,
  rateLimit,
];

export const validationMiddleware = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};

export const csrfMiddleware = {
  csrfToken,
  setCsrfToken,
};

export const corsConfig = {
  middleware: corsHandler,
  errorHandler: corsErrorHandler,
};

export const rateLimitConfig = {
  middleware: rateLimit,
  cleanup: cleanupRateLimit,
};

export const loggingConfig = {
  request: requestLogger,
  response: responseLogger,
  error: errorLogger,
  performance: performanceLogger,
};

export const requestIdConfig = {
  middleware: requestId,
};

export { errorHandler }; 