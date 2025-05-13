import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger';

/**
 * Middleware to generate and attach a unique request ID to each request
 * Uses nanoid for generating cryptographically strong unique IDs
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Generate a unique request ID
  const requestId = nanoid();

  // Attach the ID to the request object
  req.id = requestId;

  // Add the request ID to response headers for client-side tracking
  res.setHeader('X-Request-ID', requestId);

  // Log the start of the request with its ID
  logger.debug('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Add response listener to log request completion
  res.on('finish', () => {
    logger.debug('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: req._startAt ? process.hrtime(req._startAt)[0] * 1e3 + process.hrtime(req._startAt)[1] * 1e-6 : undefined,
    });
  });

  next();
}; 