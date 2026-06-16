import { Response, NextFunction } from 'express';
import { AuthenticatedRequest as BaseAuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { WORKFORCE_COMMS_MODULE_ID } from '../services/workforceServiceShared';

export interface AuthenticatedRequest extends BaseAuthenticatedRequest {
  businessId?: string;
}

/**
 * Middleware: workforce_comms module must be installed and enabled for the business.
 */
export const checkWorkforceCommsModuleInstalled = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const businessIdParam = req.query.businessId;
  const businessIdBody = req.body?.businessId;

  let businessId: string | undefined;
  if (businessIdParam) {
    if (typeof businessIdParam !== 'string') {
      res.status(400).json({ error: 'businessId query parameter must be a string' });
      return;
    }
    businessId = businessIdParam;
  } else if (businessIdBody) {
    if (typeof businessIdBody !== 'string') {
      res.status(400).json({ error: 'businessId body parameter must be a string' });
      return;
    }
    businessId = businessIdBody;
  }

  if (!businessId) {
    res.status(400).json({ message: 'Business ID is required' });
    return;
  }

  req.businessId = businessId;

  try {
    const installation = await prisma.businessModuleInstallation.findFirst({
      where: {
        businessId,
        moduleId: WORKFORCE_COMMS_MODULE_ID,
        enabled: true,
      },
    });

    if (!installation) {
      res.status(403).json({
        error: 'Workforce Communications module not installed',
        message: 'Please install the Workforce Communications module from the module marketplace',
        moduleId: WORKFORCE_COMMS_MODULE_ID,
      });
      return;
    }

    next();
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Workforce comms module installation check error', {
      operation: 'workforce_comms_module_check',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Module check failed' });
  }
};
