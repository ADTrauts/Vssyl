import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from '../config/env';

// Parse CORS origin from environment variable
const parseCorsOrigin = (origin: string | string[]): string | string[] | boolean => {
  if (origin === '*') return '*';
  if (Array.isArray(origin)) return origin;
  return origin.split(',').map(o => o.trim());
};

// CORS options
const corsOptions: cors.CorsOptions = {
  origin: parseCorsOrigin(env.CORS_ORIGIN),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'X-Session-ID',
  ],
  exposedHeaders: ['X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

// CORS error handler
export const corsErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'CORSError') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS error: Not allowed by CORS policy',
    });
  }
  next(err);
}; 