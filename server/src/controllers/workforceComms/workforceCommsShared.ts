import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/workforceCommsPermissions';

/** Authorized tenant from workforce comms middleware (must match communication rows). */
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseOptionalAudienceSpec(body: unknown): Record<string, unknown> | undefined {
  if (body === undefined) return undefined;
  if (!isRecord(body)) return undefined;
  const spec = body.audienceSpec;
  if (spec === undefined) return undefined;
  return isRecord(spec) ? spec : undefined;
}
