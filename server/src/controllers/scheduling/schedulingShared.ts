import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';

export const TIME_FIELD_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Authorized tenant from scheduling middleware (must match schedule/shift rows). */
export function requireAuthorizedBusinessId(
  req: AuthenticatedRequest,
  res: Response
): string | null {
  const bid = req.businessId;
  if (!bid || typeof bid !== 'string') {
    res.status(400).json({ error: 'businessId is required' });
    return null;
  }
  return bid;
}
