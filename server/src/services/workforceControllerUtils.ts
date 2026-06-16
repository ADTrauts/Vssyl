import { Response } from 'express';
import { logger } from '../lib/logger';
import {
  WorkforceCommsValidationError,
  WorkforceCommsWorkflowError,
} from './workforceServiceShared';

export function mapWorkforceCommsServiceError(
  error: unknown,
  res: Response,
  operation: string
): boolean {
  if (error instanceof WorkforceCommsWorkflowError) {
    const body: Record<string, unknown> = { error: error.message };
    if (error instanceof WorkforceCommsValidationError && error.field) {
      body.field = error.field;
    }
    res.status(error.statusCode).json(body);
    return true;
  }

  const err = error instanceof Error ? error : new Error('Unknown error');
  logger.error(`Failed: ${operation}`, {
    operation,
    error: { message: err.message, stack: err.stack },
  });
  res.status(500).json({ error: `Failed: ${operation}` });
  return true;
}
