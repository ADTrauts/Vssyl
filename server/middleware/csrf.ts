import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

// CSRF token storage
const tokens = new Map<string, { token: string; expires: number }>();

// Generate a new CSRF token
const generateToken = (): string => {
  return randomBytes(32).toString('hex');
};

// Clean expired tokens
const cleanExpiredTokens = () => {
  const now = Date.now();
  for (const [key, value] of tokens.entries()) {
    if (value.expires < now) {
      tokens.delete(key);
    }
  }
};

// Schedule token cleanup
setInterval(cleanExpiredTokens, 1000 * 60 * 60); // Clean every hour

// CSRF token middleware
export const csrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Get session ID from cookie or header
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
    if (!sessionId) {
      return res.status(403).json({
        status: 'error',
        message: 'No session ID provided',
      });
    }

    // Get CSRF token from header
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken || typeof csrfToken !== 'string') {
      return res.status(403).json({
        status: 'error',
        message: 'No CSRF token provided',
      });
    }

    // Verify CSRF token
    const storedToken = tokens.get(sessionId);
    if (!storedToken || storedToken.token !== csrfToken) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid CSRF token',
      });
    }

    // Check if token has expired
    if (storedToken.expires < Date.now()) {
      tokens.delete(sessionId);
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token has expired',
      });
    }

    next();
  } catch (error) {
    logger.error('CSRF error:', error);
    next(error);
  }
};

// Generate and set CSRF token
export const setCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get session ID from cookie or header
    const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
    if (!sessionId) {
      return next();
    }

    // Generate new token
    const token = generateToken();
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store token
    tokens.set(sessionId, { token, expires });

    // Set token in response header
    res.setHeader('X-CSRF-Token', token);

    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    next(error);
  }
}; 