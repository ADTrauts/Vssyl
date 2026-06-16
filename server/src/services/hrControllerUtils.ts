import { Response } from 'express';
import { logger } from '../lib/logger';
import { HRTrashError } from './hrTrashService';
import { FieldValidationError, HRWorkflowError } from './hrServiceShared';

export function mapHrServiceError(
  error: unknown,
  res: Response,
  operation: string
): boolean {
  if (error instanceof HRWorkflowError) {
    res.status(error.statusCode).json({ error: error.message });
    return true;
  }

  if (error instanceof FieldValidationError) {
    res.status(400).json({
      error: error.message,
      field: error.field,
      details: error.details,
    });
    return true;
  }

  if (error instanceof HRTrashError) {
    if (error.code === 'not_found') {
      res.status(404).json({ error: 'Resource not found' });
      return true;
    }
    if (error.code === 'forbidden') {
      res.status(403).json({ error: 'Access denied' });
      return true;
    }
  }

  const err = error instanceof Error ? error : new Error('Unknown error');
  logger.error(`Failed: ${operation}`, {
    operation,
    error: { message: err.message, stack: err.stack },
  });
  res.status(500).json({ error: `Failed: ${operation}` });
  return true;
}
