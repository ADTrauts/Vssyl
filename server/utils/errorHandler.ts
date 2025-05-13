import { Response } from 'express';
import { CustomError } from './errors';
import { ZodError } from 'zod';

export const handleError = (error: unknown, res: Response) => {
  console.error('Error:', error);

  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors,
      code: 'VALIDATION_ERROR',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  });
}; 