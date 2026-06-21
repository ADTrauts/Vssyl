import { Request, Response, NextFunction } from 'express';

const DEPRECATION_MESSAGE =
  'The /api/payment API is deprecated. Use /api/billing for subscription lifecycle operations.';

/**
 * Marks legacy /api/payment routes as deprecated while preserving backward compatibility.
 */
export function paymentApiDeprecation(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', '2027-06-01');
  res.setHeader('Link', '</api/billing>; rel="successor-version"');
  res.setHeader('X-API-Deprecation-Notice', DEPRECATION_MESSAGE);
  next();
}
