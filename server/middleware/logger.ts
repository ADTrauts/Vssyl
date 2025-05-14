import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger } from '../utils/logger';

// Extend Request type locally for custom properties
interface RequestWithExtras extends Request {
  id?: string;
  _startAt?: [number, number];
}

// Custom token for request body
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return JSON.stringify(req.body);
  }
  return '';
});

// Custom token for response body
morgan.token('response-body', (req: Request, res: Response) => {
  if (res.locals.responseBody) {
    return JSON.stringify(res.locals.responseBody);
  }
  return '';
});

// Custom token for request duration in milliseconds
morgan.token('response-time-ms', (req: Request) => {
  if (!(req as RequestWithExtras)._startAt) return '';
  const diff = process.hrtime((req as RequestWithExtras)._startAt!);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom token for user agent
morgan.token('user-agent', (req: Request) => {
  return req.get('user-agent') || '';
});

// Custom token for request ID
morgan.token('request-id', (req: Request) => {
  return (req as RequestWithExtras).id || '';
});

// Custom format for development environment
const devFormat = ':remote-addr - :method :url :status :response-time-ms ms - :res[content-length] - :user-agent';

// Custom format for production environment
const prodFormat = ':remote-addr - :method :url :status :response-time-ms ms - :res[content-length] - :user-agent - :request-id';

// Create Morgan middleware
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req: Request) => {
      // Skip logging for health check endpoints
      return req.path === '/health' || req.path === '/ping';
    },
  }
);

// Response body logger middleware
export const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  res.send = function (body: unknown) {
    res.locals.responseBody = body;
    return originalSend.call(this, body);
  };
  next();
};

// Error logger middleware
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    requestId: (req as RequestWithExtras).id,
  });
  next(err);
};

// Performance logger middleware
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1e3 + diff[1] * 1e-6; // Convert to milliseconds

    if (time > 1000) { // Log if request takes more than 1 second
      logger.warn('Slow request detected:', {
        path: req.path,
        method: req.method,
        duration: time.toFixed(2) + 'ms',
        userAgent: req.get('user-agent'),
        ip: req.ip,
        requestId: (req as RequestWithExtras).id,
      });
    }
  });

  next();
}; 