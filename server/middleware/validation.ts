import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AnyZodObject, ZodError } from 'zod';

export const validateActivityVisualization = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeRange } = req.query;
    
    if (timeRange && !['day', 'week', 'month'].includes(timeRange as string)) {
      return res.status(400).json({
        error: 'Invalid timeRange. Must be one of: day, week, month'
      });
    }

    next();
  } catch (error) {
    logger.error('Validation error in activity visualization:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
};

export const validateActivityExport = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { format, timeRange, startDate, endDate } = req.body;

    if (!format || !['csv', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format. Must be one of: csv, json, pdf'
      });
    }

    if (timeRange && !['day', 'week', 'month'].includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid timeRange. Must be one of: day, week, month'
      });
    }

    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        error: 'Invalid startDate format'
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        error: 'Invalid endDate format'
      });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: 'startDate must be before endDate'
      });
    }

    next();
  } catch (error) {
    logger.error('Validation error in activity export:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
};

export const validateScheduledExport = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { frequency, format, timeOfDay } = req.body;

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        error: 'Invalid frequency. Must be one of: daily, weekly, monthly'
      });
    }

    if (!format || !['csv', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format. Must be one of: csv, json, pdf'
      });
    }

    if (!timeOfDay || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeOfDay)) {
      return res.status(400).json({
        error: 'Invalid timeOfDay format. Must be in HH:mm format'
      });
    }

    next();
  } catch (error) {
    logger.error('Validation error in scheduled export:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
};

export const validateThreadRecommendation = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    
    if (limit) {
      const parsedLimit = parseInt(limit as string);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
        return res.status(400).json({
          error: 'Invalid limit. Must be a number between 1 and 20'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Validation error in thread recommendation:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
};

export const validateRequest = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(500).json({ message: 'Internal server error during validation' });
  }
};

export const validateBody = (schema: AnyZodObject) => validateRequest(schema);
export const validateQuery = (schema: AnyZodObject) => validateRequest(schema);
export const validateParams = (schema: AnyZodObject) => validateRequest(schema); 